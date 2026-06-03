# Axes d'amélioration — Ascend (post `0.0.1.4.7`)

| Champ | Valeur |
|-------|--------|
| Version actuelle Ascend | `0.0.1.4.7` (`api/frontend` + `api/backend`) |
| Version racine npm (`downdoc`) | `1.0.2-stable` — **ne pas** aligner sur Ascend |
| Branche release GitHub | `release-0.0.1.4.7` → remote `github` |
| Tag | `v0.0.1.4.7` |
| Prochaine version cible | `0.0.1.4.8` |
| Repo GitHub | `Kira-Torvaldson/Ascend-doc_converter` |

---

## 1. Matrice des limites (état réel — à corriger)

| Couche | Valeur | Octets | Fichier | Ligne(s) / clé |
|--------|--------|--------|---------|----------------|
| UI validation source | **2 Mo** | `2 × 1024² = 2_097_152` | `api/frontend/src/App.tsx` | `MAX_SOURCE_SIZE_MB = 2` (L70) ; checks L1754, L2195 |
| EnvMap backend | **5 Mo** défaut | `5 × 1024² = 5_242_880` | `api/backend/services/config/envmap.module.js` | `MAX_INPUT_SIZE_MB.default: 5` (L135–140) |
| Validation sécurité | **5 Mo** fallback | `5_242_880` | `lib/security/validate-conversion-request.js` | `DEFAULT_MAX_INPUT_SIZE_BYTES` (L8) ; `getMaxInputSizeBytes()` (L32–55) |
| Express JSON body | **50 Mo** | `52_428_800` | `api/backend/app.js` | `express.json({ limit: '50mb' })` (L43–44) |
| Modules conversion fichier | **50 Mo** | `52_428_800` | voir tableau modules ci-dessous | `MAX_FILE_SIZE: 50 * 1024 * 1024` |
| Nginx Docker | **10 Mo** défaut | — | `container/docker-compose.yml` | `NGINX_CLIENT_MAX_BODY_SIZE:-10m` |
| Rate limit API | **100 req / 15 min / IP** | — | `api/backend/middleware/security/rate-limit.middleware.js` | `windowMs: 15*60*1000`, `limit: 100` (L5–8) |
| Timeout fetch UI | **30 s** | — | `api/frontend/src/converters/generic-converter.ts` | `setTimeout(..., 30000)` (L181) |
| EnvMap timeout conversion | **30 s** défaut | — | `envmap.module.js` | `CONVERSION_TIMEOUT_MS.default: 30000` (L143–148) |
| EnvMap wall time | **60 s** défaut | — | `envmap.module.js` | `MAX_WALL_TIME_MS.default: 60000` (L167–172) |

### Modules avec `MAX_FILE_SIZE: 50 * 1024 * 1024`

| Fichier | Ligne approx. |
|---------|----------------|
| `api/backend/services/modules/text2markdown.module.js` | L26 |
| `api/backend/services/modules/adoc-to-md.converter.js` | L48 |
| `api/backend/services/modules/docverter.module.js` | L26 |
| `api/backend/services/modules/panwriter.module.js` | L26 |

### Valeur cible unifiée (Action I)

| Paramètre | Valeur proposée | Source unique |
|-----------|-----------------|----------------|
| `MAX_INPUT_SIZE_MB` | `5` | `envmap.module.js` uniquement |
| `MAX_SOURCE_UI_MB` | `5` (aligné backend) | `GET /api/config/limits` → `App.tsx` |
| `express.json limit` | `6mb` (marge) | `app.js` L43 |
| `MAX_FILE_SIZE` modules | `envMap.get('MAX_INPUT_SIZE_MB') * 1024²` | chaque `*.module.js` |
| `NGINX_CLIENT_MAX_BODY_SIZE` | `6m` | `container/docker-compose.yml` |

**Test d'acceptation Action I :**

```bash
# Backend démarré (port 3000 exemple)
curl -s -X POST http://127.0.0.1:3000/api/to-markdown \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"$(python -c "print('x'*6000000)")\"}"
# Attendu: HTTP 400, body JSON success:false, error.code PAYLOAD_TOO_LARGE ou équivalent
```

```bash
# Frontend: coller source > 5 Mo → message identique au backend (même nombre de Mo affiché)
```

---

## 2. API conversion — référence exacte

### Montage Express (`api/backend/app.js`)

| Ordre | Middleware / route | Lignes |
|-------|-------------------|--------|
| 1 | `corsMiddleware` | L37 |
| 2 | `helmetMiddleware` | L40 |
| 3 | `express.json` / `urlencoded` limit **50mb** | L43–44 |
| 4 | `/api` + `apiKeyMiddleware` | L79 |
| 5 | `/api` + `rateLimitMiddleware` | L80 |
| 6 | `conversionRoutes` | L81 |
| 7 | `apiRoutes` | L83 |
| 8 | `/api/proxy` | L86 |
| 9 | `roundtripRoutes` | L89 |

**Insertion `requestId` (Action G) :** nouveau middleware **entre L40 et L43** (après helmet, avant body parser).

### Routes (`api/backend/routes/conversion.routes.js`)

| Méthode | Path monté | Handler | `conversionId` |
|---------|------------|---------|----------------|
| POST | `/api/to-markdown` | L313–… | `randomUUID()` L322 |
| POST | `/api/to-asciidoc` | L492–… | idem pattern |
| POST | `/api/from-html` | L596–… | idem |
| POST | `/api/text-to-markdown` | L716–… | idem |

**Helper erreur route :** `routeFailureError(code, message, details, recoverable)` — L21–23.  
**Builders échec :** `buildToMarkdownFailure`, `buildToAsciidocFailure`, etc. — utilisent `createFailureResult` depuis `api/backend/src/utils/conversion-result.js`.

### Codes `error.code` émis par les routes (inventaire grep)

| Code | Contexte (fichier / zone) |
|------|---------------------------|
| `EMPTY_INPUT` | L339, L512, L618, L736 — `!text.trim()` |
| `CONVERSION_FAILED` | L81, L210, L226, L294, L408, L430, L632 — échec conversion / validation sortie |
| `INTERNAL_ERROR` | L87, L216, L232, L447, L467, L583 — exception non classée |
| Détails `reason` dans `details` | `OUTPUT_IS_INPUT` (L410), `OUTPUT_INVALID_FORMAT` (L432), `OUTPUT_FORMAT_EMPTY` (L634) |

### Codes sécurité (`lib/errors/security-errors.js` L6–17)

`FORMAT_UNSUPPORTED`, `PAYLOAD_TOO_LARGE`, `ENCODING_INVALID`, `MIME_MISMATCH`, `PATH_TRAVERSAL`, `SYMLINK_REJECTED`, `NETWORK_ACCESS_DENIED`, `CONVERSION_TIMEOUT`, `WORKER_CRASH`, `RESOURCE_LIMIT_EXCEEDED`, `PATH_NOT_FOUND`

→ **Aucun** n'est mappé dans `error-code-messages.ts` aujourd'hui.

### Contrat `ConversionResult` — champs racine obligatoires

Source de vérité tests : `verify-e2e-to-markdown-failure-contract.js` L11–27 :

`success`, `conversionId`, `converter`, `pipeline`, `inputFormat`, `outputFormat`, `inputFile`, `outputFile`, `durationMs`, `startedAt`, `finishedAt`, `warnings`, `logs`, `error`, `meta`

Échec : `success === false`, `error.code` string non vide, `outputFile === null` ou objet.

---

## 3. Frontend — chemins de conversion

### Routage dans `generic-converter.ts` (`convertText`, L129+)

| `sourceFormat` | `targetFormat` | Endpoint | Lignes |
|----------------|----------------|----------|--------|
| `asciidoc` | `markdown` | `POST ${API_BASE}/api/to-markdown` | L187–193 |
| `markdown` | `asciidoc` | `POST ${API_BASE}/api/to-asciidoc` | L194–196 |
| `txt` | `markdown` | `POST ${API_BASE}/api/text-to-markdown` | L197–199 |
| `html` | `*` | `POST ${API_BASE}/api/from-html` body `{ text, to }` | L200–203 |
| autres | autres | `POST ${API_BASE}/api/convert` + `confirmationToken` | L205–218 |

**Flags chemins migrés contrat :** `isMigratedContractPath` (L149–150) — adoc/md, md/adoc, txt/md, html/*.

### Mapping erreurs UI (`error-code-messages.ts`)

| Code | Message FR actuel |
|------|-------------------|
| `EMPTY_INPUT` | Le texte source est vide. |
| `INVALID_INPUT` | Le contenu source n'est pas valide… |
| `CONVERSION_FAILED` | La conversion a échoué. |
| `OUTPUT_NOT_CREATED` | Le résultat… n'a pas pu être généré. |
| `OUTPUT_INVALID` | Le résultat… est invalide. |
| `OUTPUT_IS_INPUT` | Le résultat… identique à l'entrée. |
| `INTERNAL_ERROR` | Une erreur interne… |

**Manques à ajouter (Action E) :** tous les `SECURITY_ERROR_CODES` + `hint` + `category`.

**Fichiers consommateurs de `getErrorMessageForCode` :**

- `generic-converter.ts` (L283, L364)
- `asciidoc-to-markdown.ts` (L253)
- `markdown-to-asciidoc.ts` (L225)

---

## 4. Scripts de vérification existants (22 fichiers)

Répertoire : `api/backend/scripts/`

### À intégrer en CI en priorité (P0)

| Script | Endpoint / cible |
|--------|------------------|
| `verify-e2e-to-markdown-representative-scenarios.js` | `/api/to-markdown` |
| `verify-e2e-to-markdown-failure-contract.js` | échec + `error.code` |
| `verify-e2e-to-asciidoc-representative-scenarios.js` | `/api/to-asciidoc` |
| `verify-e2e-text-to-markdown-success-contract.js` | `/api/text-to-markdown` |
| `verify-e2e-text-to-markdown-failure-contract.js` | idem échec |
| `smoke-api.js` (via `npm run test:smoke`) | santé API |

### Commande locale type (modèle du script existant)

```javascript
const server = app.listen(0, '127.0.0.1')
const base = `http://127.0.0.1:${port}/api/to-markdown`
const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '...' }) })
```

Sortie attendue : `[OK] <scenario>` ; exit `0`. Sinon `[FAIL]` + stack, exit `1`.

### Scripts secondaires (P1)

`verify-e2e-from-html-*.js`, `verify-e2e-adoc-to-md-*.js`, `verify-downdoc-*.js`, `verify-backend-flow-adoc-to-md*.js`

---

## 5. CI actuelle vs cible

### `.github/workflows/ci.yml` (existant)

| Step | Commande | Couvre Ascend API ? |
|------|----------|---------------------|
| lint racine | `npm run lint` | `lib/`, `test/` |
| coverage | `npm run coverage` | tests Mocha racine |
| lint backend | `npm --prefix api/backend run lint` | `scripts/**/*.js` seulement |
| security lint | `npm run lint:security:scope` | modules conversion |
| security tests | `npm run test:security` | 4 suites grep Mocha |

**Non exécuté aujourd'hui :**

- `npm --prefix api/frontend run test` (Vitest : `generic-converter.test.ts`, `asciidoc-to-markdown.test.ts`)
- Aucun `node api/backend/scripts/verify-e2e-*.js`
- `npm run check` (racine) — équivalent local : `check:front` + `check:back`

### `.github/workflows/release.yml`

- Déclenché uniquement si `github.repository_owner == 'opendevise'` — **inactif** sur `Kira-Torvaldson/Ascend-doc_converter`.
- Publie npm `downdoc`, pas la release Ascend applicative.

### Patch CI cible (Action D) — contenu exact à ajouter

```yaml
    - name: Check version sync
      run: node scripts/check-version-sync.js
    - name: Backend e2e verify (critical)
      run: |
        node api/backend/scripts/verify-e2e-to-markdown-representative-scenarios.js
        node api/backend/scripts/verify-e2e-to-markdown-failure-contract.js
        node api/backend/scripts/verify-e2e-to-asciidoc-representative-scenarios.js
    - name: Frontend unit tests
      run: npm --prefix api/frontend run test
    - name: Golden corpus
      run: npm --prefix api/backend run test:golden
```

---

## 6. Actions détaillées (tickets ASC-001 → ASC-010)

### ASC-001 — Script `scripts/release-bump.js` (P0)

**Entrée :** `node scripts/release-bump.js 0.0.1.4.8`

**Fichiers modifiés (7 zones, regex exactes) :**

| # | Fichier | Transformation |
|---|---------|----------------|
| 1 | `api/frontend/package.json` | `"version": "<NEW>"` |
| 2 | `api/backend/package.json` | idem |
| 3 | `api/frontend/package-lock.json` | `"version": "<NEW>"` (2× : racine L3 + package L9) |
| 4 | `api/backend/package-lock.json` | idem |
| 5 | `README.md` | `/version-([0-9.]+)-orange/` → `version-<NEW>-orange` ; `Latest changes (v…)` → `v<NEW>` |
| 6 | `changelog.md` | Insérer après `## Version History\n\n` le bloc template |
| 7 | `api/frontend/src/App.tsx` | `/Nouveautés v[0-9.]+/` → `Nouveautés v<NEW>` |

**Ne pas modifier :** `package.json` racine (`downdoc` `1.0.2-stable`), `npm/version.js`, `CHANGELOG.adoc`.

**Ajout `package.json` racine :**

```json
"release:bump": "node scripts/release-bump.js"
```

**DoD :** `git grep "0.0.1.4.7"` ne retourne que historique changelog / doc ancienne (ou zéro hors changelog).

**Effort :** 4–6 h

---

### ASC-002 — `scripts/check-version-sync.js` (P0)

**Algorithme :**

1. Lire `FE=api/frontend/package.json`.version
2. Lire `BE=api/backend/package.json`.version
3. Extraire badge README : `match /version-([0-9.]+)-orange/`
4. Extraire première version changelog : `match /^### ([0-9.]+) /m` après `## Version History`
5. Si `FE !== BE !== README !== CHANGELOG` → `console.error` détail + `process.exit(1)`

**DoD :** `node scripts/check-version-sync.js` exit 0 sur branche release propre.

**Effort :** 2 h

---

### ASC-003 — Corpus golden (P0)

**Arborescence exacte :**

```
test/fixtures/conversion/
  adoc/simple/01-title.adoc
  adoc/simple/02-paragraph.adoc
  adoc/simple/03-list-unordered.adoc
  adoc/simple/04-list-ordered.adoc
  adoc/simple/05-link.adoc
  adoc/complex/01-table.adoc
  adoc/complex/02-admonition.adoc
  adoc/complex/03-nested-list.adoc
  adoc/complex/04-source-block.adoc
  adoc/complex/05-xref.adoc
  markdown/complex/01-table.md
  markdown/complex/02-code-fence.md
  markdown/complex/03-nested-list.md
  markdown/complex/04-blockquote.md
  markdown/complex/05-utf8-accents.md
  expected/to-markdown/01-title.md
  ... (1 golden par adoc → md)
  expected/to-asciidoc/01-table.adoc
  ... (5 golden md → adoc)
```

**Exemple fixture `adoc/complex/02-admonition.adoc` :**

```asciidoc
= Test Admonition

NOTE: This is a note block.

[WARNING]
====
Watch out.
====
```

**Script :** `api/backend/scripts/verify-golden-corpus.js`

- Normalisation diff : `content.replace(/\r\n/g, '\n').trimEnd()`
- Comparaison stricte byte-normalisée
- Log : `[OK] adoc/complex/02-admonition.adoc` ou `[FAIL] … diff line N`

**`api/backend/package.json` :**

```json
"test:golden": "node scripts/verify-golden-corpus.js"
```

**DoD :** 15 fixtures + 15 golden ; `npm --prefix api/backend run test:golden` → exit 0.

**Effort :** 12–16 h

---

### ASC-004 — Roundtrip adoc→md→adoc (P0)

**Script :** `api/backend/scripts/verify-roundtrip-adoc-md.js`

**Entrée :** les 5 fichiers `adoc/complex/*.adoc`

**Assertions (regex sur `roundtrip.adoc`) :**

| # | Assertion | Regex / règle |
|---|-----------|-----------------|
| 1 | Titre niveau 1 | `/^= /m` |
| 2 | Bloc code | `/^\[source/m` ou `/^----/m` |
| 3 | Table | `/^\|===/m` ou `\|.*\|` |
| 4 | Lien/xref | `/<<[^>]+>>/m` ou `link:` |
| 5 | Pas vide | `length > 50` |

**DoD :** 5/5 `[OK]` ou fichier exclu documenté dans `test/fixtures/conversion/ROUNTRIP_EXCLUSIONS.md`.

**Effort :** 8 h

---

### ASC-005 — Contrat erreur + hints (P1)

**Modifier `routeFailureError` (conversion.routes.js L21) :**

```javascript
function routeFailureError(code, message, details = null, recoverable = false, hint = null) {
  const category = mapCodeToCategory(code) // nouveau module
  return { code, message, details, recoverable: Boolean(recoverable), category, hint }
}
```

**Nouveau fichier :** `api/backend/src/utils/error-category.js`

```javascript
const CATEGORY_BY_CODE = {
  EMPTY_INPUT: 'VALIDATION_ERROR',
  PAYLOAD_TOO_LARGE: 'VALIDATION_ERROR',
  CONVERSION_TIMEOUT: 'TIMEOUT_ERROR',
  CONVERSION_FAILED: 'CONVERSION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  // + tous SECURITY_ERROR_CODES
}
```

**Étendre `error-code-messages.ts` :**

```typescript
export const ERROR_HINTS: Record<string, string> = {
  EMPTY_INPUT: 'Saisissez du contenu dans le panneau source.',
  PAYLOAD_TOO_LARGE: 'Réduisez la taille du document ou divisez-le.',
  CONVERSION_TIMEOUT: 'Réessayez avec un document plus court.',
  // ...
}
export function getHintForCode(code: string | undefined): string | undefined
```

**DoD mesurable :**

- [ ] `curl` échec vide → `error.code === 'EMPTY_INPUT'` + `error.hint` non vide
- [ ] `generic-converter.test.ts` : 3 tests sur codes + hint affiché dans `setNotification`

**Effort :** 12–16 h

---

### ASC-006 — `requestId` (P1)

**Créer :** `api/backend/middleware/request-id.middleware.js`

```javascript
const { randomUUID } = require('crypto')
module.exports = function requestIdMiddleware(req, res, next) {
  const id = (req.headers['x-request-id'] || '').trim() || randomUUID()
  req.requestId = id
  res.setHeader('X-Request-Id', id)
  next()
}
```

**Brancher :** `app.js` après L40 : `app.use(require('./middleware/request-id.middleware.js'))`

**Modifier :**

- `conversion.routes.js` : chaque `meta` inclut `requestId: req.requestId`
- `structured-logger.js` `createLogStructure()` : champ `requestId`
- `generic-converter.ts` L221–227 : header `'X-Request-Id': crypto.randomUUID()` (ou import uuid)

**DoD :** une conversion → même UUID dans header réponse, `result.meta.requestId`, fichier `api/logs/*.json`.

**Effort :** 4–6 h

---

### ASC-007 — Endpoint métriques (P1)

**Créer :** `api/backend/services/metrics/conversion-metrics.js` (Map en mémoire, ring buffer 100 durées)

**Route :** `GET /api/metrics` dans `api.routes.js` (protéger : localhost ou clé API existante)

**Incrémenter dans :** `conversion.routes.js` — fin de chaque handler avant `res.json` :

```javascript
metrics.record({ success: result.success, durationMs: result.durationMs, code: result.error?.code })
```

**Réponse JSON exemple :**

```json
{
  "conversion_success_total": 42,
  "conversion_failures_total": 3,
  "conversion_duration_ms": { "p50": 120, "p95": 890 },
  "errors_by_code": { "EMPTY_INPUT": 2, "CONVERSION_FAILED": 1 }
}
```

**DoD :** après 20 conversions manuelles, totaux cohérents.

**Effort :** 8–12 h

---

### ASC-008 — Harmonisation limites (P1)

**Tâches fichier par fichier :**

1. `envmap.module.js` — documenter `MAX_INPUT_SIZE_MB=5` dans `container/.env.example`
2. `validate-conversion-request.js` — déjà lit envmap ; vérifier pas de bypass
3. `app.js` L43 — `'6mb'` (marge nginx)
4. Remplacer `50 * 1024 * 1024` dans 4 modules par fonction `getMaxFileSizeBytes()` partagée
5. Nouvelle route `GET /api/config/limits` → `{ maxInputSizeMb: 5, maxSourceUiMb: 5, timeoutMs: 30000 }`
6. `App.tsx` L70 — fetch limits au mount ou constante importée depuis API

**DoD :** tableau section 1 — une seule colonne « valeur effective » = 5 Mo partout (sauf nginx 6m).

**Effort :** 8 h

---

### ASC-009 — Tests d'abus (P1)

**Créer :** `test/api-abuse-test.js`

| Test Mocha | Setup | Assertion |
|------------|-------|-----------|
| empty body to-markdown | `POST /api/to-markdown` `{text:""}` | status 400, `error.code` in `['EMPTY_INPUT']` |
| oversized payload | body ~6MB | `PAYLOAD_TOO_LARGE` ou 413, pas crash |
| invalid JSON | `Content-Type: application/json`, body `not-json` | 400 |
| rate limit | 101× POST rapide | 429, message rate limit |

**`package.json` racine :**

```json
"test:abuse": "_mocha test/api-abuse-test.js"
```

**DoD :** `npm run test:abuse` vert ; aucun `uncaughtException` dans logs serveur test.

**Effort :** 8 h

---

### ASC-010 — Runbook + doc limits (P2)

**Fichiers à créer/mettre à jour :**

| Fichier | Contenu |
|---------|---------|
| `doc/guides/operations/runbook.md` | démarrage `npm run dev`, Docker `container/README.md`, logs `api/logs/`, debug `requestId` |
| `doc/references/configuration.md` | matrice limites finalisée |
| `doc/specs/roadmap.md` | remplacer `0.0.1.3 Rise` par `0.0.1.4.7+` |

**DoD :** nouveau dev démarre stack en < 15 min sans aide.

**Effort :** 4 h

---

## 7. Planning (10 jours ouvrés)

| Jour | Ticket | Commande de validation |
|------|--------|------------------------|
| J1 | ASC-001 | `node scripts/release-bump.js 0.0.1.4.8 && node scripts/check-version-sync.js` |
| J2 | ASC-002 + ASC-D CI | PR → workflow vert |
| J3–J4 | ASC-003 | `npm --prefix api/backend run test:golden` |
| J5 | ASC-004 | `node api/backend/scripts/verify-roundtrip-adoc-md.js` |
| J6–J7 | ASC-005 | `npm --prefix api/frontend run test` |
| J8 | ASC-006 | grep logs `requestId` |
| J9 | ASC-007 | `curl /api/metrics` |
| J10 | ASC-008 + ASC-009 | `npm run test:abuse` + test manuel 3 Mo |

---

## 8. KPI (J+30)

| ID | Métrique | Mesure | Cible |
|----|----------|--------|-------|
| K1 | Scripts e2e en CI | count jobs CI | ≥ 3 scripts |
| K2 | Fixtures golden | `find test/fixtures -name '*.adoc' \| wc -l` | ≥ 15 |
| K3 | Écarts limite taille | audit tableau §1 | 1 source envmap |
| K4 | Erreurs sans `error.code` | grep logs 100 derniers | 0 % routes conversion |
| K5 | Codes avec hint UI | count `ERROR_HINTS` keys | ≥ 8 |
| K6 | Version désync releases | incidents | 0 |

---

## 9. Hors scope `0.0.1.4.8`

- Publication npm `downdoc` (`npm/release.sh`, workflow `release.yml` opendevise)
- Support PDF/DOCX production (`docverter.module.js`, `panwriter.module.js` — stubs)
- Remote GitLab `origin` : `release-0.0.1.4.6` peut subsister
- Automatisation GitHub Release sans `gh` CLI installé

---

## 10. Commandes de référence (copier-coller)

```bash
# Vérification locale complète (cible post-implémentation)
npm run check
node scripts/check-version-sync.js
npm --prefix api/backend run test:golden
node api/backend/scripts/verify-e2e-to-markdown-representative-scenarios.js
node api/backend/scripts/verify-e2e-to-asciidoc-representative-scenarios.js
npm run test:abuse

# Dev
npm run dev
# Front seul : npm run dev:front  (Vite)
# Back seul  : npm run dev:back   (node --watch server.js)
```

---

*Dernière mise à jour document : alignée sur commit release `0.0.1.4.7` / branche `release-0.0.1.4.7`.*
