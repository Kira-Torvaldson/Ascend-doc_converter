import { describe, expect, it } from 'vitest';
import {
  buildConversionHistoryItem,
  parseConversionHistory,
  prependConversionHistory,
  shouldRecordConversionHistory,
} from './conversionHistory';

describe('conversionHistory', () => {
  it('builds an item from the origin snapshot and skips empties', () => {
    expect(
      buildConversionHistoryItem({
        fromFormat: 'asciidoc',
        toFormat: 'markdown',
        sourceContent: '  ',
        resultContent: '# out',
        now: 42,
      })
    ).toBeNull();
    expect(
      buildConversionHistoryItem({
        fromFormat: 'markdown',
        toFormat: 'html',
        sourceContent: '# src',
        resultContent: '<p>out</p>',
        now: 42,
      })
    ).toEqual({
      id: '42',
      timestamp: 42,
      fromFormat: 'markdown',
      toFormat: 'html',
      sourceContent: '# src',
      resultContent: '<p>out</p>',
    });
  });

  it('records live and other-tab results, not skipped writes', () => {
    expect(shouldRecordConversionHistory('live')).toBe(true);
    expect(shouldRecordConversionHistory('tab')).toBe(true);
    expect(shouldRecordConversionHistory(null)).toBe(true);
    expect(shouldRecordConversionHistory('skip')).toBe(false);
  });

  it('prepends and caps the list', () => {
    const a = buildConversionHistoryItem({
      fromFormat: 'asciidoc',
      toFormat: 'markdown',
      sourceContent: '= A',
      resultContent: '# A',
      now: 1,
    })!;
    const b = buildConversionHistoryItem({
      fromFormat: 'asciidoc',
      toFormat: 'markdown',
      sourceContent: '= B',
      resultContent: '# B',
      now: 2,
    })!;
    expect(prependConversionHistory([a], b, 1)).toEqual([b]);
    expect(prependConversionHistory([a], b, 50)[0]).toBe(b);
  });

  it('parses stored history without crashing on junk', () => {
    expect(parseConversionHistory(null)).toEqual([]);
    expect(parseConversionHistory('{}')).toEqual([]);
    expect(parseConversionHistory('"nope"')).toEqual([]);
    expect(parseConversionHistory('not-json')).toEqual([]);
    expect(
      parseConversionHistory(
        JSON.stringify([
          { fromFormat: 'markdown', toFormat: 'html', sourceContent: '# s', resultContent: '<p>o</p>', id: '1', timestamp: 1 },
          { fromFormat: 'nope', toFormat: 'html', sourceContent: 'x', resultContent: 'y' },
          'oops',
        ])
      )
    ).toEqual([
      {
        id: '1',
        timestamp: 1,
        fromFormat: 'markdown',
        toFormat: 'html',
        sourceContent: '# s',
        resultContent: '<p>o</p>',
      },
    ]);
  });
});
