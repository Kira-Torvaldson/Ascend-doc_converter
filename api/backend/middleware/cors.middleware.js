'use strict'

/**
 * CORS MIDDLEWARE
 * 
 * CORS configuration for the API
 */

const cors = require('cors')

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
  ],
  credentials: true
}

module.exports = cors(corsOptions)
