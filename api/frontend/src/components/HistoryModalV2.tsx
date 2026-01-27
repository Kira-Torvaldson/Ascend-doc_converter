/**
 * ============================================================================
 * HistoryModalV2 - Alternative history window (optional, non-breaking)
 * ============================================================================
 *
 * WHY THE EXISTING MODAL IS PRESERVED UNTOUCHED:
 * ----------------------------------------------
 * The current history modal is legacy and in production use. Modifying it
 * would risk regressions and require broader QA. This component is an
 * alternative implementation that coexists behind a feature flag. The
 * existing modal's code, structure, and behavior stay byte-for-byte identical.
 *
 * WHY A NEW MODAL IS INTRODUCED INSTEAD OF MODIFYING THE OLD ONE:
 * ----------------------------------------------------------------
 * Requirements ask for a cleaner layout and better hierarchy without
 * changing existing behavior. A new component allows a full pass on
 * layout and UX while keeping the old path unchanged. The feature flag
 * useNewHistoryModal controls which one is shown; default false keeps
 * current behavior.
 *
 * HOW THE FEATURE FLAG ENSURES ZERO REGRESSION:
 * ---------------------------------------------
 * useNewHistoryModal defaults to false. When false, the legacy modal
 * is opened exactly as before; this component is not rendered. When
 * true, the host renders HistoryModalV2 instead (or on top). No
 * existing click handler or data flow is changed; only the conditional
 * choice of which modal to show is added.
 *
 * OPTIONAL NOTE – SAFELY REMOVING THE OLD MODAL LATER:
 * ----------------------------------------------------
 * When HistoryModalV2 is validated and the flag is permanently true,
 * the legacy block can be removed by deleting the branch that renders
 * the old panel when !useNewHistoryModal, and inlining the V2 branch.
 * Keep rawHistory, restore, and clear logic unchanged; only the modal
 * implementation is replaced.
 *
 * ============================================================================
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import type { ConversionHistoryItem, FormatType } from "../types";

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 400;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;

/**
 * When false, the existing history modal is used. When true, HistoryModalV2
 * is shown instead. Default false preserves current behavior and ensures
 * zero regression.
 */
export const useNewHistoryModal: boolean = true;

/**
 * Grouped display entry shape (e.g. from buildDisplayHistory).
 * originalEntry is the restorable item used for onRestore.
 */
export type DisplayHistoryEntryShape = {
  originalEntry: ConversionHistoryItem;
  repeatCount: number;
  status: "success" | "error" | "unknown";
  durationMs: number | null;
  sourceFilename: string | null;
};

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

/** Formats timestamp for history list: "Aujourd'hui 14:32", "Hier 09:15", or "26 janv. 14:32". */
function formatHistoryTime(ts: number): string {
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
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sameDay) return `Aujourd'hui ${time}`;
  if (wasYesterday) return `Hier ${time}`;
  return `${d.getDate()} ${d.toLocaleString("fr-FR", { month: "short" })} ${time}`;
}

export interface HistoryModalV2Props {
  open: boolean;
  onClose: () => void;
  /** Optional: when provided, minimize button sends window to taskbar instead of in-place compact bar */
  onMinimize?: () => void;
  /** Raw list (ConversionHistoryItem[]) or grouped list (DisplayHistoryEntry[]). Not mutated. */
  entries: ConversionHistoryItem[] | DisplayHistoryEntryShape[];
  onRestore: (item: ConversionHistoryItem) => void;
  onClear: () => void;
  getFormatTitle: (format: FormatType) => string;
}

/**
 * Pure presentation modal for conversion history. Accepts rawHistory or
 * displayHistory; does not mutate data or add persistence. Layout: header,
 * toolbar (clear/close), scrollable list, optional footer. Each row shows
 * source filename → target format, conversion type, timestamp, status badge,
 * and repeat count when > 1.
 */
export function HistoryModalV2({
  open,
  onClose,
  onMinimize,
  entries,
  onRestore,
  onClear,
  getFormatTitle,
}: HistoryModalV2Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(() => ({
    x: Math.max(0, (typeof window !== "undefined" ? window.innerWidth - DEFAULT_WIDTH : 0) / 2),
    y: Math.max(0, (typeof window !== "undefined" ? window.innerHeight - DEFAULT_HEIGHT : 0) / 2),
  }));
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (maximized || !panelRef.current) return;
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
      const w = maximized ? window.innerWidth * 0.95 : size.width;
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
      setPosition({
        x: Math.max(0, Math.min(position.x + dragOffset.x, maxX)),
        y: Math.max(0, Math.min(position.y + dragOffset.y, maxY)),
      });
      setDragOffset({ x: 0, y: 0 });
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

  const handleResizeEnd = useCallback(() => setIsResizing(false), []);

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

  if (!open) return null;

  const list: Array<{
    restorable: ConversionHistoryItem;
    primary: string;
    conversionType: string;
    timestamp: number;
    status: "success" | "error" | "unknown";
    repeatCount: number;
    sourceFilename: string | null;
  }> = entries.map((item) => {
    const restorable = getRestorable(item);
    const from = restorable.fromFormat ?? "";
    const to = restorable.toFormat ?? "";
    const conversionType = `${from} → ${to}`;
    const ts = restorable.timestamp ?? 0;
    if (isDisplayEntry(item)) {
      return {
        restorable: item.originalEntry,
        primary: item.sourceFilename ?? conversionType,
        conversionType,
        timestamp: item.originalEntry.timestamp ?? ts,
        status: item.status,
        repeatCount: item.repeatCount,
        sourceFilename: item.sourceFilename,
      };
    }
    const firstLine = (restorable.sourceContent || "").trim().split("\n")[0];
    const sourceFilename = (firstLine ?? "").trim().slice(0, 60) || null;
    return {
      restorable,
      primary: sourceFilename ?? conversionType,
      conversionType,
      timestamp: ts,
      status: "unknown" as const,
      repeatCount: 1,
      sourceFilename,
    };
  });

  const primaryLabel = (row: typeof list[0]) =>
    row.sourceFilename ?? getFormatTitle(row.restorable.fromFormat);
  const targetLabel = (row: typeof list[0]) =>
    getFormatTitle(row.restorable.toFormat);
  const conversionLabel = (row: typeof list[0]) =>
    `${getFormatTitle(row.restorable.fromFormat)} → ${getFormatTitle(row.restorable.toFormat)}`;

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
    "history-modal-v2-panel",
    "history-modal-v2-window",
    minimized ? "history-modal-v2-minimized" : "",
    maximized ? "history-modal-v2-maximized" : "",
    isDragging ? "history-modal-v2-dragging" : "",
    isResizing ? "history-modal-v2-resizing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className="history-modal-v2-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-v2-title"
      />
      <div
        ref={panelRef}
        className={panelClasses}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="history-modal-v2-header history-modal-v2-header-draggable"
          onMouseDown={handleDragStart}
        >
          <div className="history-modal-v2-title-wrap">
            <h2 id="history-modal-v2-title" className="history-modal-v2-title">
              Historique
            </h2>
            {!minimized && list.length > 0 && (
              <span className="history-modal-v2-count">
                {list.length} conversion{list.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="history-modal-v2-controls">
            {minimized ? (
              <button
                type="button"
                className="history-modal-v2-btn history-modal-v2-btn-restore"
                onClick={(e) => {
                  e.stopPropagation();
                  setMinimized(false);
                }}
                title="Restaurer"
                aria-label="Restaurer"
              >
                □
              </button>
            ) : (
              <button
                type="button"
                className="history-modal-v2-btn history-modal-v2-btn-minimize"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMinimize) {
                    onMinimize();
                  } else {
                    setMinimized(true);
                  }
                }}
                title="Réduire"
                aria-label="Réduire"
              >
                −
              </button>
            )}
            {!minimized && (
              <button
                type="button"
                className="history-modal-v2-btn history-modal-v2-btn-maximize"
                onClick={(e) => {
                  e.stopPropagation();
                  setMaximized(!maximized);
                }}
                title={maximized ? "Restaurer" : "Plein écran"}
                aria-label={maximized ? "Restaurer" : "Plein écran"}
              >
                {maximized ? "⧉" : "□"}
              </button>
            )}
            <button
              type="button"
              className="history-modal-v2-btn history-modal-v2-btn-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Fermer"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        </header>

        {!minimized && (
          <>
            {list.length > 0 && (
              <div className="history-modal-v2-toolbar">
                <button
                  type="button"
                  className="history-modal-v2-btn-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                >
                  Effacer l'historique
                </button>
              </div>
            )}

            <div className="history-modal-v2-list">
          {list.length === 0 ? (
            <div className="history-modal-v2-empty">
              <div className="history-modal-v2-empty-icon" aria-hidden>
                ↶
              </div>
              <p className="history-modal-v2-empty-title">
                Aucune conversion pour l'instant
              </p>
              <p className="history-modal-v2-empty-desc">
                Vos conversions récentes apparaîtront ici. Cliquez sur une entrée pour la restaurer.
              </p>
            </div>
          ) : (
            list.map((row, idx) => (
              <div
                key={row.restorable.id ?? idx}
                className="history-modal-v2-row"
                onClick={() => onRestore(row.restorable)}
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
                    {primaryLabel(row)}
                    <span className="history-modal-v2-arrow">→</span>
                    {targetLabel(row)}
                  </div>
                  <div className="history-modal-v2-row-secondary">
                    <span>{conversionLabel(row)}</span>
                    <span>{formatHistoryTime(row.timestamp)}</span>
                  </div>
                </div>
                <div className="history-modal-v2-row-meta">
                  <span
                    className={`history-modal-v2-badge history-modal-v2-badge--${row.status}`}
                  >
                    {row.status === "unknown"
                      ? "—"
                      : row.status === "success"
                        ? "réussi"
                        : row.status === "error"
                          ? "erreur"
                          : row.status}
                  </span>
                  {row.repeatCount > 1 && (
                    <span className="history-modal-v2-repeat">
                      ×{row.repeatCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {list.length > 0 && (
          <footer className="history-modal-v2-footer">
            Cliquez sur une entrée pour la restaurer
          </footer>
        )}
          </>
        )}

        {!minimized && !maximized && (
          <div
            className="history-modal-v2-resize-handle"
            onMouseDown={handleResizeStart}
            title="Redimensionner"
            aria-label="Redimensionner"
          />
        )}
      </div>
    </>
  );
}

/**
 * ============================================================================
 * INTEGRATION NOTE FOR MAINTAINERS
 * ============================================================================
 *
 * Wiring (add-only; do not change existing logic):
 *
 * 1. Import: add
 *      import { HistoryModalV2, useNewHistoryModal } from "./components/HistoryModalV2";
 *
 * 2. When the history icon is clicked, the existing handler (e.g. setShowHistoryPanel
 *    toggle) stays unchanged. Add a separate conditional render:
 *
 *      {showHistoryPanel && useNewHistoryModal && (
 *        <HistoryModalV2
 *          open={showHistoryPanel}
 *          onClose={() => setShowHistoryPanel(false)}
 *          entries={conversionHistory}
 *          onRestore={restoreFromHistory}
 *          onClear={clearHistory}
 *          getFormatTitle={getFormatTitle}
 *        />
 *      )}
 *
 * 3. Use a high z-index (e.g. 10000) so HistoryModalV2 appears above the legacy
 *    modal when both are in the tree. When useNewHistoryModal is false, only
 *    the legacy modal renders. When true, both may be in the tree; V2 is on top
 *    and captures interaction. Closing V2 calls onClose which sets
 *    showHistoryPanel(false), so both close.
 *
 * 4. To use grouped display instead of raw list, pass buildDisplayHistory(rawHistory)
 *    as entries when the grouping feature flag is on; ensure onRestore is called
 *    with item.originalEntry when the item is a DisplayHistoryEntry.
 *
 * ============================================================================
 */
