/**
 * ============================================================================
 * HOOKS - Exports centralisés des hooks personnalisés
 * ============================================================================
 */

export { useHeadings } from './useHeadings';
export { useFloatingWindow } from './useFloatingWindow';
export { useAppKeyboardShortcuts } from './useAppKeyboardShortcuts';
export { useAppCommands } from './useAppCommands';
export { useFocusTrap } from './useFocusTrap';
export { useFolderBatch } from './useFolderBatch';
export { useFolderBatchStart } from './useFolderBatchStart';
export { useDocumentExport } from './useDocumentExport';
export {
  useUserSettingsPanel,
  normalizeSettingsSectionId,
  SIDEBAR_COLLAPSED_KEY,
  SETTINGS_OPEN_SECTIONS_KEY,
  SETTINGS_ACTIVE_SECTION_KEY,
  SETTINGS_SECTION_IDS,
  DEFAULT_SETTINGS_SECTION,
} from './useUserSettingsPanel';
export { createSessionBootstrap, useSessionTabs } from './useSessionTabs';
export { useSourceImport } from './useSourceImport';
export { useConversionFlow } from './useConversionFlow';
export { useAutoConvertState, useAutoConvertIdle } from './useAutoConvert';
export type { AppKeyboardShortcutsHandlers } from './useAppKeyboardShortcuts';
export type { UseAppCommandsArgs } from './useAppCommands';
export type { UseAutoConvertStateArgs, UseAutoConvertIdleArgs } from './useAutoConvert';
export type {
  UseConversionFlowArgs,
  ConvertRequestSnap,
  LiveEditorSnapshot,
  PendingTokenConversion,
} from './useConversionFlow';
export type {
  SessionBootstrap,
  SessionEditorBuffers,
  UseSessionTabsArgs,
} from './useSessionTabs';
export type { UseFolderBatchStartArgs } from './useFolderBatchStart';
export type { UseDocumentExportArgs } from './useDocumentExport';
export type { UseUserSettingsPanelArgs } from './useUserSettingsPanel';
