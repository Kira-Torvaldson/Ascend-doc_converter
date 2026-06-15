/**
 * Indicateur compact de l'état de conversion dans l'en-tête.
 */

import React from 'react';

export type ConversionUiState = 'idle' | 'loading' | 'success' | 'error';

export interface HeaderStatusPillProps {
  state: ConversionUiState;
  status?: string;
}

const DEFAULT_LABELS: Record<Exclude<ConversionUiState, 'idle'>, string> = {
  loading: 'Conversion en cours…',
  success: 'Conversion réussie',
  error: 'Échec de conversion',
};

export const HeaderStatusPill: React.FC<HeaderStatusPillProps> = ({ state, status }) => {
  if (state === 'idle') return null;

  const label =
    state === 'loading' && status?.trim()
      ? status
      : DEFAULT_LABELS[state];

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
