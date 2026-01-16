/**
 * ============================================================================
 * CONVERTERS - Module d'exportation centralisé
 * ============================================================================
 * 
 * Ce module exporte tous les convertisseurs et utilitaires de conversion
 * pour une utilisation simplifiée dans l'application.
 * 
 * ============================================================================
 */

export { API_BASE } from './api';
export { convertAsciiDocToMarkdown } from './asciidoc-to-markdown';
export { convertMarkdownToAsciiDoc } from './markdown-to-asciidoc';
export { convertText, requestConfirmationToken } from './generic-converter';
export { adaptForBookStack } from './bookstack-adapter.ts';
