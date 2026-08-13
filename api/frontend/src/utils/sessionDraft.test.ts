import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearSessionDraft,
  loadSessionDraft,
  persistSessionDraft,
  loadSessionWorkspace,
  inspectSessionWorkspace,
  persistSessionWorkspace,
  createEmptyTab,
  deriveTabTitle,
  reorderSessionTabs,
  nextPersistNotice,
  isReplaceSourceDirty,
  MAX_CONTENT_CHARS,
} from './sessionDraft';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

describe('sessionDraft', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    clearSessionDraft();
  });

  it('persists and restores otherOutput via flat API', () => {
    persistSessionDraft({
      adocInput: '= Doc',
      mdOutput: '# Md',
      otherOutput: '<p>Hi</p>',
      sourceFormat: 'markdown',
      targetFormat: 'html',
      conversionOptions: {},
      activeProfileIds: [],
      currentFileName: null,
    });

    const draft = loadSessionDraft();
    expect(draft).not.toBeNull();
    expect(draft?.otherOutput).toBe('<p>Hi</p>');
    expect(draft?.mdOutput).toBe('# Md');
    expect(draft?.sourceFormat).toBe('markdown');
    expect(draft?.targetFormat).toBe('html');
  });

  it('migrates legacy v1 draft into workspace tabs', () => {
    localStorage.setItem(
      'ascend_session_draft_v1',
      JSON.stringify({
        adocInput: '= Hello',
        mdOutput: '',
        otherOutput: '',
        sourceFormat: 'asciidoc',
        targetFormat: 'markdown',
        conversionOptions: { toc: true },
        activeProfileIds: [],
        currentFileName: 'guide.adoc',
        savedAt: Date.now(),
      })
    );
    const ws = loadSessionWorkspace();
    expect(ws.tabs).toHaveLength(1);
    expect(ws.tabs[0].adocInput).toBe('= Hello');
    expect(ws.tabs[0].currentFileName).toBe('guide.adoc');
    expect(ws.conversionOptions).toEqual({ toc: true });
  });

  it('persists multiple tabs', () => {
    const a = createEmptyTab(0);
    const b = createEmptyTab(1);
    a.adocInput = '= A';
    b.mdOutput = '# B';
    b.sourceFormat = 'markdown';
    persistSessionWorkspace({
      tabs: [a, b],
      activeTabId: b.id,
      conversionOptions: {},
      activeProfileIds: [],
      dirtyTabIds: [a.id],
    });
    const ws = loadSessionWorkspace();
    expect(ws.tabs).toHaveLength(2);
    expect(ws.activeTabId).toBe(b.id);
    expect(ws.tabs[1].mdOutput).toBe('# B');
    expect(ws.dirtyTabIds).toEqual([]);
  });

  it('derives title from file name or first heading', () => {
    expect(
      deriveTabTitle({
        currentFileName: 'notes.adoc',
        adocInput: '',
        mdOutput: '',
        sourceFormat: 'asciidoc',
        title: 'Doc 1',
      })
    ).toBe('notes');
    expect(
      deriveTabTitle({
        currentFileName: null,
        adocInput: '= Installation guide\n\nText',
        mdOutput: '',
        sourceFormat: 'asciidoc',
        title: 'Doc 1',
      })
    ).toBe('Installation guide');
  });

  it('keeps locked titles and reorders tabs', () => {
    const a = createEmptyTab(0);
    const b = createEmptyTab(1);
    a.title = 'Custom';
    a.titleLocked = true;
    a.adocInput = '= Other title';
    persistSessionWorkspace({
      tabs: [a, b],
      activeTabId: a.id,
      conversionOptions: {},
      activeProfileIds: [],
    });
    const ws = loadSessionWorkspace();
    expect(ws.tabs[0].title).toBe('Custom');
    expect(ws.tabs[0].titleLocked).toBe(true);

    const reordered = reorderSessionTabs(ws.tabs, 0, 1);
    expect(reordered.map((t) => t.id)).toEqual([b.id, a.id]);
  });

  it('reports truncation when a tab exceeds the persist limit', () => {
    const a = createEmptyTab(0);
    a.adocInput = 'x'.repeat(MAX_CONTENT_CHARS + 8);
    const result = persistSessionWorkspace({
      tabs: [a],
      activeTabId: a.id,
      conversionOptions: {},
      activeProfileIds: [],
    });
    expect(result.ok).toBe(true);
    expect(result.truncated).toBe(true);
    expect(result.truncatedTabCount).toBe(1);
    expect(loadSessionWorkspace().tabs[0].adocInput).toHaveLength(MAX_CONTENT_CHARS);
  });

  it('reports persist failure when storage throws', () => {
    const storage = createMemoryStorage();
    storage.setItem = () => {
      throw new Error('quota');
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
      writable: true,
    });
    const a = createEmptyTab(0);
    a.adocInput = 'hi';
    const result = persistSessionWorkspace({
      tabs: [a],
      activeTabId: a.id,
      conversionOptions: {},
      activeProfileIds: [],
    });
    expect(result.ok).toBe(false);
  });

  it('dedupes persist snackbars until status changes', () => {
    const fail = { ok: false, truncated: false, truncatedTabCount: 0 };
    const trunc = { ok: true, truncated: true, truncatedTabCount: 1 };
    const ok = { ok: true, truncated: false, truncatedTabCount: 0 };

    expect(nextPersistNotice(null, fail)).toEqual({ kind: 'fail', notify: true });
    expect(nextPersistNotice('fail', fail)).toEqual({ kind: 'fail', notify: false });
    expect(nextPersistNotice('fail', ok)).toEqual({ kind: 'ok', notify: false });
    expect(nextPersistNotice('ok', fail)).toEqual({ kind: 'fail', notify: true });

    expect(nextPersistNotice(null, trunc)).toEqual({ kind: 'trunc', notify: true });
    expect(nextPersistNotice('trunc', trunc)).toEqual({ kind: 'trunc', notify: false });
    expect(nextPersistNotice('ok', trunc)).toEqual({ kind: 'trunc', notify: true });
  });

  it('treats result edits and edit-mode as dirty before replace', () => {
    const clean = {
      sourceModified: false,
      resultModified: false,
      isEditingResult: false,
      dirtyTab: false,
    };
    expect(isReplaceSourceDirty(clean)).toBe(false);
    expect(isReplaceSourceDirty({ ...clean, sourceModified: true })).toBe(true);
    expect(isReplaceSourceDirty({ ...clean, resultModified: true })).toBe(true);
    expect(isReplaceSourceDirty({ ...clean, isEditingResult: true })).toBe(true);
    expect(isReplaceSourceDirty({ ...clean, dirtyTab: true })).toBe(true);
  });

  it('flags a corrupted stored workspace without overwriting it', () => {
    localStorage.setItem('ascend_session_workspace_v1', '{not-json');
    const inspected = inspectSessionWorkspace();
    expect(inspected.corrupted).toBe(true);
    expect(inspected.workspace.tabs[0].adocInput).toBe('');
    expect(localStorage.getItem('ascend_session_workspace_v1')).toBe('{not-json');
  });

  it('flags truncation when loading content above the persist limit', () => {
    const a = createEmptyTab(0);
    a.adocInput = 'x'.repeat(MAX_CONTENT_CHARS + 8);
    persistSessionWorkspace({
      tabs: [a],
      activeTabId: a.id,
      conversionOptions: {},
      activeProfileIds: [],
    });
    const raw = JSON.parse(localStorage.getItem('ascend_session_workspace_v1') || '{}');
    raw.tabs[0].adocInput = 'y'.repeat(MAX_CONTENT_CHARS + 12);
    localStorage.setItem('ascend_session_workspace_v1', JSON.stringify(raw));
    const inspected = inspectSessionWorkspace();
    expect(inspected.corrupted).toBe(false);
    expect(inspected.truncatedOnLoad).toBe(true);
    expect(inspected.truncatedTabCount).toBe(1);
    expect(inspected.workspace.tabs[0].adocInput).toHaveLength(MAX_CONTENT_CHARS);
  });
});
