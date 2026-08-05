'use strict'

/**
 * HTML <-> Markdown wrapper (Pandoc in-memory via html-conversion helpers).
 * Returns native ConversionResult.
 */

const { readFileSync, writeFileSync, statSync, existsSync, unlinkSync } = require('fs')
const path = require('path')
const { getMaxInputSizeBytes } = require('../config/conversion-limits.js')
const { createSuccessResult, createFailureResult } = require('../../src/utils/conversion-result.js')
const { htmlToMarkdown, markdownToHtml } = require('../conversion/html-conversion.js')

function inferMime(filePath) {
  const ext = path.extname(filePath || '').toLowerCase()
  if (ext === '.html' || ext === '.htm') return 'text/html'
  if (ext === '.md' || ext === '.markdown') return 'text/markdown'
  return null
}

function buildInputFileBlock(filePath) {
  let size = 0
  try {
    if (filePath && existsSync(filePath)) size = statSync(filePath).size
  } catch (_) {}
  return {
    originalName: path.basename(filePath || ''),
    storedPath: filePath,
    size,
    mimeType: inferMime(filePath),
  }
}

function buildOutputFileBlock(filePath) {
  let size = 0
  try {
    if (filePath && existsSync(filePath)) size = statSync(filePath).size
  } catch (_) {}
  return { path: filePath, size, mimeType: inferMime(filePath) }
}

function makeErrorObject({ code, message, details, recoverable }) {
  const err = { code, message, details: details ?? null, recoverable: Boolean(recoverable) }
  Object.defineProperty(err, 'toString', {
    value: function toString() { return this.message },
    enumerable: false,
  })
  return err
}

function createFailure(opts) {
  const endTime = Date.now()
  const result = createFailureResult({
    conversionId: opts.conversionId,
    converter: 'html-markdown',
    pipeline: [opts.inputFormat + '->' + opts.outputFormat],
    inputFormat: opts.inputFormat,
    outputFormat: opts.outputFormat,
    inputFile: buildInputFileBlock(opts.inputPath),
    startedAt: new Date(opts.startTime).toISOString(),
    finishedAt: new Date(endTime).toISOString(),
    durationMs: endTime - opts.startTime,
    error: makeErrorObject({
      code: opts.errorCode,
      message: opts.message,
      details: opts.details,
      recoverable: opts.recoverable,
    }),
    outputFile: opts.outputPath && existsSync(opts.outputPath) ? buildOutputFileBlock(opts.outputPath) : null,
    warnings: [],
    logs: opts.logs,
    meta: opts.meta || {},
  })
  result.duration = (endTime - opts.startTime) / 1000
  return result
}

function resolveDirection(inputPath, outputPath, options) {
  let from = (options.fromFormat || '').toLowerCase()
  let to = (options.toFormat || '').toLowerCase()
  if (!from) {
    const ext = path.extname(inputPath).toLowerCase()
    if (ext === '.html' || ext === '.htm') from = 'html'
    else if (ext === '.md' || ext === '.markdown') from = 'markdown'
  }
  if (!to) {
    const ext = path.extname(outputPath).toLowerCase()
    if (ext === '.html' || ext === '.htm') to = 'html'
    else if (ext === '.md' || ext === '.markdown') to = 'markdown'
  }
  return { from, to }
}

function validateInput(inputPath) {
  if (!existsSync(inputPath)) return { valid: false, error: 'Input file not found', code: 'INVALID_INPUT' }
  try {
    const stats = statSync(inputPath)
    if (stats.size > getMaxInputSizeBytes()) {
      return { valid: false, error: 'File size exceeds maximum allowed size', code: 'PAYLOAD_TOO_LARGE' }
    }
    if (stats.size === 0) return { valid: false, error: 'Input file is empty', code: 'EMPTY_INPUT' }
  } catch (error) {
    return { valid: false, error: 'Failed to read file stats: ' + error.message, code: 'INVALID_INPUT' }
  }
  return { valid: true }
}

const htmlMarkdownModule = {
  name: 'html-markdown',
  supportedFormats: { from: ['html', 'markdown'], to: ['html', 'markdown'] },

  async run(inputPath, outputPath, options = {}) {
    const startTime = Date.now()
    const logs = []
    const conversionId = options.conversionId || 'unknown'
    const { from, to } = resolveDirection(inputPath, outputPath, options)
    logs.push('[' + conversionId + '] html-markdown: ' + (from || '?') + ' -> ' + (to || '?'))

    if (!from || !to || from === to || !['html', 'markdown'].includes(from) || !['html', 'markdown'].includes(to)) {
      return createFailure({
        conversionId, startTime, logs, inputPath, outputPath,
        inputFormat: from || 'html', outputFormat: to || 'markdown',
        errorCode: 'FORMAT_UNSUPPORTED',
        message: 'Unsupported direction: ' + from + ' -> ' + to,
        details: { stage: 'direction' }, recoverable: false, meta: { stage: 'direction' },
      })
    }

    const validation = validateInput(inputPath)
    if (!validation.valid) {
      logs.push('[' + conversionId + '] Validation failed: ' + validation.error)
      return createFailure({
        conversionId, startTime, logs, inputPath, outputPath,
        inputFormat: from, outputFormat: to, errorCode: validation.code,
        message: validation.error, details: { stage: 'input-validation' },
        recoverable: false, meta: { stage: 'input-validation' },
      })
    }

    let input
    try { input = readFileSync(inputPath, 'utf8') }
    catch (error) {
      return createFailure({
        conversionId, startTime, logs, inputPath, outputPath,
        inputFormat: from, outputFormat: to, errorCode: 'INVALID_INPUT',
        message: 'Failed to read input: ' + error.message,
        details: { stage: 'read' }, recoverable: false, meta: { stage: 'read' },
      })
    }

    if (!input.trim()) {
      return createFailure({
        conversionId, startTime, logs, inputPath, outputPath,
        inputFormat: from, outputFormat: to, errorCode: 'EMPTY_INPUT',
        message: 'Input content is empty',
        details: { stage: 'content' }, recoverable: false, meta: { stage: 'content' },
      })
    }

    let output
    try {
      output = from === 'html' ? await htmlToMarkdown(input) : await markdownToHtml(input)
      logs.push('[' + conversionId + '] Converted ' + input.length + ' -> ' + output.length + ' chars')
    } catch (error) {
      const msg = error && error.message ? error.message : String(error)
      const code = /timeout/i.test(msg) ? 'CONVERSION_TIMEOUT' : 'CONVERSION_FAILED'
      return createFailure({
        conversionId, startTime, logs, inputPath, outputPath,
        inputFormat: from, outputFormat: to, errorCode: code, message: msg,
        details: { stage: 'convert' }, recoverable: true,
        meta: { stage: 'convert', engine: 'pandoc' },
      })
    }

    try { writeFileSync(outputPath, output, 'utf8') }
    catch (error) {
      if (existsSync(outputPath)) { try { unlinkSync(outputPath) } catch (_) {} }
      return createFailure({
        conversionId, startTime, logs, inputPath, outputPath,
        inputFormat: from, outputFormat: to, errorCode: 'OUTPUT_NOT_CREATED',
        message: 'Failed to write output: ' + error.message,
        details: { stage: 'write' }, recoverable: true, meta: { stage: 'write' },
      })
    }

    const endTime = Date.now()
    const success = createSuccessResult({
      conversionId,
      converter: 'html-markdown',
      pipeline: [from + '->' + to],
      inputFormat: from,
      outputFormat: to,
      inputFile: buildInputFileBlock(inputPath),
      outputFile: buildOutputFileBlock(outputPath),
      startedAt: new Date(startTime).toISOString(),
      finishedAt: new Date(endTime).toISOString(),
      durationMs: endTime - startTime,
      warnings: [],
      logs,
      meta: { engine: 'pandoc' },
    })
    success.duration = (endTime - startTime) / 1000
    return success
  },
}

module.exports = htmlMarkdownModule
