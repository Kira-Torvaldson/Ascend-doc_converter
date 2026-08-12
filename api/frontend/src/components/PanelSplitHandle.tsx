/**
 * Poignée de redimensionnement entre panneaux source et résultat.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { useT } from '../i18n/LocaleContext';
import type { PanelOrientation } from '../settings/userSettings';
import {
  clampPanelSplitPercent,
  PANEL_SPLIT_MAX,
  PANEL_SPLIT_MIN,
} from '../utils/panelSplit';

interface PanelSplitHandleProps {
  percent: number;
  onPercentChange: (percent: number) => void;
  onPercentCommit: (percent: number) => void;
  orientation?: PanelOrientation;
  children?: React.ReactNode;
}

export const PanelSplitHandle: React.FC<PanelSplitHandleProps> = ({
  percent,
  onPercentChange,
  onPercentCommit,
  orientation = 'side',
  children,
}) => {
  const t = useT();
  const stacked = orientation === 'stacked';
  const draggingRef = useRef(false);
  const latestPercentRef = useRef(percent);
  const columnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    latestPercentRef.current = percent;
  }, [percent]);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const grid = columnRef.current?.closest('.grid');
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      if (stacked) {
        if (rect.height <= 0) return;
        const next = clampPanelSplitPercent(((clientY - rect.top) / rect.height) * 100);
        latestPercentRef.current = next;
        onPercentChange(next);
        return;
      }
      if (rect.width <= 0) return;
      const next = clampPanelSplitPercent(((clientX - rect.left) / rect.width) * 100);
      latestPercentRef.current = next;
      onPercentChange(next);
    },
    [onPercentChange, stacked]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      updateFromPointer(e.clientX, e.clientY);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.classList.remove('is-panel-splitting', 'is-panel-splitting-row');
      onPercentCommit(latestPercentRef.current);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [onPercentCommit, updateFromPointer]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // Ne pas démarrer un drag depuis le bouton swap
    if ((e.target as HTMLElement).closest('.swap-button')) return;
    e.preventDefault();
    draggingRef.current = true;
    document.body.classList.add('is-panel-splitting');
    if (stacked) document.body.classList.add('is-panel-splitting-row');
    updateFromPointer(e.clientX, e.clientY);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const shrinkKey = stacked ? 'ArrowUp' : 'ArrowLeft';
    const growKey = stacked ? 'ArrowDown' : 'ArrowRight';
    if (e.key !== shrinkKey && e.key !== growKey) return;
    e.preventDefault();
    const delta = e.key === shrinkKey ? -2 : 2;
    const next = clampPanelSplitPercent(percent + delta);
    onPercentChange(next);
    onPercentCommit(next);
  };

  return (
    <div
      ref={columnRef}
      className={`swap-column panel-split-handle${stacked ? ' panel-split-handle--stacked' : ''}`}
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation={stacked ? 'horizontal' : 'vertical'}
      aria-valuemin={PANEL_SPLIT_MIN}
      aria-valuemax={PANEL_SPLIT_MAX}
      aria-valuenow={percent}
      aria-label={t('iface.panelSplit.aria')}
      tabIndex={0}
      onKeyDown={onKeyDown}
      data-tooltip={t('iface.panelSplit.tooltip')}
    >
      <div className="panel-split-grip" aria-hidden="true" />
      {children}
    </div>
  );
};
