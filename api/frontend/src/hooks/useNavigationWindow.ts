/**
 * ============================================================================
 * HOOK: useNavigationWindow - Gestion de la fenêtre de navigation
 * ============================================================================
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { NavigationWindowPosition, NavigationWindowSize, DragStart, ResizeStart } from '../types';
import { NAVIGATION_WINDOW_DEFAULTS } from '../constants';

interface UseNavigationWindowReturn {
  navigationWindowOpen: boolean;
  setNavigationWindowOpen: (open: boolean) => void;
  navigationWindowMinimized: boolean;
  setNavigationWindowMinimized: (minimized: boolean) => void;
  navigationWindowMaximized: boolean;
  setNavigationWindowMaximized: (maximized: boolean) => void;
  navigationWindowPosition: NavigationWindowPosition;
  setNavigationWindowPosition: (pos: NavigationWindowPosition) => void;
  navigationWindowSize: NavigationWindowSize;
  setNavigationWindowSize: (size: NavigationWindowSize) => void;
  isDragging: boolean;
  isResizing: boolean;
  navigationWindowRef: React.RefObject<HTMLDivElement>;
  handleDragStart: (e: React.MouseEvent) => void;
  handleResizeStart: (e: React.MouseEvent) => void;
}

/**
 * Hook personnalisé pour gérer la fenêtre de navigation flottante
 */
export function useNavigationWindow(): UseNavigationWindowReturn {
  const [navigationWindowOpen, setNavigationWindowOpen] = useState<boolean>(false);
  const [navigationWindowMinimized, setNavigationWindowMinimized] = useState<boolean>(false);
  const [navigationWindowMaximized, setNavigationWindowMaximized] = useState<boolean>(false);
  const [navigationWindowPosition, setNavigationWindowPosition] = useState<NavigationWindowPosition>({ x: 0, y: 0 });
  const [navigationWindowSize, setNavigationWindowSize] = useState<NavigationWindowSize>({
    width: NAVIGATION_WINDOW_DEFAULTS.width,
    height: NAVIGATION_WINDOW_DEFAULTS.height
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<DragStart>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<ResizeStart>({ x: 0, y: 0, width: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const navigationWindowRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (navigationWindowMaximized || !navigationWindowRef.current) return;
    const rect = navigationWindowRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDragOffset({ x: 0, y: 0 });
  }, [navigationWindowMaximized]);

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || navigationWindowMaximized) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const offsetX = newX - navigationWindowPosition.x;
    const offsetY = newY - navigationWindowPosition.y;
    
    const maxX = window.innerWidth - navigationWindowSize.width;
    const maxY = window.innerHeight - (navigationWindowMinimized ? 60 : navigationWindowSize.height);
    
    const clampedOffsetX = Math.max(-navigationWindowPosition.x, Math.min(offsetX, maxX - navigationWindowPosition.x));
    const clampedOffsetY = Math.max(-navigationWindowPosition.y, Math.min(offsetY, maxY - navigationWindowPosition.y));
    
    setDragOffset({
      x: clampedOffsetX,
      y: clampedOffsetY
    });
  }, [isDragging, dragStart, navigationWindowMaximized, navigationWindowMinimized, navigationWindowSize, navigationWindowPosition]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      const maxX = window.innerWidth - navigationWindowSize.width;
      const maxY = window.innerHeight - (navigationWindowMinimized ? 60 : navigationWindowSize.height);
      
      setNavigationWindowPosition({
        x: Math.max(0, Math.min(navigationWindowPosition.x + dragOffset.x, maxX)),
        y: Math.max(0, Math.min(navigationWindowPosition.y + dragOffset.y, maxY))
      });
      setDragOffset({ x: 0, y: 0 });
    }
    setIsDragging(false);
  }, [isDragging, dragOffset, navigationWindowPosition, navigationWindowSize, navigationWindowMinimized]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (navigationWindowMaximized || navigationWindowMinimized) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: navigationWindowSize.width,
      height: navigationWindowSize.height
    });
  }, [navigationWindowMaximized, navigationWindowMinimized, navigationWindowSize]);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || navigationWindowMaximized || navigationWindowMinimized) return;
    
    requestAnimationFrame(() => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const maxWidth = window.innerWidth - navigationWindowPosition.x;
      const maxHeight = window.innerHeight - navigationWindowPosition.y;
      
      setNavigationWindowSize({
        width: Math.max(NAVIGATION_WINDOW_DEFAULTS.minWidth, Math.min(resizeStart.width + deltaX, maxWidth)),
        height: Math.max(NAVIGATION_WINDOW_DEFAULTS.minHeight, Math.min(resizeStart.height + deltaY, maxHeight))
      });
    });
  }, [isResizing, resizeStart, navigationWindowMaximized, navigationWindowMinimized, navigationWindowPosition]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  return {
    navigationWindowOpen,
    setNavigationWindowOpen,
    navigationWindowMinimized,
    setNavigationWindowMinimized,
    navigationWindowMaximized,
    setNavigationWindowMaximized,
    navigationWindowPosition,
    setNavigationWindowPosition,
    navigationWindowSize,
    setNavigationWindowSize,
    isDragging,
    isResizing,
    navigationWindowRef,
    handleDragStart,
    handleResizeStart
  };
}
