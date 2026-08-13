/**
 * Couples de formats exposés dans l’UI Ascend (source de vérité unique).
 */

import type { FormatType } from '../types';

export const MAX_FORMAT_PAIRS = 5;

export type FormatPair = { source: FormatType; target: FormatType };

const FORMAT_TYPE_SET = new Set<string>([
  'asciidoc',
  'markdown',
  'html',
  'pdf',
  'yaml',
  'json',
  'txt',
]);

const FORMAT_SHORT: Record<FormatType, string> = {
  asciidoc: 'Adoc',
  markdown: 'MD',
  html: 'HTML',
  pdf: 'PDF',
  yaml: 'YAML',
  json: 'JSON',
  txt: 'TXT',
};

export function isFormatType(value: unknown): value is FormatType {
  return typeof value === 'string' && FORMAT_TYPE_SET.has(value);
}

export function isSupportedUiConversion(source: FormatType, target: FormatType): boolean {
  return (
    (source === 'asciidoc' && target === 'markdown') ||
    (source === 'markdown' &&
      (target === 'asciidoc' || target === 'html' || target === 'txt')) ||
    (source === 'html' &&
      (target === 'markdown' || target === 'txt' || target === 'asciidoc')) ||
    (source === 'txt' && (target === 'markdown' || target === 'html'))
  );
}

/** true si la conversion passe par /api/convert (token requis). */
export function conversionNeedsConfirmationToken(source: FormatType, target: FormatType): boolean {
  if (source === 'asciidoc' && target === 'markdown') return false;
  if (source === 'markdown' && target === 'asciidoc') return false;
  if (source === 'markdown' && (target === 'html' || target === 'txt')) return false;
  if (source === 'txt' && target === 'markdown') return false;
  if (source === 'txt' && target === 'html') return false;
  if (source === 'html') return false;
  return true;
}

export function pairKey(pair: FormatPair): string {
  return `${pair.source}->${pair.target}`;
}

export function formatPairShortLabel(pair: FormatPair): string {
  return `${FORMAT_SHORT[pair.source]} → ${FORMAT_SHORT[pair.target]}`;
}

export function formatPairShortParts(pair: FormatPair): { from: string; to: string } {
  return { from: FORMAT_SHORT[pair.source], to: FORMAT_SHORT[pair.target] };
}

/** Filtre / déduplique / borne une liste de paires persistées. */
export function normalizeFormatPairs(raw: unknown): FormatPair[] {
  if (!Array.isArray(raw)) return [];
  const out: FormatPair[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const source = (item as { source?: unknown }).source;
    const target = (item as { target?: unknown }).target;
    if (!isFormatType(source) || !isFormatType(target)) continue;
    if (source === target || !isSupportedUiConversion(source, target)) continue;
    const next = { source, target };
    const key = pairKey(next);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(next);
    if (out.length >= MAX_FORMAT_PAIRS) break;
  }
  return out;
}

export function recordRecentPair(
  recent: FormatPair[],
  source: FormatType,
  target: FormatType
): FormatPair[] {
  if (source === target || !isSupportedUiConversion(source, target)) return recent;
  const next = { source, target };
  const key = pairKey(next);
  return [next, ...recent.filter((p) => pairKey(p) !== key)].slice(0, MAX_FORMAT_PAIRS);
}

export function toggleFavoritePair(
  favorites: FormatPair[],
  source: FormatType,
  target: FormatType
): FormatPair[] {
  if (source === target || !isSupportedUiConversion(source, target)) return favorites;
  const next = { source, target };
  const key = pairKey(next);
  if (favorites.some((p) => pairKey(p) === key)) {
    return favorites.filter((p) => pairKey(p) !== key);
  }
  return [...favorites, next].slice(-MAX_FORMAT_PAIRS);
}

export function isFavoritePair(
  favorites: FormatPair[],
  source: FormatType,
  target: FormatType
): boolean {
  const key = pairKey({ source, target });
  return favorites.some((p) => pairKey(p) === key);
}

export function formatPairsEqual(a: FormatPair[], b: FormatPair[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((p, i) => p.source === b[i].source && p.target === b[i].target);
}

export const SUPPORTED_CONVERSION_HINT =
  'Couples supportés : AsciiDoc↔Markdown, Markdown→HTML/TXT, HTML→Markdown/TXT/AsciiDoc, TXT→Markdown/HTML.';

/**
 * When source is Markdown, result for HTML/TXT/etc. must NOT reuse mdOutput
 * (that buffer holds the source). Use the dedicated otherOutput buffer instead.
 */
export function resultUsesOtherBuffer(source: FormatType, target: FormatType): boolean {
  if (source === target) return false;
  if (source === 'markdown' && target !== 'asciidoc') return true;
  if (source !== 'markdown' && target === 'asciidoc') return true;
  return false;
}

export function readResultBuffer(
  source: FormatType,
  target: FormatType,
  buffers: { adocInput: string; mdOutput: string; otherOutput: string }
): string {
  return buffers[resultBufferField(source, target)];
}

export function sourceBufferField(source: FormatType): 'adocInput' | 'mdOutput' {
  return source === 'markdown' ? 'mdOutput' : 'adocInput';
}

export function resultBufferField(
  source: FormatType,
  target: FormatType
): 'adocInput' | 'mdOutput' | 'otherOutput' {
  if (resultUsesOtherBuffer(source, target)) return 'otherOutput';
  if (target === 'asciidoc') return 'adocInput';
  return 'mdOutput';
}

export function resultWriteWouldClobberSource(
  writeSource: FormatType,
  writeTarget: FormatType,
  liveSource: FormatType
): boolean {
  return resultBufferField(writeSource, writeTarget) === sourceBufferField(liveSource);
}

export function applyResultToBuffers<
  T extends { adocInput: string; mdOutput: string; otherOutput: string }
>(buffers: T, source: FormatType, target: FormatType, content: string): T {
  const field = resultBufferField(source, target);
  return { ...buffers, [field]: content };
}

/** Restore source + result and clear unused buffers (no leftover ghosts). */
export function applyHistoryToBuffers(
  source: FormatType,
  target: FormatType,
  sourceContent: string,
  resultContent: string
): { adocInput: string; mdOutput: string; otherOutput: string } {
  const next = { adocInput: '', mdOutput: '', otherOutput: '' };
  next[sourceBufferField(source)] = sourceContent;
  next[resultBufferField(source, target)] = resultContent;
  return next;
}

export type ConversionResultDest = 'live' | 'tab' | 'skip';

export function decideConversionResultDest(input: {
  originTabId: string;
  liveTabId: string;
  writeSource: FormatType;
  writeTarget: FormatType;
  liveSource: FormatType;
}): ConversionResultDest {
  if (input.liveTabId !== input.originTabId) return 'tab';
  if (resultWriteWouldClobberSource(input.writeSource, input.writeTarget, input.liveSource)) {
    return 'skip';
  }
  return 'live';
}

export type ConvertRequestSnap = {
  tabId: string;
  sourceText: string;
  sourceFormat: FormatType;
  targetFormat: FormatType;
};

/** Prefer the confirm-before-convert snapshot so token + body stay aligned. */
export function resolveConvertRequestSnap(
  preferred: ConvertRequestSnap | null | undefined,
  live: ConvertRequestSnap
): ConvertRequestSnap {
  if (!preferred) return live;
  return {
    tabId: preferred.tabId,
    sourceText: preferred.sourceText,
    sourceFormat: preferred.sourceFormat,
    targetFormat: preferred.targetFormat,
  };
}

export function writeResultBuffer(
  source: FormatType,
  target: FormatType,
  content: string,
  setters: {
    setAdocInput: (v: string) => void;
    setMdOutput: (v: string) => void;
    setOtherOutput: (v: string) => void;
  }
): void {
  const field = resultBufferField(source, target);
  if (field === 'adocInput') {
    setters.setAdocInput(content);
    return;
  }
  if (field === 'otherOutput') {
    setters.setOtherOutput(content);
    return;
  }
  setters.setMdOutput(content);
}

export function supportsRichPreview(target: FormatType): boolean {
  return target === 'html' || target === 'markdown' || target === 'asciidoc';
}
