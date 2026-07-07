# Ascend — Docker

Lancer l'application complète (frontend + backend) avec Docker Compose, accessible en **HTTPS** par adresse IP.

## Prérequis

- Docker
- Docker Compose v2

## Démarrage

```bash
docker compose up --build
```

## Accès

- **HTTPS (recommandé)** : **`https://<IP>`** (ex. `https://192.168.1.10`)
  - Le port 443 est mappé sur la machine hôte.
  - Utilise un certificat **auto-signé** généré au premier démarrage (avertissement navigateur : accepter / « Avancé » → « Continuer »).
- **HTTP** : les requêtes sur le port 80 sont redirigées vers HTTPS.

Pour trouver l'IP de la machine :

- Linux/macOS : `hostname -I` ou `ip addr`
- Windows : `ipconfig`

Si les ports 80/443 ne sont pas disponibles, modifiez `docker-compose.yml` par exemple :

```yaml
ports:
  - "8080:80"
  - "8443:443"
```

Puis ouvrez **`https://<IP>:8443`**.

## Arrêt

```bash
docker compose down
```

Pour supprimer aussi les volumes (logs, fichiers temporaires) :

```bash
docker compose down -v
```

## Architecture

- **Frontend** : SPA React/Vite servie par Nginx en **HTTPS** (ports 80 et 443).
- **Backend** : Node.js Express sur le port 3003 (réseau Docker interne).
- Les requêtes vers `/api/*`, `/public/*` et les endpoints de conversion sont proxifiées vers le backend par Nginx.

## Certificat

Un certificat auto-signé est créé automatiquement au premier démarrage du conteneur frontend. Pour utiliser **votre propre certificat** (Let's Encrypt, CA interne, etc.) :

1. Montez les fichiers dans le conteneur via `docker-compose.yml` :

   ```yaml
   frontend:
     volumes:
       - /chemin/vers/cert.pem:/etc/nginx/ssl/cert.pem:ro
       - /chemin/vers/key.pem:/etc/nginx/ssl/key.pem:ro
   ```

2. Redémarrez : `docker compose up -d --build`.

## Assets statiques

Pour l'image de fond personnalisée de l'application :

- placez `rafale.jpg` dans `api/backend/public/`
- elle sera servie à `/public/rafale.jpg` (dev via Vite, Docker via Nginx)
- sans ce fichier, l'application utilise le SVG de fond par défaut

## Volumes persistants

- **ascend-logs** : journaux de conversion (backend)
- **ascend-tmp** : fichiers temporaires de conversion (backend)

Inspecter les volumes :

```bash
docker volume ls
docker volume inspect ascend-ascend-logs
```

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `docker compose up -d --build` | Démarrer en arrière-plan |
| `docker compose logs -f` | Suivre les logs |
| `docker compose logs -f frontend` | Logs frontend (Nginx) |
| `docker compose logs -f backend` | Logs backend |
| `docker compose ps` | État des conteneurs |
