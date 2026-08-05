'use strict'


const { exitClean } = require('./lib/verify-exit.js')
/**
 * Contract verification for POST /api/from-markdown (MD → HTML / TXT).
 */

const assert = require('assert')
const app = require('../app.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

function assertConversionResultRoot(result) {
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
  assert.strictEqual(typeof result.conversionId, 'string')
  assert.strictEqual(result.converter, 'pandoc')
  assert.strictEqual(result.inputFormat, 'markdown')
  assert.ok(Array.isArray(result.pipeline))
  assert.ok(result.meta && typeof result.meta === 'object')
}

async function runScenario(name, fn) {
  try {
    await fn()
    console.log(`[OK] ${name}`)
    return true
  } catch (error) {
    console.error(`[FAIL] ${name}`)
    console.error(error && error.stack ? error.stack : String(error))
    return false
  }
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  let allPassed = true
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()
    const base = `http://127.0.0.1:${port}/api/from-markdown`
    const sample = '# Title\n\nHello **world**.\n'

    allPassed =
      (await runScenario('success: markdown to html', async () => {
        const response = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sample, to: 'html' }),
        })
        assert.strictEqual(response.status, 200)
        const body = await response.json()
        assert.ok(typeof body.html === 'string' && body.html.includes('<'))
        assertConversionResultRoot(body.conversionResult)
        assert.strictEqual(body.conversionResult.success, true)
        assert.strictEqual(body.conversionResult.outputFormat, 'html')
        assert.strictEqual(body.conversionResult.error, null)
      })) && allPassed

    allPassed =
      (await runScenario('success: markdown to txt', async () => {
        const response = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sample, to: 'txt' }),
        })
        assert.strictEqual(response.status, 200)
        const body = await response.json()
        assert.ok(typeof body.txt === 'string' && /hello/i.test(body.txt))
        assertConversionResultRoot(body.conversionResult)
        assert.strictEqual(body.conversionResult.success, true)
        assert.strictEqual(body.conversionResult.outputFormat, 'txt')
      })) && allPassed

    allPassed =
      (await runScenario('failure: empty markdown (EMPTY_INPUT)', async () => {
        const response = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '   ', to: 'html' }),
        })
        assert.strictEqual(response.status, 400)
        const body = await response.json()
        assert.strictEqual(body.success, false)
        assert.strictEqual(body.error.code, 'EMPTY_INPUT')
        assert.strictEqual(typeof body.detail, 'string')
      })) && allPassed

    allPassed =
      (await runScenario('failure: unsupported target (FORMAT_UNSUPPORTED)', async () => {
        const response = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sample, to: 'pdf' }),
        })
        assert.strictEqual(response.status, 400)
        const body = await response.json()
        assert.strictEqual(body.success, false)
        assert.strictEqual(body.error.code, 'FORMAT_UNSUPPORTED')
      })) && allPassed

    if (!allPassed) throw new Error('One or more from-markdown scenarios failed')
    console.log('[OK] representative e2e scenarios validated for /api/from-markdown')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {

    console.error('[FAIL] representative scenario verification failed for /api/from-markdown')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
