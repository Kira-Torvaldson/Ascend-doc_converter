'use strict'

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
  assert.strictEqual(result.inputFormat, 'html')
  assert.strictEqual(result.outputFormat, 'markdown')
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

    const response = await fetch(`http://127.0.0.1:${port}/api/from-html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '<h1>Title</h1><p>Paragraph.</p>',
        to: 'markdown',
      }),
    })

    assert.strictEqual(response.status, 200)
    const body = await response.json()
    assert.strictEqual(typeof body.markdown, 'string')
    assert.ok(body.markdown.length > 0)
    assert.ok(body.conversionResult && typeof body.conversionResult === 'object')
    assertSuccessConversionResult(body.conversionResult)

    console.log('[OK] e2e /api/from-html success returns markdown plus standardized ConversionResult')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => {
    setTimeout(() => process.exit(0), 500)
  })
  .catch((err) => {
    console.error('[FAIL] e2e from-html success-flow contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    setTimeout(() => process.exit(1), 500)
  })
