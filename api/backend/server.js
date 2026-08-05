'use strict'

/**
 * SERVER ENTRY POINT
 * 
 * Starts the Express server
 */

const app = require('./app.js')
const { envMap } = require('./services/config/envmap.module.js')
const { formatCapacityLogLine } = require('./services/config/capacity-profile.js')

const PORT = envMap.get('PORT')

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🚀 Ascend Backend Server`)
  console.log(`${'='.repeat(60)}`)
  console.log(`   Server running on http://0.0.0.0:${PORT}`)
  console.log(`   Environment: ${envMap.get('NODE_ENV')}`)
  console.log(`   ${formatCapacityLogLine()}`)
  console.log(`\n📋 Available endpoints:`)
  console.log(`   GET  /                    - API documentation page`)
  console.log(`   POST /api/to-markdown     - Convert AsciiDoc → Markdown (downdoc)`)
  console.log(`   POST /api/to-asciidoc     - Convert Markdown → AsciiDoc (Pandoc)`)
  console.log(`   POST /api/from-html       - Convert HTML → Other formats (Pandoc)`)
  console.log(`   POST /api/from-markdown   - Convert Markdown → HTML / TXT / AsciiDoc (Pandoc)`)
  console.log(`   POST /api/from-text       - Convert Text → HTML / Markdown`)
  console.log(`   POST /api/text-to-markdown - Convert Text → Markdown (text2markdown)`)
  console.log(`   POST /api/confirmation/request - Request confirmation token`)
  console.log(`   GET  /api/confirmation/stats    - Get token statistics`)
  console.log(`   POST /api/convert              - Generic conversion with token`)
  console.log(`   GET  /api/logs/:conversionId    - Get conversion log`)
  console.log(`   GET  /api/logs                 - List all conversion logs`)
  console.log(`${'='.repeat(60)}\n`)
})
