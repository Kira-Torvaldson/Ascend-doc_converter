'use strict'

const assert = require('assert')
const app = require('../app.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

function assertFailureConversionResult(result) {
  const expectedRootFields = [
    'success',
    'conversionId',
    'converter',
    'pipeline',
    'inputFormat',
    'outputFormat',
    'inputFile',
    'outputFile',
    'durationMs',
    'startedAt',
    'finishedAt',
    'warnings',
    'logs',
    'error',
    'meta'
  ]
  for (const f of expectedRootFields) assertHas(result, f)

  assert.strictEqual(result.success, false)
  assert.strictEqual(typeof result.conversionId, 'string')
  assert.strictEqual(typeof result.converter, 'string')
  assert.ok(Array.isArray(result.pipeline))
  assert.strictEqual(typeof result.inputFormat, 'string')
  assert.strictEqual(typeof result.outputFormat, 'string')
  assert.ok(result.inputFile && typeof result.inputFile === 'object')
  assert.ok(result.outputFile === null || typeof result.outputFile === 'object')
  assert.strictEqual(typeof result.durationMs, 'number')
  assert.strictEqual(typeof result.startedAt, 'string')
  assert.strictEqual(typeof result.finishedAt, 'string')
  assert.ok(Array.isArray(result.warnings))
  assert.ok(Array.isArray(result.logs))
  assert.ok(result.error && typeof result.error === 'object')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0)
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()

    // This payload passes route-level min(1) check, then normalizes to empty
    // and triggers the migrated converter standardized failure path.
    const response = await fetch(`http://127.0.0.1:${port}/api/to-markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: ':experimental:' })
    })

    assert.strictEqual(response.status, 500)
    const body = await response.json()
    assertFailureConversionResult(body)

    console.log('[OK] e2e /api/to-markdown failure returns standardized ConversionResult with structured error.code')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main().catch((err) => {
  console.error('[FAIL] e2e failure-flow contract verification failed')
  console.error(err && err.stack ? err.stack : String(err))
  process.exitCode = 1
})

