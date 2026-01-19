'use strict'

/**
 * EXPRESS APPLICATION
 * 
 * Main Express application setup
 */

const express = require('express')
const path = require('path')
const fs = require('fs')
const corsMiddleware = require('./middleware/cors.middleware.js')
const errorHandler = require('./middleware/error-handler.middleware.js')

// Import routes
const conversionRoutes = require('./routes/conversion.routes.js')
const apiRoutes = require('./routes/api.routes.js')
const proxyRoutes = require('./services/proxy/secure-proxy.js')

// Import security and logging
const {
  ModuleIntegrityChecker,
  gracefulDegradationManager
} = require('./services/security/pipeline-security.js')

const app = express()

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS
app.use(corsMiddleware)

// Body parsing
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Static files
app.use('/static', express.static(path.join(__dirname, 'static')))
app.use('/public', express.static(path.join(__dirname, 'public')))

// ============================================================================
// SECURITY INITIALIZATION
// ============================================================================

// Module integrity check at startup (optional - modules are checked on demand)
// Note: ModuleIntegrityChecker.verifyIntegrity() is called per-module when needed
console.log('[INFO] Module integrity checker available')

// Graceful degradation is ready to use (no initialization needed)
// The manager is already instantiated and ready
console.log('[INFO] Graceful degradation manager ready')

// ============================================================================
// ROUTES
// ============================================================================

// Root route - Simple HTML page
app.get('/', (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'static', 'index.html')
    const html = fs.readFileSync(htmlPath, 'utf-8')
    res.send(html)
  } catch (error) {
    res.status(500).send('Erreur lors du chargement de la page')
  }
})

// Conversion routes
app.use('/', conversionRoutes)

// API routes
app.use('/api', apiRoutes)

// Proxy routes (secure data normalization)
app.use('/api/proxy', proxyRoutes)

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Global error handler (must be last)
app.use(errorHandler)

// ============================================================================
// UNHANDLED ERRORS
// ============================================================================

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit, just log
})

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught Exception:', error)
  // Exit gracefully
  process.exit(1)
})

module.exports = app
