/**
 * Panneau de progression pour la file de conversion dossier.
 */

import React from 'react';
import { useT } from '../i18n/LocaleContext';
import type { MessageKey } from '../i18n/messages';
import type { FolderBatchItem } from '../utils/folderBatchConvert';

interface FolderBatchPanelProps {
  open: boolean;
  items: FolderBatchItem[];
  running: boolean;
  currentIndex: number;
  onCancel: () => void;
  onClose: () => void;
  onDownloadZip?: () => void;
  canDownloadZip?: boolean;
}

const KNOWN_SKIP_REASONS = new Set(['format', 'pair']);
const KNOWN_ERROR_REASONS = new Set(['empty', 'aborted']);

function resolveBatchDetail(item: FolderBatchItem, t: (key: MessageKey) => string): string | null {
  if (!item.message) return null;
  if (item.status === 'skipped' && KNOWN_SKIP_REASONS.has(item.message)) {
    return t(`batch.reason.${item.message}` as MessageKey);
  }
  if (item.status === 'error') {
    if (KNOWN_ERROR_REASONS.has(item.message)) {
      return t(`batch.reason.${item.message}` as MessageKey);
    }
    return item.message;
  }
  return null;
}

export const FolderBatchPanel: React.FC<FolderBatchPanelProps> = ({
  open,
  items,
  running,
  currentIndex,
  onCancel,
  onClose,
  onDownloadZip,
  canDownloadZip = false,
}) => {
  const t = useT();
  if (!open || items.length === 0) return null;

  const done = items.filter((i) => i.status === 'success').length;
  const errors = items.filter((i) => i.status === 'error').length;
  const skipped = items.filter((i) => i.status === 'skipped').length;
  const total = items.length;
  const processed = items.filter((i) => i.status !== 'pending' && i.status !== 'running').length;
  const pct = Math.round((processed / Math.max(1, total)) * 100);

  return (
    <div className="folder-batch-panel" role="status" aria-live="polite">
      <div className="folder-batch-panel-head">
        <div className="folder-batch-panel-title">
          <strong>{t('batch.title')}</strong>
          <span className="folder-batch-panel-meta">
            {running
              ? t('batch.progress', { current: Math.min(currentIndex + 1, total), total })
              : t('batch.done', { ok: done, err: errors, skip: skipped })}
          </span>
        </div>
        <div className="folder-batch-panel-actions">
          {running ? (
            <button type="button" className="folder-batch-btn" onClick={onCancel}>
              {t('batch.cancel')}
            </button>
          ) : (
            <>
              {canDownloadZip && onDownloadZip ? (
                <button type="button" className="folder-batch-btn folder-batch-btn--primary" onClick={onDownloadZip}>
                  {t('batch.downloadZip')}
                </button>
              ) : null}
              <button type="button" className="folder-batch-btn" onClick={onClose}>
                {t('common.close')}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="folder-batch-bar" aria-hidden="true">
        <div className="folder-batch-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <ul className="folder-batch-list">
        {items.map((item, index) => {
          const detail = resolveBatchDetail(item, t);
          return (
            <li
              key={item.id}
              className={`folder-batch-item folder-batch-item--${item.status}${
                running && index === currentIndex ? ' is-current' : ''
              }`}
            >
              <span className="folder-batch-item-name" title={item.fileName}>
                {item.fileName}
              </span>
              <span className="folder-batch-item-status-wrap">
                <span className="folder-batch-item-status">
                  {item.status === 'pending' && t('batch.status.pending')}
                  {item.status === 'running' && t('batch.status.running')}
                  {item.status === 'success' && t('batch.status.success')}
                  {item.status === 'error' && t('batch.status.error')}
                  {item.status === 'skipped' && t('batch.status.skipped')}
                </span>
                {detail ? (
                  <span
                    className="folder-batch-item-detail"
                    title={detail}
                    data-tooltip={detail}
                  >
                    {detail}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
