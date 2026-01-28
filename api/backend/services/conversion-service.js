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
const { convertAsciiDoc: convertAsciiDocFromConvert } = require('./conversion/convert.js')

/**
 * Converts AsciiDoc content to Markdown via convert.js pipeline
 * (normalize, removeExperimentalTag, downdoc with Pandoc fallback).
 *
 * @param {string} asciidoc - The AsciiDoc content to convert
 * @param {"default" | "bookstack"} mode - Conversion mode
 * @returns {Promise<string>} Promise that resolves to the converted Markdown
 */
async function convertAsciiDoc(asciidoc, mode = 'default') {
  const result = await convertAsciiDocFromConvert(asciidoc, mode)
  return result.markdown
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
  text2markdown
}
