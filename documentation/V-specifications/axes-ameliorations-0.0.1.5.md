# Axes d'amélioration — Ascend `0.0.1.5`

| Champ | Valeur |
|-------|--------|
| Version cible | `0.0.1.5` |
| Base | `0.0.1.4.9` |
| Branche | `release-0.0.1.5` |
| Type | Patch — industrialisation Docker + pont vers beta |

---

## Objectif

Valider l'image Docker backend en CI et documenter la chaîne de release avant `0.0.2.0 beta`.

---

## Tickets

### ASC-017 — Build Docker backend en CI (P0)

- Job CI `docker` : `docker build -f container/backend/Dockerfile`
- Vérification `pandoc --version` dans l'image
- Script local `npm run check:docker:backend`
- **DoD :** build vert sur GitHub Actions

### ASC-018 — Doc & release (P1)

- `changelog.md`, `doc/releases/v0.0.1.5-notes.md`
- `roadmap.md` version courante 0.0.1.5
- Runbook : section Docker build check

---

## Validation

```bash
npm run check:docker:backend
npm run check:ascend:ci
```
