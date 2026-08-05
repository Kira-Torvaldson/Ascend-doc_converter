import { describe, expect, it } from 'vitest';
import {
  extractConversionWarnings,
  normalizeConversionWarning,
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
  });

  it('extracts structured warnings from ConversionResult', () => {
    const list = extractConversionWarnings({
      warnings: [{ code: 'ENGINE_FALLBACK', message: 'fallback' }],
    });
    expect(list).toHaveLength(1);
    expect(list[0].code).toBe('ENGINE_FALLBACK');
  });
});
