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
  const result: string[] = []
  let foundExperimental = false
  let tocAdded = false

  // Find :experimental: in the header (before the document title starting with =)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Check if we've reached the document title (header ends here)
    if (/^=+\s+/.test(trimmed)) {
      // If we found :experimental: and haven't added :toc: yet, add it now
      if (foundExperimental && !tocAdded) {
        result.push(':toc:')
        tocAdded = true
      }
      result.push(line)
      continue
    }

    // Check if this is :experimental:
    if (/^:experimental:\s*$/i.test(trimmed)) {
      foundExperimental = true
      result.push(line)
      // Check if next line is not :toc: already
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
      if (!/^:toc:\s*$/i.test(nextLine)) {
        // Add :toc: immediately after :experimental:
        result.push(':toc:')
        tocAdded = true
      }
      continue
    }

    result.push(line)
  }

  return result.join('\n')
}
