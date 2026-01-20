# 🚀 Ascend - Pipeline de Conversion Documentaire Modulaire et Sécurisé

Application web moderne et sécurisée pour la conversion de documents. Version alpha supportant actuellement les conversions AsciiDoc ↔ Markdown, avec une architecture modulaire préparée pour l'ajout futur d'autres formats. Pipeline de conversion isolé et système de lazy loading pour optimiser les performances.

![Version](https://img.shields.io/badge/version-0.0.1.2.2-orange)
![Status](https://img.shields.io/badge/status-alpha-red)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.17.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 À propos du projet

**Ascend** est une application web moderne et sécurisée pour la conversion de documents. Actuellement en version alpha, l'application supporte les conversions AsciiDoc ↔ Markdown, avec une architecture modulaire préparée pour l'ajout futur d'autres formats (HTML, PDF, YAML, JSON, TXT, etc.). Le projet se distingue par son architecture modulaire, son pipeline de conversion sécurisé avec isolation stricte, et son système de lazy loading pour optimiser la consommation mémoire.

### Objectifs du projet

- **Conversion multi-formats** : Support actuel des conversions AsciiDoc ↔ Markdown, avec architecture préparée pour l'ajout futur d'autres formats
- **Sécurité par conception** : Architecture sécurisée avec isolation stricte des conversions, validation exhaustive des entrées, contrôle de ressources, et protection contre les abus
- **Interface intuitive** : Interface utilisateur moderne avec navigation dans les documents, options de conversion avancées, et expérience utilisateur optimisée
- **Pipeline modulaire** : Architecture modulaire avec système de lazy loading permettant l'intégration facile de nouveaux modules de conversion
- **Fiabilité** : Gestion robuste des erreurs, timeouts, dégradation contrôlée en cas de surcharge, et journalisation sécurisée

### Caractéristiques principales

- ✅ **Isolation stricte** : Chaque conversion s'exécute dans un environnement isolé et temporaire unique
- ✅ **Validation exhaustive** : Validation des chemins, types MIME, formats, et tailles de fichiers
- ✅ **Contrôle de ressources** : Limites strictes sur CPU, mémoire, et temps d'exécution par conversion
- ✅ **Détection d'anomalies** : Surveillance des comportements anormaux et tentatives d'accès non autorisés
- ✅ **Journalisation sécurisée** : Logs structurés pour audit et traçabilité sans exposer de données utilisateur
- ✅ **Dégradation contrôlée** : Refus intelligent de nouvelles conversions en cas de surcharge système
- ✅ **Lazy loading** : Chargement différé des modules de conversion pour réduire la consommation mémoire
- ✅ **Interface modulaire** : Contrat d'interface uniforme pour tous les modules de conversion

## 📋 Table des matières

- [À propos du projet](#-à-propos-du-projet)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Démarrage](#-démarrage)
- [Utilisation](#-utilisation)
- [Architecture](#-architecture)
- [API](#-api)
- [Documentation](#-documentation)
- [Développement](#-développement)
- [Structure du projet](#-structure-du-projet)
- [Sécurité](#-sécurité)
- [Contribuer](#-contribuer)
- [License](#-license)

## ✨ Fonctionnalités

### Conversion de documents

- **Conversion bidirectionnelle** : AsciiDoc ↔ Markdown avec support complet
- **Formats disponibles** : 
  - ✅ **AsciiDoc → Markdown** : Conversion via downdoc avec support BookStack/Parsedown
  - ✅ **Markdown → AsciiDoc** : Conversion via Pandoc
  - ⏳ **Autres formats** : HTML, PDF, YAML, JSON, TXT (coming soon - visibles mais non disponibles)
- **Limitation actuelle** : Seules les conversions AsciiDoc ↔ Markdown sont fonctionnelles dans cette version alpha. Les autres formats sont visibles dans l'interface mais marqués comme "coming soon"
- **Orchestration centralisée** : Module orchestrateur qui identifie automatiquement le converter approprié selon les formats
- **Conversion sécurisée** : Système de tokens de confirmation pour les conversions sensibles
- **Modes de conversion** : 
  - Mode standard pour conversions classiques
  - Mode BookStack/Parsedown compatible pour intégration avec BookStack
- **Conversion en temps réel** : Résultats instantanés avec indicateur de progression
- **Lazy loading des modules** : Chargement différé des converters pour optimiser la mémoire
- **Normalisation automatique des données** : Proxy qui supprime les BOM, normalise l'encodage UTF-8, et remplace les Smart Quotes avant conversion
- **Traitement en lot** : Service frontend pour convertir plusieurs fichiers en une seule opération avec suivi de progression
- **Diagnostic d'environnement** : Script de pré-vérification pour valider l'installation (Pandoc, permissions, Node.js)

### Interface utilisateur

- **Interface moderne** : Design épuré avec effet glassmorphism et animations fluides
- **Navigation dans le document** : 
  - Fenêtre flottante avec affichage hiérarchique des chapitres et sections
  - Extraction automatique des titres depuis le contenu source
  - Navigation directe vers les sections par clic
  - Fenêtre déplaçable, redimensionnable, minimisable et maximisable
- **Options de conversion** : Panneau d'options compact et organisé avec sections :
  - **Analyse du contenu** : Mode d'analyse, détection automatique des titres/listes
  - **Normalisation** : Encodage, Unicode, nettoyage des caractères, détection des confusables
  - **Rendu documentaire** : Table des matières, numérotation, gestion des retours à la ligne
  - **Métadonnées** : Titre, auteur, langue
  - **Options spécifiques par format** : Flavor Markdown, mode de compatibilité
- **Compteurs de texte** : Affichage en temps réel du nombre de caractères, mots et lignes dans les panneaux source et résultat
- **Indicateur de progression** : Animation visuelle pendant les conversions avec barre de progression et spinner
- **Notifications toast** : Système de notifications avec icônes (succès ✓, erreur ✕), fermeture automatique après 5 secondes, et fermeture manuelle
- **Raccourcis clavier** :
  - `Ctrl+S` : Télécharger/Sauvegarder le résultat
  - `Ctrl+Enter` : Lancer la conversion
  - `Ctrl+K` : Effacer le contenu source
  - `Ctrl+/` : Afficher l'aide des raccourcis clavier
- **Historique des conversions** : 
  - Sauvegarde automatique dans localStorage
  - Affichage dans un panneau dédié
  - Restauration des conversions précédentes
  - Effacement de l'historique

### Gestion de fichiers

- **Import de fichiers** : 
  - Support pour fichiers individuels (sélecteur de fichier)
  - Import de dossiers complets avec navigation dans les fichiers
- **Sélection de fichiers** : Sélecteur pour naviguer dans les fichiers importés
- **Mode édition avec confirmation** : 
  - Édition sécurisée des résultats avec modales de confirmation
  - Sauvegarde du contenu original avant édition
  - Restauration automatique en cas d'annulation
- **Sauvegarde/Annulation** : Système de sauvegarde avec restauration automatique
- **Export de fichiers** : 
  - Téléchargement des résultats avec nom de fichier personnalisé
  - Extension automatique selon le format de sortie
- **Copie rapide** : Bouton de copie pour les résultats avec feedback visuel
- **Effacement** : Boutons pour effacer le contenu source ou résultat avec confirmation

### Sécurité et fiabilité

- **Isolation stricte** : Chaque conversion s'exécute dans un dossier temporaire unique et isolé
- **Validation exhaustive** : 
  - Validation des chemins (protection path traversal, symlinks interdits)
  - Validation du type réel de fichier (MIME type)
  - Validation des formats et tailles de fichiers
- **Contrôle de ressources** : 
  - Limite de conversions simultanées (configurable, défaut: 5)
  - Budget global par conversion (CPU, mémoire, temps)
  - Surveillance continue et interruption en cas de dépassement
- **Détection d'anomalies** : 
  - Détection des tentatives d'accès non autorisés
  - Détection des profils d'exécution anormaux
  - Journalisation de toutes les anomalies
- **Gestion d'erreurs robuste** : 
  - Capture exhaustive des erreurs sans crash global du backend
  - Transformation des erreurs en échecs contrôlés
  - Messages d'erreur sécurisés sans détails système sensibles
- **Timeouts** : Protection contre les conversions trop longues
- **Journalisation sécurisée** : 
  - Logs structurés avec ID de conversion unique
  - Aucune donnée utilisateur dans les logs
  - Traçabilité complète pour audit
- **Dégradation contrôlée** : 
  - Refus intelligent de nouvelles conversions en cas de surcharge
  - Surveillance du taux d'échec
  - Protection contre la surcharge système
- **Vérification d'intégrité** : Contrôle de l'intégrité des modules au démarrage
- **Système de tokens de confirmation** : 
  - Génération de tokens sécurisés pour les conversions sensibles
  - Validation et consommation des tokens
  - Principe de non-confiance backend/frontend

## 🛠 Technologies

### Backend

- **Node.js** : Runtime JavaScript (version 16.17.0 ou supérieure)
- **Express.js** : Framework web pour l'API REST
- **downdoc** : Bibliothèque JavaScript native pour conversion AsciiDoc → Markdown
- **Pandoc** : Outil de conversion universel de documents pour Markdown → AsciiDoc et HTML → autres formats
- **text2markdown** : Module de conversion texte brut → Markdown avec détection automatique
- **CORS** : Gestion des requêtes cross-origin
- **Modules de conversion modulaires** : 
  - Système de lazy loading pour chargement différé
  - Interface uniforme pour tous les modules
  - Support pour downdoc, pandoc, text2markdown, docverter, panwriter

### Frontend

- **React 18** : Bibliothèque UI moderne
- **TypeScript** : Typage statique pour la robustesse du code
- **Vite** : Build tool moderne et serveur de développement rapide
- **CSS3** : Styles modernes avec effets visuels avancés (glassmorphism, animations)

### Architecture

- **Pipeline de conversion sécurisé** : Architecture basée sur [PIPELINE.md](doc/specifications/PIPELINE.md)
- **Modules de conversion** : Interface uniforme définie dans [modules.interface.md](doc/specifications/modules.interface.md)
- **Lazy loading** : Gestionnaire centralisé pour chargement différé des modules
- **Sécurité du pipeline** : Module de sécurité implémentant les règles de [PIPELINE.md](doc/specifications/PIPELINE.md)

## 📦 Prérequis

- **Node.js** : Version 16.17.0 ou supérieure
- **npm** : Gestionnaire de paquets (inclus avec Node.js)
- **Pandoc** (requis pour certaines conversions) : Pour les conversions Markdown → AsciiDoc et HTML → autres formats
  - Téléchargement : https://pandoc.org/installing.html
  - Vérifier l'installation : `pandoc --version`
  - Note : Les conversions AsciiDoc → Markdown utilisent downdoc (bibliothèque JavaScript native) et ne nécessitent pas Pandoc

## 🔧 Installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/Kira-Torvaldson/ASCEND.git
cd ASCEND
```

2. **Installer safe-npm** (recommandé pour la sécurité)
```bash
npm install -g safe-npm
```

3. **Installer les dépendances du backend**
```bash
cd api/backend
npm install
```

4. **Installer les dépendances du frontend**
```bash
cd ../frontend
npm install
```

## 🚀 Démarrage

### Vérification de l'environnement (recommandé)

Avant de démarrer le serveur, il est recommandé de vérifier que l'environnement est correctement configuré :

```bash
cd api/backend
node bin/check-env.js
```

Ce script vérifie :
- ✅ Version de Node.js (>= 16.17.0)
- ✅ Installation de Pandoc et accessibilité
- ✅ Permissions d'écriture sur les répertoires requis

### Démarrage en mode développement

**Terminal 1 - Backend :**
```bash
cd api/backend
npm start
# ou pour le mode développement avec rechargement automatique
npm run dev
```

Le backend sera accessible sur `http://localhost:3003`

**Terminal 2 - Frontend :**
```bash
cd api/frontend
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

### Démarrage en mode production

**Backend :**
```bash
cd api/backend
npm start
```

**Frontend :**
```bash
cd api/frontend
npm run build
npm run preview
```

## 💻 Utilisation

### Interface principale

1. **Ouvrir l'application** : `http://localhost:5173`

2. **Sélection des formats** :
   - Utilisez les menus déroulants pour choisir le format source et de destination
   - Formats disponibles dans l'interface : AsciiDoc, Markdown, HTML, PDF, YAML, JSON, TXT (seuls AsciiDoc ↔ Markdown sont fonctionnels)
   - Cliquez sur les flèches ↔️ pour inverser les formats

3. **Conversion** :
   - Entrez ou importez du contenu dans le panneau source
   - Cliquez sur "Convertir" ou utilisez `Ctrl+Enter`
   - Un indicateur de progression s'affiche pendant la conversion
   - Le résultat apparaît dans le panneau de destination

### Fonctionnalités avancées

4. **Import de fichiers** :
   - 📄 **Fichier unique** : Cliquez sur le bouton d'import pour sélectionner un fichier
   - 📁 **Dossier complet** : Importez un dossier et sélectionnez le fichier dans la liste déroulante

5. **Navigation dans le document** :
   - Activez la navigation dans les options (section "Analyse du contenu")
   - Une fenêtre flottante affiche la structure hiérarchique des titres
   - Cliquez sur une section pour naviguer directement dans le document
   - La fenêtre est déplaçable (glisser-déposer), redimensionnable, minimisable et maximisable

6. **Options de conversion** :
   - Dans la sidebar de gauche, section "Autres options"
   - Développez les sections pour configurer :
     - **Analyse du contenu** : Mode d'analyse, détection des titres/listes
     - **Normalisation** : Encodage, Unicode, nettoyage des caractères, détection des confusables
     - **Rendu documentaire** : Table des matières, numérotation, retour à la ligne
     - **Métadonnées** : Titre, auteur, langue
     - **Options de format** : Flavor Markdown, mode de compatibilité (BookStack/Parsedown)

7. **Paramètres de l'application** :
   - Cliquez sur l'icône ⚙️ dans l'en-tête pour ouvrir le panneau de paramètres
   - Configurez les paramètres utilisateur de l'API

8. **Édition des résultats** :
   - ✏️ **Activer l'édition** : Cliquez sur le bouton (confirmation requise)
   - 💾 **Sauvegarder** : Validez vos modifications (confirmation requise)
   - ✕ **Annuler** : Restaure le contenu original (confirmation requise)
   - ⬇️ **Télécharger** : Télécharge le résultat avec nom de fichier personnalisé
   - 📋 **Copier** : Copie le résultat dans le presse-papiers
   - 🗑️ **Effacer** : Vide le contenu du panneau (confirmation requise)

9. **Historique des conversions** :
   - Cliquez sur l'icône 📜 dans l'en-tête pour ouvrir le panneau d'historique
   - Consultez les conversions précédentes
   - Restaurez une conversion en cliquant dessus
   - Effacez l'historique avec le bouton dédié

10. **Raccourcis clavier** :
    - `Ctrl+S` : Télécharger le résultat
    - `Ctrl+Enter` : Lancer la conversion
    - `Ctrl+K` : Effacer le contenu source
    - `Ctrl+/` : Afficher l'aide des raccourcis clavier

11. **Compteurs de texte** :
    - Les panneaux source et résultat affichent en temps réel :
      - Nombre de caractères
      - Nombre de mots
      - Nombre de lignes

## ✏️ Mode Édition

Le mode édition permet de modifier directement les résultats de conversion avec un système de sauvegarde sécurisé.

### Fonctionnement

1. **Activation du mode édition** :
   - Cliquez sur le bouton ✏️ dans le panneau de résultat
   - Une modale de confirmation s'affiche
   - Cliquez sur "Oui" (vert) pour activer l'édition
   - Le contenu original est automatiquement sauvegardé

2. **Modification du contenu** :
   - Le texte devient éditable dans la zone de texte
   - Les boutons de copie 📋 et d'effacement 🗑️ sont désactivés
   - Seuls les boutons "Sauvegarder" et "Annuler" sont disponibles

3. **Sauvegarde** :
   - Cliquez sur 💾 Sauvegarder
   - Une modale de confirmation s'affiche
   - "Oui" (vert) : Valide et sauvegarde les modifications
   - "Non" (rouge) : Annule les modifications et restaure le contenu original

4. **Annulation** :
   - Cliquez sur ✕ Annuler
   - Une modale de confirmation s'affiche
   - "Oui" (vert) : Confirme l'annulation et restaure le contenu original
   - "Non" (rouge) : Continue l'édition sans annuler

### Sécurité

- Le contenu original est toujours sauvegardé avant l'édition
- Les modifications ne sont conservées que si vous cliquez explicitement sur "Sauvegarder"
- Toute annulation restaure automatiquement le contenu d'origine
- Les actions destructives (copie, effacement) sont désactivées pendant l'édition

## 🏗 Architecture

L'application est organisée en trois parties principales pour une séparation claire des responsabilités :

### Structure principale

```
Ascend/
├── api/
│   ├── frontend/         # Application React/TypeScript
│   ├── backend/          # Serveur Express.js
│   └── shared/           # Code partagé entre frontend et backend
├── doc/                  # Documentation détaillée
├── lib/                  # Bibliothèque downdoc
├── bin/                  # Exécutables
├── test/                 # Tests
└── README.md            # Ce fichier
```

### Architecture du pipeline de conversion

Le pipeline de conversion suit les principes définis dans [PIPELINE.md](doc/specifications/PIPELINE.md) :

1. **Isolation stricte** : Chaque conversion s'exécute dans un dossier temporaire unique
2. **Modules de conversion** : Interface uniforme définie dans [modules.interface.md](doc/specifications/modules.interface.md)
3. **Lazy loading** : Chargement différé des modules via [lazyload.module.js](api/backend/services/modules/lazyload.module.js)
4. **Sécurité** : Module de sécurité implémentant les règles de [PIPELINE.md](doc/specifications/PIPELINE.md)

### Modules de conversion

Les modules de conversion respectent l'interface définie dans [modules.interface.md](doc/specifications/modules.interface.md) :

- **downdoc** : Conversion AsciiDoc → Markdown (bibliothèque JavaScript native) ✅ **Fonctionnel**
- **pandoc** : Conversion Markdown → AsciiDoc (via Pandoc) ✅ **Fonctionnel**
- **text2markdown** : Conversion texte brut → Markdown avec détection automatique ✅ **Fonctionnel**
- **docverter** : Module préparé pour conversion de documents (rtf, pdf, docx, etc.) ⏳ **Placeholder (coming soon)**
- **panwriter** : Module préparé pour édition et conversion de documents ⏳ **Placeholder (coming soon)**

Tous les modules sont chargés via le système de lazy loading pour optimiser la consommation mémoire.

### Orchestrateur de conversion

Le module **converter-orchestrator** coordonne l'exécution de tous les converters :

- **Identification automatique** : Trouve le converter approprié selon les formats source et destination
- **Standardisation** : Retourne un format uniforme `{ success, logs, error, duration }` pour tous les converters
- **Lazy loading intégré** : Utilise le lazy loading pour optimiser la consommation mémoire
- **Extensibilité** : Permet d'ajouter facilement de nouveaux converters sans modifier le code existant
- **Formats/langages disponibles** : 
  - ✅ **AsciiDoc ↔ Markdown** : Seules ces conversions sont fonctionnelles dans cette version alpha
  - ⏳ **Autres formats** : HTML, PDF, YAML, JSON, TXT sont visibles dans l'interface mais marqués comme "coming soon"

## 🔌 API

### Endpoints de conversion

#### `POST /to-markdown`
Convertit du contenu AsciiDoc en Markdown (utilise lazy loader avec downdoc).

**Requête :**
```json
{
  "text": "= Titre\n\nContenu AsciiDoc",
  "options": {
    "formatSpecific": {
      "markdown": {
        "parsedown": false
      }
    }
  }
}
```

**Paramètres :**
- `text` (requis) : Le contenu AsciiDoc à convertir
- `options` (optionnel) : Options de conversion
  - `formatSpecific.markdown.parsedown` : Active le mode BookStack/Parsedown

**Réponse :**
```json
{
  "markdown": "# Titre\n\nContenu Markdown"
}
```

#### `POST /to-asciidoc`
Convertit du contenu Markdown en AsciiDoc (utilise Pandoc).

**Requête :**
```json
{
  "text": "# Titre\n\nContenu Markdown"
}
```

**Paramètres :**
- `text` (requis) : Le contenu Markdown à convertir

**Réponse :**
```json
{
  "asciidoc": "= Titre\n\nContenu AsciiDoc"
}
```

#### `POST /from-html`
Convertit du contenu HTML vers d'autres formats (utilise Pandoc).

**⚠️ Note :** Cet endpoint est disponible mais les conversions HTML ne sont pas activées dans l'interface utilisateur pour cette version alpha.

**Requête :**
```json
{
  "text": "<h1>Titre</h1><p>Contenu HTML</p>",
  "to": "markdown"
}
```

**Paramètres :**
- `text` (requis) : Le contenu HTML à convertir
- `to` (requis) : Le format de sortie (markdown, asciidoc, docx, pdf, epub, rst, tex, latex)

**Réponse :**
```json
{
  "result": "# Titre\n\nContenu Markdown",
  "format": "markdown"
}
```

#### `POST /text-to-markdown`
Convertit du texte brut vers Markdown (utilise text2markdown).

**⚠️ Note :** Cet endpoint est disponible mais les conversions Text → Markdown ne sont pas activées dans l'interface utilisateur pour cette version alpha. Seules les conversions AsciiDoc ↔ Markdown sont disponibles dans l'UI.

**Requête :**
```json
{
  "text": "TITRE PRINCIPAL\n\nContenu du paragraphe.\n\n- Liste item 1\n- Liste item 2"
}
```

**Réponse :**
```json
{
  "markdown": "# TITRE PRINCIPAL\n\nContenu du paragraphe.\n\n- Liste item 1\n- Liste item 2\n"
}
```

#### `POST /convert`
Convertit depuis n'importe quel format vers un autre format (utilise le moteur de conversion sécurisé avec lazy loading).

**⚠️ Note :** Dans l'interface utilisateur, seules les conversions AsciiDoc ↔ Markdown sont disponibles pour cette version alpha. Les autres formats sont visibles mais marqués comme "coming soon".

**Requête :**
```json
{
  "content": "Contenu à convertir",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "token": "token-uuid-here",
  "options": {}
}
```

**Paramètres :**
- `content` (requis) : Le contenu à convertir
- `fromFormat` (requis) : Le format source (asciidoc, markdown, txt, html, pdf, yaml, json, etc.)
- `toFormat` (requis) : Le format de destination (markdown, asciidoc, html, pdf, yaml, json, txt, etc.)
- `token` (requis) : Token de confirmation obtenu via `/api/confirmation/request`
- `options` (optionnel) : Options de conversion

**Réponse :**
```json
{
  "result": "Contenu converti",
  "format": "markdown"
}
```

### Endpoints de sécurité

#### `POST /api/confirmation/request`
Génère un token de confirmation pour une conversion sécurisée.

**Requête :**
```json
{
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "contentSize": 1024
}
```

**Paramètres :**
- `fromFormat` (requis) : Format source
- `toFormat` (requis) : Format de destination
- `contentSize` (optionnel) : Taille du contenu en octets

**Réponse :**
```json
{
  "success": true,
  "token": "token-uuid-here",
  "expiresAt": "2024-01-01T12:00:00.000Z",
  "ttl": 60000
}
```

#### `GET /api/confirmation/stats`
Obtient les statistiques des tokens de confirmation (monitoring).

**Réponse :**
```json
{
  "success": true,
  "stats": {
    "active": 5,
    "expired": 10,
    "consumed": 20,
    "total": 35
  }
}
```

### Moteurs de conversion

Ascend utilise plusieurs moteurs de conversion selon le type de conversion :

1. **downdoc** : Bibliothèque JavaScript native
   - Utilisé pour : AsciiDoc → Markdown
   - Rapide et léger, pas de dépendances externes
   - Chargé via lazy loading
   - Idéal pour les conversions simples

2. **Pandoc** : Outil de conversion universel de documents
   - Utilisé pour : Markdown → AsciiDoc et HTML → autres formats
   - Support complet pour de nombreux formats
   - Nécessite Pandoc installé sur le système
   - Idéal pour les conversions complexes et les documents volumineux

3. **text2markdown** : Module de conversion texte brut → Markdown
   - Utilisé pour : Texte brut → Markdown
   - Détection automatique des structures (titres, listes, liens, emails, etc.)
   - Conversion intelligente sans dépendances externes
   - Idéal pour convertir du texte brut en Markdown structuré

### Exemple avec cURL

```bash
# Conversion AsciiDoc → Markdown (downdoc via lazy loading)
curl -X POST http://localhost:3003/to-markdown \
  -H "Content-Type: application/json" \
  -d '{"text": "= Mon Titre\n\nContenu de test"}'

# Conversion Markdown → AsciiDoc (Pandoc)
curl -X POST http://localhost:3003/to-asciidoc \
  -H "Content-Type: application/json" \
  -d '{"text": "# Mon Titre\n\nContenu de test"}'

# Conversion HTML → Markdown (Pandoc)
curl -X POST http://localhost:3003/from-html \
  -H "Content-Type: application/json" \
  -d '{"text": "<h1>Mon Titre</h1><p>Contenu de test</p>", "to": "markdown"}'

# Conversion sécurisée avec token
TOKEN=$(curl -X POST http://localhost:3003/api/confirmation/request \
  -H "Content-Type: application/json" \
  -d '{"fromFormat": "asciidoc", "toFormat": "markdown"}' | jq -r '.token')

curl -X POST http://localhost:3003/convert \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"= Titre\n\nContenu\", \"from\": \"asciidoc\", \"to\": \"markdown\", \"confirmed\": true, \"confirmationToken\": \"$TOKEN\"}"
```

## 🧪 Développement

### Scripts disponibles

**Backend :**
- `npm start` : Démarre le serveur en mode production
- `npm run dev` : Démarre le serveur en mode développement avec rechargement automatique

**Frontend :**
- `npm run dev` : Démarre le serveur de développement Vite
- `npm run build` : Compile l'application pour la production
- `npm run preview` : Prévisualise la version de production

### Configuration

Le backend écoute sur le port **3003** par défaut.
Le frontend écoute sur le port **5173** par défaut.

Pour modifier ces ports, éditez :
- Backend : `api/backend/server.js` (variable `PORT`)
- Frontend : `api/frontend/vite.config.ts` (propriété `server.port`)

### Variables d'environnement

Les limites de sécurité peuvent être configurées via des variables d'environnement :

```bash
# Limite de conversions simultanées (défaut: 5)
MAX_CONCURRENT_CONVERSIONS=5

# Budget de ressources par conversion
MAX_CPU_TIME_MS=30000        # Limite CPU (défaut: 30s)
MAX_MEMORY_MB=512            # Limite mémoire (défaut: 512MB)
MAX_WALL_TIME_MS=60000       # Limite temps total (défaut: 60s)

# Seuils de surcharge
OVERLOAD_CPU_PERCENT=80.0
OVERLOAD_MEMORY_PERCENT=80.0
OVERLOAD_FAILURE_RATE=0.2

# Chemin des logs de sécurité
SECURITY_LOG_PATH=/tmp/ascend-security-logs

# Chemin vers Pandoc (si non standard)
PANDOC_PATH=/usr/bin/pandoc
```

## 📚 Documentation

Le projet dispose d'une documentation complète dans le dossier [`doc/`](doc/). Voici l'index complet des fichiers de documentation, organisés par type :

### 📖 Index de la documentation

#### 📋 Spécifications et architecture

- **[PIPELINE.md](doc/specifications/PIPELINE.md)** - **Spécification complète du pipeline de conversion**
  - Philosophie et principes fondamentaux du pipeline
  - Règles d'isolation stricte des conversions
  - Validation stricte des entrées et chemins de fichiers
  - Contrôle de concurrence et limites de ressources
  - Détection de comportements anormaux
  - Dégradation contrôlée et résilience du backend
  - Cycle de vie d'une conversion
  - Gestion des erreurs et journalisation sécurisée
  - **Document de référence principal pour comprendre l'architecture de sécurité**

- **[modules.interface.md](doc/specifications/modules.interface.md)** - **Contrat d'interface des modules**
  - Spécification technique du contrat que chaque module doit respecter
  - Propriétés obligatoires (nom, formats supportés)
  - Méthode standard `run()` avec structure de retour uniforme
  - Contraintes d'exécution et comportement attendu
  - Obligations de sécurité minimales V1
  - Références aux normes (ISO 27001/27002, NIST SP 800-53, OWASP, GDPR/RGPD)
  - **Document de référence pour créer ou intégrer un module**

- **[lazyload.module.md](doc/specifications/modules/lazyload.module.md)** - **Module de lazy loading**
  - Gestionnaire centralisé de chargement différé pour tous les converters
  - Interface uniforme compatible avec tous les wrappers
  - Réduction de la consommation mémoire
  - Journalisation et gestion sécurisée des erreurs
  - Validation des chemins et modules
  - Préparation pour futures mesures de sécurité

- **[downdoc.module.md](doc/specifications/modules/downdoc.module.md)** - **Module Downdoc**
  - Spécification du wrapper downdoc
  - Exemple de module conforme à l'interface

- **[pandoc.module.md](doc/specifications/modules/pandoc.module.md)** - **Module Pandoc**
  - Spécification du wrapper Pandoc
  - Exécution sécurisée via child_process.spawn
  - Support multi-formats avec whitelist stricte

- **[text2markdown.module.md](doc/specifications/modules/text2markdown.module.md)** - **Module Text2Markdown**
  - Spécification du wrapper text2markdown
  - Conversion texte brut → Markdown avec détection automatique
  - Bibliothèque JavaScript native

- **[panwriter.module.md](doc/specifications/modules/panwriter.module.md)** - **Module PanWriter**
  - Spécification du wrapper PanWriter (en préparation)
  - Éditeur et convertisseur de documents
  - Formats Office et documents

- **[docverter.module.md](doc/specifications/modules/docverter.module.md)** - **Module Docverter**
  - Spécification du wrapper Docverter (en préparation)
  - Service de conversion de documents
  - Support multi-formats (Office, images, PDF)

- **[converter-orchestrator.module.md](doc/specifications/modules/converter-orchestrator.module.md)** - **Module Orchestrateur de Converters**
  - Orchestrateur central pour tous les converters
  - Identification automatique du converter approprié
  - Standardisation des retours et intégration du lazy loading

- **[orchestrator.module.md](doc/specifications/modules/orchestrator.module.md)** - **Module Orchestrateur Linéaire (legacy)**
  - Mini-orchestrateur pour flux linéaire de conversion multi-étapes
  - Chaînage séquentiel de modules de conversion
  - Gestion automatique des dossiers temporaires et nettoyage
  - Processus de conversion détaillé
  - Post-traitement et mode BookStack

- **[orchestrator-comm.module.md](doc/specifications/modules/orchestrator-comm.module.md)** - **Communication entre Orchestrateurs**
  - Architecture de communication entre orchestrateur principal et orchestrateur d'exécution
  - Flux de communication et gestion des dossiers temporaires
  - Format de retour standardisé et sécurité
  - Répartition de charge et évolution future

- **[logs.module.md](doc/specifications/modules/logs.module.md)** - **Module de Logs Structurés**
  - Système de logs JSON structurés pour chaque conversion
  - Endpoint API `/api/logs` pour accès depuis terminal
  - Métriques et données collectées (durée, modules, fichiers)
  - Sécurité et audit (sanitisation, rétention, conformité)

- **[secure-converter.md](doc/specifications/secure-converter.md)** - **Moteur de conversion sécurisé**
  - Vue d'ensemble du moteur de conversion sécurisé
  - Caractéristiques de sécurité (isolation, validation, exécution sécurisée)
  - Utilisation et exemples d'intégration
  - Configuration et options de sécurité

#### 🔐 Guides de sécurité

- **[confirmation-security-guide.md](doc/guides/security/confirmation-security-guide.md)** - **Guide de sécurité des tokens de confirmation**
  - Système de tokens de confirmation sécurisés
  - Principe de non-confiance du backend envers le frontend
  - Génération, validation et consommation des tokens
  - Intégration frontend/backend

#### 🔌 Guides d'intégration

- **[secure-converter-frontend-integration.md](doc/guides/integration/secure-converter-frontend-integration.md)** - **Intégration frontend du moteur sécurisé**
  - Guide d'intégration du système de tokens côté frontend
  - Exemples de code React/TypeScript
  - Gestion des modales de confirmation
  - Gestion des erreurs côté client

#### ⚙️ Références de configuration

- **[conversion-options.md](doc/references/configuration/conversion-options.md)** - **Options de conversion complètes**
  - Structure complète des options de conversion
  - Options par catégorie (analyse, normalisation, rendu, métadonnées)
  - Options spécifiques par format
  - Exemples de configuration

- **[encoding-options.md](doc/references/configuration/encoding-options.md)** - **Options d'encodage**
  - Gestion des encodages de caractères
  - Normalisation Unicode
  - Détection et conversion d'encodage
  - Options de nettoyage des caractères

- **[normalization-advanced-options.md](doc/references/configuration/normalization-advanced-options.md)** - **Options avancées de normalisation**
  - Normalisation avancée du contenu
  - Détection et gestion des caractères confusables
  - Nettoyage et sanitisation
  - Options de formatage

### 🗺️ Navigation rapide par type

**📋 Spécifications et architecture :**
- [PIPELINE.md](doc/specifications/PIPELINE.md) - Spécification complète du pipeline (référence principale)
- [modules.interface.md](doc/specifications/modules.interface.md) - Contrat d'interface des modules
- [lazyload.module.md](doc/specifications/modules/lazyload.module.md) - Module de lazy loading
- [downdoc.module.md](doc/specifications/modules/downdoc.module.md) - Module Downdoc
- [pandoc.module.md](doc/specifications/modules/pandoc.module.md) - Module Pandoc
- [text2markdown.module.md](doc/specifications/modules/text2markdown.module.md) - Module Text2Markdown
- [panwriter.module.md](doc/specifications/modules/panwriter.module.md) - Module PanWriter
- [docverter.module.md](doc/specifications/modules/docverter.module.md) - Module Docverter
- [secure-converter.md](doc/specifications/secure-converter.md) - Moteur de conversion sécurisé

**🔐 Guides de sécurité :**
- [confirmation-security-guide.md](doc/guides/security/confirmation-security-guide.md) - Système de tokens de confirmation

**🔌 Guides d'intégration :**
- [secure-converter-frontend-integration.md](doc/guides/integration/secure-converter-frontend-integration.md) - Intégration frontend

**⚙️ Références de configuration :**
- [conversion-options.md](doc/references/configuration/conversion-options.md) - Options de conversion complètes
- [encoding-options.md](doc/references/configuration/encoding-options.md) - Options d'encodage
- [normalization-advanced-options.md](doc/references/configuration/normalization-advanced-options.md) - Options de normalisation avancée

### 🎯 Parcours recommandés

**Pour comprendre l'architecture de sécurité :**
1. Commencez par [PIPELINE.md](doc/specifications/PIPELINE.md) pour comprendre les principes fondamentaux
2. Lisez [secure-converter.md](doc/specifications/secure-converter.md) pour les détails d'implémentation
3. Consultez [confirmation-security-guide.md](doc/guides/security/confirmation-security-guide.md) pour le système de tokens

**Pour configurer les conversions :**
1. [conversion-options.md](doc/references/configuration/conversion-options.md) - Vue d'ensemble des options
2. [encoding-options.md](doc/references/configuration/encoding-options.md) - Options d'encodage
3. [normalization-advanced-options.md](doc/references/configuration/normalization-advanced-options.md) - Normalisation avancée

**Pour intégrer le système :**
1. [secure-converter-frontend-integration.md](doc/guides/integration/secure-converter-frontend-integration.md) - Intégration frontend
2. [secure-converter.md](doc/specifications/secure-converter.md) - Utilisation backend

**Pour créer un nouveau module :**
1. [modules.interface.md](doc/specifications/modules.interface.md) - Contrat d'interface
2. [downdoc.module.md](doc/specifications/modules/downdoc.module.md) - Exemple de module
3. [lazyload.module.md](doc/specifications/modules/lazyload.module.md) - Intégration avec lazy loading

### 📂 Structure de la documentation

La documentation est organisée par type dans le dossier [`doc/`](doc/) :

```
doc/
├── README.md                                # Index de la documentation
├── specifications/                          # Spécifications et architecture
│   ├── PIPELINE.md                         # Spécification du pipeline (référence principale)
│   ├── modules.interface.md                # Contrat d'interface des modules
│   ├── secure-converter.md                 # Moteur de conversion sécurisé
│   └── modules/                            # Spécifications des modules
│       ├── ... (autres modules)
│       ├── orchestrator-comm.module.md      # Communication entre orchestrateurs
│       └── logs.module.md                   # Module de logs structurés
│       ├── lazyload.module.md              # Module de lazy loading
│       ├── converter-orchestrator.module.md # Module orchestrateur de converters
│       ├── orchestrator.module.md          # Module orchestrateur linéaire (legacy)
│       ├── orchestrator-comm.module.md      # Communication entre orchestrateurs
│       ├── logs.module.md                   # Module de logs structurés
│       ├── downdoc.module.md               # Module Downdoc
│       ├── pandoc.module.md                # Module Pandoc
│       ├── text2markdown.module.md         # Module Text2Markdown
│       ├── panwriter.module.md             # Module PanWriter
│       └── docverter.module.md             # Module Docverter
├── guides/                                  # Guides pratiques
│   ├── security/                           # Guides de sécurité
│   │   └── confirmation-security-guide.md # Guide des tokens de confirmation
│   └── integration/                        # Guides d'intégration
│       └── secure-converter-frontend-integration.md # Intégration frontend
└── references/                              # Références techniques
    └── configuration/                      # Références de configuration
        ├── conversion-options.md           # Options de conversion
        ├── encoding-options.md            # Options d'encodage
        └── normalization-advanced-options.md # Options de normalisation avancée
```

Consultez le [README.md](doc/README.md) dans le dossier `doc/` pour un index complet et détaillé.

## 📁 Structure du projet

```
Ascend/
├── api/                      # Dossier principal de l'application
│   ├── frontend/             # Application frontend React/TypeScript
│   │   ├── src/
│   │   │   ├── components/  # Composants React réutilisables
│   │   │   │   ├── Panel.tsx              # Panneau source/destination
│   │   │   │   ├── FormatSelector.tsx     # Sélecteur de formats
│   │   │   │   ├── Modal.tsx              # Modales de confirmation
│   │   │   │   ├── NavigationWindow.tsx   # Fenêtre de navigation
│   │   │   │   └── index.ts                # Exports centralisés
│   │   │   ├── hooks/        # Hooks React personnalisés
│   │   │   ├── services/     # Services frontend
│   │   │   │   └── bulk-processor.ts  # Traitement en lot
│   │   │   │   ├── useHeadings.ts         # Extraction des titres
│   │   │   │   ├── useFileHandling.ts     # Gestion des fichiers
│   │   │   │   ├── useNavigationWindow.ts # Gestion de la fenêtre de navigation
│   │   │   │   └── index.ts                # Exports centralisés
│   │   │   ├── converters/  # Convertisseurs frontend
│   │   │   │   ├── api.ts                  # Appels API
│   │   │   │   ├── asciidoc-to-markdown.ts # Conversion AsciiDoc → Markdown
│   │   │   │   ├── markdown-to-asciidoc.ts # Conversion Markdown → AsciiDoc
│   │   │   │   ├── generic-converter.ts    # Conversion générique avec tokens
│   │   │   │   ├── bookstack-adapter.ts    # Adaptateur BookStack (TypeScript)
│   │   │   │   └── index.ts                # Exports centralisés
│   │   │   ├── types/        # Types TypeScript
│   │   │   │   └── index.ts                # Définitions de types
│   │   │   ├── utils/        # Utilitaires frontend
│   │   │   │   └── formatHelpers.ts        # Helpers de formatage
│   │   │   ├── constants/    # Constantes frontend
│   │   │   │   └── index.ts                # Constantes de l'application
│   │   │   ├── App.tsx       # Composant principal
│   │   │   ├── main.tsx      # Point d'entrée
│   │   │   └── styles.css    # Styles globaux
│   │   ├── index.html        # Template HTML
│   │   ├── package.json      # Configuration npm
│   │   ├── tsconfig.json     # Configuration TypeScript
│   │   └── vite.config.ts    # Configuration Vite
│   │
│   ├── backend/              # Application backend Node.js
│   │   ├── server.js         # Point d'entrée du serveur (démarre le serveur)
│   │   ├── app.js            # Configuration Express (middleware, routes)
│   │   ├── routes/           # Routes organisées par domaine
│   │   │   ├── conversion.routes.js  # Routes de conversion
│   │   │   └── api.routes.js         # Routes API (tokens, logs)
│   │   ├── middleware/       # Middleware Express
│   │   │   ├── cors.middleware.js           # Configuration CORS
│   │   │   └── error-handler.middleware.js  # Gestionnaire d'erreurs global
│   │   ├── services/         # Services organisés par catégorie
│   │   │   ├── conversion/   # Services de conversion
│   │   │   │   ├── convert.js               # Fonctions de conversion principales
│   │   │   │   └── secure-converter.js      # Moteur de conversion sécurisé
│   │   │   ├── security/    # Sécurité du pipeline
│   │   │   │   └── pipeline-security.js     # Module de sécurité (PIPELINE.md)
│   │   │   ├── logging/     # Logging structuré
│   │   │   │   └── structured-logger.js     # Journalisation JSON structurée
│   │   │   └── modules/     # Modules de conversion modulaires
│   │   │       ├── downdoc.module.js        # Module AsciiDoc → Markdown
│   │   │       ├── text2markdown.module.js  # Module Text → Markdown
│   │   │       ├── panwriter.module.js      # Module multi-formats (placeholder)
│   │   │       ├── docverter.module.js      # Service de conversion (placeholder)
│   │   │       ├── lazyload.module.js       # Gestionnaire de lazy loading
│   │   │       ├── converter-orchestrator.module.js  # Orchestrateur central
│   │   │       ├── main-orchestrator.js     # Orchestrateur principal
│   │   │       ├── execution-orchestrator.js # Orchestrateur d'exécution
│   │   │       ├── orchestrator.js          # Orchestrateur linéaire (legacy)
│   │   │       └── index.js                 # Exports centralisés
│   │   ├── config/           # Configuration backend
│   │   │   └── index.js
│   │   ├── conversion-options.js            # Options de conversion
│   │   ├── conversion-options.schema.json   # Schéma JSON
│   │   ├── examples/        # Exemples d'utilisation
│   │   │   └── secure-converter-integration-example.js
│   │   ├── public/          # Fichiers statiques
│   │   │   ├── logo.png
│   │   │   └── rafale.jpg
│   │   ├── static/          # Fichiers HTML
│   │   │   └── index.html
│   │   └── package.json     # Configuration npm
│   │
│   ├── shared/               # Éléments partagés entre frontend et backend
│   │   ├── adapters/         # Adaptateurs de format
│   │   │   ├── bookstack-adapter.js  # Version CommonJS pour backend
│   │   │   └── bookstack-adapter.ts  # Version TypeScript pour frontend
│   │   └── utils/            # Utilitaires partagés
│   │       └── index.js
│   │
│   └── logs/                 # Logs structurés des conversions
│       ├── .gitkeep         # Maintient le dossier dans Git
│       └── list-logs.js     # Script Node.js pour visualiser les logs
│
├── doc/                      # Documentation complète
│   ├── README.md            # Index de la documentation
│   ├── specifications/      # Spécifications et architecture
│   │   ├── PIPELINE.md     # Spécification du pipeline (référence principale)
│   │   ├── modules.interface.md  # Contrat d'interface des modules
│   │   ├── secure-converter.md   # Moteur de conversion sécurisé
│   │   └── modules/        # Spécifications des modules
│   │       ├── lazyload.module.md  # Module de lazy loading
│   │       └── downdoc.module.md   # Module Downdoc
│   ├── guides/             # Guides pratiques
│   │   ├── security/      # Guides de sécurité
│   │   │   └── confirmation-security-guide.md
│   │   └── integration/   # Guides d'intégration
│   │       └── secure-converter-frontend-integration.md
│   └── references/         # Références techniques
│       └── configuration/  # Références de configuration
│           ├── conversion-options.md
│           ├── encoding-options.md
│           └── normalization-advanced-options.md
├── lib/                     # Bibliothèque downdoc
│   ├── index.js            # Point d'entrée principal
│   ├── cli.js              # Interface en ligne de commande
│   └── util/               # Utilitaires
│       └── read-stream.js
├── bin/                     # Exécutables
│   └── downdoc             # CLI downdoc
├── test/                    # Tests
│   ├── cli-test.js
│   ├── downdoc-test.js
│   └── harness/            # Harness de test
│       ├── config.js
│       ├── index.js
│       └── mocha-ci-reporter.js
├── LICENSE                  # Licence MIT
└── README.md                # Ce fichier
```

### 🎯 Organisation du code

#### Frontend (`api/frontend/`)
Application React/TypeScript modulaire avec organisation claire :

**Structure des dossiers :**
```
src/
├── components/          # Composants React réutilisables
│   ├── Panel.tsx       # Panneau générique pour afficher du contenu
│   ├── FormatSelector.tsx  # Sélecteur de format
│   ├── Modal.tsx       # Modal générique
│   ├── NavigationWindow.tsx # Fenêtre de navigation flottante
│   └── index.ts        # Exports centralisés
├── converters/          # Modules de conversion
│   ├── api.ts          # Configuration API
│   ├── asciidoc-to-markdown.ts
│   ├── markdown-to-asciidoc.ts
│   ├── generic-converter.ts
│   ├── bookstack-adapter.ts
│   └── index.ts        # Exports centralisés
├── hooks/              # Hooks React personnalisés
│   ├── useHeadings.ts  # Extraction des headings
│   ├── useFileHandling.ts  # Gestion des fichiers
│   ├── useNavigationWindow.ts  # Gestion de la fenêtre de navigation
│   └── index.ts        # Exports centralisés
├── types/              # Définitions TypeScript
│   └── index.ts        # Types et interfaces
├── utils/              # Utilitaires
│   └── formatHelpers.ts  # Helpers pour les formats
├── constants/          # Constantes de l'application
│   └── index.ts        # Constantes centralisées
├── App.tsx             # Composant principal
├── main.tsx            # Point d'entrée
└── styles.css          # Styles globaux
```

**Principes d'organisation :**
- **Séparation des responsabilités** : Composants UI, hooks pour la logique métier, converters pour la conversion
- **Exports centralisés** : Chaque dossier contient un fichier `index.ts` pour faciliter les imports
- **Types TypeScript** : Tous les types sont centralisés dans `types/index.ts`
- **Hooks personnalisés** : Encapsulation de la logique réutilisable

**Imports recommandés :**
```typescript
// Types
import { FormatType, Notification, Heading } from './types'

// Hooks
import { useHeadings, useFileHandling, useNavigationWindow } from './hooks'

// Composants
import { Panel, FormatSelector, Modal, NavigationWindow } from './components'

// Utilitaires
import { getFormatTitle, getFormatPlaceholder, extractHeadings } from './utils/formatHelpers'

// Constantes
import { FORMAT_TITLES, FORMAT_PLACEHOLDERS } from './constants'

// Converters
import { convertText, requestConfirmationToken } from './converters'
```

#### Backend (`api/backend/`)
Serveur Express avec services modulaires :
- **server.js** : Point d'entrée du serveur (démarre le serveur)
- **app.js** : Configuration Express (middleware, routes)
- **bin/** : Scripts utilitaires
  - **check-env.js** : Script de diagnostic d'environnement (vérifie Pandoc, permissions, Node.js version)
- **routes/** : Routes organisées par domaine
  - **conversion.routes.js** : Routes de conversion (AsciiDoc → Markdown, Markdown → AsciiDoc uniquement pour cette version)
  - **api.routes.js** : Routes API (tokens de confirmation, logs)
- **middleware/** : Middleware Express
  - **cors.middleware.js** : Configuration CORS
  - **error-handler.middleware.js** : Gestionnaire d'erreurs global
- **services/** : Services organisés par catégorie
  - **conversion/** : Services de conversion
    - **convert.js** : Fonctions de conversion principales (Pandoc, text2markdown)
    - **secure-converter.js** : Moteur de conversion sécurisé avec validation de tokens
  - **security/** : Sécurité du pipeline
    - **pipeline-security.js** : Module de sécurité (concurrence, limites de ressources, détection d'anomalies)
  - **logging/** : Logging structuré
    - **structured-logger.js** : Journalisation JSON structurée pour les conversions
  - **proxy/** : Proxy de normalisation des données
    - **secure-proxy.js** : Proxy qui normalise les données d'entrée (supprime BOM, normalise encodage, remplace Smart Quotes) avant conversion
  - **modules/** : Modules de conversion modulaires (conformes à modules.interface.md)
    - **downdoc.module.js** : Module AsciiDoc → Markdown
    - **text2markdown.module.js** : Module Text → Markdown
    - **panwriter.module.js** : Module multi-formats (placeholder)
    - **docverter.module.js** : Service de conversion de documents (placeholder)
    - **lazyload.module.js** : Gestionnaire de lazy loading pour les modules
    - **converter-orchestrator.module.js** : Orchestrateur central des converters
    - **main-orchestrator.js** : Orchestrateur principal (reçoit les requêtes)
    - **execution-orchestrator.js** : Orchestrateur d'exécution (exécute les étapes)
    - **orchestrator.js** : Orchestrateur linéaire (legacy)
    - **index.js** : Exports centralisés
- **config/** : Configuration centralisée
- **conversion-options.js** : Gestion des options de conversion
- **public/** : Fichiers statiques (logo, images de fond)
- **static/** : Fichiers HTML statiques

**Imports recommandés pour le backend :**
```javascript
// Modules via lazy loader
const { runConverter } = require('./services/modules/lazyload.module.js')

// Conversion sécurisée
const { secureConvertWithToken, generateConfirmationToken } = require('./services/conversion/secure-converter.js')

// Utilitaires de conversion
const { convertMarkdownWithPandoc, text2markdown } = require('./services/conversion/convert.js')

// Composants de sécurité
const { concurrencyController, gracefulDegradationManager } = require('./services/security/pipeline-security.js')

// Logging structuré
const { initializeLog, finalizeLog } = require('./services/logging/structured-logger.js')
```

#### Logs (`api/logs/`)
Dossier contenant les logs structurés de toutes les conversions effectuées.

**Structure :**
- **Format** : Fichiers JSON (`.log`)
- **Nommage** : `{conversionId}.log` où `conversionId` est un UUID unique
- **Création** : Automatique lors de chaque conversion

**Visualisation des logs :**

**Option 1 : Script Node.js (Recommandé)**
```bash
# Depuis le dossier api/logs
cd api/logs

# Lister tous les logs
node list-logs.js

# Afficher un log spécifique
node list-logs.js {conversionId}

# Aide
node list-logs.js --help
```

**Option 2 : Via l'API**
```bash
# Lire un log spécifique
curl http://localhost:3003/api/logs/{conversionId}

# Lister tous les logs
curl http://localhost:3003/api/logs

# Avec jq pour formater le JSON
curl -s http://localhost:3003/api/logs/{conversionId} | jq
```

**Option 3 : Directement depuis le terminal**
```bash
# Depuis le dossier api/logs
cd api/logs

# Lister tous les fichiers de logs
ls *.log

# Afficher un log spécifique (JSON brut)
cat {conversionId}.log

# Afficher avec formatage (si jq est installé)
cat {conversionId}.log | jq

# Rechercher dans les logs
grep -r "error" *.log
```

**Format des logs :**
Chaque fichier de log contient un objet JSON avec :
- **conversionId** : Identifiant unique de la conversion
- **timestamp** : Dates de début et de fin
- **formats** : Format source et cible
- **status** : Statut (running, success, error)
- **execution** : Détails des étapes d'exécution
- **files** : Fichiers d'entrée, de sortie et intermédiaires
- **logs** : Messages de log détaillés
- **error** : Message d'erreur (si échec)

**Nettoyage :**
Les logs sont automatiquement nettoyés après 30 jours (configurable via `LOG_RETENTION_DAYS`).

Pour nettoyer manuellement :
```bash
# Supprimer les logs de plus de 30 jours
find api/logs -name "*.log" -mtime +30 -delete
```

**Configuration :**
Le chemin des logs peut être personnalisé via la variable d'environnement `LOGS_DIR` :
```bash
export LOGS_DIR=/chemin/vers/logs
```

#### Shared (`api/shared/`)
Code partagé entre frontend et backend :
- **adapters/** : Adaptateurs de format (BookStack/Parsedown)
  - **bookstack-adapter.js** : Version CommonJS pour backend
  - **bookstack-adapter.ts** : Version TypeScript pour frontend

#### Logs (`api/logs/`)
Dossier contenant les logs structurés de toutes les conversions effectuées.

**Structure :**
- **Format** : Fichiers JSON (`.log`)
- **Nommage** : `{conversionId}.log` où `conversionId` est un UUID unique
- **Création** : Automatique lors de chaque conversion
- **Fichiers** :
  - **.gitkeep** : Maintient le dossier dans Git
  - **list-logs.js** : Script Node.js pour visualiser les logs depuis le terminal

**Visualisation des logs :**

**Option 1 : Script Node.js (Recommandé)**
```bash
# Depuis le dossier api/logs
cd api/logs

# Lister tous les logs
node list-logs.js

# Afficher un log spécifique
node list-logs.js {conversionId}

# Aide
node list-logs.js --help
```

**Option 2 : Via l'API**
```bash
# Lire un log spécifique
curl http://localhost:3003/api/logs/{conversionId}

# Lister tous les logs
curl http://localhost:3003/api/logs

# Avec jq pour formater le JSON
curl -s http://localhost:3003/api/logs/{conversionId} | jq
```

**Option 3 : Directement depuis le terminal**
```bash
# Depuis le dossier api/logs
cd api/logs

# Lister tous les fichiers de logs
ls *.log

# Afficher un log spécifique (JSON brut)
cat {conversionId}.log

# Afficher avec formatage (si jq est installé)
cat {conversionId}.log | jq

# Rechercher dans les logs
grep -r "error" *.log
```

**Format des logs :**
Chaque fichier de log contient un objet JSON avec :
- **conversionId** : Identifiant unique de la conversion
- **timestamp** : Dates de début et de fin
- **formats** : Format source et cible
- **status** : Statut (running, success, error)
- **execution** : Détails des étapes d'exécution
- **files** : Fichiers d'entrée, de sortie et intermédiaires
- **logs** : Messages de log détaillés
- **error** : Message d'erreur (si échec)

**Nettoyage :**
Les logs sont automatiquement nettoyés après 30 jours (configurable via `LOG_RETENTION_DAYS`).

Pour nettoyer manuellement :
```bash
# Supprimer les logs de plus de 30 jours
find api/logs -name "*.log" -mtime +30 -delete
```

**Configuration :**
Le chemin des logs peut être personnalisé via la variable d'environnement `LOGS_DIR` :
```bash
export LOGS_DIR=/chemin/vers/logs
```

### 📦 Imports recommandés

**Backend :**
```javascript
const { runConverter } = require('./services/modules/lazyload.module.js')
const { generateConfirmationToken } = require('./services/secure-converter.js')
const { adaptForBookStack } = require('../shared/adapters/bookstack-adapter.js')
```

**Frontend :**
```typescript
import { Panel, Modal } from './components'
import { useHeadings, useFileHandling } from './hooks'
import { convertText, convertAsciiDocToMarkdown } from './converters'
import { FormatType, ConversionHistoryItem } from './types'
```

## 🤝 Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Guidelines pour les contributions

- Respectez l'architecture modulaire et l'interface définie dans [modules.interface.md](doc/specifications/modules.interface.md)
- Suivez les principes de sécurité définis dans [PIPELINE.md](doc/specifications/PIPELINE.md)
- Ajoutez des tests pour les nouvelles fonctionnalités
- Documentez les nouvelles fonctionnalités dans le dossier `doc/`
- Utilisez le système de lazy loading pour les nouveaux modules

## 🔐 Sécurité

Ascend implémente une architecture de sécurité robuste basée sur les spécifications définies dans [PIPELINE.md](doc/specifications/PIPELINE.md).

### Fonctionnalités de sécurité

- **Isolation stricte** : Chaque conversion s'exécute dans un dossier temporaire unique avec permissions restrictives
- **Validation exhaustive** : 
  - Validation des chemins (protection path traversal, symlinks interdits)
  - Validation du type réel de fichier (MIME type)
  - Validation des formats et tailles de fichiers
- **Contrôle de ressources** :
  - Limite de conversions simultanées (configurable, défaut: 5)
  - Budget global par conversion (CPU, mémoire, temps)
  - Surveillance continue et interruption en cas de dépassement
- **Détection d'anomalies** :
  - Détection des tentatives d'accès non autorisés
  - Détection des profils d'exécution anormaux
  - Journalisation de toutes les anomalies
- **Robustesse** :
  - Capture exhaustive des erreurs sans crash global
  - Dégradation contrôlée en cas de surcharge
  - Vérification d'intégrité des modules au démarrage
- **Journalisation sécurisée** :
  - Logs structurés avec ID de conversion unique
  - Aucune donnée utilisateur dans les logs
  - Traçabilité complète pour audit
- **Système de tokens de confirmation** :
  - Génération de tokens sécurisés pour les conversions sensibles
  - Validation et consommation des tokens
  - Principe de non-confiance backend/frontend

### Configuration de sécurité

Les limites de sécurité peuvent être configurées via des variables d'environnement :

```bash
# Limite de conversions simultanées (défaut: 5)
MAX_CONCURRENT_CONVERSIONS=5

# Budget de ressources par conversion
MAX_CPU_TIME_MS=30000        # Limite CPU (défaut: 30s)
MAX_MEMORY_MB=512            # Limite mémoire (défaut: 512MB)
MAX_WALL_TIME_MS=60000       # Limite temps total (défaut: 60s)

# Seuils de surcharge
OVERLOAD_CPU_PERCENT=80.0
OVERLOAD_MEMORY_PERCENT=80.0
OVERLOAD_FAILURE_RATE=0.2

# Chemin des logs de sécurité
SECURITY_LOG_PATH=/tmp/ascend-security-logs

# Chemin vers Pandoc (si non standard)
PANDOC_PATH=/usr/bin/pandoc
```

Pour plus de détails, consultez [PIPELINE.md](doc/specifications/PIPELINE.md).

### Références normatives

Le projet est conçu en tenant compte des normes et bonnes pratiques suivantes :

- **ISO 27001/27002** : Systèmes de management de la sécurité de l'information
- **NIST SP 800-53** : Security and Privacy Controls for Information Systems
- **OWASP Top 10** : Top 10 des risques de sécurité des applications web
- **GDPR/RGPD** : Règlement général sur la protection des données

Les références spécifiques sont documentées dans [modules.interface.md](doc/specifications/modules.interface.md).

## 📝 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [downdoc](https://github.com/opendevise/downdoc) - Bibliothèque de conversion AsciiDoc → Markdown
- [Express.js](https://expressjs.com/) - Framework web pour Node.js
- [React](https://react.dev/) - Bibliothèque JavaScript pour les interfaces utilisateur
- [Vite](https://vitejs.dev/) - Build tool moderne
- [Pandoc](https://pandoc.org/) - Outil de conversion universel de documents

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une [issue](https://github.com/Kira-Torvaldson/ASCEND/issues) sur GitHub.

---

**Version :** 0.0.1.2.2 alpha  
**Dernière mise à jour :** 2026
