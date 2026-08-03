# Catalogue des wrappers

Tableau de référence des modules de conversion Ascend (v0.0.1.7).

## Modules métier

| Module | Rôle principal | Formats typiques |
|--------|----------------|------------------|
| **downdoc** | AsciiDoc → Markdown | `.adoc` → `.md` |
| **pandoc** | Conversions via Pandoc | MD ↔ divers |
| **text2markdown** | Texte brut → Markdown | `.txt` → `.md` |
| **docverter** | Pipeline document générique | selon config |
| **panwriter** | Génération / écriture Pandoc | selon config |

## Modules infrastructure

| Module | Rôle |
|--------|------|
| **orchestrator** | Orchestration linéaire des étapes |
| **orchestrator-comm** | Protocole entre orchestrateur et modules |
| **converter-orchestrator** | Point d'entrée conversion côté API |
| **lazyload** | Chargement dynamique des wrappers |
| **logs** | Journalisation structurée des exécutions |

## Moteurs externes

| Moteur | Usage | Prérequis |
|--------|-------|-----------|
| **Pandoc** | Conversions MD/AsciiDoc | Binaire Pandoc 3.x installé ou dans image Docker |
| **downdoc** | AsciiDoc → MD natif | Package npm `downdoc` |

## Ajouter ou modifier un module

1. Implémenter le contrat (`name`, `supportedFormats`, `run`).
2. Déclarer les formats dans la liste blanche supportée.
3. Respecter les limites sandbox (fichiers, timeout, pas de réseau).
4. Documenter dans `documentation/II-modules/modules/<nom>.module.md`.

## Formats supportés

Seuls les formats **explicitement déclarés** sont acceptés. Consulter `documentation/II-modules/core.md` pour la liste canonique.

## Legacy

Anciens documents : `documentation/II-modules/legacy/` (PIPELINE, interface historique).
