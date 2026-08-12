import { describe, expect, it } from 'vitest';
import {
  getWorkspacePreset,
  matchWorkspacePreset,
  WORKSPACE_PRESETS,
} from './workspacePresets';

describe('workspacePresets', () => {
  it('exposes five presets', () => {
    expect(WORKSPACE_PRESETS).toHaveLength(5);
    expect(getWorkspacePreset('balanced')?.panelSplitPercent).toBe(50);
    expect(getWorkspacePreset('zen')?.focusMode).toBe(true);
  });

  it('matches stacked by orientation', () => {
    expect(
      matchWorkspacePreset({
        panelSplitPercent: 50,
        panelOrientation: 'stacked',
        focusMode: false,
      })
    ).toBe('stacked');
  });

  it('matches source focus near 65%', () => {
    expect(
      matchWorkspacePreset({
        panelSplitPercent: 65,
        panelOrientation: 'side',
        focusMode: false,
      })
    ).toBe('sourceFocus');
  });
});
