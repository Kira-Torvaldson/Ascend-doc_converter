'use strict'

/**
 * MODULE DOWNDOC
 * 
 * Wrapper pour la bibliothèque downdoc conforme à l'interface définie dans
 * doc/specifications/modules.interface.md
 * 
 * Ce module convertit des fichiers AsciiDoc en Markdown selon la spécification
 * définie dans doc/specifications/modules/downdoc.module.md
 * 
 * Références :
 * - modules.interface.md : Contrat d'interface des modules
 * - downdoc.module.md : Spécification du module downdoc
 */

const { readFileSync, writeFileSync, statSync, existsSync, unlinkSync } = require('fs')
const path = require('path')
const downdoc = require('../../../../lib/index.js')
const { adaptForBookStack } = require('../../../shared/adapters/bookstack-adapter.js')

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODULE_CONFIG = {
  // Limite maximale de taille de fichier (50 MB par défaut)
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  
  // Extensions AsciiDoc acceptées
  ALLOWED_EXTENSIONS: ['.adoc', '.asciidoc']
}

// ============================================================================
// POST-TRAITEMENT
// ============================================================================

/**
 * Nettoyage de base pour corriger les problèmes courants de downdoc
 * Conforme à la spécification downdoc.module.md
 * 
 * @param {string} markdown - Markdown brut de downdoc
 * @returns {string} Markdown nettoyé
 */
function basicCleanup(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return markdown
  }

  let result = markdown

  // Correction des règles horizontales mal formatées (- -- -> ---)
  result = result.replace(/^-\s*--\s*$/gm, '---')
  result = result.replace(/^-\s*--$/gm, '---')
  result = result.replace(/^-\s+--\s*$/gm, '---')
  result = result.replace(/^-\s*--\s+$/gm, '---')
  
  // Passage ligne par ligne pour les règles horizontales
  const lines = result.split('\n')
  const fixedLines = lines.map(line => {
    const trimmed = line.trim()
    if (trimmed === '- --' || trimmed === '-  --' || /^-\s*--\s*$/.test(trimmed)) {
      const indent = line.match(/^(\s*)/)[1]
      return indent + '---'
    }
    return line
  })
  result = fixedLines.join('\n')

  // Suppression des espaces en fin de ligne
  result = result.replace(/[ \t]+$/gm, '')

  // Normalisation des fins de fichier (un seul saut de ligne final)
  result = result.trimEnd() + '\n'

  return result
}

// ============================================================================
// VALIDATION DES ENTRÉES
// ============================================================================

/**
 * Valide le fichier d'entrée selon les obligations de sécurité minimales V1
 * Conforme à modules.interface.md - Obligation 1 : Validation basique des entrées
 * 
 * @param {string} inputPath - Chemin vers le fichier d'entrée
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateInput(inputPath) {
  // Vérification de l'existence du fichier
  if (!existsSync(inputPath)) {
    return {
      valid: false,
      error: 'Input file not found'
    }
  }

  // Vérification de la taille du fichier
  try {
    const stats = statSync(inputPath)
    if (stats.size > MODULE_CONFIG.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${stats.size} bytes) exceeds maximum allowed size (${MODULE_CONFIG.MAX_FILE_SIZE} bytes)`
      }
    }

    if (stats.size === 0) {
      return {
        valid: false,
        error: 'Input file is empty'
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: `Failed to read file stats: ${error.message}`
    }
  }

  // Vérification basique du type de fichier par extension
  const ext = path.extname(inputPath).toLowerCase()
  if (!MODULE_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File extension '${ext}' is not allowed. Allowed extensions: ${MODULE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
    }
  }

  return { valid: true }
}

// ============================================================================
// MODULE DOWNDOC
// ============================================================================

/**
 * Module downdoc conforme à l'interface modules.interface.md
 */
const downdocModule = {
  /**
   * Nom du module (modules.interface.md - Propriété 1)
   */
  name: 'downdoc',

  /**
   * Formats supportés (modules.interface.md - Propriété 2)
   */
  supportedFormats: {
    from: ['asciidoc'],
    to: ['markdown']
  },

  /**
   * Méthode run conforme à modules.interface.md
   * Implémente le processus décrit dans downdoc.module.md
   * 
   * @param {string} inputPath - Chemin absolu vers le fichier AsciiDoc d'entrée
   * @param {string} outputPath - Chemin absolu vers le fichier Markdown de sortie
   * @param {Object} options - Options de conversion (optionnel)
   * @param {string} options.mode - Mode de conversion ('default' ou 'bookstack')
   * @param {string} options.conversionId - ID de conversion pour les logs (optionnel)
   * @returns {Promise<ModuleResult>} Résultat de la conversion
   */
  async run(inputPath, outputPath, options = {}) {
    const startTime = Date.now()
    const logs = []
    const conversionId = options.conversionId || 'unknown'

    try {
      // Journalisation minimale - Obligation 4 (modules.interface.md)
      logs.push(`[${conversionId}] Conversion started at ${new Date().toISOString()}`)
      logs.push(`[${conversionId}] Input: ${path.basename(inputPath)}`)
      logs.push(`[${conversionId}] Output: ${path.basename(outputPath)}`)

      // Étape 1 : Validation des entrées (Obligation 1 - modules.interface.md)
      logs.push(`[${conversionId}] Validating input file...`)
      const validation = validateInput(inputPath)
      if (!validation.valid) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Validation failed: ${validation.error}`)
        return {
          success: false,
          logs: logs,
          error: validation.error,
          duration: duration
        }
      }
      logs.push(`[${conversionId}] Input file validated`)

      // Étape 2 : Lecture sécurisée du fichier d'entrée (downdoc.module.md)
      logs.push(`[${conversionId}] Reading input file...`)
      let asciidocContent
      try {
        asciidocContent = readFileSync(inputPath, 'utf8')
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Failed to read input file: ${error.message}`)
        return {
          success: false,
          logs: logs,
          error: `Failed to read input file: ${error.message}`,
          duration: duration
        }
      }

      // Validation que le contenu n'est pas vide
      if (!asciidocContent || typeof asciidocContent !== 'string' || asciidocContent.trim().length === 0) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Input file is empty or invalid`)
        return {
          success: false,
          logs: logs,
          error: 'Input file content is empty or invalid',
          duration: duration
        }
      }
      logs.push(`[${conversionId}] Input file read successfully (${asciidocContent.length} characters)`)

      // Étape 3 : Conversion en mémoire via downdoc (downdoc.module.md)
      logs.push(`[${conversionId}] Converting AsciiDoc to Markdown...`)
      let markdown
      try {
        const mode = options.mode || 'default'
        const downdocOptions = {}

        if (mode === 'bookstack') {
          downdocOptions.extensions = ['parsedown']
          logs.push(`[${conversionId}] Using BookStack/Parsedown mode`)
        }

        // Conversion via downdoc
        markdown = downdoc(asciidocContent, downdocOptions)
        logs.push(`[${conversionId}] Conversion completed`)
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Conversion failed: ${error.message}`)
        return {
          success: false,
          logs: logs,
          error: `Conversion failed: ${error.message}`,
          duration: duration
        }
      }

      // Étape 4 : Post-traitement du résultat (downdoc.module.md)
      logs.push(`[${conversionId}] Applying post-processing...`)
      markdown = basicCleanup(markdown)

      // Application de l'adaptateur BookStack si nécessaire
      if (options.mode === 'bookstack') {
        logs.push(`[${conversionId}] Applying BookStack adapter...`)
        markdown = adaptForBookStack(markdown)
      }
      logs.push(`[${conversionId}] Post-processing completed`)

      // Étape 5 : Écriture du résultat (downdoc.module.md)
      logs.push(`[${conversionId}] Writing output file...`)
      try {
        writeFileSync(outputPath, markdown, 'utf8')
        logs.push(`[${conversionId}] Output file written successfully`)
      } catch (error) {
        // Obligation 3 - Gestion sécurisée des erreurs : ne pas créer de fichier partiel
        // Si l'écriture échoue, on supprime le fichier s'il a été créé partiellement
        if (existsSync(outputPath)) {
          try {
            unlinkSync(outputPath)
            logs.push(`[${conversionId}] Partial output file removed`)
          } catch (unlinkError) {
            // Log mais ne pas propager l'erreur de suppression
            logs.push(`[${conversionId}] Warning: Failed to remove partial output file`)
          }
        }

        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Failed to write output file: ${error.message}`)
        return {
          success: false,
          logs: logs,
          error: `Failed to write output file: ${error.message}`,
          duration: duration
        }
      }

      // Étape 6 : Retour du résultat (downdoc.module.md)
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      logs.push(`[${conversionId}] Conversion completed successfully`)
      logs.push(`[${conversionId}] Duration: ${duration.toFixed(3)}s`)
      logs.push(`[${conversionId}] Finished at ${new Date().toISOString()}`)

      return {
        success: true,
        logs: logs,
        error: null,
        duration: duration
      }

    } catch (error) {
      // Obligation 3 - Gestion sécurisée des erreurs : capture exhaustive
      // Toute erreur non prévue doit être capturée et transformée en ModuleResult
      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Unexpected error: ${error.message}`)

      // S'assurer qu'aucun fichier de sortie partiel n'est laissé
      if (existsSync(outputPath)) {
        try {
          unlinkSync(outputPath)
          logs.push(`[${conversionId}] Partial output file removed after error`)
        } catch (unlinkError) {
          logs.push(`[${conversionId}] Warning: Failed to remove partial output file`)
        }
      }

      return {
        success: false,
        logs: logs,
        error: `Unexpected error: ${error.message}`,
        duration: duration
      }
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = downdocModule
