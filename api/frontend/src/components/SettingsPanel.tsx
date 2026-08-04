/**
 * Panneau Paramètres (fenêtre flottante).
 */

import React, { useRef } from 'react';
import { SidebarListbox } from './SidebarListbox';
import type {
  UserSettings,
  SettingsValidationErrors,
  BackgroundMode,
  HistoryLimit,
  EditorFontFamily,
  InterfacePresetId,
} from '../settings/userSettings';
import { applyInterfacePreset } from '../settings/userSettings';
import {
  fileToPageBackgroundDataUrl,
  SERVER_BG_URL,
} from '../settings/pageBackground';
import { CONVERSION_PROFILES } from '../utils/conversionProfiles';
import packageJson from '../../package.json';

const SETTINGS_NAV_SECTIONS = [
  { id: 'settingsAccount', label: 'Compte' },
  { id: 'settingsInterface', label: 'Interface' },
  { id: 'settingsData', label: 'Données' },
] as const;

const SETTINGS_NAV_FULL_LABELS: Record<string, string> = {
  settingsAccount: 'Compte & conversion',
  settingsInterface: 'Interface',
  settingsData: 'Données',
};

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
  setSettingsMinimized,
  setSettingsMaximized,
  handleSettingsDragStart,
  handleSettingsResizeStart,
  SETTINGS_MIN_W,
  SETTINGS_MIN_H,
}) => {
  const importInputRef = useRef<HTMLInputElement>(null);

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
                  Paramètres
                  <span
                    className={`settings-sync-badge${settingsDirty ? ' is-pending' : ' is-saved'}`}
                    aria-live="polite"
                  >
                    {settingsDirty ? 'Non enregistré' : 'Enregistré'}
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
                  aria-label="Réduire"
                >
                  −
                </button>
                <button
                  type="button"
                  className="floating-window-btn floating-window-btn--maximize"
                  onClick={() => setSettingsMaximized((v) => !v)}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label={settingsMaximized ? 'Restaurer' : 'Plein écran'}
                >
                  {settingsMaximized ? '⧉' : '□'}
                </button>
                <button
                  type="button"
                  className="floating-window-btn floating-window-btn--close settings-close-btn"
                  onClick={() => closeSettingsPanel()}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Fermer sans appliquer"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="settings-panel-content">
              <div className="settings-layout">
                <nav className="settings-rail" aria-label="Sections des paramètres">
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
                        {section.label}
                      </button>
                    );
                  })}
                </nav>
                <div
                  className="settings-pane"
                  role="tabpanel"
                  aria-label={SETTINGS_NAV_FULL_LABELS[activeSection] || 'Paramètres'}
                >
                  <h4 className="settings-pane-title">
                    {SETTINGS_NAV_FULL_LABELS[activeSection] || 'Paramètres'}
                  </h4>
                  {activeSection === 'settingsAccount' && (
                    <div className="settings-param-body settings-param-body--pane">
                      <div className="settings-fields-grid">
                        <div className="option-group">
                          <label className="option-label">Nom / pseudo</label>
                          <input type="text" value={draftSettings.profile.displayName} onChange={(e) => setDraftSettings(s => ({ ...s, profile: { ...s.profile, displayName: e.target.value } }))} className={`option-input${settingsErrors.displayName ? ' settings-input-invalid' : ''}`} placeholder="Nom ou pseudo" />
                          {settingsErrors.displayName && <span className="settings-field-error" role="alert">{settingsErrors.displayName}</span>}
                        </div>
                        <div className="option-group">
                          <label className="option-label">Organisation</label>
                          <input type="text" value={draftSettings.profile.organization} onChange={(e) => setDraftSettings(s => ({ ...s, profile: { ...s.profile, organization: e.target.value } }))} className={`option-input${settingsErrors.organization ? ' settings-input-invalid' : ''}`} placeholder="Organisation" />
                          {settingsErrors.organization && <span className="settings-field-error" role="alert">{settingsErrors.organization}</span>}
                        </div>
                      </div>
                      <div className="settings-fields-grid">
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-default-language"
                            label="Langue des métadonnées"
                            value={draftSettings.profile.defaultLanguage}
                            options={[
                              { value: 'fr', label: 'Français' },
                              { value: 'en', label: 'Anglais' },
                              { value: 'es', label: 'Espagnol' },
                              { value: 'de', label: 'Allemand' },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                profile: { ...s.profile, defaultLanguage: next as 'fr' | 'en' | 'es' | 'de' },
                              }))
                            }
                          />
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-default-profile"
                            label="Profil par défaut (1er démarrage)"
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
                            Appliqué seulement s’il n’y a aucun profil actif (nouvelle session).
                          </p>
                        </div>
                      </div>
                      <div className="settings-fields-grid">
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-default-source"
                            label="Format source par défaut"
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
                            label="Format de sortie par défaut"
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
                      <div className="option-group">
                        <SidebarListbox
                          className="settings-listbox"
                          id="settings-history-limit"
                          label="Limite d’historique"
                          value={String(draftSettings.conversion.historyLimit)}
                          options={[
                            { value: '20', label: '20 entrées' },
                            { value: '50', label: '50 entrées' },
                            { value: '100', label: '100 entrées' },
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
                      <div className="settings-check-grid">
                        <label className="settings-check-card">
                          <input type="checkbox" checked={draftSettings.conversion.defaultTocEnabled} onChange={(e) => setDraftSettings(s => ({ ...s, conversion: { ...s.conversion, defaultTocEnabled: e.target.checked } }))} className="option-checkbox" />
                          <span>Table des matières par défaut</span>
                        </label>
                        <label className="settings-check-card">
                          <input type="checkbox" checked={draftSettings.conversion.saveConversionHistory} onChange={(e) => setDraftSettings(s => ({ ...s, conversion: { ...s.conversion, saveConversionHistory: e.target.checked } }))} className="option-checkbox" />
                          <span>Conserver l’historique</span>
                        </label>
                        <label className="settings-check-card">
                          <input type="checkbox" checked={draftSettings.conversion.confirmBeforeConversion} onChange={(e) => setDraftSettings(s => ({ ...s, conversion: { ...s.conversion, confirmBeforeConversion: e.target.checked } }))} className="option-checkbox" />
                          <span>Confirmer avant conversion</span>
                        </label>
                        <label className="settings-check-card">
                          <input type="checkbox" checked={draftSettings.conversion.autoApplyUserToMetadata} onChange={(e) => setDraftSettings(s => ({ ...s, conversion: { ...s.conversion, autoApplyUserToMetadata: e.target.checked } }))} className="option-checkbox" />
                          <span>Appliquer le profil aux métadonnées</span>
                        </label>
                      </div>
                    </div>
                  )}
                  {activeSection === 'settingsInterface' && (
                    <div className="settings-param-body settings-param-body--pane">

                      <div className="option-group">
                        <label className="option-label">Présets</label>
                        <div className="settings-presets">
                          {(
                            [
                              { id: 'light', label: 'Clair' },
                              { id: 'dark', label: 'Sombre' },
                              { id: 'minimal', label: 'Minimal' },
                            ] as const
                          ).map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              className="settings-preset-btn"
                              onClick={() =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  ui: applyInterfacePreset(s.ui, preset.id as InterfacePresetId),
                                }))
                              }
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="settings-fields-grid">
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-theme"
                            label="Thème"
                            value={draftSettings.ui.theme}
                            options={[
                              { value: 'default', label: 'Par défaut' },
                              { value: 'dark', label: 'Sombre' },
                            ]}
                            onChange={(next) =>
                              setDraftSettings((s) => ({
                                ...s,
                                ui: { ...s.ui, theme: next as 'default' | 'dark' },
                              }))
                            }
                          />
                        </div>
                        <div className="option-group">
                          <SidebarListbox
                            className="settings-listbox"
                            id="settings-editor-font"
                            label="Police éditeur"
                            value={draftSettings.ui.editorFontFamily}
                            options={[
                              { value: 'jetbrains', label: 'JetBrains Mono' },
                              { value: 'consolas', label: 'Consolas' },
                              { value: 'system', label: 'Système' },
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
                      </div>
                      <div className="option-group">
                        <SidebarListbox
                          className="settings-listbox"
                          id="settings-background-mode"
                          label="Fond d’écran"
                          value={draftSettings.ui.backgroundMode}
                          options={[
                            { value: 'default', label: 'Décoratif (SVG Ascend)' },
                            { value: 'server', label: 'Photo serveur (rafale.jpg)' },
                            { value: 'custom', label: 'Image personnelle' },
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
                            aria-label="Aperçu du fond décoratif"
                          />
                        )}
                        {draftSettings.ui.backgroundMode === 'server' && (
                          <div
                            className="settings-bg-live-preview"
                            style={{ backgroundImage: `url("${SERVER_BG_URL}")` }}
                            role="img"
                            aria-label="Aperçu du fond serveur"
                          />
                        )}
                        {draftSettings.ui.backgroundMode === 'custom' && (
                          <div className="settings-bg-picker">
                            {draftPageBgImage ? (
                              <div
                                className="settings-bg-preview"
                                style={{ backgroundImage: `url("${draftPageBgImage}")` }}
                                role="img"
                                aria-label="Aperçu du fond personnalisé"
                              />
                            ) : (
                              <div className="settings-bg-preview settings-bg-preview--empty">
                                Aucune image
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
                                    setPageBgError(err instanceof Error ? err.message : 'Import impossible');
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="settings-param-reset-btn"
                                onClick={() => pageBgFileInputRef.current?.click()}
                              >
                                Choisir une image…
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
                                  Retirer
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
                        <label className="option-label">Taille police éditeur</label>
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
                      <div className="settings-check-grid">
                        <label className="settings-check-card">
                          <input type="checkbox" checked={draftSettings.ui.editorWordWrap} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, editorWordWrap: e.target.checked } }))} className="option-checkbox" />
                          <span>Retour à la ligne</span>
                        </label>
                        <label className="settings-check-card">
                          <input type="checkbox" checked={draftSettings.ui.showTooltips} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, showTooltips: e.target.checked } }))} className="option-checkbox" />
                          <span>Infobulles au survol</span>
                        </label>
                        <label className="settings-check-card settings-check-card--wide">
                          <input type="checkbox" checked={draftSettings.ui.sidebarCollapsedByDefault} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, sidebarCollapsedByDefault: e.target.checked } }))} className="option-checkbox" />
                          <span>Sidebar repliée au démarrage</span>
                        </label>
                      </div>
                      <details className="settings-advanced">
                        <summary className="settings-advanced-summary">Avancé</summary>
                        <div className="settings-advanced-body">
                          <div className="settings-check-grid">
                            <label className="settings-check-card">
                              <input type="checkbox" checked={draftSettings.ui.compactMode} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, compactMode: e.target.checked } }))} className="option-checkbox" />
                              <span>Mode compact</span>
                            </label>
                            <label className="settings-check-card">
                              <input type="checkbox" checked={draftSettings.ui.reduceMotion} onChange={(e) => setDraftSettings(s => ({ ...s, ui: { ...s.ui, reduceMotion: e.target.checked } }))} className="option-checkbox" />
                              <span>Réduire les animations</span>
                            </label>
                          </div>
                          <div className="option-group">
                            <SidebarListbox
                              className="settings-listbox"
                              id="settings-tab-size"
                              label="Taille des tabulations"
                              value={String(draftSettings.ui.tabSize)}
                              options={[
                                { value: '2', label: '2 espaces' },
                                { value: '4', label: '4 espaces' },
                              ]}
                              onChange={(next) =>
                                setDraftSettings((s) => ({
                                  ...s,
                                  ui: { ...s.ui, tabSize: next === '2' ? 2 : 4 },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </details>
                      <button
                        type="button"
                        className="settings-param-reset-btn"
                        onClick={onOpenShortcutsHelp}
                      >
                        Voir les raccourcis clavier
                      </button>
                    </div>
                  )}
                  {activeSection === 'settingsData' && (
                    <div className="settings-param-body settings-param-body--pane">
                      <div className="settings-bg-actions">
                        <button
                          type="button"
                          className="settings-param-reset-btn"
                          onClick={onExportSettings}
                          data-tooltip="Télécharger les préférences (et le fond perso s’il existe)"
                        >
                          Exporter les préférences
                        </button>
                        <button
                          type="button"
                          className="settings-param-reset-btn"
                          onClick={() => importInputRef.current?.click()}
                          data-tooltip="Importer un JSON de préférences (+ fond si inclus)"
                        >
                          Importer…
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
                        data-tooltip="Effacer historique, brouillon, fond et préférences locales"
                      >
                        Effacer les données locales…
                      </button>
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
                  data-tooltip="Remettre le brouillon aux défauts"
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  className="settings-param-apply-btn"
                  disabled={Object.keys(settingsErrors).length > 0 || !settingsDirty}
                  data-tooltip={
                    Object.keys(settingsErrors).length > 0
                      ? "Corrigez les erreurs avant d'appliquer"
                      : !settingsDirty
                        ? 'Aucun changement'
                        : 'Enregistrer sans fermer'
                  }
                  onClick={applySettings}
                >
                  Appliquer
                </button>
              </div>
            </div>
            {!settingsMaximized && (
              <div
                className="floating-window-resize-handle settings-resize-handle"
                onMouseDown={handleSettingsResizeStart}
                aria-label="Redimensionner"
              />
            )}
          </div>
  </>
  );
};
