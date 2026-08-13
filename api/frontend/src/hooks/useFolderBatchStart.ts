/**
 * Lancement d’une conversion batch sur les fichiers d’un dossier.
 */

import { useCallback, type MutableRefObject } from 'react';
import type { ConversionOptions, FormatType } from '../types';
import type { MessageKey } from '../i18n/messages';
import type { UserSettings } from '../settings/userSettings';
import { appendDocumentSignature, applyProfileToMetadata } from '../settings/profileIdentity';
import {
  applyResultToBuffers,
  conversionNeedsConfirmationToken,
  isSupportedUiConversion,
  writeResultBuffer,
} from '../utils/conversionPairs';
import {
  estimateFolderBatch,
  filterBatchableFolderFiles,
  folderFileKey,
  folderFileLabel,
  formatBatchDurationLabel,
  getBatchFormatLabels,
  markFolderBatchAborted,
  readAndConvertFolderFile,
  type FolderBatchItem,
} from '../utils/folderBatchConvert';
import { readFileAsUtf8 } from '../utils/sourceFile';
import type { SessionTabSnapshot } from '../utils/sessionDraft';
import type { LiveEditorSnapshot } from './useConversionFlow';

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

function applyTocAndProfile(
  conversionOptions: ConversionOptions,
  userSettings: UserSettings
): ConversionOptions {
  let opts = conversionOptions;
  if (userSettings.conversion.defaultTocEnabled && opts.rendering) {
    opts = {
      ...opts,
      rendering: {
        ...opts.rendering,
        tableOfContents: { ...opts.rendering.tableOfContents, enabled: true },
      },
    };
  } else if (userSettings.conversion.defaultTocEnabled) {
    opts = { ...opts, rendering: { tableOfContents: { enabled: true } } };
  }
  if (userSettings.conversion.autoApplyUserToMetadata) {
    const metadata = applyProfileToMetadata(opts.metadata, userSettings.profile, 'fillEmpty');
    opts = { ...opts, metadata };
  }
  return opts;
}

export type UseFolderBatchStartArgs = {
  folderBatchRunning: boolean;
  loading: boolean;
  folderFiles: File[];
  sourceFormat: FormatType;
  targetFormat: FormatType;
  isEditingResult: boolean;
  conversionOptions: ConversionOptions;
  userSettings: UserSettings;
  conversionTimeoutMs: number;
  t: TranslateFn;
  showSnackbar: (message: string) => void;
  liveEditorRef: MutableRefObject<LiveEditorSnapshot>;
  beginFolderBatch: (initial: FolderBatchItem[]) => AbortController;
  finishFolderBatch: () => void;
  setFolderBatchIndex: (index: number) => void;
  setFolderBatchItems: (
    value: FolderBatchItem[] | ((prev: FolderBatchItem[]) => FolderBatchItem[])
  ) => void;
  patchSessionTabContent: (
    id: string,
    updater: (tab: SessionTabSnapshot) => SessionTabSnapshot
  ) => void;
  setStatus: (value: string) => void;
  setSourceFormat: (format: FormatType) => void;
  setAdocInput: (value: string) => void;
  setMdOutput: (value: string) => void;
  setOtherOutput: (value: string) => void;
  setCurrentFileName: (name: string | null) => void;
  markActiveTabClean: () => void;
  rememberLivePair: (source: FormatType, target: FormatType, sourceText: string) => void;
};

export function useFolderBatchStart({
  folderBatchRunning,
  loading,
  folderFiles,
  sourceFormat,
  targetFormat,
  isEditingResult,
  conversionOptions,
  userSettings,
  conversionTimeoutMs,
  t,
  showSnackbar,
  liveEditorRef,
  beginFolderBatch,
  finishFolderBatch,
  setFolderBatchIndex,
  setFolderBatchItems,
  patchSessionTabContent,
  setStatus,
  setSourceFormat,
  setAdocInput,
  setMdOutput,
  setOtherOutput,
  setCurrentFileName,
  markActiveTabClean,
  rememberLivePair,
}: UseFolderBatchStartArgs) {
  const startFolderBatch = useCallback(async () => {
    if (folderBatchRunning || loading || folderFiles.length === 0) return;
    if (!isSupportedUiConversion(sourceFormat, targetFormat) && folderFiles.length === 0) return;
    if (isEditingResult) {
      setStatus(t('snack.saveEditFirst'));
      return;
    }

    const { eligible, skipped } = filterBatchableFolderFiles(folderFiles, targetFormat);
    if (eligible.length === 0) {
      setStatus(t('batch.noneEligible'));
      showSnackbar(t('batch.noneEligible'));
      return;
    }

    const preEstimate = estimateFolderBatch(folderFiles, targetFormat);
    showSnackbar(
      t('batch.starting', {
        count: eligible.length,
        duration: formatBatchDurationLabel(
          preEstimate.estimatedSeconds,
          getBatchFormatLabels((key) => t(key))
        ),
      })
    );

    const initial: FolderBatchItem[] = [
      ...eligible.map((file, index) => ({
        id: folderFileKey(file, index),
        fileName: folderFileLabel(file),
        status: 'pending' as const,
      })),
      ...skipped.map(({ file, reason }, index) => ({
        id: `${folderFileKey(file, eligible.length + index)}:skip`,
        fileName: folderFileLabel(file),
        status: 'skipped' as const,
        message: reason,
      })),
    ];

    const abort = beginFolderBatch(initial);
    const batchOriginTabId = liveEditorRef.current.activeSessionTabId;
    const batchOriginSourceText = liveEditorRef.current.sourceText;
    const batchOriginSourceFormat = liveEditorRef.current.sourceFormat;
    const opts = applyTocAndProfile(conversionOptions, userSettings);

    const results: FolderBatchItem[] = [...initial];
    let lastSuccess: FolderBatchItem | null = null;

    for (let i = 0; i < eligible.length; i++) {
      if (abort.signal.aborted) break;
      const file = eligible[i];
      const itemId = folderFileKey(file, i);
      setFolderBatchIndex(i);
      setFolderBatchItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: 'running' } : item))
      );
      setStatus(t('batch.progress', { current: i + 1, total: eligible.length }));

      const converted = await readAndConvertFolderFile({
        file,
        targetFormat,
        conversionOptions: opts,
        needsToken: conversionNeedsConfirmationToken,
        signal: abort.signal,
        timeoutMs: conversionTimeoutMs,
        id: itemId,
        index: i,
      });

      if (abort.signal.aborted) {
        setFolderBatchItems((prev) => markFolderBatchAborted(prev));
        break;
      }

      const nextItem: FolderBatchItem = {
        ...converted,
        id: itemId,
        result: converted.result
          ? appendDocumentSignature(converted.result, userSettings.profile)
          : converted.result,
      };
      results[results.findIndex((r) => r.id === itemId)] = nextItem;
      setFolderBatchItems((prev) => prev.map((item) => (item.id === itemId ? nextItem : item)));
      if (nextItem.status === 'success') lastSuccess = nextItem;
    }

    finishFolderBatch();

    if (abort.signal.aborted) {
      setStatus(t('batch.cancelled'));
      return;
    }

    const ok = results.filter((r) => r.status === 'success').length;
    const err = results.filter((r) => r.status === 'error').length;
    setStatus(t('batch.done', { ok, err, skip: results.filter((r) => r.status === 'skipped').length }));

    if (lastSuccess?.result) {
      const writeSource = lastSuccess.sourceFormat || sourceFormat;
      const lastFile = eligible.find((f, idx) => folderFileKey(f, idx) === lastSuccess?.id);
      let sourceText = '';
      if (lastFile && lastSuccess.sourceFormat) {
        try {
          sourceText = await readFileAsUtf8(lastFile);
        } catch {
          /* ignore */
        }
      }

      const applyBatchSuccessToTab = (tab: SessionTabSnapshot) => {
        let next = tab;
        if (sourceText && lastSuccess.sourceFormat) {
          next = {
            ...next,
            sourceFormat: lastSuccess.sourceFormat,
            targetFormat,
            currentFileName: lastFile?.name ?? next.currentFileName,
            ...(lastSuccess.sourceFormat === 'markdown'
              ? { mdOutput: sourceText }
              : { adocInput: sourceText }),
          };
        }
        return applyResultToBuffers(next, writeSource, targetFormat, lastSuccess.result as string);
      };

      const live = liveEditorRef.current;
      const originEdited =
        live.activeSessionTabId === batchOriginTabId &&
        (live.sourceFormat !== batchOriginSourceFormat ||
          live.sourceText !== batchOriginSourceText);
      if (live.activeSessionTabId !== batchOriginTabId) {
        patchSessionTabContent(batchOriginTabId, applyBatchSuccessToTab);
        showSnackbar(t('snack.convertAppliedOtherTab'));
      } else if (originEdited) {
        showSnackbar(t('snack.batchKeptEdits'));
      } else {
        if (lastSuccess.sourceFormat) {
          setSourceFormat(lastSuccess.sourceFormat);
        }
        if (sourceText && lastSuccess.sourceFormat) {
          if (lastSuccess.sourceFormat === 'markdown') setMdOutput(sourceText);
          else setAdocInput(sourceText);
          if (lastFile) setCurrentFileName(lastFile.name);
          rememberLivePair(lastSuccess.sourceFormat, targetFormat, sourceText);
        }
        writeResultBuffer(writeSource, targetFormat, lastSuccess.result, {
          setAdocInput,
          setMdOutput,
          setOtherOutput,
        });
        markActiveTabClean();
      }
    }

    showSnackbar(t('batch.done', { ok, err, skip: results.filter((r) => r.status === 'skipped').length }));
  }, [
    folderBatchRunning,
    beginFolderBatch,
    finishFolderBatch,
    setFolderBatchIndex,
    setFolderBatchItems,
    loading,
    folderFiles,
    sourceFormat,
    targetFormat,
    isEditingResult,
    conversionOptions,
    userSettings,
    conversionTimeoutMs,
    t,
    showSnackbar,
    markActiveTabClean,
    patchSessionTabContent,
    liveEditorRef,
    rememberLivePair,
    setStatus,
    setSourceFormat,
    setAdocInput,
    setMdOutput,
    setOtherOutput,
    setCurrentFileName,
  ]);

  return { startFolderBatch };
}
