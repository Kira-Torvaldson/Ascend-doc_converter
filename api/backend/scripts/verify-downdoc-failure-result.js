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

  // Failure scenario: empty input file.
  fs.writeFileSync(inputPath, '', 'utf8')

  const result = await downdocModule.run(inputPath, outputPath, { conversionId })

  // Expected failure
  assert.strictEqual(result.success, false, 'Expected success === false')
  assert.ok(result.error, 'Expected error to be present')
  assert.strictEqual(typeof result.error, 'object', 'Expected error to be an object')

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

  // Failure-path expectations
  assert.strictEqual(typeof result.conversionId, 'string')
  assert.strictEqual(typeof result.converter, 'string')
  assert.ok(Array.isArray(result.pipeline), 'pipeline must be an array')
  assert.ok(Array.isArray(result.warnings), 'warnings must be an array')
  assert.ok(Array.isArray(result.logs), 'logs must be an array')
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta), 'meta must be an object')

  // error object structure
  for (const k of ['code', 'message', 'details', 'recoverable']) assertHas(result.error, k)
  assert.strictEqual(typeof result.error.code, 'string')
  assert.strictEqual(typeof result.error.message, 'string')
  assert.strictEqual(typeof result.error.recoverable, 'boolean')

  // Error code should be one of documented standardized codes used by this integration.
  const allowedCodes = new Set([
    'INVALID_INPUT',
    'EMPTY_INPUT',
    'FILE_TOO_LARGE',
    'MIME_MISMATCH',
    'CONVERSION_FAILED',
    'EMPTY_OUTPUT',
    'OUTPUT_NOT_CREATED',
    'PIPELINE_FAILED',
    'INTERNAL_ERROR',
    'UNSUPPORTED_FORMAT',
    'CONVERTER_NOT_FOUND'
  ])
  assert.ok(allowedCodes.has(result.error.code), `Unexpected error.code: ${result.error.code}`)

  // outputFile expectation: should be null when no artifact exists
  assert.ok(result.outputFile === null || typeof result.outputFile === 'object', 'outputFile must be null or an object')
  if (result.outputFile !== null) {
    for (const k of ['path', 'size', 'mimeType']) assertHas(result.outputFile, k)
  }

  // inputFile should be structured
  assert.ok(result.inputFile && typeof result.inputFile === 'object', 'inputFile must be an object')
  for (const k of ['originalName', 'storedPath', 'size', 'mimeType']) assertHas(result.inputFile, k)

  // Clean up
  try {
    fs.rmSync(workDir, { recursive: true, force: true })
  } catch (_) {
    // Ignore cleanup failures in verification script.
  }

  console.log('[OK] downdoc failure path returns standardized ConversionResult')
}

main().catch((err) => {
  console.error('[FAIL] downdoc failure-path verification failed')
  console.error(err && err.stack ? err.stack : String(err))
  process.exitCode = 1
})

