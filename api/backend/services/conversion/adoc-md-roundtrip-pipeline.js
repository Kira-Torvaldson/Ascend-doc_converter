'use strict'

/**
 * ROUND-TRIP PIPELINE AsciiDoc → Markdown (GFM) → AsciiDoc
 *
 * - Valide l'entrée (fichier, normalisation, chemins d'images)
 * - Convertit Adoc → MD avec Pandoc -f asciidoc -t gfm
 * - Valide la sortie MD (existe, non vide, structure)
 * - Convertit MD → Adoc avec Pandoc -f gfm -t asciidoc
 * - Valide la sortie Adoc (existe, non vide, structure)
 * - États : success | conversion_failed | no_output | input_invalid
 * - Ne modifie jamais le fichier source. Ne produit pas de sortie en cas d'échec.
 */

const path = require('path')
const { spawn } = require('child_process')
const { readFileSync, existsSync, statSync, unlinkSync, mkdirSync, writeFileSync } = require('fs')
const { tmpdir } = require('os')
const { randomUUID, createHash } = require('crypto')

const { validateInputFile, STATE_INPUT_INVALID, normalizeText, extractAsciiDocImagePaths, extractMarkdownImagePaths } = require('../validation/input-validation.js')

// Pandoc path (aligné avec converter-orchestrator)
function getPandocPath() {
  try {
    const { envMap } = require('../config/envmap.module.js')
    return envMap.get('PANDOC_PATH')
  } catch (e) {
    return process.env.PANDOC_PATH || 'pandoc'
  }
}

const STATE_CONVERSION_FAILED = 'conversion_failed'
const STATE_NO_OUTPUT = 'no_output'
const STATE_SUCCESS = 'success'

/**
 * Processes AsciiDoc header: if it ends with :experimental:, adds :toc: automatically
 * 
 * @param {string} asciidoc - AsciiDoc content
 * @returns {string} AsciiDoc content with :toc: added after :experimental: if present
 */
function removeExperimentalTag(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') {
    return asciidoc
  }

  const lines = asciidoc.split('\n')
  const result = []
  let foundExperimental = false
  let tocAdded = false

  // Find :experimental: in the header (before the document title starting with =)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Check if we've reached the document title (header ends here)
    if (/^=+\s+/.test(trimmed)) {
      // If we found :experimental: and haven't added :toc: yet, add it now
      if (foundExperimental && !tocAdded) {
        result.push(':toc:')
        tocAdded = true
      }
      result.push(line)
      continue
    }

    // Check if this is :experimental:
    if (/^:experimental:\s*$/i.test(trimmed)) {
      foundExperimental = true
      result.push(line)
      // Check if next line is not :toc: already
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
      if (!/^:toc:\s*$/i.test(nextLine)) {
        // Add :toc: immediately after :experimental:
        result.push(':toc:')
        tocAdded = true
      }
      continue
    }

    result.push(line)
  }

  return result.join('\n')
}

/**
 * Compte les éléments structurels dans un contenu AsciiDoc
 * @param {string} content
 * @returns {{ headings: number, codeBlocks: number, images: number, admonitions: number }}
 */
function countAsciiDocStructure(content) {
  if (!content || typeof content !== 'string') {
    return { headings: 0, codeBlocks: 0, images: 0, admonitions: 0 }
  }
  const headings = (content.match(/^=+[^=\s]\s+/gm) || []).length
  const listingDelims = content.match(/^-{4,}$/gm) || []
  const codeBlocks = Math.floor(listingDelims.length / 2)
  const images = extractAsciiDocImagePaths(content).length
  const admonitions = (content.match(/^\[(?:NOTE|WARNING|TIP|IMPORTANT|CAUTION|INFO)\]/gim) || []).length
  return { headings, codeBlocks, images, admonitions }
}

/**
 * Compte les éléments structurels dans un contenu Markdown
 * @param {string} content
 * @returns {{ headings: number, codeBlocks: number, images: number, blockquotes: number }}
 */
function countMarkdownStructure(content) {
  if (!content || typeof content !== 'string') {
    return { headings: 0, codeBlocks: 0, images: 0, blockquotes: 0 }
  }
  const headings = (content.match(/^#+\s+/gm) || []).length
  const codeFences = content.match(/```/g) || []
  const codeBlocks = Math.floor(codeFences.length / 2)
  const images = extractMarkdownImagePaths(content).length
  const blockquotes = (content.match(/^>\s/mg) || []).length
  return { headings, codeBlocks, images, blockquotes }
}

/**
 * Vérifie qu'un fichier de sortie existe, non vide, a une structure cohérente,
 * et préserve tous les blocs de code, titres et images de la source.
 * Pour MD après Adoc→MD : les admonitions [NOTE] doivent apparaître en blockquotes (> NOTE: ...).
 * Pour Adoc après MD→Adoc : les blockquotes doivent être reconvertis en [NOTE] ... ====.
 *
 * @param {string} filePath
 * @param {'markdown'|'asciidoc'} format
 * @param {{ sourceAdoc?: string, sourceMd?: string }} options - contenu source pour comparaison
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateConversionOutput(filePath, format, options = {}) {
  if (!filePath || !existsSync(filePath)) {
    return { valid: false, reason: 'output file does not exist' }
  }
  let size
  try {
    size = statSync(filePath).size
  } catch (_) {
    return { valid: false, reason: 'output file not readable' }
  }
  if (size === 0) {
    return { valid: false, reason: 'output file is empty (0 bytes)' }
  }
  let content
  try {
    content = readFileSync(filePath, 'utf8')
  } catch (_) {
    return { valid: false, reason: 'output file not readable as UTF-8' }
  }
  const t = content.trim()
  if (t.length === 0) {
    return { valid: false, reason: 'output is empty after trim' }
  }

  if (format === 'markdown') {
    const hasStructure = /#+/.test(t) || /```/.test(t) || /!\[.*?\]\(/.test(t) || /^>\s/m.test(t)
    if (!hasStructure && t.length < 10) {
      return { valid: false, reason: 'Markdown output has no headings, code blocks, images or blockquotes' }
    }
    if (options.sourceAdoc) {
      const src = countAsciiDocStructure(options.sourceAdoc)
      const out = countMarkdownStructure(content)
      if (src.headings > 0 && out.headings < src.headings) {
        return { valid: false, reason: `AsciiDoc → Markdown failed: headings not preserved (expected at least ${src.headings}, got ${out.headings})` }
      }
      if (src.codeBlocks > 0 && out.codeBlocks < src.codeBlocks) {
        return { valid: false, reason: `AsciiDoc → Markdown failed: code blocks not preserved (expected at least ${src.codeBlocks}, got ${out.codeBlocks})` }
      }
      if (src.images > 0 && out.images < src.images) {
        return { valid: false, reason: `AsciiDoc → Markdown failed: images not preserved (expected at least ${src.images}, got ${out.images})` }
      }
      if (src.admonitions > 0 && out.blockquotes < 1 && !/NOTE:|WARNING:|TIP:|IMPORTANT:|CAUTION:/im.test(content)) {
        return { valid: false, reason: 'AsciiDoc → Markdown failed: admonitions [NOTE] etc. must be converted to blockquotes (> NOTE: ...)' }
      }
    }
  } else {
    const hasStructure = /^=+?\s+/m.test(t) || /image::/i.test(t) || /^\[.*\]\s*$/m.test(t) || /^-{4,}$/m.test(t)
    if (!hasStructure && t.length < 10) {
      return { valid: false, reason: 'AsciiDoc output has no headings, images or source blocks' }
    }
    if (options.sourceMd) {
      const src = countMarkdownStructure(options.sourceMd)
      const out = countAsciiDocStructure(content)
      if (src.headings > 0 && out.headings < src.headings) {
        return { valid: false, reason: `Markdown → AsciiDoc failed: headings not preserved (expected at least ${src.headings}, got ${out.headings})` }
      }
      if (src.codeBlocks > 0 && out.codeBlocks < src.codeBlocks) {
        return { valid: false, reason: `Markdown → AsciiDoc failed: code blocks not preserved (expected at least ${src.codeBlocks}, got ${out.codeBlocks})` }
      }
      if (src.images > 0 && out.images < src.images) {
        return { valid: false, reason: `Markdown → AsciiDoc failed: images not preserved (expected at least ${src.images}, got ${out.images})` }
      }
      if (src.blockquotes > 0 && !/\[(?:NOTE|WARNING|TIP|IMPORTANT|CAUTION|INFO)\]/im.test(content) && !/^={4}$/m.test(content)) {
        return { valid: false, reason: 'Markdown → AsciiDoc failed: blockquotes must be reconverted to [NOTE] ... ====' }
      }
    }
  }
  return { valid: true }
}

/**
 * Exécute Pandoc et attend la fin
 * @param {string} pandocPath
 * @param {string[]} args
 * @param {string} cwd
 * @param {number} timeoutMs
 * @returns {Promise<{ success: boolean, stderr: string, error?: string }>}
 */
function runPandoc(pandocPath, args, cwd, timeoutMs = 30000) {
  return new Promise((resolve) => {
    const proc = spawn(pandocPath, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    proc.stderr.on('data', (d) => { stderr += d.toString() })
    const tid = setTimeout(() => {
      if (!proc.killed) {
        proc.kill('SIGTERM')
        resolve({ success: false, stderr, error: `Pandoc timeout after ${timeoutMs}ms` })
      }
    }, timeoutMs)
    proc.on('close', (code) => {
      clearTimeout(tid)
      if (code !== 0) {
        resolve({ success: false, stderr, error: stderr || `Pandoc exited with code ${code}` })
      } else {
        resolve({ success: true, stderr })
      }
    })
    proc.on('error', (err) => {
      clearTimeout(tid)
      resolve({ success: false, stderr: err.message, error: err.message })
    })
  })
}

/**
 * Pipeline round-trip : AsciiDoc → Markdown (GFM) → AsciiDoc
 *
 * @param {string} inputAdocPath - chemin absolu du fichier AsciiDoc source (non modifié)
 * @param {Object} options
 * @param {string} [options.conversionId] - id pour les logs
 * @param {string} [options.workDir] - répertoire de travail (défaut: tmp)
 * @param {number} [options.timeout] - timeout Pandoc en ms
 * @returns {Promise<{
 *   success: boolean,
 *   state: 'success'|'conversion_failed'|'no_output'|'input_invalid',
 *   logs: string[],
 *   errors?: string[],
 *   markdownPath?: string,
 *   asciidocPath?: string,
 *   markdownContent?: string,
 *   asciidocContent?: string
 * }>}
 */
async function runRoundTrip(inputAdocPath, options = {}) {
  const conversionId = options.conversionId || randomUUID()
  const timeout = options.timeout || 30000
  const logs = []

  const workDir = options.workDir || path.join(tmpdir(), `ascend-roundtrip-${conversionId}`)
  const mdPath = path.join(workDir, 'resultat.md')
  const adocPath = path.join(workDir, 'resultat.adoc')
  const cleanedInputPath = path.join(workDir, 'input_cleaned.adoc')

  function ensureWorkDir() {
    if (!existsSync(workDir)) mkdirSync(workDir, { recursive: true })
  }

  const out = {
    success: false,
    state: STATE_NO_OUTPUT,
    logs,
    errors: []
  }

  // ---------- 1. Pré-vérification de l'entrée (fichier, normalisation, images, blocs fermés) ----------
  logs.push(`[${conversionId}] Round-trip pipeline started: ${inputAdocPath}`)
  const inputValidation = validateInputFile(inputAdocPath, 'asciidoc', logs)
  if (!inputValidation.valid) {
    out.state = STATE_INPUT_INVALID
    out.errors = inputValidation.errors
    logs.push(`[${conversionId}] Input invalid → pipeline stopped, state=input_invalid`)
    return out
  }
  let sourceAdocContent = inputValidation.normalizedContent ?? readFileSync(inputAdocPath, 'utf8')
  
  // Remove :experimental: tag from header if present
  sourceAdocContent = removeExperimentalTag(sourceAdocContent)
  logs.push(`[${conversionId}] Removed :experimental: tag from header if present`)

  ensureWorkDir()
  
  // Create cleaned input file for Pandoc (without :experimental: tag)
  writeFileSync(cleanedInputPath, sourceAdocContent, 'utf8')
  logs.push(`[${conversionId}] Created cleaned input file: ${cleanedInputPath}`)
  
  let pandocPath = getPandocPath()
  if (!pandocPath || typeof pandocPath !== 'string') {
    pandocPath = 'pandoc'
  }
  if (path.isAbsolute(pandocPath) && !existsSync(pandocPath)) {
    const msg = `Pandoc binary not found at ${pandocPath}`
    logs.push(`[${conversionId}] ${msg}`)
    out.state = STATE_CONVERSION_FAILED
    out.errors.push(msg)
    // Cleanup temp file
    if (existsSync(cleanedInputPath)) try { unlinkSync(cleanedInputPath) } catch (_) {}
    return out
  }

  // ---------- 2. Conversion AsciiDoc → Markdown (GFM) ----------
  logs.push(`[${conversionId}] AsciiDoc → Markdown (Pandoc -f asciidoc -t gfm)`)
  const adocToMd = await runPandoc(
    pandocPath,
    ['-f', 'asciidoc', '-t', 'gfm', '-o', mdPath, cleanedInputPath],
    workDir,
    timeout
  )
  if (!adocToMd.success) {
    logs.push(`[${conversionId}] AsciiDoc → Markdown failed: ${adocToMd.error}`)
    out.state = STATE_CONVERSION_FAILED
    out.errors.push(`AsciiDoc → Markdown failed: ${adocToMd.error}`)
    if (existsSync(mdPath)) try { unlinkSync(mdPath) } catch (_) {}
    if (existsSync(cleanedInputPath)) try { unlinkSync(cleanedInputPath) } catch (_) {}
    return out
  }

  const mdValidation = validateConversionOutput(mdPath, 'markdown', { sourceAdoc: sourceAdocContent })
  if (!mdValidation.valid) {
    logs.push(`[${conversionId}] AsciiDoc → Markdown failed: ${mdValidation.reason}`)
    out.state = STATE_CONVERSION_FAILED
    out.errors.push(`AsciiDoc → Markdown failed: ${mdValidation.reason}`)
    if (existsSync(mdPath)) try { unlinkSync(mdPath) } catch (_) {}
    if (existsSync(cleanedInputPath)) try { unlinkSync(cleanedInputPath) } catch (_) {}
    return out
  }
  const mdContent = readFileSync(mdPath, 'utf8')
  logs.push(`[${conversionId}] Markdown output valid (blocs de code, titres, images, blockquotes préservés): ${mdPath}`)

  // ---------- 3. Conversion Markdown → AsciiDoc ----------
  logs.push(`[${conversionId}] Markdown → AsciiDoc (Pandoc -f gfm -t asciidoc)`)
  const mdToAdoc = await runPandoc(
    pandocPath,
    ['-f', 'gfm', '-t', 'asciidoc', '-o', adocPath, mdPath],
    workDir,
    timeout
  )
  if (!mdToAdoc.success) {
    logs.push(`[${conversionId}] Markdown → AsciiDoc failed: ${mdToAdoc.error}`)
    out.state = STATE_CONVERSION_FAILED
    out.errors.push(`Markdown → AsciiDoc failed: ${mdToAdoc.error}`)
    if (existsSync(adocPath)) try { unlinkSync(adocPath) } catch (_) {}
    if (existsSync(mdPath)) try { unlinkSync(mdPath) } catch (_) {}
    if (existsSync(cleanedInputPath)) try { unlinkSync(cleanedInputPath) } catch (_) {}
    return out
  }

  const adocValidation = validateConversionOutput(adocPath, 'asciidoc', { sourceMd: mdContent })
  if (!adocValidation.valid) {
    logs.push(`[${conversionId}] Markdown → AsciiDoc failed: ${adocValidation.reason}`)
    out.state = STATE_CONVERSION_FAILED
    out.errors.push(`Markdown → AsciiDoc failed: ${adocValidation.reason}`)
    if (existsSync(adocPath)) try { unlinkSync(adocPath) } catch (_) {}
    if (existsSync(mdPath)) try { unlinkSync(mdPath) } catch (_) {}
    if (existsSync(cleanedInputPath)) try { unlinkSync(cleanedInputPath) } catch (_) {}
    return out
  }
  logs.push(`[${conversionId}] AsciiDoc output valid (blocs de code, titres, images, [NOTE]...==== préservés): ${adocPath}`)

  // ---------- 4. Succès : livrer uniquement les fichiers valides ----------
  out.success = true
  out.state = STATE_SUCCESS
  out.markdownPath = mdPath
  out.asciidocPath = adocPath
  let markdownContent = ''
  let asciidocContent = ''
  try {
    markdownContent = readFileSync(mdPath, 'utf8')
    asciidocContent = readFileSync(adocPath, 'utf8')
    out.markdownContent = markdownContent
    out.asciidocContent = asciidocContent
  } catch (e) {
    out.success = false
    out.state = STATE_CONVERSION_FAILED
    out.errors.push(`Failed to read output: ${e.message}`)
    logs.push(`[${conversionId}] Round-trip pipeline finished: state=success`)
    return out
  }

  const srcStruct = countAsciiDocStructure(sourceAdocContent)
  out.blocks_detected = srcStruct.codeBlocks + (srcStruct.admonitions || 0)
  out.images_detected = srcStruct.images

  const norm = (s) => (normalizeText(s || '').replace(/\r\n/g, '\n'))
  const roundTripMatch = norm(sourceAdocContent) === norm(asciidocContent)
  out.round_trip_match = roundTripMatch
  if (!roundTripMatch) {
    logs.push(`[${conversionId}] Round-trip diff: document après conversion AsciiDoc→MD→AsciiDoc ne correspond pas exactement au source (normalisé)`)
    out.errors.push('Round-trip mismatch: output AsciiDoc differs from source after normalization')
  }

  const sha = (c) => createHash('sha256').update(c || '', 'utf8').digest('hex')
  out.checksums = { source: sha(sourceAdocContent), md: sha(markdownContent), roundtrip: sha(asciidocContent) }

  // Cleanup temporary cleaned input file
  if (existsSync(cleanedInputPath)) {
    try {
      unlinkSync(cleanedInputPath)
      logs.push(`[${conversionId}] Cleaned up temporary input file`)
    } catch (_) {
      // Ignore cleanup errors
    }
  }

  logs.push(`[${conversionId}] Round-trip pipeline finished: state=success, round_trip_match=${roundTripMatch}, blocks=${out.blocks_detected}, images=${out.images_detected}`)
  return out
}

module.exports = {
  STATE_SUCCESS,
  STATE_CONVERSION_FAILED,
  STATE_NO_OUTPUT,
  STATE_INPUT_INVALID: STATE_INPUT_INVALID,
  validateConversionOutput,
  runRoundTrip,
  getPandocPath
}
