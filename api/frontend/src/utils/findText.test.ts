import { describe, expect, it } from 'vitest';
import { findTextMatches, replaceTextMatches } from './findText';

describe('findTextMatches', () => {
  it('finds literal case-sensitive matches', () => {
    const r = findTextMatches('Foo foo FOO', 'foo', { caseSensitive: true });
    expect(r.positions).toEqual([4]);
    expect(r.lengths).toEqual([3]);
  });

  it('supports case-insensitive and whole word', () => {
    const r = findTextMatches('cat category cat', 'cat', {
      caseSensitive: false,
      wholeWord: true,
    });
    expect(r.positions).toEqual([0, 13]);
  });

  it('supports regex and reports invalid patterns', () => {
    const ok = findTextMatches('a1 b22', '\\d+', { regex: true });
    expect(ok.positions).toEqual([1, 4]);
    expect(ok.lengths).toEqual([1, 2]);
    const bad = findTextMatches('abc', '(', { regex: true });
    expect(bad.invalidRegex).toBe(true);
    expect(bad.positions).toEqual([]);
  });

  it('replaces one and all with lengths', () => {
    const one = replaceTextMatches('aa bb aa', 'aa', 'X', {}, 'one', 1);
    expect(one).toBe('aa bb X');
    const all = replaceTextMatches('aa bb aa', 'aa', 'X', {}, 'all');
    expect(all).toBe('X bb X');
  });
});
