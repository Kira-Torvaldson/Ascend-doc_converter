/**
 * Copie, export fichier et archive ZIP du document courant.
 */

import { useCallback } from 'react';
import type { FormatType } from '../types';
import type { MessageKey } from '../i18n/messages';
import { readResultBuffer } from '../utils/conversionPairs';
import type { ConversionWarningItem } from '../utils/conversionWarnings';
import { downloadTextFile } from '../utils/downloadFile';
import { createZipBlob } from '../utils/simpleZip';

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

const FORMAT_EXTENSIONS: Record<FormatType, string> = {
  asciidoc: '.adoc',
  markdown: '.md',
  html: '.html',
  pdf: '.pdf',
  yaml: '.yaml',
  json: '.json',
  txt: '.txt',
};

function formatFileExt(format: FormatType): string {
  if (format === 'markdown') return 'md';
  if (format === 'asciidoc') return 'adoc';
  if (format === 'html') return 'html';
  return 'txt';
}

export type UseDocumentExportArgs = {
  sourceFormat: FormatType;
  targetFormat: FormatType;
  adocInput: string;
  mdOutput: string;
  otherOutput: string;
  currentFileName: string | null;
  status: string;
  conversionWarnings: ConversionWarningItem[];
  t: TranslateFn;
  showSnackbar: (message: string) => void;
  setStatus: (value: string) => void;
  setCopied: (value: boolean) => void;
};

export function useDocumentExport({
  sourceFormat,
  targetFormat,
  adocInput,
  mdOutput,
  otherOutput,
  currentFileName,
  status,
  conversionWarnings,
  t,
  showSnackbar,
  setStatus,
  setCopied,
}: UseDocumentExportArgs) {
  const handleCopy = useCallback(async () => {
    const textToCopy = readResultBuffer(sourceFormat, targetFormat, {
      adocInput,
      mdOutput,
      otherOutput,
    });
    if (!textToCopy || !textToCopy.trim()) {
      setStatus(t('snack.nothingToCopy'));
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setStatus(t('snack.copiedChars', { count: textToCopy.length }));
      showSnackbar(t('snack.copiedChars', { count: textToCopy.length }));
      setTimeout(() => {
        setCopied(false);
        if (status.includes('copié')) {
          setStatus('');
        }
      }, 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setStatus(t('snack.copiedChars', { count: textToCopy.length }));
        showSnackbar(t('snack.copiedChars', { count: textToCopy.length }));
        setTimeout(() => {
          setCopied(false);
          if (status.includes('copié')) {
            setStatus('');
          }
        }, 2000);
      } catch {
        setStatus(t('snack.copyError'));
      }
      document.body.removeChild(textArea);
    }
  }, [
    sourceFormat,
    targetFormat,
    adocInput,
    mdOutput,
    otherOutput,
    status,
    t,
    showSnackbar,
    setStatus,
    setCopied,
  ]);

  const handleExport = useCallback(() => {
    const textToExport = readResultBuffer(sourceFormat, targetFormat, {
      adocInput,
      mdOutput,
      otherOutput,
    });
    if (!textToExport || !textToExport.trim()) {
      setStatus(t('snack.nothingToExport'));
      return;
    }

    const extension = FORMAT_EXTENSIONS[targetFormat] || '.txt';
    const defaultFileName = `conversion_${new Date().toISOString().slice(0, 10)}${extension}`;
    const fileName = prompt('Nom du fichier:', defaultFileName) || defaultFileName;
    downloadTextFile(fileName, textToExport);
    setStatus(t('snack.exported', { name: fileName }));
  }, [sourceFormat, targetFormat, adocInput, mdOutput, otherOutput, t, setStatus]);

  const handleExportZip = useCallback(() => {
    const sourceText = sourceFormat === 'markdown' ? mdOutput : adocInput;
    const resultText = readResultBuffer(sourceFormat, targetFormat, {
      adocInput,
      mdOutput,
      otherOutput,
    });
    const base = (currentFileName || 'document').replace(/\.[^/.]+$/, '');
    const srcExt = formatFileExt(sourceFormat);
    const outExt = formatFileExt(targetFormat);
    const blob = createZipBlob([
      { name: `${base}-source.${srcExt}`, content: sourceText },
      { name: `${base}-result.${outExt}`, content: resultText },
      {
        name: `${base}-meta.json`,
        content: JSON.stringify(
          {
            sourceFormat,
            targetFormat,
            fileName: currentFileName,
            exportedAt: new Date().toISOString(),
            warnings: conversionWarnings,
          },
          null,
          2
        ),
      },
    ]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}-ascend.zip`;
    a.click();
    URL.revokeObjectURL(url);
    showSnackbar(t('snack.zipDownloaded'));
  }, [
    sourceFormat,
    targetFormat,
    adocInput,
    mdOutput,
    otherOutput,
    currentFileName,
    conversionWarnings,
    showSnackbar,
    t,
  ]);

  return { handleCopy, handleExport, handleExportZip };
}
