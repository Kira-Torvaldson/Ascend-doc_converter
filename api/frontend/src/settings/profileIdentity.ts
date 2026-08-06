/**
 * Identité Compte : presets, signature document, métadonnées.
 */

export type AppLanguage = 'fr' | 'en' | 'es' | 'de';

export type IdentityPresetId = 'personal' | 'work' | 'client';

export type ActiveIdentityPreset = IdentityPresetId | 'custom';

export type IdentityFields = {
  displayName: string;
  organization: string;
  defaultLanguage: AppLanguage;
  signature: string;
};

export const APP_LANGUAGE_OPTIONS: ReadonlyArray<{ value: AppLanguage; label: string }> = [
  { value: 'fr', label: 'Français (par défaut)' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'de', label: 'Allemand' },
];

/** Langue par défaut du compte Ascend. */
export const DEFAULT_APP_LANGUAGE: AppLanguage = 'fr';

export const IDENTITY_PRESET_OPTIONS: ReadonlyArray<{ id: IdentityPresetId; label: string }> = [
  { id: 'personal', label: 'Perso' },
  { id: 'work', label: 'Pro' },
  { id: 'client', label: 'Client' },
];

export const DEFAULT_SIGNATURE_TEMPLATE =
  '---\n{name} — {org}\n{date}';

export const SIGNATURE_TEMPLATES: ReadonlyArray<{ id: string; label: string; template: string }> = [
  { id: 'classic', label: 'Classique', template: '---\n{name} — {org}\n{date}' },
  { id: 'minimal', label: 'Minimal', template: '{name} · {org}' },
  { id: 'formal', label: 'Formel', template: 'Rédigé par {name}\n{org}\n{date}' },
];

export const SIGNATURE_VARIABLES: ReadonlyArray<{ token: string; label: string }> = [
  { token: '{name}', label: 'Nom' },
  { token: '{org}', label: 'Org' },
  { token: '{date}', label: 'Date' },
];

export const EMPTY_IDENTITY_FIELDS: IdentityFields = {
  displayName: '',
  organization: '',
  defaultLanguage: DEFAULT_APP_LANGUAGE,
  signature: '',
};

export const DEFAULT_IDENTITY_PRESETS: Record<IdentityPresetId, IdentityFields> = {
  personal: { ...EMPTY_IDENTITY_FIELDS },
  work: { ...EMPTY_IDENTITY_FIELDS },
  client: { ...EMPTY_IDENTITY_FIELDS },
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'fr' || value === 'en' || value === 'es' || value === 'de';
}

export function isIdentityPresetId(value: unknown): value is IdentityPresetId {
  return value === 'personal' || value === 'work' || value === 'client';
}

export function normalizeIdentityFields(value: unknown): IdentityFields {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    displayName: typeof row.displayName === 'string' ? row.displayName : '',
    organization: typeof row.organization === 'string' ? row.organization : '',
    defaultLanguage: isAppLanguage(row.defaultLanguage) ? row.defaultLanguage : DEFAULT_APP_LANGUAGE,
    signature: typeof row.signature === 'string' ? row.signature : '',
  };
}

export function normalizeIdentityPresets(value: unknown): Record<IdentityPresetId, IdentityFields> {
  const root = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    personal: normalizeIdentityFields(root.personal),
    work: normalizeIdentityFields(root.work),
    client: normalizeIdentityFields(root.client),
  };
}

export function getProfileInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function identityPresetLabel(id: ActiveIdentityPreset): string {
  if (id === 'personal') return 'Perso';
  if (id === 'work') return 'Pro';
  if (id === 'client') return 'Client';
  return 'Personnalisé';
}

/** Résumé court d’un slot (carte preset). */
export function summarizeIdentityFields(fields: IdentityFields): string {
  const name = fields.displayName.trim();
  const org = fields.organization.trim();
  if (!name && !org) return 'Vide';
  if (name && org) return `${name} · ${org}`;
  return name || org;
}

export function isIdentitySlotEmpty(fields: IdentityFields): boolean {
  return !fields.displayName.trim() && !fields.organization.trim() && !fields.signature.trim();
}

/** Insère un jeton dans un modèle à la position du curseur (fin si inconnu). */
export function insertSignatureToken(template: string, token: string, cursor = template.length): string {
  const at = Math.max(0, Math.min(cursor, template.length));
  return `${template.slice(0, at)}${token}${template.slice(at)}`;
}

export function identityFieldsFromProfile(profile: {
  displayName: string;
  organization: string;
  defaultLanguage: AppLanguage;
  signature: string;
}): IdentityFields {
  return {
    displayName: profile.displayName,
    organization: profile.organization,
    defaultLanguage: profile.defaultLanguage,
    signature: profile.signature,
  };
}

export function applyIdentityPreset<T extends {
  displayName: string;
  organization: string;
  defaultLanguage: AppLanguage;
  signature: string;
  activeIdentityPreset: ActiveIdentityPreset;
  identityPresets: Record<IdentityPresetId, IdentityFields>;
}>(profile: T, id: IdentityPresetId): T {
  const slot = profile.identityPresets[id];
  return {
    ...profile,
    displayName: slot.displayName,
    organization: slot.organization,
    defaultLanguage: slot.defaultLanguage,
    signature: slot.signature,
    activeIdentityPreset: id,
  };
}

export function saveCurrentToIdentityPreset<T extends {
  displayName: string;
  organization: string;
  defaultLanguage: AppLanguage;
  signature: string;
  activeIdentityPreset: ActiveIdentityPreset;
  identityPresets: Record<IdentityPresetId, IdentityFields>;
}>(profile: T, id: IdentityPresetId): T {
  return {
    ...profile,
    identityPresets: {
      ...profile.identityPresets,
      [id]: identityFieldsFromProfile(profile),
    },
    activeIdentityPreset: id,
  };
}

/** Si les champs actifs ne correspondent plus au preset chargé → custom. */
export function withCustomIdentityIfEdited<T extends {
  displayName: string;
  organization: string;
  defaultLanguage: AppLanguage;
  signature: string;
  activeIdentityPreset: ActiveIdentityPreset;
  identityPresets: Record<IdentityPresetId, IdentityFields>;
}>(profile: T, patch: Partial<IdentityFields>): T {
  const next = { ...profile, ...patch };
  const active = next.activeIdentityPreset;
  if (active === 'custom' || !isIdentityPresetId(active)) {
    return { ...next, activeIdentityPreset: 'custom' };
  }
  const slot = next.identityPresets[active];
  const same =
    next.displayName === slot.displayName &&
    next.organization === slot.organization &&
    next.defaultLanguage === slot.defaultLanguage &&
    next.signature === slot.signature;
  return { ...next, activeIdentityPreset: same ? active : 'custom' };
}

export function formatDocumentSignature(
  profile: { displayName: string; organization: string; signature: string },
  date: Date = new Date()
): string {
  const template = (profile.signature || '').trim() || DEFAULT_SIGNATURE_TEMPLATE;
  const dateStr = date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return template
    .replaceAll('{name}', profile.displayName.trim() || '—')
    .replaceAll('{org}', profile.organization.trim() || '—')
    .replaceAll('{date}', dateStr)
    .trim();
}

const SIGNATURE_MARKER = '<!-- ascend-signature -->';

export function appendDocumentSignature(
  text: string,
  profile: {
    displayName: string;
    organization: string;
    signature: string;
    signatureEnabled: boolean;
  }
): string {
  if (!profile.signatureEnabled) return text;
  if (text.includes(SIGNATURE_MARKER)) return text;
  const block = formatDocumentSignature(profile);
  if (!block) return text;
  const base = text.replace(/\s*$/, '');
  return `${base}\n\n${SIGNATURE_MARKER}\n${block}\n`;
}

export type MetadataSlice = {
  title?: string | null;
  author?: string | null;
  organization?: string | null;
  language?: string;
};

export function applyProfileToMetadata(
  metadata: MetadataSlice | undefined,
  profile: { displayName: string; organization: string; defaultLanguage: AppLanguage },
  mode: 'overwrite' | 'fillEmpty'
): MetadataSlice {
  const next: MetadataSlice = { ...(metadata || {}) };
  const author = profile.displayName.trim();
  const org = profile.organization.trim();
  if (mode === 'overwrite') {
    next.author = author || null;
    next.organization = org || null;
    next.language = profile.defaultLanguage || undefined;
    return next;
  }
  if (!next.author && author) next.author = author;
  if (!next.organization && org) next.organization = org;
  if (!next.language) next.language = profile.defaultLanguage;
  return next;
}

export function identityPresetsEqual(
  a: Record<IdentityPresetId, IdentityFields>,
  b: Record<IdentityPresetId, IdentityFields>
): boolean {
  return (['personal', 'work', 'client'] as IdentityPresetId[]).every(
    (id) =>
      a[id].displayName === b[id].displayName &&
      a[id].organization === b[id].organization &&
      a[id].defaultLanguage === b[id].defaultLanguage &&
      a[id].signature === b[id].signature
  );
}

export function clearIdentityPreset<T extends {
  activeIdentityPreset: ActiveIdentityPreset;
  identityPresets: Record<IdentityPresetId, IdentityFields>;
}>(profile: T, id: IdentityPresetId): T {
  return {
    ...profile,
    identityPresets: {
      ...profile.identityPresets,
      [id]: { ...EMPTY_IDENTITY_FIELDS },
    },
    activeIdentityPreset:
      profile.activeIdentityPreset === id ? 'custom' : profile.activeIdentityPreset,
  };
}

/** Score 0–100 : nom, org, langue doc, signature (si activée ou renseignée). */
export function getProfileCompleteness(profile: {
  displayName: string;
  organization: string;
  defaultLanguage: AppLanguage;
  signature: string;
  signatureEnabled: boolean;
}): { score: number; filled: number; total: number; missingKeys: string[] } {
  const checks: Array<{ ok: boolean; key: string }> = [
    { ok: !!profile.displayName.trim(), key: 'account.complete.name' },
    { ok: !!profile.organization.trim(), key: 'account.complete.org' },
    { ok: !!profile.defaultLanguage, key: 'account.complete.lang' },
    {
      ok: !profile.signatureEnabled || !!profile.signature.trim(),
      key: 'account.complete.signature',
    },
  ];
  const filled = checks.filter((c) => c.ok).length;
  const total = checks.length;
  return {
    score: Math.round((filled / total) * 100),
    filled,
    total,
    missingKeys: checks.filter((c) => !c.ok).map((c) => c.key),
  };
}

export function profileMatchesSessionMetadata(
  profile: { displayName: string; organization: string; defaultLanguage: AppLanguage },
  metadata: MetadataSlice | undefined
): boolean {
  const expected = applyProfileToMetadata({}, profile, 'overwrite');
  const author = (metadata?.author || '').trim();
  const org = (metadata?.organization || '').trim();
  const lang = (metadata?.language || '').trim();
  return (
    author === (expected.author || '').trim() &&
    org === (expected.organization || '').trim() &&
    lang === (expected.language || '').trim()
  );
}
