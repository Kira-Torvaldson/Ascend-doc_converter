/**
 * Panneau de diff source ↔ résultat.
 */

import React, { useMemo } from 'react';
import { diffLines } from '../utils/simpleDiff';

interface DiffPanelProps {
  open: boolean;
  onClose: () => void;
  left: string;
  right: string;
  leftLabel?: string;
  rightLabel?: string;
}

export const DiffPanel: React.FC<DiffPanelProps> = ({
  open,
  onClose,
  left,
  right,
  leftLabel = 'Source',
  rightLabel = 'Résultat',
}) => {
  const lines = useMemo(() => diffLines(left, right), [left, right]);

  if (!open) return null;

  const added = lines.filter((l) => l.kind === 'add').length;
  const removed = lines.filter((l) => l.kind === 'del').length;

  return (
    <>
      <div className="settings-overlay floating-window-overlay" onClick={onClose} />
      <div className="settings-panel diff-panel" role="dialog" aria-modal="true" aria-labelledby="diff-title">
        <div className="settings-panel-header">
          <h3 id="diff-title">
            Diff {leftLabel} ↔ {rightLabel}
          </h3>
          <button type="button" className="settings-close-btn" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <div className="settings-panel-content">
          <p className="diff-summary">
            +{added} / −{removed} lignes
          </p>
          <pre className="diff-view">
            {lines.map((line, i) => (
              <div key={i} className={`diff-line diff-line--${line.kind}`}>
                <span className="diff-gutter">
                  {line.leftNo ?? ''}
                  {'|'}
                  {line.rightNo ?? ''}
                </span>
                <span className="diff-prefix">
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
