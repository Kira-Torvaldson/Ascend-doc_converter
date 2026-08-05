'use strict'

const { exitClean } = require('./lib/verify-exit.js')
/**
 * Failure-flow contract for POST /api/from-text
 * (EMPTY_INPUT, FORMAT_UNSUPPORTED, EMPTY_OUTPUT).
 */

const assert = require('assert')
const htmlConversion = require('../services/conversion/html-conversion.js')
const app = require('../app.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

function assertFailureConversionResult(result, { converter }) {
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
  assert.strictEqual(result.inputFormat, 'txt')
  assert.ok(result.error && typeof result.error === 'object')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0)
  assert.strictEqual(result.outputFile, null)
}

async function post(port, body) {
  const res = await fetch(`http://127.0.0.1:${port}/api/from-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  const originalPlainToHtml = htmlConversion.plainToHtml
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()

    {
      const { status, json } = await post(port, { text: '   ', to: 'html' })
      assert.strictEqual(status, 400)
      assertFailureConversionResult(json, { converter: 'html-plain' })
      assert.strictEqual(json.error.code, 'EMPTY_INPUT')
      assert.strictEqual(typeof json.detail, 'string')
      console.log('[OK] from-text EMPTY_INPUT contract')
    }

    {
      const { status, json } = await post(port, { text: 'Hello', to: 'pdf' })
      assert.strictEqual(status, 400)
      // Unknown target → buildFromTextFailure defaults converter to text2markdown
      assertFailureConversionResult(json, { converter: 'text2markdown' })
      assert.strictEqual(json.error.code, 'FORMAT_UNSUPPORTED')
      console.log('[OK] from-text FORMAT_UNSUPPORTED contract')
    }

    {
      htmlConversion.plainToHtml = () => '   '
      const { status, json } = await post(port, { text: 'Hello world', to: 'html' })
      assert.strictEqual(status, 500)
      assertFailureConversionResult(json, { converter: 'html-plain' })
      assert.strictEqual(json.error.code, 'EMPTY_OUTPUT')
      assert.ok(json.error.details && json.error.details.stage === 'post-convert')
      console.log('[OK] from-text EMPTY_OUTPUT contract')
      htmlConversion.plainToHtml = originalPlainToHtml
    }

    console.log('[OK] e2e /api/from-text failure contracts validated')
  } finally {
    htmlConversion.plainToHtml = originalPlainToHtml
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {
    console.error('[FAIL] e2e from-text failure-flow contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
