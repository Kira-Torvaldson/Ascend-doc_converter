export type UserPreferences = {
  displayName: string;
  organization: string;
  defaultLanguage: 'fr' | 'en' | 'es' | 'de';
};

export type SettingsValidationErrors = {
  displayName?: string;
  organization?: string;
};

export type BackgroundMode = 'default' | 'server' | 'custom';

export type HistoryLimit = 20 | 50 | 100;

export type EditorFontFamily = 'jetbrains' | 'consolas' | 'system';

export type InterfacePresetId = 'light' | 'dark' | 'minimal';

export type UserSettings = {
  profile: {
    displayName: string;
    organization: string;
    defaultLanguage: 'fr' | 'en' | 'es' | 'de';
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
  };
  ui: {
    theme: 'default' | 'dark';
    backgroundMode: BackgroundMode;
    editorFontSize: number;
    editorFontFamily: EditorFontFamily;
    compactMode: boolean;
    editorWordWrap: boolean;
    reduceMotion: boolean;
    tabSize: 2 | 4;
    showTooltips: boolean;
    sidebarCollapsedByDefault: boolean;
  };
};

export const USER_SETTINGS_KEY = 'ascend_user_settings';
export const MAX_DISPLAY_NAME = 100;
export const MAX_ORGANIZATION = 100;

const HISTORY_LIMITS: HistoryLimit[] = [20, 50, 100];

function normalizeHistoryLimit(value: unknown): HistoryLimit {
  const n = typeof value === 'number' ? value : Number(value);
  return HISTORY_LIMITS.includes(n as HistoryLimit) ? (n as HistoryLimit) : 50;
}

function normalizeEditorFontFamily(value: unknown): EditorFontFamily {
  if (value === 'consolas' || value === 'system' || value === 'jetbrains') return value;
  return 'jetbrains';
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
      };
    default:
      return ui;
  }
}

/** Défauts : aucune case cochée. */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  profile: { displayName: '', organization: '', defaultLanguage: 'fr' },
  conversion: {
    defaultSourceFormat: '',
    defaultOutputFormat: '',
    defaultProfileId: '',
    autoApplyUserToMetadata: false,
    defaultTocEnabled: false,
    saveConversionHistory: false,
    historyLimit: 50,
    confirmBeforeConversion: false,
  },
  ui: {
    theme: 'default',
    backgroundMode: 'default',
    editorFontSize: 14,
    editorFontFamily: 'jetbrains',
    compactMode: false,
    editorWordWrap: false,
    reduceMotion: false,
    tabSize: 4,
    showTooltips: false,
    sidebarCollapsedByDefault: false,
  },
};

export function validateUserPrefs(prefs: UserPreferences): SettingsValidationErrors {
  const err: SettingsValidationErrors = {};
  const dn = (prefs.displayName || '').trim();
  const org = (prefs.organization || '').trim();
  if (dn.length > MAX_DISPLAY_NAME) err.displayName = `Maximum ${MAX_DISPLAY_NAME} caractères`;
  if (org.length > MAX_ORGANIZATION) err.organization = `Maximum ${MAX_ORGANIZATION} caractères`;
  return err;
}

export function normalizeUserSettings(parsed: unknown): UserSettings {
  const root = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const p = (root.profile && typeof root.profile === 'object' ? root.profile : {}) as Record<string, unknown>;
  const c = (root.conversion && typeof root.conversion === 'object' ? root.conversion : {}) as Record<string, unknown>;
  const u = (root.ui && typeof root.ui === 'object' ? root.ui : {}) as Record<string, unknown>;
  return {
    profile: {
      displayName: typeof p.displayName === 'string' ? p.displayName : '',
      organization: typeof p.organization === 'string' ? p.organization : '',
      defaultLanguage: ['fr', 'en', 'es', 'de'].includes(String(p.defaultLanguage))
        ? (p.defaultLanguage as 'fr' | 'en' | 'es' | 'de')
        : 'fr',
    },
    conversion: {
      defaultSourceFormat: typeof c.defaultSourceFormat === 'string' ? c.defaultSourceFormat : '',
      defaultOutputFormat: typeof c.defaultOutputFormat === 'string' ? c.defaultOutputFormat : '',
      defaultProfileId: typeof c.defaultProfileId === 'string' ? c.defaultProfileId : '',
      autoApplyUserToMetadata: !!c.autoApplyUserToMetadata,
      defaultTocEnabled: !!c.defaultTocEnabled,
      saveConversionHistory: !!c.saveConversionHistory,
      historyLimit: normalizeHistoryLimit(c.historyLimit),
      confirmBeforeConversion: !!c.confirmBeforeConversion,
    },
    ui: {
      theme: ['default', 'dark'].includes(String(u.theme)) ? (u.theme as 'default' | 'dark') : 'default',
      backgroundMode:
        u.backgroundMode === 'server' || u.backgroundMode === 'custom' || u.backgroundMode === 'default'
          ? u.backgroundMode
          : 'default',
      editorFontSize:
        typeof u.editorFontSize === 'number' && u.editorFontSize >= 8 && u.editorFontSize <= 32
          ? u.editorFontSize
          : 14,
      editorFontFamily: normalizeEditorFontFamily(u.editorFontFamily),
      compactMode: !!u.compactMode,
      editorWordWrap: !!u.editorWordWrap,
      reduceMotion: !!u.reduceMotion,
      tabSize: u.tabSize === 2 ? 2 : 4,
      showTooltips: !!u.showTooltips,
      sidebarCollapsedByDefault: !!u.sidebarCollapsedByDefault,
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
    profile: { ...settings.profile },
    conversion: { ...settings.conversion },
    ui: { ...settings.ui },
  };
}

export function areUserSettingsEqual(a: UserSettings, b: UserSettings): boolean {
  return (
    a.profile.displayName === b.profile.displayName &&
    a.profile.organization === b.profile.organization &&
    a.profile.defaultLanguage === b.profile.defaultLanguage &&
    a.conversion.defaultSourceFormat === b.conversion.defaultSourceFormat &&
    a.conversion.defaultOutputFormat === b.conversion.defaultOutputFormat &&
    a.conversion.defaultProfileId === b.conversion.defaultProfileId &&
    a.conversion.autoApplyUserToMetadata === b.conversion.autoApplyUserToMetadata &&
    a.conversion.defaultTocEnabled === b.conversion.defaultTocEnabled &&
    a.conversion.saveConversionHistory === b.conversion.saveConversionHistory &&
    a.conversion.historyLimit === b.conversion.historyLimit &&
    a.conversion.confirmBeforeConversion === b.conversion.confirmBeforeConversion &&
    a.ui.theme === b.ui.theme &&
    a.ui.backgroundMode === b.ui.backgroundMode &&
    a.ui.editorFontSize === b.ui.editorFontSize &&
    a.ui.editorFontFamily === b.ui.editorFontFamily &&
    a.ui.compactMode === b.ui.compactMode &&
    a.ui.editorWordWrap === b.ui.editorWordWrap &&
    a.ui.reduceMotion === b.ui.reduceMotion &&
    a.ui.tabSize === b.ui.tabSize &&
    a.ui.showTooltips === b.ui.showTooltips &&
    a.ui.sidebarCollapsedByDefault === b.ui.sidebarCollapsedByDefault
  );
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
