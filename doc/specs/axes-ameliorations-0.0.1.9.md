# Axes d'amélioration — Ascend `0.0.1.9` / `0.0.1.9.1`

| Champ | Valeur |
|-------|--------|
| Versions | `0.0.1.9` puis patch `0.0.1.9.1` |
| Base | `0.0.1.8.5` |
| Type | Patch — ConversionResult bout-en-bout + fiabilité MD/HTML/TXT |

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

## Reste (candidats post-0.0.1.9.1)

- Stubs `panwriter` / `docverter` → `ConversionResult` quand implémentés.
- Sortie propre des tests (handles Pandoc server).
- Warnings agrégés bout-en-bout ; métriques par `error.code`.

---

## Validation

```bash
npm run check:version
npm run check:ascend:ci
```

**Notes :** `doc/releases/v0.0.1.9-notes.md`, `doc/releases/v0.0.1.9.1-notes.md`
