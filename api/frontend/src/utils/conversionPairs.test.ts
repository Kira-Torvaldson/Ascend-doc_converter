import { describe, expect, it, vi } from 'vitest';
import {
  formatPairShortLabel,
  formatPairShortParts,
  isFavoritePair,
  isSupportedUiConversion,
  conversionNeedsConfirmationToken,
  normalizeFormatPairs,
  readResultBuffer,
  recordRecentPair,
  resultUsesOtherBuffer,
  supportsRichPreview,
  toggleFavoritePair,
  writeResultBuffer,
  applyResultToBuffers,
  applyHistoryToBuffers,
  decideConversionResultDest,
  resolveConvertRequestSnap,
  resultWriteWouldClobberSource,
} from './conversionPairs';

describe('conversionPairs', () => {
  it('supports MD→HTML/TXT without clobbering MD source buffer', () => {
    expect(isSupportedUiConversion('markdown', 'html')).toBe(true);
    expect(conversionNeedsConfirmationToken('asciidoc', 'markdown')).toBe(false);
    expect(conversionNeedsConfirmationToken('asciidoc', 'pdf')).toBe(true);
    expect(resultUsesOtherBuffer('markdown', 'html')).toBe(true);
    expect(resultUsesOtherBuffer('markdown', 'txt')).toBe(true);
    expect(resultUsesOtherBuffer('markdown', 'asciidoc')).toBe(false);
    expect(resultUsesOtherBuffer('html', 'markdown')).toBe(false);
    expect(resultUsesOtherBuffer('html', 'asciidoc')).toBe(true);
    expect(resultUsesOtherBuffer('txt', 'asciidoc')).toBe(true);
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

  it('keeps HTML/TXT source when the result is AsciiDoc', () => {
    const setAdocInput = vi.fn();
    const setMdOutput = vi.fn();
    const setOtherOutput = vi.fn();
    writeResultBuffer('html', 'asciidoc', '= Out', {
      setAdocInput,
      setMdOutput,
      setOtherOutput,
    });
    expect(setOtherOutput).toHaveBeenCalledWith('= Out');
    expect(setAdocInput).not.toHaveBeenCalled();
    expect(
      readResultBuffer('html', 'asciidoc', {
        adocInput: '<p>src</p>',
        mdOutput: '',
        otherOutput: '= Out',
      })
    ).toBe('= Out');
  });

  it('does not apply a result that would overwrite the live source', () => {
    expect(resultWriteWouldClobberSource('asciidoc', 'markdown', 'markdown')).toBe(true);
    expect(resultWriteWouldClobberSource('asciidoc', 'markdown', 'asciidoc')).toBe(false);
    expect(resultWriteWouldClobberSource('markdown', 'html', 'markdown')).toBe(false);
    expect(resultWriteWouldClobberSource('html', 'asciidoc', 'html')).toBe(false);
    expect(
      decideConversionResultDest({
        originTabId: 'a',
        liveTabId: 'b',
        writeSource: 'asciidoc',
        writeTarget: 'markdown',
        liveSource: 'asciidoc',
      })
    ).toBe('tab');
    expect(
      decideConversionResultDest({
        originTabId: 'a',
        liveTabId: 'a',
        writeSource: 'asciidoc',
        writeTarget: 'markdown',
        liveSource: 'markdown',
      })
    ).toBe('skip');
    expect(
      applyResultToBuffers(
        { adocInput: 'src', mdOutput: '', otherOutput: '' },
        'asciidoc',
        'markdown',
        '# out'
      )
    ).toEqual({ adocInput: 'src', mdOutput: '# out', otherOutput: '' });
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

  it('keeps confirm snap for tokenized convert instead of live editor', () => {
    const snap = {
      tabId: 'origin',
      sourceText: 'frozen',
      sourceFormat: 'asciidoc' as const,
      targetFormat: 'pdf' as const,
    };
    const live = {
      tabId: 'other',
      sourceText: 'edited-later',
      sourceFormat: 'markdown' as const,
      targetFormat: 'html' as const,
    };
    expect(resolveConvertRequestSnap(snap, live)).toEqual(snap);
    expect(resolveConvertRequestSnap(null, live)).toEqual(live);
  });

  it('clears unused buffers when restoring history', () => {
    expect(applyHistoryToBuffers('markdown', 'html', '# src', '<p>out</p>')).toEqual({
      adocInput: '',
      mdOutput: '# src',
      otherOutput: '<p>out</p>',
    });
    expect(applyHistoryToBuffers('asciidoc', 'markdown', '= Src', '# out')).toEqual({
      adocInput: '= Src',
      mdOutput: '# out',
      otherOutput: '',
    });
    expect(applyHistoryToBuffers('html', 'asciidoc', '<p>src</p>', '= Out')).toEqual({
      adocInput: '<p>src</p>',
      mdOutput: '',
      otherOutput: '= Out',
    });
  });
});
