# Démarrage rapide (développement)

Objectif : lancer Ascend en local en moins de 15 minutes.

## Prérequis

| Outil | Version | Obligatoire |
|-------|---------|-------------|
| Node.js | 20 (CI), 16+ min | Oui |
| npm | 9+ | Oui |
| Pandoc | 3.x | Oui (conversions MD ↔ AsciiDoc) |
| Docker | Client API ≥ 1.44 | Non (CI / prod) |

## Installation

```bash
git clone <url-du-repo> Ascend
cd Ascend
npm ci
npm --prefix api/backend ci
npm --prefix api/frontend ci
npm run check:version
```

## Lancer l'application

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3003 |

Variantes : `npm run dev:front` / `npm run dev:back`

## Vérifications rapides

```bash
npm run check:version      # Versions backend/frontend alignées
npm run check:ascend:ci    # Suite de tests CI
```

## Assets personnalisés (optionnel)

Placer dans `api/backend/public/` (non versionnés) :

| Fichier | Effet |
|---------|-------|
| `rafale.jpg` | Fond d'écran personnalisé |
| `ascend-logo.png` | Logo PNG custom |

Le backend doit tourner pour servir `/public/*` en dev.

## Prochaine étape

→ **Docker et déploiement** pour la stack conteneurisée.
