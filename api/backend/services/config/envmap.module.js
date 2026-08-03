'use strict'

/**
 * ENVMAP MODULE
 * 
 * Centralized and secure environment variable management for Ascend.
 * Provides a single source of truth for all runtime configuration with
 * strict validation, type checking, and security controls.
 * 
 * Philosophy:
 * - Whitelist-based: Only explicitly defined keys are accessible
 * - Type-safe: All values are validated against expected types
 * - Path-safe: Paths are normalized and validated for traversal attacks
 * - Secret-safe: Sensitive values are never exposed in logs or dumps
 * 
 * Future compatibility:
 * - Schema versioning for evolution
 * - Environment-specific configurations (dev/staging/prod)
 * - Compliance with ISO 27001, SOC 2 (prepared, not implemented)
 * 
 * References:
 * - doc/references/configuration/envmap.md: Module documentation
 */

const path = require('path')
const fs = require('fs')
const os = require('os')

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * Environment variable schema definition
 * 
 * Each entry defines:
 * - type: Expected type (string, number, boolean, path)
 * - default: Default value if not set (optional)
 * - min: Minimum value for numbers (optional)
 * - max: Maximum value for numbers (optional)
 * - sensitive: Whether the value contains secrets (default: false)
 * - validator: Custom validation function (optional)
 */
const ENV_SCHEMA = {
  // Schema metadata
  _meta: {
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development' // dev | staging | prod
  },

  // Server configuration
  PORT: {
    type: 'number',
    default: 3003,
    min: 1,
    max: 65535,
    sensitive: false
  },

  NODE_ENV: {
    type: 'string',
    default: 'development',
    validator: (value) => ['development', 'staging', 'production', 'test'].includes(value),
    sensitive: false
  },

  // Pandoc configuration
  PANDOC_PATH: {
    type: 'path',
    default: '/usr/bin/pandoc',
    sensitive: false,
    validator: (value) => {
      // Validate that path is absolute and doesn't contain traversal
      // Note: We don't check if file exists here (it may not exist on all systems)
      const resolved = path.resolve(value)
      return !resolved.includes('..')
    }
  },

  PANDOC_SERVER_ENABLED: {
    type: 'boolean',
    default: true,
    sensitive: false
  },

  // Logging configuration
  LOGS_DIR: {
    type: 'path',
    default: path.join(__dirname, '../../../logs'),
    sensitive: false,
    validator: (value) => {
      // Ensure path is within project or system temp
      const resolved = path.resolve(value)
      const projectRoot = path.resolve(__dirname, '../../../..')
      const tmpRoot = os.tmpdir()
      return resolved.startsWith(projectRoot) || resolved.startsWith(tmpRoot)
    }
  },

  MAX_LOG_SIZE: {
    type: 'number',
    default: 10485760, // 10 MB
    min: 1024, // 1 KB minimum
    max: 104857600, // 100 MB maximum
    sensitive: false
  },

  LOG_RETENTION_DAYS: {
    type: 'number',
    default: 30,
    min: 1,
    max: 365,
    sensitive: false
  },

  // Security and resource limits
  MAX_CONCURRENT_CONVERSIONS: {
    type: 'number',
    default: 5,
    min: 1,
    max: 50,
    sensitive: false
  },

  MAX_CPU_TIME_MS: {
    type: 'number',
    default: 30000, // 30 seconds
    min: 1000, // 1 second minimum
    max: 300000, // 5 minutes maximum
    sensitive: false
  },

  MAX_MEMORY_MB: {
    type: 'number',
    default: 512,
    min: 64, // 64 MB minimum
    max: 4096, // 4 GB maximum
    sensitive: false
  },

  MAX_INPUT_SIZE_MB: {
    type: 'number',
    default: 5,
    min: 1,
    max: 100,
    sensitive: false
  },

  CONVERSION_TIMEOUT_MS: {
    type: 'number',
    default: 30000,
    min: 1000,
    max: 600000,
    sensitive: false
  },

  LOG_MAX_SIZE_MB: {
    type: 'number',
    default: 10,
    min: 1,
    max: 200,
    sensitive: false
  },

  LOG_ROTATE_COUNT: {
    type: 'number',
    default: 5,
    min: 1,
    max: 50,
    sensitive: false
  },

  MAX_WALL_TIME_MS: {
    type: 'number',
    default: 60000, // 60 seconds
    min: 1000,
    max: 600000, // 10 minutes maximum
    sensitive: false
  },

  // Overload detection thresholds
  OVERLOAD_CPU_PERCENT: {
    type: 'number',
    default: 80.0,
    min: 0,
    max: 100,
    sensitive: false
  },

  OVERLOAD_MEMORY_PERCENT: {
    type: 'number',
    default: 80.0,
    min: 0,
    max: 100,
    sensitive: false
  },

  OVERLOAD_FAILURE_RATE: {
    type: 'number',
    default: 0.2, // 20%
    min: 0,
    max: 1,
    sensitive: false
  },

  // Anomaly detection multipliers
  ABNORMAL_DURATION_MULT: {
    type: 'number',
    default: 3.0,
    min: 1.0,
    max: 10.0,
    sensitive: false
  },

  ABNORMAL_MEMORY_MULT: {
    type: 'number',
    default: 2.0,
    min: 1.0,
    max: 10.0,
    sensitive: false
  },

  // Security logging
  SECURITY_LOG_PATH: {
    type: 'path',
    default: path.join(os.tmpdir(), 'ascend-security-logs'),
    sensitive: false,
    validator: (value) => {
      // Ensure path is within system temp
      const resolved = path.resolve(value)
      const tmpRoot = os.tmpdir()
      return resolved.startsWith(tmpRoot)
    }
  },

  // API protection (empty = disabled, dev-friendly)
  API_KEY: {
    type: 'string',
    default: '',
    sensitive: true
  },

  // CORS allowed frontend origin (empty = dev origins only)
  FRONTEND_URL: {
    type: 'string',
    default: '',
    sensitive: false
  },

  // Round-trip history reports directory
  ASCEND_REPORTS_DIR: {
    type: 'path',
    default: path.join(__dirname, '../../reports'),
    sensitive: false,
    validator: (value) => {
      const resolved = path.resolve(value)
      const projectRoot = path.resolve(__dirname, '../../../..')
      const tmpRoot = os.tmpdir()
      return resolved.startsWith(projectRoot) || resolved.startsWith(tmpRoot)
    }
  }
}

// ============================================================================
// ENVMAP CLASS
// ============================================================================

/**
 * Environment Map - Centralized environment variable manager
 */
class EnvMap {
  constructor() {
    this._schema = ENV_SCHEMA
    this._values = {}
    this._initialized = false
    this._errors = []
    
    // Initialize on construction
    this._initialize()
  }

  /**
   * Initialize EnvMap by reading and validating all environment variables
   * @private
   */
  _initialize() {
    if (this._initialized) {
      return
    }

    // Process each key in schema
    for (const [key, config] of Object.entries(this._schema)) {
      // Skip metadata
      if (key.startsWith('_')) {
        continue
      }

      try {
        // Get value from environment or use default
        const envValue = process.env[key]
        const value = envValue !== undefined ? envValue : config.default

        // Validate and normalize
        const validated = this._validateAndNormalize(key, value, config)
        this._values[key] = validated
      } catch (error) {
        // Store error but continue initialization
        this._errors.push({
          key,
          error: error.message
        })
        // Use default if available, otherwise null
        this._values[key] = config.default !== undefined ? config.default : null
      }
    }

    this._initialized = true

    // Log errors if any
    if (this._errors.length > 0) {
      console.warn('[EnvMap] Some environment variables failed validation:', this._errors)
    }
  }

  /**
   * Validate and normalize a value according to its schema
   * @private
   * @param {string} key - Environment variable key
   * @param {*} value - Raw value from environment
   * @param {Object} config - Schema configuration
   * @returns {*} Validated and normalized value
   * @throws {Error} If validation fails
   */
  _validateAndNormalize(key, value, config) {
    // Handle undefined/null
    if (value === undefined || value === null) {
      if (config.default !== undefined) {
        return config.default
      }
      throw new Error(`Required environment variable ${key} is missing and has no default`)
    }

    // Type conversion and validation
    let normalized

    switch (config.type) {
      case 'string':
        normalized = String(value)
        break

      case 'number':
        normalized = Number(value)
        if (isNaN(normalized)) {
          throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`)
        }
        // Check bounds
        if (config.min !== undefined && normalized < config.min) {
          throw new Error(`Environment variable ${key} must be >= ${config.min}, got: ${normalized}`)
        }
        if (config.max !== undefined && normalized > config.max) {
          throw new Error(`Environment variable ${key} must be <= ${config.max}, got: ${normalized}`)
        }
        break

      case 'boolean':
        const lower = String(value).toLowerCase()
        if (lower === 'true' || lower === '1' || lower === 'yes') {
          normalized = true
        } else if (lower === 'false' || lower === '0' || lower === 'no') {
          normalized = false
        } else {
          throw new Error(`Environment variable ${key} must be a boolean, got: ${value}`)
        }
        break

      case 'path':
        normalized = String(value)
        // Normalize path (resolve to absolute)
        normalized = path.resolve(normalized)
        // Check for path traversal
        if (normalized.includes('..')) {
          throw new Error(`Environment variable ${key} contains path traversal (..): ${value}`)
        }
        break

      default:
        throw new Error(`Unknown type ${config.type} for environment variable ${key}`)
    }

    // Custom validator if provided
    if (config.validator && typeof config.validator === 'function') {
      if (!config.validator(normalized)) {
        throw new Error(`Environment variable ${key} failed custom validation`)
      }
    }

    return normalized
  }

  /**
   * Get a validated environment variable value
   * @param {string} key - Environment variable key
   * @returns {*} Validated value or default
   * @throws {Error} If key is not in schema
   */
  get(key) {
    if (!(key in this._schema) || key.startsWith('_')) {
      throw new Error(`Environment variable ${key} is not defined in schema`)
    }

    return this._values[key] !== undefined ? this._values[key] : this._schema[key].default
  }

  /**
   * Check if an environment variable is defined in schema
   * @param {string} key - Environment variable key
   * @returns {boolean} True if key exists in schema
   */
  has(key) {
    return key in this._schema && !key.startsWith('_')
  }

  /**
   * Assert that an environment variable exists and is valid
   * @param {string} key - Environment variable key
   * @throws {Error} If key is missing or invalid
   */
  assert(key) {
    if (!this.has(key)) {
      throw new Error(`Required environment variable ${key} is not defined in schema`)
    }

    const value = this.get(key)
    if (value === null || value === undefined) {
      throw new Error(`Required environment variable ${key} is missing or invalid`)
    }
  }

  /**
   * Dump all non-sensitive environment variables
   * Useful for debugging and logging without exposing secrets
   * @returns {Object} Object with all non-sensitive key-value pairs
   */
  dumpSafe() {
    const safe = {}
    for (const [key, config] of Object.entries(this._schema)) {
      if (key.startsWith('_')) {
        continue
      }
      if (!config.sensitive) {
        safe[key] = this._values[key]
      } else {
        safe[key] = '[REDACTED]'
      }
    }
    return safe
  }

  /**
   * Get schema metadata
   * @returns {Object} Schema metadata (version, env)
   */
  getMetadata() {
    return {
      version: this._schema._meta.version,
      env: this._schema._meta.env
    }
  }

  /**
   * Get initialization errors
   * @returns {Array} Array of error objects
   */
  getErrors() {
    return this._errors
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create singleton instance
const envMap = new EnvMap()

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  envMap,
  EnvMap
}
