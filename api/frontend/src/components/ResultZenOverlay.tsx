/**
 * Mode zen lecture du résultat (plein écran, chrome minimal).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ResultZenOverlayProps {
  open: boolean;
  title: string;
  text: string;
  viewMode: 'text' | 'preview';
  onViewModeChange: (mode: 'text' | 'preview') => void;
  previewHtml?: string;
  previewAsHtmlDocument?: boolean;
  showPreviewToggle?: boolean;
  onClose: () => void;
  onCopy?: () => void;
}

export const ResultZenOverlay: React.FC<ResultZenOverlayProps> = ({
  open,
  title,
  text,
  viewMode,
  onViewModeChange,
  previewHtml = '',
  previewAsHtmlDocument = false,
  showPreviewToggle = true,
  onClose,
  onCopy,
}) => {
  const t = useT();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const emptyHtml = `<p><em>${t('panel.previewEmpty')}</em></p>`;

  useFocusTrap(overlayRef, open, { initialFocusRef: closeBtnRef });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const showPreview = showPreviewToggle && viewMode === 'preview';

  return (
    <div ref={overlayRef} className="result-zen-overlay" role="dialog" aria-modal="true" aria-label={t('zen.result.title')}>
      <div className="result-zen-bar">
        <div className="result-zen-bar-main">
          <span className="result-zen-title">{t('zen.result.title')}</span>
          <span className="result-zen-format">{title}</span>
        </div>
        <div className="result-zen-bar-actions">
          {showPreviewToggle ? (
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
            </div>
          ) : null}
          {onCopy ? (
            <button
              type="button"
              className="result-zen-btn"
              onClick={() => {
                onCopy();
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1400);
              }}
              data-tooltip={copied ? t('common.copied') : t('common.copy')}
            >
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          ) : null}
          <button
            ref={closeBtnRef}
            type="button"
            className="result-zen-btn result-zen-btn--close"
            onClick={onClose}
            aria-label={t('zen.result.exit')}
            data-tooltip={t('zen.result.exit')}
          >
            {t('zen.result.exit')}
          </button>
        </div>
      </div>
      <div className="result-zen-body">
        {!text.trim() ? (
          <div className="result-zen-empty">{t('panel.previewEmpty')}</div>
        ) : showPreview ? (
          previewAsHtmlDocument ? (
            <iframe
              className="result-preview result-preview-frame result-zen-frame"
              title={t('panel.previewHtml')}
              sandbox=""
              srcDoc={previewHtml || emptyHtml}
            />
          ) : (
            <div
              className="result-preview result-zen-content"
              dangerouslySetInnerHTML={{ __html: previewHtml || emptyHtml }}
            />
          )
        ) : (
          <pre className="result-zen-text">{text}</pre>
        )}
      </div>
    </div>
  );
};
