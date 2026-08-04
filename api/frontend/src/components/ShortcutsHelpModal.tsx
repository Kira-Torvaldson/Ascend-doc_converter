/**
 * Panneau d’aide des raccourcis clavier.
 */

import React, { useEffect } from 'react';

export interface ShortcutHelpItem {
  label: string;
  keys: string;
}

const DEFAULT_SHORTCUTS: ShortcutHelpItem[] = [
  { label: 'Convertir', keys: 'Ctrl + Entrée' },
  { label: 'Télécharger / Sauvegarder', keys: 'Ctrl + S' },
  { label: 'Historique', keys: 'Ctrl + H' },
  { label: 'Effacer la source', keys: 'Ctrl + K' },
  { label: 'Aide (cette fenêtre)', keys: 'Ctrl + /' },
];

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: ShortcutHelpItem[];
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
  shortcuts = DEFAULT_SHORTCUTS,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="settings-overlay floating-window-overlay" onClick={onClose} />
      <div
        className="settings-panel shortcuts-help-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-help-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-panel-header">
          <h3 id="shortcuts-help-title">Raccourcis clavier</h3>
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            data-tooltip="Fermer"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className="settings-panel-content">
          <ul className="shortcuts-help-list">
            {shortcuts.map((item) => (
              <li key={item.keys} className="shortcuts-help-row">
                <span className="shortcuts-help-label">{item.label}</span>
                <kbd className="shortcuts-help-kbd">{item.keys}</kbd>
              </li>
            ))}
          </ul>
          <p className="shortcuts-help-note">Sur macOS, utilisez ⌘ à la place de Ctrl.</p>
        </div>
      </div>
    </>
  );
};
