'use strict'

/**
 * STRUCTURED LOGGER MODULE
 * 
 * Module that generates structured JSON logs for each conversion.
 * Logs are stored in a controlled directory and accessible via API endpoint.
 * 
 * References:
 * - PIPELINE.md: Conversion pipeline specification
 * - modules.interface.md: Module interface contract
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

// ============================================================================
// CONFIGURATION
// ============================================================================

// Import EnvMap for secure configuration access
let envMap = null
try {
  envMap = require('../config/envmap.module.js').envMap
} catch (e) {
  // Fallback if EnvMap not available (backward compatibility)
  envMap = null
}

const LOGGER_CONFIG = {
  // Root directory for logs (relative to api directory)
  LOGS_DIR: envMap ? envMap.get('LOGS_DIR') : (process.env.LOGS_DIR || path.join(__dirname, '../../../logs')),
  
  // Maximum log file size (in bytes) - 10 MB default
  MAX_LOG_SIZE: envMap ? envMap.get('MAX_LOG_SIZE') : parseInt(process.env.MAX_LOG_SIZE || '10485760', 10),
  
  // Log retention period (in days) - 30 days default
  RETENTION_DAYS: envMap ? envMap.get('LOG_RETENTION_DAYS') : parseInt(process.env.LOG_RETENTION_DAYS || '30', 10)
}

// ============================================================================
// LOG STRUCTURE
// ============================================================================

/**
 * Creates initial log structure for a conversion
 * @param {string} conversionId - Unique conversion ID
 * @param {string} sourceFormat - Source format
 * @param {string} targetFormat - Target format
 * @param {Object} options - Conversion options
 * @returns {Object} Initial log structure
 */
function createLogStructure(conversionId, sourceFormat, targetFormat, options = {}) {
  return {
    conversionId: conversionId,
    timestamp: {
      start: new Date().toISOString(),
      end: null
    },
    formats: {
      source: sourceFormat,
      target: targetFormat
    },
    status: 'running', // running, success, error
    execution: {
      steps: [], // Array of step executions
      totalDuration: null,
      modulesExecuted: []
    },
    files: {
      input: null,
      output: null,
      intermediate: [] // Array of intermediate files
    },
    logs: [], // Detailed log messages
    error: null, // Error message if failed
    metadata: {
      userAgent: options.userAgent || null,
      ipAddress: options.ipAddress || null,
      contentSize: options.contentSize || null
    }
  }
}

// ============================================================================
// STRUCTURED LOGGER
// ============================================================================

/**
 * Structured logger for conversion pipeline
 */
class StructuredLogger {
  constructor() {
    this.logsDir = LOGGER_CONFIG.LOGS_DIR
    this.activeLogs = new Map() // In-memory cache of active logs
    this.ensureLogsDirectory()
  }

  /**
   * Ensures logs directory exists
   */
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      try {
        fs.mkdirSync(this.logsDir, { recursive: true, mode: 0o750 })
        console.log(`[StructuredLogger] Logs directory created: ${this.logsDir}`)
      } catch (error) {
        console.error(`[StructuredLogger] Failed to create logs directory: ${error.message}`)
        throw error
      }
    }
  }

  /**
   * Gets log file path for a conversion
   * @param {string} conversionId - Conversion ID
   * @returns {string} Absolute path to log file
   */
  getLogFilePath(conversionId) {
    return path.join(this.logsDir, `${conversionId}.log`)
  }

  /**
   * Initializes a new log for a conversion
   * @param {string} conversionId - Unique conversion ID
   * @param {string} sourceFormat - Source format
   * @param {string} targetFormat - Target format
   * @param {Object} options - Conversion options
   * @returns {Object} Log structure
   */
  initializeLog(conversionId, sourceFormat, targetFormat, options = {}) {
    const logStructure = createLogStructure(conversionId, sourceFormat, targetFormat, options)
    
    // Store in memory for quick access
    this.activeLogs.set(conversionId, logStructure)
    
    // Write initial log file
    this.writeLogFile(conversionId, logStructure)
    
    return logStructure
  }

  /**
   * Adds a log message to the conversion log
   * @param {string} conversionId - Conversion ID
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata (optional)
   */
  addLogMessage(conversionId, level, message, metadata = {}) {
    const log = this.activeLogs.get(conversionId)
    if (!log) {
      console.warn(`[StructuredLogger] No active log found for conversion: ${conversionId}`)
      return
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      ...metadata
    }

    log.logs.push(logEntry)
    this.writeLogFile(conversionId, log)
  }

  /**
   * Records a step execution
   * @param {string} conversionId - Conversion ID
   * @param {Object} stepInfo - Step information
   */
  recordStep(conversionId, stepInfo) {
    const log = this.activeLogs.get(conversionId)
    if (!log) {
      console.warn(`[StructuredLogger] No active log found for conversion: ${conversionId}`)
      return
    }

    const step = {
      stepNumber: stepInfo.stepNumber || log.execution.steps.length + 1,
      module: stepInfo.module || 'unknown',
      fromFormat: stepInfo.fromFormat,
      toFormat: stepInfo.toFormat,
      inputFile: stepInfo.inputFile || null,
      outputFile: stepInfo.outputFile || null,
      duration: stepInfo.duration || null,
      status: stepInfo.status || 'unknown', // success, error, skipped
      logs: stepInfo.logs || [],
      error: stepInfo.error || null
    }

    log.execution.steps.push(step)
    
    // Track modules executed
    if (!log.execution.modulesExecuted.includes(step.module)) {
      log.execution.modulesExecuted.push(step.module)
    }

    // Track intermediate files
    if (step.outputFile && step.stepNumber < 1000) { // Not final step
      log.files.intermediate.push({
        step: step.stepNumber,
        file: step.outputFile
      })
    }

    this.writeLogFile(conversionId, log)
  }

  /**
   * Records input file information
   * @param {string} conversionId - Conversion ID
   * @param {string} inputFile - Input file path
   */
  recordInputFile(conversionId, inputFile) {
    const log = this.activeLogs.get(conversionId)
    if (!log) {
      return
    }

    log.files.input = inputFile
    this.writeLogFile(conversionId, log)
  }

  /**
   * Records output file information
   * @param {string} conversionId - Conversion ID
   * @param {string} outputFile - Output file path
   */
  recordOutputFile(conversionId, outputFile) {
    const log = this.activeLogs.get(conversionId)
    if (!log) {
      return
    }

    log.files.output = outputFile
    this.writeLogFile(conversionId, log)
  }

  /**
   * Finalizes the log with final status
   * @param {string} conversionId - Conversion ID
   * @param {string} status - Final status (success, error)
   * @param {Object} finalInfo - Final information
   */
  finalizeLog(conversionId, status, finalInfo = {}) {
    const log = this.activeLogs.get(conversionId)
    if (!log) {
      console.warn(`[StructuredLogger] No active log found for conversion: ${conversionId}`)
      return
    }

    log.status = status
    log.timestamp.end = new Date().toISOString()
    log.execution.totalDuration = finalInfo.totalDuration || null
    
    if (status === 'error') {
      log.error = finalInfo.error || 'Unknown error'
    }

    // Calculate total duration if not provided
    if (!log.execution.totalDuration && log.timestamp.start && log.timestamp.end) {
      const start = new Date(log.timestamp.start)
      const end = new Date(log.timestamp.end)
      log.execution.totalDuration = ((end - start) / 1000).toFixed(3)
    }

    // Write final log
    this.writeLogFile(conversionId, log)

    // Remove from active logs after a delay (to allow API access)
    setTimeout(() => {
      this.activeLogs.delete(conversionId)
    }, 60000) // Keep in memory for 1 minute after completion
  }

  /**
   * Writes log structure to file
   * @param {string} conversionId - Conversion ID
   * @param {Object} logStructure - Log structure to write
   */
  writeLogFile(conversionId, logStructure) {
    try {
      this.ensureLogsDirectory()
      const logFilePath = this.getLogFilePath(conversionId)
      
      // Sanitize log structure (remove sensitive data)
      const sanitizedLog = this.sanitizeLog(logStructure)
      
      // Write as pretty JSON
      const jsonContent = JSON.stringify(sanitizedLog, null, 2)
      
      // Verify JSON is valid before writing
      try {
        JSON.parse(jsonContent)
      } catch (jsonError) {
        console.error(`[StructuredLogger] Invalid JSON structure for ${conversionId}:`, jsonError.message)
        return
      }
      
      // Check file size before writing
      if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath)
        if (stats.size > LOGGER_CONFIG.MAX_LOG_SIZE) {
          console.warn(`[StructuredLogger] Log file exceeds max size for conversion: ${conversionId}`)
          // Truncate or archive old log
          this.archiveLog(conversionId)
        }
      }
      
      fs.writeFileSync(logFilePath, jsonContent, 'utf8')
      
      // Verify file was written successfully
      if (fs.existsSync(logFilePath)) {
        const writtenStats = fs.statSync(logFilePath)
        if (writtenStats.size === 0) {
          console.error(`[StructuredLogger] Log file was created but is empty: ${conversionId}`)
        }
      } else {
        console.error(`[StructuredLogger] Log file was not created: ${conversionId}`)
      }
    } catch (error) {
      // Don't throw - logging errors shouldn't break the conversion
      console.error(`[StructuredLogger] Failed to write log file for ${conversionId}:`, error.message)
    }
  }

  /**
   * Sanitizes log structure to remove sensitive data
   * @param {Object} logStructure - Log structure to sanitize
   * @returns {Object} Sanitized log structure
   */
  sanitizeLog(logStructure) {
    const sanitized = JSON.parse(JSON.stringify(logStructure)) // Deep clone
    
    // Remove sensitive data from file paths (keep only basename)
    if (sanitized.files) {
      if (sanitized.files.input) {
        sanitized.files.input = path.basename(sanitized.files.input)
      }
      if (sanitized.files.output) {
        sanitized.files.output = path.basename(sanitized.files.output)
      }
      if (sanitized.files.intermediate) {
        sanitized.files.intermediate = sanitized.files.intermediate.map(f => ({
          step: f.step,
          file: path.basename(f.file)
        }))
      }
    }

    // Remove sensitive data from step logs
    if (sanitized.execution && sanitized.execution.steps) {
      sanitized.execution.steps = sanitized.execution.steps.map(step => {
        const sanitizedStep = { ...step }
        if (sanitizedStep.inputFile) {
          sanitizedStep.inputFile = path.basename(sanitizedStep.inputFile)
        }
        if (sanitizedStep.outputFile) {
          sanitizedStep.outputFile = path.basename(sanitizedStep.outputFile)
        }
        return sanitizedStep
      })
    }

    // Remove sensitive metadata
    if (sanitized.metadata) {
      // Keep only non-sensitive metadata
      sanitized.metadata = {
        contentSize: sanitized.metadata.contentSize
      }
    }

    return sanitized
  }

  /**
   * Archives an old log file
   * @param {string} conversionId - Conversion ID
   */
  archiveLog(conversionId) {
    try {
      const logFilePath = this.getLogFilePath(conversionId)
      const archiveDir = path.join(this.logsDir, 'archived')
      
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true, mode: 0o750 })
      }
      
      const archivePath = path.join(archiveDir, `${conversionId}.log`)
      fs.renameSync(logFilePath, archivePath)
    } catch (error) {
      console.error(`[StructuredLogger] Failed to archive log for ${conversionId}:`, error.message)
    }
  }

  /**
   * Reads a log file
   * @param {string} conversionId - Conversion ID
   * @returns {Object|null} Log structure or null if not found
   */
  readLog(conversionId) {
    try {
      const logFilePath = this.getLogFilePath(conversionId)
      
      if (!fs.existsSync(logFilePath)) {
        return null
      }
      
      const content = fs.readFileSync(logFilePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.error(`[StructuredLogger] Failed to read log for ${conversionId}:`, error.message)
      return null
    }
  }

  /**
   * Lists all available log files
   * @param {number} limit - Maximum number of logs to return
   * @returns {Array} Array of log file info
   */
  listLogs(limit = 100) {
    try {
      this.ensureLogsDirectory()
      const files = fs.readdirSync(this.logsDir)
      
      const logs = files
        .filter(file => file.endsWith('.log'))
        .map(file => {
          const conversionId = file.replace('.log', '')
          const filePath = path.join(this.logsDir, file)
          const stats = fs.statSync(filePath)
          
          return {
            conversionId: conversionId,
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString()
          }
        })
        .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
        .slice(0, limit)
      
      return logs
    } catch (error) {
      console.error(`[StructuredLogger] Failed to list logs:`, error.message)
      return []
    }
  }

  /**
   * Cleans up old logs based on retention policy
   */
  cleanupOldLogs() {
    try {
      this.ensureLogsDirectory()
      const files = fs.readdirSync(this.logsDir)
      const now = Date.now()
      const retentionMs = LOGGER_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000
      
      files
        .filter(file => file.endsWith('.log'))
        .forEach(file => {
          const filePath = path.join(this.logsDir, file)
          const stats = fs.statSync(filePath)
          const age = now - stats.mtime.getTime()
          
          if (age > retentionMs) {
            fs.unlinkSync(filePath)
            console.log(`[StructuredLogger] Cleaned up old log: ${file}`)
          }
        })
    } catch (error) {
      console.error(`[StructuredLogger] Failed to cleanup old logs:`, error.message)
    }
  }
}

// ============================================================================
// INSTANCE GLOBALE
// ============================================================================

const structuredLogger = new StructuredLogger()

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  structuredLogger,
  
  // Convenience functions
  initializeLog: (conversionId, sourceFormat, targetFormat, options) => {
    return structuredLogger.initializeLog(conversionId, sourceFormat, targetFormat, options)
  },
  
  addLogMessage: (conversionId, level, message, metadata) => {
    return structuredLogger.addLogMessage(conversionId, level, message, metadata)
  },
  
  recordStep: (conversionId, stepInfo) => {
    return structuredLogger.recordStep(conversionId, stepInfo)
  },
  
  recordInputFile: (conversionId, inputFile) => {
    return structuredLogger.recordInputFile(conversionId, inputFile)
  },
  
  recordOutputFile: (conversionId, outputFile) => {
    return structuredLogger.recordOutputFile(conversionId, outputFile)
  },
  
  finalizeLog: (conversionId, status, finalInfo) => {
    return structuredLogger.finalizeLog(conversionId, status, finalInfo)
  },
  
  readLog: (conversionId) => {
    return structuredLogger.readLog(conversionId)
  },
  
  listLogs: (limit) => {
    return structuredLogger.listLogs(limit)
  }
}
