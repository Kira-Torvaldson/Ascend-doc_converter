'use strict'

/**
 * ASC-003 — Golden corpus non-regression tests
 *
 * Compares live API conversion output against committed .golden files.
 * Regenerate goldens after intentional changes:
 *   node scripts/generate-golden-corpus.js  (from repo root)
 */

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const app = require('../app.js')

const ROOT = path.join(__dirname, '../../..')
const FIXTURES = path.join(ROOT, 'test/fixtures/conversion')

function normalize(content) {
  return String(content || '').replace(/\r\n/g, '\n').trimEnd()
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function goldenKeyForAdoc(dir, file) {
  const base = path.basename(file, '.adoc')
  return `${dir.replace('/', '-')}-${base}`
}

function firstDiffLine(expected, actual) {
  const expLines = expected.split('\n')
  const actLines = actual.split('\n')
  const max = Math.max(expLines.length, actLines.length)
  for (let i = 0; i < max; i++) {
    if (expLines[i] !== actLines[i]) {
      return i + 1
    }
  }
  return null
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
  const apiKey = (process.env.API_KEY || '').trim()
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()

  let allPassed = true

  try {
    for (const dir of ['adoc/simple', 'adoc/complex']) {
      const fullDir = path.join(FIXTURES, dir)
      if (!fs.existsSync(fullDir)) continue

      for (const file of fs.readdirSync(fullDir).filter((f) => f.endsWith('.adoc'))) {
        const key = goldenKeyForAdoc(dir, file)
        const goldenPath = path.join(FIXTURES, 'expected/to-markdown', `${key}.golden`)
        const label = `to-markdown: ${dir}/${file}`

        allPassed = (await runScenario(label, async () => {
          assert.ok(fs.existsSync(goldenPath), `Missing golden file: ${goldenPath}`)
          const text = readFile(path.join(fullDir, file))
          const expected = normalize(readFile(goldenPath))
          const { status, json } = await post(port, '/api/to-markdown', { text }, apiKey)
          assert.strictEqual(status, 200, `HTTP status for ${label}`)
          assert.strictEqual(typeof json.markdown, 'string')
          const actual = normalize(json.markdown)
          if (actual !== expected) {
            const line = firstDiffLine(expected, actual)
            throw new Error(
              `Output mismatch at line ${line ?? '?'}\n` +
                `Expected (${expected.length} chars):\n${expected}\n---\n` +
                `Actual (${actual.length} chars):\n${actual}`
            )
          }
        })) && allPassed
      }
    }

    const mdDir = path.join(FIXTURES, 'markdown/complex')
    if (fs.existsSync(mdDir)) {
      for (const file of fs.readdirSync(mdDir).filter((f) => f.endsWith('.md'))) {
        const base = path.basename(file, '.md')
        const goldenPath = path.join(FIXTURES, 'expected/to-asciidoc', `${base}.golden`)
        const label = `to-asciidoc: markdown/complex/${file}`

        allPassed = (await runScenario(label, async () => {
          assert.ok(fs.existsSync(goldenPath), `Missing golden file: ${goldenPath}`)
          const text = readFile(path.join(mdDir, file))
          const expected = normalize(readFile(goldenPath))
          const { status, json } = await post(port, '/api/to-asciidoc', { text }, apiKey)
          assert.strictEqual(status, 200, `HTTP status for ${label}`)
          assert.strictEqual(typeof json.asciidoc, 'string')
          const actual = normalize(json.asciidoc)
          if (actual !== expected) {
            const line = firstDiffLine(expected, actual)
            throw new Error(
              `Output mismatch at line ${line ?? '?'}\n` +
                `Expected (${expected.length} chars):\n${expected}\n---\n` +
                `Actual (${actual.length} chars):\n${actual}`
            )
          }
        })) && allPassed
      }
    }

    if (!allPassed) {
      throw new Error('One or more golden corpus scenarios failed')
    }

    console.log('[OK] Golden corpus verification passed')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => {
    setTimeout(() => process.exit(0), 50)
  })
  .catch((err) => {
    console.error('[FAIL] golden corpus verification failed')
    console.error(err && err.stack ? err.stack : String(err))
    setTimeout(() => process.exit(1), 50)
  })
