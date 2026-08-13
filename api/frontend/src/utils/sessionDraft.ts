/**
 * Persistance de session multi-onglets (brouillons éditeur).
 * Migre automatiquement l’ancien format mono-document (v1).
 */

import type { ConversionOptions, FormatType } from '../types';
import { sanitizeActiveProfileIds } from './conversionProfiles';

const SESSION_KEY_V1 = 'ascend_session_draft_v1';
const SESSION_KEY = 'ascend_session_workspace_v1';
export const MAX_CONTENT_CHARS = 2_000_000;
export const MAX_SESSION_TABS = 8;

export type PersistSessionResult = {
  ok: boolean;
  truncated: boolean;
  truncatedTabCount: number;
};

export type PersistNoticeKind = 'ok' | 'fail' | 'trunc';

/** Dédup snackbar : un fail / un trunc d’affilée, reset après un ok. */
export function nextPersistNotice(
  last: PersistNoticeKind | null,
  result: PersistSessionResult
): { kind: PersistNoticeKind; notify: boolean } {
  if (!result.ok) {
    return { kind: 'fail', notify: last !== 'fail' };
  }
  if (result.truncated) {
    return { kind: 'trunc', notify: last !== 'trunc' };
  }
  return { kind: 'ok', notify: false };
}

/** True if replacing source/result (file, folder, history) would lose unsaved work. */
export function isReplaceSourceDirty(input: {
  sourceModified: boolean;
  resultModified: boolean;
  isEditingResult: boolean;
  dirtyTab: boolean;
}): boolean {
  return (
    input.sourceModified ||
    input.resultModified ||
    input.isEditingResult ||
    input.dirtyTab
  );
}

export interface SessionTabSnapshot {
  id: string;
  title: string;
  /** Si true, le titre n’est plus dérivé du contenu / fichier. */
  titleLocked?: boolean;
  adocInput: string;
  mdOutput: string;
  otherOutput: string;
  sourceFormat: FormatType;
  targetFormat: FormatType;
  currentFileName: string | null;
}

export function tabContentExceedsPersistLimit(
  tab: Pick<SessionTabSnapshot, 'adocInput' | 'mdOutput' | 'otherOutput'>
): boolean {
  return (
    tab.adocInput.length > MAX_CONTENT_CHARS ||
    tab.mdOutput.length > MAX_CONTENT_CHARS ||
    (tab.otherOutput || '').length > MAX_CONTENT_CHARS
  );
}

/** Snapshot plat (= onglet actif) — rétrocompat tests / API simple. */
export interface SessionDraft {
  adocInput: string;
  mdOutput: string;
  otherOutput: string;
  sourceFormat: FormatType;
  targetFormat: FormatType;
  conversionOptions: ConversionOptions;
  activeProfileIds: string[];
  currentFileName: string | null;
  savedAt: number;
}

export interface SessionWorkspace {
  tabs: SessionTabSnapshot[];
  activeTabId: string;
  conversionOptions: ConversionOptions;
  activeProfileIds: string[];
  /** Ignoré à la lecture / écriture : le dirty est uniquement en mémoire. */
  dirtyTabIds?: string[];
  savedAt: number;
}

const VALID_FORMATS: FormatType[] = [
  'asciidoc', 'markdown', 'html', 'pdf', 'yaml', 'json', 'txt',
];

function isFormat(value: unknown): value is FormatType {
  return typeof value === 'string' && (VALID_FORMATS as string[]).includes(value);
}

function newTabId(): string {
  return `tab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultTabTitle(index: number): string {
  return `Doc ${index + 1}`;
}

export function createEmptyTab(index = 0): SessionTabSnapshot {
  return {
    id: newTabId(),
    title: defaultTabTitle(index),
    adocInput: '',
    mdOutput: '',
    otherOutput: '',
    sourceFormat: 'asciidoc',
    targetFormat: 'markdown',
    currentFileName: null,
  };
}

/** Titre d’onglet dérivé du nom de fichier ou du début du contenu. */
export function deriveTabTitle(tab: Pick<SessionTabSnapshot, 'currentFileName' | 'adocInput' | 'mdOutput' | 'sourceFormat'> & { title?: string }, fallbackIndex = 0): string {
  if (tab.currentFileName?.trim()) {
    return tab.currentFileName.trim().replace(/\.[^.]+$/, '') || tab.currentFileName.trim();
  }
  const raw = (tab.sourceFormat === 'markdown' ? tab.mdOutput : tab.adocInput).trim();
  if (!raw) return defaultTabTitle(fallbackIndex);
  const firstLine = raw.split(/\r?\n/, 1)[0].replace(/^[=#\s]+/, '').trim();
  if (firstLine.length > 0) return firstLine.slice(0, 28) + (firstLine.length > 28 ? '…' : '');
  return tab.title?.trim() || defaultTabTitle(fallbackIndex);
}

function clampContent(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, MAX_CONTENT_CHARS) : '';
}

function fieldWasTruncated(value: unknown): boolean {
  return typeof value === 'string' && value.length > MAX_CONTENT_CHARS;
}

function normalizeTab(
  raw: Partial<SessionTabSnapshot>,
  index: number
): { tab: SessionTabSnapshot; truncated: boolean } | null {
  if (!isFormat(raw.sourceFormat) || !isFormat(raw.targetFormat)) return null;
  const titleLocked = raw.titleLocked === true;
  const rawTitle =
    typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim().slice(0, 40) : '';
  const tab: SessionTabSnapshot = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newTabId(),
    title: rawTitle || defaultTabTitle(index),
    titleLocked,
    adocInput: clampContent(raw.adocInput),
    mdOutput: clampContent(raw.mdOutput),
    otherOutput: clampContent(raw.otherOutput),
    sourceFormat: raw.sourceFormat,
    targetFormat: raw.targetFormat,
    currentFileName: typeof raw.currentFileName === 'string' ? raw.currentFileName : null,
  };
  if (!titleLocked) {
    tab.title = deriveTabTitle(tab, index);
  }
  const truncated =
    fieldWasTruncated(raw.adocInput) ||
    fieldWasTruncated(raw.mdOutput) ||
    fieldWasTruncated(raw.otherOutput);
  return { tab, truncated };
}

function draftToTab(draft: SessionDraft, index = 0): SessionTabSnapshot {
  return {
    id: newTabId(),
    title: deriveTabTitle(draft, index),
    adocInput: draft.adocInput,
    mdOutput: draft.mdOutput,
    otherOutput: draft.otherOutput,
    sourceFormat: draft.sourceFormat,
    targetFormat: draft.targetFormat,
    currentFileName: draft.currentFileName,
  };
}

function parseLegacyV1(): SessionDraft | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY_V1);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionDraft>;
    if (!isFormat(parsed.sourceFormat) || !isFormat(parsed.targetFormat)) return null;
    return {
      adocInput: clampContent(parsed.adocInput),
      mdOutput: clampContent(parsed.mdOutput),
      otherOutput: clampContent(parsed.otherOutput),
      sourceFormat: parsed.sourceFormat,
      targetFormat: parsed.targetFormat,
      conversionOptions:
        parsed.conversionOptions && typeof parsed.conversionOptions === 'object'
          ? parsed.conversionOptions
          : {},
      activeProfileIds: sanitizeActiveProfileIds(parsed.activeProfileIds),
      currentFileName:
        typeof parsed.currentFileName === 'string' ? parsed.currentFileName : null,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function createDefaultWorkspace(): SessionWorkspace {
  const tab = createEmptyTab(0);
  return {
    tabs: [tab],
    activeTabId: tab.id,
    conversionOptions: {},
    activeProfileIds: [],
    savedAt: Date.now(),
  };
}

export type LoadSessionResult = {
  workspace: SessionWorkspace;
  corrupted: boolean;
  truncatedOnLoad: boolean;
  truncatedTabCount: number;
};

export function inspectSessionWorkspace(): LoadSessionResult {
  let hadStoredWorkspace = false;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      hadStoredWorkspace = true;
      const parsed = JSON.parse(raw) as Partial<SessionWorkspace>;
      const tabsRaw = Array.isArray(parsed.tabs) ? parsed.tabs : [];
      const normalized = tabsRaw
        .slice(0, MAX_SESSION_TABS)
        .map((t, i) => normalizeTab(t as Partial<SessionTabSnapshot>, i))
        .filter((t): t is { tab: SessionTabSnapshot; truncated: boolean } => !!t);
      const tabs = normalized.map((n) => n.tab);
      const truncatedTabCount = normalized.filter((n) => n.truncated).length;
      if (tabs.length > 0) {
        const activeTabId =
          typeof parsed.activeTabId === 'string' && tabs.some((t) => t.id === parsed.activeTabId)
            ? parsed.activeTabId
            : tabs[0].id;
        return {
          workspace: {
            tabs,
            activeTabId,
            conversionOptions:
              parsed.conversionOptions && typeof parsed.conversionOptions === 'object'
                ? parsed.conversionOptions
                : {},
            activeProfileIds: sanitizeActiveProfileIds(parsed.activeProfileIds),
            dirtyTabIds: [],
            savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
          },
          corrupted: false,
          truncatedOnLoad: truncatedTabCount > 0,
          truncatedTabCount,
        };
      }
    }
  } catch {
    /* fall through — treat as corrupted if a key was present */
  }

  const legacy = parseLegacyV1();
  if (legacy) {
    const tab = draftToTab(legacy, 0);
    const ws: SessionWorkspace = {
      tabs: [tab],
      activeTabId: tab.id,
      conversionOptions: legacy.conversionOptions,
      activeProfileIds: legacy.activeProfileIds,
      savedAt: legacy.savedAt,
    };
    persistSessionWorkspace(ws);
    try {
      localStorage.removeItem(SESSION_KEY_V1);
    } catch {
      /* ignore */
    }
    return { workspace: ws, corrupted: false, truncatedOnLoad: false, truncatedTabCount: 0 };
  }

  return {
    workspace: createDefaultWorkspace(),
    corrupted: hadStoredWorkspace,
    truncatedOnLoad: false,
    truncatedTabCount: 0,
  };
}

export function loadSessionWorkspace(): SessionWorkspace {
  return inspectSessionWorkspace().workspace;
}

export function persistSessionWorkspace(
  workspace: Omit<SessionWorkspace, 'savedAt'> | SessionWorkspace
): PersistSessionResult {
  const truncatedTabCount = workspace.tabs.filter(tabContentExceedsPersistLimit).length;
  const truncated = truncatedTabCount > 0;
  try {
    const tabs = workspace.tabs.slice(0, MAX_SESSION_TABS).map((t, i) => ({
      ...t,
      adocInput: t.adocInput.slice(0, MAX_CONTENT_CHARS),
      mdOutput: t.mdOutput.slice(0, MAX_CONTENT_CHARS),
      otherOutput: (t.otherOutput || '').slice(0, MAX_CONTENT_CHARS),
      title: (t.titleLocked ? t.title : deriveTabTitle(t, i)).slice(0, 40),
      titleLocked: t.titleLocked === true,
    }));
    if (tabs.length === 0) {
      const empty = createDefaultWorkspace();
      localStorage.setItem(SESSION_KEY, JSON.stringify(empty));
      return { ok: true, truncated: false, truncatedTabCount: 0 };
    }
    const activeTabId = tabs.some((t) => t.id === workspace.activeTabId)
      ? workspace.activeTabId
      : tabs[0].id;
    const payload: SessionWorkspace = {
      tabs,
      activeTabId,
      conversionOptions: workspace.conversionOptions || {},
      activeProfileIds: sanitizeActiveProfileIds(workspace.activeProfileIds),
      dirtyTabIds: [],
      savedAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    return { ok: true, truncated, truncatedTabCount };
  } catch {
    return { ok: false, truncated, truncatedTabCount };
  }
}

/** API plate : lit l’onglet actif (compat). */
export function loadSessionDraft(): SessionDraft | null {
  const ws = loadSessionWorkspace();
  const active = ws.tabs.find((t) => t.id === ws.activeTabId) ?? ws.tabs[0];
  if (!active) return null;
  return {
    adocInput: active.adocInput,
    mdOutput: active.mdOutput,
    otherOutput: active.otherOutput,
    sourceFormat: active.sourceFormat,
    targetFormat: active.targetFormat,
    conversionOptions: ws.conversionOptions,
    activeProfileIds: ws.activeProfileIds,
    currentFileName: active.currentFileName,
    savedAt: ws.savedAt,
  };
}

/** API plate : écrit dans l’onglet actif (ou crée le workspace). */
export function persistSessionDraft(draft: Omit<SessionDraft, 'savedAt'>): void {
  let ws: SessionWorkspace;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    ws = raw ? loadSessionWorkspace() : createDefaultWorkspace();
  } catch {
    ws = createDefaultWorkspace();
  }
  const idx = ws.tabs.findIndex((t) => t.id === ws.activeTabId);
  const i = idx >= 0 ? idx : 0;
  const updated: SessionTabSnapshot = {
    id: ws.tabs[i]?.id ?? newTabId(),
    title: ws.tabs[i]?.titleLocked ? (ws.tabs[i]?.title || deriveTabTitle(draft, i)) : deriveTabTitle(draft, i),
    titleLocked: ws.tabs[i]?.titleLocked === true,
    adocInput: draft.adocInput,
    mdOutput: draft.mdOutput,
    otherOutput: draft.otherOutput || '',
    sourceFormat: draft.sourceFormat,
    targetFormat: draft.targetFormat,
    currentFileName: draft.currentFileName,
  };
  const tabs = ws.tabs.length ? [...ws.tabs] : [updated];
  tabs[i] = updated;
  persistSessionWorkspace({
    tabs,
    activeTabId: updated.id,
    conversionOptions: draft.conversionOptions,
    activeProfileIds: draft.activeProfileIds,
  });
}

export function clearSessionDraft(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY_V1);
  } catch {
    /* ignore */
  }
}

export function snapshotFromBuffers(input: {
  id: string;
  title?: string;
  titleLocked?: boolean;
  adocInput: string;
  mdOutput: string;
  otherOutput: string;
  sourceFormat: FormatType;
  targetFormat: FormatType;
  currentFileName: string | null;
  index?: number;
}): SessionTabSnapshot {
  const titleLocked = input.titleLocked === true;
  const base: SessionTabSnapshot = {
    id: input.id,
    title: (input.title || defaultTabTitle(input.index ?? 0)).slice(0, 40),
    titleLocked,
    adocInput: input.adocInput,
    mdOutput: input.mdOutput,
    otherOutput: input.otherOutput,
    sourceFormat: input.sourceFormat,
    targetFormat: input.targetFormat,
    currentFileName: input.currentFileName,
  };
  if (titleLocked) return base;
  return { ...base, title: deriveTabTitle(base, input.index ?? 0) };
}

export function reorderSessionTabs(
  tabs: SessionTabSnapshot[],
  fromIndex: number,
  toIndex: number
): SessionTabSnapshot[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= tabs.length ||
    toIndex >= tabs.length ||
    fromIndex === toIndex
  ) {
    return tabs;
  }
  const next = [...tabs];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
