import { describe, expect, it, vi } from 'vitest';
import {
  isSupportedUiConversion,
  readResultBuffer,
  resultUsesOtherBuffer,
  supportsRichPreview,
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
});
