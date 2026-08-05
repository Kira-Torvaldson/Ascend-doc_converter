import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearSessionDraft, loadSessionDraft, persistSessionDraft } from './sessionDraft';

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

  it('persists and restores otherOutput', () => {
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

  it('defaults missing otherOutput to empty string', () => {
    localStorage.setItem(
      'ascend_session_draft_v1',
      JSON.stringify({
        adocInput: '',
        mdOutput: '# Md',
        sourceFormat: 'markdown',
        targetFormat: 'html',
        conversionOptions: {},
        activeProfileIds: [],
        currentFileName: null,
        savedAt: Date.now(),
      })
    );
    const draft = loadSessionDraft();
    expect(draft?.otherOutput).toBe('');
  });
});
