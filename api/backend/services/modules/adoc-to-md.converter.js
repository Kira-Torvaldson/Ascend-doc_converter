'use strict'

/**
 * AsciiDoc -> Markdown converter (Ascend)
 *
 * Role-based converter wrapper for Ascend’s module interface, using the
 * underlying "downdoc" engine when available (with Pandoc fallback per current logic).
 *
 * Conforms to the interface defined in
 * doc/specifications/modules.interface.md
 *
 * This module converts AsciiDoc files to Markdown according to the specification
 * defined in doc/specifications/modules/downdoc.module.md
 *
 * References:
 * - modules.interface.md: Module interface contract
 * - downdoc.module.md: Downdoc module specification
 */

const { statSync, existsSync, unlinkSync } = require('fs')
const { readFile, writeFile } = require('fs/promises')
const path = require('path')
const {
  adaptForBookStack,
  normalizeAdmonitionsToBlockquotes,
} = require('../../../shared/adapters/bookstack-adapter.js')
const { convertAsciiDocWithPandoc } = require('../conversion/convert.js')
const { createSuccessResult, createFailureResult } = require('../../src/utils/conversion-result.js')
const { getMaxInputSizeBytes } = require('../config/conversion-limits.js')

// Load downdoc library with absolute path resolution
const libPath = path.resolve(__dirname, '../../../../lib/index.js')
let downdoc
let downdocLoadError = null
try {
  downdoc = require(libPath)
  if (typeof downdoc !== 'function') {
    downdocLoadError = new Error(`downdoc library at ${libPath} is not a function (type: ${typeof downdoc})`)
    downdoc = null
  }
} catch (error) {
  console.error(`[downdoc.module] Failed to load downdoc library from ${libPath}:`, error.message)
  downdocLoadError = error
  downdoc = null
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODULE_CONFIG = {
  // Maximum file size: EnvMap MAX_INPUT_SIZE_MB (see conversion-limits.js)
  
  // Accepted AsciiDoc extensions
  ALLOWED_EXTENSIONS: ['.adoc', '.asciidoc']
}

function inferMimeTypeFromPath(filePath) {
  const ext = path.extname(filePath || '').toLowerCase()
  if (ext === '.adoc' || ext === '.asciidoc') return 'text/asciidoc'
  if (ext === '.md' || ext === '.markdown') return 'text/markdown'
  return null
}

function buildInputFileBlock(filePath) {
  let size = 0
  try {
    if (filePath && existsSync(filePath)) size = statSync(filePath).size
  } catch (_) {
    // Best-effort; size remains 0 when not available.
  }
  return {
    originalName: path.basename(filePath || ''),
    storedPath: filePath,
    size,
    mimeType: inferMimeTypeFromPath(filePath),
  }
}

function buildOutputFileBlock(filePath) {
  let size = 0
  try {
    if (filePath && existsSync(filePath)) size = statSync(filePath).size
  } catch (_) {
    // Best-effort; size remains 0 when not available.
  }
  return {
    path: filePath,
    size,
    mimeType: inferMimeTypeFromPath(filePath),
  }
}

function makeErrorObject({ code, message, details, recoverable }) {
  const err = { code, message, details: details ?? null, recoverable: Boolean(recoverable) }
  // Keep readable behavior in existing string interpolation/log contexts.
  Object.defineProperty(err, 'toString', {
    value: function toString() {
      return this.message
    },
    enumerable: false,
  })
  return err
}

function validationErrorToCode(message) {
  const m = String(message || '').toLowerCase()
  if (m.includes('not found')) return 'INVALID_INPUT'
  if (m.includes('exceeds maximum')) return 'FILE_TOO_LARGE'
  if (m.includes('is empty')) return 'EMPTY_INPUT'
  if (m.includes('extension')) return 'MIME_MISMATCH'
  return 'INVALID_INPUT'
}

function createDowndocFailure({
  conversionId,
  startTime,
  logs,
  inputPath,
  outputPath,
  errorCode,
  message,
  details,
  recoverable,
  meta,
  outputFile,
}) {
  const endTime = Date.now()
  const durationSeconds = (endTime - startTime) / 1000
  const finishedAt = new Date().toISOString()

  const result = createFailureResult({
    conversionId,
    converter: 'downdoc',
    pipeline: ['asciidoc->markdown'],
    inputFormat: 'asciidoc',
    outputFormat: 'markdown',
    inputFile: buildInputFileBlock(inputPath),
    startedAt: new Date(startTime).toISOString(),
    finishedAt,
    durationMs: endTime - startTime,
    error: makeErrorObject({
      code: errorCode,
      message,
      details,
      recoverable,
    }),
    outputFile: outputFile ?? (outputPath && existsSync(outputPath) ? buildOutputFileBlock(outputPath) : null),
    warnings: [],
    logs: Array.isArray(logs) ? logs : [],
    meta: meta && typeof meta === 'object' ? meta : {},
  })

  // Keep backward compatibility for code paths expecting ModuleResult.duration (seconds).
  result.duration = durationSeconds
  return result
}

// ============================================================================
// POST-TRAITEMENT
// ============================================================================

/**
 * Removes the :experimental: line from the AsciiDoc header (before first title).
 * No :toc: or any other attribute is added. No side effects.
 *
 * @param {string} asciidoc - AsciiDoc content
 * @returns {string} AsciiDoc content with :experimental: line removed from header
 */
function removeExperimentalTag(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') {
    return asciidoc
  }
  const lines = asciidoc.split('\n')
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (/^=+\s+/.test(trimmed)) {
      result.push(line)
      for (let j = i + 1; j < lines.length; j++) result.push(lines[j])
      return result.join('\n')
    }
    if (/^:experimental:\s*$/i.test(trimmed)) continue
    result.push(line)
  }
  return result.join('\n')
}

/**
 * Normalizes AsciiDoc input before downdoc: LF line endings, no trailing spaces
 * per line, exactly one trailing newline. Deterministic and pure.
 *
 * @param {string} asciidoc - AsciiDoc content
 * @returns {string} Normalized AsciiDoc
 */
function normalizeAsciiDocInput(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') return asciidoc
  const lf = asciidoc.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const trimmedLines = lf.split('\n').map(line => line.replace(/[ \t]+$/, ''))
  return trimmedLines.join('\n').trimEnd() + '\n'
}

/**
 * Basic cleanup to fix common downdoc issues
 * Conforms to downdoc.module.md specification
 * 
 * @param {string} markdown - Raw markdown from downdoc
 * @returns {string} Cleaned markdown
 */
function basicCleanup(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return markdown
  }

  // Single pass over the document: trailing whitespace removal and
  // horizontal-rule fix ("- --" produced by downdoc → "---") per line.
  const lines = markdown.split('\n')
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/[ \t]+$/, '')
    const trimmed = line.trim()
    if (/^-\s*--$/.test(trimmed)) {
      line = line.match(/^(\s*)/)[1] + '---'
    }
    lines[i] = line
  }

  // Normalize file endings (single final newline)
  return lines.join('\n').trimEnd() + '\n'
}

// ============================================================================
// VALIDATION DES ENTRÉES
// ============================================================================

/**
 * Validates input file according to minimal V1 security obligations
 * Conforms to modules.interface.md - Obligation 1: Basic input validation
 * 
 * @param {string} inputPath - Path to input file
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateInput(inputPath) {
  // Check file existence
  if (!existsSync(inputPath)) {
    return {
      valid: false,
      error: 'Input file not found'
    }
  }

  // Check file size
  try {
    const stats = statSync(inputPath)
    if (stats.size > getMaxInputSizeBytes()) {
      return {
        valid: false,
        error: `File size (${stats.size} bytes) exceeds maximum allowed size (${getMaxInputSizeBytes()} bytes)`
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

  // Basic file type check by extension
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
 * Downdoc module conforming to modules.interface.md interface
 */
const downdocModule = {
  /**
   * Module name (modules.interface.md - Property 1)
   */
  name: 'downdoc',

  /**
   * Supported formats (modules.interface.md - Property 2)
   */
  supportedFormats: {
    from: ['asciidoc'],
    to: ['markdown']
  },

  /**
   * Run method conforming to modules.interface.md
   * Implements the process described in downdoc.module.md
   * 
   * @param {string} inputPath - Absolute path to input AsciiDoc file
   * @param {string} outputPath - Absolute path to output Markdown file
   * @param {Object} options - Conversion options (optional)
   * @param {string} options.mode - Conversion mode ('default' or 'bookstack')
   * @param {string} options.conversionId - Conversion ID for logs (optional)
   * @returns {Promise<ModuleResult>} Conversion result
   */
  async run(inputPath, outputPath, options = {}) {
    const startTime = Date.now()
    const logs = []
    const conversionId = options.conversionId || 'unknown'

    try {
      // Minimal logging - Obligation 4 (modules.interface.md)
      logs.push(`[${conversionId}] Conversion started at ${new Date().toISOString()}`)
      logs.push(`[${conversionId}] Input: ${path.basename(inputPath)}`)
      logs.push(`[${conversionId}] Output: ${path.basename(outputPath)}`)

      // Step 1: Input validation (Obligation 1 - modules.interface.md)
      logs.push(`[${conversionId}] Validating input file...`)
      const validation = validateInput(inputPath)
      if (!validation.valid) {
        logs.push(`[${conversionId}] Validation failed: ${validation.error}`)
        return createDowndocFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: validationErrorToCode(validation.error),
          message: validation.error,
          details: null,
          recoverable: true,
          meta: { stage: 'input_validation' },
        })
      }
      logs.push(`[${conversionId}] Input file validated`)

      // Step 2: Secure input file reading (downdoc.module.md)
      logs.push(`[${conversionId}] Reading input file...`)
      let asciidocContent
      try {
        asciidocContent = await readFile(inputPath, 'utf8')
      } catch (error) {
        logs.push(`[${conversionId}] Failed to read input file: ${error.message}`)
        return createDowndocFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'INVALID_INPUT',
          message: `Failed to read input file: ${error.message}`,
          details: error && error.stack ? error.stack : null,
          recoverable: true,
          meta: { stage: 'read_input' },
        })
      }

      // Validate that content is not empty
      if (!asciidocContent || typeof asciidocContent !== 'string' || asciidocContent.trim().length === 0) {
        logs.push(`[${conversionId}] Input file is empty or invalid`)
        return createDowndocFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'EMPTY_INPUT',
          message: 'Input file content is empty or invalid',
          details: null,
          recoverable: true,
          meta: { stage: 'read_input' },
        })
      }
      logs.push(`[${conversionId}] Input file read successfully (${asciidocContent.length} characters)`)

      // Remove :experimental: line from header only (no :toc: or other attribute injection)
      const originalLength = asciidocContent.length
      asciidocContent = removeExperimentalTag(asciidocContent)
      if (originalLength !== asciidocContent.length) {
        logs.push(`[${conversionId}] Removed :experimental: line from header (${originalLength} → ${asciidocContent.length} chars)`)
      }

      // Normalize input before downdoc: LF, no trailing spaces per line, single trailing newline
      asciidocContent = normalizeAsciiDocInput(asciidocContent)
      logs.push(`[${conversionId}] Input normalized (LF, trim, single trailing newline)`)

      // Validate content is still not empty
      if (!asciidocContent || typeof asciidocContent !== 'string' || asciidocContent.trim().length === 0) {
        logs.push(`[${conversionId}] Input file is empty after normalization`)
        return createDowndocFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'EMPTY_INPUT',
          message: 'Input file content is empty after normalization',
          details: null,
          recoverable: true,
          meta: { stage: 'normalize_input' },
        })
      }

      // Step 3: Try downdoc first; on failure fallback to Pandoc
      logs.push(`[${conversionId}] Converting AsciiDoc to Markdown...`)
      let markdown
      let engineUsed = 'downdoc'
      let fallbackReason = null

      try {
        const mode = options.mode || 'default'
        const downdocOptions = {}
        if (mode === 'bookstack') {
          downdocOptions.extensions = ['parsedown']
          logs.push(`[${conversionId}] Using BookStack/Parsedown mode`)
        }
        if (downdocLoadError) {
          throw new Error(`downdoc unavailable: ${downdocLoadError.message}`)
        }
        if (typeof downdoc !== 'function') {
          throw new Error(`downdoc is not a function (type: ${typeof downdoc})`)
        }
        logs.push(`[${conversionId}] Calling downdoc...`)
        markdown = downdoc(asciidocContent, downdocOptions)
        if (!markdown || typeof markdown !== 'string') {
          throw new Error(`downdoc returned invalid result (type: ${typeof markdown})`)
        }
        if (markdown === asciidocContent) {
          throw new Error('downdoc output identical to input')
        }
        logs.push(`[${conversionId}] Downdoc succeeded (${markdown.length} chars)`)
      } catch (downdocError) {
        fallbackReason = downdocError && downdocError.message ? downdocError.message : 'downdoc failed'
        logs.push(`[${conversionId}] Downdoc failed: ${fallbackReason}. Falling back to Pandoc.`)
        try {
          markdown = await convertAsciiDocWithPandoc(asciidocContent)
          if (!markdown || typeof markdown !== 'string' || markdown.trim().length === 0) {
            throw new Error('Pandoc returned empty or invalid result')
          }
          if (markdown === asciidocContent) {
            throw new Error('Pandoc output identical to input')
          }
          engineUsed = 'pandoc'
          logs.push(`[${conversionId}] Pandoc fallback succeeded (${markdown.length} chars)`)
        } catch (pandocError) {
          const msg = pandocError && pandocError.message ? pandocError.message : 'Pandoc fallback failed'
          logs.push(`[${conversionId}] Pandoc fallback failed: ${msg}`)
          return createDowndocFailure({
            conversionId,
            startTime,
            logs,
            inputPath,
            outputPath,
            errorCode: 'CONVERSION_FAILED',
            message: `Conversion failed (downdoc: ${fallbackReason}; pandoc: ${msg})`,
            details: null,
            recoverable: false,
            meta: { stage: 'convert', engineUsed, fallbackReason },
          })
        }
      }

      // Step 4: Result post-processing (downdoc.module.md)
      logs.push(`[${conversionId}] Applying post-processing...`)
      const markdownBeforeCleanup = markdown
      markdown = basicCleanup(markdown)
      
      // Verify cleanup didn't break the conversion
      if (!markdown || markdown.trim().length === 0) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] ERROR: Post-processing resulted in empty markdown`)
        logs.push(`[${conversionId}] Reverting to pre-cleanup version`)
        markdown = markdownBeforeCleanup
      }
      
      // Verify markdown is still different from input after cleanup
      if (markdown === asciidocContent) {
        logs.push(`[${conversionId}] ERROR: After cleanup, markdown is identical to input - conversion failed!`)
        return createDowndocFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'CONVERSION_FAILED',
          message: 'Conversion failed: output is identical to input after post-processing.',
          details: null,
          recoverable: false,
          meta: { stage: 'post_processing' },
        })
      }

      // Normalize admonitions; apply full BookStack adapter when requested
      if (options.mode === 'bookstack') {
        logs.push(`[${conversionId}] Applying BookStack adapter...`)
        const markdownBeforeAdapter = markdown
        markdown = adaptForBookStack(markdown)
        
        // Verify adapter didn't break the conversion
        if (!markdown || markdown.trim().length === 0) {
          logs.push(`[${conversionId}] WARNING: BookStack adapter resulted in empty markdown, using pre-adapter version`)
          markdown = markdownBeforeAdapter
        }
        
        // Verify markdown is still different from input after adapter
        if (markdown === asciidocContent) {
          logs.push(`[${conversionId}] WARNING: After BookStack adapter, markdown is identical to input, using pre-adapter version`)
          markdown = markdownBeforeAdapter
        }
      } else {
        markdown = normalizeAdmonitionsToBlockquotes(markdown)
      }
      logs.push(`[${conversionId}] Post-processing completed`)
      logs.push(`[${conversionId}] Final markdown length: ${markdown.length} characters`)

      // Step 5: Write result (downdoc.module.md)
      logs.push(`[${conversionId}] Writing output file...`)
      logs.push(`[${conversionId}] Output path: ${outputPath}`)
      logs.push(`[${conversionId}] Markdown length before write: ${markdown.length} characters`)
      
      // Verify markdown is different from input (sanity check)
      if (markdown === asciidocContent) {
        logs.push(`[${conversionId}] ERROR: Markdown output is identical to AsciiDoc input - conversion failed!`)
        return createDowndocFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'CONVERSION_FAILED',
          message: 'Conversion failed: output is identical to input. The downdoc library may not be working correctly.',
          details: null,
          recoverable: false,
          meta: { stage: 'write_output_sanity' },
        })
      }
      
      try {
        await writeFile(outputPath, markdown, 'utf8')

        // Format verification on the in-memory content (identical to what was
        // written; avoids re-reading the whole file from disk).
        // Ensure output looks like Markdown, not AsciiDoc.
        const trimmedMarkdown = markdown.trim()
        const firstLines = trimmedMarkdown.split('\n', 5).join('\n')
        const hasAsciiDocAttributes = /^:[a-zA-Z-]+:/m.test(firstLines)
        const hasAsciiDocTitle = /^=+\s+\w+/m.test(firstLines)
        const hasMarkdownTitle = /^#+\s+\w+/m.test(trimmedMarkdown)

        if ((hasAsciiDocAttributes || hasAsciiDocTitle) && !hasMarkdownTitle) {
          logs.push(`[${conversionId}] CRITICAL ERROR: Output contains AsciiDoc syntax instead of Markdown!`)
          logs.push(`[${conversionId}] Has AsciiDoc attributes: ${hasAsciiDocAttributes}, Has AsciiDoc title: ${hasAsciiDocTitle}, Has Markdown title: ${hasMarkdownTitle}`)
          logs.push(`[${conversionId}] First 200 chars: ${markdown.substring(0, 200)}`)

          // Try to remove the incorrect file
          try {
            unlinkSync(outputPath)
            logs.push(`[${conversionId}] Incorrect output file removed`)
          } catch (unlinkError) {
            logs.push(`[${conversionId}] Warning: Failed to remove incorrect output file`)
          }

          return createDowndocFailure({
            conversionId,
            startTime,
            logs,
            inputPath,
            outputPath,
            errorCode: 'CONVERSION_FAILED',
            message: 'Conversion failed: output file contains AsciiDoc instead of Markdown. The conversion did not occur.',
            details: null,
            recoverable: false,
            meta: { stage: 'verify_output' },
          })
        }

        logs.push(`[${conversionId}] Output file written successfully`)
        logs.push(`[${conversionId}] Output file size: ${markdown.length} characters`)
        logs.push(`[${conversionId}] Output preview (first 200 chars): ${markdown.substring(0, 200)}...`)
      } catch (error) {
        // Obligation 3 - Secure error handling: do not create partial file
        // If writing fails, remove file if it was partially created
        if (existsSync(outputPath)) {
          try {
            unlinkSync(outputPath)
            logs.push(`[${conversionId}] Partial output file removed`)
          } catch (unlinkError) {
            // Log but do not propagate deletion error
            logs.push(`[${conversionId}] Warning: Failed to remove partial output file`)
          }
        }

        logs.push(`[${conversionId}] Failed to write output file: ${error.message}`)
        return createDowndocFailure({
          conversionId,
          startTime,
          logs,
          inputPath,
          outputPath,
          errorCode: 'OUTPUT_NOT_CREATED',
          message: `Failed to write output file: ${error.message}`,
          details: error && error.stack ? error.stack : null,
          recoverable: false,
          meta: { stage: 'write_output' },
        })
      }

      // Step 6: Return result (downdoc.module.md)
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      logs.push(`[${conversionId}] Conversion completed successfully`)
      logs.push(`[${conversionId}] engineUsed: ${engineUsed}`)
      if (fallbackReason) logs.push(`[${conversionId}] fallbackReason: ${fallbackReason}`)
      logs.push(`[${conversionId}] Duration: ${duration.toFixed(3)}s`)
      const finishedAt = new Date().toISOString()
      logs.push(`[${conversionId}] Finished at ${finishedAt}`)

      return createSuccessResult({
        conversionId,
        converter: 'downdoc',
        pipeline: ['asciidoc->markdown'],
        inputFormat: 'asciidoc',
        outputFormat: 'markdown',
        inputFile: buildInputFileBlock(inputPath),
        outputFile: buildOutputFileBlock(outputPath),
        startedAt: new Date(startTime).toISOString(),
        finishedAt,
        durationMs: endTime - startTime,
        warnings: [],
        logs,
        meta: {
          engineUsed,
          fallbackReason: fallbackReason || null
        }
      })

    } catch (error) {
      // Obligation 3 - Secure error handling: exhaustive capture
      // Any unexpected error must be captured and transformed into ModuleResult
      logs.push(`[${conversionId}] Unexpected error: ${error.message}`)

      // Ensure no partial output file is left behind
      if (existsSync(outputPath)) {
        try {
          unlinkSync(outputPath)
          logs.push(`[${conversionId}] Partial output file removed after error`)
        } catch (unlinkError) {
          logs.push(`[${conversionId}] Warning: Failed to remove partial output file`)
        }
      }

      return createDowndocFailure({
        conversionId,
        startTime,
        logs,
        inputPath,
        outputPath,
        errorCode: 'INTERNAL_ERROR',
        message: `Unexpected error: ${error.message}`,
        details: error && error.stack ? error.stack : null,
        recoverable: false,
        meta: { stage: 'unexpected' },
      })
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = downdocModule
