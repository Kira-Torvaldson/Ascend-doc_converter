'use strict'

const assert = require('assert')
const app = require('../app.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

function assertConversionResultRoot(result) {
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

  assert.strictEqual(typeof result.success, 'boolean')
  assert.strictEqual(typeof result.conversionId, 'string')
  assert.strictEqual(typeof result.converter, 'string')
  assert.ok(Array.isArray(result.pipeline))
  assert.strictEqual(typeof result.inputFormat, 'string')
  assert.strictEqual(typeof result.outputFormat, 'string')
  assert.ok(result.inputFile && typeof result.inputFile === 'object')
  assert.strictEqual(typeof result.durationMs, 'number')
  assert.strictEqual(typeof result.startedAt, 'string')
  assert.strictEqual(typeof result.finishedAt, 'string')
  assert.ok(Array.isArray(result.warnings))
  assert.ok(Array.isArray(result.logs))
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))
}

function assertSuccessContract(result) {
  assertConversionResultRoot(result)
  assert.strictEqual(result.success, true)
  assert.strictEqual(result.error, null)
  assert.ok(result.outputFile && typeof result.outputFile === 'object')
}

function assertFailureContract(result, expectedCodes = []) {
  assertConversionResultRoot(result)
  assert.strictEqual(result.success, false)
  assert.ok(result.error && typeof result.error === 'object')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0)
  assert.ok(result.outputFile === null || typeof result.outputFile === 'object')
  if (expectedCodes.length > 0) {
    assert.ok(
      expectedCodes.includes(result.error.code),
      `Unexpected error.code '${result.error.code}', expected one of: ${expectedCodes.join(', ')}`
    )
  }
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
    const base = `http://127.0.0.1:${port}/api/to-asciidoc`

    allPassed =
      (await runScenario('success: heading + paragraph markdown', async () => {
        const response = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '# Title\n\nSome paragraph.' }),
        })
        assert.strictEqual(response.status, 200)
        const body = await response.json()
        assert.strictEqual(typeof body.asciidoc, 'string')
        assert.ok(body.asciidoc.length > 0)
        assert.ok(body.conversionResult && typeof body.conversionResult === 'object')
        assertSuccessContract(body.conversionResult)
      })) && allPassed

    allPassed =
      (await runScenario('success: list-style markdown input', async () => {
        const response = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '- Item A\n- Item B\n\nPlain line.' }),
        })
        assert.strictEqual(response.status, 200)
        const body = await response.json()
        assert.strictEqual(typeof body.asciidoc, 'string')
        assert.ok(body.asciidoc.length > 0)
        assert.ok(body.conversionResult && typeof body.conversionResult === 'object')
        assertSuccessContract(body.conversionResult)
      })) && allPassed

    allPassed =
      (await runScenario('failure: empty markdown input (EMPTY_INPUT)', async () => {
        const response = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '   ' }),
        })
        assert.strictEqual(response.status, 400)
        const body = await response.json()
        assertFailureContract(body, ['EMPTY_INPUT'])
        assert.strictEqual(typeof body.detail, 'string')
        assert.strictEqual(body.detail, body.error.message)
      })) && allPassed

    allPassed =
      (await runScenario('failure: zero-length markdown string (EMPTY_INPUT)', async () => {
        const response = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: '' }),
        })
        assert.strictEqual(response.status, 400)
        const body = await response.json()
        assertFailureContract(body, ['EMPTY_INPUT'])
        assert.strictEqual(typeof body.detail, 'string')
        assert.strictEqual(body.detail, body.error.message)
      })) && allPassed
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }

  if (!allPassed) {
    process.exitCode = 1
    setTimeout(() => process.exit(1), 500)
    return
  }
  console.log('[OK] representative e2e scenarios validated for /api/to-asciidoc')
  setTimeout(() => process.exit(0), 500)
}

main().catch((error) => {
  console.error('[FAIL] representative scenario verification failed for /api/to-asciidoc')
  console.error(error && error.stack ? error.stack : String(error))
  setTimeout(() => process.exit(1), 500)
})

