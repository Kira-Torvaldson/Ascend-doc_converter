'use strict'

const helmet = require('helmet')

/**
 * Standard security headers for the API.
 * Keep CSP disabled by default here to avoid breaking the existing frontend/UI
 * when served behind different proxies and during local dev.
 */
module.exports = helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: false
})

