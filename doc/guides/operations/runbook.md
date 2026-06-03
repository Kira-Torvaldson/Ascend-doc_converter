# Runbook opérations — Ascend

Guide pour démarrer la stack, diagnostiquer les conversions et valider une release en local ou Docker.

**Version documentée :** `0.0.1.4.7+` (backend / frontend alignés via `npm run check:version`).

---

## Prérequis

| Outil | Version minimale | Usage |
|-------|------------------|--------|
| Node.js | 20 (CI Ascend), 16+ (package racine `downdoc`) | Dev + tests |
| npm | 9+ | Workspaces `api/backend`, `api/frontend` |
| Pandoc | 3.x | Conversions Markdown → AsciiDoc (e2e, golden, prod Docker) |

**Installation Pandoc (exemples) :**

- Ubuntu / CI : `sudo apt-get install -y pandoc`
- Windows : [pandoc.org/installing](https://pandoc.org/installing.html)
- Docker backend : `pandoc-cli` dans `container/backend/Dockerfile` (Alpine)

---

## Démarrage rapide (développement, < 15 min)

### 1. Cloner et installer

```bash
git clone <url-du-repo> Ascend
cd Ascend
npm ci
npm --prefix api/backend ci
npm --prefix api/frontend ci
```

### 2. Vérifier les versions

```bash
npm run check:version
```

Attendu : message de succès, versions `api/backend` et `api/frontend` identiques (ex. `0.0.1.4.7`).

### 3. Lancer front + back

```bash
npm run dev
```

| Service | URL | Détail |
|---------|-----|--------|
| Frontend (Vite) | http://localhost:5173 | UI React |
| Backend (Express) | http://localhost:3003 | API ; le front appelle `http://localhost:3003` par défaut (`api/frontend/src/converters/api.ts`) |

**Variantes :**

```bash
npm run dev:front   # Vite seul
npm run dev:back    # node --watch api/backend/server.js
```

### 4. Smoke test API

```bash
npm --prefix api/backend run test:smoke
```

### 5. Suite de validation complète (post-changements)

```bash
npm run check:version
npm --prefix api/backend run test:golden
npm --prefix api/backend run test:roundtrip
npm --prefix api/frontend run test
npm run test:abuse
```

---

## Déploiement Docker (production)

Référence détaillée : [`container/README.md`](../../../container/README.md).

```bash
cd container
cp .env.example .env
# Renseigner FRONTEND_HTTP_PORT (ex. 8080) et API_KEY en production
docker compose up -d --build
```

Accès : `http://localhost:${FRONTEND_HTTP_PORT}`

- Nginx sert le SPA et proxy `/api/*` vers `backend:3003`.
- `X-API-Key` est injecté par Nginx ; ne pas exposer `API_KEY` dans le bundle front.
- Pandoc est inclus dans l’image backend (`pandoc-cli`).

**Logs conteneurs :**

```bash
cd container
docker compose logs -f --tail=200
docker compose logs -f --tail=200 backend
```

**Arrêt :**

```bash
docker compose down
```

---

## Logs et corrélation (`requestId`)

### Fichiers de conversion

| Emplacement | Contenu |
|-------------|---------|
| `api/logs/` | Un fichier JSON par `conversionId` (si logging fichier activé) |
| stdout backend | `[INFO]` / `[ERROR]` pendant les conversions |

### Request ID (ASC-006)

Chaque réponse API de conversion inclut `meta.requestId` (et l’en-tête HTTP `X-Request-Id`).

**Côté client :** le front envoie `X-Request-Id` (voir `buildConversionFetchHeaders()` dans `api/frontend/src/converters/api.ts`).

**Debug d’un échec :**

1. Reproduire la conversion dans l’UI ou via `curl`.
2. Noter `requestId` dans la réponse JSON (`meta.requestId` ou en-tête `X-Request-Id`).
3. Chercher ce UUID dans les logs serveur / fichier `api/logs/<conversionId>.log` si présent.

**Exemple curl avec corrélation :**

```bash
curl -s -X POST http://127.0.0.1:3003/api/to-markdown \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: debug-manual-001" \
  -d '{"text":"= Test\n\nHello."}' | jq .
```

### Codes d’erreur et hints UI

Les réponses d’échec utilisent `error.code`, `error.category`, `error.hint` (enveloppe normalisée). Mapping UI : `api/frontend/src/utils/error-code-messages.ts`.

Codes fréquents : `EMPTY_INPUT`, `PAYLOAD_TOO_LARGE`, `CONVERSION_FAILED`, `CONVERSION_TIMEOUT`.

---

## Limites runtime

Source unique backend : `api/backend/services/config/conversion-limits.js` + EnvMap `MAX_INPUT_SIZE_MB`.

| Couche | Défaut | Variable |
|--------|--------|----------|
| Entrée conversion | 5 Mo | `MAX_INPUT_SIZE_MB` |
| Express body parser | ~6 Mo (marge 20 %) | dérivé automatiquement |
| UI (source) | 5 Mo | `GET /api/config/limits` |
| Nginx (Docker) | 6m | `NGINX_CLIENT_MAX_BODY_SIZE` |
| Rate limit | 100 req / 15 min / IP | middleware rate-limit |
| Timeout conversion | 30 s | `CONVERSION_TIMEOUT_MS` |

Matrice complète : [`doc/references/configuration.md`](../../references/configuration.md#production-limits-matrix-ascend-00147).

**Vérifier les limites exposées :**

```bash
curl -s http://127.0.0.1:3003/api/config/limits
```

---

## Métriques (ASC-007)

```bash
curl -s http://127.0.0.1:3003/api/metrics
```

En production avec `API_KEY` défini, fournir `X-API-Key` identique.

---

## Release et CI

| Commande | Rôle |
|----------|------|
| `npm run release:bump -- 0.0.1.4.8` | Bump version (7 zones) |
| `npm run check:version` | Garde-fou cohérence |
| `node scripts/release-bump.js --dry-run 0.0.1.4.8` | Simulation sans écriture |

Workflow GitHub : job `ascend` (Node 20, Pandoc, golden, roundtrip, abuse) — voir `.github/workflows/ci.yml`.

---

## Dépannage

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| 401 sur `/api/*` en Docker | `API_KEY` requis | Utiliser l’URL front (Nginx injecte la clé) ou passer `X-API-Key` en curl |
| 413 / `PAYLOAD_TOO_LARGE` | Fichier > limite | Vérifier `MAX_INPUT_SIZE_MB` et `NGINX_CLIENT_MAX_BODY_SIZE` |
| 429 | Rate limit | Attendre 15 min ou tester depuis une autre IP |
| Pandoc introuvable | Binaire absent | Installer Pandoc ou reconstruire l’image Docker backend |
| Versions désync | Bump partiel | `npm run check:version` puis `release:bump` |
| e2e golden échoue | Pandoc / downdoc | `which pandoc` ; relancer `npm --prefix api/backend run test:golden` |

---

## Références

- Configuration : [`doc/references/configuration.md`](../../references/configuration.md)
- Axes d’amélioration : [`doc/specs/axes-ameliorations-0.0.1.4.7.md`](../../specs/axes-ameliorations-0.0.1.4.7.md)
- Roadmap : [`doc/specs/roadmap.md`](../../specs/roadmap.md)
