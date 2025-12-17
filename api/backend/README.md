# Backend Node.js - Ascend

Backend Express.js pour la conversion AsciiDoc ⇄ Markdown.

## Installation

```bash
cd api/backend
npm install
```

## Démarrage

```bash
# Mode production
npm start

# Mode développement (avec rechargement automatique)
npm run dev
```

Le serveur démarre sur `http://localhost:3003`

## Endpoints

- `POST /to-markdown` - Convertir AsciiDoc → Markdown
- `POST /to-asciidoc` - Convertir Markdown → AsciiDoc
- `GET /` - Page HTML simple
- `GET /public/*` - Fichiers statiques (images, etc.)
- `GET /static/*` - Fichiers statiques HTML

## Structure

- `server.js` - Serveur Express principal
- `package.json` - Dépendances Node.js
- `public/` - Fichiers statiques (images)
- `static/` - Fichiers HTML statiques

