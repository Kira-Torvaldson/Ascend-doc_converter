'use strict'

/**
 * DOCVERTER MODULE (stub offline)
 *
 * Kept for a future multi-format service path. Not registered in the active
 * converter registry / lazy-load map. Returns ConversionResult CONVERTER_NOT_FOUND.
 */

const path = require('path')
const { existsSync, statSync, unlinkSync } = require('fs')
const { createFailureResult } = require('../../src/utils/conversion-result.js')

function makeErrorObject({ code, message, details, recoverable }) {
  const err = { code, message, details: details ?? null, recoverable: Boolean(recoverable) }
  Object.defineProperty(err, 'toString', {
    value: function toString() { return this.message },
    enumerable: false,
  })
  return err
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
    mimeType: null,
  }
}

const docverterModule = {
  name: 'docverter',
  /** Empty so the stub never matches findConverter if re-registered by mistake. */
  supportedFormats: { from: [], to: [] },

  async run(inputPath, outputPath, options = {}) {
    const startTime = Date.now()
    const conversionId = options.conversionId || 'unknown'
    const fromFormat = (options.fromFormat || 'unknown').toLowerCase()
    const toFormat = (options.toFormat || 'unknown').toLowerCase()
    const logs = [
      `[${conversionId}] Docverter stub invoked (${fromFormat} → ${toFormat})`,
      `[${conversionId}] Module not implemented — use a registered converter`,
    ]

    if (outputPath && existsSync(outputPath)) {
      try { unlinkSync(outputPath) } catch (_) {}
    }

    const endTime = Date.now()
    const result = createFailureResult({
      conversionId,
      converter: 'docverter',
      pipeline: [`${fromFormat}->${toFormat}`],
      inputFormat: fromFormat,
      outputFormat: toFormat,
      inputFile: buildInputFileBlock(inputPath),
      startedAt: new Date(startTime).toISOString(),
      finishedAt: new Date(endTime).toISOString(),
      durationMs: endTime - startTime,
      error: makeErrorObject({
        code: 'CONVERTER_NOT_FOUND',
        message: 'Docverter is not implemented yet (multi-format path planned for a future release).',
        details: { stub: true, module: 'docverter' },
        recoverable: false,
      }),
      outputFile: null,
      warnings: [],
      logs,
      meta: { stub: true },
    })
    result.duration = (endTime - startTime) / 1000
    return result
  },
}

module.exports = docverterModule
