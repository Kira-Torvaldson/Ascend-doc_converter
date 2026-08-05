'use strict'

/**
 * Post/pre-processors that improve conversion precision (downdoc + Pandoc)
 * without changing UI code.
 */

const ADMON_TYPES = 'NOTE|TIP|WARNING|CAUTION|IMPORTANT'
const XREF_START = '\uE010'
const XREF_END = '\uE011'
const ANCHOR_START = '\uE012'
const ANCHOR_END = '\uE013'

/**
 * Pandoc AsciiDoc→Markdown emits fenced divs (:::: note … ::::).
 * Normalize to Ascend blockquotes: > **NOTE:** …
 */
function normalizePandocMarkdownAdmonitions(markdown) {
  if (!markdown || typeof markdown !== 'string') return markdown || ''

  return markdown.replace(
    /^::::\s*(note|tip|warning|caution|important)[^\n]*\n(?:::: title\n[^\n]*\n:::\n\n?)?([\s\S]*?)^::::\s*$/gim,
    (_, type, body) => {
      const lines = String(body)
        .replace(/\r\n/g, '\n')
        .trim()
        .split('\n')
      if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
        return `> **${type.toUpperCase()}:**\n\n`
      }
      const out = [`> **${type.toUpperCase()}:** ${lines[0].trim()}`]
      for (let i = 1; i < lines.length; i++) {
        const t = lines[i].trim()
        // Keep paragraph breaks inside the note (`> ` not bare `>`)
        out.push(t ? `> ${t}` : '> ')
      }
      return `${out.join('\n')}\n\n`
    }
  )
}

/**
 * Extract Markdown admonition blockquotes before Pandoc MD→AsciiDoc.
 */
function extractMarkdownAdmonitions(markdown) {
  const blocks = []
  const replaced = markdown.replace(
    /(^> \*\*(?:NOTE|TIP|WARNING|CAUTION|IMPORTANT):\*\*[^\n]*(?:\n>[^\n]*)*)/gim,
    (match) => {
      const lines = match.split('\n').map((l) => {
        const stripped = l.replace(/^>\s?/, '')
        return stripped.trim() === '' ? '' : stripped.replace(/\s+$/, '')
      })
      const head = lines[0] || ''
      const m = head.match(
        new RegExp(`^\\*\\*(${ADMON_TYPES}):\\*\\*\\s*(.*)$`, 'i')
      )
      if (!m) return match
      const type = m[1].toUpperCase()
      const body = [m[2] || '', ...lines.slice(1)]
      while (body.length && !body[body.length - 1].trim()) body.pop()
      while (body.length && !body[0].trim()) body.shift()
      const id = blocks.length
      blocks.push({ type, body })
      return `\n\nASCENDADMONPLACEHOLDER${id}\n\n`
    }
  )
  return { markdown: replaced, blocks }
}

function restoreAsciiDocAdmonitions(asciidoc, blocks) {
  if (!blocks.length) return asciidoc
  let result = asciidoc
  for (let id = 0; id < blocks.length; id++) {
    const { type, body } = blocks[id]
    const converted = body.map((line) =>
      line.trim() === '' ? '' : processInlineFormattingSafe(line)
    )
    const content = converted.join('\n').trim()
    const ascii = content
      ? `[${type}]\n====\n${content}\n====`
      : `[${type}]\n====\n====`
    result = result.replace(new RegExp(`ASCENDADMONPLACEHOLDER${id}`, 'g'), ascii)
  }
  return result
}

/**
 * Fallback when Pandoc emits:
 *   ____
 *   *NOTE:* text
 *   ____
 */
function postprocessPandocAsciiDocAdmonitions(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') return asciidoc || ''

  return asciidoc.replace(
    /^____\n\*(NOTE|TIP|WARNING|CAUTION|IMPORTANT):\*\s*([\s\S]*?)\n____/gm,
    (_, type, body) => {
      const content = String(body)
        .split('\n')
        .map((line) => (line.trim() === '' ? '' : processInlineFormattingSafe(line)))
        .join('\n')
        .trim()
      return `[${type}]\n====\n${content}\n====`
    }
  )
}

/**
 * Downdoc turns `Term:: def` into:
 *   * **Term**\
 *   def
 * Normalize to GFM definition lists so Pandoc (and readers) keep structure.
 */
function normalizeDefinitionLists(markdown) {
  if (!markdown || typeof markdown !== 'string') return markdown || ''

  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^\*\s+\*\*(.+?)\*\*\\?\s*$/)
    const next = i + 1 < lines.length ? lines[i + 1] : ''
    if (
      m &&
      next.trim() &&
      !/^\*\s+/.test(next) &&
      !/^#{1,6}\s/.test(next.trim()) &&
      !/^```/.test(next.trim())
    ) {
      out.push(m[1].trim())
      out.push(`: ${next.trim()}`)
      out.push('')
      i++
      continue
    }
    out.push(line)
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n')
}

/**
 * Pandoc leftover from unprotected dlists:
 *   * *Term* +
 *   Definition
 * → Term:: Definition
 */
function restoreAsciiDocDefinitionLists(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') return asciidoc || ''
  return asciidoc.replace(
    /^\* \*([^*\n]+)\* \+\n([^\n*].*)$/gm,
    (_, term, def) => `${term.trim()}:: ${def.trim()}`
  )
}

/**
 * Protect <<id>> / xref:id[label] before downdoc (which resolves to title slugs).
 */
function protectAsciiDocXrefs(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') return asciidoc || ''
  let s = asciidoc
  s = s.replace(/<<\s*([^,>]+?)\s*,\s*([^>]+?)\s*>>/g, (_, id, label) => {
    return `${XREF_START}${id.trim()}|${label.trim()}${XREF_END}`
  })
  s = s.replace(/<<\s*([^>]+?)\s*>>/g, (_, id) => {
    return `${XREF_START}${id.trim()}|${XREF_END}`
  })
  s = s.replace(/xref:([^\s\[]+)\[([^\]]*)\]/g, (_, id, label) => {
    return `${XREF_START}${id.trim()}|${label}${XREF_END}`
  })
  return s
}

function restoreMarkdownXrefs(markdown) {
  if (!markdown || typeof markdown !== 'string') return markdown || ''
  const re = new RegExp(
    `${XREF_START}([^|\\n]+)\\|([^${XREF_END}]*)?${XREF_END}`,
    'g'
  )
  return markdown.replace(re, (_, id, label) => {
    const text = label && String(label).length ? label : id
    return `[${text}](#${id})`
  })
}

/**
 * Keep [[id]] attached to the following heading through downdoc.
 */
function protectAsciiDocAnchors(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') return asciidoc || ''
  return asciidoc.replace(
    /^\[\[([A-Za-z0-9_.:-]+)\]\]\s*\n(=+)\s+(.+)$/gm,
    (_, id, eq, title) => `${eq} ${title.trim()} ${ANCHOR_START}${id}${ANCHOR_END}`
  )
}

function restoreMarkdownAnchors(markdown) {
  if (!markdown || typeof markdown !== 'string') return markdown || ''
  const re = new RegExp(
    `^(#{1,6})\\s+(.+?)\\s+${ANCHOR_START}([A-Za-z0-9_.:-]+)${ANCHOR_END}\\s*$`,
    'gm'
  )
  let result = markdown.replace(re, '$1 $2 {#$3}')
  // Keep a blank line after anchored headings when content follows immediately
  result = result.replace(/^(#{1,6}\s+.+\{#[^}]+\})\n(?!\n)/gm, '$1\n\n')
  return result
}

/** Pandoc MD→AsciiDoc: link:#id[text] → <<id,text>> */
function normalizePandocInternalLinks(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') return asciidoc || ''
  return asciidoc.replace(
    /link:#([A-Za-z0-9_.:-]+)\[([^\]]*)\]/g,
    (_, id, label) => {
      if (!label || label === id) return `<<${id}>>`
      return `<<${id},${label}>>`
    }
  )
}

/** Protect **bold** from being re-parsed as italic when converting MD→AsciiDoc locally. */
function processInlineFormattingSafe(text) {
  if (!text || typeof text !== 'string') return text

  let result = text
  const boldSlots = []
  const codeSlots = []

  result = result.replace(/`([^`\n]+)`/g, (_, code) => {
    const i = codeSlots.length
    codeSlots.push(code)
    return `\uE000CODE${i}\uE001`
  })

  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    return `image::${url}[${alt || ''}]`
  })
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    if (url.startsWith('#')) return `<<${url.substring(1)},${label}>>`
    return `link:${url}[${label}]`
  })
  result = result.replace(/\[([^\]]+)\]\[([^\]]+)\]/g, (_, label, ref) => {
    return `link:${ref}[${label}]`
  })

  result = result.replace(/\*\*([^*\n]+?)\*\*/g, (_, inner) => {
    const i = boldSlots.length
    boldSlots.push(inner)
    return `\uE000BOLD${i}\uE001`
  })
  result = result.replace(/__([^_\n]+?)__/g, (_, inner) => {
    const i = boldSlots.length
    boldSlots.push(inner)
    return `\uE000BOLD${i}\uE001`
  })

  result = result.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '_$1_')
  result = result.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '_$1_')
  result = result.replace(/~~([^~]+?)~~/g, '[line-through]#$1#')

  result = result.replace(/\uE000BOLD(\d+)\uE001/g, (_, i) => `*${boldSlots[Number(i)]}*`)
  result = result.replace(/\uE000CODE(\d+)\uE001/g, (_, i) => `\`${codeSlots[Number(i)]}\``)
  return result
}

/**
 * Prepare AsciiDoc for downdoc (anchors + xrefs). Call restore* on the Markdown result.
 */
function prepareAsciiDocForDowndoc(asciidoc) {
  return protectAsciiDocAnchors(protectAsciiDocXrefs(asciidoc))
}

function finalizeDowndocMarkdown(markdown) {
  let result = restoreMarkdownAnchors(restoreMarkdownXrefs(markdown))
  result = normalizeDefinitionLists(result)
  return result
}

/**
 * Shared MD→AsciiDoc post-pass after Pandoc (or local).
 */
function finalizePandocAsciiDoc(asciidoc, admonBlocks) {
  let result = asciidoc
  if (admonBlocks && admonBlocks.length) {
    result = restoreAsciiDocAdmonitions(result, admonBlocks)
  }
  result = postprocessPandocAsciiDocAdmonitions(result)
  result = restoreAsciiDocDefinitionLists(result)
  result = normalizePandocInternalLinks(result)
  return result.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

module.exports = {
  normalizePandocMarkdownAdmonitions,
  extractMarkdownAdmonitions,
  restoreAsciiDocAdmonitions,
  postprocessPandocAsciiDocAdmonitions,
  processInlineFormattingSafe,
  normalizeDefinitionLists,
  restoreAsciiDocDefinitionLists,
  protectAsciiDocXrefs,
  restoreMarkdownXrefs,
  protectAsciiDocAnchors,
  restoreMarkdownAnchors,
  normalizePandocInternalLinks,
  prepareAsciiDocForDowndoc,
  finalizeDowndocMarkdown,
  finalizePandocAsciiDoc,
}
