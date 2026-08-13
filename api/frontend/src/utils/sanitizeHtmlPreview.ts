/**
 * Strip dangerous constructs before rendering HTML preview (no external deps).
 */

const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'style',
  'svg',
  'math',
  'form',
  'applet',
  'template',
  'foreignobject',
  'animate',
  'set',
];

const URL_ATTR = /^(href|src|xlink:href|action|formaction|cite|poster|data)$/i;

function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 1 || code === 60 || code === 62) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

/** Decode entities used to hide javascript: — never decode &lt; / &gt;. */
export function decodeAttrEntities(value: string): string {
  let out = String(value || '');
  for (let i = 0; i < 3; i++) {
    const next = out
      .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);?/g, (_, dec: string) => safeCodePoint(parseInt(dec, 10)))
      .replace(/&colon;/gi, ':')
      .replace(/&tab;/gi, '\t')
      .replace(/&newline;/gi, '\n');
    if (next === out) break;
    out = next;
  }
  return out;
}

export function isDangerousPreviewUrl(value: string): boolean {
  const normalized = decodeAttrEntities(value)
    .replace(/[\u0000-\u0020\u00a0]/g, '')
    .toLowerCase();
  return (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('data:text/html')
  );
}

function stripDangerousTags(html: string): string {
  let out = html;
  for (const tag of DANGEROUS_TAGS) {
    out = out.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
    out = out.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
  }
  return out;
}

function unquoteAttr(raw: string): string {
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

function sanitizeOpenTag(tag: string): string {
  if (tag.startsWith('</')) return tag;
  let cleaned = tag.replace(
    /[\s/]+on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    ''
  );
  cleaned = cleaned.replace(
    /\s(href|src|xlink:href|action|formaction|cite|poster|data)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    (full, attr: string, raw: string) => {
      if (!URL_ATTR.test(attr)) return full;
      const val = unquoteAttr(raw);
      if (isDangerousPreviewUrl(val)) return ` ${attr}="#"`;
      if (/data:text\/html/i.test(decodeAttrEntities(val))) return ` ${attr}="#"`;
      return full;
    }
  );
  return cleaned;
}

export function sanitizeHtmlForPreview(html: string): string {
  let out = String(html || '');
  out = stripDangerousTags(out);
  out = out.replace(/<[^>]+>/g, sanitizeOpenTag);
  out = out.replace(/javascript:/gi, '');
  out = out.replace(/vbscript:/gi, '');
  out = out.replace(/data:text\/html/gi, 'data:text/plain');
  return out;
}
