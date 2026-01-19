'use strict'

const { spawn } = require('child_process')
const { writeFileSync, unlinkSync, readFileSync } = require('fs')
const { tmpdir } = require('os')
const path = require('path')
const { randomUUID } = require('crypto')
const downdoc = require('../../../../lib/index.js')
const { adaptForBookStack } = require('../../../shared/adapters/bookstack-adapter.js')

/**
 * Converts AsciiDoc content to Markdown using the downdoc CLI tool
 * 
 * @param {string} asciidoc - The AsciiDoc content to convert
 * @param {"default" | "bookstack"} mode - Conversion mode: "default" for standard Markdown, "bookstack" for Parsedown-compatible Markdown
 * @returns {Promise<string>} Promise that resolves to the converted Markdown
 * @throws {Error} If downdoc execution fails or returns non-zero exit code
 * 
 * @example
 * const markdown = await convertAsciiDoc('= Title\n\nContent', 'bookstack')
 */
/**
 * Basic cleanup function that fixes common downdoc issues
 * This is always applied, regardless of mode
 */
function basicCleanup(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return markdown
  }

  let result = markdown

  // Fix horizontal rules: downdoc sometimes converts --- to "- --"
  result = result.replace(/^-\s*--\s*$/gm, '---')
  result = result.replace(/^-\s*--$/gm, '---')
  result = result.replace(/^-\s+--\s*$/gm, '---')
  result = result.replace(/^-\s*--\s+$/gm, '---')
  
  // Line-by-line pass for horizontal rules
  const lines = result.split('\n')
  const fixedLines = lines.map(line => {
    const trimmed = line.trim()
    if (trimmed === '- --' || trimmed === '-  --' || /^-\s*--\s*$/.test(trimmed)) {
      const indent = line.match(/^(\s*)/)[1]
      return indent + '---'
    }
    return line
  })
  result = fixedLines.join('\n')

  // Remove trailing whitespace
  result = result.replace(/[ \t]+$/gm, '')

  // Ensure file ends with a single newline
  result = result.trimEnd() + '\n'

  return result
}

async function convertAsciiDoc(asciidoc, mode = 'default') {
  if (!asciidoc || typeof asciidoc !== 'string') {
    throw new Error('AsciiDoc content must be a non-empty string')
  }

  // Use downdoc directly with extensions for better performance
  // Use the parsedown extension when BookStack mode is enabled
  try {
    const options = {}
    
    if (mode === 'bookstack') {
      // Use the parsedown extension for BookStack compatibility
      options.extensions = ['parsedown']
    }
    
    // Convert AsciiDoc to Markdown using downdoc
    let markdown = downdoc(asciidoc, options)
    
    // Always apply basic cleanup (fixes common issues like "- --" -> "---")
    markdown = basicCleanup(markdown)
    
    // Apply full BookStack adapter for post-processing if in bookstack mode
    if (mode === 'bookstack') {
      markdown = adaptForBookStack(markdown)
    }
    
    return markdown
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`)
  }
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
  const admonitionEmojis = {
    '📝': 'note', '💡': 'tip', '⚠️': 'warning', '⚠': 'warning',
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
    
    // Check for admonition patterns
    const emojiMatch = line.match(/^\*\*([📝💡⚠️🔥❗⚠])\s+(\w+)\*\*\s*$/)
    const emojiMatchWithContent = line.match(/^\*\*([📝💡⚠️🔥❗⚠])\s+(\w+)\*\*\s+(.+)$/)
    const looseMatch = line.match(/^\*\*([^\*]+?)\s+(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\*\*\s*$/i)
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
  // Parsedown breaks if lists are too tight - ensure at least one space after marker
  // Also ensure empty line before lists if they follow paragraphs
  result = result.replace(/^(\s*)([-*+]|\d+\.)\s*([^\s].*)$/gm, (match, indent, marker, content) => {
    // Ensure at least one space after marker
    return indent + marker + ' ' + content
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

      // Handle code blocks
      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          // Opening code block
          inCodeBlock = true
          const langMatch = trimmed.match(/^```(\w+)?/)
          codeBlockLang = langMatch && langMatch[1] ? langMatch[1] : ''
          output.push('----')
          if (codeBlockLang) {
            output.push(`[source,${codeBlockLang}]`)
          }
          output.push('----')
        } else {
          // Closing code block
          inCodeBlock = false
          output.push('----')
          codeBlockLang = ''
        }
        continue
      }

      if (inCodeBlock) {
        // Preserve code block content as-is
        output.push(line)
        continue
      }

      // Handle headings (# Title -> = Title)
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const title = headingMatch[2]
        const asciidocLevel = '='.repeat(level)
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

      // Handle lists
      const listMatch = trimmed.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/)
      if (listMatch) {
        const indent = listMatch[1].length
        const marker = listMatch[2]
        const content = listMatch[3]
        const isOrdered = /^\d+\./.test(marker)
        
        // Determine list type and indentation level
        const currentListType = isOrdered ? 'ol' : 'ul'
        const currentIndent = Math.floor(indent / 2) // Approximate indent level
        
        if (!inList || listType !== currentListType || listIndent !== currentIndent) {
          // New list or list type change
          if (inList && output.length > 0 && output[output.length - 1] !== '') {
            output.push('')
          }
          inList = true
          listType = currentListType
          listIndent = currentIndent
        }
        
        // Process inline formatting in list content
        let processedContent = processInlineFormatting(content)
        
        // Add list item with proper indentation
        const indentStr = ' '.repeat(currentIndent * 2)
        if (isOrdered) {
          output.push(`${indentStr}. ${processedContent}`)
        } else {
          output.push(`${indentStr}* ${processedContent}`)
        }
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

      // Process inline formatting for regular lines
      let processedLine = processInlineFormatting(line)
      output.push(processedLine)
    }

    let result = output.join('\n')
    
    // Clean up excessive blank lines
    result = result.replace(/\n{3,}/g, '\n\n')
    
    // Ensure proper spacing around headings
    result = result.replace(/(^=+\s+[^\n]+)\n([^\n=])/gm, '$1\n\n$2')
    
    // Ensure file ends with a single newline
    result = result.trimEnd() + '\n'

    return result
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`)
  }
}

// Helper function to process inline formatting
function processInlineFormatting(text) {
  if (!text || typeof text !== 'string') {
    return text
  }

  let result = text

  // Handle images first (before links)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    return `image::${url}[${alt || ''}]`
  })

  // Handle links [text](url) -> link:url[text]
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    if (url.startsWith('#')) {
      // Internal link
      return `<<${url.substring(1)},${text}>>`
    }
    return `link:${url}[${text}]`
  })

  // Handle reference-style links [text][ref] -> link:ref[text]
  result = result.replace(/\[([^\]]+)\]\[([^\]]+)\]/g, (match, text, ref) => {
    return `link:${ref}[${text}]`
  })

  // Handle bold **text** -> *text* (must be before italic)
  result = result.replace(/\*\*([^*\n]+?)\*\*/g, '*$1*')
  result = result.replace(/__([^_\n]+?)__/g, '*$1*')

  // Handle italic *text* or _text_ -> _text_
  // Be careful not to break bold or code - use negative lookbehind/lookahead
  result = result.replace(/(?<!\*)\*([^*\n\s][^*\n]*?[^*\n\s])\*(?!\*)/g, '_$1_')
  result = result.replace(/(?<!_)_([^_\n\s][^_\n]*?[^_\n\s])_(?!_)/g, '_$1_')

  // Handle strikethrough ~~text~~ -> [line-through]#text#
  result = result.replace(/~~([^~]+?)~~/g, '[line-through]#$1#')

  return result
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

  return new Promise((resolve, reject) => {
    const tempInput = path.join(tmpdir(), `pandoc-input-${randomUUID()}.adoc`)
    const tempOutput = path.join(tmpdir(), `pandoc-output-${randomUUID()}.md`)

    try {
      // Write input to temporary file
      writeFileSync(tempInput, asciidoc, 'utf-8')

      // Run Pandoc: asciidoc -> markdown
      const pandoc = spawn('pandoc', [
        '-f', 'asciidoc',
        '-t', 'markdown',
        '-o', tempOutput,
        tempInput
      ])

      let stderr = ''

      pandoc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      pandoc.on('close', (code) => {
        try {
          if (code !== 0) {
            // Clean up temp files
            try { unlinkSync(tempInput) } catch {}
            try { unlinkSync(tempOutput) } catch {}
            reject(new Error(`Pandoc conversion failed with code ${code}: ${stderr}`))
            return
          }

          // Read output
          const markdown = readFileSync(tempOutput, 'utf-8')

          // Clean up temp files
          unlinkSync(tempInput)
          unlinkSync(tempOutput)

          // Apply basic cleanup
          const cleaned = basicCleanup(markdown)
          resolve(cleaned)
        } catch (error) {
          // Clean up temp files on error
          try { unlinkSync(tempInput) } catch {}
          try { unlinkSync(tempOutput) } catch {}
          reject(error)
        }
      })

      pandoc.on('error', (error) => {
        // Clean up temp files on error
        try { unlinkSync(tempInput) } catch {}
        try { unlinkSync(tempOutput) } catch {}
        reject(new Error(`Failed to execute Pandoc: ${error.message}`))
      })
    } catch (error) {
      // Clean up temp files on error
      try { unlinkSync(tempInput) } catch {}
      try { unlinkSync(tempOutput) } catch {}
      reject(error)
    }
  })
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

  return new Promise((resolve, reject) => {
    const tempInput = path.join(tmpdir(), `pandoc-input-${randomUUID()}.md`)
    const tempOutput = path.join(tmpdir(), `pandoc-output-${randomUUID()}.adoc`)

    try {
      // Write input to temporary file
      writeFileSync(tempInput, markdown, 'utf-8')

      // Run Pandoc: markdown -> asciidoc
      const pandoc = spawn('pandoc', [
        '-f', 'markdown',
        '-t', 'asciidoc',
        '-o', tempOutput,
        tempInput
      ])

      let stderr = ''

      pandoc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      pandoc.on('close', (code) => {
        try {
          if (code !== 0) {
            // Clean up temp files
            try { unlinkSync(tempInput) } catch {}
            try { unlinkSync(tempOutput) } catch {}
            reject(new Error(`Pandoc conversion failed with code ${code}: ${stderr}`))
            return
          }

          // Read output
          const asciidoc = readFileSync(tempOutput, 'utf-8')

          // Clean up temp files
          unlinkSync(tempInput)
          unlinkSync(tempOutput)

          // Clean up excessive blank lines
          const cleaned = asciidoc.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
          resolve(cleaned)
        } catch (error) {
          // Clean up temp files on error
          try { unlinkSync(tempInput) } catch {}
          try { unlinkSync(tempOutput) } catch {}
          reject(error)
        }
      })

      pandoc.on('error', (error) => {
        // Clean up temp files on error
        try { unlinkSync(tempInput) } catch {}
        try { unlinkSync(tempOutput) } catch {}
        reject(new Error(`Failed to execute Pandoc: ${error.message}`))
      })
    } catch (error) {
      // Clean up temp files on error
      try { unlinkSync(tempInput) } catch {}
      try { unlinkSync(tempOutput) } catch {}
      reject(error)
    }
  })
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

  return new Promise((resolve, reject) => {
    // Determine source file extension
    const sourceExt = normalizedFrom === 'asciidoc' ? 'adoc' : (normalizedFrom === 'txt' ? 'txt' : normalizedFrom)
    const targetExt = normalizedTo === 'asciidoc' ? 'adoc' : (normalizedTo === 'txt' ? 'txt' : normalizedTo)
    
    const tempInput = path.join(tmpdir(), `pandoc-input-${randomUUID()}.${sourceExt}`)
    const tempOutput = path.join(tmpdir(), `pandoc-output-${randomUUID()}.${targetExt}`)

    try {
      // Write input to temporary file
      writeFileSync(tempInput, text, 'utf-8')

      // Run Pandoc: fromFormat -> toFormat (use mapped Pandoc formats)
      const pandoc = spawn('pandoc', [
        '-f', pandocFrom,
        '-t', pandocTo,
        '-o', tempOutput,
        tempInput
      ])

      let stderr = ''

      pandoc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      pandoc.on('close', (code) => {
        try {
          if (code !== 0) {
            // Clean up temp files
            try { unlinkSync(tempInput) } catch {}
            try { unlinkSync(tempOutput) } catch {}
            reject(new Error(`Pandoc conversion failed with code ${code}: ${stderr}`))
            return
          }

          // Read output
          const result = readFileSync(tempOutput, 'utf-8')

          // Clean up temp files
          unlinkSync(tempInput)
          unlinkSync(tempOutput)

          // Apply basic cleanup for text-based formats
          if (['markdown', 'asciidoc', 'rst', 'txt'].includes(normalizedTo)) {
            const cleaned = result.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
            resolve(cleaned)
          } else {
            resolve(result)
          }
        } catch (error) {
          // Clean up temp files on error
          try { unlinkSync(tempInput) } catch {}
          try { unlinkSync(tempOutput) } catch {}
          reject(error)
        }
      })

      pandoc.on('error', (error) => {
        // Clean up temp files on error
        try { unlinkSync(tempInput) } catch {}
        try { unlinkSync(tempOutput) } catch {}
        reject(new Error(`Failed to execute Pandoc: ${error.message}`))
      })
    } catch (error) {
      // Clean up temp files on error
      try { unlinkSync(tempInput) } catch {}
      try { unlinkSync(tempOutput) } catch {}
      reject(error)
    }
  })
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
  convertMarkdownWithPandoc,
  convertHtmlWithPandoc,
  convertWithPandoc,
  text2markdown
}

