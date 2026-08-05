/**
 * Persistance de session (brouillon éditeur / formats / options / profils).
 */

import type { ConversionOptions, FormatType } from '../types';
import { sanitizeActiveProfileIds } from './conversionProfiles';

const SESSION_KEY = 'ascend_session_draft_v1';
const MAX_CONTENT_CHARS = 2_000_000;

export interface SessionDraft {
  adocInput: string;
  mdOutput: string;
  /** Result buffer for Markdown → HTML/TXT (must not reuse mdOutput). */
  otherOutput: string;
  sourceFormat: FormatType;
  targetFormat: FormatType;
  conversionOptions: ConversionOptions;
  activeProfileIds: string[];
  currentFileName: string | null;
  savedAt: number;
}

const VALID_FORMATS: FormatType[] = [
  'asciidoc', 'markdown', 'html', 'pdf', 'yaml', 'json', 'txt',
];

function isFormat(value: unknown): value is FormatType {
  return typeof value === 'string' && (VALID_FORMATS as string[]).includes(value);
}

export function loadSessionDraft(): SessionDraft | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionDraft>;
    if (!isFormat(parsed.sourceFormat) || !isFormat(parsed.targetFormat)) return null;
    return {
      adocInput: typeof parsed.adocInput === 'string' ? parsed.adocInput.slice(0, MAX_CONTENT_CHARS) : '',
      mdOutput: typeof parsed.mdOutput === 'string' ? parsed.mdOutput.slice(0, MAX_CONTENT_CHARS) : '',
      otherOutput:
        typeof parsed.otherOutput === 'string' ? parsed.otherOutput.slice(0, MAX_CONTENT_CHARS) : '',
      sourceFormat: parsed.sourceFormat,
      targetFormat: parsed.targetFormat,
      conversionOptions:
        parsed.conversionOptions && typeof parsed.conversionOptions === 'object'
          ? parsed.conversionOptions
          : {},
      activeProfileIds: sanitizeActiveProfileIds(parsed.activeProfileIds),
      currentFileName:
        typeof parsed.currentFileName === 'string' ? parsed.currentFileName : null,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function persistSessionDraft(draft: Omit<SessionDraft, 'savedAt'>): void {
  try {
    const payload: SessionDraft = {
      ...draft,
      adocInput: draft.adocInput.slice(0, MAX_CONTENT_CHARS),
      mdOutput: draft.mdOutput.slice(0, MAX_CONTENT_CHARS),
      otherOutput: (draft.otherOutput || '').slice(0, MAX_CONTENT_CHARS),
      activeProfileIds: sanitizeActiveProfileIds(draft.activeProfileIds),
      savedAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearSessionDraft(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
