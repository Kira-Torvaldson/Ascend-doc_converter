'use strict'

/**
 * CORS MIDDLEWARE
 * 
 * CORS configuration for the API
 */

const cors = require('cors')

function getAllowedOrigins() {
  const frontendUrl = (process.env.FRONTEND_URL || '').trim()
  const devOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ]
  return frontendUrl ? [frontendUrl, ...devOrigins] : devOrigins
}

/** En dev, Vite peut utiliser 5174+ si 5173 est pris — autoriser localhost/127.0.0.1 (HTTP). */
function isDevLocalOrigin(origin) {
  if (process.env.NODE_ENV === 'production') return false
  try {
    const url = new URL(origin)
    return url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  } catch {
    return false
  }
}

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (curl, server-to-server) with no Origin header.
    if (!origin) return callback(null, true)
    if (isDevLocalOrigin(origin)) return callback(null, true)
    const allowed = getAllowedOrigins()
    if (allowed.includes(origin)) return callback(null, true)
    const err = new Error('CORS origin not allowed')
    err.status = 403
    return callback(err, false)
  },
  credentials: true
}

module.exports = cors(corsOptions)
