/**
 * Taskbar des fenêtres minimisées — tuiles avec aperçu miniature.
 */

import React from 'react';
import { useT } from '../i18n/LocaleContext';

export type TaskbarWindowKind = 'navigation' | 'history' | 'settings' | 'diff' | 'preview';

export interface TaskbarWindowItem {
  id: TaskbarWindowKind;
  onRestore: () => void;
}

interface AppTaskbarProps {
  items: TaskbarWindowItem[];
}

function PreviewThumb({ kind }: { kind: TaskbarWindowKind }) {
  return (
    <span className={`taskbar-thumb taskbar-thumb--${kind}`} aria-hidden="true">
      <span className="taskbar-thumb-chrome">
        <span className="taskbar-thumb-dot" />
        <span className="taskbar-thumb-dot" />
        <span className="taskbar-thumb-dot" />
      </span>
      <span className="taskbar-thumb-body">
        {kind === 'navigation' && (
          <>
            <span className="taskbar-thumb-line is-wide" />
            <span className="taskbar-thumb-line is-indent" />
            <span className="taskbar-thumb-line is-indent" />
            <span className="taskbar-thumb-line is-wide" />
            <span className="taskbar-thumb-line is-indent" />
          </>
        )}
        {kind === 'history' && (
          <>
            <span className="taskbar-thumb-row" />
            <span className="taskbar-thumb-row" />
            <span className="taskbar-thumb-row is-muted" />
          </>
        )}
        {kind === 'settings' && (
          <>
            <span className="taskbar-thumb-split">
              <span className="taskbar-thumb-rail" />
              <span className="taskbar-thumb-pane">
                <span className="taskbar-thumb-line is-wide" />
                <span className="taskbar-thumb-line" />
                <span className="taskbar-thumb-chip" />
              </span>
            </span>
          </>
        )}
        {kind === 'diff' && (
          <>
            <span className="taskbar-thumb-diff">
              <span className="taskbar-thumb-diff-col">
                <span className="taskbar-thumb-line is-wide" />
                <span className="taskbar-thumb-line" />
              </span>
              <span className="taskbar-thumb-diff-col is-changed">
                <span className="taskbar-thumb-line is-wide" />
                <span className="taskbar-thumb-line is-add" />
              </span>
            </span>
          </>
        )}
        {kind === 'preview' && (
          <>
            <span className="taskbar-thumb-line is-wide" />
            <span className="taskbar-thumb-line" />
            <span className="taskbar-thumb-line is-wide" />
            <span className="taskbar-thumb-chip" />
          </>
        )}
      </span>
    </span>
  );
}

export const AppTaskbar: React.FC<AppTaskbarProps> = ({ items }) => {
  const t = useT();
  if (items.length === 0) return null;

  const labelFor = (id: TaskbarWindowKind) => {
    if (id === 'navigation') return t('taskbar.navigation');
    if (id === 'history') return t('taskbar.history');
    if (id === 'settings') return t('taskbar.settings');
    if (id === 'preview') return t('taskbar.preview');
    return t('taskbar.diff');
  };

  const tipFor = (id: TaskbarWindowKind) => {
    if (id === 'history') return t('history.restoreTip');
    return t('taskbar.restore', { name: labelFor(id) });
  };

  return (
    <div className="taskbar" role="toolbar" aria-label={t('taskbar.aria')}>
      <span className="taskbar-caption">{t('taskbar.minimized')}</span>
      <div className="taskbar-items">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`taskbar-item taskbar-item--${item.id}`}
            onClick={item.onRestore}
            data-tooltip={tipFor(item.id)}
            aria-label={tipFor(item.id)}
          >
            <PreviewThumb kind={item.id} />
            <span className="taskbar-item-meta">
              <span className="taskbar-label">{labelFor(item.id)}</span>
              <span className="taskbar-hint">{t('taskbar.clickRestore')}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
