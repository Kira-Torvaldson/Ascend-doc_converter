# Ascend - Docker

Lancement de l'application complète (frontend + backend) avec Docker Compose.

## Prérequis

- Docker
- Docker Compose v2

## Lancement

```bash
docker compose up --build
```

L'application sera accessible sur **http://localhost:8080**

## Arrêt

```bash
docker compose down
```

Pour supprimer aussi les volumes (logs, fichiers temporaires) :

```bash
docker compose down -v
```

## Architecture

- **Frontend** : SPA React/Vite servie par Nginx sur le port 80 (mappé 8080:80)
- **Backend** : Node.js Express sur le port 3003 (interne au réseau Docker)
- Les requêtes `/api/*` et les endpoints de conversion (`/to-markdown`, `/to-asciidoc`, etc.) sont proxyfiées vers le backend par Nginx

## Volumes persistants

- **ascend-logs** → `/app/logs` dans le conteneur backend (logs des conversions)
- **ascend-tmp** → `/app/tmp` dans le conteneur backend (fichiers temporaires des conversions)

Pour inspecter les volumes :

```bash
docker volume ls
docker volume inspect ascend-ascend-logs
```

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `docker compose up -d --build` | Lance en arrière-plan |
| `docker compose logs -f` | Affiche les logs en continu |
| `docker compose logs -f backend` | Logs backend uniquement |
| `docker compose ps` | État des conteneurs |
