# Moteur de Conversion Sécurisé

## Vue d'ensemble

Le module `secure-converter.js` implémente une couche de sécurité complète pour les conversions de fichiers utilisant des outils externes comme Pandoc. Il garantit l'isolation, la validation et l'exécution sécurisée des conversions.

## Caractéristiques de sécurité

### 1. Isolation stricte par conversion

- Chaque conversion crée un dossier temporaire unique (UUID)
- Aucun fichier n'est partagé entre deux conversions
- Nettoyage garanti même en cas d'erreur (try/finally)
- Dossier racine configurable : `/tmp/ascend-conversions/`

### 2. Exécution sécurisée des commandes

- Utilise uniquement `child_process.spawn` (jamais `exec` ou `execSync`)
- Chemin absolu vers le binaire Pandoc
- Arguments construits depuis une whitelist stricte
- Aucun argument utilisateur utilisé directement
- Toute conversion non listée dans la whitelist est refusée

### 3. Timeout et arrêt forcé

- Timeout configurable (défaut: 30 secondes)
- Arrêt automatique si timeout dépassé
- SIGTERM puis SIGKILL si nécessaire
- Garantit qu'aucun processus ne reste actif

### 4. Validation des fichiers

- Vérification de la taille maximale (50 Mo par défaut)
- Détection des fichiers binaires déguisés
- Validation des formats source et destination
- Refus des fichiers vides ou invalides

### 5. Gestion d'erreurs normalisée

- Erreurs typées avec codes normalisés
- Aucun détail système exposé à l'utilisateur
- Journalisation sécurisée (sans données utilisateur)
- ID unique par conversion pour le suivi

## Utilisation

### Exemple basique

**IMPORTANT** : Le paramètre `confirmed: true` est **OBLIGATOIRE** pour toutes les conversions. Cela garantit qu'une fenêtre de confirmation a été validée côté frontend avant l'exécution.

```javascript
const { secureConvert } = require('./secure-converter.js')

try {
  const result = await secureConvert(
    '# Markdown content',
    'markdown',
    'asciidoc',
    { 
      timeout: 30000,
      confirmed: true // ✅ MANDATORY - must be true
    }
  )
  console.log(result)
} catch (error) {
  if (error instanceof ConversionError) {
    console.error('Error:', error.toSafeResponse())
  }
}
```

### Confirmation validation

The secure-converter checks that `options.confirmed === true` before executing any conversion. If confirmation is not present or is `false`, a `CONFIRMATION_REQUIRED` error is thrown.

```javascript
// ❌ WITHOUT confirmation - will be rejected
await secureConvert(content, 'markdown', 'asciidoc', {})
// Error: CONFIRMATION_REQUIRED

// ✅ WITH confirmation - will be accepted
await secureConvert(content, 'markdown', 'asciidoc', { confirmed: true })
```

### Express integration

See `secure-converter-integration-example.js` for a complete integration example in an Express API.

## Configuration

### Variables d'environnement

- `PANDOC_PATH` : Chemin absolu vers le binaire Pandoc (défaut: `/usr/bin/pandoc`)

### Configuration dans le code

Modifier `SECURITY_CONFIG` dans `secure-converter.js` :

```javascript
const SECURITY_CONFIG = {
  CONVERSIONS_ROOT: '/custom/path/conversions',
  DEFAULT_TIMEOUT: 60000, // 60 secondes
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100 Mo
  BINARY_PATHS: {
    pandoc: '/usr/local/bin/pandoc'
  }
}
```

## Formats supportés

Les conversions autorisées sont définies dans `CONVERSION_WHITELIST`. Formats actuellement supportés :

- **Source** : markdown, asciidoc, html, txt, yaml, json
- **Destination** : markdown, asciidoc, html, pdf, txt, yaml, json

Pour ajouter une nouvelle conversion, ajouter une entrée dans `CONVERSION_WHITELIST` :

```javascript
'nouveau_format_autre_format': ['-f', 'nouveau_format', '-t', 'autre_format']
```

## Architecture

Le module est structuré en classes séparées :

- **IsolationManager** : Gestion de l'isolation (dossiers temporaires)
- **FileValidator** : Validation des fichiers et conversions
- **SecureCommandExecutor** : Exécution sécurisée des commandes
- **ConversionError** : Gestion d'erreurs normalisée

Cette architecture permet :
- D'ajouter facilement des limites de ressources
- D'intégrer une sandbox (ex: Docker, chroot)
- De surveiller les conversions
- Sans refactorisation majeure

## Journalisation

Les événements sont journalisés avec :
- Timestamp ISO
- ID unique de conversion
- Type d'événement (STARTED, SUCCESS, TIMEOUT, etc.)
- Détails (sans données utilisateur)

Exemple de log :
```
[CONVERSION] {"timestamp":"2024-01-15T10:30:00.000Z","conversionId":"abc-123","event":"SUCCESS","details":"Conversion completed successfully"}
```

## Sécurité

### Mesures implémentées

✅ Isolation complète par conversion  
✅ Whitelist stricte des conversions  
✅ Validation des fichiers d'entrée  
✅ **Validation de confirmation utilisateur (OBLIGATOIRE)**  
✅ Timeout et arrêt forcé des processus  
✅ Aucun argument utilisateur dans les commandes  
✅ Chemins absolus uniquement  
✅ Nettoyage garanti des fichiers temporaires  
✅ Journalisation sans données utilisateur  
✅ Erreurs normalisées sans détails système

### Validation de confirmation

Le secure-converter exige qu'une confirmation utilisateur soit validée avant toute conversion. Cela garantit que :
- L'utilisateur a bien cliqué sur "Oui" dans une fenêtre de confirmation
- Aucune conversion ne peut être exécutée automatiquement ou par erreur
- La confirmation est vérifiée à la fois côté frontend et backend

Voir `secure-converter-frontend-integration.md` pour l'intégration complète dans le frontend.  

### Recommandations pour la production

1. **Limites de ressources** : Ajouter des limites CPU/RAM via cgroups ou containers
2. **Sandboxing** : Exécuter Pandoc dans un container Docker ou chroot
3. **Monitoring** : Surveiller les conversions (durée, échecs, timeouts)
4. **Rate limiting** : Limiter le nombre de conversions par utilisateur/IP
5. **Audit** : Logger toutes les tentatives de conversion (même échouées)

## Migration depuis convert.js

Pour migrer progressivement :

1. Importer le nouveau module :
```javascript
const { secureConvert } = require('./secure-converter.js')
```

2. Remplacer les appels existants :
```javascript
// Avant
const result = await convertWithPandoc(content, 'markdown', 'asciidoc')

// After
const result = await secureConvert(content, 'markdown', 'asciidoc')
```

3. Adapt error handling:
```javascript
try {
  const result = await secureConvert(...)
} catch (error) {
  if (error instanceof ConversionError) {
    // Handle normalized error
    res.status(400).json(error.toSafeResponse())
  }
}
```

## Tests

To test the module:

```javascript
const { secureConvert } = require('./secure-converter.js')

// Valid conversion test
const result = await secureConvert('# Test', 'markdown', 'asciidoc')
console.log('Result:', result)

// Validation test (should fail)
try {
  await secureConvert('', 'markdown', 'asciidoc')
} catch (error) {
  console.log('Expected error:', error.message)
}

// Timeout test (should fail after 1 second)
try {
  await secureConvert('# Very long test...', 'markdown', 'asciidoc', { timeout: 1000 })
} catch (error) {
  console.log('Timeout attendu:', error.message)
}
```

## Support

Pour toute question ou problème de sécurité, consulter la documentation ou ouvrir une issue.
