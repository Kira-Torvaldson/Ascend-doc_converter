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

async function main() {
  const conversionId = `verify-${randomUUID()}`
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-verify-'))

  const inputPath = path.join(workDir, 'input.adoc')
  const outputPath = path.join(workDir, 'output.md')

  // Minimal AsciiDoc that should convert reliably.
  const adoc = [
    '= Title',
    '',
    'A short paragraph.',
    '',
    '== Section',
    '',
    '* Item 1',
    '* Item 2',
    ''
  ].join('\n')

  fs.writeFileSync(inputPath, adoc, 'utf8')

  const result = await downdocModule.run(inputPath, outputPath, { conversionId })

  // Functional success
  assert.strictEqual(result.success, true, 'Expected success === true')
  assert.strictEqual(result.error, null, 'Expected error === null')
  assert.ok(fs.existsSync(outputPath), 'Expected output file to exist')
  const out = fs.readFileSync(outputPath, 'utf8')
  assert.ok(out.trim().length > 0, 'Expected non-empty output')

  // Contract shape checks (root-level fields)
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

  // Minimal type expectations for the integrated success path
  assert.strictEqual(typeof result.conversionId, 'string')
  assert.strictEqual(typeof result.converter, 'string')
  assert.ok(Array.isArray(result.pipeline), 'pipeline must be an array')
  assert.strictEqual(typeof result.inputFormat, 'string')
  assert.strictEqual(typeof result.outputFormat, 'string')

  assert.strictEqual(typeof result.durationMs, 'number')
  assert.ok(Number.isFinite(result.durationMs), 'durationMs must be finite')

  assert.strictEqual(typeof result.startedAt, 'string')
  assert.strictEqual(typeof result.finishedAt, 'string')

  assert.ok(Array.isArray(result.warnings), 'warnings must be an array')
  assert.ok(Array.isArray(result.logs), 'logs must be an array')

  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta), 'meta must be an object')

  // Nested presence expectations
  assert.ok(result.outputFile && typeof result.outputFile === 'object', 'outputFile must be present on success')
  assert.ok(result.inputFile && typeof result.inputFile === 'object', 'inputFile must be present on success')

  // Clean up
  try {
    fs.rmSync(workDir, { recursive: true, force: true })
  } catch (_) {
    // Ignore cleanup failures in verification script.
  }

  console.log('[OK] downdoc success path returns standardized ConversionResult')
}

main().catch((err) => {
  console.error('[FAIL] downdoc success-path verification failed')
  console.error(err && err.stack ? err.stack : String(err))
  process.exitCode = 1
})

