import { describe, it, expect } from 'vitest';
import {
  DEFAULT_USER_SETTINGS,
  cloneUserSettings,
  areUserSettingsEqual,
  validateUserPrefs,
  applyInterfacePreset,
  matchInterfacePreset,
  resetInterfaceUiSettings,
  resolveThemePreference,
  uiScaleToCssFactor,
  snackbarDurationToMs,
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
      uiScale: 'comfort',
    })
    expect(applyInterfacePreset(ui, 'minimal')).toMatchObject({
      compactMode: true,
      reduceMotion: true,
      showTooltips: false,
      sidebarCollapsedByDefault: true,
      backgroundMode: 'custom',
      uiScale: 'compact',
    })
  })

  it('matches active interface preset and detects custom UI', () => {
    const light = applyInterfacePreset(DEFAULT_USER_SETTINGS.ui, 'light')
    expect(matchInterfacePreset(light)).toBe('light')
    expect(matchInterfacePreset({ ...light, theme: 'auto' })).toBeNull()
  })

  it('resolves theme preference and ui scale factors', () => {
    expect(resolveThemePreference('dark')).toBe('dark')
    expect(resolveThemePreference('default')).toBe('default')
    expect(resolveThemePreference('auto', true)).toBe('dark')
    expect(resolveThemePreference('auto', false)).toBe('default')
    expect(uiScaleToCssFactor('compact')).toBe(0.92)
    expect(uiScaleToCssFactor('comfort')).toBe(1)
    expect(uiScaleToCssFactor('large')).toBe(1.1)
    expect(snackbarDurationToMs('short')).toBe(1600)
    expect(snackbarDurationToMs('normal')).toBe(2800)
    expect(snackbarDurationToMs('long')).toBe(4500)
  })

  it('normalizes new interface chrome preferences', () => {
    const normalized = normalizeUserSettings({
      ui: {
        panelRatio: '60-40',
        panelOrientation: 'stacked',
        accentColor: 'rose',
        backgroundIntensity: 'high',
        editorLineHeight: 'relaxed',
        snackbarDuration: 'long',
        showLineNumbers: false,
        highContrast: true,
        strongFocus: true,
      },
    })
    expect(normalized.ui.panelRatio).toBe('60-40')
    expect(normalized.ui.panelOrientation).toBe('stacked')
    expect(normalized.ui.accentColor).toBe('rose')
    expect(normalizeUserSettings({ ui: { accentColor: 'emerald' } }).ui.accentColor).toBe('emerald')
    expect(normalizeUserSettings({ ui: { accentColor: 'cyan' } }).ui.accentColor).toBe('cyan')
    expect(normalizeUserSettings({ ui: { accentColor: 'sky' } }).ui.accentColor).toBe('sky')
    expect(normalizeUserSettings({ ui: { accentColor: 'orange' } }).ui.accentColor).toBe('orange')
    expect(normalizeUserSettings({ ui: { accentColor: 'fuchsia' } }).ui.accentColor).toBe('fuchsia')
    expect(normalizeUserSettings({ ui: { accentColor: 'ruby' } }).ui.accentColor).toBe('ruby')
    expect(normalizeUserSettings({ ui: { accentColor: 'sapphire' } }).ui.accentColor).toBe('sapphire')
    expect(normalizeUserSettings({ ui: { accentColor: 'amethyst' } }).ui.accentColor).toBe('amethyst')
    expect(normalizeUserSettings({ ui: { accentColor: 'lapis' } }).ui.accentColor).toBe('lapis')
    expect(normalizeUserSettings({ ui: { accentColor: 'opal' } }).ui.accentColor).toBe('opal')
    expect(normalizeUserSettings({ ui: { accentColor: 'tanzanite' } }).ui.accentColor).toBe('tanzanite')
    expect(normalizeUserSettings({ ui: { accentColor: 'tigereye' } }).ui.accentColor).toBe('tigereye')
    expect(normalizeUserSettings({ ui: { accentColor: 'gold' } }).ui.accentColor).toBe('gold')
    expect(normalizeUserSettings({ ui: { accentColor: 'copper' } }).ui.accentColor).toBe('copper')
    expect(normalizeUserSettings({ ui: { accentColor: 'rosegold' } }).ui.accentColor).toBe('rosegold')
    expect(normalized.ui.backgroundIntensity).toBe('high')
    expect(normalized.ui.editorLineHeight).toBe('relaxed')
    expect(normalized.ui.snackbarDuration).toBe('long')
    expect(normalized.ui.showLineNumbers).toBe(false)
    expect(normalized.ui.highContrast).toBe(true)
    expect(normalized.ui.strongFocus).toBe(true)
    expect(
      normalizeUserSettings({
        ui: {
          panelRatio: 'nope',
          accentColor: 'nope',
          backgroundIntensity: 'nope',
          editorLineHeight: 'nope',
          snackbarDuration: 'nope',
          panelDensity: 'nope',
          sidebarPosition: 'nope',
          panelOrientation: 'nope',
        },
      }).ui
    ).toMatchObject({
      panelRatio: '50-50',
      panelOrientation: 'side',
      accentColor: 'blue',
      backgroundIntensity: 'medium',
      editorLineHeight: 'normal',
      snackbarDuration: 'normal',
      showLineNumbers: true,
      highContrast: false,
      strongFocus: false,
      panelDensity: 'comfortable',
      sidebarPosition: 'left',
      syntaxHighlight: false,
    })
  })

  it('normalizes panel density, sidebar position and syntax highlight', () => {
    expect(
      normalizeUserSettings({
        ui: {
          panelDensity: 'spacious',
          sidebarPosition: 'right',
          syntaxHighlight: true,
          linkedScroll: true,
        },
      }).ui
    ).toMatchObject({
      panelDensity: 'spacious',
      sidebarPosition: 'right',
      syntaxHighlight: true,
      linkedScroll: true,
    })
  })

  it('resets interface prefs without touching metrics/warnings', () => {
    const base = normalizeUserSettings({
      ui: {
        theme: 'dark',
        accentColor: 'gold',
        panelDensity: 'spacious',
        sidebarPosition: 'right',
        syntaxHighlight: true,
        showConversionWarnings: false,
        warningsDetailLevel: 'compact',
        metricsBadgeMode: 'total',
        metricsBadgeResetOnView: false,
        backgroundMode: 'custom',
      },
    }).ui
    const reset = resetInterfaceUiSettings(base)
    expect(reset.theme).toBe('default')
    expect(reset.accentColor).toBe('blue')
    expect(reset.panelDensity).toBe('comfortable')
    expect(reset.sidebarPosition).toBe('left')
    expect(reset.syntaxHighlight).toBe(false)
    expect(reset.linkedScroll).toBe(false)
    expect(reset.editorTheme).toBe('inherit')
    expect(reset.backgroundMode).toBe('custom')
    expect(reset.showConversionWarnings).toBe(false)
    expect(reset.warningsDetailLevel).toBe('compact')
    expect(reset.metricsBadgeMode).toBe('total')
    expect(reset.metricsBadgeResetOnView).toBe(false)
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

  it('defaults history on and session metrics badge for new installs', () => {
    expect(DEFAULT_USER_SETTINGS.conversion.saveConversionHistory).toBe(true)
    expect(DEFAULT_USER_SETTINGS.ui.metricsBadgeMode).toBe('session')
    expect(DEFAULT_USER_SETTINGS.ui.showConversionWarnings).toBe(true)
    expect(DEFAULT_USER_SETTINGS.ui.warningsDetailLevel).toBe('detailed')
  })

  it('preserves explicit false for saveConversionHistory while filling new UI prefs', () => {
    const normalized = normalizeUserSettings({
      conversion: { saveConversionHistory: false },
      ui: { theme: 'dark' },
    })
    expect(normalized.conversion.saveConversionHistory).toBe(false)
    expect(normalized.ui.theme).toBe('dark')
    expect(normalized.ui.metricsBadgeMode).toBe('session')
    expect(normalized.ui.showConversionWarnings).toBe(true)
  })

  it('normalizes metrics badge and warnings detail preferences', () => {
    const normalized = normalizeUserSettings({
      ui: {
        metricsBadgeMode: 'total',
        metricsBadgeResetOnView: false,
        warningsDetailLevel: 'compact',
        showConversionWarnings: false,
        theme: 'auto',
        uiScale: 'large',
      },
    })
    expect(normalized.ui.metricsBadgeMode).toBe('total')
    expect(normalized.ui.metricsBadgeResetOnView).toBe(false)
    expect(normalized.ui.warningsDetailLevel).toBe('compact')
    expect(normalized.ui.showConversionWarnings).toBe(false)
    expect(normalized.ui.theme).toBe('auto')
    expect(normalized.ui.uiScale).toBe('large')
    expect(normalizeUserSettings({ ui: { metricsBadgeMode: 'nope' } }).ui.metricsBadgeMode).toBe(
      'session'
    )
    expect(normalizeUserSettings({ ui: { theme: 'nope', uiScale: 'nope' } }).ui).toMatchObject({
      theme: 'default',
      uiScale: 'comfort',
    })
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
