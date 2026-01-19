# Module de Logs Structurés

## Description

Le module de logs structurés génère des fichiers de log JSON pour chaque conversion, permettant un suivi détaillé, un audit et un débogage facile. Les logs sont stockés dans un dossier contrôlé et accessibles via un endpoint API.

## Nom du module

**Identifiant :** `structured-logger`  
**Type :** Module de journalisation  
**Rôle :** Génération et gestion de logs structurés pour les conversions

## Objectif

Fournir un système de logs structuré, accessible et lisible pour chaque conversion, permettant :
- Suivi détaillé de l'exécution des conversions
- Audit et conformité
- Débogage facilité
- Analyse des performances
- Préparation pour intégration avec dashboards ou systèmes d'analyse

## Structure et Format JSON du Log

### Structure Complète

```json
{
  "conversionId": "uuid-unique",
  "timestamp": {
    "start": "2024-01-01T12:00:00.000Z",
    "end": "2024-01-01T12:00:05.123Z"
  },
  "formats": {
    "source": "asciidoc",
    "target": "markdown"
  },
  "status": "success",
  "execution": {
    "steps": [
      {
        "stepNumber": 1,
        "module": "downdoc",
        "fromFormat": "asciidoc",
        "toFormat": "markdown",
        "inputFile": "step0_input.adoc",
        "outputFile": "step1_output.md",
        "duration": 1.234,
        "status": "success",
        "logs": ["Log message 1", "Log message 2"],
        "error": null
      }
    ],
    "totalDuration": 5.123,
    "modulesExecuted": ["downdoc", "pandoc"]
  },
  "files": {
    "input": "input.adoc",
    "output": "final_output.md",
    "intermediate": [
      {
        "step": 1,
        "file": "step1_output.md"
      }
    ]
  },
  "logs": [
    {
      "timestamp": "2024-01-01T12:00:00.000Z",
      "level": "info",
      "message": "Main orchestrator started"
    }
  ],
  "error": null,
  "metadata": {
    "contentSize": 1024
  }
}
```

### Champs Détaillés

#### `conversionId`
- **Type :** `string`
- **Description :** Identifiant unique de la conversion (UUID)
- **Exemple :** `"550e8400-e29b-41d4-a716-446655440000"`

#### `timestamp`
- **Type :** `object`
- **Description :** Horodatage de début et de fin de conversion
- **Champs :**
  - `start`: Date de début au format ISO 8601
  - `end`: Date de fin au format ISO 8601 (null si en cours)

#### `formats`
- **Type :** `object`
- **Description :** Formats source et cible de la conversion
- **Champs :**
  - `source`: Format source (ex: "asciidoc", "markdown", "html")
  - `target`: Format cible (ex: "markdown", "asciidoc", "pdf")

#### `status`
- **Type :** `string`
- **Description :** Statut final de la conversion
- **Valeurs possibles :**
  - `"running"`: Conversion en cours
  - `"success"`: Conversion réussie
  - `"error"`: Conversion échouée

#### `execution`
- **Type :** `object`
- **Description :** Informations sur l'exécution de la conversion
- **Champs :**
  - `steps`: Tableau des étapes d'exécution (voir ci-dessous)
  - `totalDuration`: Durée totale en secondes (nombre décimal)
  - `modulesExecuted`: Liste des modules exécutés (tableau de strings)

#### `execution.steps[]`
- **Type :** `array` d'objets
- **Description :** Détails de chaque étape d'exécution
- **Champs par étape :**
  - `stepNumber`: Numéro de l'étape (entier, commence à 1)
  - `module`: Nom du module exécuté (ex: "downdoc", "pandoc")
  - `fromFormat`: Format source de l'étape
  - `toFormat`: Format cible de l'étape
  - `inputFile`: Nom du fichier d'entrée (basename uniquement)
  - `outputFile`: Nom du fichier de sortie (basename uniquement)
  - `duration`: Durée d'exécution en secondes (nombre décimal)
  - `status`: Statut de l'étape ("success", "error", "skipped")
  - `logs`: Logs détaillés de l'étape (tableau de strings)
  - `error`: Message d'erreur (null si succès)

#### `files`
- **Type :** `object`
- **Description :** Informations sur les fichiers utilisés
- **Champs :**
  - `input`: Nom du fichier d'entrée (basename uniquement)
  - `output`: Nom du fichier de sortie (basename uniquement)
  - `intermediate`: Tableau des fichiers intermédiaires

#### `files.intermediate[]`
- **Type :** `array` d'objets
- **Description :** Liste des fichiers intermédiaires créés
- **Champs :**
  - `step`: Numéro de l'étape qui a créé le fichier
  - `file`: Nom du fichier (basename uniquement)

#### `logs`
- **Type :** `array` d'objets
- **Description :** Messages de log détaillés
- **Structure d'un message :**
  - `timestamp`: Horodatage au format ISO 8601
  - `level`: Niveau de log ("info", "warn", "error", "debug")
  - `message`: Message de log
  - Autres métadonnées optionnelles

#### `error`
- **Type :** `string | null`
- **Description :** Message d'erreur si la conversion a échoué (null si succès)

#### `metadata`
- **Type :** `object`
- **Description :** Métadonnées additionnelles (sans données sensibles)
- **Champs :**
  - `contentSize`: Taille du contenu en caractères (optionnel)

## Endpoint API : `/api/logs`

### GET `/api/logs/:conversionId`

Récupère le log d'une conversion spécifique.

**Paramètres :**
- `conversionId` (requis) : Identifiant unique de la conversion

**Réponse en cas de succès (200) :**
```json
{
  "conversionId": "uuid-unique",
  "timestamp": { ... },
  "formats": { ... },
  "status": "success",
  "execution": { ... },
  "files": { ... },
  "logs": [ ... ],
  "error": null,
  "metadata": { ... }
}
```

**Réponse en cas d'erreur (404) :**
```json
{
  "error": true,
  "code": "LOG_NOT_FOUND",
  "message": "Log not found for conversion ID: uuid-unique"
}
```

**Exemple d'utilisation depuis un terminal :**
```bash
# Avec curl
curl http://localhost:3003/api/logs/550e8400-e29b-41d4-a716-446655440000

# Avec curl et jq pour formater le JSON
curl -s http://localhost:3003/api/logs/550e8400-e29b-41d4-a716-446655440000 | jq

# Sauvegarder dans un fichier
curl -s http://localhost:3003/api/logs/550e8400-e29b-41d4-a716-446655440000 > conversion.log

# Avec le script Node.js (depuis api/logs/)
cd api/logs
node list-logs.js                                    # Liste tous les logs
node list-logs.js {conversionId}                    # Affiche un log spécifique
```

### GET `/api/logs`

Liste tous les logs disponibles.

**Paramètres de requête :**
- `limit` (optionnel) : Nombre maximum de logs à retourner (défaut: 100)

**Réponse en cas de succès (200) :**
```json
{
  "success": true,
  "count": 10,
  "logs": [
    {
      "conversionId": "uuid-1",
      "filename": "uuid-1.log",
      "size": 2048,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "modifiedAt": "2024-01-01T12:05:00.000Z"
    },
    {
      "conversionId": "uuid-2",
      "filename": "uuid-2.log",
      "size": 1536,
      "createdAt": "2024-01-01T12:10:00.000Z",
      "modifiedAt": "2024-01-01T12:15:00.000Z"
    }
  ]
}
```

**Exemple d'utilisation depuis un terminal :**
```bash
# Lister tous les logs
curl http://localhost:3003/api/logs

# Lister avec limite
curl "http://localhost:3003/api/logs?limit=50"

# Formater avec jq
curl -s http://localhost:3003/api/logs | jq '.logs[] | {conversionId, status, duration: .execution.totalDuration}'
```

## Métriques et Données Collectées

### Métriques de Performance

- **Durée totale** : Temps total d'exécution de la conversion
- **Durée par étape** : Temps d'exécution de chaque module
- **Ordre d'exécution** : Séquence exacte des modules exécutés

### Métriques de Fichiers

- **Fichier d'entrée** : Nom et chemin (sanitisé) du fichier source
- **Fichier de sortie** : Nom et chemin (sanitisé) du fichier final
- **Fichiers intermédiaires** : Liste de tous les fichiers créés pendant la conversion

### Métriques d'Exécution

- **Modules exécutés** : Liste de tous les modules utilisés
- **Statut de chaque étape** : Succès ou échec de chaque étape
- **Messages de log** : Tous les messages de log avec horodatage et niveau

### Métriques de Statut

- **Statut final** : Succès ou échec de la conversion complète
- **Messages d'erreur** : Messages d'erreur détaillés en cas d'échec
- **Horodatage** : Date et heure de début et de fin

## Sécurité et Audit

### Protection des Données Sensibles

Le module applique automatiquement une sanitisation des logs pour protéger les données sensibles :

1. **Chemins de fichiers** : Seuls les noms de fichiers (basename) sont conservés, pas les chemins complets
2. **Métadonnées** : Les métadonnées sensibles (IP, User-Agent) ne sont pas enregistrées dans les logs
3. **Contenu** : Aucun contenu des fichiers source n'est enregistré dans les logs

### Contrôle d'Accès

- **Dossier contrôlé** : Les logs sont stockés dans un dossier contrôlé par le pipeline (`/logs`)
- **Permissions** : Le dossier de logs est créé avec des permissions restrictives (0o750)
- **Isolation** : Chaque conversion a son propre fichier de log, isolé des autres

### Audit et Conformité

Les logs structurés permettent :
- **Traçabilité complète** : Chaque conversion est traçable via son ID unique
- **Horodatage précis** : Tous les événements sont horodatés
- **Conformité** : Format JSON standardisé pour intégration avec systèmes d'audit
- **Rétention** : Politique de rétention configurable (30 jours par défaut)

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

## Bonnes Pratiques

### Pour le Développement

1. **Vérifier les logs régulièrement** : Utiliser l'endpoint `/api/logs` pour vérifier le bon fonctionnement
2. **Analyser les durées** : Surveiller les durées d'exécution pour détecter les problèmes de performance
3. **Suivre les erreurs** : Analyser les logs d'erreur pour identifier les problèmes récurrents

### Pour l'Audit

1. **Archiver les logs** : Les logs sont automatiquement archivés après la période de rétention
2. **Exporter les logs** : Utiliser l'endpoint API pour exporter les logs vers des systèmes d'analyse
3. **Surveiller l'espace disque** : Les logs sont limités en taille (10 MB par défaut)

### Pour le Débogage

1. **Identifier la conversion** : Utiliser le `conversionId` pour retrouver le log complet
2. **Analyser les étapes** : Examiner chaque étape pour identifier où l'erreur s'est produite
3. **Vérifier les fichiers** : Vérifier les noms de fichiers d'entrée et de sortie

## Intégration avec les Orchestrateurs

### Main Orchestrator

Le main orchestrator initialise le log au début de la conversion et le finalise à la fin :

```javascript
// Initialisation
initializeLog(conversionId, sourceFormat, targetFormat, options)

// Enregistrement des événements
addLogMessage(conversionId, 'info', 'Message')
recordInputFile(conversionId, inputFilePath)

// Finalisation
finalizeLog(conversionId, 'success', { totalDuration, stepsExecuted })
```

### Execution Orchestrator

L'execution orchestrator enregistre chaque étape d'exécution :

```javascript
// Enregistrement d'une étape
recordStep(conversionId, {
  stepNumber: 1,
  module: 'downdoc',
  fromFormat: 'asciidoc',
  toFormat: 'markdown',
  inputFile: 'input.adoc',
  outputFile: 'output.md',
  duration: 1.234,
  status: 'success',
  logs: [...],
  error: null
})

// Enregistrement du fichier de sortie
recordOutputFile(conversionId, outputFilePath)
```

## Configuration

### Variables d'Environnement

- `LOGS_DIR` : Dossier de stockage des logs (défaut: `{project_root}/logs`)
- `MAX_LOG_SIZE` : Taille maximale d'un fichier de log en octets (défaut: 10485760 = 10 MB)
- `LOG_RETENTION_DAYS` : Période de rétention en jours (défaut: 30)

### Structure du Dossier de Logs

```
logs/
├── {conversionId1}.log
├── {conversionId2}.log
├── {conversionId3}.log
└── archived/
    ├── {old_conversionId1}.log
    └── {old_conversionId2}.log
```

## Préparation pour Dashboards et Systèmes d'Analyse

### Format JSON Standardisé

Le format JSON standardisé permet une intégration facile avec :
- **Elasticsearch** : Indexation et recherche dans les logs
- **Grafana** : Visualisation des métriques de performance
- **Prometheus** : Collecte de métriques pour monitoring
- **Splunk** : Analyse et corrélation des événements

### Métriques Exportables

Les métriques suivantes peuvent être facilement extraites :
- Taux de succès/échec
- Durées moyennes d'exécution
- Modules les plus utilisés
- Formats de conversion les plus fréquents
- Taille moyenne des conversions

### Exemple d'Intégration

```javascript
// Exemple d'extraction de métriques pour dashboard
const log = readLog(conversionId);
const metrics = {
  success: log.status === 'success',
  duration: log.execution.totalDuration,
  steps: log.execution.steps.length,
  modules: log.execution.modulesExecuted
};
```

## Notes Techniques

### Performance

- **Écriture asynchrone** : Les logs sont écrits de manière synchrone pour garantir la cohérence
- **Cache en mémoire** : Les logs actifs sont mis en cache pour accès rapide
- **Nettoyage automatique** : Les anciens logs sont automatiquement nettoyés selon la politique de rétention

### Limitations

- **Taille maximale** : Chaque fichier de log est limité à 10 MB par défaut
- **Rétention** : Les logs sont supprimés après la période de rétention (30 jours par défaut)
- **Stockage** : Les logs sont stockés sur le système de fichiers local

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [orchestrator-comm.module.md](./orchestrator-comm.module.md) - Communication entre orchestrateurs
- [PIPELINE.md](../../PIPELINE.md) - Spécification du pipeline de conversion
