/**
 * Actions partagées raccourcis + items de la palette de commandes.
 */

import { useCallback, useMemo } from 'react';
import type { CommandPaletteItem } from '../components';
import type { FormatType } from '../types';
import type { MessageKey } from '../i18n/messages';
import { MAX_SESSION_TABS } from '../utils/sessionDraft';
import { SHORTCUT_TIP } from '../utils/shortcutTips';
import {
  isSupportedUiConversion,
  readResultBuffer,
  supportsRichPreview,
} from '../utils/conversionPairs';
import { WORKSPACE_PRESETS, type WorkspacePresetId } from '../utils/workspacePresets';
import type { AppKeyboardShortcutsHandlers } from './useAppKeyboardShortcuts';

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export type UseAppCommandsArgs = {
  sourceFormat: FormatType;
  targetFormat: FormatType;
  adocInput: string;
  mdOutput: string;
  otherOutput: string;
  loading: boolean;
  folderBatchRunning: boolean;
  isEditingResult: boolean;
  settingsOpen: boolean;
  settingsMinimized: boolean;
  sessionTabCount: number;
  activeSessionTabId: string;
  dirtyTabCount: number;
  folderFileCount: number;
  t: TranslateFn;
  resolveEditorTarget: () => 'source' | 'result';
  handleConvert: () => void;
  handleExport: () => void;
  handleExportZip: () => void;
  handleCopy: () => void | Promise<void>;
  handleClearSource: () => void;
  handleClear: () => void;
  handleSwap: () => void;
  openDiffPanel: () => void;
  toggleFocusMode: () => void;
  toggleHistoryPanel: () => void;
  togglePreviewWindow: () => void;
  toggleLinkedScroll: () => void;
  applyWorkspacePreset: (id: WorkspacePresetId) => void;
  openSettingsPanel: () => void;
  closeSettingsPanel: () => void;
  addSessionTab: () => void;
  closeSessionTab: (id: string) => void;
  closeOtherSessionTabs: (id: string) => void;
  requestCloseAllSessionTabs: () => void;
  startFolderBatch: () => void | Promise<void>;
  setFindTarget: (target: 'source' | 'result') => void;
  setGotoTarget: (target: 'source' | 'result') => void;
  setShowFindReplace: (value: boolean) => void;
  setShowGotoLine: (value: boolean) => void;
  setShowCommandPalette: (value: boolean | ((prev: boolean) => boolean)) => void;
  setShortcutsHelpOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setShowSaveModal: (value: boolean) => void;
  setNavigationEnabled: (value: boolean) => void;
  setNavigationWindowMinimized: (value: boolean) => void;
  setNavigationWindowOpen: (value: boolean) => void;
  setResultZenMode: (value: boolean) => void;
};

export function useAppCommands({
  sourceFormat,
  targetFormat,
  adocInput,
  mdOutput,
  otherOutput,
  loading,
  folderBatchRunning,
  isEditingResult,
  settingsOpen,
  settingsMinimized,
  sessionTabCount,
  activeSessionTabId,
  dirtyTabCount,
  folderFileCount,
  t,
  resolveEditorTarget,
  handleConvert,
  handleExport,
  handleExportZip,
  handleCopy,
  handleClearSource,
  handleClear,
  handleSwap,
  openDiffPanel,
  toggleFocusMode,
  toggleHistoryPanel,
  togglePreviewWindow,
  toggleLinkedScroll,
  applyWorkspacePreset,
  openSettingsPanel,
  closeSettingsPanel,
  addSessionTab,
  closeSessionTab,
  closeOtherSessionTabs,
  requestCloseAllSessionTabs,
  startFolderBatch,
  setFindTarget,
  setGotoTarget,
  setShowFindReplace,
  setShowGotoLine,
  setShowCommandPalette,
  setShortcutsHelpOpen,
  setShowSaveModal,
  setNavigationEnabled,
  setNavigationWindowMinimized,
  setNavigationWindowOpen,
  setResultZenMode,
}: UseAppCommandsArgs) {
  const toggleSettings = useCallback(() => {
    if (settingsOpen && !settingsMinimized) closeSettingsPanel();
    else openSettingsPanel();
  }, [settingsOpen, settingsMinimized, closeSettingsPanel, openSettingsPanel]);

  const openFindReplace = useCallback(() => {
    setFindTarget(resolveEditorTarget());
    setShowGotoLine(false);
    setShowFindReplace(true);
  }, [resolveEditorTarget, setFindTarget, setShowGotoLine, setShowFindReplace]);

  const openGotoLine = useCallback(() => {
    setGotoTarget(resolveEditorTarget());
    setShowFindReplace(false);
    setShowGotoLine(true);
  }, [resolveEditorTarget, setGotoTarget, setShowFindReplace, setShowGotoLine]);

  const toggleHelp = useCallback(() => {
    setShortcutsHelpOpen((v) => !v);
  }, [setShortcutsHelpOpen]);

  const shortcutHandlers: AppKeyboardShortcutsHandlers = {
    onConvert: handleConvert,
    onExport: handleExport,
    onClearSource: handleClearSource,
    onOpenShortcutsHelp: toggleHelp,
    onOpenSettings: toggleSettings,
    onToggleHistory: toggleHistoryPanel,
    onOpenFindReplace: openFindReplace,
    onOpenGotoLine: openGotoLine,
    onOpenDiff: openDiffPanel,
    onToggleFocusMode: toggleFocusMode,
    onOpenCommandPalette: () => setShowCommandPalette((v) => !v),
    onCloseActiveSessionTab: () => closeSessionTab(activeSessionTabId),
    onCloseAllSessionTabs: requestCloseAllSessionTabs,
    isEditingResult,
    onOpenSaveModal: () => setShowSaveModal(true),
    loading: loading || folderBatchRunning,
  };

  const commandPaletteItems = useMemo((): CommandPaletteItem[] => {
    const sourceText = sourceFormat === 'markdown' ? mdOutput : adocInput;
    const resultText = readResultBuffer(sourceFormat, targetFormat, {
      adocInput,
      mdOutput,
      otherOutput,
    });
    const sourceHas = !!sourceText.trim();
    const resultHas = !!resultText.trim();
    const canConvertPair =
      sourceFormat !== targetFormat && isSupportedUiConversion(sourceFormat, targetFormat);
    const canAddTab = sessionTabCount < MAX_SESSION_TABS;
    const convertDisabledReason = loading
      ? t('cmd.reason.converting')
      : !sourceHas
        ? t('cmd.reason.emptySource')
        : !canConvertPair
          ? t('cmd.reason.sameFormat')
          : undefined;

    return [
      {
        id: 'convert',
        label: t('shortcuts.convert'),
        shortcut: SHORTCUT_TIP.convert,
        keywords: 'run go',
        disabled: Boolean(convertDisabledReason),
        disabledReason: convertDisabledReason,
        run: () => handleConvert(),
      },
      {
        id: 'find',
        label: t('shortcuts.find'),
        shortcut: SHORTCUT_TIP.find,
        keywords: 'search rechercher',
        run: openFindReplace,
      },
      {
        id: 'goto',
        label: t('shortcuts.goto'),
        shortcut: SHORTCUT_TIP.goto,
        keywords: 'line ligne',
        run: openGotoLine,
      },
      {
        id: 'diff',
        label: t('shortcuts.diff'),
        shortcut: SHORTCUT_TIP.diff,
        keywords: 'compare',
        disabled: !sourceHas || !resultHas,
        disabledReason:
          !sourceHas && !resultHas
            ? t('cmd.reason.emptyBoth')
            : !sourceHas
              ? t('cmd.reason.emptySource')
              : t('cmd.reason.emptyResult'),
        run: () => openDiffPanel(),
      },
      {
        id: 'focus',
        label: t('shortcuts.focus'),
        shortcut: SHORTCUT_TIP.focus,
        run: () => toggleFocusMode(),
      },
      {
        id: 'history',
        label: t('shortcuts.history'),
        shortcut: SHORTCUT_TIP.history,
        run: () => toggleHistoryPanel(),
      },
      {
        id: 'settings',
        label: t('shortcuts.settings'),
        shortcut: SHORTCUT_TIP.settings,
        run: toggleSettings,
      },
      {
        id: 'navigation',
        label: t('cmd.navigation'),
        keywords: 'headings titres toc',
        run: () => {
          setNavigationEnabled(true);
          setNavigationWindowMinimized(false);
          setNavigationWindowOpen(true);
        },
      },
      {
        id: 'previewDetach',
        label: t('panel.previewDetach'),
        keywords: 'preview aperçu detach flottant window',
        disabled: !resultHas || !supportsRichPreview(targetFormat),
        disabledReason: !resultHas
          ? t('cmd.reason.emptyResult')
          : !supportsRichPreview(targetFormat)
            ? t('cmd.reason.noPreview')
            : undefined,
        run: () => togglePreviewWindow(),
      },
      ...WORKSPACE_PRESETS.map((preset) => ({
        id: `workspace-${preset.id}`,
        label: t(`workspace.preset.${preset.id}` as MessageKey),
        keywords: `layout workspace preset ${preset.id}`,
        run: () => applyWorkspacePreset(preset.id),
      })),
      {
        id: 'swap',
        label: t('convert.swapFormats'),
        keywords: 'échanger swap',
        run: () => handleSwap(),
      },
      {
        id: 'linkedScroll',
        label: t('iface.linkedScroll'),
        keywords: 'scroll sync',
        run: () => toggleLinkedScroll(),
      },
      {
        id: 'newTab',
        label: t('sessionTabs.add'),
        keywords: 'onglet tab',
        disabled: !canAddTab,
        disabledReason: !canAddTab ? t('sessionTabs.max', { max: MAX_SESSION_TABS }) : undefined,
        run: () => addSessionTab(),
      },
      {
        id: 'closeTab',
        label: t('sessionTabs.closeActive'),
        shortcut: SHORTCUT_TIP.closeTab,
        keywords: 'fermer onglet close tab',
        run: () => closeSessionTab(activeSessionTabId),
      },
      {
        id: 'closeOtherTabs',
        label: t('sessionTabs.closeOthers'),
        keywords: 'fermer autres close others',
        disabled: sessionTabCount <= 1,
        disabledReason: sessionTabCount <= 1 ? t('cmd.reason.singleTab') : undefined,
        run: () => closeOtherSessionTabs(activeSessionTabId),
      },
      {
        id: 'closeAllTabs',
        label: t('sessionTabs.closeAll'),
        shortcut: SHORTCUT_TIP.closeAllTabs,
        keywords: 'fermer tous close all',
        disabled: sessionTabCount <= 1 && dirtyTabCount === 0 && !sourceHas && !resultHas,
        disabledReason:
          sessionTabCount <= 1 && dirtyTabCount === 0 && !sourceHas && !resultHas
            ? t('cmd.reason.singleTab')
            : undefined,
        run: () => requestCloseAllSessionTabs(),
      },
      {
        id: 'copy',
        label: t('common.copy'),
        keywords: 'clipboard',
        disabled: !resultHas,
        disabledReason: !resultHas ? t('cmd.reason.emptyResult') : undefined,
        run: () => {
          void handleCopy();
        },
      },
      {
        id: 'export',
        label: t('shortcuts.download'),
        shortcut: SHORTCUT_TIP.download,
        keywords: 'export download',
        disabled: !resultHas,
        disabledReason: !resultHas ? t('cmd.reason.emptyResult') : undefined,
        run: () => handleExport(),
      },
      {
        id: 'exportZip',
        label: t('panel.actions.zip'),
        keywords: 'zip archive',
        disabled: !resultHas && !sourceHas,
        disabledReason: !resultHas && !sourceHas ? t('cmd.reason.emptyBoth') : undefined,
        run: () => handleExportZip(),
      },
      {
        id: 'clearSource',
        label: t('shortcuts.clearSource'),
        shortcut: SHORTCUT_TIP.clearSource,
        keywords: 'effacer delete',
        disabled: !sourceHas,
        disabledReason: !sourceHas ? t('cmd.reason.emptySource') : undefined,
        run: () => handleClearSource(),
      },
      {
        id: 'clearResult',
        label: t('panel.clearResult'),
        keywords: 'effacer delete',
        disabled: !resultHas,
        disabledReason: !resultHas ? t('cmd.reason.emptyResult') : undefined,
        run: () => handleClear(),
      },
      {
        id: 'folderBatch',
        label: t('batch.start'),
        keywords: 'dossier folder batch queue lot',
        disabled: folderBatchRunning || loading || folderFileCount < 2,
        disabledReason: folderBatchRunning
          ? t('cmd.reason.batchRunning')
          : loading
            ? t('cmd.reason.converting')
            : folderFileCount < 2
              ? t('cmd.reason.needFolder')
              : undefined,
        run: () => {
          void startFolderBatch();
        },
      },
      {
        id: 'resultZen',
        label: t('zen.result.enter'),
        keywords: 'zen lecture result fullscreen',
        disabled: !resultHas,
        disabledReason: !resultHas ? t('cmd.reason.emptyResult') : undefined,
        run: () => setResultZenMode(true),
      },
      {
        id: 'help',
        label: t('shortcuts.help'),
        shortcut: SHORTCUT_TIP.help,
        keywords: 'raccourcis shortcuts',
        run: toggleHelp,
      },
    ];
  }, [
    sourceFormat,
    targetFormat,
    adocInput,
    mdOutput,
    otherOutput,
    loading,
    sessionTabCount,
    activeSessionTabId,
    dirtyTabCount,
    t,
    handleConvert,
    openFindReplace,
    openGotoLine,
    openDiffPanel,
    togglePreviewWindow,
    applyWorkspacePreset,
    toggleFocusMode,
    toggleHistoryPanel,
    toggleSettings,
    handleSwap,
    toggleLinkedScroll,
    addSessionTab,
    closeSessionTab,
    closeOtherSessionTabs,
    requestCloseAllSessionTabs,
    handleCopy,
    handleExport,
    handleExportZip,
    handleClearSource,
    handleClear,
    folderFileCount,
    folderBatchRunning,
    startFolderBatch,
    setNavigationEnabled,
    setNavigationWindowMinimized,
    setNavigationWindowOpen,
    setResultZenMode,
    toggleHelp,
  ]);

  return { commandPaletteItems, shortcutHandlers };
}
