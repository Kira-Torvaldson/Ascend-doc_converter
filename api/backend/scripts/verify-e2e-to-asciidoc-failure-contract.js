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
    'meta',
  ]
  for (const f of expectedRootFields) assertHas(result, f)

  assert.strictEqual(result.success, false)
  assert.strictEqual(result.converter, 'pandoc')
  assert.strictEqual(result.inputFormat, 'markdown')
  assert.strictEqual(result.outputFormat, 'asciidoc')
  assert.ok(result.error && typeof result.error === 'object')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0)
  assert.strictEqual(typeof result.error.message, 'string')
  assert.ok(Array.isArray(result.pipeline))
  assert.ok(Array.isArray(result.warnings))
  assert.ok(Array.isArray(result.logs))
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()

    const response = await fetch(`http://127.0.0.1:${port}/api/to-asciidoc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    })

    assert.strictEqual(response.status, 400)
    const body = await response.json()
    assertFailureConversionResult(body)
    assert.strictEqual(body.error.code, 'EMPTY_INPUT')
    assert.strictEqual(typeof body.detail, 'string')
    assert.strictEqual(body.detail, body.error.message)

    console.log('[OK] e2e /api/to-asciidoc failure returns standardized ConversionResult with structured error.code')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => {
    setTimeout(() => process.exit(0), 500)
  })
  .catch((err) => {
    console.error('[FAIL] e2e to-asciidoc failure-flow contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    setTimeout(() => process.exit(1), 500)
  })

