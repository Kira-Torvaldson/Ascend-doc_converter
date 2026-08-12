/**
 * Bannière d’avertissements issus du ConversionResult (succès avec warnings).
 */

import React, { useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import type { ConversionWarningItem, WarningLocation } from '../utils/conversionWarnings';
import { formatConversionWarning } from '../utils/conversionWarnings';
import type { WarningsDetailLevel } from '../settings/userSettings';

interface ConversionWarningsBannerProps {
  warnings: ConversionWarningItem[];
  onDismiss: () => void;
  detailLevel?: WarningsDetailLevel;
  onGotoLocation?: (location: WarningLocation) => void;
}

export const ConversionWarningsBanner: React.FC<ConversionWarningsBannerProps> = ({
  warnings,
  onDismiss,
  detailLevel = 'detailed',
  onGotoLocation,
}) => {
  const t = useT();
  const compact = detailLevel === 'compact';
  const [expanded, setExpanded] = useState(!compact);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  if (!warnings.length) return null;

  const hasEngineFallback = warnings.some((w) => w.code === 'ENGINE_FALLBACK');
  const copyLines = warnings.map((w) => {
    const base = formatConversionWarning(w);
    const withLine =
      w.location != null ? `${base} [L${w.location.line} ${w.location.target}]` : base;
    return !compact && w.hint ? `${withLine}\n  → ${w.hint}` : withLine;
  });

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(copyLines.join('\n'));
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 2200);
    }
  };

  const renderBody = (w: ConversionWarningItem) => (
    <>
      {w.title ? (
        <>
          <strong className="conversion-warnings-item-title">{w.title}</strong>
          {w.code ? <span className="conversion-warnings-item-code"> ({w.code})</span> : null}
          {!compact ? <div className="conversion-warnings-item-message">{w.message}</div> : null}
        </>
      ) : (
        formatConversionWarning(w)
      )}
      {w.location ? (
        <span className="conversion-warnings-item-line">
          {t('warn.lineBadge', {
            line: w.location.line,
            target: w.location.target === 'result' ? t('goto.result') : t('goto.source'),
          })}
        </span>
      ) : null}
      {!compact && w.hint ? <div className="conversion-warnings-item-hint">{w.hint}</div> : null}
    </>
  );

  return (
    <div
      className={`conversion-warnings-banner${hasEngineFallback ? ' conversion-warnings-banner--fallback' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="conversion-warnings-banner-main">
        <div className="conversion-warnings-banner-top">
          <button
            type="button"
            className="conversion-warnings-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className="conversion-warnings-banner-title">
              {hasEngineFallback
                ? t('warn.successFallback')
                : t('warn.successCount', { count: warnings.length })}
            </span>
            <span aria-hidden="true">{expanded ? '▼' : '▶'}</span>
          </button>
          <button type="button" className="conversion-warnings-copy" onClick={() => void copyAll()}>
            {copied ? t('warn.copied') : copyFailed ? t('warn.copyFailed') : t('warn.copy')}
          </button>
        </div>
        {!expanded && compact && warnings[0] ? (
          <p className="conversion-warnings-compact-preview">{formatConversionWarning(warnings[0])}</p>
        ) : null}
        {expanded && (
          <ul className="conversion-warnings-list">
            {warnings.map((w, i) => {
              const clickable = Boolean(w.location && onGotoLocation);
              return (
                <li
                  key={`${i}-${w.code || w.message.slice(0, 24)}`}
                  className={clickable ? 'conversion-warnings-item is-clickable' : 'conversion-warnings-item'}
                >
                  {clickable && w.location ? (
                    <button
                      type="button"
                      className="conversion-warnings-item-btn"
                      onClick={() => onGotoLocation?.(w.location!)}
                      title={t('warn.gotoLine', {
                        line: w.location.line,
                        target:
                          w.location.target === 'result' ? t('goto.result') : t('goto.source'),
                      })}
                      data-tooltip={t('warn.gotoLine', {
                        line: w.location.line,
                        target:
                          w.location.target === 'result' ? t('goto.result') : t('goto.source'),
                      })}
                    >
                      {renderBody(w)}
                    </button>
                  ) : (
                    renderBody(w)
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <button
        type="button"
        className="conversion-warnings-dismiss"
        onClick={onDismiss}
        aria-label={t('common.close')}
      >
        ×
      </button>
    </div>
  );
};
