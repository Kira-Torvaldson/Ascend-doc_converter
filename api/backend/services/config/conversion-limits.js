'use strict'

/**
 * ASC-008 — Single source for conversion input size limits.
 * soft-auto: derived from host capacity (~20% RAM budget).
 * manual: EnvMap MAX_INPUT_SIZE_MB / CONVERSION_TIMEOUT_MS / …
 */

const { envMap } = require('./envmap.module.js')
const { getCapacityProfile, readCapacityMode } = require('./capacity-profile.js')

function isSoftAuto() {
  return readCapacityMode() === 'soft-auto'
}

function getMaxInputSizeMb() {
  if (isSoftAuto()) return getCapacityProfile().maxInputSizeMb
  const mb = Number(envMap.get('MAX_INPUT_SIZE_MB'))
  return Number.isFinite(mb) && mb > 0 ? mb : 5
}

function getMaxInputSizeBytes() {
  return Math.floor(getMaxInputSizeMb() * 1024 * 1024)
}

function getConversionTimeoutMs() {
  if (isSoftAuto()) return getCapacityProfile().conversionTimeoutMs
  const ms = Number(envmapTimeout())
  return Number.isFinite(ms) && ms > 0 ? ms : 30000
}

function envmapTimeout() {
  return Number(envMap.get('CONVERSION_TIMEOUT_MS'))
}

function getMaxConcurrentConversions() {
  if (isSoftAuto()) return getCapacityProfile().maxConcurrentConversions
  const n = Number(envMap.get('MAX_CONCURRENT_CONVERSIONS'))
  return Number.isFinite(n) && n > 0 ? n : 5
}

function getMaxMemoryMb() {
  if (isSoftAuto()) return getCapacityProfile().maxMemoryMb
  const mb = Number(envMap.get('MAX_MEMORY_MB'))
  return Number.isFinite(mb) && mb > 0 ? mb : 512
}

function getMaxCpuTimeMs() {
  if (isSoftAuto()) return getCapacityProfile().maxCpuTimeMs
  const ms = Number(envMap.get('MAX_CPU_TIME_MS'))
  return Number.isFinite(ms) && ms > 0 ? ms : 30000
}

function getMaxWallTimeMs() {
  if (isSoftAuto()) return getCapacityProfile().maxWallTimeMs
  const ms = Number(envMap.get('MAX_WALL_TIME_MS'))
  return Number.isFinite(ms) && ms > 0 ? ms : 60000
}

function getLimitsSnapshot() {
  const profile = getCapacityProfile()
  const maxInputSizeMb = getMaxInputSizeMb()
  return {
    maxInputSizeMb,
    maxInputSizeBytes: getMaxInputSizeBytes(),
    maxSourceUiMb: maxInputSizeMb,
    conversionTimeoutMs: getConversionTimeoutMs(),
    maxConcurrentConversions: getMaxConcurrentConversions(),
    maxMemoryMb: getMaxMemoryMb(),
    capacity: {
      mode: profile.mode,
      hostProfile: profile.hostProfile,
      totalRamMb: profile.totalRamMb,
      cpuCount: profile.cpuCount,
      budgetRamMb: profile.budgetRamMb,
      recommendedHeapMb: profile.recommendedHeapMb,
    },
  }
}

/** Express body parser limit with small margin over max input. */
function getExpressBodyLimitString() {
  const bytes = getMaxInputSizeBytes()
  const mb = Math.max(1, Math.ceil((bytes * 1.2) / (1024 * 1024)))
  return `${mb}mb`
}

module.exports = {
  getMaxInputSizeMb,
  getMaxInputSizeBytes,
  getConversionTimeoutMs,
  getMaxConcurrentConversions,
  getMaxMemoryMb,
  getMaxCpuTimeMs,
  getMaxWallTimeMs,
  getLimitsSnapshot,
  getExpressBodyLimitString,
  isSoftAuto,
}
