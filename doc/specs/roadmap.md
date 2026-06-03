# Roadmap

## Purpose

This document defines the canonical roadmap for Ascend. It outlines planned features, improvements, and milestones for future releases.

## Current Status

**Version:** 0.0.1.4.7+ (Ascend app — `api/backend` / `api/frontend`)  
**Status:** Active development — release industrialisée et qualité conversion  
**Focus:** Non-régression (golden / roundtrip), limites harmonisées, observabilité (`requestId`, métriques), CI Ascend

> Le package racine npm `downdoc` reste sur `1.0.2-stable` et n’est pas versionné comme Ascend.

## Version History

### 0.0.1.4.7 (Current — Ascend)

**Delivered (axes ASC-001 → ASC-009):**
- Scripts `release:bump` / `check:version` (7 zones de version)
- CI job `ascend` (golden, roundtrip, e2e, `test:abuse`)
- Corpus golden + roundtrip sémantique adoc ↔ md
- Enveloppe d’erreur (`error.code`, `category`, `hint`) + UI
- `X-Request-Id` / `meta.requestId`
- `GET /api/metrics`, `GET /api/config/limits`
- Limite entrée unifiée **5 Mo** (EnvMap, Express, modules, UI, Nginx 6m)
- Pandoc dans image Docker `container/backend`
- Tests d’abus API (`npm run test:abuse`)

**Docs:** `doc/specs/axes-ameliorations-0.0.1.4.7.md`, `doc/guides/operations/runbook.md`

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
