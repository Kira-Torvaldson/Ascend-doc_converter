'use strict'

/**
 * CONVERSION ROUTES
 * 
 * Routes for document conversion endpoints
 */

const express = require('express')
const router = express.Router()
const { writeFileSync, readFileSync, unlinkSync, mkdirSync } = require('fs')
const { tmpdir } = require('os')
const { randomUUID } = require('crypto')
const path = require('path')
const { runConverter } = require('../services/modules/lazyload.module.js')
const { convertMarkdownWithPandoc, convertHtmlWithPandoc, convertWithPandoc, text2markdown, removeExperimentalTag, normalizeAsciiDocInput } = require('../services/conversion/convert.js')
const { z } = require('zod')
const { validate } = require('../middleware/security/validate.middleware.js')
const { createFailureResult, createSuccessResult } = require('../src/utils/conversion-result.js')

function routeFailureError(code, message, details = null, recoverable = false) {
  return { code, message, details, recoverable: Boolean(recoverable) }
}

function buildToAsciidocFailure({
  conversionId,
  startedAt,
  startedAtMs,
  inputText,
  code,
  message,
  details = null,
}) {
  const finishedAt = new Date().toISOString()
  return createFailureResult({
    conversionId,
    converter: 'pandoc',
    pipeline: ['markdown->asciidoc'],
    inputFormat: 'markdown',
    outputFormat: 'asciidoc',
    inputFile: {
      originalName: 'input.md',
      storedPath: 'in-memory://request/body.md',
      size: Buffer.byteLength(inputText || '', 'utf8'),
      mimeType: 'text/markdown',
    },
    outputFile: null,
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedAtMs,
    error: routeFailureError(code, message, details),
    warnings: [],
    logs: [],
    meta: { route: '/api/to-asciidoc', transport: 'in-memory' },
  })
}

function classifyToAsciidocInternalError(error) {
  const rawMessage = error && error.message ? String(error.message) : String(error || '')
  if (
    rawMessage.includes('Pandoc conversion failed') ||
    rawMessage.includes('Pandoc conversion timed out') ||
    rawMessage.includes('Failed to execute Pandoc conversion')
  ) {
    return {
      code: 'CONVERSION_FAILED',
      message: `Conversion error: ${rawMessage}`,
      details: { stage: 'pandoc-execution', rawMessage },
    }
  }
  return {
    code: 'INTERNAL_ERROR',
    message: `Conversion error: ${rawMessage}`,
    details: { stage: 'route-internal', rawMessage },
  }
}

function buildToMarkdownFailure({
  conversionId,
  startedAt,
  startedAtMs,
  inputText,
  code,
  message,
  details = null,
  outputFile = null,
  meta = null,
}) {
  const finishedAt = new Date().toISOString()
  return createFailureResult({
    conversionId,
    converter: 'downdoc',
    pipeline: ['asciidoc->markdown'],
    inputFormat: 'asciidoc',
    outputFormat: 'markdown',
    inputFile: {
      originalName: 'input.adoc',
      storedPath: 'in-memory://request/body.adoc',
      size: Buffer.byteLength(inputText || '', 'utf8'),
      mimeType: 'text/x-asciidoc',
    },
    outputFile,
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedAtMs,
    error: routeFailureError(code, message, details),
    warnings: [],
    logs: [],
    meta: meta || { route: '/api/to-markdown', transport: 'in-memory' },
  })
}

function buildTextToMarkdownFailure({
  conversionId,
  startedAt,
  startedAtMs,
  inputText,
  code,
  message,
  details = null,
  outputFile = null,
}) {
  const finishedAt = new Date().toISOString()
  return createFailureResult({
    conversionId,
    converter: 'text2markdown',
    pipeline: ['text->markdown'],
    inputFormat: 'txt',
    outputFormat: 'markdown',
    inputFile: {
      originalName: 'input.txt',
      storedPath: 'in-memory://request/body.txt',
      size: Buffer.byteLength(inputText || '', 'utf8'),
      mimeType: 'text/plain',
    },
    outputFile,
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedAtMs,
    error: routeFailureError(code, message, details),
    warnings: [],
    logs: [],
    meta: { route: '/api/text-to-markdown', transport: 'in-memory' },
  })
}

function buildFromHtmlFailure({
  conversionId,
  startedAt,
  startedAtMs,
  inputText,
  targetFormat,
  code,
  message,
  details = null,
  outputFile = null,
}) {
  const finishedAt = new Date().toISOString()
  const normalizedTo =
    typeof targetFormat === 'string' && targetFormat.trim().length > 0
      ? targetFormat.toLowerCase()
      : 'unknown'
  return createFailureResult({
    conversionId,
    converter: 'pandoc',
    pipeline: [`html->${normalizedTo}`],
    inputFormat: 'html',
    outputFormat: normalizedTo,
    inputFile: {
      originalName: 'input.html',
      storedPath: 'in-memory://request/body.html',
      size: Buffer.byteLength(inputText || '', 'utf8'),
      mimeType: 'text/html',
    },
    outputFile,
    startedAt,
    finishedAt,
    durationMs: Date.now() - startedAtMs,
    error: routeFailureError(code, message, details),
    warnings: [],
    logs: [],
    meta: { route: '/api/from-html', transport: 'in-memory', targetFormat: normalizedTo },
  })
}

function classifyFromHtmlInternalError(error) {
  const rawMessage = error && error.message ? String(error.message) : String(error || '')
  if (
    rawMessage.includes('Pandoc conversion failed') ||
    rawMessage.includes('Pandoc conversion timed out') ||
    rawMessage.includes('Failed to execute Pandoc conversion') ||
    rawMessage.includes('Unsupported output format')
  ) {
    return {
      code: 'CONVERSION_FAILED',
      message: `Conversion error: ${rawMessage}`,
      details: { stage: 'pandoc-execution', rawMessage },
    }
  }
  return {
    code: 'INTERNAL_ERROR',
    message: `Conversion error: ${rawMessage}`,
    details: { stage: 'route-internal', rawMessage },
  }
}

function classifyTextToMarkdownInternalError(error, stage = 'route-internal') {
  const rawMessage = error && error.message ? String(error.message) : String(error || '')
  if (stage === 'converter-execution') {
    return {
      code: 'CONVERSION_FAILED',
      message: `Conversion error: ${rawMessage}`,
      details: { stage, rawMessage },
    }
  }
  return {
    code: 'INTERNAL_ERROR',
    message: `Conversion error: ${rawMessage}`,
    details: { stage, rawMessage },
  }
}

function isStandardizedFailureResult(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false
  return (
    candidate.success === false &&
    typeof candidate.conversionId === 'string' &&
    candidate.error &&
    typeof candidate.error === 'object' &&
    typeof candidate.error.code === 'string' &&
    typeof candidate.error.message === 'string'
  )
}

function extractStandardizedFailureFromError(error) {
  if (isStandardizedFailureResult(error)) return error
  if (error && typeof error === 'object' && isStandardizedFailureResult(error.conversionResult)) {
    return error.conversionResult
  }
  return null
}

function buildFailureFromSuccessfulResult(result, { code, message, details = null }) {
  return createFailureResult({
    conversionId: result.conversionId,
    converter: result.converter,
    pipeline: result.pipeline,
    inputFormat: result.inputFormat,
    outputFormat: result.outputFormat,
    inputFile: result.inputFile,
    outputFile: result.outputFile,
    durationMs: result.durationMs,
    startedAt: result.startedAt,
    finishedAt: new Date().toISOString(),
    warnings: result.warnings,
    logs: result.logs,
    error: routeFailureError(code, message, details),
    meta: result.meta,
  })
}

// Endpoint: AsciiDoc → Markdown (utilise lazy loader avec downdoc)
router.post(
  '/to-markdown',
  validate({
    body: z.object({
      text: z.string(),
      options: z.any().optional()
    })
  }),
  async (req, res) => {
  const conversionId = randomUUID()
  const startedAt = new Date().toISOString()
  const startedAtMs = Date.now()
  const tempDir = path.join(tmpdir(), `ascend-temp-${conversionId}`)
  let inputFile = null
  let outputFile = null
  let result = null

  try {
    const { text, options } = req.body

    if (!text.trim()) {
      const failure = buildToMarkdownFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: '',
        code: 'EMPTY_INPUT',
        message: 'The text to convert is empty',
        details: { stage: 'route-precheck' },
      })
      return res.status(400).json({ ...failure, detail: failure.error.message })
    }

    // Check if Parsedown is enabled in options
    const useParsedown = options?.formatSpecific?.markdown?.parsedown || false
    const mode = useParsedown ? 'bookstack' : 'default'

    console.log(`[INFO] Converting ${text.length} characters (AsciiDoc → Markdown) with lazy loader${useParsedown ? ' (Parsedown/BookStack mode)' : ''}`)

    // Remove :experimental: line from header only (no :toc: injection), then normalize
    let processedText = removeExperimentalTag(text)
    processedText = normalizeAsciiDocInput(processedText)

    // Créer le dossier temporaire
    mkdirSync(tempDir, { recursive: true })

    // Créer les fichiers temporaires
    inputFile = path.join(tempDir, 'input.adoc')
    outputFile = path.join(tempDir, 'output.md')

    // Écrire le contenu d'entrée normalisé
    writeFileSync(inputFile, processedText, 'utf8')
    console.log(`[INFO] Written normalized content to temp file (${processedText.length} chars)`)

    // Utiliser le lazy loader pour exécuter la conversion (downdoc with Pandoc fallback)
    result = await runConverter('downdoc', inputFile, outputFile, {
      conversionId: conversionId,
      mode: mode
    })

    if (!result.success) {
      const errorMessage =
        result && result.error && typeof result.error === 'object'
          ? result.error.message
          : String(result && result.error ? result.error : 'unknown conversion failure')
      console.error(`[ERROR] Conversion failed: ${errorMessage}`)
      return res.status(500).json({
        ...result,
        detail: errorMessage,
      })
    }

    // Lire le résultat
    const markdown = readFileSync(outputFile, 'utf8')

    // Debug: vérifier que le résultat est bien du Markdown et non de l'AsciiDoc
    if (markdown === processedText) {
      console.error(`[ERROR] Output is identical to processed input - conversion did not occur!`)
      console.error(`[ERROR] Processed input length: ${processedText.length}, Output length: ${markdown.length}`)
      console.error(`[ERROR] First 100 chars of processed input: ${processedText.substring(0, 100)}`)
      console.error(`[ERROR] First 100 chars of output: ${markdown.substring(0, 100)}`)
      const msg =
        'Conversion error: output is identical to processed input. The conversion did not occur.'
      const failure = buildFailureFromSuccessfulResult(result, {
        code: 'CONVERSION_FAILED',
        message: msg,
        details: { stage: 'route-output-validation', reason: 'OUTPUT_IS_INPUT' },
      })
      return res.status(500).json({ ...failure, detail: msg })
    }

    // Vérifier que le résultat contient du Markdown et non de l'AsciiDoc
    // Détecter les attributs AsciiDoc (commencent par :) ou les titres AsciiDoc (commencent par =)
    const firstLines = markdown.trim().split('\n').slice(0, 5).join('\n')
    const hasAsciiDocAttributes = /^:[a-zA-Z-]+:/m.test(firstLines)
    const hasAsciiDocTitle = /^=+\s+\w+/m.test(firstLines)
    const hasMarkdownTitle = /^#+\s+\w+/m.test(markdown.trim())
    
    if ((hasAsciiDocAttributes || hasAsciiDocTitle) && !hasMarkdownTitle) {
      console.error(`[ERROR] Output appears to be AsciiDoc instead of Markdown!`)
      console.error(`[ERROR] First 200 chars: ${markdown.substring(0, 200)}`)
      console.error(`[ERROR] Has AsciiDoc attributes: ${hasAsciiDocAttributes}, Has AsciiDoc title: ${hasAsciiDocTitle}, Has Markdown title: ${hasMarkdownTitle}`)
      const msg =
        'Conversion error: output appears to be AsciiDoc instead of Markdown. The conversion did not occur.'
      const failure = buildFailureFromSuccessfulResult(result, {
        code: 'CONVERSION_FAILED',
        message: msg,
        details: { stage: 'route-output-validation', reason: 'OUTPUT_INVALID_FORMAT' },
      })
      return res.status(500).json({ ...failure, detail: msg })
    }

    console.log(`[INFO] Conversion successful: ${markdown.length} Markdown characters generated`)
    console.log(`[INFO] First 100 chars of output: ${markdown.substring(0, 100)}`)

    return res.json({ markdown, conversionResult: result })
  } catch (error) {
    console.error('[ERROR] Error during AsciiDoc → Markdown conversion:', error)
    const errMsg = error.message || String(error)
    if (result && result.success && typeof result.conversionId === 'string') {
      const failure = buildFailureFromSuccessfulResult(result, {
        code: 'INTERNAL_ERROR',
        message: `Conversion error: ${errMsg}`,
        details: { stage: 'route-postprocessing' },
      })
      return res.status(500).json({ ...failure, detail: failure.error.message })
    }
    const failure = buildToMarkdownFailure({
      conversionId,
      startedAt,
      startedAtMs,
      inputText: req.body && req.body.text ? String(req.body.text) : '',
      code: 'INTERNAL_ERROR',
      message: `Conversion error: ${errMsg}`,
      details: { stage: 'route-internal' },
      outputFile: outputFile ? { path: outputFile, size: 0, mimeType: 'text/markdown' } : null,
    })
    return res.status(500).json({ ...failure, detail: failure.error.message })
  } finally {
    // Nettoyer les fichiers temporaires
    try {
      if (inputFile && require('fs').existsSync(inputFile)) {
        unlinkSync(inputFile)
      }
      if (outputFile && require('fs').existsSync(outputFile)) {
        unlinkSync(outputFile)
      }
      if (require('fs').existsSync(tempDir)) {
        require('fs').rmSync(tempDir, { recursive: true, force: true })
      }
    } catch (cleanupError) {
      console.warn(`[WARN] Failed to cleanup temp files: ${cleanupError.message}`)
    }
  }
})

// Endpoint: Markdown → AsciiDoc (uses Pandoc by default)
router.post(
  '/to-asciidoc',
  validate({
    body: z.object({
      text: z.string()
    })
  }),
  async (req, res) => {
  const conversionId = randomUUID()
  const startedAt = new Date().toISOString()
  const startedAtMs = Date.now()
  try {
    const { text } = req.body

    if (!text.trim()) {
      const failure = buildToAsciidocFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: '',
        code: 'EMPTY_INPUT',
        message: 'The text to convert is empty',
        details: { stage: 'route-precheck' },
      })
      return res.status(400).json({
        ...failure,
        detail: failure.error.message,
      })
    }

    console.log(`[INFO] Converting ${text.length} characters (Markdown → AsciiDoc) with Pandoc`)

    // Use Pandoc for conversion (default)
    const asciidoc = await convertMarkdownWithPandoc(text)
    const finishedAt = new Date().toISOString()
    const durationMs = Date.now() - startedAtMs

    const conversionResult = createSuccessResult({
      conversionId,
      converter: 'pandoc',
      pipeline: ['markdown->asciidoc'],
      inputFormat: 'markdown',
      outputFormat: 'asciidoc',
      inputFile: {
        originalName: 'input.md',
        storedPath: 'in-memory://request/body.md',
        size: Buffer.byteLength(text, 'utf8'),
        mimeType: 'text/markdown',
      },
      outputFile: {
        path: 'in-memory://response/body.adoc',
        size: Buffer.byteLength(asciidoc, 'utf8'),
        mimeType: 'text/asciidoc',
      },
      startedAt,
      finishedAt,
      durationMs,
      warnings: [],
      logs: [],
      meta: { route: '/api/to-asciidoc', transport: 'in-memory' },
    })

    console.log(`[INFO] Conversion successful: ${asciidoc.length} AsciiDoc characters generated`)

    return res.json({ asciidoc, conversionResult })
  } catch (error) {
    console.error('[ERROR] Error during Markdown → AsciiDoc conversion:', error)
    const classified = classifyToAsciidocInternalError(error)
    const failure = buildToAsciidocFailure({
      conversionId,
      startedAt,
      startedAtMs,
      inputText: req.body && req.body.text ? String(req.body.text) : '',
      code: classified.code,
      message: classified.message,
      details: classified.details,
    })
    return res.status(500).json({
      ...failure,
      detail: failure.error.message,
    })
  }
})

// Endpoint: HTML → Other formats (uses Pandoc)
router.post(
  '/from-html',
  validate({
    body: z.object({
      text: z.string(),
      to: z.string()
    })
  }),
  async (req, res) => {
  const conversionId = randomUUID()
  const startedAt = new Date().toISOString()
  const startedAtMs = Date.now()
  try {
    const { text, to } = req.body

    if (!text.trim()) {
      const failure = buildFromHtmlFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: '',
        targetFormat: to,
        code: 'EMPTY_INPUT',
        message: 'The HTML text to convert is empty',
        details: { stage: 'route-precheck' },
      })
      return res.status(400).json({ ...failure, detail: failure.error.message })
    }

    if (!to.trim()) {
      const failure = buildFromHtmlFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: text,
        targetFormat: '',
        code: 'CONVERSION_FAILED',
        message: 'The output format is empty',
        details: { stage: 'route-precheck', reason: 'OUTPUT_FORMAT_EMPTY' },
      })
      return res.status(400).json({ ...failure, detail: failure.error.message })
    }

    console.log(`[INFO] Converting ${text.length} characters (HTML → ${to}) with Pandoc`)

    // Use Pandoc for conversion
    const result = await convertHtmlWithPandoc(text, to)
    const finishedAt = new Date().toISOString()
    const durationMs = Date.now() - startedAtMs
    const normalizedTo = typeof to === 'string' ? to.toLowerCase() : String(to)
    const outputMimeTypeMap = {
      markdown: 'text/markdown',
      asciidoc: 'text/asciidoc',
      html: 'text/html',
      txt: 'text/plain',
      rst: 'text/plain',
      latex: 'text/plain',
      tex: 'text/plain',
      yaml: 'application/yaml',
      json: 'application/json',
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      epub: 'application/epub+zip',
    }
    const outputMimeType = outputMimeTypeMap[normalizedTo] || 'application/octet-stream'

    const conversionResult = createSuccessResult({
      conversionId,
      converter: 'pandoc',
      pipeline: [`html->${normalizedTo}`],
      inputFormat: 'html',
      outputFormat: normalizedTo,
      inputFile: {
        originalName: 'input.html',
        storedPath: 'in-memory://request/body.html',
        size: Buffer.byteLength(text, 'utf8'),
        mimeType: 'text/html',
      },
      outputFile: {
        path: `in-memory://response/body.${normalizedTo}`,
        size: Buffer.byteLength(result, 'utf8'),
        mimeType: outputMimeType,
      },
      startedAt,
      finishedAt,
      durationMs,
      warnings: [],
      logs: [],
      meta: { route: '/api/from-html', transport: 'in-memory', targetFormat: normalizedTo },
    })

    console.log(`[INFO] Conversion successful: ${result.length} ${to} characters generated`)

    return res.json({ [to]: result, conversionResult })
  } catch (error) {
    console.error(`[ERROR] Error during HTML → ${req.body.to} conversion:`, error)
    const downstreamFailure = extractStandardizedFailureFromError(error)
    if (downstreamFailure) {
      return res.status(500).json({
        ...downstreamFailure,
        detail: downstreamFailure.error.message,
      })
    }
    const classified = classifyFromHtmlInternalError(error)
    const failure = buildFromHtmlFailure({
      conversionId,
      startedAt,
      startedAtMs,
      inputText: req.body && req.body.text ? String(req.body.text) : '',
      targetFormat: req.body && req.body.to ? String(req.body.to) : '',
      code: classified.code,
      message: classified.message,
      details: classified.details,
      outputFile: null,
    })
    return res.status(500).json({ ...failure, detail: failure.error.message })
  }
})

// Endpoint: Text → Markdown (uses text2markdown)
router.post(
  '/text-to-markdown',
  validate({
    body: z.object({
      text: z.string()
    })
  }),
  async (req, res) => {
  const conversionId = randomUUID()
  const startedAt = new Date().toISOString()
  const startedAtMs = Date.now()
  try {
    const { text } = req.body

    if (!text.trim()) {
      const failure = buildTextToMarkdownFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: '',
        code: 'EMPTY_INPUT',
        message: 'The text to convert is empty',
        details: { stage: 'route-precheck' },
      })
      return res.status(400).json({ ...failure, detail: failure.error.message })
    }

    console.log(`[INFO] Converting ${text.length} characters (Text → Markdown) with text2markdown`)

    // Use text2markdown for conversion
    let markdown = ''
    try {
      markdown = await text2markdown(text)
    } catch (error) {
      const downstreamFailure = extractStandardizedFailureFromError(error)
      if (downstreamFailure) {
        return res.status(500).json({
          ...downstreamFailure,
          detail: downstreamFailure.error.message,
        })
      }
      const classified = classifyTextToMarkdownInternalError(error, 'converter-execution')
      const failure = buildTextToMarkdownFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: text,
        code: classified.code,
        message: classified.message,
        details: classified.details,
        outputFile: null,
      })
      return res.status(500).json({ ...failure, detail: failure.error.message })
    }

    const finishedAt = new Date().toISOString()
    const durationMs = Date.now() - startedAtMs

    const conversionResult = createSuccessResult({
      conversionId,
      converter: 'text2markdown',
      pipeline: ['text->markdown'],
      inputFormat: 'txt',
      outputFormat: 'markdown',
      inputFile: {
        originalName: 'input.txt',
        storedPath: 'in-memory://request/body.txt',
        size: Buffer.byteLength(text, 'utf8'),
        mimeType: 'text/plain',
      },
      outputFile: {
        path: 'in-memory://response/body.md',
        size: Buffer.byteLength(markdown, 'utf8'),
        mimeType: 'text/markdown',
      },
      startedAt,
      finishedAt,
      durationMs,
      warnings: [],
      logs: [],
      meta: { route: '/api/text-to-markdown', transport: 'in-memory' },
    })

    console.log(`[INFO] Conversion successful: ${markdown.length} Markdown characters generated`)

    return res.json({ markdown, conversionResult })
  } catch (error) {
    console.error('[ERROR] Error during Text → Markdown conversion:', error)
    const downstreamFailure = extractStandardizedFailureFromError(error)
    if (downstreamFailure) {
      return res.status(500).json({
        ...downstreamFailure,
        detail: downstreamFailure.error.message,
      })
    }
    const classified = classifyTextToMarkdownInternalError(error, 'route-internal')
    const failure = buildTextToMarkdownFailure({
      conversionId,
      startedAt,
      startedAtMs,
      inputText: req.body && req.body.text ? String(req.body.text) : '',
      code: classified.code,
      message: classified.message,
      details: classified.details,
      outputFile: null,
    })
    return res.status(500).json({ ...failure, detail: failure.error.message })
  }
})

module.exports = router
