'use strict'

/**
 * LINEAR CONVERSION ORCHESTRATOR
 * 
 * Mini-orchestrator that manages a linear conversion flow by chaining multiple modules
 * in sequence. This module creates a temporary directory for each conversion, executes
 * modules one after another, and ensures cleanup even on errors.
 * 
 * References:
 * - modules.interface.md: Module interface contract
 * - lazyload.module.js: Lazy loading module
 * - converter-orchestrator.module.js: Converter registry
 * - PIPELINE.md: Conversion pipeline specification
 */

const path = require('path')
const { mkdirSync, rmSync, existsSync, copyFileSync, readFileSync } = require('fs')
const { tmpdir } = require('os')
const { randomUUID } = require('crypto')
const { runConverter } = require('./lazyload.module.js')
const { executeConversion, isConversionSupported } = require('./converter-orchestrator.module.js')

// Import pipeline security for load control
const {
  concurrencyController,
  gracefulDegradationManager,
  resourceBudgetManager
} = require('../security/pipeline-security.js')

// ============================================================================
// CONFIGURATION
// ============================================================================

const ORCHESTRATOR_CONFIG = {
  // Root directory for temporary conversion directories
  TEMP_ROOT: path.join(tmpdir(), 'ascend-orchestrator'),
  
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
// TEMPORARY DIRECTORY MANAGER
// ============================================================================

/**
 * Manages temporary directory for a conversion
 */
class TempDirectoryManager {
  constructor(conversionId) {
    this.conversionId = conversionId || randomUUID()
    this.workDir = null
  }

  /**
   * Creates isolated work directory for this conversion
   * @returns {string} Absolute path to work directory
   */
  createWorkDirectory() {
    // Create root directory if it doesn't exist
    if (!existsSync(ORCHESTRATOR_CONFIG.TEMP_ROOT)) {
      mkdirSync(ORCHESTRATOR_CONFIG.TEMP_ROOT, { recursive: true, mode: 0o700 })
    }

    // Create unique directory for this conversion
    this.workDir = path.join(ORCHESTRATOR_CONFIG.TEMP_ROOT, this.conversionId)
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
      throw new Error('Work directory not created. Call createWorkDirectory() first.')
    }
    return path.join(this.workDir, filename)
  }

  /**
   * Cleans up the temporary directory
   * @returns {boolean} true if cleanup succeeded
   */
  cleanup() {
    if (this.workDir && existsSync(this.workDir)) {
      try {
        rmSync(this.workDir, { recursive: true, force: true })
        return true
      } catch (error) {
        // Log but don't throw - cleanup errors shouldn't break the flow
        console.error(`[${this.conversionId}] Failed to cleanup temp directory: ${error.message}`)
        return false
      }
    }
    return true
  }

  /**
   * Gets the work directory path
   * @returns {string|null} Work directory path or null if not created
   */
  getWorkDirectory() {
    return this.workDir
  }
}

// ============================================================================
// LINEAR ORCHESTRATOR
// ============================================================================

/**
 * Linear conversion orchestrator
 * Executes modules in sequence to convert from source to target format
 */
class LinearOrchestrator {
  constructor() {
    this.tempManager = null
  }

  /**
   * Executes a linear conversion flow
   * @param {string} inputFilePath - Path to source file
   * @param {string} sourceFormat - Source format
   * @param {string} targetFormat - Target format
   * @param {Object} options - Conversion options
   * @returns {Promise<ModuleResult>} Conversion result
   */
  async execute(inputFilePath, sourceFormat, targetFormat, options = {}) {
    const conversionId = options.conversionId || randomUUID()
    const startTime = Date.now()
    const logs = []

    // Initialize temp directory manager
    this.tempManager = new TempDirectoryManager(conversionId)

    try {
      // Minimal logging: start
      logs.push(`[${conversionId}] Linear orchestrator started`)
      logs.push(`[${conversionId}] Source: ${sourceFormat} → Target: ${targetFormat}`)
      logs.push(`[${conversionId}] Input file: ${path.basename(inputFilePath)}`)

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

      // Step 1: Validate input file exists
      if (!existsSync(inputFilePath)) {
        const duration = (Date.now() - startTime) / 1000
        const error = `Input file not found: ${inputFilePath}`
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

      // Step 3: Create temporary directory
      logs.push(`[${conversionId}] Creating temporary directory...`)
      const workDir = this.tempManager.createWorkDirectory()
      logs.push(`[${conversionId}] Temporary directory: ${workDir}`)

      // Step 4: Copy input file to temp directory
      const normalizedSource = sourceFormat.toLowerCase()
      const sourceExt = normalizedSource === 'asciidoc' ? 'adoc' : normalizedSource
      const firstInputFile = this.tempManager.getFilePath(`step0_input.${sourceExt}`)
      copyFileSync(inputFilePath, firstInputFile)
      logs.push(`[${conversionId}] Input file copied to temp directory`)

      // Step 5: Execute conversion steps in sequence
      let currentInputFile = firstInputFile
      let currentFormat = normalizedSource

      for (let i = 0; i < conversionPath.length; i++) {
        const step = conversionPath[i]
        const stepNumber = i + 1
        const isLastStep = (i === conversionPath.length - 1)

        logs.push(`[${conversionId}] Executing step ${stepNumber}/${conversionPath.length}: ${step.from} → ${step.to}`)

        // Determine file extensions
        const fromExt = step.from === 'asciidoc' ? 'adoc' : step.from
        const toExt = step.to === 'asciidoc' ? 'adoc' : (step.to === 'txt' ? 'txt' : step.to)

        // Set output file path
        const outputFile = isLastStep
          ? this.tempManager.getFilePath(`final_output.${toExt}`)
          : this.tempManager.getFilePath(`step${stepNumber}_output.${toExt}`)

        // Execute conversion using converter-orchestrator
        // Mark as internal call to avoid double load control
        const stepResult = await executeConversion(
          currentInputFile,
          outputFile,
          step.from,
          step.to,
          {
            ...options,
            conversionId: `${conversionId}-step${stepNumber}`,
            _internal: true // Flag to indicate internal call (load control managed by linear orchestrator)
          }
        )

        // Merge step logs
        if (Array.isArray(stepResult.logs)) {
          logs.push(...stepResult.logs)
        } else if (typeof stepResult.logs === 'string') {
          logs.push(stepResult.logs)
        }

        // Check if step succeeded
        if (!stepResult.success) {
          const duration = (Date.now() - startTime) / 1000
          logs.push(`[${conversionId}] Step ${stepNumber} failed: ${stepResult.error}`)
          
          // Record failure for graceful degradation
          gracefulDegradationManager.recordFailure(conversionId)
          
          return {
            success: false,
            logs: logs,
            error: `Step ${stepNumber} failed: ${stepResult.error}`,
            duration: duration
          }
        }

        logs.push(`[${conversionId}] Step ${stepNumber} completed successfully`)

        // Update for next iteration
        currentInputFile = outputFile
        currentFormat = step.to
      }

      // Step 6: Read final result
      const normalizedTarget = targetFormat.toLowerCase()
      const targetExt = normalizedTarget === 'asciidoc' ? 'adoc' : (normalizedTarget === 'txt' ? 'txt' : normalizedTarget)
      const finalOutputFile = this.tempManager.getFilePath(`final_output.${targetExt}`)
      
      if (!existsSync(finalOutputFile)) {
        const duration = (Date.now() - startTime) / 1000
        const error = 'Final output file was not created'
        logs.push(`[${conversionId}] ${error}`)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
      }

      const finalContent = readFileSync(finalOutputFile, 'utf8')
      logs.push(`[${conversionId}] Final output file read (${finalContent.length} characters)`)

      // Step 7: Record success for graceful degradation
      gracefulDegradationManager.recordSuccess(conversionId)
      logs.push(`[${conversionId}] Success recorded for load monitoring`)

      // Step 8: Return success result
      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Linear conversion completed successfully`)
      logs.push(`[${conversionId}] Total duration: ${duration.toFixed(3)}s`)
      logs.push(`[${conversionId}] Steps executed: ${conversionPath.length}`)

      return {
        success: true,
        logs: logs,
        error: null,
        duration: duration,
        // Additional info for orchestrator
        outputFile: finalOutputFile,
        outputContent: finalContent,
        stepsExecuted: conversionPath.length
      }

    } catch (error) {
      // Secure error handling: exhaustive capture
      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Unexpected error in linear orchestrator: ${error.message}`)

      // Record failure for graceful degradation
      gracefulDegradationManager.recordFailure(conversionId)

      return {
        success: false,
        logs: logs,
        error: `Orchestrator error: ${error.message}`,
        duration: duration
      }
    } finally {
      // Step 8: Always release concurrency slot
      logs.push(`[${conversionId}] Releasing concurrency slot...`)
      concurrencyController.releaseSlot(conversionId)
      logs.push(`[${conversionId}] Concurrency slot released`)

      // Step 9: Always cleanup temporary directory
      logs.push(`[${conversionId}] Cleaning up temporary directory...`)
      const cleanupSuccess = this.tempManager.cleanup()
      if (cleanupSuccess) {
        logs.push(`[${conversionId}] Temporary directory cleaned up successfully`)
      } else {
        logs.push(`[${conversionId}] Warning: Temporary directory cleanup failed`)
      }
    }
  }
}

// ============================================================================
// INSTANCE GLOBALE
// ============================================================================

const linearOrchestrator = new LinearOrchestrator()

// ============================================================================
// INTERFACE UNIFORME
// ============================================================================

/**
 * Main interface to execute a linear conversion flow
 * 
 * @param {string} inputFilePath - Path to source file
 * @param {string} sourceFormat - Source format
 * @param {string} targetFormat - Target format
 * @param {Object} options - Conversion options
 * @returns {Promise<ModuleResult>} Conversion result
 */
async function executeLinearConversion(inputFilePath, sourceFormat, targetFormat, options = {}) {
  return await linearOrchestrator.execute(inputFilePath, sourceFormat, targetFormat, options)
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main interface
  executeLinearConversion,
  
  // Internal orchestrator (for advanced access if needed)
  linearOrchestrator,
  
  // Utility functions
  findConversionPath
}
