/**
 * Recherche texte (littéral / regex / casse / mot entier).
 */

export interface FindTextOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
}

export interface FindTextResult {
  positions: number[];
  lengths: number[];
  capped: boolean;
  invalidRegex: boolean;
}

export const FIND_MATCH_CAP = 4_000;

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isWordChar(ch: string | undefined): boolean {
  return !!ch && /[A-Za-z0-9_]/.test(ch);
}

function isWholeWordAt(haystack: string, start: number, end: number): boolean {
  const before = start > 0 ? haystack[start - 1] : undefined;
  const after = end < haystack.length ? haystack[end] : undefined;
  return !isWordChar(before) && !isWordChar(after);
}

export function findTextMatches(
  haystack: string,
  query: string,
  opts: FindTextOptions = {}
): FindTextResult {
  const empty: FindTextResult = {
    positions: [],
    lengths: [],
    capped: false,
    invalidRegex: false,
  };
  if (!query) return empty;

  const caseSensitive = !!opts.caseSensitive;
  const wholeWord = !!opts.wholeWord;
  const useRegex = !!opts.regex;
  const positions: number[] = [];
  const lengths: number[] = [];

  if (useRegex) {
    let re: RegExp;
    try {
      re = new RegExp(query, caseSensitive ? 'g' : 'gi');
    } catch {
      return { ...empty, invalidRegex: true };
    }
    let match: RegExpExecArray | null;
    let guard = 0;
    while ((match = re.exec(haystack)) !== null) {
      const at = match.index;
      const len = match[0]?.length ?? 0;
      if (len === 0) {
        re.lastIndex = at + 1;
        continue;
      }
      if (!wholeWord || isWholeWordAt(haystack, at, at + len)) {
        positions.push(at);
        lengths.push(len);
        if (positions.length >= FIND_MATCH_CAP) {
          return { positions, lengths, capped: true, invalidRegex: false };
        }
      }
      if (++guard > haystack.length + 2) break;
    }
    return { positions, lengths, capped: false, invalidRegex: false };
  }

  if (wholeWord) {
    let re: RegExp;
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      re = new RegExp(`\\b${escapeRegExp(query)}\\b`, flags);
    } catch {
      return empty;
    }
    let match: RegExpExecArray | null;
    while ((match = re.exec(haystack)) !== null) {
      const at = match.index;
      const len = match[0].length;
      if (len === 0) {
        re.lastIndex = at + 1;
        continue;
      }
      positions.push(at);
      lengths.push(len);
      if (positions.length >= FIND_MATCH_CAP) {
        return { positions, lengths, capped: true, invalidRegex: false };
      }
    }
    return { positions, lengths, capped: false, invalidRegex: false };
  }

  if (!caseSensitive) {
    const lowerHay = haystack.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const step = Math.max(1, lowerQuery.length);
    let from = 0;
    while (from <= lowerHay.length) {
      const at = lowerHay.indexOf(lowerQuery, from);
      if (at < 0) break;
      positions.push(at);
      lengths.push(query.length);
      if (positions.length >= FIND_MATCH_CAP) {
        return { positions, lengths, capped: true, invalidRegex: false };
      }
      from = at + step;
    }
    return { positions, lengths, capped: false, invalidRegex: false };
  }

  const step = Math.max(1, query.length);
  let from = 0;
  while (from <= haystack.length) {
    const at = haystack.indexOf(query, from);
    if (at < 0) break;
    positions.push(at);
    lengths.push(query.length);
    if (positions.length >= FIND_MATCH_CAP) {
      return { positions, lengths, capped: true, invalidRegex: false };
    }
    from = at + step;
  }
  return { positions, lengths, capped: false, invalidRegex: false };
}

export function replaceTextMatches(
  haystack: string,
  query: string,
  replacement: string,
  opts: FindTextOptions,
  mode: 'one' | 'all',
  index = 0
): string {
  const found = findTextMatches(haystack, query, opts);
  if (found.invalidRegex || !found.positions.length) return haystack;

  if (mode === 'one') {
    const safe = ((index % found.positions.length) + found.positions.length) % found.positions.length;
    const at = found.positions[safe];
    const len = found.lengths[safe];
    return haystack.slice(0, at) + replacement + haystack.slice(at + len);
  }

  let out = '';
  let cursor = 0;
  for (let i = 0; i < found.positions.length; i++) {
    const at = found.positions[i];
    const len = found.lengths[i];
    out += haystack.slice(cursor, at) + replacement;
    cursor = at + len;
  }
  out += haystack.slice(cursor);
  return out;
}
