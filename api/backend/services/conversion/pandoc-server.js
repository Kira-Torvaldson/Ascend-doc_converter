'use strict'

/**
 * PANDOC SERVER CLIENT
 *
 * Manages a persistent `pandoc server` child process (Pandoc >= 3.0) so that
 * conversions skip the per-request binary startup cost (~50-150 ms each).
 *
 * Design:
 * - Lazy start on first conversion; concurrent callers share the same startup.
 * - Readiness checked via GET /version.
 * - Any transport-level problem (spawn failure, connection refused, non-200
 *   response) marks the server unavailable and the caller falls back to the
 *   CLI path — correctness never depends on the server being up.
 * - Retry to start again after RETRY_AFTER_MS.
 * - The child is unref'd (does not keep one-shot scripts alive) and killed
 *   on process exit.
 * - Can be disabled via EnvMap PANDOC_SERVER_ENABLED=false.
 */

const { spawn } = require('child_process')
const net = require('net')
const { envMap } = require('../config/envmap.module.js')
const { getConversionTimeoutMs } = require('../config/conversion-limits.js')
const { SecurityError, SECURITY_ERROR_CODES } = require('../../../../lib/errors/security-errors.js')

const RETRY_AFTER_MS = 60000
const STARTUP_PROBE_INTERVAL_MS = 100
const STARTUP_PROBE_ATTEMPTS = 30 // ~3 s max

let state = 'idle' // idle | starting | ready | unavailable
let child = null
let baseUrl = null
let startPromise = null
let unavailableSince = 0
let exitHookRegistered = false

function isEnabled() {
  try {
    return envMap.get('PANDOC_SERVER_ENABLED') !== false
  } catch (_) {
    return true
  }
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
  })
}

function registerExitHook() {
  if (exitHookRegistered) return
  exitHookRegistered = true
  process.on('exit', () => {
    if (child && !child.killed) {
      try { child.kill() } catch (_) {}
    }
  })
}

function markUnavailable(reason) {
  if (state !== 'unavailable') {
    console.warn(`[PANDOC_SERVER] Unavailable (${reason}); falling back to CLI for ${RETRY_AFTER_MS / 1000}s`)
  }
  state = 'unavailable'
  unavailableSince = Date.now()
  baseUrl = null
  if (child && !child.killed) {
    try { child.kill() } catch (_) {}
  }
  child = null
  startPromise = null
}

async function probeReady(url, timeoutMs = 1000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${url}/version`, { signal: controller.signal })
    return response.ok
  } catch (_) {
    return false
  } finally {
    clearTimeout(timer)
  }
}

async function startServer() {
  const port = await findFreePort()
  const url = `http://127.0.0.1:${port}`
  const timeoutSeconds = Math.max(1, Math.ceil(getConversionTimeoutMs() / 1000))

  // stdio fully ignored: no pipes, so the unref'd child never keeps
  // one-shot scripts or test runners alive.
  const proc = spawn('pandoc', ['server', `--port=${port}`, `--timeout=${timeoutSeconds}`], {
    shell: false,
    stdio: 'ignore',
    windowsHide: true,
  })
  proc.unref()

  let spawnFailed = false
  proc.once('error', () => { spawnFailed = true })
  proc.once('exit', () => {
    // Unexpected exit (or pandoc < 3 rejecting the `server` argument)
    if (child === proc) {
      markUnavailable('process exited')
    } else {
      spawnFailed = true
    }
  })

  for (let attempt = 0; attempt < STARTUP_PROBE_ATTEMPTS; attempt++) {
    if (spawnFailed) break
    if (await probeReady(url)) {
      child = proc
      baseUrl = url
      state = 'ready'
      registerExitHook()
      console.log(`[PANDOC_SERVER] Ready on ${url} (timeout ${timeoutSeconds}s)`)
      return true
    }
    await new Promise((resolve) => setTimeout(resolve, STARTUP_PROBE_INTERVAL_MS))
  }

  try { proc.kill() } catch (_) {}
  return false
}

async function ensureReady() {
  if (!isEnabled()) return false
  if (state === 'ready') return true
  if (state === 'unavailable') {
    if (Date.now() - unavailableSince < RETRY_AFTER_MS) return false
    state = 'idle'
  }
  if (!startPromise) {
    state = 'starting'
    startPromise = startServer()
      .then((ok) => {
        if (!ok) markUnavailable('startup failed')
        return ok
      })
      .catch(() => {
        markUnavailable('startup error')
        return false
      })
      .finally(() => {
        startPromise = null
      })
  }
  return startPromise
}

/**
 * Converts a document through the persistent pandoc server.
 *
 * @param {string} from - Pandoc input format
 * @param {string} to - Pandoc output format
 * @param {string} text - Document content
 * @returns {Promise<string|null>} Converted text, or null when the server is
 *   unavailable (caller must fall back to the CLI path)
 * @throws {SecurityError} CONVERSION_TIMEOUT when the conversion times out
 */
async function convertViaServer(from, to, text) {
  const ready = await ensureReady()
  if (!ready || !baseUrl) return null

  const timeoutMs = getConversionTimeoutMs()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/plain' },
      body: JSON.stringify({ text, from, to }),
      signal: controller.signal,
    })
    if (!response.ok) {
      // Server-specific rejection: let the CLI path decide (it fails fast on
      // genuinely invalid input, and succeeds where the server has limits).
      return null
    }
    return await response.text()
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new SecurityError(SECURITY_ERROR_CODES.CONVERSION_TIMEOUT)
    }
    // Transport error: server likely died
    markUnavailable('request failed')
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Test/ops helper: stops the server and resets state. */
function shutdown() {
  if (child && !child.killed) {
    try { child.kill() } catch (_) {}
  }
  child = null
  baseUrl = null
  state = 'idle'
  startPromise = null
}

function getStatus() {
  return { state, baseUrl, enabled: isEnabled() }
}

module.exports = {
  convertViaServer,
  shutdown,
  getStatus,
}
