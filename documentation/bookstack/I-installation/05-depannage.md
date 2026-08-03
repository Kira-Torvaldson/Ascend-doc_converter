# Dépannage courant

## Le frontend ne joint pas le backend

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| Erreur CORS | Port Vite ≠ origine autorisée | Vérifier middleware CORS dev (`localhost` / `127.0.0.1`) |
| `ECONNREFUSED` | Backend arrêté | `npm run dev:back` ou `npm run dev` |
| Mauvais port API | Vite sur 5174+ | URL API dans `api/frontend/src/converters/api.ts` |

## Port déjà utilisé (`EADDRINUSE :3003`)

```bash
# Windows PowerShell — identifier le processus
netstat -ano | findstr :3003
taskkill /PID <pid> /F
```

## Conversion échoue avec `PAYLOAD_TOO_LARGE`

- Fichier > `MAX_INPUT_SIZE_MB` (défaut 5 Mo).
- Vérifier limite Nginx si Docker (`NGINX_CLIENT_MAX_BODY_SIZE`).

## Docker : client API trop ancien (WSL)

```
Error: client version 1.41 is too old. Minimum supported API version is 1.44
```

→ Docker Desktop à jour ou Docker CE récent ; éviter `docker.io` 20.10 sous WSL.

## Build frontend Docker échoue

```bash
npm run check:docker:frontend
```

Vérifier `container/frontend/Dockerfile` et logs `docker compose logs frontend`.

## Assets `/public/` invisibles en dev

Le backend doit tourner : Vite proxy `/public` → `http://localhost:3003`.

## Corrélation des erreurs

Chaque erreur structurée expose :

- `error.code` — code machine
- `hint` — indication utilisateur
- `requestId` — corrélation logs backend

Rechercher le `requestId` dans les logs de conversion.

## Checklist release locale

```bash
npm run check:version
npm run check:ascend:ci
npm run check:docker
```

Doc complète : `documentation/I-installation/operations/runbook.md`
