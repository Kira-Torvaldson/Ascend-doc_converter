/**
 * ============================================================================
 * COMPONENT: NavigationWindow - Fenêtre de navigation flottante
 * ============================================================================
 */

import React from 'react';
import { Heading, NavigationWindowPosition, NavigationWindowSize } from '../types';

interface NavigationWindowProps {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  position: NavigationWindowPosition;
  size: NavigationWindowSize;
  headings: Heading[];
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onNavigate: (lineIndex: number) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  windowRef: React.RefObject<HTMLDivElement>;
  dragOffset?: { x: number; y: number };
}

export const NavigationWindow: React.FC<NavigationWindowProps> = ({
  isOpen,
  isMinimized,
  isMaximized,
  position,
  size,
  headings,
  onMinimize,
  onMaximize,
  onClose,
  onNavigate,
  onDragStart,
  onResizeStart,
  windowRef,
  dragOffset = { x: 0, y: 0 }
}) => {
  if (!isOpen) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x + dragOffset.x}px`,
    top: `${position.y + dragOffset.y}px`,
    width: isMaximized ? '100%' : `${size.width}px`,
    height: isMinimized ? '60px' : (isMaximized ? '100%' : `${size.height}px`),
    zIndex: 1000
  };

  return (
    <div
      ref={windowRef}
      className="navigation-window"
      style={style}
    >
      <div className="navigation-window-header" onMouseDown={onDragStart}>
        <span className="navigation-window-title">Navigation</span>
        <div className="navigation-window-controls">
          <button onClick={onMinimize} className="window-control-button">
            {isMinimized ? '□' : '_'}
          </button>
          <button onClick={onMaximize} className="window-control-button">
            {isMaximized ? '❐' : '□'}
          </button>
          <button onClick={onClose} className="window-control-button close">
            ×
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div className="navigation-window-content">
          {headings.length === 0 ? (
            <div className="navigation-empty">
              Aucune section disponible
            </div>
          ) : (
            <ul className="navigation-list">
              {headings.map((heading, index) => (
                <li
                  key={index}
                  className={`navigation-item level-${heading.level}`}
                  onClick={() => onNavigate(heading.lineIndex)}
                >
                  {heading.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!isMinimized && !isMaximized && (
        <div
          className="navigation-window-resize-handle"
          onMouseDown={onResizeStart}
        />
      )}
    </div>
  );
};
