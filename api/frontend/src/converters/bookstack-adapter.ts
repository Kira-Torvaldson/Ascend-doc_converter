/// <reference types="vite/client" />
/**
 * Post-process Markdown output to make it compatible with BookStack/Parsedown
 * Parsedown is strict and doesn't support complex Markdown syntax
 * 
 * This function performs a comprehensive cleanup of AsciiDoc remnants and
 * ensures the output is 100% Parsedown-compatible Markdown.
 */
export function adaptForBookStack(markdown: string | null | undefined): string {
  if (!markdown || typeof markdown !== 'string') {
    return markdown || ''
  }

  let result = markdown
  const originalLength = result.length

  // ============================================================================
  // PHASE 0: Fix horizontal rules IMMEDIATELY (downdoc converts --- to "- --")
  // ============================================================================
  // This must be the FIRST thing we do, before any other processing
  result = result.replace(/^-\s*--\s*$/gm, '---')
  result = result.replace(/^-\s*--$/gm, '---')
  result = result.replace(/^-\s+--\s*$/gm, '---')
  result = result.replace(/^-\s*--\s+$/gm, '---')
  // Handle multiline patterns
  result = result.replace(/(\n|^)-\s*--\s*(\n|$)/g, '$1---$2')
  result = result.replace(/(\n|^)-\s*--(\n|$)/g, '$1---$2')
  // Line-by-line pass for safety - this is the most reliable method
  const hrLines = result.split('\n')
  const fixedLines = hrLines.map(line => {
    const trimmed = line.trim()
    // Match "- --" with any amount of whitespace
    if (trimmed === '- --' || trimmed === '-  --' || /^-\s*--\s*$/.test(trimmed)) {
      // Preserve original indentation if any, otherwise return '---'
      const indentMatch = line.match(/^(\s*)/)
      const indent = indentMatch ? indentMatch[1] : ''
      return indent + '---'
    }
    return line
  })
  result = fixedLines.join('\n')

  // ============================================================================
  // PHASE 1: Remove AsciiDoc-specific elements that should never appear in Markdown
  // ============================================================================
  
  // Remove page breaks
  result = result.replace(/^<<<$/gm, '')
  
  // Remove HTML comments
  result = result.replace(/<!--[\s\S]*?-->/g, '')
  
  // Remove footnote macros (footnote:[...])
  result = result.replace(/footnote:\[([^\]]*)\]/g, (match, content) => {
    return content ? ` (${content})` : ''
  })
  
  // Remove attribute references ({attribute})
  // Remove ALL attribute references - they have no meaning in Markdown
  result = result.replace(/\{([a-z][a-z0-9_-]*)\}/gi, '')
  
  // Remove include directives
  result = result.replace(/include::[^\[]+\[.*?\]/g, '')
  result = result.replace(/include::[^\s]+/g, '')
  
  // Remove pass block markers (++++)
  result = result.replace(/^\+\+\+\+$/gm, '')
  
  // Remove ifdef/ifndef/endif directives
  result = result.replace(/^(ifdef|ifndef|endif)::.*?\[\]$/gm, '')
  result = result.replace(/^\\?(ifdef|ifndef|endif)::.*?\[\]$/gm, '')
  
  // Remove toc directives
  result = result.replace(/^toc::\[.*?\]$/gm, '')
  
  // Remove block attribute lines (standalone lines with attributes)
  // Pattern: [cols="..."], [width="..."], [options="..."], [role="..."], [id="..."], [style="..."]
  result = result.replace(/^\[(cols|width|options|role|id|style|source|language|indent|subs)="?[^"]*"?\]$/gm, '')
  result = result.replace(/^\[(cols|width|options|role|id|style|source|language|indent|subs)=[^\]]+\]$/gm, '')
  result = result.replace(/^\[#[\w-]+(\.\w+)?\]$/gm, '') // [#id.role]
  result = result.replace(/^\[\.\w+\]$/gm, '') // [.role]
  
  // Remove source block markers
  result = result.replace(/^\[source(,[^\]]+)?\]$/gm, '')
  result = result.replace(/^\[source\]$/gm, '')
  
  // Remove callout markers in text (<1>, <2>, etc.) - these should be removed
  // Note: downdoc converts <1> to &lt;1&gt; (HTML entities), so we need to handle both
  // Do this early but also later after downdoc processing
  result = result.replace(/<([.1-9]|1\d)>/g, '')
  result = result.replace(/&lt;([.1-9]|1\d)&gt;/g, '') // HTML entities from downdoc
  // Also remove callouts that might be in the middle of text
  result = result.replace(/\s*<([.1-9]|1\d)>\s*/g, ' ')
  result = result.replace(/\s*&lt;([.1-9]|1\d)&gt;\s*/g, ' ')
  
  // Remove stem/math block markers
  result = result.replace(/^\[stem\]$/gm, '')
  result = result.replace(/^\[math\]$/gm, '')
  
  // Remove xref macros (xref:target[text])
  result = result.replace(/xref:[^\[]+\[[^\]]*\]/g, '')
  
  // Remove link macros with attributes (link:url[text, attr=value])
  // First, clean up links that have AsciiDoc attributes in the text part
  result = result.replace(/\[([^\]]+),\s*\w+="?[^"]*"?\]\(([^)]+)\)/g, (match, text, url) => {
    // Remove attributes from text, keep only the main text
    const cleanText = text.split(',')[0].trim()
    return `[${cleanText}](${url})`
  })
  
  // Remove image macros with attributes (image::path[alt, width, height])
  // These should already be converted by downdoc, but clean up any remaining
  result = result.replace(/image::([^\s[][^[]*)\[(.*?)\]/g, (match, path, attrs) => {
    // Extract alt text (first attribute)
    const altMatch = attrs.match(/^([^,]+)/)
    const alt = altMatch ? altMatch[1].trim() : ''
    return `![${alt}](${path})`
  })
  
  // Remove any remaining AsciiDoc block delimiters that might have leaked
  result = result.replace(/^(----|====|\.\.\.\.|\*\*\*\*|____|\+\+\+\+|\|\|===\|\|)$/gm, '')
  
  // Remove AsciiDoc-style xrefs (<<target,text>>)
  result = result.replace(/<<([^,>]+)(?:,\s*([^>]+))?>>/g, (match, target, text) => {
    // Convert to Markdown link
    const linkText = text || target
    return `[${linkText}](#${target.replace(/\s+/g, '-').toLowerCase()})`
  })
  
  // Remove conum markers (①, ②, etc.) - these are callout numbers
  result = result.replace(/[\u2460-\u2473]/g, '')
  
  // ============================================================================
  // PHASE 2: Fix horizontal rules early (CRITICAL - must be first after AsciiDoc cleanup)
  // ============================================================================
  
  // Fix horizontal rules: downdoc converts --- to "- --" - fix this IMMEDIATELY
  // This must be done BEFORE any line-by-line processing
  result = result.replace(/^-\s*--\s*$/gm, '---')
  result = result.replace(/^-\s*--$/gm, '---')
  result = result.replace(/^-\s+--\s*$/gm, '---')
  result = result.replace(/^-\s*--\s+$/gm, '---')
  // Handle multiline patterns
  result = result.replace(/(\n|^)-\s*--\s*(\n|$)/g, '$1---$2')
  // Handle if it's the entire content
  if (result.trim() === '- --' || result.trim() === '-  --') {
    result = '---'
  }
  
  // Remove callout markers again (downdoc converts them to HTML entities)
  // This must be done after downdoc processing
  // Handle all variations: <1>, &lt;1&gt;, &lt;1>, <1&gt;, etc.
  result = result.replace(/&lt;([.1-9]|1\d)&gt;/g, '')
  result = result.replace(/&lt;([.1-9]|1\d)>/g, '')
  result = result.replace(/<([.1-9]|1\d)&gt;/g, '')
  result = result.replace(/<([.1-9]|1\d)>/g, '')
  // Also handle with spaces around
  result = result.replace(/\s*&lt;([.1-9]|1\d)&gt;\s*/g, ' ')
  result = result.replace(/\s*&lt;([.1-9]|1\d)>\s*/g, ' ')
  result = result.replace(/\s*<([.1-9]|1\d)&gt;\s*/g, ' ')
  result = result.replace(/\s*<([.1-9]|1\d)>\s*/g, ' ')

  // ============================================================================
  // PHASE 3: Process admonitions - convert to Markdown blockquotes
  // ============================================================================
  
  const admonitionEmojis: Record<string, string> = {
    '📝': 'note',
    '📌': 'note',
    '💡': 'tip', 
    '⚠️': 'warning',
    '⚠': 'warning',
    '🔥': 'caution',
    '❗': 'important'
  }
  
  const lines = result.split('\n')
  const processedLines: string[] = []
  let inAdmonition = false
  let admonitionType = ''
  let admonitionContent: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLine = i < lines.length - 1 ? lines[i + 1] : ''
    const prevLine = i > 0 ? lines[i - 1] : ''
    
    // Check for admonition start patterns
    const emojiMatch = line.match(/^\*\*([📝💡⚠️🔥❗⚠📌])\s+(\w+)\*\*\s*$/)
    const emojiMatchWithContent = line.match(/^\*\*([📝💡⚠️🔥❗⚠📌])\s+(\w+)\*\*\s+(.+)$/)
    const emojiMatchLoose = line.match(/^\*\*([^\*]+?)\s+(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\*\*\s*$/i)
    const emojiMatchWithContentLoose = line.match(/^\*\*([^\*]+?)\s+(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\*\*\s+(.+)$/i)
    
    // HTML format from downdoc: <dl><dt><strong>EMOJI TYPE</strong></dt><dd>
    const htmlMatch = line.match(/^<dl><dt><strong>([📝💡⚠️🔥❗⚠📌])\s+(\w+)(?::\s*(.+))?<\/strong><\/dt><dd>$/)
    const htmlMatchLoose = line.match(/^<dl><dt><strong>([^<]+?)\s+(NOTE|TIP|WARNING|CAUTION|IMPORTANT)(?::\s*(.+))?<\/strong><\/dt><dd>$/i)
    
    if (emojiMatch || emojiMatchWithContent || emojiMatchLoose || emojiMatchWithContentLoose || htmlMatch || htmlMatchLoose) {
      // Close previous admonition if any
      if (inAdmonition) {
        if (admonitionContent.length > 0) {
          const firstLine = admonitionContent[0]
          const restLines = admonitionContent.slice(1)
          processedLines.push(`> **${admonitionType}:** ${firstLine}`)
          restLines.forEach(contentLine => {
            if (contentLine.trim()) {
              processedLines.push(`> ${contentLine}`)
            } else {
              processedLines.push('>')
            }
          })
        } else {
          processedLines.push(`> **${admonitionType}:**`)
        }
        processedLines.push('')
      }
      
      // Start new admonition
      inAdmonition = true
      admonitionContent = []
      
      if (htmlMatch) {
        const emoji = htmlMatch[1]
        admonitionType = htmlMatch[2]
        if (htmlMatch[3]) {
          admonitionContent.push(htmlMatch[3].trim())
        }
        continue
      } else if (htmlMatchLoose) {
        admonitionType = htmlMatchLoose[2]
        if (htmlMatchLoose[3]) {
          admonitionContent.push(htmlMatchLoose[3].trim())
        }
        continue
      } else if (emojiMatchWithContent) {
        const emoji = emojiMatchWithContent[1]
        admonitionType = emojiMatchWithContent[2]
        admonitionContent.push(emojiMatchWithContent[3].trim())
      } else if (emojiMatchWithContentLoose) {
        admonitionType = emojiMatchWithContentLoose[2]
        admonitionContent.push(emojiMatchWithContentLoose[3].trim())
      } else if (emojiMatch) {
        const emoji = emojiMatch[1]
        admonitionType = emojiMatch[2]
      } else if (emojiMatchLoose) {
        admonitionType = emojiMatchLoose[2]
      }
      
      // Check if next line has content
      if (nextLine.trim() && !nextLine.match(/^[#>#=-]|^```|^\|/) && !nextLine.match(/^\*\*/) && !nextLine.match(/^<\/dd><\/dl>$/)) {
        continue
      } else {
        // No content or single line, close it
        if (admonitionContent.length > 0) {
          const firstLine = admonitionContent[0]
          const restLines = admonitionContent.slice(1)
          processedLines.push(`> **${admonitionType}:** ${firstLine}`)
          restLines.forEach(contentLine => {
            if (contentLine.trim()) {
              processedLines.push(`> ${contentLine}`)
            } else {
              processedLines.push('>')
            }
          })
        } else {
          processedLines.push(`> **${admonitionType}:**`)
        }
        processedLines.push('')
        inAdmonition = false
        admonitionType = ''
        admonitionContent = []
      }
      continue
    }
    
    // Check for closing HTML tag
    if (line.match(/^<\/dd><\/dl>$/)) {
      if (inAdmonition) {
        if (admonitionContent.length > 0) {
          const firstLine = admonitionContent[0]
          const restLines = admonitionContent.slice(1)
          processedLines.push(`> **${admonitionType}:** ${firstLine}`)
          restLines.forEach(contentLine => {
            if (contentLine.trim()) {
              processedLines.push(`> ${contentLine}`)
            } else {
              processedLines.push('>')
            }
          })
        } else {
          processedLines.push(`> **${admonitionType}:**`)
        }
        processedLines.push('')
        inAdmonition = false
        admonitionType = ''
        admonitionContent = []
      }
      continue
    }
    
    // Check if line ends with closing HTML tag
    if (line.match(/<\/dd><\/dl>$/)) {
      const contentBeforeClose = line.replace(/<\/dd><\/dl>.*$/, '').trim()
      if (contentBeforeClose && inAdmonition) {
        admonitionContent.push(contentBeforeClose)
      }
      if (inAdmonition) {
        if (admonitionContent.length > 0) {
          const firstLine = admonitionContent[0]
          const restLines = admonitionContent.slice(1)
          processedLines.push(`> **${admonitionType}:** ${firstLine}`)
          restLines.forEach(contentLine => {
            if (contentLine.trim()) {
              processedLines.push(`> ${contentLine}`)
            } else {
              processedLines.push('>')
            }
          })
        } else {
          processedLines.push(`> **${admonitionType}:**`)
        }
        processedLines.push('')
        inAdmonition = false
        admonitionType = ''
        admonitionContent = []
      }
      continue
    }
    
    // Continue admonition content if we're in one
    if (inAdmonition) {
      if (line.match(/<\/dd><\/dl>/)) {
        const contentBeforeClose = line.replace(/<\/dd><\/dl>.*$/, '').trim()
        if (contentBeforeClose) {
          admonitionContent.push(contentBeforeClose)
        }
        if (admonitionContent.length > 0) {
          const firstLine = admonitionContent[0]
          const restLines = admonitionContent.slice(1)
          processedLines.push(`> **${admonitionType}:** ${firstLine}`)
          restLines.forEach(contentLine => {
            if (contentLine.trim()) {
              processedLines.push(`> ${contentLine}`)
            } else {
              processedLines.push('>')
            }
          })
        } else {
          processedLines.push(`> **${admonitionType}:**`)
        }
        processedLines.push('')
        inAdmonition = false
        admonitionType = ''
        admonitionContent = []
        continue
      }
      
      if (!line.trim() && admonitionContent.length === 0) {
        continue
      }
      
      if (!line.match(/^[#>#=-]|^```|^\|/) && !line.match(/^\*\*/)) {
        if (line.trim()) {
          admonitionContent.push(line.trim())
        } else if (admonitionContent.length > 0) {
          admonitionContent.push('')
        }
        continue
      }
      
      // If we hit a block element while in admonition, close it
      if (line.trim() && (line.match(/^[#>#=-]|^```|^\|/) || line.match(/^\*\*/))) {
        if (admonitionContent.length > 0) {
          const firstLine = admonitionContent[0]
          const restLines = admonitionContent.slice(1)
          processedLines.push(`> **${admonitionType}:** ${firstLine}`)
          restLines.forEach(contentLine => {
            if (contentLine.trim()) {
              processedLines.push(`> ${contentLine}`)
            } else {
              processedLines.push('>')
            }
          })
        } else {
          processedLines.push(`> **${admonitionType}:**`)
        }
        processedLines.push('')
        inAdmonition = false
        admonitionType = ''
        admonitionContent = []
      }
    }
    
    // If we're not in an admonition, process the line normally
    if (!inAdmonition) {
      processedLines.push(line)
    }
  }
  
  // Close any remaining admonition
  if (inAdmonition) {
    if (admonitionContent.length > 0) {
      const firstLine = admonitionContent[0]
      const restLines = admonitionContent.slice(1)
      processedLines.push(`> **${admonitionType}:** ${firstLine}`)
      restLines.forEach(contentLine => {
        if (contentLine.trim()) {
          processedLines.push(`> ${contentLine}`)
        } else {
          processedLines.push('>')
        }
      })
    } else {
      processedLines.push(`> **${admonitionType}:**`)
    }
    processedLines.push('')
  }
  
  result = processedLines.join('\n')

  // ============================================================================
  // PHASE 3.5: Fix horizontal rules AGAIN before line-by-line processing
  // ============================================================================
  // Downdoc converts --- to "- --", fix it before processing lines
  result = result.replace(/^-\s*--\s*$/gm, '---')
  result = result.replace(/^-\s*--$/gm, '---')
  result = result.replace(/^-\s+--\s*$/gm, '---')
  result = result.replace(/^-\s*--\s+$/gm, '---')
  // Handle multiline patterns
  result = result.replace(/(\n|^)-\s*--\s*(\n|$)/g, '$1---$2')
  result = result.replace(/(\n|^)-\s*--(\n|$)/g, '$1---$2')
  // Line-by-line pass
  result = result.split('\n').map(line => {
    if (line.trim() === '- --' || line.trim() === '-  --' || line.trim().match(/^-\s*--\s*$/)) {
      return '---'
    }
    return line
  }).join('\n')

  // ============================================================================
  // PHASE 4: Process line by line for code blocks, headings, tables, etc.
  // ============================================================================
  
  const finalLines = result.split('\n')
  const finalProcessed: string[] = []
  let inCodeBlock = false
  let inTable = false
  interface TableRow {
    line: string
    isSeparator: boolean
  }
  const tableBuffer: TableRow[] = []
  
  for (let i = 0; i < finalLines.length; i++) {
    const line = finalLines[i]
    const prevLine = i > 0 ? finalLines[i - 1] : ''
    const nextLine = i < finalLines.length - 1 ? finalLines[i + 1] : ''
    
    // Track code blocks
    if (line.match(/^```/)) {
      inCodeBlock = !inCodeBlock
      
      if (inCodeBlock) {
        // Opening code block
        if (prevLine.trim() && !prevLine.match(/^```/) && !prevLine.match(/^<div/)) {
          finalProcessed.push('')
        }
        // Clean up language identifier
        const langMatch = line.match(/^```(\w+)/)
        if (langMatch) {
          const cleanLang = langMatch[1].toLowerCase().split(/[\s,=]/)[0]
          const langMap: Record<string, string> = {
            'bash': 'bash', 'sh': 'bash', 'shell': 'bash', 'console': 'bash',
            'javascript': 'javascript', 'js': 'javascript',
            'python': 'python', 'py': 'python',
            'java': 'java', 'cpp': 'cpp', 'c++': 'cpp', 'c': 'c',
            'html': 'html', 'css': 'css', 'json': 'json', 'xml': 'xml',
            'yaml': 'yaml', 'yml': 'yaml', 'sql': 'sql', 'php': 'php',
            'ruby': 'ruby', 'go': 'go', 'rust': 'rust',
            'typescript': 'typescript', 'ts': 'typescript'
          }
          const mappedLang = langMap[cleanLang] || cleanLang
          finalProcessed.push('```' + mappedLang)
        } else {
          finalProcessed.push('```')
        }
      } else {
        // Closing code block
        finalProcessed.push('```')
        if (nextLine.trim() && !nextLine.match(/^```/) && !nextLine.match(/^#+\s+/)) {
          finalProcessed.push('')
        }
      }
      continue
    }
    
    // Don't process anything inside code blocks
    if (inCodeBlock) {
      const cleanedLine = line.replace(/[ \t]+$/, '')
      finalProcessed.push(cleanedLine)
      continue
    }
    
    // Track tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable && prevLine.trim() && !prevLine.match(/^\|/) && !prevLine.match(/^```/)) {
        finalProcessed.push('')
      }
      inTable = true
      
      let simplifiedLine = line.trim()
      
      const isSeparator = simplifiedLine.match(/[-=]{3,}/) !== null || simplifiedLine.match(/^\|\s*[-=]+\s*\|/) !== null
      const hasContent = simplifiedLine.replace(/\|/g, '').replace(/[-=]/g, '').trim().length > 0
      
      if (!hasContent && !isSeparator) {
        continue
      }
      
      // Remove alignment attributes and normalize separators
      simplifiedLine = simplifiedLine
        .replace(/\|[\s]*:[-=]*:[\s]*\|/g, '| --- |')
        .replace(/\|[\s]*:[-=]*[\s]*\|/g, '| --- |')
        .replace(/\|[\s]*[-=]*:[\s]*\|/g, '| --- |')
        .replace(/\|[\s]*[-=]{3,}[\s]*\|/g, '| --- |')
        .replace(/\|[\s]*[-=]+[\s]*\|/g, '| --- |')
      
      // Normalize spacing
      simplifiedLine = simplifiedLine
        .replace(/\s*\|\s*/g, ' | ')
        .replace(/\s{2,}/g, ' ')
        .trim()
      
      if (!simplifiedLine.startsWith('|')) {
        simplifiedLine = '| ' + simplifiedLine
      }
      if (!simplifiedLine.endsWith('|')) {
        simplifiedLine = simplifiedLine + ' |'
      }
      
      simplifiedLine = simplifiedLine.replace(/\s{2,}/g, ' ')
      
      tableBuffer.push({ line: simplifiedLine, isSeparator: isSeparator })
      continue
    } else if (inTable && (line.trim() === '' || !line.includes('|') || !line.trim().startsWith('|'))) {
      // End of table - flush buffer
      if (tableBuffer.length > 0) {
        const separatorIdx = tableBuffer.findIndex(r => r.isSeparator)
        
        let headers: TableRow[] = []
        let separator: TableRow | null = null
        let dataRows: TableRow[] = []
        
        if (separatorIdx >= 0) {
          if (separatorIdx === 0) {
            if (tableBuffer.length > 1) {
              headers = [tableBuffer[1]]
              separator = tableBuffer[0]
              dataRows = tableBuffer.slice(2)
            } else {
              tableBuffer.forEach(r => finalProcessed.push(r.line))
              tableBuffer.length = 0
              inTable = false
              if (line.trim() === '') {
                finalProcessed.push('')
                continue
              }
              continue
            }
          } else {
            headers = tableBuffer.slice(0, separatorIdx)
            separator = tableBuffer[separatorIdx]
            dataRows = tableBuffer.slice(separatorIdx + 1)
          }
        } else if (tableBuffer.length > 1) {
          const firstRowContent = tableBuffer[0].line.replace(/\|/g, '').replace(/[-=]/g, '').trim()
          if (firstRowContent.length > 0) {
            headers = [tableBuffer[0]]
            dataRows = tableBuffer.slice(1)
          } else {
            if (tableBuffer.length > 2) {
              headers = [tableBuffer[1]]
              dataRows = tableBuffer.slice(2)
            } else {
              dataRows = tableBuffer.slice(1)
            }
          }
        } else {
          dataRows = tableBuffer
        }
        
        headers.forEach(r => finalProcessed.push(r.line))
        if (separator) {
          finalProcessed.push(separator.line)
        } else if (headers.length > 0) {
          const colCount = Math.max(1, (headers[0].line.match(/\|/g) || []).length - 1)
          finalProcessed.push('| ' + ' --- |'.repeat(colCount))
        }
        dataRows.forEach(r => finalProcessed.push(r.line))
      }
      
      tableBuffer.length = 0
      inTable = false
      
      if (line.trim() === '') {
        finalProcessed.push('')
        continue
      }
    }
    
    // Handle headings
    if (line.match(/^#+\s+/)) {
      if (prevLine.trim() && !prevLine.match(/^#+\s+/) && !prevLine.match(/^<div/) && !prevLine.match(/^```/) && !prevLine.match(/^>/)) {
        finalProcessed.push('')
      }
      const cleanedHeading = line.replace(/^(#+)\s*/, '$1 ').trim()
      finalProcessed.push(cleanedHeading)
      if (nextLine.trim() && !nextLine.match(/^#+\s+/) && !nextLine.match(/^```/)) {
        finalProcessed.push('')
      }
      continue
    }
    
    // Fix images - clean paths and remove attributes
    if (line.match(/!\[([^\]]*)\]\(([^)]+)\)/)) {
      const fixedLine = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
        // Remove any AsciiDoc attributes from alt text
        const cleanAlt = alt.split(',')[0].trim()
        let cleanPath = path.replace(/^\/+/, '').replace(/\\/g, '/')
        if (!cleanPath.match(/^https?:\/\//)) {
          cleanPath = cleanPath.replace(/^\.\//, '')
          cleanPath = cleanPath.replace(/\s+/g, '%20')
        }
        return `![${cleanAlt}](${cleanPath})`
      })
      finalProcessed.push(fixedLine)
      continue
    }
    
    // Fix links - clean URLs and remove attributes
    if (line.match(/\[([^\]]+)\]\(([^)]+)\)/)) {
      const fixedLine = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        // Remove AsciiDoc attributes from link text
        const cleanText = text.split(',')[0].trim()
        if (url.match(/^https?:\/\//)) {
          return `[${cleanText}](${url})`
        }
        let cleanUrl = url.replace(/^\/+/, '').replace(/\\/g, '/')
        cleanUrl = cleanUrl.replace(/\.md(#.*)?$/, '$1')
        cleanUrl = cleanUrl.replace(/\s+/g, '%20')
        return `[${cleanText}](${cleanUrl})`
      })
      finalProcessed.push(fixedLine)
      continue
    }
    
    // Fix horizontal rules - CRITICAL: must be exactly --- for Parsedown
    // Handle all variations: "- --", "---", "***", "'''", etc.
    // Check trimmed line first to catch "- --" patterns
    const trimmedLine = line.trim()
    if (trimmedLine === '- --' || trimmedLine === '-  --' || 
        trimmedLine.match(/^-\s*--\s*$/) !== null || trimmedLine.match(/^-\s*--$/) !== null ||
        trimmedLine.match(/^---+$/) !== null || trimmedLine.match(/^\*\*\*+$/) !== null || trimmedLine.match(/^'''+$/) !== null) {
      if (prevLine.trim()) {
        finalProcessed.push('')
      }
      // Always output exactly --- (3 dashes minimum)
      finalProcessed.push('---')
      continue
    }
    
    // Also check original line pattern (before trimming)
    if (line.match(/^-\s*--\s*$/) !== null || line.match(/^-\s*--$/) !== null || 
        line.match(/^---+$/) !== null || line.match(/^\*\*\*+$/) !== null || line.match(/^'''+$/) !== null) {
      if (prevLine.trim()) {
        finalProcessed.push('')
      }
      finalProcessed.push('---')
      continue
    }
    
    // Regular line
    finalProcessed.push(line)
  }
  
  // Flush any remaining table buffer
  if (inTable && tableBuffer.length > 0) {
    const separatorIdx = tableBuffer.findIndex(r => r.isSeparator)
    let headers: TableRow[] = []
    let separator: TableRow | null = null
    let dataRows: TableRow[] = []
    
    if (separatorIdx >= 0) {
      if (separatorIdx === 0) {
        if (tableBuffer.length > 1) {
          headers = [tableBuffer[1]]
          separator = tableBuffer[0]
          dataRows = tableBuffer.slice(2)
        } else {
          dataRows = tableBuffer
        }
      } else {
        headers = tableBuffer.slice(0, separatorIdx)
        separator = tableBuffer[separatorIdx]
        dataRows = tableBuffer.slice(separatorIdx + 1)
      }
    } else if (tableBuffer.length > 1) {
      const firstRowContent = tableBuffer[0].line.replace(/\|/g, '').replace(/[-=]/g, '').trim()
      if (firstRowContent.length > 0) {
        headers = [tableBuffer[0]]
        dataRows = tableBuffer.slice(1)
      } else {
        if (tableBuffer.length > 2) {
          headers = [tableBuffer[1]]
          dataRows = tableBuffer.slice(2)
        } else {
          dataRows = tableBuffer.slice(1)
        }
      }
    } else {
      dataRows = tableBuffer
    }
    
    headers.forEach(r => finalProcessed.push(r.line))
    if (separator) {
      finalProcessed.push(separator.line)
    } else if (headers.length > 0) {
      const colCount = Math.max(1, (headers[0].line.match(/\|/g) || []).length - 1)
      finalProcessed.push('| ' + ' --- |'.repeat(colCount))
    }
    dataRows.forEach(r => finalProcessed.push(r.line))
  }
  
  result = finalProcessed.join('\n')
  
  // ============================================================================
  // PHASE 5: Final cleanup passes
  // ============================================================================
  
  // Final fix for horizontal rules - must be done at the very end
  // Replace all variations of "- --" with "---"
  // This is CRITICAL: downdoc converts --- to "- --", we must fix it
  result = result.replace(/^-\s*--\s*$/gm, '---')
  result = result.replace(/^-\s*--$/gm, '---')
  result = result.replace(/^-\s+--\s*$/gm, '---')
  result = result.replace(/^-\s*--\s+$/gm, '---')
  // Handle multiline patterns more aggressively
  result = result.replace(/(\n|^)-\s*--\s*(\n|$)/g, '$1---$2')
  result = result.replace(/(\n|^)-\s*--(\n|$)/g, '$1---$2')
  // Also handle if it's the entire content or at start/end
  if (result.trim() === '- --' || result.trim() === '-  --') {
    result = '---'
  }
  // Final pass: replace any remaining "- --" patterns
  result = result.split('\n').map(line => {
    if (line.trim() === '- --' || line.trim() === '-  --' || line.trim().match(/^-\s*--\s*$/)) {
      return '---'
    }
    return line
  }).join('\n')
  
  // Clean up code blocks
  result = result.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    let language = ''
    if (lang) {
      const cleanLang = lang.toLowerCase().trim().split(/[\s,=]/)[0]
      const langMap: Record<string, string> = {
        'bash': 'bash', 'sh': 'bash', 'shell': 'bash', 'console': 'bash',
        'javascript': 'javascript', 'js': 'javascript',
        'python': 'python', 'py': 'python',
        'java': 'java', 'cpp': 'cpp', 'c++': 'cpp', 'c': 'c',
        'html': 'html', 'css': 'css', 'json': 'json', 'xml': 'xml',
        'yaml': 'yaml', 'yml': 'yaml', 'sql': 'sql', 'php': 'php',
        'ruby': 'ruby', 'go': 'go', 'rust': 'rust',
        'typescript': 'typescript', 'ts': 'typescript'
      }
      language = langMap[cleanLang] || cleanLang
    }
    const cleanedCode = code.replace(/\n+$/, '')
    return '```' + language + '\n' + cleanedCode + '\n```'
  })
  
  // Clean up excessive blank lines
  result = result.replace(/\n{4,}/g, '\n\n\n')
  
  // Fix list formatting
  const listLines = result.split('\n')
  const listProcessed: string[] = []
  let prevWasList = false
  
  for (let i = 0; i < listLines.length; i++) {
    const line = listLines[i]
    const prevLine = i > 0 ? listLines[i - 1] : ''
    const nextLine = i < listLines.length - 1 ? listLines[i + 1] : ''
    
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s*(.+)$/)
    
    if (listMatch) {
      const [, indent, marker, content] = listMatch
      const fixedLine = indent + marker + ' ' + content.trim()
      
      if (!prevWasList && prevLine.trim() && !prevLine.match(/^(\s*)([-*+]|\d+\.)\s+/) && !prevLine.match(/^#+\s+/) && !prevLine.match(/^```/)) {
        listProcessed.push('')
      }
      
      listProcessed.push(fixedLine)
      prevWasList = true
    } else {
      if (prevWasList && line.trim() && !line.match(/^(\s*)([-*+]|\d+\.)\s+/) && !line.match(/^#+\s+/) && !line.match(/^```/)) {
        listProcessed.push('')
      }
      listProcessed.push(line)
      prevWasList = false
    }
  }
  
  result = listProcessed.join('\n')
  
  // Remove trailing whitespace
  result = result.replace(/[ \t]+$/gm, '')
  
  // Ensure file ends with a single newline
  result = result.trimEnd() + '\n'
  
  // ============================================================================
  // PHASE 6: Final fix for horizontal rules (CRITICAL - must be absolute last)
  // ============================================================================
  // This is the absolute last pass to ensure "- --" is converted to "---"
  // Do this after all other processing to catch any missed cases
  result = result.split('\n').map(line => {
    const trimmed = line.trim()
    if (trimmed === '- --' || trimmed === '-  --' || /^-\s*--\s*$/.test(trimmed)) {
      const indentMatch = line.match(/^(\s*)/)
      const indent = indentMatch ? indentMatch[1] : ''
      return indent + '---'
    }
    return line
  }).join('\n')
  
  // Also do a final regex replace as backup
  result = result.replace(/^-\s*--\s*$/gm, '---')
  result = result.replace(/^-\s*--$/gm, '---')
  
  // ============================================================================
  // PHASE 7: Final verification - remove any remaining AsciiDoc patterns
  // ============================================================================
  
  // Remove any remaining AsciiDoc patterns that might have been missed
  const asciidocPatterns = [
    /image::/g,
    /link:/g,
    /xref:/g,
    /include::/g,
    /pass::/g,
    /footnote:/g,
    /callout:/g,
    /stem:/g,
    /math:/g,
    /^\[#[\w-]+\]$/gm,
    /^\[\.\w+\]$/gm,
    /^\[cols=/gm,
    /^\[width=/gm,
    /^\[options=/gm,
    /^\[role=/gm,
    /^\[id=/gm,
    /^\[style=/gm,
    /^\[source\]$/gm,
    /^\[source,/gm
  ]
  
  asciidocPatterns.forEach(pattern => {
    result = result.replace(pattern, '')
  })
  
  // Remove any standalone attribute lines that might remain
  result = result.replace(/^\[[^\]]*\]$/gm, (match) => {
    // Only remove if it looks like an AsciiDoc attribute line
    if (match.match(/\[(cols|width|options|role|id|style|source|language|indent|subs|#|\.)/)) {
      return ''
    }
    return match
  })
  
  // Clean up any double blank lines that might have been created
  result = result.replace(/\n{3,}/g, '\n\n')
  
  // Debug log (development only)
  if (import.meta.env.DEV) {
    console.log(`BookStack adapter: ${originalLength} -> ${result.length} chars`)
  }
  
  return result
}
