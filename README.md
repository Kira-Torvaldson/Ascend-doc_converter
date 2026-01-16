# 🚀 Ascend - Convertisseur AsciiDoc ⇄ Markdown

Application web moderne pour convertir des documents entre les formats AsciiDoc et Markdown, avec une interface utilisateur intuitive et élégante.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.17.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Démarrage](#-démarrage)
- [Utilisation](#-utilisation)
- [Architecture](#-architecture)
- [API](#-api)
- [Développement](#-développement)
- [Structure du projet](#-structure-du-projet)
- [Contribuer](#-contribuer)
- [License](#-license)

## ✨ Fonctionnalités

- **Conversion bidirectionnelle** : AsciiDoc ↔ Markdown
- **Interface moderne** : Design épuré avec effet glassmorphism
- **Import de fichiers** : Support pour fichiers individuels et dossiers complets
- **Navigation dans le document** : Affichage hiérarchique des chapitres et sections
- **Mode édition avec confirmation** : Édition sécurisée des résultats avec modales de confirmation
- **Sauvegarde/Annulation** : Système de sauvegarde avec restauration automatique en cas d'annulation
- **Copie rapide** : Bouton de copie pour les résultats
- **Effacement** : Bouton pour effacer le contenu AsciiDoc
- **Conversion en temps réel** : Résultats instantanés
- **Gestion d'erreurs** : Messages d'erreur clairs et informatifs

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

1. **Ouvrir l'application** dans votre navigateur : `http://localhost:5173`

2. **Conversion AsciiDoc → Markdown** :
   - Entrez ou importez du contenu AsciiDoc dans le panneau de gauche
   - Cliquez sur "Convertir"
   - Le résultat Markdown apparaît dans le panneau de droite

3. **Conversion Markdown → AsciiDoc** :
   - Utilisez les flèches pour basculer vers le mode Markdown → AsciiDoc
   - Entrez ou importez du contenu Markdown
   - Cliquez sur "Convertir"
   - Le résultat AsciiDoc apparaît dans le panneau de droite

4. **Import de fichiers** :
   - Cliquez sur 📄 pour importer un fichier individuel
   - Cliquez sur 📁 pour importer un dossier complet
   - Sélectionnez le fichier à convertir dans le sélecteur

5. **Navigation** :
   - La section "Navigation dans le fichier" affiche la structure hiérarchique
   - Cliquez sur un chapitre pour naviguer directement

6. **Édition des résultats** :
   - Cliquez sur le bouton ✏️ pour activer le mode édition
   - Une modale de confirmation s'affiche avec les options "Oui" (vert) et "Non" (rouge)
   - En mode édition, vous pouvez modifier le contenu directement dans la zone de texte
   - Les boutons de copie et d'effacement sont désactivés pendant l'édition
   - Cliquez sur 💾 Sauvegarder pour valider vos modifications (modale de confirmation)
   - Cliquez sur ✕ Annuler pour annuler l'édition et restaurer le contenu original (modale de confirmation)
   - Si vous cliquez sur "Non" dans la modale de sauvegarde, les modifications sont annulées automatiquement

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

```
Ascend/
├── api/
│   ├── backend/          # Serveur Express.js
│   │   ├── server.js     # Point d'entrée du serveur
│   │   ├── package.json  # Dépendances backend
│   │   ├── public/       # Fichiers statiques (images)
│   │   └── static/       # Fichiers HTML statiques
│   ├── frontend/         # Application React
│   │   ├── src/
│   │   │   ├── App.tsx   # Composant principal
│   │   │   ├── main.tsx  # Point d'entrée React
│   │   │   └── styles.css # Styles CSS
│   │   └── package.json  # Dépendances frontend
│   ├── convert.js        # Module de conversion principal
│   ├── secure-converter.js # Moteur de conversion sécurisé (tokens + isolation)
│   ├── secure-converter-integration-example.js # Exemple d'intégration
│   ├── conversion-options.js # Options de conversion (unifié)
│   ├── bookstack-adapter.js # Adaptateur BookStack
│   ├── docverter.js      # Module Docverter (préparé pour intégration)
│   └── panwriter.js      # Module PanWriter (préparé pour intégration)
├── doc/                  # Documentation
│   ├── confirmation-security-guide.md
│   ├── conversion-options.md
│   ├── encoding-options.md
│   ├── normalization-advanced-options.md
│   ├── secure-converter.md
│   └── secure-converter-frontend-integration.md
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

### Modules préparés pour intégration future

Les modules suivants sont préparés dans le projet mais ne sont pas encore intégrés avec des endpoints :

- **Docverter** (`api/docverter.js`) : Module de conversion de documents
  - Formats supportés : rtf, pdf, html, txt, markdown, docx, xlsx, pptx, odt, ods, odp, png, jpg, jpeg, gif
  - Fonction : `convertWithDocverter(content, fromFormat, toFormat)`
  - Statut : Prêt pour intégration, endpoints à créer

- **PanWriter** (`api/panwriter.js`) : Module d'édition et conversion de documents
  - Formats supportés : markdown, asciidoc, html, docx, odt, rtf, latex, tex
  - Fonctions : `convertWithPanWriter(content, fromFormat, toFormat)`, `editWithPanWriter(content, format)`
  - Statut : Prêt pour intégration, endpoints à créer

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
│   │   │   │   ├── bookstack-adapter.js
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
│       │   └── bookstack-adapter.js
│       └── utils/            # Utilitaires partagés
│           └── index.js
│
├── doc/                      # Documentation
│   ├── confirmation-security-guide.md
│   ├── conversion-options.md
│   ├── encoding-options.md
│   ├── normalization-advanced-options.md
│   ├── secure-converter.md
│   └── secure-converter-frontend-integration.md
├── lib/                      # Bibliothèque downdoc
├── bin/                      # Exécutables
├── test/                     # Tests
├── LICENSE                   # Licence MIT
└── README.md                 # Ce fichier
```

### 🎯 Organisation du dossier `api/`

Le dossier `api/` est organisé en trois dossiers principaux pour une séparation claire des responsabilités :

#### 1. **frontend/** - Application React
Contient toute l'interface utilisateur React avec une structure modulaire :
- **components/** : Composants UI réutilisables (Panel, Modal, NavigationWindow, etc.)
- **hooks/** : Hooks React personnalisés (useHeadings, useFileHandling, useNavigationWindow)
- **converters/** : Logique de conversion côté client
- **types/** : Définitions TypeScript centralisées
- **utils/** : Utilitaires frontend
- **constants/** : Constantes de l'application

#### 2. **backend/** - Serveur et services
Contient toute la logique serveur et les services de conversion :
- **server.js** : Serveur Express principal
- **services/** : Services de conversion (convert.js, secure-converter.js, docverter.js, panwriter.js)
- **config/** : Configuration centralisée
- **conversion-options.js** : Gestion des options de conversion
- **examples/** : Exemples d'utilisation
- **public/** et **static/** : Fichiers statiques

#### 3. **shared/** - Éléments partagés
Contient le code partagé entre frontend et backend :
- **adapters/** : Adaptateurs de format (BookStack, etc.)
- **utils/** : Utilitaires partagés

### 📦 Imports recommandés

**Backend :**
```javascript
// Services de conversion
const { convertAsciiDoc } = require('./services/convert.js')
const { generateConfirmationToken } = require('./services/secure-converter.js')

// Options de conversion
const { mergeOptions, validateOptions } = require('./conversion-options.js')

// Adaptateurs partagés
const { adaptForBookStack } = require('../shared/adapters/bookstack-adapter.js')
```

**Frontend :**
```typescript
// Composants
import { Panel, Modal } from './components'

// Hooks
import { useHeadings, useFileHandling } from './hooks'

// Convertisseurs
import { convertText } from './converters'
```

### 📝 Notes importantes

- **Séparation claire** : Frontend et backend sont complètement séparés
- **Code partagé** : Utiliser `shared/` pour le code commun
- **Organisation modulaire** : Chaque dossier a une responsabilité claire
- **Exports centralisés** : Chaque dossier contient un fichier `index.ts` ou `index.js` pour faciliter les imports

## 🤝 Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

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


