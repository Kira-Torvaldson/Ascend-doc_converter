'use strict'


const { exitClean } = require('./lib/verify-exit.js')
/**
 * Verify Pandoc command path returns a native ConversionResult.
 * Usage: node scripts/verify-pandoc-result.js
 */

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { randomUUID } = require('crypto')
const {
  executeConversion,
  converterOrchestrator,
} = require('../services/modules/converter-orchestrator.module.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

async function main() {
  const conversionId = `verify-pandoc-${randomUUID()}`
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-pandoc-cr-'))
  const inputPath = path.join(workDir, 'input.md')
  const outputPath = path.join(workDir, 'output.adoc')
  fs.writeFileSync(inputPath, '# Title\n\nHello from markdown.\n', 'utf8')

  // markdown → asciidoc hits the Pandoc command converter (not html/text wrappers).
  const ok = await executeConversion(inputPath, outputPath, 'markdown', 'asciidoc', {
    conversionId,
    _internal: true,
  })
  assert.strictEqual(ok.success, true, `expected success: ${JSON.stringify(ok.error)}`)
  assert.strictEqual(ok.error, null)
  assert.strictEqual(ok.converter, 'pandoc')
  assert.ok(typeof ok.durationMs === 'number')
  for (const f of [
    'conversionId',
    'pipeline',
    'inputFormat',
    'outputFormat',
    'inputFile',
    'outputFile',
    'warnings',
    'logs',
    'meta',
  ]) {
    assertHas(ok, f)
  }
  assert.ok(fs.existsSync(outputPath), 'output file must exist')
  console.log('[OK] pandoc success returns native ConversionResult')

  // Whitelist miss via direct command path (registry may allow pair but whitelist rejects).
  const badOut = path.join(workDir, 'bad.yaml')
  const fail = await converterOrchestrator.executeCommandConverter(
    'pandoc',
    converterOrchestrator.converters.pandoc,
    inputPath,
    badOut,
    'asciidoc',
    'yaml',
    conversionId + '-fail',
    { _internal: true }
  )
  assert.strictEqual(fail.success, false)
  assert.ok(fail.error && typeof fail.error === 'object')
  assert.strictEqual(fail.error.code, 'FORMAT_UNSUPPORTED')
  assert.strictEqual(fail.converter, 'pandoc')
  assert.ok(typeof fail.durationMs === 'number')
  console.log('[OK] pandoc whitelist miss returns FORMAT_UNSUPPORTED ConversionResult')

  try {
    fs.rmSync(workDir, { recursive: true, force: true })
  } catch (_) { /* ignore */ }
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {

    console.error('[FAIL] pandoc ConversionResult verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
