# Présentation du projet

**Ascend** est un système de conversion de documents en phase **alpha** (v0.0.1.7). Il convertit entre formats **explicitement déclarés** via des modules isolés, avec validation stricte et journaux structurés.

## En bref

| | |
|---|---|
| **Statut** | Alpha — architecture non figée |
| **Stack** | Node.js (Express) + React/Vite |
| **Philosophie** | Déterminisme, échec explicite, traçabilité |
| **Licence** | MIT |

## Ce qu'Ascend fait

- Conversions entre formats déclarés (ex. Markdown ↔ AsciiDoc)
- Orchestration linéaire et déterministe
- Un environnement temporaire unique par conversion
- Logs JSON, `requestId`, métriques de durée
- Configuration centralisée (EnvMap)

## Ce qu'Ascend ne fait pas

- Pas de détection automatique de format
- Pas de tolérance aux entrées ambiguës
- Pas d'API publique stable (alpha)
- Pas de dépendances cloud pendant la conversion (local-first)

## Architecture simplifiée

```
[ Interface React ] → [ API Express ] → [ Orchestrateur ] → [ Modules ]
                                              ↓
                                    [ Dossier temporaire / logs ]
```

## Commandes utiles

```bash
npm run dev              # Front + back (dev)
npm run check:version    # Alignement des versions
npm run check:ascend:ci  # Tests CI locaux
npm run check:docker     # Build Docker backend + frontend
```

## Documentation complète

Référence détaillée dans le dépôt Git : dossier `documentation/` (5 parties : Installation, Modules, Sécurité, API, Spécifications).
