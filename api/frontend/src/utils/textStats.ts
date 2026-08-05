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
  if (characterCount === 0) {
    return { characterCount: 0, wordCount: 0, lineCount: 0 };
  }

  let wordCount = 0;
  let lineCount = 1;
  let inWord = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '\n') lineCount++;
    if (/\s/.test(ch)) {
      inWord = false;
    } else if (!inWord) {
      inWord = true;
      wordCount++;
    }
  }

  return { characterCount, wordCount, lineCount };
}
