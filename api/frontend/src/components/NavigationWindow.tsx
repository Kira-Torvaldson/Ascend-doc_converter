/**
 * Fenêtre flottante de navigation par titres.
 */

import React from 'react';
import {
  buildHeadingHierarchy,
  type FlatHeading,
  type HeadingTreeNode,
} from '../utils/headingHierarchy';

interface NavigationWindowProps {
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  headings: FlatHeading[];
  panelRef: React.RefObject<HTMLDivElement | null>;
  panelStyle: React.CSSProperties;
  isDragging: boolean;
  isResizing: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  onNavigate: (lineIndex: number) => void;
}

function renderHeading(
  item: HeadingTreeNode,
  onNavigate: (lineIndex: number) => void,
  depth = 0
): React.ReactNode {
  const { heading, children } = item;
  return (
    <li
      key={`${heading.lineIndex}-${heading.title}`}
      className={`file-nav-item file-nav-level-${heading.level}`}
      style={{ marginLeft: depth > 0 ? undefined : undefined }}
    >
      <button
        type="button"
        className="file-nav-link"
        onClick={() => onNavigate(heading.lineIndex)}
      >
        <span className="file-nav-title">{heading.title}</span>
        <span className="file-nav-line">L{heading.lineIndex + 1}</span>
      </button>
      {children.length > 0 && (
        <ul className="file-nav-children">
          {children.map((child) => renderHeading(child, onNavigate, depth + 1))}
        </ul>
      )}
    </li>
  );
}

export const NavigationWindow: React.FC<NavigationWindowProps> = ({
  open,
  minimized,
  maximized,
  headings,
  panelRef,
  panelStyle,
  isDragging,
  isResizing,
  onDragStart,
  onResizeStart,
  onMinimize,
  onToggleMaximize,
  onClose,
  onNavigate,
}) => {
  if (!open || minimized || headings.length === 0) return null;

  const hierarchy = buildHeadingHierarchy(headings);

  return (
    <div
      ref={panelRef as React.RefObject<HTMLDivElement>}
      className={`floating-window navigation-window ${maximized ? 'maximized' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{ ...panelStyle, zIndex: 10000 }}
    >
      <div
        className="floating-window-header floating-window-header--draggable navigation-window-header"
        onMouseDown={onDragStart}
      >
        <div className="floating-window-title-wrap navigation-window-title">
          <span className="floating-window-title">Navigation</span>
          <span className="floating-window-count navigation-window-count">
            {headings.length} {headings.length > 1 ? 'sections' : 'section'}
          </span>
        </div>
        <div className="floating-window-controls navigation-window-controls">
          <button
            type="button"
            className="floating-window-btn floating-window-btn--minimize navigation-window-btn minimize-btn"
            onClick={onMinimize}
            aria-label="Réduire"
          >
            −
          </button>
          <button
            type="button"
            className="floating-window-btn floating-window-btn--maximize navigation-window-btn maximize-btn"
            onClick={onToggleMaximize}
            aria-label={maximized ? 'Restaurer' : 'Plein écran'}
          >
            {maximized ? '⧉' : '□'}
          </button>
          <button
            type="button"
            className="floating-window-btn floating-window-btn--close navigation-window-btn close-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      </div>

      <div className="navigation-window-content">
        <div className="file-navigation-container">
          <ul className="file-navigation-list">
            {hierarchy.map((item) => renderHeading(item, onNavigate))}
          </ul>
        </div>
      </div>

      {!maximized && (
        <div
          className="floating-window-resize-handle navigation-window-resize-handle"
          onMouseDown={onResizeStart}
        />
      )}
    </div>
  );
};
