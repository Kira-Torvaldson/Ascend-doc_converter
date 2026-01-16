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
  normalization?: {
    tabs?: {
      convertToSpaces?: boolean;
    };
  };
  encoding?: {
    [key: string]: any;
  };
  formatSpecific?: {
    markdown?: {
      parsedown?: boolean;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ConversionHistoryItem {
  id: string;
  timestamp: number;
  fromFormat: FormatType;
  toFormat: FormatType;
  sourceContent: string;
  resultContent: string;
}
