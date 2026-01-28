
# Ascend

![Version](https://img.shields.io/badge/version-0.0.1.3_Rise-orange)
![Status](https://img.shields.io/badge/status-alpha-red)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.17.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Dernières modifications (0.0.1.3 Rise)

- **UI (frontend)**
  - Le header a été simplifié (logo seul) et sa hauteur stabilisée.
  - Le logo a été agrandi (tests de rendu) tout en gardant un header compact.
  - Le footer affiche la **version automatiquement** depuis `api/frontend/package.json` et inclut un **Copyleft**.
- **Conversion AsciiDoc → Markdown**
  - En cas d’échec de conversion (retour AsciiDoc au lieu de Markdown), une **fenêtre (modal)** s’affiche pour demander de **modifier la source** puis de **relancer** la conversion.
- **Documentation**
  - Tri du dossier `doc/` pour ne garder à la racine que l’essentiel (`README.md`, `changelog.md`).
  - Fusion de `doc/DOCUMENTATION.md` dans `doc/README.md` (la doc complète est désormais dans `doc/README.md`).
  - Déplacement du glossaire vers `doc/references/glossary.md`.

## Présentation

Ascend est un système de conversion de documents en phase alpha. Il exécute des conversions entre formats déclarés via des modules isolés (wrappers) qui respectent un contrat d'interface strict. Chaque conversion s'exécute dans un environnement temporaire unique, avec validation explicite des entrées et journalisation structurée.

Le projet privilégie la rigidité contractuelle, la sécurité passive et la cohérence interne plutôt que la commodité ou la tolérance aux comportements flous.

## Ce que ce projet est

Ascend est un pipeline de conversion qui :

- Exécute des conversions entre formats explicitement déclarés
- Utilise des wrappers isolés (modules) qui respectent un contrat d'interface uniforme
- Orchestre les conversions via un orchestrateur linéaire déterministe
- Valide strictement toutes les entrées avant traitement
- Génère des logs structurés pour chaque conversion
- Gère la configuration via une couche centralisée (EnvMap, en cours d'intégration)
- Échoue explicitement lorsque les conditions ne sont pas remplies

## Ce que ce projet n'est pas

Ascend n'est pas :

- Un convertisseur universel : seuls les formats explicitement déclarés sont supportés
- Un système de détection magique : les formats doivent être explicitement fournis
- Un système tolérant : tout comportement flou est rejeté
- Un produit prêt pour la production : le projet est en alpha, l'architecture n'est pas figée
- Un système user-friendly : l'échec explicite est préféré à la tolérance implicite
- Un système avec API publique stable : l'API interne est instable et peut changer

## Philosophie générale

### Déterminisme

Chaque conversion suit un chemin explicite et prévisible. Aucune heuristique implicite, aucune détection automatique non déclarée.

### Échec explicite

Le système échoue immédiatement et explicitement lorsque :
- Un format n'est pas déclaré
- Une validation échoue
- Un chemin de conversion n'existe pas
- Une ressource est indisponible

Aucune tentative de "récupération gracieuse" ou de "fallback silencieux".

### Rigidité contractuelle

Tous les modules respectent un contrat d'interface strict (`modules.interface.md`). Aucune déviation n'est tolérée. Un module qui ne respecte pas le contrat est rejeté.

### Traçabilité

Chaque conversion génère :
- Un identifiant unique
- Un dossier temporaire dédié
- Des logs structurés (JSON)
- Des métriques de durée
- Un statut final explicite (succès ou échec)

### Comportement prévisible

Aucun comportement magique, aucune inférence implicite. Tous les chemins d'exécution sont explicites et documentés.

### Traitement hostile des entrées

Toutes les entrées sont considérées comme potentiellement malveillantes jusqu'à validation explicite :
- Validation des chemins (pas de `..`, pas de symlinks)
- Validation des types MIME
- Validation des tailles de fichiers
- Validation des formats déclarés
- Validation des encodages

## Architecture

### Vue simplifiée

```
Requête utilisateur
    ↓
Orchestrateur principal (main-orchestrator)
    ├─ Validation initiale
    ├─ Contrôle de charge
    ├─ Détermination du chemin de conversion
    └─ Délégation à l'orchestrateur d'exécution
         ↓
Orchestrateur d'exécution (execution-orchestrator)
    ├─ Création du dossier temporaire unique
    ├─ Exécution séquentielle des étapes
    └─ Appel des wrappers via l'orchestrateur de converters
         ↓
Orchestrateur de converters (converter-orchestrator)
    ├─ Identification du converter approprié
    ├─ Chargement différé (lazy loading)
    └─ Exécution du wrapper
         ↓
Wrapper (downdoc, pandoc, text2markdown, etc.)
    ├─ Validation des entrées
    ├─ Conversion isolée
    └─ Retour d'un objet standardisé
```

### Converters comme wrappers isolés

Chaque converter est un module isolé qui :
- Respecte le contrat `modules.interface.md`
- Déclare explicitement ses formats supportés (`from` / `to`)
- Expose une méthode `run(inputPath, outputPath, options)`
- Retourne un objet standardisé : `{ success, logs, error, duration }`
- S'exécute dans un contexte isolé (dossier temporaire unique)

### Orchestrateur comme chef d'orchestre linéaire

L'orchestrateur :
- Détermine le chemin de conversion (direct ou via format intermédiaire)
- Exécute les étapes séquentiellement
- Gère les fichiers intermédiaires
- Nettoie les ressources temporaires
- Retourne un résultat standardisé

### Couche de configuration contrôlée

EnvMap (en cours d'intégration) centralise et valide l'accès aux variables d'environnement :
- Schéma statique des clés autorisées
- Validation des types et bornes
- Normalisation des chemins
- Aucun accès direct à `process.env` autorisé

## Contrats et invariants

Les règles suivantes sont non négociables :

### Règles des converters

- Un converter ne modifie jamais le fichier d'entrée
- Un converter n'écrit jamais hors du `outputPath` fourni
- Un converter retourne toujours un objet standardisé : `{ success, logs, error, duration }`
- Un converter ne lit jamais `process.env` directement (utilise EnvMap)
- Un converter n'accède jamais au système en dehors des chemins fournis
- Un converter ne tente jamais une conversion hors de ses formats déclarés
- Un converter ne génère jamais de logs contenant des données brutes utilisateur

### Règles de l'orchestrateur

- L'orchestrateur crée toujours un dossier temporaire unique par conversion
- L'orchestrateur nettoie toujours les ressources temporaires, même en cas d'erreur
- L'orchestrateur valide toujours les formats avant d'exécuter une conversion
- L'orchestrateur rejette toujours une conversion si aucun chemin n'existe
- L'orchestrateur ne tente jamais de "deviner" un format manquant

### Règles de journalisation

- Chaque conversion génère un identifiant unique
- Chaque conversion génère un fichier de log JSON structuré
- Aucun log ne contient de données brutes utilisateur
- Tous les logs sont écrits dans un dossier contrôlé (`api/logs`)
- Les logs sont accessibles via l'API (`/api/logs/:conversionId`)

### Règles de sécurité

- Tous les chemins sont validés (pas de `..`, pas de symlinks)
- Tous les types MIME sont validés
- Toutes les tailles de fichiers sont plafonnées
- Tous les formats sont validés contre une whitelist
- Aucun accès réseau n'est autorisé pendant une conversion
- Aucun accès au système en dehors des chemins fournis

## Formats actuellement supportés

Seuls les couples suivants sont réellement fonctionnels :

- **AsciiDoc → Markdown** : Via le wrapper `downdoc`
- **Markdown → AsciiDoc** : Via le wrapper `pandoc`
- **Texte brut → Markdown** : Via le wrapper `text2markdown`

### Limitations explicites

- Seules les capacités déclarées sont autorisées
- Aucune conversion implicite n'est tentée
- Aucune détection automatique de format n'est effectuée
- Les autres formats (HTML, PDF, YAML, JSON, etc.) ne sont pas supportés actuellement

### Modules non fonctionnels

Les modules suivants sont des placeholders non fonctionnels :
- `panwriter` : Retourne `success: false` avec message d'erreur
- `docverter` : Retourne `success: false` avec message d'erreur

Ces modules peuvent être ajoutés dans une version future, mais aucune promesse n'est faite.

## Journalisation et traçabilité

### Identifiant de conversion

Chaque conversion reçoit un identifiant unique (UUID) qui permet de :
- Suivre la conversion dans les logs
- Accéder aux logs structurés via l'API
- Corréler les événements d'une même conversion

### Dossier temporaire unique

Chaque conversion s'exécute dans un dossier temporaire unique :
- Création au début de la conversion
- Nettoyage systématique à la fin (même en cas d'erreur)
- Isolation complète entre conversions

### Logs structurés

Chaque conversion génère un fichier JSON dans `api/logs/` contenant :
- Identifiant de conversion
- Horodatage de début et de fin
- Ordre d'exécution des modules
- Fichiers d'entrée et de sortie de chaque étape
- Durée d'exécution de chaque module
- Statut final (succès ou échec)
- Messages de logs détaillés (sans données utilisateur)

### Métriques de durée

Chaque conversion enregistre :
- Durée totale de la conversion
- Durée d'exécution de chaque module
- Durée de chaque étape du pipeline

### Statut final explicite

Chaque conversion se termine avec un statut explicite :
- `success: true` : Conversion réussie
- `success: false` : Conversion échouée (avec message d'erreur détaillé)

Aucun statut ambigu ou partiel n'est retourné.

## État actuel du projet

### Alpha : signification concrète

Le statut "alpha" signifie ici :

- **Architecture en cours de cristallisation** : La structure interne peut changer sans préavis
- **Contrats encore susceptibles d'évoluer** : L'interface des modules peut être modifiée
- **Sécurité partielle mais intentionnelle** : Des mesures de sécurité sont en place, mais elles ne sont pas exhaustives
- **API interne instable** : Les endpoints internes peuvent changer entre versions
- **Documentation en cours de réorganisation** : La documentation est en train d'être structurée et traduite

### Ce qui est stable

- Le contrat d'interface des modules (`modules.interface.md`)
- Le format de retour standardisé des modules
- Le principe d'isolation par conversion
- Le principe de validation stricte des entrées

### Ce qui peut changer

- La structure interne de l'orchestrateur
- Les chemins d'API internes
- La structure des logs
- Les mécanismes de sécurité (ajouts, modifications)
- La couche de configuration (EnvMap en cours d'intégration)

## Avertissement honnête

### Échec explicite par design

Le système échoue explicitement par design. Il ne tente pas de "récupérer gracieusement" ou de "deviner" les intentions. Si une condition n'est pas remplie, la conversion échoue immédiatement avec un message d'erreur explicite.

### Rejet des comportements flous

Tout comportement flou est rejeté :
- Format non déclaré → Échec
- Validation échouée → Échec
- Chemin de conversion inexistant → Échec
- Ressource indisponible → Échec

Aucune tentative de "fallback" ou de "récupération" n'est effectuée.

### Aucune indulgence prévue

Le système n'est pas conçu pour être "tolérant" ou "user-friendly". Il privilégie :
- La cohérence interne à l'adoption
- La rigidité à la commodité
- L'échec explicite à la réussite vague
- La traçabilité à la simplicité

### Conséquences pour les utilisateurs

Les utilisateurs doivent :
- Fournir explicitement les formats source et cible
- Respecter les contraintes de validation
- Accepter que le système échoue explicitement lorsque les conditions ne sont pas remplies
- Ne pas s'attendre à des comportements "magiques" ou "intelligents"

## Installation

### Prérequis

- Node.js >= 16.17.0
- Pandoc installé et accessible dans le PATH
- Permissions d'écriture pour `api/backend/tmp` et `api/logs`

### Installation des dépendances

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
- Les permissions d'écriture

## Démarrage

### Backend

```bash
cd api/backend
npm start
```

Le serveur démarre sur `http://localhost:3003`.

### Frontend

```bash
cd api/frontend
npm run dev
```

L'interface démarre sur `http://localhost:5173`.

## Utilisation

### Conversion via l'interface

1. Sélectionner le format source (AsciiDoc, Markdown)
2. Sélectionner le format cible (Markdown ou AsciiDoc)
3. Saisir ou coller le contenu à convertir
4. Cliquer sur "Convertir"

**Important** : Seules les conversions AsciiDoc ↔ Markdown sont fonctionnelles.

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

**Important** : L'API interne est instable et peut changer sans préavis.

### Consultation des logs

```bash
GET /api/logs/:conversionId
```

Retourne le log JSON structuré de la conversion.

## Documentation

La documentation est organisée dans le dossier `doc/` :

- **Spécifications** : Contrats d'interface, spécifications des modules
- **Références** : Références canoniques (formats, configuration, sécurité)
- **Guides** : Guides d'intégration et de sécurité

## Licence

Ascend est actuellement publié sous licence MIT pendant sa phase alpha (v0.x).

Le modèle de licence du projet peut évoluer dans les versions majeures futures (v1.x et au-delà), incluant la possibilité d'un cœur propriétaire ou d'une double licence.

Voir le fichier [LICENSE](LICENSE) pour le texte complet de la licence.
