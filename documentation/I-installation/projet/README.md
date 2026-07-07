# Ascend

![Version](https://img.shields.io/badge/version-0.0.1.7-orange)
![Status](https://img.shields.io/badge/status-alpha-red)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.17.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Dernières modifications (v0.0.1.7)

- **UX & CI**
  - Modale d'erreur de conversion avec `error.code`, indice et identifiant de requête.
  - Porte de build Docker frontend (`check:docker:frontend`) dans la CI.
  - Le pied de page affiche la limite de taille de la source ; arrière-plan Rafale plus visible.

## Vue d'ensemble

Ascend est un système de conversion de documents en phase alpha. Il effectue des conversions entre formats déclarés via des modules isolés (wrappers) qui respectent un contrat d'interface strict. Chaque conversion s'exécute dans un environnement temporaire unique, avec une validation explicite des entrées et une journalisation structurée.

Le projet privilégie la rigueur contractuelle, la sécurité passive et la cohérence interne plutôt que la commodité ou la tolérance aux comportements ambigus.

## Ce qu'est ce projet

Ascend est un pipeline de conversion qui :

- Exécute des conversions entre formats explicitement déclarés
- Utilise des wrappers isolés (modules) qui respectent un contrat d'interface uniforme
- Orchestre les conversions via un orchestrateur déterministe et linéaire
- Valide strictement toutes les entrées avant traitement
- Produit des journaux structurés pour chaque conversion
- Gère la configuration via une couche centralisée (EnvMap, en cours d'intégration)
- Échoue explicitement lorsque les conditions ne sont pas remplies

## Ce que ce projet n'est pas

Ascend n'est pas :

- Un convertisseur universel (seuls les formats explicitement déclarés sont pris en charge)
- Un système de « détection magique » (les formats doivent être fournis explicitement)
- Un système tolérant (les comportements ambigus sont rejetés)
- Prêt pour la production (le projet est en alpha ; l'architecture n'est pas figée)
- « Convivial » par conception (l'échec explicite est préféré à la tolérance implicite)
- Une API publique stable (les points d'accès internes peuvent changer)

## Philosophie générale

### Déterminisme

Chaque conversion suit un chemin explicite et prévisible. Pas d'heuristiques implicites, pas de détection automatique non déclarée.

### Échec explicite

Le système échoue immédiatement et explicitement lorsque :

- Un format n'est pas déclaré
- Une validation échoue
- Un chemin de conversion n'existe pas
- Une ressource est indisponible

Pas de tentatives de « récupération gracieuse » ni de « repli silencieux ».

### Rigueur contractuelle

Tous les modules doivent respecter un contrat d'interface strict (`modules.interface.md`). Aucune déviation n'est tolérée. Un module qui viole le contrat est rejeté.

### Traçabilité

Chaque conversion produit :

- Un identifiant unique
- Un dossier temporaire dédié
- Des journaux structurés (JSON)
- Des métriques de durée
- Un statut final explicite (succès ou échec)

### Comportement prévisible

Pas de « magie », pas d'inférence implicite. Tous les chemins d'exécution sont explicites et documentés.

### Posture face aux entrées hostiles

Toutes les entrées sont considérées comme potentiellement malveillantes jusqu'à validation explicite :

- Validation des chemins (pas de `..`, pas de liens symboliques)
- Validation MIME
- Limites de taille de fichier
- Validation du format déclaré
- Validation de l'encodage

## Architecture

### Vue simplifiée

```
User request
    ↓
Main orchestrator (main-orchestrator)
    ├─ Initial validation
    ├─ Load control
    ├─ Conversion path determination
    └─ Delegation to the execution orchestrator
         ↓
Execution orchestrator (execution-orchestrator)
    ├─ Create a unique temporary directory
    ├─ Sequential step execution
    └─ Wrapper calls via the converter orchestrator
         ↓
Converter orchestrator (converter-orchestrator)
    ├─ Identify the appropriate converter
    ├─ Lazy loading
    └─ Execute the wrapper
         ↓
Wrapper (downdoc, pandoc, text2markdown, etc.)
    ├─ Input validation
    ├─ Isolated conversion
    └─ Standardized return object
```

### Les convertisseurs comme wrappers isolés

Chaque convertisseur est un module isolé qui :

- Respecte le contrat `modules.interface.md`
- Déclare explicitement les formats pris en charge (`from` / `to`)
- Expose `run(inputPath, outputPath, options)`
- Retourne un objet standardisé : `{ success, logs, error, duration }`
- S'exécute dans un contexte isolé (dossier temporaire unique)

### L'orchestrateur comme chef d'orchestre déterministe

L'orchestrateur :

- Détermine le chemin de conversion (direct ou via un format intermédiaire)
- Exécute les étapes de manière séquentielle
- Gère les fichiers intermédiaires
- Nettoie les ressources temporaires
- Retourne un résultat standardisé

### Couche de configuration contrôlée

EnvMap (en cours d'intégration) centralise et valide l'accès aux variables d'environnement :

- Schéma statique des clés autorisées
- Validation des types et des bornes
- Normalisation des chemins
- Pas d'accès direct à `process.env` dans les zones durcies

## Contrats et invariants

Les règles suivantes sont non négociables.

### Règles des convertisseurs

- Un convertisseur ne modifie jamais le fichier d'entrée
- Un convertisseur n'écrit jamais en dehors du `outputPath` fourni
- Un convertisseur retourne toujours `{ success, logs, error, duration }`
- Un convertisseur ne doit pas lire `process.env` directement (utiliser EnvMap / couche de configuration)
- Un convertisseur ne doit pas accéder au système en dehors des chemins fournis
- Un convertisseur ne doit pas tenter de conversions en dehors des formats déclarés
- Un convertisseur ne doit pas émettre de journaux contenant le contenu brut de l'utilisateur

### Règles de l'orchestrateur

- Crée toujours un dossier temporaire unique par conversion
- Nettoie toujours les ressources temporaires, même en cas d'erreur
- Valide toujours les formats avant d'exécuter la conversion
- Rejette toujours la conversion lorsqu'aucun chemin n'existe
- Ne « devine » jamais un format manquant

### Règles de journalisation

- Chaque conversion génère un identifiant unique
- Chaque conversion génère un fichier de journal JSON structuré
- Les journaux ne doivent pas contenir le contenu brut de l'utilisateur
- Les journaux sont écrits dans un dossier contrôlé (`api/logs`)
- Les journaux sont accessibles via l'API (`/api/logs/:conversionId`)

### Règles de sécurité

- Tous les chemins sont validés (pas de `..`, pas de liens symboliques)
- Tous les types MIME sont validés
- Toutes les tailles de fichier sont plafonnées
- Tous les formats sont validés par rapport à une liste blanche
- Restriction réseau stricte : **prévue** (pas entièrement appliquée en v0.0.1.5)
- Pas d'accès au système en dehors des chemins fournis

## Formats actuellement pris en charge

Seules les paires suivantes sont connues pour être fonctionnelles :

- **AsciiDoc → Markdown** : via `downdoc`
- **Markdown → AsciiDoc** : via `pandoc`
- **Texte brut → Markdown** : via `text2markdown`

### Limitations explicites

- Seules les capacités déclarées sont autorisées
- Aucune conversion implicite n'est tentée
- Aucune détection automatique de format n'est effectuée
- Les autres formats (HTML, PDF, YAML, JSON, etc.) ne sont actuellement pas pris en charge

### Modules non fonctionnels

Les modules suivants sont des stubs de remplacement :

- `panwriter` : retourne `success: false` avec un message d'erreur
- `docverter` : retourne `success: false` avec un message d'erreur

Ils pourront être implémentés dans une version ultérieure ; aucune promesse n'est faite.

## Installation

### Prérequis

- Node.js >= 16.17.0
- Pandoc installé et disponible dans le PATH
- Droits d'écriture pour `api/backend/tmp` et `api/logs`

### Installer les dépendances

```bash
# Backend
cd api/backend
npm install

# Frontend
cd api/frontend
npm install
```

### Vérification de l'environnement

```bash
cd api/backend
node bin/check-env.js
```

Ce script vérifie :

- La version de Node.js
- L'installation de Pandoc
- Les droits d'écriture

## Développement

Lancez le frontend et le backend en une seule commande depuis la racine du dépôt.

### Prérequis

- Node.js >= 16.17.0

### Installation (racine)

```bash
npm i
```

Cela installe les dépendances racine (y compris `concurrently`). Les dépendances des sous-projets (`api/frontend`, `api/backend`) doivent toujours être installées séparément (voir Installation) avant la première utilisation.

### Démarrage

```bash
npm run dev
# ou
npm run dev:all
```

Démarre le frontend (Vite) et le backend (Node) en parallèle.

### Commandes séparées

```bash
npm run dev:front   # frontend uniquement (api/frontend)
npm run dev:back    # backend uniquement (api/backend)
```

## Exécution

### Backend

```bash
cd api/backend
npm start
```

Le backend écoute sur `http://localhost:3003`.

### Frontend

```bash
cd api/frontend
npm run dev
```

Le frontend écoute sur `http://localhost:5173`.

## Utilisation

### Conversion via l'interface

1. Sélectionnez le format source (AsciiDoc, Markdown)
2. Sélectionnez le format cible (Markdown ou AsciiDoc)
3. Saisissez ou collez le contenu à convertir
4. Cliquez sur « Convertir »

**Important** : seules les conversions AsciiDoc ↔ Markdown sont fonctionnelles.

### Conversion via l'API

```bash
POST /api/convert
Content-Type: application/json

{
  "text": "...",
  "from": "asciidoc",
  "to": "markdown",
  "options": {}
}
```

**Important** : l'API interne est instable et peut changer sans préavis.

### Lecture des journaux

```bash
GET /api/logs/:conversionId
```

Retourne le journal JSON structuré de la conversion.

## Docker

Exécutez l'application avec Docker Compose : voir [DOCKER.md](DOCKER.md).

```bash
docker compose up --build
```

URL par défaut : `https://<IP>`  
HTTP (`http://<IP>`) est redirigé vers HTTPS.

Si les ports 80/443 ne sont pas disponibles localement, utilisez par exemple `8080:80` et `8443:443` dans `docker-compose.yml`, puis ouvrez `https://<IP>:8443`.

### Ressource statique optionnelle

Pour l'image d'arrière-plan personnalisée, placez `rafale.jpg` dans `api/backend/public/`.  
Elle sera servie à `/public/rafale.jpg`.

## Documentation

La documentation se trouve sous `doc/` :

- **Spécifications** : contrats d'interface, spécifications des modules
- **Références** : références canoniques (formats, configuration, sécurité)
- **Guides** : guides d'intégration et de sécurité

## Licence

Ascend est actuellement publié sous licence MIT pendant sa phase alpha (v0.x).

Le modèle de licence pourra évoluer dans les futures versions majeures (v1.x et au-delà), y compris la possibilité d'un noyau propriétaire ou d'une double licence.

Voir [LICENSE](LICENSE) pour le texte complet.
