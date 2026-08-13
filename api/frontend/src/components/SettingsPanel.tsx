/**
 * Panneau Paramètres (fenêtre flottante).
 */

import React, { useEffect, useRef, useState } from 'react';
import { SidebarListbox } from './SidebarListbox';
import { MetricsSettingsPane } from './MetricsSettingsPane';
import type {
  UserSettings,
  SettingsValidationErrors,
  BackgroundMode,
  HistoryLimit,
  EditorFontFamily,
  InterfacePresetId,
  MetricsBadgeMode,
  WarningsDetailLevel,
  ThemePreference,
  UiScale,
  PanelRatio,
  PanelDensity,
  PanelOrientation,
  EditorThemePreference,
  SidebarPosition,
  BackgroundIntensity,
  EditorLineHeight,
  SnackbarDuration,
  AppLanguage,
} from '../settings/userSettings';
import {
  ACCENT_COLOR_CLASSIC,
  ACCENT_COLOR_GEMSTONES,
  ACCENT_COLOR_METALS,
  applyInterfacePreset,
  matchInterfacePreset,
  MAX_DISPLAY_NAME,
  MAX_ORGANIZATION,
  MAX_SIGNATURE,
  resetAccountProfile,
  resetInterfaceUiSettings,
  resolveThemePreference,
  type AccentColorOption,
} from '../settings/userSettings';
import {
  APP_LANGUAGE_OPTIONS,
  IDENTITY_PRESET_OPTIONS,
  SIGNATURE_TEMPLATES,
  SIGNATURE_VARIABLES,
  applyIdentityPreset,
  clearIdentityPreset,
  formatDocumentSignature,
  getProfileCompleteness,
  getProfileInitials,
  insertSignatureToken,
  isIdentitySlotEmpty,
  profileMatchesSessionMetadata,
  saveCurrentToIdentityPreset,
  summarizeIdentityFields,
  withCustomIdentityIfEdited,
  type MetadataSlice,
} from '../settings/profileIdentity';
import {
  fileToPageBackgroundDataUrl,
  SERVER_BG_URL,
} from '../settings/pageBackground';
import { CONVERSION_PROFILES } from '../utils/conversionProfiles';
import {
  WORKSPACE_PRESETS,
  type WorkspacePresetId,
} from '../utils/workspacePresets';
import { useT } from '../i18n/LocaleContext';
import { languageOptionLabel } from '../i18n/messages';
import type { MessageKey } from '../i18n/messages';
import { useFocusTrap } from '../hooks/useFocusTrap';
import packageJson from '../../package.json';

const SETTINGS_NAV_SECTIONS = [
  { id: 'settingsAccount', labelKey: 'settings.nav.account' },
  { id: 'settingsConversion', labelKey: 'settings.nav.conversion' },
  { id: 'settingsInterface', labelKey: 'settings.nav.interface' },
  { id: 'settingsData', labelKey: 'settings.nav.data' },
  { id: 'settingsMetrics', labelKey: 'settings.nav.metrics' },
] as const satisfies ReadonlyArray<{ id: string; labelKey: MessageKey }>;

const SETTINGS_NAV_FULL_LABEL_KEYS: Record<string, MessageKey> = {
  settingsAccount: 'settings.nav.account',
  settingsConversion: 'settings.nav.conversion',
  settingsInterface: 'settings.nav.interface',
  settingsData: 'settings.nav.data',
  settingsMetrics: 'settings.nav.metrics',
};

const PRESET_LABEL_KEYS = {
  personal: 'preset.personal',
  work: 'preset.work',
  client: 'preset.client',
} as const satisfies Record<string, MessageKey>;

const FORMAT_OPTIONS = [
  { value: '', label: '—' },
  { value: 'asciidoc', label: 'AsciiDoc' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'pdf', label: 'PDF' },
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
  { value: 'txt', label: 'TEXT' },
];

export interface SettingsPanelProps {
  settingsPanelRef: React.RefObject<HTMLDivElement | null>;
  settingsPanelStyle: React.CSSProperties;
  settingsMaximized: boolean;
  isResizingSettings: boolean;
  isDraggingSettings: boolean;
  settingsDirty: boolean;
  draftSettings: UserSettings;
  setDraftSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  settingsErrors: SettingsValidationErrors;
  activeSection: string;
  onSelectSection: (id: string) => void;
  draftPageBgImage: string | null;
  setDraftPageBgImage: React.Dispatch<React.SetStateAction<string | null>>;
  pageBgError: string | null;
  setPageBgError: React.Dispatch<React.SetStateAction<string | null>>;
  pageBgFileInputRef: React.RefObject<HTMLInputElement | null>;
  closeSettingsPanel: () => void;
  applySettings: () => void;
  onResetSettings: () => void;
  onOpenShortcutsHelp: () => void;
  onExportSettings: () => void;
  onImportSettingsFile: (file: File) => void;
  onClearLocalData: () => void;
  onFillMetadataFromProfile: () => void;
  /** Métadonnées de conversion de la session courante (aperçu sync). */
  sessionMetadata?: MetadataSlice;
  /** Applique immédiatement un preset de workspace (split / orientation / focus). */
  onApplyWorkspacePreset?: (id: WorkspacePresetId) => void;
  activeWorkspacePresetId?: WorkspacePresetId | null;
  setSettingsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  setSettingsMaximized: React.Dispatch<React.SetStateAction<boolean>>;
  handleSettingsDragStart: (e: React.MouseEvent) => void;
  handleSettingsResizeStart: (e: React.MouseEvent) => void;
  SETTINGS_MIN_W: number;
  SETTINGS_MIN_H: number;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settingsPanelRef,
  settingsPanelStyle,
  settingsMaximized,
  isResizingSettings,
  isDraggingSettings,
  settingsDirty,
  draftSettings,
  setDraftSettings,
  settingsErrors,
  activeSection,
  onSelectSection,
  draftPageBgImage,
  setDraftPageBgImage,
  pageBgError,
  setPageBgError,
  pageBgFileInputRef,
  closeSettingsPanel,
  applySettings,
  onResetSettings,
  onOpenShortcutsHelp,
  onExportSettings,
  onImportSettingsFile,
  onClearLocalData,
  onFillMetadataFromProfile,
  sessionMetadata,
  onApplyWorkspacePreset,
  activeWorkspacePresetId = null,
  setSettingsMinimized,
  setSettingsMaximized,
  handleSettingsDragStart,
  handleSettingsResizeStart,
  SETTINGS_MIN_W,
  SETTINGS_MIN_H,
}) => {
  const t = useT();
  useFocusTrap(settingsPanelRef, true);
  const importInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLTextAreaElement>(null);
  const [savedPresetFlash, setSavedPresetFlash] = useState<string | null>(null);
  const [signatureCopied, setSignatureCopied] = useState(false);
  const activeInterfacePreset = matchInterfacePreset(draftSettings.ui);
  const resolvedDraftTheme = resolveThemePreference(draftSettings.ui.theme);
  const accountCompleteness = getProfileCompleteness(draftSettings.profile);
  const metadataInSync = profileMatchesSessionMetadata(draftSettings.profile, sessionMetadata);
  const langOptions = APP_LANGUAGE_OPTIONS.map((o) => ({
    value: o.value,
    label: languageOptionLabel(draftSettings.profile.uiLanguage, o.value),
  }));
  const paneTitle = SETTINGS_NAV_FULL_LABEL_KEYS[activeSection]
    ? t(SETTINGS_NAV_FULL_LABEL_KEYS[activeSection])
    : t('settings.title');

  useEffect(() => {
    if (!savedPresetFlash) return;
    const t = window.setTimeout(() => setSavedPresetFlash(null), 1600);
    return () => window.clearTimeout(t);
  }, [savedPresetFlash]);

  useEffect(() => {
    if (!signatureCopied) return;
    const t = window.setTimeout(() => setSignatureCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [signatureCopied]);

  const insertSignatureVar = (token: string) => {
    const el = signatureInputRef.current;
    const current = draftSettings.profile.signature;
    const cursor = el ? el.selectionStart ?? current.length : current.length;
    const next = insertSignatureToken(current, token, cursor);
    setDraftSettings((s) => ({
      ...s,
      profile: withCustomIdentityIfEdited(s.profile, { signature: next }),
    }));
    requestAnimationFrame(() => {
      if (!el) return;
      const pos = cursor + token.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const savePreset = (id: 'personal' | 'work' | 'client') => {
    setDraftSettings((s) => ({
      ...s,
      profile: saveCurrentToIdentityPreset(s.profile, id),
    }));
    setSavedPresetFlash(id);
  };

  return (
  <>
          <div className="settings-overlay floating-window-overlay" onClick={() => closeSettingsPanel()} />
          <div
            ref={settingsPanelRef as React.RefObject<HTMLDivElement>}
            className={[
              'floating-window',
              'floating-window--enter',
              'settings-panel',
              isResizingSettings ? 'settings-panel-resizing' : '',
              isDraggingSettings ? 'settings-panel-dragging' : '',
              settingsMaximized ? 'settings-panel--maximized' : '',
            ].filter(Boolean).join(' ')}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-panel-title"
            onClick={(e) => e.stopPropagation()}
            style={
              settingsMaximized
                ? undefined
                : {
                    ...settingsPanelStyle,
                    minWidth: SETTINGS_MIN_W,
                    minHeight: SETTINGS_MIN_H,
                    zIndex: 10001,
                  }
            }
          >
            <div
              className="floating-window-header floating-window-header--draggable settings-panel-header settings-panel-header-draggable"
              onMouseDown={handleSettingsDragStart}
            >
              <div className="floating-window-title-wrap">
                <h3 id="settings-panel-title" className="floating-window-title">
                  {t('settings.title')}
                  <span
                    className={`settings-sync-badge${settingsDirty ? ' is-pending' : ' is-saved'}`}
                    aria-live="polite"
                  >
                    {settingsDirty ? t('settings.unsaved') : t('settings.saved')}
                  </span>
                </h3>
                <p className="settings-panel-subtitle">v{packageJson.version}</p>
              </div>
              <div className="floating-window-controls">
                <button
                  type="button"
                  className="floating-window-btn floating-window-btn--minimize"
                  onClick={() => setSettingsMinimized(true)}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label={t('settings.minimize')}
                >
                  −
                </button>
                <button
                  type="button"
                  className="floating-window-btn floating-window-btn--maximize"
                  onClick={() => setSettingsMaximized((v) => !v)}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label={settingsMaximized ? t('settings.restore') : t('settings.maximize')}
                >
                  {settingsMaximized ? '⧉' : '□'}
                </button>
                <button
                  type="button"
                  className="floating-window-btn floating-window-btn--close settings-close-btn"
                  onClick={() => closeSettingsPanel()}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label={t('settings.close')}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="settings-panel-content">
              <div className="settings-layout">
                <nav className="settings-rail" aria-label={t("iface.navSections")}>
                  {SETTINGS_NAV_SECTIONS.map((section) => {
                    const selected = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        className={`settings-rail-item${selected ? ' is-active' : ''}`}
                        onClick={() => onSelectSection(section.id)}
                      >
                        {t(section.labelKey)}
                      </button>
                    );
                  })}
                </nav>
                <div
                  className="settings-pane"
                  role="tabpanel"
                  aria-label={paneTitle}
                >
                  <h4 className="settings-pane-title">
                    {paneTitle}
                  </h4>
                  {activeSection === 'settingsAccount' && (
                    <div className="settings-param-body settings-param-body--pane settings-account">
                      <div className="settings-identity-card" aria-live="polite">
                        <div className="settings-identity-avatar-wrap">
                          <div className="settings-identity-avatar" aria-hidden="true">
                            {getProfileInitials(draftSettings.profile.displayName)}
                          </div>
                          <div
                            className="settings-identity-ring"
                            style={{
                              background: `conic-gradient(var(--accent, #3b82f6) ${accountCompleteness.score}%, rgba(148,163,184,0.28) 0)`,
                            }}
                            role="img"
                            aria-label={t('account.complete.aria', { score: accountCompleteness.score })}
                          />
                          <span className="settings-identity-score">{accountCompleteness.score}%</span>
                        </div>
                        <div className="settings-identity-meta">
                          <div className="settings-identity-title-row">
                            <p className="settings-identity-name">
                              {draftSettings.profile.displayName.trim() || t('account.unnamed')}
                            </p>
                            <span
                              className={`settings-identity-badge${
                                draftSettings.profile.activeIdentityPreset === 'custom' ? ' is-custom' : ''
                              }`}
                            >
                              {draftSettings.profile.activeIdentityPreset === 'custom'
                                ? t('preset.custom')
                                : t(PRESET_LABEL_KEYS[draftSettings.profile.activeIdentityPreset])}
                            </span>
                          </div>
                          <p className="settings-identity-line">
                            {[
                              draftSettings.profile.organization.trim() || t('account.noOrg'),
                              t('account.line.account', {
                                code: draftSettings.profile.uiLanguage.toUpperCase(),
                              }),
                              t('account.line.conversion', {
                                code: draftSettings.profile.defaultLanguage.toUpperCase(),
                              }),
                            ].join(' · ')}
                          </p>
                          <div className="settings-identity-chips" aria-label={t('settings.nav.account')}>
                            <span
                              className={`settings-identity-chip${
                                draftSettings.profile.signatureEnabled ? ' is-on' : ''
                              }`}
                            >
                              {draftSettings.profile.signatureEnabled
                                ? t('account.chip.signatureOn')
                                : t('account.chip.signatureOff')}
                            </span>
                            <span
                              className={`settings-identity-chip${
                                draftSettings.conversion.autoApplyUserToMetadata ? ' is-on' : ''
                              }`}
                            >
                              {draftSettings.conversion.autoApplyUserToMetadata
                                ? t('account.chip.autoMetaOn')
                                : t('account.chip.autoMetaOff')}
                            </span>
                            <span className={`settings-identity-chip${metadataInSync ? ' is-on' : ' is-warn'}`}>
                              {metadataInSync ? t('account.chip.sessionSync') : t('account.chip.sessionDiff')}
                            </span>
                          </div>
                          {accountCompleteness.missingKeys.length > 0 && (
                            <p className="settings-identity-missing">
                              {t('account.missing', {
                                list: accountCompleteness.missingKeys
                                  .map((key) => t(key as MessageKey))
                                  .join(', '),
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <section className="settings-iface-group">
                        <h5 className="settings-iface-heading">{t('account.presets')}</h5>
                        <p className="option-hint settings-account-lead">
                          {t('account.presets.hint')}
                        </p>
                        <div className="settings-identity-preset-grid" role="group" aria-label={t('account.presets')}>
                          {IDENTITY_PRESET_OPTIONS.map((preset) => {
                            const slot = draftSettings.profile.identityPresets[preset.id];
                            const isActive = draftSettings.profile.activeIdentityPreset === preset.id;
                            const empty = isIdentitySlotEmpty(slot);
                            const justSaved = savedPresetFlash === preset.id;
                            const presetLabel = t(PRESET_LABEL_KEYS[preset.id]);
                            return (
                              <div
                                key={preset.id}
                                className={`settings-identity-preset-card${isActive ? ' is-active' : ''}${
                                  empty ? ' is-empty' : ''
                                }${justSaved ? ' is-saved-flash' : ''}`}
                              >
                                <button
                                  type="button"
                                  className="settings-identity-preset-load"
                                  aria-pressed={isActive}
                                  onClick={() =>
                                    setDraftSettings((s) => ({
                                      ...s,
                                      profile: applyIdentityPreset(s.profile, preset.id),
                                    }))
                                  }
                                >
                                  <span className="settings-identity-preset-title">{presetLabel}</span>
                                  <span className="settings-identity-preset-summary">
                                    {justSaved
                                      ? t('account.presets.saved')
                                      : empty
                                        ? t('preset.empty')
                                        : summarizeIdentityFields(slot)}
                                  </span>
                                </button>
                                <div className="settings-identity-preset-actions">
                                  <button
                                    type="button"
                                    className="settings-identity-preset-save"
                                    onClick={() => savePreset(preset.id)}
                                    data-tooltip={presetLabel}
                                  >
                                    {justSaved ? 'OK' : t('account.presets.save')}
                                  </button>
                                  <button
                                    type="button"
                                    className="settings-identity-preset-clear"
                                    disabled={empty}
                                    onClick={() =>
                                      setDraftSettings((s) => ({
                                        ...s,
                                        profile: clearIdentityPreset(s.profile, preset.id),
                                      }))
                                    }
                                    data-tooltip={t('account.presets.clear')}
                                  >
                                    {t('account.presets.clear')}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {draftSettings.profile.activeIdentityPreset === 'custom' && (
                          <p className="option-hint">
                            {t('account.presets.customHint')}
                          </p>
                        )}
                      </section>

                      <section className="settings-iface-group">
                        <h5 className="settings-iface-heading">{t('account.identity')}</h5>
                        <div className="settings-fields-grid">
                          <div className="option-group">
                            <div className="settings-field-label-row">
                              <label className="option-label" htmlFor="settings-display-name">{t('account.name')}</label>
                              <span className="settings-char-count">
                                {draftSettings.profile.displayName.length}/{MAX_DISPLAY_NAME}
                              </span>
                            </div>
                            <input
                              id="settings-display-name"
                              type="text"
                              maxLength={MAX_DISPLAY_NAME}
                              value={draftSettings.profile.displayName}
                              onChange={(e) =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  profile: withCustomIdentityIfEdited(s.profile, {
                                    displayName: e.target.value,
                                  }),
                                }))
                              }
                              className={`option-input${settingsErrors.displayName ? ' settings-input-invalid' : ''}`}
                              placeholder={t('account.name.placeholder')}
                              autoComplete="name"
                            />
                            {settingsErrors.displayName && (
                              <span className="settings-field-error" role="alert">{settingsErrors.displayName}</span>
                            )}
                          </div>
                          <div className="option-group">
                            <div className="settings-field-label-row">
                              <label className="option-label" htmlFor="settings-organization">{t('account.org')}</label>
                              <span className="settings-char-count">
                                {draftSettings.profile.organization.length}/{MAX_ORGANIZATION}
                              </span>
                            </div>
                            <input
                              id="settings-organization"
                              type="text"
                              maxLength={MAX_ORGANIZATION}
                              value={draftSettings.profile.organization}
                              onChange={(e) =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  profile: withCustomIdentityIfEdited(s.profile, {
                                    organization: e.target.value,
                                  }),
                                }))
                              }
                              className={`option-input${settingsErrors.organization ? ' settings-input-invalid' : ''}`}
                              placeholder={t('account.org.placeholder')}
                              autoComplete="organization"
                            />
                            {settingsErrors.organization && (
                              <span className="settings-field-error" role="alert">{settingsErrors.organization}</span>
                            )}
                          </div>
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-account-language"
                            label={t('account.language')}
                            value={draftSettings.profile.uiLanguage}
                            options={langOptions}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                profile: { ...s.profile, uiLanguage: next as AppLanguage },
                              }))
                            }
                          />
                          <p className="option-hint">
                            {t('account.language.hint')}
                          </p>
                          {draftSettings.profile.uiLanguage !== 'fr' && (
                            <button
                              type="button"
                              className="settings-inline-link-btn"
                              onClick={() =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  profile: { ...s.profile, uiLanguage: 'fr' },
                                }))
                              }
                            >
                              {t('account.language.resetFr')}
                            </button>
                          )}
                        </div>
                      </section>

                      <section className="settings-iface-group">
                        <h5 className="settings-iface-heading">{t('account.signature')}</h5>
                        <label className="settings-check-card">
                          <input
                            type="checkbox"
                            checked={draftSettings.profile.signatureEnabled}
                            onChange={(e) =>
                              setDraftSettings((s) => ({
                                ...s,
                                profile: { ...s.profile, signatureEnabled: e.target.checked },
                              }))
                            }
                            className="option-checkbox"
                          />
                          <span>{t('account.signature.enable')}</span>
                        </label>
                        <div className="settings-chip-row" role="group" aria-label={t('account.signature.templates')}>
                          {SIGNATURE_TEMPLATES.map((tpl) => (
                            <button
                              key={tpl.id}
                              type="button"
                              className={`settings-mini-chip${
                                draftSettings.profile.signature.trim() === tpl.template ? ' is-active' : ''
                              }`}
                              onClick={() =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  profile: withCustomIdentityIfEdited(s.profile, {
                                    signature: tpl.template,
                                  }),
                                }))
                              }
                            >
                              {tpl.label}
                            </button>
                          ))}
                        </div>
                        <div className="option-group">
                          <div className="settings-field-label-row">
                            <label className="option-label" htmlFor="settings-signature">{t('account.signature.model')}</label>
                            <span className="settings-char-count">
                              {draftSettings.profile.signature.length}/{MAX_SIGNATURE}
                            </span>
                          </div>
                          <div className="settings-chip-row settings-chip-row--tight" role="group" aria-label={t('account.signature.vars')}>
                            {SIGNATURE_VARIABLES.map((v) => (
                              <button
                                key={v.token}
                                type="button"
                                className="settings-mini-chip settings-mini-chip--token"
                                onClick={() => insertSignatureVar(v.token)}
                              >
                                + {v.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            id="settings-signature"
                            ref={signatureInputRef}
                            className={`option-input settings-signature-input${settingsErrors.signature ? ' settings-input-invalid' : ''}`}
                            rows={3}
                            maxLength={MAX_SIGNATURE}
                            value={draftSettings.profile.signature}
                            placeholder={'---\n{name} — {org}\n{date}'}
                            onChange={(e) =>
                              setDraftSettings((s) => ({
                                ...s,
                                profile: withCustomIdentityIfEdited(s.profile, {
                                  signature: e.target.value,
                                }),
                              }))
                            }
                          />
                          {settingsErrors.signature && (
                            <span className="settings-field-error" role="alert">{settingsErrors.signature}</span>
                          )}
                        </div>
                        <div
                          className={`settings-signature-preview-wrap${
                            draftSettings.profile.signatureEnabled ? '' : ' is-disabled'
                          }`}
                        >
                          <div className="settings-field-label-row">
                            <span className="settings-signature-preview-label">{t('account.signature.preview')}</span>
                            <button
                              type="button"
                              className="settings-inline-link-btn"
                              onClick={async () => {
                                const text = formatDocumentSignature(draftSettings.profile);
                                try {
                                  await navigator.clipboard.writeText(text);
                                  setSignatureCopied(true);
                                } catch {
                                  /* ignore */
                                }
                              }}
                            >
                              {signatureCopied ? t('account.signature.copied') : t('account.signature.copy')}
                            </button>
                          </div>
                          <pre className="settings-signature-preview" aria-label={t("iface.signaturePreview")}>
                            {formatDocumentSignature(draftSettings.profile)}
                          </pre>
                        </div>
                      </section>

                      <section className="settings-iface-group">
                        <h5 className="settings-iface-heading">{t('account.meta')}</h5>
                        <div className="settings-metadata-mirror" aria-live="polite">
                          <div className="settings-metadata-mirror-col">
                            <span className="settings-metadata-mirror-label">{t('account.meta.fromAccount')}</span>
                            <ul className="settings-metadata-mirror-list">
                              <li>
                                <strong>{t('account.meta.author')}</strong>
                                {draftSettings.profile.displayName.trim() || '—'}
                              </li>
                              <li>
                                <strong>{t('account.meta.org')}</strong>
                                {draftSettings.profile.organization.trim() || '—'}
                              </li>
                              <li>
                                <strong>{t('account.meta.langConversion')}</strong>
                                {draftSettings.profile.defaultLanguage.toUpperCase()}
                              </li>
                            </ul>
                          </div>
                          <div className="settings-metadata-mirror-col">
                            <span className="settings-metadata-mirror-label">{t('account.meta.session')}</span>
                            <ul className="settings-metadata-mirror-list">
                              <li>
                                <strong>{t('account.meta.author')}</strong>
                                {(sessionMetadata?.author || '').trim() || '—'}
                              </li>
                              <li>
                                <strong>{t('account.meta.org')}</strong>
                                {(sessionMetadata?.organization || '').trim() || '—'}
                              </li>
                              <li>
                                <strong>{t('account.meta.lang')}</strong>
                                {(sessionMetadata?.language || '').trim().toUpperCase() || '—'}
                              </li>
                            </ul>
                          </div>
                        </div>
                        {!metadataInSync && (
                          <p className="option-hint settings-metadata-desync">
                            {t('account.meta.desync')}
                          </p>
                        )}
                        <label className="settings-check-card">
                          <input
                            type="checkbox"
                            checked={draftSettings.conversion.autoApplyUserToMetadata}
                            onChange={(e) =>
                              setDraftSettings((s) => ({
                                ...s,
                                conversion: {
                                  ...s.conversion,
                                  autoApplyUserToMetadata: e.target.checked,
                                },
                              }))
                            }
                            className="option-checkbox"
                          />
                          <span>{t('account.meta.autoApply')}</span>
                        </label>
                        <div className="settings-bg-actions">
                          <button
                            type="button"
                            className="settings-param-reset-btn settings-account-primary-btn"
                            onClick={() => {
                              if (settingsDirty) applySettings();
                              else onFillMetadataFromProfile();
                            }}
                            data-tooltip={
                              settingsDirty
                                ? t('account.meta.applyFillTooltip')
                                : t('account.meta.fillTooltip')
                            }
                          >
                            {settingsDirty ? t('account.meta.applyFill') : t('account.meta.fill')}
                          </button>
                          <button
                            type="button"
                            className="settings-param-reset-btn"
                            onClick={() =>
                              setDraftSettings((s) => ({
                                ...s,
                                profile: resetAccountProfile(s.profile),
                              }))
                            }
                            data-tooltip={t('account.meta.resetIdentityTooltip')}
                          >
                            {t('account.meta.resetIdentity')}
                          </button>
                        </div>
                      </section>
                    </div>
                  )}
                  {activeSection === 'settingsConversion' && (
                    <div className="settings-param-body settings-param-body--pane">
                      <p className="option-hint settings-section-intro">
                        {t('conversion.intro')}
                      </p>
                      <div className="option-group">
                        <SidebarListbox
                          className="settings-listbox"
                          id="settings-conversion-language"
                          label={t('conversion.language')}
                          value={draftSettings.profile.defaultLanguage}
                          options={langOptions}
                          onChange={(next) =>
                            setDraftSettings((s) => ({
                              ...s,
                              profile: withCustomIdentityIfEdited(s.profile, {
                                defaultLanguage: next as AppLanguage,
                              }),
                            }))
                          }
                        />
                        <p className="option-hint">
                          {t('conversion.language.hint')}
                        </p>
                        {draftSettings.profile.defaultLanguage !== 'fr' && (
                          <button
                            type="button"
                            className="settings-inline-link-btn"
                            onClick={() =>
                              setDraftSettings((s) => ({
                                ...s,
                                profile: withCustomIdentityIfEdited(s.profile, {
                                  defaultLanguage: 'fr',
                                }),
                              }))
                            }
                          >
                            {t('conversion.language.resetFr')}
                          </button>
                        )}
                      </div>
                      <div className="settings-fields-grid">
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-default-profile"
                            label={t('conversion.defaultProfile')}
                            value={draftSettings.conversion.defaultProfileId}
                            options={[
                              { value: '', label: '—' },
                              ...CONVERSION_PROFILES.map((p) => ({ value: p.id, label: p.label })),
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                conversion: { ...s.conversion, defaultProfileId: next },
                              }))
                            }
                          />
                          <p className="option-hint">
                            {t('conversion.defaultProfile.hint')}
                          </p>
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-history-limit"
                            label={t('conversion.historyLimit')}
                            value={String(draftSettings.conversion.historyLimit)}
                            options={[
                              { value: '20', label: t('conversion.historyEntries', { count: 20 }) },
                              { value: '50', label: t('conversion.historyEntries', { count: 50 }) },
                              { value: '100', label: t('conversion.historyEntries', { count: 100 }) },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                conversion: {
                                  ...s.conversion,
                                  historyLimit: (Number(next) as HistoryLimit) || 50,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="settings-fields-grid">
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-default-source"
                            label={t('conversion.sourceFormat')}
                            value={draftSettings.conversion.defaultSourceFormat || ''}
                            options={FORMAT_OPTIONS}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                conversion: { ...s.conversion, defaultSourceFormat: next },
                              }))
                            }
                          />
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-default-output"
                            label={t('conversion.outputFormat')}
                            value={draftSettings.conversion.defaultOutputFormat || ''}
                            options={FORMAT_OPTIONS}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                conversion: { ...s.conversion, defaultOutputFormat: next },
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="settings-check-grid">
                        <label className="settings-check-card">
                          <input type="checkbox" checked={draftSettings.conversion.defaultTocEnabled} onChange={(e) => setDraftSettings(s => ({ ...s, conversion: { ...s.conversion, defaultTocEnabled: e.target.checked } }))} className="option-checkbox" />
                          <span>{t('conversion.toc')}</span>
                        </label>
                        <label className="settings-check-card">
                          <input type="checkbox" checked={draftSettings.conversion.saveConversionHistory} onChange={(e) => setDraftSettings(s => ({ ...s, conversion: { ...s.conversion, saveConversionHistory: e.target.checked } }))} className="option-checkbox" />
                          <span>{t('conversion.history')}</span>
                        </label>
                        <label className="settings-check-card">
                          <input type="checkbox" checked={draftSettings.conversion.confirmBeforeConversion} onChange={(e) => setDraftSettings(s => ({ ...s, conversion: { ...s.conversion, confirmBeforeConversion: e.target.checked } }))} className="option-checkbox" />
                          <span>{t('conversion.confirm')}</span>
                        </label>
                        <label className="settings-check-card">
                          <input type="checkbox" checked={draftSettings.conversion.autoApplyUserToMetadata} onChange={(e) => setDraftSettings(s => ({ ...s, conversion: { ...s.conversion, autoApplyUserToMetadata: e.target.checked } }))} className="option-checkbox" />
                          <span>{t('conversion.autoMeta')}</span>
                        </label>
                        <label className="settings-check-card">
                          <input
                            type="checkbox"
                            checked={draftSettings.ui.autoConvertOnIdle}
                            disabled={draftSettings.conversion.confirmBeforeConversion}
                            onChange={(e) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, autoConvertOnIdle: e.target.checked },
                              }))
                            }
                            className="option-checkbox"
                          />
                          <span>{t('conversion.autoConvert')}</span>
                        </label>
                      </div>
                      <p className="option-hint">
                        {t('conversion.history.hint')}
                      </p>
                      <p className="option-hint">
                        {t('conversion.autoConvert.hint')}
                      </p>

                      <h5 className="settings-metrics-heading">{t("conversion.warnings.heading")}</h5>
                      <div className="settings-check-grid">
                        <label className="settings-check-card">
                          <input
                            type="checkbox"
                            checked={draftSettings.ui.showConversionWarnings}
                            onChange={(e) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, showConversionWarnings: e.target.checked },
                              }))
                            }
                            className="option-checkbox"
                          />
                          <span>{t("conversion.warnings.showBanner")}</span>
                        </label>
                      </div>
                      <div className="option-group">
                        <SidebarListbox
                          className="settings-listbox"
                          id="settings-warnings-detail"
                          label={t("conversion.warnings.detailLevel")}
                          value={draftSettings.ui.warningsDetailLevel}
                          options={[
                            { value: 'detailed', label: t('conversion.warnings.detailed') },
                            { value: 'compact', label: t('conversion.warnings.compact') },
                          ]}
                          onChange={(next) =>
                            setDraftSettings((s) => ({
                              ...s,
                              ui: {
                                ...s.ui,
                                warningsDetailLevel: next as WarningsDetailLevel,
                              },
                            }))
                          }
                        />
                        <p className="option-hint">
                          {t('conversion.warnings.hint')}
                        </p>
                      </div>
                    </div>
                  )}
                  {activeSection === 'settingsInterface' && (
                    <div className="settings-param-body settings-param-body--pane settings-iface">
                      <section className="settings-iface-group">
                        <h5 className="settings-iface-heading">{t('iface.appearance')}</h5>
                        <div className="option-group">
                          <label className="option-label">{t("iface.presets")}</label>
                          <div className="settings-presets" role="group" aria-label={t("iface.presets.aria")}>
                            {(
                              [
                                { id: 'light' as const, label: t('iface.presets.light'), swatch: 'light' as const },
                                { id: 'dark' as const, label: t('iface.presets.dark'), swatch: 'dark' as const },
                                { id: 'minimal' as const, label: t('iface.presets.minimal'), swatch: 'minimal' as const },
                              ]
                            ).map((preset) => {
                              const isActive = activeInterfacePreset === preset.id;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  className={`settings-preset-btn${isActive ? ' is-active' : ''}`}
                                  aria-pressed={isActive}
                                  onClick={() =>
                                    setDraftSettings((s) => ({
                                      ...s,
                                      ui: applyInterfacePreset(s.ui, preset.id as InterfacePresetId),
                                    }))
                                  }
                                >
                                  <span
                                    className={`settings-preset-swatch settings-preset-swatch--${preset.swatch}`}
                                    aria-hidden="true"
                                  />
                                  <span>{preset.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="option-hint">
                            {activeInterfacePreset
                              ? t('iface.presets.active', {
                                  name:
                                    activeInterfacePreset === 'light'
                                      ? t('iface.presets.light')
                                      : activeInterfacePreset === 'dark'
                                        ? t('iface.presets.dark')
                                        : t('iface.presets.minimal'),
                                })
                              : t('iface.presets.custom')}
                          </p>
                          <div
                            className={`settings-interface-live-preview settings-interface-live-preview--${resolvedDraftTheme === 'dark' ? 'dark' : 'light'}`}
                            data-ui-scale={draftSettings.ui.uiScale}
                            data-accent={draftSettings.ui.accentColor}
                            data-bg-intensity={draftSettings.ui.backgroundIntensity}
                            data-panel-ratio={draftSettings.ui.panelRatio}
                            data-panel-orientation={draftSettings.ui.panelOrientation}
                            style={{
                              ['--preview-split' as string]: `${draftSettings.ui.panelSplitPercent ?? 50}%`,
                            }}
                            aria-hidden="true"
                          >
                            <div className="settings-interface-live-preview-bar">
                              <span className="settings-interface-live-preview-accent" />
                            </div>
                            <div className="settings-interface-live-preview-body">
                              <div className="settings-interface-live-preview-side" />
                              <div className="settings-interface-live-preview-main">
                                <div className="settings-interface-live-preview-pane" />
                                <div className="settings-interface-live-preview-pane" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="settings-fields-grid">
                          <div className="option-group">
                            <SidebarListbox
                              className="settings-listbox"
                              id="settings-theme"
                              label={t("iface.theme")}
                              value={draftSettings.ui.theme}
                              options={[
                                { value: 'default', label: t('iface.theme.light') },
                                { value: 'dark', label: t('iface.theme.dark') },
                                { value: 'auto', label: t('iface.theme.auto') },
                              ]}
                              onChange={(next) =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  ui: { ...s.ui, theme: next as ThemePreference },
                                }))
                              }
                            />
                            {draftSettings.ui.theme === 'auto' ? (
                              <p className="option-hint">
                                {t('iface.theme.osHint', {
                                  mode: resolvedDraftTheme === 'dark' ? t('iface.theme.osDark') : t('iface.theme.osLight'),
                                })}
                              </p>
                            ) : null}
                          </div>
                          <div className="option-group">
                            <SidebarListbox
                              className="settings-listbox"
                              id="settings-ui-scale"
                              label={t("iface.uiScale")}
                              value={draftSettings.ui.uiScale}
                              options={[
                                { value: 'compact', label: t('iface.uiScale.compact') },
                                { value: 'comfort', label: t('iface.uiScale.comfort') },
                                { value: 'large', label: t('iface.uiScale.large') },
                              ]}
                              onChange={(next) =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  ui: { ...s.ui, uiScale: next as UiScale },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="option-group">
                          <label className="option-label">{t("iface.accent")}</label>
                          {(
                            [
                              { title: t('iface.accent.classic'), options: ACCENT_COLOR_CLASSIC },
                              { title: t('iface.accent.gems'), options: ACCENT_COLOR_GEMSTONES },
                              { title: t('iface.accent.metals'), options: ACCENT_COLOR_METALS },
                            ] as const
                          ).map((group) => (
                            <div key={group.title} className="settings-accent-group">
                              <p className="settings-accent-group-label">{group.title}</p>
                              <div className="settings-accent-row" role="group" aria-label={group.title}>
                                {group.options.map((accent: AccentColorOption) => (
                                  <button
                                    key={accent.id}
                                    type="button"
                                    title={t(`accent.${accent.id}` as 'accent.blue')}
                                    className={`settings-accent-btn settings-accent-btn--${accent.id}${draftSettings.ui.accentColor === accent.id ? ' is-active' : ''}`}
                                    aria-label={t(`accent.${accent.id}` as 'accent.blue')}
                                    aria-pressed={draftSettings.ui.accentColor === accent.id}
                                    onClick={() =>
                                      setDraftSettings((s) => ({
                                        ...s,
                                        ui: { ...s.ui, accentColor: accent.id },
                                      }))
                                    }
                                  >
                                    <span className="settings-accent-dot" aria-hidden="true" />
                                    <span className="settings-accent-label">{t(`accent.${accent.id}` as 'accent.blue')}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="option-group">
                          <div className="option-label">{t('workspace.presets')}</div>
                          <p className="settings-muted workspace-presets-hint">{t('workspace.presets.hint')}</p>
                          <div className="workspace-presets" role="group" aria-label={t('workspace.presets')}>
                            {WORKSPACE_PRESETS.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                className={`workspace-preset-chip${activeWorkspacePresetId === preset.id ? ' is-active' : ''}`}
                                aria-pressed={activeWorkspacePresetId === preset.id}
                                onClick={() => onApplyWorkspacePreset?.(preset.id)}
                                disabled={!onApplyWorkspacePreset}
                                data-tooltip={t(`workspace.preset.${preset.id}.tip` as MessageKey)}
                              >
                                {t(`workspace.preset.${preset.id}` as MessageKey)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-panel-orientation"
                            label={t("iface.panelOrientation")}
                            value={draftSettings.ui.panelOrientation}
                            options={[
                              { value: 'side', label: t('iface.panelOrientation.side') },
                              { value: 'stacked', label: t('iface.panelOrientation.stacked') },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, panelOrientation: next as PanelOrientation },
                              }))
                            }
                          />
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-panel-ratio"
                            label={t("iface.panelRatio")}
                            value={draftSettings.ui.panelRatio}
                            options={[
                              { value: '40-60', label: '40% / 60%' },
                              { value: '50-50', label: '50% / 50%' },
                              { value: '60-40', label: '60% / 40%' },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: {
                                  ...s.ui,
                                  panelRatio: next as PanelRatio,
                                  panelSplitPercent:
                                    next === '40-60' ? 40 : next === '60-40' ? 60 : 50,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-panel-density"
                            label={t("iface.panelDensity")}
                            value={draftSettings.ui.panelDensity}
                            options={[
                              { value: 'compact', label: t('iface.panelDensity.compact') },
                              { value: 'comfortable', label: t('iface.panelDensity.comfort') },
                              { value: 'spacious', label: t('iface.panelDensity.spacious') },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, panelDensity: next as PanelDensity },
                              }))
                            }
                          />
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-sidebar-position"
                            label={t("iface.sidebarPos")}
                            value={draftSettings.ui.sidebarPosition}
                            options={[
                              { value: 'left', label: t('iface.sidebar.left') },
                              { value: 'right', label: t('iface.sidebar.right') },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, sidebarPosition: next as SidebarPosition },
                              }))
                            }
                          />
                        </div>
                      </section>

                      <section className="settings-iface-group">
                        <h5 className="settings-iface-heading">{t('iface.background')}</h5>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-background-mode"
                            label={t("iface.bg.label")}
                            value={draftSettings.ui.backgroundMode}
                            options={[
                              { value: 'default', label: t('iface.bg.decorative') },
                              { value: 'server', label: t('iface.bg.server') },
                              { value: 'custom', label: t('iface.bg.custom') },
                            ]}
                            onChange={(next) => {
                              setPageBgError(null);
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, backgroundMode: next as BackgroundMode },
                              }));
                            }}
                          />
                          {draftSettings.ui.backgroundMode === 'default' && (
                            <div
                              className="settings-bg-live-preview settings-bg-live-preview--default"
                              role="img"
                              aria-label={t('iface.bgPreview.decorative')}
                            />
                          )}
                          {draftSettings.ui.backgroundMode === 'server' && (
                            <div
                              className="settings-bg-live-preview"
                              style={{ backgroundImage: `url("${SERVER_BG_URL}")` }}
                              role="img"
                              aria-label={t('iface.bgPreview.server')}
                            />
                          )}
                          {draftSettings.ui.backgroundMode === 'custom' && (
                            <div className="settings-bg-picker">
                              {draftPageBgImage ? (
                                <div
                                  className="settings-bg-preview"
                                  style={{ backgroundImage: `url("${draftPageBgImage}")` }}
                                  role="img"
                                  aria-label={t('iface.bgPreview.custom')}
                                />
                              ) : (
                                <div className="settings-bg-preview settings-bg-preview--empty">
                                  {t("iface.bg.none")}
                                </div>
                              )}
                              <div className="settings-bg-actions">
                                <input
                                  ref={pageBgFileInputRef as React.RefObject<HTMLInputElement>}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  className="settings-bg-file-input"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = '';
                                    if (!file) return;
                                    try {
                                      setPageBgError(null);
                                      const dataUrl = await fileToPageBackgroundDataUrl(file);
                                      setDraftPageBgImage(dataUrl);
                                    } catch (err) {
                                      setPageBgError(err instanceof Error ? err.message : t('iface.bg.importFail'));
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className="settings-param-reset-btn"
                                  onClick={() => pageBgFileInputRef.current?.click()}
                                >
                                  {t("iface.bg.choose")}
                                </button>
                                {draftPageBgImage && (
                                  <button
                                    type="button"
                                    className="settings-param-reset-btn"
                                    onClick={() => {
                                      setDraftPageBgImage(null);
                                      setPageBgError(null);
                                    }}
                                  >
                                    {t("iface.bg.remove")}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          {pageBgError && (
                            <p className="settings-field-error" role="alert">{pageBgError}</p>
                          )}
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-bg-intensity"
                            label={t("iface.bg.intensity")}
                            value={draftSettings.ui.backgroundIntensity}
                            options={[
                              { value: 'low', label: t('iface.bg.low') },
                              { value: 'medium', label: t('iface.bg.medium') },
                              { value: 'high', label: t('iface.bg.high') },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, backgroundIntensity: next as BackgroundIntensity },
                              }))
                            }
                          />
                        </div>
                      </section>

                      <section className="settings-iface-group">
                        <h5 className="settings-iface-heading">{t('iface.editor')}</h5>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-editor-theme"
                            label={t("iface.editorTheme")}
                            value={draftSettings.ui.editorTheme}
                            options={[
                              { value: 'inherit', label: t('iface.editorTheme.inherit') },
                              { value: 'light', label: t('iface.editorTheme.light') },
                              { value: 'dark', label: t('iface.editorTheme.dark') },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, editorTheme: next as EditorThemePreference },
                              }))
                            }
                          />
                          <p className="option-hint">{t('iface.editorTheme.hint')}</p>
                        </div>
                        <div className="settings-fields-grid">
                          <div className="option-group">
                            <SidebarListbox
                              className="settings-listbox"
                              id="settings-editor-font"
                              label={t("iface.font")}
                              value={draftSettings.ui.editorFontFamily}
                              options={[
                                { value: 'jetbrains', label: 'JetBrains Mono' },
                                { value: 'consolas', label: 'Consolas' },
                                { value: 'system', label: t('iface.font.system') },
                              ]}
                              onChange={(next) =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  ui: {
                                    ...s.ui,
                                    editorFontFamily: next as EditorFontFamily,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="option-group">
                            <SidebarListbox
                              className="settings-listbox"
                              id="settings-editor-line-height"
                              label={t("iface.lineHeight")}
                              value={draftSettings.ui.editorLineHeight}
                              options={[
                                { value: 'tight', label: t('iface.lineHeight.tight') },
                                { value: 'normal', label: t('iface.lineHeight.normal') },
                                { value: 'relaxed', label: t('iface.lineHeight.relaxed') },
                              ]}
                              onChange={(next) =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  ui: { ...s.ui, editorLineHeight: next as EditorLineHeight },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="option-group">
                          <label className="option-label">{t("iface.fontSize")}</label>
                          <div className="settings-font-row">
                            <input
                              type="range"
                              min={8}
                              max={32}
                              value={draftSettings.ui.editorFontSize}
                              onChange={(e) =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  ui: {
                                    ...s.ui,
                                    editorFontSize: Math.min(
                                      32,
                                      Math.max(8, parseInt(e.target.value, 10) || 14)
                                    ),
                                  },
                                }))
                              }
                              className="settings-range"
                            />
                            <span className="settings-font-value">{draftSettings.ui.editorFontSize}px</span>
                          </div>
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-tab-size"
                            label={t("iface.tabs")}
                            value={String(draftSettings.ui.tabSize)}
                            options={[
                              { value: '2', label: t('iface.tabs.2') },
                              { value: '4', label: t('iface.tabs.4') },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, tabSize: next === '2' ? 2 : 4 },
                              }))
                            }
                          />
                        </div>
                        <div className="settings-check-grid">
                            <label className="settings-check-card">
                              <input type="checkbox" checked={draftSettings.ui.showLineNumbers} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, showLineNumbers: e.target.checked } }))} className="option-checkbox" />
                              <span>{t("iface.lineNumbers")}</span>
                            </label>
                            <label className="settings-check-card">
                              <input type="checkbox" checked={draftSettings.ui.editorWordWrap} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, editorWordWrap: e.target.checked } }))} className="option-checkbox" />
                              <span>{t("iface.wordWrap")}</span>
                            </label>
                            <label className="settings-check-card">
                              <input type="checkbox" checked={draftSettings.ui.syntaxHighlight} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, syntaxHighlight: e.target.checked } }))} className="option-checkbox" />
                              <span>{t("iface.syntax")}</span>
                            </label>
                            <label className="settings-check-card">
                              <input type="checkbox" checked={draftSettings.ui.linkedScroll} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, linkedScroll: e.target.checked } }))} className="option-checkbox" />
                              <span>{t("iface.linkedScroll")}</span>
                            </label>
                            <label className="settings-check-card">
                              <input
                                type="checkbox"
                                checked={draftSettings.ui.restoreSessionTabs}
                                onChange={(e) =>
                                  setDraftSettings((s) => ({
                                    ...s,
                                    ui: { ...s.ui, restoreSessionTabs: e.target.checked },
                                  }))
                                }
                                className="option-checkbox"
                              />
                              <span>{t('iface.restoreSessionTabs')}</span>
                            </label>
                          </div>
                      </section>

                      <section className="settings-iface-group">
                        <h5 className="settings-iface-heading">{t('iface.comfort')}</h5>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-snackbar-duration"
                            label={t("iface.snackbar")}
                            value={draftSettings.ui.snackbarDuration}
                            options={[
                              { value: 'short', label: t('iface.snackbar.short') },
                              { value: 'normal', label: t('iface.snackbar.normal') },
                              { value: 'long', label: t('iface.snackbar.long') },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, snackbarDuration: next as SnackbarDuration },
                              }))
                            }
                          />
                        </div>
                        <div className="settings-check-grid">
                          <label className="settings-check-card">
                            <input type="checkbox" checked={draftSettings.ui.showTooltips} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, showTooltips: e.target.checked } }))} className="option-checkbox" />
                            <span>{t("iface.tooltips")}</span>
                          </label>
                          <label className="settings-check-card">
                            <input type="checkbox" checked={draftSettings.ui.sidebarCollapsedByDefault} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, sidebarCollapsedByDefault: e.target.checked } }))} className="option-checkbox" />
                            <span>{t("iface.sidebarCollapsed")}</span>
                          </label>
                          <label className="settings-check-card">
                            <input type="checkbox" checked={draftSettings.ui.compactMode} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, compactMode: e.target.checked } }))} className="option-checkbox" />
                            <span>{t("iface.compactMode")}</span>
                          </label>
                          <label className="settings-check-card">
                            <input type="checkbox" checked={draftSettings.ui.reduceMotion} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, reduceMotion: e.target.checked } }))} className="option-checkbox" />
                            <span>{t("iface.lessMotion")}</span>
                          </label>
                          <label className="settings-check-card">
                            <input type="checkbox" checked={draftSettings.ui.highContrast} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, highContrast: e.target.checked } }))} className="option-checkbox" />
                            <span>{t("iface.highContrast")}</span>
                          </label>
                          <label className="settings-check-card">
                            <input type="checkbox" checked={draftSettings.ui.strongFocus} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, strongFocus: e.target.checked } }))} className="option-checkbox" />
                            <span>{t("iface.strongFocus")}</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          className="settings-param-reset-btn"
                          onClick={onOpenShortcutsHelp}
                        >
                          {t("iface.openShortcuts")}
                        </button>
                        <button
                          type="button"
                          className="settings-param-reset-btn"
                          onClick={() =>
                            setDraftSettings((s) => ({
                              ...s,
                              ui: resetInterfaceUiSettings(s.ui),
                            }))
                          }
                          data-tooltip={t('iface.reset.tooltip')}
                        >
                          {t('iface.reset')}
                        </button>
                      </section>
                    </div>
                  )}
                  {activeSection === 'settingsData' && (
                    <div className="settings-param-body settings-param-body--pane">
                      <div className="settings-bg-actions">
                        <button
                          type="button"
                          className="settings-param-reset-btn"
                          onClick={onExportSettings}
                          data-tooltip={t('data.export.tooltip')}
                        >
                          {t("data.export")}
                        </button>
                        <button
                          type="button"
                          className="settings-param-reset-btn"
                          onClick={() => importInputRef.current?.click()}
                          data-tooltip={t('data.import.tooltip')}
                        >
                          {t("data.import")}
                        </button>
                        <input
                          ref={importInputRef}
                          type="file"
                          accept="application/json,.json"
                          className="settings-bg-file-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (file) onImportSettingsFile(file);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="settings-param-reset-btn"
                        onClick={onClearLocalData}
                        data-tooltip={t('data.clear.tooltip')}
                      >
                        {t("data.clearLocal")}
                      </button>
                    </div>
                  )}
                  {activeSection === 'settingsMetrics' && (
                    <div className="settings-param-body settings-param-body--pane settings-metrics-pane">
                      <div className="option-group">
                        <SidebarListbox
                          className="settings-listbox"
                          id="settings-metrics-badge-mode"
                          label={t("metrics.badge")}
                          value={draftSettings.ui.metricsBadgeMode}
                          options={[
                            { value: 'session', label: t('metrics.badge.session') },
                            { value: 'total', label: t('metrics.badge.total') },
                            { value: 'off', label: t('metrics.badge.off') },
                          ]}
                          onChange={(next) =>
                            setDraftSettings((s) => ({
                              ...s,
                              ui: { ...s.ui, metricsBadgeMode: next as MetricsBadgeMode },
                            }))
                          }
                        />
                        <p className="option-hint">
                          {t('metrics.badge.hint')}
                        </p>
                      </div>
                      <div className="settings-check-grid">
                        <label className="settings-check-card">
                          <input
                            type="checkbox"
                            checked={draftSettings.ui.metricsBadgeResetOnView}
                            onChange={(e) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, metricsBadgeResetOnView: e.target.checked },
                              }))
                            }
                            className="option-checkbox"
                            disabled={draftSettings.ui.metricsBadgeMode !== 'session'}
                          />
                          <span>{t("metrics.badge.reset")}</span>
                        </label>
                      </div>
                      <MetricsSettingsPane />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="settings-panel-footer">
              <div className="settings-footer-actions">
                <button
                  type="button"
                  className="settings-param-reset-btn"
                  onClick={onResetSettings}
                  data-tooltip={t('settings.reset')}
                >
                  {t('settings.reset')}
                </button>
                <button
                  type="button"
                  className="settings-param-apply-btn"
                  disabled={Object.keys(settingsErrors).length > 0 || !settingsDirty}
                  data-tooltip={
                    !settingsDirty ? t('settings.applyDisabled') : t('settings.apply')
                  }
                  onClick={applySettings}
                >
                  {t('settings.apply')}
                </button>
              </div>
            </div>
            {!settingsMaximized && (
              <div
                className="floating-window-resize-handle settings-resize-handle"
                onMouseDown={handleSettingsResizeStart}
                aria-label={t("iface.resize")}
              />
            )}
          </div>
  </>
  );
};
