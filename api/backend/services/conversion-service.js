/**
 * ============================================================================
 * SERVICE: Conversion Service
 * ============================================================================
 * 
 * Service principal pour les conversions de documents
 * Centralise toute la logique de conversion
 */

'use strict'

const { spawn } = require('child_process')
const { writeFileSync, unlinkSync, readFileSync } = require('fs')
const { tmpdir } = require('os')
const path = require('path')
const { randomUUID } = require('crypto')
const downdoc = require('../../../lib/index.js')
const { adaptForBookStack } = require('../../shared/adapters/bookstack-adapter.js')

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

  return result
}

/**
 * Converts AsciiDoc content to Markdown using the downdoc CLI tool
 * 
 * @param {string} asciidoc - The AsciiDoc content to convert
 * @param {"default" | "bookstack"} mode - Conversion mode: "default" for standard Markdown, "bookstack" for Parsedown-compatible Markdown
 * @returns {Promise<string>} Promise that resolves to the converted Markdown
 * @throws {Error} If downdoc execution fails or returns non-zero exit code
 */
async function convertAsciiDoc(asciidoc, mode = 'default') {
  if (!asciidoc || typeof asciidoc !== 'string') {
    throw new Error('AsciiDoc content must be a non-empty string')
  }

  // Convert using downdoc
  let markdown = downdoc(asciidoc)

  // Always apply basic cleanup
  markdown = basicCleanup(markdown)

  // Apply BookStack adaptation if requested
  if (mode === 'bookstack') {
    markdown = adaptForBookStack(markdown)
  }

  return markdown
}

/**
 * Converts Markdown to AsciiDoc using Pandoc
 */
async function convertMarkdownWithPandoc(markdown, options = {}) {
  // Implementation from convert.js
  // This will be moved here
  throw new Error('Not yet implemented in conversion-service')
}

/**
 * Converts HTML to other formats using Pandoc
 */
async function convertHtmlWithPandoc(html, toFormat, options = {}) {
  // Implementation from convert.js
  throw new Error('Not yet implemented in conversion-service')
}

/**
 * Generic conversion using Pandoc
 */
async function convertWithPandoc(content, fromFormat, toFormat, options = {}) {
  // Implementation from convert.js
  throw new Error('Not yet implemented in conversion-service')
}

/**
 * Converts plain text to Markdown
 */
async function text2markdown(text, options = {}) {
  // Implementation from convert.js
  throw new Error('Not yet implemented in conversion-service')
}

module.exports = {
  convertAsciiDoc,
  convertMarkdownWithPandoc,
  convertHtmlWithPandoc,
  convertWithPandoc,
  text2markdown,
  basicCleanup
}
