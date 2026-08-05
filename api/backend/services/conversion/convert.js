'use strict'

const { mkdir, writeFile, readFile, rm } = require('fs/promises')
const { tmpdir } = require('os')
const path = require('path')
const { randomUUID } = require('crypto')
const downdoc = require('../../../../lib/index.js')
const {
  adaptForBookStack,
  normalizeAdmonitionsToBlockquotes,
} = require('../../../shared/adapters/bookstack-adapter.js')
const {
  normalizePandocMarkdownAdmonitions,
  extractMarkdownAdmonitions,
  processInlineFormattingSafe,
  prepareAsciiDocForDowndoc,
  finalizeDowndocMarkdown,
  finalizePandocAsciiDoc,
  normalizeDefinitionLists,
} = require('./conversion-precision.js')
const { safeSpawn } = require('../../../../lib/security/safe-spawn.js')
const { isSecurityError, SECURITY_ERROR_CODES } = require('../../../../lib/errors/security-errors.js')
const { getConversionTimeoutMs, getMaxInputSizeBytes } = require('../config/conversion-limits.js')
const { convertViaServer } = require('./pandoc-server.js')

/**
 * Runs Pandoc fully in memory: input piped to stdin, output read from stdout.
 * No temp directory/file round-trip (major win for large documents).
 *
 * Tries the persistent pandoc server first (no process startup cost) and
 * falls back to a one-shot CLI invocation when the server is unavailable.
 *
 * @param {string} from - Pandoc input format
 * @param {string} to - Pandoc output format
 * @param {string} input - Document content
 * @returns {Promise<string>} Converted content
 */
async function runPandocInMemory(from, to, input) {
  const viaServer = await convertViaServer(from, to, input)
  if (viaServer !== null) {
    return viaServer
  }

  const result = await safeSpawn('pandoc', ['-f', from, '-t', to], {
    timeoutMs: getConversionTimeoutMs(),
    stdinData: input,
    // Converted output can be larger than the input (markup expansion)
    maxOutputBytes: Math.max(4 * getMaxInputSizeBytes(), 16 * 1024 * 1024)
  })
  if (result.code !== 0) {
    throw new Error('Pandoc conversion failed')
  }
  // Windows CLI emits CRLF while the pandoc server emits LF: normalize so
  // both paths (and both OSes) produce byte-identical output.
  return result.stdout.replace(/\r\n/g, '\n')
}

/**
 * Converts AsciiDoc content to Markdown. Tries downdoc first; on failure falls back to Pandoc.
 * See convertAsciiDoc() implementation below.
 */
/**
 * Basic cleanup function that fixes common downdoc issues
 * This is always applied, regardless of mode
 */
function basicCleanup(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return markdown
  }

  // Single pass over the document: trailing whitespace removal and
  // horizontal-rule fix ("- --" produced by downdoc → "---") per line.
  const lines = markdown.split('\n')
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/[ \t]+$/, '')
    const trimmed = line.trim()
    if (/^-\s*--$/.test(trimmed)) {
      line = line.match(/^(\s*)/)[1] + '---'
    }
    lines[i] = line
  }

  // Ensure file ends with a single newline
  return lines.join('\n').trimEnd() + '\n'
}

/**
 * Removes the :experimental: line from the AsciiDoc header (before first title).
 * No :toc: or any other attribute is added. No side effects.
 *
 * @param {string} asciidoc - AsciiDoc content
 * @returns {string} AsciiDoc content with :experimental: line removed from header
 */
function removeExperimentalTag(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') return asciidoc
  const lines = asciidoc.split('\n')
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (/^=+\s+/.test(trimmed)) {
      result.push(line)
      for (let j = i + 1; j < lines.length; j++) result.push(lines[j])
      return result.join('\n')
    }
    if (/^:experimental:\s*$/i.test(trimmed)) continue
    result.push(line)
  }
  return result.join('\n')
}

/**
 * Normalizes AsciiDoc input before conversion: LF line endings, no trailing spaces
 * per line, exactly one trailing newline. Deterministic and pure.
 *
 * @param {string} asciidoc - AsciiDoc content
 * @returns {string} Normalized AsciiDoc
 */
function normalizeAsciiDocInput(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') return asciidoc
  const lf = asciidoc.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const trimmedLines = lf.split('\n').map(line => line.replace(/[ \t]+$/, ''))
  return trimmedLines.join('\n').trimEnd() + '\n'
}

/**
 * Converts AsciiDoc to Markdown. Tries downdoc first; on failure falls back to Pandoc.
 * Returns { markdown, engineUsed, fallbackReason? }.
 *
 * @param {string} asciidoc - AsciiDoc content
 * @param {"default" | "bookstack"} mode - Conversion mode
 * @returns {Promise<{ markdown: string, engineUsed: "downdoc"|"pandoc", fallbackReason?: string }>}
 */
async function convertAsciiDoc(asciidoc, mode = 'default') {
  if (!asciidoc || typeof asciidoc !== 'string') {
    throw new Error('AsciiDoc content must be a non-empty string')
  }

  asciidoc = removeExperimentalTag(asciidoc)
  asciidoc = normalizeAsciiDocInput(asciidoc)

  let markdown
  let engineUsed = 'downdoc'
  let fallbackReason = null

  // Cell spans (2+|) are unreliable in downdoc → prefer Pandoc
  const preferPandoc = /\d+\+\|/.test(asciidoc)

  try {
    if (preferPandoc) {
      throw new Error('complex table cell spans')
    }
    const options = {}
    if (mode === 'bookstack') options.extensions = ['parsedown']
    const prepared = prepareAsciiDocForDowndoc(asciidoc)
    markdown = downdoc(prepared, options)
    if (!markdown || typeof markdown !== 'string' || markdown === prepared || markdown === asciidoc) {
      throw new Error(markdown === prepared || markdown === asciidoc ? 'output identical to input' : 'downdoc returned invalid result')
    }
    markdown = finalizeDowndocMarkdown(markdown)
  } catch (err) {
    fallbackReason = err && err.message ? err.message : 'downdoc failed'
    markdown = await convertAsciiDocWithPandoc(asciidoc)
    if (!markdown || typeof markdown !== 'string' || markdown.trim().length === 0 || markdown === asciidoc) {
      throw new Error(`Conversion failed (downdoc: ${fallbackReason}; pandoc: invalid or identical output)`)
    }
    engineUsed = 'pandoc'
  }

  markdown = basicCleanup(markdown)
  markdown = normalizeDefinitionLists(markdown)
  // Toujours normaliser les notes/admonitions (évite le HTML <dl> brut dans l'UI)
  if (mode === 'bookstack') markdown = adaptForBookStack(markdown)
  else markdown = normalizeAdmonitionsToBlockquotes(markdown)

  return { markdown, engineUsed, fallbackReason: fallbackReason || undefined }
}

/**
 * Normalizes Markdown output to be compatible with Parsedown (BookStack's Markdown parser)
 * 
 * Parsedown has strict requirements:
 * - Headings must have empty lines after them
 * - List elements need proper spacing
 * - Tabs should be replaced with spaces
 * 
 * @param {string} markdown - Raw Markdown from downdoc
 * @returns {string} Normalized Markdown compatible with Parsedown
 */
function normalizeForBookStack(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return markdown
  }

  let result = markdown

  // 1. Replace tab characters with 4 spaces (Parsedown requirement)
  result = result.replace(/\t/g, '    ')

  // 2. Process line by line to handle headings, code blocks, and admonitions
  const lines = result.split('\n')
  const processedLines = []
  let inCodeBlock = false
  let codeBlockLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLine = i < lines.length - 1 ? lines[i + 1] : ''
    const prevLine = i > 0 ? lines[i - 1] : ''

    // Track code blocks - don't modify content inside code blocks
    if (line.match(/^```/)) {
      const wasInCodeBlock = inCodeBlock
      inCodeBlock = !inCodeBlock
      
      if (inCodeBlock) {
        // Opening code block - clean up language identifier
        const langMatch = line.match(/^```(\w+)/)
        if (langMatch) {
          // Remove any options or attributes from language
          const cleanLang = langMatch[1].toLowerCase().split(/[\s,=]/)[0]
          // Map to Parsedown-compatible language names
          const langMap = {
            'bash': 'bash', 'sh': 'bash', 'shell': 'bash', 'console': 'bash',
            'javascript': 'javascript', 'js': 'javascript',
            'python': 'python', 'py': 'python',
            'java': 'java', 'cpp': 'cpp', 'c++': 'cpp', 'c': 'c',
            'html': 'html', 'css': 'css', 'json': 'json', 'xml': 'xml',
            'yaml': 'yaml', 'yml': 'yaml', 'sql': 'sql', 'php': 'php'
          }
          codeBlockLang = langMap[cleanLang] || cleanLang
          processedLines.push('```' + codeBlockLang)
        } else {
          processedLines.push('```')
        }
        // Ensure blank line before code block
        if (prevLine.trim() && !prevLine.match(/^```/)) {
          processedLines.splice(processedLines.length - 1, 0, '')
        }
      } else {
        // Closing code block
        processedLines.push('```')
        // Ensure blank line after code block
        if (nextLine.trim() && !nextLine.match(/^```/) && !nextLine.match(/^#+\s+/)) {
          processedLines.push('')
        }
      }
      continue
    }

    if (inCodeBlock) {
      // Preserve code block content as-is, but remove trailing spaces
      processedLines.push(line.replace(/[ \t]+$/, ''))
      continue
    }

    // Check if current line is a heading
    if (line.match(/^#{1,6}\s+/)) {
      // Ensure blank line before heading (unless it's the first line or already has one)
      if (prevLine.trim() && !prevLine.match(/^#{1,6}\s+/) && !prevLine.match(/^```/)) {
        processedLines.push('')
      }
      processedLines.push(line.trim())
      // Ensure empty line after heading if next line is not empty and not another heading
      if (nextLine.trim() && !nextLine.match(/^#{1,6}\s+/) && !nextLine.match(/^```/)) {
        processedLines.push('')
      }
      continue
    }

    // Regular line
    processedLines.push(line)
  }

  result = processedLines.join('\n')
  
  // 2b. Convert admonitions to HTML (Parsedown compatible)
  // Handle format: **EMOJI TYPE** (standalone or with content)
  // Strip downdoc hard-break "\" after admonition labels first.
  result = result.replace(/^(\*\*[^\n*]+?\*\*)\s*\\$/gm, '$1')
  const admonitionEmojis = {
    '📝': 'note', '📌': 'note', '💡': 'tip', '⚠️': 'warning', '⚠': 'warning',
    '🔥': 'caution', '❗': 'important'
  }
  
  const admonitionLines = result.split('\n')
  const admonitionProcessed = []
  let inAdmonition = false
  let admonitionType = ''
  let admonitionContent = []
  let admonitionTypeLower = ''
  
  for (let i = 0; i < admonitionLines.length; i++) {
    const line = admonitionLines[i]
    const nextLine = i < admonitionLines.length - 1 ? admonitionLines[i + 1] : ''
    
    // Check for admonition patterns (optional trailing \)
    const emojiMatch = line.match(/^\*\*([📝💡⚠️🔥❗⚠📌])\s+(\w+)\*\*\s*\\?\s*$/)
    const emojiMatchWithContent = line.match(/^\*\*([📝💡⚠️🔥❗⚠📌])\s+(\w+)\*\*\s+(.+)$/)
    const looseMatch = line.match(/^\*\*([^\*]+?)\s+(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\*\*\s*\\?\s*$/i)
    const looseMatchWithContent = line.match(/^\*\*([^\*]+?)\s+(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\*\*\s+(.+)$/i)
    
    if (emojiMatch || emojiMatchWithContent || looseMatch || looseMatchWithContent) {
      // Close previous admonition if any
      if (inAdmonition) {
        admonitionProcessed.push(`<div class="alert alert-${admonitionTypeLower}">`)
        admonitionProcessed.push(`<strong>${admonitionType}:</strong> ${admonitionContent.join(' ')}`)
        admonitionProcessed.push('</div>')
        admonitionProcessed.push('')
      }
      
      // Start new admonition
      inAdmonition = true
      admonitionContent = []
      
      if (emojiMatch) {
        const emoji = emojiMatch[1]
        admonitionType = emojiMatch[2]
        admonitionTypeLower = admonitionEmojis[emoji] || admonitionType.toLowerCase()
      } else if (emojiMatchWithContent) {
        const emoji = emojiMatchWithContent[1]
        admonitionType = emojiMatchWithContent[2]
        admonitionTypeLower = admonitionEmojis[emoji] || admonitionType.toLowerCase()
        admonitionContent.push(emojiMatchWithContent[3].trim())
      } else if (looseMatch) {
        admonitionType = looseMatch[2]
        admonitionTypeLower = admonitionType.toLowerCase()
      } else if (looseMatchWithContent) {
        admonitionType = looseMatchWithContent[2]
        admonitionTypeLower = admonitionType.toLowerCase()
        admonitionContent.push(looseMatchWithContent[3].trim())
      }
      
      // Check if next line has content
      if (nextLine.trim() && !nextLine.match(/^[#>#=-]|^```|^\|/) && !nextLine.match(/^\*\*/)) {
        continue // Content on next line
      } else {
        // Close immediately if no content
        if (admonitionContent.length > 0) {
          admonitionProcessed.push(`<div class="alert alert-${admonitionTypeLower}">`)
          admonitionProcessed.push(`<strong>${admonitionType}:</strong> ${admonitionContent.join(' ')}`)
          admonitionProcessed.push('</div>')
          admonitionProcessed.push('')
        }
        inAdmonition = false
        admonitionType = ''
        admonitionContent = []
      }
      continue
    }
    
    // Continue admonition content
    if (inAdmonition && line.trim() && !line.match(/^[#>#=-]|^```|^\|/) && !line.match(/^\*\*/)) {
      admonitionContent.push(line.trim())
      continue
    }
    
    // Close admonition if we hit a new block
    if (inAdmonition && (line.trim() === '' || line.match(/^[#=-]|^```|^\|/))) {
      admonitionProcessed.push(`<div class="alert alert-${admonitionTypeLower}">`)
      admonitionProcessed.push(`<strong>${admonitionType}:</strong> ${admonitionContent.join(' ')}`)
      admonitionProcessed.push('</div>')
      admonitionProcessed.push('')
      inAdmonition = false
      admonitionType = ''
      admonitionContent = []
    }
    
    admonitionProcessed.push(line)
  }
  
  // Close any remaining admonition
  if (inAdmonition) {
    admonitionProcessed.push(`<div class="alert alert-${admonitionTypeLower}">`)
    admonitionProcessed.push(`<strong>${admonitionType}:</strong> ${admonitionContent.join(' ')}`)
    admonitionProcessed.push('</div>')
    admonitionProcessed.push('')
  }
  
  result = admonitionProcessed.join('\n')

  // 3. Ensure proper spacing for list elements (-, +, *)
  // Require whitespace after marker so **bold** is never treated as a list item.
  result = result.replace(/^(\s*)([-*+]|\d+\.)\s+(.+)$/gm, (match, indent, marker, content) => {
    return indent + marker + ' ' + content.trim()
  })

  // Add empty line before lists that follow paragraphs (but not after headings)
  const listLines = result.split('\n')
  const listProcessed = []
  for (let i = 0; i < listLines.length; i++) {
    const line = listLines[i]
    const prevLine = i > 0 ? listLines[i - 1] : ''
    const nextLine = i < listLines.length - 1 ? listLines[i + 1] : ''

    // Check if current line is a list item
    if (line.match(/^(\s*)([-*+]|\d+\.)\s+/)) {
      // If previous line is not empty, not a heading, not a list, and not a code block
      if (prevLine.trim() && 
          !prevLine.match(/^#{1,6}\s+/) && 
          !prevLine.match(/^(\s*)([-*+]|\d+\.)\s+/) && 
          !prevLine.match(/^```/) &&
          !prevLine.match(/^$/)) {
        listProcessed.push('')
      }
    }

    listProcessed.push(line)
  }

  result = listProcessed.join('\n')

  // 4. Clean up excessive blank lines (more than 2 consecutive)
  // But preserve code blocks
  result = result.replace(/\n{4,}/g, '\n\n\n')

  // 5. Remove trailing whitespace from lines (except in code blocks)
  const finalLines = result.split('\n')
  const finalProcessed = []
  let inCodeBlockFinal = false

  for (const line of finalLines) {
    if (line.match(/^```/)) {
      inCodeBlockFinal = !inCodeBlockFinal
      finalProcessed.push(line)
      continue
    }

    if (inCodeBlockFinal) {
      // Preserve code block content
      finalProcessed.push(line)
    } else {
      // Remove trailing whitespace
      finalProcessed.push(line.replace(/[ \t]+$/, ''))
    }
  }

  result = finalProcessed.join('\n')

  // 6. Ensure file ends with a single newline
  result = result.trimEnd() + '\n'

  return result
}

/**
 * Converts Markdown content to AsciiDoc
 * 
 * @param {string} markdown - The Markdown content to convert
 * @returns {Promise<string>} Promise that resolves to the converted AsciiDoc
 * @throws {Error} If conversion fails
 * 
 * @example
 * const asciidoc = await convertMarkdown('# Title\n\nContent')
 */
function convertMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    throw new Error('Markdown content must be a non-empty string')
  }

  try {
    const lines = markdown.split('\n')
    const output = []
    let inCodeBlock = false
    let codeBlockLang = ''
    let inList = false
    let listType = '' // 'ul' or 'ol'
    let listIndent = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      const prevLine = i > 0 ? lines[i - 1] : ''
      const nextLine = i < lines.length - 1 ? lines[i + 1] : ''

      // Handle code blocks — AsciiDoc: [source,lang] then ---- … ----
      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          const langMatch = trimmed.match(/^```(\w+)?/)
          codeBlockLang = langMatch && langMatch[1] ? langMatch[1] : ''
          if (codeBlockLang) output.push(`[source,${codeBlockLang}]`)
          output.push('----')
        } else {
          inCodeBlock = false
          output.push('----')
          codeBlockLang = ''
        }
        continue
      }

      // Admonition blockquotes → AsciiDoc [NOTE]==== blocks
      if (/^>\s?\*\*(NOTE|TIP|WARNING|CAUTION|IMPORTANT):\*\*/i.test(trimmed)) {
        const quote = []
        let j = i
        while (j < lines.length && /^>\s?/.test(lines[j])) {
          const stripped = lines[j].replace(/^>\s?/, '')
          quote.push(stripped.trim() === '' ? '' : stripped)
          j++
        }
        const head = quote[0] || ''
        const hm = head.match(/^\*\*(NOTE|TIP|WARNING|CAUTION|IMPORTANT):\*\*\s*(.*)$/i)
        if (hm) {
          const type = hm[1].toUpperCase()
          const body = [hm[2] || '', ...quote.slice(1)]
          while (body.length && !String(body[body.length - 1]).trim()) body.pop()
          const converted = body.map((l) =>
            String(l).trim() === '' ? '' : processInlineFormattingSafe(String(l))
          )
          output.push(`[${type}]`, '====', ...converted, '====', '')
          i = j - 1
          inList = false
          continue
        }
      }

      if (inCodeBlock) {
        // Preserve code block content as-is
        output.push(line)
        continue
      }

      // GFM definition lists → Term:: def
      if (trimmed && !trimmed.startsWith(':') && /^:\s+\S/.test(nextLine)) {
        const defMatch = nextLine.match(/^:\s+(.*)$/)
        if (defMatch) {
          output.push(`${trimmed}:: ${defMatch[1]}`)
          i++
          inList = false
          continue
        }
      }

      // Handle headings (# Title -> = Title) — keep {#id} as [[id]] above title
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+?)(?:\s+\{#([A-Za-z0-9_.:-]+)\})?\s*$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const title = headingMatch[2]
        const anchor = headingMatch[3]
        const asciidocLevel = '='.repeat(level)
        if (anchor) output.push(`[[${anchor}]]`)
        output.push(`${asciidocLevel} ${title}`)
        inList = false
        continue
      }

      // Handle horizontal rules (--- -> '''')
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        output.push("'''")
        inList = false
        continue
      }

      // Handle lists (match on raw line so indent depth is preserved)
      const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/)
      if (listMatch) {
        const indent = listMatch[1].length
        const marker = listMatch[2]
        const content = listMatch[3]
        const isOrdered = /^\d+\./.test(marker)
        const currentListType = isOrdered ? 'ol' : 'ul'
        const currentIndent = Math.floor(indent / 2)

        if (!inList || listType !== currentListType || listIndent !== currentIndent) {
          if (inList && output.length > 0 && output[output.length - 1] !== '') {
            output.push('')
          }
          inList = true
          listType = currentListType
          listIndent = currentIndent
        }

        const processedContent = processInlineFormattingSafe(content)
        const depth = Math.max(1, currentIndent + 1)
        const adocMarker = (isOrdered ? '.' : '*').repeat(depth)
        output.push(`${adocMarker} ${processedContent}`)
        continue
      }

      // End of list
      if (inList && trimmed === '') {
        if (nextLine !== '' && !nextLine.match(/^(\s*)([-*+]|\d+\.)\s+/)) {
          inList = false
          listType = ''
          listIndent = 0
        }
      }

      output.push(processInlineFormattingSafe(line))
    }

    let result = output.join('\n')
    result = result.replace(/\n{3,}/g, '\n\n')
    result = result.replace(/(^=+\s+[^\n]+)\n([^\n=])/gm, '$1\n\n$2')
    return result.trimEnd() + '\n'
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`)
  }
}

/** @deprecated use processInlineFormattingSafe — kept for any external require */
function processInlineFormatting(text) {
  return processInlineFormattingSafe(text)
}

/**
 * Converts AsciiDoc content to Markdown using Pandoc
 * 
 * @param {string} asciidoc - The AsciiDoc content to convert
 * @returns {Promise<string>} Promise that resolves to the converted Markdown
 * @throws {Error} If Pandoc execution fails
 */
async function convertAsciiDocWithPandoc(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') {
    throw new Error('AsciiDoc content must be a non-empty string')
  }

  try {
    const stdout = await runPandocInMemory('asciidoc', 'markdown', asciidoc)
    let markdown = basicCleanup(stdout)
    markdown = normalizePandocMarkdownAdmonitions(markdown)
    markdown = normalizeDefinitionLists(markdown)
    markdown = normalizeAdmonitionsToBlockquotes(markdown)
    return markdown
  } catch (error) {
    if (isSecurityError(error) && error.code === SECURITY_ERROR_CODES.CONVERSION_TIMEOUT) {
      throw new Error('Pandoc conversion timed out')
    }
    if (error && error.message === 'Pandoc conversion failed') {
      throw error
    }
    throw new Error('Failed to execute Pandoc conversion')
  }
}

/**
 * Converts Markdown content to AsciiDoc using Pandoc
 * 
 * @param {string} markdown - The Markdown content to convert
 * @returns {Promise<string>} Promise that resolves to the converted AsciiDoc
 * @throws {Error} If Pandoc execution fails
 */
async function convertMarkdownWithPandoc(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    throw new Error('Markdown content must be a non-empty string')
  }

  try {
    const extracted = extractMarkdownAdmonitions(markdown.replace(/\r\n/g, '\n'))
    const stdout = await runPandocInMemory('markdown', 'asciidoc', extracted.markdown)
    return finalizePandocAsciiDoc(stdout, extracted.blocks)
  } catch (error) {
    if (isSecurityError(error) && error.code === SECURITY_ERROR_CODES.CONVERSION_TIMEOUT) {
      throw new Error('Pandoc conversion timed out', { cause: error })
    }
    if (error && error.message === 'Pandoc conversion failed') {
      throw error
    }
    throw new Error('Failed to execute Pandoc conversion', { cause: error })
  }
}

/**
 * Converts content from one format to another using Pandoc (fonction générique)
 * 
 * @param {string} text - The content to convert
 * @param {string} fromFormat - The source format (html, txt, markdown, asciidoc, etc.)
 * @param {string} toFormat - The target format (markdown, asciidoc, etc.)
 * @returns {Promise<string>} Promise that resolves to the converted content
 * @throws {Error} If Pandoc execution fails
 */
async function convertWithPandoc(text, fromFormat, toFormat) {
  if (!text || typeof text !== 'string') {
    throw new Error('Content must be a non-empty string')
  }

  if (!fromFormat || typeof fromFormat !== 'string') {
    throw new Error('Source format must be specified')
  }

  if (!toFormat || typeof toFormat !== 'string') {
    throw new Error('Target format must be specified')
  }

  // List of formats supported by Pandoc
  const supportedFormats = ['markdown', 'asciidoc', 'docx', 'pdf', 'epub', 'rst', 'tex', 'latex', 'html', 'yaml', 'json', 'txt']
  
  // Normalize formats
  const normalizedFrom = fromFormat.toLowerCase()
  const normalizedTo = toFormat.toLowerCase()

  // Map formats to Pandoc names
  // Note: "plain" is output format only, not input
  // For txt, we use "markdown" because Pandoc can interpret plain text as Markdown
  const pandocInputFormatMap = {
    'txt': 'markdown',
    'asciidoc': 'asciidoc',
    'markdown': 'markdown',
    'html': 'html',
    'pdf': 'pdf',
    'yaml': 'yaml',
    'json': 'json',
    'docx': 'docx',
    'epub': 'epub',
    'rst': 'rst',
    'tex': 'latex',
    'latex': 'latex'
  }

  const pandocOutputFormatMap = {
    'txt': 'plain',
    'asciidoc': 'asciidoc',
    'markdown': 'markdown',
    'html': 'html',
    'pdf': 'pdf',
    'yaml': 'yaml',
    'json': 'json',
    'docx': 'docx',
    'epub': 'epub',
    'rst': 'rst',
    'tex': 'latex',
    'latex': 'latex'
  }

  // Get Pandoc formats (input and output separated)
  const pandocFrom = pandocInputFormatMap[normalizedFrom] || normalizedFrom
  const pandocTo = pandocOutputFormatMap[normalizedTo] || normalizedTo

  // Check that formats are supported (check original formats)
  if (!supportedFormats.includes(normalizedFrom)) {
    throw new Error(`Unsupported source format: ${fromFormat}. Supported formats: ${supportedFormats.join(', ')}`)
  }
  
  if (!supportedFormats.includes(normalizedTo)) {
    throw new Error(`Unsupported output format: ${toFormat}. Supported formats: ${supportedFormats.join(', ')}`)
  }

  // Binary output formats need a real output file (Pandoc refuses stdout);
  // text formats go through stdin/stdout with no temp files at all.
  const binaryOutputFormats = ['pdf', 'docx', 'epub']
  if (!binaryOutputFormats.includes(normalizedTo)) {
    try {
      let input = text
      let admonBlocks = null
      // Protect Markdown admonitions before Pandoc MD→AsciiDoc
      if (pandocFrom === 'markdown' && pandocTo === 'asciidoc') {
        const extracted = extractMarkdownAdmonitions(input.replace(/\r\n/g, '\n'))
        input = extracted.markdown
        admonBlocks = extracted.blocks
      }

      let stdout = await runPandocInMemory(pandocFrom, pandocTo, input)

      if (pandocFrom === 'asciidoc' && pandocTo === 'markdown') {
        stdout = basicCleanup(stdout)
        stdout = normalizePandocMarkdownAdmonitions(stdout)
        stdout = normalizeDefinitionLists(stdout)
        stdout = normalizeAdmonitionsToBlockquotes(stdout)
      } else if (pandocFrom === 'markdown' && pandocTo === 'asciidoc') {
        return finalizePandocAsciiDoc(stdout, admonBlocks)
      }

      if (['markdown', 'asciidoc', 'rst', 'txt'].includes(normalizedTo)) {
        return stdout.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
      }
      return stdout
    } catch (error) {
      if (isSecurityError(error) && error.code === SECURITY_ERROR_CODES.CONVERSION_TIMEOUT) {
        throw new Error('Pandoc conversion timed out')
      }
      if (error && error.message === 'Pandoc conversion failed') {
        throw error
      }
      throw new Error('Failed to execute Pandoc conversion')
    }
  }

  const tempDir = path.join(tmpdir(), `ascend-pandoc-${randomUUID()}`)
  const inputFile = path.join(tempDir, `input.${normalizedFrom === 'asciidoc' ? 'adoc' : normalizedFrom}`)
  const outputFile = path.join(tempDir, `output.${normalizedTo === 'asciidoc' ? 'adoc' : normalizedTo}`)
  try {
    await mkdir(tempDir, { recursive: true })
    await writeFile(inputFile, text, 'utf8')
    const result = await safeSpawn('pandoc', ['-f', pandocFrom, '-t', pandocTo, '-o', outputFile, inputFile], {
      cwd: tempDir,
      timeoutMs: getConversionTimeoutMs()
    })
    if (result.code !== 0) {
      throw new Error('Pandoc conversion failed')
    }
    const stdout = await readFile(outputFile, 'utf8')
    return stdout
  } catch (error) {
    if (isSecurityError(error) && error.code === SECURITY_ERROR_CODES.CONVERSION_TIMEOUT) {
      throw new Error('Pandoc conversion timed out')
    }
    throw new Error('Failed to execute Pandoc conversion')
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Converts HTML content to other formats using Pandoc
 * 
 * @param {string} html - The HTML content to convert
 * @param {string} toFormat - The target format (markdown, asciidoc, etc.)
 * @returns {Promise<string>} Promise that resolves to the converted content
 * @throws {Error} If Pandoc execution fails
 */
async function convertHtmlWithPandoc(html, toFormat = 'markdown') {
  return convertWithPandoc(html, 'html', toFormat)
}

/**
 * Converts plain text to Markdown format
 * Détecte automatiquement les titres, listes, paragraphes, etc.
 * 
 * @param {string} text - The plain text content to convert
 * @returns {string} The converted Markdown content
 */
function text2markdown(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text content must be a non-empty string')
  }

  const lines = text.split('\n')
  const markdown = []
  let inList = false
  let listType = '' // 'ul' or 'ol'
  let inCodeBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const nextLine = i < lines.length - 1 ? lines[i + 1] : ''
    const prevLine = i > 0 ? lines[i - 1] : ''

    // Detect code blocks (lines starting with 4 spaces or a tab)
    if (trimmed === '' && prevLine.trim() !== '' && nextLine.match(/^    |^\t/)) {
      if (!inCodeBlock) {
        markdown.push('```')
        inCodeBlock = true
      }
      markdown.push('')
      continue
    }

    if (inCodeBlock) {
      if (trimmed === '' && !nextLine.match(/^    |^\t/) && nextLine.trim() !== '') {
        markdown.push('```')
        markdown.push('')
        inCodeBlock = false
        continue
      }
      markdown.push(line)
      continue
    }

    // Detect headings (uppercase lines or with special characters)
    if (trimmed.length > 0 && trimmed.length < 100) {
      // Level 1 heading: uppercase line followed by empty line or separator line
      if (trimmed === trimmed.toUpperCase() && trimmed.match(/^[A-Z\s]+$/) && trimmed.length > 3) {
        if (nextLine.trim() === '' || nextLine.match(/^[=-]+$/)) {
          markdown.push(`# ${trimmed}`)
          markdown.push('')
          inList = false
          continue
        }
      }
      
      // Level 2 heading: line followed by ===
      if (nextLine.match(/^=+$/)) {
        markdown.push(`## ${trimmed}`)
        markdown.push('')
        inList = false
        i++ // Skip separator line
        continue
      }
      
      // Level 3 heading: line followed by ---
      if (nextLine.match(/^-+$/)) {
        markdown.push(`### ${trimmed}`)
        markdown.push('')
        inList = false
        i++ // Skip separator line
        continue
      }
    }

    // Detect lists
    const listMatch = trimmed.match(/^(\d+[.)]|\*|\-|\+)\s+(.+)$/)
    if (listMatch) {
      const marker = listMatch[1]
      const content = listMatch[2]
      const isOrdered = /^\d+[.)]/.test(marker)
      
      if (!inList || (isOrdered && listType !== 'ol') || (!isOrdered && listType !== 'ul')) {
        if (inList) {
          markdown.push('')
        }
        inList = true
        listType = isOrdered ? 'ol' : 'ul'
      }
      
      markdown.push(`${isOrdered ? '1.' : '-'} ${content}`)
      continue
    }

    // End of list
    if (inList && trimmed === '') {
      if (nextLine.trim() === '' || (!nextLine.match(/^(\d+[.)]|\*|\-|\+)\s+/) && nextLine.trim() !== '')) {
        markdown.push('')
        inList = false
        listType = ''
      }
    }

    // Detect horizontal separators
    if (trimmed.match(/^[-*_]{3,}$/)) {
      markdown.push('---')
      markdown.push('')
      inList = false
      continue
    }

    // Normal paragraph
    if (trimmed !== '') {
      // Detect simple links (http://, https://, www.)
      let processedLine = trimmed.replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/g, (url) => {
        const displayUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, 'www.')
        return `[${displayUrl}](${url.startsWith('http') ? url : 'https://' + url})`
      })
      
      // Detect emails
      processedLine = processedLine.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (email) => {
        return `[${email}](mailto:${email})`
      })
      
      markdown.push(processedLine)
    } else {
      // Ligne vide
      if (prevLine.trim() !== '' && nextLine.trim() !== '') {
        markdown.push('')
      }
    }
  }

  // Fermer la liste si elle est encore ouverte
  if (inList) {
    markdown.push('')
  }

  // Fermer le bloc de code si ouvert
  if (inCodeBlock) {
    markdown.push('```')
  }

  let result = markdown.join('\n')
  
  // Nettoyer les lignes vides multiples
  result = result.replace(/\n{3,}/g, '\n\n')
  
  // S'assurer que le fichier se termine par une seule ligne vide
  result = result.trimEnd() + '\n'

  return result
}

module.exports = {
  convertAsciiDoc,
  convertMarkdown,
  normalizeForBookStack,
  convertAsciiDocWithPandoc,
  convertMarkdownWithPandoc,
  convertHtmlWithPandoc,
  convertWithPandoc,
  text2markdown,
  removeExperimentalTag,
  normalizeAsciiDocInput
}

