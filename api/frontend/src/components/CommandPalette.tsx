/**
 * Palette de commandes (Ctrl+K) — recherche + liste filtrable.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface CommandPaletteItem {
  id: string;
  label: string;
  /** Texte additionnel pour la recherche. */
  keywords?: string;
  shortcut?: string;
  disabled?: boolean;
  /** Raison affichée quand l’entrée est désactivée. */
  disabledReason?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandPaletteItem[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function filterCommandItems(
  items: CommandPaletteItem[],
  query: string
): CommandPaletteItem[] {
  const q = normalize(query.trim());
  if (!q) return items;
  const parts = q.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const hay = normalize(`${item.label} ${item.keywords ?? ''} ${item.id}`);
    return parts.every((p) => hay.includes(p));
  });
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  items,
}) => {
  const t = useT();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => filterCommandItems(items, query), [items, query]);

  useFocusTrap(panelRef, open, { initialFocusRef: inputRef });

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
      return;
    }
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-cmd-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, filtered.length]);

  if (!open) return null;

  const runAt = (index: number) => {
    const item = filtered[index];
    if (!item || item.disabled) return;
    onClose();
    // Laisser fermer le dialog avant d’ouvrir une autre UI.
    window.requestAnimationFrame(() => item.run());
  };

  return (
    <div className="command-palette-overlay" onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label={t('cmd.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="command-palette-search">
          <input
            ref={inputRef}
            className="command-palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cmd.placeholder')}
            aria-label={t('cmd.placeholder')}
            aria-controls="command-palette-list"
            aria-activedescendant={
              filtered[activeIndex] ? `cmd-item-${filtered[activeIndex].id}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!filtered.length) return;
                setActiveIndex((i) => (i + 1) % filtered.length);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!filtered.length) return;
                setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runAt(activeIndex);
              } else if (e.key === 'Home') {
                e.preventDefault();
                setActiveIndex(0);
              } else if (e.key === 'End') {
                e.preventDefault();
                if (filtered.length) setActiveIndex(filtered.length - 1);
              }
            }}
          />
          <kbd className="command-palette-kbd-hint">Esc</kbd>
        </div>
        <ul
          id="command-palette-list"
          ref={listRef}
          className="command-palette-list"
          role="listbox"
          aria-label={t('cmd.results')}
        >
          {filtered.length === 0 ? (
            <li className="command-palette-empty">{t('cmd.empty')}</li>
          ) : (
            filtered.map((item, index) => (
              <li key={item.id} role="none">
                <button
                  type="button"
                  id={`cmd-item-${item.id}`}
                  data-cmd-index={index}
                  role="option"
                  aria-selected={index === activeIndex}
                  aria-disabled={item.disabled || undefined}
                  disabled={item.disabled}
                  className={`command-palette-item${index === activeIndex ? ' is-active' : ''}`}
                  title={item.disabled ? item.disabledReason : undefined}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runAt(index)}
                >
                  <span className="command-palette-item-main">
                    <span className="command-palette-item-label">{item.label}</span>
                    {item.disabled && item.disabledReason ? (
                      <span className="command-palette-item-reason">{item.disabledReason}</span>
                    ) : null}
                  </span>
                  {item.shortcut ? (
                    <kbd className="command-palette-item-keys">{item.shortcut}</kbd>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};
