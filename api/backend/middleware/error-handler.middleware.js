'use strict'

/**
 * ERROR HANDLER MIDDLEWARE
 * 
 * Global error handler for Express
 */

const { envMap } = require('../services/config/envmap.module.js')

function errorHandler(err, req, res, next) {
  console.error('[ERROR] Unhandled error:', err)

  // Don't leak error details in production
  const isDevelopment = envMap.get('NODE_ENV') !== 'production'

  if (!isDevelopment) {
    return res.status(err.status || 500).json({
      error: 'Internal server error'
    })
  }

  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: err.stack
  })
}

module.exports = errorHandler
