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

  assert.strictEqual(typeof result.conversionId, 'string')
  assert.ok(Array.isArray(result.pipeline))
  assert.ok(Array.isArray(result.warnings))
  assert.ok(Array.isArray(result.logs))
  assert.ok(result.meta && typeof result.meta === 'object' && !Array.isArray(result.meta))
}

async function main() {
  const conversionId = `verify-${randomUUID()}`
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-backend-flow-'))
  const inputPath = path.join(workDir, 'input.adoc')
  const outputPath = path.join(workDir, 'output.md')

  fs.writeFileSync(inputPath, ['= Title', '', 'Text', ''].join('\n'), 'utf8')

  const result = await runConverter('downdoc', inputPath, outputPath, { conversionId })

  // Verify standardized ConversionResult is preserved through lazyload runConverter
  assertConversionResultRoot(result)
  assert.strictEqual(result.success, true)
  assert.strictEqual(result.error, null)
  assert.ok(result.outputFile && typeof result.outputFile === 'object')
  assert.ok(fs.existsSync(outputPath))

  try {
    fs.rmSync(workDir, { recursive: true, force: true })
  } catch (_) {
    // ignore
  }

  console.log('[OK] backend flow (lazyload.runConverter) preserves standardized ConversionResult for adoc->md')
}

main().catch((err) => {
  console.error('[FAIL] backend flow verification failed')
  console.error(err && err.stack ? err.stack : String(err))
  process.exitCode = 1
})

