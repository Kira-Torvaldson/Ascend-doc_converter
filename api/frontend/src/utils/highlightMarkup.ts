/**
 * Coloration légère markup (Markdown / AsciiDoc / HTML / générique).
 * Produit du HTML échappé + spans ; destiné à une couche sous textarea.
 */

export type HighlightLanguage = 'markdown' | 'asciidoc' | 'html' | 'generic';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function wrap(className: string, content: string): string {
  return `<span class="syn-${className}">${content}</span>`;
}

/** Applique une passe regex non chevauchante sur du texte déjà échappé. */
function paint(
  escaped: string,
  pattern: RegExp,
  className: string
): string {
  return escaped.replace(pattern, (match) => wrap(className, match));
}

export function highlightMarkup(text: string, language: HighlightLanguage = 'generic'): string {
  if (!text) return '\n';
  let out = escapeHtml(text);

  // Blocs / spans communs
  out = paint(out, /`[^`\n]+`/g, 'code');
  out = paint(out, /&lt;!--[\s\S]*?--&gt;/g, 'comment');

  if (language === 'html' || language === 'generic') {
    out = paint(out, /&lt;\/?[a-zA-Z][\w:-]*(?:\s[^&]*?)?\/?&gt;/g, 'tag');
  }

  if (language === 'markdown' || language === 'generic') {
    out = paint(out, /^#{1,6}\s+.+$/gm, 'heading');
    out = paint(out, /\*\*[^*\n]+\*\*|__[^_\n]+__/g, 'strong');
    out = paint(out, /\*[^*\n]+\*|_[^_\n]+_/g, 'em');
    out = paint(out, /^\s*[-*+]\s+/gm, 'list');
    out = paint(out, /^\s*\d+\.\s+/gm, 'list');
    out = paint(out, /\[[^\]]+\]\([^)]+\)/g, 'link');
  }

  if (language === 'asciidoc' || language === 'generic') {
    out = paint(out, /^=+\s+.+$/gm, 'heading');
    out = paint(out, /\*[^*\n]+\*|_[^_\n]+_/g, 'em');
    out = paint(out, /^\s*\*+\s+/gm, 'list');
    out = paint(out, /https?:\/\/\S+/g, 'link');
    out = paint(out, /:[a-zA-Z][\w-]*:/g, 'attr');
  }

  // Trailing newline so last line height matches textarea
  if (!out.endsWith('\n')) out += '\n';
  return out;
}

export function inferHighlightLanguage(format?: string | null): HighlightLanguage {
  if (format === 'markdown') return 'markdown';
  if (format === 'asciidoc') return 'asciidoc';
  if (format === 'html') return 'html';
  return 'generic';
}
