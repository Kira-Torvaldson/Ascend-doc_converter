# Référence de configuration

## Objectif

Ce document définit les références canoniques de configuration pour Ascend, incluant les profils d'exécution, les limites de ressources, les politiques de journalisation, les chemins et le stockage, les variables d'environnement et les options de conversion. Il constitue la référence faisant autorité pour toutes les décisions de configuration.

---

## Matrice des limites de production (Ascend 0.0.1.4.7+)

Cette section reflète les limites **implémentées** après ASC-008 (source unique via EnvMap). Les tableaux de profils aspirants ci-dessous peuvent différer ; considérez cette matrice comme faisant autorité pour le comportement à l'exécution.

| Couche | Par défaut | Octets (le cas échéant) | Source |
|--------|------------|-------------------------|--------|
| Entrée de conversion (`MAX_INPUT_SIZE_MB`) | **5 Mo** | 5_242_880 | `envmap.module.js` → `conversion-limits.js` |
| Vérifications de fichiers des modules (`MAX_FILE_SIZE`) | **5 Mo** | identique à EnvMap | `adoc-to-md`, `text2markdown`, `docverter`, `panwriter` |
| Limite `express.json` d'Express | **~6 Mo** | marge ~20 % au-dessus de l'entrée | `app.js` via `getExpressBodyLimitString()` |
| Validation source frontend | **5 Mo** | depuis l'API | `GET /api/config/limits` → `App.tsx` |
| Téléversement Nginx (Docker) | **6m** | — | `container/docker-compose.yml` (`NGINX_CLIENT_MAX_BODY_SIZE`) |
| Pré-vérification route de conversion | **5 Mo** | `PAYLOAD_TOO_LARGE` | `conversion.routes.js` |
| Limite de débit | **100 req / 15 min / IP** | — | `rate-limit.middleware.js` |
| Délai d'expiration de conversion | **30 s** | — | `CONVERSION_TIMEOUT_MS` (EnvMap) |
| Délai d'expiration fetch UI | **30 s** | — | `generic-converter.ts` |

**Surcharge :** définir `MAX_INPUT_SIZE_MB` et éventuellement `CONVERSION_TIMEOUT_MS` dans l'environnement (voir `container/.env.example`). Les limites Express et UI suivent l'instantané backend.

**Découverte API :**

- `GET /api/config/limits` — limites exposées à l'interface
- `GET /api/metrics` — compteurs de conversion (nécessite `X-API-Key` lorsque `API_KEY` est défini en production)

**Runbook opérationnel :** `doc/guides/operations/runbook.md`

---

## Profils d'exécution

### Objectif

Les profils d'exécution contrôlent la manière dont les conversions sont exécutées. Ils déterminent les limites de ressources, les valeurs de délai d'expiration et les contrôles de concurrence.

### Types de profils

#### Profil par défaut

**Identifiant :** `default`  
**Cas d'usage :** Conversions de documents standard  
**Limites de ressources :**
- **Délai d'expiration :** 30 secondes
- **Mémoire max :** 512 Mo
- **CPU max :** 100 % (un cœur)
- **Taille de fichier max :** 10 Mo
- **Conversions simultanées :** 5

#### Profil strict

**Identifiant :** `strict`  
**Cas d'usage :** Environnements à haute sécurité, entrées non fiables  
**Limites de ressources :**
- **Délai d'expiration :** 15 secondes
- **Mémoire max :** 256 Mo
- **CPU max :** 50 % (un cœur)
- **Taille de fichier max :** 5 Mo
- **Conversions simultanées :** 2

#### Profil performance

**Identifiant :** `performance`  
**Cas d'usage :** Fichiers volumineux, traitement par lots  
**Limites de ressources :**
- **Délai d'expiration :** 120 secondes
- **Mémoire max :** 2 Go
- **CPU max :** 100 % (un cœur)
- **Taille de fichier max :** 50 Mo
- **Conversions simultanées :** 3

### Sélection du profil

Les profils sont sélectionnés en fonction de :
1. Configuration utilisateur explicite (si fournie)
2. Type de conversion (simple vs. complexe)
3. Conditions de charge système
4. Exigences de sécurité

### Application des limites de ressources

Toutes les limites de ressources sont appliquées au niveau du pipeline :
- **Délai d'expiration :** Appliqué via la surveillance du processus et SIGTERM/SIGKILL
- **Mémoire :** Surveillée via le suivi RSS du processus
- **CPU :** Limité via la priorité et l'ordonnancement du processus
- **Taille de fichier :** Validée avant le début de la conversion
- **Concurrence :** Appliquée via un mécanisme de sémaphore/file d'attente

---

## Limites de ressources

### Objectif

Cette section définit les limites de ressources canoniques appliquées par le pipeline Ascend. Ces limites protègent le système contre l'épuisement des ressources et garantissent une allocation équitable des ressources.

### Catégories de limites

#### Limites de temps

| Type de limite | Valeur par défaut | Valeur maximale | Application |
|----------------|-------------------|-----------------|-------------|
| Délai d'expiration de conversion | 30 secondes | 300 secondes | Arrêt du processus (SIGTERM → SIGKILL) |
| Expiration du jeton | 60 secondes | 300 secondes | Validation du jeton |
| Délai d'expiration de requête | 30 secondes | 60 secondes | Délai d'expiration HTTP |

#### Limites mémoire

| Type de limite | Valeur par défaut | Valeur maximale | Application |
|----------------|-------------------|-----------------|-------------|
| Mémoire par conversion | 512 Mo | 2 Go | Surveillance du processus + arrêt |
| Mémoire système totale | 2 Go | 4 Go | Dégradation gracieuse |
| Taille du fichier d'entrée | **5 Mo** | 100 Mo (max EnvMap) | Pré-validation via `MAX_INPUT_SIZE_MB` |

#### Limites CPU

| Type de limite | Valeur par défaut | Valeur maximale | Application |
|----------------|-------------------|-----------------|-------------|
| CPU par processus | 100 % (1 cœur) | 100 % (1 cœur) | Priorité du processus |
| CPU système total | 80 % | 95 % | Dégradation gracieuse |

#### Limites de concurrence

| Type de limite | Valeur par défaut | Valeur maximale | Application |
|----------------|-------------------|-----------------|-------------|
| Conversions simultanées | 5 | 10 | Sémaphore/file d'attente |
| Requêtes en attente | 20 | 50 | File d'attente de requêtes |

### Règles d'application des limites

#### 1. Limites strictes

Les limites strictes ne peuvent être dépassées en aucune circonstance :
- Limites de taille de fichier (validées avant le traitement)
- Valeurs maximales de délai d'expiration
- Nombre maximal de conversions simultanées

#### 2. Limites souples

Les limites souples déclenchent des avertissements ou une dégradation :
- Utilisation mémoire approchant la limite → journalisation d'avertissement
- Utilisation CPU élevée → réduction de la priorité des nouvelles conversions
- Charge système élevée → refus des nouvelles conversions

#### 3. Dégradation gracieuse

Lorsque les limites sont approchées :
- Les nouvelles conversions sont refusées avec des messages d'erreur clairs
- Les conversions en cours se poursuivent jusqu'à achèvement
- L'état du système est surveillé et journalisé
- La récupération est automatique lorsque la charge diminue

### Configuration des limites

Les limites peuvent être configurées via :
- Variables d'environnement (pour le déploiement)
- Fichiers de configuration (pour l'ajustement par instance)
- Paramètres API (pour les surcharges par requête, dans les bornes)

Toute configuration doit respecter les valeurs maximales définies dans ce document.

---

## Politique de journalisation

### Objectif

Cette section définit la politique de journalisation canonique pour Ascend. Elle spécifie ce qui est journalisé, comment les journaux sont structurés, les politiques de rétention et les exigences de sécurité.

### Catégories de journaux

#### 1. Journaux de conversion

**Objectif :** Suivre les opérations de conversion individuelles  
**Format :** JSON  
**Emplacement :** `api/logs/<conversion-id>.log`  
**Rétention :** 30 jours (configurable)

**Contenu :**
- ID de conversion (UUID)
- Horodatage (ISO 8601)
- Formats source et cible
- Modules exécutés
- Durée
- Statut final (SUCCESS, FAILED, TIMEOUT, etc.)
- Messages d'erreur (assainis)

**Sécurité :**
- Aucun contenu utilisateur
- Aucun chemin de fichier (uniquement des chemins relatifs dans le répertoire temporaire)
- Aucune donnée sensible

#### 2. Journaux de sécurité

**Objectif :** Suivre les événements et violations de sécurité  
**Format :** JSON  
**Emplacement :** Journal des événements de sécurité (séparé des journaux de conversion)  
**Rétention :** 90 jours (configurable)

**Contenu :**
- Type d'événement de sécurité
- Horodatage
- ID de conversion (le cas échéant)
- Détails de la violation (assainis)
- Action entreprise

**Événements journalisés :**
- Tentatives de traversée de répertoire
- Tentatives d'accès réseau
- Violations des limites de ressources
- Tentatives de format non autorisé
- Échecs de validation de jeton

#### 3. Journaux système

**Objectif :** Suivre la santé et les erreurs du système  
**Format :** Texte structuré ou JSON  
**Emplacement :** Journal système (stdout/stderr ou fichier)  
**Rétention :** 7 jours (configurable)

**Contenu :**
- Événements système (démarrage, arrêt)
- Conditions d'erreur
- Avertissements d'utilisation des ressources
- Événements de dégradation

### Structure des journaux

#### Format du journal de conversion

```json
{
  "conversionId": "uuid",
  "timestamp": "ISO-8601",
  "sourceFormat": "asciidoc",
  "targetFormat": "markdown",
  "modules": [
    {
      "name": "downdoc",
      "duration": 1.23,
      "status": "SUCCESS"
    }
  ],
  "totalDuration": 1.23,
  "status": "SUCCESS",
  "error": null
}
```

### Règles de journalisation

#### 1. Aucun contenu utilisateur

Les journaux ne doivent jamais contenir :
- Le contenu des fichiers
- Le texte fourni par l'utilisateur
- Des informations personnelles
- Des données sensibles

#### 2. Assainissement

Toutes les données journalisées doivent être assainies :
- Chemins de fichiers → chemins relatifs uniquement
- Messages d'erreur → messages génériques (sans détails système)
- Entrée utilisateur → supprimée ou hachée

#### 3. Format structuré

Tous les journaux doivent être structurés (JSON préféré) pour :
- L'analyse par machine
- L'analyse automatisée
- L'intégration avec les systèmes d'agrégation de journaux

#### 4. Journalisation minimale

Seules les informations essentielles sont journalisées :
- Métadonnées de conversion
- Événements de sécurité
- Erreurs système
- Métriques de performance

### Accès aux journaux

#### Accès API

Les journaux sont accessibles via :
- `GET /api/logs/<conversion-id>` - Journal d'une conversion unique
- `GET /api/logs` - Lister tous les journaux de conversion

#### Accès au système de fichiers

Les journaux sont stockés dans :
- Répertoire `api/logs/`
- Un fichier par conversion
- Format JSON pour l'analyse

### Politique de rétention

- **Journaux de conversion :** 30 jours (par défaut, configurable)
- **Journaux de sécurité :** 90 jours (par défaut, configurable)
- **Journaux système :** 7 jours (par défaut, configurable)

Le nettoyage automatique supprime les journaux plus anciens que la période de rétention.

---

## Chemins et stockage

### Objectif

Cette section définit les chemins et emplacements de stockage canoniques utilisés par Ascend. Elle sert de référence pour l'organisation du système de fichiers et la validation des chemins.

### Structure des répertoires

#### Répertoires racine

```
Ascend/
├── api/
│   ├── backend/          # Backend application
│   ├── frontend/         # Frontend application
│   └── logs/            # Conversion logs (writable)
├── doc/                  # Documentation
├── lib/                  # Core libraries
└── test/                 # Tests
```

#### Répertoires temporaires

**Chemin de base :** Répertoire temporaire système (spécifique à l'OS)  
**Modèle :** `<temp-dir>/ascend-<conversion-id>/`  
**Permissions :** 0o700 (lecture/écriture/exécution propriétaire uniquement)  
**Durée de vie :** Créé par conversion, supprimé après achèvement

**Exemple :**
- Linux/macOS : `/tmp/ascend-<uuid>/`
- Windows : `C:\Users\<user>\AppData\Local\Temp\ascend-<uuid>\`

#### Répertoire des journaux

**Chemin :** `api/logs/`  
**Permissions :** Inscriptible par l'application  
**Contenu :** Fichiers journaux JSON, un par conversion  
**Nommage :** `<conversion-id>.log`

#### Ressources statiques

**Public backend :** `api/backend/public/`  
**Statique backend :** `api/backend/static/`  
**Dist frontend :** `api/frontend/dist/` (build de production)

### Règles de validation des chemins

#### 1. Chemins absolus requis

Toutes les opérations sur les fichiers doivent utiliser des chemins absolus :
- Fichiers d'entrée : Résolus en chemin absolu avant utilisation
- Fichiers de sortie : Générés comme chemins absolus
- Fichiers temporaires : Créés avec des chemins absolus

#### 2. Protection contre la traversée de répertoire

Tous les chemins doivent être validés pour empêcher :
- Les séquences `../`
- Le suivi des liens symboliques (en mode sécurisé)
- L'accès en dehors des répertoires autorisés

#### 3. Isolation du répertoire temporaire

Tous les fichiers de conversion doivent être dans :
- Le répertoire temporaire unique de la conversion
- Aucun accès aux fichiers en dehors de ce répertoire
- Aucune création de fichiers dans les répertoires système

#### 4. Validation par liste blanche

Seuls les chemins correspondant aux modèles autorisés sont acceptés :
- Modèle de répertoire temporaire
- Modèle de répertoire de journaux
- Répertoires de ressources statiques (lecture seule)

### Exigences de stockage

#### Répertoires inscriptibles

Les répertoires suivants doivent être inscriptibles :
- `api/logs/` - Pour les journaux de conversion
- Répertoire temporaire système - Pour les fichiers de conversion temporaires
- `api/backend/public/` - Pour les ressources téléversées par l'utilisateur (si activé)

#### Répertoires en lecture seule

Les répertoires suivants sont en lecture seule :
- `doc/` - Documentation
- `lib/` - Bibliothèques principales
- `api/backend/static/` - Fichiers HTML statiques

### Résolution des chemins

#### Résolution du fichier d'entrée

1. L'utilisateur fournit un chemin relatif ou absolu
2. Le système résout en chemin absolu
3. Valide que le chemin est dans le périmètre autorisé
4. Vérifie que le fichier existe et est lisible
5. Valide que la taille du fichier est dans les limites

#### Résolution du fichier de sortie

1. Le système génère un chemin absolu dans le répertoire temporaire
2. Valide que le chemin est dans le répertoire temporaire
3. Crée les répertoires parents si nécessaire
4. Écrit le fichier de sortie
5. Retourne le chemin relatif ou le contenu à l'utilisateur

---

## Variables d'environnement (EnvMap)

### Objectif

Cette section définit le système canonique de gestion des variables d'environnement pour Ascend. EnvMap fournit une interface centralisée, sécurisée et validée pour toutes les valeurs de configuration à l'exécution.

### Philosophie

#### Source unique de vérité

EnvMap sert de **source unique de vérité** pour toute configuration basée sur l'environnement. Tous les modules doivent accéder aux variables d'environnement via EnvMap plutôt que directement depuis `process.env`.

#### Sécurité dès la conception

- **Basé sur une liste blanche** : Seules les clés explicitement définies sont accessibles
- **Typé** : Toutes les valeurs sont validées par rapport aux types attendus
- **Sécurisé pour les chemins** : Les chemins sont normalisés et validés contre les attaques par traversée
- **Sécurisé pour les secrets** : Les valeurs sensibles ne sont jamais exposées dans les journaux ou les dumps

#### Architecture évolutive

Le module est conçu en tenant compte de la conformité future :
- Versionnage de schéma pour l'évolution
- Configurations spécifiques à l'environnement (dev/staging/prod)
- Préparé pour la conformité ISO 27001, SOC 2 (pas encore implémenté)

### Interface du module

#### `get(key)`

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

#### `has(key)`

Vérifie si une variable d'environnement est définie dans le schéma.

**Paramètres :**
- `key` (string) : Clé de la variable d'environnement

**Retourne :**
- `boolean` : True si la clé existe dans le schéma

#### `assert(key)`

Affirme qu'une variable d'environnement existe et est valide.

**Paramètres :**
- `key` (string) : Clé de la variable d'environnement

**Lève :**
- Erreur si la clé est manquante ou invalide

#### `dumpSafe()`

Retourne toutes les variables d'environnement non sensibles sous forme d'objet.

**Retourne :**
- Objet avec toutes les paires clé-valeur non sensibles
- Les clés sensibles sont remplacées par `[REDACTED]`

### Définition du schéma

#### Types pris en charge

- **`string`** : Valeurs texte
- **`number`** : Valeurs numériques (avec bornes min/max optionnelles)
- **`boolean`** : Valeurs booléennes (true/false, 1/0, yes/no)
- **`path`** : Chemins du système de fichiers (normalisés et validés)

#### Propriétés du schéma

Chaque variable d'environnement dans le schéma définit :

- **`type`** : Type attendu (requis)
- **`default`** : Valeur par défaut si non définie (optionnel)
- **`min`** : Valeur minimale pour les nombres (optionnel)
- **`max`** : Valeur maximale pour les nombres (optionnel)
- **`sensitive`** : Indique si la valeur contient des secrets (par défaut : false)
- **`validator`** : Fonction de validation personnalisée (optionnel)

### Clés actuellement prises en charge

#### Configuration serveur

- **`PORT`** : Port du serveur (number, défaut : 3003, plage : 1-65535)
- **`NODE_ENV`** : Environnement Node (string, défaut : 'development', valeurs : development/staging/production/test)

#### Configuration Pandoc

- **`PANDOC_PATH`** : Chemin vers le binaire Pandoc (path, défaut : '/usr/bin/pandoc')

#### Configuration de journalisation

- **`LOGS_DIR`** : Répertoire des fichiers journaux (path, défaut : 'api/logs')
- **`MAX_LOG_SIZE`** : Taille maximale du fichier journal en octets (number, défaut : 10485760, plage : 1024-104857600)
- **`LOG_RETENTION_DAYS`** : Période de rétention des journaux en jours (number, défaut : 30, plage : 1-365)

#### Sécurité et limites de ressources

- **`MAX_INPUT_SIZE_MB`** : Taille maximale d'entrée de conversion en mégaoctets (number, défaut : **5**, plage : 1-100) — **canonique** pour l'interface, les routes, les modules et la marge du corps Express
- **`CONVERSION_TIMEOUT_MS`** : Délai d'expiration de conversion par requête en millisecondes (number, défaut : **30000**, plage : 1000-600000)
- **`MAX_CONCURRENT_CONVERSIONS`** : Nombre maximal de conversions simultanées (number, défaut : 5, plage : 1-50)
- **`MAX_CPU_TIME_MS`** : Temps CPU maximal par conversion en millisecondes (number, défaut : 30000, plage : 1000-300000)
- **`MAX_MEMORY_MB`** : Mémoire maximale par conversion en Mo (number, défaut : 512, plage : 64-4096)
- **`MAX_WALL_TIME_MS`** : Temps mur maximal par conversion en millisecondes (number, défaut : 60000, plage : 1000-600000)

#### Détection de surcharge

- **`OVERLOAD_CPU_PERCENT`** : Seuil d'utilisation CPU pour la détection de surcharge (number, défaut : 80.0, plage : 0-100)
- **`OVERLOAD_MEMORY_PERCENT`** : Seuil d'utilisation mémoire pour la détection de surcharge (number, défaut : 80.0, plage : 0-100)
- **`OVERLOAD_FAILURE_RATE`** : Seuil de taux d'échec pour la détection de surcharge (number, défaut : 0.2, plage : 0-1)

#### Détection d'anomalies

- **`ABNORMAL_DURATION_MULT`** : Multiplicateur pour la détection de durée anormale (number, défaut : 3.0, plage : 1.0-10.0)
- **`ABNORMAL_MEMORY_MULT`** : Multiplicateur pour la détection de mémoire anormale (number, défaut : 2.0, plage : 1.0-10.0)

#### Journalisation de sécurité

- **`SECURITY_LOG_PATH`** : Chemin des journaux de sécurité (path, défaut : répertoire temporaire système)

### Règles de validation

#### Validation des types

- **String** : Converti en chaîne, aucune validation supplémentaire
- **Number** : Doit être un nombre valide, vérifié par rapport aux bornes min/max
- **Boolean** : Accepte true/false, 1/0, yes/no (insensible à la casse)
- **Path** : Résolu en chemin absolu, vérifié contre les attaques par traversée (`..`)

#### Validation des chemins

Tous les chemins sont :
- Résolus en chemins absolus
- Vérifiés contre les séquences de traversée (`..`)
- Validés par rapport aux répertoires autorisés (racine du projet ou temp système)
- Vérifiés pour l'existence (pour les chemins de binaires)

### Fonctionnalités de sécurité

#### Application de la liste blanche

Seules les clés explicitement définies dans le schéma sont accessibles. Toute tentative d'accès à une clé non définie lève une erreur.

#### Protection contre la traversée de répertoire

Toutes les valeurs de chemin sont vérifiées pour les séquences de traversée et normalisées pour empêcher les attaques d'évasion de répertoire.

#### Protection des secrets

Les valeurs marquées `sensitive: true` sont :
- Jamais incluses dans la sortie de `dumpSafe()`
- Remplacées par `[REDACTED]` dans tout dump public
- Non journalisées ni exposées dans les messages d'erreur

---

## Options de conversion

### Objectif

Cette section définit le système d'options de conversion qui permet une configuration fine du comportement de conversion de documents. Il est conçu pour être modulaire, extensible et orienté API.

### Structure des options

Les options sont organisées en 7 catégories principales :

1. **Content Analysis** - Analyse de contenu
2. **Normalization** - Normalisation du contenu
3. **Rendering** - Options de rendu de document
4. **Format Specific** - Options spécifiques au format
5. **Security** - Sécurité et robustesse
6. **Metadata** - Métadonnées du document
7. **Developer** - Options développeur

### Analyse de contenu

#### `analysisMode`

- **Type** : `string`
- **Valeurs** : `'basic'` | `'heuristic'` | `'strict'`
- **Défaut** : `'heuristic'`
- **Description** : Détermine le mode d'analyse pour le contenu texte brut
  - `basic` : Analyse minimale, traitement rapide
  - `heuristic` : Analyse intelligente avec détection automatique (recommandé)
  - `strict` : Analyse stricte avec règles précises

#### `headingDetection`

- **Type** : `Object`
- **Défaut** : 
  ```json
  {
    "enabled": true,
    "detectAllCaps": true,
    "detectSeparators": true,
    "detectNumbering": true,
    "minLength": 3,
    "maxLength": 100
  }
  ```
- **Description** : Règles de détection automatique des titres

#### `listDetection`

- **Type** : `Object`
- **Défaut** :
  ```json
  {
    "enabled": true,
    "detectBullets": true,
    "detectNumbered": true,
    "preserveIndentation": true,
    "normalizeIndentation": true,
    "indentSize": 2
  }
  ```
- **Description** : Gestion des listes et de l'indentation

### Normalisation

#### `encoding`

- **Type** : `string`
- **Valeurs** : `'utf-8'` | `'latin1'` | `'ascii'`
- **Défaut** : `'utf-8'`
- **Description** : Encodage du texte source

#### `lineBreaks`

- **Type** : `Object`
- **Défaut** :
  ```json
  {
    "normalize": true,
    "target": "unix",
    "removeTrailing": true,
    "maxConsecutive": 2
  }
  ```
- **Description** : Normalisation des sauts de ligne

#### `removeNonAscii`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Supprimer les caractères non-ASCII (optionnel, désactivé par défaut)

#### `tabs`

- **Type** : `Object`
- **Défaut** :
  ```json
  {
    "convertToSpaces": true,
    "tabSize": 2
  }
  ```
- **Description** : Conversion des tabulations

### Rendu

#### `tableOfContents`

- **Type** : `Object`
- **Défaut** :
  ```json
  {
    "enabled": false,
    "depth": 3,
    "position": "top"
  }
  ```
- **Description** : Génération de la table des matières

#### `sectionNumbering`

- **Type** : `Object`
- **Défaut** :
  ```json
  {
    "enabled": false,
    "depth": 3,
    "style": "numeric"
  }
  ```
- **Description** : Numérotation des sections

#### `lineWrap`

- **Type** : `Object`
- **Défaut** :
  ```json
  {
    "enabled": false,
    "maxWidth": 80,
    "hardWrap": false
  }
  ```
- **Description** : Largeur maximale de ligne

### Spécifique au format

#### `markdown`

- **Type** : `Object`
- **Défaut** :
  ```json
  {
    "flavor": "commonmark",
    "gfmExtensions": {
      "tables": true,
      "strikethrough": true,
      "taskLists": true,
      "autolinks": true
    },
    "preserveHtml": false,
    "codeFenceStyle": "backtick"
  }
  ```
- **Description** : Options Markdown

#### `asciidoc`

- **Type** : `Object`
- **Défaut** :
  ```json
  {
    "compatMode": "asciidoctor",
    "attributes": {
      "doctype": "article",
      "toc": "left",
      "numbered": false,
      "sectanchors": true,
      "sectlinks": true
    },
    "safeMode": "safe"
  }
  ```
- **Description** : Options AsciiDoc

### Sécurité

#### `maxFileSize`

- **Type** : `number`
- **Défaut** : `5242880` (5 Mo — aligné sur `MAX_INPUT_SIZE_MB`)
- **Description** : Taille maximale de fichier en octets

#### `conversionTimeout`

- **Type** : `number`
- **Défaut** : `30000` (30 secondes)
- **Description** : Délai d'expiration de conversion en millisecondes

#### `externalResources`

- **Type** : `Object`
- **Défaut** :
  ```json
  {
    "allowExternalLinks": true,
    "allowImages": true,
    "allowScripts": false,
    "allowStyles": true,
    "sandboxMode": false
  }
  ```
- **Description** : Gestion des ressources externes

### Métadonnées

#### `title`

- **Type** : `string | null`
- **Défaut** : `null`
- **Description** : Titre du document

#### `author`

- **Type** : `string | null`
- **Défaut** : `null`
- **Description** : Auteur du document

#### `date`

- **Type** : `string | null`
- **Défaut** : `null`
- **Description** : Date du document (ISO 8601 ou format personnalisé). Si `null`, utilise la date actuelle

#### `language`

- **Type** : `string`
- **Défaut** : `'fr'`
- **Description** : Langue du document (code ISO 639-1 : fr, en, es, etc.)

---

## Options d'encodage

### Objectif

Cette section définit la structure de configuration pour la gestion de l'encodage des caractères pendant la conversion de documents. Elle suit une approche API-first avec des valeurs par défaut sûres et une séparation claire entre l'encodage d'entrée, le traitement interne et l'encodage de sortie.

### Options d'encodage d'entrée

#### `encoding`

- **Type** : `'auto'|'utf-8'|'ascii'|'latin-1'`
- **Défaut** : `'auto'`
- **Description** : Encodage à utiliser pour la lecture du fichier d'entrée
  - `'auto'` : Détection automatique avec priorité UTF-8

#### `autoDetect`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Activer la détection automatique de l'encodage

#### `fallbackToLatin1`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Utiliser Latin-1 comme repli si UTF-8 échoue (uniquement si `autoDetect=true`)
- **Avertissement** : Peut masquer les erreurs d'encodage

### Options d'encodage de sortie

#### `encoding`

- **Type** : `'utf-8'|'ascii'|'latin-1'`
- **Défaut** : `'utf-8'`
- **Description** : Encodage à utiliser pour l'écriture du fichier de sortie

#### `addBOM`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Ajouter un BOM (Byte Order Mark) au début du fichier UTF-8

### Gestion des caractères invalides

#### `strategy`

- **Type** : `'fail'|'replace'|'remove'|'transliterate'`
- **Défaut** : `'replace'`
- **Description** : Stratégie pour gérer les caractères qui ne peuvent pas être représentés dans l'encodage cible
  - **`'fail'`** : Échouer immédiatement avec une erreur explicite (mode strict)
  - **`'replace'`** : Remplacer par un caractère de substitution (recommandé)
  - **`'remove'`** : Supprimer silencieusement (peut altérer le sens)
  - **`'transliterate'`** : Translittération simple (é → e, etc.)

#### `replacementChar`

- **Type** : `string`
- **Défaut** : `'\uFFFD'` (caractère de substitution Unicode standard)
- **Description** : Caractère utilisé pour remplacer les caractères invalides (si `strategy='replace'`)

#### `logInvalidChars`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Journaliser les caractères invalides détectés pour analyse

### Normalisation Unicode

#### `form`

- **Type** : `'none'|'NFC'|'NFKC'`
- **Défaut** : `'NFC'`
- **Description** : Forme de normalisation Unicode
  - **`'none'`** : Aucune normalisation
  - **`'NFC'`** : Forme composée canonique (recommandé)
  - **`'NFKC'`** : Forme composée de compatibilité (plus agressive)

#### `preserveMeaning`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Garantit que la normalisation n'altère pas le sens du contenu

### Nettoyage des caractères

#### `removeControlChars`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Supprimer les caractères de contrôle (0x00-0x1F, sauf \t, \n, \r)

#### `removeDirectionalChars`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Supprimer les caractères directionnels (RTL/LTR)

#### `removeZeroWidthChars`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Supprimer les caractères de largeur nulle (invisibles)

#### `normalizeWhitespace`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Normaliser les espaces multiples en un seul espace

### Mode de traitement

#### `mode`

- **Type** : `'strict'|'tolerant'`
- **Défaut** : `'tolerant'`
- **Description** : Comportement global en cas d'erreur ou d'anomalie
  - **`'strict'`** : Erreur immédiate sur tout problème
  - **`'tolerant'`** : Nettoyage automatique + avertissements

#### `throwOnError`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Lever une erreur immédiate au lieu de continuer

#### `logWarnings`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Journaliser les avertissements pour analyse ultérieure

---

## Options de normalisation avancées

### Objectif

Cette section définit les options de normalisation avancées qui améliorent la cohérence, la stabilité, la compatibilité inter-formats et la sécurité liées aux caractères et à l'encodage.

**Principe fondamental** : Aucune option activée par défaut ne doit altérer le sens du texte.

### Gestion Unicode

#### `mode`

- **Type** : `'full'|'restricted'|'disabled'`
- **Défaut** : `'full'`
- **Description** : Mode de prise en charge Unicode
  - **`'full'`** : Prise en charge complète de tous les caractères Unicode valides (recommandé)
  - **`'restricted'`** : Limité aux plages Unicode spécifiées
  - **`'disabled'`** : Désactive la prise en charge Unicode avancée

#### `normalization`

- **Type** : `'none'|'NFC'|'NFKC'`
- **Défaut** : `'NFC'`
- **Description** : Forme de normalisation Unicode
  - **`'none'`** : Aucune normalisation
  - **`'NFC'`** : Forme composée canonique (recommandé, ne modifie pas le sens)
  - **`'NFKC'`** : Forme composée de compatibilité (plus agressive, peut modifier certains caractères)

#### `detectConfusables`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Détecte les caractères visuellement confusables (par ex. cyrillique vs latin)

#### `confusablesAction`

- **Type** : `'none'|'warn'|'replace'`
- **Défaut** : `'warn'`
- **Description** : Action sur les caractères confusables détectés
  - **`'none'`** : Ne rien faire
  - **`'warn'`** : Avertir uniquement (non destructif, recommandé)
  - **`'replace'`** : Remplacer par un caractère équivalent

### Nettoyage des caractères

#### `removeControlChars`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Supprime les caractères de contrôle invisibles (0x00-0x1F, sauf \t, \n, \r)
- **Note** : Désactivé par défaut pour éviter d'être destructif

#### `removeDirectionalChars`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Supprime les caractères directionnels (marques RTL/LTR)
- **Note** : Désactivé par défaut pour préserver l'affichage

#### `removeNonPrintableChars`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Supprime les caractères non imprimables
- **Note** : Désactivé par défaut pour éviter d'être destructif

#### `preserveWhitespace`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Préserve les espaces essentiels (tabulations, sauts de ligne)

### Translittération et repli

#### `strategy`

- **Type** : `'none'|'simple'|'configurable'`
- **Défaut** : `'none'`
- **Description** : Stratégie de translittération
  - **`'none'`** : Aucune translittération (recommandé par défaut)
  - **`'simple'`** : Translittération simple (é → e)
  - **`'configurable'`** : Stratégie avancée configurable

#### `enableTransliteration`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Active la translittération simple (é → e, ñ → n, etc.)
- **Note** : Désactivé par défaut pour préserver le sens

### Validation du contenu

#### `rejectInvalidSequences`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Rejette les séquences Unicode invalides
- **Note** : Important pour la sécurité et la stabilité. Activé par défaut.

#### `rejectPrivateChars`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Rejette les caractères privés (Private Use Area, 0xE000-0xF8FF)
- **Note** : Peut être légitime dans certains contextes. Désactivé par défaut.

#### `warnOutOfRange`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Signale les caractères hors plage autorisée

#### `allowedRanges`

- **Type** : `Array<{start: number, end: number}>`
- **Défaut** : `[]`
- **Description** : Plages Unicode autorisées (vide = tout sauf Private Use Area)

### Mode de traitement

#### `mode`

- **Type** : `'strict'|'tolerant'`
- **Défaut** : `'tolerant'`
- **Description** : Comportement global en cas d'erreur ou d'anomalie
  - **`'strict'`** : Erreur immédiate sur tout problème
  - **`'tolerant'`** : Nettoyage automatique + avertissements

#### `throwOnError`

- **Type** : `boolean`
- **Défaut** : `false`
- **Description** : Lève une erreur immédiate au lieu de continuer

#### `logWarnings`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Journalise les avertissements pour analyse ultérieure

#### `continueOnWarning`

- **Type** : `boolean`
- **Défaut** : `true`
- **Description** : Continue le traitement malgré les avertissements

### Garanties de non-destructivité

Les options par défaut garantissent que :

- ✅ La normalisation NFC ne modifie pas le sens (uniquement la représentation)
- ✅ Le nettoyage est désactivé par défaut
- ✅ La translittération est désactivée par défaut
- ✅ Les avertissements sont utilisés plutôt que des modifications automatiques
- ✅ La validation rejette uniquement les séquences invalides (sécurité)

**Important** : L'activation du nettoyage ou de la translittération peut altérer le sens. Toujours vérifier avec `checkOptionsSafety()` avant d'activer ces options.

---

## Statut canonique

Ce document est **canonique** et constitue la source de vérité pour :
- Les limites de ressources par défaut
- Les valeurs maximales autorisées
- Les mécanismes d'application
- Les politiques de dégradation
- Les exigences de contenu des journaux
- Les spécifications de format des journaux
- Les politiques de rétention
- Les exigences de sécurité
- La structure des répertoires
- Les règles de validation des chemins
- Les exigences de stockage
- Le schéma des variables d'environnement
- Les règles de validation
- Les fonctionnalités de sécurité
- Les structures d'options de conversion
- La configuration d'encodage
- Les options de normalisation avancées

Toute modification de la configuration doit d'abord être reflétée ici, puis propagée vers le code d'implémentation.
