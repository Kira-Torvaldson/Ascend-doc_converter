# Axes d'amélioration — Ascend `0.0.1.6`

| Champ | Valeur |
|-------|--------|
| Version cible | `0.0.1.6` |
| Base | `0.0.1.5` |
| Type | Patch — polish UI + dev local |

---

## Objectif

Corriger l'expérience dev (CORS, fond d'écran) et peaufiner l'interface avant poursuite des patches ou beta.

---

## Livré

- CORS dev : ports Vite alternatifs
- Fond SVG + `rafale.jpg` optionnel
- Polish UI (header, bannières, badges, paramètres)
- Runbook WSL / Docker client
- Fix CSS PostCSS settings

---

## Validation

```bash
npm run check:version
npm run check:ascend:ci
```
