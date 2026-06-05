'use strict'

/**
 * ASC-008 — Single source for conversion input size limits (via EnvMap).
 */

const { envMap } = require('./envmap.module.js')

function getMaxInputSizeMb() {
  const mb = Number(envMap.get('MAX_INPUT_SIZE_MB'))
  return Number.isFinite(mb) && mb > 0 ? mb : 5
}

function getMaxInputSizeBytes() {
  return Math.floor(getMaxInputSizeMb() * 1024 * 1024)
}

function getConversionTimeoutMs() {
  const ms = Number(envMap.get('CONVERSION_TIMEOUT_MS'))
  return Number.isFinite(ms) && ms > 0 ? ms : 30000
}

function getLimitsSnapshot() {
  const maxInputSizeMb = getMaxInputSizeMb()
  return {
    maxInputSizeMb,
    maxInputSizeBytes: getMaxInputSizeBytes(),
    maxSourceUiMb: maxInputSizeMb,
    conversionTimeoutMs: getConversionTimeoutMs(),
  }
}

/** Express body parser limit with small margin over max input. */
function getExpressBodyLimitString() {
  const bytes = getMaxInputSizeBytes()
  const mb = Math.max(1, Math.ceil((bytes * 1.2) / (1024 * 1024)))
  return `${mb}mb`
}

module.exports = {
  getMaxInputSizeMb,
  getMaxInputSizeBytes,
  getConversionTimeoutMs,
  getLimitsSnapshot,
  getExpressBodyLimitString,
}
