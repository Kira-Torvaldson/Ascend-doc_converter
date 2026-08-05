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
