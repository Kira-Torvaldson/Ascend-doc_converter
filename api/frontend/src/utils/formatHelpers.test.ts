import { describe, expect, it } from 'vitest'
import { extractHeadings, getFormatPlaceholder, getFormatTitle } from './formatHelpers'

describe('formatHelpers', () => {
  it('retourne le titre et placeholder d un format connu', () => {
    expect(getFormatTitle('markdown')).toBe('Markdown')
    expect(getFormatTitle('txt')).toBe('TEXT')
    expect(getFormatPlaceholder('txt')).toContain('texte brut')
  })

  it('extrait les headings markdown', () => {
    const text = '# Titre 1\nTexte\n## Titre 2'
    const headings = extractHeadings(text, 'markdown')

    expect(headings).toEqual([
      { lineIndex: 0, level: 1, title: 'Titre 1' },
      { lineIndex: 2, level: 2, title: 'Titre 2' },
    ])
  })

  it('extrait les headings asciidoc', () => {
    const text = '= Titre A\nTexte\n== Titre B'
    const headings = extractHeadings(text, 'asciidoc')

    expect(headings).toEqual([
      { lineIndex: 0, level: 1, title: 'Titre A' },
      { lineIndex: 2, level: 2, title: 'Titre B' },
    ])
  })
})
