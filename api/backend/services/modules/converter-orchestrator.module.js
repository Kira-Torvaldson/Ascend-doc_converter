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
const { spawn } = require('child_process')
const { existsSync } = require('fs')

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
    modulePath: path.join(MODULES_DIR, 'downdoc.module.js')
  },
  'pandoc': {
    name: 'pandoc',
    supportedFormats: {
      from: ['markdown', 'asciidoc', 'html', 'txt', 'yaml', 'json'],
      to: ['markdown', 'asciidoc', 'html', 'pdf', 'txt', 'yaml', 'json']
    },
    executionType: 'command', // Uses child_process.spawn directly
    binaryPath: (() => {
      // Use EnvMap if available, fallback to process.env for backward compatibility
      try {
        const { envMap } = require('../config/envmap.module.js')
        return envMap.get('PANDOC_PATH')
      } catch (e) {
        return process.env.PANDOC_PATH || '/usr/bin/pandoc'
      }
    })()
  },
  'text2markdown': {
    name: 'text2markdown',
    supportedFormats: {
      from: ['txt'],
      to: ['markdown']
    },
    executionType: 'lazy-load', // Uses lazy loading (to be created)
    modulePath: path.join(MODULES_DIR, 'text2markdown.module.js')
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
          const error = `Concurrency limit reached: ${slotAcquisition.message || 'Maximum concurrent conversions reached'}`
          logs.push(`[${conversionId}] ${error}`)
          
          return {
            success: false,
            logs: logs,
            error: error,
            duration: duration
          }
        }
        slotAcquired = true
        logs.push(`[${conversionId}] Concurrency slot acquired`)

        // Initialize resource budget
        resourceBudgetManager.initializeBudget(conversionId)
        logs.push(`[${conversionId}] Resource budget initialized`)
      } else {
        logs.push(`[${conversionId}] Internal call - load control managed by linear orchestrator`)
      }

      // Step 1: Find the appropriate converter
      const converter = this.findConverter(fromFormat, toFormat)

      if (!converter) {
        const duration = (Date.now() - startTime) / 1000
        const error = `No converter found for conversion ${fromFormat} → ${toFormat}. Available converters: ${Object.keys(this.converters).join(', ')}`
        logs.push(`[${conversionId}] ${error}`)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
      }

      logs.push(`[${conversionId}] Converter found: ${converter.name}`)
      logs.push(`[${conversionId}] Execution type: ${converter.config.executionType}`)

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
        const error = `Unknown execution type: ${converter.config.executionType}`
        logs.push(`[${conversionId}] ${error}`)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
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

      return {
        success: result.success !== false, // Ensure success is a boolean
        logs: allLogs,
        error: result.error || null,
        duration: duration
      }

    } catch (error) {
      // Secure error handling: exhaustive capture
      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Unexpected error in orchestrator: ${error.message}`)

      // Record failure for graceful degradation (only for external calls)
      if (!isInternalCall) {
        gracefulDegradationManager.recordFailure(conversionId)
      }

      return {
        success: false,
        logs: logs,
        error: `Orchestrator error: ${error.message}`,
        duration: duration
      }
    } finally {
      // Release concurrency slot (only for external calls)
      if (!isInternalCall && slotAcquired) {
        logs.push(`[${conversionId}] Releasing concurrency slot...`)
        concurrencyController.releaseSlot(conversionId)
        logs.push(`[${conversionId}] Concurrency slot released`)
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

    try {
      // For Pandoc, use whitelist and secure execution
      if (converterName === 'pandoc') {
        const { readFileSync, writeFileSync } = require('fs')
        const path = require('path')
        
        // Check that Pandoc binary exists
        const pandocPath = converterConfig.binaryPath
        if (!existsSync(pandocPath)) {
          const duration = (Date.now() - startTime) / 1000
          const error = `Pandoc binary not found at ${pandocPath}`
          logs.push(`[${conversionId}] ${error}`)
          
          return {
            success: false,
            logs: logs,
            error: error,
            duration: duration
          }
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

        const normalizedFrom = fromFormat.toLowerCase()
        const normalizedTo = toFormat.toLowerCase()
        const conversionKey = `${normalizedFrom}_${normalizedTo}`
        const pandocArgs = CONVERSION_WHITELIST[conversionKey]

        if (!pandocArgs) {
          const duration = (Date.now() - startTime) / 1000
          const error = `Conversion ${fromFormat} → ${toFormat} not in Pandoc whitelist`
          logs.push(`[${conversionId}] ${error}`)
          
          return {
            success: false,
            logs: logs,
            error: error,
            duration: duration
          }
        }

        // Build arguments securely
        const args = [
          ...pandocArgs,
          '-o', outputPath,
          inputPath
        ]

        logs.push(`[${conversionId}] Executing Pandoc command...`)
        logs.push(`[${conversionId}] Command: ${pandocPath} ${args.join(' ')}`)

        // Execute Pandoc with spawn (never exec or execSync)
        const pandoc = spawn(pandocPath, args, {
          cwd: path.dirname(inputPath),
          stdio: ['ignore', 'pipe', 'pipe']
        })

        let stdout = ''
        let stderr = ''
        const timeout = options.timeout || 30000
        let timeoutId = null
        let processKilled = false

        // Capture stdout and stderr
        pandoc.stdout.on('data', (data) => {
          stdout += data.toString()
        })

        pandoc.stderr.on('data', (data) => {
          stderr += data.toString()
        })

        // Timeout handling
        timeoutId = setTimeout(() => {
          if (!pandoc.killed) {
            processKilled = true
            logs.push(`[${conversionId}] Process timeout after ${timeout}ms`)
            pandoc.kill('SIGTERM')
            
            setTimeout(() => {
              if (!pandoc.killed) {
                pandoc.kill('SIGKILL')
              }
            }, 5000)
          }
        }, timeout)

        // Wait for process completion
        await new Promise((resolve, reject) => {
          pandoc.on('close', (code) => {
            clearTimeout(timeoutId)

            if (processKilled) {
              const duration = (Date.now() - startTime) / 1000
              reject(new Error(`Pandoc timeout after ${timeout}ms`))
              return
            }

            if (code !== 0) {
              const errorMessage = stderr || stdout || `Pandoc exited with code ${code}`
              logs.push(`[${conversionId}] Pandoc error: ${errorMessage}`)
              reject(new Error(errorMessage))
              return
            }

            // Check that output file exists
            if (!existsSync(outputPath)) {
              logs.push(`[${conversionId}] Output file was not created`)
              reject(new Error('Output file was not created by Pandoc'))
              return
            }

            resolve()
          })

          pandoc.on('error', (error) => {
            clearTimeout(timeoutId)
            logs.push(`[${conversionId}] Pandoc execution error: ${error.message}`)
            reject(error)
          })
        })

        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Pandoc conversion successful`)
        if (stderr) {
          logs.push(`[${conversionId}] Pandoc stderr: ${stderr}`)
        }
        
        return {
          success: true,
          logs: logs,
          error: null,
          duration: duration
        }
      } else {
        // Other command-type converters (to be implemented if necessary)
        const duration = (Date.now() - startTime) / 1000
        const error = `Command converter '${converterName}' not yet implemented`
        logs.push(`[${conversionId}] ${error}`)
        
        return {
          success: false,
          logs: logs,
          error: error,
          duration: duration
        }
      }
    } catch (error) {
      // Secure error handling
      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Command execution failed: ${error.message}`)

      return {
        success: false,
        logs: logs,
        error: `Command execution error: ${error.message}`,
        duration: duration
      }
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
