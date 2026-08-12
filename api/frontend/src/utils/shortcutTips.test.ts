import { describe, expect, it } from 'vitest';
import { SHORTCUT_TIP, withShortcut, withShortcutId } from './shortcutTips';

describe('shortcutTips', () => {
  it('appends shortcut in parentheses', () => {
    expect(withShortcut('Historique', SHORTCUT_TIP.history)).toBe('Historique (Ctrl + H)');
  });

  it('avoids duplicate when already present', () => {
    expect(withShortcut('Mode focus (Ctrl + Maj + F)', SHORTCUT_TIP.focus)).toBe(
      'Mode focus (Ctrl + Maj + F)'
    );
  });

  it('handles empty label', () => {
    expect(withShortcut('', SHORTCUT_TIP.help)).toBe('Ctrl + /');
  });

  it('resolves known ids', () => {
    expect(withShortcutId('Convertir', 'convert')).toBe('Convertir (Ctrl + Entrée)');
  });
});
