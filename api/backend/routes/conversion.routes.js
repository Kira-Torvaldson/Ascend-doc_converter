'use strict'

/**
 * CONVERSION ROUTES
 * 
 * Routes for document conversion endpoints
 */

const express = require('express')
const router = express.Router()
const { writeFileSync, readFileSync, unlinkSync, mkdirSync } = require('fs')
const { tmpdir } = require('os')
const { randomUUID } = require('crypto')
const path = require('path')
const { runConverter } = require('../services/modules/lazyload.module.js')
const { convertMarkdownWithPandoc, convertHtmlWithPandoc, convertWithPandoc, text2markdown, removeExperimentalTag, normalizeAsciiDocInput } = require('../services/conversion/convert.js')
const { z } = require('zod')
const { validate } = require('../middleware/security/validate.middleware.js')

// Endpoint: AsciiDoc → Markdown (utilise lazy loader avec downdoc)
router.post(
  '/to-markdown',
  validate({
    body: z.object({
      text: z.string().min(1),
      options: z.any().optional()
    })
  }),
  async (req, res) => {
  const conversionId = randomUUID()
  const tempDir = path.join(tmpdir(), `ascend-temp-${conversionId}`)
  let inputFile = null
  let outputFile = null

  try {
    const { text, options } = req.body

    if (!text.trim()) {
      return res.status(400).json({
        detail: "Le texte à convertir est vide"
      })
    }

    // Check if Parsedown is enabled in options
    const useParsedown = options?.formatSpecific?.markdown?.parsedown || false
    const mode = useParsedown ? 'bookstack' : 'default'

    console.log(`[INFO] Converting ${text.length} characters (AsciiDoc → Markdown) with lazy loader${useParsedown ? ' (Parsedown/BookStack mode)' : ''}`)

    // Remove :experimental: line from header only (no :toc: injection), then normalize
    let processedText = removeExperimentalTag(text)
    processedText = normalizeAsciiDocInput(processedText)

    // Créer le dossier temporaire
    mkdirSync(tempDir, { recursive: true })

    // Créer les fichiers temporaires
    inputFile = path.join(tempDir, 'input.adoc')
    outputFile = path.join(tempDir, 'output.md')

    // Écrire le contenu d'entrée normalisé
    writeFileSync(inputFile, processedText, 'utf8')
    console.log(`[INFO] Written normalized content to temp file (${processedText.length} chars)`)

    // Utiliser le lazy loader pour exécuter la conversion (downdoc with Pandoc fallback)
    const result = await runConverter('downdoc', inputFile, outputFile, {
      conversionId: conversionId,
      mode: mode
    })

    if (!result.success) {
      const errorMessage =
        result && result.error && typeof result.error === 'object'
          ? result.error.message
          : String(result && result.error ? result.error : 'unknown conversion failure')
      console.error(`[ERROR] Conversion failed: ${errorMessage}`)
      return res.status(500).json(result)
    }

    // Lire le résultat
    const markdown = readFileSync(outputFile, 'utf8')

    // Debug: vérifier que le résultat est bien du Markdown et non de l'AsciiDoc
    if (markdown === processedText) {
      console.error(`[ERROR] Output is identical to processed input - conversion did not occur!`)
      console.error(`[ERROR] Processed input length: ${processedText.length}, Output length: ${markdown.length}`)
      console.error(`[ERROR] First 100 chars of processed input: ${processedText.substring(0, 100)}`)
      console.error(`[ERROR] First 100 chars of output: ${markdown.substring(0, 100)}`)
      return res.status(500).json({
        detail: 'Conversion error: output is identical to processed input. The conversion did not occur.'
      })
    }

    // Vérifier que le résultat contient du Markdown et non de l'AsciiDoc
    // Détecter les attributs AsciiDoc (commencent par :) ou les titres AsciiDoc (commencent par =)
    const firstLines = markdown.trim().split('\n').slice(0, 5).join('\n')
    const hasAsciiDocAttributes = /^:[a-zA-Z-]+:/m.test(firstLines)
    const hasAsciiDocTitle = /^=+\s+\w+/m.test(firstLines)
    const hasMarkdownTitle = /^#+\s+\w+/m.test(markdown.trim())
    
    if ((hasAsciiDocAttributes || hasAsciiDocTitle) && !hasMarkdownTitle) {
      console.error(`[ERROR] Output appears to be AsciiDoc instead of Markdown!`)
      console.error(`[ERROR] First 200 chars: ${markdown.substring(0, 200)}`)
      console.error(`[ERROR] Has AsciiDoc attributes: ${hasAsciiDocAttributes}, Has AsciiDoc title: ${hasAsciiDocTitle}, Has Markdown title: ${hasMarkdownTitle}`)
      return res.status(500).json({
        detail: 'Conversion error: output appears to be AsciiDoc instead of Markdown. The conversion did not occur.'
      })
    }

    console.log(`[INFO] Conversion successful: ${markdown.length} Markdown characters generated`)
    console.log(`[INFO] First 100 chars of output: ${markdown.substring(0, 100)}`)

    return res.json({ markdown })
  } catch (error) {
    console.error('[ERROR] Error during AsciiDoc → Markdown conversion:', error)
    return res.status(500).json({
      detail: `Conversion error: ${error.message || String(error)}`
    })
  } finally {
    // Nettoyer les fichiers temporaires
    try {
      if (inputFile && require('fs').existsSync(inputFile)) {
        unlinkSync(inputFile)
      }
      if (outputFile && require('fs').existsSync(outputFile)) {
        unlinkSync(outputFile)
      }
      if (require('fs').existsSync(tempDir)) {
        require('fs').rmSync(tempDir, { recursive: true, force: true })
      }
    } catch (cleanupError) {
      console.warn(`[WARN] Failed to cleanup temp files: ${cleanupError.message}`)
    }
  }
})

// Endpoint: Markdown → AsciiDoc (uses Pandoc by default)
router.post(
  '/to-asciidoc',
  validate({
    body: z.object({
      text: z.string().min(1)
    })
  }),
  async (req, res) => {
  try {
    const { text } = req.body

    if (!text.trim()) {
      return res.status(400).json({
        detail: "The text to convert is empty"
      })
    }

    console.log(`[INFO] Converting ${text.length} characters (Markdown → AsciiDoc) with Pandoc`)

    // Use Pandoc for conversion (default)
    const asciidoc = await convertMarkdownWithPandoc(text)

    console.log(`[INFO] Conversion successful: ${asciidoc.length} AsciiDoc characters generated`)

    return res.json({ asciidoc })
  } catch (error) {
    console.error('[ERROR] Error during Markdown → AsciiDoc conversion:', error)
    return res.status(500).json({
      detail: `Conversion error: ${error.message || String(error)}`
    })
  }
})

// Endpoint: HTML → Other formats (uses Pandoc)
router.post(
  '/from-html',
  validate({
    body: z.object({
      text: z.string().min(1),
      to: z.string().min(1)
    })
  }),
  async (req, res) => {
  try {
    const { text, to } = req.body

    if (!text.trim()) {
      return res.status(400).json({
        detail: "The HTML text to convert is empty"
      })
    }

    console.log(`[INFO] Converting ${text.length} characters (HTML → ${to}) with Pandoc`)

    // Use Pandoc for conversion
    const result = await convertHtmlWithPandoc(text, to)

    console.log(`[INFO] Conversion successful: ${result.length} ${to} characters generated`)

    return res.json({ [to]: result })
  } catch (error) {
    console.error(`[ERROR] Error during HTML → ${req.body.to} conversion:`, error)
    return res.status(500).json({
      detail: `Conversion error: ${error.message || String(error)}`
    })
  }
})

// Endpoint: Text → Markdown (uses text2markdown)
router.post(
  '/text-to-markdown',
  validate({
    body: z.object({
      text: z.string().min(1)
    })
  }),
  async (req, res) => {
  try {
    const { text } = req.body

    if (!text.trim()) {
      return res.status(400).json({
        detail: "The text to convert is empty"
      })
    }

    console.log(`[INFO] Converting ${text.length} characters (Text → Markdown) with text2markdown`)

    // Use text2markdown for conversion
    const markdown = await text2markdown(text)

    console.log(`[INFO] Conversion successful: ${markdown.length} Markdown characters generated`)

    return res.json({ markdown })
  } catch (error) {
    console.error('[ERROR] Error during Text → Markdown conversion:', error)
    return res.status(500).json({
      detail: `Conversion error: ${error.message || String(error)}`
    })
  }
})

module.exports = router
