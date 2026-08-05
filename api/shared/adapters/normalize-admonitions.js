'use strict'

/**
 * Convertit les admonitions downdoc ( **📌 NOTE**\  et <dl>…</dl> )
 * en blockquotes Markdown portables : > **NOTE:** …
 */

function emitBlockquote(processedLines, admonitionType, admonitionContent) {
  const content = admonitionContent.slice()
  while (content.length && !String(content[content.length - 1]).trim()) content.pop()
  while (content.length && !String(content[0]).trim()) content.shift()
  if (content.length > 0) {
    processedLines.push(`> **${admonitionType}:** ${content[0]}`)
    for (let i = 1; i < content.length; i++) {
      const contentLine = content[i]
      // Use `> ` (not bare `>`) so paragraph breaks survive post-cleanup
      processedLines.push(contentLine.trim() ? `> ${contentLine}` : '> ')
    }
  } else {
    processedLines.push(`> **${admonitionType}:**`)
  }
  processedLines.push('')
}

function normalizeAdmonitionsToBlockquotes(markdown) {
  if (!markdown || typeof markdown !== 'string') return markdown || ''

  let result = markdown
  // Downdoc hard-break after paragraph labels
  result = result.replace(/^(\*\*[^\n*]+?\*\*)\s*\\$/gm, '$1')

  const lines = result.split('\n')
  const processedLines = []
  let inAdmonition = false
  let admonitionType = ''
  let admonitionContent = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLine = i < lines.length - 1 ? lines[i + 1] : ''

    const emojiMatch = line.match(/^\*\*([📝💡⚠️🔥❗⚠📌])\s+(\w+)\*\*\s*\\?\s*$/)
    const emojiMatchWithContent = line.match(/^\*\*([📝💡⚠️🔥❗⚠📌])\s+(\w+)\*\*\s+(.+)$/)
    const emojiMatchLoose = line.match(
      /^\*\*([^\*]+?)\s+(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\*\*\s*\\?\s*$/i
    )
    const emojiMatchWithContentLoose = line.match(
      /^\*\*([^\*]+?)\s+(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\*\*\s+(.+)$/i
    )
    const htmlMatch = line.match(
      /^<dl><dt><strong>(?:<a name="[^"]*"><\/a>)?([📝💡⚠️🔥❗⚠📌])\s+(\w+)(?::\s*(.+))?<\/strong><\/dt><dd>$/
    )
    const htmlMatchLoose = line.match(
      /^<dl><dt><strong>(?:<a name="[^"]*"><\/a>)?([^<]+?)\s+(NOTE|TIP|WARNING|CAUTION|IMPORTANT)(?::\s*(.+))?<\/strong><\/dt><dd>$/i
    )

    if (
      emojiMatch ||
      emojiMatchWithContent ||
      emojiMatchLoose ||
      emojiMatchWithContentLoose ||
      htmlMatch ||
      htmlMatchLoose
    ) {
      if (inAdmonition) {
        emitBlockquote(processedLines, admonitionType, admonitionContent)
      }

      inAdmonition = true
      admonitionContent = []

      if (htmlMatch) {
        admonitionType = htmlMatch[2]
        if (htmlMatch[3]) admonitionContent.push(htmlMatch[3].trim())
        continue
      }
      if (htmlMatchLoose) {
        admonitionType = htmlMatchLoose[2]
        if (htmlMatchLoose[3]) admonitionContent.push(htmlMatchLoose[3].trim())
        continue
      }
      if (emojiMatchWithContent) {
        admonitionType = emojiMatchWithContent[2]
        admonitionContent.push(emojiMatchWithContent[3].trim())
      } else if (emojiMatchWithContentLoose) {
        admonitionType = emojiMatchWithContentLoose[2]
        admonitionContent.push(emojiMatchWithContentLoose[3].trim())
      } else if (emojiMatch) {
        admonitionType = emojiMatch[2]
      } else if (emojiMatchLoose) {
        admonitionType = emojiMatchLoose[2]
      }

      if (
        nextLine.trim() &&
        !nextLine.match(/^[#>#=-]|^```|^\|/) &&
        !nextLine.match(/^\*\*/) &&
        !nextLine.match(/^<\/dd><\/dl>$/)
      ) {
        continue
      }
      emitBlockquote(processedLines, admonitionType, admonitionContent)
      inAdmonition = false
      admonitionType = ''
      admonitionContent = []
      continue
    }

    if (line.match(/<\/dd><\/dl>/)) {
      if (inAdmonition) {
        const contentBeforeClose = line.replace(/<\/dd><\/dl>.*$/, '').trim()
        if (contentBeforeClose) admonitionContent.push(contentBeforeClose)
        emitBlockquote(processedLines, admonitionType, admonitionContent)
        inAdmonition = false
        admonitionType = ''
        admonitionContent = []
      }
      continue
    }

    if (inAdmonition) {
      if (!line.trim() && admonitionContent.length === 0) continue
      if (!line.match(/^[#>#=-]|^```|^\|/) && !line.match(/^\*\*/)) {
        if (line.trim()) admonitionContent.push(line.trim())
        else if (admonitionContent.length > 0) admonitionContent.push('')
        continue
      }
      emitBlockquote(processedLines, admonitionType, admonitionContent)
      inAdmonition = false
      admonitionType = ''
      admonitionContent = []
    }

    if (!inAdmonition) processedLines.push(line)
  }

  if (inAdmonition) {
    emitBlockquote(processedLines, admonitionType, admonitionContent)
  }

  // Keep blank quote lines (`> `) — they preserve multi-paragraph notes
  return processedLines.join('\n')
}

module.exports = { normalizeAdmonitionsToBlockquotes }
