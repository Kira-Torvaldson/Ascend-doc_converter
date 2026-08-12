/**
 * File de conversion dossier — helpers (extensions, promesse convertText).
 */

import type { FormatType } from '../types';
import { convertText, requestConfirmationToken } from '../converters';
import { isSupportedUiConversion } from './conversionPairs';
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

export function filterBatchableFolderFiles(
  files: File[],
  targetFormat: FormatType
): { eligible: File[]; skipped: { file: File; reason: string }[] } {
  const eligible: File[] = [];
  const skipped: { file: File; reason: string }[] = [];
  for (const file of files.slice(0, MAX_FOLDER_BATCH)) {
    const source = inferSourceFormatFromFile(file);
    if (!source) {
      skipped.push({ file, reason: 'format' });
      continue;
    }
    if (source === targetFormat || !isSupportedUiConversion(source, targetFormat)) {
      skipped.push({ file, reason: 'pair' });
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

export async function readAndConvertFolderFile(options: {
  file: File;
  targetFormat: FormatType;
  conversionOptions?: unknown;
  needsToken: (source: FormatType, target: FormatType) => boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<FolderBatchItem> {
  const { file, targetFormat, conversionOptions, needsToken, signal, timeoutMs } = options;
  const id = `${file.name}-${file.size}-${file.lastModified}`;
  const sourceFormat = inferSourceFormatFromFile(file);
  if (!sourceFormat) {
    return { id, fileName: file.name, status: 'skipped', message: 'format' };
  }
  if (sourceFormat === targetFormat || !isSupportedUiConversion(sourceFormat, targetFormat)) {
    return {
      id,
      fileName: file.name,
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
        fileName: file.name,
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
        fileName: file.name,
        status: 'error',
        message: result.error || 'error',
        sourceFormat,
      };
    }
    return {
      id,
      fileName: file.name,
      status: 'success',
      result: result.output,
      sourceFormat,
    };
  } catch (e: unknown) {
    return {
      id,
      fileName: file.name,
      status: 'error',
      message: e instanceof Error ? e.message : String(e),
      sourceFormat,
    };
  }
}
