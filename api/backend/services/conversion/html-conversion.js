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

module.exports = {
  htmlToPlain,
  plainToHtml,
  htmlToMarkdown,
  markdownToHtml,
}
