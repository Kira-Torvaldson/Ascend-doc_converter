'use strict'

/**
 * API ROUTES
 * 
 * Routes for API endpoints (confirmation tokens, logs, etc.)
 */

const express = require('express')
const router = express.Router()
const { z } = require('zod')
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
  try {
    const { content, fromFormat, toFormat, token, options } = req.body

    if (!content.trim()) {
      return res.status(400).json({ error: 'Content is required and must be a non-empty string' })
    }

    // Merge and validate options
    const mergedOptions = mergeOptions(options || {})
    const validation = validateOptions(mergedOptions)
    if (!validation.valid) {
      return res.status(400).json({
        error: `Invalid options: ${validation.error}`
      })
    }

    // Prepare expected metadata for token validation
    const expectedMetadata = {
      fromFormat: fromFormat.toLowerCase(),
      toFormat: toFormat.toLowerCase()
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

    return res.json({
      success: true,
      result: result,
      format: toFormat
    })
  } catch (error) {
    if (error instanceof ConfirmationTokenError) {
      return res.status(401).json({
        error: error.message,
        code: error.code
      })
    }

    if (error instanceof ConversionError) {
      return res.status(500).json({
        error: error.message,
        code: error.code
      })
    }

    console.error('[ERROR] Unexpected error in /convert:', error)
    return res.status(500).json({
      error: 'Internal server error during conversion'
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

module.exports = router
