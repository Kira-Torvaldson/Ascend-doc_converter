# Ascend — Production Container Stack (`container/`)

This folder centralizes **all containerization infrastructure** and the **reverse proxy** needed to deploy Ascend in production, without relying on any hardcoded domain.

## Layout

- `container/docker-compose.yml`: Docker Compose stack (frontend + backend)
- `container/.env.example`: environment variables template (copy to `.env`)
- `container/nginx/default.conf.template`: Nginx config (SPA + `/api/` proxy)
- `container/frontend/Dockerfile`: Vite build + Nginx runtime (multi-stage)
- `container/backend/Dockerfile`: Node/Express runtime (production)

## Network behavior

- **Frontend**: served by Nginx (port 80 inside the container)
- **Backend**: internal service `backend:3003`
- **Proxy**: Nginx routes `GET/POST /api/*` to `http://backend:3003`
- **SPA fallback**: `try_files ... /index.html` for React/Vite routing

## Environment variables

1) Copy the template:

```bash
cd container
cp .env.example .env
```

2) Fill at minimum:

- `FRONTEND_HTTP_PORT` (e.g. `8080` or `80`)
- `API_KEY` (server-side secret, injected by Nginx to the backend)

Optional variables:

- `LOGS_DIR`, `TMPDIR`: backend internal paths (named volumes)
- `NGINX_CLIENT_MAX_BODY_SIZE`: upload size limit on Nginx
- `DOMAIN`, `DOMAIN_ALT`, `ACME_EMAIL`: **preparation** for a future TLS/ACME layer (no domain is used/hardcoded here)

## API protection (browser anti-tampering)

An API cannot be made “unmodifiable” in the browser, but you can block most unauthorized calls by requiring a **server-side key**.

- The backend rejects `/api/*` if `API_KEY` is set and `X-API-Key` does not match.
- Nginx automatically adds `X-API-Key` when proxying `/api/*`.
- The browser **does not see** the key (it is not embedded in the frontend bundle).

## Build & start

**Prerequisite:** Docker client API **≥ 1.44** (Docker Desktop 4.25+). On WSL, avoid the legacy `docker.io` 20.10 package — use Docker Desktop integration or install current Docker CE; see [`doc/guides/operations/runbook.md`](../doc/guides/operations/runbook.md#docker-sous-wsl-client-trop-ancien).

**CI-equivalent backend check** (from repo root):

```bash
npm run check:docker:backend
```

Full stack:

```bash
cd container
docker compose up -d --build
```

Default access:

- `http://localhost:${FRONTEND_HTTP_PORT}`

## Stop

```bash
cd container
docker compose down
```

## Logs

```bash
cd container
docker compose logs -f --tail=200
```

Service logs:

```bash
docker compose logs -f --tail=200 backend
docker compose logs -f --tail=200 frontend
```

## Important notes

- **No domain is hardcoded** in Nginx/Compose/Dockerfiles.
- The backend uses **named Docker volumes** for logs and temporary files.
- If you later add TLS/Let’s Encrypt, do it via env vars and a dedicated reverse-proxy layer (or by extending Nginx), without hardcoding any domain.
