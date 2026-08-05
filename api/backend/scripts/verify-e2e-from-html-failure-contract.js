'use strict'

/**
 * Failure-flow contract for POST /api/from-html
 * (EMPTY_INPUT, EMPTY_OUTPUT).
 */

const { exitClean } = require('./lib/verify-exit.js')
const assert = require('assert')
const htmlConversion = require('../services/conversion/html-conversion.js')
const app = require('../app.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

function assertFailureConversionResult(result, { converter }) {
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
  assert.strictEqual(result.converter, converter)
  assert.strictEqual(result.inputFormat, 'html')
  assert.ok(result.error && typeof result.error === 'object')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0)
  assert.strictEqual(typeof result.error.message, 'string')
  assert.ok(Array.isArray(result.pipeline))
  assert.ok(Array.isArray(result.warnings))
  assert.ok(Array.isArray(result.logs))
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))
  assert.strictEqual(result.outputFile, null)
}

async function post(port, body) {
  const res = await fetch(`http://127.0.0.1:${port}/api/from-html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  const originalHtmlToMarkdown = htmlConversion.htmlToMarkdown
  const originalHtmlToPlain = htmlConversion.htmlToPlain
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()

    {
      const { status, json } = await post(port, { text: '   ', to: 'markdown' })
      assert.strictEqual(status, 400)
      assertFailureConversionResult(json, { converter: 'html-markdown' })
      assert.strictEqual(json.error.code, 'EMPTY_INPUT')
      assert.strictEqual(typeof json.detail, 'string')
      assert.strictEqual(json.detail, json.error.message)
      console.log('[OK] from-html EMPTY_INPUT contract')
    }

    {
      htmlConversion.htmlToMarkdown = async () => '   '
      const { status, json } = await post(port, {
        text: '<p>Hello</p>',
        to: 'markdown',
      })
      assert.strictEqual(status, 500)
      assertFailureConversionResult(json, { converter: 'html-markdown' })
      assert.strictEqual(json.error.code, 'EMPTY_OUTPUT')
      assert.ok(json.error.details && json.error.details.stage === 'post-convert')
      console.log('[OK] from-html EMPTY_OUTPUT (markdown) contract')
      htmlConversion.htmlToMarkdown = originalHtmlToMarkdown
    }

    {
      htmlConversion.htmlToPlain = () => '   '
      const { status, json } = await post(port, {
        text: '<p>Hello</p>',
        to: 'txt',
      })
      assert.strictEqual(status, 500)
      assertFailureConversionResult(json, { converter: 'html-plain' })
      assert.strictEqual(json.error.code, 'EMPTY_OUTPUT')
      assert.ok(json.error.details && json.error.details.stage === 'post-convert')
      console.log('[OK] from-html EMPTY_OUTPUT (txt) contract')
      htmlConversion.htmlToPlain = originalHtmlToPlain
    }

    console.log('[OK] e2e /api/from-html failure contracts validated')
  } finally {
    htmlConversion.htmlToMarkdown = originalHtmlToMarkdown
    htmlConversion.htmlToPlain = originalHtmlToPlain
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {
    console.error('[FAIL] e2e from-html failure-flow contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
