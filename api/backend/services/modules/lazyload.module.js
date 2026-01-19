'use strict'

/**
 * MODULE DE LAZY LOADING POUR CONVERTERS
 * 
 * Module centralisé de chargement différé (lazy loading) pour tous les converters
 * du pipeline. Ce module réduit la consommation mémoire en chargeant chaque
 * converter uniquement au moment où il est utilisé.
 * 
 * Références :
 * - modules.interface.md : Contrat d'interface des modules
 * - lazyload.module.md : Spécification du module de lazy loading
 */

const path = require('path')
const fs = require('fs')

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODULES_DIR = __dirname
const MODULE_CONFIG = {
  // Chemin vers le répertoire des modules
  modulesPath: MODULES_DIR,
  
  // Extensions de fichiers de modules acceptées
  moduleExtensions: ['.module.js', '.js']
}

// ============================================================================
// REGISTRE DES MODULES
// ============================================================================

/**
 * Registre des modules disponibles
 * Format: { moduleName: { path, loader, loaded, instance, loadError } }
 */
const moduleRegistry = new Map()

/**
 * Configuration des modules disponibles
 * Chaque entrée définit le nom du module et son chemin de chargement
 */
const AVAILABLE_MODULES = {
  'downdoc': {
    path: path.join(MODULES_DIR, 'downdoc.module.js'),
    name: 'downdoc'
  }
  // Les autres modules (pandoc, text2markdown, docverter, panwriter) seront ajoutés
  // lorsqu'ils seront créés selon l'interface modules.interface.md
}

// ============================================================================
// GESTIONNAIRE DE LAZY LOADING
// ============================================================================

/**
 * Gestionnaire de lazy loading pour les modules de conversion
 * Implémente le chargement différé et l'interface uniforme
 */
class LazyLoadManager {
  constructor() {
    this.loadedModules = new Map() // Cache des modules chargés
    this.loadErrors = new Map()    // Cache des erreurs de chargement
    this.loadLogs = []             // Logs de chargement
  }

  /**
   * Enregistre un module disponible pour le lazy loading
   * @param {string} moduleName - Nom du module
   * @param {string} modulePath - Chemin vers le fichier du module
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
   * Valide le chemin d'un module avant chargement
   * @param {string} modulePath - Chemin vers le fichier du module
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateModulePath(modulePath) {
    // Vérifier que le chemin est absolu
    if (!path.isAbsolute(modulePath)) {
      return {
        valid: false,
        error: `Module path must be absolute: ${modulePath}`
      }
    }

    // Vérifier que le chemin est dans le répertoire des modules
    const normalizedPath = path.normalize(modulePath)
    const normalizedModulesDir = path.normalize(MODULES_DIR)
    
    if (!normalizedPath.startsWith(normalizedModulesDir)) {
      return {
        valid: false,
        error: `Module path must be within modules directory: ${modulePath}`
      }
    }

    // Vérifier que le fichier existe
    if (!fs.existsSync(modulePath)) {
      return {
        valid: false,
        error: `Module file not found: ${modulePath}`
      }
    }

    // Vérifier que c'est un fichier (pas un répertoire)
    const stats = fs.statSync(modulePath)
    if (!stats.isFile()) {
      return {
        valid: false,
        error: `Module path is not a file: ${modulePath}`
      }
    }

    // Vérifier l'extension
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
   * Charge un module de manière différée (lazy loading)
   * @param {string} moduleName - Nom du module à charger
   * @returns {Object} { success: boolean, module?: Object, error?: string }
   */
  loadModule(moduleName) {
    // Vérifier si le module est déjà chargé
    if (this.loadedModules.has(moduleName)) {
      const module = this.loadedModules.get(moduleName)
      this.log(`Module '${moduleName}' already loaded, using cached instance`)
      return { success: true, module }
    }

    // Vérifier si une erreur de chargement précédente existe
    if (this.loadErrors.has(moduleName)) {
      const error = this.loadErrors.get(moduleName)
      this.log(`Module '${moduleName}' previously failed to load: ${error}`)
      return { success: false, error }
    }

    // Vérifier si le module est enregistré
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
      // Validation du chemin du module (sécurité)
      const pathValidation = this.validateModulePath(moduleInfo.path)
      if (!pathValidation.valid) {
        const error = pathValidation.error || `Invalid module path: ${moduleInfo.path}`
        this.log(`Error: ${error}`)
        this.loadErrors.set(moduleName, error)
        moduleInfo.loadError = error
        return { success: false, error }
      }

      // Charger le module (require avec cache Node.js)
      // Note: On ne supprime PAS le cache ici pour éviter les rechargements inutiles
      // Le cache Node.js gère déjà le chargement unique
      let moduleInstance
      try {
        moduleInstance = require(moduleInfo.path)
      } catch (requireError) {
        // Gestion spécifique des erreurs de require
        const error = `Failed to require module '${moduleName}': ${requireError.message}`
        this.log(`Error: ${error}`)
        this.loadErrors.set(moduleName, error)
        moduleInfo.loadError = error
        return { success: false, error }
      }

      // Valider que le module respecte l'interface
      const validation = this.validateModuleInterface(moduleInstance, moduleName)
      if (!validation.valid) {
        const error = `Module '${moduleName}' does not conform to interface: ${validation.error}`
        this.log(`Error: ${error}`)
        this.loadErrors.set(moduleName, error)
        moduleInfo.loadError = error
        return { success: false, error }
      }

      // Mettre en cache le module chargé
      const loadDuration = (Date.now() - loadStartTime) / 1000
      this.loadedModules.set(moduleName, moduleInstance)
      moduleInfo.loaded = true
      moduleInfo.instance = moduleInstance
      moduleInfo.loadTime = loadDuration
      moduleInfo.loadError = null // Réinitialiser l'erreur si le chargement réussit

      this.log(`Module '${moduleName}' loaded successfully in ${loadDuration.toFixed(3)}s`)
      this.log(`Module '${moduleName}' initialized at ${new Date().toISOString()}`)

      return { success: true, module: moduleInstance }

    } catch (error) {
      // Gestion sécurisée des erreurs de chargement
      // Ne pas exposer de détails système sensibles
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
   * Valide qu'un module respecte l'interface définie dans modules.interface.md
   * @param {Object} moduleInstance - Instance du module à valider
   * @param {string} moduleName - Nom du module
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateModuleInterface(moduleInstance, moduleName) {
    // Vérifier la présence de la propriété 'name'
    if (!moduleInstance.name || typeof moduleInstance.name !== 'string') {
      return {
        valid: false,
        error: 'Missing or invalid property: name'
      }
    }

    // Vérifier que le nom correspond
    if (moduleInstance.name !== moduleName) {
      return {
        valid: false,
        error: `Module name mismatch: expected '${moduleName}', got '${moduleInstance.name}'`
      }
    }

    // Vérifier la présence de la propriété 'supportedFormats'
    if (!moduleInstance.supportedFormats || typeof moduleInstance.supportedFormats !== 'object') {
      return {
        valid: false,
        error: 'Missing or invalid property: supportedFormats'
      }
    }

    // Vérifier la structure de supportedFormats
    if (!Array.isArray(moduleInstance.supportedFormats.from) ||
        !Array.isArray(moduleInstance.supportedFormats.to)) {
      return {
        valid: false,
        error: 'Invalid supportedFormats structure: from and to must be arrays'
      }
    }

    // Vérifier la présence de la méthode 'run'
    if (typeof moduleInstance.run !== 'function') {
      return {
        valid: false,
        error: 'Missing or invalid method: run'
      }
    }

    return { valid: true }
  }

  /**
   * Valide les chemins d'entrée et de sortie avant exécution
   * @param {string} inputPath - Chemin vers le fichier d'entrée
   * @param {string} outputPath - Chemin vers le fichier de sortie
   * @returns {Object} { valid: boolean, error?: string }
   */
  validatePaths(inputPath, outputPath) {
    // Vérifier que les chemins sont absolus
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

    // Vérifier que le fichier d'entrée existe
    if (!fs.existsSync(inputPath)) {
      return {
        valid: false,
        error: `Input file not found: ${inputPath}`
      }
    }

    // Vérifier que le fichier d'entrée est un fichier
    const inputStats = fs.statSync(inputPath)
    if (!inputStats.isFile()) {
      return {
        valid: false,
        error: `Input path is not a file: ${inputPath}`
      }
    }

    // Vérifier que le répertoire parent de la sortie existe
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
   * Obtient un module et exécute sa méthode run avec lazy loading
   * @param {string} moduleName - Nom du module
   * @param {string} inputPath - Chemin vers le fichier d'entrée
   * @param {string} outputPath - Chemin vers le fichier de sortie
   * @param {Object} options - Options de conversion
   * @returns {Promise<ModuleResult>} Résultat de la conversion
   */
  async runModule(moduleName, inputPath, outputPath, options = {}) {
    const conversionId = options.conversionId || 'unknown'
    const startTime = Date.now()
    const logs = []

    try {
      // Journalisation minimale : tentative de chargement
      logs.push(`[${conversionId}] Requesting module '${moduleName}'`)
      logs.push(`[${conversionId}] Lazy loading module '${moduleName}'...`)

      // Validation des chemins avant chargement du module
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

      // Charger le module (lazy loading)
      const loadResult = this.loadModule(moduleName)

      if (!loadResult.success) {
        // Gestion sécurisée des erreurs de chargement
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Failed to load module '${moduleName}': ${loadResult.error}`)
        
        return {
          success: false,
          logs: logs,
          error: `Module loading failed: ${loadResult.error}`,
          duration: duration
        }
      }

      // Journalisation minimale : module chargé
      logs.push(`[${conversionId}] Module '${moduleName}' loaded successfully`)
      logs.push(`[${conversionId}] Module '${moduleName}' initialized`)

      // Obtenir l'instance du module
      const moduleInstance = loadResult.module

      // Vérifier que le module supporte le format demandé (si spécifié dans options)
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

      // Exécuter la méthode run du module
      logs.push(`[${conversionId}] Executing module '${moduleName}'...`)
      const moduleResult = await moduleInstance.run(inputPath, outputPath, options)

      // Valider que le résultat est conforme
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

      // Fusionner les logs du module avec les logs de chargement
      const allLogs = [...logs]
      if (Array.isArray(moduleResult.logs)) {
        allLogs.push(...moduleResult.logs)
      } else if (typeof moduleResult.logs === 'string') {
        allLogs.push(moduleResult.logs)
      }

      // Retourner le résultat avec les logs fusionnés
      return {
        success: moduleResult.success !== false, // S'assurer que success est un booléen
        logs: allLogs,
        error: moduleResult.error || null,
        duration: moduleResult.duration || ((Date.now() - startTime) / 1000)
      }

    } catch (error) {
      // Gestion sécurisée des erreurs : capture exhaustive
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
   * Obtient la liste des modules disponibles
   * @returns {string[]} Liste des noms de modules enregistrés
   */
  getAvailableModules() {
    return Array.from(moduleRegistry.keys())
  }

  /**
   * Obtient le statut de chargement d'un module
   * @param {string} moduleName - Nom du module
   * @returns {Object} Statut du module
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
   * Journalise un message (journalisation minimale)
   * @param {string} message - Message à logger
   */
  log(message) {
    const timestamp = new Date().toISOString()
    const logEntry = `[LAZY_LOAD] ${timestamp} - ${message}`
    this.loadLogs.push(logEntry)
    console.log(logEntry)
  }

  /**
   * Obtient les logs de chargement
   * @returns {string[]} Logs de chargement
   */
  getLogs() {
    return [...this.loadLogs]
  }

  /**
   * Réinitialise le cache d'un module (pour tests ou rechargement)
   * @param {string} moduleName - Nom du module
   */
  unloadModule(moduleName) {
    if (this.loadedModules.has(moduleName)) {
      const moduleInfo = moduleRegistry.get(moduleName)
      if (moduleInfo && moduleInfo.path) {
        try {
          const modulePath = require.resolve(moduleInfo.path)
          delete require.cache[modulePath]
        } catch (resolveError) {
          // Ignorer si le module n'est pas résolvable
          this.log(`Warning: Could not resolve module path for '${moduleName}': ${resolveError.message}`)
        }
      }
      this.loadedModules.delete(moduleName)
      this.loadErrors.delete(moduleName)
      
      // Réinitialiser les informations du module dans le registre
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

// Enregistrer les modules disponibles au démarrage
for (const [moduleName, moduleConfig] of Object.entries(AVAILABLE_MODULES)) {
  lazyLoadManager.registerModule(moduleName, moduleConfig.path)
}

// ============================================================================
// INTERFACE UNIFORME POUR TOUS LES CONVERTERS
// ============================================================================

/**
 * Interface uniforme pour exécuter n'importe quel converter avec lazy loading
 * Compatible avec l'interface définie dans modules.interface.md
 * 
 * @param {string} moduleName - Nom du module à utiliser
 * @param {string} inputPath - Chemin absolu vers le fichier d'entrée
 * @param {string} outputPath - Chemin absolu vers le fichier de sortie
 * @param {Object} options - Options de conversion
 * @returns {Promise<ModuleResult>} Résultat de la conversion
 */
async function runConverter(moduleName, inputPath, outputPath, options = {}) {
  return await lazyLoadManager.runModule(moduleName, inputPath, outputPath, options)
}

/**
 * Enregistre un nouveau module pour le lazy loading
 * @param {string} moduleName - Nom du module
 * @param {string} modulePath - Chemin vers le fichier du module
 */
function registerConverter(moduleName, modulePath) {
  lazyLoadManager.registerModule(moduleName, modulePath)
}

/**
 * Obtient la liste des modules disponibles
 * @returns {string[]} Liste des noms de modules
 */
function getAvailableConverters() {
  return lazyLoadManager.getAvailableModules()
}

/**
 * Obtient le statut d'un module
 * @param {string} moduleName - Nom du module
 * @returns {Object} Statut du module
 */
function getConverterStatus(moduleName) {
  return lazyLoadManager.getModuleStatus(moduleName)
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Interface principale
  runConverter,
  registerConverter,
  getAvailableConverters,
  getConverterStatus,
  
  // Gestionnaire interne (pour accès avancé si nécessaire)
  lazyLoadManager
}
