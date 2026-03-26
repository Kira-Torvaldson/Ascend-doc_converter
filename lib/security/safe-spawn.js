'use strict'

const { spawn } = require('child_process')
const { SecurityError, SECURITY_ERROR_CODES } = require('./../errors/security-errors.js')

const DEFAULT_TIMEOUT_MS = 30000
const DEFAULT_MAX_OUTPUT_BYTES = 1024 * 1024 // 1 MiB
// TODO(0.0.2.0-security): Add process resourceLimits/rlimit integration per wrapper profile.
// TODO(0.0.2.0-security): Add optional WorkerThread isolation layer for native execution.
// TODO(0.0.2.0-security): Add deny-by-default network guard around child process execution.

/**
 * Safely executes a native process with bounded capture and timeout.
 *
 * Security boundaries:
 * - shell mode is forbidden
 * - args must be an array (no command string mode)
 * - stdout/stderr capture is bounded
 * - timeout is normalized to SecurityError(CONVERSION_TIMEOUT)
 *
 * @param {string} executable
 * @param {string[]} args
 * @param {Object} [options]
 * @param {string} [options.cwd]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.maxOutputBytes]
 * @param {number} [options.killGraceMs]
 * @param {boolean} [options.shell]
 * @returns {Promise<{ code:number, signal:string|null, stdout:string, stderr:string }>}
 */
function safeSpawn(executable, args, options = {}) {
  if (!Array.isArray(args)) {
    throw new TypeError('safeSpawn requires args as an array')
  }
  if (options.shell === true) {
    throw new Error('safeSpawn forbids shell mode')
  }

  const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0 ? options.timeoutMs : DEFAULT_TIMEOUT_MS
  const maxOutputBytes = Number.isFinite(options.maxOutputBytes) && options.maxOutputBytes > 0
    ? options.maxOutputBytes
    : DEFAULT_MAX_OUTPUT_BYTES
  const killGraceMs = Number.isFinite(options.killGraceMs) && options.killGraceMs > 0 ? options.killGraceMs : 5000

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: options.cwd,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''
    let stdoutBytes = 0
    let stderrBytes = 0
    let timedOut = false
    let outputOverflow = false
    let timeoutHandle = null

    const stopProcess = () => {
      if (!child.killed) {
        child.kill('SIGTERM')
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL')
          }
        }, killGraceMs)
      }
    }

    timeoutHandle = setTimeout(() => {
      timedOut = true
      stopProcess()
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      stdoutBytes += Buffer.byteLength(text)
      if (stdoutBytes > maxOutputBytes) {
        outputOverflow = true
        stopProcess()
        return
      }
      stdout += text
    })

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      stderrBytes += Buffer.byteLength(text)
      if (stderrBytes > maxOutputBytes) {
        outputOverflow = true
        stopProcess()
        return
      }
      stderr += text
    })

    child.on('error', (error) => {
      clearTimeout(timeoutHandle)
      reject(error)
    })

    child.on('close', (code, signal) => {
      clearTimeout(timeoutHandle)
      if (timedOut) {
        reject(new SecurityError(SECURITY_ERROR_CODES.CONVERSION_TIMEOUT))
        return
      }
      if (outputOverflow) {
        reject(new SecurityError(SECURITY_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED))
        return
      }
      resolve({
        code: typeof code === 'number' ? code : -1,
        signal: signal || null,
        stdout,
        stderr
      })
    })
  })
}

module.exports = {
  safeSpawn
}
