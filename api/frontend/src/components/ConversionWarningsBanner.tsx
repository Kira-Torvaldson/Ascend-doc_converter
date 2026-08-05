/**
 * Bannière d’avertissements issus du ConversionResult (succès avec warnings).
 */

import React, { useState } from 'react';
import type { ConversionWarningItem } from '../utils/conversionWarnings';
import { formatConversionWarning } from '../utils/conversionWarnings';

interface ConversionWarningsBannerProps {
  warnings: ConversionWarningItem[];
  onDismiss: () => void;
}

export const ConversionWarningsBanner: React.FC<ConversionWarningsBannerProps> = ({
  warnings,
  onDismiss,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!warnings.length) return null;

  const hasEngineFallback = warnings.some((w) => w.code === 'ENGINE_FALLBACK');
  const copyLines = warnings.map((w) => {
    const base = formatConversionWarning(w);
    return w.hint ? `${base}\n  → ${w.hint}` : base;
  });

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(copyLines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={`conversion-warnings-banner${hasEngineFallback ? ' conversion-warnings-banner--fallback' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="conversion-warnings-banner-main">
        <div className="conversion-warnings-banner-top">
          <button
            type="button"
            className="conversion-warnings-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className="conversion-warnings-banner-title">
              {hasEngineFallback
                ? 'Conversion réussie — moteur de secours utilisé'
                : `Conversion réussie avec ${warnings.length} avertissement${warnings.length > 1 ? 's' : ''}`}
            </span>
            <span aria-hidden="true">{expanded ? '▼' : '▶'}</span>
          </button>
          <button type="button" className="conversion-warnings-copy" onClick={() => void copyAll()}>
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        {expanded && (
          <ul className="conversion-warnings-list">
            {warnings.map((w, i) => (
              <li key={`${i}-${w.code || w.message.slice(0, 24)}`}>
                {w.title ? (
                  <>
                    <strong className="conversion-warnings-item-title">{w.title}</strong>
                    {w.code ? (
                      <span className="conversion-warnings-item-code"> ({w.code})</span>
                    ) : null}
                    <div className="conversion-warnings-item-message">{w.message}</div>
                  </>
                ) : (
                  formatConversionWarning(w)
                )}
                {w.hint ? (
                  <div className="conversion-warnings-item-hint">{w.hint}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        className="conversion-warnings-dismiss"
        onClick={onDismiss}
        aria-label="Masquer les avertissements"
      >
        ×
      </button>
    </div>
  );
};
