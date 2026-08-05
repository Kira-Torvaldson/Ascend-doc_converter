# Roadmap

## Purpose

This document defines the canonical roadmap for Ascend. It outlines planned features, improvements, and milestones for future releases.

## Current Status

**Version:** 0.0.1.9 (Ascend app — `api/backend` / `api/frontend`)  
**Status:** Patch ConversionResult orchestrateurs + Pandoc + HTML  
**Focus:** Erreurs structurées bout-en-bout, wrappers HTML, résolution Pandoc

> Le package racine npm `downdoc` reste sur `1.0.2-stable` et n’est pas versionné comme Ascend.

## Version History

### 0.0.1.9 (Current — Ascend)

**Delivered:**
- Pandoc command path → native `ConversionResult`
- Orchestrator structured errors + `orchestrator-result` / `proxy-failure` helpers
- HTML wrappers (`html-markdown`, `html-plain`) + verify scripts

**Docs:** `doc/releases/v0.0.1.9-notes.md`

### 0.0.1.8.5

**Delivered:**
- Tables spans (GFM colspan + roundtrip), images w/h, callouts `(n)`, warnings include/attr
- UI warnings avec préfixe code ; scripts de vérif sans process Pandoc accroché
- Fixture `08-table-span`

**Docs:** `doc/releases/v0.0.1.8.5-notes.md`

### 0.0.1.8.4

**Delivered:**
- Précision conversion : admonitions multi-para, dlists, xrefs/ancres, spans tables → Pandoc
- Soft-auto capacity (RAM/CPU) pour limites runtime
- Corpus golden + scripts `test:precision` / `test:admonitions` / `test:capacity`
- Stabilisation éditeur (perf find/diff/gouttière) + découpes UI mineures

**Docs:** `doc/releases/v0.0.1.8.4-notes.md`

### 0.0.1.8.3

**Delivered:**
- Paramètres : rail latéral, présets Interface, police éditeur, export/import + fond custom
- Header/navbar sobre (Convertir dans Source) ; sidebar/footer alignés
- Utilitaires éditeur : profils, brouillon session, find/replace, diff, numéros de ligne

**Docs:** `doc/releases/v0.0.1.8.3-notes.md`

### 0.0.1.8.2

**Delivered:**
- Listboxes formats/paramètres, Autres options, menu Actions, snackbar, mobile
- Raccourcis clavier + aide ; bannière `ConversionResult.warnings`
- Extraction `AppHeader`, panneaux Source/Résultat, Navigation, footer

**Docs:** `doc/releases/v0.0.1.8.2-notes.md`

### 0.0.1.8.1

**Delivered:**
- Fond d’écran personnalisable + adaptation écran ; sidebar/navbar opaques (thème)
- Fenêtres flottantes unifiées, modales Ascend, états vides éditeurs, historique enrichi

**Docs:** `doc/releases/v0.0.1.8.1-notes.md`

### 0.0.1.8

**Delivered:**
- Contrat `ConversionResult` sur `/api/convert` et `/api/proxy/convert` (+ scripts contrat en CI)
- Correctifs `/api/convert` (anomaly detector static, chemin lazyload, `ConfirmationTokenError`)
- EnvMap : `API_KEY`, `FRONTEND_URL`, `ASCEND_REPORTS_DIR` ; middlewares migrés

**Docs:** `doc/specs/axes-ameliorations-0.0.1.8.md`, `doc/releases/v0.0.1.8-notes.md`

### 0.0.1.7

**Delivered:**
- Modale erreur structurée (`error.code`, hint, `requestId`)
- `check:docker:frontend` + CI job docker (frontend)
- Footer limite source ; visibilité Rafale ; HistoryModalV2 thème

**Docs:** `doc/specs/axes-ameliorations-0.0.1.7.md`

### 0.0.1.6

**Delivered:**
- Polish UI (header, bannières, badges, paramètres thème)
- Fond SVG embarqué + `rafale.jpg` optionnel
- CORS dev localhost ; runbook WSL/Docker
- Fix CSS PostCSS settings

**Docs:** `doc/specs/axes-ameliorations-0.0.1.6.md`, `doc/releases/v0.0.1.6-notes.md`

### 0.0.1.5

**Delivered (ASC-017 → ASC-018):**
- `check:docker:backend` et job CI `docker` (build + Pandoc dans l’image)
- Notes release, changelog, axes 0.0.1.5, runbook

**Docs:** `doc/specs/axes-ameliorations-0.0.1.5.md`

### 0.0.1.4.9

**Delivered (ASC-015 → ASC-016):**
- `check:ascend:ci` et CI `ascend` unifiée (root `npm ci` + une commande)
- Notes release, changelog, axes 4.9, runbook

**Docs:** `doc/specs/axes-ameliorations-0.0.1.4.9.md`

### 0.0.1.4.8

**Delivered (ASC-011 → ASC-014):**
- Fixtures golden spec (`05-xref`, `06-utf8`, `01-table.md`) — 16 scénarios
- CI e2e text-to-markdown et from-html
- Messages UI pour tous les codes sécurité + `npm run check:ascend`
- Changelog, axes 4.8, notes release `doc/releases/v0.0.1.4.8-notes.md`

**Docs:** `doc/specs/axes-ameliorations-0.0.1.4.8.md`

### 0.0.1.4.7

**Delivered (axes ASC-001 → ASC-010):**
- Scripts `release:bump` / `check:version` (7 zones de version)
- CI job `ascend` (golden, roundtrip, e2e, `test:abuse`)
- Corpus golden + roundtrip sémantique adoc ↔ md
- Enveloppe d’erreur (`error.code`, `category`, `hint`) + UI
- `X-Request-Id` / `meta.requestId`
- `GET /api/metrics`, `GET /api/config/limits`
- Limite entrée unifiée **5 Mo** (EnvMap, Express, modules, UI, Nginx 6m)
- Pandoc dans image Docker `container/backend`
- Tests d’abus API (`npm run test:abuse`)
- Runbook opérations (`doc/guides/operations/runbook.md`)

**Docs:** `doc/specs/axes-ameliorations-0.0.1.4.7.md`

### 0.0.1.2.1 alpha

**Features:**
- AsciiDoc ↔ Markdown conversion
- Basic normalization
- Security framework (V1)
- Structured logging
- Environment diagnostics
- Data normalization proxy
- Batch processing service

### 0.0.1.1 alpha

**Features:**
- Initial release
- Basic conversion functionality
- UI framework

## Planned Releases

### 0.0.2.0 beta

**Target Date:** TBD  
**Focus:** Stability and format expansion

**Planned Features:**
- HTML conversion support
- Plain text conversion improvements
- Enhanced error handling
- Performance optimizations
- Extended test coverage

### 0.0.3.0

**Target Date:** TBD  
**Focus:** Format expansion

**Planned Features:**
- PDF conversion support
- YAML/JSON conversion support
- Extended format matrix
- Format detection improvements

### 0.1.0.0

**Target Date:** TBD  
**Focus:** Production readiness

**Planned Features:**
- Security enhancements (V2)
- Network isolation
- User isolation
- Enhanced sandboxing
- Production-grade error handling
- Comprehensive documentation

### 0.2.0.0

**Target Date:** TBD  
**Focus:** Advanced features

**Planned Features:**
- DOCX/RTF conversion (via docverter)
- Office document support (via panwriter)
- Advanced normalization options
- Custom execution profiles
- API rate limiting

### 1.0.0.0

**Target Date:** TBD  
**Focus:** Feature complete

**Planned Features:**
- Full format matrix support
- Enterprise security features
- Compliance features (ISO 27001, NIST, GDPR)
- Advanced monitoring
- Custom integrations

## Long-Term Vision

### Format Support

**Goal:** Support all common document formats

**Planned Formats:**
- Text formats: AsciiDoc, Markdown, HTML, TXT, RTF
- Office formats: DOCX, XLSX, PPTX, ODT, ODS, ODP
- Data formats: YAML, JSON, XML, CSV
- Publishing formats: PDF, EPUB
- Image formats: PNG, JPG, SVG (for embedded content)

### Security Evolution

**V1 (Current):** Light isolation, basic validation  
**V2 (Planned):** Enhanced sandboxing, network isolation  
**V3 (Future):** Full containerization, compliance features

### Performance Goals

**Current:**
- Single conversion: < 5 seconds (typical)
- Concurrent: 5 conversions

**Target:**
- Single conversion: < 2 seconds (typical)
- Concurrent: 20+ conversions
- Batch processing: 100+ files

### Architecture Evolution

**Current:** Monolithic backend, modular frontend  
**Future:** Microservices-ready, plugin architecture

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Version history
- Planned features
- Release timeline
- Long-term vision

**Note:** Dates and features are subject to change based on development priorities and user feedback.
