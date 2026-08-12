/**
 * Barre d’onglets de session — UI épurée + menu contextuel.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/LocaleContext';
import type { SessionTabSnapshot } from '../utils/sessionDraft';
import { MAX_SESSION_TABS } from '../utils/sessionDraft';

interface SessionTabsBarProps {
  tabs: SessionTabSnapshot[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  dirtyTabIds?: Set<string> | string[];
}

type ContextMenuState = { tabId: string; x: number; y: number };

export const SessionTabsBar: React.FC<SessionTabsBarProps> = ({
  tabs,
  activeTabId,
  onSelect,
  onAdd,
  onClose,
  onRename,
  onDuplicate,
  onReorder,
  dirtyTabIds,
}) => {
  const t = useT();
  const dirty = dirtyTabIds instanceof Set ? dirtyTabIds : new Set(dirtyTabIds ?? []);
  const canAdd = tabs.length < MAX_SESSION_TABS;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editingId) return;
    const id = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [editingId]);

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
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
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

  const menuTab = menu ? tabs.find((tab) => tab.id === menu.tabId) : null;

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
              className={`session-tab${active ? ' is-active' : ''}${isDirty ? ' is-dirty' : ''}${dragIndex === index ? ' is-dragging' : ''}`}
              role="presentation"
              draggable={!editing}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ tabId: tab.id, x: e.clientX, y: e.clientY });
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
                  className="session-tab-main"
                  onClick={() => onSelect(tab.id)}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    startRename(tab);
                  }}
                  title={tab.title}
                  data-tooltip={`${tab.title} — ${t('sessionTabs.menuHint')}`}
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
        </div>
      ) : null}
    </div>
  );
};
