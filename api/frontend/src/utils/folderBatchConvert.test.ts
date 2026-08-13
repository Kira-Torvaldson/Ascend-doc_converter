import { describe, expect, it } from 'vitest';
import {
  filterBatchableFolderFiles,
  outputExtensionFor,
  withOutputExtension,
  buildFolderBatchCsvReport,
  estimateFolderBatch,
  estimateFileConvertMs,
  formatBatchSizeLabel,
  formatBatchDurationLabel,
  estimateBatchRemainingSeconds,
  folderFileKey,
  markFolderBatchAborted,
  MAX_FOLDER_BATCH,
} from './folderBatchConvert';

function fakeFile(name: string): File {
  return new File(['# hi'], name, { type: 'text/plain' });
}

describe('folderBatchConvert helpers', () => {
  it('maps output extensions', () => {
    expect(outputExtensionFor('markdown')).toBe('md');
    expect(outputExtensionFor('asciidoc')).toBe('adoc');
    expect(withOutputExtension('doc.adoc', 'markdown')).toBe('doc.md');
  });

  it('filters unsupported pairs for target markdown', () => {
    const { eligible, skipped } = filterBatchableFolderFiles(
      [fakeFile('a.adoc'), fakeFile('b.md'), fakeFile('c.pdf')],
      'markdown'
    );
    expect(eligible.map((f) => f.name)).toEqual(['a.adoc']);
    expect(skipped.some((s) => s.file.name === 'b.md')).toBe(true);
  });

  it('builds a CSV report with escaped fields', () => {
    const csv = buildFolderBatchCsvReport([
      {
        id: '1',
        fileName: 'a, b.adoc',
        status: 'success',
        sourceFormat: 'asciidoc',
      },
      {
        id: '2',
        fileName: 'skip.md',
        status: 'skipped',
        message: 'pair',
      },
    ]);
    expect(csv).toContain('file,status,detail,sourceFormat');
    expect(csv).toContain('"a, b.adoc",success,,asciidoc');
    expect(csv).toContain('skip.md,skipped,pair,');
  });

  it('estimates batch size and duration', () => {
    const big = new File(['x'.repeat(20_000)], 'big.adoc', { type: 'text/plain' });
    const small = new File(['hi'], 'small.adoc', { type: 'text/plain' });
    const estimate = estimateFolderBatch([big, small, fakeFile('skip.md')], 'markdown');
    expect(estimate.eligibleCount).toBe(2);
    expect(estimate.skippedCount).toBe(1);
    expect(estimate.truncatedCount).toBe(0);
    expect(estimate.totalBytes).toBeGreaterThan(20_000);
    expect(estimate.estimatedSeconds).toBeGreaterThanOrEqual(1);
    expect(formatBatchSizeLabel(512)).toBe('512 o');
    expect(formatBatchSizeLabel(2048)).toMatch(/Ko$/);
    expect(formatBatchDurationLabel(12)).toBe('~12 s');
    expect(formatBatchDurationLabel(125)).toBe('~2 min');
  });

  it('scales batch estimate with file size and count', () => {
    const small = new File(['= x'], 'a.adoc', { type: 'text/plain' });
    const big = new File(['= x'.repeat(40_000)], 'b.adoc', { type: 'text/plain' });
    expect(estimateFileConvertMs(big, 'markdown')).toBeGreaterThan(
      estimateFileConvertMs(small, 'markdown')
    );
    expect(estimateFolderBatch([small, small], 'markdown').estimatedSeconds).toBeGreaterThanOrEqual(
      estimateFolderBatch([small], 'markdown').estimatedSeconds
    );
  });

  it('estimates remaining ETA from progress', () => {
    expect(
      estimateBatchRemainingSeconds({
        startedAtMs: 0,
        nowMs: 2000,
        processedCount: 2,
        totalEligible: 4,
      })
    ).toBe(2);
    expect(
      estimateBatchRemainingSeconds({
        startedAtMs: 0,
        nowMs: 100,
        processedCount: 0,
        totalEligible: 5,
        fallbackTotalSeconds: 9,
      })
    ).toBe(9);
    expect(
      estimateBatchRemainingSeconds({
        startedAtMs: 0,
        nowMs: 2000,
        processedCount: 4,
        totalEligible: 4,
      })
    ).toBe(0);
    expect(formatBatchDurationLabel(0)).toBe('0 s');
    expect(
      formatBatchSizeLabel(512, {
        bytes: 'B',
        kb: 'KB',
        mb: 'MB',
        sec: 's',
        min: 'min',
        hour: 'h',
      })
    ).toBe('512 B');
  });

  it('builds unique keys for homonym files', () => {
    expect(folderFileKey(fakeFile('a.md'), 0)).not.toBe(folderFileKey(fakeFile('a.md'), 1));
  });

  it('marks extra eligible files as limit skips', () => {
    const files = Array.from(
      { length: MAX_FOLDER_BATCH + 2 },
      (_, i) => new File(['= x'], `f${i}.adoc`, { type: 'text/plain' })
    );
    const { eligible, skipped } = filterBatchableFolderFiles(files, 'markdown');
    expect(eligible).toHaveLength(MAX_FOLDER_BATCH);
    expect(skipped.filter((s) => s.reason === 'limit')).toHaveLength(2);
    expect(estimateFolderBatch(files, 'markdown').truncatedCount).toBe(2);
  });

  it('marks pending and running batch items as aborted', () => {
    const next = markFolderBatchAborted([
      { id: '1', fileName: 'a.md', status: 'success' },
      { id: '2', fileName: 'b.md', status: 'running' },
      { id: '3', fileName: 'c.md', status: 'pending' },
      { id: '4', fileName: 'd.md', status: 'error', message: 'empty' },
    ]);
    expect(next[0].status).toBe('success');
    expect(next[1]).toEqual({
      id: '2',
      fileName: 'b.md',
      status: 'skipped',
      message: 'aborted',
    });
    expect(next[2]).toEqual({
      id: '3',
      fileName: 'c.md',
      status: 'skipped',
      message: 'aborted',
    });
    expect(next[3]).toEqual({
      id: '4',
      fileName: 'd.md',
      status: 'error',
      message: 'empty',
    });
  });
});
