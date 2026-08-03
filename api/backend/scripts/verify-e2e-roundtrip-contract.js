'use strict'

/**
 * Contract verification for POST /api/roundtrip.
 *
 * Verifies that the route exposes the standardized ConversionResult contract
 * via the `conversionResult` field, alongside the legacy shape
 * `{ success, state, logs, errors, markdownContent?, asciidocContent? }`.
 * Also covers the normalized Zod validation envelope (validate.middleware).
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

function assertConversionResultShape(cr) {
  assert.ok(cr && typeof cr === 'object', 'conversionResult must be an object')
  for (const f of ROOT_FIELDS) assertHas(cr, f)
  assert.strictEqual(cr.converter, 'pandoc')
  assert.deepStrictEqual(cr.pipeline, ['asciidoc->markdown', 'markdown->asciidoc'])
  assert.strictEqual(cr.inputFormat, 'asciidoc')
  assert.strictEqual(cr.outputFormat, 'asciidoc')
  assert.strictEqual(typeof cr.conversionId, 'string')
  assert.strictEqual(typeof cr.durationMs, 'number')
  assert.strictEqual(cr.meta.route, '/api/roundtrip')
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()
    const base = `http://127.0.0.1:${port}`

    // 1. Missing content (Zod) → 400 normalized validation envelope
    {
      const response = await fetch(`${base}/api/roundtrip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      assert.strictEqual(response.status, 400)
      const body = await response.json()
      assert.strictEqual(body.success, false)
      assert.ok(body.error && typeof body.error === 'object')
      assert.strictEqual(body.error.code, 'INVALID_INPUT')
      assert.strictEqual(body.error.category, 'VALIDATION_ERROR')
      assert.ok(typeof body.error.hint === 'string' && body.error.hint.length > 0)
      assert.ok(Array.isArray(body.error.details && body.error.details.issues))
      assert.strictEqual(typeof body.detail, 'string')
      console.log('[OK] /api/roundtrip missing content returns 400 normalized validation envelope')
    }

    // 2. Empty AsciiDoc content → input_invalid failure with ConversionResult
    {
      const response = await fetch(`${base}/api/roundtrip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '   ' }),
      })
      assert.strictEqual(response.status, 400)
      const body = await response.json()
      assert.strictEqual(body.success, false)
      assert.strictEqual(body.state, 'input_invalid')
      assert.ok(Array.isArray(body.errors) && body.errors.length > 0)
      const cr = body.conversionResult
      assertConversionResultShape(cr)
      assert.strictEqual(cr.success, false)
      assert.strictEqual(cr.error.code, 'INVALID_INPUT')
      assert.strictEqual(cr.error.category, 'VALIDATION_ERROR')
      assert.strictEqual(cr.meta.state, 'input_invalid')
      console.log('[OK] /api/roundtrip empty content returns input_invalid with failure ConversionResult')
    }

    // 3. Success roundtrip (runs only when the Pandoc binary is available,
    //    i.e. in CI / Docker; skipped on dev machines without it)
    {
      const pandocPath = envMap.get('PANDOC_PATH')
      if (!existsSync(pandocPath)) {
        console.log(`[SKIP] Pandoc binary not found at ${pandocPath}; skipping /api/roundtrip success scenario`)
      } else {
        const response = await fetch(`${base}/api/roundtrip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: '= Title\n\nSome paragraph.\n' }),
        })
        assert.strictEqual(response.status, 200)
        const body = await response.json()
        assert.strictEqual(body.success, true)
        assert.strictEqual(body.state, 'success')
        assert.strictEqual(typeof body.markdownContent, 'string')
        assert.strictEqual(typeof body.asciidocContent, 'string')
        const cr = body.conversionResult
        assertConversionResultShape(cr)
        assert.strictEqual(cr.success, true)
        assert.strictEqual(cr.error, null)
        assert.ok(cr.outputFile && typeof cr.outputFile === 'object')
        assert.strictEqual(typeof cr.meta.roundTripMatch, 'boolean')
        console.log('[OK] /api/roundtrip success returns legacy shape plus standardized ConversionResult')
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => {
    setTimeout(() => process.exit(0), 500)
  })
  .catch((err) => {
    console.error('[FAIL] e2e /api/roundtrip contract verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    setTimeout(() => process.exit(1), 500)
  })
