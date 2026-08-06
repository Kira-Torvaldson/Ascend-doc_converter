/**
 * Bannière de progression affichée pendant une conversion.
 */

import React from 'react';
import { useT } from '../i18n/LocaleContext';

export interface ConversionLoadingBannerProps {
  status?: string;
  compact?: boolean;
}

export const ConversionLoadingBanner: React.FC<ConversionLoadingBannerProps> = ({
  status,
  compact = false,
}) => {
  const t = useT();
  return (
    <div
      className={`conversion-loading-banner${compact ? ' conversion-loading-banner--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="conversion-loading-banner-row">
        <div className="conversion-loading-banner-main">
          <div
            className={`conversion-loading-spinner${compact ? ' conversion-loading-spinner--sm' : ''}`}
            aria-hidden="true"
          />
          <span className="conversion-loading-label">{t('convert.running')}</span>
        </div>
        {!compact && (
          <span className="conversion-loading-status">{status || t('convert.processing')}</span>
        )}
      </div>
      <div className="conversion-loading-track">
        <div className="conversion-loading-bar progress-bar" />
      </div>
    </div>
  );
};
