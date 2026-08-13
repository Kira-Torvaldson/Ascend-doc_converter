/**
 * Panneau Paramètres : ouverture, commit, import/export, reset, wipe local.
 */

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { ConversionHistoryItem, ConversionOptions, FormatType } from '../types';
import type { MessageKey } from '../i18n/messages';
import { applyProfileToMetadata } from '../settings/profileIdentity';
import { persistCustomPageBackground } from '../settings/pageBackground';
import {
  type SettingsValidationErrors,
  type UserSettings,
  DEFAULT_USER_SETTINGS,
  USER_SETTINGS_KEY,
  buildUserSettingsExport,
  cloneUserSettings,
  areUserSettingsEqual,
  parseImportedUserSettings,
  persistUserSettings,
  validateUserPrefs,
} from '../settings/userSettings';
import {
  CONVERSION_PROFILES,
  rebuildOptionsFromProfiles,
  sanitizeActiveProfileIds,
} from '../utils/conversionProfiles';
import { persistConversionHistory } from '../utils/conversionHistory';
import { clearSessionDraft } from '../utils/sessionDraft';
import { downloadTextFile } from '../utils/downloadFile';

export const SIDEBAR_COLLAPSED_KEY = 'ascend_sidebar_collapsed';
export const SETTINGS_OPEN_SECTIONS_KEY = 'ascend_settings_open_sections';
export const SETTINGS_ACTIVE_SECTION_KEY = 'ascend_settings_active_section';
export const SETTINGS_SECTION_IDS = [
  'settingsAccount',
  'settingsConversion',
  'settingsInterface',
  'settingsData',
  'settingsMetrics',
] as const;
export const DEFAULT_SETTINGS_SECTION = 'settingsAccount';

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function normalizeSettingsSectionId(id: string): string | null {
  if (id === 'settingsProfil') return 'settingsAccount';
  if (id === 'settingsGeneral') return null;
  if ((SETTINGS_SECTION_IDS as readonly string[]).includes(id)) return id;
  return null;
}

export type UseUserSettingsPanelArgs = {
  userSettings: UserSettings;
  draftSettings: UserSettings;
  pageBgImage: string | null;
  draftPageBgImage: string | null;
  settingsOpen: boolean;
  settingsMinimized: boolean;
  showDiscardSettingsModal: boolean;
  showResetSettingsModal: boolean;
  sourceFormat: FormatType;
  targetFormat: FormatType;
  activeProfileIds: string[];
  conversionHistoryLength: number;
  settingsPanelRef: RefObject<HTMLDivElement>;
  t: TranslateFn;
  showSnackbar: (message: string) => void;
  pickFormatType: (value: string | undefined, fallback: FormatType) => FormatType;
  applyUiPreferencesToDocument: (ui: UserSettings['ui'], customBg?: string | null) => void;
  resetSessionTabs: () => void;
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void;
  setDraftSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void;
  setSettingsErrors: (value: SettingsValidationErrors) => void;
  setPageBgImage: (value: string | null) => void;
  setDraftPageBgImage: (value: string | null) => void;
  setPageBgError: (value: string | null) => void;
  setSettingsOpen: (value: boolean) => void;
  setSettingsMinimized: (value: boolean) => void;
  setSettingsMaximized: (value: boolean) => void;
  setShowDiscardSettingsModal: (value: boolean) => void;
  setShowResetSettingsModal: (value: boolean) => void;
  setShowClearLocalDataModal: (value: boolean) => void;
  setSourceFormat: (format: FormatType) => void;
  setTargetFormat: (format: FormatType) => void;
  setConversionOptions: (
    value: ConversionOptions | ((prev: ConversionOptions) => ConversionOptions)
  ) => void;
  setConversionHistory: (
    value: ConversionHistoryItem[] | ((prev: ConversionHistoryItem[]) => ConversionHistoryItem[])
  ) => void;
  setActiveProfileIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setActiveSettingsSection: (id: string) => void;
  setStatus: (value: string) => void;
};

export function useUserSettingsPanel({
  userSettings,
  draftSettings,
  pageBgImage,
  draftPageBgImage,
  settingsOpen,
  settingsMinimized,
  showDiscardSettingsModal,
  showResetSettingsModal,
  sourceFormat,
  targetFormat,
  activeProfileIds,
  conversionHistoryLength,
  settingsPanelRef,
  t,
  showSnackbar,
  pickFormatType,
  applyUiPreferencesToDocument,
  resetSessionTabs,
  setUserSettings,
  setDraftSettings,
  setSettingsErrors,
  setPageBgImage,
  setDraftPageBgImage,
  setPageBgError,
  setSettingsOpen,
  setSettingsMinimized,
  setSettingsMaximized,
  setShowDiscardSettingsModal,
  setShowResetSettingsModal,
  setShowClearLocalDataModal,
  setSourceFormat,
  setTargetFormat,
  setConversionOptions,
  setConversionHistory,
  setActiveProfileIds,
  setSidebarCollapsed,
  setActiveSettingsSection,
  setStatus,
}: UseUserSettingsPanelArgs) {
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const openSettingsPanel = useCallback(() => {
    setDraftSettings(cloneUserSettings(userSettings));
    setDraftPageBgImage(pageBgImage);
    setPageBgError(null);
    setSettingsErrors({});
    setSettingsMinimized(false);
    setSettingsMaximized(false);
    setSettingsOpen(true);
  }, [
    userSettings,
    pageBgImage,
    setSettingsMinimized,
    setSettingsMaximized,
    setDraftSettings,
    setDraftPageBgImage,
    setPageBgError,
    setSettingsErrors,
    setSettingsOpen,
  ]);

  const forceCloseSettingsPanel = useCallback(() => {
    setShowDiscardSettingsModal(false);
    setSettingsOpen(false);
    setSettingsMinimized(false);
    setSettingsMaximized(false);
    setDraftSettings(cloneUserSettings(userSettings));
    setDraftPageBgImage(pageBgImage);
    setPageBgError(null);
    setSettingsErrors({});
  }, [
    userSettings,
    pageBgImage,
    setSettingsMinimized,
    setSettingsMaximized,
    setShowDiscardSettingsModal,
    setSettingsOpen,
    setDraftSettings,
    setDraftPageBgImage,
    setPageBgError,
    setSettingsErrors,
  ]);

  const closeSettingsPanel = useCallback(
    (opts?: { force?: boolean }) => {
      const dirty = !areUserSettingsEqual(draftSettings, userSettings);
      if (!opts?.force && dirty) {
        setShowDiscardSettingsModal(true);
        return;
      }
      forceCloseSettingsPanel();
    },
    [draftSettings, userSettings, forceCloseSettingsPanel, setShowDiscardSettingsModal]
  );

  useEffect(() => {
    if (!settingsOpen || settingsMinimized || showDiscardSettingsModal || showResetSettingsModal) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSettingsPanel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    settingsOpen,
    settingsMinimized,
    showDiscardSettingsModal,
    showResetSettingsModal,
    closeSettingsPanel,
  ]);

  useEffect(() => {
    if (!settingsOpen || settingsMinimized) return;
    const closeBtn = settingsPanelRef.current?.querySelector('.settings-close-btn') as HTMLElement | null;
    closeBtn?.focus();
    return () => {
      settingsButtonRef.current?.focus();
    };
  }, [settingsOpen, settingsMinimized, settingsPanelRef]);

  useEffect(() => {
    if (!settingsOpen || settingsMinimized || showDiscardSettingsModal || showResetSettingsModal) {
      return;
    }
    const panel = settingsPanelRef.current;
    if (!panel) return;

    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [
    settingsOpen,
    settingsMinimized,
    showDiscardSettingsModal,
    showResetSettingsModal,
    settingsPanelRef,
  ]);

  const commitSettings = useCallback(
    (opts?: { close?: boolean; notify?: boolean }) => {
      const errors = validateUserPrefs({
        displayName: draftSettings.profile.displayName,
        organization: draftSettings.profile.organization,
        defaultLanguage: draftSettings.profile.defaultLanguage,
        signature: draftSettings.profile.signature,
      });
      if (Object.keys(errors).length > 0) {
        setSettingsErrors(errors);
        return false;
      }
      if (draftSettings.ui.backgroundMode === 'custom' && !draftPageBgImage) {
        setPageBgError('Choisissez une image ou basculez vers un autre fond.');
        return false;
      }
      try {
        persistCustomPageBackground(draftPageBgImage);
      } catch (e) {
        setPageBgError(e instanceof Error ? e.message : 'Enregistrement du fond impossible');
        return false;
      }
      const committed = cloneUserSettings(draftSettings);
      setPageBgImage(draftPageBgImage);
      setUserSettings(committed);
      applyUiPreferencesToDocument(committed.ui, draftPageBgImage);
      setConversionOptions((prev) => ({
        ...prev,
        metadata: applyProfileToMetadata(prev.metadata, committed.profile, 'overwrite'),
      }));
      if (
        committed.conversion.defaultSourceFormat &&
        committed.conversion.defaultSourceFormat !== userSettings.conversion.defaultSourceFormat
      ) {
        setSourceFormat(pickFormatType(committed.conversion.defaultSourceFormat, sourceFormat));
      }
      if (
        committed.conversion.defaultOutputFormat &&
        committed.conversion.defaultOutputFormat !== userSettings.conversion.defaultOutputFormat
      ) {
        const srcFmt = pickFormatType(
          committed.conversion.defaultSourceFormat || sourceFormat,
          sourceFormat
        );
        const outFmt = pickFormatType(committed.conversion.defaultOutputFormat, targetFormat);
        if (outFmt !== srcFmt) setTargetFormat(outFmt);
      }

      const defaultProfileId = committed.conversion.defaultProfileId;
      if (
        activeProfileIds.length === 0 &&
        defaultProfileId &&
        CONVERSION_PROFILES.some((p) => p.id === defaultProfileId)
      ) {
        const nextIds = sanitizeActiveProfileIds([defaultProfileId]);
        setActiveProfileIds(nextIds);
        setConversionOptions((prev) => ({
          ...rebuildOptionsFromProfiles(nextIds),
          metadata: applyProfileToMetadata(prev.metadata, committed.profile, 'overwrite'),
        }));
      }

      const limit = committed.conversion.historyLimit;
      if (limit !== userSettings.conversion.historyLimit || conversionHistoryLength > limit) {
        setConversionHistory((prev) => {
          if (prev.length <= limit) return prev;
          const trimmed = prev.slice(0, limit);
          persistConversionHistory(trimmed);
          return trimmed;
        });
      }

      if (committed.ui.sidebarCollapsedByDefault !== userSettings.ui.sidebarCollapsedByDefault) {
        setSidebarCollapsed(committed.ui.sidebarCollapsedByDefault);
        try {
          localStorage.setItem(
            SIDEBAR_COLLAPSED_KEY,
            committed.ui.sidebarCollapsedByDefault ? '1' : '0'
          );
        } catch {
          /* ignore */
        }
      }

      setPageBgError(null);
      setSettingsErrors({});
      if (opts?.notify) {
        setStatus(t('status.settingsApplied'));
        showSnackbar(t('snack.settingsApplied'));
      }
      if (opts?.close) {
        setSettingsMinimized(false);
        setSettingsMaximized(false);
        setSettingsOpen(false);
      }
      return true;
    },
    [
      draftSettings,
      draftPageBgImage,
      applyUiPreferencesToDocument,
      sourceFormat,
      targetFormat,
      userSettings,
      activeProfileIds.length,
      conversionHistoryLength,
      showSnackbar,
      setSettingsMinimized,
      setSettingsMaximized,
      pickFormatType,
      t,
      setSettingsErrors,
      setPageBgError,
      setPageBgImage,
      setUserSettings,
      setConversionOptions,
      setSourceFormat,
      setTargetFormat,
      setActiveProfileIds,
      setConversionHistory,
      setSidebarCollapsed,
      setStatus,
      setSettingsOpen,
    ]
  );

  const applySettings = useCallback(() => {
    commitSettings({ close: false, notify: true });
  }, [commitSettings]);

  const fillMetadataFromProfile = useCallback(() => {
    const errors = validateUserPrefs({
      displayName: draftSettings.profile.displayName,
      organization: draftSettings.profile.organization,
      defaultLanguage: draftSettings.profile.defaultLanguage,
      signature: draftSettings.profile.signature,
    });
    if (Object.keys(errors).length > 0) {
      setSettingsErrors(errors);
      showSnackbar(t('snack.metadataFixAccount'));
      return;
    }
    setConversionOptions((prev) => ({
      ...prev,
      metadata: applyProfileToMetadata(prev.metadata, draftSettings.profile, 'overwrite'),
    }));
    showSnackbar(t('snack.metadataFilled'));
  }, [draftSettings.profile, showSnackbar, t, setSettingsErrors, setConversionOptions]);

  const resetSettingsToDefaults = useCallback(() => {
    setDraftSettings(cloneUserSettings(DEFAULT_USER_SETTINGS));
    setDraftPageBgImage(null);
    setPageBgError(null);
    setSettingsErrors({});
    setShowResetSettingsModal(false);
    setStatus(t('snack.draftReset'));
  }, [t, setDraftSettings, setDraftPageBgImage, setPageBgError, setSettingsErrors, setShowResetSettingsModal, setStatus]);

  const requestResetSettings = useCallback(() => {
    setShowResetSettingsModal(true);
  }, [setShowResetSettingsModal]);

  const exportUserSettingsFile = useCallback(() => {
    const bundle = buildUserSettingsExport(userSettings, pageBgImage);
    downloadTextFile(
      `ascend-settings-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(bundle, null, 2),
      'application/json;charset=utf-8'
    );
    showSnackbar(t('snack.prefsExported'));
  }, [userSettings, pageBgImage, showSnackbar, t]);

  const importUserSettingsFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const imported = parseImportedUserSettings(parsed);
        if (!imported) {
          showSnackbar(t('snack.prefsInvalid'));
          return;
        }
        setDraftSettings(imported.settings);
        if (imported.customPageBackground !== undefined) {
          setDraftPageBgImage(imported.customPageBackground);
        }
        setPageBgError(null);
        setSettingsErrors({});
        showSnackbar(t('snack.prefsImported'));
      } catch {
        showSnackbar(t('snack.prefsImportFail'));
      }
    },
    [showSnackbar, t, setDraftSettings, setDraftPageBgImage, setPageBgError, setSettingsErrors]
  );

  const clearLocalData = useCallback(() => {
    clearSessionDraft();
    try {
      localStorage.removeItem('ascend_conversion_history');
      localStorage.removeItem(USER_SETTINGS_KEY);
      localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
      localStorage.removeItem(SETTINGS_OPEN_SECTIONS_KEY);
      localStorage.removeItem(SETTINGS_ACTIVE_SECTION_KEY);
      localStorage.removeItem('ascend_settings_open_section');
      localStorage.removeItem('ascend_history_window_geometry');
      localStorage.removeItem('ascend_history_window_filters');
      localStorage.removeItem('ascend_history_collapsed_groups');
    } catch {
      /* ignore */
    }
    try {
      persistCustomPageBackground(null);
    } catch {
      /* ignore */
    }
    const defaults = cloneUserSettings(DEFAULT_USER_SETTINGS);
    persistUserSettings(defaults);
    setUserSettings(defaults);
    setDraftSettings(defaults);
    setDraftPageBgImage(null);
    setPageBgImage(null);
    setPageBgError(null);
    setSettingsErrors({});
    setConversionHistory([]);
    setActiveProfileIds([]);
    setConversionOptions({});
    resetSessionTabs();
    setSidebarCollapsed(false);
    setActiveSettingsSection(DEFAULT_SETTINGS_SECTION);
    applyUiPreferencesToDocument(defaults.ui, null);
    setShowClearLocalDataModal(false);
    setStatus(t('status.localCleared'));
    showSnackbar(t('snack.localCleared'));
  }, [
    applyUiPreferencesToDocument,
    resetSessionTabs,
    showSnackbar,
    t,
    setUserSettings,
    setDraftSettings,
    setDraftPageBgImage,
    setPageBgImage,
    setPageBgError,
    setSettingsErrors,
    setConversionHistory,
    setActiveProfileIds,
    setConversionOptions,
    setSidebarCollapsed,
    setActiveSettingsSection,
    setShowClearLocalDataModal,
    setStatus,
  ]);

  return {
    settingsButtonRef,
    openSettingsPanel,
    forceCloseSettingsPanel,
    closeSettingsPanel,
    commitSettings,
    applySettings,
    fillMetadataFromProfile,
    resetSettingsToDefaults,
    requestResetSettings,
    exportUserSettingsFile,
    importUserSettingsFile,
    clearLocalData,
  };
}
