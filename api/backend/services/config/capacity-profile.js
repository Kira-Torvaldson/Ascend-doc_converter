'use strict'

/**
 * Soft-auto capacity profile — adapts Ascend limits to host machine
 * without saturating it (~20% RAM budget, ~30% CPU concurrency).
 *
 * ASCEND_CAPACITY=soft-auto|manual (default: soft-auto)
 * ASCEND_HOST_PROFILE=auto|desktop|server (default: auto)
 */

const os = require('os')

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function readCapacityMode() {
  const raw = String(process.env.ASCEND_CAPACITY || 'soft-auto').trim().toLowerCase()
  return raw === 'manual' ? 'manual' : 'soft-auto'
}

function resolveHostProfile(totalRamMb, cpuCount, forced) {
  const raw = String(forced || process.env.ASCEND_HOST_PROFILE || 'auto').trim().toLowerCase()
  if (raw === 'desktop' || raw === 'server') return raw
  // Auto: machines modestes / postes de travail → desktop ; sinon server
  if (totalRamMb < 64 * 1024 && cpuCount <= 16) return 'desktop'
  return 'server'
}

/**
 * @param {{ totalRamMb?: number, cpuCount?: number, hostProfile?: string, mode?: string }} [overrides]
 */
function computeCapacityProfile(overrides = {}) {
  const mode = overrides.mode || readCapacityMode()
  const totalRamMb = Math.max(
    256,
    Math.round(overrides.totalRamMb ?? os.totalmem() / (1024 * 1024))
  )
  const cpuCount = Math.max(1, Math.round(overrides.cpuCount ?? os.cpus().length))
  const hostProfile = resolveHostProfile(totalRamMb, cpuCount, overrides.hostProfile)

  // Budget volontairement bas pour rester poli avec l'hôte
  const budgetRamMb = Math.round(totalRamMb * 0.2)

  let maxInputSizeMb
  let maxConcurrentConversions
  let recommendedHeapMb
  let maxMemoryMb
  let conversionTimeoutMs
  let maxCpuTimeMs
  let maxWallTimeMs

  if (hostProfile === 'desktop') {
    maxInputSizeMb = clamp(Math.round(budgetRamMb / 500), 5, 16)
    maxConcurrentConversions = clamp(Math.floor(cpuCount * 0.3), 1, 4)
    recommendedHeapMb = clamp(Math.round(budgetRamMb * 0.45), 512, 4096)
    maxMemoryMb = clamp(Math.round(budgetRamMb * 0.5), 512, 4096)
    conversionTimeoutMs = clamp(30000 + maxInputSizeMb * 2500, 30000, 90000)
  } else {
    maxInputSizeMb = clamp(Math.round(budgetRamMb / 450), 5, 24)
    maxConcurrentConversions = clamp(Math.floor(cpuCount * 0.3), 1, 8)
    recommendedHeapMb = clamp(Math.round(budgetRamMb * 0.4), 1024, 6144)
    maxMemoryMb = clamp(Math.round(budgetRamMb * 0.45), 1024, 6144)
    conversionTimeoutMs = clamp(30000 + maxInputSizeMb * 3000, 30000, 120000)
  }

  maxCpuTimeMs = conversionTimeoutMs
  maxWallTimeMs = conversionTimeoutMs + 15000

  return {
    mode,
    hostProfile,
    totalRamMb,
    cpuCount,
    budgetRamMb,
    maxInputSizeMb,
    maxConcurrentConversions,
    recommendedHeapMb,
    maxMemoryMb,
    conversionTimeoutMs,
    maxCpuTimeMs,
    maxWallTimeMs,
  }
}

let cachedProfile = null

function getCapacityProfile(forceRefresh = false) {
  if (!cachedProfile || forceRefresh) {
    cachedProfile = computeCapacityProfile()
  }
  return cachedProfile
}

function formatCapacityLogLine(profile = getCapacityProfile()) {
  return (
    `Capacity: ${profile.mode} · ${profile.hostProfile} · ` +
    `${profile.totalRamMb}MB RAM / ${profile.cpuCount} CPU · ` +
    `input ${profile.maxInputSizeMb}MB · concurrent ${profile.maxConcurrentConversions} · ` +
    `timeout ${Math.round(profile.conversionTimeoutMs / 1000)}s · ` +
    `budget ${profile.budgetRamMb}MB (~20%)`
  )
}

module.exports = {
  computeCapacityProfile,
  getCapacityProfile,
  formatCapacityLogLine,
  readCapacityMode,
  resolveHostProfile,
}
