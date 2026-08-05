'use strict'


const { exitClean } = require('./lib/verify-exit.js')
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
  assert.strictEqual(typeof result.error.category, 'string')
  assert.ok(result.error.category.length > 0)
  assert.ok(
    result.error.hint === null || typeof result.error.hint === 'string',
    'error.hint must be string or null'
  )
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
    assert.strictEqual(typeof body.detail, 'string')
    assert.strictEqual(body.detail, body.error.message)

    // Additional low-level drift check: zero-length string should now be
    // normalized by route pre-check into the same structured EMPTY_INPUT shape.
    const emptyResponse = await fetch(`http://127.0.0.1:${port}/api/to-markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' })
    })
    assert.strictEqual(emptyResponse.status, 400)
    const emptyBody = await emptyResponse.json()
    assertFailureConversionResult(emptyBody)
    assert.strictEqual(emptyBody.error.code, 'EMPTY_INPUT')
    assert.strictEqual(emptyBody.error.category, 'VALIDATION_ERROR')
    assert.strictEqual(typeof emptyBody.error.hint, 'string')
    assert.ok(emptyBody.error.hint.length > 0)
    assert.strictEqual(typeof emptyBody.detail, 'string')
    assert.strictEqual(emptyBody.detail, emptyBody.error.message)

    console.log('[OK] e2e /api/to-markdown failure returns standardized ConversionResult with structured error.code')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {

    console.error('[FAIL] e2e failure-flow contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })

