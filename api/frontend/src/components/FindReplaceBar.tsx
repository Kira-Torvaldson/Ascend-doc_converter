/**
 * Barre Recherche / Remplacer (Ctrl+F) — options Aa / mot / regex.
 */

import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import { findTextMatches, replaceTextMatches, type FindTextOptions } from '../utils/findText';

export type FindReplaceTarget = 'source' | 'result';

interface FindReplaceBarProps {
  open: boolean;
  onClose: () => void;
  haystack: string;
  onReplaceInTarget: (next: string) => void;
  readOnly?: boolean;
  target: FindReplaceTarget;
  onTargetChange: (target: FindReplaceTarget) => void;
  targetRef?: React.RefObject<HTMLTextAreaElement | null> | null;
  onRequestEditResult?: () => void;
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

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  open,
  onClose,
  haystack,
  onReplaceInTarget,
  readOnly = false,
  target,
  onTargetChange,
  targetRef,
  onRequestEditResult,
}) => {
  const t = useT();
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [index, setIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const seededOpenRef = useRef(false);

  const opts: FindTextOptions = useMemo(
    () => ({ caseSensitive, wholeWord, regex }),
    [caseSensitive, wholeWord, regex]
  );

  const deferredQuery = useDeferredValue(query);
  const deferredHaystack = useDeferredValue(haystack);
  const deferredOpts = useDeferredValue(opts);
  const searching =
    open &&
    (deferredQuery !== query ||
      deferredHaystack !== haystack ||
      deferredOpts.caseSensitive !== opts.caseSensitive ||
      deferredOpts.wholeWord !== opts.wholeWord ||
      deferredOpts.regex !== opts.regex);

  const matchResult = useMemo(
    () =>
      open
        ? findTextMatches(deferredHaystack, deferredQuery, deferredOpts)
        : { positions: [] as number[], lengths: [] as number[], capped: false, invalidRegex: false },
    [open, deferredHaystack, deferredQuery, deferredOpts]
  );
  const matches = matchResult.positions;
  const lengths = matchResult.lengths;
  const capped = matchResult.capped;
  const invalidRegex = matchResult.invalidRegex;

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
  }, [deferredQuery, target, deferredOpts]);

  useEffect(() => {
    if (!open || !deferredQuery || !matches.length || invalidRegex) return;
    const safeIndex = ((index % matches.length) + matches.length) % matches.length;
    const active = document.activeElement;
    const keepFind = !!(barRef.current && active && barRef.current.contains(active));
    revealMatch(targetRef?.current, matches[safeIndex], lengths[safeIndex] ?? 0);
    if (keepFind && active instanceof HTMLElement) {
      active.focus({ preventScroll: true });
    }
  }, [open, deferredQuery, index, matches, lengths, targetRef, target, invalidRegex]);

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
    if (readOnly || !query || !matches.length || invalidRegex) return;
    onReplaceInTarget(replaceTextMatches(haystack, query, replacement, opts, 'one', index));
  };

  const replaceAll = () => {
    if (readOnly || !query || invalidRegex) return;
    onReplaceInTarget(replaceTextMatches(haystack, query, replacement, opts, 'all'));
  };

  const countLabel = !query
    ? '—'
    : invalidRegex
      ? t('find.regexInvalid')
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
          data-tooltip={readOnly ? t('panel.locked.tooltip') : undefined}
        >
          {t('find.result')}
        </button>
      </div>
      {readOnly && target === 'result' ? (
        <div className="find-replace-locked" role="note">
          <span>{t('find.resultLocked')}</span>
          {onRequestEditResult ? (
            <button type="button" className="find-replace-unlock-btn" onClick={onRequestEditResult}>
              {t('panel.actions.edit')}
            </button>
          ) : null}
        </div>
      ) : null}
      <input
        ref={inputRef}
        className={`find-replace-input${invalidRegex ? ' is-invalid' : ''}`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('find.search')}
        aria-label={t('find.search.aria')}
        aria-invalid={invalidRegex || undefined}
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
      <div className="find-replace-opts" role="group" aria-label={t('find.options')}>
        <button
          type="button"
          className={`find-replace-btn find-replace-opt${caseSensitive ? ' is-active' : ''}`}
          aria-pressed={caseSensitive}
          data-tooltip={t('find.case')}
          aria-label={t('find.case')}
          onClick={() => setCaseSensitive((v) => !v)}
        >
          Aa
        </button>
        <button
          type="button"
          className={`find-replace-btn find-replace-opt${wholeWord ? ' is-active' : ''}`}
          aria-pressed={wholeWord}
          data-tooltip={t('find.wholeWord')}
          aria-label={t('find.wholeWord')}
          onClick={() => setWholeWord((v) => !v)}
        >
          W
        </button>
        <button
          type="button"
          className={`find-replace-btn find-replace-opt${regex ? ' is-active' : ''}`}
          aria-pressed={regex}
          data-tooltip={t('find.regex')}
          aria-label={t('find.regex')}
          onClick={() => setRegex((v) => !v)}
        >
          .*
        </button>
      </div>
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
          <button
            type="button"
            className="find-replace-btn"
            onClick={replaceOne}
            disabled={!matches.length || invalidRegex}
          >
            {t('find.replace')}
          </button>
          <button
            type="button"
            className="find-replace-btn"
            onClick={replaceAll}
            disabled={!query || invalidRegex}
          >
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
