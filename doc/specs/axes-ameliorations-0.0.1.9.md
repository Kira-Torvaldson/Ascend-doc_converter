# Axes d'amélioration — Ascend `0.0.1.9` → `0.0.1.9.2`

| Champ | Valeur |
|-------|--------|
| Versions | `0.0.1.9` puis patches `0.0.1.9.1`, `0.0.1.9.2` |
| Base | `0.0.1.8.5` |
| Type | Patch — ConversionResult + fiabilité MD/HTML/TXT + ops métriques |

---

## Livré en 0.0.1.9

- Pandoc commande → `ConversionResult` natif + résolution binaire Windows/PATH.
- Orchestrateurs : erreurs précoces structurées, helper `orchestrator-result.js`, proxy par `error.code`.
- Wrappers HTML `html-markdown` / `html-plain` + route `/api/from-html`.
- Scripts `test:pandoc-result`, `test:proxy-failure-classify`, `test:html-wrappers`.

## Livré en 0.0.1.9.1

- Routes `/api/from-markdown` et `/api/from-text` avec `ConversionResult`.
- Buffer UI `otherOutput` ; session / historique / ZIP / diff / édition cohérents.
- `EMPTY_OUTPUT` ; timeout Pandoc non masqué par le stripper local.
- Abort tentative précédente + timeout client aligné sur `CONVERSION_TIMEOUT_MS`.
- Aperçu HTML sandbox ; import `.html` ; couples UI partagés (`conversionPairs`).
- Scénarios e2e `from-markdown` dans `check:ascend:ci`.

## Livré en 0.0.1.9.2

- Sortie propre des tests : `pandoc-server.shutdown()` force-kill (Windows `taskkill /T /F`) + helper `scripts/lib/verify-exit.js` (`exitClean`).
- Métriques : `errors_by_code` (map) + `failures_by_route` ; persistance `reports/conversion-metrics.json` ; script `test:metrics`.
- Contrats échec `/api/from-markdown`, `/api/from-text`, `/api/from-html` (dont `EMPTY_OUTPUT` stubbable).
- UX warnings : bannière `ENGINE_FALLBACK` + hint timeout ; panneau Paramètres → Métriques (auto-refresh) + badge header.

## Reste (candidats suivants)

- Stubs `panwriter` / `docverter` → `ConversionResult` quand implémentés.
- Hygiene release GitHub (`gh auth` / script).

---

## Validation

```bash
npm run check:version
npm run check:ascend:ci
```

**Notes :** `doc/releases/v0.0.1.9-notes.md`, `doc/releases/v0.0.1.9.1-notes.md`, `doc/releases/v0.0.1.9.2-notes.md`
