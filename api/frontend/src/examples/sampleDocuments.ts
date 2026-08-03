import type { FormatType } from '../types';

/** Short AsciiDoc sample for empty-state “try an example”. */
export const SAMPLE_ASCIIDOC = `= Guide rapide Ascend
Kira Torvaldson
:toc:

== Introduction

Ascend convertit *AsciiDoc* vers *Markdown* (et l'inverse).

== Fonctionnalités

* Conversion sécurisée
* Navigation par titres
* Historique des conversions

[NOTE]
====
Collez votre propre document ou convertissez cet exemple.
====
`;

/** Short Markdown sample for empty-state “try an example”. */
export const SAMPLE_MARKDOWN = `# Guide rapide Ascend

Ascend convertit **Markdown** vers **AsciiDoc** (et l'inverse).

## Fonctionnalités

- Conversion sécurisée
- Navigation par titres
- Historique des conversions

> Collez votre propre document ou convertissez cet exemple.
`;

export function getSampleDocument(format: FormatType): string {
  if (format === 'markdown') return SAMPLE_MARKDOWN;
  return SAMPLE_ASCIIDOC;
}
