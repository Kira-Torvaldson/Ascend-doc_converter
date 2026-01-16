'use strict'

/**
 * SECURE CONVERSION ENGINE INTEGRATION EXAMPLE
 * 
 * This file shows how to integrate secure-converter.js into your Express API
 */

const express = require('express')
const { secureConvert, ConversionError } = require('./secure-converter.js')

const app = express()

// Middleware to parse JSON
app.use(express.json({ limit: '50mb' }))

/**
 * Secure conversion endpoint
 * 
 * POST /api/secure-convert
 * Body: {
 *   content: string,
 *   fromFormat: string,
 *   toFormat: string,
 *   timeout?: number (optional, default: 30000ms)
 * }
 */
app.post('/api/secure-convert', async (req, res) => {
  try {
    const { content, fromFormat, toFormat, timeout, confirmed } = req.body

    // Basic parameter validation
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST',
        message: 'Content must be a non-empty string'
      })
    }

    if (!fromFormat || !toFormat) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST',
        message: 'fromFormat and toFormat are required'
      })
    }

    // Confirmation verification (MANDATORY)
    // Frontend must send confirmed: true after confirmation window validation
    if (confirmed !== true) {
      return res.status(400).json({
        error: true,
        code: 'CONFIRMATION_REQUIRED',
        message: 'User confirmation is required before executing conversion'
      })
    }

    // Call secure conversion engine with confirmation
    const result = await secureConvert(content, fromFormat, toFormat, { 
      timeout,
      confirmed: true // Confirmation validated
    })

    // Return result
    res.json({
      success: true,
      result,
      fromFormat,
      toFormat
    })

  } catch (error) {
    // Normalized error handling
    if (error instanceof ConversionError) {
      // Conversion error: return secure response
      const statusCode = error.code === 'VALIDATION_ERROR' || error.code === 'FILE_VALIDATION_ERROR' 
        ? 400 
        : error.code === 'TIMEOUT' 
        ? 408 
        : 500

      res.status(statusCode).json(error.toSafeResponse())
    } else {
      // Unexpected error: do not expose details
      console.error('Unexpected error:', error)
      res.status(500).json({
        error: true,
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred'
      })
    }
  }
})

/**
 * Endpoint to check supported formats
 * 
 * GET /api/supported-formats
 */
app.get('/api/supported-formats', (req, res) => {
  const { CONVERSION_WHITELIST } = require('./secure-converter.js')
  
  // Extract supported formats from whitelist
  const formats = {}
  Object.keys(CONVERSION_WHITELIST).forEach(key => {
    const [from, to] = key.split('_')
    if (!formats[from]) {
      formats[from] = []
    }
    formats[from].push(to)
  })

  res.json({
    success: true,
    formats
  })
})

module.exports = app
