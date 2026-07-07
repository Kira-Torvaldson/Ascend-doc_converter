# Module de journalisation structurée

## Description

Le module de journalisation structurée génère des fichiers de journaux JSON pour chaque conversion, permettant un suivi détaillé, un audit et un débogage facilité. Les journaux sont stockés dans un répertoire contrôlé et accessibles via un endpoint API.

## Nom du module

**Identifiant :** `structured-logger`  
**Type :** Module de journalisation  
**Rôle :** Génération et gestion des journaux structurés pour les conversions

## Objectif

Fournir un système de journalisation structuré, accessible et lisible pour chaque conversion, permettant :
- Le suivi détaillé de l'exécution des conversions
- L'audit et la conformité
- Le débogage facilité
- L'analyse des performances
- La préparation à l'intégration avec des tableaux de bord ou des systèmes d'analyse

## Structure des journaux et format JSON

### Structure complète

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

### Champs détaillés

#### `conversionId`
- **Type :** `string`
- **Description :** Identifiant unique de la conversion (UUID)
- **Exemple :** `"550e8400-e29b-41d4-a716-446655440000"`

#### `timestamp`
- **Type :** `object`
- **Description :** Horodatage de début et de fin de la conversion
- **Champs :**
  - `start` : Date de début au format ISO 8601
  - `end` : Date de fin au format ISO 8601 (null si en cours)

#### `formats`
- **Type :** `object`
- **Description :** Formats source et cible de la conversion
- **Champs :**
  - `source` : Format source (ex. « asciidoc », « markdown », « html »)
  - `target` : Format cible (ex. « markdown », « asciidoc », « pdf »)

#### `status`
- **Type :** `string`
- **Description :** Statut final de la conversion
- **Valeurs possibles :**
  - `"running"` : Conversion en cours
  - `"success"` : Conversion réussie
  - `"error"` : Conversion échouée

#### `execution`
- **Type :** `object`
- **Description :** Informations sur l'exécution de la conversion
- **Champs :**
  - `steps` : Tableau des étapes d'exécution (voir ci-dessous)
  - `totalDuration` : Durée totale en secondes (nombre décimal)
  - `modulesExecuted` : Liste des modules exécutés (tableau de chaînes)

#### `execution.steps[]`
- **Type :** `array` d'objets
- **Description :** Détails de chaque étape d'exécution
- **Champs par étape :**
  - `stepNumber` : Numéro d'étape (entier, commence à 1)
  - `module` : Nom du module exécuté (ex. « downdoc », « pandoc »)
  - `fromFormat` : Format source de l'étape
  - `toFormat` : Format cible de l'étape
  - `inputFile` : Nom du fichier d'entrée (basename uniquement)
  - `outputFile` : Nom du fichier de sortie (basename uniquement)
  - `duration` : Durée d'exécution en secondes (nombre décimal)
  - `status` : Statut de l'étape (« success », « error », « skipped »)
  - `logs` : Journaux détaillés de l'étape (tableau de chaînes)
  - `error` : Message d'erreur (null si succès)

#### `files`
- **Type :** `object`
- **Description :** Informations sur les fichiers utilisés
- **Champs :**
  - `input` : Nom du fichier d'entrée (basename uniquement)
  - `output` : Nom du fichier de sortie (basename uniquement)
  - `intermediate` : Tableau des fichiers intermédiaires

#### `files.intermediate[]`
- **Type :** `array` d'objets
- **Description :** Liste des fichiers intermédiaires créés
- **Champs :**
  - `step` : Numéro d'étape ayant créé le fichier
  - `file` : Nom du fichier (basename uniquement)

#### `logs`
- **Type :** `array` d'objets
- **Description :** Messages de journal détaillés
- **Structure du message :**
  - `timestamp` : Horodatage au format ISO 8601
  - `level` : Niveau de journal (« info », « warn », « error », « debug »)
  - `message` : Message de journal
  - Autres métadonnées optionnelles

#### `error`
- **Type :** `string | null`
- **Description :** Message d'erreur si la conversion a échoué (null si succès)

#### `metadata`
- **Type :** `object`
- **Description :** Métadonnées supplémentaires (sans données sensibles)
- **Champs :**
  - `contentSize` : Taille du contenu en caractères (optionnel)

## Endpoint API : `/api/logs`

### GET `/api/logs/:conversionId`

Récupère le journal d'une conversion spécifique.

**Paramètres :**
- `conversionId` (obligatoire) : Identifiant unique de la conversion

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

**Exemple d'utilisation depuis le terminal :**
```bash
# Avec curl
curl http://localhost:3003/api/logs/550e8400-e29b-41d4-a716-446655440000

# Avec curl et jq pour formater le JSON
curl -s http://localhost:3003/api/logs/550e8400-e29b-41d4-a716-446655440000 | jq

# Sauvegarder dans un fichier
curl -s http://localhost:3003/api/logs/550e8400-e29b-41d4-a716-446655440000 > conversion.log

# Avec un script Node.js (depuis api/logs/)
cd api/logs
node list-logs.js                                    # Lister tous les journaux
node list-logs.js {conversionId}                    # Afficher un journal spécifique
```

### GET `/api/logs`

Liste tous les journaux disponibles.

**Paramètres de requête :**
- `limit` (optionnel) : Nombre maximum de journaux à retourner (par défaut : 100)

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

**Exemple d'utilisation depuis le terminal :**
```bash
# Lister tous les journaux
curl http://localhost:3003/api/logs

# Lister avec une limite
curl "http://localhost:3003/api/logs?limit=50"

# Formater avec jq
curl -s http://localhost:3003/api/logs | jq '.logs[] | {conversionId, status, duration: .execution.totalDuration}'
```

## Métriques et données collectées

### Métriques de performance

- **Durée totale :** Temps total d'exécution de la conversion
- **Durée par étape :** Temps d'exécution de chaque module
- **Ordre d'exécution :** Séquence exacte des modules exécutés

### Métriques de fichiers

- **Fichier d'entrée :** Nom et chemin (sanitisé) du fichier source
- **Fichier de sortie :** Nom et chemin (sanitisé) du fichier final
- **Fichiers intermédiaires :** Liste de tous les fichiers créés pendant la conversion

### Métriques d'exécution

- **Modules exécutés :** Liste de tous les modules utilisés
- **Statut de chaque étape :** Succès ou échec de chaque étape
- **Messages de journal :** Tous les messages de journal avec horodatage et niveau

### Métriques de statut

- **Statut final :** Succès ou échec de la conversion complète
- **Messages d'erreur :** Messages d'erreur détaillés en cas d'échec
- **Horodatage :** Date et heure de début et de fin

## Sécurité et audit

### Protection des données sensibles

Le module applique automatiquement une sanitisation des journaux pour protéger les données sensibles :

1. **Chemins de fichiers :** Seuls les noms de fichiers (basename) sont conservés, pas les chemins complets
2. **Métadonnées :** Les métadonnées sensibles (IP, User-Agent) ne sont pas enregistrées dans les journaux
3. **Contenu :** Aucun contenu de fichier source n'est enregistré dans les journaux

### Contrôle d'accès

- **Répertoire contrôlé :** Les journaux sont stockés dans un répertoire contrôlé par le pipeline (`/logs`)
- **Permissions :** Le répertoire de journaux est créé avec des permissions restrictives (0o750)
- **Isolation :** Chaque conversion possède son propre fichier de journal, isolé des autres

### Audit et conformité

Les journaux structurés permettent :
- **Traçabilité complète :** Chaque conversion est traçable via son identifiant unique
- **Horodatage précis :** Tous les événements sont horodatés
- **Conformité :** Format JSON standardisé pour l'intégration avec les systèmes d'audit
- **Rétention :** Politique de rétention configurable (30 jours par défaut)

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

## Bonnes pratiques

### Pour le développement

1. **Vérifier régulièrement les journaux :** Utiliser l'endpoint `/api/logs` pour vérifier le bon fonctionnement
2. **Analyser les durées :** Surveiller les durées d'exécution pour détecter les problèmes de performance
3. **Suivre les erreurs :** Analyser les journaux d'erreur pour identifier les problèmes récurrents

### Pour l'audit

1. **Archiver les journaux :** Les journaux sont automatiquement archivés après la période de rétention
2. **Exporter les journaux :** Utiliser l'endpoint API pour exporter les journaux vers des systèmes d'analyse
3. **Surveiller l'espace disque :** Les journaux sont limités en taille (10 Mo par défaut)

### Pour le débogage

1. **Identifier la conversion :** Utiliser le `conversionId` pour récupérer le journal complet
2. **Analyser les étapes :** Examiner chaque étape pour identifier où l'erreur s'est produite
3. **Vérifier les fichiers :** Contrôler les noms des fichiers d'entrée et de sortie

## Intégration avec les orchestrateurs

### Orchestrateur principal

L'orchestrateur principal initialise le journal au début de la conversion et le finalise à la fin :

```javascript
// Initialisation
initializeLog(conversionId, sourceFormat, targetFormat, options)

// Enregistrement d'événements
addLogMessage(conversionId, 'info', 'Message')
recordInputFile(conversionId, inputFilePath)

// Finalisation
finalizeLog(conversionId, 'success', { totalDuration, stepsExecuted })
```

### Orchestrateur d'exécution

L'orchestrateur d'exécution enregistre chaque étape d'exécution :

```javascript
// Enregistrement d'étape
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

### Variables d'environnement

- `LOGS_DIR` : Répertoire de stockage des journaux (par défaut : `{project_root}/logs`)
- `MAX_LOG_SIZE` : Taille maximale d'un fichier de journal en octets (par défaut : 10485760 = 10 Mo)
- `LOG_RETENTION_DAYS` : Période de rétention en jours (par défaut : 30)

### Structure du répertoire de journaux

```
logs/
├── {conversionId1}.log
├── {conversionId2}.log
├── {conversionId3}.log
└── archived/
    ├── {old_conversionId1}.log
    └── {old_conversionId2}.log
```

## Préparation pour les tableaux de bord et systèmes d'analyse

### Format JSON standardisé

Le format JSON standardisé permet une intégration facile avec :
- **Elasticsearch :** Indexation et recherche de journaux
- **Grafana :** Visualisation des métriques de performance
- **Prometheus :** Collecte de métriques pour la surveillance
- **Splunk :** Analyse et corrélation d'événements

### Métriques exportables

Les métriques suivantes peuvent être facilement extraites :
- Taux de succès/échec
- Durées d'exécution moyennes
- Modules les plus utilisés
- Formats de conversion les plus fréquents
- Taille moyenne des conversions

### Exemple d'intégration

```javascript
// Exemple d'extraction de métriques pour un tableau de bord
const log = readLog(conversionId);
const metrics = {
  success: log.status === 'success',
  duration: log.execution.totalDuration,
  steps: log.execution.steps.length,
  modules: log.execution.modulesExecuted
};
```

## Notes techniques

### Performance

- **Écriture synchrone :** Les journaux sont écrits de manière synchrone pour garantir la cohérence
- **Cache en mémoire :** Les journaux actifs sont mis en cache pour un accès rapide
- **Nettoyage automatique :** Les anciens journaux sont automatiquement nettoyés selon la politique de rétention

### Limitations

- **Taille maximale :** Chaque fichier de journal est limité à 10 Mo par défaut
- **Rétention :** Les journaux sont supprimés après la période de rétention (30 jours par défaut)
- **Stockage :** Les journaux sont stockés sur le système de fichiers local

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [orchestrator-comm.module.md](./orchestrator-comm.module.md) - Communication entre orchestrateurs
- [PIPELINE.md](../../PIPELINE.md) - Spécification du pipeline de conversion
