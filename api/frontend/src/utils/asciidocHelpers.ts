/**
 * ============================================================================
 * ASCIIDOC HELPERS - Utility functions for AsciiDoc content processing
 * ============================================================================
 *
 * Constraint: no :toc: or any AsciiDoc attribute is ever injected.
 * Only normalization or removal of :experimental: line (no side effects).
 */

/**
 * Removes the :experimental: line from the AsciiDoc header (before first title).
 * No other attribute is added or reordered. No :toc: injection.
 *
 * @param asciidoc - AsciiDoc content
 * @returns AsciiDoc content with :experimental: line removed from header
 */
export function removeExperimentalTag(asciidoc: string): string {
  if (!asciidoc || typeof asciidoc !== 'string') {
    return asciidoc
  }

  const lines = asciidoc.split('\n')
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    // In header only (before first title): skip the :experimental: line
    if (/^=+\s+/.test(trimmed)) {
      result.push(line)
      for (let j = i + 1; j < lines.length; j++) result.push(lines[j])
      return result.join('\n')
    }
    if (/^:experimental:\s*$/i.test(trimmed)) {
      continue // omit this line, no side effect
    }
    result.push(line)
  }

  return result.join('\n')
}

/**
 * Normalizes AsciiDoc input for deterministic conversion: LF line endings,
 * no trailing spaces per line, exactly one trailing newline.
 */
export function normalizeAsciiDocInput(asciidoc: string): string {
  if (!asciidoc || typeof asciidoc !== 'string') {
    return asciidoc
  }
  const lf = asciidoc.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const trimmedLines = lf.split('\n').map((line) => line.replace(/[ \t]+$/, ''))
  return trimmedLines.join('\n').trimEnd() + '\n'
}
