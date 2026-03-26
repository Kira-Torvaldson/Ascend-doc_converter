/* eslint-env mocha */
'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const { expect } = require('./harness')
const { executeConversion } = require('../api/backend/services/modules/converter-orchestrator.module.js')
const { envMap } = require('../api/backend/services/config/envmap.module.js')

function listJsFiles(dirPath) {
  const out = []
  const stack = [dirPath]
  while (stack.length > 0) {
    const current = stack.pop()
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
      } else if (entry.isFile() && fullPath.endsWith('.js')) {
        out.push(fullPath)
      }
    }
  }
  return out
}

describe('conversion audit log sanitization', () => {
  it('does not log raw input content and keeps safe fields', async () => {
    const logsDir = envMap.get('LOGS_DIR')
    const auditPath = path.join(logsDir, 'conversion-audit.log')
    const marker = 'TOP_SECRET_USER_CONTENT_123456789'
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-audit-'))
    const inputPath = path.join(root, 'input.adoc')
    const outputPath = path.join(root, 'output.bin')
    fs.writeFileSync(inputPath, `= Title\n\n${marker}\n`, 'utf8')
    if (fs.existsSync(auditPath)) fs.unlinkSync(auditPath)

    try {
      await executeConversion(inputPath, outputPath, 'asciidoc', 'foobar', {
        conversionId: 'audit-log-test',
        allowedPrefix: root
      })
      const logRaw = fs.readFileSync(auditPath, 'utf8')
      expect(logRaw).to.not.include(marker)
      const lines = logRaw.trim().split('\n')
      const last = JSON.parse(lines[lines.length - 1])
      expect(last.conversionId).to.equal('audit-log-test')
      expect(last.fromFormat).to.equal('asciidoc')
      expect(last.toFormat).to.equal('foobar')
      expect(last).to.have.property('inputHash')
      expect(last).to.have.property('inputSize')
      expect(last).to.have.property('success')
      expect(last).to.have.property('errorCode')
      expect(last).to.have.property('startTimestamp')
      expect(last).to.have.property('endTimestamp')
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  it('scoped wrappers/converters do not use direct process.env', () => {
    const scopedDirs = [
      path.resolve(__dirname, '../api/backend/services/conversion'),
      path.resolve(__dirname, '../api/backend/services/modules')
    ]
    for (const dirPath of scopedDirs) {
      const files = listJsFiles(dirPath)
      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf8')
        expect(content, filePath).to.not.include('process.env')
      }
    }
  })

  it('env config exposes conversion/log hardening keys', () => {
    expect(envMap.get('MAX_INPUT_SIZE_MB')).to.be.a('number')
    expect(envMap.get('CONVERSION_TIMEOUT_MS')).to.be.a('number')
    expect(envMap.get('LOG_MAX_SIZE_MB')).to.be.a('number')
    expect(envMap.get('LOG_ROTATE_COUNT')).to.be.a('number')
  })
})
