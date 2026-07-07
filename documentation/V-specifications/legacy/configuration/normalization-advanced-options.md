> ⚠️ **Déprécié :** Le contenu a été migré vers les fichiers de référence canoniques.

# Options avancées de normalisation

## Vue d'ensemble

Ce module définit les options avancées de normalisation qui améliorent la cohérence, la stabilité, la compatibilité inter-formats et la sécurité liées aux caractères et à l'encodage.

**Principe fondamental** : Aucune option activée par défaut ne doit altérer le sens du texte.

## Structure de configuration

### UnicodeManagement (Gestion avancée Unicode)

Gère la prise en charge Unicode et la normalisation des caractères.

- **`mode`** (`'full'|'restricted'|'disabled'`)
  - **`'full'`** : Prise en charge complète de tous les caractères Unicode valides (recommandé)
  - **`'restricted'`** : Limité aux plages Unicode spécifiées
  - **`'disabled'`** : Désactive la prise en charge Unicode avancée
  - Valeur par défaut : `'full'`
  - **Impact** : Détermine quels caractères Unicode sont acceptés. Le mode `'full'` est recommandé pour une compatibilité maximale.

- **`normalization`** (`'none'|'NFC'|'NFKC'`)
  - **`'none'`** : Aucune normalisation
  - **`'NFC'`** : Forme composée canonique (recommandée, ne modifie pas le sens)
  - **`'NFKC'`** : Forme composée de compatibilité (plus agressive, peut modifier certains caractères)
  - Valeur par défaut : `'NFC'`
  - **Impact** : La normalisation NFC garantit une représentation cohérente des caractères (par ex., é peut être représenté comme un seul caractère ou e+accent). NFC est non destructif, NFKC peut modifier certains caractères.

- **`detectConfusables`** (`boolean`)
  - Détecte les caractères visuellement confusables (par ex., cyrillique vs latin)
  - Valeur par défaut : `true`
  - **Impact** : Détecte les caractères pouvant être confondus visuellement, utile pour la sécurité (détection d'attaques par homoglyphes).

- **`confusablesAction`** (`'none'|'warn'|'replace'`)
  - **`'none'`** : Ne rien faire
  - **`'warn'`** : Avertir uniquement (non destructif, recommandé)
  - **`'replace'`** : Remplacer par un caractère équivalent
  - Valeur par défaut : `'warn'`
  - **Impact** : Détermine l'action sur les caractères confusables détectés. `'warn'` est non destructif et permet la traçabilité.

### CharacterCleaning (Nettoyage des caractères)

Supprime ou normalise les caractères potentiellement problématiques.

- **`removeControlChars`** (`boolean`)
  - Supprime les caractères de contrôle invisibles (0x00-0x1F, sauf \t, \n, \r)
  - Valeur par défaut : `false` (désactivé pour éviter d'être destructif)
  - **Impact** : Peut corriger des fichiers corrompus, mais peut aussi supprimer des caractères légitimes. Désactivé par défaut.

- **`removeDirectionalChars`** (`boolean`)
  - Supprime les caractères directionnels (marques RTL/LTR)
  - Valeur par défaut : `false` (désactivé pour préserver l'affichage)
  - **Impact** : Évite les problèmes d'affichage dans certains outils, mais peut altérer l'affichage du texte bidirectionnel. Désactivé par défaut.

- **`removeNonPrintableChars`** (`boolean`)
  - Supprime les caractères non imprimables
  - Valeur par défaut : `false` (désactivé pour éviter d'être destructif)
  - **Impact** : Nettoie le contenu, mais peut supprimer des caractères légitimes. Désactivé par défaut.

- **`preserveWhitespace`** (`boolean`)
  - Préserve les espaces essentiels (tabulations, sauts de ligne)
  - Valeur par défaut : `true`
  - **Impact** : Garantit que la structure du document (indentation, sauts de ligne) est préservée.

### TransliterationAndFallback (Translittération et repli)

Gère la conversion des caractères Unicode en équivalents ASCII.

- **`strategy`** (`'none'|'simple'|'configurable'`)
  - **`'none'`** : Aucune translittération (recommandé par défaut)
  - **`'simple'`** : Translittération simple (é → e)
  - **`'configurable'`** : Stratégie avancée configurable
  - Valeur par défaut : `'none'`
  - **Impact** : La translittération peut altérer le sens (é → e perd l'accent). Désactivée par défaut pour préserver le sens.

- **`enableTransliteration`** (`boolean`)
  - Active la translittération simple (é → e, ñ → n, etc.)
  - Valeur par défaut : `false`
  - **Impact** : Peut altérer le sens du texte. Désactivée par défaut.

- **`unicodeToAscii`** (`UnicodeToAsciiFallback`)
  - Stratégie de repli Unicode → ASCII
  - Valeur par défaut : `{ enabled: false, method: 'transliterate', replacementChar: '?' }`
  - **Impact** : Permet de convertir les caractères Unicode en ASCII, mais peut être destructif. Désactivé par défaut.

  - **`enabled`** (`boolean`) : Active le repli Unicode → ASCII
  - **`method`** (`'remove'|'replace'|'transliterate'`) : Méthode de conversion
  - **`replacementChar`** (`string`) : Caractère de remplacement si `method='replace'`

### ContentValidation (Validation du contenu)

Valide la conformité Unicode du contenu.

- **`rejectInvalidSequences`** (`boolean`)
  - Rejette les séquences Unicode invalides
  - Valeur par défaut : `true`
  - **Impact** : Important pour la sécurité et la stabilité. Activé par défaut.

- **`rejectPrivateChars`** (`boolean`)
  - Rejette les caractères privés (Private Use Area, 0xE000-0xF8FF)
  - Valeur par défaut : `false` (peut être légitime dans certains contextes)
  - **Impact** : Les caractères privés peuvent être utilisés dans des contextes spécifiques. Désactivé par défaut.

- **`warnOutOfRange`** (`boolean`)
  - Signale les caractères hors de la plage autorisée
  - Valeur par défaut : `true`
  - **Impact** : Permet la traçabilité des problèmes sans interrompre le traitement.

- **`allowedRanges`** (`Array<{start: number, end: number}>`)
  - Plages Unicode autorisées (vide = toutes sauf Private Use Area)
  - Valeur par défaut : `[]`
  - **Impact** : Permet de restreindre les caractères acceptés si nécessaire.

### ProcessingMode (Mode de traitement)

Définit le comportement global en cas d'erreur ou d'anomalie.

- **`mode`** (`'strict'|'tolerant'`)
  - **`'strict'`** : Erreur immédiate sur tout problème
  - **`'tolerant'`** : Nettoyage automatique + avertissements
  - Valeur par défaut : `'tolerant'`

- **`throwOnError`** (`boolean`)
  - Lance une erreur immédiate au lieu de continuer
  - Valeur par défaut : `false`

- **`logWarnings`** (`boolean`)
  - Journalise les avertissements pour analyse ultérieure
  - Valeur par défaut : `true`

- **`continueOnWarning`** (`boolean`)
  - Continue le traitement malgré les avertissements
  - Valeur par défaut : `true`

**Impact** : Détermine si le traitement continue en cas de problème ou s'arrête immédiatement. Le mode tolérant est recommandé pour la production.

## Préréglages disponibles

### DefaultAdvancedNormalizationOptions (Recommandé pour la production)

- Mode Unicode complet
- Normalisation NFC (non destructive)
- Détection des confusables avec avertissements uniquement
- Nettoyage désactivé par défaut (non destructif)
- Translittération désactivée (préserve le sens)
- Validation active (sécurité)
- Mode tolérant avec journalisation

**Usage** : Cas d'usage généraux, conversion standard de documents. Garantit la cohérence sans altérer le sens.

### StrictAdvancedNormalizationOptions (Environnements critiques)

- Mode Unicode complet
- Normalisation NFC
- Détection des confusables avec avertissements
- Nettoyage strict activé
- Translittération désactivée
- Validation stricte (rejette les caractères privés)
- Mode strict avec erreurs immédiates

**Usage** : Validation stricte requise, environnements critiques où les erreurs doivent être immédiatement visibles.

### PermissiveAdvancedNormalizationOptions (Documents hérités)

- Mode Unicode complet
- Normalisation NFKC (plus agressive)
- Détection des confusables désactivée
- Nettoyage activé (sauf caractères directionnels)
- Translittération activée
- Validation permissive
- Mode tolérant sans avertissements

**Usage** : Conversion de documents avec encodages mixtes ou inconnus, récupération maximale du contenu même si corrompu.

## Référence des plages Unicode

Le module expose `UnicodeRanges` avec les plages couramment utilisées :

- `BASIC_LATIN` : ASCII (0x0000-0x007F)
- `LATIN_1_SUPPLEMENT` : Latin-1 (0x0080-0x00FF)
- `LATIN_EXTENDED_A/B` : Extensions latines
- `GENERAL_PUNCTUATION` : Ponctuation générale
- `PRIVATE_USE_AREA` : Zone d'usage privé (à rejeter par défaut)
- `CONTROL_CHARS` : Caractères de contrôle
- `DIRECTIONAL_CHARS` : Caractères directionnels (RTL/LTR)
- `ZERO_WIDTH_CHARS` : Caractères de largeur nulle

## Exemple d'utilisation

```javascript
const { 
  mergeAdvancedNormalizationOptions, 
  validateAdvancedNormalizationOptions,
  checkOptionsSafety 
} = require('./normalization-advanced-options');

// User options (partial)
const userOptions = {
  unicode: {
    normalization: 'NFC', // Force NFC
  },
  characterCleaning: {
    removeControlChars: true, // Enable cleaning
  },
  processingMode: {
    mode: 'strict', // Strict mode
  },
};

// Merge with default values
const options = mergeAdvancedNormalizationOptions(userOptions);

// Validate
const validation = validateAdvancedNormalizationOptions(options);
if (!validation.valid) {
  console.error('Invalid options:', validation.errors);
  return;
}

// Check safety (non-destructiveness)
const safety = checkOptionsSafety(options);
if (!safety.safe) {
  console.warn('Security warnings:', safety.warnings);
}

// Use options in processing
// ...
```

## Recommandations pour la production

1. **Normalisation Unicode** : Utiliser `'NFC'` avec `preserveMeaning=true` pour garantir la cohérence sans altérer le sens.

2. **Nettoyage** : Désactiver par défaut (`removeControlChars: false`, etc.) sauf si nécessaire. Activer uniquement si vous êtes certain que cela ne supprimera pas de contenu légitime.

3. **Translittération** : Désactiver par défaut (`strategy: 'none'`) pour préserver le sens. Activer uniquement si une conversion ASCII est explicitement requise.

4. **Validation** : Activer `rejectInvalidSequences: true` pour la sécurité. `rejectPrivateChars` peut être activé en mode strict.

5. **Mode de traitement** : Utiliser `'tolerant'` avec `logWarnings: true` pour la production, `'strict'` pour la validation.

6. **Confusables** : Activer `detectConfusables: true` avec `confusablesAction: 'warn'` pour la sécurité sans modification.

## Garanties de non-destructivité

Les options par défaut garantissent que :

- ✅ La normalisation NFC ne modifie pas le sens (uniquement la représentation)
- ✅ Le nettoyage est désactivé par défaut
- ✅ La translittération est désactivée par défaut
- ✅ Les avertissements sont utilisés plutôt que des modifications automatiques
- ✅ La validation rejette uniquement les séquences invalides (sécurité)

**Important** : L'activation du nettoyage ou de la translittération peut altérer le sens. Toujours vérifier avec `checkOptionsSafety()` avant d'activer ces options.

## Notes de sécurité

- Les caractères de largeur nulle peuvent être utilisés pour des attaques par injection. Le nettoyage est recommandé si vous traitez du contenu non fiable.
- Les caractères confusables (homoglyphes) peuvent être utilisés pour des attaques de phishing. La détection avec avertissements est recommandée.
- Les séquences Unicode invalides peuvent corrompre l'affichage ou être interprétées comme des commandes. La validation est essentielle.

## Intégration avec conversion-options.js

Ces options peuvent être intégrées dans la section `normalization` de `conversion-options.js` :

```javascript
const { getAdvancedNormalizationPreset } = require('./normalization-advanced-options');

const ConversionOptions = {
  normalization: {
    encoding: 'utf-8',
    lineBreaks: { /* ... */ },
    // Additional options
    advanced: getAdvancedNormalizationPreset('default'),
  },
  // ...
};
```
