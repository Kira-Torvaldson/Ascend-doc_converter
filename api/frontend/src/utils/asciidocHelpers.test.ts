import { describe, expect, it } from 'vitest'
import { normalizeAsciiDocInput, removeExperimentalTag } from './asciidocHelpers'

describe('removeExperimentalTag', () => {
  it('supprime :experimental: avant le premier titre', () => {
    const input = ':experimental:\n= Titre\n\nTexte'
    const output = removeExperimentalTag(input)
    expect(output).toBe('= Titre\n\nTexte')
  })

  it('ne supprime pas :experimental: après le premier titre', () => {
    const input = '= Titre\n:experimental:\n\nTexte'
    const output = removeExperimentalTag(input)
    expect(output).toBe(input)
  })
})

describe('normalizeAsciiDocInput', () => {
  it('normalise les fins de ligne et ajoute un unique saut final', () => {
    const input = '= Titre\r\nTexte avec espaces   \r\n'
    const output = normalizeAsciiDocInput(input)
    expect(output).toBe('= Titre\nTexte avec espaces\n')
  })
})
