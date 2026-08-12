/**
 * Panneau Résultat (sortie de conversion).
 */

import React, { memo, useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import { ConversionLoadingBanner } from './ConversionLoadingBanner';
import { EmptyEditorState } from './EmptyEditorState';
import { PanelActionsMenu, type PanelActionItem } from './PanelActionsMenu';
import { TextStats } from './TextStats';
import { EditorWithLines } from './EditorWithLines';
import type { ConversionUiState } from './HeaderStatusPill';

interface ResultPanelProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  sourceHasContent: boolean;
  loading: boolean;
  status: string;
  /** Caractères du document source (feedback conversion). */
  sourceChars?: number;
  isEditingResult: boolean;
  resultModified: boolean;
  actions: PanelActionItem[];
  onClear: () => void;
  onMarkModified: () => void;
  viewMode?: 'text' | 'preview';
  onViewModeChange?: (mode: 'text' | 'preview') => void;
  previewHtml?: string;
  /** When true, HTML preview is rendered in a sandboxed iframe. */
  previewAsHtmlDocument?: boolean;
  /** Hide Texte/Aperçu for formats without useful rich preview (e.g. txt). */
  showPreviewToggle?: boolean;
  /** Ouvre l’aperçu dans une fenêtre flottante. */
  onDetachPreview?: () => void;
  /** True si la fenêtre d’aperçu détachée est déjà ouverte. */
  previewDetached?: boolean;
  textAreaRef?: React.RefObject<HTMLTextAreaElement | null> | null;
  /** Format du résultat (pour coloration syntaxique). */
  format?: string | null;
  /** Teinte visuelle liée au dernier état de conversion. */
  statusTone?: ConversionUiState;
  onTextAreaScroll?: (textarea: HTMLTextAreaElement) => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = memo(function ResultPanel({
  title,
  value,
  onChange,
  sourceHasContent,
  loading,
  status,
  sourceChars = 0,
  isEditingResult,
  resultModified,
  actions,
  onClear,
  onMarkModified,
  viewMode = 'text',
  onViewModeChange,
  previewHtml = '',
  previewAsHtmlDocument = false,
  showPreviewToggle = true,
  onDetachPreview,
  previewDetached = false,
  textAreaRef = null,
  format = null,
  statusTone = 'idle',
  onTextAreaScroll,
}) {
  const t = useT();
  const isLocked = !!value && !isEditingResult;
  const isEditing = !!value && isEditingResult;
  const showPreview = showPreviewToggle && viewMode === 'preview' && !isEditingResult;
  const previewEmptyHtml = `<p><em>${t('panel.previewEmpty')}</em></p>`;
  const prevLoadingRef = useRef(loading);
  const [revealToken, setRevealToken] = useState(0);
  const toneClass =
    statusTone === 'success' || statusTone === 'error' || statusTone === 'loading'
      ? ` status-tone-${statusTone}`
      : '';

  useEffect(() => {
    if (prevLoadingRef.current && !loading && value.trim()) {
      setRevealToken((n) => n + 1);
    }
    prevLoadingRef.current = loading;
  }, [loading, value]);

  return (
    <section
      className={`panel panel--result${isLocked ? ' result-locked' : isEditing ? ' result-editing' : ''}${loading ? ' is-converting' : ''}${toneClass}`}
      data-status-tone={statusTone !== 'idle' ? statusTone : undefined}
    >
      <div className="panel-header">
        <h2>
          {title}
          {resultModified && (
            <span
              className="panel-modified-badge"
              data-tooltip={t('panel.modified.resultTooltip')}
            >
              {t('panel.modified')}
            </span>
          )}
        </h2>
        <div className="panel-header-actions">
          {value ? (
            <>
              {showPreviewToggle && onViewModeChange && !isEditingResult && (
                <div className="result-view-toggle" role="group" aria-label={t('panel.viewMode')}>
                  <button
                    type="button"
                    className={`result-view-btn${viewMode === 'text' ? ' is-active' : ''}`}
                    onClick={() => onViewModeChange('text')}
                  >
                    {t('panel.text')}
                  </button>
                  <button
                    type="button"
                    className={`result-view-btn${viewMode === 'preview' ? ' is-active' : ''}`}
                    onClick={() => onViewModeChange('preview')}
                  >
                    {t('panel.preview')}
                  </button>
                  {onDetachPreview ? (
                    <button
                      type="button"
                      className={`result-view-btn result-view-btn--detach${previewDetached ? ' is-active' : ''}`}
                      onClick={onDetachPreview}
                      aria-pressed={previewDetached}
                      aria-label={previewDetached ? t('panel.previewDock') : t('panel.previewDetach')}
                      data-tooltip={
                        previewDetached ? t('panel.previewDock') : t('panel.previewDetach')
                      }
                    >
                      ⧉
                    </button>
                  ) : null}
                </div>
              )}
              {isLocked && (
                <span
                  className="result-zone-state result-zone-locked"
                  role="status"
                  aria-live="polite"
                  data-tooltip={t('panel.locked.tooltip')}
                >
                  {t('panel.locked')}
                </span>
              )}
              {isEditing && (
                <span
                  className="result-zone-state result-zone-editing"
                  role="status"
                  aria-live="polite"
                  data-tooltip={t('panel.editing.tooltip')}
                >
                  {t('panel.editing')}
                </span>
              )}
              <PanelActionsMenu items={actions} />
              {!isEditingResult && (
                <button
                  type="button"
                  onClick={onClear}
                  className="panel-header-btn panel-header-btn--danger"
                  data-tooltip={t('panel.clearResult')}
                  aria-label={t('panel.clearResult')}
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
            </>
          ) : null}
        </div>
      </div>
      {loading && <ConversionLoadingBanner status={status} sourceChars={sourceChars} />}
      {value ? (
        <div className="panel-toolbar panel-toolbar--end">
          <TextStats text={value} />
        </div>
      ) : null}
      <div
        className={`editor-shell${!value.trim() && !loading ? ' is-empty' : ''}${loading ? ' is-converting' : ''}${revealToken > 0 && !loading ? ' is-result-reveal' : ''}`}
        key={revealToken > 0 ? `result-reveal-${revealToken}` : 'result-shell'}
      >
        {loading && (
          <div className="result-convert-skeleton" aria-hidden="true">
            <span className="result-skeleton-line" style={{ width: '78%' }} />
            <span className="result-skeleton-line" style={{ width: '92%' }} />
            <span className="result-skeleton-line" style={{ width: '64%' }} />
            <span className="result-skeleton-line" style={{ width: '86%' }} />
            <span className="result-skeleton-line" style={{ width: '71%' }} />
            <span className="result-skeleton-line result-skeleton-line--short" style={{ width: '44%' }} />
          </div>
        )}
        {!value.trim() && !loading && (
          <EmptyEditorState
            variant="result"
            resultMode={!sourceHasContent ? 'waiting' : 'ready'}
            title={t('panel.result.emptyTitle', { title })}
            description={
              !sourceHasContent
                ? t('panel.result.emptyNoSource')
                : t('panel.result.emptyReady')
            }
          />
        )}
        {showPreview ? (
          previewAsHtmlDocument ? (
            <iframe
              className="result-preview result-preview-frame"
              title={t('panel.previewHtml')}
              sandbox=""
              srcDoc={previewHtml || previewEmptyHtml}
            />
          ) : (
            <div
              className="result-preview"
              dangerouslySetInnerHTML={{ __html: previewHtml || previewEmptyHtml }}
            />
          )
        ) : (
          <EditorWithLines
            textAreaRef={textAreaRef}
            className="result-textarea"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (isEditingResult) onMarkModified();
            }}
            readOnly={!isEditingResult}
            placeholder={
              loading
                ? t('panel.result.placeholderLoading')
                : !value.trim()
                  ? ''
                  : t('panel.result.placeholder', { title })
            }
            highlightFormat={format}
            onTextAreaScroll={onTextAreaScroll}
          />
        )}
      </div>
    </section>
  );
});
