/**
 * Normalise les warnings d’un ConversionResult pour l’UI.
 */

export type ConversionWarningItem = {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
  /** Short French title for known codes */
  title?: string;
  /** Suggested action for the user */
  hint?: string;
  severity?: 'info' | 'warning';
};

const WARNING_UX: Record<string, { title: string; hint: string; severity: 'info' | 'warning' }> = {
  ENGINE_FALLBACK: {
    title: 'Moteur de secours',
    hint: 'Le résultat a été produit sans Pandoc (stripper local). Vérifiez le rendu si le document est complexe.',
    severity: 'warning',
  },
};

export function formatConversionWarning(warning: unknown): string {
  const item = normalizeConversionWarning(warning);
  if (item.code && item.message && item.message !== item.code) {
    return `${item.code}: ${item.message}`;
  }
  return item.message;
}

export function normalizeConversionWarning(warning: unknown): ConversionWarningItem {
  if (typeof warning === 'string') {
    const t = warning.trim();
    return { message: t || 'Avertissement', severity: 'warning' };
  }
  if (warning && typeof warning === 'object') {
    const w = warning as Record<string, unknown>;
    const code = typeof w.code === 'string' ? w.code.trim() : '';
    const message = typeof w.message === 'string' ? w.message.trim() : '';
    const details =
      w.details && typeof w.details === 'object' && !Array.isArray(w.details)
        ? (w.details as Record<string, unknown>)
        : undefined;
    const ux = code && WARNING_UX[code] ? WARNING_UX[code] : undefined;
    const fallbackReason =
      details && typeof details.fallbackReason === 'string'
        ? details.fallbackReason.trim()
        : '';
    return {
      code: code || undefined,
      message: message || code || 'Avertissement',
      details,
      title: ux?.title,
      hint: ux
        ? fallbackReason
          ? `${ux.hint} (${fallbackReason})`
          : ux.hint
        : undefined,
      severity: ux?.severity || 'warning',
    };
  }
  try {
    return { message: JSON.stringify(warning), severity: 'warning' };
  } catch {
    return { message: 'Avertissement', severity: 'warning' };
  }
}

export function extractConversionWarnings(result: unknown): ConversionWarningItem[] {
  if (!result || typeof result !== 'object') return [];
  const warnings = (result as { warnings?: unknown }).warnings;
  if (!Array.isArray(warnings) || warnings.length === 0) return [];
  return warnings.map(normalizeConversionWarning).filter((w) => Boolean(w.message));
}
