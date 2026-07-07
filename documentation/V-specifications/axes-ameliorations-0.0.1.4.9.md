# Axes d'amélioration — Ascend `0.0.1.4.9`

| Champ | Valeur |
|-------|--------|
| Version cible | `0.0.1.4.9` |
| Base | `0.0.1.4.8` |
| Branche | `release-0.0.1.4.9` |
| Type | Patch stabilisation pré-beta |

---

## Objectif

Consolider la chaîne de validation Ascend en CI et documenter la clôture de la série `0.0.1.4.x` avant `0.0.2.0 beta`.

---

## Tickets

### ASC-015 — `check:ascend:ci` unifié (P0) ✅

- Script npm regroupant version sync + e2e + golden + roundtrip + abuse
- Job CI `ascend` simplifié (une commande + `npm ci` racine pour Mocha)
- **DoD :** job `ascend` vert sur GitHub

### ASC-016 — Doc & release (P1) ✅

- `changelog.md` 0.0.1.4.9
- `doc/releases/v0.0.1.4.9-notes.md`
- `roadmap.md` → 4.9 courant, 4.8 livré
- Runbook : `check:ascend` vs `check:ascend:ci`

---

## Validation

```bash
npm run check:ascend
npm run check:ascend:ci
```
