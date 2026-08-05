'use strict'


const { exitClean } = require('./lib/verify-exit.js')
/**
 * Contract verification for POST /api/proxy/convert (normalization proxy).
 *
 * The proxy keeps its legacy response shape for compatibility with
 * bulk-processor.ts ({ success, result | error:string }) and additionally
 * exposes the standardized ConversionResult contract in `conversionResult`.
 */

const assert = require('assert')
const app = require('../app.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

const ROOT_FIELDS = [
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

function assertConversionResultShape(cr) {
  assert.ok(cr && typeof cr === 'object', 'conversionResult must be an object')
  for (const f of ROOT_FIELDS) assertHas(cr, f)
  assert.strictEqual(typeof cr.conversionId, 'string')
  assert.strictEqual(typeof cr.durationMs, 'number')
  assert.ok(Array.isArray(cr.logs))
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()
    const base = `http://127.0.0.1:${port}`

    // 1. Success: asciidoc → markdown through main orchestrator
    {
      const response = await fetch(`${base}/api/proxy/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '= Title\n\nSome paragraph.',
          fromFormat: 'asciidoc',
          toFormat: 'markdown',
        }),
      })
      assert.strictEqual(response.status, 200)
      const body = await response.json()
      assert.strictEqual(body.success, true)
      assert.strictEqual(typeof body.result, 'string')
      assert.ok(body.result.length > 0)
      assertConversionResultShape(body.conversionResult)
      assert.strictEqual(body.conversionResult.success, true)
      assert.strictEqual(body.conversionResult.error, null)
      assert.strictEqual(body.conversionResult.inputFormat, 'asciidoc')
      assert.strictEqual(body.conversionResult.outputFormat, 'markdown')
      console.log('[OK] /api/proxy/convert success keeps legacy shape and adds ConversionResult')
    }

    // 2. Missing content → 400, legacy error string + failure ConversionResult
    {
      const response = await fetch(`${base}/api/proxy/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromFormat: 'asciidoc',
          toFormat: 'markdown',
        }),
      })
      assert.strictEqual(response.status, 400)
      const body = await response.json()
      assert.strictEqual(body.success, false)
      assert.strictEqual(typeof body.error, 'string', 'legacy error must stay a string')
      assertConversionResultShape(body.conversionResult)
      assert.strictEqual(body.conversionResult.success, false)
      assert.strictEqual(body.conversionResult.error.code, 'EMPTY_INPUT')
      assert.strictEqual(typeof body.conversionResult.error.category, 'string')
      console.log('[OK] /api/proxy/convert missing content returns legacy error string plus ConversionResult')
    }

    // 3. Unsupported conversion path → failure ConversionResult with FORMAT_UNSUPPORTED
    {
      const response = await fetch(`${base}/api/proxy/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'some content',
          fromFormat: 'unknownformat',
          toFormat: 'markdown',
        }),
      })
      assert.strictEqual(response.status, 500)
      const body = await response.json()
      assert.strictEqual(body.success, false)
      assert.strictEqual(typeof body.error, 'string')
      assertConversionResultShape(body.conversionResult)
      assert.strictEqual(body.conversionResult.success, false)
      assert.strictEqual(body.conversionResult.error.code, 'FORMAT_UNSUPPORTED')
      console.log('[OK] /api/proxy/convert unsupported path returns FORMAT_UNSUPPORTED ConversionResult')
    }
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {

    console.error('[FAIL] e2e /api/proxy/convert contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
