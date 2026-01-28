/**
 * ============================================================================
 * ASCIIDOC HELPERS - Utility functions for AsciiDoc content processing
 * ============================================================================
 */

/**
 * Processes AsciiDoc header: if it contains :experimental:, adds :toc: automatically
 * This ensures the source content has :toc: when :experimental: is present
 * 
 * @param asciidoc - AsciiDoc content
 * @returns AsciiDoc content with :toc: added after :experimental: if present
 */
export function removeExperimentalTag(asciidoc: string): string {
  if (!asciidoc || typeof asciidoc !== 'string') {
    return asciidoc
  }

  const lines = asciidoc.split('\n')
  
  // First pass: detect :experimental: and :toc: in header only (before title)
  let hasExperimental = false
  let hasToc = false
  let titleIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    
    // Stop at document title
    if (/^=+\s+/.test(trimmed)) {
      titleIndex = i
      break
    }
    
    // Check for :experimental:
    if (/^:experimental:\s*$/i.test(trimmed)) {
      hasExperimental = true
    }
    
    // Check for :toc:
    if (/^:toc:\s*$/i.test(trimmed)) {
      hasToc = true
    }
  }
  
  // Second pass: rebuild document, insert :toc: and additional parameters if needed
  const result: string[] = []
  let tocInserted = false
  let tocParamsInserted = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Stop processing header at title
    if (/^=+\s+/.test(trimmed)) {
      result.push(line)
      continue
    }
    
    // Check if this is :experimental:
    if (/^:experimental:\s*$/i.test(trimmed)) {
      result.push(line)
      // Insert :toc: immediately after :experimental: if needed
      if (hasExperimental && !hasToc && !tocInserted) {
        result.push(':toc:')
        tocInserted = true
        // Add additional TOC parameters
        if (!tocParamsInserted) {
          result.push(':toclevels: 3')
          result.push(':toc-placement: auto')
          tocParamsInserted = true
        }
      }
      continue
    }
    
    // Check if this is :toc: - if it already exists, don't add anything
    if (/^:toc:\s*$/i.test(trimmed)) {
      result.push(line)
      continue
    }
    
    result.push(line)
  }

  return result.join('\n')
}
