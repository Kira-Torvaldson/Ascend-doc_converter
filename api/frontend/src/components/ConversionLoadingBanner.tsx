/**
 * Bannière de progression affichée pendant une conversion.
 * Affiche le temps écoulé et la taille source pour les gros documents.
 * Le timer n'est PAS dans la live region (évite le spam lecteurs d'écran).
 */

import React, { useEffect, useState } from 'react';
import { useT } from '../i18n/LocaleContext';

export interface ConversionLoadingBannerProps {
  status?: string;
  compact?: boolean;
  /** Taille du document source (caractères) pour le feedback. */
  sourceChars?: number;
}

function formatSourceSize(
  chars: number,
  t: (key: 'convert.sourceSize.kb' | 'convert.sourceSize.mb', vars: Record<string, string | number>) => string
): string {
  if (chars >= 1_000_000) {
    return t('convert.sourceSize.mb', { n: (chars / 1_000_000).toFixed(1) });
  }
  return t('convert.sourceSize.kb', { n: Math.max(1, Math.round(chars / 1000)) });
}

export const ConversionLoadingBanner: React.FC<ConversionLoadingBannerProps> = ({
  status,
  compact = false,
  sourceChars = 0,
}) => {
  const t = useT();
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    setElapsedSec(0);
    const id = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const sizeHint = sourceChars >= 1000 ? formatSourceSize(sourceChars, t) : '';
  const elapsedHint = t('convert.elapsed', { sec: elapsedSec });
  const liveLabel = status?.trim() || t('convert.running');
  const visualDetail = [status || t('convert.processing'), sizeHint, elapsedHint]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={`conversion-loading-banner${compact ? ' conversion-loading-banner--compact' : ''}`}
      aria-busy="true"
    >
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveLabel}
      </div>
      <div className="conversion-loading-banner-row" aria-hidden="true">
        <div className="conversion-loading-banner-main">
          <div
            className={`conversion-loading-spinner${compact ? ' conversion-loading-spinner--sm' : ''}`}
          />
          <span className="conversion-loading-label">{t('convert.running')}</span>
        </div>
        {!compact && (
          <span className="conversion-loading-status">{visualDetail}</span>
        )}
      </div>
      {compact ? (
        <span className="conversion-loading-status conversion-loading-status--compact" aria-hidden="true">
          {elapsedHint}
          {sizeHint ? ` · ${sizeHint}` : ''}
        </span>
      ) : null}
      <div className="conversion-loading-track" aria-hidden="true">
        <div className="conversion-loading-bar progress-bar" />
      </div>
    </div>
  );
};
