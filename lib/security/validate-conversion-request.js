'use strict'

const fs = require('fs')
const { TextDecoder } = require('util')
const { assertSafePlannedPath } = require('./path-guard.js')
const { SecurityError, SECURITY_ERROR_CODES } = require('../errors/security-errors.js')

const DEFAULT_MAX_INPUT_SIZE_BYTES = 5 * 1024 * 1024 // 5 MiB
const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true })
const TEXT_LIKE_FORMATS = new Set([
  'txt',
  'text',
  'markdown',
  'md',
  'asciidoc',
  'adoc',
  'html',
  'yaml',
  'yml',
  'json',
  'rst',
  'latex',
  'tex'
])
// TODO(0.0.2.0-security): Add stronger MIME/magic-byte validation for binary and mixed inputs.
// TODO(0.0.2.0-security): Add OS-level sandbox policy checks for wrapper runtime contexts.

function normalizeFormat(format) {
  return String(format || '').trim().toLowerCase()
}

function getMaxInputSizeBytes(overrideBytes) {
  if (Number.isFinite(overrideBytes) && overrideBytes > 0) {
    return overrideBytes
  }

  try {
    const { envMap } = require('../../api/backend/services/config/envmap.module.js')
    const mb = Number(envMap.get('MAX_INPUT_SIZE_MB'))
    if (Number.isFinite(mb) && mb > 0) {
      return Math.floor(mb * 1024 * 1024)
    }
  } catch (error) {
    // Fallback below for backward compatibility.
  }

  const envBytes = Number(process.env.MAX_INPUT_SIZE)
  if (Number.isFinite(envBytes) && envBytes > 0) {
    return Math.floor(envBytes)
  }
  const envMb = Number(process.env.MAX_INPUT_SIZE_MB)
  if (Number.isFinite(envMb) && envMb > 0) {
    return Math.floor(envMb * 1024 * 1024)
  }
  return DEFAULT_MAX_INPUT_SIZE_BYTES
}

function findConverterForPair(converterRegistry, fromFormat, toFormat) {
  const normalizedFrom = normalizeFormat(fromFormat)
  const normalizedTo = normalizeFormat(toFormat)
  for (const [name, config] of Object.entries(converterRegistry || {})) {
    const fromList = (config.supportedFormats && config.supportedFormats.from) || []
    const toList = (config.supportedFormats && config.supportedFormats.to) || []
    if (fromList.map(normalizeFormat).includes(normalizedFrom) && toList.map(normalizeFormat).includes(normalizedTo)) {
      return { name, config }
    }
  }
  return null
}

function validateSupportedFormatPair(converterRegistry, fromFormat, toFormat) {
  const converter = findConverterForPair(converterRegistry, fromFormat, toFormat)
  if (!converter) {
    throw new SecurityError(SECURITY_ERROR_CODES.FORMAT_UNSUPPORTED)
  }
  return converter
}

function validateInputSize(inputPath, maxInputSizeBytes) {
  const stats = fs.statSync(inputPath)
  if (stats.size > maxInputSizeBytes) {
    throw new SecurityError(SECURITY_ERROR_CODES.PAYLOAD_TOO_LARGE)
  }
}

function validateEncodingForTextInput(inputPath, fromFormat) {
  const normalizedFrom = normalizeFormat(fromFormat)
  if (!TEXT_LIKE_FORMATS.has(normalizedFrom)) {
    return
  }
  try {
    const raw = fs.readFileSync(inputPath)
    UTF8_DECODER.decode(raw)
  } catch (error) {
    throw new SecurityError(SECURITY_ERROR_CODES.ENCODING_INVALID)
  }
}

function validateWrapperOrPipelineExistence(converter) {
  if (!converter || !converter.config) {
    throw new SecurityError(SECURITY_ERROR_CODES.FORMAT_UNSUPPORTED)
  }
  if (converter.config.executionType === 'lazy-load') {
    if (!converter.config.modulePath || !fs.existsSync(converter.config.modulePath)) {
      throw new SecurityError(SECURITY_ERROR_CODES.FORMAT_UNSUPPORTED)
    }
    return
  }
  if (converter.config.executionType === 'command') {
    // Only known command wrapper path is allowed in this release.
    if (converter.name !== 'pandoc') {
      throw new SecurityError(SECURITY_ERROR_CODES.FORMAT_UNSUPPORTED)
    }
    return
  }
  throw new SecurityError(SECURITY_ERROR_CODES.FORMAT_UNSUPPORTED)
}

/**
 * Validation Pipeline v1 (short-circuit on first failure).
 *
 * Order:
 *  1) supported format pair
 *  2) input size
 *  3) encoding for text-like input
 *  4) safe output path
 *  5) wrapper/pipeline existence
 *
 * @param {Object} params
 * @param {string} params.inputPath
 * @param {string} params.outputPath
 * @param {string} params.fromFormat
 * @param {string} params.toFormat
 * @param {Object} params.converterRegistry
 * @param {string} params.allowedPrefix
 * @param {number} [params.maxInputSizeBytes]
 * @returns {{converterName:string, converterConfig:Object, maxInputSizeBytes:number}}
 */
function validateConversionRequest(params) {
  const {
    inputPath,
    outputPath,
    fromFormat,
    toFormat,
    converterRegistry,
    allowedPrefix,
    maxInputSizeBytes
  } = params

  const converter = validateSupportedFormatPair(converterRegistry, fromFormat, toFormat)
  const resolvedMaxInput = getMaxInputSizeBytes(maxInputSizeBytes)
  validateInputSize(inputPath, resolvedMaxInput)
  validateEncodingForTextInput(inputPath, fromFormat)
  assertSafePlannedPath(outputPath, allowedPrefix)
  validateWrapperOrPipelineExistence(converter)

  return {
    converterName: converter.name,
    converterConfig: converter.config,
    maxInputSizeBytes: resolvedMaxInput
  }
}

module.exports = {
  validateConversionRequest,
  getMaxInputSizeBytes
}
