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
import { withShortcutId } from '../utils/shortcutTips';
import type { FolderBatchEstimate } from '../utils/folderBatchConvert';
import {
  formatBatchDurationLabel,
  formatBatchSizeLabel,
  folderFileKey,
  folderFileLabel,
  getBatchFormatLabels,
  MAX_FOLDER_BATCH,
} from '../utils/folderBatchConvert';

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
  linkedScroll?: boolean;
  onToggleLinkedScroll?: () => void;
  onTextAreaScroll?: (textarea: HTMLTextAreaElement) => void;
  /** Lance la conversion en file pour tous les fichiers du dossier. */
  onStartFolderBatch?: () => void;
  folderBatchRunning?: boolean;
  /** Estimation lot (éligibles / taille / durée). */
  folderBatchEstimate?: FolderBatchEstimate | null;
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
  linkedScroll = false,
  onToggleLinkedScroll,
  onTextAreaScroll,
  onStartFolderBatch,
  folderBatchRunning = false,
  folderBatchEstimate = null,
}) {
  const t = useT();
  const batchLabels = getBatchFormatLabels((key) => t(key));
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
          <label className="file-input-label" data-tooltip={t('panel.openFile')}>
            <span aria-hidden="true">📄</span>
            <span className="sr-only">{t('panel.openFile')}</span>
            <input type="file" accept=".adoc,.asciidoc,.md,.txt,.html,.htm" onChange={onFileChange} aria-label={t('panel.openFile')} />
          </label>
          <label className="file-input-label" data-tooltip={t('panel.openFolder')}>
            <span aria-hidden="true">📁</span>
            <span className="sr-only">{t('panel.openFolder')}</span>
            <input
              type="file"
              {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
              multiple
              onChange={onFolderChange}
              aria-label={t('panel.openFolder')}
            />
          </label>
          {onToggleLinkedScroll ? (
            <button
              type="button"
              onClick={onToggleLinkedScroll}
              className={`panel-header-btn panel-header-btn--muted${linkedScroll ? ' is-active' : ''}`}
              aria-pressed={linkedScroll}
              data-tooltip={
                linkedScroll ? t('iface.linkedScroll.on') : t('iface.linkedScroll.off')
              }
              aria-label={t('iface.linkedScroll')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M8 7h3M13 7h3M8 12h8M8 17h3M13 17h3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M7 5v14M17 5v14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </svg>
            </button>
          ) : null}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={!value.trim()}
              className="panel-header-btn panel-header-btn--danger"
              data-tooltip={withShortcutId(t('panel.clearSource', { title }), 'clearSource')}
              aria-label={withShortcutId(t('panel.clearSource', { title }), 'clearSource')}
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
            disabled={loading || folderBatchRunning || !value.trim() || !canConvert}
            className={`panel-header-btn panel-header-btn--convert panel-header-btn--convert-primary${loading ? ' is-loading' : ''}`}
            aria-label={withShortcutId(t('convert.cta.aria'), 'convert')}
            data-tooltip={
              !canConvert
                ? t('convert.cta.sameFormat')
                : withShortcutId(t('convert.cta.tooltip'), 'convert')
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
      {loading && <ConversionLoadingBanner compact sourceChars={value.length} />}
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
              <option key={folderFileKey(file, index)} value={index}>
                {folderFileLabel(file)} ({(file.size / 1024).toFixed(1)} KB)
              </option>
            ))}
          </select>
          <div className="file-selector-info">
            <span>📁</span>
            <span>{t('options.filesAvailable', { count: folderFiles.length })}</span>
          </div>
          {onStartFolderBatch && folderFiles.length > 1 ? (
            <div className="folder-batch-launch">
              {folderBatchEstimate ? (
                <div
                  className={`folder-batch-estimate${
                    folderBatchEstimate.eligibleCount === 0 ? ' is-empty' : ''
                  }`}
                  aria-live="polite"
                >
                  {folderBatchEstimate.eligibleCount === 0 ? (
                    <span className="folder-batch-estimate-msg">{t('batch.estimate.none')}</span>
                  ) : (
                    <>
                      <span className="folder-batch-chip folder-batch-chip--ok">
                        {t('batch.estimate.eligible', {
                          count: folderBatchEstimate.eligibleCount,
                        })}
                      </span>
                      {folderBatchEstimate.skippedCount > 0 ? (
                        <span className="folder-batch-chip folder-batch-chip--skip">
                          {t('batch.estimate.skipped', {
                            count: folderBatchEstimate.skippedCount,
                          })}
                        </span>
                      ) : null}
                      {folderBatchEstimate.truncatedCount > 0 ? (
                        <span className="folder-batch-chip folder-batch-chip--warn">
                          {t('batch.estimate.truncated', {
                            count: folderBatchEstimate.truncatedCount,
                            max: MAX_FOLDER_BATCH,
                          })}
                        </span>
                      ) : null}
                      <span className="folder-batch-chip">
                        {formatBatchSizeLabel(folderBatchEstimate.totalBytes, batchLabels)}
                      </span>
                      <span className="folder-batch-chip folder-batch-chip--time">
                        {formatBatchDurationLabel(folderBatchEstimate.estimatedSeconds, batchLabels)}
                      </span>
                    </>
                  )}
                </div>
              ) : null}
              <button
                type="button"
                className="folder-batch-start-btn"
                onClick={onStartFolderBatch}
                disabled={
                  loading ||
                  folderBatchRunning ||
                  (folderBatchEstimate != null && folderBatchEstimate.eligibleCount === 0)
                }
                data-tooltip={
                  folderBatchEstimate && folderBatchEstimate.eligibleCount > 0
                    ? `${t('batch.start.tip')} — ${t('batch.estimate.eligible', {
                        count: folderBatchEstimate.eligibleCount,
                      })}, ${formatBatchSizeLabel(folderBatchEstimate.totalBytes, batchLabels)}, ${formatBatchDurationLabel(
                        folderBatchEstimate.estimatedSeconds,
                        batchLabels
                      )}`
                    : folderBatchEstimate?.eligibleCount === 0
                      ? t('batch.estimate.none')
                      : t('batch.start.tip')
                }
              >
                {folderBatchRunning ? t('batch.running') : t('batch.start')}
              </button>
            </div>
          ) : null}
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
          onTextAreaScroll={onTextAreaScroll}
        />
      </div>
    </section>
  );
});
