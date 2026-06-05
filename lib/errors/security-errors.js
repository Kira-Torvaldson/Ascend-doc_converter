'use strict'

/**
 * Stable machine-readable security error codes.
 */
const SECURITY_ERROR_CODES = Object.freeze({
  FORMAT_UNSUPPORTED: 'FORMAT_UNSUPPORTED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  ENCODING_INVALID: 'ENCODING_INVALID',
  MIME_MISMATCH: 'MIME_MISMATCH',
  PATH_TRAVERSAL: 'PATH_TRAVERSAL',
  SYMLINK_REJECTED: 'SYMLINK_REJECTED',
  NETWORK_ACCESS_DENIED: 'NETWORK_ACCESS_DENIED',
  CONVERSION_TIMEOUT: 'CONVERSION_TIMEOUT',
  WORKER_CRASH: 'WORKER_CRASH',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  PATH_NOT_FOUND: 'PATH_NOT_FOUND'
})

const DEFAULT_MESSAGES = Object.freeze({
  FORMAT_UNSUPPORTED: 'Requested conversion is not supported',
  PAYLOAD_TOO_LARGE: 'Request payload is too large',
  ENCODING_INVALID: 'Input encoding is invalid',
  MIME_MISMATCH: 'Input type validation failed',
  PATH_TRAVERSAL: 'Path validation failed',
  SYMLINK_REJECTED: 'Symbolic links are not allowed',
  NETWORK_ACCESS_DENIED: 'Network access is denied',
  CONVERSION_TIMEOUT: 'Conversion timed out',
  WORKER_CRASH: 'Conversion worker failed unexpectedly',
  RESOURCE_LIMIT_EXCEEDED: 'Resource limits exceeded',
  PATH_NOT_FOUND: 'Required path was not found'
})

class SecurityError extends Error {
  /**
   * @param {string} code - One value from SECURITY_ERROR_CODES.
   * @param {string} [message] - Optional safe message.
   */
  constructor(code, message) {
    const safeCode = SECURITY_ERROR_CODES[code] ? code : SECURITY_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED
    super(message || DEFAULT_MESSAGES[safeCode])
    this.name = 'SecurityError'
    this.code = safeCode
  }
}

function isSecurityError(error) {
  return error instanceof SecurityError
}

module.exports = {
  SECURITY_ERROR_CODES,
  SecurityError,
  isSecurityError
}
