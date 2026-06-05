/**
 * ============================================================================
 * FORMAT HELPERS - Utilitaires pour la gestion des formats
 * ============================================================================
 */

import { FormatType } from '../types';
import { FORMAT_TITLES, FORMAT_PLACEHOLDERS } from '../constants';

/**
 * Retourne le titre d'un format pour l'affichage
 */
export function getFormatTitle(format: FormatType): string {
  return FORMAT_TITLES[format] || format;
}

/**
 * Retourne le placeholder d'un format pour les textareas
 */
export function getFormatPlaceholder(format: FormatType): string {
  return FORMAT_PLACEHOLDERS[format] || 'Entrez votre contenu ici...';
}

/**
 * Extrait les headings d'un texte (AsciiDoc ou Markdown)
 */
export function extractHeadings(
  text: string,
  format: FormatType
): Array<{ lineIndex: number; level: number; title: string }> {
  if (!text || text.trim().length === 0) return [];
  
  const lines = text.split("\n");
  return lines
    .map((line, index) => {
      if (format === 'asciidoc') {
        // Detect AsciiDoc headings (= Title)
        const adocMatch = line.match(/^(=+)\s+(.*)$/);
        if (adocMatch) {
          const level = adocMatch[1].length;
          const title = adocMatch[2].trim();
          return { lineIndex: index, level, title };
        }
      } else if (format === 'markdown') {
        // Detect Markdown headings (# Title)
        const mdMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (mdMatch) {
          const level = mdMatch[1].length;
          const title = mdMatch[2].trim();
          return { lineIndex: index, level, title };
        }
      }
      return null;
    })
    .filter(Boolean) as Array<{ lineIndex: number; level: number; title: string }>;
}
