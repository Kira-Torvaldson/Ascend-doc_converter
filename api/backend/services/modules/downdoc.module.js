'use strict'

/**
 * DOWNDOC MODULE
 * 
 * Wrapper for the downdoc library conforming to the interface defined in
 * doc/specifications/modules.interface.md
 * 
 * This module converts AsciiDoc files to Markdown according to the specification
 * defined in doc/specifications/modules/downdoc.module.md
 * 
 * References:
 * - modules.interface.md: Module interface contract
 * - downdoc.module.md: Downdoc module specification
 */

const { readFileSync, writeFileSync, statSync, existsSync, unlinkSync } = require('fs')
const path = require('path')
const { adaptForBookStack } = require('../../../shared/adapters/bookstack-adapter.js')

// Load downdoc library with absolute path resolution
const libPath = path.resolve(__dirname, '../../../../lib/index.js')
let downdoc
try {
  downdoc = require(libPath)
  if (typeof downdoc !== 'function') {
    throw new Error(`downdoc library at ${libPath} is not a function (type: ${typeof downdoc})`)
  }
} catch (error) {
  console.error(`[downdoc.module] Failed to load downdoc library from ${libPath}:`, error.message)
  throw error
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const MODULE_CONFIG = {
  // Maximum file size limit (50 MB by default)
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  
  // Accepted AsciiDoc extensions
  ALLOWED_EXTENSIONS: ['.adoc', '.asciidoc']
}

// ============================================================================
// POST-TRAITEMENT
// ============================================================================

/**
 * Processes AsciiDoc header: if it ends with :experimental:, adds :toc: automatically
 * 
 * @param {string} asciidoc - AsciiDoc content
 * @returns {string} AsciiDoc content with :toc: added after :experimental: if present
 */
function removeExperimentalTag(asciidoc) {
  if (!asciidoc || typeof asciidoc !== 'string') {
    return asciidoc
  }

  const lines = asciidoc.split('\n')
  const result = []
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

/**
 * Basic cleanup to fix common downdoc issues
 * Conforms to downdoc.module.md specification
 * 
 * @param {string} markdown - Raw markdown from downdoc
 * @returns {string} Cleaned markdown
 */
function basicCleanup(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return markdown
  }

  let result = markdown

  // Fix malformed horizontal rules (- -- -> ---)
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

  // Remove trailing spaces
  result = result.replace(/[ \t]+$/gm, '')

  // Normalize file endings (single final newline)
  result = result.trimEnd() + '\n'

  return result
}

// ============================================================================
// VALIDATION DES ENTRÉES
// ============================================================================

/**
 * Validates input file according to minimal V1 security obligations
 * Conforms to modules.interface.md - Obligation 1: Basic input validation
 * 
 * @param {string} inputPath - Path to input file
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateInput(inputPath) {
  // Check file existence
  if (!existsSync(inputPath)) {
    return {
      valid: false,
      error: 'Input file not found'
    }
  }

  // Check file size
  try {
    const stats = statSync(inputPath)
    if (stats.size > MODULE_CONFIG.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${stats.size} bytes) exceeds maximum allowed size (${MODULE_CONFIG.MAX_FILE_SIZE} bytes)`
      }
    }

    if (stats.size === 0) {
      return {
        valid: false,
        error: 'Input file is empty'
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: `Failed to read file stats: ${error.message}`
    }
  }

  // Basic file type check by extension
  const ext = path.extname(inputPath).toLowerCase()
  if (!MODULE_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File extension '${ext}' is not allowed. Allowed extensions: ${MODULE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
    }
  }

  return { valid: true }
}

// ============================================================================
// MODULE DOWNDOC
// ============================================================================

/**
 * Downdoc module conforming to modules.interface.md interface
 */
const downdocModule = {
  /**
   * Module name (modules.interface.md - Property 1)
   */
  name: 'downdoc',

  /**
   * Supported formats (modules.interface.md - Property 2)
   */
  supportedFormats: {
    from: ['asciidoc'],
    to: ['markdown']
  },

  /**
   * Run method conforming to modules.interface.md
   * Implements the process described in downdoc.module.md
   * 
   * @param {string} inputPath - Absolute path to input AsciiDoc file
   * @param {string} outputPath - Absolute path to output Markdown file
   * @param {Object} options - Conversion options (optional)
   * @param {string} options.mode - Conversion mode ('default' or 'bookstack')
   * @param {string} options.conversionId - Conversion ID for logs (optional)
   * @returns {Promise<ModuleResult>} Conversion result
   */
  async run(inputPath, outputPath, options = {}) {
    const startTime = Date.now()
    const logs = []
    const conversionId = options.conversionId || 'unknown'

    try {
      // Minimal logging - Obligation 4 (modules.interface.md)
      logs.push(`[${conversionId}] Conversion started at ${new Date().toISOString()}`)
      logs.push(`[${conversionId}] Input: ${path.basename(inputPath)}`)
      logs.push(`[${conversionId}] Output: ${path.basename(outputPath)}`)

      // Step 1: Input validation (Obligation 1 - modules.interface.md)
      logs.push(`[${conversionId}] Validating input file...`)
      const validation = validateInput(inputPath)
      if (!validation.valid) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Validation failed: ${validation.error}`)
        return {
          success: false,
          logs: logs,
          error: validation.error,
          duration: duration
        }
      }
      logs.push(`[${conversionId}] Input file validated`)

      // Step 2: Secure input file reading (downdoc.module.md)
      logs.push(`[${conversionId}] Reading input file...`)
      let asciidocContent
      try {
        asciidocContent = readFileSync(inputPath, 'utf8')
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Failed to read input file: ${error.message}`)
        return {
          success: false,
          logs: logs,
          error: `Failed to read input file: ${error.message}`,
          duration: duration
        }
      }

      // Validate that content is not empty
      if (!asciidocContent || typeof asciidocContent !== 'string' || asciidocContent.trim().length === 0) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Input file is empty or invalid`)
        return {
          success: false,
          logs: logs,
          error: 'Input file content is empty or invalid',
          duration: duration
        }
      }
      logs.push(`[${conversionId}] Input file read successfully (${asciidocContent.length} characters)`)

      // Remove :experimental: tag from header if present
      const originalLength = asciidocContent.length
      asciidocContent = removeExperimentalTag(asciidocContent)
      if (originalLength !== asciidocContent.length) {
        logs.push(`[${conversionId}] Removed :experimental: tag from header (${originalLength} → ${asciidocContent.length} chars)`)
      }
      
      // Validate content is still not empty after tag removal
      if (!asciidocContent || typeof asciidocContent !== 'string' || asciidocContent.trim().length === 0) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Input file is empty after removing :experimental: tag`)
        return {
          success: false,
          logs: logs,
          error: 'Input file content is empty after removing :experimental: tag',
          duration: duration
        }
      }

      // Step 3: In-memory conversion via downdoc (downdoc.module.md)
      logs.push(`[${conversionId}] Converting AsciiDoc to Markdown...`)
      logs.push(`[${conversionId}] Input content preview (first 100 chars): ${asciidocContent.substring(0, 100)}...`)
      
      let markdown
      try {
        const mode = options.mode || 'default'
        const downdocOptions = {}

        if (mode === 'bookstack') {
          downdocOptions.extensions = ['parsedown']
          logs.push(`[${conversionId}] Using BookStack/Parsedown mode`)
        }

        // Verify downdoc function is available
        if (typeof downdoc !== 'function') {
          const duration = (Date.now() - startTime) / 1000
          logs.push(`[${conversionId}] ERROR: downdoc is not a function. Type: ${typeof downdoc}`)
          logs.push(`[${conversionId}] Library path: ${libPath}`)
          return {
            success: false,
            logs: logs,
            error: 'downdoc library is not properly loaded',
            duration: duration
          }
        }

        // Conversion via downdoc
        logs.push(`[${conversionId}] Calling downdoc function...`)
        logs.push(`[${conversionId}] Input sample: ${asciidocContent.substring(0, 50)}...`)
        markdown = downdoc(asciidocContent, downdocOptions)
        logs.push(`[${conversionId}] Downdoc returned: ${markdown ? markdown.substring(0, 50) + '...' : 'null/undefined'}`)
        
        // Verify conversion actually happened
        if (!markdown || typeof markdown !== 'string') {
          const duration = (Date.now() - startTime) / 1000
          logs.push(`[${conversionId}] ERROR: downdoc returned invalid result. Type: ${typeof markdown}`)
          return {
            success: false,
            logs: logs,
            error: 'downdoc returned invalid result',
            duration: duration
          }
        }
        
        // Check if result is different from input (basic sanity check)
        if (markdown === asciidocContent) {
          const duration = (Date.now() - startTime) / 1000
          logs.push(`[${conversionId}] ERROR: Conversion result is identical to input - conversion failed!`)
          logs.push(`[${conversionId}] Input length: ${asciidocContent.length}, Output length: ${markdown.length}`)
          logs.push(`[${conversionId}] This indicates downdoc did not perform the conversion`)
          return {
            success: false,
            logs: logs,
            error: 'Conversion failed: output is identical to input. The downdoc library may not be working correctly.',
            duration: duration
          }
        }
        
        logs.push(`[${conversionId}] Conversion completed`)
        logs.push(`[${conversionId}] Output content preview (first 100 chars): ${markdown.substring(0, 100)}...`)
        logs.push(`[${conversionId}] Output length: ${markdown.length} characters`)
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Conversion failed: ${error.message}`)
        return {
          success: false,
          logs: logs,
          error: `Conversion failed: ${error.message}`,
          duration: duration
        }
      }

      // Step 4: Result post-processing (downdoc.module.md)
      logs.push(`[${conversionId}] Applying post-processing...`)
      const markdownBeforeCleanup = markdown
      markdown = basicCleanup(markdown)
      
      // Verify cleanup didn't break the conversion
      if (!markdown || markdown.trim().length === 0) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] ERROR: Post-processing resulted in empty markdown`)
        logs.push(`[${conversionId}] Reverting to pre-cleanup version`)
        markdown = markdownBeforeCleanup
      }
      
      // Verify markdown is still different from input after cleanup
      if (markdown === asciidocContent) {
        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] ERROR: After cleanup, markdown is identical to input - conversion failed!`)
        return {
          success: false,
          logs: logs,
          error: 'Conversion failed: output is identical to input after post-processing.',
          duration: duration
        }
      }

      // Apply BookStack adapter if necessary
      if (options.mode === 'bookstack') {
        logs.push(`[${conversionId}] Applying BookStack adapter...`)
        const markdownBeforeAdapter = markdown
        markdown = adaptForBookStack(markdown)
        
        // Verify adapter didn't break the conversion
        if (!markdown || markdown.trim().length === 0) {
          logs.push(`[${conversionId}] WARNING: BookStack adapter resulted in empty markdown, using pre-adapter version`)
          markdown = markdownBeforeAdapter
        }
        
        // Verify markdown is still different from input after adapter
        if (markdown === asciidocContent) {
          logs.push(`[${conversionId}] WARNING: After BookStack adapter, markdown is identical to input, using pre-adapter version`)
          markdown = markdownBeforeAdapter
        }
      }
      logs.push(`[${conversionId}] Post-processing completed`)
      logs.push(`[${conversionId}] Final markdown length: ${markdown.length} characters`)

      // Step 5: Write result (downdoc.module.md)
      logs.push(`[${conversionId}] Writing output file...`)
      logs.push(`[${conversionId}] Output path: ${outputPath}`)
      logs.push(`[${conversionId}] Markdown length before write: ${markdown.length} characters`)
      
      // Verify markdown is different from input (sanity check)
      if (markdown === asciidocContent) {
        logs.push(`[${conversionId}] ERROR: Markdown output is identical to AsciiDoc input - conversion failed!`)
        const duration = (Date.now() - startTime) / 1000
        return {
          success: false,
          logs: logs,
          error: 'Conversion failed: output is identical to input. The downdoc library may not be working correctly.',
          duration: duration
        }
      }
      
      try {
        writeFileSync(outputPath, markdown, 'utf8')
        
        // Verify file was written correctly
        if (!existsSync(outputPath)) {
          const duration = (Date.now() - startTime) / 1000
          logs.push(`[${conversionId}] ERROR: Output file was not created`)
          return {
            success: false,
            logs: logs,
            error: 'Output file was not created',
            duration: duration
          }
        }
        
        // Verify file content matches what we wrote
        const writtenContent = readFileSync(outputPath, 'utf8')
        if (writtenContent !== markdown) {
          logs.push(`[${conversionId}] WARNING: Written content differs from expected markdown`)
          logs.push(`[${conversionId}] Expected length: ${markdown.length}, Written length: ${writtenContent.length}`)
        }
        
        // Final verification: ensure output is Markdown, not AsciiDoc
        if (writtenContent === asciidocContent) {
          const duration = (Date.now() - startTime) / 1000
          logs.push(`[${conversionId}] CRITICAL ERROR: Written file content is identical to input AsciiDoc!`)
          logs.push(`[${conversionId}] This means the conversion did not happen or the wrong file was written`)
          
          // Try to remove the incorrect file
          try {
            unlinkSync(outputPath)
            logs.push(`[${conversionId}] Incorrect output file removed`)
          } catch (unlinkError) {
            logs.push(`[${conversionId}] Warning: Failed to remove incorrect output file`)
          }
          
          return {
            success: false,
            logs: logs,
            error: 'Conversion failed: output file contains AsciiDoc instead of Markdown. The conversion did not occur.',
            duration: duration
          }
        }
        
        // Verify output looks like Markdown (basic check: should have # for headers, not =)
        if (writtenContent.includes('=') && writtenContent.match(/^=+\s+\w+/m)) {
          logs.push(`[${conversionId}] WARNING: Output file may still contain AsciiDoc syntax (starts with =)`)
          logs.push(`[${conversionId}] First line: ${writtenContent.split('\n')[0]}`)
        }
        
        logs.push(`[${conversionId}] Output file written successfully`)
        logs.push(`[${conversionId}] Output file size: ${writtenContent.length} characters`)
        logs.push(`[${conversionId}] Output preview (first 200 chars): ${writtenContent.substring(0, 200)}...`)
      } catch (error) {
        // Obligation 3 - Secure error handling: do not create partial file
        // If writing fails, remove file if it was partially created
        if (existsSync(outputPath)) {
          try {
            unlinkSync(outputPath)
            logs.push(`[${conversionId}] Partial output file removed`)
          } catch (unlinkError) {
            // Log but do not propagate deletion error
            logs.push(`[${conversionId}] Warning: Failed to remove partial output file`)
          }
        }

        const duration = (Date.now() - startTime) / 1000
        logs.push(`[${conversionId}] Failed to write output file: ${error.message}`)
        return {
          success: false,
          logs: logs,
          error: `Failed to write output file: ${error.message}`,
          duration: duration
        }
      }

      // Step 6: Return result (downdoc.module.md)
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      logs.push(`[${conversionId}] Conversion completed successfully`)
      logs.push(`[${conversionId}] Duration: ${duration.toFixed(3)}s`)
      logs.push(`[${conversionId}] Finished at ${new Date().toISOString()}`)

      return {
        success: true,
        logs: logs,
        error: null,
        duration: duration
      }

    } catch (error) {
      // Obligation 3 - Secure error handling: exhaustive capture
      // Any unexpected error must be captured and transformed into ModuleResult
      const duration = (Date.now() - startTime) / 1000
      logs.push(`[${conversionId}] Unexpected error: ${error.message}`)

      // Ensure no partial output file is left behind
      if (existsSync(outputPath)) {
        try {
          unlinkSync(outputPath)
          logs.push(`[${conversionId}] Partial output file removed after error`)
        } catch (unlinkError) {
          logs.push(`[${conversionId}] Warning: Failed to remove partial output file`)
        }
      }

      return {
        success: false,
        logs: logs,
        error: `Unexpected error: ${error.message}`,
        duration: duration
      }
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = downdocModule
