'use strict'

/**
 * CONVERSION ROUTES
 * 
 * Routes for document conversion endpoints
 */

const express = require('express')
const router = express.Router()
const { randomUUID } = require('crypto')
const { convertAsciiDoc, convertMarkdownWithPandoc, convertHtmlWithPandoc, text2markdown } = require('../services/conversion/convert.js')
const { htmlToMarkdown, htmlToPlain } = require('../services/conversion/html-conversion.js')
const { z } = require('zod')
const { validate } = require('../middleware/security/validate.middleware.js')
const { createFailureResult, createSuccessResult } = require('../src/utils/conversion-result.js')
const { buildRouteError } = require('../src/utils/error-envelope.js')
const { getMaxInputSizeBytes } = require('../services/config/conversion-limits.js')

function routeFailureError(code, message, details = null, recoverable = false) {
  return buildRouteError(code, message, details, recoverable)
}

function isTextPayloadTooLarge(text) {
  return Buffer.byteLength(String(text || ''), 'utf8') > getMaxInputSizeBytes()
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
  const failurePayload = {
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
  }
  return createFailureResult(failurePayload)
}

function collectAsciidocErrorMessages(error) {
  const parts = []
  const seen = new Set()
  let e = error
  let depth = 0
  while (e && depth < 8 && !seen.has(e)) {
    seen.add(e)
    if (e && typeof e.message === 'string' && e.message) parts.push(e.message)
    e = e.cause
    depth++
  }
  return parts.join(' | ')
}

function classifyToAsciidocInternalError(error) {
  const rawMessage = collectAsciidocErrorMessages(error) || String(error || '')
  if (
    rawMessage.includes('Pandoc conversion timed out') ||
    rawMessage.includes('CONVERSION_TIMEOUT')
  ) {
    return {
      code: 'CONVERSION_TIMEOUT',
      message: `Conversion error: ${rawMessage}`,
      details: { stage: 'pandoc-execution', rawMessage },
    }
  }
  if (
    rawMessage.includes('Pandoc conversion failed') ||
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

function resolveFromHtmlConverter(targetFormat) {
  const t = typeof targetFormat === 'string' ? targetFormat.toLowerCase().trim() : ''
  if (t === 'markdown' || t === 'md') return 'html-markdown'
  if (t === 'txt' || t === 'text' || t === 'plain') return 'html-plain'
  return 'pandoc'
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
  converter = null,
}) {
  const finishedAt = new Date().toISOString()
  const normalizedTo =
    typeof targetFormat === 'string' && targetFormat.trim().length > 0
      ? targetFormat.toLowerCase()
      : 'unknown'
  return createFailureResult({
    conversionId,
    converter: converter || resolveFromHtmlConverter(normalizedTo),
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

function classifyToMarkdownConversionError(error) {
  const rawMessage = error && error.message ? String(error.message) : String(error || '')
  if (rawMessage.includes('Pandoc conversion timed out')) {
    return {
      code: 'CONVERSION_TIMEOUT',
      message: `Conversion error: ${rawMessage}`,
      details: { stage: 'converter-execution', rawMessage },
    }
  }
  if (
    rawMessage.startsWith('Conversion failed') ||
    rawMessage.includes('Pandoc conversion failed') ||
    rawMessage.includes('Failed to execute Pandoc conversion')
  ) {
    return {
      code: 'CONVERSION_FAILED',
      message: `Conversion error: ${rawMessage}`,
      details: { stage: 'converter-execution', rawMessage },
    }
  }
  return {
    code: 'INTERNAL_ERROR',
    message: `Conversion error: ${rawMessage}`,
    details: { stage: 'route-internal', rawMessage },
  }
}

// Endpoint: AsciiDoc → Markdown (downdoc en mémoire, fallback Pandoc)
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

    if (isTextPayloadTooLarge(text)) {
      const failure = buildToMarkdownFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: text,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload is too large',
        details: { stage: 'route-precheck', maxBytes: getMaxInputSizeBytes() },
      })
      return res.status(400).json({ ...failure, detail: failure.error.message })
    }

    // Check if Parsedown is enabled in options
    const useParsedown = options?.formatSpecific?.markdown?.parsedown || false
    const mode = useParsedown ? 'bookstack' : 'default'

    console.log(`[INFO] Converting ${text.length} characters (AsciiDoc → Markdown) in memory${useParsedown ? ' (Parsedown/BookStack mode)' : ''}`)

    // Conversion entièrement en mémoire : downdoc (fallback Pandoc via stdin/stdout),
    // normalisation, cleanup et adaptateur BookStack inclus — aucun fichier temporaire.
    const { markdown, engineUsed, fallbackReason, warnings } = await convertAsciiDoc(text, mode)

    // Sanity: le résultat doit être du Markdown, pas de l'AsciiDoc
    const trimmedMarkdown = markdown.trim()
    const firstLines = trimmedMarkdown.split('\n', 5).join('\n')
    const hasAsciiDocAttributes = /^:[a-zA-Z-]+:/m.test(firstLines)
    const hasAsciiDocTitle = /^=+\s+\w+/m.test(firstLines)
    const hasMarkdownTitle = /^#+\s+\w+/m.test(trimmedMarkdown)

    if ((hasAsciiDocAttributes || hasAsciiDocTitle) && !hasMarkdownTitle) {
      console.error(`[ERROR] Output appears to be AsciiDoc instead of Markdown!`)
      console.error(`[ERROR] First 200 chars: ${markdown.substring(0, 200)}`)
      const msg =
        'Conversion error: output appears to be AsciiDoc instead of Markdown. The conversion did not occur.'
      const failure = buildToMarkdownFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: text,
        code: 'CONVERSION_FAILED',
        message: msg,
        details: { stage: 'route-output-validation', reason: 'OUTPUT_INVALID_FORMAT' },
        meta: { route: '/api/to-markdown', transport: 'in-memory', stage: 'route-output-validation' },
      })
      return res.status(500).json({ ...failure, detail: msg })
    }

    const finishedAt = new Date().toISOString()
    const conversionResult = createSuccessResult({
      conversionId,
      converter: 'downdoc',
      pipeline: ['asciidoc->markdown'],
      inputFormat: 'asciidoc',
      outputFormat: 'markdown',
      inputFile: {
        originalName: 'input.adoc',
        storedPath: 'in-memory://request/body.adoc',
        size: Buffer.byteLength(text, 'utf8'),
        mimeType: 'text/x-asciidoc',
      },
      outputFile: {
        path: 'in-memory://response/body.md',
        size: Buffer.byteLength(markdown, 'utf8'),
        mimeType: 'text/markdown',
      },
      startedAt,
      finishedAt,
      durationMs: Date.now() - startedAtMs,
      warnings: Array.isArray(warnings) ? warnings : [],
      logs: [],
      meta: {
        route: '/api/to-markdown',
        transport: 'in-memory',
        engineUsed,
        fallbackReason: fallbackReason || null,
        mode,
      },
    })

    console.log(`[INFO] Conversion successful: ${markdown.length} Markdown characters generated (engine: ${engineUsed})`)

    return res.json({ markdown, conversionResult })
  } catch (error) {
    console.error('[ERROR] Error during AsciiDoc → Markdown conversion:', error)
    const standardizedFailureFromError = extractStandardizedFailureFromError(error)
    if (standardizedFailureFromError) {
      const message =
        standardizedFailureFromError.error && typeof standardizedFailureFromError.error.message === 'string'
          ? standardizedFailureFromError.error.message
          : `Conversion error: ${error.message || String(error)}`
      return res.status(500).json({ ...standardizedFailureFromError, detail: message })
    }
    const classified = classifyToMarkdownConversionError(error)
    const failure = buildToMarkdownFailure({
      conversionId,
      startedAt,
      startedAtMs,
      inputText: req.body && req.body.text ? String(req.body.text) : '',
      code: classified.code,
      message: classified.message,
      details: classified.details,
    })
    return res.status(500).json({ ...failure, detail: failure.error.message })
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

    if (isTextPayloadTooLarge(text)) {
      const failure = buildToAsciidocFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: text,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload is too large',
        details: { stage: 'route-precheck', maxBytes: getMaxInputSizeBytes() },
      })
      return res.status(400).json({ ...failure, detail: failure.error.message })
    }

    console.log(`[INFO] Converting ${text.length} characters (Markdown → AsciiDoc) with Pandoc`)

    // Use Pandoc for conversion (default)
    const asciidoc = await convertMarkdownWithPandoc(text)
    const finishedAt = new Date().toISOString()
    const durationMs = Date.now() - startedAtMs

    const successPayload = {
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
    }
    const conversionResult = createSuccessResult(successPayload)

    console.log(`[INFO] Conversion successful: ${asciidoc.length} AsciiDoc characters generated`)

    return res.json({ asciidoc, conversionResult })
  } catch (error) {
    console.error('[ERROR] Error during Markdown → AsciiDoc conversion:', error)
    try {
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
    } catch (fallbackError) {
      const fallbackMessage = fallbackError && fallbackError.message ? String(fallbackError.message) : String(fallbackError || '')
      console.error('[ERROR] Failed to build standardized to-asciidoc failure result:', fallbackError)
      const failure = buildToAsciidocFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: req.body && req.body.text ? String(req.body.text) : '',
        code: 'INTERNAL_ERROR',
        message: `Conversion error: ${fallbackMessage}`,
        details: { stage: 'route-failure-fallback', fallbackMessage },
      })
      return res.status(500).json({
        ...failure,
        detail: failure.error.message,
      })
    }
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

    if (isTextPayloadTooLarge(text)) {
      const failure = buildFromHtmlFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: text,
        targetFormat: to,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload is too large',
        details: { stage: 'route-precheck', maxBytes: getMaxInputSizeBytes() },
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

    const normalizedTo = typeof to === 'string' ? to.toLowerCase() : String(to)
    let result
    let converterName = 'pandoc'
    let engine = 'pandoc'

    // Prefer dedicated HTML wrappers for MD / TXT
    if (normalizedTo === 'markdown' || normalizedTo === 'md') {
      console.log(`[INFO] Converting ${text.length} characters (HTML → markdown) via html-markdown`)
      result = await htmlToMarkdown(text)
      converterName = 'html-markdown'
      engine = 'pandoc'
    } else if (normalizedTo === 'txt' || normalizedTo === 'text' || normalizedTo === 'plain') {
      console.log(`[INFO] Converting ${text.length} characters (HTML → txt) via html-plain`)
      result = htmlToPlain(text)
      converterName = 'html-plain'
      engine = 'local'
    } else {
      console.log(`[INFO] Converting ${text.length} characters (HTML → ${to}) with Pandoc`)
      result = await convertHtmlWithPandoc(text, to)
    }

    const finishedAt = new Date().toISOString()
    const durationMs = Date.now() - startedAtMs
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
      converter: converterName,
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
      meta: { route: '/api/from-html', transport: 'in-memory', targetFormat: normalizedTo, engine },
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

    if (isTextPayloadTooLarge(text)) {
      const failure = buildTextToMarkdownFailure({
        conversionId,
        startedAt,
        startedAtMs,
        inputText: text,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload is too large',
        details: { stage: 'route-precheck', maxBytes: getMaxInputSizeBytes() },
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
