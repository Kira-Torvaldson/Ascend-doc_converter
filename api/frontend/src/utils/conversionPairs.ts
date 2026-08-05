/**
 * Couples de formats exposés dans l’UI Ascend (source de vérité unique).
 */

import type { FormatType } from '../types';

export function isSupportedUiConversion(source: FormatType, target: FormatType): boolean {
  return (
    (source === 'asciidoc' && target === 'markdown') ||
    (source === 'markdown' &&
      (target === 'asciidoc' || target === 'html' || target === 'txt')) ||
    (source === 'html' &&
      (target === 'markdown' || target === 'txt' || target === 'asciidoc')) ||
    (source === 'txt' && (target === 'markdown' || target === 'html'))
  );
}

export const SUPPORTED_CONVERSION_HINT =
  'Couples supportés : AsciiDoc↔Markdown, Markdown→HTML/TXT, HTML→Markdown/TXT/AsciiDoc, TXT→Markdown/HTML.';

/**
 * When source is Markdown, result for HTML/TXT/etc. must NOT reuse mdOutput
 * (that buffer holds the source). Use the dedicated otherOutput buffer instead.
 */
export function resultUsesOtherBuffer(source: FormatType, target: FormatType): boolean {
  return source === 'markdown' && target !== 'asciidoc' && target !== 'markdown';
}

export function readResultBuffer(
  source: FormatType,
  target: FormatType,
  buffers: { adocInput: string; mdOutput: string; otherOutput: string }
): string {
  if (target === 'asciidoc') return buffers.adocInput;
  if (resultUsesOtherBuffer(source, target)) return buffers.otherOutput;
  return buffers.mdOutput;
}

export function writeResultBuffer(
  source: FormatType,
  target: FormatType,
  content: string,
  setters: {
    setAdocInput: (v: string) => void;
    setMdOutput: (v: string) => void;
    setOtherOutput: (v: string) => void;
  }
): void {
  if (target === 'asciidoc') {
    setters.setAdocInput(content);
    return;
  }
  if (resultUsesOtherBuffer(source, target)) {
    setters.setOtherOutput(content);
    return;
  }
  setters.setMdOutput(content);
}

export function supportsRichPreview(target: FormatType): boolean {
  return target === 'html' || target === 'markdown' || target === 'asciidoc';
}
