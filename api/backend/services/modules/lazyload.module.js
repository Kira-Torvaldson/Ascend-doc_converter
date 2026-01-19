'use strict'

/**
 * LAZY LOADING MODULE FOR CONVERTERS
 * 
 * Centralized lazy loading module for all converters in the pipeline.
 * This module reduces memory consumption by loading each converter
 * only when it is used.
 * 
 * References:
 * - modules.interface.md: Module interface contract
 * - lazyload.module.md: Lazy loading module specification
 */

const path = require('path')
const fs = require('fs')

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODULES_DIR = __dirname
const MODULE_CONFIG = {
  // Path to modules directory
  modulesPath: MODULES_DIR,
  
  // Accepted module file extensions
  moduleExtensions: ['.module.js', '.js']
}

// ============================================================================
// REGISTRE DES MODULES
// ============================================================================

/**
 * Registry of available modules
 * Format: { moduleName: { path, loader, loaded, instance, loadError } }
 */
const moduleRegistry = new Map()

/**
 * Configuration of available modules
 * Each entry defines the module name and its loading path
 */
const AVAILABLE_MODULES = {
  'downdoc': {
    path: path.join(MODULES_DIR, 'downdoc.module.js'),
    name: 'downdoc'
  }
  // Other modules (pandoc, text2markdown, docverter, panwriter) will be added
  // when they are created according to the modules.interface.md interface
}

// ============================================================================
// GESTIONNAIRE DE LAZY LOADING
// ============================================================================

/**
 * Lazy loading manager for conversion modules
 * Implements deferred loading and uniform interface
 */
class LazyLoadManager {
  constructor() {
    this.loadedModules = new Map() // Cache of loaded modules
    this.loadErrors = new Map()    // Cache of loading errors
    this.loadLogs = []             // Loading logs
  }

  /**
   * Registers a module available for lazy loading
   * @param {string} moduleName - Module name
   * @param {string} modulePath - Path to module file
   */
  registerModule(moduleName, modulePath) {
    if (moduleRegistry.has(moduleName)) {
      this.log(`Module '${moduleName}' already registered, skipping`)
      return
    }

    moduleRegistry.set(moduleName, {
      path: modulePath,
      loader: null,
      loaded: false,
      instance: null,
      loadError: null,
      loadTime: null
    })

    this.log(`Module '${moduleName}' registered at ${modulePath}`)
  }

  /**
   * Validates a module path before loading
   * @param {string} modulePath - Path to module file
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateModulePath(modulePath) {
    // Check that path is absolute
    if (!path.isAbsolute(modulePath)) {
      return {
        valid: false,
        error: `Module path must be absolute: ${modulePath}`
      }
    }

    // Check that path is within modules directory
    const normalizedPath = path.normalize(modulePath)
    const normalizedModulesDir = path.normalize(MODULES_DIR)
    
    if (!normalizedPath.startsWith(normalizedModulesDir)) {
      return {
        valid: false,
        error: `Module path must be within modules directory: ${modulePath}`
      }
    }

    // Check that file exists
    if (!fs.existsSync(modulePath)) {
      return {
        valid: false,
        error: `Module file not found: ${modulePath}`
      }
    }

    // Check that it's a file (not a directory)
    const stats = fs.statSync(modulePath)
    if (!stats.isFile()) {
      return {
        valid: false,
        error: `Module path is not a file: ${modulePath}`
      }
    }

    // Check extension
    const ext = path.extname(modulePath)
    if (!MODULE_CONFIG.moduleExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Module file must have one of these extensions: ${MODULE_CONFIG.moduleExtensions.join(', ')}`
      }
    }

    return { valid: true }
  }

  /**
   * Loads a module lazily (lazy loading)
   * @param {string} moduleName - Module name to load
   * @returns {Object} { success: boolean, module?: Object, error?: string }
   */
  loadModule(moduleName) {
    // Check if module is already loaded
    if (this.loadedModules.has(moduleName)) {
      const module = this.loadedModules.get(moduleName)
      this.log(`Module '${moduleName}' already loaded, using cached instance`)
      return { success: true, module }
    }

    // Check if a previous loading error exists
    if (this.loadErrors.has(moduleName)) {
      const error = this.loadErrors.get(moduleName)
      this.log(`Module '${moduleName}' previously failed to load: ${error}`)
      return { success: false, error }
    }

    // Check if module is registered
    const moduleInfo = moduleRegistry.get(moduleName)
    if (!moduleInfo) {
      const error = `Module '${moduleName}' is not registered`
      this.log(`Error: ${error}`)
      this.loadErrors.set(moduleName, error)
      return { success: false, error }
    }

    // Charger le module
    const loadStartTime = Date.now()
    this.log(`Loading module '${moduleName}' from ${moduleInfo.path}...`)

    try {
      // Module path validation (security)
      const pathValidation = this.validateModulePath(moduleInfo.path)
      if (!pathValidation.valid) {
        const error = pathValidation.error || `Invalid module path: ${moduleInfo.path}`
        this.log(`Error: ${error}`)
        this.loadErrors.set(moduleName, error)
        moduleInfo.loadError = error
        return { success: false, error }
      }

      // Load module (require with Node.js cache)
      // Note: We do NOT delete the cache here to avoid unnecessary reloads
      // Node.js cache already handles unique loading
      let moduleInstance
      try {
        moduleInstance = require(moduleInfo.path)
      } catch (requireError) {
        // Specific require error handling
        const error = `Failed to require module '${moduleName}': ${requireError.message}`
        this.log(`Error: ${error}`)
        this.loadErrors.set(moduleName, error)
        moduleInfo.loadError = error
        return { success: false, error }
      }

      // Validate that module conforms to interface
      const validation = this.validateModuleInterface(moduleInstance, moduleName)
      if (!validation.valid) {
        const error = `Module '${moduleName}' does not conform to interface: ${validation.error}`
        this.log(`Error: ${error}`)
        this.loadErrors.set(moduleName, error)
        moduleInfo.loadError = error
        return { success: false, error }
      }

      // Cache the loaded module
      const loadDuration = (Date.now() - loadStartTime) / 1000
      this.loadedModules.set(moduleName, moduleInstance)
      moduleInfo.loaded = true
      moduleInfo.instance = moduleInstance
      moduleInfo.loadTime = loadDuration
      moduleInfo.loadError = null // Reset error if loading succeeds

      this.log(`Module '${moduleName}' loaded successfully in ${loadDuration.toFixed(3)}s`)
      this.log(`Module '${moduleName}' initialized at ${new Date().toISOString()}`)

      return { success: true, module: moduleInstance }

    } catch (error) {
      // Secure error handling for loading
      // Do not expose sensitive system details
      const errorMessage = `Failed to load module '${moduleName}': ${error.message}`
      this.log(`Error: ${errorMessage}`)
      this.loadErrors.set(moduleName, errorMessage)
      if (moduleInfo) {
        moduleInfo.loadError = errorMessage
      }

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Validates that a module conforms to the interface defined in modules.interface.md
   * @param {Object} moduleInstance - Module instance to validate
   * @param {string} moduleName - Module name
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateModuleInterface(moduleInstance, moduleName) {
    // Check for 'name' property
    if (!moduleInstance.name || typeof moduleInstance.name !== 'string') {
      return {
        valid: false,
        error: 'Missing or invalid property: name'
      }
    }

    // Check that name matches
    if (moduleInstance.name !== moduleName) {
      return {
        valid: false,
        error: `Module name mismatch: expected '${moduleName}', got '${moduleInstance.name}'`
      }
    }

    // Check for 'supportedFormats' property
    if (!moduleInstance.supportedFormats || typeof moduleInstance.supportedFormats !== 'object') {
      return {
        valid: false,
        error: 'Missing or invalid property: supportedFormats'
      }
    }

    // Check supportedFormats structure
    if (!Array.isArray(moduleInstance.supportedFormats.from) ||
        !Array.isArray(moduleInstance.supportedFormats.to)) {
      return {
        valid: false,
        error: 'Invalid supportedFormats structure: from and to must be arrays'
      }
    }

    // Check for 'run' method
    if (typeof moduleInstance.run !== 'function') {
      return {
        valid: false,
        error: 'Missing or invalid method: run'
      }
    }

    return { valid: true }
  }

  /**
   * Validates input and output paths before execution
   * @param {string} inputPath - Path to input file
   * @param {string} outputPath - Path to output file
   * @returns {Object} { valid: boolean, error?: string }
   */
  validatePaths(inputPath, outputPath) {
    // Check that paths are absolute
    if (!path.isAbsolute(inputPath)) {
      return {
        valid: false,
        error: `Input path must be absolute: ${inputPath}`
      }
    }

    if (!path.isAbsolute(outputPath)) {
      return {
        valid: false,
        error: `Output path must be absolute: ${outputPath}`
      }
    }

    // Check that input file exists
    if (!fs.existsSync(inputPath)) {
      return {
        valid: false,
        error: `Input file not found: ${inputPath}`
      }
    }

    // Check that input file is a file
    const inputStats = fs.statSync(inputPath)
    if (!inputStats.isFile()) {
      return {
        valid: false,
        error: `Input path is not a file: ${inputPath}`
      }
    }

    // Check that output parent directory exists
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      return {
        valid: false,
        error: `Output directory does not exist: ${outputDir}`
      }
    }

    return { valid: true }
  }

  /**
   * Gets a module and executes its run method with lazy loading
   * @param {string} moduleName - Module name
   * @param {string} inputPath - Path to input file
   * @param {string} outputPath - Path to output file
   * @param {Object} options - Conversion options
   * @returns {Promise<ModuleResult>} Conversion result
   */
  async runModule(moduleName, inputPath, outputPath, options = {}) {
    const conversionId = options.conversionId || 'unknown'
    const startTime = Date.now()
    const logs = []

    try {
      // Minimal logging: loading attempt
      logs.push(`[${conversionId}] Requesting module '${moduleName}'`)
      logs.push(`[${conversionId}] Lazy loading module '${moduleName}'...`)

      // Path validation before module loading
      const pathValidation = this.validatePaths(inputPath, outputPath)
      if (!pathValidation.valid) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Path validation failed: ${pathValidation.error}`)
        
        return {
          success: false,
          logs: logs,
          error: `Path validation failed: ${pathValidation.error}`,
          duration: duration
        }
      }

      // Load module (lazy loading)
      const loadResult = this.loadModule(moduleName)

      if (!loadResult.success) {
        // Secure error handling for loading
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Failed to load module '${moduleName}': ${loadResult.error}`)
        
        return {
          success: false,
          logs: logs,
          error: `Module loading failed: ${loadResult.error}`,
          duration: duration
        }
      }

      // Minimal logging: module loaded
      logs.push(`[${conversionId}] Module '${moduleName}' loaded successfully`)
      logs.push(`[${conversionId}] Module '${moduleName}' initialized`)

      // Get module instance
      const moduleInstance = loadResult.module

      // Check that module supports requested format (if specified in options)
      if (options.fromFormat && options.toFormat) {
        const supportedFrom = moduleInstance.supportedFormats.from.map(f => f.toLowerCase())
        const supportedTo = moduleInstance.supportedFormats.to.map(f => f.toLowerCase())
        const requestedFrom = options.fromFormat.toLowerCase()
        const requestedTo = options.toFormat.toLowerCase()

        if (!supportedFrom.includes(requestedFrom)) {
          const duration = (Date.now() - startTime) / 1000
          logs.push(`[${conversionId}] Module '${moduleName}' does not support input format '${requestedFrom}'`)
          
          return {
            success: false,
            logs: logs,
            error: `Module '${moduleName}' does not support input format '${requestedFrom}'. Supported: ${supportedFrom.join(', ')}`,
            duration: duration
          }
        }

        if (!supportedTo.includes(requestedTo)) {
          const duration = (Date.now() - startTime) / 1000
          logs.push(`[${conversionId}] Module '${moduleName}' does not support output format '${requestedTo}'`)
          
          return {
            success: false,
            logs: logs,
            error: `Module '${moduleName}' does not support output format '${requestedTo}'. Supported: ${supportedTo.join(', ')}`,
            duration: duration
          }
        }
      }

      // Execute module's run method
      logs.push(`[${conversionId}] Executing module '${moduleName}'...`)
      const moduleResult = await moduleInstance.run(inputPath, outputPath, options)

      // Validate that result is conformant
      if (!moduleResult || typeof moduleResult !== 'object') {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Module '${moduleName}' returned invalid result`)
        
        return {
          success: false,
          logs: logs,
          error: `Module '${moduleName}' returned invalid result`,
          duration: duration
        }
      }

      // Merge module logs with loading logs
      const allLogs = [...logs]
      if (Array.isArray(moduleResult.logs)) {
        allLogs.push(...moduleResult.logs)
      } else if (typeof moduleResult.logs === 'string') {
        allLogs.push(moduleResult.logs)
      }

      // Return result with merged logs
      return {
        success: moduleResult.success !== false, // Ensure success is a boolean
        logs: allLogs,
        error: moduleResult.error || null,
        duration: moduleResult.duration || ((Date.now() - startTime) / 1000)
      }

    } catch (error) {
      // Secure error handling: exhaustive capture
      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Unexpected error in lazy loading: ${error.message}`)

      return {
        success: false,
        logs: logs,
        error: `Lazy loading error: ${error.message}`,
        duration: duration
      }
    }
  }

  /**
   * Gets the list of available modules
   * @returns {string[]} List of registered module names
   */
  getAvailableModules() {
    return Array.from(moduleRegistry.keys())
  }

  /**
   * Gets the loading status of a module
   * @param {string} moduleName - Module name
   * @returns {Object} Module status
   */
  getModuleStatus(moduleName) {
    const moduleInfo = moduleRegistry.get(moduleName)
    if (!moduleInfo) {
      return { registered: false }
    }

    return {
      registered: true,
      loaded: moduleInfo.loaded,
      loadTime: moduleInfo.loadTime,
      loadError: moduleInfo.loadError,
      path: moduleInfo.path
    }
  }

  /**
   * Logs a message (minimal logging)
   * @param {string} message - Message to log
   */
  log(message) {
    const timestamp = new Date().toISOString()
    const logEntry = `[LAZY_LOAD] ${timestamp} - ${message}`
    this.loadLogs.push(logEntry)
    console.log(logEntry)
  }

  /**
   * Gets loading logs
   * @returns {string[]} Loading logs
   */
  getLogs() {
    return [...this.loadLogs]
  }

  /**
   * Resets a module's cache (for tests or reloading)
   * @param {string} moduleName - Module name
   */
  unloadModule(moduleName) {
    if (this.loadedModules.has(moduleName)) {
      const moduleInfo = moduleRegistry.get(moduleName)
      if (moduleInfo && moduleInfo.path) {
        try {
          const modulePath = require.resolve(moduleInfo.path)
          delete require.cache[modulePath]
        } catch (resolveError) {
          // Ignore if module is not resolvable
          this.log(`Warning: Could not resolve module path for '${moduleName}': ${resolveError.message}`)
        }
      }
      this.loadedModules.delete(moduleName)
      this.loadErrors.delete(moduleName)
      
      // Reset module information in registry
      if (moduleInfo) {
        moduleInfo.loaded = false
        moduleInfo.instance = null
        moduleInfo.loadError = null
        moduleInfo.loadTime = null
      }
      this.log(`Module '${moduleName}' unloaded`)
    }
  }
}

// ============================================================================
// INSTANCE GLOBALE
// ============================================================================

const lazyLoadManager = new LazyLoadManager()

// Register available modules at startup
for (const [moduleName, moduleConfig] of Object.entries(AVAILABLE_MODULES)) {
  lazyLoadManager.registerModule(moduleName, moduleConfig.path)
}

// ============================================================================
// INTERFACE UNIFORME POUR TOUS LES CONVERTERS
// ============================================================================

/**
 * Uniform interface to execute any converter with lazy loading
 * Compatible with the interface defined in modules.interface.md
 * 
 * @param {string} moduleName - Module name to use
 * @param {string} inputPath - Absolute path to input file
 * @param {string} outputPath - Absolute path to output file
 * @param {Object} options - Conversion options
 * @returns {Promise<ModuleResult>} Conversion result
 */
async function runConverter(moduleName, inputPath, outputPath, options = {}) {
  return await lazyLoadManager.runModule(moduleName, inputPath, outputPath, options)
}

/**
 * Registers a new module for lazy loading
 * @param {string} moduleName - Module name
 * @param {string} modulePath - Path to module file
 */
function registerConverter(moduleName, modulePath) {
  lazyLoadManager.registerModule(moduleName, modulePath)
}

/**
 * Gets the list of available modules
 * @returns {string[]} List of module names
 */
function getAvailableConverters() {
  return lazyLoadManager.getAvailableModules()
}

/**
 * Gets the status of a module
 * @param {string} moduleName - Module name
 * @returns {Object} Module status
 */
function getConverterStatus(moduleName) {
  return lazyLoadManager.getModuleStatus(moduleName)
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Main interface
  runConverter,
  registerConverter,
  getAvailableConverters,
  getConverterStatus,
  
  // Internal manager (for advanced access if needed)
  lazyLoadManager
}
