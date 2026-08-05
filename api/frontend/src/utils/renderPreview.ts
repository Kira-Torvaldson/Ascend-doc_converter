/**
 * Aperçu HTML léger (Markdown / AsciiDoc) — compact, sans dépendance.
 */

import type { FormatType } from '../types';
import { sanitizeHtmlForPreview } from './sanitizeHtmlPreview';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

/** Compact markdown preview: headings + inline + tight admonitions, no bulky paragraphs. */
function renderMarkdownPreview(content: string): string {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        const body = lines[i].replace(/^>\s?/, '').trim();
        if (body) quote.push(body);
        i++;
      }
      while (i < lines.length && !lines[i].trim()) i++;

      if (quote.length === 0) continue;

      const joined = quote.join(' ');
      const noteMatch = joined.match(
        /^\*\*(NOTE|TIP|WARNING|CAUTION|IMPORTANT):\*\*\s*(.*)$/i
      );
      if (noteMatch) {
        const kind = noteMatch[1].toUpperCase();
        const text = noteMatch[2] || '';
        out.push(
          `<div class="preview-note preview-note--${kind.toLowerCase()}"><span class="preview-note-label">${escapeHtml(kind)}</span> ${renderInline(text)}</div>`
        );
      } else {
        out.push(`<div class="preview-quote">${quote.map(renderInline).join(' ')}</div>`);
      }
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 4);
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (!line.trim()) {
      out.push('<br/>');
      i++;
      continue;
    }

    out.push(renderInline(line));
    out.push('<br/>');
    i++;
  }

  return out.join('').replace(/(<br\/>){3,}/g, '<br/><br/>');
}

export function renderPreviewHtml(content: string, format: FormatType): string {
  if (!content.trim()) return '';

  if (format === 'html') return sanitizeHtmlForPreview(content);

  if (format === 'markdown') {
    return renderMarkdownPreview(content);
  }

  if (format === 'asciidoc') {
    return escapeHtml(content)
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
