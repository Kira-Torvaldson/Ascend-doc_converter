# 🚀 Ascend - Convertisseur de documents

Application web moderne pour convertir des documents entre les formats AsciiDoc et Markdown, avec une interface utilisateur intuitive et élégante.

![Version](https://img.shields.io/badge/version-0.0.1.1--alpha-orange)
![Status](https://img.shields.io/badge/status-alpha-orange)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.17.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 À propos du projet

**Ascend** est une application web moderne et sécurisée pour la conversion de documents entre différents formats (AsciiDoc, Markdown, HTML, PDF, YAML, JSON, TXT, etc.). 

### Objectifs du projet

- **Conversion multi-formats** : Support d'une large gamme de formats de documents
- **Sécurité par conception** : Architecture sécurisée avec isolation stricte des conversions, validation des entrées, et protection contre les abus de ressources
- **Interface intuitive** : Interface utilisateur moderne avec navigation dans les documents et options de conversion avancées
- **Pipeline modulaire** : Architecture modulaire permettant l'intégration facile de nouveaux modules de conversion
- **Fiabilité** : Gestion robuste des erreurs, timeouts, et dégradation contrôlée en cas de surcharge

### Caractéristiques principales

- ✅ **Isolation stricte** : Chaque conversion s'exécute dans un environnement isolé et temporaire
- ✅ **Validation exhaustive** : Validation des chemins, types MIME, formats, et tailles de fichiers
- ✅ **Contrôle de ressources** : Limites sur CPU, mémoire, et temps d'exécution par conversion
- ✅ **Détection d'anomalies** : Surveillance des comportements anormaux et tentatives d'accès non autorisés
- ✅ **Journalisation sécurisée** : Logs structurés pour audit et traçabilité sans exposer de données utilisateur
- ✅ **Dégradation contrôlée** : Refus intelligent de nouvelles conversions en cas de surcharge système

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

### Conversion
- **Conversion bidirectionnelle** : AsciiDoc ↔ Markdown
- **Multi-formats** : Support pour HTML, PDF, YAML, JSON, TXT et plus encore
- **Conversion sécurisée** : Système de tokens de confirmation pour les conversions sensibles
- **Modes de conversion** : Standard et BookStack/Parsedown compatible
- **Conversion en temps réel** : Résultats instantanés

### Interface utilisateur
- **Interface moderne** : Design épuré avec effet glassmorphism et image de fond
- **Navigation dans le document** : Fenêtre flottante avec affichage hiérarchique des chapitres et sections
- **Fenêtre de navigation** : Déplaçable, redimensionnable, minimisable et maximisable
- **Options de conversion** : Panneau d'options compact et organisé
  - Analyse du contenu
  - Normalisation (encodage, Unicode, nettoyage)
  - Rendu documentaire
  - Métadonnées
  - Options spécifiques par format

### Gestion de fichiers
- **Import de fichiers** : Support pour fichiers individuels et dossiers complets
- **Sélection de fichiers** : Sélecteur pour naviguer dans les fichiers importés
- **Mode édition avec confirmation** : Édition sécurisée des résultats avec modales de confirmation
- **Sauvegarde/Annulation** : Système de sauvegarde avec restauration automatique
- **Copie rapide** : Bouton de copie pour les résultats
- **Effacement** : Bouton pour effacer le contenu

### Sécurité et fiabilité
- **Isolation stricte** : Chaque conversion s'exécute dans un dossier temporaire unique et isolé
- **Validation exhaustive** : Validation des chemins, types MIME, formats, et tailles de fichiers
- **Contrôle de ressources** : Limites strictes sur CPU, mémoire, et temps d'exécution
- **Détection d'anomalies** : Surveillance des comportements anormaux et tentatives d'accès non autorisés
- **Gestion d'erreurs robuste** : Capture exhaustive des erreurs sans crash global du backend
- **Timeouts** : Protection contre les conversions trop longues
- **Journalisation sécurisée** : Logs structurés pour audit et traçabilité
- **Dégradation contrôlée** : Refus intelligent de nouvelles conversions en cas de surcharge
- **Vérification d'intégrité** : Contrôle de l'intégrité des modules au démarrage

## 🛠 Technologies

### Backend
- **Node.js** : Runtime JavaScript
- **Express.js** : Framework web
- **downdoc** : Bibliothèque de conversion AsciiDoc → Markdown
- **Pandoc** : Outil de conversion universel de documents pour Markdown → AsciiDoc et HTML → autres formats
- **text2markdown** : Module de conversion texte brut → Markdown (détection automatique)
- **Docverter** : Module de conversion de documents (préparé pour intégration future)
- **PanWriter** : Module d'édition et conversion de documents (préparé pour intégration future)
- **CORS** : Gestion des requêtes cross-origin

### Frontend
- **React 18** : Bibliothèque UI
- **TypeScript** : Typage statique
- **Vite** : Build tool et serveur de développement
- **CSS3** : Styles modernes avec effets visuels avancés

## 📦 Prérequis

- **Node.js** : Version 16.17.0 ou supérieure
- **npm** : Gestionnaire de paquets (inclus avec Node.js)
- **Pandoc** (requis) : Pour les conversions Markdown → AsciiDoc et HTML → autres formats
  - Téléchargement : https://pandoc.org/installing.html
  - Vérifier l'installation : `pandoc --version`

## 🔧 Installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/Kira-Torvaldson/ASCEND.git
cd ASCEND
```

2. **Installer les dépendances du backend**
```bash
cd api/backend
npm install
```

3. **Installer les dépendances du frontend**
```bash
cd ../frontend
npm install
```

## 🚀 Démarrage

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
   - Cliquez sur les flèches ↔️ pour inverser les formats

3. **Conversion** :
   - Entrez ou importez du contenu dans le panneau source
   - Cliquez sur "Convertir"
   - Le résultat apparaît dans le panneau de destination

### Fonctionnalités avancées

4. **Import de fichiers** :
   - 📄 **Fichier unique** : Cliquez sur le bouton pour importer un fichier
   - 📁 **Dossier complet** : Importez un dossier et sélectionnez le fichier dans la liste

5. **Navigation dans le document** :
   - Activez la navigation dans les options
   - Une fenêtre flottante affiche la structure hiérarchique
   - Cliquez sur une section pour naviguer directement
   - La fenêtre est déplaçable, redimensionnable, minimisable et maximisable

6. **Options de conversion** :
   - Dans la sidebar de gauche, section "Autres options"
   - Développez les sections pour configurer :
     - **Analyse du contenu** : Mode d'analyse, détection des titres/listes
     - **Normalisation** : Encodage, Unicode, nettoyage des caractères
     - **Rendu documentaire** : Table des matières, numérotation, retour à la ligne
     - **Métadonnées** : Titre, auteur, langue
     - **Options de format** : Flavor Markdown, mode de compatibilité

7. **Paramètres de l'application** :
   - Cliquez sur l'icône ⚙️ dans l'en-tête pour ouvrir le panneau de paramètres
   - Configurez les paramètres utilisateur de l'API

7. **Édition des résultats** :
   - ✏️ **Activer l'édition** : Cliquez sur le bouton (confirmation requise)
   - 💾 **Sauvegarder** : Validez vos modifications (confirmation requise)
   - ✕ **Annuler** : Restaure le contenu original (confirmation requise)
   - 📋 **Copier** : Copie le résultat dans le presse-papiers
   - 🗑️ **Effacer** : Vide le contenu du panneau

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

## 🔌 API

### Endpoints

#### `POST /to-markdown`
Convertit du contenu AsciiDoc en Markdown (utilise downdoc).

**Requête :**
```json
{
  "text": "= Titre\n\nContenu AsciiDoc"
}
```

**Paramètres :**
- `text` (requis) : Le contenu AsciiDoc à convertir

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
Convertit depuis n'importe quel format vers un autre format (utilise Pandoc ou text2markdown selon les formats).

**Requête :**
```json
{
  "text": "Contenu à convertir",
  "from": "txt",
  "to": "markdown"
}
```

**Paramètres :**
- `text` (requis) : Le contenu à convertir
- `from` (requis) : Le format source (txt, html, markdown, asciidoc, pdf, yaml, json, etc.)
- `to` (requis) : Le format de destination (markdown, asciidoc, html, pdf, yaml, json, txt, etc.)

**Réponse :**
```json
{
  "result": "Contenu converti",
  "format": "markdown"
}
```

### Moteurs de conversion

Ascend utilise deux moteurs de conversion selon le type de conversion :

1. **downdoc** : Bibliothèque JavaScript native
   - Utilisé pour : AsciiDoc → Markdown
   - Rapide et léger, pas de dépendances externes
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

### Modules de conversion

- **downdoc** : Conversion AsciiDoc → Markdown (bibliothèque JavaScript native)
- **Pandoc** : Conversion Markdown → AsciiDoc et HTML → autres formats
- **text2markdown** : Conversion texte brut → Markdown avec détection automatique
- **Docverter** : Module préparé pour conversion de documents (rtf, pdf, docx, etc.)
- **PanWriter** : Module préparé pour édition et conversion de documents

### Exemple avec cURL

```bash
# Conversion AsciiDoc → Markdown (downdoc)
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

# Conversion HTML → AsciiDoc (Pandoc)
curl -X POST http://localhost:3003/from-html \
  -H "Content-Type: application/json" \
  -d '{"text": "<h1>Mon Titre</h1><p>Contenu de test</p>", "to": "asciidoc"}'
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

### 📂 Structure de la documentation

La documentation est organisée par type dans le dossier [`doc/`](doc/) :

```
doc/
├── README.md                                # Index de la documentation
├── specifications/                          # Spécifications et architecture
│   ├── PIPELINE.md                         # Spécification du pipeline (référence principale)
│   └── secure-converter.md                 # Moteur de conversion sécurisé
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
│   ├── frontend/             # Application frontend React
│   │   ├── src/
│   │   │   ├── components/   # Composants React réutilisables
│   │   │   │   ├── Panel.tsx
│   │   │   │   ├── FormatSelector.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── NavigationWindow.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/        # Hooks React personnalisés
│   │   │   │   ├── useHeadings.ts
│   │   │   │   ├── useFileHandling.ts
│   │   │   │   ├── useNavigationWindow.ts
│   │   │   │   └── index.ts
│   │   │   ├── converters/   # Convertisseurs frontend
│   │   │   │   ├── api.ts
│   │   │   │   ├── asciidoc-to-markdown.ts
│   │   │   │   ├── markdown-to-asciidoc.ts
│   │   │   │   ├── generic-converter.ts
│   │   │   │   ├── bookstack-adapter.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/        # Types TypeScript
│   │   │   │   └── index.ts
│   │   │   ├── utils/        # Utilitaires frontend
│   │   │   │   └── formatHelpers.ts
│   │   │   ├── constants/    # Constantes frontend
│   │   │   │   └── index.ts
│   │   │   ├── App.tsx       # Composant principal
│   │   │   ├── main.tsx      # Point d'entrée
│   │   │   └── styles.css    # Styles globaux
│   │   ├── index.html        # Template HTML
│   │   ├── package.json      # Configuration npm
│   │   ├── tsconfig.json     # Configuration TypeScript
│   │   └── vite.config.ts    # Configuration Vite
│   │
│   ├── backend/              # Application backend Node.js
│   │   ├── server.js         # Serveur Express principal
│   │   ├── services/         # Services de conversion
│   │   │   ├── convert.js    # Module de conversion principal
│   │   │   ├── secure-converter.js  # Moteur de conversion sécurisé
│   │   │   ├── pipeline-security.js # Module de sécurité du pipeline (PIPELINE.md)
│   │   │   ├── docverter.js  # Module Docverter
│   │   │   ├── panwriter.js  # Module PanWriter
│   │   │   └── index.js      # Exports centralisés
│   │   ├── config/           # Configuration backend
│   │   │   └── index.js
│   │   ├── routes/           # Routes API (à venir)
│   │   ├── middleware/       # Middleware Express (à venir)
│   │   ├── examples/         # Exemples d'utilisation
│   │   │   └── secure-converter-integration-example.js
│   │   ├── public/           # Fichiers statiques
│   │   │   ├── logo.png
│   │   │   └── rafale.jpg
│   │   ├── static/           # Fichiers HTML
│   │   │   └── index.html
│   │   ├── conversion-options.js      # Options de conversion
│   │   ├── conversion-options.schema.json  # Schéma JSON
│   │   └── package.json      # Configuration npm
│   │
│   └── shared/               # Éléments partagés entre frontend et backend
│       ├── adapters/         # Adaptateurs de format
│       │   ├── bookstack-adapter.js  # Version CommonJS pour backend
│       │   └── bookstack-adapter.ts  # Version TypeScript pour frontend
│       └── utils/            # Utilitaires partagés
│           └── index.js
│
├── doc/                      # Documentation complète
│   ├── PIPELINE.md                              # Spécification du pipeline (référence principale)
│   ├── secure-converter.md                      # Moteur de conversion sécurisé
│   ├── confirmation-security-guide.md           # Guide des tokens de confirmation
│   ├── secure-converter-frontend-integration.md # Intégration frontend
│   ├── conversion-options.md                    # Options de conversion
│   ├── encoding-options.md                      # Options d'encodage
│   └── normalization-advanced-options.md        # Options de normalisation avancée
├── lib/                      # Bibliothèque downdoc
├── bin/                      # Exécutables
├── test/                     # Tests
├── LICENSE                   # Licence MIT
└── README.md                 # Ce fichier
```

### 🎯 Organisation du code

#### Frontend (`api/frontend/`)
Application React/TypeScript modulaire :
- **components/** : Composants UI réutilisables
- **hooks/** : Hooks personnalisés (useHeadings, useFileHandling, useNavigationWindow)
- **converters/** : Logique de conversion côté client
- **types/** : Définitions TypeScript centralisées
- **utils/** : Utilitaires frontend
- **constants/** : Constantes de l'application

#### Backend (`api/backend/`)
Serveur Express avec services modulaires :
- **server.js** : Point d'entrée du serveur
- **services/** : Services de conversion (convert, secure-converter, docverter, panwriter)
- **config/** : Configuration centralisée
- **conversion-options.js** : Gestion des options de conversion
- **public/** : Fichiers statiques (logo, images de fond)
- **static/** : Fichiers HTML statiques

#### Shared (`api/shared/`)
Code partagé entre frontend et backend :
- **adapters/** : Adaptateurs de format (BookStack/Parsedown)
- **utils/** : Utilitaires partagés

### 📦 Imports recommandés

**Backend :**
```javascript
const { convertAsciiDoc } = require('./services/convert.js')
const { generateConfirmationToken } = require('./services/secure-converter.js')
const { adaptForBookStack } = require('../shared/adapters/bookstack-adapter.js')
```

**Frontend :**
```typescript
import { Panel, Modal } from './components'
import { useHeadings, useFileHandling } from './hooks'
import { convertText, convertAsciiDocToMarkdown } from './converters'
import { FormatType, PendingConversion } from './types'
```

## 🤝 Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 🔐 Sécurité

Ascend implémente une architecture de sécurité robuste basée sur les spécifications définies dans [PIPELINE.md](doc/PIPELINE.md).

### Fonctionnalités de sécurité

- **Isolation stricte** : Chaque conversion s'exécute dans un dossier temporaire unique avec permissions restrictives
- **Validation exhaustive** : 
  - Validation des chemins (protection path traversal, symlinks interdits)
  - Validation du type réel de fichier (MIME type)
  - Validation des formats et tailles de fichiers
- **Contrôle de ressources** :
  - Limite de conversions simultanées
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
```

Pour plus de détails, consultez [PIPELINE.md](doc/PIPELINE.md).

## 📝 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [downdoc](https://github.com/opendevise/downdoc) - Bibliothèque de conversion AsciiDoc → Markdown
- [Express.js](https://expressjs.com/) - Framework web pour Node.js
- [React](https://react.dev/) - Bibliothèque JavaScript pour les interfaces utilisateur
- [Vite](https://vitejs.dev/) - Build tool moderne

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une [issue](https://github.com/Kira-Torvaldson/ASCEND/issues) sur GitHub.

---


