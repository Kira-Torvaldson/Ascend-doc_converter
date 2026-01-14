/**
 * COMPLETE CONVERSION OPTIONS CONFIGURATION
 * 
 * This unified module contains all conversion options:
 * - General conversion options
 * - Encoding options
 * - Advanced normalization options
 * 
 * Modular and extensible structure to manage conversion behavior
 * API-first approach: Clear JSON structure, safe default values
 */

// ============================================================================
// ADVANCED NORMALIZATION OPTIONS
// ============================================================================

/**
 * Complete configuration structure for additional normalization options
 * @typedef {Object} AdvancedNormalizationOptions
 * @property {UnicodeManagement} unicode - Advanced Unicode management
 * @property {CharacterCleaning} characterCleaning - Character cleaning
 * @property {TransliterationAndFallback} transliteration - Transliteration and fallback
 * @property {ContentValidation} validation - Content validation
 * @property {ProcessingMode} processingMode - Processing mode
 */

/**
 * Recommended default values for production
 */
const DefaultAdvancedNormalizationOptions = {
  unicode: {
    mode: 'full', // Full Unicode mode
    normalization: 'NFC', // Canonical Composition Form (recommended standard)
    detectConfusables: true, // Detect visually confusable characters
    confusablesAction: 'warn', // Only warn, do not modify (non-destructive)
  },
  characterCleaning: {
    removeControlChars: false, // Disabled by default (can be destructive)
    removeDirectionalChars: false, // Disabled by default (can alter display)
    removeNonPrintableChars: false, // Disabled by default (can be destructive)
    preserveWhitespace: true, // Preserve essential whitespace (tabs, newlines)
  },
  transliteration: {
    strategy: 'none', // No transliteration by default (non-destructive)
    enableTransliteration: false, // Disabled by default (can alter meaning)
    unicodeToAscii: {
      enabled: false, // Disabled by default (can be destructive)
      method: 'transliterate', // Method if enabled
      replacementChar: '?', // Replacement character if method='replace'
    },
  },
  validation: {
    rejectInvalidSequences: true, // Reject invalid sequences (security)
    rejectPrivateChars: false, // Do not reject private characters by default
    warnOutOfRange: true, // Signal characters out of range (traceability)
    allowedRanges: [], // Empty = all allowed ranges except Private Use Area
  },
  processingMode: {
    mode: 'tolerant', // Tolerant mode by default (cleaning + warnings)
    throwOnError: false, // Do not interrupt processing
    logWarnings: true, // Log warnings for analysis
    continueOnWarning: true, // Continue despite warnings
  },
};

/**
 * Strict options for critical environments
 */
const StrictAdvancedNormalizationOptions = {
  unicode: {
    mode: 'full',
    normalization: 'NFC',
    detectConfusables: true,
    confusablesAction: 'warn',
  },
  characterCleaning: {
    removeControlChars: true, // Enable strict cleaning
    removeDirectionalChars: true, // Remove directional characters
    removeNonPrintableChars: true, // Remove non-printable characters
    preserveWhitespace: true,
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
    rejectPrivateChars: true, // Reject private characters in strict mode
    warnOutOfRange: true,
    allowedRanges: [],
  },
  processingMode: {
    mode: 'strict',
    throwOnError: true, // Throw error immediately
    logWarnings: true,
    continueOnWarning: false, // Do not continue on warning
  },
};

/**
 * Permissive options for converting legacy or corrupted documents
 */
const PermissiveAdvancedNormalizationOptions = {
  unicode: {
    mode: 'full',
    normalization: 'NFKC', // More aggressive normalization
    detectConfusables: false, // Disable detection to avoid noise
    confusablesAction: 'none',
  },
  characterCleaning: {
    removeControlChars: true, // Clean problematic characters
    removeDirectionalChars: false, // Preserve directional characters
    removeNonPrintableChars: true, // Clean non-printable characters
    preserveWhitespace: false, // Normalize whitespace
  },
  transliteration: {
    strategy: 'simple', // Enable simple transliteration
    enableTransliteration: true, // Transliteration enabled
    unicodeToAscii: {
      enabled: true, // Enable Unicode → ASCII fallback
      method: 'transliterate', // Transliteration rather than removal
      replacementChar: '?',
    },
  },
  validation: {
    rejectInvalidSequences: false, // Do not reject (maximum tolerance)
    rejectPrivateChars: false,
    warnOutOfRange: false, // Fewer warnings to avoid noise
    allowedRanges: [],
  },
  processingMode: {
    mode: 'tolerant',
    throwOnError: false,
    logWarnings: false, // Fewer logs to avoid noise
    continueOnWarning: true,
  },
};

/**
 * Gets a predefined options preset
 * @param {string} preset - Preset name ('default'|'strict'|'permissive')
 * @returns {AdvancedNormalizationOptions} - Preset options
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
 * Merges provided options with default values
 * @param {Partial<AdvancedNormalizationOptions>} userOptions - User options
 * @param {AdvancedNormalizationOptions} defaults - Default options
 * @returns {AdvancedNormalizationOptions} - Merged options
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
 * Validates advanced normalization options
 * @param {AdvancedNormalizationOptions} options - Options to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateAdvancedNormalizationOptions(options) {
  const errors = [];

  // Unicode mode validation
  const validUnicodeModes = ['full', 'restricted', 'disabled'];
  if (!validUnicodeModes.includes(options.unicode?.mode)) {
    errors.push(`Invalid Unicode mode: ${options.unicode?.mode}. Accepted values: ${validUnicodeModes.join(', ')}`);
  }

  // Unicode normalization validation
  const validNormalizationForms = ['none', 'NFC', 'NFKC'];
  if (!validNormalizationForms.includes(options.unicode?.normalization)) {
    errors.push(`Invalid normalization form: ${options.unicode?.normalization}. Accepted values: ${validNormalizationForms.join(', ')}`);
  }

  // Confusables action validation
  const validConfusablesActions = ['none', 'warn', 'replace'];
  if (!validConfusablesActions.includes(options.unicode?.confusablesAction)) {
    errors.push(`Invalid confusables action: ${options.unicode?.confusablesAction}. Accepted values: ${validConfusablesActions.join(', ')}`);
  }

  // Transliteration strategy validation
  const validTransliterationStrategies = ['none', 'simple', 'configurable'];
  if (!validTransliterationStrategies.includes(options.transliteration?.strategy)) {
    errors.push(`Invalid transliteration strategy: ${options.transliteration?.strategy}. Accepted values: ${validTransliterationStrategies.join(', ')}`);
  }

  // Unicode → ASCII fallback method validation
  const validFallbackMethods = ['remove', 'replace', 'transliterate'];
  if (options.transliteration?.unicodeToAscii?.enabled && 
      !validFallbackMethods.includes(options.transliteration.unicodeToAscii.method)) {
    errors.push(`Invalid fallback method: ${options.transliteration.unicodeToAscii.method}. Accepted values: ${validFallbackMethods.join(', ')}`);
  }

  // Processing mode validation
  const validProcessingModes = ['strict', 'tolerant'];
  if (!validProcessingModes.includes(options.processingMode?.mode)) {
    errors.push(`Invalid processing mode: ${options.processingMode?.mode}. Accepted values: ${validProcessingModes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// ENCODING OPTIONS
// ============================================================================

/**
 * Recommended default values for production
 */
const DefaultEncodingOptions = {
  input: {
    encoding: 'auto',
    autoDetect: true,
    fallbackToLatin1: false, // Avoid dangerous assumptions
  },
  output: {
    encoding: 'utf-8',
    addBOM: false, // Optional BOM, generally not necessary
  },
  invalidCharacters: {
    strategy: 'replace', // Safer than 'remove' (can alter meaning)
    replacementChar: '\uFFFD', // Standard Unicode replacement character
    logInvalidChars: true, // Important for production debugging
  },
  normalization: {
    form: 'NFC', // Canonical Composition Form (recommended standard)
    preserveMeaning: true, // Ensure normalization does not alter meaning
  },
  cleaning: {
    removeControlChars: true, // Remove control characters (except \t, \n, \r)
    removeDirectionalChars: true, // Avoid RTL/LTR display issues
    removeZeroWidthChars: true, // Remove potentially problematic invisible characters
    normalizeWhitespace: false, // Preserve multiple spaces (may be intentional)
  },
  processingMode: {
    mode: 'tolerant', // Tolerant mode by default (cleaning + warnings)
    throwOnError: false, // Do not interrupt processing
    logWarnings: true, // Log issues for later analysis
  },
};

/**
 * Strict options for critical environments
 */
const StrictEncodingOptions = {
  input: {
    encoding: 'utf-8', // No auto-detection, explicit UTF-8
    autoDetect: false,
    fallbackToLatin1: false,
  },
  output: {
    encoding: 'utf-8',
    addBOM: false,
  },
  invalidCharacters: {
    strategy: 'fail', // Fail immediately on invalid character
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
    throwOnError: true, // Throw error immediately
    logWarnings: true,
  },
};

/**
 * Permissive options for converting legacy documents
 */
const PermissiveEncodingOptions = {
  input: {
    encoding: 'auto',
    autoDetect: true,
    fallbackToLatin1: true, // Accept Latin-1 as fallback
  },
  output: {
    encoding: 'utf-8',
    addBOM: false,
  },
  invalidCharacters: {
    strategy: 'transliterate', // Transliteration to preserve content
    replacementChar: '\uFFFD',
    logInvalidChars: false, // Fewer logs to avoid noise
  },
  normalization: {
    form: 'NFKC', // More aggressive normalization
    preserveMeaning: true,
  },
  cleaning: {
    removeControlChars: true,
    removeDirectionalChars: false, // Preserve directional characters
    removeZeroWidthChars: false, // Preserve zero-width characters
    normalizeWhitespace: true, // Normalize whitespace
  },
  processingMode: {
    mode: 'tolerant',
    throwOnError: false,
    logWarnings: false, // Fewer warnings to avoid noise
  },
};

/**
 * Validates provided encoding options
 * @param {EncodingOptions} options - Options to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateEncodingOptions(options) {
  const errors = [];

  // Input encoding validation
  const validInputEncodings = ['auto', 'utf-8', 'ascii', 'latin-1'];
  if (!validInputEncodings.includes(options.input?.encoding)) {
    errors.push(`Invalid input encoding: ${options.input?.encoding}. Accepted values: ${validInputEncodings.join(', ')}`);
  }

  // Output encoding validation
  const validOutputEncodings = ['utf-8', 'ascii', 'latin-1'];
  if (!validOutputEncodings.includes(options.output?.encoding)) {
    errors.push(`Invalid output encoding: ${options.output?.encoding}. Accepted values: ${validOutputEncodings.join(', ')}`);
  }

  // Invalid character handling strategy validation
  const validStrategies = ['fail', 'replace', 'remove', 'transliterate'];
  if (!validStrategies.includes(options.invalidCharacters?.strategy)) {
    errors.push(`Invalid handling strategy: ${options.invalidCharacters?.strategy}. Accepted values: ${validStrategies.join(', ')}`);
  }

  // Normalization form validation
  const validNormalizationForms = ['none', 'NFC', 'NFKC'];
  if (!validNormalizationForms.includes(options.normalization?.form)) {
    errors.push(`Invalid normalization form: ${options.normalization?.form}. Accepted values: ${validNormalizationForms.join(', ')}`);
  }

  // Processing mode validation
  const validModes = ['strict', 'tolerant'];
  if (!validModes.includes(options.processingMode?.mode)) {
    errors.push(`Invalid processing mode: ${options.processingMode?.mode}. Accepted values: ${validModes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merges provided options with default values
 * @param {Partial<EncodingOptions>} userOptions - User options
 * @param {EncodingOptions} defaults - Default options
 * @returns {EncodingOptions} - Merged options
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
 * Gets a predefined options preset
 * @param {string} preset - Preset name ('default'|'strict'|'permissive')
 * @returns {EncodingOptions} - Preset options
 */
function getEncodingPreset(preset = 'default') {
  const presets = {
    default: DefaultEncodingOptions,
    strict: StrictEncodingOptions,
    permissive: PermissiveEncodingOptions,
  };

  return presets[preset] || DefaultEncodingOptions;
}

// ============================================================================
// GENERAL CONVERSION OPTIONS
// ============================================================================

/**
 * Conversion options configuration schema
 * @typedef {Object} ConversionOptions
 * @property {ContentAnalysisOptions} contentAnalysis - Content analysis options
 * @property {NormalizationOptions} normalization - Normalization options
 * @property {RenderingOptions} rendering - Document rendering options
 * @property {FormatSpecificOptions} formatSpecific - Format-specific options
 * @property {SecurityOptions} security - Security and robustness options
 * @property {MetadataOptions} metadata - Document metadata
 * @property {DeveloperOptions} developer - Developer options
 */

/**
 * Content analysis options
 */
const ContentAnalysisOptions = {
  analysisMode: 'heuristic', // 'basic' | 'heuristic' | 'strict'
  headingDetection: {
    enabled: true,
    detectAllCaps: true, // Detect uppercase titles
    detectSeparators: true, // Detect separators (===, ---)
    detectNumbering: true, // Detect numbering (1., 2., etc.)
    minLength: 3, // Minimum length to consider as title
    maxLength: 100 // Maximum length to consider as title
  },
  listDetection: {
    enabled: true,
    detectBullets: true, // Detect bullets (*, -, +)
    detectNumbered: true, // Detect numbered lists
    preserveIndentation: true, // Preserve indentation
    normalizeIndentation: true, // Normalize indentation (tabs → spaces)
    indentSize: 2 // Indentation size in spaces
  }
};

/**
 * Content normalization options
 */
const NormalizationOptions = {
  encoding: 'utf-8', // 'utf-8' | 'latin1' | 'ascii'
  lineBreaks: {
    normalize: true, // Normalize line breaks
    target: 'unix', // 'unix' (\n) | 'windows' (\r\n) | 'mac' (\r)
    removeTrailing: true, // Remove trailing line breaks at end of file
    maxConsecutive: 2 // Maximum number of consecutive line breaks
  },
  removeNonAscii: false, // Remove non-ASCII characters
  tabs: {
    convertToSpaces: true, // Convert tabs to spaces
    tabSize: 2 // Tab size in spaces
  },
  // Additional advanced normalization options
  advanced: getAdvancedNormalizationPreset('default')
};

/**
 * Document rendering options
 */
const RenderingOptions = {
  tableOfContents: {
    enabled: false, // Generate table of contents
    depth: 3, // Maximum depth (1-6)
    position: 'top' // 'top' | 'bottom' | 'none'
  },
  sectionNumbering: {
    enabled: false, // Number sections
    depth: 3, // Maximum numbering depth
    style: 'numeric' // 'numeric' | 'alpha' | 'roman'
  },
  lineWrap: {
    enabled: false, // Enable automatic line wrapping
    maxWidth: 80, // Maximum width in characters
    hardWrap: false // Forced line break (hard wrap)
  },
  listStyle: {
    bulletStyle: 'dash', // 'dash' | 'asterisk' | 'plus' | 'circle'
    numberedStyle: 'numeric', // 'numeric' | 'alpha' | 'roman'
    indentChar: ' ', // Indentation character
    indentSize: 2 // Indentation size
  }
};

/**
 * Format-specific output options
 */
const FormatSpecificOptions = {
  markdown: {
    flavor: 'commonmark', // 'commonmark' | 'gfm' | 'markdown'
    parsedown: false, // Parsedown compatibility (BookStack)
    gfmExtensions: {
      tables: true,
      strikethrough: true,
      taskLists: true,
      autolinks: true
    },
    preserveHtml: false, // Preserve HTML in Markdown
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
    template: null, // Path to custom template (optional)
    engine: 'pdflatex' // 'pdflatex' | 'xelatex' | 'lualatex' | 'wkhtmltopdf'
  },
  html: {
    standalone: true, // Complete HTML document with <html>, <head>, <body>
    embedImages: false, // Embed images as base64
    css: null, // Path to CSS stylesheet (optional)
    minify: false // Minify HTML
  }
};

/**
 * Security and robustness options
 */
const SecurityOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB by default
  conversionTimeout: 30000, // 30 seconds by default
  externalResources: {
    allowExternalLinks: true, // Allow external links
    allowImages: true, // Allow images
    allowScripts: false, // Allow scripts (disabled by default)
    allowStyles: true, // Allow styles
    sandboxMode: false // Sandbox mode (complete isolation)
  },
  validation: {
    enabled: true, // Enable validation
    strictMode: false, // Strict mode (rejects minor errors)
    maxErrors: 10 // Maximum number of errors before giving up
  }
};

/**
 * Document metadata
 */
const MetadataOptions = {
  title: null,
  author: null,
  date: null, // If null, uses current date
  language: 'fr', // ISO 639-1 code (fr, en, es, etc.)
  license: null,
  custom: {} // Object for custom metadata
};

/**
 * Developer options
 */
const DeveloperOptions = {
  debugMode: false,
  exportIntermediate: false,
  showPipeline: false,
  logging: {
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    verbose: false,
    saveLogs: false // Save logs to file
  }
};

/**
 * Complete default configuration
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
 * Merges user options with default options
 * @param {Partial<ConversionOptions>} userOptions - Options provided by user
 * @returns {ConversionOptions} Merged options
 */
function mergeOptions(userOptions = {}) {
  const merged = JSON.parse(JSON.stringify(DEFAULT_CONVERSION_OPTIONS));
  
  // Recursive merge
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
  
  // Special merge for advanced normalization options
  if (userOptions.normalization?.advanced) {
    merged.normalization.advanced = mergeAdvancedNormalizationOptions(
      userOptions.normalization.advanced,
      merged.normalization.advanced
    );
  }
  
  return merged;
}

/**
 * Validates conversion options
 * @param {Partial<ConversionOptions>} options - Options to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
function validateOptions(options) {
  const errors = [];
  
  // Analysis mode validation
  if (options.contentAnalysis?.analysisMode && 
      !['basic', 'heuristic', 'strict'].includes(options.contentAnalysis.analysisMode)) {
    errors.push('contentAnalysis.analysisMode must be "basic", "heuristic" or "strict"');
  }
  
  // Encoding validation
  if (options.normalization?.encoding && 
      !['utf-8', 'latin1', 'ascii'].includes(options.normalization.encoding)) {
    errors.push('normalization.encoding must be "utf-8", "latin1" or "ascii"');
  }
  
  // Maximum size validation
  if (options.security?.maxFileSize && 
      (typeof options.security.maxFileSize !== 'number' || options.security.maxFileSize <= 0)) {
    errors.push('security.maxFileSize must be a positive number');
  }
  
  // Timeout validation
  if (options.security?.conversionTimeout && 
      (typeof options.security.conversionTimeout !== 'number' || options.security.conversionTimeout <= 0)) {
    errors.push('security.conversionTimeout must be a positive number');
  }
  
  // Markdown format validation
  if (options.formatSpecific?.markdown?.flavor && 
      !['commonmark', 'gfm', 'markdown'].includes(options.formatSpecific.markdown.flavor)) {
    errors.push('formatSpecific.markdown.flavor must be "commonmark", "gfm" or "markdown"');
  }
  
  // Advanced normalization options validation
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

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // General conversion options
  DEFAULT_CONVERSION_OPTIONS,
  mergeOptions,
  validateOptions,
  ContentAnalysisOptions,
  NormalizationOptions,
  RenderingOptions,
  FormatSpecificOptions,
  SecurityOptions,
  MetadataOptions,
  DeveloperOptions,
  
  // Advanced normalization options
  DefaultAdvancedNormalizationOptions,
  StrictAdvancedNormalizationOptions,
  PermissiveAdvancedNormalizationOptions,
  getAdvancedNormalizationPreset,
  mergeAdvancedNormalizationOptions,
  validateAdvancedNormalizationOptions,
  
  // Encoding options
  DefaultEncodingOptions,
  StrictEncodingOptions,
  PermissiveEncodingOptions,
  validateEncodingOptions,
  mergeEncodingOptions,
  getEncodingPreset
};
