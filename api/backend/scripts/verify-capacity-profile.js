'use strict'

/**
 * Smoke checks for soft-auto capacity profile.
 * Usage: node scripts/verify-capacity-profile.js
 */

const assert = require('assert')
const { computeCapacityProfile, formatCapacityLogLine } = require('../services/config/capacity-profile.js')
const { getLimitsSnapshot } = require('../services/config/conversion-limits.js')

function checkDesktop32() {
  const p = computeCapacityProfile({
    mode: 'soft-auto',
    hostProfile: 'desktop',
    totalRamMb: 32 * 1024,
    cpuCount: 12,
  })
  assert.ok(p.maxInputSizeMb >= 5 && p.maxInputSizeMb <= 16, `input ${p.maxInputSizeMb}`)
  assert.ok(p.maxConcurrentConversions >= 1 && p.maxConcurrentConversions <= 4)
  assert.ok(p.maxMemoryMb <= 4096)
  assert.ok(p.conversionTimeoutMs <= 90000)
  console.log('OK desktop 32GB:', formatCapacityLogLine(p))
}

function checkServer256() {
  const p = computeCapacityProfile({
    mode: 'soft-auto',
    hostProfile: 'server',
    totalRamMb: 256 * 1024,
    cpuCount: 24,
  })
  assert.ok(p.maxInputSizeMb <= 24)
  assert.ok(p.maxConcurrentConversions <= 8)
  assert.ok(p.maxMemoryMb <= 6144)
  console.log('OK server 256GB:', formatCapacityLogLine(p))
}

function checkLiveSnapshot() {
  const snap = getLimitsSnapshot()
  assert.ok(snap.maxInputSizeMb >= 5)
  assert.ok(snap.capacity && snap.capacity.mode)
  console.log('OK live snapshot:', JSON.stringify(snap, null, 2))
}

checkDesktop32()
checkServer256()
checkLiveSnapshot()
console.log('\nAll capacity profile checks passed.')
