/**
 * Écriture de l’historique de conversion (snapshot d’origine, pas l’éditeur live).
 */

import type { ConversionHistoryItem, ConversionOptions, FormatType } from '../types';
import { isFormatType } from './conversionPairs';

export const CONVERSION_HISTORY_KEY = 'ascend_conversion_history';

export function buildConversionHistoryItem(input: {
  fromFormat: FormatType;
  toFormat: FormatType;
  sourceContent: string;
  resultContent: string;
  conversionOptions?: ConversionOptions;
  activeProfileIds?: string[];
  now?: number;
}): ConversionHistoryItem | null {
  if (!input.sourceContent.trim() || !input.resultContent.trim()) return null;
  const now = input.now ?? Date.now();
  return {
    id: String(now),
    timestamp: now,
    fromFormat: input.fromFormat,
    toFormat: input.toFormat,
    sourceContent: input.sourceContent,
    resultContent: input.resultContent,
    conversionOptions: input.conversionOptions,
    activeProfileIds: input.activeProfileIds,
  };
}

export function prependConversionHistory(
  prev: ConversionHistoryItem[],
  item: ConversionHistoryItem,
  limit: number
): ConversionHistoryItem[] {
  const cap = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 50;
  return [item, ...prev].slice(0, cap);
}

export function shouldRecordConversionHistory(
  dest: 'live' | 'tab' | 'skip' | null
): boolean {
  return dest === 'live' || dest === 'tab' || dest === null;
}

export function persistConversionHistory(items: ConversionHistoryItem[]): boolean {
  try {
    localStorage.setItem(CONVERSION_HISTORY_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function normalizeHistoryItem(raw: unknown): ConversionHistoryItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  if (!isFormatType(item.fromFormat) || !isFormatType(item.toFormat)) return null;
  if (typeof item.sourceContent !== 'string' || typeof item.resultContent !== 'string') return null;
  const timestamp =
    typeof item.timestamp === 'number' && Number.isFinite(item.timestamp)
      ? item.timestamp
      : Date.now();
  const id = typeof item.id === 'string' && item.id ? item.id : String(timestamp);
  const next: ConversionHistoryItem = {
    id,
    timestamp,
    fromFormat: item.fromFormat,
    toFormat: item.toFormat,
    sourceContent: item.sourceContent,
    resultContent: item.resultContent,
  };
  if (item.conversionOptions && typeof item.conversionOptions === 'object') {
    next.conversionOptions = item.conversionOptions as ConversionOptions;
  }
  if (Array.isArray(item.activeProfileIds)) {
    next.activeProfileIds = item.activeProfileIds.filter((id): id is string => typeof id === 'string');
  }
  return next;
}

/** Safe parse: `{}`, a string, or junk entries never throw. */
export function parseConversionHistory(raw: string | null): ConversionHistoryItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeHistoryItem)
      .filter((item): item is ConversionHistoryItem => !!item);
  } catch {
    return [];
  }
}

export function loadConversionHistory(): ConversionHistoryItem[] {
  try {
    const raw = localStorage.getItem(CONVERSION_HISTORY_KEY);
    const items = parseConversionHistory(raw);
    if (raw && items.length === 0 && raw.trim() !== '[]') {
      localStorage.removeItem(CONVERSION_HISTORY_KEY);
    }
    return items;
  } catch {
    return [];
  }
}
