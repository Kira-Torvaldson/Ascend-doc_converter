'use strict'

/**
 * TEXT2MARKDOWN MODULE
 * 
 * Wrapper for converting plain text files to Markdown with automatic structure detection.
 * This module conforms to the interface defined in doc/specifications/modules.interface.md
 * 
 * This module converts plain text files to Markdown according to the specification
 * defined in doc/specifications/modules/text2markdown.module.md
 * 
 * References:
 * - modules.interface.md: Module interface contract
 * - text2markdown.module.md: Text2Markdown module specification
 */

const { readFileSync, writeFileSync, statSync, existsSync, unlinkSync } = require('fs')
const path = require('path')
const { getMaxInputSizeBytes } = require('../config/conversion-limits.js')
const { createSuccessResult, createFailureResult } = require('../../src/utils/conversion-result.js')

function inferMimeTypeFromPath(filePath) {
  const ext = path.extname(filePath || '').toLowerCase()
  if (ext === '.txt' || ext === '.text') return 'text/plain'
  if (ext === '.md' || ext === '.markdown') return 'text/markdown'
  return null
}

function buildInputFileBlock(filePath) {
  let size = 0
  try {
    if (filePath && existsSync(filePath)) size = statSync(filePath).size
  } catch (_) {
    /* best-effort */
  }
  return {
    originalName: path.basename(filePath || ''),
    storedPath: filePath,
    size,
    mimeType: inferMimeTypeFromPath(filePath),
  }
}

function buildOutputFileBlock(filePath) {
  let size = 0
  try {
    if (filePath && existsSync(filePath)) size = statSync(filePath).size
  } catch (_) {
    /* best-effort */
  }
  return {
    path: filePath,
    size,
    mimeType: inferMimeTypeFromPath(filePath),
  }
}

function makeErrorObject({ code, message, details, recoverable }) {
  const err = { code, message, details: details ?? null, recoverable: Boolean(recoverable) }
  Object.defineProperty(err, 'toString', {
    value: function toString() {
      return this.message
    },
    enumerable: false,
  })
  return err
}

function validationErrorToCode(message) {
  const m = String(message || '').toLowerCase()
  if (m.includes('not found')) return 'INVALID_INPUT'
  if (m.includes('exceeds maximum')) return 'PAYLOAD_TOO_LARGE'
  if (m.includes('is empty') || m.includes('empty or invalid')) return 'EMPTY_INPUT'
  if (m.includes('extension')) return 'FORMAT_UNSUPPORTED'
  return 'INVALID_INPUT'
}

function createText2MarkdownFailure({
  conversionId,
  startTime,
  logs,
  inputPath,
  outputPath,
  errorCode,
  message,
  details,
  recoverable,
  meta,
  outputFile,
}) {
  const endTime = Date.now()
  const durationSeconds = (endTime - startTime) / 1000
  const result = createFailureResult({
    conversionId,
    converter: 'text2markdown',
    pipeline: ['text->markdown'],
    inputFormat: 'txt',
    outputFormat: 'markdown',
    inputFile: buildInputFileBlock(inputPath),
    startedAt: new Date(startTime).toISOString(),
    finishedAt: new Date(endTime).toISOString(),
    durationMs: endTime - startTime,
    error: makeErrorObject({
      code: errorCode,
      message,
      details,
      recoverable,
    }),
    outputFile:
      outputFile ??
      (outputPath && existsSync(outputPath) ? buildOutputFileBlock(outputPath) : null),
    warnings: [],
    logs: Array.isArray(logs) ? logs : [],
    meta: meta && typeof meta === 'object' ? meta : {},
  })
  result.duration = durationSeconds
  return result
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODULE_CONFIG = {
  // Accepted text file extensions
  ALLOWED_EXTENSIONS: ['.txt', '.text']
}

// ============================================================================
// TEXT TO MARKDOWN CONVERSION
// ============================================================================

/**
 * Detects and converts text structures to Markdown
 * Conforms to text2markdown.module.md specification
 * 
 * @param {string} text - Plain text content
 * @returns {string} Converted Markdown
 */
function convertTextToMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return text
  }

  const lines = text.split('\n')
  const markdownLines = []
  let inCodeBlock = false
  let inList = false
  let listType = null // 'ul' or 'ol'
  let lastLineWasEmpty = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const isEmpty = trimmed.length === 0

    // Handle empty lines
    if (isEmpty) {
      if (inCodeBlock) {
        // Check if code block should end (next non-empty line not indented)
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1]
          if (nextLine.trim().length > 0 && !/^\s{4,}/.test(nextLine) && !/^\t/.test(nextLine)) {
            markdownLines.push('```')
            inCodeBlock = false
          }
        }
      }
      if (inList) {
        inList = false
        listType = null
      }
      if (!lastLineWasEmpty) {
        markdownLines.push('')
      }
      lastLineWasEmpty = true
      continue
    }

    lastLineWasEmpty = false

    // Detect code blocks (4+ spaces or tab at start)
    if (/^\s{4,}/.test(line) || /^\t/.test(line)) {
      if (!inCodeBlock) {
        markdownLines.push('```')
        inCodeBlock = true
      }
      markdownLines.push(line)
      continue
    } else if (inCodeBlock) {
      markdownLines.push('```')
      inCodeBlock = false
    }

    // Detect horizontal rules
    if (/^[-*_]{3,}$/.test(trimmed)) {
      markdownLines.push('---')
      continue
    }

    // Detect headers (lines in ALL CAPS or followed by separator)
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim()
      if (nextLine === '=' || nextLine === '-' || nextLine.match(/^={3,}$/) || nextLine.match(/^-{3,}$/)) {
        const level = nextLine.startsWith('=') ? 1 : 2
        markdownLines.push('#'.repeat(level) + ' ' + trimmed)
        i++ // Skip the separator line
        continue
      }
    }

    // Detect headers (ALL CAPS lines)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && /^[A-Z\s]+$/.test(trimmed) && trimmed.length < 100) {
      markdownLines.push('## ' + trimmed)
      continue
    }

    // Detect ordered lists (1., 2., etc.)
    const orderedListMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (orderedListMatch) {
      if (!inList || listType !== 'ol') {
        inList = true
        listType = 'ol'
      }
      markdownLines.push(`${orderedListMatch[1]}. ${orderedListMatch[2]}`)
      continue
    }

    // Detect unordered lists (-, *, +)
    const unorderedListMatch = trimmed.match(/^([-*+])\s+(.+)$/)
    if (unorderedListMatch) {
      if (!inList || listType !== 'ul') {
        inList = true
        listType = 'ul'
      }
      markdownLines.push(`- ${unorderedListMatch[2]}`)
      continue
    }

    // End list if we were in one
    if (inList) {
      inList = false
      listType = null
    }

    // Detect URLs
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g
    let processedLine = line
    if (urlRegex.test(processedLine)) {
      processedLine = processedLine.replace(urlRegex, (url) => {
        const href = url.startsWith('http') ? url : `http://${url}`
        return `[${url}](${href})`
      })
    }

    // Detect email addresses
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
    if (emailRegex.test(processedLine)) {
      processedLine = processedLine.replace(emailRegex, (email) => {
        return `[${email}](mailto:${email})`
      })
    }

    markdownLines.push(processedLine)
  }

  // Close code block if still open
  if (inCodeBlock) {
    markdownLines.push('```')
  }

  return markdownLines.join('\n')
}

/**
 * Basic cleanup to ensure valid Markdown
 * Conforms to text2markdown.module.md specification
 * 
 * @param {string} markdown - Raw markdown from conversion
 * @returns {string} Cleaned markdown
 */
function basicCleanup(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return markdown
  }

  let result = markdown

  // Normalize multiple empty lines (max 2 consecutive)
  result = result.replace(/\n{3,}/g, '\n\n')

  // Normalize file endings (single final newline)
  result = result.trimEnd() + '\n'

  return result
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validates input file according to minimal V1 security obligations
 * Conforms to modules.interface.md - Obligation 1: Basic input validation
 * 
 * @param {string} inputPath - Path to input file
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateInput(inputPath) {
  // Check file existence
  if (!existsSync(inputPath)) {
    return {
      valid: false,
      error: 'Input file not found'
    }
  }

  // Check file size
  try {
    const stats = statSync(inputPath)
    if (stats.size > getMaxInputSizeBytes()) {
      return {
        valid: false,
        error: `File size (${stats.size} bytes) exceeds maximum allowed size (${getMaxInputSizeBytes()} bytes)`
      }
    }

    if (stats.size === 0) {
      return {
        valid: false,
        error: 'Input file is empty'
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: `Failed to read file stats: ${error.message}`
    }
  }

  // Basic file type check by extension
  const ext = path.extname(inputPath).toLowerCase()
  if (!MODULE_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File extension '${ext}' is not allowed. Allowed extensions: ${MODULE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
    }
  }

  return { valid: true }
}

// ============================================================================
// TEXT2MARKDOWN MODULE
// ============================================================================

/**
 * Text2Markdown module conforming to modules.interface.md interface
 */
const text2markdownModule = {
  /**
   * Module name (modules.interface.md - Property 1)
   */
  name: 'text2markdown',

  /**
   * Supported formats (modules.interface.md - Property 2)
   */
  supportedFormats: {
    from: ['txt'],
    to: ['markdown']
  },

  /**
   * Run method conforming to modules.interface.md
   * Implements the process described in text2markdown.module.md
   * 
   * @param {string} inputPath - Absolute path to input text file
   * @param {string} outputPath - Absolute path to output Markdown file
   * @param {Object} options - Conversion options (optional)
   * @param {string} options.conversionId - Conversion ID for logs (optional)
   * @returns {Promise<object>} ConversionResult (native) with legacy `duration` (seconds)
   */
  async run(inputPath, outputPath, options = {}) {
    const startTime = Date.now()
    const logs = []
    const conversionId = options.conversionId || 'unknown'

    try {
      // Minimal logging - Obligation 4 (modules.interface.md)
      logs.push(`[${conversionId}] Conversion started at ${new Date().toISOString()}`)
      logs.push(`[${conversionId}] Input: ${path.basename(inputPath)}`)
      logs.push(`[${conversionId}] Output: ${path.basename(outputPath)}`)

      // Step 1: Input validation (Obligation 1 - modules.interface.md)
      logs.push(`[${conversionId}] Validating input file...`)
      const validation = validateInput(inputPath)
      if (!validation.valid) {
        logs.push(`[${conversionId}] Validation failed: ${validation.error}`)
        return createText2MarkdownFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: validationErrorToCode(validation.error),
          message: validation.error,
          details: { stage: 'input-validation' },
          recoverable: false,
          meta: { stage: 'input-validation' },
        })
      }
      logs.push(`[${conversionId}] Input file validated`)

      // Step 2: Secure input file reading (text2markdown.module.md)
      logs.push(`[${conversionId}] Reading input file...`)
      let textContent
      try {
        textContent = readFileSync(inputPath, 'utf8')
      } catch (error) {
        logs.push(`[${conversionId}] Failed to read input file: ${error.message}`)
        return createText2MarkdownFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'INVALID_INPUT',
          message: `Failed to read input file: ${error.message}`,
          details: { stage: 'read-input' },
          recoverable: false,
          meta: { stage: 'read-input' },
        })
      }

      // Validate that content is not empty
      if (!textContent || typeof textContent !== 'string' || textContent.trim().length === 0) {
        logs.push(`[${conversionId}] Input file is empty or invalid`)
        return createText2MarkdownFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'EMPTY_INPUT',
          message: 'Input file content is empty or invalid',
          details: { stage: 'content-validation' },
          recoverable: false,
          meta: { stage: 'content-validation' },
        })
      }
      logs.push(`[${conversionId}] Input file read successfully (${textContent.length} characters)`)

      // Step 3: In-memory conversion with automatic detection (text2markdown.module.md)
      logs.push(`[${conversionId}] Converting text to Markdown with automatic structure detection...`)
      let markdown
      try {
        markdown = convertTextToMarkdown(textContent)
        logs.push(`[${conversionId}] Conversion completed`)
      } catch (error) {
        logs.push(`[${conversionId}] Conversion failed: ${error.message}`)
        return createText2MarkdownFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'CONVERSION_FAILED',
          message: `Conversion failed: ${error.message}`,
          details: { stage: 'convert' },
          recoverable: true,
          meta: { stage: 'convert' },
        })
      }

      // Verify conversion actually happened
      if (!markdown || typeof markdown !== 'string') {
        logs.push(`[${conversionId}] ERROR: Conversion returned invalid result. Type: ${typeof markdown}`)
        return createText2MarkdownFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'CONVERSION_FAILED',
          message: 'Conversion returned invalid result',
          details: { stage: 'convert-validate' },
          recoverable: true,
          meta: { stage: 'convert-validate' },
        })
      }

      // Step 4: Result post-processing (text2markdown.module.md)
      logs.push(`[${conversionId}] Applying post-processing...`)
      markdown = basicCleanup(markdown)
      logs.push(`[${conversionId}] Post-processing completed`)
      logs.push(`[${conversionId}] Final markdown length: ${markdown.length} characters`)

      // Step 5: Write result (text2markdown.module.md)
      logs.push(`[${conversionId}] Writing output file...`)
      try {
        writeFileSync(outputPath, markdown, 'utf8')
        logs.push(`[${conversionId}] Output file written successfully`)
      } catch (error) {
        // Obligation 3 - Secure error handling: do not create partial file
        if (existsSync(outputPath)) {
          try {
            unlinkSync(outputPath)
            logs.push(`[${conversionId}] Partial output file removed`)
          } catch (unlinkError) {
            logs.push(`[${conversionId}] Warning: Failed to remove partial output file`)
          }
        }

        logs.push(`[${conversionId}] Failed to write output file: ${error.message}`)
        return createText2MarkdownFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'OUTPUT_NOT_CREATED',
          message: `Failed to write output file: ${error.message}`,
          details: { stage: 'write-output' },
          recoverable: true,
          meta: { stage: 'write-output' },
        })
      }

      // Step 6: Return standardized ConversionResult
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      logs.push(`[${conversionId}] Conversion completed successfully`)
      logs.push(`[${conversionId}] Duration: ${duration.toFixed(3)}s`)
      logs.push(`[${conversionId}] Finished at ${new Date().toISOString()}`)

      const success = createSuccessResult({
        conversionId,
        converter: 'text2markdown',
        pipeline: ['text->markdown'],
        inputFormat: 'txt',
        outputFormat: 'markdown',
        inputFile: buildInputFileBlock(inputPath),
        outputFile: buildOutputFileBlock(outputPath),
        startedAt: new Date(startTime).toISOString(),
        finishedAt: new Date(endTime).toISOString(),
        durationMs: endTime - startTime,
        warnings: [],
        logs,
        meta: { stage: 'complete' },
      })
      success.duration = duration
      return success
    } catch (error) {
      // Obligation 3 - Secure error handling: exhaustive capture
      logs.push(`[${conversionId}] Unexpected error: ${error.message}`)

      if (existsSync(outputPath)) {
        try {
          unlinkSync(outputPath)
          logs.push(`[${conversionId}] Partial output file removed after error`)
        } catch (unlinkError) {
          logs.push(`[${conversionId}] Warning: Failed to remove partial output file`)
        }
      }

      return createText2MarkdownFailure({
        conversionId,
        startTime,
        logs,
        inputPath,
        outputPath,
        errorCode: 'INTERNAL_ERROR',
        message: `Unexpected error: ${error.message}`,
        details: { stage: 'unexpected' },
        recoverable: false,
        meta: { stage: 'unexpected' },
      })
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = text2markdownModule
