'use strict'

const express = require('express')
const cors = require('cors')
const { convertAsciiDoc } = require('./convert.js')
// Keep old imports for backward compatibility if needed
const downdoc = require('../lib/index.js')
const { adaptForBookStack } = require('./adapters/bookstack-adapter.js')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.text({ type: 'text/plain', limit: '10mb' }))

// Root route - Home page
app.get('/', (req, res) => {
  res.json({
    service: 'downdoc-api',
    version: require('../package.json').version,
    description: 'REST API to convert AsciiDoc to Markdown',
    status: 'running',
    endpoints: {
      'GET /': 'This page - API information',
      'GET /health': 'Check server status',
      'GET /info': 'Detailed API information',
      'POST /convert': 'Convert AsciiDoc content to Markdown',
      'POST /test': 'Test endpoint - shows before/after BookStack adaptation'
    },
    usage: {
      example: 'POST /convert',
      body: {
        content: '= Title\n\n* Item 1\n* Item 2',
        attributes: {}
      }
    }
  })
})

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'downdoc-api' })
})

// Main conversion route
app.post('/convert', async (req, res) => {
  try {
    let asciidoc
    let attributes = {}

    // Support for JSON and plain text
    if (typeof req.body === 'string') {
      asciidoc = req.body
    } else if (req.body && typeof req.body === 'object') {
      asciidoc = req.body.content || req.body.asciidoc || ''
      attributes = req.body.attributes || {}
    } else {
      return res.status(400).json({
        error: 'Invalid request body',
        message: 'The request body must contain AsciiDoc content (as plain text or in a JSON object with the "content" or "asciidoc" property)'
      })
    }

    if (!asciidoc || asciidoc.trim().length === 0) {
      return res.status(400).json({
        error: 'Empty content',
        message: 'AsciiDoc content cannot be empty'
      })
    }

    // Conversion
    // Check if BookStack mode is requested
    const bookstackMode = req.body.bookstack || req.query.bookstack === 'true'
    
    let markdown
    if (bookstackMode) {
      console.log('BookStack mode enabled, using convertAsciiDoc with Parsedown normalization...')
      const result = await convertAsciiDoc(asciidoc, 'bookstack')
      markdown = result.markdown
    } else {
      console.log('Using convertAsciiDoc in default mode (with basic cleanup)...')
      const result = await convertAsciiDoc(asciidoc, 'default')
      markdown = result.markdown
    }

    res.json({
      success: true,
      markdown,
      originalLength: asciidoc.length,
      convertedLength: markdown.length,
      bookstackMode: bookstackMode || false
    })
  } catch (error) {
    console.error('Conversion error:', error)
    res.status(500).json({
      error: 'Conversion error',
      message: error.message || 'An error occurred during conversion'
    })
  }
})

// Route to get API information
app.get('/info', (req, res) => {
  res.json({
    name: 'downdoc-api',
    version: require('../package.json').version,
    description: 'REST API to convert AsciiDoc to Markdown',
    endpoints: {
      'GET /': 'Home page - API information',
      'GET /health': 'Check server status',
      'GET /info': 'Detailed API information',
      'POST /convert': 'Convert AsciiDoc content to Markdown',
      'POST /test': 'Test endpoint - shows before/after BookStack adaptation'
    }
  })
})

// Test endpoint - shows raw downdoc output and BookStack adapted output
app.post('/test', async (req, res) => {
  try {
    let asciidoc
    let attributes = {}

    // Support for JSON and plain text
    if (typeof req.body === 'string') {
      asciidoc = req.body
    } else if (req.body && typeof req.body === 'object') {
      asciidoc = req.body.content || req.body.asciidoc || ''
      attributes = req.body.attributes || {}
    } else {
      return res.status(400).json({
        error: 'Invalid request body',
        message: 'The request body must contain AsciiDoc content'
      })
    }

    if (!asciidoc || asciidoc.trim().length === 0) {
      return res.status(400).json({
        error: 'Empty content',
        message: 'AsciiDoc content cannot be empty'
      })
    }

    // Get raw downdoc output (using old method for comparison)
    const rawMarkdown = downdoc(asciidoc, { attributes })
    
    // Get BookStack adapted output using the new convert module
    const adaptedMarkdown = (await convertAsciiDoc(asciidoc, 'bookstack')).markdown

    // Analyze differences
    const linesRaw = rawMarkdown.split('\n')
    const linesAdapted = adaptedMarkdown.split('\n')
    
    // Find lines that changed
    const changes = []
    const maxLines = Math.max(linesRaw.length, linesAdapted.length)
    for (let i = 0; i < maxLines; i++) {
      const rawLine = linesRaw[i] || ''
      const adaptedLine = linesAdapted[i] || ''
      if (rawLine !== adaptedLine) {
        changes.push({
          line: i + 1,
          raw: rawLine,
          adapted: adaptedLine
        })
      }
    }

    res.json({
      success: true,
      original: asciidoc,
      rawMarkdown: rawMarkdown,
      adaptedMarkdown: adaptedMarkdown,
      stats: {
        originalLength: asciidoc.length,
        rawMarkdownLength: rawMarkdown.length,
        adaptedMarkdownLength: adaptedMarkdown.length,
        rawLines: linesRaw.length,
        adaptedLines: linesAdapted.length,
        changedLines: changes.length
      },
      changes: changes.slice(0, 50), // Limit to first 50 changes
      analysis: {
        hasAdmonitions: /^\*\*([📝💡⚠️🔥❗⚠])\s+(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\*\*/m.test(rawMarkdown),
        hasCodeBlocks: /```/.test(rawMarkdown),
        hasTables: /\|/.test(rawMarkdown),
        hasHeadings: /^#+\s+/.test(rawMarkdown)
      }
    })
  } catch (error) {
    console.error('Test error:', error)
    res.status(500).json({
      error: 'Test error',
      message: error.message || 'An error occurred during test'
    })
  }
})

// 404 error handling
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  })
})

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Downdoc API server started on http://0.0.0.0:${PORT}`)
  console.log(`📝 Conversion endpoint: POST http://localhost:${PORT}/convert`)
  console.log(`🧪 Test endpoint: POST http://localhost:${PORT}/test`)
  console.log(`\n📍 Pour tester l'API:`)
  console.log(`   - Depuis WSL: curl http://localhost:${PORT}/health`)
  console.log(`   - Depuis Windows: utilisez l'IP de WSL ou Docker`)
  console.log(`\n⚠️  L'API doit rester en cours d'exécution dans ce terminal!`)
})

// Gestion des erreurs
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Erreur: Le port ${PORT} est déjà utilisé`)
    console.error(`   Solution: Arrêter le processus ou utiliser un autre port`)
    console.error(`   Trouver le processus: sudo lsof -i :${PORT}`)
  } else {
    console.error('❌ Erreur serveur:', error)
  }
  process.exit(1)
})

module.exports = app

