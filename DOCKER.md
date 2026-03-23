# Ascend - Docker

Lancement de l'application complète (frontend + backend) avec Docker Compose, en **HTTPS** accessible par IP.

## Prérequis

- Docker
- Docker Compose v2

## Lancement

```bash
docker compose up --build
```

## Accès

- **HTTPS (recommandé)** : **https://&lt;IP&gt;** (ex. https://192.168.1.10)
  - Port 443 mappé sur la machine hôte.
  - Utilise un certificat **auto-signé** généré au premier démarrage (le navigateur affichera un avertissement de sécurité : accepter / « Avancé » → « Accéder au site »).
- **HTTP** : les requêtes sur le port 80 sont redirigées vers HTTPS.

Pour connaître l’IP de la machine :

- Linux/Mac : `hostname -I` ou `ip addr`
- Windows : `ipconfig`

Si les ports 80/443 ne sont pas utilisables (ex. déjà pris ou droits insuffisants), modifiez dans `docker-compose.yml` par exemple :

```yaml
ports:
  - "8080:80"
  - "8443:443"
```

Puis accédez à **https://&lt;IP&gt;:8443**.

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
- Les requêtes `/api/*`, `/public/*` et les endpoints de conversion sont proxyfiées vers le backend par Nginx.

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

## Ressources statiques

Pour utiliser l'image de fond personnalisée de l'application :

- placez le fichier `rafale.jpg` dans `api/backend/public/`
- l'image sera servie à l'URL `/public/rafale.jpg` (en dev via Vite, en Docker via Nginx)
- sans ce fichier, l'application utilise uniquement la couleur de fond par défaut

## Volumes persistants

- **ascend-logs** : logs des conversions (backend).
- **ascend-tmp** : fichiers temporaires des conversions (backend).

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
| `docker compose logs -f frontend` | Logs frontend (Nginx) |
| `docker compose logs -f backend` | Logs backend |
| `docker compose ps` | État des conteneurs |
