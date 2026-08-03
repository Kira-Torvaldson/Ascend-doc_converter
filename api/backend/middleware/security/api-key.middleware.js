'use strict'

/**
 * API key protection for `/api/*`.
 *
 * Threat model:
 * - Browser users can always craft requests. We enforce a server-side secret
 *   that the browser never receives (in production we inject it from Nginx).
 *
 * Behavior:
 * - If API_KEY is NOT set: allow all (dev-friendly).
 * - If API_KEY is set: require matching `X-API-Key` header.
 */
const { envMap } = require('../../services/config/envmap.module.js')

module.exports = function apiKeyMiddleware(req, res, next) {
  const expected = String(envMap.get('API_KEY') || '').trim()
  if (!expected) return next()

  const provided = String(req.get('X-API-Key') || '').trim()
  if (provided && provided === expected) return next()

  return res.status(401).json({ error: 'Unauthorized' })
}

