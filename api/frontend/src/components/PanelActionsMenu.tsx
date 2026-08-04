/**
 * Menu Actions (⋯) pour les en-têtes Source / Résultat
 */

import React, { useEffect, useId, useRef, useState } from 'react';

export interface PanelActionItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface PanelActionsMenuProps {
  items: PanelActionItem[];
  label?: string;
}

export const PanelActionsMenu: React.FC<PanelActionsMenuProps> = ({
  items,
  label = 'Actions',
}) => {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className={`panel-actions-menu${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="panel-header-btn panel-header-btn--muted panel-actions-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        data-tooltip={label}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">⋯</span>
        <span className="sr-only">{label}</span>
      </button>
      {open && (
        <div className="panel-actions-dropdown" id={`${id}-menu`} role="menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={`panel-actions-item${item.danger ? ' is-danger' : ''}`}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onClick();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
