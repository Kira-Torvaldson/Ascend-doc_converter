> ⚠️ **Deprecated:** Contenu migré vers les fichiers de référence canoniques.

# Carte d'environnement (EnvMap)

## Objectif

Ce document définit le système canonique de gestion des variables d'environnement pour Ascend. EnvMap fournit une interface centralisée, sécurisée et validée pour toutes les valeurs de configuration à l'exécution.

## Philosophie

### Source unique de vérité

EnvMap sert de **source unique de vérité** pour toute la configuration basée sur l'environnement. Tous les modules doivent accéder aux variables d'environnement via EnvMap plutôt que directement depuis `process.env`.

### Sécurité par conception

- **Basé sur une liste blanche** : Seules les clés explicitement définies sont accessibles
- **Typage sûr** : Toutes les valeurs sont validées selon les types attendus
- **Chemins sécurisés** : Les chemins sont normalisés et validés contre les attaques par traversée
- **Secrets protégés** : Les valeurs sensibles ne sont jamais exposées dans les journaux ou les dumps

### Architecture évolutive

Le module est conçu en tenant compte de la conformité future :
- Versionnage du schéma pour l'évolution
- Configurations spécifiques à l'environnement (dev/staging/prod)
- Préparé pour la conformité ISO 27001, SOC 2 (pas encore implémenté)

## Interface du module

### `get(key)`

Retourne la valeur validée d'une variable d'environnement.

**Paramètres :**
- `key` (string) : Clé de la variable d'environnement

**Retourne :**
- Valeur validée ou valeur par défaut

**Lève :**
- Erreur si la clé n'est pas dans le schéma

**Exemple :**
```javascript
const port = envMap.get('PORT') // Returns 3003 (default) or configured value
```

### `has(key)`

Vérifie si une variable d'environnement est définie dans le schéma.

**Paramètres :**
- `key` (string) : Clé de la variable d'environnement

**Retourne :**
- `boolean` : True si la clé existe dans le schéma

**Exemple :**
```javascript
if (envMap.has('PANDOC_PATH')) {
  // Use Pandoc path
}
```

### `assert(key)`

Affirme qu'une variable d'environnement existe et est valide.

**Paramètres :**
- `key` (string) : Clé de la variable d'environnement

**Lève :**
- Erreur si la clé est absente ou invalide

**Exemple :**
```javascript
envMap.assert('PANDOC_PATH') // Throws if missing or invalid
```

### `dumpSafe()`

Retourne toutes les variables d'environnement non sensibles sous forme d'objet.

**Retourne :**
- Objet avec toutes les paires clé-valeur non sensibles
- Les clés sensibles sont remplacées par `[REDACTED]`

**Exemple :**
```javascript
const config = envMap.dumpSafe()
// { PORT: 3003, NODE_ENV: 'development', ... }
```

## Définition du schéma

### Types pris en charge

- **`string`** : Valeurs textuelles
- **`number`** : Valeurs numériques (avec bornes min/max optionnelles)
- **`boolean`** : Valeurs booléennes (true/false, 1/0, yes/no)
- **`path`** : Chemins du système de fichiers (normalisés et validés)

### Propriétés du schéma

Chaque variable d'environnement dans le schéma définit :

- **`type`** : Type attendu (requis)
- **`default`** : Valeur par défaut si non définie (optionnel)
- **`min`** : Valeur minimale pour les nombres (optionnel)
- **`max`** : Valeur maximale pour les nombres (optionnel)
- **`sensitive`** : Indique si la valeur contient des secrets (par défaut : false)
- **`validator`** : Fonction de validation personnalisée (optionnel)

## Clés actuellement prises en charge

### Configuration serveur

- **`PORT`** : Port du serveur (number, default: 3003, range: 1-65535)
- **`NODE_ENV`** : Environnement Node (string, default: 'development', values: development/staging/production/test)

### Configuration Pandoc

- **`PANDOC_PATH`** : Chemin vers le binaire Pandoc (path, default: '/usr/bin/pandoc')

### Configuration des journaux

- **`LOGS_DIR`** : Répertoire des fichiers de journal (path, default: 'api/logs')
- **`MAX_LOG_SIZE`** : Taille maximale des fichiers de journal en octets (number, default: 10485760, range: 1024-104857600)
- **`LOG_RETENTION_DAYS`** : Période de rétention des journaux en jours (number, default: 30, range: 1-365)

### Sécurité et limites de ressources

- **`MAX_CONCURRENT_CONVERSIONS`** : Nombre maximal de conversions concurrentes (number, default: 5, range: 1-50)
- **`MAX_CPU_TIME_MS`** : Temps CPU maximal par conversion en millisecondes (number, default: 30000, range: 1000-300000)
- **`MAX_MEMORY_MB`** : Mémoire maximale par conversion en Mo (number, default: 512, range: 64-4096)
- **`MAX_WALL_TIME_MS`** : Temps réel maximal par conversion en millisecondes (number, default: 60000, range: 1000-600000)

### Détection de surcharge

- **`OVERLOAD_CPU_PERCENT`** : Seuil d'utilisation CPU pour la détection de surcharge (number, default: 80.0, range: 0-100)
- **`OVERLOAD_MEMORY_PERCENT`** : Seuil d'utilisation mémoire pour la détection de surcharge (number, default: 80.0, range: 0-100)
- **`OVERLOAD_FAILURE_RATE`** : Seuil de taux d'échec pour la détection de surcharge (number, default: 0.2, range: 0-1)

### Détection d'anomalies

- **`ABNORMAL_DURATION_MULT`** : Multiplicateur pour la détection de durée anormale (number, default: 3.0, range: 1.0-10.0)
- **`ABNORMAL_MEMORY_MULT`** : Multiplicateur pour la détection de mémoire anormale (number, default: 2.0, range: 1.0-10.0)

### Journalisation de sécurité

- **`SECURITY_LOG_PATH`** : Chemin des journaux de sécurité (path, default: system temp directory)

## Règles de validation

### Validation de type

- **String** : Converti en chaîne, sans validation supplémentaire
- **Number** : Doit être un nombre valide, vérifié par rapport aux bornes min/max
- **Boolean** : Accepte true/false, 1/0, yes/no (insensible à la casse)
- **Path** : Résolu en chemin absolu, vérifié contre les attaques par traversée (`..`)

### Validation des chemins

Tous les chemins sont :
- Résolus en chemins absolus
- Vérifiés pour les séquences de traversée (`..`)
- Validés par rapport aux répertoires autorisés (racine du projet ou répertoire temporaire système)
- Vérifiés pour l'existence (pour les chemins de binaires)

### Validation personnalisée

Les entrées du schéma peuvent définir des fonctions `validator` personnalisées pour une logique de validation supplémentaire.

## Fonctionnalités de sécurité

### Application de la liste blanche

Seules les clés explicitement définies dans le schéma sont accessibles. Toute tentative d'accès à une clé non définie lève une erreur.

### Protection contre la traversée de chemins

Toutes les valeurs de type chemin sont vérifiées pour les séquences de traversée et normalisées afin d'empêcher les attaques d'évasion de répertoire.

### Protection des secrets

Les valeurs marquées `sensitive: true` sont :
- Jamais incluses dans la sortie de `dumpSafe()`
- Remplacées par `[REDACTED]` dans tout dump public
- Non journalisées ni exposées dans les messages d'erreur

## Directives d'intégration

### Stratégie de migration

1. **Importer EnvMap** dans les modules qui utilisent des variables d'environnement
2. **Remplacer l'accès direct** à `process.env.X` par `envMap.get('X')`
3. **Maintenir la rétrocompatibilité** en conservant l'accès existant à `process.env` pendant la transition
4. **Valider** que le comportement reste inchangé

### Exemple de migration

**Avant :**
```javascript
const pandocPath = process.env.PANDOC_PATH || '/usr/bin/pandoc'
```

**Après :**
```javascript
const { envMap } = require('../config/envmap.module.js')
const pandocPath = envMap.get('PANDOC_PATH')
```

## Améliorations futures

### Versionnage du schéma

Le schéma inclut un champ `version` pour supporter l'évolution future du schéma sans casser les configurations existantes.

### Configurations spécifiques à l'environnement

Le module est préparé pour supporter des configurations spécifiques à l'environnement (dev/staging/prod) via le champ `env` dans les métadonnées du schéma.

### Normes de conformité

L'architecture est préparée pour une conformité future avec :
- **ISO 27001** : Gestion de la sécurité de l'information
- **SOC 2** : Sécurité, disponibilité, intégrité du traitement
- **NIST SP 800-53** : Contrôles de sécurité et de confidentialité

Ces normes sont mentionnées pour une implémentation future, elles ne sont pas actuellement appliquées.

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Le schéma des variables d'environnement
- Les règles de validation
- Les fonctionnalités de sécurité
- Les directives d'intégration
