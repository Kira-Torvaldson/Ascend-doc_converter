'use strict'

const { exitClean } = require('./lib/verify-exit.js')

/**
 * Quick benchmark: large-document conversion latency on /api/to-markdown
 * and /api/text-to-markdown (in-memory converters, no Pandoc required),
 * plus /api/to-asciidoc (Pandoc) when the binary is available.
 * Usage: node api/backend/scripts/bench-large-doc.js [sizeMb]
 * Set PANDOC_SERVER_ENABLED=false to compare against the CLI path.
 */

const app = require('../app.js')

function buildLargeAsciidoc(targetBytes) {
  const parts = ['= Gros document\n']
  const section = [
    '== Section {i}\n',
    'Paragraphe avec du *gras*, de l\'_italique_ et un lien https://example.com[exemple].\n',
    '* item un\n* item deux\n* item trois\n',
    '[source,js]\n----\nconst x = {i}\nconsole.log(x)\n----\n',
  ].join('\n')
  let i = 0
  let size = parts[0].length
  while (size < targetBytes) {
    const s = section.replace(/\{i\}/g, String(i++))
    parts.push(s)
    size += s.length
  }
  return parts.join('\n')
}

function buildLargeMarkdown(targetBytes) {
  const parts = ['# Gros document\n']
  const section = [
    '## Section {i}\n',
    'Paragraphe avec du **gras**, de l\'_italique_ et un [lien](https://example.com).\n',
    '- item un\n- item deux\n- item trois\n',
    '```js\nconst x = {i}\nconsole.log(x)\n```\n',
  ].join('\n')
  let i = 0
  let size = parts[0].length
  while (size < targetBytes) {
    const s = section.replace(/\{i\}/g, String(i++))
    parts.push(s)
    size += s.length
  }
  return parts.join('\n')
}

async function timeRequest(base, path, body) {
  const started = process.hrtime.bigint()
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await response.json()
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6
  return { status: response.status, elapsedMs, json }
}

async function main() {
  const sizeMb = Number(process.argv[2]) || 4
  const text = buildLargeAsciidoc(sizeMb * 1024 * 1024)
  console.log(`Document: ${(Buffer.byteLength(text) / 1024 / 1024).toFixed(2)} MB`)

  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`

  try {
    // Warmup (lazy module registration, JIT)
    await timeRequest(base, '/api/to-markdown', { text: '= T\n\nWarmup.' })

    for (const run of [1, 2, 3]) {
      const r = await timeRequest(base, '/api/to-markdown', { text })
      if (r.status !== 200) {
        console.error(`[FAIL] run ${run}: status ${r.status}`, r.json && r.json.error)
        process.exitCode = 1
        return
      }
      console.log(`/api/to-markdown run ${run}: ${r.elapsedMs.toFixed(0)} ms (output ${(r.json.markdown.length / 1024 / 1024).toFixed(2)} MB)`)
    }

    const plainText = text.replace(/[=*_\[\]]/g, '')
    for (const run of [1, 2]) {
      const r = await timeRequest(base, '/api/text-to-markdown', { text: plainText })
      if (r.status !== 200) {
        console.error(`[FAIL] text run ${run}: status ${r.status}`, r.json && r.json.error)
        process.exitCode = 1
        return
      }
      console.log(`/api/text-to-markdown run ${run}: ${r.elapsedMs.toFixed(0)} ms`)
    }

    // Pandoc route: many small-to-medium requests is the realistic workload,
    // and where the persistent server (vs per-request CLI startup) pays off.
    const mdSmall = buildLargeMarkdown(64 * 1024)
    const probe = await timeRequest(base, '/api/to-asciidoc', { text: mdSmall })
    if (probe.status === 200) {
      const runs = 6
      let total = 0
      for (let run = 1; run <= runs; run++) {
        const r = await timeRequest(base, '/api/to-asciidoc', { text: mdSmall })
        if (r.status !== 200) {
          console.error(`[FAIL] to-asciidoc run ${run}: status ${r.status}`, r.json && r.json.error)
          process.exitCode = 1
          return
        }
        total += r.elapsedMs
        console.log(`/api/to-asciidoc (64 KB) run ${run}: ${r.elapsedMs.toFixed(0)} ms`)
      }
      console.log(`/api/to-asciidoc average: ${(total / runs).toFixed(0)} ms`)
    } else {
      console.log(`/api/to-asciidoc skipped (status ${probe.status}, Pandoc probably unavailable)`)
    }
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main()
  .then(() => exitClean(process.exitCode || 0))
  .catch(async (err) => {
    console.error(err)
    await exitClean(1)
  })
