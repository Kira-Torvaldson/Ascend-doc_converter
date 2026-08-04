/**
 * Aperçu HTML léger (Markdown / AsciiDoc) — sans dépendance.
 */

import type { FormatType } from '../types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderPreviewHtml(content: string, format: FormatType): string {
  if (!content.trim()) return '';

  if (format === 'html') return content;

  if (format === 'markdown') {
    const escaped = escapeHtml(content);
    return escaped
      .replace(/^###### (.*)$/gim, '<h6>$1</h6>')
      .replace(/^##### (.*)$/gim, '<h5>$1</h5>')
      .replace(/^#### (.*)$/gim, '<h4>$1</h4>')
      .replace(/^### (.*)$/gim, '<h3>$1</h3>')
      .replace(/^## (.*)$/gim, '<h2>$1</h2>')
      .replace(/^# (.*)$/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
  }

  if (format === 'asciidoc') {
    const escaped = escapeHtml(content);
    return escaped
      .replace(/^=== (.*)$/gim, '<h3>$1</h3>')
      .replace(/^== (.*)$/gim, '<h2>$1</h2>')
      .replace(/^= (.*)$/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
  }

  return `<pre>${escapeHtml(content)}</pre>`;
}
