import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearSessionDraft,
  loadSessionDraft,
  persistSessionDraft,
  loadSessionWorkspace,
  persistSessionWorkspace,
  createEmptyTab,
  deriveTabTitle,
  reorderSessionTabs,
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
    });
    const ws = loadSessionWorkspace();
    expect(ws.tabs).toHaveLength(2);
    expect(ws.activeTabId).toBe(b.id);
    expect(ws.tabs[1].mdOutput).toBe('# B');
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
});
