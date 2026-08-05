'use strict'

/**
 * Verify html-markdown / html-plain wrappers + in-memory helpers + /api/from-html.
 * Usage: node scripts/verify-html-wrappers.js
 */

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { randomUUID } = require('crypto')
const {
  htmlToPlain,
  plainToHtml,
  htmlToMarkdown,
  markdownToHtml,
  markdownToPlain,
  isPandocTimeoutError,
} = require('../services/conversion/html-conversion.js')
const htmlMarkdown = require('../services/modules/html-markdown.module.js')
const htmlPlain = require('../services/modules/html-plain.module.js')
const { executeConversion } = require('../services/modules/converter-orchestrator.module.js')
const { shutdown } = require('../services/conversion/pandoc-server.js')
const app = require('../app.js')

async function post(port, route, body) {
  const res = await fetch(`http://127.0.0.1:${port}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function main() {
  const sampleHtml = [
    '<h1>Title</h1>',
    '<p>Hello <strong>world</strong>.</p>',
    '<ul><li>One</li><li>Two</li></ul>',
    '',
  ].join('\n')

  // Local stripper
  const plain = htmlToPlain(sampleHtml)
  assert.ok(/Title/.test(plain), 'plain has title')
  assert.ok(/Hello/.test(plain), 'plain has body')
  assert.ok(!/</.test(plain), 'plain has no tags')
  const backHtml = plainToHtml('Hello\n\nWorld')
  assert.ok(backHtml.includes('<p>Hello</p>'), 'plain->html paragraphs')

  const mdPlain = markdownToPlain('# Title\n\nHello **world** and [link](https://ex.com).\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n')
  assert.ok(/Title/.test(mdPlain), 'md-plain title')
  assert.ok(/Hello world/.test(mdPlain), 'md-plain emphasis stripped')
  assert.ok(/link/.test(mdPlain) && !/https:/.test(mdPlain), 'md-plain link text only')
  assert.ok(/\t/.test(mdPlain) || /1/.test(mdPlain), 'md-plain table cells')

  assert.strictEqual(
    isPandocTimeoutError(Object.assign(new Error('Pandoc conversion timed out'), { code: 'CONVERSION_TIMEOUT' })),
    true,
    'timeout error detected by code'
  )
  assert.strictEqual(
    isPandocTimeoutError(new Error('spawn pandoc ENOENT')),
    false,
    'non-timeout error is not classified as timeout'
  )

  // Pandoc HTML <-> MD
  const md = await htmlToMarkdown(sampleHtml)
  assert.ok(/#\s*Title/i.test(md) || /Title/.test(md), 'html->md title')
  assert.ok(/\*\*world\*\*|__world__|<strong>world<\/strong>/.test(md) || /world/.test(md), 'html->md emphasis')
  const html2 = await markdownToHtml('# Hello\n\nPara.\n')
  assert.ok(/<h1/i.test(html2), 'md->html heading')

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ascend-html-'))
  const htmlIn = path.join(dir, 'in.html')
  const mdOut = path.join(dir, 'out.md')
  const txtOut = path.join(dir, 'out.txt')
  const mdIn = path.join(dir, 'in.md')
  const htmlOut = path.join(dir, 'out.html')
  const txtIn = path.join(dir, 'in.txt')
  fs.writeFileSync(htmlIn, sampleHtml, 'utf8')
  fs.writeFileSync(mdIn, '# Hello\n\nWorld.\n', 'utf8')
  fs.writeFileSync(txtIn, 'Line one.\n\nLine two.\n', 'utf8')

  const id = randomUUID()
  const r1 = await htmlMarkdown.run(htmlIn, mdOut, {
    conversionId: id + '-hm',
    fromFormat: 'html',
    toFormat: 'markdown',
  })
  assert.strictEqual(r1.success, true, 'html-markdown html->md')
  assert.strictEqual(r1.converter, 'html-markdown')
  assert.ok(typeof r1.durationMs === 'number')
  assert.ok(fs.readFileSync(mdOut, 'utf8').length > 0)

  const r2 = await htmlMarkdown.run(mdIn, htmlOut, {
    conversionId: id + '-mh',
    fromFormat: 'markdown',
    toFormat: 'html',
  })
  assert.strictEqual(r2.success, true, 'html-markdown md->html')
  assert.ok(/<h1/i.test(fs.readFileSync(htmlOut, 'utf8')))

  const r3 = await htmlPlain.run(htmlIn, txtOut, {
    conversionId: id + '-ht',
    fromFormat: 'html',
    toFormat: 'txt',
  })
  assert.strictEqual(r3.success, true, 'html-plain html->txt')
  assert.strictEqual(r3.converter, 'html-plain')
  assert.ok(!/</.test(fs.readFileSync(txtOut, 'utf8')))

  const htmlFromTxt = path.join(dir, 'from-txt.html')
  const r4 = await htmlPlain.run(txtIn, htmlFromTxt, {
    conversionId: id + '-th',
    fromFormat: 'txt',
    toFormat: 'html',
  })
  assert.strictEqual(r4.success, true, 'html-plain txt->html')
  assert.ok(/<p>/i.test(fs.readFileSync(htmlFromTxt, 'utf8')))

  // Orchestrator prefers dedicated wrappers
  const orchMd = path.join(dir, 'orch.md')
  const orch = await executeConversion(htmlIn, orchMd, 'html', 'markdown', {
    conversionId: id + '-orch',
    _internal: true,
  })
  assert.strictEqual(orch.success, true, 'orch html->md success')
  assert.strictEqual(orch.converter, 'html-markdown', 'orch uses html-markdown')

  const orchTxt = path.join(dir, 'orch.txt')
  const orch2 = await executeConversion(htmlIn, orchTxt, 'html', 'txt', {
    conversionId: id + '-orch2',
    _internal: true,
  })
  assert.strictEqual(orch2.success, true, 'orch html->txt success')
  assert.strictEqual(orch2.converter, 'html-plain', 'orch uses html-plain')

  // HTTP /api/from-html
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  try {
    const apiMd = await post(port, '/api/from-html', { text: sampleHtml, to: 'markdown' })
    assert.strictEqual(apiMd.status, 200, 'from-html markdown status')
    assert.ok(typeof apiMd.json.markdown === 'string' && apiMd.json.markdown.length > 0)
    assert.strictEqual(apiMd.json.conversionResult.converter, 'html-markdown')

    const apiTxt = await post(port, '/api/from-html', { text: sampleHtml, to: 'txt' })
    assert.strictEqual(apiTxt.status, 200, 'from-html txt status')
    assert.ok(typeof apiTxt.json.txt === 'string')
    assert.strictEqual(apiTxt.json.conversionResult.converter, 'html-plain')

    const sampleMd = '# Title\n\nHello **world**.\n'
    const apiMdHtml = await post(port, '/api/from-markdown', { text: sampleMd, to: 'html' })
    assert.strictEqual(apiMdHtml.status, 200, 'from-markdown html status')
    assert.ok(typeof apiMdHtml.json.html === 'string' && apiMdHtml.json.html.includes('<'))
    assert.strictEqual(apiMdHtml.json.conversionResult.success, true)

    const apiMdTxt = await post(port, '/api/from-markdown', { text: sampleMd, to: 'txt' })
    assert.strictEqual(apiMdTxt.status, 200, 'from-markdown txt status')
    assert.ok(typeof apiMdTxt.json.txt === 'string' && /hello/i.test(apiMdTxt.json.txt))
    assert.strictEqual(apiMdTxt.json.conversionResult.success, true)
    assert.ok(
      apiMdTxt.json.conversionResult.meta &&
        (apiMdTxt.json.conversionResult.meta.engineUsed === 'pandoc' ||
          apiMdTxt.json.conversionResult.meta.engineUsed === 'local'),
      'from-markdown txt exposes engineUsed'
    )

    const apiTxtHtml = await post(port, '/api/from-text', { text: 'Hello\n\nWorld', to: 'html' })
    assert.strictEqual(apiTxtHtml.status, 200, 'from-text html status')
    assert.ok(typeof apiTxtHtml.json.html === 'string' && apiTxtHtml.json.html.includes('<p>'))
    assert.strictEqual(apiTxtHtml.json.conversionResult.converter, 'html-plain')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }

  console.log('OK html wrappers + /api/from-markdown + /api/from-text')
}

main()
  .then(() => {
    try {
      shutdown()
    } catch (_) {}
    setTimeout(() => process.exit(0), 80)
  })
  .catch((err) => {
    console.error('[FAIL]', err && err.stack ? err.stack : err)
    try {
      shutdown()
    } catch (_) {}
    setTimeout(() => process.exit(1), 80)
  })
