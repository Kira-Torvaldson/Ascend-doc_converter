# Assets statiques Ascend (backend)

Servis par Express à `/public/*` (voir `api/backend/app.js`).

## Fichiers optionnels (non versionnés)

| Fichier | URL | Usage |
|---------|-----|--------|
| `rafale.jpg` | `/public/rafale.jpg` | Image de fond personnalisée (remplace le SVG embarqué du frontend si présente) |
| `ascend-logo.png` | `/public/ascend-logo.png` | Logo PNG personnalisé (remplace le SVG par défaut) |

Sans ces fichiers, le frontend utilise les SVG embarqués (`api/frontend/src/assets/`).

## Dev

Avec `npm run dev`, Vite proxy `/public` → `http://localhost:3003` : le backend doit tourner pour servir les assets custom.
