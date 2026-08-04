/**
 * ============================================================================
 * CONSTANTS - Constantes de l'application
 * ============================================================================
 */

export const FORMAT_TITLES: Record<string, string> = {
  asciidoc: 'AsciiDoc',
  markdown: 'Markdown',
  html: 'HTML',
  pdf: 'PDF',
  yaml: 'YAML',
  json: 'JSON',
  txt: 'TEXT'
};

export const FORMAT_PLACEHOLDERS: Record<string, string> = {
  asciidoc: 'Entrez votre contenu AsciiDoc ici...',
  markdown: 'Entrez votre contenu Markdown ici...',
  html: 'Entrez votre contenu HTML ici...',
  pdf: 'Le contenu PDF sera affiché ici après conversion...',
  yaml: 'Entrez votre contenu YAML ici...',
  json: 'Entrez votre contenu JSON ici...',
  txt: 'Entrez votre texte brut ici...'
};

export const NAVIGATION_WINDOW_DEFAULTS = {
  width: 500,
  height: 400,
  minWidth: 300,
  minHeight: 200
};
