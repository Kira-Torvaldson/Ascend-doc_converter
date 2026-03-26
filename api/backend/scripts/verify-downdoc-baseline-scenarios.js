'use strict'

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { randomUUID } = require('crypto')

const downdocModule = require('../services/modules/adoc-to-md.converter.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

function assertRootShape(result) {
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
    'meta'
  ]
  for (const f of expectedRootFields) assertHas(result, f)

  assert.strictEqual(typeof result.conversionId, 'string')
  assert.strictEqual(typeof result.converter, 'string')
  assert.ok(Array.isArray(result.pipeline), 'pipeline must be an array')
  assert.ok(Array.isArray(result.warnings), 'warnings must be an array')
  assert.ok(Array.isArray(result.logs), 'logs must be an array')
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta), 'meta must be an object')
  assert.strictEqual(typeof result.durationMs, 'number')
  assert.ok(Number.isFinite(result.durationMs), 'durationMs must be finite')
}

function assertFailureErrorShape(result) {
  assert.ok(result.error && typeof result.error === 'object' && !Array.isArray(result.error), 'error must be an object on failure')
  for (const k of ['code', 'message', 'details', 'recoverable']) assertHas(result.error, k)
  assert.strictEqual(typeof result.error.code, 'string')
  assert.strictEqual(typeof result.error.message, 'string')
  assert.strictEqual(typeof result.error.recoverable, 'boolean')
}

async function runScenario(name, fn) {
  try {
    await fn()
    console.log(`[OK] ${name}`)
  } catch (err) {
    console.error(`[FAIL] ${name}`)
    console.error(err && err.stack ? err.stack : String(err))
    process.exitCode = 1
  }
}

async function main() {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-verify-'))

  const conversionIdBase = `verify-${randomUUID()}`

  await runScenario('nominal success (valid adoc -> md)', async () => {
    const conversionId = `${conversionIdBase}-success`
    const inputPath = path.join(workDir, 'ok.adoc')
    const outputPath = path.join(workDir, 'ok.md')

    const adoc = ['= Title', '', 'Paragraph', '', '== Section', '', '* A', '* B', ''].join('\n')
    fs.writeFileSync(inputPath, adoc, 'utf8')

    const result = await downdocModule.run(inputPath, outputPath, { conversionId })
    assertRootShape(result)
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.error, null)
    assert.ok(result.outputFile && typeof result.outputFile === 'object', 'outputFile must be present on success')
    assert.ok(fs.existsSync(outputPath), 'output file must exist on success')
    assert.ok(fs.readFileSync(outputPath, 'utf8').trim().length > 0, 'output must be non-empty on success')
  })

  await runScenario('failure: empty input file (EMPTY_INPUT)', async () => {
    const conversionId = `${conversionIdBase}-empty`
    const inputPath = path.join(workDir, 'empty.adoc')
    const outputPath = path.join(workDir, 'empty.md')
    fs.writeFileSync(inputPath, '', 'utf8')

    const result = await downdocModule.run(inputPath, outputPath, { conversionId })
    assertRootShape(result)
    assert.strictEqual(result.success, false)
    assertFailureErrorShape(result)
    assert.strictEqual(result.error.code, 'EMPTY_INPUT')
    assert.ok(result.outputFile === null || typeof result.outputFile === 'object')
  })

  await runScenario('failure: invalid extension (MIME_MISMATCH)', async () => {
    const conversionId = `${conversionIdBase}-ext`
    const inputPath = path.join(workDir, 'bad.txt')
    const outputPath = path.join(workDir, 'bad.md')
    fs.writeFileSync(inputPath, '= Title\n', 'utf8')

    const result = await downdocModule.run(inputPath, outputPath, { conversionId })
    assertRootShape(result)
    assert.strictEqual(result.success, false)
    assertFailureErrorShape(result)
    assert.strictEqual(result.error.code, 'MIME_MISMATCH')
  })

  await runScenario('failure: output path is a directory (OUTPUT_NOT_CREATED)', async () => {
    const conversionId = `${conversionIdBase}-outdir`
    const inputPath = path.join(workDir, 'outdir.adoc')
    const outputDir = path.join(workDir, 'as-dir.md')
    fs.writeFileSync(inputPath, '= Title\n\nText\n', 'utf8')

    // Create directory where a file is expected.
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

    const result = await downdocModule.run(inputPath, outputDir, { conversionId })
    assertRootShape(result)
    assert.strictEqual(result.success, false)
    assertFailureErrorShape(result)
    assert.strictEqual(result.error.code, 'OUTPUT_NOT_CREATED')
  })

  try {
    fs.rmSync(workDir, { recursive: true, force: true })
  } catch (_) {
    // Ignore cleanup failures in verification script.
  }
}

main().catch((err) => {
  console.error('[FAIL] baseline downdoc scenario verification crashed')
  console.error(err && err.stack ? err.stack : String(err))
  process.exitCode = 1
})

