/**
 * Import fichier / dossier / historique — garde dirty + remplacement des buffers.
 */

import { useCallback, useState, type ChangeEvent } from 'react';
import type { ConversionHistoryItem, ConversionOptions, FormatType } from '../types';
import type { MessageKey } from '../i18n/messages';
import { removeExperimentalTag } from '../utils/asciidocHelpers';
import { applyHistoryToBuffers } from '../utils/conversionPairs';
import { rebuildOptionsFromProfiles, sanitizeActiveProfileIds } from '../utils/conversionProfiles';
import { isReplaceSourceDirty, MAX_CONTENT_CHARS } from '../utils/sessionDraft';
import {
  inferSourceFormatFromFile,
  isAcceptedSourceFile,
  readFileAsUtf8,
} from '../utils/sourceFile';

export type PendingSourceReplace =
  | { kind: 'folder'; index: number }
  | { kind: 'file'; file: File; alignFormat?: boolean }
  | { kind: 'history'; item: ConversionHistoryItem };

type Notify = {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
};

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export type UseSourceImportArgs = {
  sourceFormat: FormatType;
  targetFormat: FormatType;
  sourceModified: boolean;
  resultModified: boolean;
  isEditingResult: boolean;
  dirtyTab: boolean;
  folderFiles: File[];
  t: TranslateFn;
  showSnackbar: (message: string) => void;
  markActiveTabClean: () => void;
  setAdocInput: (value: string) => void;
  setMdOutput: (value: string) => void;
  setOtherOutput: (value: string) => void;
  setSourceFormat: (format: FormatType) => void;
  setTargetFormat: (format: FormatType) => void;
  setCurrentFileName: (name: string | null) => void;
  setImportedFiles: (files: File[]) => void;
  setFolderFiles: (files: File[]) => void;
  setSelectedFileIndex: (index: number) => void;
  setSourceModified: (value: boolean) => void;
  setResultModified: (value: boolean) => void;
  setIsEditingResult: (value: boolean) => void;
  setStatus: (value: string) => void;
  setNotification: (value: Notify | null) => void;
  setShowHistoryPanel: (value: boolean) => void;
  setActiveProfileIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setConversionOptions: (
    value: ConversionOptions | ((prev: ConversionOptions) => ConversionOptions)
  ) => void;
};

export function useSourceImport({
  sourceFormat,
  targetFormat,
  sourceModified,
  resultModified,
  isEditingResult,
  dirtyTab,
  folderFiles,
  t,
  showSnackbar,
  markActiveTabClean,
  setAdocInput,
  setMdOutput,
  setOtherOutput,
  setSourceFormat,
  setTargetFormat,
  setCurrentFileName,
  setImportedFiles,
  setFolderFiles,
  setSelectedFileIndex,
  setSourceModified,
  setResultModified,
  setIsEditingResult,
  setStatus,
  setNotification,
  setShowHistoryPanel,
  setActiveProfileIds,
  setConversionOptions,
}: UseSourceImportArgs) {
  const [showReplaceSourceModal, setShowReplaceSourceModal] = useState(false);
  const [pendingSourceReplace, setPendingSourceReplace] = useState<PendingSourceReplace | null>(
    null
  );

  const isDirty = isReplaceSourceDirty({
    sourceModified,
    resultModified,
    isEditingResult,
    dirtyTab,
  });

  const loadSourceFile = useCallback(
    async (file: File, options?: { alignFormat?: boolean }) => {
      if (!isAcceptedSourceFile(file)) {
        setStatus(t('snack.formatsAccepted'));
        setNotification({
          message: 'Formats acceptés : .adoc, .asciidoc, .md, .txt, .html',
          type: 'error',
          visible: true,
        });
        return;
      }

      let nextFormat = sourceFormat;
      if (options?.alignFormat) {
        const inferred = inferSourceFormatFromFile(file);
        if (inferred) {
          nextFormat = inferred;
          if (inferred !== sourceFormat) {
            setSourceFormat(inferred);
            if (inferred === targetFormat) {
              setTargetFormat(inferred === 'asciidoc' ? 'markdown' : 'asciidoc');
            } else if (inferred !== 'asciidoc' && inferred !== 'markdown') {
              setTargetFormat('markdown');
            }
          }
        }
      }

      try {
        let text = await readFileAsUtf8(file);
        if (nextFormat === 'asciidoc') {
          text = removeExperimentalTag(text);
        }
        if (nextFormat === 'markdown') {
          setMdOutput(text);
          setAdocInput('');
        } else {
          setAdocInput(text);
          setMdOutput('');
        }
        setOtherOutput('');
        setCurrentFileName(file.name);
        setImportedFiles([file]);
        setSourceModified(false);
        markActiveTabClean();
        setStatus(t('snack.fileLoaded', { name: file.name }));
        if (text.length > MAX_CONTENT_CHARS) {
          showSnackbar(t('snack.sessionTooLarge'));
        } else {
          showSnackbar(t('snack.fileLoaded', { name: file.name }));
        }
      } catch {
        setStatus(t('snack.fileReadError'));
        setNotification({
          message: 'Impossible de lire le fichier',
          type: 'error',
          visible: true,
        });
      }
    },
    [
      sourceFormat,
      targetFormat,
      showSnackbar,
      t,
      markActiveTabClean,
      setAdocInput,
      setMdOutput,
      setOtherOutput,
      setSourceFormat,
      setTargetFormat,
      setCurrentFileName,
      setImportedFiles,
      setSourceModified,
      setStatus,
      setNotification,
    ]
  );

  const requestLoadSourceFile = useCallback(
    (file: File, options?: { alignFormat?: boolean }) => {
      if (!isAcceptedSourceFile(file)) {
        setStatus(t('snack.formatsAccepted'));
        setNotification({
          message: 'Formats acceptés : .adoc, .asciidoc, .md, .txt, .html',
          type: 'error',
          visible: true,
        });
        return;
      }
      if (isDirty) {
        setPendingSourceReplace({ kind: 'file', file, alignFormat: options?.alignFormat });
        setShowReplaceSourceModal(true);
        return;
      }
      void loadSourceFile(file, options);
    },
    [isDirty, loadSourceFile, t, setStatus, setNotification]
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    requestLoadSourceFile(file, { alignFormat: true });
    event.target.value = '';
  };

  const handleDropSourceFile = useCallback(
    (file: File) => {
      requestLoadSourceFile(file, { alignFormat: true });
    },
    [requestLoadSourceFile]
  );

  const handleFolderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const textFiles = fileArray.filter((file) =>
      ['.adoc', '.asciidoc', '.md', '.txt', '.html', '.htm'].some((validExt) =>
        file.name.toLowerCase().endsWith(validExt)
      )
    );

    if (textFiles.length === 0) {
      setStatus(t('snack.folderEmpty'));
      return;
    }

    setFolderFiles(textFiles);
    setSelectedFileIndex(-1);
    setImportedFiles([]);
    setCurrentFileName(null);
    setStatus(t('snack.folderLoaded', { count: textFiles.length }));
  };

  const applyFolderFileToSource = useCallback(
    (fileIndex: number) => {
      if (fileIndex < 0 || fileIndex >= folderFiles.length) return;
      const selectedFile = folderFiles[fileIndex];
      setSelectedFileIndex(fileIndex);
      setImportedFiles([selectedFile]);
      void loadSourceFile(selectedFile, { alignFormat: true });
    },
    [folderFiles, loadSourceFile, setSelectedFileIndex, setImportedFiles]
  );

  const handleFileSelect = useCallback(
    (fileIndex: number) => {
      if (fileIndex < 0 || fileIndex >= folderFiles.length) return;
      if (isDirty) {
        setPendingSourceReplace({ kind: 'folder', index: fileIndex });
        setShowReplaceSourceModal(true);
        return;
      }
      applyFolderFileToSource(fileIndex);
    },
    [folderFiles.length, isDirty, applyFolderFileToSource]
  );

  const applyHistoryItem = useCallback(
    (item: ConversionHistoryItem) => {
      const processedSource =
        item.fromFormat === 'asciidoc'
          ? removeExperimentalTag(item.sourceContent)
          : item.sourceContent;
      const processedResult =
        item.toFormat === 'asciidoc' ? removeExperimentalTag(item.resultContent) : item.resultContent;
      const next = applyHistoryToBuffers(
        item.fromFormat,
        item.toFormat,
        processedSource,
        processedResult
      );
      setAdocInput(next.adocInput);
      setMdOutput(next.mdOutput);
      setOtherOutput(next.otherOutput);
      setSourceFormat(item.fromFormat);
      setTargetFormat(item.toFormat);
      const restoredIds = sanitizeActiveProfileIds(item.activeProfileIds);
      if (restoredIds.length > 0) {
        setActiveProfileIds(restoredIds);
        setConversionOptions((prev) => ({
          ...rebuildOptionsFromProfiles(restoredIds),
          metadata: prev.metadata,
        }));
      } else {
        setActiveProfileIds([]);
        if (item.conversionOptions && typeof item.conversionOptions === 'object') {
          setConversionOptions(item.conversionOptions);
        }
      }
      setShowHistoryPanel(false);
      setIsEditingResult(false);
      setSourceModified(false);
      setResultModified(false);
      markActiveTabClean();
      setStatus(t('status.historyRestored'));
      showSnackbar(t('snack.historyRestored'));
    },
    [
      showSnackbar,
      t,
      markActiveTabClean,
      setAdocInput,
      setMdOutput,
      setOtherOutput,
      setSourceFormat,
      setTargetFormat,
      setActiveProfileIds,
      setConversionOptions,
      setShowHistoryPanel,
      setIsEditingResult,
      setSourceModified,
      setResultModified,
      setStatus,
    ]
  );

  const restoreFromHistory = useCallback(
    (item: ConversionHistoryItem) => {
      if (isDirty) {
        setPendingSourceReplace({ kind: 'history', item });
        setShowReplaceSourceModal(true);
        return;
      }
      applyHistoryItem(item);
    },
    [isDirty, applyHistoryItem]
  );

  const closeReplaceSource = useCallback(() => {
    setShowReplaceSourceModal(false);
    setPendingSourceReplace(null);
  }, []);

  const confirmReplaceSource = useCallback(() => {
    const pending = pendingSourceReplace;
    setShowReplaceSourceModal(false);
    setPendingSourceReplace(null);
    if (pending?.kind === 'folder') applyFolderFileToSource(pending.index);
    if (pending?.kind === 'file') void loadSourceFile(pending.file, { alignFormat: pending.alignFormat });
    if (pending?.kind === 'history') applyHistoryItem(pending.item);
  }, [pendingSourceReplace, applyFolderFileToSource, loadSourceFile, applyHistoryItem]);

  return {
    showReplaceSourceModal,
    requestLoadSourceFile,
    handleFileChange,
    handleDropSourceFile,
    handleFolderChange,
    handleFileSelect,
    applyFolderFileToSource,
    loadSourceFile,
    applyHistoryItem,
    restoreFromHistory,
    closeReplaceSource,
    confirmReplaceSource,
  };
}
