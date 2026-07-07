# Moteur de conversion sécurisé

## Vue d'ensemble

Le module `secure-converter.js` implémente une couche de sécurité complète pour les conversions de fichiers via des outils externes tels que Pandoc. Il garantit l'isolation, la validation et l'exécution sécurisée des conversions.

## Fonctionnalités de sécurité

### 1. Isolation stricte par conversion

- Chaque conversion crée un répertoire temporaire unique (UUID)
- Aucun fichier n'est partagé entre deux conversions
- Nettoyage garanti même en cas d'erreur (try/finally)
- Répertoire racine configurable : `/tmp/ascend-conversions/`

### 2. Exécution sécurisée des commandes

- Utilise uniquement `child_process.spawn` (jamais `exec` ou `execSync`)
- Chemin absolu vers le binaire Pandoc
- Arguments construits à partir d'une liste blanche stricte
- Aucun argument utilisateur utilisé directement
- Toute conversion non listée dans la liste blanche est refusée

### 3. Délai d'expiration et arrêt forcé

- Délai d'expiration configurable (par défaut : 30 secondes)
- Arrêt automatique si le délai est dépassé
- SIGTERM puis SIGKILL si nécessaire
- Garantit qu'aucun processus ne reste actif

### 4. Validation des fichiers

- Vérification de la taille maximale (50 Mo par défaut)
- Détection des fichiers binaires déguisés
- Validation des formats source et destination
- Rejet des fichiers vides ou invalides

### 5. Gestion normalisée des erreurs

- Erreurs typées avec codes standardisés
- Aucun détail système exposé à l'utilisateur
- Journalisation sécurisée (sans données utilisateur)
- Identifiant unique par conversion pour le suivi

## Utilisation

### Exemple de base

**IMPORTANT** : Le paramètre `confirmed: true` est **OBLIGATOIRE** pour toutes les conversions. Cela garantit qu'une fenêtre de confirmation a été validée sur le frontend avant l'exécution.

```javascript
const { secureConvert } = require('./secure-converter.js')

try {
  const result = await secureConvert(
    '# Markdown content',
    'markdown',
    'asciidoc',
    { 
      timeout: 30000,
      confirmed: true // ✅ OBLIGATOIRE - doit être true
    }
  )
  console.log(result)
} catch (error) {
  if (error instanceof ConversionError) {
    console.error('Error:', error.toSafeResponse())
  }
}
```

### Validation de la confirmation

Le secure-converter vérifie que `options.confirmed === true` avant d'exécuter toute conversion. Si la confirmation est absente ou vaut `false`, une erreur `CONFIRMATION_REQUIRED` est levée.

```javascript
// ❌ SANS confirmation - sera rejeté
await secureConvert(content, 'markdown', 'asciidoc', {})
// Error: CONFIRMATION_REQUIRED

// ✅ AVEC confirmation - sera accepté
await secureConvert(content, 'markdown', 'asciidoc', { confirmed: true })
```

### Intégration Express

Voir `secure-converter-integration-example.js` pour un exemple d'intégration complet dans une API Express.

## Configuration

### Variables d'environnement

- `PANDOC_PATH` : Chemin absolu vers le binaire Pandoc (par défaut : `/usr/bin/pandoc`)

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

## Formats pris en charge

Les conversions autorisées sont définies dans `CONVERSION_WHITELIST`. Formats actuellement pris en charge :

- **Source** : markdown, asciidoc, html, txt, yaml, json
- **Destination** : markdown, asciidoc, html, pdf, txt, yaml, json

Pour ajouter une nouvelle conversion, ajouter une entrée dans `CONVERSION_WHITELIST` :

```javascript
'new_format_other_format': ['-f', 'new_format', '-t', 'other_format']
```

## Architecture

Le module est structuré en classes distinctes :

- **IsolationManager** : Gestion de l'isolation (répertoires temporaires)
- **FileValidator** : Validation des fichiers et des conversions
- **SecureCommandExecutor** : Exécution sécurisée des commandes
- **ConversionError** : Gestion normalisée des erreurs

Cette architecture permet :
- L'ajout facile de limites de ressources
- L'intégration d'un sandbox (ex. Docker, chroot)
- Le suivi des conversions
- Sans refactorisation majeure

## Journalisation

Les événements sont journalisés avec :
- Horodatage ISO
- Identifiant unique de conversion
- Type d'événement (STARTED, SUCCESS, TIMEOUT, etc.)
- Détails (sans données utilisateur)

Exemple de journal :
```
[CONVERSION] {"timestamp":"2024-01-15T10:30:00.000Z","conversionId":"abc-123","event":"SUCCESS","details":"Conversion completed successfully"}
```

## Sécurité

### Mesures implémentées

✅ Isolation complète par conversion  
✅ Liste blanche stricte des conversions  
✅ Validation des fichiers d'entrée  
✅ **Validation de la confirmation utilisateur (OBLIGATOIRE)**  
✅ Délai d'expiration et arrêt forcé des processus  
✅ Aucun argument utilisateur dans les commandes  
✅ Chemins absolus uniquement  
✅ Nettoyage garanti des fichiers temporaires  
✅ Journalisation sans données utilisateur  
✅ Erreurs normalisées sans détails système

### Validation de la confirmation

Le secure-converter exige que la confirmation utilisateur soit validée avant toute conversion. Cela garantit que :
- L'utilisateur a cliqué sur « Oui » dans une fenêtre de confirmation
- Aucune conversion ne peut être exécutée automatiquement ou par erreur
- La confirmation est vérifiée à la fois sur le frontend et le backend

Voir `secure-converter-frontend-integration.md` pour l'intégration frontend complète.

### Recommandations pour la production

1. **Limites de ressources** : Ajouter des limites CPU/RAM via cgroups ou conteneurs
2. **Sandboxing** : Exécuter Pandoc dans un conteneur Docker ou un chroot
3. **Surveillance** : Suivre les conversions (durée, échecs, délais d'expiration)
4. **Limitation du débit** : Limiter le nombre de conversions par utilisateur/IP
5. **Audit** : Journaliser toutes les tentatives de conversion (y compris les échecs)

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

// Après
const result = await secureConvert(content, 'markdown', 'asciidoc')
```

3. Adapter la gestion des erreurs :
```javascript
try {
  const result = await secureConvert(...)
} catch (error) {
  if (error instanceof ConversionError) {
    // Gérer l'erreur normalisée
    res.status(400).json(error.toSafeResponse())
  }
}
```

## Tests

Pour tester le module :

```javascript
const { secureConvert } = require('./secure-converter.js')

// Test de conversion valide
const result = await secureConvert('# Test', 'markdown', 'asciidoc')
console.log('Result:', result)

// Test de validation (doit échouer)
try {
  await secureConvert('', 'markdown', 'asciidoc')
} catch (error) {
  console.log('Expected error:', error.message)
}

// Test de délai d'expiration (doit échouer après 1 seconde)
try {
  await secureConvert('# Very long test...', 'markdown', 'asciidoc', { timeout: 1000 })
} catch (error) {
  console.log('Expected timeout:', error.message)
}
```

## Support

Pour toute question ou problème de sécurité, consulter la documentation ou ouvrir une issue.
