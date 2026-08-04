/**
 * ============================================================================
 * TYPES - Définitions TypeScript pour l'application
 * ============================================================================
 */

export type FormatType = 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt';

export type ConversionMode = 'adoc-to-md' | 'md-to-adoc';

export interface Notification {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export interface Heading {
  lineIndex: number;
  level: number;
  title: string;
}

export interface PendingConversion {
  fromFormat: FormatType;
  toFormat: FormatType;
  token: string;
}

export interface NavigationWindowPosition {
  x: number;
  y: number;
}

export interface NavigationWindowSize {
  width: number;
  height: number;
}

export interface DragStart {
  x: number;
  y: number;
}

export interface ResizeStart {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConversionOptions {
  contentAnalysis?: {
    analysisMode?: 'basic' | 'heuristic' | 'strict';
    headingDetection?: {
      enabled?: boolean;
      detectAllCaps?: boolean;
      detectSeparators?: boolean;
      detectNumbering?: boolean;
    };
    listDetection?: {
      enabled?: boolean;
      detectBullets?: boolean;
      detectNumbered?: boolean;
      normalizeIndentation?: boolean;
    };
  };
  normalization?: {
    encoding?: 'utf-8' | 'latin1' | 'ascii';
    lineBreaks?: {
      normalize?: boolean;
      target?: 'unix' | 'windows' | 'mac';
    };
    tabs?: {
      convertToSpaces?: boolean;
      tabSize?: number;
    };
    advanced?: {
      unicode?: {
        normalization?: 'none' | 'NFC' | 'NFKC';
        detectConfusables?: boolean;
        confusablesAction?: 'none' | 'warn' | 'replace';
      };
      characterCleaning?: {
        removeControlChars?: boolean;
        removeDirectionalChars?: boolean;
        removeNonPrintableChars?: boolean;
        preserveWhitespace?: boolean;
      };
      transliteration?: {
        strategy?: 'none' | 'simple' | 'configurable';
        enableTransliteration?: boolean;
        unicodeToAscii?: {
          enabled?: boolean;
          method?: 'remove' | 'replace' | 'transliterate';
          replacementChar?: string;
        };
      };
      validation?: {
        rejectInvalidSequences?: boolean;
        rejectPrivateChars?: boolean;
        warnOutOfRange?: boolean;
        allowedRanges?: Array<{ start: number; end: number }>;
      };
      processingMode?: {
        mode?: 'strict' | 'tolerant';
        throwOnError?: boolean;
        logWarnings?: boolean;
        continueOnWarning?: boolean;
      };
    };
  };
  rendering?: {
    tableOfContents?: {
      enabled?: boolean;
      depth?: number;
    };
    sectionNumbering?: {
      enabled?: boolean;
      depth?: number;
    };
    lineWrap?: {
      enabled?: boolean;
      maxWidth?: number;
    };
  };
  formatSpecific?: {
    markdown?: {
      flavor?: 'commonmark' | 'gfm' | 'markdown';
      parsedown?: boolean;
    };
    asciidoc?: {
      compatMode?: 'asciidoctor' | 'asciidoc';
    };
  };
  security?: {
    maxFileSize?: number;
    conversionTimeout?: number;
  };
  metadata?: {
    title?: string | null;
    author?: string | null;
    organization?: string | null;
    language?: string;
  };
  developer?: {
    debugMode?: boolean;
  };
}

export interface ConversionHistoryItem {
  id: string;
  timestamp: number;
  fromFormat: FormatType;
  toFormat: FormatType;
  sourceContent: string;
  resultContent: string;
  /** Options de conversion au moment de la sauvegarde (optionnel, rétrocompat). */
  conversionOptions?: ConversionOptions;
  /** Profils actifs au moment de la sauvegarde (optionnel, rétrocompat). */
  activeProfileIds?: string[];
}
