'use strict'

/**
 * ROUND-TRIP PIPELINE ROUTES
 * AsciiDoc → Markdown (GFM) → AsciiDoc avec validation stricte,
 * historique versionné (history.json) et dashboard HTML.
 */

const path = require('path')
const { mkdir, writeFile, rm } = require('fs/promises')
const { tmpdir } = require('os')
const { randomUUID } = require('crypto')
const express = require('express')
const router = express.Router()
const { z } = require('zod')
const { validate } = require('../middleware/security/validate.middleware.js')
const {
  runRoundTrip,
  STATE_SUCCESS,
  STATE_CONVERSION_FAILED,
  STATE_NO_OUTPUT,
  STATE_INPUT_INVALID
} = require('../services/conversion/adoc-md-roundtrip-pipeline.js')
const { getReportsDir, appendToHistory, errorToStructured } = require('../services/reports/history-manager.js')
const { generateDashboard } = require('../services/reports/dashboard-generator.js')
const { createSuccessResult, createFailureResult } = require('../src/utils/conversion-result.js')
const { buildRouteError } = require('../src/utils/error-envelope.js')

function stateToStatus(state) {
  if (state === STATE_SUCCESS) return 'success'
  if (state === STATE_NO_OUTPUT) return 'no_output'
  return 'conversion_failed'
}

/** Maps pipeline states to canonical ConversionResult error codes. */
const ROUNDTRIP_CODE_BY_STATE = Object.freeze({
  [STATE_INPUT_INVALID]: 'INVALID_INPUT',
  [STATE_NO_OUTPUT]: 'OUTPUT_NOT_CREATED',
  [STATE_CONVERSION_FAILED]: 'CONVERSION_FAILED'
})

/**
 * Builds the standardized ConversionResult for the round-trip pipeline
 * (asciidoc -> markdown -> asciidoc, both steps run by Pandoc).
 */
function buildRoundtripConversionResult({ conversionId, startedAt, startedAtMs, content, result }) {
  const base = {
    conversionId,
    converter: 'pandoc',
    pipeline: ['asciidoc->markdown', 'markdown->asciidoc'],
    inputFormat: 'asciidoc',
    outputFormat: 'asciidoc',
    inputFile: {
      originalName: 'source.adoc',
      storedPath: 'in-memory://request/body',
      size: Buffer.byteLength(content || '', 'utf8'),
      mimeType: 'text/plain'
    },
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAtMs,
    logs: result.logs || [],
    meta: {
      route: '/api/roundtrip',
      transport: 'in-memory',
      state: result.state,
      roundTripMatch: !!result.round_trip_match
    }
  }

  if (result.state === STATE_SUCCESS) {
    return createSuccessResult({
      ...base,
      outputFile: {
        originalName: 'resultat.adoc',
        storedPath: 'in-memory://response/asciidocContent',
        size: Buffer.byteLength(result.asciidocContent || '', 'utf8'),
        mimeType: 'text/plain'
      },
      // Round-trip mismatch is a success with warnings, not a failure
      warnings: result.errors || []
    })
  }

  const code = ROUNDTRIP_CODE_BY_STATE[result.state] || 'CONVERSION_FAILED'
  const message = (result.errors && result.errors[0]) || 'Round-trip pipeline failed'
  return createFailureResult({
    ...base,
    outputFile: null,
    warnings: [],
    error: buildRouteError(code, message, result.errors && result.errors.length > 1 ? { errors: result.errors } : null)
  })
}

/**
 * Enregistre la conversion dans l'historique et met à jour le dashboard.
 * En cas d'erreur d'écriture, log sans faire échouer la requête.
 */
function persistHistoryAndDashboard(reportsDir, entry) {
  try {
    appendToHistory(reportsDir, entry)
    generateDashboard(reportsDir)
  } catch (e) {
    console.error('[ROUNDTRIP] persist history/dashboard:', e.message)
  }
}

/**
 * POST /api/roundtrip
 * Body: { content: string } (AsciiDoc source)
 * Réponse: { success, state, markdownContent?, asciidocContent?, logs, errors?, conversionResult }
 * `conversionResult` expose le contrat ConversionResult standardisé à côté
 * de la forme legacy (conservée pour les consommateurs existants).
 * Chaque conversion est enregistrée dans history.json et dashboard.html.
 */
router.post(
  '/roundtrip',
  validate({
    body: z.object({
      content: z.string()
    })
  }),
  async (req, res) => {
  const conversionId = randomUUID()
  const startedAt = new Date().toISOString()
  const startedAtMs = Date.now()
  let workDir
  const reportsDir = getReportsDir()

  try {
    const { content } = req.body
    if (content == null || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        state: 'input_invalid',
        error: 'Body must contain "content" (string)',
        logs: []
      })
    }

    workDir = path.join(tmpdir(), `ascend-roundtrip-${conversionId}`)
    const inputPath = path.join(workDir, 'source.adoc')
    await mkdir(workDir, { recursive: true })
    await writeFile(inputPath, content, 'utf8')

    const result = await runRoundTrip(inputPath, {
      conversionId,
      workDir,
      timeout: 60000
    })

    const status = stateToStatus(result.state)
    const errorsStructured = (result.errors || []).map((msg) => errorToStructured(msg, result.state))
    const entry = {
      timestamp: new Date().toISOString(),
      source_file: path.basename(inputPath),
      output_md: result.state === STATE_SUCCESS && result.markdownPath ? path.basename(result.markdownPath) : '',
      output_adoc: result.state === STATE_SUCCESS && result.asciidocPath ? path.basename(result.asciidocPath) : '',
      status,
      errors: errorsStructured,
      checksums: result.checksums ?? { source: '', md: '', roundtrip: '' },
      blocks_detected: result.blocks_detected ?? 0,
      images_detected: result.images_detected ?? 0,
      round_trip_match: !!result.round_trip_match
    }
    persistHistoryAndDashboard(reportsDir, entry)

    const response = {
      success: result.success,
      state: result.state,
      logs: result.logs || [],
      errors: result.errors || [],
      conversionResult: buildRoundtripConversionResult({ conversionId, startedAt, startedAtMs, content, result })
    }
    if (result.state === STATE_SUCCESS) {
      response.markdownContent = result.markdownContent ?? null
      response.asciidocContent = result.asciidocContent ?? null
      response.round_trip_match = result.round_trip_match
      response.checksums = result.checksums
      response.blocks_detected = result.blocks_detected
      response.images_detected = result.images_detected
    }

    if (result.state === STATE_INPUT_INVALID) {
      return res.status(400).json(response)
    }
    if (result.state === STATE_CONVERSION_FAILED || result.state === STATE_NO_OUTPUT) {
      return res.status(422).json(response)
    }
    return res.json(response)
  } catch (err) {
    console.error('[ROUNDTRIP]', err)
    persistHistoryAndDashboard(reportsDir, {
      timestamp: new Date().toISOString(),
      source_file: 'source.adoc',
      output_md: '',
      output_adoc: '',
      status: 'conversion_failed',
      errors: [errorToStructured(err.message || 'Round-trip pipeline error', 'conversion_failed')],
      checksums: { source: '', md: '', roundtrip: '' },
      blocks_detected: 0,
      images_detected: 0,
      round_trip_match: false
    })
    return res.status(500).json({
      success: false,
      state: 'conversion_failed',
      error: err.message || 'Round-trip pipeline error',
      logs: [],
      conversionResult: buildRoundtripConversionResult({
        conversionId,
        startedAt,
        startedAtMs,
        content: typeof req.body?.content === 'string' ? req.body.content : '',
        result: {
          state: STATE_CONVERSION_FAILED,
          logs: [],
          errors: [err.message || 'Round-trip pipeline error']
        }
      })
    })
  } finally {
    if (workDir) {
      rm(workDir, { recursive: true, force: true }).catch(() => {})
    }
  }
})

module.exports = router
