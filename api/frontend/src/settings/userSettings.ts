export type UserPreferences = {
  displayName: string;
  organization: string;
  defaultLanguage: 'fr' | 'en' | 'es' | 'de';
};

export type SettingsValidationErrors = {
  displayName?: string;
  organization?: string;
};

export type UserSettings = {
  profile: {
    displayName: string;
    organization: string;
    defaultLanguage: 'fr' | 'en' | 'es' | 'de';
  };
  conversion: {
    defaultOutputFormat: string;
    autoApplyUserToMetadata: boolean;
    defaultTocEnabled: boolean;
    saveConversionHistory: boolean;
  };
  ui: {
    theme: 'default' | 'dark';
    editorFontSize: number;
    compactMode: boolean;
    editorWordWrap: boolean;
    reduceMotion: boolean;
    tabSize: 2 | 4;
    showTooltips: boolean;
  };
};

export const USER_SETTINGS_KEY = 'ascend_user_settings';
export const MAX_DISPLAY_NAME = 100;
export const MAX_ORGANIZATION = 100;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  profile: { displayName: '', organization: '', defaultLanguage: 'fr' },
  conversion: {
    defaultOutputFormat: '',
    autoApplyUserToMetadata: false,
    defaultTocEnabled: false,
    saveConversionHistory: true,
  },
  ui: {
    theme: 'default',
    editorFontSize: 14,
    compactMode: false,
    editorWordWrap: false,
    reduceMotion: false,
    tabSize: 4,
    showTooltips: true,
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

export function loadUserSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(USER_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const p = parsed.profile || {};
      const c = parsed.conversion || {};
      const u = parsed.ui || {};
      return {
        profile: {
          displayName: typeof p.displayName === 'string' ? p.displayName : '',
          organization: typeof p.organization === 'string' ? p.organization : '',
          defaultLanguage: ['fr', 'en', 'es', 'de'].includes(p.defaultLanguage) ? p.defaultLanguage : 'fr',
        },
        conversion: {
          defaultOutputFormat: typeof c.defaultOutputFormat === 'string' ? c.defaultOutputFormat : '',
          autoApplyUserToMetadata: !!c.autoApplyUserToMetadata,
          defaultTocEnabled: !!c.defaultTocEnabled,
          saveConversionHistory: c.saveConversionHistory !== false,
        },
        ui: {
          theme: ['default', 'dark'].includes(u.theme) ? u.theme : 'default',
          editorFontSize:
            typeof u.editorFontSize === 'number' && u.editorFontSize >= 8 && u.editorFontSize <= 32
              ? u.editorFontSize
              : 14,
          compactMode: !!u.compactMode,
          editorWordWrap: !!u.editorWordWrap,
          reduceMotion: !!u.reduceMotion,
          tabSize: u.tabSize === 2 ? 2 : 4,
          showTooltips: u.showTooltips !== false,
        },
      };
    }
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
    a.conversion.defaultOutputFormat === b.conversion.defaultOutputFormat &&
    a.conversion.autoApplyUserToMetadata === b.conversion.autoApplyUserToMetadata &&
    a.conversion.defaultTocEnabled === b.conversion.defaultTocEnabled &&
    a.conversion.saveConversionHistory === b.conversion.saveConversionHistory &&
    a.ui.theme === b.ui.theme &&
    a.ui.editorFontSize === b.ui.editorFontSize &&
    a.ui.compactMode === b.ui.compactMode &&
    a.ui.editorWordWrap === b.ui.editorWordWrap &&
    a.ui.reduceMotion === b.ui.reduceMotion &&
    a.ui.tabSize === b.ui.tabSize &&
    a.ui.showTooltips === b.ui.showTooltips
  );
}

export function persistUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving user settings:', e);
  }
}
