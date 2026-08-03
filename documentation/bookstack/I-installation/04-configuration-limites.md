# Configuration et limites

Référence opérationnelle des limites **en vigueur** (v0.0.1.7). Source : EnvMap + middleware Express.

## Matrice des limites (production)

| Couche | Valeur par défaut | Variable / source |
|--------|-------------------|-------------------|
| Taille entrée conversion | **5 Mo** | `MAX_INPUT_SIZE_MB` |
| Corps JSON Express | **~6 Mo** | marge ~20 % au-dessus |
| Validation frontend | **5 Mo** | `GET /api/config/limits` |
| Upload Nginx (Docker) | **6m** | `NGINX_CLIENT_MAX_BODY_SIZE` |
| Délai conversion | **30 s** | `CONVERSION_TIMEOUT_MS` |
| Rate limit | **100 req / 15 min / IP** | middleware rate-limit |
| Fetch UI | **30 s** | frontend |

**Surcharge :** définir les variables dans `.env` ou `container/.env` (voir `.env.example`).

## Endpoints de configuration

| Méthode | Route | Usage |
|---------|-------|-------|
| GET | `/api/config/limits` | Limites exposées à l'UI |
| GET | `/api/metrics` | Compteurs (clé API si `API_KEY` défini) |

## Profils d'exécution (aperçu)

| Profil | Timeout | Mémoire | Fichier max | Usage |
|--------|---------|---------|-------------|-------|
| `default` | 30 s | 512 Mo | 10 Mo | Standard |
| `strict` | 15 s | 256 Mo | 5 Mo | Haute sécurité |
| `performance` | 120 s | 2 Go | 50 Mo | Gros fichiers |

> Les profils aspirants peuvent différer du runtime ; la matrice EnvMap fait foi pour le comportement actuel.

## Variables clés (`container/.env`)

| Variable | Description |
|----------|-------------|
| `FRONTEND_HTTP_PORT` | Port HTTP exposé (ex. 8080) |
| `API_KEY` | Secret serveur (prod) |
| `MAX_INPUT_SIZE_MB` | Limite taille source |
| `CONVERSION_TIMEOUT_MS` | Timeout pipeline |
| `NGINX_CLIENT_MAX_BODY_SIZE` | Limite upload Nginx |

## Bonnes pratiques

1. Toujours aligner Nginx ≥ limite backend + marge.
2. Vérifier `GET /api/config/limits` après changement d'env.
3. Documenter toute surcharge dans le runbook d'équipe.

Doc détaillée : `documentation/I-installation/configuration.md`
