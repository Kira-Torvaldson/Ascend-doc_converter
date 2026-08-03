# Docker et déploiement

Deux contextes : **développement rapide** (racine) et **production** (`container/`).

## Option A — Docker Compose racine (HTTPS par IP)

```bash
docker compose up --build
```

| Accès | Détail |
|-------|--------|
| HTTPS | `https://<IP>` (certificat auto-signé) |
| HTTP | Redirigé vers HTTPS (port 80 → 443) |

Ports alternatifs : modifier `docker-compose.yml` (ex. `8080:80`, `8443:443`).

```bash
docker compose down        # Arrêt
docker compose down -v     # + suppression volumes (logs, tmp)
```

**Volumes :** `ascend-logs`, `ascend-tmp`

## Option B — Stack production (`container/`)

```bash
cd container
cp .env.example .env
# Renseigner FRONTEND_HTTP_PORT et API_KEY
docker compose up -d --build
```

| Composant | Rôle |
|-----------|------|
| Nginx | SPA + proxy `/api/*` |
| Backend | Express sur `backend:3003` (réseau interne) |

**Protection API :** si `API_KEY` est défini, Nginx injecte `X-API-Key` ; le navigateur ne voit pas la clé.

## Vérifications CI (depuis la racine)

```bash
npm run check:docker:backend
npm run check:docker:frontend
npm run check:docker
```

## Docker sous WSL

- Utiliser Docker Desktop (intégration WSL) ou Docker CE récent.
- Éviter le paquet `docker.io` 20.10 (client API 1.41 incompatible avec daemon 1.44+).
- En cas de doute : exécuter Docker depuis **PowerShell** plutôt que WSL.

## Certificat personnalisé (option racine)

Monter dans `docker-compose.yml` :

```yaml
frontend:
  volumes:
    - /chemin/cert.pem:/etc/nginx/ssl/cert.pem:ro
    - /chemin/key.pem:/etc/nginx/ssl/key.pem:ro
```

Puis `docker compose up -d --build`.
