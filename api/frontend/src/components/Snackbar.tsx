/**
 * Snackbar Ascend — confirmation discrète (copie, paramètres, etc.)
 */

import React, { useEffect } from 'react';
import { useT } from '../i18n/LocaleContext';

export interface SnackbarProps {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  message,
  onDismiss,
  durationMs = 2800,
}) => {
  const t = useT();

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(id);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div className="ascend-snackbar" role="status" aria-live="polite" aria-atomic="true">
      <span className="ascend-snackbar-dot" aria-hidden="true" />
      <span className="ascend-snackbar-text">{message}</span>
      <button
        type="button"
        className="ascend-snackbar-close"
        onClick={onDismiss}
        aria-label={t('common.close')}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
};
