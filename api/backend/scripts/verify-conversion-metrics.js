'use strict'

const { exitClean } = require('./lib/verify-exit.js')
/**
 * Verify GET /api/metrics aggregates error.code (+ failures_by_route)
 * and ring-buffer persistence under reports/.
 * Usage: node scripts/verify-conversion-metrics.js
 */

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const app = require('../app.js')
const {
  resetMetricsForTests,
  getMetricsSnapshot,
  recordConversionResponse,
  _persistNowForTests,
  _loadPersistedForTests,
  _setMetricsFilePathForTests,
  _setPersistEnabledForTests,
} = require('../services/metrics/conversion-metrics.js')

async function post(port, route, body) {
  const res = await fetch(`http://127.0.0.1:${port}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function main() {
  resetMetricsForTests()
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()

    // Success
    const ok = await post(port, '/api/from-markdown', {
      text: '# Hi\n\nWorld\n',
      to: 'html',
    })
    assert.strictEqual(ok.status, 200)

    // Failures with distinct codes
    const empty = await post(port, '/api/from-markdown', { text: '   ', to: 'html' })
    assert.strictEqual(empty.status, 400)
    assert.strictEqual(empty.json.error.code, 'EMPTY_INPUT')

    const unsupported = await post(port, '/api/from-markdown', {
      text: '# Hi\n',
      to: 'pdf',
    })
    assert.strictEqual(unsupported.status, 400)
    assert.strictEqual(unsupported.json.error.code, 'FORMAT_UNSUPPORTED')

    const metricsRes = await fetch(`http://127.0.0.1:${port}/api/metrics`)
    assert.strictEqual(metricsRes.status, 200)
    const metrics = await metricsRes.json()

    assert.ok(metrics.conversion_success_total >= 1, 'success total')
    assert.ok(metrics.conversion_failures_total >= 2, 'failures total')
    assert.ok(metrics.errors_by_code && typeof metrics.errors_by_code === 'object')
    assert.ok(!Array.isArray(metrics.errors_by_code), 'errors_by_code is a map')
    assert.ok(metrics.errors_by_code.EMPTY_INPUT >= 1, 'EMPTY_INPUT counted')
    assert.ok(metrics.errors_by_code.FORMAT_UNSUPPORTED >= 1, 'FORMAT_UNSUPPORTED counted')
    assert.ok(Array.isArray(metrics.errors_by_code_top), 'errors_by_code_top ranked')
    assert.ok(
      metrics.failures_by_route &&
        metrics.failures_by_route['/api/from-markdown'] &&
        metrics.failures_by_route['/api/from-markdown'].EMPTY_INPUT >= 1,
      'failures_by_route tracks from-markdown'
    )

    // In-process snapshot matches HTTP
    const snap = getMetricsSnapshot()
    assert.ok(snap.errors_by_code.EMPTY_INPUT >= 1)

    console.log('[OK] conversion metrics aggregate error.code and failures_by_route')
  } finally {
    await new Promise((resolve) => server.close(resolve))
    resetMetricsForTests()
  }

  // Persistence round-trip (isolated temp file)
  const tmpFile = path.join(os.tmpdir(), `ascend-metrics-${process.pid}-${Date.now()}.json`)
  try {
    _setMetricsFilePathForTests(tmpFile)
    resetMetricsForTests({ disablePersist: false })
    _setPersistEnabledForTests(true)

    recordConversionResponse({
      success: false,
      durationMs: 12,
      error: { code: 'EMPTY_OUTPUT', message: 'empty' },
      meta: { route: '/api/from-html' },
    })
    _persistNowForTests()
    assert.ok(fs.existsSync(tmpFile), 'metrics file written')
    const saved = JSON.parse(fs.readFileSync(tmpFile, 'utf8'))
    assert.ok(saved.conversion_failures_total >= 1)
    assert.ok(saved.errors_by_code.EMPTY_OUTPUT >= 1)
    assert.ok(saved.failures_by_route['/api/from-html'].EMPTY_OUTPUT >= 1)
    assert.strictEqual(typeof saved.persisted_at, 'string')

    // Simulate process restart: clear memory then reload file
    resetMetricsForTests({ disablePersist: false })
    _setPersistEnabledForTests(true)
    _setMetricsFilePathForTests(tmpFile)
    _loadPersistedForTests()
    const restored = getMetricsSnapshot()
    assert.ok(restored.errors_by_code.EMPTY_OUTPUT >= 1, 'restored errors_by_code')
    assert.ok(
      restored.failures_by_route['/api/from-html'] &&
        restored.failures_by_route['/api/from-html'].EMPTY_OUTPUT >= 1,
      'restored failures_by_route'
    )
    assert.strictEqual(restored.persisted, true)

    console.log('[OK] conversion metrics persistence round-trip')
  } finally {
    try {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
    } catch (_) {}
    _setMetricsFilePathForTests(null)
    resetMetricsForTests()
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {
    console.error('[FAIL] conversion metrics verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
