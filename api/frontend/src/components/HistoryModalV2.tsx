/**
 * HistoryModalV2 — floating conversion history window (design-system pilot).
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { ConversionHistoryItem, FormatType } from "../types";
import { useFloatingWindow } from "../hooks/useFloatingWindow";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useLocale, useT } from "../i18n/LocaleContext";
import type { MessageKey } from "../i18n/messages";
import { downloadJson } from "../utils/downloadFile";

const DEFAULT_WIDTH = 520;
const DEFAULT_HEIGHT = 440;
const MIN_WIDTH = 340;
const MIN_HEIGHT = 240;
const GEOMETRY_KEY = "ascend_history_window_geometry";
const FILTERS_KEY = "ascend_history_window_filters";
const COLLAPSED_GROUPS_KEY = "ascend_history_collapsed_groups";

const LOCALE_TAGS: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
};

type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

export const useNewHistoryModal: boolean = true;

export type DisplayHistoryEntryShape = {
  originalEntry: ConversionHistoryItem | (ConversionHistoryItem & Record<string, unknown>);
  repeatCount: number;
  status: "success" | "error" | "unknown";
  durationMs: number | null;
  sourceFilename: string | null;
};

type HistoryRow = {
  restorable: ConversionHistoryItem;
  primary: string;
  conversionType: string;
  timestamp: number;
  status: "success" | "error" | "unknown";
  repeatCount: number;
  sourceFilename: string | null;
  previewSource: string;
  previewResult: string;
};

type StatusFilter = "all" | "success" | "error" | "unknown";

function isDisplayEntry(
  item: ConversionHistoryItem | DisplayHistoryEntryShape
): item is DisplayHistoryEntryShape {
  return "originalEntry" in item && "repeatCount" in item;
}

function getRestorable(
  item: ConversionHistoryItem | DisplayHistoryEntryShape
): ConversionHistoryItem {
  return isDisplayEntry(item) ? item.originalEntry : item;
}

function formatClock(ts: number, localeTag: string): string {
  return new Date(ts).toLocaleTimeString(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative + clock, e.g. "il y a 3 min · 14:32" */
function formatHistoryTime(ts: number, t: TranslateFn, localeTag: string): string {
  const clock = formatClock(ts, localeTag);
  const deltaSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (deltaSec < 45) return t("history.justNow", { clock });
  if (deltaSec < 3600) return t("history.minutesAgo", { n: Math.floor(deltaSec / 60), clock });
  if (deltaSec < 86400) return t("history.hoursAgo", { n: Math.floor(deltaSec / 3600), clock });
  return clock;
}

function inferStatus(
  status: "success" | "error" | "unknown",
  resultContent: string
): "success" | "error" | "unknown" {
  if (status !== "unknown") return status;
  return resultContent.trim() ? "success" : "unknown";
}

function dayGroupKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dayGroupLabel(ts: number, t: TranslateFn, localeTag: string): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (sameDay) return t("history.today");
  if (wasYesterday) return t("history.yesterday");
  return d.toLocaleDateString(localeTag, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function previewSnippet(text: string, max = 120): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "—";
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function loadFilters(): { query: string; statusFilter: StatusFilter } {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return { query: "", statusFilter: "all" };
    const parsed = JSON.parse(raw);
    const statusFilter: StatusFilter =
      parsed?.statusFilter === "success" ||
      parsed?.statusFilter === "error" ||
      parsed?.statusFilter === "unknown"
        ? parsed.statusFilter
        : "all";
    return {
      query: typeof parsed?.query === "string" ? parsed.query : "",
      statusFilter,
    };
  } catch {
    return { query: "", statusFilter: "all" };
  }
}

function loadCollapsedGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_GROUPS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((x) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function contentStats(text: string, t: TranslateFn, localeTag: string): string {
  const raw = text || "";
  const chars = raw.length;
  const lines = raw ? raw.split("\n").length : 0;
  return t("history.stats", {
    chars: chars.toLocaleString(localeTag),
    lines,
  });
}

export interface HistoryModalV2Props {
  open: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  entries: ConversionHistoryItem[] | DisplayHistoryEntryShape[];
  onRestore: (item: ConversionHistoryItem) => void;
  /** Optional: remove a single entry by id */
  onDelete?: (id: string) => void;
  onClear: () => void;
  getFormatTitle: (format: FormatType) => string;
  /** Compare two history entries (defaults to result content). */
  onCompare?: (
    left: ConversionHistoryItem,
    right: ConversionHistoryItem,
    field: 'source' | 'result'
  ) => void;
}

export function HistoryModalV2({
  open,
  onClose,
  onMinimize,
  entries,
  onRestore,
  onDelete,
  onClear,
  getFormatTitle,
  onCompare,
}: HistoryModalV2Props) {
  const t = useT();
  const { locale } = useLocale();
  const localeTag = LOCALE_TAGS[locale] || "fr-FR";
  const listRef = useRef<HTMLDivElement | null>(null);
  const savedFilters = useMemo(() => loadFilters(), []);
  const {
    panelRef,
    maximized,
    setMaximized,
    minimized,
    setMinimized,
    isDragging,
    isResizing,
    handleDragStart,
    handleResizeStart,
    panelStyle: floatingStyle,
  } = useFloatingWindow({
    defaultSize: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
    minSize: { width: MIN_WIDTH, height: MIN_HEIGHT },
    persistKey: GEOMETRY_KEY,
    initialPosition: "center",
  });
  const [query, setQuery] = useState(savedFilters.query);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(savedFilters.statusFilter);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState<"source" | "result" | null>(null);
  const [exportedId, setExportedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareField, setCompareField] = useState<'source' | 'result'>('result');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => loadCollapsedGroups());
  const [nowTick, setNowTick] = useState(0);
  const searchRef = useRef<HTMLInputElement | null>(null);
  useFocusTrap(panelRef, open && !minimized, { initialFocusRef: searchRef });

  useEffect(() => {
    if (!open) {
      setConfirmClear(false);
      setActiveIndex(0);
      setPreviewId(null);
      setCompareIds([]);
      return;
    }
    const t = window.setTimeout(() => searchRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNowTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    try {
      localStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({ query, statusFilter })
      );
    } catch {
      /* ignore */
    }
  }, [query, statusFilter]);

  useEffect(() => {
    try {
      localStorage.setItem(
        COLLAPSED_GROUPS_KEY,
        JSON.stringify(Array.from(collapsedGroups))
      );
    } catch {
      /* ignore */
    }
  }, [collapsedGroups]);

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const list: HistoryRow[] = useMemo(
    () =>
      entries.map((item) => {
        const restorable = getRestorable(item) as ConversionHistoryItem;
        const from = restorable.fromFormat ?? "";
        const to = restorable.toFormat ?? "";
        const conversionType = `${from} → ${to}`;
        const ts = restorable.timestamp ?? 0;
        if (isDisplayEntry(item)) {
          const original = item.originalEntry as ConversionHistoryItem;
          return {
            restorable: original,
            primary: item.sourceFilename ?? conversionType,
            conversionType,
            timestamp: original.timestamp ?? ts,
            status: inferStatus(item.status, original.resultContent ?? ""),
            repeatCount: item.repeatCount,
            sourceFilename: item.sourceFilename,
            previewSource: previewSnippet(original.sourceContent),
            previewResult: previewSnippet(original.resultContent),
          };
        }
        const firstLine = (restorable.sourceContent || "").trim().split("\n")[0];
        const sourceFilename = (firstLine ?? "").trim().slice(0, 60) || null;
        return {
          restorable,
          primary: sourceFilename ?? conversionType,
          conversionType,
          timestamp: ts,
          status: inferStatus("unknown", restorable.resultContent),
          repeatCount: 1,
          sourceFilename,
          previewSource: previewSnippet(restorable.sourceContent),
          previewResult: previewSnippet(restorable.resultContent),
        };
      }),
    [entries]
  );

  const statusCounts = useMemo(() => {
    const counts = { all: list.length, success: 0, error: 0, unknown: 0 };
    for (const row of list) counts[row.status] += 1;
    return counts;
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        row.primary,
        row.conversionType,
        row.sourceFilename ?? "",
        getFormatTitle(row.restorable.fromFormat),
        getFormatTitle(row.restorable.toFormat),
        row.previewSource,
        row.previewResult,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [list, query, statusFilter, getFormatTitle]);

  const toggleCompareId = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  const compareSlots = useMemo(() => {
    const a = compareIds[0] ? list.find((r) => r.restorable.id === compareIds[0]) : undefined;
    const b = compareIds[1] ? list.find((r) => r.restorable.id === compareIds[1]) : undefined;
    return { a, b };
  }, [compareIds, list]);

  const runHistoryCompare = useCallback(() => {
    if (!onCompare || !compareSlots.a || !compareSlots.b) return;
    onCompare(compareSlots.a.restorable, compareSlots.b.restorable, compareField);
  }, [onCompare, compareSlots, compareField]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; rows: HistoryRow[] }>();
    for (const row of filtered) {
      const key = dayGroupKey(row.timestamp);
      const existing = map.get(key);
      if (existing) existing.rows.push(row);
      else map.set(key, { label: dayGroupLabel(row.timestamp, t, localeTag), rows: [row] });
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }));
  }, [filtered, t, localeTag]);

  useEffect(() => {
    setActiveIndex((i) => (filtered.length === 0 ? 0 : Math.min(i, filtered.length - 1)));
  }, [filtered.length]);

  useEffect(() => {
    if (!open || filtered.length === 0) return;
    const row = filtered[activeIndex];
    if (row) setPreviewId(row.restorable.id);
  }, [activeIndex, filtered, open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-history-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex, open, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "Escape") {
        e.preventDefault();
        if (confirmClear) {
          setConfirmClear(false);
          return;
        }
        if (query || statusFilter !== "all") {
          setQuery("");
          setStatusFilter("all");
          return;
        }
        onClose();
        return;
      }

      if (typing && e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") {
        return;
      }

      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter" && !typing) {
        e.preventDefault();
        const row = filtered[activeIndex];
        if (row) onRestore(row.restorable);
      } else if ((e.key === "Delete" || e.key === "Backspace") && !typing && onDelete) {
        e.preventDefault();
        const row = filtered[activeIndex];
        if (row) onDelete(row.restorable.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, confirmClear, query, statusFilter, filtered, activeIndex, onRestore, onDelete]);

  const copyPreview = useCallback(async (kind: "source" | "result", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPreview(kind);
      window.setTimeout(() => setCopiedPreview(null), 1400);
    } catch {
      /* ignore */
    }
  }, []);

  const exportEntry = useCallback((item: ConversionHistoryItem) => {
    const stamp = new Date(item.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadJson(`ascend-conversion-${stamp}.json`, item);
    setExportedId(item.id);
    window.setTimeout(() => setExportedId(null), 1600);
  }, []);

  if (!open) return null;

  const primaryLabel = (row: HistoryRow) =>
    row.sourceFilename ?? getFormatTitle(row.restorable.fromFormat);
  const targetLabel = (row: HistoryRow) => getFormatTitle(row.restorable.toFormat);

  const panelStyle: React.CSSProperties = { ...floatingStyle, zIndex: 10003 };

  const panelClasses = [
    "floating-window",
    "floating-window--enter",
    "history-modal-v2-panel",
    "history-modal-v2-window",
    minimized ? "history-modal-v2-minimized" : "",
    maximized ? "history-modal-v2-maximized" : "",
    isDragging ? "history-modal-v2-dragging" : "",
    isResizing ? "history-modal-v2-resizing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const previewRow = previewId
    ? filtered.find((r) => r.restorable.id === previewId) ?? null
    : null;

  return (
    <>
      <div
        className="history-modal-v2-overlay floating-window-overlay"
        onClick={onClose}
        role="presentation"
      />
      <div
        ref={panelRef}
        className={panelClasses}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-v2-title"
      >
        <header
          className="floating-window-header floating-window-header--draggable history-modal-v2-header history-modal-v2-header-draggable"
          onMouseDown={handleDragStart}
        >
          <div className="floating-window-title-wrap history-modal-v2-title-wrap">
            <h2 id="history-modal-v2-title" className="floating-window-title history-modal-v2-title">
              {t("history.short")}
            </h2>
            {!minimized && list.length > 0 && (
              <span className="floating-window-count history-modal-v2-count">
                {filtered.length === list.length
                  ? t("history.count", { count: list.length })
                  : `${filtered.length}/${list.length}`}
              </span>
            )}
          </div>
          <div className="floating-window-controls history-modal-v2-controls">
            {minimized ? (
              <button
                type="button"
                className="floating-window-btn floating-window-btn--restore"
                onClick={(e) => {
                  e.stopPropagation();
                  setMinimized(false);
                }}
                aria-label={t("history.restore")}
              >
                □
              </button>
            ) : (
              <button
                type="button"
                className="floating-window-btn floating-window-btn--minimize"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMinimize) onMinimize();
                  else setMinimized(true);
                }}
                aria-label={t("settings.minimize")}
              >
                −
              </button>
            )}
            {!minimized && (
              <button
                type="button"
                className="floating-window-btn floating-window-btn--maximize"
                onClick={(e) => {
                  e.stopPropagation();
                  setMaximized(!maximized);
                }}
                aria-label={maximized ? t("history.restore") : t("history.fullscreen")}
              >
                {maximized ? "⧉" : "□"}
              </button>
            )}
            <button
              type="button"
              className="floating-window-btn floating-window-btn--close"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label={t("common.close")}
            >
              ×
            </button>
          </div>
        </header>

        {!minimized && (
          <>
            <div className="history-modal-v2-toolbar history-modal-v2-toolbar--sticky">
              <div className="history-modal-v2-filters">
                <input
                  ref={searchRef}
                  type="search"
                  className="history-modal-v2-search"
                  placeholder={t("history.search")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label={t("history.search.aria")}
                />
                <div className="history-modal-v2-status-filters" role="group" aria-label={t("history.filterStatus")}>
                  {(
                    [
                      ["all", t("history.filter.all")],
                      ["success", t("history.filter.ok")],
                      ["error", t("history.filter.error")],
                      ["unknown", t("history.filter.unknown")],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`history-modal-v2-chip${statusFilter === value ? " is-active" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusFilter(value);
                      }}
                    >
                      {label}
                      <span className="history-modal-v2-chip-count">{statusCounts[value]}</span>
                    </button>
                  ))}
                </div>
              </div>
              {list.length > 0 && (
                confirmClear ? (
                  <div className="history-modal-v2-clear-confirm">
                    <span>{t("history.clearConfirm")}</span>
                    <button
                      type="button"
                      className="history-modal-v2-btn-clear is-confirm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmClear(false);
                        onClear();
                      }}
                    >
                      {t("history.yes")}
                    </button>
                    <button
                      type="button"
                      className="history-modal-v2-chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmClear(false);
                      }}
                    >
                      {t("history.no")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="history-modal-v2-btn-clear"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmClear(true);
                    }}
                  >
                    {t("history.clearBtn")}
                  </button>
                )
              )}
            </div>

            {onCompare && compareIds.length > 0 && (
              <div className="history-modal-v2-compare-bar" role="status">
                <span className="history-modal-v2-compare-summary">
                  {t('history.compare.picked', { n: compareIds.length })}
                  {compareSlots.a ? ` · A` : ''}
                  {compareSlots.b ? ` · B` : ''}
                </span>
                <div className="history-modal-v2-compare-field" role="group" aria-label={t('history.compare.field')}>
                  <button
                    type="button"
                    className={`history-modal-v2-chip${compareField === 'result' ? ' is-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareField('result');
                    }}
                  >
                    {t('diff.result')}
                  </button>
                  <button
                    type="button"
                    className={`history-modal-v2-chip${compareField === 'source' ? ' is-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareField('source');
                    }}
                  >
                    {t('diff.source')}
                  </button>
                </div>
                <button
                  type="button"
                  className="history-modal-v2-btn-compare"
                  disabled={compareIds.length < 2}
                  onClick={(e) => {
                    e.stopPropagation();
                    runHistoryCompare();
                  }}
                >
                  {t('history.compare.run')}
                </button>
                <button
                  type="button"
                  className="history-modal-v2-chip"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCompareIds([]);
                  }}
                >
                  {t('history.compare.clear')}
                </button>
              </div>
            )}

            <div className="history-modal-v2-list" ref={listRef}>
              {list.length === 0 ? (
                <div className="history-modal-v2-empty">
                  <span className="history-modal-v2-empty-mark" aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 6h10M4 12h16M4 18h12"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                      <path
                        d="M16 4v4h4"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <p className="history-modal-v2-empty-title">{t("history.empty")}</p>
                  <p className="history-modal-v2-empty-desc">
                    {t("history.empty.desc")}
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="history-modal-v2-empty">
                  <p className="history-modal-v2-empty-title">{t("history.noResults")}</p>
                  <p className="history-modal-v2-empty-desc">
                    {t("history.noResults.desc")}
                  </p>
                  <button
                    type="button"
                    className="history-modal-v2-reset-filters"
                    onClick={() => {
                      setQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    {t("history.resetFilters")}
                  </button>
                </div>
              ) : (
                groups.map((group) => {
                  const collapsed = collapsedGroups.has(group.key);
                  return (
                  <section key={group.key} className={`history-modal-v2-group${collapsed ? " is-collapsed" : ""}`}>
                    <button
                      type="button"
                      className="history-modal-v2-group-label"
                      onClick={() => toggleGroup(group.key)}
                      aria-expanded={!collapsed}
                    >
                      <span className="history-modal-v2-group-label-left">
                        <span className="history-modal-v2-group-chevron" aria-hidden="true">
                          {collapsed ? "▶" : "▼"}
                        </span>
                        {group.label}
                      </span>
                      <span>{group.rows.length}</span>
                    </button>
                    {!collapsed && group.rows.map((row, idx) => {
                      const flatIndex = filtered.findIndex((r) => r.restorable.id === row.restorable.id);
                      const isActive = flatIndex === activeIndex;
                      return (
                      <div
                        key={row.restorable.id ?? `${group.key}-${idx}`}
                        data-history-index={flatIndex}
                        className={`history-modal-v2-row history-modal-v2-row--${row.status}${
                          isActive || previewId === row.restorable.id ? " is-preview" : ""
                        }${isActive ? " is-active" : ""}${
                          compareIds.includes(row.restorable.id) ? " is-compare" : ""
                        }`}
                        onClick={() => {
                          setPreviewId(row.restorable.id);
                          if (flatIndex >= 0) setActiveIndex(flatIndex);
                        }}
                        onMouseEnter={() => {
                          setPreviewId(row.restorable.id);
                          if (flatIndex >= 0) setActiveIndex(flatIndex);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            onRestore(row.restorable);
                          } else if (e.key === " ") {
                            e.preventDefault();
                            setPreviewId(row.restorable.id);
                            if (flatIndex >= 0) setActiveIndex(flatIndex);
                          }
                        }}
                        aria-label={t("history.previewAria", {
                          from: primaryLabel(row),
                          to: targetLabel(row),
                        })}
                      >
                        <div className="history-modal-v2-row-main">
                          <div className="history-modal-v2-row-primary">
                            {onCompare && compareIds.includes(row.restorable.id) ? (
                              <span className="history-modal-v2-compare-slot" aria-hidden="true">
                                {compareIds[0] === row.restorable.id ? 'A' : 'B'}
                              </span>
                            ) : null}
                            <span className="history-modal-v2-format-pill">
                              {getFormatTitle(row.restorable.fromFormat)}
                            </span>
                            <span className="history-modal-v2-arrow">→</span>
                            <span className="history-modal-v2-format-pill history-modal-v2-format-pill--to">
                              {getFormatTitle(row.restorable.toFormat)}
                            </span>
                          </div>
                          <div className="history-modal-v2-row-secondary">
                            <span className="history-modal-v2-row-title">{primaryLabel(row)}</span>
                            <span key={nowTick}>{formatHistoryTime(row.timestamp, t, localeTag)}</span>
                          </div>
                        </div>
                        <div className="history-modal-v2-row-meta">
                          <span className={`history-modal-v2-badge history-modal-v2-badge--${row.status}`}>
                            {row.status === "unknown"
                              ? "—"
                              : row.status === "success"
                                ? t("history.status.success")
                                : t("history.status.error")}
                          </span>
                          {row.repeatCount > 1 && (
                            <span className="history-modal-v2-repeat">×{row.repeatCount}</span>
                          )}
                          <div className="history-modal-v2-row-actions">
                            {onCompare ? (
                              <button
                                type="button"
                                className={`history-modal-v2-row-action history-modal-v2-row-action--compare${
                                  compareIds.includes(row.restorable.id) ? ' is-active' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCompareId(row.restorable.id);
                                }}
                                aria-label={t('history.compare.toggle')}
                                data-tooltip={t('history.compare.toggle')}
                                aria-pressed={compareIds.includes(row.restorable.id)}
                              >
                                ⇄
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="history-modal-v2-row-action history-modal-v2-row-action--restore"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestore(row.restorable);
                              }}
                              aria-label={t("history.restore")}
                            >
                              ↩
                            </button>
                            <button
                              type="button"
                              className="history-modal-v2-row-action history-modal-v2-row-action--export"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportEntry(row.restorable);
                              }}
                              aria-label={t("history.exportEntry")}
                              data-tooltip={t("history.exportEntry")}
                            >
                              ↓
                            </button>
                            {onDelete && (
                              <button
                                type="button"
                                className="history-modal-v2-row-action history-modal-v2-row-action--delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(row.restorable.id);
                                }}
                                aria-label={t("history.delete")}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </section>
                  );
                })
              )}
            </div>

            {previewRow && (
              <div className="history-modal-v2-preview" aria-live="polite">
                <div className="history-modal-v2-preview-col">
                  <div className="history-modal-v2-preview-head">
                    <span className="history-modal-v2-preview-label">
                      {t("common.source")} · {contentStats(previewRow.restorable.sourceContent, t, localeTag)}
                    </span>
                    <button
                      type="button"
                      className="history-modal-v2-preview-copy"
                      onClick={(e) => {
                        e.stopPropagation();
                        void copyPreview("source", previewRow.restorable.sourceContent);
                      }}
                    >
                      {copiedPreview === "source" ? t("common.copied") : t("common.copy")}
                    </button>
                  </div>
                  <p>{previewRow.previewSource}</p>
                </div>
                <div className="history-modal-v2-preview-col">
                  <div className="history-modal-v2-preview-head">
                    <span className="history-modal-v2-preview-label">
                      {t("common.result")} · {contentStats(previewRow.restorable.resultContent, t, localeTag)}
                    </span>
                    <button
                      type="button"
                      className="history-modal-v2-preview-copy"
                      onClick={(e) => {
                        e.stopPropagation();
                        void copyPreview("result", previewRow.restorable.resultContent);
                      }}
                    >
                      {copiedPreview === "result" ? t("common.copied") : t("common.copy")}
                    </button>
                  </div>
                  <p>{previewRow.previewResult}</p>
                </div>
                <div className="history-modal-v2-preview-actions">
                  <button
                    type="button"
                    className="history-modal-v2-preview-restore"
                    onClick={() => onRestore(previewRow.restorable)}
                  >
                    {t("history.restoreEntry")}
                  </button>
                  <button
                    type="button"
                    className="history-modal-v2-preview-export"
                    onClick={() => exportEntry(previewRow.restorable)}
                    data-tooltip={t("history.exportEntry")}
                  >
                    {exportedId === previewRow.restorable.id
                      ? t("history.exported")
                      : t("history.export")}
                  </button>
                </div>
              </div>
            )}

            {list.length > 0 && (
              <footer className="history-modal-v2-footer">
                {t("history.shortcuts")}
              </footer>
            )}
          </>
        )}

        {!minimized && !maximized && (
          <div
            className="floating-window-resize-handle history-modal-v2-resize-handle"
            onMouseDown={handleResizeStart}
            aria-label={t("iface.resize")}
          />
        )}
      </div>
    </>
  );
}
