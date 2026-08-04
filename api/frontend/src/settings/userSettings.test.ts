import { describe, it, expect } from 'vitest';
import {
  DEFAULT_USER_SETTINGS,
  cloneUserSettings,
  areUserSettingsEqual,
  validateUserPrefs,
  applyInterfacePreset,
  normalizeUserSettings,
  buildUserSettingsExport,
  parseImportedUserSettings,
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

  it('applies interface presets without clearing custom background', () => {
    const ui = { ...DEFAULT_USER_SETTINGS.ui, backgroundMode: 'custom' as const }
    expect(applyInterfacePreset(ui, 'dark')).toMatchObject({
      theme: 'dark',
      backgroundMode: 'custom',
      compactMode: false,
    })
    expect(applyInterfacePreset(ui, 'minimal')).toMatchObject({
      compactMode: true,
      reduceMotion: true,
      showTooltips: false,
      sidebarCollapsedByDefault: true,
      backgroundMode: 'custom',
    })
  })

  it('normalizes editor font family', () => {
    const normalized = normalizeUserSettings({
      ui: { editorFontFamily: 'consolas' },
    })
    expect(normalized.ui.editorFontFamily).toBe('consolas')
    expect(normalizeUserSettings({ ui: { editorFontFamily: 'nope' } }).ui.editorFontFamily).toBe(
      'jetbrains'
    )
  })

  it('exports and imports custom background with settings', () => {
    const settings = cloneUserSettings(DEFAULT_USER_SETTINGS)
    settings.ui.backgroundMode = 'custom'
    settings.ui.theme = 'dark'
    const dataUrl = 'data:image/png;base64,abc'
    const bundle = buildUserSettingsExport(settings, dataUrl)
    expect(bundle.version).toBe(1)
    expect(bundle.customPageBackground).toBe(dataUrl)

    const parsed = parseImportedUserSettings(bundle)
    expect(parsed?.settings.ui.theme).toBe('dark')
    expect(parsed?.settings.ui.backgroundMode).toBe('custom')
    expect(parsed?.customPageBackground).toBe(dataUrl)
  })

  it('parses legacy flat settings exports', () => {
    const legacy = { ...cloneUserSettings(DEFAULT_USER_SETTINGS), ui: { ...DEFAULT_USER_SETTINGS.ui, theme: 'dark' } }
    const parsed = parseImportedUserSettings(legacy)
    expect(parsed?.settings.ui.theme).toBe('dark')
    expect(parsed?.customPageBackground).toBeUndefined()
  })
})
