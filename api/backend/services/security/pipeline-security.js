'use strict'

/**
 * MODULE DE SÉCURITÉ DU PIPELINE
 * 
 * Ce module implémente les règles de sécurité et de robustesse définies dans PIPELINE.md.
 * Il fournit une couche de sécurité supplémentaire pour :
 * - Validation stricte des entrées et chemins (Règle 19)
 * - Contrôle de concurrence (Règle 21)
 * - Budget de ressources (Règle 22)
 * - Détection de comportements anormaux (Règle 23)
 * - Dégradation contrôlée (Règle 24)
 * - Journalisation minimale de sécurité (Règle 18)
 * - Vérification d'intégrité des modules
 * 
 * Référence : doc/PIPELINE.md
 */

const fs = require('fs')
const path = require('path')
const { lstatSync, realpathSync, readFileSync } = require('fs')
const { createHash } = require('crypto')
const os = require('os')

// ============================================================================
// CONFIGURATION
// ============================================================================

// EnvMap is the single source of truth for security configuration
const { envMap } = require('../config/envmap.module.js')

const SECURITY_CONFIG = {
  // Limite maximale de conversions simultanées (Règle 21)
  MAX_CONCURRENT_CONVERSIONS: envMap.get('MAX_CONCURRENT_CONVERSIONS'),

  // Budget de ressources par conversion (Règle 22)
  RESOURCE_BUDGET: {
    MAX_CPU_TIME: envMap.get('MAX_CPU_TIME_MS'), // 30s
    MAX_MEMORY_MB: envMap.get('MAX_MEMORY_MB'), // 512 MB
    MAX_WALL_TIME: envMap.get('MAX_WALL_TIME_MS') // 60s
  },

  // Seuils de surcharge pour dégradation contrôlée (Règle 24)
  OVERLOAD_THRESHOLDS: {
    CPU_PERCENT: envMap.get('OVERLOAD_CPU_PERCENT'),
    MEMORY_PERCENT: envMap.get('OVERLOAD_MEMORY_PERCENT'),
    FAILURE_RATE: envMap.get('OVERLOAD_FAILURE_RATE') // 20%
  },

  // Profils d'exécution anormaux (Règle 23.3)
  ABNORMAL_PROFILE_MULTIPLIERS: {
    DURATION: envMap.get('ABNORMAL_DURATION_MULT'),
    MEMORY: envMap.get('ABNORMAL_MEMORY_MULT')
  },

  // Chemin pour stocker les logs de sécurité (Règle 18)
  SECURITY_LOG_PATH: envMap.get('SECURITY_LOG_PATH'),
  
  // Hash attendus des modules (vérification d'intégrité)
  MODULE_INTEGRITY: {
    // Les hashs seront calculés au premier chargement et stockés
    // Format: { modulePath: { hash: string, lastModified: number } }
  }
}

// ============================================================================
// COMPTEUR DE CONVERSIONS SIMULTANÉES (Règle 21)
// ============================================================================

/**
 * Gestionnaire de concurrence pour limiter le nombre de conversions simultanées
 * Implémente la Règle 21 de PIPELINE.md
 */
class ConcurrencyController {
  constructor() {
    this.activeConversions = new Set() // Set d'IDs de conversions actives
    this.maxConcurrent = SECURITY_CONFIG.MAX_CONCURRENT_CONVERSIONS
  }

  /**
   * Tente d'acquérir un slot pour une nouvelle conversion
   * @param {string} conversionId - ID unique de la conversion
   * @returns {Object} { allowed: boolean, reason?: string }
   */
  acquireSlot(conversionId) {
    // Règle 21.1 : Vérification atomique de la limite
    if (this.activeConversions.size >= this.maxConcurrent) {
      return {
        allowed: false,
        reason: 'CAPACITY_EXCEEDED',
        message: `Maximum concurrent conversions (${this.maxConcurrent}) reached`
      }
    }

    // Règle 21.1 : Ajout atomique
    this.activeConversions.add(conversionId)
    return { allowed: true }
  }

  /**
   * Libère un slot de conversion (Règle 21.3)
   * Doit être appelé dans un bloc finally pour garantir la libération
   * @param {string} conversionId - ID unique de la conversion
   */
  releaseSlot(conversionId) {
    // Règle 21.3 : Décrémentation garantie
    this.activeConversions.delete(conversionId)
    
    // Règle 21.3 : Détection d'anomalie (compteur négatif impossible avec Set)
    if (this.activeConversions.size < 0) {
      SecurityLogger.logAnomaly(conversionId, 'NEGATIVE_CONVERSION_COUNT', {
        count: this.activeConversions.size
      })
    }
  }

  /**
   * Obtient le nombre de conversions actives
   * @returns {number}
   */
  getActiveCount() {
    return this.activeConversions.size
  }

  /**
   * Vérifie si une nouvelle conversion peut être acceptée
   * @returns {boolean}
   */
  canAcceptNew() {
    return this.activeConversions.size < this.maxConcurrent
  }
}

// Instance globale du contrôleur de concurrence
const concurrencyController = new ConcurrencyController()

// ============================================================================
// VALIDATION STRICTE DES CHEMINS (Règle 19.1)
// ============================================================================

/**
 * Validateur de chemins de fichiers
 * Implémente la Règle 19.1 de PIPELINE.md
 */
class PathValidator {
  /**
   * Valide un chemin de fichier selon les règles strictes
   * @param {string} filePath - Chemin à valider
   * @param {string} allowedBaseDir - Répertoire de base autorisé
   * @returns {Object} { valid: boolean, error?: string }
   */
  static validatePath(filePath, allowedBaseDir) {
    // Règle 19.1 : Chemins relatifs interdits
    if (!path.isAbsolute(filePath)) {
      return {
        valid: false,
        error: 'PATH_RELATIVE_NOT_ALLOWED',
        message: 'Relative paths are not allowed. All paths must be absolute.'
      }
    }

    // Règle 19.1 : Protection path traversal
    const normalizedPath = path.normalize(filePath)
    const normalizedBase = path.normalize(allowedBaseDir)
    
    if (!normalizedPath.startsWith(normalizedBase)) {
      return {
        valid: false,
        error: 'PATH_TRAVERSAL_DETECTED',
        message: 'Path traversal detected. File must be within allowed directory.'
      }
    }

    // Règle 19.1 : Détection des symlinks
    try {
      const stats = lstatSync(filePath)
      if (stats.isSymbolicLink()) {
        return {
          valid: false,
          error: 'SYMLINK_NOT_ALLOWED',
          message: 'Symbolic links are not allowed for security reasons.'
        }
      }

      // Règle 19.1 : Validation de résolution
      const realPath = realpathSync(filePath)
      if (!realPath.startsWith(normalizedBase)) {
        return {
          valid: false,
          error: 'RESOLVED_PATH_OUTSIDE_ALLOWED',
          message: 'Resolved path is outside allowed directory.'
        }
      }
    } catch (error) {
      // Si le fichier n'existe pas encore, on valide juste le chemin
      // La validation de résolution sera faite après création
    }

    return { valid: true }
  }

  /**
   * Valide qu'un chemin ne contient pas de séquences de path traversal
   * @param {string} filePath - Chemin à valider
   * @returns {boolean}
   */
  static containsPathTraversal(filePath) {
    const normalized = path.normalize(filePath)
    return normalized.includes('..') || normalized.includes('../')
  }
}

// ============================================================================
// VALIDATION DU TYPE RÉEL DE FICHIER (Règle 19.2)
// ============================================================================

/**
 * Détecteur de type MIME réel de fichier
 * Implémente la Règle 19.2 de PIPELINE.md
 */
class MimeTypeDetector {
  /**
   * Détecte le type MIME réel d'un fichier par analyse de son contenu
   * @param {string} filePath - Chemin vers le fichier
   * @param {string} declaredFormat - Format déclaré par l'utilisateur
   * @returns {Object} { valid: boolean, detectedType?: string, error?: string }
   */
  static detectAndValidate(filePath, declaredFormat) {
    try {
      // Règle 19.2 : Lecture des magic bytes / en-têtes.
      // Seul un échantillon est nécessaire : évite de relire tout le fichier
      // (coûteux pour les gros documents).
      const buffer = MimeTypeDetector.readSample(filePath, 4096)
      const detectedType = this.detectFromContent(buffer)
      
      // Règle 19.2 : Comparaison avec le format déclaré
      const expectedMimeTypes = this.getExpectedMimeTypes(declaredFormat)
      
      if (!expectedMimeTypes.includes(detectedType)) {
        return {
          valid: false,
          detectedType,
          declaredFormat,
          error: 'MIME_TYPE_MISMATCH',
          message: `File type mismatch: detected ${detectedType}, declared ${declaredFormat}`
        }
      }

      return {
        valid: true,
        detectedType,
        declaredFormat
      }
    } catch (error) {
      return {
        valid: false,
        error: 'MIME_DETECTION_FAILED',
        message: `Failed to detect file type: ${error.message}`
      }
    }
  }

  /**
   * Lit les premiers octets d'un fichier sans le charger entièrement.
   * @param {string} filePath - Chemin vers le fichier
   * @param {number} maxBytes - Nombre maximal d'octets à lire
   * @returns {Buffer} Échantillon du début du fichier
   */
  static readSample(filePath, maxBytes) {
    const fd = fs.openSync(filePath, 'r')
    try {
      const buffer = Buffer.alloc(maxBytes)
      const bytesRead = fs.readSync(fd, buffer, 0, maxBytes, 0)
      return buffer.subarray(0, bytesRead)
    } finally {
      fs.closeSync(fd)
    }
  }

  /**
   * Détecte le type MIME à partir du contenu (magic bytes)
   * @param {Buffer} buffer - Contenu du fichier (échantillon des premiers octets)
   * @returns {string} Type MIME détecté
   */
  static detectFromContent(buffer) {
    if (buffer.length === 0) {
      return 'application/octet-stream'
    }

    // Détection basée sur les magic bytes et la structure
    // Markdown : commence souvent par #, -, *, etc.
    if (buffer[0] === 0x23 || buffer[0] === 0x2D || buffer[0] === 0x2A) {
      // Vérification plus poussée pour Markdown
      const text = buffer.toString('utf8', 0, Math.min(100, buffer.length))
      if (/^#{1,6}\s|^[-*+]\s|^>\s/m.test(text)) {
        return 'text/markdown'
      }
    }

    // AsciiDoc : commence souvent par =, [, etc.
    if (buffer[0] === 0x3D || buffer[0] === 0x5B) {
      const text = buffer.toString('utf8', 0, Math.min(100, buffer.length))
      if (/^=+\s|^\[/m.test(text)) {
        return 'text/x-asciidoc'
      }
    }

    // HTML : commence par <
    if (buffer[0] === 0x3C) {
      const text = buffer.toString('utf8', 0, Math.min(100, buffer.length))
      if (/^<\s*(html|!DOCTYPE|head|body)/i.test(text)) {
        return 'text/html'
      }
    }

    // JSON : commence par { ou [
    if (buffer[0] === 0x7B || buffer[0] === 0x5B) {
      try {
        JSON.parse(buffer.toString('utf8'))
        return 'application/json'
      } catch (e) {
        // Pas du JSON valide
      }
    }

    // YAML : commence souvent par des espaces, -, |, >, etc.
    if (buffer[0] === 0x2D || buffer[0] === 0x7C || buffer[0] === 0x3E || buffer[0] === 0x20) {
      const text = buffer.toString('utf8', 0, Math.min(100, buffer.length))
      if (/^[\s-|>]|^[a-zA-Z_][a-zA-Z0-9_]*\s*:/m.test(text)) {
        return 'application/x-yaml'
      }
    }

    // Texte brut par défaut si tout le contenu est ASCII/UTF-8 valide
    try {
      const text = buffer.toString('utf8')
      // Si plus de 90% du contenu est du texte valide, on considère que c'est du texte
      // (boucle sur les charCodes : pas d'allocation d'un tableau par caractère)
      let validChars = 0
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i)
        if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
          validChars++
        }
      }

      if (validChars / text.length > 0.9) {
        return 'text/plain'
      }
    } catch (e) {
      // Pas du texte UTF-8 valide
    }

    return 'application/octet-stream'
  }

  /**
   * Obtient les types MIME attendus pour un format donné
   * @param {string} format - Format déclaré
   * @returns {string[]} Liste des types MIME acceptables
   */
  static getExpectedMimeTypes(format) {
    const formatMap = {
      'markdown': ['text/markdown', 'text/plain'],
      'asciidoc': ['text/x-asciidoc', 'text/plain'],
      'html': ['text/html', 'text/plain'],
      'txt': ['text/plain'],
      'yaml': ['application/x-yaml', 'text/x-yaml', 'text/plain'],
      'json': ['application/json', 'text/plain']
    }

    return formatMap[format.toLowerCase()] || ['text/plain']
  }
}

// ============================================================================
// BUDGET DE RESSOURCES (Règle 22)
// ============================================================================

/**
 * Gestionnaire de budget de ressources par conversion
 * Implémente la Règle 22 de PIPELINE.md
 */
class ResourceBudgetManager {
  constructor() {
    this.activeBudgets = new Map() // conversionId -> { startTime, startCpu, maxMemory, ... }
  }

  /**
   * Initialise un budget de ressources pour une conversion
   * @param {string} conversionId - ID unique de la conversion
   * @returns {Object} Budget initialisé
   */
  initializeBudget(conversionId) {
    const budget = {
      startTime: Date.now(),
      startCpu: process.cpuUsage(),
      maxMemory: 0,
      maxCpuTime: SECURITY_CONFIG.RESOURCE_BUDGET.MAX_CPU_TIME,
      maxMemoryMB: SECURITY_CONFIG.RESOURCE_BUDGET.MAX_MEMORY_MB,
      maxWallTime: SECURITY_CONFIG.RESOURCE_BUDGET.MAX_WALL_TIME
    }

    this.activeBudgets.set(conversionId, budget)
    return budget
  }

  /**
   * Vérifie si le budget de ressources est respecté
   * @param {string} conversionId - ID unique de la conversion
   * @returns {Object} { withinBudget: boolean, exceeded?: string, details?: Object }
   */
  checkBudget(conversionId) {
    const budget = this.activeBudgets.get(conversionId)
    if (!budget) {
      return { withinBudget: true } // Pas de budget = pas de limite
    }

    const now = Date.now()
    const wallTime = now - budget.startTime
    const cpuUsage = process.cpuUsage(budget.startCpu)
    const cpuTimeMs = (cpuUsage.user + cpuUsage.system) / 1000 // Convertir en ms
    const memUsage = process.memoryUsage()
    const memMB = memUsage.rss / 1024 / 1024

    // Règle 22.2 : Vérification des limites
    if (wallTime > budget.maxWallTime) {
      return {
        withinBudget: false,
        exceeded: 'WALL_TIME',
        details: { wallTime, limit: budget.maxWallTime }
      }
    }

    if (cpuTimeMs > budget.maxCpuTime) {
      return {
        withinBudget: false,
        exceeded: 'CPU_TIME',
        details: { cpuTimeMs, limit: budget.maxCpuTime }
      }
    }

    if (memMB > budget.maxMemoryMB) {
      return {
        withinBudget: false,
        exceeded: 'MEMORY',
        details: { memMB, limit: budget.maxMemoryMB }
      }
    }

    // Mise à jour de la mémoire maximale observée
    if (memMB > budget.maxMemory) {
      budget.maxMemory = memMB
    }

    return { withinBudget: true }
  }

  /**
   * Libère le budget d'une conversion
   * @param {string} conversionId - ID unique de la conversion
   */
  releaseBudget(conversionId) {
    this.activeBudgets.delete(conversionId)
  }

  /**
   * Obtient les statistiques d'utilisation d'une conversion
   * @param {string} conversionId - ID unique de la conversion
   * @returns {Object} Statistiques d'utilisation
   */
  getStats(conversionId) {
    const budget = this.activeBudgets.get(conversionId)
    if (!budget) {
      return null
    }

    const now = Date.now()
    const wallTime = now - budget.startTime
    const cpuUsage = process.cpuUsage(budget.startCpu)
    const cpuTimeMs = (cpuUsage.user + cpuUsage.system) / 1000
    const memUsage = process.memoryUsage()
    const memMB = memUsage.rss / 1024 / 1024

    return {
      wallTime,
      cpuTimeMs,
      memoryMB: memMB,
      maxMemoryMB: budget.maxMemory
    }
  }
}

// Instance globale du gestionnaire de budget
const resourceBudgetManager = new ResourceBudgetManager()

// ============================================================================
// DÉTECTION DE COMPORTEMENTS ANORMAUX (Règle 23)
// ============================================================================

/**
 * Détecteur de comportements anormaux
 * Implémente la Règle 23 de PIPELINE.md
 */
class AnomalyDetector {
  constructor() {
    // Profils de référence pour chaque type de conversion (Règle 23.3)
    this.referenceProfiles = new Map()
    // Format: { 'from_to': { avgDuration, avgMemory, count } }
  }

  /**
   * Détecte les tentatives d'accès hors du dossier temporaire (Règle 23.1)
   * @param {string} filePath - Chemin tenté
   * @param {string} allowedBaseDir - Répertoire autorisé
   * @param {string} conversionId - ID de la conversion
   * @returns {Object} { isAnomaly: boolean, details?: Object }
   */
  detectUnauthorizedAccess(filePath, allowedBaseDir, conversionId) {
    const validation = PathValidator.validatePath(filePath, allowedBaseDir)
    
    if (!validation.valid) {
      SecurityLogger.logAnomaly(conversionId, 'UNAUTHORIZED_FILE_ACCESS', {
        attemptedPath: filePath,
        allowedBase: allowedBaseDir,
        error: validation.error
      })
      
      return {
        isAnomaly: true,
        type: 'UNAUTHORIZED_FILE_ACCESS',
        details: validation
      }
    }

    return { isAnomaly: false }
  }

  /**
   * Détecte les profils d'exécution anormaux (Règle 23.3)
   * @param {string} conversionId - ID de la conversion
   * @param {string} fromFormat - Format source
   * @param {string} toFormat - Format cible
   * @param {number} duration - Durée d'exécution en ms
   * @param {number} memoryMB - Mémoire utilisée en MB
   * @returns {Object} { isAnomaly: boolean, details?: Object }
   */
  detectAbnormalProfile(conversionId, fromFormat, toFormat, duration, memoryMB) {
    const profileKey = `${fromFormat}_${toFormat}`
    const profile = this.referenceProfiles.get(profileKey)

    if (!profile) {
      // Premier profil, on l'enregistre comme référence
      this.referenceProfiles.set(profileKey, {
        avgDuration: duration,
        avgMemory: memoryMB,
        count: 1
      })
      return { isAnomaly: false }
    }

    // Règle 23.3 : Détection d'écarts significatifs
    const durationMultiplier = duration / profile.avgDuration
    const memoryMultiplier = memoryMB / profile.avgMemory

    const isAbnormal = 
      durationMultiplier > SECURITY_CONFIG.ABNORMAL_PROFILE_MULTIPLIERS.DURATION ||
      memoryMultiplier > SECURITY_CONFIG.ABNORMAL_PROFILE_MULTIPLIERS.MEMORY

    if (isAbnormal) {
      SecurityLogger.logAnomaly(conversionId, 'ABNORMAL_EXECUTION_PROFILE', {
        profileKey,
        duration,
        avgDuration: profile.avgDuration,
        durationMultiplier,
        memoryMB,
        avgMemory: profile.avgMemory,
        memoryMultiplier
      })

      return {
        isAnomaly: true,
        type: 'ABNORMAL_EXECUTION_PROFILE',
        details: {
          durationMultiplier,
          memoryMultiplier
        }
      }
    }

    // Mise à jour du profil de référence (moyenne mobile)
    profile.avgDuration = (profile.avgDuration * profile.count + duration) / (profile.count + 1)
    profile.avgMemory = (profile.avgMemory * profile.count + memoryMB) / (profile.count + 1)
    profile.count++

    return { isAnomaly: false }
  }
}

// Instance globale du détecteur d'anomalies
const anomalyDetector = new AnomalyDetector()

// ============================================================================
// DÉGRADATION CONTRÔLÉE (Règle 24)
// ============================================================================

/**
 * Gestionnaire de dégradation contrôlée
 * Implémente la Règle 24 de PIPELINE.md
 */
class GracefulDegradationManager {
  constructor() {
    this.recentFailures = [] // Historique des échecs récents
    this.isOverloaded = false
    this.lastHealthCheck = Date.now()
  }

  /**
   * Vérifie si le système est en surcharge (Règle 24.1)
   * @returns {Object} { isOverloaded: boolean, reasons?: string[] }
   */
  checkOverload() {
    const reasons = []
    
    // Vérification du nombre de conversions simultanées
    const activeCount = concurrencyController.getActiveCount()
    const maxConcurrent = SECURITY_CONFIG.MAX_CONCURRENT_CONVERSIONS
    if (activeCount >= maxConcurrent * 0.9) {
      reasons.push('HIGH_CONCURRENCY')
    }

    // Vérification du taux d'échec récent (Règle 24.1)
    const recentWindow = 60000 // 1 minute
    const now = Date.now()
    this.recentFailures = this.recentFailures.filter(f => now - f.timestamp < recentWindow)
    
    if (this.recentFailures.length > 0) {
      const totalRecent = this.recentFailures.length
      const failureRate = totalRecent / (totalRecent + 10) // Approximation
      if (failureRate > SECURITY_CONFIG.OVERLOAD_THRESHOLDS.FAILURE_RATE) {
        reasons.push('HIGH_FAILURE_RATE')
      }
    }

    // Vérification de l'utilisation CPU/Mémoire (si disponible)
    const memUsage = process.memoryUsage()
    const totalMem = os.totalmem()
    const memPercent = (memUsage.rss / totalMem) * 100
    
    if (memPercent > SECURITY_CONFIG.OVERLOAD_THRESHOLDS.MEMORY_PERCENT) {
      reasons.push('HIGH_MEMORY_USAGE')
    }

    this.isOverloaded = reasons.length > 0
    return {
      isOverloaded: this.isOverloaded,
      reasons
    }
  }

  /**
   * Enregistre un échec de conversion (Règle 24.1)
   * @param {string} conversionId - ID de la conversion
   */
  recordFailure(conversionId) {
    this.recentFailures.push({
      conversionId,
      timestamp: Date.now()
    })
  }

  /**
   * Enregistre un succès de conversion
   * @param {string} conversionId - ID de la conversion
   */
  recordSuccess(conversionId) {
    // Les succès ne sont pas enregistrés, seuls les échecs comptent pour la surcharge
  }

  /**
   * Vérifie si une nouvelle conversion peut être acceptée (Règle 24.2)
   * @returns {Object} { canAccept: boolean, reason?: string }
   */
  canAcceptNewConversion() {
    const overload = this.checkOverload()
    
    if (overload.isOverloaded) {
      return {
        canAccept: false,
        reason: 'SYSTEM_OVERLOADED',
        message: 'System is temporarily overloaded. Please try again later.',
        details: overload.reasons
      }
    }

    return { canAccept: true }
  }
}

// Instance globale du gestionnaire de dégradation
const gracefulDegradationManager = new GracefulDegradationManager()

// ============================================================================
// JOURNALISATION MINIMALE DE SÉCURITÉ (Règle 18)
// ============================================================================

/**
 * Journaliseur de sécurité
 * Implémente la Règle 18 de PIPELINE.md
 */
class SecurityLogger {
  /**
   * S'assure que le répertoire de logs existe.
   * Les méthodes de log étant statiques, le constructeur n'est jamais
   * appelé : la création doit se faire au moment de l'écriture.
   */
  static ensureLogDirectory() {
    if (!fs.existsSync(SECURITY_CONFIG.SECURITY_LOG_PATH)) {
      fs.mkdirSync(SECURITY_CONFIG.SECURITY_LOG_PATH, { recursive: true, mode: 0o700 })
    }
  }

  /**
   * Journalise une conversion selon la Règle 18.1
   * @param {string} conversionId - ID unique de conversion
   * @param {string} fromFormat - Format source
   * @param {string} toFormat - Format cible
   * @param {string[]} modulesExecuted - Liste des modules exécutés
   * @param {number} duration - Durée en millisecondes
   * @param {string} status - Statut final (SUCCESS, FAILED, TIMEOUT, etc.)
   * @param {Date} startTime - Heure de début
   * @param {Date} endTime - Heure de fin
   */
  static logConversion(conversionId, fromFormat, toFormat, modulesExecuted, duration, status, startTime, endTime) {
    // Règle 18.1 : Contenu obligatoire du log de sécurité
    const logEntry = {
      timestamp: new Date().toISOString(),
      conversionId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      fromFormat: fromFormat.toLowerCase(),
      toFormat: toFormat.toLowerCase(),
      modulesExecuted: modulesExecuted || [],
      duration,
      status
    }

    // Règle 18.2 : Format structuré (JSON)
    const logLine = JSON.stringify(logEntry) + '\n'
    
    // Règle 18.2 : Stockage persistant
    const logFile = path.join(
      SECURITY_CONFIG.SECURITY_LOG_PATH,
      `security-${new Date().toISOString().split('T')[0]}.log`
    )

    try {
      SecurityLogger.ensureLogDirectory()
      fs.appendFileSync(logFile, logLine, { encoding: 'utf8', mode: 0o600 })
    } catch (error) {
      console.error(`[SECURITY_LOGGER] Failed to write security log: ${error.message}`)
    }

    // Règle 18.3 : Intégrité - log également en console pour traçabilité
    console.log(`[SECURITY_LOG] ${logLine.trim()}`)
  }

  /**
   * Journalise une anomalie détectée
   * @param {string} conversionId - ID de la conversion
   * @param {string} anomalyType - Type d'anomalie
   * @param {Object} details - Détails de l'anomalie
   */
  static logAnomaly(conversionId, anomalyType, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      conversionId,
      anomalyType,
      details: this.sanitizeDetails(details)
    }

    const logLine = JSON.stringify(logEntry) + '\n'
    const logFile = path.join(
      SECURITY_CONFIG.SECURITY_LOG_PATH,
      `anomalies-${new Date().toISOString().split('T')[0]}.log`
    )

    try {
      SecurityLogger.ensureLogDirectory()
      fs.appendFileSync(logFile, logLine, { encoding: 'utf8', mode: 0o600 })
      console.error(`[SECURITY_ANOMALY] ${logLine.trim()}`)
    } catch (error) {
      console.error(`[SECURITY_LOGGER] Failed to write anomaly log: ${error.message}`)
    }
  }

  /**
   * Nettoie les détails pour éviter d'exposer des informations sensibles
   * @param {Object} details - Détails bruts
   * @returns {Object} Détails nettoyés
   */
  static sanitizeDetails(details) {
    const sanitized = { ...details }
    
    // Ne pas logger de chemins complets, seulement les noms de fichiers
    if (sanitized.attemptedPath) {
      sanitized.attemptedPath = path.basename(sanitized.attemptedPath)
    }
    
    // Limiter la taille des détails
    const detailsStr = JSON.stringify(sanitized)
    if (detailsStr.length > 500) {
      return { truncated: true, length: detailsStr.length }
    }

    return sanitized
  }
}

// ============================================================================
// VÉRIFICATION D'INTÉGRITÉ DES MODULES
// ============================================================================

/**
 * Vérificateur d'intégrité des modules
 * Calcule et vérifie les hashs des modules pour détecter les modifications
 */
class ModuleIntegrityChecker {
  /**
   * Calcule le hash SHA-256 d'un fichier de module
   * @param {string} modulePath - Chemin vers le module
   * @returns {string} Hash hexadécimal
   */
  static calculateHash(modulePath) {
    try {
      const content = readFileSync(modulePath)
      return createHash('sha256').update(content).digest('hex')
    } catch (error) {
      throw new Error(`Failed to calculate hash for ${modulePath}: ${error.message}`)
    }
  }

  /**
   * Vérifie l'intégrité d'un module
   * @param {string} modulePath - Chemin vers le module
   * @param {string} expectedHash - Hash attendu (optionnel, calculé au premier appel)
   * @returns {Object} { valid: boolean, hash?: string, error?: string }
   */
  static verifyIntegrity(modulePath, expectedHash = null) {
    try {
      const currentHash = this.calculateHash(modulePath)
      
      // Si pas de hash attendu, on l'enregistre comme référence
      if (!expectedHash) {
        if (!SECURITY_CONFIG.MODULE_INTEGRITY[modulePath]) {
          SECURITY_CONFIG.MODULE_INTEGRITY[modulePath] = {
            hash: currentHash,
            lastModified: fs.statSync(modulePath).mtimeMs
          }
        }
        return { valid: true, hash: currentHash }
      }

      // Vérification du hash
      if (currentHash !== expectedHash) {
        return {
          valid: false,
          hash: currentHash,
          expectedHash,
          error: 'MODULE_INTEGRITY_VIOLATION',
          message: `Module integrity check failed: hash mismatch`
        }
      }

      return { valid: true, hash: currentHash }
    } catch (error) {
      return {
        valid: false,
        error: 'INTEGRITY_CHECK_FAILED',
        message: `Failed to verify module integrity: ${error.message}`
      }
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Contrôleurs
  concurrencyController,
  resourceBudgetManager,
  gracefulDegradationManager,
  anomalyDetector,
  
  // Validateurs
  PathValidator,
  MimeTypeDetector,
  ModuleIntegrityChecker,
  
  // Journalisation
  SecurityLogger,
  
  // Configuration
  SECURITY_CONFIG
}
