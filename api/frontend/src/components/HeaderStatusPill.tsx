/**
 * Indicateur compact de l'état de conversion dans l'en-tête.
 */

import React from 'react';
import { useT } from '../i18n/LocaleContext';

export type ConversionUiState = 'idle' | 'loading' | 'success' | 'error';

export interface HeaderStatusPillProps {
  state: ConversionUiState;
  status?: string;
}

export const HeaderStatusPill: React.FC<HeaderStatusPillProps> = ({ state, status }) => {
  const t = useT();
  if (state === 'idle') return null;

  const defaultLabels = {
    loading: t('convert.running'),
    success: t('convert.success'),
    error: t('convert.failed'),
  } as const;

  const label =
    state === 'loading' && status?.trim()
      ? status
      : defaultLabels[state];

  return (
    <div
      className={`header-status-pill header-status-pill--${state}`}
      role="status"
      aria-live="polite"
    >
      {state === 'loading' && <span className="header-status-spinner" aria-hidden="true" />}
      {state === 'success' && <span className="header-status-icon" aria-hidden="true">✓</span>}
      {state === 'error' && <span className="header-status-icon" aria-hidden="true">✕</span>}
      <span className="header-status-label">{label}</span>
    </div>
  );
};
