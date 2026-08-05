'use strict'

/**
 * Shared ConversionResult / orchestrator failure helpers.
 * Keeps error.code structured across main → execution → converter → proxy.
 */

const { buildRouteError } = require('../../src/utils/error-envelope.js')

/**
 * @param {unknown} result
 * @returns {boolean}
 */
function isStandardizedSuccess(result) {
  return Boolean(
    result &&
    result.success === true &&
    result.error === null &&
    Object.prototype.hasOwnProperty.call(result, 'conversionId') &&
    Object.prototype.hasOwnProperty.call(result, 'durationMs') &&
    Object.prototype.hasOwnProperty.call(result, 'inputFile') &&
    Object.prototype.hasOwnProperty.call(result, 'outputFile')
  )
}

/**
 * @param {unknown} result
 * @returns {boolean}
 */
function isStandardizedFailure(result) {
  return Boolean(
    result &&
    result.success === false &&
    result.error &&
    typeof result.error === 'object' &&
    typeof result.error.code === 'string' &&
    Object.prototype.hasOwnProperty.call(result, 'conversionId') &&
    Object.prototype.hasOwnProperty.call(result, 'durationMs') &&
    Object.prototype.hasOwnProperty.call(result, 'inputFile')
  )
}

/**
 * Safe log message for structured or legacy string errors.
 * @param {unknown} error
 * @returns {string}
 */
function formatErrorForLog(error) {
  if (error && typeof error === 'object' && typeof error.message === 'string') {
    return error.code ? `${error.code}: ${error.message}` : error.message
  }
  return String(error || '')
}

/**
 * Coerce a step/module failure into a structured error object.
 * Prefer ConversionResult.error, then legacy errorCode, then message string.
 *
 * @param {unknown} error
 * @param {string|null|undefined} errorCode
 * @param {object|null} [details]
 * @returns {{ code: string, message: string, details: object|null, recoverable: boolean, category: string, hint: string|null }}
 */
function coerceOrchestratorError(error, errorCode = null, details = null) {
  if (error && typeof error === 'object' && !Array.isArray(error) && typeof error.code === 'string') {
    const existingDetails =
      error.details && typeof error.details === 'object' && !Array.isArray(error.details)
        ? error.details
        : {}
    const mergedDetails = details
      ? { ...existingDetails, ...details }
      : (Object.keys(existingDetails).length > 0 ? existingDetails : null)
    return buildRouteError(
      error.code,
      typeof error.message === 'string' && error.message ? error.message : error.code,
      mergedDetails,
      Boolean(error.recoverable)
    )
  }

  const message = typeof error === 'string' && error
    ? error
    : formatErrorForLog(error) || 'Conversion failed'
  const code =
    typeof errorCode === 'string' && errorCode
      ? errorCode
      : 'CONVERSION_FAILED'
  return buildRouteError(code, message, details)
}

/**
 * Build a lightweight orchestrator failure (not a full ConversionResult envelope).
 * Proxy reconstructs ConversionResult; bulk keeps body.error via .message.
 *
 * @param {object} opts
 * @param {string} opts.code
 * @param {string} opts.message
 * @param {string[]} [opts.logs]
 * @param {number} [opts.duration]
 * @param {object|null} [opts.details]
 * @param {string|null} [opts.pipelineState]
 * @param {boolean} [opts.recoverable]
 * @returns {{ success: false, logs: string[], error: object, duration: number, pipelineState?: string }}
 */
function makeOrchestratorFailure({
  code,
  message,
  logs = [],
  duration = 0,
  details = null,
  pipelineState = null,
  recoverable = false,
}) {
  const ret = {
    success: false,
    logs,
    error: buildRouteError(code, message, details, recoverable),
    duration,
  }
  if (pipelineState) {
    ret.pipelineState = pipelineState
  }
  return ret
}

module.exports = {
  isStandardizedSuccess,
  isStandardizedFailure,
  formatErrorForLog,
  coerceOrchestratorError,
  makeOrchestratorFailure,
}
