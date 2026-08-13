/**
 * Onglets de session — état, fermeture, persistance.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConversionOptions, FormatType } from '../types';
import { loadUserSettings } from '../settings/userSettings';
import {
  createDefaultWorkspace,
  createEmptyTab,
  inspectSessionWorkspace,
  persistSessionWorkspace,
  clearSessionDraft,
  nextPersistNotice,
  type PersistNoticeKind,
  type PersistSessionResult,
  reorderSessionTabs,
  snapshotFromBuffers,
  MAX_SESSION_TABS,
  type SessionTabSnapshot,
  type SessionWorkspace,
} from '../utils/sessionDraft';

export type SessionEditorBuffers = {
  adocInput: string;
  mdOutput: string;
  otherOutput: string;
  sourceFormat: FormatType;
  targetFormat: FormatType;
  currentFileName: string | null;
};

export type SessionLoadIssue = {
  kind: 'corrupted' | 'truncated';
  truncatedTabCount: number;
};

export type SessionBootstrap = {
  workspace: SessionWorkspace;
  activeTab: SessionTabSnapshot;
  restored: boolean;
  loadIssue: SessionLoadIssue | null;
};

export function createSessionBootstrap(): SessionBootstrap {
  const restore = loadUserSettings().ui.restoreSessionTabs !== false;
  if (!restore) clearSessionDraft();
  const inspected = restore
    ? inspectSessionWorkspace()
    : {
        workspace: createDefaultWorkspace(),
        corrupted: false,
        truncatedOnLoad: false,
        truncatedTabCount: 0,
      };
  const workspace = inspected.workspace;
  const activeTab =
    workspace.tabs.find((t) => t.id === workspace.activeTabId) ?? workspace.tabs[0];
  const restored =
    !inspected.corrupted &&
    ((workspace.tabs?.length ?? 0) > 1 ||
      Boolean(
        workspace.tabs?.[0] &&
          (workspace.tabs[0].adocInput.trim() ||
            workspace.tabs[0].mdOutput.trim() ||
            workspace.tabs[0].otherOutput.trim() ||
            workspace.tabs[0].currentFileName)
      ));
  const loadIssue: SessionLoadIssue | null = inspected.corrupted
    ? { kind: 'corrupted', truncatedTabCount: 0 }
    : inspected.truncatedOnLoad
      ? { kind: 'truncated', truncatedTabCount: inspected.truncatedTabCount }
      : null;
  return { workspace, activeTab, restored, loadIssue };
}

export type UseSessionTabsArgs = {
  buffers: SessionEditorBuffers;
  onApplyTab: (tab: SessionTabSnapshot) => void;
  sourceModified: boolean;
  resultModified: boolean;
  conversionOptions: ConversionOptions;
  activeProfileIds: string[];
  restoreSessionTabs: boolean;
  onSessionRestored?: (count: number) => void;
  onPersistIssue?: (result: PersistSessionResult) => void;
  onSessionLoadIssue?: (issue: SessionLoadIssue) => void;
};

export function useSessionTabs(
  bootstrap: SessionBootstrap,
  {
    buffers,
    onApplyTab,
    sourceModified,
    resultModified,
    conversionOptions,
    activeProfileIds,
    restoreSessionTabs,
    onSessionRestored,
    onPersistIssue,
    onSessionLoadIssue,
  }: UseSessionTabsArgs
) {
  const [sessionTabs, setSessionTabs] = useState<SessionTabSnapshot[]>(
    () => bootstrap.workspace.tabs
  );
  const [activeSessionTabId, setActiveSessionTabId] = useState(
    () => bootstrap.workspace.activeTabId
  );
  const [dirtySessionTabIds, setDirtySessionTabIds] = useState<Set<string>>(
    () => new Set()
  );
  const [showCloseSessionTabModal, setShowCloseSessionTabModal] = useState(false);
  const [pendingCloseSessionTabId, setPendingCloseSessionTabId] = useState<string | null>(null);
  const [showCloseAllSessionTabsModal, setShowCloseAllSessionTabsModal] = useState(false);
  const [pendingCloseOthersKeepId, setPendingCloseOthersKeepId] = useState<string | null>(null);

  const sessionRestoredRef = useRef(bootstrap.restored);
  const onRestoredRef = useRef(onSessionRestored);
  onRestoredRef.current = onSessionRestored;
  const onPersistIssueRef = useRef(onPersistIssue);
  onPersistIssueRef.current = onPersistIssue;
  const onLoadIssueRef = useRef(onSessionLoadIssue);
  onLoadIssueRef.current = onSessionLoadIssue;
  const lastPersistNoticeRef = useRef<PersistNoticeKind | null>(null);

  const reportPersistResult = useCallback((result: PersistSessionResult) => {
    const next = nextPersistNotice(lastPersistNoticeRef.current, result);
    lastPersistNoticeRef.current = next.kind;
    if (next.notify) onPersistIssueRef.current?.(result);
  }, []);

  const sessionBuffersRef = useRef({ ...buffers, activeSessionTabId });
  sessionBuffersRef.current = { ...buffers, activeSessionTabId };

  const sessionTabsRef = useRef(sessionTabs);
  sessionTabsRef.current = sessionTabs;

  const persistMetaRef = useRef({
    restoreSessionTabs,
    conversionOptions,
    activeProfileIds,
    activeSessionTabId,
    dirtyCount: 0,
  });
  persistMetaRef.current = {
    restoreSessionTabs,
    conversionOptions,
    activeProfileIds,
    activeSessionTabId,
    dirtyCount: dirtySessionTabIds.size,
  };

  const onApplyTabRef = useRef(onApplyTab);
  onApplyTabRef.current = onApplyTab;

  const applySessionTabToEditors = useCallback((tab: SessionTabSnapshot) => {
    onApplyTabRef.current(tab);
  }, []);

  useEffect(() => {
    const issue = bootstrap.loadIssue;
    const restored = sessionRestoredRef.current;
    sessionRestoredRef.current = false;
    if (!issue && !restored) return;
    const n = bootstrap.workspace.tabs.length;
    window.setTimeout(() => {
      if (issue) onLoadIssueRef.current?.(issue);
      if (restored && issue?.kind !== 'corrupted') onRestoredRef.current?.(n);
    }, 400);
  }, [bootstrap.workspace.tabs.length, bootstrap.loadIssue]);

  useEffect(() => {
    if (sourceModified || resultModified) {
      setDirtySessionTabIds((prev) => {
        if (prev.has(activeSessionTabId)) return prev;
        const next = new Set(prev);
        next.add(activeSessionTabId);
        return next;
      });
    }
  }, [sourceModified, resultModified, activeSessionTabId]);

  const commitActiveTabSnapshot = useCallback((tabs: SessionTabSnapshot[]): SessionTabSnapshot[] => {
    const b = sessionBuffersRef.current;
    return tabs.map((tab, i) =>
      tab.id === b.activeSessionTabId
        ? snapshotFromBuffers({
            id: tab.id,
            title: tab.title,
            titleLocked: tab.titleLocked,
            adocInput: b.adocInput,
            mdOutput: b.mdOutput,
            otherOutput: b.otherOutput,
            sourceFormat: b.sourceFormat,
            targetFormat: b.targetFormat,
            currentFileName: b.currentFileName,
            index: i,
          })
        : tab
    );
  }, []);

  const flushSessionWorkspace = useCallback((): PersistSessionResult | null => {
    const meta = persistMetaRef.current;
    if (!meta.restoreSessionTabs) return null;
    const tabs = commitActiveTabSnapshot(sessionTabsRef.current);
    sessionTabsRef.current = tabs;
    const result = persistSessionWorkspace({
      tabs,
      activeTabId: meta.activeSessionTabId,
      conversionOptions: meta.conversionOptions,
      activeProfileIds: meta.activeProfileIds,
    });
    reportPersistResult(result);
    return result;
  }, [commitActiveTabSnapshot, reportPersistResult]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const result = flushSessionWorkspace();
      if (persistMetaRef.current.dirtyCount === 0 && result?.ok !== false) return;
      e.preventDefault();
      e.returnValue = '';
    };
    const onPageHide = () => flushSessionWorkspace();
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [flushSessionWorkspace]);

  const selectSessionTab = useCallback(
    (nextId: string) => {
      if (nextId === activeSessionTabId) return;
      const committed = commitActiveTabSnapshot(sessionTabsRef.current);
      const next = committed.find((t) => t.id === nextId);
      if (!next) return;
      sessionTabsRef.current = committed;
      setSessionTabs(committed);
      setActiveSessionTabId(nextId);
      applySessionTabToEditors(next);
    },
    [activeSessionTabId, applySessionTabToEditors, commitActiveTabSnapshot]
  );

  const addSessionTab = useCallback(() => {
    if (sessionTabsRef.current.length >= MAX_SESSION_TABS) return;
    const committed = commitActiveTabSnapshot(sessionTabsRef.current);
    const tab = createEmptyTab(committed.length);
    const nextTabs = [...committed, tab];
    sessionTabsRef.current = nextTabs;
    setSessionTabs(nextTabs);
    setActiveSessionTabId(tab.id);
    applySessionTabToEditors(tab);
  }, [applySessionTabToEditors, commitActiveTabSnapshot]);

  const closeSessionTab = useCallback(
    (id: string) => {
      if (dirtySessionTabIds.has(id)) {
        setPendingCloseSessionTabId(id);
        setShowCloseSessionTabModal(true);
        return;
      }
      const committed = commitActiveTabSnapshot(sessionTabsRef.current);
      if (committed.length <= 1) {
        const fresh = createEmptyTab(0);
        sessionTabsRef.current = [fresh];
        setSessionTabs([fresh]);
        setActiveSessionTabId(fresh.id);
        applySessionTabToEditors(fresh);
        setDirtySessionTabIds(new Set());
        return;
      }
      const idx = committed.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const nextTabs = committed.filter((t) => t.id !== id);
      const fallback = nextTabs[Math.max(0, idx - 1)] ?? nextTabs[0];
      sessionTabsRef.current = nextTabs;
      setSessionTabs(nextTabs);
      setDirtySessionTabIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      if (id === activeSessionTabId) {
        setActiveSessionTabId(fallback.id);
        applySessionTabToEditors(fallback);
      }
    },
    [activeSessionTabId, applySessionTabToEditors, commitActiveTabSnapshot, dirtySessionTabIds]
  );

  const confirmCloseSessionTab = useCallback(() => {
    const id = pendingCloseSessionTabId;
    if (!id) {
      setShowCloseSessionTabModal(false);
      return;
    }
    setShowCloseSessionTabModal(false);
    setPendingCloseSessionTabId(null);
    setDirtySessionTabIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    const committed = commitActiveTabSnapshot(sessionTabsRef.current);
    if (committed.length <= 1) {
      const fresh = createEmptyTab(0);
      sessionTabsRef.current = [fresh];
      setSessionTabs([fresh]);
      setActiveSessionTabId(fresh.id);
      applySessionTabToEditors(fresh);
      setDirtySessionTabIds(new Set());
      return;
    }
    const idx = committed.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const nextTabs = committed.filter((t) => t.id !== id);
    const fallback = nextTabs[Math.max(0, idx - 1)] ?? nextTabs[0];
    sessionTabsRef.current = nextTabs;
    setSessionTabs(nextTabs);
    if (id === activeSessionTabId) {
      setActiveSessionTabId(fallback.id);
      applySessionTabToEditors(fallback);
    }
  }, [activeSessionTabId, applySessionTabToEditors, commitActiveTabSnapshot, pendingCloseSessionTabId]);

  const closeOtherSessionTabs = useCallback(
    (keepId: string) => {
      const committed = commitActiveTabSnapshot(sessionTabsRef.current);
      const keep = committed.find((t) => t.id === keepId) ?? committed[0];
      if (!keep || committed.length <= 1) return;
      const removedDirty = committed.some((t) => t.id !== keep.id && dirtySessionTabIds.has(t.id));
      if (removedDirty) {
        setPendingCloseOthersKeepId(keep.id);
        setShowCloseAllSessionTabsModal(true);
        return;
      }
      sessionTabsRef.current = [keep];
      setSessionTabs([keep]);
      setDirtySessionTabIds((prev) => (prev.has(keep.id) ? new Set([keep.id]) : new Set()));
      setActiveSessionTabId(keep.id);
      applySessionTabToEditors(keep);
    },
    [applySessionTabToEditors, commitActiveTabSnapshot, dirtySessionTabIds]
  );

  const requestCloseAllSessionTabs = useCallback(() => {
    const committed = commitActiveTabSnapshot(sessionTabsRef.current);
    sessionTabsRef.current = committed;
    setSessionTabs(committed);
    const hasContent =
      committed.length > 1 ||
      dirtySessionTabIds.size > 0 ||
      committed.some(
        (t) =>
          t.adocInput.trim() ||
          t.mdOutput.trim() ||
          t.otherOutput.trim() ||
          t.currentFileName
      );
    if (!hasContent) {
      const fresh = createEmptyTab(0);
      sessionTabsRef.current = [fresh];
      setSessionTabs([fresh]);
      setActiveSessionTabId(fresh.id);
      applySessionTabToEditors(fresh);
      setDirtySessionTabIds(new Set());
      return;
    }
    setPendingCloseOthersKeepId(null);
    setShowCloseAllSessionTabsModal(true);
  }, [applySessionTabToEditors, commitActiveTabSnapshot, dirtySessionTabIds]);

  const confirmCloseAllSessionTabs = useCallback(() => {
    setShowCloseAllSessionTabsModal(false);
    const keepId = pendingCloseOthersKeepId;
    setPendingCloseOthersKeepId(null);

    if (keepId) {
      const committed = commitActiveTabSnapshot(sessionTabsRef.current);
      const keep = committed.find((t) => t.id === keepId) ?? committed[0];
      if (!keep) return;
      sessionTabsRef.current = [keep];
      setSessionTabs([keep]);
      setDirtySessionTabIds((prev) => (prev.has(keep.id) ? new Set([keep.id]) : new Set()));
      setActiveSessionTabId(keep.id);
      applySessionTabToEditors(keep);
      return;
    }

    const fresh = createEmptyTab(0);
    sessionTabsRef.current = [fresh];
    setSessionTabs([fresh]);
    setActiveSessionTabId(fresh.id);
    applySessionTabToEditors(fresh);
    setDirtySessionTabIds(new Set());
  }, [applySessionTabToEditors, commitActiveTabSnapshot, pendingCloseOthersKeepId]);

  const renameSessionTab = useCallback(
    (id: string, title: string) => {
      const nextTitle = title.trim().slice(0, 40);
      if (!nextTitle) return;
      const committed = commitActiveTabSnapshot(sessionTabsRef.current);
      const nextTabs = committed.map((tab) =>
        tab.id === id ? { ...tab, title: nextTitle, titleLocked: true } : tab
      );
      sessionTabsRef.current = nextTabs;
      setSessionTabs(nextTabs);
    },
    [commitActiveTabSnapshot]
  );

  const duplicateSessionTab = useCallback(
    (id: string) => {
      if (sessionTabsRef.current.length >= MAX_SESSION_TABS) return;
      const committed = commitActiveTabSnapshot(sessionTabsRef.current);
      const idx = committed.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const src = committed[idx];
      const copy = createEmptyTab(committed.length);
      const duplicated: SessionTabSnapshot = {
        ...src,
        id: copy.id,
        title: `${src.title}`.slice(0, 34) + ' *',
        titleLocked: true,
      };
      const nextTabs = [
        ...committed.slice(0, idx + 1),
        duplicated,
        ...committed.slice(idx + 1),
      ].slice(0, MAX_SESSION_TABS);
      sessionTabsRef.current = nextTabs;
      setSessionTabs(nextTabs);
      setActiveSessionTabId(duplicated.id);
      applySessionTabToEditors(duplicated);
    },
    [applySessionTabToEditors, commitActiveTabSnapshot]
  );

  const reorderSessionTab = useCallback(
    (fromIndex: number, toIndex: number) => {
      const committed = commitActiveTabSnapshot(sessionTabsRef.current);
      const nextTabs = reorderSessionTabs(committed, fromIndex, toIndex);
      if (nextTabs === committed) return;
      sessionTabsRef.current = nextTabs;
      setSessionTabs(nextTabs);
    },
    [commitActiveTabSnapshot]
  );

  const markTabClean = useCallback((id: string) => {
    setDirtySessionTabIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const markActiveTabClean = useCallback(() => {
    markTabClean(activeSessionTabId);
  }, [activeSessionTabId, markTabClean]);

  const patchSessionTabContent = useCallback(
    (id: string, updater: (tab: SessionTabSnapshot) => SessionTabSnapshot) => {
      const next = sessionTabsRef.current.map((tab) => (tab.id === id ? updater(tab) : tab));
      sessionTabsRef.current = next;
      setSessionTabs(next);
    },
    []
  );

  const resetSessionTabs = useCallback(() => {
    const fresh = createEmptyTab(0);
    sessionTabsRef.current = [fresh];
    setSessionTabs([fresh]);
    setActiveSessionTabId(fresh.id);
    setDirtySessionTabIds(new Set());
    applySessionTabToEditors(fresh);
  }, [applySessionTabToEditors]);

  useEffect(() => {
    if (!restoreSessionTabs) {
      clearSessionDraft();
      return;
    }
    const timer = window.setTimeout(() => {
      const tabs = commitActiveTabSnapshot(sessionTabsRef.current);
      sessionTabsRef.current = tabs;
      setSessionTabs(tabs);
      const result = persistSessionWorkspace({
        tabs,
        activeTabId: activeSessionTabId,
        conversionOptions,
        activeProfileIds,
      });
      reportPersistResult(result);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    buffers.adocInput,
    buffers.mdOutput,
    buffers.otherOutput,
    buffers.sourceFormat,
    buffers.targetFormat,
    buffers.currentFileName,
    conversionOptions,
    activeProfileIds,
    activeSessionTabId,
    commitActiveTabSnapshot,
    restoreSessionTabs,
    reportPersistResult,
  ]);

  return {
    sessionTabs,
    activeSessionTabId,
    dirtySessionTabIds,
    showCloseSessionTabModal,
    setShowCloseSessionTabModal,
    pendingCloseSessionTabId,
    setPendingCloseSessionTabId,
    showCloseAllSessionTabsModal,
    setShowCloseAllSessionTabsModal,
    pendingCloseOthersKeepId,
    setPendingCloseOthersKeepId,
    selectSessionTab,
    addSessionTab,
    closeSessionTab,
    confirmCloseSessionTab,
    closeOtherSessionTabs,
    requestCloseAllSessionTabs,
    confirmCloseAllSessionTabs,
    renameSessionTab,
    duplicateSessionTab,
    reorderSessionTab,
    resetSessionTabs,
    markActiveTabClean,
    markTabClean,
    patchSessionTabContent,
    commitActiveTabSnapshot,
  };
}
