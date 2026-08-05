'use strict'

/**
 * Shared helpers for mapping orchestrator failures to proxy/API codes
 * without stringifying structured ConversionResult.error objects.
 */

/**
 * @param {unknown} error
 * @returns {string}
 */
function formatOrchestratorErrorMessage(error) {
  if (error && typeof error === 'object' && typeof error.message === 'string') {
    return error.code ? `${error.code}: ${error.message}` : error.message
  }
  return String(error || '')
}

/**
 * Prefer structured error.code when present; fall back to legacy message heuristics.
 * @param {{ error?: unknown, pipelineState?: string } | null | undefined} orchestratorResult
 * @returns {string}
 */
function classifyProxyFailure(orchestratorResult) {
  const pipelineState = orchestratorResult && orchestratorResult.pipelineState
  if (pipelineState === 'empty_input') return 'EMPTY_INPUT'
  if (pipelineState === 'no_output') return 'OUTPUT_NOT_CREATED'
  if (pipelineState === 'wrapper_failed_clean') return 'OUTPUT_INVALID'

  const err = orchestratorResult && orchestratorResult.error
  if (err && typeof err === 'object' && typeof err.code === 'string' && err.code) {
    return err.code
  }

  const message =
    typeof err === 'string'
      ? err
      : err && typeof err.message === 'string'
        ? err.message
        : String(err || '')

  // Legacy string heuristics (pre-structured orchestrator failures)
  if (/No conversion path found/i.test(message)) return 'FORMAT_UNSUPPORTED'
  if (/overloaded|Concurrency limit/i.test(message)) return 'RESOURCE_LIMIT_EXCEEDED'
  if (/timeout/i.test(message)) return 'CONVERSION_TIMEOUT'
  return 'CONVERSION_FAILED'
}

/**
 * Legacy bulk/API body.error must remain a string.
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string}
 */
function legacyProxyErrorString(error, fallback = 'Conversion failed for unknown reason') {
  if (typeof error === 'string' && error) return error
  if (error && typeof error === 'object' && typeof error.message === 'string' && error.message) {
    return error.message
  }
  return fallback
}

module.exports = {
  classifyProxyFailure,
  formatOrchestratorErrorMessage,
  legacyProxyErrorString,
}
