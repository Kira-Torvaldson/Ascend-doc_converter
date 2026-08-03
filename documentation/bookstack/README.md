# Guide BookStack — Ascend

Ce dossier contient une **version synthétisée** de la documentation Ascend, prête à importer dans [BookStack](https://www.bookstackapp.com/).

## Principe

| Source (`documentation/`) | BookStack |
|---------------------------|-----------|
| ~78 fichiers détaillés | **~15 pages** opérationnelles |
| Référence technique complète | Lecture rapide + liens vers le dépôt |

**Règle :** une page BookStack = un sujet actionnable. Les détails exhaustifs restent dans `documentation/` (référence Git).

---

## Arborescence BookStack recommandée

```
📘 Livre : Ascend
│
├── 📄 Introduction                    ← page d'accueil (hors chapitre)
│
├── 📂 Chapitre I — Installation
│   ├── Présentation du projet
│   ├── Démarrage rapide (dev)
│   ├── Docker et déploiement
│   ├── Configuration et limites
│   └── Dépannage courant
│
├── 📂 Chapitre II — Modules
│   ├── Vue d'ensemble des modules
│   └── Catalogue des wrappers
│
├── 📂 Chapitre III — Sécurité
│   ├── Posture et sandbox
│   └── Convertisseur sécurisé et confirmation
│
├── 📂 Chapitre IV — API
│   ├── Endpoints essentiels
│   └── Erreurs et ConversionResult
│
└── 📂 Chapitre V — Spécifications
    ├── Architecture
    └── Roadmap et versions
```

---

## Import dans BookStack

### Méthode manuelle (recommandée)

1. Créer le **livre** « Ascend ».
2. Créer les **5 chapitres** (I à V).
3. Pour chaque fichier `.md` de ce dossier :
   - Créer une **page** dans le chapitre correspondant.
   - Copier-coller le contenu (BookStack accepte le Markdown).
   - Ajuster les titres si besoin (le `#` devient le titre de page).

### Fichiers → pages

| Fichier | Page BookStack |
|---------|----------------|
| `00-introduction.md` | **Introduction** (page d'accueil du livre) |
| `I-installation/01-presentation.md` | Présentation du projet |
| `I-installation/02-demarrage-rapide.md` | Démarrage rapide |
| `I-installation/03-docker.md` | Docker et déploiement |
| `I-installation/04-configuration-limites.md` | Configuration et limites |
| `I-installation/05-depannage.md` | Dépannage courant |
| `II-modules/01-vue-ensemble.md` | Vue d'ensemble des modules |
| `II-modules/02-catalogue-modules.md` | Catalogue des wrappers |
| `III-securite/01-posture-securite.md` | Posture et sandbox |
| `III-securite/02-convertisseur-confirmation.md` | Convertisseur sécurisé |
| `IV-api/01-endpoints-essentiels.md` | Endpoints essentiels |
| `IV-api/02-erreurs-resultats.md` | Erreurs et ConversionResult |
| `V-specifications/01-architecture.md` | Architecture |
| `V-specifications/02-roadmap-versions.md` | Roadmap et versions |

### Permissions BookStack suggérées

| Rôle | Accès |
|------|-------|
| Développeur | Tous les chapitres |
| Opérateur / Ops | I (Installation) + V (versions) |
| Intégrateur API | IV (API) + II (Modules) |
| Sécurité | III (Sécurité) + IV (contrats) |

---

## Maintenance

- **À chaque release** : mettre à jour `02-roadmap-versions.md` et la section « Dernière version » de `01-presentation.md`.
- **Si l'API change** : mettre à jour `IV-api/`.
- **Doc complète** : synchroniser depuis `documentation/` uniquement quand un sujet devient trop court dans BookStack.

Version documentée : **0.0.1.7**
