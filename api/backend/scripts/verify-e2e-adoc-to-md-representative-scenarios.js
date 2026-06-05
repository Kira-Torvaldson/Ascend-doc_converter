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
  assert.ok(result.error && typeof result.error === 'object', 'error must be structured')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0, 'error.code must be non-empty')
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
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-e2e-repr-'))
  let allPassed = true

  try {
    allPassed = (await runScenario('success: nominal asciidoc input', async () => {
      const inputPath = path.join(workDir, `success-${randomUUID()}.adoc`)
      const outputPath = path.join(workDir, `success-${randomUUID()}.md`)
      fs.writeFileSync(inputPath, '= Title\n\nSome paragraph.\n', 'utf8')

      const result = await runConverter('downdoc', inputPath, outputPath, {
        conversionId: `success-${randomUUID()}`
      })

      assertSuccessContract(result)
      assert.ok(fs.existsSync(outputPath), 'output file should exist on success')
    })) && allPassed

    allPassed = (await runScenario('failure: empty input (EMPTY_INPUT)', async () => {
      const inputPath = path.join(workDir, `empty-${randomUUID()}.adoc`)
      const outputPath = path.join(workDir, `empty-${randomUUID()}.md`)
      fs.writeFileSync(inputPath, '', 'utf8')

      const result = await runConverter('downdoc', inputPath, outputPath, {
        conversionId: `empty-${randomUUID()}`
      })

      assertFailureContract(result, ['EMPTY_INPUT'])
    })) && allPassed

    allPassed = (await runScenario('failure: output path is directory (OUTPUT_NOT_CREATED|INTERNAL_ERROR)', async () => {
      const inputPath = path.join(workDir, `dirout-${randomUUID()}.adoc`)
      const outputDirAsPath = path.join(workDir, `as-output-${randomUUID()}`)
      fs.writeFileSync(inputPath, '= Title\n\nBody\n', 'utf8')
      fs.mkdirSync(outputDirAsPath, { recursive: true })

      const result = await runConverter('downdoc', inputPath, outputDirAsPath, {
        conversionId: `dirout-${randomUUID()}`
      })

      assertFailureContract(result, ['OUTPUT_NOT_CREATED', 'INTERNAL_ERROR'])
    })) && allPassed

    allPassed = (await runScenario('failure: coordination path validation (INVALID_INPUT)', async () => {
      const missingInputPath = path.join(workDir, `missing-${randomUUID()}.adoc`)
      const outputPath = path.join(workDir, `missing-${randomUUID()}.md`)

      const result = await runConverter('downdoc', missingInputPath, outputPath, {
        conversionId: `missing-${randomUUID()}`
      })

      assertFailureContract(result, ['INVALID_INPUT'])
    })) && allPassed
  } finally {
    try {
      fs.rmSync(workDir, { recursive: true, force: true })
    } catch (_) {
      // ignore cleanup error in verification script
    }
  }

  if (!allPassed) {
    process.exitCode = 1
    return
  }

  console.log('[OK] representative end-to-end backend scenarios validated for adoc->md')
}

main().catch((error) => {
  console.error('[FAIL] representative scenario verification failed')
  console.error(error && error.stack ? error.stack : String(error))
  process.exitCode = 1
})

