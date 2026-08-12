import { describe, expect, it, vi } from 'vitest';
import {
  formatPairShortLabel,
  formatPairShortParts,
  isFavoritePair,
  isSupportedUiConversion,
  normalizeFormatPairs,
  readResultBuffer,
  recordRecentPair,
  resultUsesOtherBuffer,
  supportsRichPreview,
  toggleFavoritePair,
  writeResultBuffer,
} from './conversionPairs';

describe('conversionPairs', () => {
  it('supports MD→HTML/TXT without clobbering MD source buffer', () => {
    expect(isSupportedUiConversion('markdown', 'html')).toBe(true);
    expect(resultUsesOtherBuffer('markdown', 'html')).toBe(true);
    expect(resultUsesOtherBuffer('markdown', 'txt')).toBe(true);
    expect(resultUsesOtherBuffer('markdown', 'asciidoc')).toBe(false);
    expect(resultUsesOtherBuffer('html', 'markdown')).toBe(false);
  });

  it('reads/writes otherOutput for Markdown→HTML', () => {
    expect(
      readResultBuffer('markdown', 'html', {
        adocInput: 'adoc',
        mdOutput: 'source-md',
        otherOutput: '<p>out</p>',
      })
    ).toBe('<p>out</p>');

    const setAdocInput = vi.fn();
    const setMdOutput = vi.fn();
    const setOtherOutput = vi.fn();
    writeResultBuffer('markdown', 'html', '<p>x</p>', {
      setAdocInput,
      setMdOutput,
      setOtherOutput,
    });
    expect(setOtherOutput).toHaveBeenCalledWith('<p>x</p>');
    expect(setMdOutput).not.toHaveBeenCalled();
  });

  it('keeps rich preview only for html/md/adoc', () => {
    expect(supportsRichPreview('html')).toBe(true);
    expect(supportsRichPreview('txt')).toBe(false);
  });

  it('records recent pairs MRU and dedupes', () => {
    let recent = recordRecentPair([], 'asciidoc', 'markdown');
    recent = recordRecentPair(recent, 'markdown', 'html');
    recent = recordRecentPair(recent, 'asciidoc', 'markdown');
    expect(recent).toEqual([
      { source: 'asciidoc', target: 'markdown' },
      { source: 'markdown', target: 'html' },
    ]);
  });

  it('toggles favorites and normalizes junk', () => {
    let fav = toggleFavoritePair([], 'markdown', 'html');
    expect(isFavoritePair(fav, 'markdown', 'html')).toBe(true);
    fav = toggleFavoritePair(fav, 'markdown', 'html');
    expect(fav).toEqual([]);
    expect(
      normalizeFormatPairs([
        { source: 'markdown', target: 'html' },
        { source: 'nope', target: 'html' },
        { source: 'markdown', target: 'markdown' },
        { source: 'markdown', target: 'html' },
      ])
    ).toEqual([{ source: 'markdown', target: 'html' }]);
    expect(formatPairShortLabel({ source: 'asciidoc', target: 'markdown' })).toBe('Adoc → MD');
    expect(formatPairShortParts({ source: 'markdown', target: 'html' })).toEqual({
      from: 'MD',
      to: 'HTML',
    });
  });
});
