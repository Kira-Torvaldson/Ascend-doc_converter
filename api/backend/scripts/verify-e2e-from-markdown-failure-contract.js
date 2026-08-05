'use strict'

const { exitClean } = require('./lib/verify-exit.js')
/**
 * Failure-flow contract for POST /api/from-markdown
 * (EMPTY_INPUT, FORMAT_UNSUPPORTED, EMPTY_OUTPUT, CONVERSION_TIMEOUT).
 */

const assert = require('assert')
const htmlConversion = require('../services/conversion/html-conversion.js')
const app = require('../app.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

function assertFailureConversionResult(result, { converter = 'pandoc' } = {}) {
  for (const f of [
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
  ]) {
    assertHas(result, f)
  }
  assert.strictEqual(result.success, false)
  assert.strictEqual(result.converter, converter)
  assert.strictEqual(result.inputFormat, 'markdown')
  assert.ok(result.error && typeof result.error === 'object')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0)
  assert.strictEqual(typeof result.error.message, 'string')
  assert.strictEqual(result.outputFile, null)
  assert.ok(result.meta && typeof result.meta === 'object')
}

async function post(port, body) {
  const res = await fetch(`http://127.0.0.1:${port}/api/from-markdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  const originalHtml = htmlConversion.markdownToHtml
  const originalPlain = htmlConversion.markdownToPlainBestEffort
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()

    // EMPTY_INPUT
    {
      const { status, json } = await post(port, { text: '   ', to: 'html' })
      assert.strictEqual(status, 400)
      assertFailureConversionResult(json)
      assert.strictEqual(json.error.code, 'EMPTY_INPUT')
      assert.strictEqual(typeof json.detail, 'string')
      assert.strictEqual(json.detail, json.error.message)
      console.log('[OK] from-markdown EMPTY_INPUT contract')
    }

    // FORMAT_UNSUPPORTED
    {
      const { status, json } = await post(port, { text: '# Title\n', to: 'pdf' })
      assert.strictEqual(status, 400)
      assertFailureConversionResult(json)
      assert.strictEqual(json.error.code, 'FORMAT_UNSUPPORTED')
      console.log('[OK] from-markdown FORMAT_UNSUPPORTED contract')
    }

    // EMPTY_OUTPUT (stub pandoc html path)
    {
      htmlConversion.markdownToHtml = async () => '   '
      const { status, json } = await post(port, { text: '# Title\n\nBody\n', to: 'html' })
      assert.strictEqual(status, 500)
      assertFailureConversionResult(json)
      assert.strictEqual(json.error.code, 'EMPTY_OUTPUT')
      assert.ok(json.error.details && json.error.details.stage === 'post-convert')
      console.log('[OK] from-markdown EMPTY_OUTPUT contract')
      htmlConversion.markdownToHtml = originalHtml
    }

    // CONVERSION_TIMEOUT (stub plain best-effort)
    {
      htmlConversion.markdownToPlainBestEffort = async () => {
        const err = new Error('Pandoc conversion timed out')
        err.code = 'CONVERSION_TIMEOUT'
        throw err
      }
      const { status, json } = await post(port, { text: '# Title\n\nBody\n', to: 'txt' })
      assert.strictEqual(status, 500)
      assertFailureConversionResult(json)
      assert.strictEqual(json.error.code, 'CONVERSION_TIMEOUT')
      console.log('[OK] from-markdown CONVERSION_TIMEOUT contract')
      htmlConversion.markdownToPlainBestEffort = originalPlain
    }

    console.log('[OK] e2e /api/from-markdown failure contracts validated')
  } finally {
    htmlConversion.markdownToHtml = originalHtml
    htmlConversion.markdownToPlainBestEffort = originalPlain
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {
    console.error('[FAIL] e2e from-markdown failure-flow contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
