import { describe, expect, it } from 'vitest';
import { DIFF_LCS_CELL_LIMIT, diffLines } from './simpleDiff';

describe('diffLines', () => {
  it('détecte ajouts et suppressions', () => {
    const { lines, added, removed, truncated } = diffLines('a\nb\nc', 'a\nx\nc');
    expect(truncated).toBe(false);
    expect(added).toBe(1);
    expect(removed).toBe(1);
    expect(lines.some((l) => l.kind === 'del' && l.text === 'b')).toBe(true);
    expect(lines.some((l) => l.kind === 'add' && l.text === 'x')).toBe(true);
  });

  it('bascule en mode naïf si trop volumineux', () => {
    const n = Math.ceil(Math.sqrt(DIFF_LCS_CELL_LIMIT)) + 50;
    const left = Array.from({ length: n }, (_, i) => `L${i}`).join('\n');
    const right = Array.from({ length: n }, (_, i) => `R${i}`).join('\n');
    const result = diffLines(left, right);
    expect(result.truncated).toBe(true);
    expect(result.lines.length).toBeGreaterThan(0);
  });
});
