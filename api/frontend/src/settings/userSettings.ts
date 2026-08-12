import type { ActiveIdentityPreset, AppLanguage, IdentityFields, IdentityPresetId } from './profileIdentity';
import {
  DEFAULT_APP_LANGUAGE,
  DEFAULT_IDENTITY_PRESETS,
  identityPresetsEqual,
  isAppLanguage,
  isIdentityPresetId,
  normalizeIdentityPresets,
} from './profileIdentity';
import {
  formatPairsEqual,
  normalizeFormatPairs,
  type FormatPair,
} from '../utils/conversionPairs';

export type {
  AppLanguage,
  IdentityPresetId,
  ActiveIdentityPreset,
  IdentityFields,
} from './profileIdentity';

export type UserPreferences = {
  displayName: string;
  organization: string;
  defaultLanguage: 'fr' | 'en' | 'es' | 'de';
  signature?: string;
};

export type SettingsValidationErrors = {
  displayName?: string;
  organization?: string;
  signature?: string;
};

export type BackgroundMode = 'default' | 'server' | 'custom';

export type HistoryLimit = 20 | 50 | 100;

export type EditorFontFamily = 'jetbrains' | 'consolas' | 'system';

export type InterfacePresetId = 'light' | 'dark' | 'minimal';

/** Clair / sombre / suivre le système. */
export type ThemePreference = 'default' | 'dark' | 'auto';

/** Thème des éditeurs Source / Résultat (indépendant de l’UI). */
export type EditorThemePreference = 'inherit' | 'light' | 'dark';

/** Échelle globale de l’interface (chrome + textes UI). */
export type UiScale = 'compact' | 'comfort' | 'large';

/** Ratio largeur source / résultat. */
export type PanelRatio = '40-60' | '50-50' | '60-40';

/** Disposition des panneaux source / résultat. */
export type PanelOrientation = 'side' | 'stacked';

/** Densité visuelle des panneaux source / résultat. */
export type PanelDensity = 'compact' | 'comfortable' | 'spacious';

/** Position de la barre latérale. */
export type SidebarPosition = 'left' | 'right';

/** Couleur d’accent de l’UI. */
export type AccentColor =
  | 'blue'
  | 'sky'
  | 'indigo'
  | 'violet'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'red'
  | 'orange'
  | 'amber'
  | 'lime'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'slate'
  | 'stone'
  | 'ruby'
  | 'sapphire'
  | 'amethyst'
  | 'topaz'
  | 'aquamarine'
  | 'garnet'
  | 'jade'
  | 'turquoise'
  | 'citrine'
  | 'peridot'
  | 'onyx'
  | 'coral'
  | 'lapis'
  | 'diamond'
  | 'pearl'
  | 'opal'
  | 'tanzanite'
  | 'tourmaline'
  | 'morganite'
  | 'kunzite'
  | 'malachite'
  | 'carnelian'
  | 'obsidian'
  | 'iolite'
  | 'spinel'
  | 'chrysoprase'
  | 'tigereye'
  | 'gold'
  | 'silver'
  | 'copper'
  | 'bronze'
  | 'brass'
  | 'steel'
  | 'platinum'
  | 'titanium'
  | 'iron'
  | 'chrome'
  | 'pewter'
  | 'rosegold';

export type AccentColorOption = { id: AccentColor; label: string };

/** Accents classiques. */
export const ACCENT_COLOR_CLASSIC: ReadonlyArray<AccentColorOption> = [
  { id: 'blue', label: 'Bleu' },
  { id: 'sky', label: 'Ciel' },
  { id: 'indigo', label: 'Indigo' },
  { id: 'violet', label: 'Violet' },
  { id: 'fuchsia', label: 'Fuchsia' },
  { id: 'pink', label: 'Rose vif' },
  { id: 'rose', label: 'Rose' },
  { id: 'red', label: 'Rouge' },
  { id: 'orange', label: 'Orange' },
  { id: 'amber', label: 'Ambre' },
  { id: 'lime', label: 'Citron' },
  { id: 'emerald', label: 'Émeraude' },
  { id: 'teal', label: 'Sarcelle' },
  { id: 'cyan', label: 'Cyan' },
  { id: 'slate', label: 'Ardoise' },
  { id: 'stone', label: 'Pierre' },
];

/** Accents inspirés des pierres précieuses / fines. */
export const ACCENT_COLOR_GEMSTONES: ReadonlyArray<AccentColorOption> = [
  { id: 'ruby', label: 'Rubis' },
  { id: 'sapphire', label: 'Saphir' },
  { id: 'amethyst', label: 'Améthyste' },
  { id: 'topaz', label: 'Topaze' },
  { id: 'aquamarine', label: 'Aigue-marine' },
  { id: 'garnet', label: 'Grenat' },
  { id: 'jade', label: 'Jade' },
  { id: 'turquoise', label: 'Turquoise' },
  { id: 'citrine', label: 'Citrine' },
  { id: 'peridot', label: 'Péridot' },
  { id: 'onyx', label: 'Onyx' },
  { id: 'coral', label: 'Corail' },
  { id: 'lapis', label: 'Lapis' },
  { id: 'diamond', label: 'Diamant' },
  { id: 'pearl', label: 'Perle' },
  { id: 'opal', label: 'Opale' },
  { id: 'tanzanite', label: 'Tanzanite' },
  { id: 'tourmaline', label: 'Tourmaline' },
  { id: 'morganite', label: 'Morganite' },
  { id: 'kunzite', label: 'Kunzite' },
  { id: 'malachite', label: 'Malachite' },
  { id: 'carnelian', label: 'Cornaline' },
  { id: 'obsidian', label: 'Obsidienne' },
  { id: 'iolite', label: 'Iolite' },
  { id: 'spinel', label: 'Spinelle' },
  { id: 'chrysoprase', label: 'Chrysoprase' },
  { id: 'tigereye', label: 'Œil-de-tigre' },
];

/** Accents inspirés des métaux. */
export const ACCENT_COLOR_METALS: ReadonlyArray<AccentColorOption> = [
  { id: 'gold', label: 'Or' },
  { id: 'silver', label: 'Argent' },
  { id: 'copper', label: 'Cuivre' },
  { id: 'bronze', label: 'Bronze' },
  { id: 'brass', label: 'Laiton' },
  { id: 'steel', label: 'Acier' },
  { id: 'platinum', label: 'Platine' },
  { id: 'titanium', label: 'Titane' },
  { id: 'iron', label: 'Fer' },
  { id: 'chrome', label: 'Chrome' },
  { id: 'pewter', label: 'Étain' },
  { id: 'rosegold', label: 'Or rose' },
];

/** Options affichées dans Paramètres → Interface. */
export const ACCENT_COLOR_OPTIONS: ReadonlyArray<AccentColorOption> = [
  ...ACCENT_COLOR_CLASSIC,
  ...ACCENT_COLOR_GEMSTONES,
  ...ACCENT_COLOR_METALS,
];

const ACCENT_COLORS: ReadonlySet<string> = new Set(ACCENT_COLOR_OPTIONS.map((o) => o.id));

/** Visibilité du fond derrière les panneaux (faible = plus opaque). */
export type BackgroundIntensity = 'low' | 'medium' | 'high';

/** Interligne des éditeurs source/résultat. */
export type EditorLineHeight = 'tight' | 'normal' | 'relaxed';

/** Durée d’affichage des snackbars. */
export type SnackbarDuration = 'short' | 'normal' | 'long';

/** Badge ⚙ : échecs depuis l’ouverture de l’app, total persisté, ou masqué. */
export type MetricsBadgeMode = 'session' | 'total' | 'off';

/** Niveau de détail de la bannière d’avertissements conversion. */
export type WarningsDetailLevel = 'compact' | 'detailed';

export type UserSettings = {
  profile: {
    displayName: string;
    organization: string;
    /** Langue des conversions / métadonnées document (indépendante du compte). */
    defaultLanguage: AppLanguage;
    /** Langue du compte (attribut html lang) — n’affecte pas la conversion. */
    uiLanguage: AppLanguage;
    /** Modèle de signature ({name}, {org}, {date}). */
    signature: string;
    /** Ajouter la signature en bas du résultat de conversion. */
    signatureEnabled: boolean;
    activeIdentityPreset: ActiveIdentityPreset;
    identityPresets: Record<IdentityPresetId, IdentityFields>;
  };
  conversion: {
    defaultSourceFormat: string;
    defaultOutputFormat: string;
    defaultProfileId: string;
    autoApplyUserToMetadata: boolean;
    defaultTocEnabled: boolean;
    saveConversionHistory: boolean;
    historyLimit: HistoryLimit;
    confirmBeforeConversion: boolean;
    /** Dernières paires source→cible utilisées (MRU). */
    recentPairs: FormatPair[];
    /** Paires source→cible épinglées. */
    favoritePairs: FormatPair[];
  };
  ui: {
    theme: ThemePreference;
    backgroundMode: BackgroundMode;
    editorFontSize: number;
    editorFontFamily: EditorFontFamily;
    /** Thème des zones d’édition (hérite de l’UI par défaut). */
    editorTheme: EditorThemePreference;
    compactMode: boolean;
    editorWordWrap: boolean;
    reduceMotion: boolean;
    tabSize: 2 | 4;
    showTooltips: boolean;
    sidebarCollapsedByDefault: boolean;
    /** Afficher la bannière d’avertissements après une conversion réussie. */
    showConversionWarnings: boolean;
    /** compact = titre seul (replié) ; detailed = liste + hints. */
    warningsDetailLevel: WarningsDetailLevel;
    /** Comportement du badge d’échecs sur l’icône Paramètres. */
    metricsBadgeMode: MetricsBadgeMode;
    /** En mode session, remettre le badge à zéro à l’ouverture de Métriques. */
    metricsBadgeResetOnView: boolean;
    /** Densité visuelle globale (indépendante du mode compact layout). */
    uiScale: UiScale;
    panelRatio: PanelRatio;
    /** Largeur du panneau source en % (25–75), pilotée aussi par le splitter. */
    panelSplitPercent: number;
    /** Côte à côte ou source au-dessus / résultat en dessous. */
    panelOrientation: PanelOrientation;
    accentColor: AccentColor;
    backgroundIntensity: BackgroundIntensity;
    editorLineHeight: EditorLineHeight;
    snackbarDuration: SnackbarDuration;
    /** Afficher la gouttière de numéros de ligne. */
    showLineNumbers: boolean;
    /** Contraste UI renforcé (bordures / textes). */
    highContrast: boolean;
    /** Anneau de focus plus visible. */
    strongFocus: boolean;
    /** Espacement des panneaux source / résultat. */
    panelDensity: PanelDensity;
    /** Côté d’ancrage de la sidebar. */
    sidebarPosition: SidebarPosition;
    /** Coloration légère des balises / titres dans les éditeurs. */
    syntaxHighlight: boolean;
    /** Synchroniser le défilement source ↔ résultat (proportionnel). */
    linkedScroll: boolean;
    /** Ids de commandes épinglées dans le header (à côté de Ctrl+K). */
    pinnedCommandIds: string[];
  };
};

export const USER_SETTINGS_KEY = 'ascend_user_settings';
export const MAX_DISPLAY_NAME = 100;
export const MAX_ORGANIZATION = 100;
export const MAX_SIGNATURE = 500;
/** Commandes épinglables dans le header (à côté de Ctrl+K). */
export const PINNABLE_COMMAND_IDS = [
  'convert',
  'find',
  'goto',
  'diff',
  'copy',
  'export',
  'history',
  'focus',
] as const;
export const MAX_PINNED_COMMANDS = 3;
export const DEFAULT_PINNED_COMMAND_IDS: string[] = ['convert', 'find'];

const HISTORY_LIMITS: HistoryLimit[] = [20, 50, 100];

function normalizeHistoryLimit(value: unknown): HistoryLimit {
  const n = typeof value === 'number' ? value : Number(value);
  return HISTORY_LIMITS.includes(n as HistoryLimit) ? (n as HistoryLimit) : 50;
}

function normalizeEditorFontFamily(value: unknown): EditorFontFamily {
  if (value === 'consolas' || value === 'system' || value === 'jetbrains') return value;
  return 'jetbrains';
}

function normalizeMetricsBadgeMode(value: unknown): MetricsBadgeMode {
  if (value === 'session' || value === 'total' || value === 'off') return value;
  return DEFAULT_USER_SETTINGS.ui.metricsBadgeMode;
}

function normalizeWarningsDetailLevel(value: unknown): WarningsDetailLevel {
  if (value === 'compact' || value === 'detailed') return value;
  return DEFAULT_USER_SETTINGS.ui.warningsDetailLevel;
}

function normalizeBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

const PINNABLE_SET = new Set<string>(PINNABLE_COMMAND_IDS);

export function normalizePinnedCommandIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_PINNED_COMMAND_IDS];
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string') continue;
    const id = raw.trim();
    if (!PINNABLE_SET.has(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length >= MAX_PINNED_COMMANDS) break;
  }
  return out;
}

function pinnedCommandIdsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}

function normalizeThemePreference(value: unknown): ThemePreference {
  if (value === 'default' || value === 'dark' || value === 'auto') return value;
  return DEFAULT_USER_SETTINGS.ui.theme;
}

function normalizeEditorThemePreference(value: unknown): EditorThemePreference {
  if (value === 'inherit' || value === 'light' || value === 'dark') return value;
  return DEFAULT_USER_SETTINGS.ui.editorTheme;
}

function normalizeUiScale(value: unknown): UiScale {
  if (value === 'compact' || value === 'comfort' || value === 'large') return value;
  return DEFAULT_USER_SETTINGS.ui.uiScale;
}

function normalizePanelDensity(value: unknown): PanelDensity {
  if (value === 'compact' || value === 'comfortable' || value === 'spacious') return value;
  return DEFAULT_USER_SETTINGS.ui.panelDensity;
}

function normalizeSidebarPosition(value: unknown): SidebarPosition {
  if (value === 'left' || value === 'right') return value;
  return DEFAULT_USER_SETTINGS.ui.sidebarPosition;
}

function normalizePanelOrientation(value: unknown): PanelOrientation {
  if (value === 'side' || value === 'stacked') return value;
  return DEFAULT_USER_SETTINGS.ui.panelOrientation;
}

function normalizePanelRatio(value: unknown): PanelRatio {
  if (value === '40-60' || value === '50-50' || value === '60-40') return value;
  return DEFAULT_USER_SETTINGS.ui.panelRatio;
}

function panelRatioToPercentLocal(ratio: PanelRatio): number {
  if (ratio === '40-60') return 40;
  if (ratio === '60-40') return 60;
  return 50;
}

export function normalizePanelSplitPercent(value: unknown, ratioFallback: PanelRatio = '50-50'): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (Number.isFinite(n)) return Math.min(75, Math.max(25, Math.round(n)));
  return panelRatioToPercentLocal(ratioFallback);
}

function normalizeAccentColor(value: unknown): AccentColor {
  if (typeof value === 'string' && ACCENT_COLORS.has(value)) return value as AccentColor;
  return DEFAULT_USER_SETTINGS.ui.accentColor;
}

function normalizeBackgroundIntensity(value: unknown): BackgroundIntensity {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return DEFAULT_USER_SETTINGS.ui.backgroundIntensity;
}

function normalizeEditorLineHeight(value: unknown): EditorLineHeight {
  if (value === 'tight' || value === 'normal' || value === 'relaxed') return value;
  return DEFAULT_USER_SETTINGS.ui.editorLineHeight;
}

function normalizeSnackbarDuration(value: unknown): SnackbarDuration {
  if (value === 'short' || value === 'normal' || value === 'long') return value;
  return DEFAULT_USER_SETTINGS.ui.snackbarDuration;
}

export function snackbarDurationToMs(duration: SnackbarDuration): number {
  if (duration === 'short') return 1600;
  if (duration === 'long') return 4500;
  return 2800;
}

/** Résout `auto` vers clair/sombre selon le système. */
export function resolveThemePreference(
  theme: ThemePreference,
  prefersDark?: boolean
): 'default' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'default') return 'default';
  const dark =
    typeof prefersDark === 'boolean'
      ? prefersDark
      : typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
  return dark ? 'dark' : 'default';
}

export function uiScaleToCssFactor(scale: UiScale): number {
  if (scale === 'compact') return 0.92;
  if (scale === 'large') return 1.1;
  return 1;
}

/** Applique un préset d’interface sur le brouillon UI (conserve fond custom si présent). */
export function applyInterfacePreset(
  ui: UserSettings['ui'],
  preset: InterfacePresetId
): UserSettings['ui'] {
  const keepCustomBg = ui.backgroundMode === 'custom';
  switch (preset) {
    case 'light':
      return {
        ...ui,
        theme: 'default',
        backgroundMode: keepCustomBg ? 'custom' : 'default',
        compactMode: false,
        reduceMotion: false,
        showTooltips: true,
        editorFontSize: 14,
        editorWordWrap: false,
        sidebarCollapsedByDefault: false,
        uiScale: 'comfort',
        warningsDetailLevel: 'detailed',
      };
    case 'dark':
      return {
        ...ui,
        theme: 'dark',
        backgroundMode: keepCustomBg ? 'custom' : 'default',
        compactMode: false,
        reduceMotion: false,
        showTooltips: true,
        editorFontSize: 14,
        editorWordWrap: false,
        sidebarCollapsedByDefault: false,
        uiScale: 'comfort',
        warningsDetailLevel: 'detailed',
      };
    case 'minimal':
      return {
        ...ui,
        theme: 'default',
        backgroundMode: keepCustomBg ? 'custom' : 'default',
        compactMode: true,
        reduceMotion: true,
        showTooltips: false,
        editorFontSize: 13,
        editorWordWrap: true,
        sidebarCollapsedByDefault: true,
        showConversionWarnings: true,
        warningsDetailLevel: 'compact',
        uiScale: 'compact',
      };
    default:
      return ui;
  }
}

/** Retourne le préset correspondant à l’UI courante, ou null si personnalisé. */
export function matchInterfacePreset(ui: UserSettings['ui']): InterfacePresetId | null {
  const ids: InterfacePresetId[] = ['light', 'dark', 'minimal'];
  for (const id of ids) {
    const applied = applyInterfacePreset(ui, id);
    if (
      applied.theme === ui.theme &&
      applied.compactMode === ui.compactMode &&
      applied.reduceMotion === ui.reduceMotion &&
      applied.showTooltips === ui.showTooltips &&
      applied.editorFontSize === ui.editorFontSize &&
      applied.editorWordWrap === ui.editorWordWrap &&
      applied.sidebarCollapsedByDefault === ui.sidebarCollapsedByDefault &&
      applied.uiScale === ui.uiScale &&
      applied.warningsDetailLevel === ui.warningsDetailLevel
    ) {
      return id;
    }
  }
  return null;
}

/** Défauts pour une nouvelle installation (aucune préférence enregistrée). */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  profile: {
    displayName: '',
    organization: '',
    defaultLanguage: DEFAULT_APP_LANGUAGE,
    uiLanguage: DEFAULT_APP_LANGUAGE,
    signature: '',
    signatureEnabled: false,
    activeIdentityPreset: 'custom',
    identityPresets: {
      personal: { ...DEFAULT_IDENTITY_PRESETS.personal },
      work: { ...DEFAULT_IDENTITY_PRESETS.work },
      client: { ...DEFAULT_IDENTITY_PRESETS.client },
    },
  },
  conversion: {
    defaultSourceFormat: '',
    defaultOutputFormat: '',
    defaultProfileId: '',
    autoApplyUserToMetadata: false,
    defaultTocEnabled: false,
    saveConversionHistory: true,
    historyLimit: 50,
    confirmBeforeConversion: false,
    recentPairs: [],
    favoritePairs: [],
  },
  ui: {
    theme: 'default',
    backgroundMode: 'default',
    editorFontSize: 14,
    editorFontFamily: 'jetbrains',
    editorTheme: 'inherit',
    compactMode: false,
    editorWordWrap: false,
    reduceMotion: false,
    tabSize: 4,
    showTooltips: false,
    sidebarCollapsedByDefault: false,
    showConversionWarnings: true,
    warningsDetailLevel: 'detailed',
    metricsBadgeMode: 'session',
    metricsBadgeResetOnView: true,
    uiScale: 'comfort',
    panelRatio: '50-50',
    panelSplitPercent: 50,
    panelOrientation: 'side',
    accentColor: 'blue',
    backgroundIntensity: 'medium',
    editorLineHeight: 'normal',
    snackbarDuration: 'normal',
    showLineNumbers: true,
    highContrast: false,
    strongFocus: false,
    panelDensity: 'comfortable',
    sidebarPosition: 'left',
    syntaxHighlight: false,
    linkedScroll: false,
    pinnedCommandIds: [...DEFAULT_PINNED_COMMAND_IDS],
  },
};

export function validateUserPrefs(prefs: UserPreferences): SettingsValidationErrors {
  const err: SettingsValidationErrors = {};
  const dn = (prefs.displayName || '').trim();
  const org = (prefs.organization || '').trim();
  const sig = (prefs.signature || '').trim();
  if (dn.length > MAX_DISPLAY_NAME) err.displayName = `Maximum ${MAX_DISPLAY_NAME} caractères`;
  if (org.length > MAX_ORGANIZATION) err.organization = `Maximum ${MAX_ORGANIZATION} caractères`;
  if (sig.length > MAX_SIGNATURE) err.signature = `Maximum ${MAX_SIGNATURE} caractères`;
  return err;
}

export function normalizeUserSettings(parsed: unknown): UserSettings {
  const root = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const p = (root.profile && typeof root.profile === 'object' ? root.profile : {}) as Record<string, unknown>;
  const c = (root.conversion && typeof root.conversion === 'object' ? root.conversion : {}) as Record<string, unknown>;
  const u = (root.ui && typeof root.ui === 'object' ? root.ui : {}) as Record<string, unknown>;
  const d = DEFAULT_USER_SETTINGS;
  const defaultLanguage: AppLanguage = isAppLanguage(p.defaultLanguage)
    ? p.defaultLanguage
    : DEFAULT_APP_LANGUAGE;
  const uiLanguage: AppLanguage = isAppLanguage(p.uiLanguage)
    ? p.uiLanguage
    : DEFAULT_APP_LANGUAGE;
  const activeIdentityPreset: ActiveIdentityPreset = isIdentityPresetId(p.activeIdentityPreset)
    ? p.activeIdentityPreset
    : p.activeIdentityPreset === 'custom'
      ? 'custom'
      : 'custom';
  return {
    profile: {
      displayName: typeof p.displayName === 'string' ? p.displayName : '',
      organization: typeof p.organization === 'string' ? p.organization : '',
      defaultLanguage,
      uiLanguage,
      signature: typeof p.signature === 'string' ? p.signature.slice(0, MAX_SIGNATURE) : '',
      signatureEnabled: normalizeBool(p.signatureEnabled, d.profile.signatureEnabled),
      activeIdentityPreset,
      identityPresets: normalizeIdentityPresets(p.identityPresets),
    },
    conversion: {
      defaultSourceFormat: typeof c.defaultSourceFormat === 'string' ? c.defaultSourceFormat : '',
      defaultOutputFormat: typeof c.defaultOutputFormat === 'string' ? c.defaultOutputFormat : '',
      defaultProfileId: typeof c.defaultProfileId === 'string' ? c.defaultProfileId : '',
      autoApplyUserToMetadata: normalizeBool(c.autoApplyUserToMetadata, d.conversion.autoApplyUserToMetadata),
      defaultTocEnabled: normalizeBool(c.defaultTocEnabled, d.conversion.defaultTocEnabled),
      saveConversionHistory: normalizeBool(c.saveConversionHistory, d.conversion.saveConversionHistory),
      historyLimit: normalizeHistoryLimit(c.historyLimit),
      confirmBeforeConversion: normalizeBool(c.confirmBeforeConversion, d.conversion.confirmBeforeConversion),
      recentPairs: normalizeFormatPairs(c.recentPairs),
      favoritePairs: normalizeFormatPairs(c.favoritePairs),
    },
    ui: {
      theme: normalizeThemePreference(u.theme),
      backgroundMode:
        u.backgroundMode === 'server' || u.backgroundMode === 'custom' || u.backgroundMode === 'default'
          ? u.backgroundMode
          : 'default',
      editorFontSize:
        typeof u.editorFontSize === 'number' && u.editorFontSize >= 8 && u.editorFontSize <= 32
          ? u.editorFontSize
          : 14,
      editorFontFamily: normalizeEditorFontFamily(u.editorFontFamily),
      editorTheme: normalizeEditorThemePreference(u.editorTheme),
      compactMode: normalizeBool(u.compactMode, d.ui.compactMode),
      editorWordWrap: normalizeBool(u.editorWordWrap, d.ui.editorWordWrap),
      reduceMotion: normalizeBool(u.reduceMotion, d.ui.reduceMotion),
      tabSize: u.tabSize === 2 ? 2 : 4,
      showTooltips: normalizeBool(u.showTooltips, d.ui.showTooltips),
      sidebarCollapsedByDefault: normalizeBool(u.sidebarCollapsedByDefault, d.ui.sidebarCollapsedByDefault),
      showConversionWarnings: normalizeBool(u.showConversionWarnings, d.ui.showConversionWarnings),
      warningsDetailLevel: normalizeWarningsDetailLevel(u.warningsDetailLevel),
      metricsBadgeMode: normalizeMetricsBadgeMode(u.metricsBadgeMode),
      metricsBadgeResetOnView: normalizeBool(u.metricsBadgeResetOnView, d.ui.metricsBadgeResetOnView),
      uiScale: normalizeUiScale(u.uiScale),
      panelRatio: normalizePanelRatio(u.panelRatio),
      panelSplitPercent: normalizePanelSplitPercent(u.panelSplitPercent, normalizePanelRatio(u.panelRatio)),
      panelOrientation: normalizePanelOrientation(u.panelOrientation),
      accentColor: normalizeAccentColor(u.accentColor),
      backgroundIntensity: normalizeBackgroundIntensity(u.backgroundIntensity),
      editorLineHeight: normalizeEditorLineHeight(u.editorLineHeight),
      snackbarDuration: normalizeSnackbarDuration(u.snackbarDuration),
      showLineNumbers: normalizeBool(u.showLineNumbers, d.ui.showLineNumbers),
      highContrast: normalizeBool(u.highContrast, d.ui.highContrast),
      strongFocus: normalizeBool(u.strongFocus, d.ui.strongFocus),
      panelDensity: normalizePanelDensity(u.panelDensity),
      sidebarPosition: normalizeSidebarPosition(u.sidebarPosition),
      syntaxHighlight: normalizeBool(u.syntaxHighlight, d.ui.syntaxHighlight),
      linkedScroll: normalizeBool(u.linkedScroll, d.ui.linkedScroll),
      pinnedCommandIds: normalizePinnedCommandIds(u.pinnedCommandIds),
    },
  };
}

export function loadUserSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(USER_SETTINGS_KEY);
    if (stored) return normalizeUserSettings(JSON.parse(stored));
  } catch (e) {
    console.error('Error loading user settings:', e);
  }
  return cloneUserSettings(DEFAULT_USER_SETTINGS);
}

export function cloneUserSettings(settings: UserSettings): UserSettings {
  return {
    profile: {
      ...settings.profile,
      identityPresets: {
        personal: { ...settings.profile.identityPresets.personal },
        work: { ...settings.profile.identityPresets.work },
        client: { ...settings.profile.identityPresets.client },
      },
    },
    conversion: {
      ...settings.conversion,
      recentPairs: [...settings.conversion.recentPairs],
      favoritePairs: [...settings.conversion.favoritePairs],
    },
    ui: { ...settings.ui },
  };
}

export function areUserSettingsEqual(a: UserSettings, b: UserSettings): boolean {
  return (
    a.profile.displayName === b.profile.displayName &&
    a.profile.organization === b.profile.organization &&
    a.profile.defaultLanguage === b.profile.defaultLanguage &&
    a.profile.uiLanguage === b.profile.uiLanguage &&
    a.profile.signature === b.profile.signature &&
    a.profile.signatureEnabled === b.profile.signatureEnabled &&
    a.profile.activeIdentityPreset === b.profile.activeIdentityPreset &&
    identityPresetsEqual(a.profile.identityPresets, b.profile.identityPresets) &&
    a.conversion.defaultSourceFormat === b.conversion.defaultSourceFormat &&
    a.conversion.defaultOutputFormat === b.conversion.defaultOutputFormat &&
    a.conversion.defaultProfileId === b.conversion.defaultProfileId &&
    a.conversion.autoApplyUserToMetadata === b.conversion.autoApplyUserToMetadata &&
    a.conversion.defaultTocEnabled === b.conversion.defaultTocEnabled &&
    a.conversion.saveConversionHistory === b.conversion.saveConversionHistory &&
    a.conversion.historyLimit === b.conversion.historyLimit &&
    a.conversion.confirmBeforeConversion === b.conversion.confirmBeforeConversion &&
    formatPairsEqual(a.conversion.recentPairs, b.conversion.recentPairs) &&
    formatPairsEqual(a.conversion.favoritePairs, b.conversion.favoritePairs) &&
    a.ui.theme === b.ui.theme &&
    a.ui.backgroundMode === b.ui.backgroundMode &&
    a.ui.editorFontSize === b.ui.editorFontSize &&
    a.ui.editorFontFamily === b.ui.editorFontFamily &&
    a.ui.editorTheme === b.ui.editorTheme &&
    a.ui.compactMode === b.ui.compactMode &&
    a.ui.editorWordWrap === b.ui.editorWordWrap &&
    a.ui.reduceMotion === b.ui.reduceMotion &&
    a.ui.tabSize === b.ui.tabSize &&
    a.ui.showTooltips === b.ui.showTooltips &&
    a.ui.sidebarCollapsedByDefault === b.ui.sidebarCollapsedByDefault &&
    a.ui.showConversionWarnings === b.ui.showConversionWarnings &&
    a.ui.warningsDetailLevel === b.ui.warningsDetailLevel &&
    a.ui.metricsBadgeMode === b.ui.metricsBadgeMode &&
    a.ui.metricsBadgeResetOnView === b.ui.metricsBadgeResetOnView &&
    a.ui.uiScale === b.ui.uiScale &&
    a.ui.panelRatio === b.ui.panelRatio &&
    a.ui.panelSplitPercent === b.ui.panelSplitPercent &&
    a.ui.panelOrientation === b.ui.panelOrientation &&
    a.ui.accentColor === b.ui.accentColor &&
    a.ui.backgroundIntensity === b.ui.backgroundIntensity &&
    a.ui.editorLineHeight === b.ui.editorLineHeight &&
    a.ui.snackbarDuration === b.ui.snackbarDuration &&
    a.ui.showLineNumbers === b.ui.showLineNumbers &&
    a.ui.highContrast === b.ui.highContrast &&
    a.ui.strongFocus === b.ui.strongFocus &&
    a.ui.panelDensity === b.ui.panelDensity &&
    a.ui.sidebarPosition === b.ui.sidebarPosition &&
    a.ui.syntaxHighlight === b.ui.syntaxHighlight &&
    a.ui.linkedScroll === b.ui.linkedScroll &&
    pinnedCommandIdsEqual(a.ui.pinnedCommandIds, b.ui.pinnedCommandIds)
  );
}

/**
 * Remet les préférences d’apparence / éditeur / confort aux défauts,
 * sans toucher aux options Conversion / Métriques (warnings, badge).
 */
export function resetInterfaceUiSettings(ui: UserSettings['ui']): UserSettings['ui'] {
  const d = DEFAULT_USER_SETTINGS.ui;
  return {
    ...ui,
    theme: d.theme,
    backgroundMode: ui.backgroundMode === 'custom' ? 'custom' : d.backgroundMode,
    editorFontSize: d.editorFontSize,
    editorFontFamily: d.editorFontFamily,
    editorTheme: d.editorTheme,
    compactMode: d.compactMode,
    editorWordWrap: d.editorWordWrap,
    reduceMotion: d.reduceMotion,
    tabSize: d.tabSize,
    showTooltips: d.showTooltips,
    sidebarCollapsedByDefault: d.sidebarCollapsedByDefault,
    uiScale: d.uiScale,
    panelRatio: d.panelRatio,
    panelSplitPercent: d.panelSplitPercent,
    panelOrientation: d.panelOrientation,
    accentColor: d.accentColor,
    backgroundIntensity: d.backgroundIntensity,
    editorLineHeight: d.editorLineHeight,
    snackbarDuration: d.snackbarDuration,
    showLineNumbers: d.showLineNumbers,
    highContrast: d.highContrast,
    strongFocus: d.strongFocus,
    panelDensity: d.panelDensity,
    sidebarPosition: d.sidebarPosition,
    syntaxHighlight: d.syntaxHighlight,
    linkedScroll: d.linkedScroll,
    pinnedCommandIds: [...d.pinnedCommandIds],
  };
}

/** Remet l’identité active aux défauts (conserve les slots Perso / Pro / Client). */
export function resetAccountProfile(profile: UserSettings['profile']): UserSettings['profile'] {
  const d = DEFAULT_USER_SETTINGS.profile;
  return {
    displayName: d.displayName,
    organization: d.organization,
    defaultLanguage: d.defaultLanguage,
    uiLanguage: d.uiLanguage,
    signature: d.signature,
    signatureEnabled: d.signatureEnabled,
    activeIdentityPreset: 'custom',
    identityPresets: {
      personal: { ...profile.identityPresets.personal },
      work: { ...profile.identityPresets.work },
      client: { ...profile.identityPresets.client },
    },
  };
}

export function persistUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving user settings:', e);
  }
}

export const SETTINGS_EXPORT_VERSION = 1;

export type UserSettingsExportBundle = {
  version: number;
  settings: UserSettings;
  /** Data URL du fond perso, si présent au moment de l’export. */
  customPageBackground?: string | null;
};

export type ParsedUserSettingsImport = {
  settings: UserSettings;
  /**
   * `undefined` = clé absente (ne pas toucher au fond du brouillon) ;
   * `null` = pas d’image ;
   * `string` = data URL.
   */
  customPageBackground?: string | null;
};

/** Construit le JSON d’export (préférences + fond custom éventuel). */
export function buildUserSettingsExport(
  settings: UserSettings,
  customPageBackground: string | null = null
): UserSettingsExportBundle {
  const bundle: UserSettingsExportBundle = {
    version: SETTINGS_EXPORT_VERSION,
    settings: cloneUserSettings(settings),
  };
  if (customPageBackground && customPageBackground.startsWith('data:image/')) {
    bundle.customPageBackground = customPageBackground;
  } else if (settings.ui.backgroundMode === 'custom') {
    bundle.customPageBackground = null;
  }
  return bundle;
}

function normalizeImportedBackground(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'string' && value.startsWith('data:image/')) return value;
  return null;
}

/** Parse un JSON d’export de préférences Ascend (v1 ou legacy plat). */
export function parseImportedUserSettings(raw: unknown): ParsedUserSettingsImport | null {
  if (!raw || typeof raw !== 'object') return null;
  try {
    const root = raw as Record<string, unknown>;
    const hasEnvelope =
      root.settings != null && typeof root.settings === 'object' && !Array.isArray(root.settings);
    if (hasEnvelope) {
      return {
        settings: normalizeUserSettings(root.settings),
        customPageBackground: normalizeImportedBackground(root.customPageBackground),
      };
    }
    // Legacy : objet UserSettings à la racine
    return {
      settings: normalizeUserSettings(root),
      customPageBackground: normalizeImportedBackground(root.customPageBackground),
    };
  } catch {
    return null;
  }
}
