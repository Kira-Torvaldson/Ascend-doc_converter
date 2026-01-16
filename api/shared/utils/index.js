/**
 * ============================================================================
 * UTILS - Utilitaires généraux
 * ============================================================================
 */

/**
 * Valide qu'une valeur est une chaîne non vide
 */
function validateString(value, name = 'Value') {
  if (!value || typeof value !== 'string') {
    throw new Error(`${name} must be a non-empty string`)
  }
  return true
}

/**
 * Valide qu'un format est supporté
 */
function validateFormat(format, supportedFormats, name = 'Format') {
  if (!supportedFormats.includes(format)) {
    throw new Error(`${name} must be one of: ${supportedFormats.join(', ')}`)
  }
  return true
}

/**
 * Nettoie une chaîne (trim, etc.)
 */
function cleanString(str) {
  if (typeof str !== 'string') return ''
  return str.trim()
}

module.exports = {
  validateString,
  validateFormat,
  cleanString
}
