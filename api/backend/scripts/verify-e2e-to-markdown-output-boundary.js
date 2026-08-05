'use strict'

const { exitClean } = require('./lib/verify-exit.js')

/**
 * Sub-step 2.5.4: verify standardized ConversionResult survives to the HTTP
 * response boundary for POST /api/to-markdown (AsciiDoc → Markdown, downdoc).
 *
 * Success: body includes { markdown, conversionResult } where conversionResult
 * is the full contract from runConverter.
 * Failure: body is ConversionResult plus legacy `detail` for client compatibility.
 */

const assert = require('assert')
const app = require('../app.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

function assertConversionResultRoot(result) {
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
    'meta',
  ]
  for (const f of expectedRootFields) assertHas(result, f)

  assert.strictEqual(typeof result.success, 'boolean')
  assert.strictEqual(typeof result.conversionId, 'string')
  assert.strictEqual(typeof result.converter, 'string')
  assert.ok(Array.isArray(result.pipeline))
  assert.strictEqual(typeof result.inputFormat, 'string')
  assert.strictEqual(typeof result.outputFormat, 'string')
  assert.ok(result.inputFile && typeof result.inputFile === 'object')
  assert.strictEqual(typeof result.durationMs, 'number')
  assert.strictEqual(typeof result.startedAt, 'string')
  assert.strictEqual(typeof result.finishedAt, 'string')
  assert.ok(Array.isArray(result.warnings))
  assert.ok(Array.isArray(result.logs))
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))
}

function assertSuccessConversionResult(result) {
  assertConversionResultRoot(result)
  assert.strictEqual(result.success, true)
  assert.strictEqual(result.error, null)
  assert.ok(result.outputFile && typeof result.outputFile === 'object')
}

function assertFailureConversionResult(result) {
  assertConversionResultRoot(result)
  assert.strictEqual(result.success, false)
  assert.ok(result.error && typeof result.error === 'object')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0)
  assert.ok(result.outputFile === null || typeof result.outputFile === 'object')
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()
    const base = `http://127.0.0.1:${port}/api/to-markdown`

    // Success path: nominal AsciiDoc
    const okRes = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '= Title\n\nSome paragraph.\n' }),
    })
    assert.strictEqual(okRes.status, 200)
    const okBody = await okRes.json()
    assert.strictEqual(typeof okBody.markdown, 'string')
    assert.ok(okBody.markdown.length > 0)
    assertHas(okBody, 'conversionResult')
    assertSuccessConversionResult(okBody.conversionResult)

    // Failure path: converter standardized failure (same probe as failure-contract script)
    const failRes = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: ':experimental:' }),
    })
    assert.strictEqual(failRes.status, 500)
    const failBody = await failRes.json()
    assertFailureConversionResult(failBody)
    assert.strictEqual(typeof failBody.detail, 'string')
    assert.strictEqual(failBody.detail, failBody.error.message)

    console.log(
      '[OK] e2e /api/to-markdown output boundary: success exposes conversionResult; failure preserves contract + detail'
    )
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {
    console.error('[FAIL] e2e to-markdown output boundary verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
