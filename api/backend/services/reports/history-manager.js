'use strict'

/**
 * Historique versionné des conversions round-trip.
 * Format épuré : summary (résumé lisible) + details (erreurs uniquement si nécessaire).
 * Fichier : history.json { summary: [...], details: [...] }
 */

const path = require('path')
const fs = require('fs')

const DEFAULT_REPORTS_DIR = path.join(__dirname, '../../reports')

/**
 * @param {string} [dir]
 * @returns {string}
 */
function getReportsDir(dir) {
  if (dir && typeof dir === 'string') return path.resolve(dir)
  try {
    const { envMap } = require('../config/envmap.module.js')
    const d = envMap.get('ASCEND_REPORTS_DIR')
    if (d) return path.resolve(d)
  } catch (_) {}
  return path.resolve(DEFAULT_REPORTS_DIR)
}

/**
 * Convertit une erreur texte en { type, description, severity }
 * @param {string} message
 * @param {'input_invalid'|'conversion_failed'|'no_output'|'success'} [context]
 */
function errorToStructured(message, context) {
  const m = (message || '').toLowerCase()
  let type = 'other'
  if (/image|path|exist|nope|\.png|\.jpg/.test(m)) type = 'image'
  else if (/block|----|====|listing|source|admonition|pair|unclosed/.test(m)) type = 'block'
  else if (/encoding|utf|bom|trim|normaliz/.test(m)) type = 'encoding'

  let severity = 'warning'
  if (context === 'input_invalid' || context === 'conversion_failed' || context === 'no_output') severity = 'critical'
  if (/round.trip|match|diff/.test(m) && context === 'success') severity = 'warning'

  return { type, description: String(message || ''), severity }
}

/**
 * Charge l'historique. Accepte l'ancien format (entries) et le migre vers summary/details.
 * @param {string} reportsDir
 * @returns {{ summary: object[], details: object[], lastVersion: number }}
 */
function loadHistory(reportsDir) {
  const historyPath = path.join(reportsDir, 'history.json')
  if (!fs.existsSync(historyPath)) {
    return { summary: [], details: [], lastVersion: 0 }
  }
  try {
    const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'))
    if (Array.isArray(data.summary) && Array.isArray(data.details)) {
      return {
        summary: data.summary,
        details: data.details || [],
        lastVersion: typeof data.lastVersion === 'number' ? data.lastVersion : data.summary.length
      }
    }
    // Migration ancien format (entries) → summary + details
    const entries = Array.isArray(data.entries) ? data.entries : []
    const summary = entries.map((e) => ({
      document: e.source_file ?? e.document ?? '',
      version: e.version,
      status: e.status ?? 'no_output',
      round_trip_match: !!e.round_trip_match,
      blocks_detected: typeof e.blocks_detected === 'number' ? e.blocks_detected : 0,
      images_detected: typeof e.images_detected === 'number' ? e.images_detected : 0,
      timestamp: e.timestamp ?? ''
    }))
    const details = entries
      .filter((e) => Array.isArray(e.errors) && e.errors.length > 0)
      .map((e) => ({
        document: e.source_file ?? e.document ?? '',
        version: e.version,
        errors: e.errors,
        output_md: e.output_md ?? '',
        output_adoc: e.output_adoc ?? ''
      }))
    return {
      summary,
      details,
      lastVersion: typeof data.version === 'number' ? data.version : summary.length
    }
  } catch (_) {
    return { summary: [], details: [], lastVersion: 0 }
  }
}

/**
 * Ajoute une conversion à l'historique (format épuré).
 * summary : une ligne par conversion (document, version, status, round_trip_match, blocks_detected, images_detected, timestamp).
 * details : entrée uniquement si errors.length > 0 (document, version, errors, output_md, output_adoc).
 *
 * @param {string} reportsDir
 * @param {object} entry - source_file, output_md, output_adoc, status, errors, blocks_detected, images_detected, round_trip_match, timestamp
 * @returns {{ summaryItem: object, detailsItem?: object }}
 */
function appendToHistory(reportsDir, entry) {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
  const { summary, details, lastVersion } = loadHistory(reportsDir)
  const newVersion = lastVersion + 1
  const doc = entry.source_file ?? entry.document ?? ''
  const ts = entry.timestamp || new Date().toISOString()
  const summaryItem = {
    document: doc,
    version: newVersion,
    status: entry.status ?? 'no_output',
    round_trip_match: !!entry.round_trip_match,
    blocks_detected: typeof entry.blocks_detected === 'number' ? entry.blocks_detected : 0,
    images_detected: typeof entry.images_detected === 'number' ? entry.images_detected : 0,
    timestamp: ts
  }
  const nextSummary = [...summary, summaryItem]
  let nextDetails = details
  let detailsItem
  const errs = Array.isArray(entry.errors) ? entry.errors : []
  if (errs.length > 0) {
    detailsItem = {
      document: doc,
      version: newVersion,
      errors: errs,
      output_md: entry.output_md ?? '',
      output_adoc: entry.output_adoc ?? ''
    }
    nextDetails = [...details, detailsItem]
  }
  const payload = {
    lastVersion: newVersion,
    summary: nextSummary,
    details: nextDetails
  }
  const historyPath = path.join(reportsDir, 'history.json')
  fs.writeFileSync(historyPath, JSON.stringify(payload, null, 2), 'utf8')
  return detailsItem ? { summaryItem, detailsItem } : { summaryItem }
}

module.exports = {
  getReportsDir,
  loadHistory,
  appendToHistory,
  errorToStructured
}
