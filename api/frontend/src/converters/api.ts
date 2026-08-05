/**
 * Backend API base URL
 * - Dev: undefined → http://localhost:3003
 * - Docker: VITE_API_BASE="" → relative URLs, Nginx proxies to backend
 */
export const API_BASE = import.meta.env.VITE_API_BASE !== undefined
  ? import.meta.env.VITE_API_BASE
  : "http://localhost:3003";

/** Headers for conversion API calls (includes correlation id). */
export function buildConversionFetchHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    headers["X-Request-Id"] = crypto.randomUUID();
  }
  return headers;
}

export type ConversionLimitsSnapshot = {
  maxInputSizeMb: number;
  maxInputSizeBytes: number;
  maxSourceUiMb: number;
  conversionTimeoutMs: number;
  maxConcurrentConversions?: number;
  capacity?: {
    mode: string;
    hostProfile: string;
    totalRamMb: number;
    cpuCount: number;
    budgetRamMb: number;
    recommendedHeapMb: number;
  };
};

const DEFAULT_LIMITS: ConversionLimitsSnapshot = {
  maxInputSizeMb: 5,
  maxInputSizeBytes: 5 * 1024 * 1024,
  maxSourceUiMb: 5,
  conversionTimeoutMs: 30000,
};

export async function fetchConversionLimits(): Promise<ConversionLimitsSnapshot> {
  try {
    const res = await fetch(`${API_BASE}/api/config/limits`);
    if (!res.ok) return DEFAULT_LIMITS;
    const data = await res.json();
    const mb = Number(data.maxSourceUiMb ?? data.maxInputSizeMb);
    if (!Number.isFinite(mb) || mb <= 0) return DEFAULT_LIMITS;
    return {
      maxInputSizeMb: mb,
      maxInputSizeBytes: Number(data.maxInputSizeBytes) || Math.floor(mb * 1024 * 1024),
      maxSourceUiMb: mb,
      conversionTimeoutMs: Number(data.conversionTimeoutMs) || DEFAULT_LIMITS.conversionTimeoutMs,
      maxConcurrentConversions: Number(data.maxConcurrentConversions) || undefined,
      capacity: data.capacity && typeof data.capacity === 'object' ? data.capacity : undefined,
    };
  } catch {
    return DEFAULT_LIMITS;
  }
}

export type ConversionMetricsSnapshot = {
  conversion_success_total: number;
  conversion_failures_total: number;
  conversion_duration_ms: { p50: number; p95: number; sample_count: number };
  errors_by_code: Record<string, number>;
  errors_by_code_top: Array<{ code: string; count: number }>;
  failures_by_route: Record<string, Record<string, number>>;
  persisted?: boolean;
  persisted_at?: string | null;
};

export async function fetchConversionMetrics(): Promise<ConversionMetricsSnapshot | null> {
  try {
    const res = await fetch(`${API_BASE}/api/metrics`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object') return null;
    return {
      conversion_success_total: Number(data.conversion_success_total) || 0,
      conversion_failures_total: Number(data.conversion_failures_total) || 0,
      conversion_duration_ms: {
        p50: Number(data.conversion_duration_ms?.p50) || 0,
        p95: Number(data.conversion_duration_ms?.p95) || 0,
        sample_count: Number(data.conversion_duration_ms?.sample_count) || 0,
      },
      errors_by_code:
        data.errors_by_code && typeof data.errors_by_code === 'object' && !Array.isArray(data.errors_by_code)
          ? data.errors_by_code
          : {},
      errors_by_code_top: Array.isArray(data.errors_by_code_top) ? data.errors_by_code_top : [],
      failures_by_route:
        data.failures_by_route && typeof data.failures_by_route === 'object'
          ? data.failures_by_route
          : {},
      persisted: Boolean(data.persisted),
      persisted_at: typeof data.persisted_at === 'string' ? data.persisted_at : null,
    };
  } catch {
    return null;
  }
}
