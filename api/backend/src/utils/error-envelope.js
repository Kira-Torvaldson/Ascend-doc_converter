'use strict'

/**
 * ASC-005 — Error envelope helpers (category + hint)
 */

const ERROR_CATEGORIES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONVERSION_ERROR: 'CONVERSION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
})

const CATEGORY_BY_CODE = Object.freeze({
  EMPTY_INPUT: ERROR_CATEGORIES.VALIDATION_ERROR,
  INVALID_INPUT: ERROR_CATEGORIES.VALIDATION_ERROR,
  FORMAT_UNSUPPORTED: ERROR_CATEGORIES.VALIDATION_ERROR,
  PAYLOAD_TOO_LARGE: ERROR_CATEGORIES.VALIDATION_ERROR,
  ENCODING_INVALID: ERROR_CATEGORIES.VALIDATION_ERROR,
  MIME_MISMATCH: ERROR_CATEGORIES.VALIDATION_ERROR,
  PATH_TRAVERSAL: ERROR_CATEGORIES.VALIDATION_ERROR,
  SYMLINK_REJECTED: ERROR_CATEGORIES.VALIDATION_ERROR,
  PATH_NOT_FOUND: ERROR_CATEGORIES.VALIDATION_ERROR,
  CONVERSION_TIMEOUT: ERROR_CATEGORIES.TIMEOUT_ERROR,
  CONVERSION_FAILED: ERROR_CATEGORIES.CONVERSION_ERROR,
  OUTPUT_NOT_CREATED: ERROR_CATEGORIES.CONVERSION_ERROR,
  OUTPUT_INVALID: ERROR_CATEGORIES.CONVERSION_ERROR,
  OUTPUT_IS_INPUT: ERROR_CATEGORIES.CONVERSION_ERROR,
  WORKER_CRASH: ERROR_CATEGORIES.INTERNAL_ERROR,
  RESOURCE_LIMIT_EXCEEDED: ERROR_CATEGORIES.INTERNAL_ERROR,
  NETWORK_ACCESS_DENIED: ERROR_CATEGORIES.INTERNAL_ERROR,
  INTERNAL_ERROR: ERROR_CATEGORIES.INTERNAL_ERROR,
})

/** French hints aligned with api/frontend error-code-messages.ts */
const HINT_BY_CODE = Object.freeze({
  EMPTY_INPUT: 'Saisissez du contenu dans le panneau source.',
  INVALID_INPUT: 'Vérifiez le format et le contenu du document source.',
  PAYLOAD_TOO_LARGE: 'Réduisez la taille du document ou divisez-le en plusieurs parties.',
  FORMAT_UNSUPPORTED: 'Choisissez un format source et destination supportés par Ascend.',
  ENCODING_INVALID: 'Enregistrez le fichier en UTF-8 puis réessayez.',
  CONVERSION_TIMEOUT: 'Réessayez avec un document plus court ou simplifiez le contenu.',
  CONVERSION_FAILED: 'Modifiez la source et relancez la conversion.',
  OUTPUT_NOT_CREATED: 'Relancez la conversion ; si le problème persiste, consultez les logs.',
  OUTPUT_INVALID: 'Vérifiez la source : le résultat obtenu n’est pas un format valide.',
  OUTPUT_IS_INPUT: 'La conversion n’a pas transformé le document ; ajustez la source.',
  INTERNAL_ERROR: 'Réessayez plus tard ou contactez l’administrateur avec l’identifiant de conversion.',
  MIME_MISMATCH: 'Vérifiez l’extension et le contenu du fichier source.',
  PATH_TRAVERSAL: 'Utilisez un fichier dans un répertoire autorisé.',
  SYMLINK_REJECTED: 'Fournissez un fichier direct, sans lien symbolique.',
  NETWORK_ACCESS_DENIED: 'Retirez les références externes ou utilisez un contenu local.',
  WORKER_CRASH: 'Relancez la conversion ; si le problème persiste, consultez les logs.',
  RESOURCE_LIMIT_EXCEEDED: 'Réduisez la taille ou la complexité du document.',
  PATH_NOT_FOUND: 'Vérifiez que tous les fichiers référencés existent.',
})

function mapCodeToCategory(code) {
  return CATEGORY_BY_CODE[code] || ERROR_CATEGORIES.INTERNAL_ERROR
}

function getHintForCode(code) {
  if (!code) return null
  return HINT_BY_CODE[code] || null
}

/**
 * @param {string} code
 * @param {string} message
 * @param {object|null} details
 * @param {boolean} recoverable
 * @returns {{ code: string, message: string, details: object|null, recoverable: boolean, category: string, hint: string|null }}
 */
function buildRouteError(code, message, details = null, recoverable = false) {
  return {
    code,
    message,
    details,
    recoverable: Boolean(recoverable),
    category: mapCodeToCategory(code),
    hint: getHintForCode(code),
  }
}

/**
 * Ensures module/upstream errors include category + hint (ASC-005).
 */
function normalizeErrorObject(error) {
  if (!error || typeof error !== 'object' || Array.isArray(error)) {
    return buildRouteError('INTERNAL_ERROR', 'Unknown error')
  }
  const code = typeof error.code === 'string' && error.code.length > 0 ? error.code : 'INTERNAL_ERROR'
  const message =
    typeof error.message === 'string' && error.message.length > 0 ? error.message : 'Unknown error'
  const details = error.details ?? null
  const recoverable = Boolean(error.recoverable)
  if (typeof error.category === 'string' && Object.prototype.hasOwnProperty.call(error, 'hint')) {
    return {
      code,
      message,
      details,
      recoverable,
      category: error.category,
      hint: error.hint,
    }
  }
  return buildRouteError(code, message, details, recoverable)
}

module.exports = {
  ERROR_CATEGORIES,
  mapCodeToCategory,
  getHintForCode,
  buildRouteError,
  normalizeErrorObject,
}
