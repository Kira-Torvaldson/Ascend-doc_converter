/**
 * Shared geometry for Ascend floating windows (drag / resize / min / max).
 * Escape, dirty confirm, and taskbar stay in the host component.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';

export type FloatingPoint = { x: number; y: number };
export type FloatingSize = { width: number; height: number };

export type UseFloatingWindowOptions = {
  defaultSize: FloatingSize;
  minSize?: FloatingSize;
  /** Absolute caps (e.g. Settings 900×85vh). Viewport clamp always applies. */
  maxSize?: FloatingSize;
  persistKey?: string;
  minimizedHeight?: number;
  initialPosition?: FloatingPoint | 'center';
};

export type UseFloatingWindowReturn = {
  panelRef: RefObject<HTMLDivElement>;
  position: FloatingPoint;
  size: FloatingSize;
  setPosition: (p: FloatingPoint) => void;
  setSize: (s: FloatingSize) => void;
  maximized: boolean;
  setMaximized: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMaximized: () => void;
  minimized: boolean;
  setMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  isDragging: boolean;
  isResizing: boolean;
  dragOffset: FloatingPoint;
  handleDragStart: (e: ReactMouseEvent) => void;
  handleResizeStart: (e: ReactMouseEvent) => void;
  center: () => void;
  panelStyle: CSSProperties;
};

type StoredGeometry = { position: FloatingPoint; size: FloatingSize };

function loadGeometry(key: string | undefined): StoredGeometry | null {
  if (!key || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.position?.x === 'number' &&
      typeof parsed?.position?.y === 'number' &&
      typeof parsed?.size?.width === 'number' &&
      typeof parsed?.size?.height === 'number'
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveGeometry(key: string | undefined, position: FloatingPoint, size: FloatingSize) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify({ position, size }));
  } catch {
    /* ignore */
  }
}

function centerFor(size: FloatingSize): FloatingPoint {
  if (typeof window === 'undefined') return { x: 80, y: 80 };
  return {
    x: Math.max(0, (window.innerWidth - size.width) / 2),
    y: Math.max(0, (window.innerHeight - size.height) / 2),
  };
}

function resolveInitialPosition(
  initial: FloatingPoint | 'center' | undefined,
  size: FloatingSize,
  saved: FloatingPoint | undefined
): FloatingPoint {
  if (saved) return saved;
  if (initial && initial !== 'center') return initial;
  return centerFor(size);
}

export function useFloatingWindow(options: UseFloatingWindowOptions): UseFloatingWindowReturn {
  const {
    defaultSize,
    minSize = { width: 280, height: 160 },
    maxSize,
    persistKey,
    minimizedHeight = 60,
    initialPosition = 'center',
  } = options;

  const panelRef = useRef<HTMLDivElement>(null!);
  const saved = useMemo(() => loadGeometry(persistKey), [persistKey]);

  const [size, setSize] = useState<FloatingSize>(() => saved?.size ?? defaultSize);
  const [position, setPosition] = useState<FloatingPoint>(() =>
    resolveInitialPosition(initialPosition, saved?.size ?? defaultSize, saved?.position)
  );
  const [maximized, setMaximized] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<FloatingPoint>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<FloatingPoint>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: defaultSize.width,
    height: defaultSize.height,
  });

  const persist = useCallback(
    (nextPos: FloatingPoint, nextSize: FloatingSize) => {
      saveGeometry(persistKey, nextPos, nextSize);
    },
    [persistKey]
  );

  const center = useCallback(() => {
    setPosition(centerFor(size));
  }, [size]);

  const toggleMaximized = useCallback(() => {
    setMaximized((v) => !v);
  }, []);

  const handleDragStart = useCallback(
    (e: ReactMouseEvent) => {
      if (maximized || !panelRef.current) return;
      const target = e.target as HTMLElement;
      if (target.closest('button, input, select, textarea, a')) return;
      e.preventDefault();
      const rect = panelRef.current.getBoundingClientRect();
      setIsDragging(true);
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setDragOffset({ x: 0, y: 0 });
    },
    [maximized]
  );

  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || maximized) return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const offsetX = newX - position.x;
      const offsetY = newY - position.y;
      const w = size.width;
      const h = minimized ? minimizedHeight : size.height;
      const maxX = window.innerWidth - w;
      const maxY = window.innerHeight - h;
      setDragOffset({
        x: Math.max(-position.x, Math.min(offsetX, maxX - position.x)),
        y: Math.max(-position.y, Math.min(offsetY, maxY - position.y)),
      });
    },
    [isDragging, maximized, minimized, minimizedHeight, dragStart, position, size]
  );

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      const w = size.width;
      const h = minimized ? minimizedHeight : size.height;
      const maxX = window.innerWidth - w;
      const maxY = window.innerHeight - h;
      const next = {
        x: Math.max(0, Math.min(position.x + dragOffset.x, maxX)),
        y: Math.max(0, Math.min(position.y + dragOffset.y, maxY)),
      };
      setPosition(next);
      setDragOffset({ x: 0, y: 0 });
      persist(next, size);
    }
    setIsDragging(false);
  }, [isDragging, dragOffset, position, size, minimized, minimizedHeight, persist]);

  const handleResizeStart = useCallback(
    (e: ReactMouseEvent) => {
      if (maximized || minimized) return;
      e.stopPropagation();
      setIsResizing(true);
      setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height });
    },
    [maximized, minimized, size]
  );

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || maximized || minimized) return;
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const viewportMaxW = window.innerWidth - position.x;
      const viewportMaxH = window.innerHeight - position.y;
      const capW = maxSize ? Math.min(maxSize.width, viewportMaxW) : viewportMaxW;
      const capH = maxSize ? Math.min(maxSize.height, viewportMaxH) : viewportMaxH;
      setSize({
        width: Math.max(minSize.width, Math.min(resizeStart.width + deltaX, capW)),
        height: Math.max(minSize.height, Math.min(resizeStart.height + deltaY, capH)),
      });
    },
    [isResizing, maximized, minimized, resizeStart, position, minSize, maxSize]
  );

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setSize((current) => {
        persist(position, current);
        return current;
      });
    }
    setIsResizing(false);
  }, [isResizing, position, persist]);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  useEffect(() => {
    if (!isResizing) return;
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', handleResizeEnd);
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResize, handleResizeEnd]);

  const panelStyle: CSSProperties = useMemo(
    () => ({
      position: 'fixed',
      left: maximized ? '50%' : `${position.x}px`,
      top: maximized ? '50%' : `${position.y}px`,
      width: maximized ? '95vw' : `${size.width}px`,
      height: maximized ? '95vh' : minimized ? 'auto' : `${size.height}px`,
      maxWidth: maximized ? '95vw' : '90vw',
      maxHeight: maximized ? '95vh' : '90vh',
      transform: maximized
        ? 'translate(-50%, -50%)'
        : isDragging
          ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`
          : 'translate3d(0, 0, 0)',
    }),
    [maximized, minimized, position, size, isDragging, dragOffset]
  );

  return {
    panelRef,
    position,
    size,
    setPosition,
    setSize,
    maximized,
    setMaximized,
    toggleMaximized,
    minimized,
    setMinimized,
    isDragging,
    isResizing,
    dragOffset,
    handleDragStart,
    handleResizeStart,
    center,
    panelStyle,
  };
}
