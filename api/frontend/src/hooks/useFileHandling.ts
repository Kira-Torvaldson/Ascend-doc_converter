/**
 * ============================================================================
 * HOOK: useFileHandling - Gestion des fichiers
 * ============================================================================
 */

import { useState, useCallback } from 'react';
import { FormatType } from '../types';

interface UseFileHandlingReturn {
  currentFileName: string | null;
  setCurrentFileName: (name: string | null) => void;
  importedFiles: File[];
  setImportedFiles: (files: File[]) => void;
  folderFiles: File[];
  setFolderFiles: (files: File[]) => void;
  selectedFileIndex: number;
  setSelectedFileIndex: (index: number) => void;
  handleFileSelect: (file: File) => Promise<void>;
  handleFolderSelect: (files: File[]) => void;
}

/**
 * Hook personnalisé pour gérer les fichiers
 */
export function useFileHandling(
  setAdocInput: (text: string) => void,
  setMdOutput: (text: string) => void,
  setSourceFormat: (format: FormatType) => void,
  setTargetFormat: (format: FormatType) => void
): UseFileHandlingReturn {
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [importedFiles, setImportedFiles] = useState<File[]>([]);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);

  const handleFileSelect = useCallback(async (file: File) => {
    const text = await file.text();
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // Determine format from extension
    let format: FormatType = 'txt';
    if (extension === 'adoc' || extension === 'asciidoc') {
      format = 'asciidoc';
      setAdocInput(text);
      setMdOutput('');
    } else if (extension === 'md' || extension === 'markdown') {
      format = 'markdown';
      setMdOutput(text);
      setAdocInput('');
    } else if (extension === 'html' || extension === 'htm') {
      format = 'html';
      setAdocInput(text);
      setMdOutput('');
    } else if (extension === 'yaml' || extension === 'yml') {
      format = 'yaml';
      setAdocInput(text);
      setMdOutput('');
    } else if (extension === 'json') {
      format = 'json';
      setAdocInput(text);
      setMdOutput('');
    } else {
      format = 'txt';
      setAdocInput(text);
      setMdOutput('');
    }
    
    setSourceFormat(format);
    setCurrentFileName(file.name);
  }, [setAdocInput, setMdOutput, setSourceFormat, setTargetFormat]);

  const handleFolderSelect = useCallback((files: File[]) => {
    setFolderFiles(files);
    setSelectedFileIndex(-1);
  }, []);

  return {
    currentFileName,
    setCurrentFileName,
    importedFiles,
    setImportedFiles,
    folderFiles,
    setFolderFiles,
    selectedFileIndex,
    setSelectedFileIndex,
    handleFileSelect,
    handleFolderSelect
  };
}
