/**
 * Statistiques de texte (caractères / mots / lignes).
 */

export interface TextStats {
  characterCount: number;
  wordCount: number;
  lineCount: number;
}

export function getTextStats(text: string): TextStats {
  const trimmed = text.trim();
  const characterCount = trimmed.length;
  const wordCount =
    trimmed.length > 0 ? trimmed.split(/\s+/).filter((word) => word.length > 0).length : 0;
  const lineCount = trimmed.length > 0 ? trimmed.split('\n').length : 0;
  return { characterCount, wordCount, lineCount };
}
