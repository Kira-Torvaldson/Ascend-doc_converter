import { describe, it, expect } from 'vitest'
import {
  applyIdentityPreset,
  applyProfileToMetadata,
  appendDocumentSignature,
  clearIdentityPreset,
  formatDocumentSignature,
  getProfileCompleteness,
  getProfileInitials,
  identityPresetLabel,
  insertSignatureToken,
  profileMatchesSessionMetadata,
  saveCurrentToIdentityPreset,
  summarizeIdentityFields,
  withCustomIdentityIfEdited,
  DEFAULT_IDENTITY_PRESETS,
} from './profileIdentity'
import type { UserSettings } from './userSettings'
import { DEFAULT_USER_SETTINGS, normalizeUserSettings } from './userSettings'

function baseProfile(): UserSettings['profile'] {
  return {
    ...DEFAULT_USER_SETTINGS.profile,
    identityPresets: {
      personal: { ...DEFAULT_IDENTITY_PRESETS.personal },
      work: { ...DEFAULT_IDENTITY_PRESETS.work },
      client: { ...DEFAULT_IDENTITY_PRESETS.client },
    },
  }
}

describe('profileIdentity', () => {
  it('builds initials and summaries', () => {
    expect(getProfileInitials('')).toBe('?')
    expect(getProfileInitials('Ada')).toBe('AD')
    expect(getProfileInitials('Ada Lovelace')).toBe('AL')
    expect(identityPresetLabel('work')).toBe('Pro')
    expect(summarizeIdentityFields({ ...DEFAULT_IDENTITY_PRESETS.personal, displayName: 'Ada', organization: 'Lab' })).toBe(
      'Ada · Lab'
    )
    expect(insertSignatureToken('Hello ', '{name}', 6)).toBe('Hello {name}')
  })

  it('applies and saves identity presets', () => {
    let profile = baseProfile()
    profile = {
      ...profile,
      displayName: 'Alice',
      organization: 'Ascend',
      defaultLanguage: 'en',
      signature: 'sig',
    }
    profile = saveCurrentToIdentityPreset(profile, 'work')
    expect(profile.identityPresets.work.displayName).toBe('Alice')
    expect(profile.activeIdentityPreset).toBe('work')

    profile = {
      ...profile,
      displayName: 'Other',
      activeIdentityPreset: 'custom',
    }
    profile = applyIdentityPreset(profile, 'work')
    expect(profile.displayName).toBe('Alice')
    expect(profile.activeIdentityPreset).toBe('work')
  })

  it('marks custom when edited away from preset', () => {
    let profile = saveCurrentToIdentityPreset(
      { ...baseProfile(), displayName: 'Bob', organization: 'Org' },
      'personal'
    )
    profile = withCustomIdentityIfEdited(profile, { displayName: 'Bobby' })
    expect(profile.activeIdentityPreset).toBe('custom')
    expect(profile.displayName).toBe('Bobby')
  })

  it('formats and appends signature once', () => {
    const profile = {
      displayName: 'Ada',
      organization: 'Lab',
      signature: '{name} / {org}',
      signatureEnabled: true,
    }
    expect(formatDocumentSignature(profile)).toContain('Ada / Lab')
    const once = appendDocumentSignature('body', profile)
    expect(once).toContain('ascend-signature')
    expect(appendDocumentSignature(once, profile)).toBe(once)
  })

  it('applies profile to metadata', () => {
    const profile = { displayName: 'A', organization: 'O', defaultLanguage: 'de' as const }
    expect(applyProfileToMetadata({ title: 'T', author: 'X' }, profile, 'overwrite')).toEqual({
      title: 'T',
      author: 'A',
      organization: 'O',
      language: 'de',
    })
    expect(
      applyProfileToMetadata({ author: 'Keep' }, profile, 'fillEmpty')
    ).toMatchObject({ author: 'Keep', organization: 'O', language: 'de' })
  })

  it('scores completeness and session sync', () => {
    const incomplete = getProfileCompleteness({
      displayName: '',
      organization: '',
      defaultLanguage: 'fr',
      signature: '',
      signatureEnabled: true,
    })
    expect(incomplete.score).toBe(25)
    expect(incomplete.missingKeys).toContain('account.complete.name')
    expect(incomplete.missingKeys).toContain('account.complete.signature')

    const profile = { displayName: 'Ada', organization: 'Lab', defaultLanguage: 'fr' as const }
    expect(profileMatchesSessionMetadata(profile, { author: 'Ada', organization: 'Lab', language: 'fr' })).toBe(true)
    expect(profileMatchesSessionMetadata(profile, { author: 'Other' })).toBe(false)

    const cleared = clearIdentityPreset(
      {
        activeIdentityPreset: 'work' as const,
        identityPresets: {
          personal: { ...DEFAULT_IDENTITY_PRESETS.personal },
          work: { displayName: 'W', organization: 'O', defaultLanguage: 'en' as const, signature: 's' },
          client: { ...DEFAULT_IDENTITY_PRESETS.client },
        },
      },
      'work'
    )
    expect(cleared.identityPresets.work.displayName).toBe('')
    expect(cleared.activeIdentityPreset).toBe('custom')
  })

  it('normalizes new profile fields', () => {
    const normalized = normalizeUserSettings({
      profile: {
        displayName: 'X',
        uiLanguage: 'en',
        signatureEnabled: true,
        activeIdentityPreset: 'work',
        identityPresets: {
          work: { displayName: 'W', organization: 'WO', defaultLanguage: 'es', signature: 's' },
        },
      },
    })
    expect(normalized.profile.uiLanguage).toBe('en')
    expect(normalized.profile.signatureEnabled).toBe(true)
    expect(normalized.profile.activeIdentityPreset).toBe('work')
    expect(normalized.profile.identityPresets.work.displayName).toBe('W')
    expect(normalized.profile.identityPresets.personal.displayName).toBe('')
  })
})
