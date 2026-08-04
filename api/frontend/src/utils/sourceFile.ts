/**
 * Helpers pour l’import de fichiers source (.adoc / .md / .txt).
 */

import type { FormatType } from '../types';

export const SOURCE_FILE_EXTENSIONS = ['.adoc', '.asciidoc', '.md', '.txt'] as const;

export function isAcceptedSourceFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return SOURCE_FILE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function inferSourceFormatFromFile(file: File): FormatType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.md')) return 'markdown';
  if (name.endsWith('.adoc') || name.endsWith('.asciidoc')) return 'asciidoc';
  if (name.endsWith('.txt')) return 'txt';
  return null;
}

export function readFileAsUtf8(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => reject(reader.error ?? new Error('Lecture fichier impossible'));
    reader.readAsText(file, 'utf-8');
  });
}
