/**
 * Configuration des options d'encodage pour la conversion de documents
 * 
 * Ce module définit la structure et les valeurs par défaut pour la gestion
 * de l'encodage des caractères lors de la conversion de documents.
 * 
 * Approche API-first : structure JSON claire, valeurs par défaut sûres,
 * séparation entre encodage d'entrée, traitement interne et encodage de sortie.
 */

/**
 * Structure de configuration complète pour l'encodage
 * @typedef {Object} EncodingOptions
 * @property {InputEncodingOptions} input - Options d'encodage d'entrée
 * @property {OutputEncodingOptions} output - Options d'encodage de sortie
 * @property {InvalidCharacterHandling} invalidCharacters - Gestion des caractères invalides
 * @property {UnicodeNormalization} normalization - Normalisation Unicode
 * @property {CharacterCleaning} cleaning - Nettoyage des caractères invisibles
 * @property {ProcessingMode} processingMode - Mode de traitement (strict/tolérant)
 */

/**
 * Options d'encodage d'entrée
 * @typedef {Object} InputEncodingOptions
 * @property {string} encoding - Encodage d'entrée ('auto'|'utf-8'|'ascii'|'latin-1')
 * @property {boolean} autoDetect - Détection automatique (priorité UTF-8 si auto=true)
 * @property {boolean} fallbackToLatin1 - Utiliser Latin-1 si UTF-8 échoue (si auto=true)
 */

/**
 * Options d'encodage de sortie
 * @typedef {Object} OutputEncodingOptions
 * @property {string} encoding - Encodage de sortie ('utf-8'|'ascii'|'latin-1')
 * @property {boolean} addBOM - Ajouter BOM (Byte Order Mark) pour UTF-8
 */

/**
 * Gestion des caractères invalides
 * @typedef {Object} InvalidCharacterHandling
 * @property {string} strategy - Stratégie ('fail'|'replace'|'remove'|'transliterate')
 * @property {string} replacementChar - Caractère de substitution (si strategy='replace')
 * @property {boolean} logInvalidChars - Logger les caractères invalides détectés
 */

/**
 * Normalisation Unicode
 * @typedef {Object} UnicodeNormalization
 * @property {string} form - Forme de normalisation ('none'|'NFC'|'NFKC')
 * @property {boolean} preserveMeaning - Garantir que la normalisation n'altère pas le sens
 */

/**
 * Nettoyage des caractères invisibles
 * @typedef {Object} CharacterCleaning
 * @property {boolean} removeControlChars - Supprimer les caractères de contrôle (0x00-0x1F, sauf \t, \n, \r)
 * @property {boolean} removeDirectionalChars - Supprimer les caractères directionnels (RTL/LTR)
 * @property {boolean} removeZeroWidthChars - Supprimer les caractères de largeur zéro
 * @property {boolean} normalizeWhitespace - Normaliser les espaces multiples en un seul
 */

/**
 * Mode de traitement
 * @typedef {Object} ProcessingMode
 * @property {string} mode - Mode ('strict'|'tolerant')
 * @property {boolean} throwOnError - Lancer une erreur immédiate (mode strict)
 * @property {boolean} logWarnings - Logger les avertissements (mode tolérant)
 */

/**
 * Valeurs par défaut recommandées pour la production
 * 
 * Ces valeurs sont optimisées pour :
 * - Fiabilité : éviter les erreurs silencieuses
 * - Compatibilité : UTF-8 par défaut (standard moderne)
 * - Sécurité : nettoyage des caractères potentiellement problématiques
 * - Traçabilité : logging des problèmes détectés
 */
const DefaultEncodingOptions = {
  input: {
    encoding: 'auto',
    autoDetect: true,
    fallbackToLatin1: false, // Éviter les suppositions dangereuses
  },
  output: {
    encoding: 'utf-8',
    addBOM: false, // BOM optionnel, généralement non nécessaire
  },
  invalidCharacters: {
    strategy: 'replace', // Plus sûr que 'remove' (peut altérer le sens)
    replacementChar: '\uFFFD', // Caractère de substitution Unicode standard ()
    logInvalidChars: true, // Important pour le débogage en production
  },
  normalization: {
    form: 'NFC', // Forme Canonique Composée (standard recommandé)
    preserveMeaning: true, // Garantir que la normalisation n'altère pas le sens
  },
  cleaning: {
    removeControlChars: true, // Supprimer les caractères de contrôle (sauf \t, \n, \r)
    removeDirectionalChars: true, // Éviter les problèmes d'affichage RTL/LTR
    removeZeroWidthChars: true, // Supprimer les caractères invisibles potentiellement problématiques
    normalizeWhitespace: false, // Conserver les espaces multiples (peuvent être intentionnels)
  },
  processingMode: {
    mode: 'tolerant', // Mode tolérant par défaut (nettoyage + warnings)
    throwOnError: false, // Ne pas interrompre le traitement
    logWarnings: true, // Logger les problèmes pour analyse ultérieure
  },
};

/**
 * Options strictes pour les environnements critiques
 * 
 * Utiliser ces options lorsque :
 * - La validation stricte est requise
 * - Les erreurs doivent être immédiatement visibles
 * - La tolérance aux caractères invalides n'est pas acceptable
 */
const StrictEncodingOptions = {
  input: {
    encoding: 'utf-8', // Pas d'auto-détection, UTF-8 explicite
    autoDetect: false,
    fallbackToLatin1: false,
  },
  output: {
    encoding: 'utf-8',
    addBOM: false,
  },
  invalidCharacters: {
    strategy: 'fail', // Échouer immédiatement sur caractère invalide
    replacementChar: '\uFFFD',
    logInvalidChars: true,
  },
  normalization: {
    form: 'NFC',
    preserveMeaning: true,
  },
  cleaning: {
    removeControlChars: true,
    removeDirectionalChars: true,
    removeZeroWidthChars: true,
    normalizeWhitespace: false,
  },
  processingMode: {
    mode: 'strict',
    throwOnError: true, // Lancer une erreur immédiate
    logWarnings: true,
  },
};

/**
 * Options permissives pour la conversion de documents hérités
 * 
 * Utiliser ces options lorsque :
 * - Traitement de documents avec encodages mixtes ou inconnus
 * - Besoin de récupérer un maximum de contenu même si corrompu
 * - Acceptation de pertes de données mineures
 */
const PermissiveEncodingOptions = {
  input: {
    encoding: 'auto',
    autoDetect: true,
    fallbackToLatin1: true, // Accepter Latin-1 comme fallback
  },
  output: {
    encoding: 'utf-8',
    addBOM: false,
  },
  invalidCharacters: {
    strategy: 'transliterate', // Translittération pour préserver le contenu
    replacementChar: '\uFFFD',
    logInvalidChars: false, // Moins de logs pour éviter le bruit
  },
  normalization: {
    form: 'NFKC', // Normalisation plus agressive
    preserveMeaning: true,
  },
  cleaning: {
    removeControlChars: true,
    removeDirectionalChars: false, // Conserver les caractères directionnels
    removeZeroWidthChars: false, // Conserver les caractères de largeur zéro
    normalizeWhitespace: true, // Normaliser les espaces
  },
  processingMode: {
    mode: 'tolerant',
    throwOnError: false,
    logWarnings: false, // Moins de warnings pour éviter le bruit
  },
};

/**
 * Valide les options d'encodage fournies
 * @param {EncodingOptions} options - Options à valider
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateEncodingOptions(options) {
  const errors = [];

  // Validation de l'encodage d'entrée
  const validInputEncodings = ['auto', 'utf-8', 'ascii', 'latin-1'];
  if (!validInputEncodings.includes(options.input?.encoding)) {
    errors.push(`Encodage d'entrée invalide: ${options.input?.encoding}. Valeurs acceptées: ${validInputEncodings.join(', ')}`);
  }

  // Validation de l'encodage de sortie
  const validOutputEncodings = ['utf-8', 'ascii', 'latin-1'];
  if (!validOutputEncodings.includes(options.output?.encoding)) {
    errors.push(`Encodage de sortie invalide: ${options.output?.encoding}. Valeurs acceptées: ${validOutputEncodings.join(', ')}`);
  }

  // Validation de la stratégie de gestion des caractères invalides
  const validStrategies = ['fail', 'replace', 'remove', 'transliterate'];
  if (!validStrategies.includes(options.invalidCharacters?.strategy)) {
    errors.push(`Stratégie de gestion invalide: ${options.invalidCharacters?.strategy}. Valeurs acceptées: ${validStrategies.join(', ')}`);
  }

  // Validation de la forme de normalisation
  const validNormalizationForms = ['none', 'NFC', 'NFKC'];
  if (!validNormalizationForms.includes(options.normalization?.form)) {
    errors.push(`Forme de normalisation invalide: ${options.normalization?.form}. Valeurs acceptées: ${validNormalizationForms.join(', ')}`);
  }

  // Validation du mode de traitement
  const validModes = ['strict', 'tolerant'];
  if (!validModes.includes(options.processingMode?.mode)) {
    errors.push(`Mode de traitement invalide: ${options.processingMode?.mode}. Valeurs acceptées: ${validModes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Fusionne les options fournies avec les valeurs par défaut
 * @param {Partial<EncodingOptions>} userOptions - Options utilisateur
 * @param {EncodingOptions} defaults - Options par défaut (par défaut: DefaultEncodingOptions)
 * @returns {EncodingOptions} - Options fusionnées
 */
function mergeEncodingOptions(userOptions = {}, defaults = DefaultEncodingOptions) {
  return {
    input: {
      ...defaults.input,
      ...(userOptions.input || {}),
    },
    output: {
      ...defaults.output,
      ...(userOptions.output || {}),
    },
    invalidCharacters: {
      ...defaults.invalidCharacters,
      ...(userOptions.invalidCharacters || {}),
    },
    normalization: {
      ...defaults.normalization,
      ...(userOptions.normalization || {}),
    },
    cleaning: {
      ...defaults.cleaning,
      ...(userOptions.cleaning || {}),
    },
    processingMode: {
      ...defaults.processingMode,
      ...(userOptions.processingMode || {}),
    },
  };
}

/**
 * Récupère un preset d'options prédéfini
 * @param {string} preset - Nom du preset ('default'|'strict'|'permissive')
 * @returns {EncodingOptions} - Options du preset
 */
function getEncodingPreset(preset = 'default') {
  const presets = {
    default: DefaultEncodingOptions,
    strict: StrictEncodingOptions,
    permissive: PermissiveEncodingOptions,
  };

  return presets[preset] || DefaultEncodingOptions;
}

module.exports = {
  DefaultEncodingOptions,
  StrictEncodingOptions,
  PermissiveEncodingOptions,
  validateEncodingOptions,
  mergeEncodingOptions,
  getEncodingPreset,
};
