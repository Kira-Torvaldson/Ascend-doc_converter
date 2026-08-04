/**
 * Profils de conversion prédéfinis.
 */

import type { ConversionOptions } from '../types';

export interface ConversionProfile {
  id: string;
  label: string;
  description: string;
  options: ConversionOptions;
}

/** Nombre max de profils combinables simultanément. */
export const MAX_ACTIVE_PROFILES = 2;

export const CONVERSION_PROFILES: ConversionProfile[] = [
  {
    id: 'bookstack',
    label: 'BookStack',
    description: 'Markdown Parsedown + nettoyage prudent',
    options: {
      formatSpecific: { markdown: { flavor: 'commonmark', parsedown: true } },
      normalization: {
        encoding: 'utf-8',
        tabs: { convertToSpaces: true },
        advanced: {
          unicode: { normalization: 'NFC', detectConfusables: true },
          validation: { rejectInvalidSequences: true },
        },
      },
      contentAnalysis: {
        analysisMode: 'heuristic',
        headingDetection: { enabled: true },
        listDetection: { enabled: true },
      },
    },
  },
  {
    id: 'gfm',
    label: 'GitHub (GFM)',
    description: 'GitHub Flavored Markdown',
    options: {
      formatSpecific: { markdown: { flavor: 'gfm', parsedown: false } },
      normalization: {
        encoding: 'utf-8',
        tabs: { convertToSpaces: true },
        advanced: { unicode: { normalization: 'NFC' } },
      },
      contentAnalysis: { analysisMode: 'heuristic' },
    },
  },
  {
    id: 'strict',
    label: 'Strict',
    description: 'Validation renforcée, analyse stricte',
    options: {
      contentAnalysis: { analysisMode: 'strict' },
      normalization: {
        encoding: 'utf-8',
        tabs: { convertToSpaces: true },
        advanced: {
          unicode: { normalization: 'NFKC', detectConfusables: true },
          characterCleaning: {
            removeControlChars: true,
            removeDirectionalChars: true,
            removeNonPrintableChars: true,
          },
          validation: { rejectInvalidSequences: true },
        },
      },
      formatSpecific: { markdown: { flavor: 'commonmark', parsedown: false } },
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Options de base, peu de transformations',
    options: {
      contentAnalysis: { analysisMode: 'basic' },
      normalization: {
        encoding: 'utf-8',
        tabs: { convertToSpaces: false },
        advanced: { unicode: { normalization: 'none', detectConfusables: false } },
      },
      rendering: {
        tableOfContents: { enabled: false },
        sectionNumbering: { enabled: false },
        lineWrap: { enabled: false },
      },
    },
  },
];

export function mergeProfileOptions(
  current: ConversionOptions,
  profile: ConversionOptions
): ConversionOptions {
  return {
    ...current,
    ...profile,
    contentAnalysis: { ...current.contentAnalysis, ...profile.contentAnalysis },
    normalization: {
      ...current.normalization,
      ...profile.normalization,
      tabs: { ...current.normalization?.tabs, ...profile.normalization?.tabs },
      advanced: {
        ...current.normalization?.advanced,
        ...profile.normalization?.advanced,
        unicode: {
          ...current.normalization?.advanced?.unicode,
          ...profile.normalization?.advanced?.unicode,
        },
        characterCleaning: {
          ...current.normalization?.advanced?.characterCleaning,
          ...profile.normalization?.advanced?.characterCleaning,
        },
        validation: {
          ...current.normalization?.advanced?.validation,
          ...profile.normalization?.advanced?.validation,
        },
      },
    },
    rendering: { ...current.rendering, ...profile.rendering },
    formatSpecific: {
      ...current.formatSpecific,
      ...profile.formatSpecific,
      markdown: {
        ...current.formatSpecific?.markdown,
        ...profile.formatSpecific?.markdown,
      },
      asciidoc: {
        ...current.formatSpecific?.asciidoc,
        ...profile.formatSpecific?.asciidoc,
      },
    },
    metadata: { ...current.metadata, ...profile.metadata },
  };
}

export function rebuildOptionsFromProfiles(profileIds: string[]): ConversionOptions {
  return profileIds.reduce<ConversionOptions>((acc, id) => {
    const profile = CONVERSION_PROFILES.find((p) => p.id === id);
    return profile ? mergeProfileOptions(acc, profile.options) : acc;
  }, {});
}

/** Filtre / borne une liste d’ids de profils (session, historique). */
export function sanitizeActiveProfileIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const valid = new Set(CONVERSION_PROFILES.map((p) => p.id));
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== 'string' || !valid.has(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length >= MAX_ACTIVE_PROFILES) break;
  }
  return out;
}
