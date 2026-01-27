'use strict'

/**
 * INPUT VALIDATION FOR ADOC/MD ROUND-TRIP PIPELINE
 *
 * - Vérifie fichier source existe et non vide
 * - Normalise : UTF-8, suppression BOM, trim des lignes
 * - Vérifie les chemins d'images (AsciiDoc image::path[], Markdown ![](path))
 * - Retourne input_invalid si anomalies, logs détaillés
 */

const path = require('path')
const { readFileSync, existsSync, statSync } = require('fs')

const STATE_INPUT_INVALID = 'input_invalid'

/**
 * Normalise le texte : encodage UTF-8, suppression BOM, trim des lignes
 * @param {string} content
 * @returns {string}
 */
function normalizeText(content) {
  if (content == null || typeof content !== 'string') return ''
  let s = content
  if (s.charCodeAt(0) === 0xFEFF || s.startsWith('\uFEFF')) {
    s = s.slice(1)
  }
  s = s.normalize('NFC')
  return s.split('\n').map(line => line.trimEnd()).join('\n').trim()
}

/**
 * Extrait les chemins d'images AsciiDoc : image::path[] ou image:path[]
 * @param {string} content
 * @returns {string[]} chemins relatifs ou absolus
 */
function extractAsciiDocImagePaths(content) {
  if (!content || typeof content !== 'string') return []
  const paths = []
  const re = /image::{1,2}([^[\]]+)\[\s*\]/g
  let m
  while ((m = re.exec(content)) !== null) {
    const p = m[1].trim()
    if (p) paths.push(p)
  }
  const re2 = /image:([^[\]]+)\[\s*\]/g
  while ((m = re2.exec(content)) !== null) {
    const p = m[1].trim()
    if (p) paths.push(p)
  }
  return [...new Set(paths)]
}

/**
 * Extrait les chemins d'images Markdown : ![alt](path)
 * @param {string} content
 * @returns {string[]}
 */
function extractMarkdownImagePaths(content) {
  if (!content || typeof content !== 'string') return []
  const paths = []
  const re = /!\[([^\]]*)\]\(\s*([^)\s]+)\s*\)/g
  let m
  while ((m = re.exec(content)) !== null) {
    const p = m[2].trim()
    if (p && !p.startsWith('http://') && !p.startsWith('https://')) paths.push(p)
  }
  return [...new Set(paths)]
}

/**
 * Résout un chemin par rapport à baseDir (si relatif) et vérifie existence
 * @param {string} imagePath - chemin tel que dans le document
 * @param {string} baseDir - répertoire de base (souvent répertoire du fichier source)
 * @returns {{ absolutePath: string, exists: boolean }}
 */
function resolveAndCheckImagePath(imagePath, baseDir) {
  const resolved = path.isAbsolute(imagePath)
    ? imagePath
    : path.resolve(baseDir, imagePath)
  return { absolutePath: resolved, exists: existsSync(resolved) }
}

/**
 * Vérifie que les blocs AsciiDoc (source/listing et admonitions) sont correctement fermés.
 * - [source,bash] ... ---- ... ---- : délimiteurs ---- en nombre pair
 * - [NOTE] ... ==== ... ==== : délimiteurs ==== (ligne seule) en nombre pair
 * @param {string} content - contenu AsciiDoc normalisé
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateAsciiDocBlocks(content) {
  const errors = []
  if (!content || typeof content !== 'string') {
    return { valid: true, errors: [] }
  }
  const lines = content.split(/\r?\n/)
  let countListing = 0   // ---- (lignes entièrement ----)
  let countBlock = 0    // ==== (lignes exactement ==== pour blocs)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (/^-{4,}$/.test(trimmed)) {
      countListing++
    }
    if (/^={4}$/.test(trimmed)) {
      countBlock++
    }
  }

  if (countListing % 2 !== 0) {
    errors.push('Unclosed listing/source block: delimiter ---- must appear in pairs (every [source,...] ... ---- block must be closed with ----)')
  }
  if (countBlock % 2 !== 0) {
    errors.push('Unclosed admonition or block: delimiter ==== must appear in pairs (every [NOTE]/[WARNING]/... ==== block must be closed with ====)')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Vérifie que tous les chemins d'images pointent vers des fichiers existants
 * @param {string} content
 * @param {'asciidoc'|'markdown'} format
 * @param {string} baseDir - répertoire de base pour les chemins relatifs
 * @returns {{ valid: boolean, missing: Array<{path: string, resolved: string}>, errors: string[] }}
 */
function validateImagePaths(content, format, baseDir) {
  const missing = []
  const errors = []
  const paths = format === 'asciidoc'
    ? extractAsciiDocImagePaths(content)
    : extractMarkdownImagePaths(content)

  for (const p of paths) {
    const { absolutePath, exists } = resolveAndCheckImagePath(p, baseDir)
    if (!exists) {
      missing.push({ path: p, resolved: absolutePath })
      errors.push(`Image path does not exist: "${p}" (resolved: ${absolutePath})`)
    }
  }
  return {
    valid: missing.length === 0,
    missing,
    errors
  }
}

/**
 * Validation complète de l'entrée avant conversion
 * @param {string} filePath - chemin absolu du fichier source
 * @param {'asciidoc'|'markdown'} format
 * @param {Object} log - fonction ou objet pour journaliser (log.push(string) ou log.info(string))
 * @returns {{ valid: boolean, state?: string, errors: string[], normalizedContent?: string }}
 */
function validateInputFile(filePath, format, log = []) {
  const logs = Array.isArray(log) ? log : []
  const push = (msg) => { logs.push(msg); if (log && typeof log.push === 'function' && log !== logs) log.push(msg) }

  const errors = []

  if (!filePath || typeof filePath !== 'string') {
    errors.push('Input file path is missing or invalid')
    return { valid: false, state: STATE_INPUT_INVALID, errors, normalizedContent: undefined }
  }

  if (!existsSync(filePath)) {
    push(`[INPUT_VALIDATION] File does not exist: ${filePath}`)
    errors.push(`File does not exist: ${filePath}`)
    return { valid: false, state: STATE_INPUT_INVALID, errors, normalizedContent: undefined }
  }

  let stat
  try {
    stat = statSync(filePath)
  } catch (e) {
    push(`[INPUT_VALIDATION] Cannot read file: ${e.message}`)
    errors.push(`Cannot read file: ${e.message}`)
    return { valid: false, state: STATE_INPUT_INVALID, errors, normalizedContent: undefined }
  }

  if (stat.size === 0) {
    push('[INPUT_VALIDATION] File is empty (0 bytes)')
    errors.push('File is empty')
    return { valid: false, state: STATE_INPUT_INVALID, errors, normalizedContent: undefined }
  }

  let content
  try {
    content = readFileSync(filePath, 'utf8')
  } catch (e) {
    push(`[INPUT_VALIDATION] Failed to read file as UTF-8: ${e.message}`)
    errors.push(`Failed to read file: ${e.message}`)
    return { valid: false, state: STATE_INPUT_INVALID, errors, normalizedContent: undefined }
  }

  const normalizedContent = normalizeText(content)
  if (normalizedContent.length === 0) {
    push('[INPUT_VALIDATION] Content is empty after normalization (trim, BOM, UTF-8)')
    errors.push('Content is empty after normalization')
    return { valid: false, state: STATE_INPUT_INVALID, errors, normalizedContent: '' }
  }

  const baseDir = path.dirname(filePath)
  const imgCheck = validateImagePaths(normalizedContent, format, baseDir)
  if (!imgCheck.valid) {
    for (const e of imgCheck.errors) {
      push(`[INPUT_VALIDATION] ${e}`)
      errors.push(e)
    }
    return { valid: false, state: STATE_INPUT_INVALID, errors, normalizedContent: undefined }
  }

  if (format === 'asciidoc') {
    const blockCheck = validateAsciiDocBlocks(normalizedContent)
    if (!blockCheck.valid) {
      for (const e of blockCheck.errors) {
        push(`[INPUT_VALIDATION] ${e}`)
        errors.push(e)
      }
      return { valid: false, state: STATE_INPUT_INVALID, errors, normalizedContent: undefined }
    }
  }

  push(`[INPUT_VALIDATION] Input valid: ${filePath}, ${normalizedContent.length} chars, format=${format}`)
  return { valid: true, state: undefined, errors: [], normalizedContent }
}

module.exports = {
  STATE_INPUT_INVALID,
  normalizeText,
  extractAsciiDocImagePaths,
  extractMarkdownImagePaths,
  validateImagePaths,
  validateAsciiDocBlocks,
  validateInputFile,
  resolveAndCheckImagePath
}
