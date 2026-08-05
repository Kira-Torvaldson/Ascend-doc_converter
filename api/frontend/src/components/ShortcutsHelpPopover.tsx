/**
 * Aide raccourcis compacte (popover header).
 */

import React, { useEffect, useId, useRef } from 'react';

const SHORTCUTS = [
  { label: 'Convertir', keys: 'Ctrl + Entrée' },
  { label: 'Télécharger', keys: 'Ctrl + S' },
  { label: 'Rechercher', keys: 'Ctrl + F' },
  { label: 'Diff source ↔ résultat', keys: 'Ctrl + Maj + D' },
  { label: 'Historique', keys: 'Ctrl + H' },
  { label: 'Paramètres', keys: 'Ctrl + ,' },
  { label: 'Effacer source', keys: 'Ctrl + K' },
  { label: 'Aide', keys: 'Ctrl + /' },
] as const;

interface ShortcutsHelpPopoverProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const ShortcutsHelpPopover: React.FC<ShortcutsHelpPopoverProps> = ({
  open,
  onToggle,
  onClose,
}) => {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className="shortcuts-help-popover-root" ref={rootRef}>
      <button
        type="button"
        className={`settings-button header-icon-btn shortcuts-help-chip${open ? ' is-open' : ''}`}
        onClick={onToggle}
        aria-label="Raccourcis clavier"
        aria-expanded={open}
        aria-controls={panelId}
        data-tooltip="Raccourcis"
      >
        <span className="shortcuts-help-chip-glyph" aria-hidden="true">
          ?
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          className="shortcuts-help-popover"
          role="dialog"
          aria-label="Raccourcis clavier"
        >
          <div className="shortcuts-help-popover-head">
            <span>Raccourcis</span>
            <kbd className="shortcuts-help-kbd">Ctrl + /</kbd>
          </div>
          <ul className="shortcuts-help-popover-list">
            {SHORTCUTS.map((item) => (
              <li key={item.keys}>
                <span>{item.label}</span>
                <kbd className="shortcuts-help-kbd">{item.keys}</kbd>
              </li>
            ))}
          </ul>
          <p className="shortcuts-help-popover-note">macOS : ⌘ à la place de Ctrl</p>
        </div>
      )}
    </div>
  );
};
