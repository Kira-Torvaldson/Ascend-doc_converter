# Vue d'ensemble des modules

Ascend convertit via des **wrappers** (modules) indépendants, orchestrés de façon **linéaire et déterministe**.

## Contrat minimal

Chaque module expose :

| Élément | Description |
|---------|-------------|
| `name` | Identifiant unique (`downdoc`, `pandoc`, …) |
| `supportedFormats` | `{ from: [], to: [] }` — formats déclarés |
| `run(input, output, options)` | Exécution ; retourne `ModuleResult` |

## Résultat module (`ModuleResult`)

```typescript
{
  success: boolean;
  logs: string | string[];
  error: string | null;
  duration: number;  // secondes
}
```

## Règles non négociables

1. **Formats explicites** — pas de détection implicite.
2. **Isolation** — chaque conversion dans un dossier temporaire UUID.
3. **Échec explicite** — pas de repli silencieux.
4. **Conformité** — un module hors contrat est rejeté.

## Flux simplifié

```
Requête API → Validation entrée → Orchestrateur
    → Module A (si chemin déclaré)
    → Module B (si étape suivante)
    → Résultat ConversionResult
```

## Orchestration

| Composant | Rôle |
|-----------|------|
| `orchestrator` | Enchaînement des étapes |
| `orchestrator-comm` | Communication inter-modules |
| `converter-orchestrator` | Pont API ↔ modules |
| `lazyload` | Chargement à la demande des wrappers |

## Pour aller plus loin

→ **Catalogue des wrappers** pour le détail par moteur.  
Doc complète : `documentation/II-modules/`
