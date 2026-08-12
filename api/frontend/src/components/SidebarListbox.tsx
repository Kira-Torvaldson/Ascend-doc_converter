/**
 * Listbox sidebar — même style que FormatSelector (options de conversion).
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

export interface SidebarListboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SidebarListboxProps {
  label: string;
  value: string;
  options: SidebarListboxOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  /** Classe extra (ex. settings-listbox) */
  className?: string;
}

export const SidebarListbox: React.FC<SidebarListboxProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
  id,
  className,
}) => {
  const autoId = useId();
  const listboxId = id ?? autoId;
  const labelId = `${listboxId}-label`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  const selectValue = useCallback(
    (next: string) => {
      const option = options.find((o) => o.value === next);
      if (option?.disabled) return;
      onChange(next);
      setOpen(false);
      buttonRef.current?.focus();
    },
    [onChange, options],
  );

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    const focusTimer = window.setTimeout(() => listRef.current?.focus(), 0);

    const onDocPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('mousedown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('mousedown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, value, options, close]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current
      .querySelector<HTMLElement>(`[data-listbox-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const next = options[activeIndex];
      if (next && !next.disabled) selectValue(next.value);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div
      className={`format-selector-group${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
    >
      <span className="format-label" id={labelId}>
        {label}
      </span>
      <div className="format-select-wrap">
        <button
          type="button"
          ref={buttonRef}
          id={listboxId}
          className="format-select format-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={labelId}
          aria-controls={`${listboxId}-list`}
          disabled={disabled || options.length === 0}
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={onTriggerKeyDown}
        >
          <span className="format-select-value">{selectedLabel}</span>
          <span className={`format-select-chevron${open ? ' is-open' : ''}`} aria-hidden="true" />
        </button>

        {open && (
          <div
            ref={listRef}
            id={`${listboxId}-list`}
            className="format-select-menu"
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            onKeyDown={onListKeyDown}
          >
            {options.map((option, index) => {
              const selected = option.value === value;
              const active = index === activeIndex;
              const optionDisabled = Boolean(option.disabled);
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  data-listbox-index={index}
                  aria-selected={selected}
                  aria-disabled={optionDisabled || undefined}
                  disabled={optionDisabled}
                  className={`format-select-option${selected ? ' is-selected' : ''}${active ? ' is-active' : ''}${optionDisabled ? ' is-disabled' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectValue(option.value)}
                >
                  <span>{option.label}</span>
                  {selected && <span className="format-select-check" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
