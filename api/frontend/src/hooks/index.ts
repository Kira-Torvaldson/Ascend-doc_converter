/**
 * ============================================================================
 * HOOKS - Exports centralisés des hooks personnalisés
 * ============================================================================
 */

export { useHeadings } from './useHeadings';
export { useFloatingWindow } from './useFloatingWindow';
export { useAppKeyboardShortcuts } from './useAppKeyboardShortcuts';
export { useFocusTrap } from './useFocusTrap';
export { useFolderBatch } from './useFolderBatch';
export { createSessionBootstrap, useSessionTabs } from './useSessionTabs';
export type { AppKeyboardShortcutsHandlers } from './useAppKeyboardShortcuts';
export type {
  SessionBootstrap,
  SessionEditorBuffers,
  UseSessionTabsArgs,
} from './useSessionTabs';
