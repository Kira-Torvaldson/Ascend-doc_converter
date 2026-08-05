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
  assert.ok(
    ['html-markdown', 'html-plain', 'pandoc'].includes(result.converter),
    `Unexpected converter '${result.converter}'`
  )
  assert.strictEqual(result.inputFormat, 'html')
  assert.strictEqual(typeof result.outputFormat, 'string')

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

    // Unsupported output format triggers a runtime conversion error inside convertWithPandoc()
    const response = await fetch(`http://127.0.0.1:${port}/api/from-html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '<p>x</p>', to: 'not-a-format' }),
    })

    // Route wraps runtime failures as HTTP 500 with standardized ConversionResult fields.
    assert.strictEqual(response.status, 500)
    const body = await response.json()

    assertFailureConversionResult(body)
    assert.strictEqual(body.error.code, 'CONVERSION_FAILED')
    assert.strictEqual(body.outputFile, null)
    assert.ok(body.error.details && typeof body.error.details === 'object')

    // In this route implementation, a string detail is added as a convenience/debug field.
    assert.strictEqual(typeof body.detail, 'string')
    assert.strictEqual(body.detail, body.error.message)

    console.log('[OK] e2e /api/from-html internal error returns standardized ConversionResult with usable error.code')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => {
    setTimeout(() => process.exit(0), 500)
  })
  .catch((err) => {
    console.error('[FAIL] e2e from-html internal-error contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    setTimeout(() => process.exit(1), 500)
  })

