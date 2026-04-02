'use strict'

const assert = require('assert')
const app = require('../app.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

function assertFailureContract(result, expectedCodes) {
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
  assert.ok(result.error && typeof result.error === 'object')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0)
  assert.ok(Array.isArray(result.warnings))
  assert.ok(Array.isArray(result.logs))
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))
  assert.ok(result.outputFile === null || typeof result.outputFile === 'object')

  if (expectedCodes && expectedCodes.length > 0) {
    assert.ok(
      expectedCodes.includes(result.error.code),
      `Unexpected error.code: ${result.error.code} (expected one of: ${expectedCodes.join(', ')})`
    )
  }
}

function assertSuccessContract(result) {
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
  assert.ok(Array.isArray(result.warnings))
  assert.ok(Array.isArray(result.logs))
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))
  assert.ok(result.outputFile && typeof result.outputFile === 'object')
}

async function runScenario(name, fn) {
  try {
    await fn()
    console.log(`[OK] ${name}`)
    return true
  } catch (err) {
    console.error(`[FAIL] ${name}`)
    console.error(err && err.stack ? err.stack : String(err))
    return false
  }
}

async function main() {
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()
    const base = `http://127.0.0.1:${port}/api/to-markdown`

    let allPassed = true

    allPassed =
      (await runScenario('success: nominal AsciiDoc -> Markdown', async () => {
        const res = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '= Title\n\nSome paragraph.\n' }),
        })
        assert.strictEqual(res.status, 200)
        const body = await res.json()
        assert.strictEqual(typeof body.markdown, 'string')
        assert.ok(body.markdown.length > 0)
        assertHas(body, 'conversionResult')
        assertSuccessContract(body.conversionResult)
      })) && allPassed

    allPassed =
      (await runScenario('failure: empty input (EMPTY_INPUT)', async () => {
        const res = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '' }),
        })
        assert.strictEqual(res.status, 400)
        const body = await res.json()
        assertFailureContract(body, ['EMPTY_INPUT'])
        assert.strictEqual(typeof body.detail, 'string')
        assert.strictEqual(body.detail, body.error.message)
      })) && allPassed

    allPassed =
      (await runScenario('failure: standardized converter/internal failure (:experimental:)', async () => {
        const res = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: ':experimental:' }),
        })
        assert.strictEqual(res.status, 500)
        const body = await res.json()
        assertFailureContract(body, ['INVALID_INPUT', 'EMPTY_INPUT', 'CONVERSION_FAILED', 'INTERNAL_ERROR'])
        assert.strictEqual(typeof body.detail, 'string')
        assert.strictEqual(body.detail, body.error.message)
      })) && allPassed

    if (!allPassed) {
      throw new Error('One or more scenarios failed')
    }

    console.log('[OK] e2e /api/to-markdown representative scenarios passed')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => {
    setTimeout(() => process.exit(0), 50)
  })
  .catch((err) => {
    console.error('[FAIL] e2e to-markdown representative scenarios failed')
    console.error(err && err.stack ? err.stack : String(err))
    setTimeout(() => process.exit(1), 50)
  })

