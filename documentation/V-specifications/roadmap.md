# Feuille de route

## Objectif

Ce document définit la feuille de route canonique d'Ascend. Il présente les fonctionnalités planifiées, les améliorations et les jalons pour les prochaines versions.

## État actuel

**Version :** 0.0.1.7 (application Ascend — `api/backend` / `api/frontend`)  
**Statut :** Patch UX + CI Docker frontend  
**Focus :** modale erreur, visibilité fond, `check:docker:frontend`

> Le package racine npm `downdoc` reste sur `1.0.2-stable` et n'est pas versionné comme Ascend.

## Historique des versions

### 0.0.1.7 (Courante — Ascend)

**Livré :**
- Modale erreur structurée (`error.code`, hint, `requestId`)
- `check:docker:frontend` + CI job docker (frontend)
- Footer limite source ; visibilité Rafale ; HistoryModalV2 thème

**Docs :** `doc/specs/axes-ameliorations-0.0.1.7.md`

### 0.0.1.6

**Livré :**
- Polish UI (header, bannières, badges, paramètres thème)
- Fond SVG embarqué + `rafale.jpg` optionnel
- CORS dev localhost ; runbook WSL/Docker
- Fix CSS PostCSS settings

**Docs :** `doc/specs/axes-ameliorations-0.0.1.6.md`, `doc/releases/v0.0.1.6-notes.md`

### 0.0.1.5

**Livré (ASC-017 → ASC-018) :**
- `check:docker:backend` et job CI `docker` (build + Pandoc dans l'image)
- Notes release, changelog, axes 0.0.1.5, runbook

**Docs :** `doc/specs/axes-ameliorations-0.0.1.5.md`

### 0.0.1.4.9

**Livré (ASC-015 → ASC-016) :**
- `check:ascend:ci` et CI `ascend` unifiée (root `npm ci` + une commande)
- Notes release, changelog, axes 4.9, runbook

**Docs :** `doc/specs/axes-ameliorations-0.0.1.4.9.md`

### 0.0.1.4.8

**Livré (ASC-011 → ASC-014) :**
- Fixtures golden spec (`05-xref`, `06-utf8`, `01-table.md`) — 16 scénarios
- CI e2e text-to-markdown et from-html
- Messages UI pour tous les codes sécurité + `npm run check:ascend`
- Changelog, axes 4.8, notes release `doc/releases/v0.0.1.4.8-notes.md`

**Docs :** `doc/specs/axes-ameliorations-0.0.1.4.8.md`

### 0.0.1.4.7

**Livré (axes ASC-001 → ASC-010) :**
- Scripts `release:bump` / `check:version` (7 zones de version)
- CI job `ascend` (golden, roundtrip, e2e, `test:abuse`)
- Corpus golden + roundtrip sémantique adoc ↔ md
- Enveloppe d'erreur (`error.code`, `category`, `hint`) + UI
- `X-Request-Id` / `meta.requestId`
- `GET /api/metrics`, `GET /api/config/limits`
- Limite entrée unifiée **5 Mo** (EnvMap, Express, modules, UI, Nginx 6m)
- Pandoc dans image Docker `container/backend`
- Tests d'abus API (`npm run test:abuse`)
- Runbook opérations (`doc/guides/operations/runbook.md`)

**Docs :** `doc/specs/axes-ameliorations-0.0.1.4.7.md`

### 0.0.1.2.1 alpha

**Fonctionnalités :**
- Conversion AsciiDoc ↔ Markdown
- Normalisation basique
- Cadre de sécurité (V1)
- Journalisation structurée
- Diagnostics d'environnement
- Proxy de normalisation des données
- Service de traitement par lots

### 0.0.1.1 alpha

**Fonctionnalités :**
- Version initiale
- Fonctionnalité de conversion basique
- Cadre UI

## Versions planifiées

### 0.0.2.0 beta

**Date cible :** À définir  
**Focus :** Stabilité et extension des formats

**Fonctionnalités planifiées :**
- Prise en charge de la conversion HTML
- Améliorations de la conversion texte brut
- Gestion d'erreurs renforcée
- Optimisations de performances
- Couverture de tests étendue

### 0.0.3.0

**Date cible :** À définir  
**Focus :** Extension des formats

**Fonctionnalités planifiées :**
- Prise en charge de la conversion PDF
- Prise en charge de la conversion YAML/JSON
- Matrice de formats étendue
- Améliorations de la détection de format

### 0.1.0.0

**Date cible :** À définir  
**Focus :** Préparation à la production

**Fonctionnalités planifiées :**
- Renforcements de sécurité (V2)
- Isolation réseau
- Isolation utilisateur
- Bac à sable renforcé
- Gestion d'erreurs de niveau production
- Documentation complète

### 0.2.0.0

**Date cible :** À définir  
**Focus :** Fonctionnalités avancées

**Fonctionnalités planifiées :**
- Conversion DOCX/RTF (via docverter)
- Prise en charge des documents Office (via panwriter)
- Options de normalisation avancées
- Profils d'exécution personnalisés
- Limitation de débit API

### 1.0.0.0

**Date cible :** À définir  
**Focus :** Fonctionnalités complètes

**Fonctionnalités planifiées :**
- Prise en charge complète de la matrice de formats
- Fonctionnalités de sécurité entreprise
- Fonctionnalités de conformité (ISO 27001, NIST, GDPR)
- Surveillance avancée
- Intégrations personnalisées

## Vision à long terme

### Prise en charge des formats

**Objectif :** Prendre en charge tous les formats de documents courants

**Formats planifiés :**
- Formats texte : AsciiDoc, Markdown, HTML, TXT, RTF
- Formats Office : DOCX, XLSX, PPTX, ODT, ODS, ODP
- Formats de données : YAML, JSON, XML, CSV
- Formats de publication : PDF, EPUB
- Formats image : PNG, JPG, SVG (pour le contenu intégré)

### Évolution de la sécurité

**V1 (Actuelle) :** Isolation légère, validation basique  
**V2 (Planifiée) :** Bac à sable renforcé, isolation réseau  
**V3 (Future) :** Conteneurisation complète, fonctionnalités de conformité

### Objectifs de performance

**Actuel :**
- Conversion unique : < 5 secondes (typique)
- Concurrence : 5 conversions

**Cible :**
- Conversion unique : < 2 secondes (typique)
- Concurrence : 20+ conversions
- Traitement par lots : 100+ fichiers

### Évolution de l'architecture

**Actuel :** Backend monolithique, frontend modulaire  
**Futur :** Prêt pour les microservices, architecture à plugins

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- L'historique des versions
- Les fonctionnalités planifiées
- Le calendrier des releases
- La vision à long terme

**Note :** Les dates et fonctionnalités sont susceptibles d'évoluer selon les priorités de développement et les retours utilisateurs.
