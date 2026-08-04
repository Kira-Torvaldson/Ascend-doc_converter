/**
 * Panneau Source (contenu à convertir).
 */

import React, { useCallback, useRef, useState } from 'react';
import type { FormatType } from '../types';
import { ConversionLoadingBanner } from './ConversionLoadingBanner';
import { EmptyEditorState } from './EmptyEditorState';
import { TextStats } from './TextStats';
import { getSampleDocument } from '../examples/sampleDocuments';
import { EditorWithLines } from './EditorWithLines';

interface SourcePanelProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  textAreaRef: React.RefObject<HTMLTextAreaElement> | null;
  onConvert: () => void;
  canConvert?: boolean;
  onClear?: () => void;
  isDeleting?: boolean;
  sourceModified?: boolean;
  format: FormatType;
  loading: boolean;
  currentFileName: string | null;
  folderFiles: File[];
  selectedFileIndex: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect: (index: number) => void;
  onDeletingPulse: () => void;
  onMarkModified: () => void;
  onDropFile?: (file: File) => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  title,
  value,
  onChange,
  placeholder,
  textAreaRef,
  onConvert,
  canConvert = true,
  onClear,
  isDeleting = false,
  sourceModified = false,
  format,
  loading,
  currentFileName,
  folderFiles,
  selectedFileIndex,
  onFileChange,
  onFolderChange,
  onFileSelect,
  onDeletingPulse,
  onMarkModified,
  onDropFile,
}) => {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragDepthRef = useRef(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length < value.length) onDeletingPulse();
    onChange(newValue);
  };

  const resetDrag = useCallback(() => {
    dragDepthRef.current = 0;
    setIsDraggingFile(false);
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    if (!onDropFile) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!onDropFile) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) resetDrag();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!onDropFile) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!onDropFile) return;
    e.preventDefault();
    e.stopPropagation();
    resetDrag();
    const file = e.dataTransfer.files?.[0];
    if (file) onDropFile(file);
  };

  const isEmpty = !value.trim();
  const canInsertSample = format === 'asciidoc' || format === 'markdown';

  return (
    <section
      className={`panel panel--source${isDeleting ? ' panel-deleting' : ''}${isDraggingFile ? ' is-file-dragover' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="panel-header">
        <h2>
          {title}
          {sourceModified && (
            <span
              className="panel-modified-badge"
              data-tooltip="Document modifié depuis la dernière conversion"
            >
              modifié
            </span>
          )}
        </h2>
        <div className="panel-header-actions">
          <label className="file-input-label">
            <span>📄</span>
            <input type="file" accept=".adoc,.asciidoc,.md,.txt" onChange={onFileChange} />
          </label>
          <label className="file-input-label">
            <span>📁</span>
            <input
              type="file"
              {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
              multiple
              onChange={onFolderChange}
            />
          </label>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={!value.trim()}
              className="panel-header-btn panel-header-btn--danger"
              data-tooltip={`Effacer le contenu ${title}`}
              aria-label={`Effacer le contenu ${title}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12zM10 11v6M14 11v6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onConvert}
            disabled={loading || !value.trim() || !canConvert}
            className={`panel-header-btn panel-header-btn--convert panel-header-btn--convert-primary${loading ? ' is-loading' : ''}`}
            aria-label="Convertir le document"
            data-tooltip={
              !canConvert
                ? 'Les formats source et destination doivent être différents'
                : 'Convertir le document'
            }
          >
            {loading ? (
              <span className="panel-header-btn-convert-label">
                <span className="panel-header-btn-convert-spinner" aria-hidden="true" />
                Conversion…
              </span>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Convertir
              </>
            )}
          </button>
        </div>
      </div>
      {loading && <ConversionLoadingBanner compact />}
      <div className="panel-toolbar">
        {currentFileName && <span className="file-name">{currentFileName}</span>}
        {value ? <TextStats text={value} /> : null}
      </div>
      {folderFiles.length > 0 && (
        <div className="file-selector">
          <label className="file-selector-label">
            <span>📂</span>
            <span>Sélectionner un fichier à convertir</span>
          </label>
          <select
            className="file-selector-select"
            value={selectedFileIndex}
            onChange={(e) => onFileSelect(parseInt(e.target.value, 10))}
          >
            <option value={-1}>-- Choisir un fichier --</option>
            {folderFiles.map((file, index) => (
              <option key={`${file.name}-${index}`} value={index}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </option>
            ))}
          </select>
          <div className="file-selector-info">
            <span>📁</span>
            <span>
              {folderFiles.length} fichier{folderFiles.length > 1 ? 's' : ''} disponible
              {folderFiles.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
      <div className={`editor-shell${isEmpty ? ' is-empty' : ''}`}>
        {isDraggingFile && (
          <div className="source-drop-overlay" aria-hidden="true">
            <span className="source-drop-overlay-title">Déposer le fichier</span>
            <span className="source-drop-overlay-hint">.adoc · .md · .txt</span>
          </div>
        )}
        {isEmpty && !isDraggingFile && (
          <EmptyEditorState
            variant="source"
            title={`Collez votre ${title} ici`}
            description={
              canInsertSample
                ? 'Glissez un fichier, chargez-en un, ou essayez un exemple.'
                : 'Glissez un fichier, chargez-en un ou collez votre contenu.'
            }
            actionLabel={canInsertSample ? 'Insérer un exemple' : undefined}
            onAction={
              canInsertSample
                ? () => {
                    onChange(getSampleDocument(format));
                    onMarkModified();
                    requestAnimationFrame(() => textAreaRef?.current?.focus());
                  }
                : undefined
            }
          />
        )}
        <EditorWithLines
          textAreaRef={textAreaRef}
          className="source-textarea"
          value={value}
          onChange={handleChange}
          placeholder={isEmpty ? '' : placeholder}
        />
      </div>
    </section>
  );
};
