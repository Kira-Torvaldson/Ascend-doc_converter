'use strict'

/**
 * ERROR HANDLER MIDDLEWARE
 * 
 * Global error handler for Express
 */

function errorHandler(err, req, res, next) {
  console.error('[ERROR] Unhandled error:', err)

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production'

  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  })
}

module.exports = errorHandler
