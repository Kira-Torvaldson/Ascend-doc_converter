'use strict'

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { randomUUID } = require('crypto')

const { runConverter } = require('../services/modules/lazyload.module.js')

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
    'meta'
  ]
  for (const f of expectedRootFields) assertHas(result, f)
}

async function main() {
  const conversionId = `verify-failure-${randomUUID()}`
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-backend-flow-failure-'))
  const inputPath = path.join(workDir, 'input.adoc')
  const outputPath = path.join(workDir, 'output.md')

  // Empty input triggers standardized failure path in migrated converter.
  fs.writeFileSync(inputPath, '', 'utf8')

  const result = await runConverter('downdoc', inputPath, outputPath, { conversionId })

  assertConversionResultRoot(result)
  assert.strictEqual(result.success, false)
  assert.ok(result.error && typeof result.error === 'object', 'error must be a structured object')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0, 'error.code must be non-empty')
  assert.ok(Array.isArray(result.logs))
  assert.ok(Array.isArray(result.warnings))
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))

  try {
    fs.rmSync(workDir, { recursive: true, force: true })
  } catch (_) {
    // ignore
  }

  console.log('[OK] backend flow (lazyload.runConverter) preserves standardized failure ConversionResult for adoc->md')
}

main().catch((err) => {
  console.error('[FAIL] backend failure flow verification failed')
  console.error(err && err.stack ? err.stack : String(err))
  process.exitCode = 1
})

