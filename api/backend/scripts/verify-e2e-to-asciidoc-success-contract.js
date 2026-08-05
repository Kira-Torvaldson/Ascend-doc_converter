'use strict'


const { exitClean } = require('./lib/verify-exit.js')
const assert = require('assert')
const app = require('../app.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

function assertSuccessConversionResult(result) {
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

  assert.strictEqual(result.success, true)
  assert.strictEqual(result.error, null)
  assert.strictEqual(typeof result.conversionId, 'string')
  assert.strictEqual(result.converter, 'pandoc')
  assert.ok(Array.isArray(result.pipeline))
  assert.strictEqual(result.inputFormat, 'markdown')
  assert.strictEqual(result.outputFormat, 'asciidoc')
  assert.ok(result.inputFile && typeof result.inputFile === 'object')
  assert.ok(result.outputFile && typeof result.outputFile === 'object')
  assert.strictEqual(typeof result.durationMs, 'number')
  assert.strictEqual(typeof result.startedAt, 'string')
  assert.strictEqual(typeof result.finishedAt, 'string')
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
      body: JSON.stringify({ text: '# Title\n\nSome paragraph.' }),
    })

    assert.strictEqual(response.status, 200)
    const body = await response.json()
    assert.strictEqual(typeof body.asciidoc, 'string')
    assert.ok(body.asciidoc.length > 0)
    assert.ok(body.conversionResult && typeof body.conversionResult === 'object')
    assertSuccessConversionResult(body.conversionResult)

    console.log('[OK] e2e /api/to-asciidoc success returns asciidoc plus standardized ConversionResult')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {

    console.error('[FAIL] e2e to-asciidoc success-flow contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })

