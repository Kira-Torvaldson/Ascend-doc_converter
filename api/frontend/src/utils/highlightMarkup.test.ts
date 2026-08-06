import { describe, it, expect } from 'vitest'
import { highlightMarkup, inferHighlightLanguage } from './highlightMarkup'

describe('highlightMarkup', () => {
  it('escapes HTML and highlights markdown headings', () => {
    const html = highlightMarkup('# Titre\ntexte <b>', 'markdown')
    expect(html).toContain('&lt;b&gt;')
    expect(html).toContain('syn-heading')
    expect(html).toContain('# Titre')
  })

  it('highlights asciidoc titles', () => {
    const html = highlightMarkup('= Doc\n* item', 'asciidoc')
    expect(html).toContain('syn-heading')
    expect(html).toContain('syn-list')
  })

  it('infers language from format', () => {
    expect(inferHighlightLanguage('markdown')).toBe('markdown')
    expect(inferHighlightLanguage('asciidoc')).toBe('asciidoc')
    expect(inferHighlightLanguage('html')).toBe('html')
    expect(inferHighlightLanguage('txt')).toBe('generic')
  })
})
