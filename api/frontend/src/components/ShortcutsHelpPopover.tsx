/**
 * Aide raccourcis compacte (popover header).
 */

import React, { useEffect, useId, useRef } from 'react';
import { useT } from '../i18n/LocaleContext';
import { withShortcutId } from '../utils/shortcutTips';

const SHORTCUT_KEYS = [
  { key: 'shortcuts.commandPalette' as const, keys: 'Ctrl + K' },
  { key: 'shortcuts.convert' as const, keys: 'Ctrl + Entrée' },
  { key: 'shortcuts.download' as const, keys: 'Ctrl + S' },
  { key: 'shortcuts.find' as const, keys: 'Ctrl + F' },
  { key: 'shortcuts.goto' as const, keys: 'Ctrl + G' },
  { key: 'shortcuts.diff' as const, keys: 'Ctrl + Maj + D' },
  { key: 'shortcuts.focus' as const, keys: 'Ctrl + Maj + F' },
  { key: 'shortcuts.history' as const, keys: 'Ctrl + H' },
  { key: 'shortcuts.settings' as const, keys: 'Ctrl + ,' },
  { key: 'shortcuts.clearSource' as const, keys: 'Ctrl + Maj + K' },
  { key: 'shortcuts.help' as const, keys: 'Ctrl + /' },
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
  const t = useT();
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
        aria-label={withShortcutId(t('shortcuts.title'), 'help')}
        aria-expanded={open}
        aria-controls={panelId}
        data-tooltip={withShortcutId(t('shortcuts.short'), 'help')}
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
          aria-label={t('shortcuts.title')}
        >
          <div className="shortcuts-help-popover-head">
            <span>{t('shortcuts.short')}</span>
            <kbd className="shortcuts-help-kbd">Ctrl + /</kbd>
          </div>
          <ul className="shortcuts-help-popover-list">
            {SHORTCUT_KEYS.map((item) => (
              <li key={item.keys}>
                <span>{t(item.key)}</span>
                <kbd className="shortcuts-help-kbd">{item.keys}</kbd>
              </li>
            ))}
          </ul>
          <p className="shortcuts-help-popover-note">{t('shortcuts.macNote')}</p>
        </div>
      )}
    </div>
  );
};
