/**
 * ============================================================================
 * HOOK: useHeadings - Extraction des headings depuis le contenu source
 * ============================================================================
 */

import { useMemo } from 'react';
import { FormatType, Heading } from '../types';
import { extractHeadings } from '../utils/formatHelpers';

interface UseHeadingsParams {
  sourceFormat: FormatType;
  targetFormat: FormatType;
  adocInput: string;
  mdOutput: string;
}

/**
 * Hook personnalisé pour extraire les headings du contenu source
 * 
 * @param sourceFormat - Format source (asciidoc ou markdown)
 * @param targetFormat - Format cible
 * @param adocInput - Contenu AsciiDoc
 * @param mdOutput - Contenu Markdown
 * @returns Array de headings détectés
 */
export function useHeadings({
  sourceFormat,
  targetFormat,
  adocInput,
  mdOutput
}: UseHeadingsParams): Heading[] {
  return useMemo(() => {
    // Determine which text to use based on source format
    let text = "";
    if (sourceFormat === 'asciidoc') {
      // For AsciiDoc source, use adocInput
      // But don't use it if it's actually a conversion result
      if (targetFormat === 'asciidoc' && mdOutput.trim().length > 0) {
        // adocInput is the result, so use mdOutput instead
        return [];
      }
      text = adocInput;
    } else if (sourceFormat === 'markdown') {
      // For Markdown source, use mdOutput
      // But don't use it if it's actually a conversion result
      if (targetFormat === 'markdown' && adocInput.trim().length > 0) {
        // mdOutput is the result, so use adocInput instead
        return [];
      }
      text = mdOutput;
    }
    
    if (!text || text.trim().length === 0) return [];
    
    return extractHeadings(text, sourceFormat);
  }, [sourceFormat, targetFormat, adocInput, mdOutput]);
}
