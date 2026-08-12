/**
 * Présets de workspace (split / orientation / focus).
 */

import type { PanelOrientation, PanelRatio } from '../settings/userSettings';

export type WorkspacePresetId =
  | 'balanced'
  | 'sourceFocus'
  | 'resultFocus'
  | 'stacked'
  | 'zen';

export type WorkspacePreset = {
  id: WorkspacePresetId;
  panelSplitPercent: number;
  panelRatio: PanelRatio;
  panelOrientation: PanelOrientation;
  focusMode: boolean;
};

export const WORKSPACE_PRESETS: readonly WorkspacePreset[] = [
  {
    id: 'balanced',
    panelSplitPercent: 50,
    panelRatio: '50-50',
    panelOrientation: 'side',
    focusMode: false,
  },
  {
    id: 'sourceFocus',
    panelSplitPercent: 65,
    panelRatio: '60-40',
    panelOrientation: 'side',
    focusMode: false,
  },
  {
    id: 'resultFocus',
    panelSplitPercent: 35,
    panelRatio: '40-60',
    panelOrientation: 'side',
    focusMode: false,
  },
  {
    id: 'stacked',
    panelSplitPercent: 50,
    panelRatio: '50-50',
    panelOrientation: 'stacked',
    focusMode: false,
  },
  {
    id: 'zen',
    panelSplitPercent: 50,
    panelRatio: '50-50',
    panelOrientation: 'side',
    focusMode: true,
  },
] as const;

export function getWorkspacePreset(id: WorkspacePresetId): WorkspacePreset | undefined {
  return WORKSPACE_PRESETS.find((p) => p.id === id);
}

/** Match exact layout (focus ignored for persistence matching). */
export function matchWorkspacePreset(input: {
  panelSplitPercent: number;
  panelOrientation: PanelOrientation;
  focusMode?: boolean;
}): WorkspacePresetId | null {
  for (const p of WORKSPACE_PRESETS) {
    if (p.panelOrientation !== input.panelOrientation) continue;
    if (Math.abs(p.panelSplitPercent - input.panelSplitPercent) > 2) continue;
    if (typeof input.focusMode === 'boolean' && p.focusMode !== input.focusMode) continue;
    return p.id;
  }
  return null;
}
