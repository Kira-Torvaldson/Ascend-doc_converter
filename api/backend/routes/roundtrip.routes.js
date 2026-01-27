'use strict'

/**
 * ROUND-TRIP PIPELINE ROUTES
 * AsciiDoc → Markdown (GFM) → AsciiDoc avec validation stricte,
 * historique versionné (history.json) et dashboard HTML.
 */

const path = require('path')
const { writeFileSync, rmSync, existsSync, mkdirSync } = require('fs')
const { tmpdir } = require('os')
const { randomUUID } = require('crypto')
const express = require('express')
const router = express.Router()
const {
  runRoundTrip,
  STATE_SUCCESS,
  STATE_CONVERSION_FAILED,
  STATE_NO_OUTPUT,
  STATE_INPUT_INVALID
} = require('../services/conversion/adoc-md-roundtrip-pipeline.js')
const { getReportsDir, appendToHistory, errorToStructured } = require('../services/reports/history-manager.js')
const { generateDashboard } = require('../services/reports/dashboard-generator.js')

function stateToStatus(state) {
  if (state === STATE_SUCCESS) return 'success'
  if (state === STATE_NO_OUTPUT) return 'no_output'
  return 'conversion_failed'
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
 * Réponse: { success, state, markdownContent?, asciidocContent?, logs, errors? }
 * Chaque conversion est enregistrée dans history.json et dashboard.html.
 */
router.post('/roundtrip', async (req, res) => {
  const conversionId = randomUUID()
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
    mkdirSync(workDir, { recursive: true })
    writeFileSync(inputPath, content, 'utf8')

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
      errors: result.errors || []
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
      logs: []
    })
  } finally {
    if (workDir && existsSync(workDir)) {
      try {
        rmSync(workDir, { recursive: true, force: true })
      } catch (_) {}
    }
  }
})

module.exports = router
