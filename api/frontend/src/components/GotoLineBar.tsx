/**
 * Barre « Aller à la ligne » (Ctrl+G).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import {
  countTextLines,
  lineNumberAtOffset,
  scrollTextareaToLine,
} from '../utils/editorNavigate';

export type GotoLineTarget = 'source' | 'result';

interface GotoLineBarProps {
  open: boolean;
  onClose: () => void;
  target: GotoLineTarget;
  onTargetChange: (target: GotoLineTarget) => void;
  targetRef?: React.RefObject<HTMLTextAreaElement | null> | null;
  text: string;
}

export const GotoLineBar: React.FC<GotoLineBarProps> = ({
  open,
  onClose,
  target,
  onTargetChange,
  targetRef,
  text,
}) => {
  const t = useT();
  const [value, setValue] = useState('1');
  const inputRef = useRef<HTMLInputElement>(null);
  const seededOpenRef = useRef(false);
  const totalLines = countTextLines(text);

  useEffect(() => {
    if (!open) {
      seededOpenRef.current = false;
      return;
    }
    if (!seededOpenRef.current) {
      seededOpenRef.current = true;
      const ta = targetRef?.current;
      const seed =
        ta && typeof ta.selectionStart === 'number'
          ? lineNumberAtOffset(ta.value, ta.selectionStart)
          : 1;
      setValue(String(seed));
    }
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, targetRef]);

  if (!open) return null;

  const go = () => {
    const parsed = Number.parseInt(value.replace(/\D/g, ''), 10);
    if (!Number.isFinite(parsed) || parsed < 1) return;
    scrollTextareaToLine(targetRef?.current, parsed);
    onClose();
  };

  return (
    <div className="find-replace-bar goto-line-bar" role="dialog" aria-label={t('goto.title')}>
      <div className="find-replace-target" role="group" aria-label={t('goto.target')}>
        <button
          type="button"
          className={`find-replace-target-btn${target === 'source' ? ' is-active' : ''}`}
          onClick={() => onTargetChange('source')}
        >
          {t('goto.source')}
        </button>
        <button
          type="button"
          className={`find-replace-target-btn${target === 'result' ? ' is-active' : ''}`}
          onClick={() => onTargetChange('result')}
        >
          {t('goto.result')}
        </button>
      </div>
      <label className="goto-line-label" htmlFor="goto-line-input">
        {t('goto.label')}
      </label>
      <input
        id="goto-line-input"
        ref={inputRef}
        className="find-replace-input goto-line-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('goto.placeholder')}
        aria-label={t('goto.aria')}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'Enter') {
            e.preventDefault();
            go();
          }
        }}
      />
      <span className="find-replace-count" aria-live="polite">
        {t('goto.of', { n: totalLines })}
      </span>
      <button type="button" className="find-replace-btn" onClick={go}>
        {t('goto.go')}
      </button>
      <button
        type="button"
        className="find-replace-btn find-replace-btn--close"
        onClick={onClose}
        aria-label={t('common.close')}
      >
        ×
      </button>
    </div>
  );
};
