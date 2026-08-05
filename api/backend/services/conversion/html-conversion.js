'use strict'

/**
 * HTML ↔ Markdown / plain-text helpers used by dedicated wrappers.
 * HTML↔MD goes through Pandoc; HTML→TXT uses a local stripper (fast, no Pandoc).
 */

function getConvertWithPandoc() {
  // Lazy require to avoid circular load with convert.js consumers
  return require('./convert.js').convertWithPandoc
}

function decodeBasicEntities(text) {
  return String(text || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

/**
 * Lightweight HTML → plain text (no Pandoc).
 */
function htmlToPlain(html) {
  if (!html || typeof html !== 'string') {
    throw new Error('HTML content must be a non-empty string')
  }
  let text = html.replace(/\r\n/g, '\n')
  text = text.replace(/<script\b[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style\b[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<!--[\s\S]*?-->/g, '')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|table|section|article|header|footer|blockquote)>/gi, '\n')
  text = text.replace(/<\/?[^>]+>/g, '')
  text = decodeBasicEntities(text)
  text = text
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text + (text ? '\n' : '')
}

/**
 * Plain text → minimal HTML (paragraphs + <br>).
 */
function plainToHtml(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text content must be a non-empty string')
  }
  const escaped = text
    .replace(/\r\n/g, '\n')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  const blocks = escaped.split(/\n\s*\n/).map((block) => {
    const inner = block.trim().replace(/\n/g, '<br>\n')
    return inner ? `<p>${inner}</p>` : ''
  })
  const html = blocks.filter(Boolean).join('\n')
  return html + (html ? '\n' : '')
}

async function htmlToMarkdown(html) {
  if (!html || typeof html !== 'string') {
    throw new Error('HTML content must be a non-empty string')
  }
  return getConvertWithPandoc()(html, 'html', 'markdown')
}

async function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    throw new Error('Markdown content must be a non-empty string')
  }
  return getConvertWithPandoc()(markdown, 'markdown', 'html')
}

/**
 * Lightweight Markdown → plain text (no Pandoc). Fallback when Pandoc is unavailable.
 */
function markdownToPlain(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    throw new Error('Markdown content must be a non-empty string')
  }
  let text = markdown.replace(/\r\n/g, '\n')
  // Fenced code blocks → keep inner text
  text = text.replace(/```[\w-]*\n([\s\S]*?)```/g, (_, code) => code.replace(/\n+$/, '') + '\n')
  text = text.replace(/~~~[\w-]*\n([\s\S]*?)~~~/g, (_, code) => code.replace(/\n+$/, '') + '\n')
  // Inline code (after fences)
  text = text.replace(/`([^`]+)`/g, '$1')
  // Images / links (reference + inline)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
  text = text.replace(/!\[([^\]]*)\]\[[^\]]*\]/g, '$1')
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
  text = text.replace(/^\[[^\]]+\]:\s+\S+.*$/gm, '')
  // Tables: drop separator rows, keep cell text
  text = text.replace(/^\s*\|?[\s:|-]+\|[\s:|-]*\|?\s*$/gm, '')
  text = text.replace(/^\s*\|(.+)\|\s*$/gm, (_, cells) =>
    cells.split('|').map((c) => c.trim()).filter(Boolean).join('\t')
  )
  // Headings, quotes, lists, task lists
  text = text.replace(/^#{1,6}\s+/gm, '')
  text = text.replace(/^>\s?/gm, '')
  text = text.replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '')
  text = text.replace(/^\s*[-*+]\s+/gm, '')
  text = text.replace(/^\s*\d+\.\s+/gm, '')
  // Emphasis / strike
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')
  text = text.replace(/(\*|_)(.*?)\1/g, '$2')
  text = text.replace(/~~(.*?)~~/g, '$1')
  // Horizontal rules
  text = text.replace(/^\s*([-*_]){3,}\s*$/gm, '')
  // Footnote markers
  text = text.replace(/\[\^[^\]]+\]/g, '')
  text = text
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text + (text ? '\n' : '')
}

function isPandocTimeoutError(err) {
  if (!err) return false
  if (err.code === 'CONVERSION_TIMEOUT') return true
  const msg = err.message ? String(err.message) : String(err)
  return /timed?\s*out|CONVERSION_TIMEOUT/i.test(msg)
}

/**
 * Prefer Pandoc plain text; fall back to local stripper.
 * Timeouts are rethrown (not masked by the local stripper).
 * @returns {Promise<{ text: string, engineUsed: 'pandoc'|'local', fallbackReason?: string }>}
 */
async function markdownToPlainBestEffort(markdown) {
  try {
    const text = await getConvertWithPandoc()(markdown, 'markdown', 'txt')
    if (typeof text !== 'string' || !text.trim()) {
      // Empty Pandoc output → try local stripper before failing hard upstream.
      const local = markdownToPlain(markdown)
      return {
        text: local,
        engineUsed: 'local',
        fallbackReason: 'pandoc returned empty output',
      }
    }
    return { text, engineUsed: 'pandoc' }
  } catch (err) {
    if (isPandocTimeoutError(err)) throw err
    const fallbackReason = err && err.message ? String(err.message) : 'pandoc unavailable'
    return {
      text: markdownToPlain(markdown),
      engineUsed: 'local',
      fallbackReason,
    }
  }
}

module.exports = {
  htmlToPlain,
  plainToHtml,
  htmlToMarkdown,
  markdownToHtml,
  markdownToPlain,
  markdownToPlainBestEffort,
  isPandocTimeoutError,
}
