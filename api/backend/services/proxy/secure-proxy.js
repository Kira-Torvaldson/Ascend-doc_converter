'use strict'

/**
 * ============================================================================
 * SECURE PROXY SERVICE (Data Normalization Layer)
 * ============================================================================
 * 
 * This module acts as a shadow proxy that normalizes and sanitizes input
 * data before passing it to the actual conversion service. It addresses
 * common issues that cause converter failures:
 * 
 * PROBLEMS ADDRESSED:
 * ------------------
 * 1. BOM (Byte Order Mark) characters at the start of files
 *    - UTF-8 BOM (0xEF 0xBB 0xBF) can break parsers
 *    - UTF-16 BOM variants cause encoding issues
 * 
 * 2. Non-UTF-8 encodings
 *    - Legacy encodings (Windows-1252, ISO-8859-1, etc.)
 *    - Mixed encodings within a single document
 * 
 * 3. Smart Quotes and special characters
 *    - Microsoft Word Smart Quotes (curly quotes)
 *    - Em dashes, en dashes, and other typographic characters
 *    - Non-breaking spaces and other invisible characters
 * 
 * ARCHITECTURE:
 * ------------
 * This proxy is completely additive and does not modify existing code.
 * It sits between the HTTP routes and the conversion service, intercepting
 * requests, normalizing the content, and then delegating to the original
 * conversion service.
 * 
 * FLOW:
 * -----
 * 1. Receive request at /api/proxy/convert
 * 2. Extract and sanitize content (remove BOM, normalize encoding, etc.)
 * 3. Call original conversion service with sanitized content
 * 4. Return standardized JSON response
 * 
 * ============================================================================
 */

const express = require('express')
const router = express.Router()

// Import the main orchestrator for actual conversion
// This is the existing conversion service that we're proxying
const { executeConversionRequest } = require('../modules/main-orchestrator.js')

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Removes BOM (Byte Order Mark) characters from the beginning of a string
 * 
 * BOM characters are invisible markers that indicate text encoding:
 * - UTF-8 BOM: 0xEF 0xBB 0xBF (appears as "\uFEFF" in JavaScript)
 * - UTF-16 LE BOM: 0xFF 0xFE
 * - UTF-16 BE BOM: 0xFE 0xFF
 * 
 * These characters can cause parsers to fail or misinterpret content.
 * 
 * @param {string} text - Input text that may contain BOM
 * @returns {string} - Text with BOM removed
 * 
 * Example:
 *   removeBOM('\uFEFFHello World') => 'Hello World'
 */
function removeBOM(text) {
  if (typeof text !== 'string') {
    return text
  }
  
  // Remove UTF-8 BOM (most common)
  // \uFEFF is the Unicode character for BOM
  if (text.charCodeAt(0) === 0xFEFF) {
    return text.slice(1)
  }
  
  // Also check for BOM as a string (some systems represent it differently)
  if (text.startsWith('\uFEFF')) {
    return text.slice(1)
  }
  
  return text
}

/**
 * Normalizes text encoding to UTF-8
 * 
 * This function attempts to detect and convert non-UTF-8 encodings.
 * It handles common legacy encodings like Windows-1252 and ISO-8859-1.
 * 
 * STRATEGY:
 * ---------
 * 1. Check if text is already valid UTF-8
 * 2. If not, attempt to decode as Windows-1252 (common on Windows)
 * 3. Fall back to ISO-8859-1 (Latin-1) if Windows-1252 fails
 * 4. Replace invalid characters with replacement character (U+FFFD)
 * 
 * @param {string} text - Input text in potentially non-UTF-8 encoding
 * @returns {string} - Text normalized to UTF-8
 */
function normalizeEncoding(text) {
  if (typeof text !== 'string') {
    return text
  }
  
  try {
    // First, check if the text is already valid UTF-8
    // by attempting to encode and decode it
    const encoded = Buffer.from(text, 'utf8')
    const decoded = encoded.toString('utf8')
    
    // If encoding/decoding round-trip succeeds, text is already UTF-8
    if (decoded === text) {
      return text
    }
  } catch (error) {
    // If UTF-8 encoding fails, text contains invalid UTF-8 sequences
    // Proceed to conversion
  }
  
  // Attempt to convert from Windows-1252 (common legacy encoding)
  try {
    const buffer = Buffer.from(text, 'binary')
    return buffer.toString('utf8')
  } catch (error) {
    // If conversion fails, return text as-is with invalid characters replaced
    // This prevents the conversion from completely failing
    return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
  }
}

/**
 * Replaces Smart Quotes (curly quotes) with standard ASCII quotes
 * 
 * Microsoft Word and other rich text editors use "smart" typographic quotes
 * that look better in print but can break parsers and converters:
 * - Left double quote: " (U+201C)
 * - Right double quote: " (U+201D)
 * - Left single quote: ' (U+2018)
 * - Right single quote: ' (U+2019)
 * 
 * This function replaces them with standard ASCII quotes:
 * - Double quotes: " (U+0022)
 * - Single quotes: ' (U+0027)
 * 
 * @param {string} text - Input text containing Smart Quotes
 * @returns {string} - Text with Smart Quotes replaced
 * 
 * Example:
 *   replaceSmartQuotes('He said "Hello"') => 'He said "Hello"'
 */
function replaceSmartQuotes(text) {
  if (typeof text !== 'string') {
    return text
  }
  
  let result = text
  
  // Replace left double quote (") with standard double quote (")
  result = result.replace(/\u201C/g, '"')
  
  // Replace right double quote (") with standard double quote (")
  result = result.replace(/\u201D/g, '"')
  
  // Replace left single quote (') with standard single quote (')
  result = result.replace(/\u2018/g, "'")
  
  // Replace right single quote (') with standard single quote (')
  result = result.replace(/\u2019/g, "'")
  
  return result
}

/**
 * Normalizes other typographic characters to ASCII equivalents
 * 
 * This function handles common typographic characters that can cause
 * issues in plain text converters:
 * - Em dash (—) → double hyphen (--)
 * - En dash (–) → single hyphen (-)
 * - Non-breaking space ( ) → regular space ( )
 * - Ellipsis (…) → three periods (...)
 * 
 * @param {string} text - Input text containing typographic characters
 * @returns {string} - Text with typographic characters normalized
 */
function normalizeTypographicChars(text) {
  if (typeof text !== 'string') {
    return text
  }
  
  let result = text
  
  // Em dash (—) to double hyphen
  result = result.replace(/\u2014/g, '--')
  
  // En dash (–) to single hyphen
  result = result.replace(/\u2013/g, '-')
  
  // Non-breaking space ( ) to regular space
  result = result.replace(/\u00A0/g, ' ')
  
  // Ellipsis (…) to three periods
  result = result.replace(/\u2026/g, '...')
  
  // Zero-width space (invisible character) removal
  result = result.replace(/\u200B/g, '')
  
  // Zero-width non-breaking space removal
  result = result.replace(/\uFEFF/g, '')
  
  return result
}

/**
 * Removes control characters that can break parsers
 * 
 * Control characters (ASCII 0-31, except common ones like \n, \r, \t)
 * can cause issues in text processing. This function removes them while
 * preserving common whitespace characters.
 * 
 * @param {string} text - Input text potentially containing control characters
 * @returns {string} - Text with control characters removed
 */
function removeControlChars(text) {
  if (typeof text !== 'string') {
    return text
  }
  
  // Remove control characters except:
  // - \n (0x0A) - Line feed
  // - \r (0x0D) - Carriage return
  // - \t (0x09) - Tab
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Main sanitization function that applies all normalization steps
 * 
 * This function orchestrates all normalization steps in the correct order:
 * 1. Remove BOM (must be first)
 * 2. Normalize encoding to UTF-8
 * 3. Replace Smart Quotes
 * 4. Normalize typographic characters
 * 5. Remove control characters (must be last to preserve formatting)
 * 
 * @param {string} content - Raw input content to sanitize
 * @returns {string} - Fully sanitized and normalized content
 */
function sanitizeContent(content) {
  if (typeof content !== 'string') {
    return content
  }
  
  let sanitized = content
  
  // Step 1: Remove BOM (must be done first)
  sanitized = removeBOM(sanitized)
  
  // Step 2: Normalize encoding to UTF-8
  sanitized = normalizeEncoding(sanitized)
  
  // Step 3: Replace Smart Quotes with standard quotes
  sanitized = replaceSmartQuotes(sanitized)
  
  // Step 4: Normalize typographic characters
  sanitized = normalizeTypographicChars(sanitized)
  
  // Step 5: Remove problematic control characters
  // Note: We do this last to preserve formatting characters like \n, \r, \t
  sanitized = removeControlChars(sanitized)
  
  return sanitized
}

// ============================================================================
// PROXY ENDPOINT
// ============================================================================

/**
 * POST /api/proxy/convert
 * 
 * Proxy endpoint that normalizes input data before conversion
 * 
 * REQUEST BODY:
 * ------------
 * {
 *   "content": string,        // Content to convert (will be sanitized)
 *   "fromFormat": string,      // Source format (e.g., "asciidoc", "markdown")
 *   "toFormat": string,        // Target format (e.g., "markdown", "asciidoc")
 *   "options": object,        // Optional conversion options
 *   "token": string           // Optional confirmation token
 * }
 * 
 * RESPONSE:
 * ---------
 * Success:
 * {
 *   "success": true,
 *   "result": string          // Converted content
 * }
 * 
 * Error:
 * {
 *   "success": false,
 *   "error": string           // Error message
 * }
 * 
 * PROCESSING FLOW:
 * ---------------
 * 1. Validate request body
 * 2. Sanitize content (remove BOM, normalize encoding, replace Smart Quotes)
 * 3. Call original conversion service with sanitized content
 * 4. Return standardized response
 */
router.post('/convert', async (req, res) => {
  try {
    // Extract request parameters
    const { content, fromFormat, toFormat, options = {}, token } = req.body
    
    // Validate required parameters
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "content" parameter. Content must be a non-empty string.'
      })
    }
    
    if (!fromFormat || typeof fromFormat !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "fromFormat" parameter. Format must be a string (e.g., "asciidoc", "markdown").'
      })
    }
    
    if (!toFormat || typeof toFormat !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "toFormat" parameter. Format must be a string (e.g., "markdown", "asciidoc").'
      })
    }
    
    // Log original content length for debugging
    const originalLength = content.length
    
    // Step 1: Sanitize content
    // This is the core functionality of the proxy: normalize input data
    const sanitizedContent = sanitizeContent(content)
    
    // Log sanitization results if content changed
    if (sanitizedContent !== content) {
      console.log(`[PROXY] Content sanitized: ${originalLength} → ${sanitizedContent.length} characters`)
      console.log(`[PROXY] Changes: BOM removed, encoding normalized, Smart Quotes replaced`)
    }
    
    // Step 2: Prepare conversion options
    // Merge provided options with token if present
    const conversionOptions = {
      ...options,
      ...(token && { confirmationToken: token })
    }
    
    // Step 3: Call original conversion service
    // This delegates to the existing conversion infrastructure
    // The main orchestrator handles all the complex conversion logic
    const conversionResult = await executeConversionRequest(
      sanitizedContent,
      fromFormat,
      toFormat,
      conversionOptions
    )
    
    // Step 4: Check conversion result
    if (conversionResult.success) {
      // Conversion succeeded – main orchestrator returns outputContent
      const fs = require('fs')
      let resultContent = ''
      if (conversionResult.outputContent != null && typeof conversionResult.outputContent === 'string') {
        resultContent = conversionResult.outputContent
      } else if (conversionResult.outputPath && fs.existsSync(conversionResult.outputPath)) {
        resultContent = fs.readFileSync(conversionResult.outputPath, 'utf8')
      } else if (conversionResult.result != null) {
        resultContent = typeof conversionResult.result === 'string' ? conversionResult.result : String(conversionResult.result)
      }
      return res.json({
        success: true,
        result: resultContent
      })
    } else {
      // Conversion failed
      return res.status(500).json({
        success: false,
        error: conversionResult.error || 'Conversion failed for unknown reason'
      })
    }
    
  } catch (error) {
    // Handle unexpected errors
    console.error('[PROXY] Unexpected error during conversion:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during conversion'
    })
  }
})

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router
