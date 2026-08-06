/**
 * Panneau Source (contenu à convertir).
 */

import React, { memo, useCallback, useRef, useState } from 'react';
import type { FormatType } from '../types';
import { useT } from '../i18n/LocaleContext';
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
  textAreaRef: React.RefObject<HTMLTextAreaElement | null> | null;
  onConvert: () => void;
  canConvert?: boolean;
  onClear?: () => void;
  sourceModified?: boolean;
  format: FormatType;
  loading: boolean;
  currentFileName: string | null;
  folderFiles: File[];
  selectedFileIndex: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSelect: (index: number) => void;
  onMarkModified: () => void;
  onDropFile?: (file: File) => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = memo(function SourcePanel({
  title,
  value,
  onChange,
  placeholder,
  textAreaRef,
  onConvert,
  canConvert = true,
  onClear,
  sourceModified = false,
  format,
  loading,
  currentFileName,
  folderFiles,
  selectedFileIndex,
  onFileChange,
  onFolderChange,
  onFileSelect,
  onMarkModified,
  onDropFile,
}) {
  const t = useT();
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragDepthRef = useRef(0);
  const panelRef = useRef<HTMLElement | null>(null);
  const deletingTimerRef = useRef<number | null>(null);

  const pulseDeleting = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    el.classList.add('panel-deleting');
    if (deletingTimerRef.current != null) window.clearTimeout(deletingTimerRef.current);
    deletingTimerRef.current = window.setTimeout(() => {
      el.classList.remove('panel-deleting');
      deletingTimerRef.current = null;
    }, 500);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length < value.length) pulseDeleting();
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
      ref={panelRef}
      className={`panel panel--source${isDraggingFile ? ' is-file-dragover' : ''}`}
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
              data-tooltip={t('panel.modified.sourceTooltip')}
            >
              {t('panel.modified')}
            </span>
          )}
        </h2>
        <div className="panel-header-actions">
          <label className="file-input-label">
            <span>📄</span>
            <input type="file" accept=".adoc,.asciidoc,.md,.txt,.html,.htm" onChange={onFileChange} />
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
              data-tooltip={t('panel.clearSource', { title })}
              aria-label={t('panel.clearSource', { title })}
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
            aria-label={t('convert.cta.aria')}
            data-tooltip={
              !canConvert ? t('convert.cta.sameFormat') : t('convert.cta.tooltip')
            }
          >
            {loading ? (
              <span className="panel-header-btn-convert-label">
                <span className="panel-header-btn-convert-spinner" aria-hidden="true" />
                {t('convert.cta.running')}
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
                {t('convert.cta')}
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
            <span>{t('panel.selectFile')}</span>
          </label>
          <select
            className="file-selector-select"
            value={selectedFileIndex}
            onChange={(e) => onFileSelect(parseInt(e.target.value, 10))}
          >
            <option value={-1}>{t('panel.chooseFile')}</option>
            {folderFiles.map((file, index) => (
              <option key={`${file.name}-${index}`} value={index}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </option>
            ))}
          </select>
          <div className="file-selector-info">
            <span>📁</span>
            <span>{t('options.filesAvailable', { count: folderFiles.length })}</span>
          </div>
        </div>
      )}
      <div className={`editor-shell${isEmpty ? ' is-empty' : ''}`}>
        {isDraggingFile && (
          <div className="source-drop-overlay" aria-hidden="true">
            <span className="source-drop-overlay-title">{t('panel.dropFile')}</span>
            <span className="source-drop-overlay-hint">.adoc · .md · .txt · .html</span>
          </div>
        )}
        {isEmpty && !isDraggingFile && (
          <EmptyEditorState
            variant="source"
            title={t('panel.source.emptyTitle', { title })}
            description={
              canInsertSample
                ? t('panel.source.emptyDesc')
                : t('panel.source.emptyDescNoSample')
            }
            actionLabel={canInsertSample ? t('panel.source.insertSample') : undefined}
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
          highlightFormat={format}
        />
      </div>
    </section>
  );
});
