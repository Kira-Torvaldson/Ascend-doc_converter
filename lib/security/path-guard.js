'use strict'

const fs = require('fs')
const path = require('path')
const { SecurityError, SECURITY_ERROR_CODES } = require('../errors/security-errors.js')

function normalizeForCompare(inputPath) {
  return path.resolve(inputPath)
}

/**
 * Returns true if targetPath is inside basePath (or equal to it).
 *
 * @param {string} basePath
 * @param {string} targetPath
 * @returns {boolean}
 */
function isPathInside(basePath, targetPath) {
  const baseResolved = normalizeForCompare(basePath)
  const targetResolved = normalizeForCompare(targetPath)
  if (baseResolved === targetResolved) return true
  return targetResolved.startsWith(baseResolved + path.sep)
}

/**
 * Rejects symbolic links for an existing filesystem path.
 *
 * @param {string} filePath
 * @throws {SecurityError}
 */
function assertNoSymlink(filePath) {
  let stats
  try {
    stats = fs.lstatSync(filePath)
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new SecurityError(SECURITY_ERROR_CODES.PATH_NOT_FOUND)
    }
    throw error
  }
  if (stats.isSymbolicLink()) {
    throw new SecurityError(SECURITY_ERROR_CODES.SYMLINK_REJECTED)
  }
}

/**
 * Validates an existing path (input artifact).
 *
 * @param {string} filePath
 * @param {string} allowedPrefix
 * @returns {string} resolved absolute path
 * @throws {SecurityError}
 */
function assertSafeExistingPath(filePath, allowedPrefix) {
  const resolvedFilePath = normalizeForCompare(filePath)
  const resolvedPrefix = normalizeForCompare(allowedPrefix)
  if (!isPathInside(resolvedPrefix, resolvedFilePath)) {
    throw new SecurityError(SECURITY_ERROR_CODES.PATH_TRAVERSAL)
  }
  if (!fs.existsSync(resolvedFilePath)) {
    throw new SecurityError(SECURITY_ERROR_CODES.PATH_NOT_FOUND)
  }
  assertNoSymlink(resolvedFilePath)
  return resolvedFilePath
}

/**
 * Validates a planned path (output artifact may not exist yet).
 *
 * @param {string} filePath
 * @param {string} allowedPrefix
 * @returns {string} resolved absolute path
 * @throws {SecurityError}
 */
function assertSafePlannedPath(filePath, allowedPrefix) {
  const resolvedFilePath = normalizeForCompare(filePath)
  const resolvedPrefix = normalizeForCompare(allowedPrefix)
  if (!isPathInside(resolvedPrefix, resolvedFilePath)) {
    throw new SecurityError(SECURITY_ERROR_CODES.PATH_TRAVERSAL)
  }

  // Check every existing parent segment for symlink usage.
  let cursor = resolvedFilePath
  while (cursor && cursor.length >= resolvedPrefix.length) {
    if (fs.existsSync(cursor)) {
      assertNoSymlink(cursor)
      break
    }
    const parent = path.dirname(cursor)
    if (parent === cursor) break
    cursor = parent
  }

  return resolvedFilePath
}

module.exports = {
  isPathInside,
  assertSafeExistingPath,
  assertSafePlannedPath,
  assertNoSymlink
}
