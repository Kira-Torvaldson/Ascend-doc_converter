/**
 * Strip dangerous constructs before rendering HTML preview (no external deps).
 */

export function sanitizeHtmlForPreview(html: string): string {
  let out = String(html || '');
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '');
  out = out.replace(/<object\b[\s\S]*?<\/object>/gi, '');
  out = out.replace(/<embed\b[^>]*>/gi, '');
  out = out.replace(/<link\b[^>]*>/gi, '');
  out = out.replace(/<meta\b[^>]*>/gi, '');
  out = out.replace(/<base\b[^>]*>/gi, '');
  // Inline event handlers
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  out = out.replace(/javascript:/gi, '');
  out = out.replace(/data:text\/html/gi, 'data:text/plain');
  return out;
}
