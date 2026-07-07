> ⚠️ **Déprécié :** Le contenu a été migré vers les fichiers de référence canoniques.

# Configuration des options d'encodage

## Vue d'ensemble

Ce module définit la structure de configuration pour la gestion de l'encodage des caractères lors de la conversion de documents. Il suit une approche API-first avec des valeurs par défaut sûres et une séparation claire entre l'encodage d'entrée, le traitement interne et l'encodage de sortie.

## Structure de configuration

### InputEncodingOptions (Encodage d'entrée)

Gère la détection et le traitement de l'encodage du fichier source.

- **`encoding`** (`'auto'|'utf-8'|'ascii'|'latin-1'`)
  - Encodage à utiliser pour la lecture du fichier d'entrée
  - `'auto'` : Détection automatique avec priorité UTF-8
  - Valeur par défaut : `'auto'`

- **`autoDetect`** (`boolean`)
  - Active la détection automatique de l'encodage
  - Si `true` et `encoding='auto'`, tente de détecter l'encodage
  - Valeur par défaut : `true`

- **`fallbackToLatin1`** (`boolean`)
  - Utilise Latin-1 comme repli si UTF-8 échoue (uniquement si `autoDetect=true`)
  - **Avertissement** : Peut masquer des erreurs d'encodage
  - Valeur par défaut : `false` (recommandé pour la production)

**Impact** : Détermine comment les caractères sont interprétés lors de la lecture du fichier source. Une mauvaise détection peut corrompre le contenu.

### OutputEncodingOptions (Encodage de sortie)

Gère l'encodage du fichier de sortie.

- **`encoding`** (`'utf-8'|'ascii'|'latin-1'`)
  - Encodage à utiliser pour l'écriture du fichier de sortie
  - Valeur par défaut : `'utf-8'` (norme moderne recommandée)

- **`addBOM`** (`boolean`)
  - Ajoute un BOM (Byte Order Mark) au début du fichier UTF-8
  - Utile pour certains outils Windows, mais généralement inutile
  - Valeur par défaut : `false`

**Impact** : Détermine comment les caractères sont encodés dans le fichier de sortie. UTF-8 est recommandé pour une compatibilité maximale.

### InvalidCharacterHandling (Gestion des caractères invalides)

Gère les caractères qui ne peuvent pas être représentés dans l'encodage cible.

- **`strategy`** (`'fail'|'replace'|'remove'|'transliterate'`)
  - **`'fail'`** : Échec immédiat avec erreur explicite (mode strict)
  - **`'replace'`** : Remplacement par un caractère de substitution (recommandé)
  - **`'remove'`** : Suppression silencieuse (peut altérer le sens)
  - **`'transliterate'`** : Translittération simple (é → e, etc.)
  - Valeur par défaut : `'replace'`

- **`replacementChar`** (`string`)
  - Caractère utilisé pour remplacer les caractères invalides (si `strategy='replace'`)
  - Valeur par défaut : `'\uFFFD'` (caractère de substitution Unicode standard)

- **`logInvalidChars`** (`boolean`)
  - Journalise les caractères invalides détectés pour analyse
  - Important pour le débogage en production
  - Valeur par défaut : `true`

**Impact** : Détermine comment traiter les caractères qui ne peuvent pas être encodés. La stratégie `'replace'` est la plus sûre car elle préserve la structure du document.

### UnicodeNormalization (Normalisation Unicode)

Normalise les caractères Unicode pour garantir une représentation cohérente.

- **`form`** (`'none'|'NFC'|'NFKC'`)
  - **`'none'`** : Aucune normalisation
  - **`'NFC'`** : Forme composée canonique (recommandée)
  - **`'NFKC'`** : Forme composée de compatibilité (plus agressive)
  - Valeur par défaut : `'NFC'`

- **`preserveMeaning`** (`boolean`)
  - Garantit que la normalisation n'altère pas le sens du contenu
  - Active des vérifications supplémentaires
  - Valeur par défaut : `true`

**Impact** : La normalisation NFC garantit que les caractères sont représentés de manière cohérente (par ex., é peut être représenté comme un seul caractère ou e+accent). Important pour la comparaison et le traitement du texte.

### CharacterCleaning (Nettoyage des caractères invisibles)

Supprime ou normalise les caractères potentiellement problématiques.

- **`removeControlChars`** (`boolean`)
  - Supprime les caractères de contrôle (0x00-0x1F, sauf \t, \n, \r)
  - Peut corriger des fichiers corrompus
  - Valeur par défaut : `true`

- **`removeDirectionalChars`** (`boolean`)
  - Supprime les caractères directionnels (RTL/LTR)
  - Évite les problèmes d'affichage dans certains outils
  - Valeur par défaut : `true`

- **`removeZeroWidthChars`** (`boolean`)
  - Supprime les caractères de largeur nulle (invisibles)
  - Peut masquer des problèmes de sécurité (injection invisible)
  - Valeur par défaut : `true`

- **`normalizeWhitespace`** (`boolean`)
  - Normalise les espaces multiples en un seul espace
  - Peut altérer la mise en forme intentionnelle
  - Valeur par défaut : `false` (recommandé)

**Impact** : Nettoie le contenu des caractères potentiellement problématiques. Important pour la sécurité et la compatibilité.

### ProcessingMode (Mode de traitement)

Définit le comportement global en cas d'erreur ou d'anomalie.

- **`mode`** (`'strict'|'tolerant'`)
  - **`'strict'`** : Erreur immédiate sur tout problème
  - **`'tolerant'`** : Nettoyage automatique + avertissements
  - Valeur par défaut : `'tolerant'`

- **`throwOnError`** (`boolean`)
  - Lance une erreur immédiate au lieu de continuer
  - Utilisé en mode strict
  - Valeur par défaut : `false`

- **`logWarnings`** (`boolean`)
  - Journalise les avertissements pour analyse ultérieure
  - Important pour le débogage en production
  - Valeur par défaut : `true`

**Impact** : Détermine si le traitement continue en cas de problème ou s'arrête immédiatement. Le mode tolérant est recommandé pour la production.

## Préréglages disponibles

### DefaultEncodingOptions (Recommandé pour la production)

- Encodage auto-détecté (priorité UTF-8)
- Gestion des caractères invalides par remplacement
- Normalisation NFC
- Nettoyage des caractères problématiques
- Mode tolérant avec journalisation

**Usage** : Cas d'usage généraux, conversion standard de documents.

### StrictEncodingOptions (Environnements critiques)

- UTF-8 explicite (pas d'auto-détection)
- Échec immédiat sur les caractères invalides
- Normalisation NFC
- Nettoyage strict
- Mode strict avec erreurs immédiates

**Usage** : Validation stricte requise, environnements critiques où les erreurs doivent être immédiatement visibles.

### PermissiveEncodingOptions (Documents hérités)

- Auto-détection avec repli Latin-1
- Translittération des caractères invalides
- Normalisation NFKC (plus agressive)
- Nettoyage minimal
- Mode tolérant sans avertissements

**Usage** : Conversion de documents avec encodages mixtes ou inconnus, récupération maximale du contenu même si corrompu.

## Exemple d'utilisation

```javascript
const { mergeEncodingOptions, validateEncodingOptions } = require('./encoding-options');

// User options (partial)
const userOptions = {
  input: {
    encoding: 'utf-8', // Force UTF-8
  },
  invalidCharacters: {
    strategy: 'fail', // Fail on invalid characters
  },
  processingMode: {
    mode: 'strict', // Strict mode
  },
};

// Merge with default values
const options = mergeEncodingOptions(userOptions);

// Validate
const validation = validateEncodingOptions(options);
if (!validation.valid) {
  console.error('Invalid options:', validation.errors);
  return;
}

// Use options in processing
// ...
```

## Recommandations pour la production

1. **Encodage d'entrée** : Utiliser `'auto'` avec `autoDetect=true` pour la flexibilité, ou `'utf-8'` explicite pour la sécurité.

2. **Encodage de sortie** : Toujours utiliser `'utf-8'` sauf contrainte spécifique.

3. **Caractères invalides** : Utiliser `'replace'` avec `logInvalidChars=true` pour la traçabilité.

4. **Normalisation** : Utiliser `'NFC'` avec `preserveMeaning=true` pour garantir la cohérence sans altérer le sens.

5. **Nettoyage** : Activer le nettoyage des caractères de contrôle et directionnels pour la sécurité.

6. **Mode de traitement** : Utiliser `'tolerant'` avec `logWarnings=true` pour la production, `'strict'` pour la validation.

## Notes de sécurité

- Les caractères de largeur nulle peuvent être utilisés pour des attaques par injection. Le nettoyage est recommandé.
- Les caractères de contrôle peuvent corrompre l'affichage ou être interprétés comme des commandes.
- La normalisation peut masquer certaines différences entre des caractères similaires. Utiliser `preserveMeaning=true`.

## Compatibilité

- UTF-8 est la norme moderne et est recommandé pour tous les nouveaux projets.
- ASCII est compatible mais limité (caractères 0-127 uniquement).
- Latin-1 (ISO-8859-1) est un encodage hérité, à utiliser uniquement si nécessaire.
