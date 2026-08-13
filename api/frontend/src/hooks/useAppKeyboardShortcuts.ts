/**
 * Raccourcis clavier Ascend (Ctrl/Cmd).
 */

import { useEffect, useRef } from 'react';

export interface AppKeyboardShortcutsHandlers {
  onConvert: () => void;
  onExport: () => void;
  onClearSource: () => void;
  onOpenShortcutsHelp: () => void;
  onOpenSettings?: () => void;
  onToggleHistory: () => void;
  onOpenFindReplace?: () => void;
  onOpenGotoLine?: () => void;
  onOpenDiff?: () => void;
  onToggleFocusMode?: () => void;
  onOpenCommandPalette?: () => void;
  onCloseActiveSessionTab?: () => void;
  onCloseAllSessionTabs?: () => void;
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
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const h = handlersRef.current;
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target;
      const inField = isEditableTarget(target);

      // Alt+W / Alt+Shift+W — fermer onglet(s) (évite Ctrl+W réservé par le navigateur)
      if (e.altKey && !mod && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        if (e.shiftKey) h.onCloseAllSessionTabs?.();
        else h.onCloseActiveSessionTab?.();
        return;
      }

      if (mod && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        h.onOpenDiff?.();
        return;
      }

      if (mod && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        h.onToggleFocusMode?.();
        return;
      }

      if (mod && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        h.onClearSource();
        return;
      }

      if (mod && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        h.onOpenCommandPalette?.();
        return;
      }

      if (inField) {
        if (mod && (e.key === 's' || e.key === 'S')) {
          e.preventDefault();
          if (h.isEditingResult) h.onOpenSaveModal();
          return;
        }
        if (mod && e.key === 'Enter') {
          e.preventDefault();
          if (!h.loading) h.onConvert();
          return;
        }
        if (mod && (e.key === 'f' || e.key === 'F')) {
          e.preventDefault();
          h.onOpenFindReplace?.();
          return;
        }
        if (mod && (e.key === 'g' || e.key === 'G')) {
          e.preventDefault();
          h.onOpenGotoLine?.();
          return;
        }
        if (mod && e.key === '/') {
          e.preventDefault();
          h.onOpenShortcutsHelp();
          return;
        }
        if (mod && (e.key === 'h' || e.key === 'H')) {
          e.preventDefault();
          h.onToggleHistory();
          return;
        }
        if (mod && e.key === ',') {
          e.preventDefault();
          h.onOpenSettings?.();
          return;
        }
        return;
      }

      if (!mod) return;

      switch (e.key) {
        case 's':
        case 'S':
          e.preventDefault();
          if (h.isEditingResult) h.onOpenSaveModal();
          else h.onExport();
          break;
        case 'Enter':
          e.preventDefault();
          if (!h.loading) h.onConvert();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          h.onToggleHistory();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          h.onOpenFindReplace?.();
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          h.onOpenGotoLine?.();
          break;
        case '/':
          e.preventDefault();
          h.onOpenShortcutsHelp();
          break;
        case ',':
          e.preventDefault();
          h.onOpenSettings?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
