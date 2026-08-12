/**
 * Libellés de raccourcis pour tooltips (alignés sur l’aide Ctrl+/).
 */

export const SHORTCUT_TIP = {
  convert: 'Ctrl + Entrée',
  download: 'Ctrl + S',
  find: 'Ctrl + F',
  goto: 'Ctrl + G',
  diff: 'Ctrl + Maj + D',
  focus: 'Ctrl + Maj + F',
  history: 'Ctrl + H',
  settings: 'Ctrl + ,',
  clearSource: 'Ctrl + Maj + K',
  commandPalette: 'Ctrl + K',
  help: 'Ctrl + /',
} as const;

export type ShortcutTipId = keyof typeof SHORTCUT_TIP;

/** Ajoute « (Ctrl + …) » à un libellé de tooltip, sans doublon. */
export function withShortcut(label: string, shortcut: string): string {
  const tip = (label || '').trim();
  const keys = (shortcut || '').trim();
  if (!keys) return tip;
  if (!tip) return keys;
  if (tip.includes(keys)) return tip;
  return `${tip} (${keys})`;
}

export function withShortcutId(label: string, id: ShortcutTipId): string {
  return withShortcut(label, SHORTCUT_TIP[id]);
}
