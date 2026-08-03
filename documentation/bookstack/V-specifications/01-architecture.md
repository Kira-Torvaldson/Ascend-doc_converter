# Architecture

## Principes fondateurs

| # | Principe | En une phrase |
|---|----------|---------------|
| 1 | **Local-first** | Tout le traitement est local, sans API externe |
| 2 | **Modularité** | Modules indépendants, interface standard |
| 3 | **Isolation** | Une conversion = un sandbox, aucun état partagé |
| 4 | **Sécurité dès la conception** | Validation aux frontières, sandbox, limites |

## Composants

```
┌─────────────────────────────────────────────────┐
│  Frontend (React/Vite)                          │
│  - UI conversion, modales erreur, paramètres    │
└────────────────────┬────────────────────────────┘
                     │ HTTP /api/*
┌────────────────────▼────────────────────────────┐
│  Backend (Express)                              │
│  - Routes, CORS, rate-limit, EnvMap             │
│  - conversion-service → orchestrateur           │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  Modules (wrappers)                             │
│  downdoc, pandoc, text2markdown, …              │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  Stockage temporaire + logs JSON                │
└─────────────────────────────────────────────────┘
```

## Couches transverses

| Couche | Rôle |
|--------|------|
| **EnvMap** | Configuration centralisée (limites, chemins) |
| **Middleware** | CORS, rate-limit, validation corps |
| **Logs** | Structurés, corrélés par `requestId` |
| **Nginx** (Docker) | HTTPS, proxy API, limite upload |

## Déploiement

| Mode | Description |
|------|-------------|
| Dev | Vite + Express séparés (`npm run dev`) |
| Docker racine | Compose HTTPS, certificat auto-signé |
| Production | `container/` — Nginx + API_KEY |

## Ce qui n'est pas figé (alpha)

- Liste exacte des endpoints publics
- Profils d'exécution vs runtime EnvMap
- Sandboxing avancé (V2+)

Doc détaillée : `documentation/V-specifications/architecture.md`
