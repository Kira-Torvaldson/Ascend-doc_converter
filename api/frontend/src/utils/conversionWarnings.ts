/**
 * Normalise les warnings d’un ConversionResult pour l’UI.
 */

export function formatConversionWarning(warning: unknown): string {
  if (typeof warning === 'string') {
    const t = warning.trim();
    return t || 'Avertissement';
  }
  if (warning && typeof warning === 'object') {
    const w = warning as Record<string, unknown>;
    if (typeof w.message === 'string' && w.message.trim()) return w.message.trim();
    if (typeof w.code === 'string' && w.code.trim()) {
      const msg = typeof w.message === 'string' ? w.message.trim() : '';
      return msg ? `${w.code}: ${msg}` : w.code;
    }
  }
  try {
    return JSON.stringify(warning);
  } catch {
    return 'Avertissement';
  }
}

export function extractConversionWarnings(result: unknown): string[] {
  if (!result || typeof result !== 'object') return [];
  const warnings = (result as { warnings?: unknown }).warnings;
  if (!Array.isArray(warnings) || warnings.length === 0) return [];
  return warnings.map(formatConversionWarning).filter(Boolean);
}
