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
  const conversionId = `verify-internal-${randomUUID()}`
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-backend-flow-internal-'))
  const missingInputPath = path.join(workDir, 'missing-input.adoc')
  const outputPath = path.join(workDir, 'output.md')

  // Triggers lazyload path validation failure (coordination-layer/internal path).
  const result = await runConverter('downdoc', missingInputPath, outputPath, { conversionId })

  assertConversionResultRoot(result)
  assert.strictEqual(result.success, false)
  assert.ok(result.error && typeof result.error === 'object', 'error must be structured')
  assert.strictEqual(result.error.code, 'INVALID_INPUT')
  assert.ok(Array.isArray(result.logs))
  assert.ok(Array.isArray(result.warnings))
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))
  assert.strictEqual(result.converter, 'downdoc')

  try {
    fs.rmSync(workDir, { recursive: true, force: true })
  } catch (_) {
    // ignore cleanup issue
  }

  console.log('[OK] backend flow (lazyload.runConverter) converts internal coordination failure into standardized ConversionResult')
}

main().catch((err) => {
  console.error('[FAIL] backend internal-failure flow verification failed')
  console.error(err && err.stack ? err.stack : String(err))
  process.exitCode = 1
})

