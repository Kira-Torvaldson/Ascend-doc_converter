/**
 * Options supplémentaires pour la normalisation avancée
 * 
 * Ce module définit les options avancées de normalisation qui améliorent :
 * - la cohérence du contenu
 * - la stabilité des conversions
 * - la compatibilité inter-formats
 * - la sécurité liée aux caractères et à l'encodage
 * 
 * Principe fondamental : Aucune option active par défaut ne doit altérer le sens du texte.
 * Approche API-first : Structure JSON claire, valeurs par défaut sûres et conservatrices.
 */

/**
 * Structure de configuration complète pour les options supplémentaires de normalisation
 * @typedef {Object} AdvancedNormalizationOptions
 * @property {UnicodeManagement} unicode - Gestion Unicode avancée
 * @property {CharacterCleaning} characterCleaning - Nettoyage des caractères
 * @property {TransliterationAndFallback} transliteration - Translittération et repli
 * @property {ContentValidation} validation - Validation du contenu
 * @property {ProcessingMode} processingMode - Mode de traitement
 */

/**
 * Gestion Unicode avancée
 * @typedef {Object} UnicodeManagement
 * @property {string} mode - Mode Unicode ('full'|'restricted'|'disabled')
 * @property {string} normalization - Normalisation Unicode ('none'|'NFC'|'NFKC')
 * @property {boolean} detectConfusables - Détecter les caractères visuellement confusables
 * @property {string} confusablesAction - Action sur les confusables ('none'|'warn'|'replace')
 */

/**
 * Nettoyage des caractères
 * @typedef {Object} CharacterCleaning
 * @property {boolean} removeControlChars - Supprimer les caractères de contrôle invisibles
 * @property {boolean} removeDirectionalChars - Supprimer les caractères directionnels (RTL/LTR)
 * @property {boolean} removeNonPrintableChars - Supprimer les caractères non imprimables
 * @property {boolean} preserveWhitespace - Préserver les espaces (tabs, newlines) essentiels
 */

/**
 * Translittération et repli
 * @typedef {Object} TransliterationAndFallback
 * @property {string} strategy - Stratégie ('none'|'simple'|'configurable')
 * @property {boolean} enableTransliteration - Activer la translittération simple (é → e)
 * @property {UnicodeToAsciiFallback} unicodeToAscii - Stratégie de repli Unicode → ASCII
 */

/**
 * Stratégie de repli Unicode → ASCII
 * @typedef {Object} UnicodeToAsciiFallback
 * @property {boolean} enabled - Activer le repli Unicode → ASCII
 * @property {string} method - Méthode ('remove'|'replace'|'transliterate')
 * @property {string} replacementChar - Caractère de remplacement (si method='replace')
 */

/**
 * Validation du contenu
 * @typedef {Object} ContentValidation
 * @property {boolean} rejectInvalidSequences - Refuser les séquences Unicode invalides
 * @property {boolean} rejectPrivateChars - Refuser les caractères privés (Private Use Area)
 * @property {boolean} warnOutOfRange - Signaler les caractères hors plage autorisée
 * @property {string[]} allowedRanges - Plages Unicode autorisées (par défaut: toutes sauf privées)
 */

/**
 * Mode de traitement
 * @typedef {Object} ProcessingMode
 * @property {string} mode - Mode ('strict'|'tolerant')
 * @property {boolean} throwOnError - Lancer une erreur immédiate (mode strict)
 * @property {boolean} logWarnings - Logger les avertissements (mode tolérant)
 * @property {boolean} continueOnWarning - Continuer le traitement malgré les warnings
 */

/**
 * Valeurs par défaut recommandées pour la production
 * 
 * Ces valeurs sont optimisées pour :
 * - Non-destructivité : aucune option ne modifie le sens par défaut
 * - Sécurité : détection et nettoyage des caractères problématiques
 * - Compatibilité : normalisation Unicode standard (NFC)
 * - Traçabilité : warnings pour les problèmes détectés
 */
const DefaultAdvancedNormalizationOptions = {
  unicode: {
    mode: 'full', // Mode Unicode complet (support de tous les caractères Unicode valides)
    normalization: 'NFC', // Forme Canonique Composée (standard recommandé, ne modifie pas le sens)
    detectConfusables: true, // Détecter les caractères visuellement confusables
    confusablesAction: 'warn', // Uniquement avertir, ne pas modifier (non-destructif)
  },
  characterCleaning: {
    removeControlChars: false, // Désactivé par défaut (peut être destructif)
    removeDirectionalChars: false, // Désactivé par défaut (peut altérer l'affichage)
    removeNonPrintableChars: false, // Désactivé par défaut (peut être destructif)
    preserveWhitespace: true, // Préserver les espaces essentiels (tabs, newlines)
  },
  transliteration: {
    strategy: 'none', // Aucune translittération par défaut (non-destructif)
    enableTransliteration: false, // Désactivé par défaut (peut altérer le sens)
    unicodeToAscii: {
      enabled: false, // Désactivé par défaut (peut être destructif)
      method: 'transliterate', // Méthode si activée
      replacementChar: '?', // Caractère de remplacement si method='replace'
    },
  },
  validation: {
    rejectInvalidSequences: true, // Refuser les séquences invalides (sécurité)
    rejectPrivateChars: false, // Ne pas rejeter les caractères privés par défaut (peut être légitime)
    warnOutOfRange: true, // Signaler les caractères hors plage (traçabilité)
    allowedRanges: [], // Vide = toutes les plages autorisées sauf Private Use Area
  },
  processingMode: {
    mode: 'tolerant', // Mode tolérant par défaut (nettoyage + warnings)
    throwOnError: false, // Ne pas interrompre le traitement
    logWarnings: true, // Logger les avertissements pour analyse
    continueOnWarning: true, // Continuer malgré les warnings
  },
};

/**
 * Options strictes pour les environnements critiques
 * 
 * Utiliser ces options lorsque :
 * - La validation stricte est requise
 * - Les erreurs doivent être immédiatement visibles
 * - La tolérance aux caractères problématiques n'est pas acceptable
 */
const StrictAdvancedNormalizationOptions = {
  unicode: {
    mode: 'full',
    normalization: 'NFC',
    detectConfusables: true,
    confusablesAction: 'warn', // Toujours avertir, même en mode strict
  },
  characterCleaning: {
    removeControlChars: true, // Activer le nettoyage strict
    removeDirectionalChars: true, // Supprimer les caractères directionnels
    removeNonPrintableChars: true, // Supprimer les caractères non imprimables
    preserveWhitespace: true, // Préserver les espaces essentiels
  },
  transliteration: {
    strategy: 'none',
    enableTransliteration: false,
    unicodeToAscii: {
      enabled: false,
      method: 'transliterate',
      replacementChar: '?',
    },
  },
  validation: {
    rejectInvalidSequences: true,
    rejectPrivateChars: true, // Rejeter les caractères privés en mode strict
    warnOutOfRange: true,
    allowedRanges: [],
  },
  processingMode: {
    mode: 'strict',
    throwOnError: true, // Lancer une erreur immédiate
    logWarnings: true,
    continueOnWarning: false, // Ne pas continuer sur warning
  },
};

/**
 * Options permissives pour la conversion de documents hérités ou corrompus
 * 
 * Utiliser ces options lorsque :
 * - Traitement de documents avec encodages mixtes ou inconnus
 * - Besoin de récupérer un maximum de contenu même si corrompu
 * - Acceptation de pertes de données mineures
 */
const PermissiveAdvancedNormalizationOptions = {
  unicode: {
    mode: 'full',
    normalization: 'NFKC', // Normalisation plus agressive
    detectConfusables: false, // Désactiver la détection pour éviter le bruit
    confusablesAction: 'none',
  },
  characterCleaning: {
    removeControlChars: true, // Nettoyer les caractères problématiques
    removeDirectionalChars: false, // Conserver les caractères directionnels
    removeNonPrintableChars: true, // Nettoyer les caractères non imprimables
    preserveWhitespace: false, // Normaliser les espaces
  },
  transliteration: {
    strategy: 'simple', // Activer la translittération simple
    enableTransliteration: true, // Translittération activée
    unicodeToAscii: {
      enabled: true, // Activer le repli Unicode → ASCII
      method: 'transliterate', // Translittération plutôt que suppression
      replacementChar: '?',
    },
  },
  validation: {
    rejectInvalidSequences: false, // Ne pas rejeter (tolérance maximale)
    rejectPrivateChars: false,
    warnOutOfRange: false, // Moins de warnings pour éviter le bruit
    allowedRanges: [],
  },
  processingMode: {
    mode: 'tolerant',
    throwOnError: false,
    logWarnings: false, // Moins de logs pour éviter le bruit
    continueOnWarning: true,
  },
};

/**
 * Plages Unicode couramment utilisées pour la validation
 */
const UnicodeRanges = {
  // Plages de base
  BASIC_LATIN: { start: 0x0000, end: 0x007F }, // ASCII
  LATIN_1_SUPPLEMENT: { start: 0x0080, end: 0x00FF }, // Latin-1
  LATIN_EXTENDED_A: { start: 0x0100, end: 0x017F },
  LATIN_EXTENDED_B: { start: 0x0180, end: 0x024F },
  
  // Caractères spéciaux
  GENERAL_PUNCTUATION: { start: 0x2000, end: 0x206F },
  PRIVATE_USE_AREA: { start: 0xE000, end: 0xF8FF }, // À rejeter par défaut
  
  // Caractères de contrôle
  CONTROL_CHARS: { start: 0x0000, end: 0x001F }, // Sauf \t (0x09), \n (0x0A), \r (0x0D)
  DELETE_CHAR: { start: 0x007F, end: 0x007F },
  
  // Caractères directionnels
  DIRECTIONAL_CHARS: { start: 0x200E, end: 0x200F }, // LTR, RTL marks
  DIRECTIONAL_ISOLATE: { start: 0x2066, end: 0x2069 }, // Isolate marks
  
  // Caractères de largeur zéro
  ZERO_WIDTH_CHARS: [
    { start: 0x200B, end: 0x200B }, // Zero-width space
    { start: 0x200C, end: 0x200D }, // Zero-width non-joiner/joiner
    { start: 0xFEFF, end: 0xFEFF }, // Zero-width no-break space (BOM)
  ],
};

/**
 * Valide les options de normalisation avancée
 * @param {AdvancedNormalizationOptions} options - Options à valider
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateAdvancedNormalizationOptions(options) {
  const errors = [];

  // Validation du mode Unicode
  const validUnicodeModes = ['full', 'restricted', 'disabled'];
  if (!validUnicodeModes.includes(options.unicode?.mode)) {
    errors.push(`Mode Unicode invalide: ${options.unicode?.mode}. Valeurs acceptées: ${validUnicodeModes.join(', ')}`);
  }

  // Validation de la normalisation Unicode
  const validNormalizationForms = ['none', 'NFC', 'NFKC'];
  if (!validNormalizationForms.includes(options.unicode?.normalization)) {
    errors.push(`Forme de normalisation invalide: ${options.unicode?.normalization}. Valeurs acceptées: ${validNormalizationForms.join(', ')}`);
  }

  // Validation de l'action sur les confusables
  const validConfusablesActions = ['none', 'warn', 'replace'];
  if (!validConfusablesActions.includes(options.unicode?.confusablesAction)) {
    errors.push(`Action sur confusables invalide: ${options.unicode?.confusablesAction}. Valeurs acceptées: ${validConfusablesActions.join(', ')}`);
  }

  // Validation de la stratégie de translittération
  const validTransliterationStrategies = ['none', 'simple', 'configurable'];
  if (!validTransliterationStrategies.includes(options.transliteration?.strategy)) {
    errors.push(`Stratégie de translittération invalide: ${options.transliteration?.strategy}. Valeurs acceptées: ${validTransliterationStrategies.join(', ')}`);
  }

  // Validation de la méthode de repli Unicode → ASCII
  const validFallbackMethods = ['remove', 'replace', 'transliterate'];
  if (options.transliteration?.unicodeToAscii?.enabled && 
      !validFallbackMethods.includes(options.transliteration.unicodeToAscii.method)) {
    errors.push(`Méthode de repli invalide: ${options.transliteration.unicodeToAscii.method}. Valeurs acceptées: ${validFallbackMethods.join(', ')}`);
  }

  // Validation du mode de traitement
  const validProcessingModes = ['strict', 'tolerant'];
  if (!validProcessingModes.includes(options.processingMode?.mode)) {
    errors.push(`Mode de traitement invalide: ${options.processingMode?.mode}. Valeurs acceptées: ${validProcessingModes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Fusionne les options fournies avec les valeurs par défaut
 * @param {Partial<AdvancedNormalizationOptions>} userOptions - Options utilisateur
 * @param {AdvancedNormalizationOptions} defaults - Options par défaut (par défaut: DefaultAdvancedNormalizationOptions)
 * @returns {AdvancedNormalizationOptions} - Options fusionnées
 */
function mergeAdvancedNormalizationOptions(userOptions = {}, defaults = DefaultAdvancedNormalizationOptions) {
  return {
    unicode: {
      ...defaults.unicode,
      ...(userOptions.unicode || {}),
    },
    characterCleaning: {
      ...defaults.characterCleaning,
      ...(userOptions.characterCleaning || {}),
    },
    transliteration: {
      ...defaults.transliteration,
      ...(userOptions.transliteration || {}),
      unicodeToAscii: {
        ...defaults.transliteration.unicodeToAscii,
        ...(userOptions.transliteration?.unicodeToAscii || {}),
      },
    },
    validation: {
      ...defaults.validation,
      ...(userOptions.validation || {}),
      allowedRanges: userOptions.validation?.allowedRanges || defaults.validation.allowedRanges,
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
 * @returns {AdvancedNormalizationOptions} - Options du preset
 */
function getAdvancedNormalizationPreset(preset = 'default') {
  const presets = {
    default: DefaultAdvancedNormalizationOptions,
    strict: StrictAdvancedNormalizationOptions,
    permissive: PermissiveAdvancedNormalizationOptions,
  };

  return presets[preset] || DefaultAdvancedNormalizationOptions;
}

/**
 * Vérifie si les options actives peuvent altérer le sens du texte
 * @param {AdvancedNormalizationOptions} options - Options à vérifier
 * @returns {Object} - { safe: boolean, warnings: string[] }
 */
function checkOptionsSafety(options) {
  const warnings = [];

  // Vérifier les options potentiellement destructives
  if (options.characterCleaning?.removeControlChars && !options.characterCleaning?.preserveWhitespace) {
    warnings.push('Suppression des caractères de contrôle sans préservation des espaces peut altérer la structure');
  }

  if (options.transliteration?.enableTransliteration) {
    warnings.push('La translittération peut altérer le sens (é → e, etc.)');
  }

  if (options.transliteration?.unicodeToAscii?.enabled && 
      options.transliteration.unicodeToAscii.method === 'remove') {
    warnings.push('Suppression des caractères Unicode peut être destructive');
  }

  if (options.unicode?.normalization === 'NFKC') {
    warnings.push('Normalisation NFKC peut modifier certains caractères (plus agressive que NFC)');
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}

module.exports = {
  DefaultAdvancedNormalizationOptions,
  StrictAdvancedNormalizationOptions,
  PermissiveAdvancedNormalizationOptions,
  UnicodeRanges,
  validateAdvancedNormalizationOptions,
  mergeAdvancedNormalizationOptions,
  getAdvancedNormalizationPreset,
  checkOptionsSafety,
};
