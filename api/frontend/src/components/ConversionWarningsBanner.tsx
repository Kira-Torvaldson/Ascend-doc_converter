/**
 * Bannière d’avertissements issus du ConversionResult (succès avec warnings).
 */

import React, { useState } from 'react';

interface ConversionWarningsBannerProps {
  warnings: string[];
  onDismiss: () => void;
}

export const ConversionWarningsBanner: React.FC<ConversionWarningsBannerProps> = ({
  warnings,
  onDismiss,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!warnings.length) return null;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(warnings.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="conversion-warnings-banner" role="status" aria-live="polite">
      <div className="conversion-warnings-banner-main">
        <div className="conversion-warnings-banner-top">
          <button
            type="button"
            className="conversion-warnings-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className="conversion-warnings-banner-title">
              Conversion réussie avec {warnings.length} avertissement
              {warnings.length > 1 ? 's' : ''}
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
              <li key={`${i}-${w.slice(0, 24)}`}>{w}</li>
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
