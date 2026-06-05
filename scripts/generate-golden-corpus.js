'use strict'

/**
 * Regenerates golden expected outputs from the live conversion API.
 * Run after intentional converter changes: node scripts/generate-golden-corpus.js
 */

const fs = require('fs')
const path = require('path')
const app = require('../api/backend/app.js')

const ROOT = path.join(__dirname, '..')
const FIXTURES = path.join(ROOT, 'test/fixtures/conversion')
const EXPECTED_MD = path.join(FIXTURES, 'expected/to-markdown')
const EXPECTED_ADOC = path.join(FIXTURES, 'expected/to-asciidoc')

function readFixture(relPath) {
  return fs.readFileSync(path.join(FIXTURES, relPath), 'utf8')
}

function normalize(content) {
  return String(content || '').replace(/\r\n/g, '\n').trimEnd()
}

function writeGolden(dir, baseName, content) {
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${baseName}.golden`), normalize(content) + '\n', 'utf8')
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

async function main() {
  const apiKey = (process.env.API_KEY || '').trim()
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()

  try {
    const adocDirs = ['adoc/simple', 'adoc/complex']
    for (const dir of adocDirs) {
      const fullDir = path.join(FIXTURES, dir)
      if (!fs.existsSync(fullDir)) continue
      for (const file of fs.readdirSync(fullDir).filter((f) => f.endsWith('.adoc'))) {
        const text = readFixture(path.join(dir, file))
        const { status, json } = await post(port, '/api/to-markdown', { text }, apiKey)
        if (status !== 200 || !json.markdown) {
          throw new Error(`${dir}/${file}: expected 200, got ${status}`)
        }
        const base = path.basename(file, '.adoc')
        writeGolden(EXPECTED_MD, `${dir.replace('/', '-')}-${base}`, json.markdown)
        console.log(`[OK] golden to-markdown: ${dir}/${file}`)
      }
    }

    const mdDir = path.join(FIXTURES, 'markdown/complex')
    if (fs.existsSync(mdDir)) {
      for (const file of fs.readdirSync(mdDir).filter((f) => f.endsWith('.md'))) {
        const text = readFixture(path.join('markdown/complex', file))
        const { status, json } = await post(port, '/api/to-asciidoc', { text }, apiKey)
        if (status !== 200 || !json.asciidoc) {
          throw new Error(`markdown/complex/${file}: expected 200, got ${status}`)
        }
        const base = path.basename(file, '.md')
        writeGolden(EXPECTED_ADOC, base, json.asciidoc)
        console.log(`[OK] golden to-asciidoc: ${file}`)
      }
    }

    console.log('[OK] Golden corpus regenerated')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main().catch((err) => {
  console.error('[FAIL]', err.message || err)
  process.exit(1)
})
