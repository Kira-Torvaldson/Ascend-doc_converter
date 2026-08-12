/**
 * Normalise les warnings d’un ConversionResult pour l’UI.
 */

export type WarningGotoTarget = 'source' | 'result';

export type WarningLocation = {
  line: number;
  target: WarningGotoTarget;
  column?: number;
};

export type ConversionWarningItem = {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
  /** Short French title for known codes */
  title?: string;
  /** Suggested action for the user */
  hint?: string;
  severity?: 'info' | 'warning';
  /** Ligne éditeur si le warning pointe un endroit précis */
  location?: WarningLocation;
};

const WARNING_UX: Record<string, { title: string; hint: string; severity: 'info' | 'warning' }> = {
  ENGINE_FALLBACK: {
    title: 'Moteur de secours',
    hint: 'Le résultat a été produit sans Pandoc (stripper local). Vérifiez le rendu si le document est complexe.',
    severity: 'warning',
  },
};

function asPositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return Math.floor(value);
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const n = Number.parseInt(value.trim(), 10);
    return n >= 1 ? n : undefined;
  }
  return undefined;
}

function resolveTarget(raw: unknown, fallback: WarningGotoTarget = 'source'): WarningGotoTarget {
  if (typeof raw !== 'string') return fallback;
  const t = raw.trim().toLowerCase();
  if (t === 'result' || t === 'output' || t === 'cible' || t === 'out') return 'result';
  if (t === 'source' || t === 'input' || t === 'in') return 'source';
  return fallback;
}

/** Parse « line 12 », « ligne: 3 », « L42 », « file:12: » dans un message. */
export function parseLineFromWarningText(text: string): number | undefined {
  if (!text) return undefined;
  const patterns = [
    /(?:^|[\s(,;[\]{])(?:line|ligne|zeile|l[ií]nea)\s*[:=#]?\s*(\d{1,7})\b/i,
    /\bl\s*[:=]\s*(\d{1,7})\b/i,
    /(?:^|[\s(,])L(\d{1,7})\b/,
    /:(\d{1,7})(?::\d{1,7})?:/,
    /:(\d{1,7})(?=\s|$)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const n = Number.parseInt(m[1], 10);
      if (n >= 1) return n;
    }
  }
  return undefined;
}

function extractSnippet(details?: Record<string, unknown>, message?: string): string | undefined {
  if (details) {
    for (const key of ['snippet', 'excerpt', 'fragment', 'text', 'context'] as const) {
      const v = details[key];
      if (typeof v === 'string' && v.trim().length >= 3) return v.trim();
    }
  }
  if (message) {
    const quoted = message.match(/["«]([^"»]{3,80})["»]/) || message.match(/'([^']{3,80})'/);
    if (quoted?.[1]) return quoted[1].trim();
  }
  return undefined;
}

/** Index de ligne 1-based contenant `snippet`, ou undefined. */
export function findLineBySnippet(text: string, snippet: string): number | undefined {
  const needle = snippet.trim();
  if (!text || needle.length < 3) return undefined;
  const idx = text.indexOf(needle);
  if (idx < 0) {
    const compact = needle.replace(/\s+/g, ' ');
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(compact) || compact.includes(lines[i].trim())) {
        if (lines[i].trim().length >= 3) return i + 1;
      }
    }
    return undefined;
  }
  let line = 1;
  for (let i = 0; i < idx; i++) {
    if (text.charCodeAt(i) === 10) line++;
  }
  return line;
}

export function resolveWarningLocation(
  warning: Pick<ConversionWarningItem, 'message' | 'details'>,
  buffers?: { sourceText?: string; resultText?: string }
): WarningLocation | undefined {
  const details = warning.details;
  const message = warning.message || '';

  let target = resolveTarget(details?.target ?? details?.side ?? details?.panel, 'source');
  let line =
    asPositiveInt(details?.line) ??
    asPositiveInt(details?.lineNumber) ??
    asPositiveInt(details?.lineno) ??
    asPositiveInt(details?.lineNo);

  const sourceLine = asPositiveInt(details?.sourceLine);
  const resultLine = asPositiveInt(details?.resultLine);
  if (sourceLine) {
    line = sourceLine;
    target = 'source';
  } else if (resultLine) {
    line = resultLine;
    target = 'result';
  }

  if (!line) {
    line = parseLineFromWarningText(message);
  }

  const column =
    asPositiveInt(details?.column) ?? asPositiveInt(details?.col) ?? asPositiveInt(details?.columnNumber);

  if (!line) {
    const snippet = extractSnippet(details, message);
    if (snippet && buffers) {
      const inSource = buffers.sourceText
        ? findLineBySnippet(buffers.sourceText, snippet)
        : undefined;
      const inResult = buffers.resultText
        ? findLineBySnippet(buffers.resultText, snippet)
        : undefined;
      if (inSource) {
        line = inSource;
        target = 'source';
      } else if (inResult) {
        line = inResult;
        target = 'result';
      }
    }
  }

  if (!line) return undefined;
  return column ? { line, target, column } : { line, target };
}

export function formatConversionWarning(warning: unknown): string {
  const item = normalizeConversionWarning(warning);
  if (item.code && item.message && item.message !== item.code) {
    return `${item.code}: ${item.message}`;
  }
  return item.message;
}

export function normalizeConversionWarning(
  warning: unknown,
  buffers?: { sourceText?: string; resultText?: string }
): ConversionWarningItem {
  if (typeof warning === 'string') {
    const t = warning.trim();
    const message = t || 'Avertissement';
    return {
      message,
      severity: 'warning',
      location: resolveWarningLocation({ message }, buffers),
    };
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
    const item: ConversionWarningItem = {
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
    item.location = resolveWarningLocation(item, buffers);
    return item;
  }
  try {
    return { message: JSON.stringify(warning), severity: 'warning' };
  } catch {
    return { message: 'Avertissement', severity: 'warning' };
  }
}

export function extractConversionWarnings(
  result: unknown,
  buffers?: { sourceText?: string; resultText?: string }
): ConversionWarningItem[] {
  if (!result || typeof result !== 'object') return [];
  const warnings = (result as { warnings?: unknown }).warnings;
  if (!Array.isArray(warnings) || warnings.length === 0) return [];
  return warnings
    .map((w) => normalizeConversionWarning(w, buffers))
    .filter((w) => Boolean(w.message));
}
