'use strict'

/**
 * API ROUTES
 * 
 * Routes for API endpoints (confirmation tokens, logs, etc.)
 */

const express = require('express')
const router = express.Router()
const { z } = require('zod')
const { randomUUID } = require('crypto')
const { validate } = require('../middleware/security/validate.middleware.js')
const {
  generateConfirmationToken,
  validateAndConsumeToken,
  getTokenStats,
  secureConvertWithToken,
  ConfirmationTokenError,
  ConversionError
} = require('../services/conversion/secure-converter.js')
const { mergeOptions, validateOptions } = require('../conversion-options.js')
const {
  readLog,
  listLogs
} = require('../services/logging/structured-logger.js')
const { getLimitsSnapshot } = require('../services/config/conversion-limits.js')
const { getMetricsSnapshot } = require('../services/metrics/conversion-metrics.js')
const { createSuccessResult, createFailureResult } = require('../src/utils/conversion-result.js')
const { buildRouteError } = require('../src/utils/error-envelope.js')
const { envMap } = require('../services/config/envmap.module.js')

/** Maps secure-converter internal codes to canonical ConversionResult codes. */
const CONVERT_CODE_MAP = Object.freeze({
  VALIDATION_ERROR: 'INVALID_INPUT',
  FILE_VALIDATION_ERROR: 'INVALID_INPUT',
  TIMEOUT: 'CONVERSION_TIMEOUT',
  OUTPUT_MISSING: 'OUTPUT_NOT_CREATED',
  BINARY_NOT_FOUND: 'INTERNAL_ERROR',
  EXECUTION_ERROR: 'INTERNAL_ERROR',
  UNEXPECTED_ERROR: 'INTERNAL_ERROR',
  SYSTEM_OVERLOADED: 'RESOURCE_LIMIT_EXCEEDED',
  CAPACITY_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
})

function mapConvertErrorCode(code) {
  return CONVERT_CODE_MAP[code] || code || 'INTERNAL_ERROR'
}

function buildConvertFailure({
  conversionId,
  startedAt,
  startedAtMs,
  content,
  fromFormat,
  toFormat,
  code,
  message,
  details = null,
}) {
  return createFailureResult({
    conversionId,
    converter: fromFormat === 'asciidoc' && toFormat === 'markdown' ? 'downdoc' : 'pandoc',
    pipeline: [`${fromFormat}->${toFormat}`],
    inputFormat: fromFormat,
    outputFormat: toFormat,
    inputFile: {
      originalName: `input.${fromFormat}`,
      storedPath: 'in-memory://request/body',
      size: Buffer.byteLength(content || '', 'utf8'),
      mimeType: 'text/plain',
    },
    outputFile: null,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAtMs,
    error: buildRouteError(code, message, details),
    warnings: [],
    logs: [],
    meta: { route: '/api/convert', transport: 'in-memory' },
  })
}

// Confirmation token request endpoint
router.post(
  '/confirmation/request',
  validate({
    body: z.object({
      fromFormat: z.string().min(1),
      toFormat: z.string().min(1),
      contentSize: z.number().int().nonnegative().optional()
    })
  }),
  (req, res) => {
  try {
    const { fromFormat, toFormat, contentSize } = req.body

    // Generate confirmation token with metadata
    const tokenData = generateConfirmationToken({
      fromFormat: fromFormat.toLowerCase(),
      toFormat: toFormat.toLowerCase(),
      contentSize: contentSize || 0,
      requestedAt: new Date().toISOString()
    })

    return res.json({
      success: true,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      ttl: tokenData.ttl
    })
  } catch (error) {
    console.error('[ERROR] Error generating confirmation token:', error)
    return res.status(500).json({
      error: 'Failed to generate confirmation token'
    })
  }
})

// Token statistics endpoint
router.get('/confirmation/stats', (req, res) => {
  try {
    const stats = getTokenStats()
    return res.json(stats)
  } catch (error) {
    console.error('[ERROR] Error getting token stats:', error)
    return res.status(500).json({
      error: 'Failed to get token statistics'
    })
  }
})

// Generic conversion endpoint with token confirmation
router.post(
  '/convert',
  validate({
    body: z.object({
      content: z.string().min(1),
      fromFormat: z.string().min(1),
      toFormat: z.string().min(1),
      token: z.string().min(1),
      options: z.any().optional()
    })
  }),
  async (req, res) => {
  const routeConversionId = randomUUID()
  const startedAt = new Date().toISOString()
  const startedAtMs = Date.now()
  const { content = '', fromFormat = 'unknown', toFormat = 'unknown', token, options } = req.body || {}
  const normalizedFrom = String(fromFormat).toLowerCase()
  const normalizedTo = String(toFormat).toLowerCase()

  const failWith = (status, { code, message, details = null, conversionId = null }) => {
    const failure = buildConvertFailure({
      conversionId: conversionId || routeConversionId,
      startedAt,
      startedAtMs,
      content,
      fromFormat: normalizedFrom,
      toFormat: normalizedTo,
      code,
      message,
      details,
    })
    return res.status(status).json({ ...failure, detail: failure.error.message })
  }

  try {
    if (!content.trim()) {
      return failWith(400, {
        code: 'EMPTY_INPUT',
        message: 'Content is required and must be a non-empty string',
        details: { stage: 'route-precheck' },
      })
    }

    // Merge and validate options
    const mergedOptions = mergeOptions(options || {})
    const validation = validateOptions(mergedOptions)
    if (!validation.valid) {
      return failWith(400, {
        code: 'INVALID_INPUT',
        message: `Invalid options: ${validation.error}`,
        details: { stage: 'route-precheck' },
      })
    }

    // Prepare expected metadata for token validation
    const expectedMetadata = {
      fromFormat: normalizedFrom,
      toFormat: normalizedTo
    }

    // Execute secure conversion with token
    // secureConvertWithToken expects: (content, fromFormat, toFormat, options)
    // where options contains { confirmationToken, expectedMetadata, ... }
    const result = await secureConvertWithToken(
      content,
      fromFormat,
      toFormat,
      {
        ...mergedOptions,
        confirmationToken: token,
        expectedMetadata: expectedMetadata
      }
    )

    const finishedAt = new Date().toISOString()
    const conversionResult = createSuccessResult({
      conversionId: routeConversionId,
      converter: normalizedFrom === 'asciidoc' && normalizedTo === 'markdown' ? 'downdoc' : 'pandoc',
      pipeline: [`${normalizedFrom}->${normalizedTo}`],
      inputFormat: normalizedFrom,
      outputFormat: normalizedTo,
      inputFile: {
        originalName: `input.${normalizedFrom}`,
        storedPath: 'in-memory://request/body',
        size: Buffer.byteLength(content, 'utf8'),
        mimeType: 'text/plain',
      },
      outputFile: {
        path: 'in-memory://response/body',
        size: Buffer.byteLength(result, 'utf8'),
        mimeType: 'text/plain',
      },
      startedAt,
      finishedAt,
      durationMs: Date.now() - startedAtMs,
      warnings: [],
      logs: [],
      meta: { route: '/api/convert', transport: 'in-memory' },
    })

    return res.json({
      success: true,
      result: result,
      format: toFormat,
      conversionResult
    })
  } catch (error) {
    if (error instanceof ConfirmationTokenError) {
      return failWith(401, {
        code: mapConvertErrorCode(error.code),
        message: error.message,
        details: { stage: 'confirmation-token', secureConverterCode: error.code },
        conversionId: error.conversionId && error.conversionId !== 'unknown' ? error.conversionId : null,
      })
    }

    if (error instanceof ConversionError) {
      return failWith(500, {
        code: mapConvertErrorCode(error.code),
        message: error.message,
        details: { stage: 'secure-converter', secureConverterCode: error.code },
        conversionId: error.conversionId && error.conversionId !== 'unknown' ? error.conversionId : null,
      })
    }

    console.error('[ERROR] Unexpected error in /convert:', error)
    return failWith(500, {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error during conversion',
      details: { stage: 'route-internal' },
    })
  }
})

// Logs endpoints
router.get(
  '/logs/:conversionId',
  validate({
    params: z.object({ conversionId: z.string().min(1) })
  }),
  (req, res) => {
  try {
    const { conversionId } = req.params

    const log = readLog(conversionId)

    if (!log) {
      return res.status(404).json({
        error: `Log not found for conversion ID: ${conversionId}`
      })
    }

    return res.json(log)
  } catch (error) {
    console.error('[ERROR] Error reading log:', error)
    return res.status(500).json({
      error: 'Failed to read log'
    })
  }
})

router.get('/logs', (req, res) => {
  try {
    const logs = listLogs()
    return res.json(logs)
  } catch (error) {
    console.error('[ERROR] Error listing logs:', error)
    return res.status(500).json({
      error: 'Failed to list logs'
    })
  }
})

// ASC-008 — Public limits snapshot for UI alignment
router.get('/config/limits', (req, res) => {
  return res.json(getLimitsSnapshot())
})

// ASC-007 — Conversion metrics (restrict in production when API_KEY is set)
router.get('/metrics', (req, res) => {
  const expectedKey = String(envMap.get('API_KEY') || '').trim()
  if (envMap.get('NODE_ENV') === 'production' && expectedKey) {
    const provided = String(req.get('X-API-Key') || '').trim()
    if (provided !== expectedKey) {
      return res.status(403).json({ error: 'Forbidden' })
    }
  }
  return res.json(getMetricsSnapshot())
})

module.exports = router
