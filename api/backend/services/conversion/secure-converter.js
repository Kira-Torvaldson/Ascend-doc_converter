'use strict'

/**
 * COMPLETE SECURE CONVERSION ENGINE
 * 
 * This unified module implements:
 * - Secure confirmation token system
 * - Complete security layer for file conversions
 * - Strict isolation, validation, and normalized error handling
 * 
 * Security by design:
 * - Backend does NOT trust the frontend UI
 * - Single-use and temporary confirmation tokens
 * - Strict isolation per conversion (unique temporary directories)
 * - Secure command execution (spawn only, strict whitelist)
 * - Timeout and forced process termination
 * - Input file validation and filtering
 * - Normalized error handling and secure logging
 */

const {
  mkdirSync,
  rmSync,
  existsSync
} = require('fs')
const { writeFile, readFile } = require('fs/promises')
const { tmpdir } = require('os')
const path = require('path')
const { randomBytes, randomUUID } = require('crypto')
const { safeSpawn } = require('../../../../lib/security/safe-spawn.js')
const { isSecurityError, SECURITY_ERROR_CODES } = require('../../../../lib/errors/security-errors.js')

// Import pipeline security module (PIPELINE.md)
const {
  concurrencyController,
  resourceBudgetManager,
  gracefulDegradationManager,
  anomalyDetector,
  PathValidator,
  MimeTypeDetector,
  SecurityLogger,
  SECURITY_CONFIG: PIPELINE_SECURITY_CONFIG
} = require('../security/pipeline-security.js')

// ============================================================================
// CONFIGURATION DES TOKENS DE CONFIRMATION
// ============================================================================

const TOKEN_CONFIG = {
  // Token lifetime (milliseconds)
  TOKEN_TTL: 60000, // 60 seconds
  
  // Token length in bytes (before encoding)
  TOKEN_LENGTH: 32,
  
  // Encoding format
  TOKEN_ENCODING: 'hex'
}

// Token storage (in memory)
const tokenStore = new Map()

// ============================================================================
// CONFIRMATION TOKEN MANAGER
// ============================================================================

/**
 * Cleans up expired tokens from store
 */
function cleanupExpiredTokens() {
  const now = Date.now()
  let cleaned = 0

  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expiresAt.getTime()) {
      tokenStore.delete(token)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`[TOKEN_CLEANUP] Removed ${cleaned} expired tokens`)
  }
}

// Run cleanup every 30 seconds.
// unref() keeps this maintenance timer from holding the event loop open
// (otherwise test runners and one-shot scripts importing this module never exit).
setInterval(cleanupExpiredTokens, 30000).unref()

/**
 * Generates a unique and secure confirmation token
 * 
 * @param {Object} metadata - Optional metadata (format, size, etc.)
 * @returns {Object} { token: string, expiresAt: Date, ttl: number }
 */
function generateConfirmationToken(metadata = {}) {
  // Generate cryptographically secure token
  const randomToken = randomBytes(TOKEN_CONFIG.TOKEN_LENGTH)
  const token = randomToken.toString(TOKEN_CONFIG.TOKEN_ENCODING)

  // Calculate dates
  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + TOKEN_CONFIG.TOKEN_TTL)

  // Store token with its metadata
  tokenStore.set(token, {
    createdAt,
    expiresAt,
    consumed: false,
    metadata: {
      ...metadata,
      generatedAt: createdAt.toISOString()
    }
  })

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    ttl: TOKEN_CONFIG.TOKEN_TTL,
    createdAt: createdAt.toISOString()
  }
}

/**
 * Validates and consumes a confirmation token
 * 
 * @param {string} token - Token to validate
 * @param {Object} expectedMetadata - Expected metadata (optional)
 * @returns {Object} { valid: boolean, error?: string, metadata?: Object }
 */
function validateAndConsumeToken(token, expectedMetadata = {}) {
  // Check that token is provided
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      error: 'CONFIRMATION_TOKEN_MISSING',
      message: 'Confirmation token is required'
    }
  }

  // Check that token exists in store
  const tokenData = tokenStore.get(token)
  if (!tokenData) {
    return {
      valid: false,
      error: 'CONFIRMATION_TOKEN_INVALID',
      message: 'Invalid or unknown confirmation token'
    }
  }

  // Check that token has not already been consumed
  if (tokenData.consumed) {
    return {
      valid: false,
      error: 'CONFIRMATION_TOKEN_ALREADY_USED',
      message: 'Confirmation token has already been used'
    }
  }

  // Check that token has not expired
  const now = Date.now()
  if (now > tokenData.expiresAt.getTime()) {
    // Remove expired token
    tokenStore.delete(token)
    return {
      valid: false,
      error: 'CONFIRMATION_TOKEN_EXPIRED',
      message: 'Confirmation token has expired'
    }
  }

  // Optional metadata verification
  if (Object.keys(expectedMetadata).length > 0) {
    for (const [key, value] of Object.entries(expectedMetadata)) {
      if (tokenData.metadata[key] !== value) {
        return {
          valid: false,
          error: 'CONFIRMATION_TOKEN_METADATA_MISMATCH',
          message: `Token metadata mismatch for key: ${key}`
        }
      }
    }
  }

  // Mark token as consumed (single use)
  tokenData.consumed = true

  // Remove token from store after consumption
  tokenStore.delete(token)

  return {
    valid: true,
    metadata: tokenData.metadata
  }
}

/**
 * Gets token statistics (for monitoring)
 * @returns {Object} Token statistics
 */
function getTokenStats() {
  const now = Date.now()
  let active = 0
  let expired = 0
  let consumed = 0

  for (const data of tokenStore.values()) {
    if (data.consumed) {
      consumed++
    } else if (now > data.expiresAt.getTime()) {
      expired++
    } else {
      active++
    }
  }

  return {
    active,
    expired,
    consumed,
    total: tokenStore.size
  }
}

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

const { envMap } = require('../config/envmap.module.js')
const { getMaxInputSizeBytes } = require('../config/conversion-limits.js')

/**
 * Security configuration
 * Limits are sourced from EnvMap so every conversion route enforces the
 * same input size and timeout (see doc/references/configuration.md).
 */
const SECURITY_CONFIG = {
  // Root directory for isolated conversions
  CONVERSIONS_ROOT: path.join(tmpdir(), 'ascend-conversions'),
  
  // Default timeout (milliseconds)
  DEFAULT_TIMEOUT: envMap.get('CONVERSION_TIMEOUT_MS'),
  
  // Maximum file size (in bytes) — aligned with MAX_INPUT_SIZE_MB
  MAX_FILE_SIZE: getMaxInputSizeBytes(),
  
  // Absolute paths to binaries (adapt according to installation)
  BINARY_PATHS: {
    pandoc: envMap.get('PANDOC_PATH')
  },
  
  // Allowed file extensions (strict whitelist)
  ALLOWED_EXTENSIONS: {
    input: ['.md', '.markdown', '.adoc', '.asciidoc', '.html', '.htm', '.txt', '.yaml', '.yml', '.json'],
    output: ['.md', '.markdown', '.adoc', '.asciidoc', '.html', '.txt', '.yaml', '.json', '.pdf']
  },
  
  // Allowed MIME types (strict whitelist)
  ALLOWED_MIME_TYPES: [
    'text/plain',
    'text/markdown',
    'text/html',
    'text/x-asciidoc',
    'application/x-yaml',
    'application/json',
    'text/x-yaml'
  ]
}

// ============================================================================
// ALLOWED CONVERSIONS WHITELIST
// ============================================================================

/**
 * Mapping table of allowed conversions
 * Format: "from_to" => [Pandoc arguments]
 * 
 * IMPORTANT: No conversion not listed here can be executed
 */
const CONVERSION_WHITELIST = {
  // Markdown to other formats
  'markdown_asciidoc': ['-f', 'markdown', '-t', 'asciidoc'],
  'markdown_html': ['-f', 'markdown', '-t', 'html'],
  'markdown_pdf': ['-f', 'markdown', '-t', 'pdf'],
  'markdown_txt': ['-f', 'markdown', '-t', 'plain'],
  'markdown_yaml': ['-f', 'markdown', '-t', 'yaml'],
  'markdown_json': ['-f', 'markdown', '-t', 'json'],
  
  // AsciiDoc to other formats
  'asciidoc_markdown': ['-f', 'asciidoc', '-t', 'markdown'],
  'asciidoc_html': ['-f', 'asciidoc', '-t', 'html'],
  'asciidoc_pdf': ['-f', 'asciidoc', '-t', 'pdf'],
  'asciidoc_txt': ['-f', 'asciidoc', '-t', 'plain'],
  
  // HTML to other formats
  'html_markdown': ['-f', 'html', '-t', 'markdown'],
  'html_asciidoc': ['-f', 'html', '-t', 'asciidoc'],
  'html_pdf': ['-f', 'html', '-t', 'pdf'],
  'html_txt': ['-f', 'html', '-t', 'plain'],
  
  // Plain text to other formats
  'txt_markdown': ['-f', 'markdown', '-t', 'markdown'], // Pandoc interprets txt as markdown
  'txt_asciidoc': ['-f', 'markdown', '-t', 'asciidoc'],
  'txt_html': ['-f', 'markdown', '-t', 'html'],
  
  // YAML to other formats
  'yaml_markdown': ['-f', 'yaml', '-t', 'markdown'],
  'yaml_asciidoc': ['-f', 'yaml', '-t', 'asciidoc'],
  'yaml_json': ['-f', 'yaml', '-t', 'json'],
  
  // JSON to other formats
  'json_markdown': ['-f', 'json', '-t', 'markdown'],
  'json_asciidoc': ['-f', 'json', '-t', 'asciidoc'],
  'json_yaml': ['-f', 'json', '-t', 'yaml']
}

// ============================================================================
// ISOLATION MANAGER
// ============================================================================

/**
 * Isolation manager for conversions
 * Creates a unique temporary directory and guarantees its cleanup
 */
class IsolationManager {
  constructor() {
    this.conversionId = randomUUID()
    this.workDir = null
  }

  /**
   * Creates isolated work directory for this conversion
   * @returns {string} Absolute path to work directory
   */
  createWorkDirectory() {
    // Create root directory if it doesn't exist
    if (!existsSync(SECURITY_CONFIG.CONVERSIONS_ROOT)) {
      mkdirSync(SECURITY_CONFIG.CONVERSIONS_ROOT, { recursive: true, mode: 0o700 })
    }

    // Create unique directory for this conversion
    this.workDir = path.join(SECURITY_CONFIG.CONVERSIONS_ROOT, this.conversionId)
    mkdirSync(this.workDir, { recursive: true, mode: 0o700 })

    return this.workDir
  }

  /**
   * Gets path of a file in work directory
   * @param {string} filename - File name (without path)
   * @returns {string} Secure absolute path
   */
  getFilePath(filename) {
    if (!this.workDir) {
      throw new Error('Work directory not created')
    }

    // Strict validation: filename must contain only safe characters
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      throw new Error(`Invalid filename: ${filename}`)
    }

    const filePath = path.join(this.workDir, filename)
    
    // Security check: file must be in work directory
    if (!filePath.startsWith(this.workDir)) {
      throw new Error('Path traversal detected')
    }

    return filePath
  }

  /**
   * Cleans up work directory (recursive deletion)
   * This method is called in a finally block to guarantee cleanup
   */
  cleanup() {
    if (this.workDir && existsSync(this.workDir)) {
      try {
        rmSync(this.workDir, { recursive: true, force: true })
      } catch (error) {
        // Log error but don't propagate (cleanup is non-critical)
        console.error(`[${this.conversionId}] Failed to cleanup work directory:`, error.message)
      }
    }
  }

  /**
   * Gets unique ID of this conversion
   * @returns {string} Conversion UUID
   */
  getConversionId() {
    return this.conversionId
  }
}

// ============================================================================
// FILE VALIDATOR
// ============================================================================

/**
 * Validates and filters input files according to security rules
 */
class FileValidator {
  /**
   * Validates file content before conversion
   * @param {string} content - File content
   * @param {string} fromFormat - Source format
   * @returns {Object} { valid: boolean, error?: string }
   */
  static validateContent(content, fromFormat) {
    // Check that content is a non-empty string
    if (typeof content !== 'string') {
      return { valid: false, error: 'Content must be a string' }
    }

    if (content.trim().length === 0) {
      return { valid: false, error: 'Content cannot be empty' }
    }

    // Check maximum size
    const sizeInBytes = Buffer.byteLength(content, 'utf8')
    if (sizeInBytes > SECURITY_CONFIG.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File size exceeds maximum allowed size of ${SECURITY_CONFIG.MAX_FILE_SIZE / 1024 / 1024} MB` 
      }
    }

    // Check that format is allowed
    const normalizedFormat = fromFormat.toLowerCase()
    const allowedFormats = Object.keys(CONVERSION_WHITELIST)
      .map(key => key.split('_')[0])
      .filter((v, i, a) => a.indexOf(v) === i)

    if (!allowedFormats.includes(normalizedFormat)) {
      return { 
        valid: false, 
        error: `Source format '${fromFormat}' is not allowed` 
      }
    }

    // Basic detection of disguised binary files
    // Check for presence of unauthorized control characters
    const controlChars = content.match(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g)
    if (controlChars && controlChars.length > content.length * 0.01) {
      // More than 1% control characters = suspicious
      return { 
        valid: false, 
        error: 'File appears to be binary or contains invalid characters' 
      }
    }

    return { valid: true }
  }

  /**
   * Valide le format de conversion demandé
   * @param {string} fromFormat - Format source
   * @param {string} toFormat - Format destination
   * @returns {Object} { valid: boolean, error?: string }
   */
  static validateConversion(fromFormat, toFormat) {
    const normalizedFrom = fromFormat.toLowerCase()
    const normalizedTo = toFormat.toLowerCase()
    const conversionKey = `${normalizedFrom}_${normalizedTo}`

    if (!CONVERSION_WHITELIST[conversionKey]) {
      return { 
        valid: false, 
        error: `Conversion from '${fromFormat}' to '${toFormat}' is not allowed` 
      }
    }

    return { valid: true }
  }
}

// ============================================================================
// SECURE COMMAND EXECUTOR
// ============================================================================

/**
 * Executes external commands securely with timeout
 */
class SecureCommandExecutor {
  /**
   * Executes Pandoc securely
   * @param {string} conversionId - Unique conversion ID
   * @param {string} fromFormat - Source format
   * @param {string} toFormat - Destination format
   * @param {string} inputFile - Absolute path to input file
   * @param {string} outputFile - Absolute path to output file
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>} Resolves if conversion succeeds
   */
  static async executePandoc(conversionId, fromFormat, toFormat, inputFile, outputFile, timeout = SECURITY_CONFIG.DEFAULT_TIMEOUT) {
    return new Promise((resolve, reject) => {
      // Conversion validation
      const validation = FileValidator.validateConversion(fromFormat, toFormat)
      if (!validation.valid) {
        reject(new ConversionError('VALIDATION_ERROR', validation.error, conversionId))
        return
      }

      // Get arguments from whitelist
      const normalizedFrom = fromFormat.toLowerCase()
      const normalizedTo = toFormat.toLowerCase()
      const conversionKey = `${normalizedFrom}_${normalizedTo}`
      const pandocArgs = [...CONVERSION_WHITELIST[conversionKey]]

      // Build arguments securely
      // No user argument is used directly
      const args = [
        ...pandocArgs,
        '-o', outputFile,  // Output file (secure absolute path)
        inputFile          // Input file (secure absolute path)
      ]

      // Check that Pandoc binary exists
      const pandocPath = SECURITY_CONFIG.BINARY_PATHS.pandoc
      if (!existsSync(pandocPath)) {
        reject(new ConversionError(
          'BINARY_NOT_FOUND',
          `Pandoc binary not found at ${pandocPath}`,
          conversionId
        ))
        return
      }

      safeSpawn(pandocPath, args, {
        cwd: path.dirname(inputFile), // Working directory = isolated directory
        timeoutMs: timeout
      }).then((result) => {
        if (result.code !== 0) {
          logConversion(conversionId, 'CONVERSION_FAILED', `Pandoc exited with code ${result.code}`)
          reject(new ConversionError(
            'CONVERSION_FAILED',
            'Pandoc conversion failed',
            conversionId
          ))
          return
        }

        // Check that output file exists
        if (!existsSync(outputFile)) {
          logConversion(conversionId, 'OUTPUT_MISSING', 'Output file was not created')
          reject(new ConversionError(
            'OUTPUT_MISSING',
            'Output file was not created by Pandoc',
            conversionId
          ))
          return
        }

        // Conversion successful
        logConversion(conversionId, 'SUCCESS', 'Conversion completed successfully')
        resolve()
      }).catch((error) => {
        if (isSecurityError(error) && error.code === SECURITY_ERROR_CODES.CONVERSION_TIMEOUT) {
          logConversion(conversionId, 'TIMEOUT', `Process timeout after ${timeout}ms`)
          reject(new ConversionError(
            'TIMEOUT',
            'Conversion timeout',
            conversionId
          ))
          return
        }
        logConversion(conversionId, 'EXECUTION_ERROR', 'Pandoc execution failed')
        reject(new ConversionError(
          'EXECUTION_ERROR',
          'Failed to execute Pandoc',
          conversionId
        ))
      })
    })
  }
}

// ============================================================================
// NORMALIZED ERROR HANDLING
// ============================================================================

/**
 * Normalized error class for conversions
 * No system details are exposed to end user
 */
class ConversionError extends Error {
  constructor(code, message, conversionId) {
    super(message)
    this.name = 'ConversionError'
    this.code = code
    this.conversionId = conversionId
    this.timestamp = new Date().toISOString()
  }

  /**
   * Returns secure error response for API
   * @returns {Object} Error object without system details
   */
  toSafeResponse() {
    // User-friendly error messages
    const userMessages = {
      'VALIDATION_ERROR': 'Invalid conversion request',
      'BINARY_NOT_FOUND': 'Conversion service unavailable',
      'TIMEOUT': 'Conversion timeout - file may be too large',
      'CONVERSION_FAILED': 'Conversion failed',
      'OUTPUT_MISSING': 'Conversion failed - no output generated',
      'EXECUTION_ERROR': 'Conversion service error',
      'FILE_VALIDATION_ERROR': 'Invalid file content',
      'CONFIRMATION_REQUIRED': 'Confirmation required - please confirm the action',
      'CONFIRMATION_TOKEN_MISSING': 'Confirmation required - please confirm the action',
      'CONFIRMATION_TOKEN_INVALID': 'Invalid confirmation - please try again',
      'CONFIRMATION_TOKEN_EXPIRED': 'Confirmation expired - please confirm again',
      'CONFIRMATION_TOKEN_ALREADY_USED': 'Confirmation already used - please request a new confirmation',
      'CONFIRMATION_TOKEN_METADATA_MISMATCH': 'Confirmation mismatch - please try again'
    }

    return {
      error: true,
      code: this.code,
      message: userMessages[this.code] || 'An error occurred during conversion',
      conversionId: this.conversionId
    }
  }
}

/**
 * Error class for confirmation tokens
 * Extends ConversionError for consistent error handling
 */
class ConfirmationTokenError extends ConversionError {
  constructor(code, message, conversionId) {
    super(code, message, conversionId)
    this.name = 'ConfirmationTokenError'
  }
}

// ============================================================================
// SECURE LOGGING
// ============================================================================

/**
 * Logs conversion events securely
 * No raw user data is logged
 * 
 * @param {string} conversionId - Unique conversion ID
 * @param {string} event - Event type (SUCCESS, TIMEOUT, etc.)
 * @param {string} details - Event details (without user data)
 */
function logConversion(conversionId, event, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    conversionId,
    event,
    details: details.substring(0, 200) // Limit length
  }

  // In production, use appropriate logging system (Winston, Pino, etc.)
  console.log(`[CONVERSION] ${JSON.stringify(logEntry)}`)
}

// ============================================================================
// MAIN CONVERSION ENGINE
// ============================================================================

/**
 * Converts content from one format to another securely
 * 
 * @param {string} content - Content to convert
 * @param {string} fromFormat - Source format (markdown, asciidoc, html, etc.)
 * @param {string} toFormat - Destination format
 * @param {Object} options - Conversion options
 * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
 * @param {boolean} options.confirmed - Confirmation that user validated the action (required)
 * @returns {Promise<string>} Converted content
 * @throws {ConversionError} On error
 */
async function secureConvert(content, fromFormat, toFormat, options = {}) {
  const isolation = new IsolationManager()
  const conversionId = isolation.getConversionId()
  const timeout = options.timeout || SECURITY_CONFIG.DEFAULT_TIMEOUT
  const startTime = new Date()
  const modulesExecuted = []

  try {
    // Rule 24.2: Controlled degradation check before accepting
    const canAccept = gracefulDegradationManager.canAcceptNewConversion()
    if (!canAccept.canAccept) {
      throw new ConversionError(
        canAccept.reason || 'SYSTEM_OVERLOADED',
        canAccept.message || 'System is temporarily overloaded',
        conversionId
      )
    }

    // Rule 21: Concurrency control (Rule 21.1)
    const slotAcquisition = concurrencyController.acquireSlot(conversionId)
    if (!slotAcquisition.allowed) {
      throw new ConversionError(
        slotAcquisition.reason || 'CAPACITY_EXCEEDED',
        slotAcquisition.message || 'Maximum concurrent conversions reached',
        conversionId
      )
    }

    // Rule 22.1: Resource budget initialization
    resourceBudgetManager.initializeBudget(conversionId)

    // Step 0: User confirmation verification (MANDATORY)
    // This verification ensures that a confirmation window was validated on frontend
    if (options.confirmed !== true) {
      throw new ConversionError(
        'CONFIRMATION_REQUIRED',
        'User confirmation is required before executing conversion',
        conversionId
      )
    }

    // Step 1: Content validation
    const contentValidation = FileValidator.validateContent(content, fromFormat)
    if (!contentValidation.valid) {
      throw new ConversionError(
        'FILE_VALIDATION_ERROR',
        contentValidation.error,
        conversionId
      )
    }

    // Step 2: Conversion validation
    const conversionValidation = FileValidator.validateConversion(fromFormat, toFormat)
    if (!conversionValidation.valid) {
      throw new ConversionError(
        'VALIDATION_ERROR',
        conversionValidation.error,
        conversionId
      )
    }

    // Step 3: Create isolated work directory
    const workDir = isolation.createWorkDirectory()
    logConversion(conversionId, 'STARTED', `Converting ${fromFormat} to ${toFormat}`)

    // Step 4: Determine file extensions
    const normalizedFrom = fromFormat.toLowerCase()
    const normalizedTo = toFormat.toLowerCase()
    const inputExt = normalizedFrom === 'asciidoc' ? 'adoc' : normalizedFrom
    const outputExt = normalizedTo === 'asciidoc' ? 'adoc' : (normalizedTo === 'txt' ? 'txt' : normalizedTo)

    // Step 5: Create files in isolated directory
    const inputFile = isolation.getFilePath(`input.${inputExt}`)
    const outputFile = isolation.getFilePath(`output.${outputExt}`)

    // Rule 19.1: Strict path validation (Rule 19.1)
    const inputPathValidation = PathValidator.validatePath(inputFile, workDir)
    if (!inputPathValidation.valid) {
      throw new ConversionError(
        inputPathValidation.error || 'PATH_VALIDATION_ERROR',
        inputPathValidation.message || 'Invalid file path',
        conversionId
      )
    }

    const outputPathValidation = PathValidator.validatePath(outputFile, workDir)
    if (!outputPathValidation.valid) {
      throw new ConversionError(
        outputPathValidation.error || 'PATH_VALIDATION_ERROR',
        outputPathValidation.message || 'Invalid output path',
        conversionId
      )
    }

    // Write input file (async: does not block the event loop for large documents)
    await writeFile(inputFile, content, 'utf8')

    // Rule 19.2: Real file type validation (Rule 19.2)
    const mimeValidation = MimeTypeDetector.detectAndValidate(inputFile, fromFormat)
    if (!mimeValidation.valid) {
      throw new ConversionError(
        mimeValidation.error || 'MIME_TYPE_MISMATCH',
        mimeValidation.message || 'File type does not match declared format',
        conversionId
      )
    }

    // Rule 22.2: Continuous resource monitoring (check before execution)
    const budgetCheck = resourceBudgetManager.checkBudget(conversionId)
    if (!budgetCheck.withinBudget) {
      throw new ConversionError(
        'RESOURCE_LIMIT_EXCEEDED',
        `Resource limit exceeded: ${budgetCheck.exceeded}`,
        conversionId
      )
    }

    // Rule 23.1: Unauthorized access detection before execution
    const unauthorizedCheck = anomalyDetector.detectUnauthorizedAccess(inputFile, workDir, conversionId)
    if (unauthorizedCheck.isAnomaly) {
      throw new ConversionError(
        unauthorizedCheck.type || 'SECURITY_VIOLATION',
        'Unauthorized file access detected',
        conversionId
      )
    }

    // Step 6: Execute conversion securely
    // Use lazy loader for AsciiDoc → Markdown conversions
    if (normalizedFrom === 'asciidoc' && normalizedTo === 'markdown') {
      modulesExecuted.push('downdoc')
      const { runConverter } = require('../modules/lazyload.module.js')
      const result = await runConverter('downdoc', inputFile, outputFile, {
        conversionId: conversionId,
        mode: options?.formatSpecific?.markdown?.parsedown ? 'bookstack' : 'default'
      })
      
      if (!result.success) {
        throw new ConversionError(
          'CONVERSION_FAILED',
          result.error || 'Module conversion failed',
          conversionId
        )
      }
    } else {
      // Use Pandoc for other conversions
      modulesExecuted.push('pandoc')
      await SecureCommandExecutor.executePandoc(
        conversionId,
        fromFormat,
        toFormat,
        inputFile,
        outputFile,
        timeout
      )
    }

    // Rule 22.2: Budget check after execution
    const postBudgetCheck = resourceBudgetManager.checkBudget(conversionId)
    if (!postBudgetCheck.withinBudget) {
      throw new ConversionError(
        'RESOURCE_LIMIT_EXCEEDED',
        `Resource limit exceeded during execution: ${postBudgetCheck.exceeded}`,
        conversionId
      )
    }

    // Step 7: Read result (async)
    const result = await readFile(outputFile, 'utf8')

    // Rule 23.3: Abnormal execution profile detection
    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()
    const stats = resourceBudgetManager.getStats(conversionId)
    if (stats) {
      const profileCheck = anomalyDetector.detectAbnormalProfile(
        conversionId,
        fromFormat,
        toFormat,
        duration,
        stats.memoryMB
      )
      if (profileCheck.isAnomaly) {
        // Log the anomaly but don't fail the conversion
        // because it succeeded, it's just an alert signal
        SecurityLogger.logAnomaly(conversionId, 'ABNORMAL_PROFILE_SUCCESS', profileCheck.details)
      }
    }

    logConversion(conversionId, 'SUCCESS', 'Conversion completed')
    
    // Rule 18: Minimal security logging (Rule 18.1)
    SecurityLogger.logConversion(
      conversionId,
      fromFormat,
      toFormat,
      modulesExecuted,
      duration,
      'SUCCESS',
      startTime,
      endTime
    )

    // Rule 24.1: Success recording
    gracefulDegradationManager.recordSuccess(conversionId)

    return result

  } catch (error) {
    // Rule 20.2: Exhaustive error capture (Rule 20.2)
    // Any unhandled error must be transformed into ConversionError
    let conversionError = error
    
    if (!(error instanceof ConversionError)) {
      // Rule 20.2: Transform into controlled failure
      conversionError = new ConversionError(
        'UNEXPECTED_ERROR',
        'An unexpected error occurred during conversion',
        conversionId
      )
      // Log original error for diagnostics (without exposing to user)
      console.error(`[${conversionId}] Unexpected error:`, error.message)
    }

    // Log error (without user data)
    logConversion(conversionId, conversionError.code, conversionError.message)

    // Rule 24.1: Failure recording for controlled degradation
    gracefulDegradationManager.recordFailure(conversionId)

    // Rule 18: Minimal security logging even on failure (Rule 18.1)
    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()
    SecurityLogger.logConversion(
      conversionId,
      fromFormat,
      toFormat,
      modulesExecuted,
      duration,
      conversionError.code,
      startTime,
      endTime
    )

    // Propagate error
    throw conversionError

  } finally {
    // Règle 21.3 : Libération garantie du slot de concurrence (Règle 21.3)
    concurrencyController.releaseSlot(conversionId)
    
    // Règle 22 : Libération du budget de ressources
    resourceBudgetManager.releaseBudget(conversionId)

    // Step 8: Guaranteed cleanup (even on error) - Règle 4
    isolation.cleanup()
  }
}

/**
 * Converts content with confirmation token validation
 * 
 * @param {string} content - Content to convert
 * @param {string} fromFormat - Source format
 * @param {string} toFormat - Destination format
 * @param {Object} options - Conversion options
 * @param {string} options.confirmationToken - Confirmation token (MANDATORY)
 * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
 * @param {Object} options.expectedMetadata - Expected metadata for additional validation (optional)
 * @returns {Promise<string>} Converted content
 * @throws {ConversionError} On error
 */
async function secureConvertWithToken(content, fromFormat, toFormat, options = {}) {
  const { confirmationToken, expectedMetadata, timeout } = options

  // Step 0: Confirmation token validation (MANDATORY)
  // 
  // SECURITY PRINCIPLE:
  // Backend does NOT trust the frontend UI.
  // Even if user clicked "Yes" in a modal,
  // backend MUST verify that a valid token was generated
  // by the server and is present in the request.
  //
  // This validation is independent of UI and guarantees that an explicit
  // confirmation was obtained on server side before any conversion.
  const tokenValidation = validateAndConsumeToken(confirmationToken, expectedMetadata)
  
  if (!tokenValidation.valid) {
    // Create conversion error with appropriate code
    // Token is invalid, expired, already used or missing
    throw new ConfirmationTokenError(
      tokenValidation.error || 'CONFIRMATION_TOKEN_INVALID',
      tokenValidation.message || 'Invalid confirmation token',
      'unknown' // conversionId unknown at this stage
    )
  }

  // Token is valid and has been consumed
  // Proceed with conversion using base secure-converter
  // Note: we pass confirmed: true because valid token = confirmed validation
  return await secureConvert(content, fromFormat, toFormat, {
    timeout,
    confirmed: true // Valid token equals confirmation
  })
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Conversion functions
  secureConvert,
  secureConvertWithToken,
  
  // Token management
  generateConfirmationToken,
  validateAndConsumeToken,
  getTokenStats,
  
  // Classes
  ConversionError,
  ConfirmationTokenError,
  FileValidator,
  IsolationManager,
  SecureCommandExecutor,
  
  // Configuration
  SECURITY_CONFIG,
  CONVERSION_WHITELIST,
  TOKEN_CONFIG
}
