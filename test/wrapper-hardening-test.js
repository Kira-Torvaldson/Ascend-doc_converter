/* eslint-env mocha */
'use strict'

const { expect } = require('./harness')
const { safeSpawn } = require('../lib/security/safe-spawn.js')
const { isSecurityError, SECURITY_ERROR_CODES } = require('../lib/errors/security-errors.js')
const { convertWithPandoc } = require('../api/backend/services/conversion/convert.js')

describe('wrapper hardening', () => {
  it('safeSpawn rejects shell mode', async () => {
    let received
    try {
      await safeSpawn(process.execPath, ['-e', 'console.log("ok")'], { shell: true })
    } catch (error) {
      received = error
    }
    expect(received).to.be.ok
    expect(String(received.message)).to.include('forbids shell mode')
  })

  it('safeSpawn normalizes timeout as CONVERSION_TIMEOUT', async () => {
    let received
    try {
      await safeSpawn(process.execPath, ['-e', 'setTimeout(() => {}, 2000)'], { timeoutMs: 50 })
    } catch (error) {
      received = error
    }
    expect(received).to.be.ok
    expect(isSecurityError(received)).to.equal(true)
    expect(received.code).to.equal(SECURITY_ERROR_CODES.CONVERSION_TIMEOUT)
  })

  it('convertWithPandoc rejects injected format string', async () => {
    let received
    try {
      await convertWithPandoc('hello', 'markdown --lua-filter=evil.lua', 'html')
    } catch (error) {
      received = error
    }
    expect(received).to.be.ok
    expect(String(received.message)).to.include('Unsupported source format')
  })

  it('safeSpawn executes legitimate command with args array', async () => {
    const result = await safeSpawn(process.execPath, ['-e', 'process.stdout.write("ok")'], { timeoutMs: 1000 })
    expect(result.code).to.equal(0)
    expect(result.stdout).to.equal('ok')
  })
})
