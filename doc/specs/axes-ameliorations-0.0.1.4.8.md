# Axes d'amélioration — Ascend `0.0.1.4.8`

| Champ | Valeur |
|-------|--------|
| Version cible | `0.0.1.4.8` |
| Base | `0.0.1.4.7` + commit qualité ASC-001–010 |
| Branche | `release-0.0.1.4.8` |
| Prochaine version | `0.0.1.4.9` (patch) ou `0.0.2.0` (beta) |

---

## Objectif

Compléter les **DoD restants de 4.7** et stabiliser la release avant montée en `0.0.2.0 beta`.

---

## Tickets `0.0.1.4.8`

### ASC-011 — Corpus golden aligné spec (P0)

- `adoc/complex/05-xref.adoc` + golden
- `adoc/simple/06-utf8.adoc` (UTF-8 hors set roundtrip complex)
- `markdown/complex/01-table.md` + golden to-asciidoc
- **DoD :** `npm --prefix api/backend run test:golden` → 16+ scénarios OK

### ASC-012 — CI e2e étendue (P0)

- `verify-e2e-text-to-markdown-representative-scenarios.js`
- `verify-e2e-text-to-markdown-failure-contract.js`
- `verify-e2e-from-html-representative-scenarios.js`
- `verify-e2e-from-html-failure-contract.js`
- **DoD :** job `ascend` vert sur GitHub

### ASC-013 — Erreurs sécurité UI (P1)

- Tous les `SECURITY_ERROR_CODES` dans `error-code-messages.ts` + `error-envelope.js`
- 3 tests Vitest hints (`EMPTY_INPUT`, `PAYLOAD_TOO_LARGE`, `CONVERSION_TIMEOUT`)
- **DoD :** `npm --prefix api/frontend run test` vert

### ASC-014 — Changelog & doc (P2)

- Entrée `changelog.md` 0.0.1.4.8 descriptive
- `doc/specs/roadmap.md` → version courante 4.8
- Mise à jour §1 de `axes-ameliorations-0.0.1.4.7.md` (état post-limites)

---

## Hors scope `0.0.1.4.8`

- Publication npm `downdoc`
- PDF/DOCX production
- GitHub Release automatique (sans `gh` CLI)
- Bump `0.0.2.0 beta`

---

## Validation locale

```bash
node scripts/check-version-sync.js
npm --prefix api/backend run test:golden
npm --prefix api/backend run test:roundtrip
npm run test:abuse
npm --prefix api/frontend run test
node api/backend/scripts/verify-e2e-text-to-markdown-representative-scenarios.js
node api/backend/scripts/verify-e2e-from-html-representative-scenarios.js
```
