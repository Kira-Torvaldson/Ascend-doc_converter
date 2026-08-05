/**
 * ============================================================================
 * COMPONENT: FormatSelector — listbox formats (disponibles / bientôt)
 * ============================================================================
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FormatType } from '../types';
import { getFormatTitle } from '../utils/formatHelpers';

const COMING_SOON: FormatType[] = ['pdf', 'yaml', 'json'];

interface FormatSelectorProps {
  label: string;
  value: FormatType;
  onChange: (format: FormatType) => void;
  /** Formats disponibles (sélectionnables) */
  formats?: FormatType[];
  /** Formats listés mais désactivés */
  comingSoon?: FormatType[];
  disabled?: boolean;
  id?: string;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  label,
  value,
  onChange,
  formats = ['asciidoc', 'markdown', 'html', 'txt'],
  comingSoon = COMING_SOON,
  disabled = false,
  id,
}) => {
  const autoId = useId();
  const listboxId = id ?? autoId;
  const labelId = `${listboxId}-label`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectable = formats;

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  const selectFormat = useCallback(
    (format: FormatType) => {
      if (!formats.includes(format)) return;
      onChange(format);
      setOpen(false);
      buttonRef.current?.focus();
    },
    [formats, onChange],
  );

  useEffect(() => {
    if (!open) return;

    const idx = selectable.indexOf(value);
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
  }, [open, value, selectable, close]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const option = listRef.current.querySelector<HTMLElement>(
      `[data-format-index="${activeIndex}"]`,
    );
    option?.scrollIntoView({ block: 'nearest' });
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
      setActiveIndex((i) => Math.min(i + 1, selectable.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(selectable.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const next = selectable[activeIndex];
      if (next) selectFormat(next);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className={`format-selector-group${open ? ' is-open' : ''}`}>
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
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={onTriggerKeyDown}
        >
          <span className="format-select-value">{getFormatTitle(value)}</span>
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
            <div className="format-select-group-label" role="presentation">
              Disponibles
            </div>
            {formats.map((format, index) => {
              const selected = format === value;
              const active = index === activeIndex;
              return (
                <button
                  key={format}
                  type="button"
                  role="option"
                  data-format-index={index}
                  aria-selected={selected}
                  className={`format-select-option${selected ? ' is-selected' : ''}${active ? ' is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectFormat(format)}
                >
                  <span>{getFormatTitle(format)}</span>
                  {selected && <span className="format-select-check" aria-hidden="true" />}
                </button>
              );
            })}

            {comingSoon.length > 0 && (
              <>
                <div className="format-select-group-label format-select-group-label--soon" role="presentation">
                  Bientôt
                </div>
                {comingSoon.map((format) => (
                  <div
                    key={format}
                    className="format-select-option is-disabled"
                    aria-disabled="true"
                    title="Bientôt disponible"
                  >
                    <span>{getFormatTitle(format)}</span>
                    <span className="format-select-badge">Bientôt</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
