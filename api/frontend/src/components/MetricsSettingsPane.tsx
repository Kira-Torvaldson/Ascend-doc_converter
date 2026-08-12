/**
 * Panneau Paramètres → Métriques (lecture GET /api/metrics).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import {
  fetchConversionMetrics,
  type ConversionMetricsSnapshot,
} from '../converters/api';
import { downloadTextFile, toCsvRow } from '../utils/downloadFile';

const AUTO_REFRESH_MS = 10_000;
const TREND_MAX_POINTS = 24;

type TrendPoint = {
  at: number;
  success: number;
  failures: number;
  p95: number;
};

function buildMetricsCsv(metrics: ConversionMetricsSnapshot): string {
  const lines: string[] = [];
  lines.push(toCsvRow(['section', 'key', 'value']));
  lines.push(toCsvRow(['summary', 'conversion_success_total', metrics.conversion_success_total]));
  lines.push(toCsvRow(['summary', 'conversion_failures_total', metrics.conversion_failures_total]));
  lines.push(toCsvRow(['summary', 'duration_p50_ms', Math.round(metrics.conversion_duration_ms.p50)]));
  lines.push(toCsvRow(['summary', 'duration_p95_ms', Math.round(metrics.conversion_duration_ms.p95)]));
  lines.push(toCsvRow(['summary', 'duration_sample_count', metrics.conversion_duration_ms.sample_count]));
  for (const [code, count] of Object.entries(metrics.errors_by_code || {})) {
    lines.push(toCsvRow(['errors_by_code', code, count]));
  }
  for (const [route, codes] of Object.entries(metrics.failures_by_route || {})) {
    for (const [code, count] of Object.entries(codes || {})) {
      lines.push(toCsvRow(['failures_by_route', `${route}::${code}`, count]));
    }
  }
  return lines.join('\n');
}

export const MetricsSettingsPane: React.FC = () => {
  const t = useT();
  const [metrics, setMetrics] = useState<ConversionMetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const lastFingerprint = useRef<string>('');

  const pushTrend = useCallback((next: ConversionMetricsSnapshot) => {
    const fingerprint = [
      next.conversion_success_total,
      next.conversion_failures_total,
      Math.round(next.conversion_duration_ms.p95),
      next.conversion_duration_ms.sample_count,
    ].join('|');
    if (fingerprint === lastFingerprint.current) return;
    lastFingerprint.current = fingerprint;
    setTrend((prev) => {
      const point: TrendPoint = {
        at: Date.now(),
        success: next.conversion_success_total,
        failures: next.conversion_failures_total,
        p95: Math.round(next.conversion_duration_ms.p95),
      };
      return [...prev, point].slice(-TREND_MAX_POINTS);
    });
  }, []);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    const next = await fetchConversionMetrics();
    if (!next) {
      setError(t('metrics.loadError'));
      setMetrics(null);
    } else {
      setMetrics(next);
      pushTrend(next);
    }
    if (!opts?.silent) setLoading(false);
  }, [t, pushTrend]);

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
  const maxErrorCount = Math.max(1, ...topErrors.map((row) => row.count));

  const trendPath = useMemo(() => {
    if (trend.length < 2) return null;
    const values = trend.map((p) => p.failures);
    const max = Math.max(1, ...values);
    const w = 220;
    const h = 48;
    const step = w / (trend.length - 1);
    const points = values
      .map((v, i) => {
        const x = i * step;
        const y = h - (v / max) * (h - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return { points, w, h, max };
  }, [trend]);

  const exportCsv = useCallback(() => {
    if (!metrics) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadTextFile(`ascend-metrics-${stamp}.csv`, buildMetricsCsv(metrics), 'text/csv;charset=utf-8');
  }, [metrics]);

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
        <button
          type="button"
          className="settings-param-reset-btn"
          onClick={exportCsv}
          disabled={!metrics}
        >
          {t('metrics.exportCsv')}
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

          <h3 className="settings-metrics-heading">{t('metrics.trend')}</h3>
          {trendPath ? (
            <div className="settings-metrics-trend" aria-hidden="true">
              <svg
                className="settings-metrics-trend-svg"
                viewBox={`0 0 ${trendPath.w} ${trendPath.h}`}
                width="100%"
                height="48"
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke="var(--accent, #3b82f6)"
                  strokeWidth="2"
                  points={trendPath.points}
                />
              </svg>
              <p className="settings-metrics-trend-caption">
                {trend[trend.length - 1]?.failures ?? 0} / max {trendPath.max}
              </p>
            </div>
          ) : (
            <p className="settings-metrics-empty">{t('metrics.trend.empty')}</p>
          )}

          <h3 className="settings-metrics-heading">{t('metrics.topErrors')}</h3>
          {topErrors.length === 0 ? (
            <p className="settings-metrics-empty">{t('metrics.emptyFailures')}</p>
          ) : (
            <div className="settings-metrics-bars" role="img" aria-label={t('metrics.chart.errors')}>
              {topErrors.map((row) => (
                <div key={row.code} className="settings-metrics-bar-row">
                  <code className="settings-metrics-bar-label">{row.code}</code>
                  <div className="settings-metrics-bar-track">
                    <div
                      className="settings-metrics-bar-fill"
                      style={{ width: `${(row.count / maxErrorCount) * 100}%` }}
                    />
                  </div>
                  <span className="settings-metrics-bar-count">{row.count}</span>
                </div>
              ))}
            </div>
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
