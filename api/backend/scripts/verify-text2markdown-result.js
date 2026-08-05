'use strict'

/**
 * Verify text2markdown module returns a native ConversionResult.
 * Usage: node scripts/verify-text2markdown-result.js
 */

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { randomUUID } = require('crypto')
const text2markdown = require('../services/modules/text2markdown.module.js')
const { runConverter } = require('../services/modules/lazyload.module.js')
const { executeConversion } = require('../services/modules/converter-orchestrator.module.js')

function assertHas(obj, key) {
  assert.ok(Object.prototype.hasOwnProperty.call(obj, key), `Missing field: ${key}`)
}

async function main() {
  const conversionId = `verify-t2m-${randomUUID()}`
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-t2m-'))
  const inputPath = path.join(workDir, 'input.txt')
  const outputPath = path.join(workDir, 'output.md')
  fs.writeFileSync(inputPath, 'Hello world\n\nSecond paragraph.\n', 'utf8')

  const direct = await text2markdown.run(inputPath, outputPath, { conversionId })
  assert.strictEqual(direct.success, true)
  assert.strictEqual(direct.error, null)
  assert.strictEqual(direct.converter, 'text2markdown')
  assert.ok(typeof direct.durationMs === 'number')
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
    assertHas(direct, f)
  }

  const viaLazy = await runConverter('text2markdown', inputPath, outputPath + '.lazy.md', {
    conversionId: conversionId + '-lazy',
    fromFormat: 'txt',
    toFormat: 'markdown',
  })
  assert.strictEqual(viaLazy.success, true)
  assert.strictEqual(viaLazy.error, null)
  assert.ok(typeof viaLazy.durationMs === 'number', 'lazyload preserves durationMs')
  assert.strictEqual(viaLazy.converter, 'text2markdown')

  // Empty input → EMPTY_INPUT structured code
  const emptyPath = path.join(workDir, 'empty.txt')
  fs.writeFileSync(emptyPath, '', 'utf8')
  const empty = await text2markdown.run(emptyPath, path.join(workDir, 'empty-out.md'), {
    conversionId: conversionId + '-empty',
  })
  assert.strictEqual(empty.success, false)
  assert.ok(empty.error && typeof empty.error === 'object')
  assert.strictEqual(empty.error.code, 'EMPTY_INPUT')

  // Orchestrator preserves ConversionResult on downdoc path (asciidoc→markdown)
  const adocIn = path.join(workDir, 'sample.adoc')
  const adocOut = path.join(workDir, 'sample.md')
  fs.writeFileSync(adocIn, '= Title\n\nHello.\n', 'utf8')
  const orch = await executeConversion(adocIn, adocOut, 'asciidoc', 'markdown', {
    conversionId: conversionId + '-orch',
    _internal: true,
  })
  assert.strictEqual(orch.success, true, `orch success: ${JSON.stringify(orch.error)}`)
  assert.strictEqual(orch.error, null)
  assert.ok(typeof orch.durationMs === 'number', 'orchestrator preserves durationMs')
  assert.ok(orch.converter === 'downdoc' || orch.converter === 'pandoc', 'known converter')

  console.log('OK text2markdown ConversionResult (+ lazyload + orchestrator preserve)')
}

main().catch((err) => {
  console.error('[FAIL]', err && err.stack ? err.stack : err)
  process.exit(1)
})
