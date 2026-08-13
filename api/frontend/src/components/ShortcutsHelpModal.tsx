/**
 * Panneau d’aide des raccourcis clavier.
 */

import React, { useEffect } from 'react';
import { useT } from '../i18n/LocaleContext';
import type { MessageKey } from '../i18n/messages';

export interface ShortcutHelpItem {
  label: string;
  keys: string;
}

const SHORTCUT_DEFS: Array<{ key: MessageKey; keys: string }> = [
  { key: 'shortcuts.commandPalette', keys: 'Ctrl + K' },
  { key: 'shortcuts.convert', keys: 'Ctrl + Entrée' },
  { key: 'shortcuts.download', keys: 'Ctrl + S' },
  { key: 'shortcuts.find', keys: 'Ctrl + F' },
  { key: 'shortcuts.goto', keys: 'Ctrl + G' },
  { key: 'shortcuts.diff', keys: 'Ctrl + Maj + D' },
  { key: 'shortcuts.focus', keys: 'Ctrl + Maj + F' },
  { key: 'shortcuts.history', keys: 'Ctrl + H' },
  { key: 'shortcuts.settings', keys: 'Ctrl + ,' },
  { key: 'shortcuts.clearSource', keys: 'Ctrl + Maj + K' },
  { key: 'shortcuts.closeTab', keys: 'Alt + W' },
  { key: 'shortcuts.closeAllTabs', keys: 'Alt + Maj + W' },
  { key: 'shortcuts.help', keys: 'Ctrl + /' },
];

interface ShortcutsHelpModalProps {
  open: boolean;
  onClose: () => void;
  items?: ShortcutHelpItem[];
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  open,
  onClose,
  items,
}) => {
  const t = useT();
  const resolved =
    items ??
    SHORTCUT_DEFS.map((d) => ({
      label: t(d.key),
      keys: d.keys,
    }));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="shortcuts-help-modal-overlay" onClick={onClose}>
      <div
        className="shortcuts-help-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('shortcuts.help')}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shortcuts-help-modal-header">
          <h2>{t('shortcuts.help')}</h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </header>
        <ul className="shortcuts-help-modal-list">
          {resolved.map((item) => (
            <li key={item.keys}>
              <span>{item.label}</span>
              <kbd>{item.keys}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
