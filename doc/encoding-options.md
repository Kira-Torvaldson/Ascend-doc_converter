# Configuration des Options d'Encodage

## Vue d'ensemble

Ce module définit la structure de configuration pour la gestion de l'encodage des caractères lors de la conversion de documents. Il suit une approche API-first avec des valeurs par défaut sûres et une séparation claire entre encodage d'entrée, traitement interne et encodage de sortie.

## Structure de Configuration

### InputEncodingOptions (Encodage d'entrée)

Gère la détection et le traitement de l'encodage des fichiers sources.

- **`encoding`** (`'auto'|'utf-8'|'ascii'|'latin-1'`)
  - Encodage à utiliser pour lire le fichier d'entrée
  - `'auto'` : Détection automatique avec priorité UTF-8
  - Valeur par défaut : `'auto'`

- **`autoDetect`** (`boolean`)
  - Active la détection automatique de l'encodage
  - Si `true` et `encoding='auto'`, tente de détecter l'encodage
  - Valeur par défaut : `true`

- **`fallbackToLatin1`** (`boolean`)
  - Utilise Latin-1 comme fallback si UTF-8 échoue (uniquement si `autoDetect=true`)
  - **Attention** : Peut masquer des erreurs d'encodage
  - Valeur par défaut : `false` (recommandé pour la production)

**Impact** : Détermine comment les caractères sont interprétés lors de la lecture du fichier source. Une mauvaise détection peut corrompre le contenu.

### OutputEncodingOptions (Encodage de sortie)

Gère l'encodage du fichier de sortie.

- **`encoding`** (`'utf-8'|'ascii'|'latin-1'`)
  - Encodage à utiliser pour écrire le fichier de sortie
  - Valeur par défaut : `'utf-8'` (standard moderne recommandé)

- **`addBOM`** (`boolean`)
  - Ajoute un BOM (Byte Order Mark) au début du fichier UTF-8
  - Utile pour certains outils Windows, mais généralement non nécessaire
  - Valeur par défaut : `false`

**Impact** : Détermine comment les caractères sont encodés dans le fichier de sortie. UTF-8 est recommandé pour la compatibilité maximale.

### InvalidCharacterHandling (Gestion des caractères invalides)

Gère les caractères qui ne peuvent pas être représentés dans l'encodage cible.

- **`strategy`** (`'fail'|'replace'|'remove'|'transliterate'`)
  - **`'fail'`** : Échoue immédiatement avec une erreur explicite (mode strict)
  - **`'replace'`** : Remplace par un caractère de substitution (recommandé)
  - **`'remove'`** : Supprime silencieusement (peut altérer le sens)
  - **`'transliterate'`** : Translittération simple (é → e, etc.)
  - Valeur par défaut : `'replace'`

- **`replacementChar`** (`string`)
  - Caractère utilisé pour remplacer les caractères invalides (si `strategy='replace'`)
  - Valeur par défaut : `'\uFFFD'` (caractère de substitution Unicode standard :)

- **`logInvalidChars`** (`boolean`)
  - Log les caractères invalides détectés pour analyse
  - Important pour le débogage en production
  - Valeur par défaut : `true`

**Impact** : Détermine comment gérer les caractères qui ne peuvent pas être encodés. La stratégie `'replace'` est la plus sûre car elle préserve la structure du document.

### UnicodeNormalization (Normalisation Unicode)

Normalise les caractères Unicode pour garantir une représentation cohérente.

- **`form`** (`'none'|'NFC'|'NFKC'`)
  - **`'none'`** : Aucune normalisation
  - **`'NFC'`** : Forme Canonique Composée (recommandé)
  - **`'NFKC'`** : Forme Canonique Composée de Compatibilité (plus agressive)
  - Valeur par défaut : `'NFC'`

- **`preserveMeaning`** (`boolean`)
  - Garantit que la normalisation n'altère pas le sens du contenu
  - Active des vérifications supplémentaires
  - Valeur par défaut : `true`

**Impact** : La normalisation NFC garantit que les caractères sont représentés de manière cohérente (ex: é peut être représenté comme un seul caractère ou e+accent). Important pour la comparaison et le traitement de texte.

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
  - Supprime les caractères de largeur zéro (invisibles)
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
  - **`'tolerant'`** : Nettoyage automatique + warnings
  - Valeur par défaut : `'tolerant'`

- **`throwOnError`** (`boolean`)
  - Lance une erreur immédiate au lieu de continuer
  - Utilisé en mode strict
  - Valeur par défaut : `false`

- **`logWarnings`** (`boolean`)
  - Log les avertissements pour analyse ultérieure
  - Important pour le débogage en production
  - Valeur par défaut : `true`

**Impact** : Détermine si le traitement continue en cas de problème ou s'arrête immédiatement. Le mode tolérant est recommandé pour la production.

## Presets Disponibles

### DefaultEncodingOptions (Recommandé pour la production)

- Encodage auto-détecté (priorité UTF-8)
- Gestion des caractères invalides par remplacement
- Normalisation NFC
- Nettoyage des caractères problématiques
- Mode tolérant avec logging

**Utilisation** : Cas d'usage général, conversion de documents standards.

### StrictEncodingOptions (Environnements critiques)

- UTF-8 explicite (pas d'auto-détection)
- Échec immédiat sur caractères invalides
- Normalisation NFC
- Nettoyage strict
- Mode strict avec erreurs immédiates

**Utilisation** : Validation stricte requise, environnements critiques où les erreurs doivent être immédiatement visibles.

### PermissiveEncodingOptions (Documents hérités)

- Auto-détection avec fallback Latin-1
- Translittération des caractères invalides
- Normalisation NFKC (plus agressive)
- Nettoyage minimal
- Mode tolérant sans warnings

**Utilisation** : Conversion de documents avec encodages mixtes ou inconnus, récupération maximale de contenu même si corrompu.

## Exemple d'Utilisation

```javascript
const { mergeEncodingOptions, validateEncodingOptions } = require('./encoding-options');

// Options utilisateur (partielles)
const userOptions = {
  input: {
    encoding: 'utf-8', // Forcer UTF-8
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

// Valider
const validation = validateEncodingOptions(options);
if (!validation.valid) {
  console.error('Options invalides:', validation.errors);
  return;
}

// Utiliser les options dans le traitement
// ...
```

## Recommandations pour la Production

1. **Encodage d'entrée** : Utiliser `'auto'` avec `autoDetect=true` pour la flexibilité, ou `'utf-8'` explicite pour la sécurité.

2. **Encodage de sortie** : Toujours utiliser `'utf-8'` sauf contrainte spécifique.

3. **Caractères invalides** : Utiliser `'replace'` avec `logInvalidChars=true` pour la traçabilité.

4. **Normalisation** : Utiliser `'NFC'` avec `preserveMeaning=true` pour garantir la cohérence sans altérer le sens.

5. **Nettoyage** : Activer le nettoyage des caractères de contrôle et directionnels pour la sécurité.

6. **Mode de traitement** : Utiliser `'tolerant'` avec `logWarnings=true` pour la production, `'strict'` pour la validation.

## Notes de Sécurité

- Les caractères de largeur zéro peuvent être utilisés pour des attaques d'injection. Le nettoyage est recommandé.
- Les caractères de contrôle peuvent corrompre l'affichage ou être interprétés comme des commandes.
- La normalisation peut masquer certaines différences entre caractères similaires. Utiliser `preserveMeaning=true`.

## Compatibilité

- UTF-8 est le standard moderne et est recommandé pour tous les nouveaux projets.
- ASCII est compatible mais limité (caractères 0-127 uniquement).
- Latin-1 (ISO-8859-1) est un encodage hérité, utiliser uniquement si nécessaire.
