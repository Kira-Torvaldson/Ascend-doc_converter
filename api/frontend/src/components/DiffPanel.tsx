/**
 * Panneau de diff source ↔ résultat.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useT } from '../i18n/LocaleContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { DIFF_RENDER_LIMIT, diffLines } from '../utils/simpleDiff';

interface DiffPanelProps {
  open: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  left: string;
  right: string;
  leftLabel?: string;
  rightLabel?: string;
}

export const DiffPanel: React.FC<DiffPanelProps> = ({
  open,
  onClose,
  onMinimize,
  left,
  right,
  leftLabel,
  rightLabel,
}) => {
  const t = useT();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);
  const resolvedLeft = leftLabel ?? t('diff.source');
  const resolvedRight = rightLabel ?? t('diff.result');
  const result = useMemo(
    () => (open ? diffLines(left, right) : null),
    [open, left, right]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !result) return null;

  const { lines, truncated, added, removed } = result;
  const renderCapped = lines.length > DIFF_RENDER_LIMIT;
  const visible = renderCapped ? lines.slice(0, DIFF_RENDER_LIMIT) : lines;

  return (
    <>
      <div className="settings-overlay floating-window-overlay" onClick={onClose} role="presentation" />
      <div
        ref={panelRef}
        className="settings-panel diff-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diff-title"
      >
        <div className="settings-panel-header">
          <h3 id="diff-title">
            Diff {resolvedLeft} ↔ {resolvedRight}
          </h3>
          <div className="diff-panel-header-actions">
            {onMinimize ? (
              <button
                type="button"
                className="settings-close-btn"
                onClick={onMinimize}
                aria-label={t('common.minimize')}
                data-tooltip={t('common.minimize')}
              >
                –
              </button>
            ) : null}
            <button type="button" className="settings-close-btn" onClick={onClose} aria-label={t('common.close')}>
              ×
            </button>
          </div>
        </div>
        <div className="settings-panel-content">
          <p className="diff-summary" aria-live="polite">
            {t('diff.summary', { added, removed })}
            {truncated ? ` · ${t('diff.truncated')}` : ''}
            {renderCapped ? ` · ${t('diff.capped', { n: DIFF_RENDER_LIMIT })}` : ''}
          </p>
          <pre className="diff-view" tabIndex={0}>
            {visible.map((line, i) => (
              <div key={i} className={`diff-line diff-line--${line.kind}`}>
                <span className="diff-gutter" aria-hidden="true">
                  {line.leftNo ?? ''}
                  {'|'}
                  {line.rightNo ?? ''}
                </span>
                <span className="diff-prefix" aria-hidden="true">
                  {line.kind === 'add' ? '+' : line.kind === 'del' ? '−' : ' '}
                </span>
                <span className="diff-text">{line.text || ' '}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </>
  );
};
