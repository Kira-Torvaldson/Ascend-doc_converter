'use strict'

/**
 * CONVERTER ORCHESTRATOR MODULE
 * 
 * Central module that orchestrates the execution of all converters in the pipeline
 * according to their capabilities and supported formats. This module uses lazy loading
 * to optimize memory consumption and strictly adheres to the interface
 * defined in modules.interface.md.
 * 
 * References:
 * - modules.interface.md: Module interface contract
 * - lazyload.module.js: Lazy loading module
 * - PIPELINE.md: Conversion pipeline specification
 */

const path = require('path')
const { runConverter } = require('./lazyload.module.js')
const { existsSync, statSync, readFileSync } = require('fs')
const { createHash } = require('crypto')
const {
  assertSafeExistingPath
} = require('../../../../lib/security/path-guard.js')
const {
  isSecurityError,
  SECURITY_ERROR_CODES
} = require('../../../../lib/errors/security-errors.js')
const { validateConversionRequest } = require('../../../../lib/security/validate-conversion-request.js')
const { safeSpawn } = require('../../../../lib/security/safe-spawn.js')
const { writeConversionAuditLog } = require('../../../../lib/logging/conversion-audit-log.js')
const { createSuccessResult, createFailureResult } = require('../../src/utils/conversion-result.js')
const {
  isStandardizedSuccess,
  isStandardizedFailure,
  coerceOrchestratorError,
  makeOrchestratorFailure,
} = require('./orchestrator-result.js')

function buildPandocFileBlock(filePath) {
  let size = 0
  try {
    if (filePath && existsSync(filePath)) size = statSync(filePath).size
  } catch (_) { /* ignore */ }
  return {
    originalName: path.basename(filePath || ''),
    storedPath: filePath,
    size,
    mimeType: null,
  }
}

function buildPandocOutputBlock(filePath) {
  let size = 0
  try {
    if (filePath && existsSync(filePath)) size = statSync(filePath).size
  } catch (_) { /* ignore */ }
  return { path: filePath, size, mimeType: null }
}

/**
 * Native ConversionResult for the Pandoc command path.
 */
function createPandocResult({
  success,
  conversionId,
  startTime,
  logs,
  inputPath,
  outputPath,
  fromFormat,
  toFormat,
  errorCode = null,
  message = null,
  details = null,
  recoverable = false,
  processExitCode = null,
  meta = {},
}) {
  const endTime = Date.now()
  const durationMs = endTime - startTime
  const duration = durationMs / 1000
  const base = {
    conversionId,
    converter: 'pandoc',
    pipeline: [`${fromFormat}->${toFormat}`],
    inputFormat: fromFormat,
    outputFormat: toFormat,
    inputFile: buildPandocFileBlock(inputPath),
    startedAt: new Date(startTime).toISOString(),
    finishedAt: new Date(endTime).toISOString(),
    durationMs,
    warnings: [],
    logs,
    meta: {
      ...meta,
      processExitCode,
    },
  }

  let result
  if (success) {
    result = createSuccessResult({
      ...base,
      outputFile: buildPandocOutputBlock(outputPath),
    })
  } else {
    result = createFailureResult({
      ...base,
      outputFile: outputPath && existsSync(outputPath) ? buildPandocOutputBlock(outputPath) : null,
      error: {
        code: errorCode || 'CONVERSION_FAILED',
        message: message || 'Pandoc conversion failed',
        details: details ?? null,
        recoverable: Boolean(recoverable),
      },
    })
  }

  // Legacy fields consumed by audit / older callers
  result.duration = duration
  result.processExitCode = processExitCode
  if (!success && errorCode) result.errorCode = errorCode
  return result
}

// Import pipeline security for load control (only for external calls)
const {
  concurrencyController,
  gracefulDegradationManager,
  resourceBudgetManager
} = require('../security/pipeline-security.js')

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODULES_DIR = __dirname

/**
 * Configuration of available converters
 * Each entry defines the converter name, its supported formats, and its execution method
 */
const CONVERTER_REGISTRY = {
  'downdoc': {
    name: 'downdoc',
    supportedFormats: {
      from: ['asciidoc'],
      to: ['markdown']
    },
    executionType: 'lazy-load', // Utilise le lazy loading
    modulePath: path.join(MODULES_DIR, 'adoc-to-md.converter.js')
  },
  // Dedicated HTML wrappers take priority over generic Pandoc for these pairs
  'html-markdown': {
    name: 'html-markdown',
    supportedFormats: {
      from: ['html', 'markdown'],
      to: ['html', 'markdown']
    },
    executionType: 'lazy-load',
    modulePath: path.join(MODULES_DIR, 'html-markdown.module.js')
  },
  'html-plain': {
    name: 'html-plain',
    supportedFormats: {
      from: ['html', 'txt'],
      to: ['html', 'txt']
    },
    executionType: 'lazy-load',
    modulePath: path.join(MODULES_DIR, 'html-plain.module.js')
  },
  'text2markdown': {
    name: 'text2markdown',
    supportedFormats: {
      from: ['txt'],
      to: ['markdown']
    },
    executionType: 'lazy-load',
    modulePath: path.join(MODULES_DIR, 'text2markdown.module.js')
  },
  'pandoc': {
    name: 'pandoc',
    supportedFormats: {
      from: ['markdown', 'asciidoc', 'html', 'txt', 'yaml', 'json'],
      to: ['markdown', 'asciidoc', 'html', 'pdf', 'txt', 'yaml', 'json']
    },
    executionType: 'command', // Uses child_process.spawn directly
    binaryPath: (() => {
      // Prefer an existing absolute path; otherwise bare "pandoc" (PATH), like convert.js.
      const candidates = []
      try {
        const { envMap } = require('../config/envmap.module.js')
        candidates.push(envMap.get('PANDOC_PATH'))
      } catch (_) { /* ignore */ }
      if (process.env.PANDOC_PATH) candidates.push(process.env.PANDOC_PATH)
      if (process.platform === 'win32') {
        candidates.push('C:\\Program Files\\Pandoc\\pandoc.exe', 'pandoc.exe', 'pandoc')
      } else {
        candidates.push('/usr/bin/pandoc', '/usr/local/bin/pandoc', 'pandoc')
      }
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'string') continue
        const isBare = !path.isAbsolute(candidate) && !candidate.includes('/') && !candidate.includes('\\')
        if (isBare) return candidate
        if (existsSync(candidate)) return candidate
      }
      return process.platform === 'win32' ? 'pandoc.exe' : 'pandoc'
    })()
  },
  'panwriter': {
    name: 'panwriter',
    supportedFormats: {
      from: ['markdown', 'asciidoc', 'html', 'docx', 'odt', 'rtf', 'latex', 'tex'],
      to: ['markdown', 'asciidoc', 'html', 'docx', 'odt', 'rtf', 'latex', 'tex']
    },
    executionType: 'lazy-load', // Uses lazy loading (to be created)
    modulePath: path.join(MODULES_DIR, 'panwriter.module.js')
  },
  'docverter': {
    name: 'docverter',
    supportedFormats: {
      from: ['rtf', 'pdf', 'html', 'txt', 'markdown', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'png', 'jpg', 'jpeg', 'gif'],
      to: ['rtf', 'pdf', 'html', 'txt', 'markdown', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'png', 'jpg', 'jpeg', 'gif']
    },
    executionType: 'lazy-load', // Uses lazy loading (to be created)
    modulePath: path.join(MODULES_DIR, 'docverter.module.js')
  }
}

// ============================================================================
// ORCHESTRATEUR DE CONVERSION
// ============================================================================

/**
 * Orchestrator class for all converters
 * Identifies and executes the appropriate converter according to requested formats
 */
class ConverterOrchestrator {
  constructor() {
    this.converters = CONVERTER_REGISTRY
    this.executionLogs = []
  }

  /**
   * Finds the appropriate converter for a given conversion
   * @param {string} fromFormat - Source format
   * @param {string} toFormat - Destination format
   * @returns {Object|null} Converter configuration or null if none matches
   */
  findConverter(fromFormat, toFormat) {
    const normalizedFrom = fromFormat.toLowerCase()
    const normalizedTo = toFormat.toLowerCase()

    // Iterate through all registered converters
    for (const [converterName, converterConfig] of Object.entries(this.converters)) {
      const supportedFrom = converterConfig.supportedFormats.from.map(f => f.toLowerCase())
      const supportedTo = converterConfig.supportedFormats.to.map(f => f.toLowerCase())

      // Check if this converter supports the requested conversion
      if (supportedFrom.includes(normalizedFrom) && supportedTo.includes(normalizedTo)) {
        return {
          name: converterName,
          config: converterConfig
        }
      }
    }

    return null
  }

  /**
   * Executes a conversion using the appropriate converter
   * @param {string} inputPath - Absolute path to input file
   * @param {string} outputPath - Absolute path to output file
   * @param {string} fromFormat - Source format
   * @param {string} toFormat - Destination format
   * @param {Object} options - Conversion options
   * @returns {Promise<ModuleResult>} Conversion result
   */
  async executeConversion(inputPath, outputPath, fromFormat, toFormat, options = {}) {
    const conversionId = options.conversionId || 'unknown'
    const startTime = Date.now()
    const logs = []
    const audit = {
      conversionId,
      startTimestamp: new Date(startTime).toISOString(),
      endTimestamp: null,
      fromFormat,
      toFormat,
      inputHash: null,
      inputSize: null,
      success: false,
      errorCode: null,
      durationMs: null,
      processExitCode: null
    }
    
    // Check if this is an internal call (from linear orchestrator)
    // Internal calls don't need load control as it's managed by the linear orchestrator
    const isInternalCall = options._internal === true
    let slotAcquired = false

    try {
      // Minimal logging: conversion start
      logs.push(`[${conversionId}] Starting conversion: ${fromFormat} → ${toFormat}`)
      logs.push(`[${conversionId}] Orchestrator: Finding appropriate converter...`)

      // Step 0: Load control (only for external calls)
      if (!isInternalCall) {
        logs.push(`[${conversionId}] Checking system load (external call)...`)
        const canAccept = gracefulDegradationManager.canAcceptNewConversion()
        if (!canAccept.canAccept) {
          const duration = (Date.now() - startTime) / 1000
          const error = `System overloaded: ${canAccept.message || 'System is temporarily overloaded'}`
          logs.push(`[${conversionId}] ${error}`)
          audit.errorCode = 'RESOURCE_LIMIT_EXCEEDED'
          
          return {
            success: false,
            logs: logs,
            error: error,
            duration: duration
          }
        }

        // Acquire concurrency slot
        logs.push(`[${conversionId}] Acquiring concurrency slot...`)
        const slotAcquisition = concurrencyController.acquireSlot(conversionId)
        if (!slotAcquisition.allowed) {
          const duration = (Date.now() - startTime) / 1000
          const message = `Concurrency limit reached: ${slotAcquisition.message || 'Maximum concurrent conversions reached'}`
          logs.push(`[${conversionId}] ${message}`)
          audit.errorCode = 'RESOURCE_LIMIT_EXCEEDED'
          return makeOrchestratorFailure({
            code: 'RESOURCE_LIMIT_EXCEEDED',
            message,
            logs,
            duration,
            details: { stage: 'converter-concurrency' },
            recoverable: true,
          })
        }
        slotAcquired = true
        logs.push(`[${conversionId}] Concurrency slot acquired`)

        // Initialize resource budget
        resourceBudgetManager.initializeBudget(conversionId)
        logs.push(`[${conversionId}] Resource budget initialized`)
      } else {
        logs.push(`[${conversionId}] Internal call - load control managed by linear orchestrator`)
      }

      // Step 0: Fast-fail security validation on input path
      const allowedPrefix = options.allowedPrefix || options.workDir || path.dirname(inputPath)
      assertSafeExistingPath(inputPath, allowedPrefix)
      const inputBuffer = readFileSync(inputPath)
      audit.inputSize = inputBuffer.length
      audit.inputHash = createHash('sha256').update(inputBuffer).digest('hex')
      // Step 1: Validation pipeline v1 (sequential short-circuit)
      const validationResult = validateConversionRequest({
        inputPath,
        outputPath,
        fromFormat,
        toFormat,
        converterRegistry: this.converters,
        allowedPrefix,
        maxInputSizeBytes: options.maxInputSizeBytes
      })
      const converter = {
        name: validationResult.converterName,
        config: validationResult.converterConfig
      }

      logs.push(`[${conversionId}] Converter found: ${converter.name}`)
      logs.push(`[${conversionId}] Execution type: ${converter.config.executionType}`)

      // ------------------------------------------------------------------------
      // Invariant: No output artifact can be produced from an empty input.
      // Before running any wrapper, reject 0-byte input and do not create output.
      // ------------------------------------------------------------------------
      const inputBytes = existsSync(inputPath) ? statSync(inputPath).size : 0
      if (inputBytes === 0) {
        const duration = (Date.now() - startTime) / 1000
        const msg = 'Input is empty → conversion skipped → no output produced'
        logs.push(`[${conversionId}] ${msg}`)
        const result = {
          success: false,
          logs,
          error: msg,
          duration,
          pipelineState: 'empty_input'
        }
        if (!isInternalCall && slotAcquired) {
          concurrencyController.releaseSlot(conversionId)
        }
        return result
      }

      // Step 2: Execute conversion according to execution type
      let result

      if (converter.config.executionType === 'lazy-load') {
        // Use lazy loading for modules conforming to the interface
        logs.push(`[${conversionId}] Executing via lazy loading...`)
        
        result = await runConverter(converter.name, inputPath, outputPath, {
          ...options,
          fromFormat: fromFormat,
          toFormat: toFormat,
          conversionId: conversionId
        })
      } else if (converter.config.executionType === 'command') {
        // Use command execution for external tools (Pandoc)
        logs.push(`[${conversionId}] Executing via command execution...`)
        
        result = await this.executeCommandConverter(
          converter.name,
          converter.config,
          inputPath,
          outputPath,
          fromFormat,
          toFormat,
          conversionId,
          options
        )
      } else {
        const duration = (Date.now() - startTime) / 1000
        const message = `Unknown execution type: ${converter.config.executionType}`
        logs.push(`[${conversionId}] ${message}`)
        audit.errorCode = 'FORMAT_UNSUPPORTED'
        return makeOrchestratorFailure({
          code: 'FORMAT_UNSUPPORTED',
          message,
          logs,
          duration,
          details: {
            stage: 'converter-dispatch',
            executionType: converter.config.executionType,
          },
        })
      }

      // Step 3: Merge logs and standardize result
      const allLogs = [...logs]
      if (Array.isArray(result.logs)) {
        allLogs.push(...result.logs)
      } else if (typeof result.logs === 'string') {
        allLogs.push(result.logs)
      }

      // Minimal logging: conversion end
      const duration = result.duration || ((Date.now() - startTime) / 1000)
      allLogs.push(`[${conversionId}] Conversion completed: ${result.success ? 'SUCCESS' : 'FAILED'}`)
      allLogs.push(`[${conversionId}] Total duration: ${duration.toFixed(3)}s`)

      // Record success/failure for graceful degradation (only for external calls)
      if (!isInternalCall) {
        if (result.success !== false) {
          gracefulDegradationManager.recordSuccess(conversionId)
        } else {
          gracefulDegradationManager.recordFailure(conversionId)
        }
      }
      audit.success = result.success !== false
      const structuredErrorCode =
        result &&
        result.error &&
        typeof result.error === 'object' &&
        typeof result.error.code === 'string'
          ? result.error.code
          : null
      audit.errorCode =
        structuredErrorCode ||
        result.errorCode ||
        (result.success === false ? 'CONVERSION_FAILED' : null)
      audit.processExitCode = Number.isFinite(result.processExitCode) ? result.processExitCode : null

      // Preserve standardized ConversionResult from migrated modules (downdoc, …).
      if (isStandardizedSuccess(result) || isStandardizedFailure(result)) {
        const ret = {
          ...result,
          logs: allLogs,
          warnings: Array.isArray(result.warnings) ? result.warnings : [],
          meta:
            result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta)
              ? result.meta
              : {},
        }
        if (typeof ret.duration !== 'number') {
          ret.duration =
            typeof ret.durationMs === 'number' ? ret.durationMs / 1000 : duration
        }
        return ret
      }

      const legacySuccess = result.success !== false
      return {
        success: legacySuccess,
        logs: allLogs,
        error: legacySuccess
          ? null
          : coerceOrchestratorError(
            result.error,
            result.errorCode || audit.errorCode || null,
            { stage: 'converter-legacy' }
          ),
        errorCode: legacySuccess
          ? null
          : (result.errorCode || audit.errorCode || null),
        duration: duration
      }

    } catch (error) {
      // Secure error handling: exhaustive capture
      const duration = (Date.now() - startTime) / 1000

      if (isSecurityError(error)) {
        logs.push(`[${conversionId}] Security validation failed: ${error.code}`)
        audit.errorCode = error.code
        return {
          success: false,
          logs: logs,
          error: coerceOrchestratorError(error.message, error.code, {
            stage: 'converter-security',
          }),
          errorCode: error.code,
          duration: duration
        }
      }

      logs.push(`[${conversionId}] Unexpected error in orchestrator: ${error.message}`)
      audit.errorCode = 'INTERNAL_ERROR'

      // Record failure for graceful degradation (only for external calls)
      if (!isInternalCall) {
        gracefulDegradationManager.recordFailure(conversionId)
      }

      return makeOrchestratorFailure({
        code: 'INTERNAL_ERROR',
        message: `Orchestrator error: ${error.message}`,
        logs,
        duration,
        details: { stage: 'converter-unexpected' },
      })
    } finally {
      audit.endTimestamp = new Date().toISOString()
      audit.durationMs = Date.now() - startTime
      writeConversionAuditLog(audit)
      // Release concurrency slot + budget (only for external calls)
      if (!isInternalCall) {
        if (slotAcquired) {
          logs.push(`[${conversionId}] Releasing concurrency slot...`)
          concurrencyController.releaseSlot(conversionId)
          logs.push(`[${conversionId}] Concurrency slot released`)
        }
        resourceBudgetManager.releaseBudget(conversionId)
      }
    }
  }

  /**
   * Executes a command-type converter (e.g., Pandoc)
   * This method is used for converters that require external command execution
   * @param {string} converterName - Converter name
   * @param {Object} converterConfig - Converter configuration
   * @param {string} inputPath - Input file path
   * @param {string} outputPath - Output file path
   * @param {string} fromFormat - Source format
   * @param {string} toFormat - Destination format
   * @param {string} conversionId - Conversion ID
   * @param {Object} options - Conversion options
   * @returns {Promise<ModuleResult>} Conversion result
   */
  async executeCommandConverter(converterName, converterConfig, inputPath, outputPath, fromFormat, toFormat, conversionId, options) {
    const startTime = Date.now()
    const logs = []
    const normalizedFrom = (fromFormat || '').toLowerCase()
    const normalizedTo = (toFormat || '').toLowerCase()

    try {
      // For Pandoc, use whitelist and secure execution → native ConversionResult
      if (converterName === 'pandoc') {
        const pandocPath = converterConfig.binaryPath
        const isBareCommand =
          typeof pandocPath === 'string' &&
          !path.isAbsolute(pandocPath) &&
          !pandocPath.includes('/') &&
          !pandocPath.includes('\\')
        if (!isBareCommand && !existsSync(pandocPath)) {
          const message = `Pandoc binary not found at ${pandocPath}`
          logs.push(`[${conversionId}] ${message}`)
          return createPandocResult({
            success: false,
            conversionId,
            startTime,
            logs,
            inputPath,
            outputPath,
            fromFormat: normalizedFrom,
            toFormat: normalizedTo,
            errorCode: 'INTERNAL_ERROR',
            message,
            details: { stage: 'pandoc-binary', pandocPath },
          })
        }

        // Pandoc conversion whitelist (copied from secure-converter.js)
        const CONVERSION_WHITELIST = {
          'markdown_asciidoc': ['-f', 'markdown', '-t', 'asciidoc'],
          'markdown_html': ['-f', 'markdown', '-t', 'html'],
          'markdown_pdf': ['-f', 'markdown', '-t', 'pdf'],
          'markdown_txt': ['-f', 'markdown', '-t', 'plain'],
          'markdown_yaml': ['-f', 'markdown', '-t', 'yaml'],
          'markdown_json': ['-f', 'markdown', '-t', 'json'],
          'asciidoc_markdown': ['-f', 'asciidoc', '-t', 'markdown'],
          'asciidoc_html': ['-f', 'asciidoc', '-t', 'html'],
          'asciidoc_pdf': ['-f', 'asciidoc', '-t', 'pdf'],
          'asciidoc_txt': ['-f', 'asciidoc', '-t', 'plain'],
          'html_markdown': ['-f', 'html', '-t', 'markdown'],
          'html_asciidoc': ['-f', 'html', '-t', 'asciidoc'],
          'html_pdf': ['-f', 'html', '-t', 'pdf'],
          'html_txt': ['-f', 'html', '-t', 'plain'],
          'txt_markdown': ['-f', 'markdown', '-t', 'markdown'],
          'txt_asciidoc': ['-f', 'markdown', '-t', 'asciidoc'],
          'txt_html': ['-f', 'markdown', '-t', 'html'],
          'yaml_markdown': ['-f', 'yaml', '-t', 'markdown'],
          'yaml_asciidoc': ['-f', 'yaml', '-t', 'asciidoc'],
          'yaml_json': ['-f', 'yaml', '-t', 'json'],
          'json_markdown': ['-f', 'json', '-t', 'markdown'],
          'json_asciidoc': ['-f', 'json', '-t', 'asciidoc'],
          'json_yaml': ['-f', 'json', '-t', 'yaml']
        }

        const conversionKey = `${normalizedFrom}_${normalizedTo}`
        const pandocArgs = CONVERSION_WHITELIST[conversionKey]

        if (!pandocArgs) {
          const message = `Conversion ${fromFormat} → ${toFormat} not in Pandoc whitelist`
          logs.push(`[${conversionId}] ${message}`)
          return createPandocResult({
            success: false,
            conversionId,
            startTime,
            logs,
            inputPath,
            outputPath,
            fromFormat: normalizedFrom,
            toFormat: normalizedTo,
            errorCode: 'FORMAT_UNSUPPORTED',
            message,
            details: { stage: 'pandoc-whitelist', conversionKey },
          })
        }

        const args = [
          ...pandocArgs,
          '-o', outputPath,
          inputPath
        ]

        logs.push(`[${conversionId}] Executing Pandoc command...`)
        logs.push(`[${conversionId}] Command: ${pandocPath} ${args.join(' ')}`)

        const timeout = options.timeout || 30000
        const processResult = await safeSpawn(pandocPath, args, {
          cwd: path.dirname(inputPath),
          timeoutMs: timeout
        })

        if (processResult.code !== 0) {
          const message = `Pandoc conversion failed (exit ${processResult.code})`
          logs.push(`[${conversionId}] Pandoc exited with code ${processResult.code}`)
          return createPandocResult({
            success: false,
            conversionId,
            startTime,
            logs,
            inputPath,
            outputPath,
            fromFormat: normalizedFrom,
            toFormat: normalizedTo,
            errorCode: 'CONVERSION_FAILED',
            message,
            details: { stage: 'pandoc-process', exitCode: processResult.code },
            processExitCode: processResult.code,
          })
        }

        if (!existsSync(outputPath)) {
          const message = 'Output file was not created by Pandoc'
          logs.push(`[${conversionId}] ${message}`)
          return createPandocResult({
            success: false,
            conversionId,
            startTime,
            logs,
            inputPath,
            outputPath,
            fromFormat: normalizedFrom,
            toFormat: normalizedTo,
            errorCode: 'OUTPUT_NOT_CREATED',
            message,
            details: { stage: 'pandoc-output' },
            processExitCode: processResult.code,
          })
        }

        logs.push(`[${conversionId}] Pandoc conversion successful`)
        return createPandocResult({
          success: true,
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          fromFormat: normalizedFrom,
          toFormat: normalizedTo,
          processExitCode: processResult.code,
        })
      }

      // Other command-type converters (to be implemented if necessary)
      const message = `Command converter '${converterName}' not yet implemented`
      logs.push(`[${conversionId}] ${message}`)
      return makeOrchestratorFailure({
        code: 'FORMAT_UNSUPPORTED',
        message,
        logs,
        duration: (Date.now() - startTime) / 1000,
        details: { stage: 'command-converter', converterName },
      })
    } catch (error) {
      if (isSecurityError(error) && error.code === SECURITY_ERROR_CODES.CONVERSION_TIMEOUT) {
        logs.push(`[${conversionId}] Command timeout`)
        return createPandocResult({
          success: false,
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          fromFormat: normalizedFrom,
          toFormat: normalizedTo,
          errorCode: 'CONVERSION_TIMEOUT',
          message: 'Command execution timeout',
          details: { stage: 'pandoc-timeout' },
          recoverable: true,
        })
      }
      logs.push(`[${conversionId}] Command execution failed: ${error.message || error}`)
      return createPandocResult({
        success: false,
        conversionId,
        startTime,
        logs,
        inputPath,
        outputPath,
        fromFormat: normalizedFrom,
        toFormat: normalizedTo,
        errorCode: 'CONVERSION_FAILED',
        message: error.message || 'Command execution error',
        details: { stage: 'pandoc-unexpected' },
      })
    }
  }

  /**
   * Gets the list of supported conversions
   * @returns {Array} List of supported conversions with their converter
   */
  getSupportedConversions() {
    const conversions = []

    for (const [converterName, converterConfig] of Object.entries(this.converters)) {
      for (const fromFormat of converterConfig.supportedFormats.from) {
        for (const toFormat of converterConfig.supportedFormats.to) {
          conversions.push({
            from: fromFormat,
            to: toFormat,
            converter: converterName
          })
        }
      }
    }

    return conversions
  }

  /**
   * Gets the list of registered converters
   * @returns {Array} List of converter names
   */
  getAvailableConverters() {
    return Object.keys(this.converters)
  }

  /**
   * Checks if a conversion is supported
   * @param {string} fromFormat - Source format
   * @param {string} toFormat - Destination format
   * @returns {boolean} true if conversion is supported
   */
  isConversionSupported(fromFormat, toFormat) {
    return this.findConverter(fromFormat, toFormat) !== null
  }
}

// ============================================================================
// INSTANCE GLOBALE
// ============================================================================

const converterOrchestrator = new ConverterOrchestrator()

// ============================================================================
// INTERFACE UNIFORME
// ============================================================================

/**
 * Main interface to execute a conversion
 * This function automatically identifies the appropriate converter and executes it
 * 
 * @param {string} inputPath - Absolute path to input file
 * @param {string} outputPath - Absolute path to output file
 * @param {string} fromFormat - Source format
 * @param {string} toFormat - Destination format
 * @param {Object} options - Conversion options
 * @returns {Promise<ModuleResult>} Conversion result
 */
async function executeConversion(inputPath, outputPath, fromFormat, toFormat, options = {}) {
  return await converterOrchestrator.executeConversion(
    inputPath,
    outputPath,
    fromFormat,
    toFormat,
    options
  )
}

/**
 * Gets the list of supported conversions
 * @returns {Array} List of supported conversions
 */
function getSupportedConversions() {
  return converterOrchestrator.getSupportedConversions()
}

/**
 * Gets the list of available converters
 * @returns {Array} List of converter names
 */
function getAvailableConverters() {
  return converterOrchestrator.getAvailableConverters()
}

/**
 * Checks if a conversion is supported
 * @param {string} fromFormat - Source format
 * @param {string} toFormat - Destination format
 * @returns {boolean} true if conversion is supported
 */
function isConversionSupported(fromFormat, toFormat) {
  return converterOrchestrator.isConversionSupported(fromFormat, toFormat)
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main interface
  executeConversion,
  getSupportedConversions,
  getAvailableConverters,
  isConversionSupported,
  
  // Internal orchestrator (for advanced access if needed)
  converterOrchestrator
}
