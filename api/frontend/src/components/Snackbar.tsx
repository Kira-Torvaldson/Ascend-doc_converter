/**
 * Snackbar Ascend — confirmation discrète (copie, paramètres, etc.)
 */

import React, { useEffect } from 'react';

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
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div className="ascend-snackbar" role="status" aria-live="polite">
      <span className="ascend-snackbar-dot" aria-hidden="true" />
      <span className="ascend-snackbar-text">{message}</span>
      <button
        type="button"
        className="ascend-snackbar-close"
        onClick={onDismiss}
        aria-label="Fermer la notification"
      >
        ×
      </button>
    </div>
  );
};
