/**
 * Barre Recherche / Remplacer (Ctrl+F).
 */

import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../i18n/LocaleContext';

export type FindReplaceTarget = 'source' | 'result';

/** Au-delà, on arrête le scan pour garder la UI fluide. */
const MATCH_CAP = 4_000;

interface FindReplaceBarProps {
  open: boolean;
  onClose: () => void;
  haystack: string;
  onReplaceInTarget: (next: string) => void;
  readOnly?: boolean;
  target: FindReplaceTarget;
  onTargetChange: (target: FindReplaceTarget) => void;
  targetRef?: React.RefObject<HTMLTextAreaElement | null> | null;
}

function revealMatch(
  textarea: HTMLTextAreaElement | null | undefined,
  at: number,
  length: number
): void {
  if (!textarea || at < 0 || length < 0) return;
  try {
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(at, at + length);
    const style = window.getComputedStyle(textarea);
    const lineHeight =
      parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.65 || 20;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    let lineIndex = 0;
    const value = textarea.value;
    for (let i = 0; i < at && i < value.length; i++) {
      if (value.charCodeAt(i) === 10) lineIndex++;
    }
    const targetTop = Math.max(0, lineIndex * lineHeight + paddingTop - lineHeight * 2);
    const viewH = textarea.clientHeight;
    if (targetTop < textarea.scrollTop || targetTop > textarea.scrollTop + viewH - lineHeight * 3) {
      textarea.scrollTop = targetTop;
    }
  } catch {
    /* ignore selection errors on locked fields */
  }
}

function findMatches(haystack: string, query: string): { positions: number[]; capped: boolean } {
  if (!query) return { positions: [], capped: false };
  const positions: number[] = [];
  const step = Math.max(1, query.length);
  let from = 0;
  while (from <= haystack.length) {
    const at = haystack.indexOf(query, from);
    if (at < 0) break;
    positions.push(at);
    if (positions.length >= MATCH_CAP) return { positions, capped: true };
    from = at + step;
  }
  return { positions, capped: false };
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  open,
  onClose,
  haystack,
  onReplaceInTarget,
  readOnly = false,
  target,
  onTargetChange,
  targetRef,
}) => {
  const t = useT();
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const seededOpenRef = useRef(false);

  const deferredQuery = useDeferredValue(query);
  const deferredHaystack = useDeferredValue(haystack);
  const searching = open && (deferredQuery !== query || deferredHaystack !== haystack);

  const { positions: matches, capped } = useMemo(
    () => (open ? findMatches(deferredHaystack, deferredQuery) : { positions: [], capped: false }),
    [open, deferredHaystack, deferredQuery]
  );

  useEffect(() => {
    if (!open) {
      seededOpenRef.current = false;
      return;
    }
    if (!seededOpenRef.current) {
      seededOpenRef.current = true;
      const ta = targetRef?.current;
      if (ta && typeof ta.selectionStart === 'number' && ta.selectionStart !== ta.selectionEnd) {
        const selected = ta.value.slice(ta.selectionStart, ta.selectionEnd);
        if (selected && selected.length <= 200 && !selected.includes('\n')) {
          setQuery(selected);
        }
      }
    }
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, targetRef]);

  useEffect(() => {
    setIndex(0);
  }, [deferredQuery, target]);

  useEffect(() => {
    if (!open || !deferredQuery || !matches.length) return;
    const safeIndex = ((index % matches.length) + matches.length) % matches.length;
    const active = document.activeElement;
    const keepFind = !!(barRef.current && active && barRef.current.contains(active));
    revealMatch(targetRef?.current, matches[safeIndex], deferredQuery.length);
    if (keepFind && active instanceof HTMLElement) {
      active.focus({ preventScroll: true });
    }
  }, [open, deferredQuery, index, matches, targetRef, target]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        if (!matches.length) return;
        setIndex((i) => (i + (e.shiftKey ? -1 : 1) + matches.length) % matches.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, matches.length]);

  if (!open) return null;

  const go = (delta: number) => {
    if (!matches.length) return;
    setIndex((i) => (i + delta + matches.length) % matches.length);
  };

  const replaceOne = () => {
    if (readOnly || !query || !matches.length) return;
    const live = findMatches(haystack, query);
    if (!live.positions.length) return;
    const safeIndex = ((index % live.positions.length) + live.positions.length) % live.positions.length;
    const at = live.positions[safeIndex];
    const next = haystack.slice(0, at) + replacement + haystack.slice(at + query.length);
    onReplaceInTarget(next);
    // Rester sur le même index = occurrence suivante après recalcul
  };

  const replaceAll = () => {
    if (readOnly || !query) return;
    onReplaceInTarget(haystack.split(query).join(replacement));
  };

  const countLabel = !query
    ? '—'
    : searching
      ? '…'
      : `${matches.length ? Math.min(index, matches.length - 1) + 1 : 0}/${matches.length}${capped ? '+' : ''}`;

  return (
    <div className="find-replace-bar" role="search" ref={barRef}>
      <div className="find-replace-target" role="group" aria-label={t('find.target')}>
        <button
          type="button"
          className={`find-replace-target-btn${target === 'source' ? ' is-active' : ''}`}
          onClick={() => onTargetChange('source')}
        >
          {t('find.source')}
        </button>
        <button
          type="button"
          className={`find-replace-target-btn${target === 'result' ? ' is-active' : ''}`}
          onClick={() => onTargetChange('result')}
        >
          {t('find.result')}
        </button>
      </div>
      <input
        ref={inputRef}
        className="find-replace-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('find.search')}
        aria-label={t('find.search.aria')}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'Enter') {
            e.preventDefault();
            go(e.shiftKey ? -1 : 1);
          }
        }}
      />
      {!readOnly && (
        <input
          className="find-replace-input"
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          placeholder={t('find.replacePlaceholder')}
          aria-label={t('find.replaceAria')}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') {
              e.preventDefault();
              replaceOne();
            }
          }}
        />
      )}
      <span className="find-replace-count" aria-live="polite">
        {countLabel}
      </span>
      <button type="button" className="find-replace-btn" onClick={() => go(-1)} disabled={!matches.length}>
        ↑
      </button>
      <button type="button" className="find-replace-btn" onClick={() => go(1)} disabled={!matches.length}>
        ↓
      </button>
      {!readOnly && (
        <>
          <button type="button" className="find-replace-btn" onClick={replaceOne} disabled={!matches.length}>
            {t('find.replace')}
          </button>
          <button type="button" className="find-replace-btn" onClick={replaceAll} disabled={!query}>
            {t('find.replaceAll')}
          </button>
        </>
      )}
      <button type="button" className="find-replace-btn find-replace-btn--close" onClick={onClose} aria-label={t('common.close')}>
        ×
      </button>
    </div>
  );
};
