/**
 * État et actions de la file de conversion dossier (ZIP + rapport CSV).
 */

import { useCallback, useRef, useState } from 'react';
import type { FormatType } from '../types';
import { downloadTextFile } from '../utils/downloadFile';
import {
  buildFolderBatchCsvReport,
  markFolderBatchAborted,
  withOutputExtension,
  type FolderBatchItem,
} from '../utils/folderBatchConvert';
import { createZipBlob } from '../utils/simpleZip';

export function useFolderBatch() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [items, setItems] = useState<FolderBatchItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setItems((prev) => markFolderBatchAborted(prev));
    setRunning(false);
  }, []);

  const close = useCallback(() => {
    if (running) return;
    setOpen(false);
  }, [running]);

  const downloadZip = useCallback(
    (targetFormat: FormatType) => {
      const entries = items
        .filter((item) => item.status === 'success' && item.result)
        .map((item) => ({
          name: withOutputExtension(item.fileName, targetFormat),
          content: item.result as string,
        }));
      if (entries.length === 0) return;
      const blob = createZipBlob(entries);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ascend-batch-${targetFormat}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [items]
  );

  const downloadCsvReport = useCallback(() => {
    if (items.length === 0) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadTextFile(
      `ascend-batch-report-${stamp}.csv`,
      buildFolderBatchCsvReport(items),
      'text/csv;charset=utf-8'
    );
  }, [items]);

  const beginRun = useCallback((initial: FolderBatchItem[]) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setItems(initial);
    setCurrentIndex(0);
    setOpen(true);
    setRunning(true);
    return abort;
  }, []);

  const finishRun = useCallback(() => {
    setRunning(false);
    abortRef.current = null;
  }, []);

  return {
    open,
    setOpen,
    running,
    setRunning,
    items,
    setItems,
    currentIndex,
    setCurrentIndex,
    abortRef,
    cancel,
    close,
    downloadZip,
    downloadCsvReport,
    beginRun,
    finishRun,
    canDownloadZip: items.some((i) => i.status === 'success'),
    canDownloadReport: items.length > 0 && !running,
  };
}
