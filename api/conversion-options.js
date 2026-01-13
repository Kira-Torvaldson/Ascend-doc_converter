/**
 * Configuration des options de conversion
 * Structure modulaire et extensible pour gérer le comportement des conversions
 */

const { 
  getAdvancedNormalizationPreset,
  mergeAdvancedNormalizationOptions,
  validateAdvancedNormalizationOptions
} = require('./normalization-advanced-options');

/**
 * Schéma de configuration des options de conversion
 * @typedef {Object} ConversionOptions
 * @property {ContentAnalysisOptions} contentAnalysis - Options d'analyse du contenu
 * @property {NormalizationOptions} normalization - Options de normalisation
 * @property {RenderingOptions} rendering - Options de rendu documentaire
 * @property {FormatSpecificOptions} formatSpecific - Options spécifiques aux formats
 * @property {SecurityOptions} security - Options de sécurité et robustesse
 * @property {MetadataOptions} metadata - Métadonnées du document
 * @property {DeveloperOptions} developer - Options développeur
 */

/**
 * Options d'analyse du contenu
 * @typedef {Object} ContentAnalysisOptions
 * @property {string} analysisMode - Mode d'analyse: 'basic' | 'heuristic' | 'strict'
 * @property {HeadingDetectionOptions} headingDetection - Règles de détection des titres
 * @property {ListDetectionOptions} listDetection - Gestion des listes et indentations
 */
const ContentAnalysisOptions = {
  analysisMode: 'heuristic', // 'basic' | 'heuristic' | 'strict'
  headingDetection: {
    enabled: true,
    detectAllCaps: true, // Détecter les titres en majuscules
    detectSeparators: true, // Détecter les séparateurs (===, ---)
    detectNumbering: true, // Détecter la numérotation (1., 2., etc.)
    minLength: 3, // Longueur minimale pour considérer comme titre
    maxLength: 100 // Longueur maximale pour considérer comme titre
  },
  listDetection: {
    enabled: true,
    detectBullets: true, // Détecter les puces (*, -, +)
    detectNumbered: true, // Détecter les listes numérotées
    preserveIndentation: true, // Préserver l'indentation
    normalizeIndentation: true, // Normaliser l'indentation (tabs → espaces)
    indentSize: 2 // Taille d'indentation en espaces
  }
};

/**
 * Options de normalisation du contenu
 * @typedef {Object} NormalizationOptions
 * @property {string} encoding - Encodage du texte (défaut: UTF-8)
 * @property {LineBreakOptions} lineBreaks - Normalisation des sauts de ligne
 * @property {boolean} removeNonAscii - Supprimer les caractères non-ASCII (optionnel)
 * @property {TabOptions} tabs - Conversion des tabulations
 * @property {AdvancedNormalizationOptions} advanced - Options supplémentaires de normalisation avancée
 */

const NormalizationOptions = {
  encoding: 'utf-8', // 'utf-8' | 'latin1' | 'ascii'
  lineBreaks: {
    normalize: true, // Normaliser les sauts de ligne
    target: 'unix', // 'unix' (\n) | 'windows' (\r\n) | 'mac' (\r)
    removeTrailing: true, // Supprimer les sauts de ligne en fin de fichier
    maxConsecutive: 2 // Nombre maximum de sauts de ligne consécutifs
  },
  removeNonAscii: false, // Supprimer les caractères non-ASCII
  tabs: {
    convertToSpaces: true, // Convertir les tabulations en espaces
    tabSize: 2 // Taille d'une tabulation en espaces
  },
  // Options supplémentaires de normalisation avancée
  advanced: getAdvancedNormalizationPreset('default')
};

/**
 * Options de rendu documentaire
 * @typedef {Object} RenderingOptions
 * @property {TableOfContentsOptions} tableOfContents - Génération table des matières
 * @property {SectionNumberingOptions} sectionNumbering - Numérotation des sections
 * @property {LineWrapOptions} lineWrap - Largeur maximale des lignes
 * @property {ListStyleOptions} listStyle - Style des listes
 */
const RenderingOptions = {
  tableOfContents: {
    enabled: false, // Générer une table des matières
    depth: 3, // Profondeur maximale (1-6)
    position: 'top' // 'top' | 'bottom' | 'none'
  },
  sectionNumbering: {
    enabled: false, // Numéroter les sections
    depth: 3, // Profondeur maximale de numérotation
    style: 'numeric' // 'numeric' | 'alpha' | 'roman'
  },
  lineWrap: {
    enabled: false, // Activer le retour à la ligne automatique
    maxWidth: 80, // Largeur maximale en caractères
    hardWrap: false // Retour à la ligne forcé (hard wrap)
  },
  listStyle: {
    bulletStyle: 'dash', // 'dash' | 'asterisk' | 'plus' | 'circle'
    numberedStyle: 'numeric', // 'numeric' | 'alpha' | 'roman'
    indentChar: ' ', // Caractère d'indentation
    indentSize: 2 // Taille d'indentation
  }
};

/**
 * Options spécifiques aux formats de sortie
 * @typedef {Object} FormatSpecificOptions
 * @property {MarkdownOptions} markdown - Options Markdown
 * @property {AsciiDocOptions} asciidoc - Options AsciiDoc
 * @property {PDFOptions} pdf - Options PDF
 * @property {HTMLOptions} html - Options HTML
 */
const FormatSpecificOptions = {
  markdown: {
    flavor: 'commonmark', // 'commonmark' | 'gfm' | 'markdown'
    parsedown: false, // Compatibilité Parsedown (BookStack)
    gfmExtensions: {
      tables: true,
      strikethrough: true,
      taskLists: true,
      autolinks: true
    },
    preserveHtml: false, // Préserver le HTML dans le Markdown
    codeFenceStyle: 'backtick' // 'backtick' | 'tilde'
  },
  asciidoc: {
    compatMode: 'asciidoctor', // 'asciidoctor' | 'asciidoc'
    attributes: {
      doctype: 'article', // 'article' | 'book' | 'manpage'
      toc: 'left', // 'left' | 'right' | 'macro'
      numbered: false,
      sectanchors: true,
      sectlinks: true
    },
    safeMode: 'safe' // 'unsafe' | 'safe' | 'server' | 'secure'
  },
  pdf: {
    pageSize: 'a4', // 'a4' | 'letter' | 'legal' | 'a3'
    orientation: 'portrait', // 'portrait' | 'landscape'
    margins: {
      top: '2.5cm',
      right: '2cm',
      bottom: '2.5cm',
      left: '2cm'
    },
    fontFamily: 'default', // 'default' | 'serif' | 'sans-serif' | 'monospace'
    fontSize: '12pt',
    template: null, // Chemin vers un template personnalisé (optionnel)
    engine: 'pdflatex' // 'pdflatex' | 'xelatex' | 'lualatex' | 'wkhtmltopdf'
  },
  html: {
    standalone: true, // Document HTML complet avec <html>, <head>, <body>
    embedImages: false, // Intégrer les images en base64
    css: null, // Chemin vers une feuille de style CSS (optionnel)
    minify: false // Minifier le HTML
  }
};

/**
 * Options de sécurité et robustesse
 * @typedef {Object} SecurityOptions
 * @property {number} maxFileSize - Taille maximale du fichier en octets
 * @property {number} conversionTimeout - Timeout de conversion en millisecondes
 * @property {ExternalResourcesOptions} externalResources - Gestion des ressources externes
 * @property {ValidationOptions} validation - Options de validation
 */
const SecurityOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB par défaut
  conversionTimeout: 30000, // 30 secondes par défaut
  externalResources: {
    allowExternalLinks: true, // Autoriser les liens externes
    allowImages: true, // Autoriser les images
    allowScripts: false, // Autoriser les scripts (désactivé par défaut)
    allowStyles: true, // Autoriser les styles
    sandboxMode: false // Mode sandbox (isolation complète)
  },
  validation: {
    enabled: true, // Activer la validation
    strictMode: false, // Mode strict (rejette les erreurs mineures)
    maxErrors: 10 // Nombre maximum d'erreurs avant d'abandonner
  }
};

/**
 * Métadonnées du document
 * @typedef {Object} MetadataOptions
 * @property {string} title - Titre du document
 * @property {string} author - Auteur du document
 * @property {string} date - Date du document (ISO 8601 ou format personnalisé)
 * @property {string} language - Langue du document (code ISO 639-1)
 * @property {string} license - Licence du document
 * @property {Object} custom - Métadonnées personnalisées (clé-valeur)
 */
const MetadataOptions = {
  title: null,
  author: null,
  date: null, // Si null, utilise la date actuelle
  language: 'fr', // Code ISO 639-1 (fr, en, es, etc.)
  license: null,
  custom: {} // Objet pour métadonnées personnalisées
};

/**
 * Options développeur
 * @typedef {Object} DeveloperOptions
 * @property {boolean} debugMode - Mode debug
 * @property {boolean} exportIntermediate - Exporter les formats intermédiaires
 * @property {boolean} showPipeline - Afficher le pipeline de conversion
 * @property {LoggingOptions} logging - Options de logging
 */
const DeveloperOptions = {
  debugMode: false,
  exportIntermediate: false,
  showPipeline: false,
  logging: {
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    verbose: false,
    saveLogs: false // Sauvegarder les logs dans un fichier
  }
};

/**
 * Configuration par défaut complète
 */
const DEFAULT_CONVERSION_OPTIONS = {
  contentAnalysis: ContentAnalysisOptions,
  normalization: NormalizationOptions,
  rendering: RenderingOptions,
  formatSpecific: FormatSpecificOptions,
  security: SecurityOptions,
  metadata: MetadataOptions,
  developer: DeveloperOptions
};

/**
 * Fusionne les options utilisateur avec les options par défaut
 * @param {Partial<ConversionOptions>} userOptions - Options fournies par l'utilisateur
 * @returns {ConversionOptions} Options fusionnées
 */
function mergeOptions(userOptions = {}) {
  const merged = JSON.parse(JSON.stringify(DEFAULT_CONVERSION_OPTIONS));
  
  // Fusion récursive
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  
  deepMerge(merged, userOptions);
  
  // Fusion spéciale pour les options avancées de normalisation
  if (userOptions.normalization?.advanced) {
    merged.normalization.advanced = mergeAdvancedNormalizationOptions(
      userOptions.normalization.advanced,
      merged.normalization.advanced
    );
  }
  
  return merged;
}

/**
 * Valide les options de conversion
 * @param {Partial<ConversionOptions>} options - Options à valider
 * @returns {{valid: boolean, errors: string[]}} Résultat de la validation
 */
function validateOptions(options) {
  const errors = [];
  
  // Validation du mode d'analyse
  if (options.contentAnalysis?.analysisMode && 
      !['basic', 'heuristic', 'strict'].includes(options.contentAnalysis.analysisMode)) {
    errors.push('contentAnalysis.analysisMode doit être "basic", "heuristic" ou "strict"');
  }
  
  // Validation de l'encodage
  if (options.normalization?.encoding && 
      !['utf-8', 'latin1', 'ascii'].includes(options.normalization.encoding)) {
    errors.push('normalization.encoding doit être "utf-8", "latin1" ou "ascii"');
  }
  
  // Validation de la taille maximale
  if (options.security?.maxFileSize && 
      (typeof options.security.maxFileSize !== 'number' || options.security.maxFileSize <= 0)) {
    errors.push('security.maxFileSize doit être un nombre positif');
  }
  
  // Validation du timeout
  if (options.security?.conversionTimeout && 
      (typeof options.security.conversionTimeout !== 'number' || options.security.conversionTimeout <= 0)) {
    errors.push('security.conversionTimeout doit être un nombre positif');
  }
  
  // Validation du format Markdown
  if (options.formatSpecific?.markdown?.flavor && 
      !['commonmark', 'gfm', 'markdown'].includes(options.formatSpecific.markdown.flavor)) {
    errors.push('formatSpecific.markdown.flavor doit être "commonmark", "gfm" ou "markdown"');
  }
  
  // Validation des options avancées de normalisation
  if (options.normalization?.advanced) {
    const advancedValidation = validateAdvancedNormalizationOptions(options.normalization.advanced);
    if (!advancedValidation.valid) {
      errors.push(...advancedValidation.errors.map(err => `normalization.advanced.${err}`));
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  DEFAULT_CONVERSION_OPTIONS,
  mergeOptions,
  validateOptions,
  ContentAnalysisOptions,
  NormalizationOptions,
  RenderingOptions,
  FormatSpecificOptions,
  SecurityOptions,
  MetadataOptions,
  DeveloperOptions
};
