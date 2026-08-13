import { describe, expect, it } from 'vitest';
import {
  AUTO_CONVERT_MAX_FAILS,
  bumpAutoConvertFail,
  conversionOptionsStamp,
  decideAutoConvert,
  shouldMarkTabCleanAfterConvert,
  sourceAutoConvertKey,
  type AutoConvertInput,
} from './autoConvert';

function input(over: Partial<AutoConvertInput> = {}): AutoConvertInput {
  return {
    enabled: true,
    confirmBeforeConversion: false,
    busy: false,
    sourceFormat: 'asciidoc',
    targetFormat: 'markdown',
    sourceText: '= Hello',
    lastKey: '',
    lastStamp: '',
    currentStamp: '0|0|{}',
    failKey: '',
    failCount: 0,
    needsConfirmationToken: false,
    ...over,
  };
}

describe('autoConvert helpers', () => {
  it('builds a key from pair + source text', () => {
    expect(sourceAutoConvertKey('asciidoc', 'markdown', '= Doc')).toBe(
      'asciidoc>markdown\n= Doc'
    );
  });

  it('stamps toc, metadata and options', () => {
    expect(conversionOptionsStamp({ foo: 1 }, true, false)).toBe('1|0|{"foo":1}');
    expect(conversionOptionsStamp(undefined, false, true)).toBe('0|1|{}');
  });

  it('skips when disabled, confirming, busy, empty or token-gated', () => {
    expect(decideAutoConvert(input({ enabled: false }))).toBe('skip');
    expect(decideAutoConvert(input({ confirmBeforeConversion: true }))).toBe('skip');
    expect(decideAutoConvert(input({ busy: true }))).toBe('skip');
    expect(decideAutoConvert(input({ sourceText: '   ' }))).toBe('skip');
    expect(decideAutoConvert(input({ needsConfirmationToken: true }))).toBe('skip');
    expect(
      decideAutoConvert(input({ sourceFormat: 'asciidoc', targetFormat: 'pdf' }))
    ).toBe('skip');
  });

  it('skips when key and options stamp are already seeded', () => {
    const sourceText = '= Hello';
    const lastKey = sourceAutoConvertKey('asciidoc', 'markdown', sourceText);
    expect(
      decideAutoConvert(input({ sourceText, lastKey, lastStamp: '0|0|{}', currentStamp: '0|0|{}' }))
    ).toBe('skip');
  });

  it('schedules when source text or options change', () => {
    const lastKey = sourceAutoConvertKey('asciidoc', 'markdown', '= Hello');
    expect(decideAutoConvert(input({ sourceText: '= Changed', lastKey }))).toBe('schedule');
    expect(
      decideAutoConvert(
        input({ lastKey, lastStamp: '0|0|{}', currentStamp: '1|0|{}' })
      )
    ).toBe('schedule');
  });

  it('seeds as exhausted after the max retries on the same key', () => {
    const sourceText = '= Hello';
    const failKey = sourceAutoConvertKey('asciidoc', 'markdown', sourceText);
    expect(
      decideAutoConvert(
        input({
          sourceText,
          lastKey: 'other',
          failKey,
          failCount: AUTO_CONVERT_MAX_FAILS,
        })
      )
    ).toBe('seed-exhausted');
  });

  it('bumps fail count per key and marks clean only if live matches snapshot', () => {
    expect(bumpAutoConvertFail({ key: '', count: 0 }, 'k1')).toEqual({ key: 'k1', count: 1 });
    expect(bumpAutoConvertFail({ key: 'k1', count: 1 }, 'k1')).toEqual({ key: 'k1', count: 2 });
    expect(bumpAutoConvertFail({ key: 'k1', count: 2 }, 'k2')).toEqual({ key: 'k2', count: 1 });

    expect(shouldMarkTabCleanAfterConvert('live', 'live')).toBe(true);
    expect(shouldMarkTabCleanAfterConvert('typed', 'snapshot')).toBe(false);
    expect(shouldMarkTabCleanAfterConvert('live', '')).toBe(true);
  });
});
