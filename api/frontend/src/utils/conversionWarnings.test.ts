import { describe, expect, it } from 'vitest';
import {
  extractConversionWarnings,
  findLineBySnippet,
  normalizeConversionWarning,
  parseLineFromWarningText,
  resolveWarningLocation,
} from './conversionWarnings';

describe('conversionWarnings', () => {
  it('maps ENGINE_FALLBACK to a titled warning with hint', () => {
    const item = normalizeConversionWarning({
      code: 'ENGINE_FALLBACK',
      message: 'Used local stripper after Pandoc failure',
      details: { fallbackReason: 'pandoc unavailable' },
    });
    expect(item.title).toBe('Moteur de secours');
    expect(item.hint).toMatch(/sans Pandoc/i);
    expect(item.hint).toMatch(/pandoc unavailable/i);
    expect(item.location).toBeUndefined();
  });

  it('extracts structured warnings from ConversionResult', () => {
    const list = extractConversionWarnings({
      warnings: [{ code: 'ENGINE_FALLBACK', message: 'fallback' }],
    });
    expect(list).toHaveLength(1);
    expect(list[0].code).toBe('ENGINE_FALLBACK');
  });

  it('resolves location from details.line', () => {
    const loc = resolveWarningLocation({
      message: 'odd construct',
      details: { line: 12, target: 'source' },
    });
    expect(loc).toEqual({ line: 12, target: 'source' });
  });

  it('resolves location from resultLine', () => {
    const loc = resolveWarningLocation({
      message: 'x',
      details: { resultLine: 4 },
    });
    expect(loc).toEqual({ line: 4, target: 'result' });
  });

  it('parses line from message text', () => {
    expect(parseLineFromWarningText('Warning at line 42: bad table')).toBe(42);
    expect(parseLineFromWarningText('ligne: 7 — ancre manquante')).toBe(7);
    expect(parseLineFromWarningText('file.adoc:15: warning')).toBe(15);
  });

  it('finds line by snippet in buffers', () => {
    const source = 'alpha\nbeta gamma\ndelta';
    expect(findLineBySnippet(source, 'beta gamma')).toBe(2);
    const item = normalizeConversionWarning(
      { message: 'see "beta gamma" nearby', details: {} },
      { sourceText: source }
    );
    expect(item.location).toEqual({ line: 2, target: 'source' });
  });

  it('attaches location when extracting with buffers', () => {
    const list = extractConversionWarnings(
      {
        warnings: [{ code: 'X', message: 'issue', details: { line: 3, side: 'output' } }],
      },
      { sourceText: 'a\nb\nc', resultText: 'r1\nr2\nr3' }
    );
    expect(list[0].location).toEqual({ line: 3, target: 'result' });
  });
});
