# Axes d'amélioration — Ascend `0.0.1.8`

| Champ | Valeur |
|-------|--------|
| Version cible | `0.0.1.8` |
| Base | `0.0.1.7` |
| Type | Patch — adoption ConversionResult (routes sécurisées) + EnvMap |

---

## Livré

- Contrat `ConversionResult` sur `POST /api/convert` (succès + échecs structurés, mapping des codes secure-converter vers les codes canoniques).
- `conversionResult` sur `POST /api/proxy/convert` (forme legacy conservée pour bulk-processor).
- Correctifs `/api/convert` : `detectUnauthorizedAccess` (static → instance), chemin lazyload, champs `ConfirmationTokenError`.
- EnvMap : `API_KEY`, `FRONTEND_URL`, `ASCEND_REPORTS_DIR` ; migration `api-key.middleware`, `cors.middleware`, `/api/metrics`.
- Codes `CONFIRMATION_*` dans l'enveloppe erreur (catégorie + hint).
- 2 scripts de vérification contractuelle ajoutés à `check:ascend:ci` (+ scénario Pandoc conditionnel dans le contrat `/api/convert`).
- Timer tokens `unref()` (sortie propre des tests et scripts).
- EnvMap source unique : `server.js`, `error-handler.middleware`, fallbacks `structured-logger` / `pipeline-security` supprimés ; `config/index.js` et `server-legacy.js` (morts) supprimés.
- Limites `secure-converter` alignées sur EnvMap (`MAX_INPUT_SIZE_MB`, `CONVERSION_TIMEOUT_MS`).
- `SecurityLogger` : création du dossier de logs au moment de l'écriture (fix `ENOENT`).
- `/api/roundtrip` : `conversionResult` exposé (contrat complet sur toutes les routes de conversion) + script contrat dédié.
- Validation Zod : enveloppe erreur standardisée (`INVALID_INPUT` + catégorie + hint).
- Performance gros documents : chemin chaud 100 % en mémoire (`/api/to-markdown`, helpers Pandoc via stdin/stdout), I/O async partout, compression HTTP, `basicCleanup` et `MimeTypeDetector` optimisés, bench `bench-large-doc.js`.
- Serveur Pandoc persistant (`pandoc server`) avec repli CLI automatique et clé EnvMap `PANDOC_SERVER_ENABLED` — plus de coût de démarrage du binaire par requête.

## Reste (candidats 0.0.1.9+)

- Migration des modules legacy (`text2markdown.module`, orchestrateurs) vers `ConversionResult` natif.

---

## Validation

```bash
npm run check:version
npm run check:ascend:ci
npm run check:docker
```
