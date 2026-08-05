'use strict'


const { exitClean } = require('./lib/verify-exit.js')
/**
 * Precision checks for ADOC↔MD (local + Pandoc), without touching UI.
 * Usage: node scripts/verify-conversion-precision.js
 */

const assert = require('assert')
const {
  normalizePandocMarkdownAdmonitions,
  extractMarkdownAdmonitions,
  restoreAsciiDocAdmonitions,
  postprocessPandocAsciiDocAdmonitions,
  processInlineFormattingSafe,
  normalizeDefinitionLists,
} = require('../services/conversion/conversion-precision.js')
const {
  convertAsciiDoc,
  convertMarkdown,
  convertAsciiDocWithPandoc,
  convertMarkdownWithPandoc,
} = require('../services/conversion/convert.js')

async function main() {
  const inline = processInlineFormattingSafe('> **NOTE:** Hello **world**.')
  assert.strictEqual(inline, '> *NOTE:* Hello *world*.', 'inline bold mapping')

  const pandocMd = [
    ':::: note',
    '::: title',
    'Note',
    ':::',
    '',
    'Hello **world**.',
    '',
    'Second para.',
    '::::',
    '',
  ].join('\n')
  const norm = normalizePandocMarkdownAdmonitions(pandocMd)
  assert.ok(norm.includes('> **NOTE:** Hello **world**.'), 'pandoc :::: note → blockquote')
  assert.ok(norm.includes('> \n') || norm.includes('> \r') || / > $/.test(norm.split('\n').find((l) => l === '> ') || ''), 'keeps blank quote line')
  assert.ok(norm.includes('> Second para.'), 'multi-para pandoc note')
  assert.ok(!norm.includes('::::'), 'no leftover fenced div')

  const md = [
    '# Doc',
    '',
    '> **NOTE:** Hello **world**.',
    '',
    '> **WARNING:** Watch out.',
    '',
    '```js',
    'const x = 1;',
    '```',
    '',
  ].join('\n')
  const extracted = extractMarkdownAdmonitions(md)
  assert.strictEqual(extracted.blocks.length, 2, 'extract 2 admonitions')
  const restored = restoreAsciiDocAdmonitions(
    '== Doc\n\nASCENDADMONPLACEHOLDER0\n\nASCENDADMONPLACEHOLDER1\n\n----\nconst x = 1;\n----\n',
    extracted.blocks
  )
  assert.ok(restored.includes('[NOTE]\n====\nHello *world*.\n===='), 'restore NOTE with AsciiDoc bold')
  assert.ok(restored.includes('[WARNING]\n====\nWatch out.\n===='), 'restore WARNING')

  const post = postprocessPandocAsciiDocAdmonitions('____\n*NOTE:* Hello world.\n____\n')
  assert.ok(post.includes('[NOTE]\n====\nHello world.\n===='), 'postprocess ____ note')

  const dlistMd = normalizeDefinitionLists('* **Term**\\\nDefinition here.\n* **Another**\\\nSecond.\n')
  assert.ok(dlistMd.includes('Term\n: Definition here.'), 'dlist Term')
  assert.ok(dlistMd.includes('Another\n: Second.'), 'dlist Another')

  const adoc = [
    '= Doc',
    '',
    'Term:: Definition here.',
    '',
    '[[sec-id]]',
    '== Section',
    '',
    'See <<sec-id>> and xref:sec-id[Label].',
    '',
    'NOTE: Hello *world*.',
    '',
    '[NOTE]',
    '====',
    'Para one.',
    '',
    'Para two with *bold*.',
    '====',
    '',
    '[WARNING]',
    '====',
    'Watch out.',
    '====',
    '',
  ].join('\n')

  const down = await convertAsciiDoc(adoc, 'default')
  assert.ok(down.markdown.includes('Term\n: Definition here.') || down.markdown.includes('Term\n:'), 'downdoc dlist')
  assert.ok(down.markdown.includes('{#sec-id}') || down.markdown.includes('(#sec-id)'), 'anchor preserved')
  assert.ok(down.markdown.includes('(#sec-id)'), 'xref target id preserved')
  assert.ok(down.markdown.includes('> **NOTE:**'), 'downdoc NOTE')
  assert.ok(
    down.markdown.includes('> \n> Para two') || down.markdown.match(/> \*\*NOTE:\*\* Para one\.\n> \n> Para two/),
    'multi-para note blank kept'
  )
  assert.ok(down.markdown.includes('> **WARNING:** Watch out.'), 'downdoc WARNING')
  assert.ok(!down.markdown.includes('<dl>'), 'no raw dl')

  const local = convertMarkdown(
    [
      '# Doc',
      '',
      '- a',
      '  - b',
      '    - c',
      '',
      'Term',
      ': Definition here.',
      '',
      '> **NOTE:** Hello **world**.',
      '',
      '```js',
      'const x = 1;',
      '```',
      '',
    ].join('\n')
  )
  assert.ok(local.includes('* a'), 'local list L1')
  assert.ok(local.includes('** b'), 'local list L2')
  assert.ok(local.includes('*** c'), 'local list L3')
  assert.ok(local.includes('Term:: Definition here.'), 'local dlist')
  assert.ok(local.includes('[NOTE]'), 'local NOTE block')
  assert.ok(local.includes('Hello *world*.'), 'local NOTE bold')
  assert.ok(local.includes('[source,js]'), 'local code lang')
  assert.ok(local.includes('----\nconst x = 1;\n----'), 'local code fence')

  const pMd = await convertAsciiDocWithPandoc(
    ['= Doc', '', 'NOTE: Hello *world*.', '', '[WARNING]', '====', 'Watch out.', '====', ''].join('\n')
  )
  assert.ok(pMd.includes('**NOTE:**') || pMd.includes('> **NOTE:**'), 'pandoc ADOC→MD note')
  assert.ok(!pMd.includes(':::: note'), 'pandoc ADOC→MD no fenced note left')

  const pAdoc = await convertMarkdownWithPandoc(down.markdown)
  assert.ok(pAdoc.includes('[NOTE]'), 'pandoc MD→ADOC NOTE')
  assert.ok(pAdoc.includes('Term::') || pAdoc.includes('Term ::'), 'pandoc roundtrip dlist')
  assert.ok(pAdoc.includes('<<sec-id') || pAdoc.includes('sec-id'), 'pandoc roundtrip xref id')
  assert.ok(!pAdoc.includes('++>++'), 'pandoc must not mangle blockquotes')
  assert.ok(!pAdoc.includes('**bold**') || pAdoc.includes('*bold*'), 'admon body uses AsciiDoc bold')

  // Images with size
  const img = await convertAsciiDoc(['= Doc', '', 'image::fig.png[Alt,200,100]', ''].join('\n'), 'default')
  assert.ok(img.markdown.includes('![Alt](fig.png)'), 'image alt/src')
  assert.ok(/width=200/.test(img.markdown) && /height=100/.test(img.markdown), 'image dimensions')

  // Mark spans
  const mark = await convertAsciiDoc(['= Doc', '', 'Use #highlighted# text.', ''].join('\n'), 'default')
  assert.ok(mark.markdown.includes('<mark>highlighted</mark>'), 'mark kept in default')
  const markBs = await convertAsciiDoc(['= Doc', '', 'Use #highlighted# text.', ''].join('\n'), 'bookstack')
  assert.ok(markBs.markdown.includes('**highlighted**'), 'mark → bold for bookstack')
  assert.ok(!markBs.markdown.includes('<mark>'), 'no mark html in bookstack')

  // include:: warning
  const inc = await convertAsciiDoc(
    ['= Doc', '', 'include::chapters/intro.adoc[]', '', 'After.', ''].join('\n'),
    'default'
  )
  assert.ok(inc.markdown.includes('After.'), 'content after include')
  assert.ok(!inc.markdown.includes('include::'), 'include directive dropped from output')
  assert.ok(Array.isArray(inc.warnings) && inc.warnings.some((w) => w.code === 'INCLUDE_NOT_RESOLVED'), 'include warning')

  // Table spans → pandoc gfm with colspan
  const span = await convertAsciiDoc(
    ['= Doc', '', '|===', '| a | b', '', '2+|span both', '|===', ''].join('\n'),
    'default'
  )
  assert.strictEqual(span.engineUsed, 'pandoc', 'span uses pandoc')
  assert.ok(/colspan|span both/i.test(span.markdown), 'colspan or span content preserved')

  // Callouts → portable (n)
  const callout = await convertAsciiDoc(
    [
      '= Doc',
      '',
      ':experimental:',
      '',
      '[source,js]',
      '----',
      'const x = 1; // <1>',
      '----',
      '',
      '<1> explanation',
      '',
    ].join('\n'),
    'default'
  )
  assert.ok(/\(1\)/.test(callout.markdown) || /explanation/i.test(callout.markdown), 'callout portable or listed')
  assert.ok(!/[①②③]/.test(callout.markdown), 'no unicode conums')

  // Unresolved attribute warning
  const attrDoc = await convertAsciiDoc(
    ['= Doc', '', 'Hello {product-name}.', ''].join('\n'),
    'default'
  )
  assert.ok(
    Array.isArray(attrDoc.warnings) &&
      attrDoc.warnings.some((w) => w.code === 'ATTRIBUTE_UNRESOLVED' && /product-name/.test(w.message)),
    'unresolved attribute warning'
  )

  console.log('OK conversion precision')
}

main()
  .then(() => exitClean(0))
  .catch(async (err) => {

    console.error('[FAIL]', err && err.message ? err.message : err)
    await exitClean(1)
  })
