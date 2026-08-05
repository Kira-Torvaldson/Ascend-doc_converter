/**
 * Panneau Paramètres → Métriques (lecture GET /api/metrics).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchConversionMetrics,
  type ConversionMetricsSnapshot,
} from '../converters/api';

const AUTO_REFRESH_MS = 10_000;

export const MetricsSettingsPane: React.FC = () => {
  const [metrics, setMetrics] = useState<ConversionMetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    const next = await fetchConversionMetrics();
    if (!next) {
      setError('Impossible de charger /api/metrics (serveur arrêté ou accès refusé).');
      setMetrics(null);
    } else {
      setMetrics(next);
    }
    if (!opts?.silent) setLoading(false);
  }, []);

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
    <div className="settings-param-body settings-param-body--pane settings-metrics-pane">
      <p className="settings-metrics-intro">
        Compteurs backend (rafraîchis toutes les {AUTO_REFRESH_MS / 1000}s)
        {metrics?.persisted
          ? ' — persistés sous reports/conversion-metrics.json (survivent au redémarrage).'
          : ' — en mémoire uniquement pour cette session.'}
      </p>
      <div className="settings-bg-actions">
        <button
          type="button"
          className="settings-param-reset-btn"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>
      {error ? <p className="settings-metrics-error">{error}</p> : null}
      {metrics ? (
        <>
          <dl className="settings-metrics-stats">
            <div>
              <dt>Succès</dt>
              <dd>{metrics.conversion_success_total}</dd>
            </div>
            <div>
              <dt>Échecs</dt>
              <dd>{metrics.conversion_failures_total}</dd>
            </div>
            <div>
              <dt>Durée p50</dt>
              <dd>{Math.round(metrics.conversion_duration_ms.p50)} ms</dd>
            </div>
            <div>
              <dt>Durée p95</dt>
              <dd>{Math.round(metrics.conversion_duration_ms.p95)} ms</dd>
            </div>
          </dl>
          <h3 className="settings-metrics-heading">Top error.code</h3>
          {topErrors.length === 0 ? (
            <p className="settings-metrics-empty">Aucun échec enregistré.</p>
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
          <h3 className="settings-metrics-heading">Échecs par route</h3>
          {routeEntries.length === 0 ? (
            <p className="settings-metrics-empty">Aucune répartition par route.</p>
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
