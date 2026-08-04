/**
 * Raccourcis clavier Ascend (Ctrl/Cmd).
 */

import { useEffect } from 'react';

export interface AppKeyboardShortcutsHandlers {
  onConvert: () => void;
  onExport: () => void;
  onClearSource: () => void;
  onOpenShortcutsHelp: () => void;
  onToggleHistory: () => void;
  isEditingResult: boolean;
  onOpenSaveModal: () => void;
  loading: boolean;
}

function isEditableTarget(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export function useAppKeyboardShortcuts(handlers: AppKeyboardShortcutsHandlers): void {
  const {
    onConvert,
    onExport,
    onClearSource,
    onOpenShortcutsHelp,
    onToggleHistory,
    isEditingResult,
    onOpenSaveModal,
    loading,
  } = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target;
      const inField = isEditableTarget(target);

      if (inField) {
        if (mod && (e.key === 's' || e.key === 'S')) {
          e.preventDefault();
          if (isEditingResult) onOpenSaveModal();
          return;
        }
        if (mod && e.key === 'Enter') {
          e.preventDefault();
          if (!loading) onConvert();
          return;
        }
        if (mod && e.key === '/') {
          e.preventDefault();
          onOpenShortcutsHelp();
          return;
        }
        if (mod && (e.key === 'h' || e.key === 'H')) {
          e.preventDefault();
          onToggleHistory();
          return;
        }
        return;
      }

      if (!mod) return;

      switch (e.key) {
        case 's':
        case 'S':
          e.preventDefault();
          if (isEditingResult) onOpenSaveModal();
          else onExport();
          break;
        case 'Enter':
          e.preventDefault();
          if (!loading) onConvert();
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          onClearSource();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          onToggleHistory();
          break;
        case '/':
          e.preventDefault();
          onOpenShortcutsHelp();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onConvert,
    onExport,
    onClearSource,
    onOpenShortcutsHelp,
    onToggleHistory,
    isEditingResult,
    onOpenSaveModal,
    loading,
  ]);
}
