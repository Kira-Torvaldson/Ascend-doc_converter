'use strict'


const { exitClean } = require('./lib/verify-exit.js')
const assert = require('assert')

const convertModulePath = require.resolve('../services/conversion/convert.js')
const convertModule = require(convertModulePath)
const originalConvertMarkdownWithPandoc = convertModule.convertMarkdownWithPandoc

convertModule.convertMarkdownWithPandoc = async () => {
  throw new Error('Pandoc conversion failed: forced internal-path verification error')
}

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

  for (const field of expectedRootFields) assertHas(result, field)

  assert.strictEqual(result.success, false)
  assert.strictEqual(result.converter, 'pandoc')
  assert.strictEqual(result.inputFormat, 'markdown')
  assert.strictEqual(result.outputFormat, 'asciidoc')
  assert.ok(Array.isArray(result.pipeline))
  assert.ok(Array.isArray(result.warnings))
  assert.ok(Array.isArray(result.logs))
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))
  assert.ok(result.error && typeof result.error === 'object')
  assert.strictEqual(result.error.code, 'CONVERSION_FAILED')
  assert.strictEqual(typeof result.error.message, 'string')
  assert.ok(result.error.message.includes('forced internal-path verification error'))
  assert.ok(result.error.details && typeof result.error.details === 'object')
  assert.strictEqual(result.error.details.stage, 'pandoc-execution')
  assert.strictEqual(typeof result.durationMs, 'number')
  assert.strictEqual(typeof result.startedAt, 'string')
  assert.strictEqual(typeof result.finishedAt, 'string')
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

    assert.strictEqual(response.status, 500)
    const body = await response.json()
    assertFailureConversionResult(body)
    assert.strictEqual(typeof body.detail, 'string')
    assert.strictEqual(body.detail, body.error.message)

    console.log('[OK] e2e /api/to-asciidoc internal coordination-layer error returns standardized failure ConversionResult')
  } finally {
    convertModule.convertMarkdownWithPandoc = originalConvertMarkdownWithPandoc
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {

    console.error('[FAIL] e2e to-asciidoc internal-error contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
