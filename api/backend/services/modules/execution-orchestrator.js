'use strict'

/**
 * EXECUTION ORCHESTRATOR
 * 
 * Secondary orchestrator that executes conversion steps sequentially.
 * This orchestrator receives conversion tasks from the main orchestrator,
 * executes modules one after another, and returns results.
 * 
 * References:
 * - modules.interface.md: Module interface contract
 * - lazyload.module.js: Lazy loading module
 * - converter-orchestrator.module.js: Converter registry
 * - main-orchestrator.js: Main orchestrator that delegates tasks
 * - PIPELINE.md: Conversion pipeline specification
 */

const path = require('path')
const { mkdirSync, rmSync, existsSync, copyFileSync, readFileSync, statSync, unlinkSync } = require('fs')
const { tmpdir } = require('os')
const { randomUUID } = require('crypto')
const { executeConversion } = require('./converter-orchestrator.module.js')

// Import structured logger
const {
  addLogMessage,
  recordStep,
  recordOutputFile
} = require('../logging/structured-logger.js')

// ============================================================================
// POST-WRAPPER VALIDATION
// ============================================================================

/**
 * Returns the expected file extension for a target format.
 * Must match the convention used when building output paths (toExt in the loop).
 * @param {string} toFormat - Target format (e.g. 'markdown', 'asciidoc')
 * @returns {string} Extension without leading dot (e.g. 'adoc', 'markdown')
 */
function getExpectedExtension(toFormat) {
  const n = (toFormat || '').toLowerCase()
  if (n === 'asciidoc') return 'adoc'
  if (n === 'txt') return 'txt'
  return n
}

/**
 * Validates wrapper output artifact: exists, size > 0, extension matches expected format.
 * Used in post-wrapper phase only; does not modify files.
 *
 * @param {string} outputPath - Absolute path to the output file
 * @param {string} expectedToFormat - Expected target format (e.g. 'markdown')
 * @returns {{ valid: boolean, reason?: string }}
 */
function validatePostWrapperOutput(outputPath, expectedToFormat) {
  if (!outputPath || typeof outputPath !== 'string') {
    return { valid: false, reason: 'output path missing or invalid' }
  }
  if (!existsSync(outputPath)) {
    return { valid: false, reason: 'output file does not exist' }
  }
  let size
  try {
    size = statSync(outputPath).size
  } catch (_) {
    return { valid: false, reason: 'output file not readable' }
  }
  if (size === 0) {
    return { valid: false, reason: 'output file is empty (0 bytes)' }
  }
  const ext = path.extname(outputPath).toLowerCase().replace(/^\./, '')
  const expectedExt = getExpectedExtension(expectedToFormat)
  if (ext !== expectedExt) {
    return { valid: false, reason: `output type/extension mismatch: got .${ext}, expected .${expectedExt} for format ${expectedToFormat}` }
  }
  return { valid: true }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const EXECUTION_CONFIG = {
  // Root directory for temporary conversion directories
  TEMP_ROOT: path.join(tmpdir(), 'ascend-execution'),
  
  // Maximum number of conversion steps (prevents infinite loops)
  MAX_CONVERSION_STEPS: 10
}

// ============================================================================
// TEMPORARY DIRECTORY MANAGER
// ============================================================================

/**
 * Manages temporary directory for a conversion execution
 */
class ExecutionTempManager {
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
    if (!existsSync(EXECUTION_CONFIG.TEMP_ROOT)) {
      mkdirSync(EXECUTION_CONFIG.TEMP_ROOT, { recursive: true, mode: 0o700 })
    }

    // Create unique directory for this conversion
    this.workDir = path.join(EXECUTION_CONFIG.TEMP_ROOT, this.conversionId)
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
// EXECUTION ORCHESTRATOR
// ============================================================================

/**
 * Execution orchestrator
 * Executes conversion steps sequentially as delegated by main orchestrator
 */
class ExecutionOrchestrator {
  constructor() {
    this.tempManager = null
  }

  /**
   * Executes conversion steps sequentially
   * Called by main orchestrator with conversion path and initial file
   * 
   * @param {string} inputFilePath - Path to source file
   * @param {Array} conversionPath - Array of conversion steps: [{ from, to, converter }]
   * @param {Object} options - Conversion options
   * @returns {Promise<ModuleResult>} Conversion result
   */
  async executeSteps(inputFilePath, conversionPath, options = {}) {
    const conversionId = options.conversionId || randomUUID()
    const startTime = Date.now()
    const logs = []

    // Initialize temp directory manager
    this.tempManager = new ExecutionTempManager(conversionId)

    try {
      // Minimal logging: start
      logs.push(`[${conversionId}] Execution orchestrator started`)
      logs.push(`[${conversionId}] Steps to execute: ${conversionPath.length}`)
      conversionPath.forEach((step, index) => {
        logs.push(`[${conversionId}]   Step ${index + 1}: ${step.from} → ${step.to}`)
      })

      // Step 1: Validate input file exists
      if (!existsSync(inputFilePath)) {
        const duration = (Date.now() - startTime) / 1000
        const error = `Input file not found: ${inputFilePath}`
        logs.push(`[${conversionId}] ${error}`)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
      }

      // ------------------------------------------------------------------------
      // Invariant: No output artifact can be produced from an empty input.
      // Skip all wrappers when input is 0 bytes; do not create any output file.
      // ------------------------------------------------------------------------
      const inputBytes = statSync(inputFilePath).size
      if (inputBytes === 0) {
        const duration = (Date.now() - startTime) / 1000
        const msg = 'Input is empty → conversion skipped → no output produced'
        logs.push(`[${conversionId}] ${msg}`)
        addLogMessage(conversionId, 'info', msg)
        return {
          success: false,
          logs,
          error: msg,
          duration,
          pipelineState: 'empty_input'
        }
      }

      // Step 2: Validate conversion path
      if (!Array.isArray(conversionPath) || conversionPath.length === 0) {
        const duration = (Date.now() - startTime) / 1000
        const error = 'Invalid or empty conversion path'
        logs.push(`[${conversionId}] ${error}`)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
      }

      if (conversionPath.length > EXECUTION_CONFIG.MAX_CONVERSION_STEPS) {
        const duration = (Date.now() - startTime) / 1000
        const error = `Conversion path exceeds maximum steps (${EXECUTION_CONFIG.MAX_CONVERSION_STEPS})`
        logs.push(`[${conversionId}] ${error}`)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
      }

      // Step 3: Create temporary directory
      logs.push(`[${conversionId}] Creating temporary directory...`)
      const workDir = this.tempManager.createWorkDirectory()
      logs.push(`[${conversionId}] Temporary directory: ${workDir}`)

      // Step 4: Copy input file to temp directory
      const firstStep = conversionPath[0]
      const normalizedSource = firstStep.from.toLowerCase()
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
        const stepStartTime = Date.now()
        const stepResult = await executeConversion(
          currentInputFile,
          outputFile,
          step.from,
          step.to,
          {
            ...options,
            conversionId: `${conversionId}-step${stepNumber}`,
            _internal: true // Flag to indicate internal call (load control managed by main orchestrator)
          }
        )
        const stepDuration = ((Date.now() - stepStartTime) / 1000).toFixed(3)

        // Merge step logs
        if (Array.isArray(stepResult.logs)) {
          logs.push(...stepResult.logs)
        } else if (typeof stepResult.logs === 'string') {
          logs.push(stepResult.logs)
        }

        // Check if step (wrapper) reported failure
        if (!stepResult.success) {
          recordStep(conversionId, {
            stepNumber: stepNumber,
            module: step.converter || 'auto',
            fromFormat: step.from,
            toFormat: step.to,
            inputFile: currentInputFile,
            outputFile: outputFile,
            duration: parseFloat(stepDuration),
            status: 'error',
            logs: Array.isArray(stepResult.logs) ? stepResult.logs : [stepResult.logs],
            error: stepResult.error || null
          })
          const duration = (Date.now() - startTime) / 1000
          logs.push(`[${conversionId}] Step ${stepNumber} failed: ${stepResult.error}`)
          addLogMessage(conversionId, 'error', `Step ${stepNumber} failed: ${stepResult.error}`)
          return {
            success: false,
            logs: logs,
            error: `Step ${stepNumber} failed: ${stepResult.error}`,
            duration: duration
          }
        }

        // Post-wrapper validation: exists, size > 0, type/extension matches expected format
        const validation = validatePostWrapperOutput(outputFile, step.to)
        if (!validation.valid) {
          if (existsSync(outputFile)) {
            try { unlinkSync(outputFile) } catch (_) { /* ignore */ }
          }
          const wrapperName = step.converter || `step${stepNumber}`
          const msg = `Wrapper ${wrapperName} failed: output invalid or empty (${validation.reason})`
          logs.push(`[${conversionId}] ${msg}`)
          addLogMessage(conversionId, 'warn', msg)
          recordStep(conversionId, {
            stepNumber: stepNumber,
            module: step.converter || 'auto',
            fromFormat: step.from,
            toFormat: step.to,
            inputFile: currentInputFile,
            outputFile: outputFile,
            duration: parseFloat(stepDuration),
            status: 'wrapper_failed_clean',
            logs: Array.isArray(stepResult.logs) ? stepResult.logs : [stepResult.logs],
            error: validation.reason
          })
          const duration = (Date.now() - startTime) / 1000
          return {
            success: false,
            logs,
            error: msg,
            duration,
            pipelineState: 'wrapper_failed_clean'
          }
        }

        recordStep(conversionId, {
          stepNumber: stepNumber,
          module: step.converter || 'auto',
          fromFormat: step.from,
          toFormat: step.to,
          inputFile: currentInputFile,
          outputFile: outputFile,
          duration: parseFloat(stepDuration),
          status: 'success',
          logs: Array.isArray(stepResult.logs) ? stepResult.logs : [stepResult.logs],
          error: null
        })

        logs.push(`[${conversionId}] Step ${stepNumber} completed successfully`)
        addLogMessage(conversionId, 'info', `Step ${stepNumber} completed successfully in ${stepDuration}s`)

        // Update for next iteration
        currentInputFile = outputFile
        currentFormat = step.to
      }

      // Step 6: Read final result and validate output artifacts
      const lastStep = conversionPath[conversionPath.length - 1]
      const normalizedTarget = lastStep.to.toLowerCase()
      const targetExt = normalizedTarget === 'asciidoc' ? 'adoc' : (normalizedTarget === 'txt' ? 'txt' : normalizedTarget)
      const finalOutputFile = this.tempManager.getFilePath(`final_output.${targetExt}`)

      // ------------------------------------------------------------------------
      // Invariant: A pipeline cannot be successful if no output artifact exists.
      // Collect real output files, require at least one valid artifact (exists, size > 0)
      // before allowing success. Otherwise requalify to no_output.
      // ------------------------------------------------------------------------
      const outputFiles = [finalOutputFile]
      const validArtifacts = outputFiles.filter((f) => {
        if (!existsSync(f)) return false
        try {
          return statSync(f).size > 0
        } catch (_) {
          return false
        }
      })

      if (validArtifacts.length === 0) {
        const duration = (Date.now() - startTime) / 1000
        const msg = 'Pipeline finished without valid output artifact → success forbidden'
        logs.push(`[${conversionId}] ${msg}`)
        addLogMessage(conversionId, 'warn', msg)
        if (existsSync(finalOutputFile) && statSync(finalOutputFile).size === 0) {
          try { unlinkSync(finalOutputFile) } catch (_) { /* ignore */ }
        }
        return {
          success: false,
          logs,
          error: msg,
          duration,
          pipelineState: 'no_output'
        }
      }

      const finalContent = readFileSync(finalOutputFile, 'utf8')
      logs.push(`[${conversionId}] Final output file read (${finalContent.length} characters)`)

      // Record output file in structured log
      recordOutputFile(conversionId, finalOutputFile)
      addLogMessage(conversionId, 'info', `Final output file read: ${finalContent.length} characters`)

      // Step 7: Return success result (only reached when at least one valid artifact exists)
      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Execution completed successfully`)
      logs.push(`[${conversionId}] Total duration: ${duration.toFixed(3)}s`)
      logs.push(`[${conversionId}] Steps executed: ${conversionPath.length}`)
      
      addLogMessage(conversionId, 'info', `Execution completed successfully: ${conversionPath.length} steps in ${duration.toFixed(3)}s`)

      return {
        success: true,
        logs: logs,
        error: null,
        duration: duration,
        // Additional info for orchestrator communication
        outputFile: finalOutputFile,
        outputContent: finalContent,
        stepsExecuted: conversionPath.length,
        workDirectory: workDir
      }

    } catch (error) {
      // Secure error handling: exhaustive capture
      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Unexpected error in execution orchestrator: ${error.message}`)

      return {
        success: false,
        logs: logs,
        error: `Execution error: ${error.message}`,
        duration: duration
      }
    } finally {
      // Step 8: Always cleanup temporary directory
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

const executionOrchestrator = new ExecutionOrchestrator()

// ============================================================================
// INTERFACE UNIFORME
// ============================================================================

/**
 * Main interface to execute conversion steps
 * Called by main orchestrator to execute a conversion path
 * 
 * @param {string} inputFilePath - Path to source file
 * @param {Array} conversionPath - Array of conversion steps: [{ from, to, converter }]
 * @param {Object} options - Conversion options
 * @returns {Promise<ModuleResult>} Conversion result
 */
async function executeConversionSteps(inputFilePath, conversionPath, options = {}) {
  return await executionOrchestrator.executeSteps(inputFilePath, conversionPath, options)
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main interface
  executeConversionSteps,
  
  // Internal orchestrator (for advanced access if needed)
  executionOrchestrator
}
