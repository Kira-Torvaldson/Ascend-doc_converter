'use strict'

/**
 * ASC-007 — In-memory conversion metrics (ring buffer + counters).
 */

const MAX_DURATION_SAMPLES = 100

const state = {
  conversion_success_total: 0,
  conversion_failures_total: 0,
  duration_samples_ms: [],
  errors_by_code: {},
}

function recordDuration(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs < 0) return
  state.duration_samples_ms.push(durationMs)
  if (state.duration_samples_ms.length > MAX_DURATION_SAMPLES) {
    state.duration_samples_ms.shift()
  }
}

function recordErrorCode(code) {
  const key = typeof code === 'string' && code.length > 0 ? code : 'UNKNOWN'
  state.errors_by_code[key] = (state.errors_by_code[key] || 0) + 1
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
}

function getDurationStats() {
  const sorted = [...state.duration_samples_ms].sort((a, b) => a - b)
  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    sample_count: sorted.length,
  }
}

function getTopErrors(limit = 10) {
  return Object.entries(state.errors_by_code)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([code, count]) => ({ code, count }))
}

/**
 * Record from API JSON body (ConversionResult root or wrapped).
 */
function recordConversionResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return

  const candidate =
    typeof payload.success === 'boolean'
      ? payload
      : payload.conversionResult && typeof payload.conversionResult === 'object'
        ? payload.conversionResult
        : null

  if (!candidate || typeof candidate.success !== 'boolean') return

  if (Number.isFinite(candidate.durationMs)) {
    recordDuration(candidate.durationMs)
  }

  if (candidate.success) {
    state.conversion_success_total += 1
    return
  }

  state.conversion_failures_total += 1
  const code =
    candidate.error && typeof candidate.error === 'object' && typeof candidate.error.code === 'string'
      ? candidate.error.code
      : 'UNKNOWN'
  recordErrorCode(code)
}

function getMetricsSnapshot() {
  return {
    conversion_success_total: state.conversion_success_total,
    conversion_failures_total: state.conversion_failures_total,
    conversion_duration_ms: getDurationStats(),
    errors_by_code: getTopErrors(),
  }
}

function resetMetricsForTests() {
  state.conversion_success_total = 0
  state.conversion_failures_total = 0
  state.duration_samples_ms = []
  state.errors_by_code = {}
}

module.exports = {
  recordConversionResponse,
  getMetricsSnapshot,
  resetMetricsForTests,
}
