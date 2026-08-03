import { describe, it, expect } from 'vitest';
import {
  DEFAULT_USER_SETTINGS,
  cloneUserSettings,
  areUserSettingsEqual,
  validateUserPrefs,
} from './userSettings'

describe('userSettings helpers', () => {
  it('clones settings without sharing nested references', () => {
    const original = cloneUserSettings(DEFAULT_USER_SETTINGS)
    const cloned = cloneUserSettings(original)
    cloned.profile.displayName = 'Alice'
    cloned.ui.compactMode = true
    expect(original.profile.displayName).toBe('')
    expect(original.ui.compactMode).toBe(false)
  })

  it('detects dirty draft via areUserSettingsEqual', () => {
    const a = cloneUserSettings(DEFAULT_USER_SETTINGS)
    const b = cloneUserSettings(DEFAULT_USER_SETTINGS)
    expect(areUserSettingsEqual(a, b)).toBe(true)
    b.ui.theme = 'dark'
    expect(areUserSettingsEqual(a, b)).toBe(false)
  })

  it('validates profile field lengths', () => {
    expect(validateUserPrefs({ displayName: 'ok', organization: '', defaultLanguage: 'fr' })).toEqual({})
    expect(validateUserPrefs({
      displayName: 'x'.repeat(101),
      organization: 'y'.repeat(101),
      defaultLanguage: 'fr',
    })).toEqual({
      displayName: 'Maximum 100 caractères',
      organization: 'Maximum 100 caractères',
    })
  })
})
