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
- **Copie rapide** : Bouton de copie pour les résultats
- **Effacement** : Bouton pour effacer le contenu AsciiDoc
- **Conversion en temps réel** : Résultats instantanés
- **Gestion d'erreurs** : Messages d'erreur clairs et informatifs

## 🛠 Technologies

### Backend
- **Node.js** : Runtime JavaScript
- **Express.js** : Framework web
- **downdoc** : Bibliothèque de conversion AsciiDoc → Markdown
- **CORS** : Gestion des requêtes cross-origin

### Frontend
- **React 18** : Bibliothèque UI
- **TypeScript** : Typage statique
- **Vite** : Build tool et serveur de développement
- **CSS3** : Styles modernes avec effets visuels avancés

## 📦 Prérequis

- **Node.js** : Version 16.17.0 ou supérieure
- **npm** : Gestionnaire de paquets (inclus avec Node.js)

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
│   └── convert.js        # Module de conversion
├── lib/                  # Bibliothèque downdoc
└── README.md            # Ce fichier
```

## 🔌 API

### Endpoints

#### `POST /to-markdown`
Convertit du contenu AsciiDoc en Markdown.

**Requête :**
```json
{
  "text": "= Titre\n\nContenu AsciiDoc"
}
```

**Réponse :**
```json
{
  "markdown": "# Titre\n\nContenu Markdown"
}
```

#### `POST /to-asciidoc`
Convertit du contenu Markdown en AsciiDoc.

**Requête :**
```json
{
  "text": "# Titre\n\nContenu Markdown"
}
```

**Réponse :**
```json
{
  "asciidoc": "= Titre\n\nContenu AsciiDoc"
}
```

### Exemple avec cURL

```bash
# Conversion AsciiDoc → Markdown
curl -X POST http://localhost:3003/to-markdown \
  -H "Content-Type: application/json" \
  -d '{"text": "= Mon Titre\n\nContenu de test"}'

# Conversion Markdown → AsciiDoc
curl -X POST http://localhost:3003/to-asciidoc \
  -H "Content-Type: application/json" \
  -d '{"text": "# Mon Titre\n\nContenu de test"}'
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
├── api/
│   ├── backend/              # Backend Node.js/Express
│   │   ├── server.js         # Serveur principal
│   │   ├── package.json      # Configuration npm
│   │   ├── README.md         # Documentation backend
│   │   ├── public/           # Assets statiques
│   │   │   ├── logo.png
│   │   │   └── rafale.jpg
│   │   └── static/          # Fichiers HTML
│   │       └── index.html
│   ├── frontend/             # Frontend React/TypeScript
│   │   ├── src/
│   │   │   ├── App.tsx      # Composant principal
│   │   │   ├── main.tsx     # Point d'entrée
│   │   │   └── styles.css   # Styles
│   │   ├── index.html       # Template HTML
│   │   ├── package.json     # Configuration npm
│   │   ├── tsconfig.json    # Configuration TypeScript
│   │   └── vite.config.ts   # Configuration Vite
│   ├── convert.js           # Module de conversion
│   └── bookstack-adapter.js # Adaptateur BookStack
├── lib/                      # Bibliothèque downdoc
├── bin/                      # Exécutables
├── test/                     # Tests
├── LICENSE                   # Licence MIT
└── README.md                 # Ce fichier
```

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

**Fait avec ❤️ par l'équipe Ascend**

