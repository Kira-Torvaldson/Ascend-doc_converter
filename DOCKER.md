# Ascend - Docker

Run the full application (frontend + backend) with Docker Compose, accessible over **HTTPS** by IP.

## Prerequisites

- Docker
- Docker Compose v2

## Start

```bash
docker compose up --build
```

## Access

- **HTTPS (recommended)**: **`https://<IP>`** (e.g. `https://192.168.1.10`)
  - Port 443 is mapped on the host machine.
  - Uses a **self-signed** certificate generated on first start (your browser will show a security warning: accept it / “Advanced” → “Proceed”).
- **HTTP**: requests on port 80 are redirected to HTTPS.

To find your machine IP:

- Linux/macOS: `hostname -I` or `ip addr`
- Windows: `ipconfig`

If ports 80/443 are not available (already in use or insufficient rights), edit `docker-compose.yml` for example:

```yaml
ports:
  - "8080:80"
  - "8443:443"
```

Then open **`https://<IP>:8443`**.

## Stop

```bash
docker compose down
```

To remove volumes too (logs, temporary files):

```bash
docker compose down -v
```

## Architecture

- **Frontend**: React/Vite SPA served by Nginx over **HTTPS** (ports 80 and 443).
- **Backend**: Node.js Express on port 3003 (internal Docker network).
- Requests to `/api/*`, `/public/*`, and conversion endpoints are proxied to the backend by Nginx.

## Certificate

A self-signed certificate is automatically created on the first frontend container start. To use **your own certificate** (Let’s Encrypt, internal CA, etc.):

1. Mount the files into the container via `docker-compose.yml`:

   ```yaml
   frontend:
     volumes:
       - /path/to/cert.pem:/etc/nginx/ssl/cert.pem:ro
       - /path/to/key.pem:/etc/nginx/ssl/key.pem:ro
   ```

2. Restart: `docker compose up -d --build`.

## Static assets

To use the app’s custom background image:

- place `rafale.jpg` in `api/backend/public/`
- it will be served at `/public/rafale.jpg` (dev via Vite, Docker via Nginx)
- without this file, the app falls back to the default background color only

## Persistent volumes

- **ascend-logs**: conversion logs (backend)
- **ascend-tmp**: conversion temporary files (backend)

Inspect volumes:

```bash
docker volume ls
docker volume inspect ascend-ascend-logs
```

## Useful commands

| Command | Description |
|--------|-------------|
| `docker compose up -d --build` | Start in the background |
| `docker compose logs -f` | Follow logs |
| `docker compose logs -f frontend` | Frontend logs (Nginx) |
| `docker compose logs -f backend` | Backend logs |
| `docker compose ps` | Container status |
