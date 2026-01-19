'use strict'

/**
 * MAIN ORCHESTRATOR
 * 
 * Primary orchestrator that receives user requests, determines conversion paths,
 * and delegates execution to the execution orchestrator. This orchestrator manages
 * load control, resource allocation, and coordinates communication with the
 * execution orchestrator.
 * 
 * References:
 * - modules.interface.md: Module interface contract
 * - execution-orchestrator.js: Secondary orchestrator for step execution
 * - converter-orchestrator.module.js: Converter registry
 * - PIPELINE.md: Conversion pipeline specification
 */

const path = require('path')
const { writeFileSync, readFileSync, existsSync, unlinkSync } = require('fs')
const { tmpdir } = require('os')
const { randomUUID } = require('crypto')
const { isConversionSupported } = require('./converter-orchestrator.module.js')
const { executeConversionSteps } = require('./execution-orchestrator.js')

// Import pipeline security for load control
const {
  concurrencyController,
  gracefulDegradationManager,
  resourceBudgetManager
} = require('../security/pipeline-security.js')

// Import structured logger
const {
  initializeLog,
  addLogMessage,
  recordInputFile,
  recordOutputFile,
  finalizeLog
} = require('../../logging/structured-logger.js')

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAIN_ORCHESTRATOR_CONFIG = {
  // Root directory for temporary input files
  TEMP_ROOT: path.join(tmpdir(), 'ascend-main'),
  
  // Maximum number of conversion steps (prevents infinite loops)
  MAX_CONVERSION_STEPS: 10
}

// ============================================================================
// CONVERSION PATH FINDER
// ============================================================================

/**
 * Finds a conversion path from source format to target format
 * Uses a simple strategy: direct conversion if available, otherwise via markdown as intermediate
 * 
 * @param {string} sourceFormat - Source format
 * @param {string} targetFormat - Target format
 * @returns {Array} Array of conversion steps: [{ from, to, converter }]
 */
function findConversionPath(sourceFormat, targetFormat) {
  const normalizedSource = sourceFormat.toLowerCase()
  const normalizedTarget = targetFormat.toLowerCase()
  
  const path = []
  
  // Step 1: Try direct conversion
  if (isConversionSupported(normalizedSource, normalizedTarget)) {
    path.push({
      from: normalizedSource,
      to: normalizedTarget,
      converter: 'auto' // Will be determined by converter-orchestrator
    })
    return path
  }
  
  // Step 2: Try via markdown as intermediate format
  // This is a simple strategy - can be extended later
  if (normalizedTarget !== 'markdown' && normalizedSource !== 'markdown') {
    // Try: source -> markdown -> target
    if (isConversionSupported(normalizedSource, 'markdown') &&
        isConversionSupported('markdown', normalizedTarget)) {
      path.push({
        from: normalizedSource,
        to: 'markdown',
        converter: 'auto'
      })
      path.push({
        from: 'markdown',
        to: normalizedTarget,
        converter: 'auto'
      })
      return path
    }
  }
  
  // If no path found, return empty array
  return path
}

// ============================================================================
// TEMPORARY FILE MANAGER
// ============================================================================

/**
 * Manages temporary input file for main orchestrator
 */
class MainTempManager {
  constructor(conversionId) {
    this.conversionId = conversionId || randomUUID()
    this.inputFile = null
  }

  /**
   * Creates temporary input file from content
   * @param {string} content - File content
   * @param {string} format - File format
   * @returns {string} Absolute path to input file
   */
  createInputFile(content, format) {
    // Create root directory if it doesn't exist
    if (!existsSync(MAIN_ORCHESTRATOR_CONFIG.TEMP_ROOT)) {
      const { mkdirSync } = require('fs')
      mkdirSync(MAIN_ORCHESTRATOR_CONFIG.TEMP_ROOT, { recursive: true, mode: 0o700 })
    }

    // Determine file extension
    const normalizedFormat = format.toLowerCase()
    const ext = normalizedFormat === 'asciidoc' ? 'adoc' : normalizedFormat

    // Create unique input file
    this.inputFile = path.join(MAIN_ORCHESTRATOR_CONFIG.TEMP_ROOT, `${this.conversionId}_input.${ext}`)
    writeFileSync(this.inputFile, content, 'utf8')

    return this.inputFile
  }

  /**
   * Cleans up the temporary input file
   * @returns {boolean} true if cleanup succeeded
   */
  cleanup() {
    if (this.inputFile && existsSync(this.inputFile)) {
      try {
        unlinkSync(this.inputFile)
        return true
      } catch (error) {
        // Log but don't throw - cleanup errors shouldn't break the flow
        console.error(`[${this.conversionId}] Failed to cleanup temp input file: ${error.message}`)
        return false
      }
    }
    return true
  }

  /**
   * Gets the input file path
   * @returns {string|null} Input file path or null if not created
   */
  getInputFile() {
    return this.inputFile
  }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Main orchestrator
 * Receives user requests, determines conversion paths, and delegates to execution orchestrator
 */
class MainOrchestrator {
  constructor() {
    this.tempManager = null
  }

  /**
   * Executes a conversion request
   * Receives content and formats, determines path, delegates execution
   * 
   * @param {string} content - Source content to convert
   * @param {string} sourceFormat - Source format
   * @param {string} targetFormat - Target format
   * @param {Object} options - Conversion options
   * @returns {Promise<ModuleResult>} Conversion result
   */
  async execute(content, sourceFormat, targetFormat, options = {}) {
    const conversionId = options.conversionId || randomUUID()
    const startTime = Date.now()
    const logs = []

    // Initialize temp file manager
    this.tempManager = new MainTempManager(conversionId)

    // Initialize structured log
    initializeLog(conversionId, sourceFormat, targetFormat, {
      contentSize: content.length,
      userAgent: options.userAgent,
      ipAddress: options.ipAddress
    })
    addLogMessage(conversionId, 'info', 'Main orchestrator started')

    try {
      // Minimal logging: start
      logs.push(`[${conversionId}] Main orchestrator started`)
      logs.push(`[${conversionId}] Source: ${sourceFormat} → Target: ${targetFormat}`)
      logs.push(`[${conversionId}] Content size: ${content.length} characters`)
      
      addLogMessage(conversionId, 'info', `Source: ${sourceFormat} → Target: ${targetFormat}`)
      addLogMessage(conversionId, 'info', `Content size: ${content.length} characters`)

      // Step 0: Load control - Check system overload before starting
      logs.push(`[${conversionId}] Checking system load...`)
      const canAccept = gracefulDegradationManager.canAcceptNewConversion()
      if (!canAccept.canAccept) {
        const duration = (Date.now() - startTime) / 1000
        const error = `System overloaded: ${canAccept.message || 'System is temporarily overloaded'}`
        logs.push(`[${conversionId}] ${error}`)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
      }

      // Step 0.1: Acquire concurrency slot
      logs.push(`[${conversionId}] Acquiring concurrency slot...`)
      const slotAcquisition = concurrencyController.acquireSlot(conversionId)
      if (!slotAcquisition.allowed) {
        const duration = (Date.now() - startTime) / 1000
        const error = `Concurrency limit reached: ${slotAcquisition.message || 'Maximum concurrent conversions reached'}`
        logs.push(`[${conversionId}] ${error}`)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
      }
      logs.push(`[${conversionId}] Concurrency slot acquired`)

      // Step 0.2: Initialize resource budget
      resourceBudgetManager.initializeBudget(conversionId)
      logs.push(`[${conversionId}] Resource budget initialized`)

      // Step 1: Validate content
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        const duration = (Date.now() - startTime) / 1000
        const error = 'Content is empty or invalid'
        logs.push(`[${conversionId}] ${error}`)
        
        // Release slot on early failure
        concurrencyController.releaseSlot(conversionId)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
      }

      // Step 2: Find conversion path
      logs.push(`[${conversionId}] Finding conversion path...`)
      const conversionPath = findConversionPath(sourceFormat, targetFormat)

      if (conversionPath.length === 0) {
        const duration = (Date.now() - startTime) / 1000
        const error = `No conversion path found from ${sourceFormat} to ${targetFormat}`
        logs.push(`[${conversionId}] ${error}`)
        
        // Release slot on early failure
        concurrencyController.releaseSlot(conversionId)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
      }

      logs.push(`[${conversionId}] Conversion path: ${conversionPath.length} step(s)`)
      conversionPath.forEach((step, index) => {
        logs.push(`[${conversionId}]   Step ${index + 1}: ${step.from} → ${step.to}`)
      })

      // Step 3: Create temporary input file
      logs.push(`[${conversionId}] Creating temporary input file...`)
      const inputFilePath = this.tempManager.createInputFile(content, sourceFormat)
      logs.push(`[${conversionId}] Temporary input file: ${inputFilePath}`)
      
      // Record input file in structured log
      recordInputFile(conversionId, inputFilePath)
      addLogMessage(conversionId, 'info', `Temporary input file created: ${path.basename(inputFilePath)}`)

      // Step 4: Delegate execution to execution orchestrator
      logs.push(`[${conversionId}] Delegating to execution orchestrator...`)
      const executionResult = await executeConversionSteps(
        inputFilePath,
        conversionPath,
        {
          ...options,
          conversionId: conversionId
        }
      )

      // Step 5: Merge execution logs
      if (Array.isArray(executionResult.logs)) {
        logs.push(...executionResult.logs)
      } else if (typeof executionResult.logs === 'string') {
        logs.push(executionResult.logs)
      }

      // Step 6: Check execution result
      if (!executionResult.success) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Execution failed: ${executionResult.error}`)
        
        // Record failure in structured log
        addLogMessage(conversionId, 'error', `Execution failed: ${executionResult.error}`)
        finalizeLog(conversionId, 'error', {
          totalDuration: duration,
          error: executionResult.error
        })
        
        // Record failure for graceful degradation
        gracefulDegradationManager.recordFailure(conversionId)
        
        return {
          success: false,
          logs: logs,
          error: `Execution failed: ${executionResult.error}`,
          duration: duration
        }
      }

      // Step 7: Record success and return result
      gracefulDegradationManager.recordSuccess(conversionId)
      logs.push(`[${conversionId}] Success recorded for load monitoring`)

      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Main orchestrator completed successfully`)
      logs.push(`[${conversionId}] Total duration: ${duration.toFixed(3)}s`)
      
      // Record success in structured log
      if (executionResult.outputContent) {
        addLogMessage(conversionId, 'info', `Output content generated: ${executionResult.outputContent.length} characters`)
      }
      addLogMessage(conversionId, 'info', `Main orchestrator completed successfully`)
      finalizeLog(conversionId, 'success', {
        totalDuration: duration,
        stepsExecuted: executionResult.stepsExecuted
      })

      return {
        success: true,
        logs: logs,
        error: null,
        duration: duration,
        // Additional info from execution orchestrator
        outputContent: executionResult.outputContent,
        stepsExecuted: executionResult.stepsExecuted
      }

    } catch (error) {
      // Secure error handling: exhaustive capture
      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Unexpected error in main orchestrator: ${error.message}`)

      // Record error in structured log
      addLogMessage(conversionId, 'error', `Unexpected error: ${error.message}`)
      finalizeLog(conversionId, 'error', {
        totalDuration: duration,
        error: error.message
      })

      // Record failure for graceful degradation
      gracefulDegradationManager.recordFailure(conversionId)

      return {
        success: false,
        logs: logs,
        error: `Main orchestrator error: ${error.message}`,
        duration: duration
      }
    } finally {
      // Step 8: Always release concurrency slot
      logs.push(`[${conversionId}] Releasing concurrency slot...`)
      concurrencyController.releaseSlot(conversionId)
      logs.push(`[${conversionId}] Concurrency slot released`)

      // Step 9: Always cleanup temporary input file
      logs.push(`[${conversionId}] Cleaning up temporary input file...`)
      const cleanupSuccess = this.tempManager.cleanup()
      if (cleanupSuccess) {
        logs.push(`[${conversionId}] Temporary input file cleaned up successfully`)
      } else {
        logs.push(`[${conversionId}] Warning: Temporary input file cleanup failed`)
      }
    }
  }
}

// ============================================================================
// INSTANCE GLOBALE
// ============================================================================

const mainOrchestrator = new MainOrchestrator()

// ============================================================================
// INTERFACE UNIFORME
// ============================================================================

/**
 * Main interface to execute a conversion request
 * Receives content and formats, determines path, delegates execution
 * 
 * @param {string} content - Source content to convert
 * @param {string} sourceFormat - Source format
 * @param {string} targetFormat - Target format
 * @param {Object} options - Conversion options
 * @returns {Promise<ModuleResult>} Conversion result
 */
async function executeConversionRequest(content, sourceFormat, targetFormat, options = {}) {
  return await mainOrchestrator.execute(content, sourceFormat, targetFormat, options)
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main interface
  executeConversionRequest,
  
  // Internal orchestrator (for advanced access if needed)
  mainOrchestrator,
  
  // Utility functions
  findConversionPath
}
