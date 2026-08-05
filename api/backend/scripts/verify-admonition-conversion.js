'use strict'

/**
 * Verify AsciiDoc admonitions convert cleanly (default + BookStack).
 * Usage: node scripts/verify-admonition-conversion.js
 */

const assert = require('assert')
const { convertAsciiDoc } = require('../services/conversion/convert.js')

async function main() {
  const sample = [
    '= Guide',
    '',
    'NOTE: Paragraph note.',
    '',
    '[NOTE]',
    '====',
    'Block note content.',
    '====',
    '',
    'TIP: A tip.',
    '',
    '[WARNING]',
    '====',
    'Watch out.',
    '====',
    '',
  ].join('\n')

  const def = await convertAsciiDoc(sample, 'default')
  assert.ok(def.markdown.includes('> **NOTE:** Paragraph note.'), 'default paragraph NOTE')
  assert.ok(def.markdown.includes('> **WARNING:** Watch out.'), 'default WARNING block')
  assert.ok(!def.markdown.includes('<dl>'), 'default must not leave raw <dl> HTML')
  assert.ok(!def.markdown.includes('[WARNING]'), 'default must not leave raw [WARNING]')
  assert.ok(!def.markdown.includes('\n====\n'), 'default must not leave ==== delimiters')

  const bs = await convertAsciiDoc(sample, 'bookstack')
  assert.ok(bs.markdown.includes('> **NOTE:** Paragraph note.'), 'bookstack paragraph NOTE')
  assert.ok(bs.markdown.includes('> **NOTE:** Block note content.'), 'bookstack block NOTE')
  assert.ok(bs.markdown.includes('> **TIP:** A tip.'), 'bookstack TIP')
  assert.ok(bs.markdown.includes('> **WARNING:** Watch out.'), 'bookstack WARNING')
  assert.ok(!bs.markdown.includes('* *'), 'bookstack must not mangle ** into list')
  assert.strictEqual(bs.markdown.split('\n').filter((l) => l === '>').length, 0, 'no bare > lines')

  // CRLF input must also work
  const crlf = sample.replace(/\n/g, '\r\n')
  const crlfOut = await convertAsciiDoc(crlf, 'bookstack')
  assert.ok(crlfOut.markdown.includes('> **WARNING:** Watch out.'), 'CRLF bookstack WARNING')

  console.log('OK admonition conversion (default + bookstack + CRLF)')
}

main().catch((err) => {
  console.error('[FAIL]', err && err.message ? err.message : err)
  process.exit(1)
})
