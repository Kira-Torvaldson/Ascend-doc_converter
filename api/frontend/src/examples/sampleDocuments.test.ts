import { describe, expect, it } from 'vitest';
import { getSampleDocument, SAMPLE_ASCIIDOC, SAMPLE_MARKDOWN } from './sampleDocuments';

describe('getSampleDocument', () => {
  it('returns AsciiDoc sample for asciidoc', () => {
    expect(getSampleDocument('asciidoc')).toBe(SAMPLE_ASCIIDOC);
    expect(SAMPLE_ASCIIDOC).toContain('= Guide rapide Ascend');
  });

  it('returns Markdown sample for markdown', () => {
    expect(getSampleDocument('markdown')).toBe(SAMPLE_MARKDOWN);
    expect(SAMPLE_MARKDOWN).toContain('# Guide rapide Ascend');
  });

  it('falls back to AsciiDoc for other formats', () => {
    expect(getSampleDocument('html')).toBe(SAMPLE_ASCIIDOC);
  });
});
