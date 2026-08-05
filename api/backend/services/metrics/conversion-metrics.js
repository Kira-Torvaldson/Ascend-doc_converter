'use strict'

/**
 * ASC-007 — Conversion metrics (in-memory + optional ring-buffer persist under reports/).
 */

const fs = require('fs')
const path = require('path')

const MAX_DURATION_SAMPLES = 100
const METRICS_FILENAME = 'conversion-metrics.json'
const PERSIST_DEBOUNCE_MS = 250

const state = {
  conversion_success_total: 0,
  conversion_failures_total: 0,
  duration_samples_ms: [],
  errors_by_code: {},
  /** @type {Record<string, Record<string, number>>} */
  failures_by_route: {},
  persisted_at: null,
}

let persistEnabled = process.env.ASCEND_METRICS_PERSIST !== '0'
let saveTimer = null
/** @type {string | null} */
let metricsFileOverride = null

function getMetricsFilePath() {
  if (metricsFileOverride) return metricsFileOverride
  try {
    const { getReportsDir } = require('../reports/history-manager.js')
    return path.join(getReportsDir(), METRICS_FILENAME)
  } catch (_) {
    return path.join(__dirname, '../../reports', METRICS_FILENAME)
  }
}

function applySnapshot(data) {
  if (!data || typeof data !== 'object') return
  if (Number.isFinite(data.conversion_success_total)) {
    state.conversion_success_total = Math.max(0, Math.floor(data.conversion_success_total))
  }
  if (Number.isFinite(data.conversion_failures_total)) {
    state.conversion_failures_total = Math.max(0, Math.floor(data.conversion_failures_total))
  }
  if (Array.isArray(data.duration_samples_ms)) {
    state.duration_samples_ms = data.duration_samples_ms
      .filter((n) => Number.isFinite(n) && n >= 0)
      .slice(-MAX_DURATION_SAMPLES)
  }
  if (data.errors_by_code && typeof data.errors_by_code === 'object' && !Array.isArray(data.errors_by_code)) {
    state.errors_by_code = { ...data.errors_by_code }
  }
  if (
    data.failures_by_route &&
    typeof data.failures_by_route === 'object' &&
    !Array.isArray(data.failures_by_route)
  ) {
    state.failures_by_route = Object.fromEntries(
      Object.entries(data.failures_by_route).map(([route, codes]) => [
        route,
        codes && typeof codes === 'object' && !Array.isArray(codes) ? { ...codes } : {},
      ])
    )
  }
  if (typeof data.persisted_at === 'string') {
    state.persisted_at = data.persisted_at
  }
}

function loadPersisted() {
  if (!persistEnabled) return
  try {
    const filePath = getMetricsFilePath()
    if (!fs.existsSync(filePath)) return
    const raw = fs.readFileSync(filePath, 'utf8')
    applySnapshot(JSON.parse(raw))
  } catch (_) {
    // Ignore corrupt / missing persist file
  }
}

function persistNow() {
  if (!persistEnabled) return
  try {
    const filePath = getMetricsFilePath()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    state.persisted_at = new Date().toISOString()
    const payload = {
      conversion_success_total: state.conversion_success_total,
      conversion_failures_total: state.conversion_failures_total,
      duration_samples_ms: state.duration_samples_ms.slice(-MAX_DURATION_SAMPLES),
      errors_by_code: { ...state.errors_by_code },
      failures_by_route: Object.fromEntries(
        Object.entries(state.failures_by_route).map(([route, codes]) => [route, { ...codes }])
      ),
      persisted_at: state.persisted_at,
    }
    const tmp = `${filePath}.${process.pid}.tmp`
    fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
    fs.renameSync(tmp, filePath)
  } catch (_) {
    // Best-effort persistence; metrics remain in memory
  }
}

function schedulePersist() {
  if (!persistEnabled) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    persistNow()
  }, PERSIST_DEBOUNCE_MS)
  if (typeof saveTimer.unref === 'function') saveTimer.unref()
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

function recordFailureByRoute(route, code) {
  const routeKey =
    typeof route === 'string' && route.trim().length > 0 ? route.trim() : 'unknown'
  const codeKey = typeof code === 'string' && code.length > 0 ? code : 'UNKNOWN'
  if (!state.failures_by_route[routeKey]) {
    state.failures_by_route[routeKey] = {}
  }
  const bucket = state.failures_by_route[routeKey]
  bucket[codeKey] = (bucket[codeKey] || 0) + 1
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

function resolveRoute(candidate) {
  const meta = candidate && candidate.meta && typeof candidate.meta === 'object' ? candidate.meta : null
  if (meta && typeof meta.route === 'string' && meta.route.trim()) return meta.route.trim()
  const pipeline = Array.isArray(candidate.pipeline) ? candidate.pipeline : []
  if (pipeline.length > 0 && typeof pipeline[0] === 'string') return String(pipeline[0])
  return 'unknown'
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
    schedulePersist()
    return
  }

  state.conversion_failures_total += 1
  const code =
    candidate.error && typeof candidate.error === 'object' && typeof candidate.error.code === 'string'
      ? candidate.error.code
      : 'UNKNOWN'
  recordErrorCode(code)
  recordFailureByRoute(resolveRoute(candidate), code)
  schedulePersist()
}

function getMetricsSnapshot() {
  return {
    conversion_success_total: state.conversion_success_total,
    conversion_failures_total: state.conversion_failures_total,
    conversion_duration_ms: getDurationStats(),
    // Canonical map form (doc / ops)
    errors_by_code: { ...state.errors_by_code },
    // Ranked view for dashboards
    errors_by_code_top: getTopErrors(),
    failures_by_route: Object.fromEntries(
      Object.entries(state.failures_by_route).map(([route, codes]) => [route, { ...codes }])
    ),
    persisted: persistEnabled,
    persisted_at: state.persisted_at,
  }
}

/**
 * @param {{ disablePersist?: boolean }} [opts]
 */
function resetMetricsForTests(opts = {}) {
  const disablePersist = opts.disablePersist !== false
  if (disablePersist) persistEnabled = false
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  state.conversion_success_total = 0
  state.conversion_failures_total = 0
  state.duration_samples_ms = []
  state.errors_by_code = {}
  state.failures_by_route = {}
  state.persisted_at = null
}

loadPersisted()

module.exports = {
  recordConversionResponse,
  getMetricsSnapshot,
  resetMetricsForTests,
  // Exposed for targeted persistence checks
  _persistNowForTests: persistNow,
  _loadPersistedForTests: loadPersisted,
  _getMetricsFilePathForTests: getMetricsFilePath,
  _setMetricsFilePathForTests(filePath) {
    metricsFileOverride = typeof filePath === 'string' && filePath ? filePath : null
  },
  _setPersistEnabledForTests(enabled) {
    persistEnabled = Boolean(enabled)
  },
}
