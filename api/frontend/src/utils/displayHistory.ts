/**
 * ============================================================================
 * DISPLAY HISTORY - Derived view model for conversion history
 * ============================================================================
 *
 * 1. WHY rawHistory IS PRESERVED AS IMMUTABLE SOURCE OF TRUTH
 * -----------------------------------------------------------
 * rawHistory[] is the single source of truth for persistence and app logic.
 * Storage format, save/clear behavior, and all existing code that writes or
 * reads history must remain unchanged. This module only adds a read-only
 * view layer. rawHistory is never modified, reordered, or filtered. Any
 * change to how history is stored or written would break compatibility and
 * invariants; therefore all improvements live in the derived view only.
 *
 * 2. WHY GROUPING IS IMPLEMENTED AT THE PRESENTATION LAYER
 * --------------------------------------------------------
 * Consecutive duplicate entries are grouped only when building the display
 * list. Storage always keeps every append. Restore/clear still operate on
 * the raw list. The UI can choose to show either the raw list or the
 * grouped display via the useGroupedHistory flag. No persistence or write
 * path is affected. This keeps storage simple and backwards-compatible.
 *
 * 3. EXACT DUPLICATE DETECTION CRITERIA
 * -------------------------------------
 * Two entries A and B are considered duplicates IF AND ONLY IF all of:
 *   - A.conversionType === B.conversionType
 *   - A.sourceTitle    === B.sourceTitle
 *   - A.targetFormat   === B.targetFormat
 * No other field (time, IDs, timestamps, etc.) may be used for equality.
 * When conversionType or sourceTitle are missing, they are derived from
 * fromFormat, toFormat, and sourceContent so that existing raw history
 * remains usable without schema changes. Only CONSECUTIVE duplicates are
 * grouped; non-consecutive duplicates remain separate.
 *
 * 4. TIME AND SPACE COMPLEXITY
 * ----------------------------
 * - Time: O(n), single pass over rawHistory. Each item is compared only
 *   with the last emitted group; no sorting, no nested loops.
 * - Space: O(n) in the worst case (no grouping). Output list has at most
 *   n elements; each DisplayHistoryEntry holds a reference to an
 *   originalEntry and a small fixed amount of metadata.
 *
 * 5. WHY THIS CHANGE IS NON-BREAKING
 * ----------------------------------
 * No existing code is modified. Raw history lifecycle, structure, and
 * semantics are unchanged. The feature flag useGroupedHistory defaults to
 * false, so when useGroupedHistory === false the system behaves exactly as
 * before and the UI continues to use rawHistory[]. displayHistory[] is
 * used only when the flag is set to true, and is computed from rawHistory
 * without mutating it.
 *
 * ============================================================================
 */

/**
 * Minimum shape of a raw history entry used for grouping and metadata.
 * conversionType, sourceTitle, targetFormat may be provided directly or
 * derived from fromFormat, toFormat, sourceContent for compatibility with
 * existing ConversionHistoryItem. Optional hasError, durationMs, sourcePath
 * support richer backends; when absent, metadata falls back to
 * "unknown", null, null.
 */
export interface HistoryEntry {
  fromFormat: string;
  toFormat: string;
  sourceContent: string;
  conversionType?: string;
  sourceTitle?: string;
  targetFormat?: string;
  hasError?: boolean;
  durationMs?: number;
  sourcePath?: string;
  [key: string]: unknown;
}

/**
 * One row in the display list: a single run or a group of consecutive
 * identical runs. Immutable.
 *
 * - originalEntry: always the first entry of the group; use for restore.
 * - repeatCount: number of raw entries in the group (>= 1).
 * - status: "success" if originalEntry.hasError === false, "error" if
 *   originalEntry.hasError === true, "unknown" otherwise.
 * - durationMs: originalEntry.durationMs if present, else null.
 * - sourceFilename: basename of originalEntry.sourcePath if present, else null.
 */
export interface DisplayHistoryEntry {
  originalEntry: HistoryEntry;
  repeatCount: number;
  status: "success" | "error" | "unknown";
  durationMs: number | null;
  sourceFilename: string | null;
}

/**
 * Resolves conversionType for equality: use entry.conversionType if present,
 * otherwise derive from fromFormat and toFormat.
 */
function conversionTypeFor(entry: HistoryEntry): string {
  return (
    (entry.conversionType as string | undefined) ??
    `${entry.fromFormat}->${entry.toFormat}`
  );
}

/**
 * Resolves sourceTitle for equality: use entry.sourceTitle if present,
 * otherwise derive from first line of sourceContent (trimmed).
 */
function sourceTitleFor(entry: HistoryEntry): string {
  if (entry.sourceTitle != null && entry.sourceTitle !== "") {
    return String(entry.sourceTitle);
  }
  const first = entry.sourceContent.trim().split("\n")[0];
  return (first ?? "").trim() || entry.sourceContent.trim().slice(0, 200);
}

/**
 * Resolves targetFormat for equality: use entry.targetFormat if present,
 * otherwise toFormat.
 */
function targetFormatFor(entry: HistoryEntry): string {
  return (entry.targetFormat as string | undefined) ?? entry.toFormat;
}

/**
 * Duplicate rule: A and B are equal iff conversionType, sourceTitle, and
 * targetFormat are equal. No other fields are used.
 */
function entriesEqual(a: HistoryEntry, b: HistoryEntry): boolean {
  return (
    conversionTypeFor(a) === conversionTypeFor(b) &&
    sourceTitleFor(a) === sourceTitleFor(b) &&
    targetFormatFor(a) === targetFormatFor(b)
  );
}

/**
 * Extracts filename from a path (e.g. "dir/sub/file.adoc" -> "file.adoc").
 */
function extractFilename(path: string): string {
  const s = path.replace(/\\/g, "/");
  const idx = s.lastIndexOf("/");
  return idx >= 0 ? s.slice(idx + 1) : s;
}

/**
 * Builds the display list from the raw history. Single pass, O(n), no mutation
 * of rawHistory, no sorting, no side effects.
 *
 * @param rawHistory - The stored list; never modified
 * @returns New array of DisplayHistoryEntry, one per group of consecutive identical entries
 */
export function buildDisplayHistory(
  rawHistory: HistoryEntry[]
): DisplayHistoryEntry[] {
  const out: DisplayHistoryEntry[] = [];

  for (let i = 0; i < rawHistory.length; i++) {
    const curr = rawHistory[i];
    const last = out[out.length - 1];

    if (last && entriesEqual(last.originalEntry, curr)) {
      out[out.length - 1] = {
        ...last,
        repeatCount: last.repeatCount + 1,
      };
    } else {
      const hasError = curr.hasError;
      const status: "success" | "error" | "unknown" =
        hasError === true ? "error" : hasError === false ? "success" : "unknown";
      const durationMs =
        typeof curr.durationMs === "number" ? curr.durationMs : null;
      const sourceFilename =
        curr.sourcePath != null && curr.sourcePath !== ""
          ? extractFilename(curr.sourcePath)
          : null;

      out.push({
        originalEntry: curr,
        repeatCount: 1,
        status,
        durationMs,
        sourceFilename,
      });
    }
  }

  return out;
}

/**
 * Feature flag: when false, the system behaves exactly as before and the UI
 * uses rawHistory[]. When true, the UI should use displayHistory[] (computed
 * via buildDisplayHistory(rawHistory)) as the data source for the history
 * list. Default is false to preserve existing behavior.
 *
 * INTEGRATION POINT: In the component that renders the history list, the
 * data source for the list is chosen by this flag. Do not change any
 * existing UI component structure; only switch which list is passed into
 * the existing render logic (rawHistory vs buildDisplayHistory(rawHistory)).
 */
export const useGroupedHistory: boolean = false;

/**
 * ============================================================================
 * INTEGRATION NOTE FOR MAINTAINERS
 * ============================================================================
 *
 * To wire the grouped view without changing existing behavior:
 *
 * - When useGroupedHistory === false: keep using rawHistory (e.g.
 *   conversionHistory) as the data source for the history panel. No changes.
 *
 * - When useGroupedHistory === true: use buildDisplayHistory(rawHistory) as
 *   the data source. When rendering, map over displayHistory; for each item
 *   use item.originalEntry when calling restoreFromHistory (and for keys,
 *   e.g. item.originalEntry.id). Do not change storage, save, or clear
 *   logic; rawHistory remains the single source of truth.
 *
 * Do not change any existing UI component structure; only the data source
 * for the list (rawHistory vs displayHistory).
 *
 * ============================================================================
 */
