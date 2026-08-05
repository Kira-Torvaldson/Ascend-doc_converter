'use strict'

/**
 * ASC-004 — Roundtrip semantic checks: adoc -> md -> adoc
 *
 * Uses fixtures in test/fixtures/conversion/adoc/complex/*.adoc
 * Assertions are semantic (not byte-identical); Pandoc may emit == instead of =.
 */

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const app = require('../app.js')
const { shutdown } = require('../services/conversion/pandoc-server.js')

const ROOT = path.join(__dirname, '../../..')
const COMPLEX_DIR = path.join(ROOT, 'test/fixtures/conversion/adoc/complex')

/** @type {Record<string, (ctx: { original: string, roundtrip: string, title: string }) => void>} */
const RULES_BY_FILE = {
  '01-table.adoc': ({ roundtrip, title }) => {
    assert.match(roundtrip, /^=+ /m, 'level-1 heading')
    assert.ok(roundtrip.includes(title), `title preserved: ${title}`)
    assert.ok(
      /^\|===/m.test(roundtrip) || /\[cols/i.test(roundtrip) || /\|Name\b/.test(roundtrip),
      'table structure'
    )
  },
  '02-admonition.adoc': ({ roundtrip, title }) => {
    assert.match(roundtrip, /^=+ /m, 'level-1 heading')
    assert.ok(roundtrip.includes(title), `title preserved: ${title}`)
    assert.ok(/NOTE/i.test(roundtrip), 'note admonition')
    assert.ok(/WARNING/i.test(roundtrip), 'warning admonition')
    assert.ok(/note block/i.test(roundtrip), 'note body')
  },
  '03-nested-list.adoc': ({ roundtrip, title }) => {
    assert.match(roundtrip, /^=+ /m, 'level-1 heading')
    assert.ok(roundtrip.includes(title), `title preserved: ${title}`)
    assert.ok(/Level one/i.test(roundtrip), 'list item one')
    assert.ok(/Level two/i.test(roundtrip), 'list item two')
    assert.ok(/Level three/i.test(roundtrip), 'list item three')
  },
  '04-source-block.adoc': ({ roundtrip, title }) => {
    assert.match(roundtrip, /^=+ /m, 'level-1 heading')
    assert.ok(roundtrip.includes(title), `title preserved: ${title}`)
    assert.ok(/\[source/i.test(roundtrip) || /^----/m.test(roundtrip), 'source block delimiter')
    assert.ok(/greet\s*\(/i.test(roundtrip), 'code content preserved')
  },
  '05-xref.adoc': ({ roundtrip, title }) => {
    assert.match(roundtrip, /^=+ /m, 'level-1 heading')
    assert.ok(roundtrip.includes(title), `title preserved: ${title}`)
    assert.ok(
      /<<[^>]+>>/m.test(roundtrip) || /link:/.test(roundtrip) || /xref:/.test(roundtrip),
      'cross reference preserved'
    )
    assert.ok(/Target Section/i.test(roundtrip), 'xref target section preserved')
    assert.ok(/target-section/i.test(roundtrip), 'xref id preserved')
  },
  '06-definition-list.adoc': ({ roundtrip, title }) => {
    assert.match(roundtrip, /^=+ /m, 'level-1 heading')
    assert.ok(roundtrip.includes(title), `title preserved: ${title}`)
    assert.ok(/Term::/i.test(roundtrip) || (/Term/i.test(roundtrip) && /Definition here/i.test(roundtrip)), 'definition term')
    assert.ok(/Another Term::/i.test(roundtrip) || /Second definition/i.test(roundtrip), 'second definition')
  },
  '07-admonition-multipara.adoc': ({ roundtrip, title }) => {
    assert.match(roundtrip, /^=+ /m, 'level-1 heading')
    assert.ok(roundtrip.includes(title), `title preserved: ${title}`)
    assert.ok(/NOTE/i.test(roundtrip), 'note admonition')
    assert.ok(/Para one/i.test(roundtrip), 'first paragraph')
    assert.ok(/Para two/i.test(roundtrip), 'second paragraph')
    assert.ok(/\*bold\*/i.test(roundtrip) || /\*\*bold\*\*/i.test(roundtrip), 'bold in note body')
  },
  '08-table-span.adoc': ({ roundtrip, title }) => {
    assert.match(roundtrip, /^=+ /m, 'level-1 heading')
    assert.ok(roundtrip.includes(title), `title preserved: ${title}`)
    assert.ok(/span both/i.test(roundtrip), 'spanned cell content')
    assert.ok(/\|===/.test(roundtrip) || /\[cols/.test(roundtrip) || /\d+\+/.test(roundtrip), 'table structure')
  },
}

function extractTitle(adocText) {
  const match = String(adocText).match(/^=+\s+(.+)$/m)
  return match ? match[1].trim() : ''
}

function normalize(content) {
  return String(content || '').replace(/\r\n/g, '\n').trim()
}

async function post(port, route, body, apiKey) {
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['X-API-Key'] = apiKey
  const res = await fetch(`http://127.0.0.1:${port}${route}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function runScenario(name, fn) {
  try {
    await fn()
    console.log(`[OK] ${name}`)
    return true
  } catch (err) {
    console.error(`[FAIL] ${name}`)
    console.error(err && err.stack ? err.stack : String(err))
    return false
  }
}

async function main() {
  if (!fs.existsSync(COMPLEX_DIR)) {
    throw new Error(`Missing fixtures directory: ${COMPLEX_DIR}`)
  }

  const files = fs.readdirSync(COMPLEX_DIR).filter((f) => f.endsWith('.adoc')).sort()
  const apiKey = (process.env.API_KEY || '').trim()
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()

  let allPassed = true

  try {
    for (const file of files) {
      const rule = RULES_BY_FILE[file]
      if (!rule) {
        console.log(`[SKIP] ${file} (no roundtrip rules defined)`)
        continue
      }

      allPassed = (await runScenario(`roundtrip: adoc/complex/${file}`, async () => {
        const original = fs.readFileSync(path.join(COMPLEX_DIR, file), 'utf8')
        const title = extractTitle(original)
        assert.ok(title.length > 0, 'fixture must have a level-1 title')

        const mdRes = await post(port, '/api/to-markdown', { text: original }, apiKey)
        assert.strictEqual(mdRes.status, 200, 'to-markdown HTTP status')
        assert.strictEqual(typeof mdRes.json.markdown, 'string')
        assert.ok(mdRes.json.markdown.length > 0, 'markdown output non-empty')

        const adocRes = await post(port, '/api/to-asciidoc', { text: mdRes.json.markdown }, apiKey)
        assert.strictEqual(adocRes.status, 200, 'to-asciidoc HTTP status')
        assert.strictEqual(typeof adocRes.json.asciidoc, 'string')

        const roundtrip = normalize(adocRes.json.asciidoc)
        assert.ok(roundtrip.length > 50, 'roundtrip output length')

        rule({ original: normalize(original), roundtrip, title })
      })) && allPassed
    }

    const tested = files.filter((f) => RULES_BY_FILE[f]).length
    if (tested === 0) {
      throw new Error('No roundtrip rules matched any fixture files')
    }
    if (!allPassed) {
      throw new Error('One or more roundtrip scenarios failed')
    }

    console.log(`[OK] Roundtrip verification passed (${tested} fixtures)`)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => {
    try {
      shutdown()
    } catch (_) {
      /* ignore */
    }
    setTimeout(() => process.exit(0), 50)
  })
  .catch((err) => {
    console.error('[FAIL] roundtrip adoc-md verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    try {
      shutdown()
    } catch (_) {
      /* ignore */
    }
    setTimeout(() => process.exit(1), 50)
  })
