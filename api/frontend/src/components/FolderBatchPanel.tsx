/**
 * Panneau de progression pour la file de conversion dossier.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import type { MessageKey } from '../i18n/messages';
import {
  estimateBatchRemainingSeconds,
  formatBatchDurationLabel,
  getBatchFormatLabels,
  type FolderBatchItem,
} from '../utils/folderBatchConvert';

interface FolderBatchPanelProps {
  open: boolean;
  items: FolderBatchItem[];
  running: boolean;
  currentIndex: number;
  onCancel: () => void;
  onClose: () => void;
  onDownloadZip?: () => void;
  canDownloadZip?: boolean;
  onDownloadReport?: () => void;
  canDownloadReport?: boolean;
  /** Estimation initiale (secondes) pour l’ETA avant le 1er fichier terminé. */
  initialEstimateSeconds?: number;
}

const KNOWN_SKIP_REASONS = new Set(['format', 'pair', 'limit', 'aborted']);
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
  onDownloadReport,
  canDownloadReport = false,
  initialEstimateSeconds,
}) => {
  const t = useT();
  const batchLabels = getBatchFormatLabels((key) => t(key));
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (running) {
      setStartedAtMs((prev) => prev ?? Date.now());
      return;
    }
    setStartedAtMs(null);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const stats = useMemo(() => {
    const done = items.filter((i) => i.status === 'success').length;
    const errors = items.filter((i) => i.status === 'error').length;
    const skipped = items.filter((i) => i.status === 'skipped').length;
    const eligible = items.filter((i) => i.status !== 'skipped');
    const processedEligible = eligible.filter(
      (i) => i.status === 'success' || i.status === 'error'
    ).length;
    const total = items.length;
    const processed = items.filter((i) => i.status !== 'pending' && i.status !== 'running').length;
    const pct = Math.round((processed / Math.max(1, total)) * 100);
    return { done, errors, skipped, eligible, processedEligible, total, processed, pct };
  }, [items]);

  const etaSeconds =
    running && startedAtMs != null
      ? estimateBatchRemainingSeconds({
          startedAtMs,
          nowMs,
          processedCount: stats.processedEligible,
          totalEligible: stats.eligible.length,
          fallbackTotalSeconds: initialEstimateSeconds,
        })
      : null;

  if (!open || items.length === 0) return null;

  return (
    <div className="folder-batch-panel" role="status" aria-live="polite">
      <div className="folder-batch-panel-head">
        <div className="folder-batch-panel-title">
          <strong>{t('batch.title')}</strong>
          <span className="folder-batch-panel-meta">
            {running
              ? t('batch.progress', {
                  current: Math.min(currentIndex + 1, Math.max(1, stats.eligible.length)),
                  total: Math.max(1, stats.eligible.length),
                })
              : t('batch.done', {
                  ok: stats.done,
                  err: stats.errors,
                  skip: stats.skipped,
                })}
          </span>
          {running && etaSeconds != null && etaSeconds > 0 ? (
            <span className="folder-batch-panel-eta">
              {t('batch.eta', { duration: formatBatchDurationLabel(etaSeconds, batchLabels) })}
            </span>
          ) : null}
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
              {canDownloadReport && onDownloadReport ? (
                <button type="button" className="folder-batch-btn" onClick={onDownloadReport}>
                  {t('batch.downloadReport')}
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
        <div className="folder-batch-bar-fill" style={{ width: `${stats.pct}%` }} />
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
