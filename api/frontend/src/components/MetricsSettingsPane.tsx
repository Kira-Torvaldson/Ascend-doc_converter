/**
 * Panneau Paramètres → Métriques (lecture GET /api/metrics).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import {
  fetchConversionMetrics,
  type ConversionMetricsSnapshot,
} from '../converters/api';

const AUTO_REFRESH_MS = 10_000;

export const MetricsSettingsPane: React.FC = () => {
  const t = useT();
  const [metrics, setMetrics] = useState<ConversionMetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    const next = await fetchConversionMetrics();
    if (!next) {
      setError(t('metrics.loadError'));
      setMetrics(null);
    } else {
      setMetrics(next);
    }
    if (!opts?.silent) setLoading(false);
  }, [t]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      void refresh({ silent: true });
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const topErrors =
    metrics?.errors_by_code_top?.length
      ? metrics.errors_by_code_top
      : Object.entries(metrics?.errors_by_code || {})
          .map(([code, count]) => ({ code, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

  const routeEntries = Object.entries(metrics?.failures_by_route || {}).slice(0, 6);

  return (
    <div className="settings-metrics-live">
      <p className="settings-metrics-intro">
        {t('metrics.intro', { sec: AUTO_REFRESH_MS / 1000 })}
        {metrics?.persisted ? t('metrics.intro.persisted') : t('metrics.intro.memory')}
        {t('metrics.intro.badge')}
      </p>
      <div className="settings-bg-actions">
        <button
          type="button"
          className="settings-param-reset-btn"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? t('common.loading') : t('common.refresh')}
        </button>
      </div>
      {error ? <p className="settings-metrics-error">{error}</p> : null}
      {metrics ? (
        <>
          <dl className="settings-metrics-stats">
            <div>
              <dt>{t('metrics.success')}</dt>
              <dd>{metrics.conversion_success_total}</dd>
            </div>
            <div>
              <dt>{t('metrics.failures')}</dt>
              <dd>{metrics.conversion_failures_total}</dd>
            </div>
            <div>
              <dt>{t('metrics.p50')}</dt>
              <dd>{Math.round(metrics.conversion_duration_ms.p50)} ms</dd>
            </div>
            <div>
              <dt>{t('metrics.p95')}</dt>
              <dd>{Math.round(metrics.conversion_duration_ms.p95)} ms</dd>
            </div>
          </dl>
          <h3 className="settings-metrics-heading">Top error.code</h3>
          {topErrors.length === 0 ? (
            <p className="settings-metrics-empty">{t('metrics.emptyFailures')}</p>
          ) : (
            <ul className="settings-metrics-list">
              {topErrors.map((row) => (
                <li key={row.code}>
                  <code>{row.code}</code>
                  <span>{row.count}</span>
                </li>
              ))}
            </ul>
          )}
          <h3 className="settings-metrics-heading">{t('metrics.byRoute')}</h3>
          {routeEntries.length === 0 ? (
            <p className="settings-metrics-empty">{t('metrics.emptyRoutes')}</p>
          ) : (
            <ul className="settings-metrics-list settings-metrics-list--routes">
              {routeEntries.map(([route, codes]) => (
                <li key={route}>
                  <code>{route}</code>
                  <span>
                    {Object.entries(codes)
                      .map(([c, n]) => `${c}×${n}`)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
};
