/* eslint-env mocha */
'use strict'

/**
 * Tests for Ascend AsciiDoc → Markdown pipeline:
 * - removeExperimentalTag: no :toc: injection, only remove :experimental: line
 * - normalizeAsciiDocInput: LF, trim trailing spaces, single trailing newline
 * - convertAsciiDoc: returns { markdown, engineUsed, fallbackReason? }; fallback to Pandoc on downdoc failure
 */

const { expect } = require('./harness')
const { removeExperimentalTag, normalizeAsciiDocInput, convertAsciiDoc } = require('../api/backend/services/conversion/convert.js')

describe('removeExperimentalTag', () => {
  it('removes :experimental: line from header only, does not add :toc:', () => {
    const input = `:experimental:
= Title
Content`
    const out = removeExperimentalTag(input)
    expect(out).to.not.include(':experimental:')
    expect(out).to.not.include(':toc:')
    expect(out).to.include('= Title')
    expect(out).to.include('Content')
  })

  it('leaves :toc: alone when present (no injection)', () => {
    const input = `:toc:
= Title
Content`
    const out = removeExperimentalTag(input)
    expect(out).to.include(':toc:')
    expect(out).to.include('= Title')
  })

  it('removes :experimental: when both :experimental: and :toc: present (any order)', () => {
    const input1 = `:experimental:
:toc:
= Title
Content`
    const out1 = removeExperimentalTag(input1)
    expect(out1).to.not.include(':experimental:')
    expect(out1).to.include(':toc:')
    expect(out1).to.include('= Title')

    const input2 = `:toc:
:experimental:
= Title
Content`
    const out2 = removeExperimentalTag(input2)
    expect(out2).to.not.include(':experimental:')
    expect(out2).to.include(':toc:')
    expect(out2).to.include('= Title')
  })

  it('does not modify content after first title', () => {
    const input = `= Title
:experimental:
Para`
    const out = removeExperimentalTag(input)
    expect(out).to.include(':experimental:')
    expect(out).to.equal(input)
  })
})

describe('normalizeAsciiDocInput', () => {
  it('converts CRLF to LF', () => {
    const input = 'a\r\nb\r\nc'
    const out = normalizeAsciiDocInput(input)
    expect(out).to.equal('a\nb\nc\n')
    expect(out).to.not.match(/\r/)
  })

  it('converts lone CR to LF', () => {
    const input = 'a\rb\rc'
    const out = normalizeAsciiDocInput(input)
    expect(out).to.equal('a\nb\nc\n')
  })

  it('strips trailing spaces per line and ensures single trailing newline', () => {
    const input = '  a  \n  b  \n  c  '
    const out = normalizeAsciiDocInput(input)
    expect(out).to.equal('  a\n  b\n  c\n')
    expect(out.endsWith('\n')).to.equal(true)
    expect(out).to.not.match(/[ \t]\n/)
  })

  it('ensures exactly one newline at end', () => {
    const input = '= Title\n\nContent\n\n\n'
    const out = normalizeAsciiDocInput(input)
    expect(out.endsWith('\n')).to.equal(true)
    expect(out).to.not.match(/\n{3,}$/)
  })
})

describe('convertAsciiDoc', () => {
  it('returns { markdown, engineUsed, fallbackReason? } with valid markdown', async () => {
    const input = '= Hello\n\nWorld'
    const result = await convertAsciiDoc(input, 'default')
    expect(result).to.have.property('markdown')
    expect(result).to.have.property('engineUsed')
    expect(['downdoc', 'pandoc']).to.include(result.engineUsed)
    expect(result.markdown).to.be.a('string')
    expect(result.markdown.length).to.be.above(0)
    expect(result.markdown).to.match(/^#+\s+/)
  })

  it('succeeds with header containing :experimental: only (no :toc: injection)', async () => {
    const input = `:experimental:
= Title
Content`
    const result = await convertAsciiDoc(input, 'default')
    expect(result.markdown).to.be.ok
    expect(result.markdown).to.match(/^#+\s+Title/)
    expect(result.engineUsed).to.be.ok
  })

  it('succeeds with header containing :toc: only', async () => {
    const input = `:toc:
= Title
Content`
    const result = await convertAsciiDoc(input, 'default')
    expect(result.markdown).to.be.ok
    expect(result.markdown).to.match(/^#+\s+Title/)
  })

  it('succeeds with header containing :experimental: and :toc: in any order', async () => {
    const input1 = `:experimental:
:toc:
= Title
Content`
    const result1 = await convertAsciiDoc(input1, 'default')
    expect(result1.markdown).to.be.ok
    expect(result1.markdown).to.match(/^#+\s+Title/)

    const input2 = `:toc:
:experimental:
= Title
Content`
    const result2 = await convertAsciiDoc(input2, 'default')
    expect(result2.markdown).to.be.ok
    expect(result2.markdown).to.match(/^#+\s+Title/)
  })

  it('succeeds with CRLF line endings (normalized before conversion)', async () => {
    const input = '= Title\r\n\r\nContent\r\n'
    const result = await convertAsciiDoc(input, 'default')
    expect(result.markdown).to.be.ok
    expect(result.markdown).to.match(/^#+\s+Title/)
  })
})
