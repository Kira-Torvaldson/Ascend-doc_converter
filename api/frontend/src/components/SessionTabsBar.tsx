/**
 * Barre d’onglets de session — UI épurée + menu contextuel.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import type { SessionTabSnapshot } from '../utils/sessionDraft';
import { MAX_SESSION_TABS } from '../utils/sessionDraft';

interface SessionTabsBarProps {
  tabs: SessionTabSnapshot[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onCloseOthers?: (keepId: string) => void;
  onCloseAll?: () => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  dirtyTabIds?: Set<string> | string[];
}

type ContextMenuState = { tabId: string; x: number; y: number };

function tabHasContent(tab: SessionTabSnapshot): boolean {
  return Boolean(
    tab.currentFileName ||
      tab.adocInput.trim() ||
      tab.mdOutput.trim() ||
      tab.otherOutput.trim()
  );
}

function clampMenuPosition(x: number, y: number, width: number, height: number) {
  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - width - pad);
  const maxY = Math.max(pad, window.innerHeight - height - pad);
  return {
    x: Math.min(Math.max(pad, x), maxX),
    y: Math.min(Math.max(pad, y), maxY),
  };
}

export const SessionTabsBar: React.FC<SessionTabsBarProps> = ({
  tabs,
  activeTabId,
  onSelect,
  onAdd,
  onClose,
  onCloseOthers,
  onCloseAll,
  onRename,
  onDuplicate,
  onReorder,
  dirtyTabIds,
}) => {
  const t = useT();
  const dirty = dirtyTabIds instanceof Set ? dirtyTabIds : new Set(dirtyTabIds ?? []);
  const canAdd = tabs.length < MAX_SESSION_TABS;
  const canCloseOthers = tabs.length > 1;
  const canCloseAll =
    tabs.length > 1 ||
    tabs.some((tab) => dirty.has(tab.id) || tabHasContent(tab));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editingId) return;
    const id = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [editingId]);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }, [activeTabId, tabs.length]);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const next = clampMenuPosition(menu.x, menu.y, rect.width, rect.height);
    if (next.x !== menu.x || next.y !== menu.y) {
      setMenu({ ...menu, ...next });
    }
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    const id = window.requestAnimationFrame(() => {
      const first = menuRef.current?.querySelector<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)'
      );
      first?.focus();
    });
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      window.cancelAnimationFrame(id);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const commitRename = () => {
    if (!editingId) return;
    const next = draftTitle.trim().slice(0, 40);
    if (next) onRename(editingId, next);
    setEditingId(null);
  };

  const startRename = (tab: SessionTabSnapshot) => {
    setEditingId(tab.id);
    setDraftTitle(tab.title);
    setMenu(null);
  };

  const openContextMenu = (tabId: string, clientX: number, clientY: number) => {
    setMenu({ tabId, x: clientX, y: clientY });
  };

  const menuTab = menu ? tabs.find((tab) => tab.id === menu.tabId) : null;
  const tabTipBase = t('sessionTabs.menuHint');
  const tabButtonRefs = useRef(new Map<string, HTMLButtonElement>());

  const focusAndSelectTab = (id: string) => {
    onSelect(id);
    window.requestAnimationFrame(() => {
      tabButtonRefs.current.get(id)?.focus();
    });
  };

  const onTabListKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (editingId) return;
    const last = tabs.length - 1;
    if (last < 0) return;
    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = index === last ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = index === 0 ? last : index - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = last;
    } else {
      return;
    }
    event.preventDefault();
    focusAndSelectTab(tabs[nextIndex].id);
  };

  return (
    <div className="session-tabs" role="tablist" aria-label={t('sessionTabs.aria')}>
      <div className="session-tabs-scroll">
        {tabs.map((tab, index) => {
          const active = tab.id === activeTabId;
          const isDirty = dirty.has(tab.id);
          const editing = editingId === tab.id;
          return (
            <div
              key={tab.id}
              ref={active ? activeTabRef : undefined}
              className={`session-tab${active ? ' is-active' : ''}${isDirty ? ' is-dirty' : ''}${dragIndex === index ? ' is-dragging' : ''}`}
              role="presentation"
              draggable={!editing}
              onContextMenu={(e) => {
                e.preventDefault();
                openContextMenu(tab.id, e.clientX, e.clientY);
              }}
              onMouseDown={(e) => {
                // Empêche le scroll auto ; la fermeture est sur auxclick uniquement.
                if (e.button === 1) e.preventDefault();
              }}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  if (!editing) onClose(tab.id);
                }
              }}
              onDragStart={(e) => {
                setDragIndex(index);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(index));
              }}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = Number.parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (Number.isFinite(from)) onReorder(from, index);
                setDragIndex(null);
              }}
            >
              {editing ? (
                <input
                  ref={renameInputRef}
                  className="session-tab-rename"
                  value={draftTitle}
                  maxLength={40}
                  aria-label={t('sessionTabs.rename')}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitRename();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  className="session-tab-main"
                  ref={(node) => {
                    if (node) tabButtonRefs.current.set(tab.id, node);
                    else tabButtonRefs.current.delete(tab.id);
                  }}
                  onKeyDown={(e) => onTabListKeyDown(e, index)}
                  onClick={() => onSelect(tab.id)}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    startRename(tab);
                  }}
                  title={tab.title}
                  data-tooltip={`${tab.title} — ${tabTipBase}`}
                >
                  <span className="session-tab-label">{tab.title}</span>
                  {isDirty ? <span className="session-tab-dot" aria-hidden="true" /> : null}
                </button>
              )}
              <button
                type="button"
                className="session-tab-close"
                aria-label={t('sessionTabs.close', { title: tab.title })}
                data-tooltip={t('sessionTabs.close', { title: tab.title })}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="session-tabs-actions">
        <button
          type="button"
          className="session-tab-add"
          onClick={onAdd}
          disabled={!canAdd}
          aria-label={t('sessionTabs.add')}
          data-tooltip={
            canAdd ? t('sessionTabs.add') : t('sessionTabs.max', { max: MAX_SESSION_TABS })
          }
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      {menu && menuTab ? (
        <div
          ref={menuRef}
          className="session-tab-context-menu"
          role="menu"
          style={{ left: menu.x, top: menu.y }}
        >
          <button
            type="button"
            role="menuitem"
            className="session-tab-context-item"
            onClick={() => {
              onSelect(menuTab.id);
              startRename(menuTab);
            }}
          >
            {t('sessionTabs.rename')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="session-tab-context-item"
            disabled={!canAdd}
            data-tooltip={!canAdd ? t('sessionTabs.max', { max: MAX_SESSION_TABS }) : undefined}
            onClick={() => {
              onDuplicate(menuTab.id);
              setMenu(null);
            }}
          >
            {t('sessionTabs.duplicate')}
          </button>
          <div className="session-tab-context-sep" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="session-tab-context-item session-tab-context-item--danger"
            onClick={() => {
              onClose(menuTab.id);
              setMenu(null);
            }}
          >
            {t('sessionTabs.close', { title: menuTab.title })}
          </button>
          {onCloseOthers ? (
            <button
              type="button"
              role="menuitem"
              className="session-tab-context-item session-tab-context-item--danger"
              disabled={!canCloseOthers}
              onClick={() => {
                onCloseOthers(menuTab.id);
                setMenu(null);
              }}
            >
              {t('sessionTabs.closeOthers')}
            </button>
          ) : null}
          {onCloseAll ? (
            <button
              type="button"
              role="menuitem"
              className="session-tab-context-item session-tab-context-item--danger"
              disabled={!canCloseAll}
              onClick={() => {
                onCloseAll();
                setMenu(null);
              }}
            >
              {t('sessionTabs.closeAll')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
