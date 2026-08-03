# Roadmap et versions

## Version actuelle

**Ascend 0.0.1.7** (alpha)

### Dernières livraisons

| Version | Points clés |
|---------|-------------|
| **0.0.1.7** | Modale erreur (`error.code`, hint, `requestId`), CI Docker frontend, footer limites |
| **0.0.1.6** | CORS dev, polish UI, fond Rafale, runbook WSL |
| **0.0.1.5** | `check:docker:backend`, job CI Docker, docs opérationnelles |

## Orientation produit

| Axe | Direction |
|-----|-----------|
| **Stabilité** | Contrats API et `ConversionResult` |
| **Ops** | Docker, CI, runbook, métriques |
| **UX** | Erreurs explicites, paramètres, accessibilité |
| **Sécurité** | Sandbox V2, confirmation, validation renforcée |

## Roadmap (synthèse)

Consulter `documentation/V-specifications/roadmap.md` pour le détail.

**Court terme (patches 0.0.1.x) :**
- Durcissement CI (backend + frontend Docker)
- Documentation opérationnelle (BookStack, runbook)
- UX erreurs et visibilité assets

**Moyen terme :**
- Adoption large `ConversionResult`
- EnvMap intégré partout
- Métriques et observabilité (ASC-007)

**Non planifié pour l'instant :**
- Version beta publique (0.0.2.0)
- API publique stable

## Axes d'amélioration par version

Documents détaillés dans `documentation/V-specifications/` :
- `axes-ameliorations-0.0.1.5.md` … `axes-ameliorations-0.0.1.7.md`

## Changelog complet

`documentation/I-installation/projet/changelog.md`

## Notes de release

`documentation/I-installation/releases/` (une note par version)

## Vérifier la version locale

```bash
npm run check:version
```

Attendu : versions `api/backend` et `api/frontend` identiques.
