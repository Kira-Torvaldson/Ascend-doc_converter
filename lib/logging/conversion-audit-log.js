'use strict'

const fs = require('fs')
const path = require('path')

function getAuditConfig() {
  try {
    const { envMap } = require('../../api/backend/services/config/envmap.module.js')
    const logsDir = envMap.get('LOGS_DIR')
    const maxSizeMb = Number(envMap.get('LOG_MAX_SIZE_MB'))
    const rotateCount = Number(envMap.get('LOG_ROTATE_COUNT'))
    return {
      logsDir,
      maxBytes: Number.isFinite(maxSizeMb) && maxSizeMb > 0 ? Math.floor(maxSizeMb * 1024 * 1024) : 10 * 1024 * 1024,
      rotateCount: Number.isFinite(rotateCount) && rotateCount > 0 ? Math.floor(rotateCount) : 5
    }
  } catch (error) {
    return {
      logsDir: path.resolve(__dirname, '../../api/logs'),
      maxBytes: 10 * 1024 * 1024,
      rotateCount: 5
    }
  }
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function rotateIfNeeded(filePath, maxBytes, rotateCount) {
  if (!fs.existsSync(filePath)) return
  const size = fs.statSync(filePath).size
  if (size < maxBytes) return

  for (let i = rotateCount - 1; i >= 1; i--) {
    const src = `${filePath}.${i}`
    const dst = `${filePath}.${i + 1}`
    if (fs.existsSync(src)) {
      fs.renameSync(src, dst)
    }
  }
  fs.renameSync(filePath, `${filePath}.1`)
}

/**
 * Writes one structured and sanitized conversion audit event as JSONL.
 *
 * @param {Object} event
 * @param {string} event.conversionId
 * @param {string} event.startTimestamp
 * @param {string} event.endTimestamp
 * @param {string} event.fromFormat
 * @param {string} event.toFormat
 * @param {string|null} event.inputHash
 * @param {number|null} event.inputSize
 * @param {boolean} event.success
 * @param {string|null} event.errorCode
 * @param {number|null} event.durationMs
 * @param {number|null} event.processExitCode
 */
function writeConversionAuditLog(event) {
  const cfg = getAuditConfig()
  ensureDir(cfg.logsDir)
  const filePath = path.join(cfg.logsDir, 'conversion-audit.log')
  rotateIfNeeded(filePath, cfg.maxBytes, cfg.rotateCount)

  const safeRecord = {
    conversionId: event.conversionId || null,
    startTimestamp: event.startTimestamp || null,
    endTimestamp: event.endTimestamp || null,
    fromFormat: event.fromFormat || null,
    toFormat: event.toFormat || null,
    inputHash: event.inputHash || null,
    inputSize: Number.isFinite(event.inputSize) ? event.inputSize : null,
    success: Boolean(event.success),
    errorCode: event.errorCode || null,
    durationMs: Number.isFinite(event.durationMs) ? event.durationMs : null,
    processExitCode: Number.isFinite(event.processExitCode) ? event.processExitCode : null
  }

  fs.appendFileSync(filePath, JSON.stringify(safeRecord) + '\n', 'utf8')
}

module.exports = {
  writeConversionAuditLog
}
