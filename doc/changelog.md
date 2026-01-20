# Changelog

## Purpose

This document provides a canonical record of changes to Ascend. It follows semantic versioning and documents all notable changes.

## Format

Each entry includes:
- Version number
- Release date
- Changes (Added, Changed, Fixed, Removed, Security)

## Version History

### 0.0.1.2.2 alpha (2026-01-19)

#### Added
- Complete documentation reorganization
- Canonical reference structure (`doc/references/`)
- New documentation categories (core, configuration, security, conversion, API, UI, profiles)
- Specifications directory (`doc/specs/`)
- Glossary and changelog
- Module interface specification

#### Changed
- Documentation structure reorganized for future-proof machine-readable configuration
- All documentation now in English (technical precision)
- Clear separation between canonical references and specifications
- Documentation ready for 1:1 mapping to `ascend.reference.json`

### 0.0.1.2.1 alpha (2026-01-19)

#### Added
- Environment diagnostic script (`api/backend/bin/check-env.js`)
- Data normalization proxy (`api/backend/services/proxy/secure-proxy.js`)
- Batch processing service (`api/frontend/services/bulk-processor.ts`)
- Comprehensive documentation reorganization

#### Changed
- Documentation structure reorganized into canonical references
- Version synchronization across all components
- README updated to reflect current limitations

#### Fixed
- Import path corrections in orchestrator modules
- Backend startup issues resolved

### 0.0.1.2.1 alpha (2026-01-19)

#### Added
- Structured logging system
- Log API endpoints (`/api/logs`, `/api/logs/:id`)
- Log viewing script (`api/logs/list-logs.js`)

#### Changed
- Backend reorganization (routes, middleware, services)
- Module exports clarified
- README consolidation

### 0.0.1.2.1 alpha (2026-01-19)

#### Added
- Text2Markdown module (placeholder → functional)
- PanWriter module (placeholder)
- Docverter module (placeholder)
- Converter orchestrator module
- Main and execution orchestrators
- Lazy loading module

#### Changed
- Module interface standardization
- Conversion routing via orchestrator

### 0.0.1.1 alpha (2026-01-19)

#### Added
- Initial release
- AsciiDoc ↔ Markdown conversion
- Basic UI
- Security framework (V1)
- Conversion options system

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Version history
- Change tracking
- Release dates
- Feature additions and removals
