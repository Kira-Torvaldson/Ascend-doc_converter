# Ascend — Stack conteneurs production (`container/`)

Ce dossier centralise **toute l'infrastructure de conteneurisation** et le **reverse proxy** nécessaires au déploiement d'Ascend en production, sans domaine codé en dur.

## Arborescence

- `container/docker-compose.yml` : stack Docker Compose (frontend + backend)
- `container/.env.example` : modèle de variables d'environnement (copier vers `.env`)
- `container/nginx/default.conf.template` : configuration Nginx (SPA + proxy `/api/`)
- `container/frontend/Dockerfile` : build Vite + runtime Nginx (multi-étapes)
- `container/backend/Dockerfile` : runtime Node/Express (production)

## Comportement réseau

- **Frontend** : servi par Nginx (port 80 dans le conteneur)
- **Backend** : service interne `backend:3003`
- **Proxy** : Nginx route `GET/POST /api/*` vers `http://backend:3003`
- **Fallback SPA** : `try_files ... /index.html` pour le routage React/Vite

## Variables d'environnement

1) Copier le modèle :

```bash
cd container
cp .env.example .env
```

2) Renseigner au minimum :

- `FRONTEND_HTTP_PORT` (ex. `8080` ou `80`)
- `API_KEY` (secret côté serveur, injecté par Nginx vers le backend)

Variables optionnelles :

- `LOGS_DIR`, `TMPDIR` : chemins internes backend (volumes nommés)
- `NGINX_CLIENT_MAX_BODY_SIZE` : limite de taille d'upload sur Nginx
- `DOMAIN`, `DOMAIN_ALT`, `ACME_EMAIL` : **préparation** pour une future couche TLS/ACME (aucun domaine n'est utilisé/codé ici)

## Protection API (anti-altération navigateur)

Une API ne peut pas être rendue « non modifiable » dans le navigateur, mais on peut bloquer la plupart des appels non autorisés en exigeant une **clé côté serveur**.

- Le backend rejette `/api/*` si `API_KEY` est défini et que `X-API-Key` ne correspond pas.
- Nginx ajoute automatiquement `X-API-Key` lors du proxy `/api/*`.
- Le navigateur **ne voit pas** la clé (elle n'est pas embarquée dans le bundle frontend).

## Build et démarrage

**Prérequis :** API client Docker **≥ 1.44** (Docker Desktop 4.25+). Sous WSL, éviter l'ancien paquet `docker.io` 20.10 — utiliser l'intégration Docker Desktop ou installer Docker CE récent ; voir [`operations/runbook.md`](../operations/runbook.md#docker-sous-wsl-client-trop-ancien).

**Vérification backend équivalente CI** (depuis la racine du dépôt) :

```bash
npm run check:docker:backend
```

Stack complète :

```bash
cd container
docker compose up -d --build
```

Depuis la racine (vérifications équivalentes CI) :

```bash
npm run check:docker:backend
npm run check:docker:frontend
npm run check:docker
```

Accès par défaut :

- `http://localhost:${FRONTEND_HTTP_PORT}`

## Arrêt

```bash
cd container
docker compose down
```

## Logs

```bash
cd container
docker compose logs -f --tail=200
```

Logs par service :

```bash
docker compose logs -f --tail=200 backend
docker compose logs -f --tail=200 frontend
```

## Notes importantes

- **Aucun domaine n'est codé en dur** dans Nginx/Compose/Dockerfiles.
- Le backend utilise des **volumes Docker nommés** pour les logs et fichiers temporaires.
- Pour ajouter TLS/Let's Encrypt plus tard, le faire via variables d'environnement et une couche reverse-proxy dédiée (ou en étendant Nginx), sans coder de domaine en dur.
