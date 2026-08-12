import { describe, expect, it } from 'vitest';
import {
  filterBatchableFolderFiles,
  outputExtensionFor,
  withOutputExtension,
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
});
