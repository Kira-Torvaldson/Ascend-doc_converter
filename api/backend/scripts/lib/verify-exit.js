'use strict'

/**
 * Clean exit for one-shot verify scripts.
 * Stops the persistent Pandoc server (Windows-safe) then forces process.exit
 * so open handles (HTTP keep-alive, timers) cannot keep Node alive.
 *
 * Usage:
 *   const { exitClean } = require('./lib/verify-exit.js')
 *   main().then(() => exitClean(0)).catch(async (err) => {
 *     console.error(err)
 *     await exitClean(1)
 *   })
 */

async function exitClean(code = 0) {
  try {
    const { shutdown } = require('../../services/conversion/pandoc-server.js')
    await Promise.resolve(shutdown())
  } catch (_) {
    /* ignore — script may not have loaded pandoc-server */
  }
  // Windows: brief defer avoids libuv UV_HANDLE_CLOSING assert after HTTP server.close().
  const settleMs = process.platform === 'win32' ? 150 : 0
  if (settleMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, settleMs))
  }
  process.exit(code)
}

module.exports = { exitClean }
