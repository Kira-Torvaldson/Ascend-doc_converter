import { describe, expect, it } from 'vitest';
import { countTextLines, getLineRange, lineNumberAtOffset } from './editorNavigate';

describe('editorNavigate', () => {
  it('countTextLines', () => {
    expect(countTextLines('')).toBe(1);
    expect(countTextLines('a')).toBe(1);
    expect(countTextLines('a\nb\nc')).toBe(3);
  });

  it('getLineRange clamps and computes offsets', () => {
    const text = 'one\ntwo\nthree';
    expect(getLineRange(text, 1)).toEqual({ start: 0, end: 3, lineIndex: 0, totalLines: 3 });
    expect(getLineRange(text, 2)).toEqual({ start: 4, end: 7, lineIndex: 1, totalLines: 3 });
    expect(getLineRange(text, 99).lineIndex).toBe(2);
    expect(getLineRange(text, 0).lineIndex).toBe(0);
  });

  it('lineNumberAtOffset', () => {
    expect(lineNumberAtOffset('a\nb\nc', 0)).toBe(1);
    expect(lineNumberAtOffset('a\nb\nc', 2)).toBe(2);
    expect(lineNumberAtOffset('a\nb\nc', 4)).toBe(3);
  });
});
