/**
 * Bannière d’avertissements issus du ConversionResult (succès avec warnings).
 */

import React from 'react';

interface ConversionWarningsBannerProps {
  warnings: string[];
  onDismiss: () => void;
}

export const ConversionWarningsBanner: React.FC<ConversionWarningsBannerProps> = ({
  warnings,
  onDismiss,
}) => {
  if (!warnings.length) return null;

  return (
    <div className="conversion-warnings-banner" role="status" aria-live="polite">
      <div className="conversion-warnings-banner-main">
        <span className="conversion-warnings-banner-title">
          Conversion réussie avec {warnings.length} avertissement
          {warnings.length > 1 ? 's' : ''}
        </span>
        <ul className="conversion-warnings-list">
          {warnings.map((w, i) => (
            <li key={`${i}-${w.slice(0, 24)}`}>{w}</li>
          ))}
        </ul>
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
