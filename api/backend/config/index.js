/**
 * ============================================================================
 * CONFIG - Configuration de l'API
 * ============================================================================
 */

module.exports = {
  // Ports
  API_PORT: process.env.API_PORT || 3001,
  BACKEND_PORT: process.env.BACKEND_PORT || 3003,
  
  // CORS
  CORS_ORIGINS: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
  ],
  
  // Request limits
  JSON_LIMIT: '50mb',
  TEXT_LIMIT: '50mb',
  
  // Timeouts
  CONVERSION_TIMEOUT: 30000, // 30 seconds
}
