'use strict'

const { randomUUID } = require('crypto')
const { recordConversionResponse } = require('../services/metrics/conversion-metrics.js')

function injectRequestId(req, payload) {
  if (!req?.requestId || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload
  }
  const out = { ...payload }
  if (typeof out.success === 'boolean') {
    out.meta = { ...(out.meta && typeof out.meta === 'object' && !Array.isArray(out.meta) ? out.meta : {}), requestId: req.requestId }
  }
  if (out.conversionResult && typeof out.conversionResult === 'object' && !Array.isArray(out.conversionResult)) {
    const cr = out.conversionResult
    out.conversionResult = {
      ...cr,
      meta: { ...(cr.meta && typeof cr.meta === 'object' && !Array.isArray(cr.meta) ? cr.meta : {}), requestId: req.requestId },
    }
  }
  recordConversionResponse(out)
  return out
}

/**
 * ASC-006 — HTTP request correlation id
 */
module.exports = function requestIdMiddleware(req, res, next) {
  const incoming = String(req.get('X-Request-Id') || '').trim()
  const requestId = incoming || randomUUID()
  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)

  const originalJson = res.json.bind(res)
  res.json = function jsonWithRequestId(body) {
    return originalJson(injectRequestId(req, body))
  }

  next()
}
