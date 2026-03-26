/* eslint-env mocha */
'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { expect } = require('./harness')
const { assertSafeExistingPath } = require('../lib/security/path-guard.js')
const { SECURITY_ERROR_CODES } = require('../lib/errors/security-errors.js')
const { executeConversion } = require('../api/backend/services/modules/converter-orchestrator.module.js')

describe('security foundations (v0.0.1.5 step 1)', () => {
  describe('SEC-01 traversal => PATH_TRAVERSAL', () => {
    it('rejects an existing path outside allowed prefix', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-sec-'))
      const allowedPrefix = path.join(root, 'allowed')
      const outsideDir = path.join(root, 'outside')
      fs.mkdirSync(allowedPrefix, { recursive: true })
      fs.mkdirSync(outsideDir, { recursive: true })
      const outsideFile = path.join(outsideDir, 'input.adoc')
      fs.writeFileSync(outsideFile, '= Title\n', 'utf8')

      let received
      try {
        assertSafeExistingPath(outsideFile, allowedPrefix)
      } catch (error) {
        received = error
      } finally {
        fs.rmSync(root, { recursive: true, force: true })
      }

      expect(received).to.be.ok
      expect(received.code).to.equal(SECURITY_ERROR_CODES.PATH_TRAVERSAL)
    })
  })

  describe('SEC-02 symlink => SYMLINK_REJECTED', () => {
    it('rejects a symlink input path', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-sec-'))
      const targetDir = path.join(root, 'target')
      const linkDir = path.join(root, 'link-dir')
      fs.mkdirSync(targetDir, { recursive: true })
      fs.symlinkSync(targetDir, linkDir, 'junction')

      let received
      try {
        assertSafeExistingPath(linkDir, root)
      } catch (error) {
        received = error
      } finally {
        fs.rmSync(root, { recursive: true, force: true })
      }

      expect(received).to.be.ok
      expect(received.code).to.equal(SECURITY_ERROR_CODES.SYMLINK_REJECTED)
    })
  })

  describe('SEC-09 unsupported format => FORMAT_UNSUPPORTED', () => {
    it('fails fast with typed error code when no converter exists', async () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-sec-'))
      const inputPath = path.join(root, 'input.adoc')
      const outputPath = path.join(root, 'output.bin')
      fs.writeFileSync(inputPath, '= Title\n\nBody\n', 'utf8')

      try {
        const result = await executeConversion(inputPath, outputPath, 'asciidoc', 'foobar', {
          conversionId: 'sec-09-test',
          allowedPrefix: root
        })
        expect(result.success).to.equal(false)
        expect(result.errorCode).to.equal(SECURITY_ERROR_CODES.FORMAT_UNSUPPORTED)
      } finally {
        fs.rmSync(root, { recursive: true, force: true })
      }
    })
  })
})
