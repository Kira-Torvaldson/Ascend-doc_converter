/* eslint-env mocha */
'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { expect } = require('./harness')
const { executeConversion } = require('../api/backend/services/modules/converter-orchestrator.module.js')
const { SECURITY_ERROR_CODES } = require('../lib/errors/security-errors.js')

describe('validation pipeline v1', () => {
  it('rejects oversized payload/file with PAYLOAD_TOO_LARGE', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-vp1-'))
    const inputPath = path.join(root, 'input.adoc')
    const outputPath = path.join(root, 'output.md')
    fs.writeFileSync(inputPath, '= Title\n\nPayload\n', 'utf8')

    try {
      const result = await executeConversion(inputPath, outputPath, 'asciidoc', 'markdown', {
        conversionId: 'vp1-size',
        allowedPrefix: root,
        maxInputSizeBytes: 8
      })
      expect(result.success).to.equal(false)
      expect(result.errorCode).to.equal(SECURITY_ERROR_CODES.PAYLOAD_TOO_LARGE)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects invalid text encoding with ENCODING_INVALID', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-vp1-'))
    const inputPath = path.join(root, 'input.md')
    const outputPath = path.join(root, 'output.adoc')
    fs.writeFileSync(inputPath, Buffer.from([0xc3, 0x28])) // Invalid UTF-8 sequence

    try {
      const result = await executeConversion(inputPath, outputPath, 'markdown', 'asciidoc', {
        conversionId: 'vp1-encoding',
        allowedPrefix: root
      })
      expect(result.success).to.equal(false)
      expect(result.errorCode).to.equal(SECURITY_ERROR_CODES.ENCODING_INVALID)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects unsupported pair with FORMAT_UNSUPPORTED', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-vp1-'))
    const inputPath = path.join(root, 'input.adoc')
    const outputPath = path.join(root, 'output.bin')
    fs.writeFileSync(inputPath, '= Title\n\nBody\n', 'utf8')

    try {
      const result = await executeConversion(inputPath, outputPath, 'asciidoc', 'foobar', {
        conversionId: 'vp1-format',
        allowedPrefix: root
      })
      expect(result.success).to.equal(false)
      expect(result.errorCode).to.equal(SECURITY_ERROR_CODES.FORMAT_UNSUPPORTED)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects output path traversal with PATH_TRAVERSAL', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-vp1-'))
    const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-vp1-out-'))
    const inputPath = path.join(root, 'input.adoc')
    const outputPath = path.join(outsideRoot, 'output.md')
    fs.writeFileSync(inputPath, '= Title\n\nBody\n', 'utf8')

    try {
      const result = await executeConversion(inputPath, outputPath, 'asciidoc', 'markdown', {
        conversionId: 'vp1-traversal',
        allowedPrefix: root
      })
      expect(result.success).to.equal(false)
      expect(result.errorCode).to.equal(SECURITY_ERROR_CODES.PATH_TRAVERSAL)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
      fs.rmSync(outsideRoot, { recursive: true, force: true })
    }
  })
})
