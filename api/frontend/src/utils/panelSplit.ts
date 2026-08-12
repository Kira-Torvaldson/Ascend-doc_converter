/**
 * Ratio source/résultat : presets + pourcentage libre (splitter).
 */

import type { PanelRatio } from '../settings/userSettings';

export const PANEL_SPLIT_MIN = 25;
export const PANEL_SPLIT_MAX = 75;

export function panelRatioToPercent(ratio: PanelRatio): number {
  if (ratio === '40-60') return 40;
  if (ratio === '60-40') return 60;
  return 50;
}

export function nearestPanelRatio(percent: number): PanelRatio {
  if (percent <= 45) return '40-60';
  if (percent >= 55) return '60-40';
  return '50-50';
}

export function clampPanelSplitPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(PANEL_SPLIT_MAX, Math.max(PANEL_SPLIT_MIN, Math.round(value)));
}
