/**
 * Fenêtre flottante d’aperçu du résultat (détachée du panneau).
 */

import React, { useEffect, useRef } from 'react';
import { useT } from '../i18n/LocaleContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface PreviewWindowProps {
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  title?: string;
  previewHtml: string;
  previewAsHtmlDocument?: boolean;
  empty?: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  panelStyle: React.CSSProperties;
  isDragging: boolean;
  isResizing: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export const PreviewWindow: React.FC<PreviewWindowProps> = ({
  open,
  minimized,
  maximized,
  title,
  previewHtml,
  previewAsHtmlDocument = false,
  empty = false,
  panelRef,
  panelStyle,
  isDragging,
  isResizing,
  onDragStart,
  onResizeStart,
  onMinimize,
  onToggleMaximize,
  onClose,
}) => {
  const t = useT();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const emptyHtml = `<p><em>${t('panel.previewEmpty')}</em></p>`;

  useFocusTrap(panelRef, open && !minimized, { initialFocusRef: closeBtnRef });

  useEffect(() => {
    if (!open || minimized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, minimized, onClose]);

  if (!open || minimized) return null;

  const stopDrag = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      ref={panelRef as React.RefObject<HTMLDivElement>}
      className={[
        'floating-window',
        'floating-window--enter',
        'preview-window',
        maximized ? 'maximized' : '',
        isDragging ? 'dragging' : '',
        isResizing ? 'resizing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...panelStyle, zIndex: 10005 }}
      role="dialog"
      aria-modal="true"
      aria-label={t('taskbar.preview')}
    >
      <div
        className="floating-window-header floating-window-header--draggable preview-window-header"
        onMouseDown={onDragStart}
      >
        <div className="floating-window-title-wrap preview-window-title-wrap">
          <span className="floating-window-title">{t('taskbar.preview')}</span>
          {title ? (
            <span className="floating-window-count preview-window-format">{title}</span>
          ) : null}
        </div>
        <div className="floating-window-controls" onMouseDown={stopDrag}>
          <button
            type="button"
            className="floating-window-btn floating-window-btn--minimize"
            onClick={onMinimize}
            aria-label={t('settings.minimize')}
            data-tooltip={t('settings.minimize')}
          >
            −
          </button>
          <button
            type="button"
            className="floating-window-btn floating-window-btn--maximize"
            onClick={onToggleMaximize}
            aria-label={maximized ? t('settings.restore') : t('history.fullscreen')}
            data-tooltip={maximized ? t('settings.restore') : t('history.fullscreen')}
          >
            {maximized ? '⧉' : '□'}
          </button>
          <button
            ref={closeBtnRef}
            type="button"
            className="floating-window-btn floating-window-btn--close"
            onClick={onClose}
            aria-label={t('common.close')}
            data-tooltip={t('common.close')}
          >
            ×
          </button>
        </div>
      </div>

      <div className="preview-window-body">
        {empty ? (
          <div className="preview-window-empty">{t('panel.previewEmpty')}</div>
        ) : previewAsHtmlDocument ? (
          <iframe
            className="result-preview-frame preview-window-frame"
            title={t('panel.previewHtml')}
            sandbox=""
            srcDoc={previewHtml || emptyHtml}
          />
        ) : (
          <div
            className="result-preview preview-window-content"
            dangerouslySetInnerHTML={{ __html: previewHtml || emptyHtml }}
          />
        )}
      </div>

      {!maximized && (
        <div
          className="floating-window-resize-handle preview-window-resize-handle"
          onMouseDown={onResizeStart}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
