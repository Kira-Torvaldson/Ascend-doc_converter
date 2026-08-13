import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cloneUserSettings,
  DEFAULT_USER_SETTINGS,
  persistUserSettings,
} from '../settings/userSettings';
import {
  clearSessionDraft,
  createEmptyTab,
  loadSessionWorkspace,
  persistSessionWorkspace,
} from '../utils/sessionDraft';
import { createSessionBootstrap } from './useSessionTabs';

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

function setRestoreSessionTabs(restore: boolean) {
  const settings = cloneUserSettings(DEFAULT_USER_SETTINGS);
  settings.ui.restoreSessionTabs = restore;
  persistUserSettings(settings);
}

describe('createSessionBootstrap', () => {
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

  it('purges the stored workspace when restore is disabled', () => {
    setRestoreSessionTabs(true);
    const tab = createEmptyTab(0);
    tab.adocInput = '= Keep me';
    persistSessionWorkspace({
      tabs: [tab],
      activeTabId: tab.id,
      conversionOptions: {},
      activeProfileIds: [],
    });

    setRestoreSessionTabs(false);
    const boot = createSessionBootstrap();

    expect(boot.restored).toBe(false);
    expect(boot.activeTab.adocInput).toBe('');
    expect(loadSessionWorkspace().tabs[0].adocInput).toBe('');
  });

  it('restores content when restore is enabled', () => {
    setRestoreSessionTabs(true);
    const tab = createEmptyTab(0);
    tab.adocInput = '= Restored';
    tab.currentFileName = 'guide.adoc';
    persistSessionWorkspace({
      tabs: [tab],
      activeTabId: tab.id,
      conversionOptions: {},
      activeProfileIds: [],
    });

    const boot = createSessionBootstrap();
    expect(boot.restored).toBe(true);
    expect(boot.activeTab.adocInput).toBe('= Restored');
    expect(boot.activeTab.currentFileName).toBe('guide.adoc');
    expect(boot.workspace.activeTabId).toBe(tab.id);
  });

  it('does not flag an empty default workspace as restored', () => {
    setRestoreSessionTabs(true);
    const boot = createSessionBootstrap();
    expect(boot.restored).toBe(false);
    expect(boot.workspace.tabs).toHaveLength(1);
    expect(boot.activeTab.adocInput).toBe('');
    expect(boot.loadIssue).toBeNull();
  });

  it('reports a corrupted workspace as a load issue', () => {
    setRestoreSessionTabs(true);
    localStorage.setItem('ascend_session_workspace_v1', '{}');
    const boot = createSessionBootstrap();
    expect(boot.restored).toBe(false);
    expect(boot.loadIssue).toEqual({ kind: 'corrupted', truncatedTabCount: 0 });
  });
});
