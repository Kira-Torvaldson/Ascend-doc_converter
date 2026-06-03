/* eslint-env mocha */
'use strict'

/**
 * ASC-009 — API abuse / robustness tests (conversion routes)
 */

const { expect } = require('./harness')
const app = require('../api/backend/app.js')
const { getMaxInputSizeBytes } = require('../api/backend/services/config/conversion-limits.js')

describe('API abuse (conversion endpoints)', () => {
  /** @type {import('http').Server} */
  let server
  let baseUrl = ''

  before(function (done) {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      baseUrl = `http://127.0.0.1:${port}`
      done()
    })
  })

  after(function (done) {
    if (server) server.close(done)
    else done()
  })

  async function postJson(path, body, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    return fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      signal: options.signal,
    })
  }

  it('rejects empty AsciiDoc input with EMPTY_INPUT and error envelope', async () => {
    const res = await postJson('/api/to-markdown', { text: '' })
    expect(res.status).to.equal(400)
    const body = await res.json()
    expect(body.success).to.equal(false)
    expect(body.error.code).to.equal('EMPTY_INPUT')
    expect(body.error.category).to.equal('VALIDATION_ERROR')
    expect(body.error.hint).to.be.a('string').that.is.not.empty()
  })

  it('rejects oversized payload with PAYLOAD_TOO_LARGE', async () => {
    const maxBytes = getMaxInputSizeBytes()
    const oversized = 'x'.repeat(maxBytes + 1024)
    const res = await postJson('/api/to-markdown', { text: oversized })
    expect(res.status).to.equal(400)
    const body = await res.json()
    expect(body.success).to.equal(false)
    expect(body.error.code).to.equal('PAYLOAD_TOO_LARGE')
    expect(body.error.category).to.equal('VALIDATION_ERROR')
  })

  it('rejects invalid JSON body without crashing the process', async () => {
    const res = await postJson('/api/to-markdown', 'not-valid-json{{{')
    expect(res.status).to.equal(400)
    const text = await res.text()
    expect(text.length).to.be.greaterThan(0)
  })

  it('returns 429 when rate limit is exceeded', async function () {
    this.timeout(120000)
    const path = '/api/to-markdown'
    const payload = { text: '= Rate\n\nlimit probe.' }
    let saw429 = false
    let lastStatus = 0

    for (let i = 0; i < 105; i++) {
      const res = await postJson(path, payload)
      lastStatus = res.status
      if (res.status === 429) {
        saw429 = true
        const body = await res.json()
        expect(body.error).to.match(/too many requests/i)
        break
      }
      await res.text().catch(() => '')
    }

    expect(saw429, `expected 429 within 105 requests, last status ${lastStatus}`).to.equal(true)
  })
})
