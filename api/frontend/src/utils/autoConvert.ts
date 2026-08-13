/**
 * Décision auto-convert (clé source, stamp options, retry, seed).
 */

import type { FormatType } from '../types';
import { isSupportedUiConversion } from './conversionPairs';

export const AUTO_CONVERT_IDLE_MS = 3000;
export const AUTO_CONVERT_MAX_FAILS = 2;

export function sourceAutoConvertKey(
  sourceFormat: FormatType,
  targetFormat: FormatType,
  sourceText: string
): string {
  return `${sourceFormat}>${targetFormat}\n${sourceText}`;
}

export function conversionOptionsStamp(
  conversionOptions: unknown,
  tocEnabled: boolean,
  applyMeta: boolean
): string {
  return `${tocEnabled ? 1 : 0}|${applyMeta ? 1 : 0}|${JSON.stringify(conversionOptions ?? {})}`;
}

export type AutoConvertAction = 'skip' | 'seed-exhausted' | 'schedule';

export type AutoConvertInput = {
  enabled: boolean;
  confirmBeforeConversion: boolean;
  busy: boolean;
  sourceFormat: FormatType;
  targetFormat: FormatType;
  sourceText: string;
  lastKey: string;
  lastStamp: string;
  currentStamp: string;
  failKey: string;
  failCount: number;
  needsConfirmationToken: boolean;
};

export function decideAutoConvert(input: AutoConvertInput): AutoConvertAction {
  if (!input.enabled) return 'skip';
  if (input.confirmBeforeConversion) return 'skip';
  if (input.busy) return 'skip';
  if (!isSupportedUiConversion(input.sourceFormat, input.targetFormat)) return 'skip';
  if (input.sourceFormat === input.targetFormat) return 'skip';
  if (input.needsConfirmationToken) return 'skip';
  if (!input.sourceText.trim()) return 'skip';

  const key = sourceAutoConvertKey(input.sourceFormat, input.targetFormat, input.sourceText);
  if (key === input.lastKey && input.currentStamp === input.lastStamp) return 'skip';
  if (input.failKey === key && input.failCount >= AUTO_CONVERT_MAX_FAILS) {
    return 'seed-exhausted';
  }
  return 'schedule';
}

export function bumpAutoConvertFail(
  prev: { key: string; count: number },
  key: string
): { key: string; count: number } {
  if (prev.key !== key) return { key, count: 1 };
  return { key, count: prev.count + 1 };
}

export function shouldMarkTabCleanAfterConvert(liveKey: string, snapshotKey: string): boolean {
  return !snapshotKey || liveKey === snapshotKey;
}
