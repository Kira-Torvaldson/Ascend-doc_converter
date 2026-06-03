import { describe, expect, it } from 'vitest'
import {
  formatConversionErrorForUi,
  getErrorMessageForCode,
  getHintForCode,
} from './error-code-messages'

describe('error-code-messages', () => {
  it('maps EMPTY_INPUT message and hint', () => {
    expect(getErrorMessageForCode('EMPTY_INPUT', 'fallback')).toContain('vide')
    expect(getHintForCode('EMPTY_INPUT')).toContain('panneau source')
  })

  it('formatConversionErrorForUi appends hint for CONVERSION_FAILED', () => {
    const text = formatConversionErrorForUi('CONVERSION_FAILED', 'fallback')
    expect(text).toContain('échoué')
    expect(text).toContain('relancez')
  })

  it('formatConversionErrorForUi uses backend hint when local hint missing', () => {
    const text = formatConversionErrorForUi('UNKNOWN_CODE', 'Erreur', 'Action backend.')
    expect(text).toBe('Erreur Action backend.')
  })

  it('maps PAYLOAD_TOO_LARGE and CONVERSION_TIMEOUT', () => {
    expect(getHintForCode('PAYLOAD_TOO_LARGE')).toMatch(/taille/i)
    expect(getHintForCode('CONVERSION_TIMEOUT')).toMatch(/court/i)
  })
})
