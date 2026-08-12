import { describe, expect, it } from 'vitest';
import {
  clampPanelSplitPercent,
  nearestPanelRatio,
  panelRatioToPercent,
} from './panelSplit';

describe('panelSplit', () => {
  it('maps presets to percents', () => {
    expect(panelRatioToPercent('40-60')).toBe(40);
    expect(panelRatioToPercent('50-50')).toBe(50);
    expect(panelRatioToPercent('60-40')).toBe(60);
  });

  it('clamps percent', () => {
    expect(clampPanelSplitPercent(10)).toBe(25);
    expect(clampPanelSplitPercent(90)).toBe(75);
    expect(clampPanelSplitPercent(53.6)).toBe(54);
  });

  it('snaps to nearest preset', () => {
    expect(nearestPanelRatio(40)).toBe('40-60');
    expect(nearestPanelRatio(50)).toBe('50-50');
    expect(nearestPanelRatio(61)).toBe('60-40');
  });
});
