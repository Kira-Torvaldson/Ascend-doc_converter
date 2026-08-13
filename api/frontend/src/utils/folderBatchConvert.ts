/**
 * File de conversion dossier — helpers (extensions, promesse convertText).
 */

import type { FormatType } from '../types';
import { convertText, requestConfirmationToken } from '../converters';
import { conversionNeedsConfirmationToken, isSupportedUiConversion } from './conversionPairs';
import { inferSourceFormatFromFile, readFileAsUtf8 } from './sourceFile';

export const MAX_FOLDER_BATCH = 40;

export type FolderBatchItemStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

export type FolderBatchItem = {
  id: string;
  fileName: string;
  status: FolderBatchItemStatus;
  message?: string;
  result?: string;
  sourceFormat?: FormatType;
};

/** Pending / running → skipped + aborted (annulation file). */
export function markFolderBatchAborted(items: FolderBatchItem[]): FolderBatchItem[] {
  return items.map((item) =>
    item.status === 'pending' || item.status === 'running'
      ? { ...item, status: 'skipped', message: 'aborted' }
      : item
  );
}

export function outputExtensionFor(format: FormatType): string {
  if (format === 'markdown') return 'md';
  if (format === 'asciidoc') return 'adoc';
  if (format === 'html') return 'html';
  if (format === 'yaml') return 'yaml';
  if (format === 'json') return 'json';
  if (format === 'pdf') return 'pdf';
  return 'txt';
}

export function withOutputExtension(fileName: string, targetFormat: FormatType): string {
  const base = fileName.replace(/\.[^/.]+$/, '') || fileName;
  return `${base}.${outputExtensionFor(targetFormat)}`;
}

/** Chemin relatif navigateur, sinon le nom seul. */
export function folderFileLabel(file: File): string {
  const rel =
    typeof file.webkitRelativePath === 'string' ? file.webkitRelativePath.trim() : '';
  return rel || file.name;
}

/** Identifiant unique même pour deux fichiers homonymes. */
export function folderFileKey(file: File, index: number): string {
  return `${index}:${folderFileLabel(file)}`;
}

export function filterBatchableFolderFiles(
  files: File[],
  targetFormat: FormatType
): { eligible: File[]; skipped: { file: File; reason: string }[] } {
  const eligible: File[] = [];
  const skipped: { file: File; reason: string }[] = [];
  for (const file of files) {
    const source = inferSourceFormatFromFile(file);
    if (!source) {
      if (eligible.length < MAX_FOLDER_BATCH) skipped.push({ file, reason: 'format' });
      continue;
    }
    if (source === targetFormat || !isSupportedUiConversion(source, targetFormat)) {
      if (eligible.length < MAX_FOLDER_BATCH) skipped.push({ file, reason: 'pair' });
      continue;
    }
    if (eligible.length >= MAX_FOLDER_BATCH) {
      skipped.push({ file, reason: 'limit' });
      continue;
    }
    eligible.push(file);
  }
  return { eligible, skipped };
}

export async function convertFileContent(options: {
  text: string;
  sourceFormat: FormatType;
  targetFormat: FormatType;
  conversionOptions?: unknown;
  needsToken: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<{ ok: boolean; output: string; error?: string }> {
  const {
    text,
    sourceFormat,
    targetFormat,
    conversionOptions,
    needsToken,
    signal,
    timeoutMs,
  } = options;

  let token: string | null = null;
  if (needsToken) {
    try {
      token = await requestConfirmationToken(
        sourceFormat,
        targetFormat,
        new Blob([text]).size
      );
    } catch (e: unknown) {
      return {
        ok: false,
        output: '',
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  let output = '';
  let lastError = '';
  let failed = false;

  try {
    await convertText(
      text,
      sourceFormat,
      targetFormat,
      () => {},
      (value) => {
        output = value;
      },
      () => {},
      (n) => {
        if (n?.type === 'error') {
          failed = true;
          lastError = n.message || lastError;
        }
      },
      conversionOptions,
      token,
      undefined,
      (message) => {
        if (message) {
          failed = true;
          lastError = message;
        }
      },
      undefined,
      undefined,
      timeoutMs,
      signal ?? null,
      undefined
    );
  } catch (e: unknown) {
    return {
      ok: false,
      output: '',
      error: e instanceof Error ? e.message : String(e),
    };
  }

  if (signal?.aborted) {
    return { ok: false, output: '', error: 'aborted' };
  }

  if (failed || !output.trim()) {
    return { ok: false, output, error: lastError || 'Conversion échouée' };
  }

  return { ok: true, output };
}

export type FolderBatchEstimate = {
  eligibleCount: number;
  skippedCount: number;
  totalBytes: number;
  /** Durée estimée (secondes), 0 si aucun fichier éligible. */
  estimatedSeconds: number;
  /** Fichiers du dossier non pris en compte (au-delà de MAX_FOLDER_BATCH). */
  truncatedCount: number;
};

/** Coût estimé d’un fichier (ms) selon la paire et la taille. */
export function estimateFileConvertMs(file: File, targetFormat: FormatType): number {
  const source = inferSourceFormatFromFile(file);
  if (!source || source === targetFormat || !isSupportedUiConversion(source, targetFormat)) {
    return 0;
  }
  const bytes = typeof file.size === 'number' ? Math.max(0, file.size) : 0;
  const capped = Math.min(bytes, 4_000_000);
  if (conversionNeedsConfirmationToken(source, targetFormat)) {
    return 1400 + capped * 0.025;
  }
  return 280 + capped * 0.008;
}

/** Estimation avant lancement d’un lot (paire + taille, pas un forfait unique). */
export function estimateFolderBatch(
  files: File[],
  targetFormat: FormatType
): FolderBatchEstimate {
  const { eligible, skipped } = filterBatchableFolderFiles(files, targetFormat);
  const truncatedCount = skipped.filter((s) => s.reason === 'limit').length;
  const totalBytes = eligible.reduce(
    (sum, file) => sum + (typeof file.size === 'number' ? file.size : 0),
    0
  );
  const skippedCount = skipped.filter((s) => s.reason !== 'limit').length;
  if (eligible.length === 0) {
    return {
      eligibleCount: 0,
      skippedCount,
      totalBytes: 0,
      estimatedSeconds: 0,
      truncatedCount,
    };
  }
  const rawMs = eligible.reduce((sum, file) => sum + estimateFileConvertMs(file, targetFormat), 0);
  const estimatedSeconds = Math.max(1, Math.min(3600, Math.ceil(rawMs / 1000)));
  return {
    eligibleCount: eligible.length,
    skippedCount,
    totalBytes,
    estimatedSeconds,
    truncatedCount,
  };
}

/** ETA restant pendant un lot (secondes), d’après la progression réelle. */
export function estimateBatchRemainingSeconds(options: {
  startedAtMs: number;
  nowMs?: number;
  processedCount: number;
  totalEligible: number;
  fallbackTotalSeconds?: number;
}): number | null {
  const {
    startedAtMs,
    nowMs = Date.now(),
    processedCount,
    totalEligible,
    fallbackTotalSeconds,
  } = options;
  if (totalEligible <= 0) return null;
  const remainingFiles = Math.max(0, totalEligible - processedCount);
  if (remainingFiles === 0) return 0;
  if (processedCount <= 0) {
    return fallbackTotalSeconds != null ? Math.max(1, Math.round(fallbackTotalSeconds)) : null;
  }
  const elapsed = Math.max(1, nowMs - startedAtMs);
  const avgMs = elapsed / processedCount;
  return Math.max(1, Math.ceil((remainingFiles * avgMs) / 1000));
}

export type BatchFormatLabels = {
  bytes: string;
  kb: string;
  mb: string;
  sec: string;
  min: string;
  hour: string;
};

export const DEFAULT_BATCH_FORMAT_LABELS: BatchFormatLabels = {
  bytes: 'o',
  kb: 'Ko',
  mb: 'Mo',
  sec: 's',
  min: 'min',
  hour: 'h',
};

const BATCH_UNIT_KEYS = [
  'batch.unit.bytes',
  'batch.unit.kb',
  'batch.unit.mb',
  'batch.unit.sec',
  'batch.unit.min',
  'batch.unit.hour',
] as const;

export function getBatchFormatLabels(
  t: (key: (typeof BATCH_UNIT_KEYS)[number]) => string
): BatchFormatLabels {
  return {
    bytes: t('batch.unit.bytes'),
    kb: t('batch.unit.kb'),
    mb: t('batch.unit.mb'),
    sec: t('batch.unit.sec'),
    min: t('batch.unit.min'),
    hour: t('batch.unit.hour'),
  };
}

/** Libellé taille compact (Ko / Mo). */
export function formatBatchSizeLabel(
  bytes: number,
  labels: BatchFormatLabels = DEFAULT_BATCH_FORMAT_LABELS
): string {
  if (bytes < 1024) return `${Math.max(0, Math.round(bytes))} ${labels.bytes}`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} ${labels.kb}`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} ${labels.mb}`;
}

/** Durée estimée lisible (~12 s, ~3 min). */
export function formatBatchDurationLabel(
  seconds: number,
  labels: BatchFormatLabels = DEFAULT_BATCH_FORMAT_LABELS
): string {
  const s = Math.max(0, Math.round(seconds));
  if (s === 0) return `0 ${labels.sec}`;
  if (s < 60) return `~${s} ${labels.sec}`;
  const minutes = Math.floor(s / 60);
  const rem = s % 60;
  if (minutes < 60) {
    return rem >= 15
      ? `~${minutes} ${labels.min} ${rem} ${labels.sec}`
      : `~${minutes} ${labels.min}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0
    ? `~${hours} ${labels.hour} ${mins} ${labels.min}`
    : `~${hours} ${labels.hour}`;
}

/** Rapport CSV (fichier, statut, détail, format source). */
export function buildFolderBatchCsvReport(items: FolderBatchItem[]): string {
  const header = toCsvCells(['file', 'status', 'detail', 'sourceFormat']);
  const rows = items.map((item) =>
    toCsvCells([
      item.fileName,
      item.status,
      item.message ?? '',
      item.sourceFormat ?? '',
    ])
  );
  return [header, ...rows].join('\r\n') + '\r\n';
}

function toCsvCells(cells: Array<string | number>): string {
  return cells
    .map((c) => {
      const s = String(c);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    })
    .join(',');
}

export async function readAndConvertFolderFile(options: {
  file: File;
  targetFormat: FormatType;
  conversionOptions?: unknown;
  needsToken: (source: FormatType, target: FormatType) => boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  id?: string;
  index?: number;
}): Promise<FolderBatchItem> {
  const { file, targetFormat, conversionOptions, needsToken, signal, timeoutMs, index = 0 } = options;
  const id = options.id ?? folderFileKey(file, index);
  const fileName = folderFileLabel(file);
  const sourceFormat = inferSourceFormatFromFile(file);
  if (!sourceFormat) {
    return { id, fileName, status: 'skipped', message: 'format' };
  }
  if (sourceFormat === targetFormat || !isSupportedUiConversion(sourceFormat, targetFormat)) {
    return {
      id,
      fileName,
      status: 'skipped',
      message: 'pair',
      sourceFormat,
    };
  }

  try {
    const text = await readFileAsUtf8(file);
    if (!text.trim()) {
      return {
        id,
        fileName,
        status: 'error',
        message: 'empty',
        sourceFormat,
      };
    }
    const result = await convertFileContent({
      text,
      sourceFormat,
      targetFormat,
      conversionOptions,
      needsToken: needsToken(sourceFormat, targetFormat),
      signal,
      timeoutMs,
    });
    if (!result.ok) {
      return {
        id,
        fileName,
        status: 'error',
        message: result.error || 'error',
        sourceFormat,
      };
    }
    return {
      id,
      fileName,
      status: 'success',
      result: result.output,
      sourceFormat,
    };
  } catch (e: unknown) {
    return {
      id,
      fileName,
      status: 'error',
      message: e instanceof Error ? e.message : String(e),
      sourceFormat,
    };
  }
}
