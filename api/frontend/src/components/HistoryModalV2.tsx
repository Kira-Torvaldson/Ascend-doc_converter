/**
 * HistoryModalV2 — floating conversion history window (design-system pilot).
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { ConversionHistoryItem, FormatType } from "../types";

const DEFAULT_WIDTH = 520;
const DEFAULT_HEIGHT = 440;
const MIN_WIDTH = 340;
const MIN_HEIGHT = 240;
const GEOMETRY_KEY = "ascend_history_window_geometry";
const FILTERS_KEY = "ascend_history_window_filters";
const COLLAPSED_GROUPS_KEY = "ascend_history_collapsed_groups";

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

function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative + clock, e.g. "il y a 3 min · 14:32" */
function formatHistoryTime(ts: number): string {
  const clock = formatClock(ts);
  const deltaSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (deltaSec < 45) return `à l'instant · ${clock}`;
  if (deltaSec < 3600) return `il y a ${Math.floor(deltaSec / 60)} min · ${clock}`;
  if (deltaSec < 86400) return `il y a ${Math.floor(deltaSec / 3600)} h · ${clock}`;
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

function dayGroupLabel(ts: number): string {
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
  if (sameDay) return "Aujourd'hui";
  if (wasYesterday) return "Hier";
  return d.toLocaleDateString("fr-FR", {
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

function loadGeometry(): { position: { x: number; y: number }; size: { width: number; height: number } } | null {
  try {
    const raw = localStorage.getItem(GEOMETRY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.position?.x === "number" &&
      typeof parsed?.position?.y === "number" &&
      typeof parsed?.size?.width === "number" &&
      typeof parsed?.size?.height === "number"
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveGeometry(
  position: { x: number; y: number },
  size: { width: number; height: number }
) {
  try {
    localStorage.setItem(GEOMETRY_KEY, JSON.stringify({ position, size }));
  } catch {
    /* ignore */
  }
}

function defaultPosition() {
  if (typeof window === "undefined") return { x: 80, y: 80 };
  return {
    x: Math.max(0, (window.innerWidth - DEFAULT_WIDTH) / 2),
    y: Math.max(0, (window.innerHeight - DEFAULT_HEIGHT) / 2),
  };
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

function contentStats(text: string): string {
  const t = text || "";
  const chars = t.length;
  const lines = t ? t.split("\n").length : 0;
  return `${chars.toLocaleString("fr-FR")} car. · ${lines} lig.`;
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
}: HistoryModalV2Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const saved = useMemo(() => loadGeometry(), []);
  const savedFilters = useMemo(() => loadFilters(), []);
  const [position, setPosition] = useState(() => saved?.position ?? defaultPosition());
  const [size, setSize] = useState(() => saved?.size ?? { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
  const [query, setQuery] = useState(savedFilters.query);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(savedFilters.statusFilter);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState<"source" | "result" | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => loadCollapsedGroups());
  const [nowTick, setNowTick] = useState(0);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (maximized || !panelRef.current) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, input, select, textarea, a")) return;
      e.preventDefault();
      const rect = panelRef.current.getBoundingClientRect();
      setIsDragging(true);
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setDragOffset({ x: 0, y: 0 });
    },
    [maximized]
  );

  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || maximized) return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const offsetX = newX - position.x;
      const offsetY = newY - position.y;
      const w = size.width;
      const h = minimized ? 60 : size.height;
      const maxX = window.innerWidth - w;
      const maxY = window.innerHeight - h;
      setDragOffset({
        x: Math.max(-position.x, Math.min(offsetX, maxX - position.x)),
        y: Math.max(-position.y, Math.min(offsetY, maxY - position.y)),
      });
    },
    [isDragging, maximized, minimized, dragStart, position, size]
  );

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      const w = size.width;
      const h = minimized ? 60 : size.height;
      const maxX = window.innerWidth - w;
      const maxY = window.innerHeight - h;
      const next = {
        x: Math.max(0, Math.min(position.x + dragOffset.x, maxX)),
        y: Math.max(0, Math.min(position.y + dragOffset.y, maxY)),
      };
      setPosition(next);
      setDragOffset({ x: 0, y: 0 });
      saveGeometry(next, size);
    }
    setIsDragging(false);
  }, [isDragging, dragOffset, position, size, minimized]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (maximized || minimized) return;
      e.stopPropagation();
      setIsResizing(true);
      setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height });
    },
    [maximized, minimized, size]
  );

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || maximized || minimized) return;
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const maxW = window.innerWidth - position.x;
      const maxH = window.innerHeight - position.y;
      setSize({
        width: Math.max(MIN_WIDTH, Math.min(resizeStart.width + deltaX, maxW)),
        height: Math.max(MIN_HEIGHT, Math.min(resizeStart.height + deltaY, maxH)),
      });
    },
    [isResizing, maximized, minimized, resizeStart, position]
  );

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setSize((current) => {
        saveGeometry(position, current);
        return current;
      });
    }
    setIsResizing(false);
  }, [isResizing, position]);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  useEffect(() => {
    if (!isResizing) return;
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", handleResizeEnd);
    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [isResizing, handleResize, handleResizeEnd]);

  useEffect(() => {
    if (!open) {
      setConfirmClear(false);
      setActiveIndex(0);
      setPreviewId(null);
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

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; rows: HistoryRow[] }>();
    for (const row of filtered) {
      const key = dayGroupKey(row.timestamp);
      const existing = map.get(key);
      if (existing) existing.rows.push(row);
      else map.set(key, { label: dayGroupLabel(row.timestamp), rows: [row] });
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }));
  }, [filtered]);

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

  if (!open) return null;

  const primaryLabel = (row: HistoryRow) =>
    row.sourceFilename ?? getFormatTitle(row.restorable.fromFormat);
  const targetLabel = (row: HistoryRow) => getFormatTitle(row.restorable.toFormat);

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 10003,
    left: maximized ? "50%" : `${position.x}px`,
    top: maximized ? "50%" : `${position.y}px`,
    width: maximized ? "95vw" : `${size.width}px`,
    height: maximized ? "95vh" : minimized ? "auto" : `${size.height}px`,
    maxWidth: maximized ? "95vw" : "90vw",
    maxHeight: maximized ? "95vh" : "90vh",
    transform: maximized
      ? "translate(-50%, -50%)"
      : isDragging
        ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`
        : "translate3d(0, 0, 0)",
  };

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
              Historique
            </h2>
            {!minimized && list.length > 0 && (
              <span className="floating-window-count history-modal-v2-count">
                {filtered.length === list.length
                  ? `${list.length} conversion${list.length > 1 ? "s" : ""}`
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
                aria-label="Restaurer"
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
                aria-label="Réduire"
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
                aria-label={maximized ? "Restaurer" : "Plein écran"}
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
              aria-label="Fermer"
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
                  placeholder="Rechercher…  ( / )"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Rechercher dans l'historique"
                />
                <div className="history-modal-v2-status-filters" role="group" aria-label="Filtrer par statut">
                  {(
                    [
                      ["all", "Tous"],
                      ["success", "OK"],
                      ["error", "Erreur"],
                      ["unknown", "—"],
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
                    <span>Tout effacer ?</span>
                    <button
                      type="button"
                      className="history-modal-v2-btn-clear is-confirm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmClear(false);
                        onClear();
                      }}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      className="history-modal-v2-chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmClear(false);
                      }}
                    >
                      Non
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
                    Effacer
                  </button>
                )
              )}
            </div>

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
                  <p className="history-modal-v2-empty-title">Aucune conversion pour l’instant</p>
                  <p className="history-modal-v2-empty-desc">
                    Lancez une conversion : elle apparaîtra ici pour être restaurée en un clic.
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="history-modal-v2-empty">
                  <p className="history-modal-v2-empty-title">Aucun résultat</p>
                  <p className="history-modal-v2-empty-desc">
                    Modifiez la recherche ou le filtre de statut.
                  </p>
                  <button
                    type="button"
                    className="history-modal-v2-reset-filters"
                    onClick={() => {
                      setQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Réinitialiser les filtres
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
                        }${isActive ? " is-active" : ""}`}
                        onClick={() => onRestore(row.restorable)}
                        onDoubleClick={() => onRestore(row.restorable)}
                        onMouseEnter={() => {
                          setPreviewId(row.restorable.id);
                          if (flatIndex >= 0) setActiveIndex(flatIndex);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRestore(row.restorable);
                          }
                        }}
                        aria-label={`Restaurer : ${primaryLabel(row)} vers ${targetLabel(row)}`}
                      >
                        <div className="history-modal-v2-row-main">
                          <div className="history-modal-v2-row-primary">
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
                            <span key={nowTick}>{formatHistoryTime(row.timestamp)}</span>
                          </div>
                        </div>
                        <div className="history-modal-v2-row-meta">
                          <span className={`history-modal-v2-badge history-modal-v2-badge--${row.status}`}>
                            {row.status === "unknown"
                              ? "—"
                              : row.status === "success"
                                ? "réussi"
                                : "erreur"}
                          </span>
                          {row.repeatCount > 1 && (
                            <span className="history-modal-v2-repeat">×{row.repeatCount}</span>
                          )}
                          <div className="history-modal-v2-row-actions">
                            <button
                              type="button"
                              className="history-modal-v2-row-action history-modal-v2-row-action--restore"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestore(row.restorable);
                              }}
                              aria-label="Restaurer"
                            >
                              ↩
                            </button>
                            {onDelete && (
                              <button
                                type="button"
                                className="history-modal-v2-row-action history-modal-v2-row-action--delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(row.restorable.id);
                                }}
                                aria-label="Supprimer"
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
                      Source · {contentStats(previewRow.restorable.sourceContent)}
                    </span>
                    <button
                      type="button"
                      className="history-modal-v2-preview-copy"
                      onClick={(e) => {
                        e.stopPropagation();
                        void copyPreview("source", previewRow.restorable.sourceContent);
                      }}
                    >
                      {copiedPreview === "source" ? "Copié" : "Copier"}
                    </button>
                  </div>
                  <p>{previewRow.previewSource}</p>
                </div>
                <div className="history-modal-v2-preview-col">
                  <div className="history-modal-v2-preview-head">
                    <span className="history-modal-v2-preview-label">
                      Résultat · {contentStats(previewRow.restorable.resultContent)}
                    </span>
                    <button
                      type="button"
                      className="history-modal-v2-preview-copy"
                      onClick={(e) => {
                        e.stopPropagation();
                        void copyPreview("result", previewRow.restorable.resultContent);
                      }}
                    >
                      {copiedPreview === "result" ? "Copié" : "Copier"}
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
                    Restaurer cette conversion
                  </button>
                </div>
              </div>
            )}

            {list.length > 0 && (
              <footer className="history-modal-v2-footer">
                ↑↓ · Entrée restaurer · Suppr. retirer · / chercher · Esc
              </footer>
            )}
          </>
        )}

        {!minimized && !maximized && (
          <div
            className="floating-window-resize-handle history-modal-v2-resize-handle"
            onMouseDown={handleResizeStart}
            aria-label="Redimensionner"
          />
        )}
      </div>
    </>
  );
}
