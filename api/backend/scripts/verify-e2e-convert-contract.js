'use strict'


const { exitClean } = require('./lib/verify-exit.js')
/**
 * Contract verification for POST /api/convert (secure token-gated conversion).
 *
 * Verifies that the route exposes the standardized ConversionResult contract:
 * - success: legacy fields (success, result, format) + conversionResult
 * - failure: ConversionResult spread at root + detail (same convention as
 *   the previously migrated conversion routes)
 */

const assert = require('assert')
const { existsSync } = require('fs')
const app = require('../app.js')
const { envMap } = require('../services/config/envmap.module.js')

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

function assertFailureShape(body, expectedCode) {
  for (const f of ROOT_FIELDS) assertHas(body, f)
  assertHas(body, 'detail')
  assert.strictEqual(body.success, false)
  assert.ok(body.error && typeof body.error === 'object')
  assert.strictEqual(body.error.code, expectedCode)
  assert.strictEqual(typeof body.error.message, 'string')
  assert.strictEqual(typeof body.error.category, 'string')
  assert.ok(Object.prototype.hasOwnProperty.call(body.error, 'hint'))
  assert.strictEqual(typeof body.conversionId, 'string')
  assert.strictEqual(body.detail, body.error.message)
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()
    const base = `http://127.0.0.1:${port}`

    // 1. Invalid confirmation token → 401 structured failure
    {
      const response = await fetch(`${base}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '= Title\n\nBody.',
          fromFormat: 'asciidoc',
          toFormat: 'markdown',
          token: 'invalid-token',
        }),
      })
      assert.strictEqual(response.status, 401)
      const body = await response.json()
      assertFailureShape(body, 'CONFIRMATION_TOKEN_INVALID')
      assert.strictEqual(body.error.category, 'VALIDATION_ERROR')
      assert.ok(typeof body.error.hint === 'string' && body.error.hint.length > 0)
      console.log('[OK] /api/convert invalid token returns 401 structured ConversionResult')
    }

    // 2. Empty content → 400 EMPTY_INPUT
    {
      const response = await fetch(`${base}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '   ',
          fromFormat: 'asciidoc',
          toFormat: 'markdown',
          token: 'whatever',
        }),
      })
      assert.strictEqual(response.status, 400)
      const body = await response.json()
      assertFailureShape(body, 'EMPTY_INPUT')
      console.log('[OK] /api/convert empty content returns 400 EMPTY_INPUT ConversionResult')
    }

    // 3. Success flow: request token then convert asciidoc → markdown (downdoc, no Pandoc needed)
    {
      const tokenResponse = await fetch(`${base}/api/confirmation/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromFormat: 'asciidoc', toFormat: 'markdown' }),
      })
      assert.strictEqual(tokenResponse.status, 200)
      const tokenBody = await tokenResponse.json()
      assert.strictEqual(tokenBody.success, true)
      assert.strictEqual(typeof tokenBody.token, 'string')

      const response = await fetch(`${base}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '= Title\n\nSome paragraph.',
          fromFormat: 'asciidoc',
          toFormat: 'markdown',
          token: tokenBody.token,
        }),
      })
      assert.strictEqual(response.status, 200)
      const body = await response.json()
      assert.strictEqual(body.success, true)
      assert.strictEqual(typeof body.result, 'string')
      assert.ok(body.result.length > 0)
      assert.strictEqual(body.format, 'markdown')
      assert.ok(body.conversionResult && typeof body.conversionResult === 'object')
      const cr = body.conversionResult
      for (const f of ROOT_FIELDS) assertHas(cr, f)
      assert.strictEqual(cr.success, true)
      assert.strictEqual(cr.error, null)
      assert.strictEqual(cr.converter, 'downdoc')
      assert.strictEqual(cr.inputFormat, 'asciidoc')
      assert.strictEqual(cr.outputFormat, 'markdown')
      assert.strictEqual(typeof cr.conversionId, 'string')
      assert.strictEqual(typeof cr.durationMs, 'number')
      console.log('[OK] /api/convert success returns legacy fields plus standardized ConversionResult')
    }

    // 4. Pandoc branch: markdown → html (runs only when the Pandoc binary is
    //    available, i.e. in CI / Docker; skipped on dev machines without it)
    {
      const pandocPath = envMap.get('PANDOC_PATH')
      if (!existsSync(pandocPath)) {
        console.log(`[SKIP] Pandoc binary not found at ${pandocPath}; skipping /api/convert Pandoc scenario`)
      } else {
        const tokenResponse = await fetch(`${base}/api/confirmation/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromFormat: 'markdown', toFormat: 'html' }),
        })
        assert.strictEqual(tokenResponse.status, 200)
        const tokenBody = await tokenResponse.json()
        assert.strictEqual(tokenBody.success, true)

        const response = await fetch(`${base}/api/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '# Title\n\nSome **bold** paragraph.',
            fromFormat: 'markdown',
            toFormat: 'html',
            token: tokenBody.token,
          }),
        })
        assert.strictEqual(response.status, 200)
        const body = await response.json()
        assert.strictEqual(body.success, true)
        assert.strictEqual(typeof body.result, 'string')
        assert.ok(body.result.includes('<strong>'), 'Expected HTML output from Pandoc')
        assert.strictEqual(body.format, 'html')
        assert.ok(body.conversionResult && typeof body.conversionResult === 'object')
        const cr = body.conversionResult
        for (const f of ROOT_FIELDS) assertHas(cr, f)
        assert.strictEqual(cr.success, true)
        assert.strictEqual(cr.error, null)
        assert.strictEqual(cr.converter, 'pandoc')
        assert.strictEqual(cr.inputFormat, 'markdown')
        assert.strictEqual(cr.outputFormat, 'html')
        console.log('[OK] /api/convert Pandoc branch (markdown → html) returns standardized ConversionResult')
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {

    console.error('[FAIL] e2e /api/convert contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
