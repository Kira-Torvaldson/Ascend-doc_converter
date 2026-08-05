'use strict'


const { exitClean } = require('./lib/verify-exit.js')
/**
 * Unit + light integration checks for structured ConversionResult.error
 * propagation (classifyProxyFailure + execution-orchestrator passthrough).
 */

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { randomUUID } = require('crypto')
const {
  classifyProxyFailure,
  formatOrchestratorErrorMessage,
  legacyProxyErrorString,
} = require('../services/proxy/proxy-failure.js')
const { executeConversionSteps } = require('../services/modules/execution-orchestrator.js')
const { executeConversionRequest } = require('../services/modules/main-orchestrator.js')
const { makeOrchestratorFailure } = require('../services/modules/orchestrator-result.js')

async function assertExecutionPreservesStructuredError() {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-exec-fail-'))
  // Non-zero bytes so execution reaches the wrapper; whitespace-only fails in text2markdown.
  const blankPath = path.join(workDir, 'blank.txt')
  fs.writeFileSync(blankPath, '   \n\t\n', 'utf8')

  const result = await executeConversionSteps(
    blankPath,
    [{ from: 'txt', to: 'markdown', converter: 'text2markdown' }],
    { conversionId: `verify-exec-${randomUUID()}`, _internal: true }
  )

  assert.strictEqual(result.success, false)
  assert.ok(result.error && typeof result.error === 'object', 'execution must keep error object')
  assert.strictEqual(typeof result.error.code, 'string')
  assert.ok(result.error.code.length > 0)
  assert.strictEqual(
    classifyProxyFailure(result),
    result.error.code,
    'proxy classify must reuse structured code from execution'
  )
  assert.ok(
    typeof result.error.message === 'string' && result.error.message.length > 0,
    'structured error must expose a message for legacy body.error'
  )
  assert.strictEqual(
    result.pipelineState,
    'step_failed',
    'standardized step failure should set pipelineState'
  )
  console.log(`[OK] execution-orchestrator preserves structured error (${result.error.code})`)

  try {
    fs.rmSync(workDir, { recursive: true, force: true })
  } catch (_) {
    /* ignore */
  }
}

async function main() {
  assert.strictEqual(
    classifyProxyFailure({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'bad' },
    }),
    'INVALID_INPUT',
    'structured error.code must win over heuristics'
  )

  assert.strictEqual(
    classifyProxyFailure({
      success: false,
      error: 'No conversion path found from x to y',
    }),
    'FORMAT_UNSUPPORTED'
  )

  assert.strictEqual(
    classifyProxyFailure({
      success: false,
      pipelineState: 'empty_input',
      error: { code: 'SOMETHING_ELSE', message: 'ignored when empty_input' },
    }),
    'EMPTY_INPUT',
    'pipelineState empty_input stays authoritative'
  )

  // Regression: object errors must not stringify to [object Object]
  const structured = { code: 'ATTRIBUTE_UNRESOLVED', message: 'missing attr' }
  assert.strictEqual(
    formatOrchestratorErrorMessage(structured),
    'ATTRIBUTE_UNRESOLVED: missing attr'
  )

  assert.strictEqual(typeof legacyProxyErrorString(structured), 'string')
  assert.strictEqual(legacyProxyErrorString(structured), 'missing attr')
  assert.strictEqual(legacyProxyErrorString('plain fail'), 'plain fail')

  // Early orchestrator failures are now structured (no regex needed).
  const early = makeOrchestratorFailure({
    code: 'FORMAT_UNSUPPORTED',
    message: 'No conversion path found from x to y',
    logs: [],
    duration: 0.01,
  })
  assert.strictEqual(typeof early.error, 'object')
  assert.strictEqual(classifyProxyFailure(early), 'FORMAT_UNSUPPORTED')
  assert.strictEqual(
    classifyProxyFailure({
      success: false,
      pipelineState: 'no_output',
      error: { code: 'OUTPUT_NOT_CREATED', message: 'missing' },
    }),
    'OUTPUT_NOT_CREATED'
  )

  console.log('[OK] proxy failure classify preserves structured error.code')
  await assertExecutionPreservesStructuredError()

  const unsupported = await executeConversionRequest(
    'some content',
    'unknownformat',
    'markdown',
    { conversionId: `verify-main-${randomUUID()}` }
  )
  assert.strictEqual(unsupported.success, false)
  assert.ok(unsupported.error && typeof unsupported.error === 'object')
  assert.strictEqual(unsupported.error.code, 'FORMAT_UNSUPPORTED')
  assert.strictEqual(classifyProxyFailure(unsupported), 'FORMAT_UNSUPPORTED')
  console.log('[OK] main-orchestrator early failure returns structured FORMAT_UNSUPPORTED')
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {

    console.error('[FAIL] proxy failure classify verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    await exitClean(1)
  })
