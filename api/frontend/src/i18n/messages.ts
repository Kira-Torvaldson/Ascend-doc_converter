import type { AppLanguage } from '../settings/profileIdentity';
import { APP_DE, APP_EN, APP_ES, APP_FR, type AppMessageKey } from './appMessages';
import { EXTRA_DE, EXTRA_EN, EXTRA_ES, EXTRA_FR, type ExtraMessageKey } from './extraUiMessages';
import { POLISH_DE, POLISH_EN, POLISH_ES, POLISH_FR, type PolishMessageKey } from './polishMessages';

export type MessageKey = keyof typeof FR_MESSAGES | AppMessageKey | ExtraMessageKey | PolishMessageKey;

const FR_MESSAGES = {
  'header.nav': 'Outils Ascend',
  'header.sidebar.show': 'Afficher les options',
  'header.sidebar.hide': 'Masquer les options',
  'header.history': 'Historique des conversions',
  'header.settings': 'Paramètres',
  'header.settings.failures': 'Paramètres · {count} échec(s) conversion',
  'header.settings.ariaFailures': 'Paramètres, {count} échec(s) conversion',

  'settings.title': 'Paramètres',
  'settings.saved': 'Enregistré',
  'settings.unsaved': 'Non enregistré',
  'settings.apply': 'Appliquer',
  'settings.applyDisabled': 'Aucun changement à enregistrer',
  'settings.reset': 'Réinitialiser',
  'settings.close': 'Fermer',
  'settings.minimize': 'Réduire',
  'settings.maximize': 'Agrandir',
  'settings.restore': 'Restaurer',

  'settings.nav.account': 'Compte',
  'settings.nav.conversion': 'Conversion',
  'settings.nav.interface': 'Interface',
  'settings.nav.data': 'Données',
  'settings.nav.metrics': 'Métriques',

  'account.unnamed': 'Identité non renseignée',
  'account.noOrg': 'Sans organisation',
  'account.chip.signatureOn': 'Signature active',
  'account.chip.signatureOff': 'Signature off',
  'account.chip.autoMetaOn': 'Auto-métadonnées on',
  'account.chip.autoMetaOff': 'Auto-métadonnées off',
  'account.chip.sessionSync': 'Session synchro',
  'account.chip.sessionDiff': 'Session différente',
  'account.missing': 'Manque : {list}',
  'account.presets': 'Profils d’identité',
  'account.presets.hint': 'Charger · Sauver · Effacer un slot mémorisé.',
  'account.presets.saved': 'Enregistré',
  'account.presets.save': 'Sauver',
  'account.presets.clear': 'Effacer',
  'account.presets.customHint':
    'Modifications non sauvegardées dans un profil — utilisez Sauver sur une carte.',
  'account.identity': 'Identité',
  'account.name': 'Nom / pseudo',
  'account.org': 'Organisation',
  'account.language': 'Langue du compte',
  'account.language.hint':
    'Français par défaut. Traduit l’interface Ascend. Indépendante de la langue de conversion.',
  'account.language.resetFr': 'Remettre le français',
  'account.complete.name': 'Nom',
  'account.complete.org': 'Organisation',
  'account.complete.lang': 'Langue conversion',
  'account.complete.signature': 'Signature',
  'account.complete.aria': 'Profil complété à {score} pour cent',
  'account.line.account': 'Compte {code}',
  'account.line.conversion': 'Conversion {code}',
  'account.signature': 'Signature document',
  'account.signature.enable': 'Ajouter la signature après chaque conversion',
  'account.signature.model': 'Modèle',
  'account.signature.preview': 'Aperçu',
  'account.signature.copy': 'Copier',
  'account.signature.copied': 'Copié',
  'account.signature.templates': 'Modèles de signature',
  'account.signature.vars': 'Variables',
  'account.meta': 'Métadonnées & actions',
  'account.meta.fromAccount': 'Depuis le compte',
  'account.meta.session': 'Session conversion',
  'account.meta.author': 'Auteur',
  'account.meta.org': 'Organisation',
  'account.meta.langConversion': 'Langue conversion',
  'account.meta.lang': 'Langue',
  'account.meta.desync':
    'La session ne correspond pas au compte — utilisez « Remplir » pour synchroniser.',
  'account.meta.autoApply': 'Appliquer automatiquement à chaque conversion',
  'account.meta.fill': 'Remplir les métadonnées maintenant',
  'account.meta.applyFill': 'Appliquer & sync métadonnées',
  'account.meta.fillTooltip': 'Recopie nom, organisation et langue de conversion dans la session',
  'account.meta.applyFillTooltip': 'Enregistre le compte et synchronise les métadonnées de session',
  'account.meta.resetIdentity': 'Réinitialiser l’identité active',
  'account.meta.resetIdentityTooltip':
    'Vide les champs actifs (conserve Perso / Pro / Client sauvegardés)',

  'conversion.intro':
    'Préférences de session et d’historique — sans modifier le moteur de conversion.',
  'conversion.language': 'Langue de conversion',
  'conversion.language.hint':
    'Français par défaut. Métadonnées des documents convertis — indépendante de la langue du compte.',
  'conversion.language.resetFr': 'Remettre le français',
  'conversion.defaultProfile': 'Profil par défaut (1er démarrage)',
  'conversion.defaultProfile.hint':
    'Appliqué seulement s’il n’y a aucun profil actif (nouvelle session).',
  'conversion.historyLimit': 'Limite d’historique',
  'conversion.sourceFormat': 'Format source par défaut',
  'conversion.outputFormat': 'Format de sortie par défaut',
  'conversion.toc': 'Table des matières par défaut',
  'conversion.history': 'Conserver l’historique',
  'conversion.confirm': 'Confirmer avant conversion',
  'conversion.autoMeta': 'Appliquer le profil aux métadonnées',
  'conversion.historyEntries': '{count} entrées',

  'header.tagline': 'Convertisseur AsciiDoc ↔ Markdown',
  'iface.appearance': 'Apparence',
  'iface.background': 'Fond',
  'iface.editor': 'Éditeur',
  'iface.comfort': 'Confort & accessibilité',
  'iface.reset': 'Réinitialiser l’interface',

  'lang.fr': 'Français (par défaut)',
  'lang.en': 'Anglais',
  'lang.es': 'Espagnol',
  'lang.de': 'Allemand',

  'preset.personal': 'Perso',
  'preset.work': 'Pro',
  'preset.client': 'Client',
  'preset.empty': 'Vide',
  'preset.custom': 'Personnalisé',
} as const;

const EN_MESSAGES: Record<keyof typeof FR_MESSAGES, string> = {
  'header.nav': 'Ascend tools',
  'header.sidebar.show': 'Show options',
  'header.sidebar.hide': 'Hide options',
  'header.history': 'Conversion history',
  'header.settings': 'Settings',
  'header.settings.failures': 'Settings · {count} conversion failure(s)',
  'header.settings.ariaFailures': 'Settings, {count} conversion failure(s)',

  'settings.title': 'Settings',
  'settings.saved': 'Saved',
  'settings.unsaved': 'Unsaved',
  'settings.apply': 'Apply',
  'settings.applyDisabled': 'No changes to save',
  'settings.reset': 'Reset',
  'settings.close': 'Close',
  'settings.minimize': 'Minimize',
  'settings.maximize': 'Maximize',
  'settings.restore': 'Restore',

  'settings.nav.account': 'Account',
  'settings.nav.conversion': 'Conversion',
  'settings.nav.interface': 'Interface',
  'settings.nav.data': 'Data',
  'settings.nav.metrics': 'Metrics',

  'account.unnamed': 'Identity not set',
  'account.noOrg': 'No organization',
  'account.chip.signatureOn': 'Signature on',
  'account.chip.signatureOff': 'Signature off',
  'account.chip.autoMetaOn': 'Auto-metadata on',
  'account.chip.autoMetaOff': 'Auto-metadata off',
  'account.chip.sessionSync': 'Session in sync',
  'account.chip.sessionDiff': 'Session differs',
  'account.missing': 'Missing: {list}',
  'account.presets': 'Identity profiles',
  'account.presets.hint': 'Load · Save · Clear a stored slot.',
  'account.presets.saved': 'Saved',
  'account.presets.save': 'Save',
  'account.presets.clear': 'Clear',
  'account.presets.customHint':
    'Changes not saved to a profile — use Save on a card.',
  'account.identity': 'Identity',
  'account.name': 'Name / nickname',
  'account.org': 'Organization',
  'account.language': 'Account language',
  'account.language.hint':
    'French by default. Translates the Ascend UI. Independent from conversion language.',
  'account.language.resetFr': 'Reset to French',
  'account.complete.name': 'Name',
  'account.complete.org': 'Organization',
  'account.complete.lang': 'Conversion language',
  'account.complete.signature': 'Signature',
  'account.complete.aria': 'Profile {score}% complete',
  'account.line.account': 'Account {code}',
  'account.line.conversion': 'Conversion {code}',
  'account.signature': 'Document signature',
  'account.signature.enable': 'Append signature after each conversion',
  'account.signature.model': 'Template',
  'account.signature.preview': 'Preview',
  'account.signature.copy': 'Copy',
  'account.signature.copied': 'Copied',
  'account.signature.templates': 'Signature templates',
  'account.signature.vars': 'Variables',
  'account.meta': 'Metadata & actions',
  'account.meta.fromAccount': 'From account',
  'account.meta.session': 'Conversion session',
  'account.meta.author': 'Author',
  'account.meta.org': 'Organization',
  'account.meta.langConversion': 'Conversion language',
  'account.meta.lang': 'Language',
  'account.meta.desync':
    'Session does not match the account — use Fill to sync.',
  'account.meta.autoApply': 'Apply automatically on each conversion',
  'account.meta.fill': 'Fill metadata now',
  'account.meta.applyFill': 'Apply & sync metadata',
  'account.meta.fillTooltip': 'Copy name, organization and conversion language into the session',
  'account.meta.applyFillTooltip': 'Save the account and sync session metadata',
  'account.meta.resetIdentity': 'Reset active identity',
  'account.meta.resetIdentityTooltip':
    'Clear active fields (keeps saved Personal / Work / Client slots)',

  'conversion.intro':
    'Session and history preferences — without changing the conversion engine.',
  'conversion.language': 'Conversion language',
  'conversion.language.hint':
    'French by default. Document metadata language — independent from account language.',
  'conversion.language.resetFr': 'Reset to French',
  'conversion.defaultProfile': 'Default profile (first start)',
  'conversion.defaultProfile.hint':
    'Applied only when no profile is active (new session).',
  'conversion.historyLimit': 'History limit',
  'conversion.sourceFormat': 'Default source format',
  'conversion.outputFormat': 'Default output format',
  'conversion.toc': 'Default table of contents',
  'conversion.history': 'Keep history',
  'conversion.confirm': 'Confirm before conversion',
  'conversion.autoMeta': 'Apply profile to metadata',
  'conversion.historyEntries': '{count} entries',

  'header.tagline': 'AsciiDoc ↔ Markdown converter',
  'iface.appearance': 'Appearance',
  'iface.background': 'Background',
  'iface.editor': 'Editor',
  'iface.comfort': 'Comfort & accessibility',
  'iface.reset': 'Reset interface',

  'lang.fr': 'French (default)',
  'lang.en': 'English',
  'lang.es': 'Spanish',
  'lang.de': 'German',

  'preset.personal': 'Personal',
  'preset.work': 'Work',
  'preset.client': 'Client',
  'preset.empty': 'Empty',
  'preset.custom': 'Custom',
};

const ES_MESSAGES: Record<keyof typeof FR_MESSAGES, string> = {
  'header.nav': 'Herramientas Ascend',
  'header.sidebar.show': 'Mostrar opciones',
  'header.sidebar.hide': 'Ocultar opciones',
  'header.history': 'Historial de conversiones',
  'header.settings': 'Ajustes',
  'header.settings.failures': 'Ajustes · {count} error(es) de conversión',
  'header.settings.ariaFailures': 'Ajustes, {count} error(es) de conversión',

  'settings.title': 'Ajustes',
  'settings.saved': 'Guardado',
  'settings.unsaved': 'Sin guardar',
  'settings.apply': 'Aplicar',
  'settings.applyDisabled': 'No hay cambios que guardar',
  'settings.reset': 'Restablecer',
  'settings.close': 'Cerrar',
  'settings.minimize': 'Minimizar',
  'settings.maximize': 'Maximizar',
  'settings.restore': 'Restaurar',

  'settings.nav.account': 'Cuenta',
  'settings.nav.conversion': 'Conversión',
  'settings.nav.interface': 'Interfaz',
  'settings.nav.data': 'Datos',
  'settings.nav.metrics': 'Métricas',

  'account.unnamed': 'Identidad no indicada',
  'account.noOrg': 'Sin organización',
  'account.chip.signatureOn': 'Firma activa',
  'account.chip.signatureOff': 'Firma off',
  'account.chip.autoMetaOn': 'Auto-metadatos on',
  'account.chip.autoMetaOff': 'Auto-metadatos off',
  'account.chip.sessionSync': 'Sesión sincronizada',
  'account.chip.sessionDiff': 'Sesión distinta',
  'account.missing': 'Falta: {list}',
  'account.presets': 'Perfiles de identidad',
  'account.presets.hint': 'Cargar · Guardar · Borrar una ranura.',
  'account.presets.saved': 'Guardado',
  'account.presets.save': 'Guardar',
  'account.presets.clear': 'Borrar',
  'account.presets.customHint':
    'Cambios no guardados en un perfil — use Guardar en una tarjeta.',
  'account.identity': 'Identidad',
  'account.name': 'Nombre / apodo',
  'account.org': 'Organización',
  'account.language': 'Idioma de la cuenta',
  'account.language.hint':
    'Francés por defecto. Traduce la interfaz de Ascend. Independiente del idioma de conversión.',
  'account.language.resetFr': 'Volver al francés',
  'account.complete.name': 'Nombre',
  'account.complete.org': 'Organización',
  'account.complete.lang': 'Idioma de conversión',
  'account.complete.signature': 'Firma',
  'account.complete.aria': 'Perfil completado al {score} por ciento',
  'account.line.account': 'Cuenta {code}',
  'account.line.conversion': 'Conversión {code}',
  'account.signature': 'Firma del documento',
  'account.signature.enable': 'Añadir la firma tras cada conversión',
  'account.signature.model': 'Plantilla',
  'account.signature.preview': 'Vista previa',
  'account.signature.copy': 'Copiar',
  'account.signature.copied': 'Copiado',
  'account.signature.templates': 'Plantillas de firma',
  'account.signature.vars': 'Variables',
  'account.meta': 'Metadatos y acciones',
  'account.meta.fromAccount': 'Desde la cuenta',
  'account.meta.session': 'Sesión de conversión',
  'account.meta.author': 'Autor',
  'account.meta.org': 'Organización',
  'account.meta.langConversion': 'Idioma de conversión',
  'account.meta.lang': 'Idioma',
  'account.meta.desync':
    'La sesión no coincide con la cuenta — use Rellenar para sincronizar.',
  'account.meta.autoApply': 'Aplicar automáticamente en cada conversión',
  'account.meta.fill': 'Rellenar metadatos ahora',
  'account.meta.applyFill': 'Aplicar y sincronizar metadatos',
  'account.meta.fillTooltip': 'Copia nombre, organización e idioma de conversión a la sesión',
  'account.meta.applyFillTooltip': 'Guarda la cuenta y sincroniza los metadatos de sesión',
  'account.meta.resetIdentity': 'Restablecer identidad activa',
  'account.meta.resetIdentityTooltip':
    'Vacía los campos activos (conserva Personal / Pro / Cliente)',

  'conversion.intro':
    'Preferencias de sesión e historial — sin modificar el motor de conversión.',
  'conversion.language': 'Idioma de conversión',
  'conversion.language.hint':
    'Francés por defecto. Metadatos de los documentos — independiente del idioma de la cuenta.',
  'conversion.language.resetFr': 'Volver al francés',
  'conversion.defaultProfile': 'Perfil por defecto (primer inicio)',
  'conversion.defaultProfile.hint':
    'Solo si no hay ningún perfil activo (nueva sesión).',
  'conversion.historyLimit': 'Límite del historial',
  'conversion.sourceFormat': 'Formato de origen por defecto',
  'conversion.outputFormat': 'Formato de salida por defecto',
  'conversion.toc': 'Tabla de contenidos por defecto',
  'conversion.history': 'Conservar el historial',
  'conversion.confirm': 'Confirmar antes de convertir',
  'conversion.autoMeta': 'Aplicar el perfil a los metadatos',
  'conversion.historyEntries': '{count} entradas',

  'header.tagline': 'Convertidor AsciiDoc ↔ Markdown',
  'iface.appearance': 'Apariencia',
  'iface.background': 'Fondo',
  'iface.editor': 'Editor',
  'iface.comfort': 'Comodidad y accesibilidad',
  'iface.reset': 'Restablecer la interfaz',

  'lang.fr': 'Francés (por defecto)',
  'lang.en': 'Inglés',
  'lang.es': 'Español',
  'lang.de': 'Alemán',

  'preset.personal': 'Personal',
  'preset.work': 'Pro',
  'preset.client': 'Cliente',
  'preset.empty': 'Vacío',
  'preset.custom': 'Personalizado',
};

const DE_MESSAGES: Record<keyof typeof FR_MESSAGES, string> = {
  'header.nav': 'Ascend-Werkzeuge',
  'header.sidebar.show': 'Optionen anzeigen',
  'header.sidebar.hide': 'Optionen ausblenden',
  'header.history': 'Konvertierungsverlauf',
  'header.settings': 'Einstellungen',
  'header.settings.failures': 'Einstellungen · {count} Konvertierungsfehler',
  'header.settings.ariaFailures': 'Einstellungen, {count} Konvertierungsfehler',

  'settings.title': 'Einstellungen',
  'settings.saved': 'Gespeichert',
  'settings.unsaved': 'Nicht gespeichert',
  'settings.apply': 'Übernehmen',
  'settings.applyDisabled': 'Keine Änderungen zum Speichern',
  'settings.reset': 'Zurücksetzen',
  'settings.close': 'Schließen',
  'settings.minimize': 'Minimieren',
  'settings.maximize': 'Maximieren',
  'settings.restore': 'Wiederherstellen',

  'settings.nav.account': 'Konto',
  'settings.nav.conversion': 'Konvertierung',
  'settings.nav.interface': 'Oberfläche',
  'settings.nav.data': 'Daten',
  'settings.nav.metrics': 'Metriken',

  'account.unnamed': 'Identität nicht angegeben',
  'account.noOrg': 'Keine Organisation',
  'account.chip.signatureOn': 'Signatur aktiv',
  'account.chip.signatureOff': 'Signatur aus',
  'account.chip.autoMetaOn': 'Auto-Metadaten an',
  'account.chip.autoMetaOff': 'Auto-Metadaten aus',
  'account.chip.sessionSync': 'Sitzung synchron',
  'account.chip.sessionDiff': 'Sitzung unterschiedlich',
  'account.missing': 'Fehlt: {list}',
  'account.presets': 'Identitätsprofile',
  'account.presets.hint': 'Laden · Speichern · Slot leeren.',
  'account.presets.saved': 'Gespeichert',
  'account.presets.save': 'Speichern',
  'account.presets.clear': 'Leeren',
  'account.presets.customHint':
    'Änderungen nicht in einem Profil gespeichert — Speichern auf einer Karte nutzen.',
  'account.identity': 'Identität',
  'account.name': 'Name / Pseudonym',
  'account.org': 'Organisation',
  'account.language': 'Kontosprache',
  'account.language.hint':
    'Französisch standardmäßig. Übersetzt die Ascend-Oberfläche. Unabhängig von der Konvertierungssprache.',
  'account.language.resetFr': 'Französisch wiederherstellen',
  'account.complete.name': 'Name',
  'account.complete.org': 'Organisation',
  'account.complete.lang': 'Konvertierungssprache',
  'account.complete.signature': 'Signatur',
  'account.complete.aria': 'Profil zu {score} Prozent ausgefüllt',
  'account.line.account': 'Konto {code}',
  'account.line.conversion': 'Konvertierung {code}',
  'account.signature': 'Dokumentsignatur',
  'account.signature.enable': 'Signatur nach jeder Konvertierung anhängen',
  'account.signature.model': 'Vorlage',
  'account.signature.preview': 'Vorschau',
  'account.signature.copy': 'Kopieren',
  'account.signature.copied': 'Kopiert',
  'account.signature.templates': 'Signaturvorlagen',
  'account.signature.vars': 'Variablen',
  'account.meta': 'Metadaten & Aktionen',
  'account.meta.fromAccount': 'Vom Konto',
  'account.meta.session': 'Konvertierungssitzung',
  'account.meta.author': 'Autor',
  'account.meta.org': 'Organisation',
  'account.meta.langConversion': 'Konvertierungssprache',
  'account.meta.lang': 'Sprache',
  'account.meta.desync':
    'Sitzung stimmt nicht mit dem Konto überein — Zum Synchronisieren „Ausfüllen“ nutzen.',
  'account.meta.autoApply': 'Bei jeder Konvertierung automatisch anwenden',
  'account.meta.fill': 'Metadaten jetzt ausfüllen',
  'account.meta.applyFill': 'Übernehmen & Metadaten sync',
  'account.meta.fillTooltip': 'Name, Organisation und Konvertierungssprache in die Sitzung kopieren',
  'account.meta.applyFillTooltip': 'Konto speichern und Sitzungsmetadaten synchronisieren',
  'account.meta.resetIdentity': 'Aktive Identität zurücksetzen',
  'account.meta.resetIdentityTooltip':
    'Aktive Felder leeren (gespeicherte Privat / Arbeit / Kunde bleiben)',

  'conversion.intro':
    'Sitzungs- und Verlaufseinstellungen — ohne die Konvertierungs-Engine zu ändern.',
  'conversion.language': 'Konvertierungssprache',
  'conversion.language.hint':
    'Französisch standardmäßig. Metadaten der Dokumente — unabhängig von der Kontosprache.',
  'conversion.language.resetFr': 'Französisch wiederherstellen',
  'conversion.defaultProfile': 'Standardprofil (erster Start)',
  'conversion.defaultProfile.hint':
    'Nur wenn kein Profil aktiv ist (neue Sitzung).',
  'conversion.historyLimit': 'Verlaufslimit',
  'conversion.sourceFormat': 'Standard-Quellformat',
  'conversion.outputFormat': 'Standard-Zielformat',
  'conversion.toc': 'Standard-Inhaltsverzeichnis',
  'conversion.history': 'Verlauf behalten',
  'conversion.confirm': 'Vor Konvertierung bestätigen',
  'conversion.autoMeta': 'Profil auf Metadaten anwenden',
  'conversion.historyEntries': '{count} Einträge',

  'header.tagline': 'AsciiDoc ↔ Markdown-Konverter',
  'iface.appearance': 'Erscheinungsbild',
  'iface.background': 'Hintergrund',
  'iface.editor': 'Editor',
  'iface.comfort': 'Komfort & Barrierefreiheit',
  'iface.reset': 'Oberfläche zurücksetzen',

  'lang.fr': 'Französisch (Standard)',
  'lang.en': 'Englisch',
  'lang.es': 'Spanisch',
  'lang.de': 'Deutsch',

  'preset.personal': 'Privat',
  'preset.work': 'Arbeit',
  'preset.client': 'Kunde',
  'preset.empty': 'Leer',
  'preset.custom': 'Benutzerdefiniert',
};

const CORE_TABLES: Record<AppLanguage, Record<keyof typeof FR_MESSAGES, string>> = {
  fr: FR_MESSAGES,
  en: EN_MESSAGES,
  es: ES_MESSAGES,
  de: DE_MESSAGES,
};

const APP_TABLES: Record<AppLanguage, Record<AppMessageKey, string>> = {
  fr: APP_FR,
  en: APP_EN,
  es: APP_ES,
  de: APP_DE,
};

const EXTRA_TABLES: Record<AppLanguage, Record<ExtraMessageKey, string>> = {
  fr: EXTRA_FR,
  en: EXTRA_EN,
  es: EXTRA_ES,
  de: EXTRA_DE,
};

const POLISH_TABLES: Record<AppLanguage, Record<PolishMessageKey, string>> = {
  fr: POLISH_FR,
  en: POLISH_EN,
  es: POLISH_ES,
  de: POLISH_DE,
};

export function translate(
  lang: AppLanguage,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const core = CORE_TABLES[lang] || FR_MESSAGES;
  const app = APP_TABLES[lang] || APP_FR;
  const extra = EXTRA_TABLES[lang] || EXTRA_FR;
  const polish = POLISH_TABLES[lang] || POLISH_FR;
  let text =
    (core as Record<string, string>)[key] ??
    (app as Record<string, string>)[key] ??
    (extra as Record<string, string>)[key] ??
    (polish as Record<string, string>)[key] ??
    (FR_MESSAGES as Record<string, string>)[key] ??
    (APP_FR as Record<string, string>)[key] ??
    (EXTRA_FR as Record<string, string>)[key] ??
    (POLISH_FR as Record<string, string>)[key] ??
    key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function languageOptionLabel(lang: AppLanguage, option: AppLanguage): string {
  return translate(lang, `lang.${option}` as MessageKey);
}
