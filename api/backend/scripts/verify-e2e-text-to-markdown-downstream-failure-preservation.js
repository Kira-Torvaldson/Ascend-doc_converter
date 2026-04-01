'use strict'

const assert = require('assert')

const convertModulePath = require.resolve('../services/conversion/convert.js')
const convertModule = require(convertModulePath)
const originalText2Markdown = convertModule.text2markdown

convertModule.text2markdown = async () => {
  return Promise.reject({
    conversionResult: {
      success: false,
      conversionId: 'downstream-failure-1',
      converter: 'text2markdown',
      pipeline: ['text->markdown'],
      inputFormat: 'txt',
      outputFormat: 'markdown',
      inputFile: {
        originalName: 'input.txt',
        storedPath: 'in-memory://request/body.txt',
        size: 3,
        mimeType: 'text/plain',
      },
      outputFile: null,
      durationMs: 1,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      warnings: [],
      logs: [],
      error: {
        code: 'CONVERSION_FAILED',
        message: 'Downstream standardized failure',
        details: { stage: 'converter-execution' },
        recoverable: false,
      },
      meta: { route: '/api/text-to-markdown', transport: 'in-memory' },
    },
  })
}

const app = require('../app.js')

async function main() {
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()

    const response = await fetch(`http://127.0.0.1:${port}/api/text-to-markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'abc' }),
    })

    assert.strictEqual(response.status, 500)
    const body = await response.json()
    assert.strictEqual(body.success, false)
    assert.strictEqual(body.conversionId, 'downstream-failure-1')
    assert.strictEqual(body.error.code, 'CONVERSION_FAILED')
    assert.strictEqual(body.error.message, 'Downstream standardized failure')
    assert.strictEqual(body.detail, body.error.message)

    console.log('[OK] e2e /api/text-to-markdown preserves downstream standardized failure ConversionResult')
  } finally {
    convertModule.text2markdown = originalText2Markdown
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => {
    setTimeout(() => process.exit(0), 500)
  })
  .catch((err) => {
    console.error('[FAIL] e2e text-to-markdown downstream-failure preservation verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    setTimeout(() => process.exit(1), 500)
  })
