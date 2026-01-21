# Ascend Documentation

## Purpose

This directory contains the canonical documentation for Ascend. Documentation is organized into reference documents (canonical sources of truth) and specifications (descriptive documents).

## Documentation Structure

```
doc/
├── README.md                    # This file
├── DOCUMENTATION.md             # Complete documentation (single file)
├── glossary.md                  # Terminology definitions
├── changelog.md                 # Version history
├── references/                  # Canonical references (source of truth)
│   ├── core.md                 # Core identity, formats, engines
│   ├── configuration.md        # All configuration contracts
│   ├── normalization.md         # Normalization rules
│   ├── security.md              # Security rules and threat model
│   ├── conversion.md            # Conversion pipeline and error handling
│   ├── api.md                   # API endpoints and contracts
│   ├── ui.md                    # Frontend behavior and batch processing
│   └── profiles.md              # Product profiles (Community, Pro, Enterprise)
├── specs/                       # Specifications (descriptive)
│   ├── roadmap.md               # Project roadmap and vision
│   ├── architecture.md          # System architecture
│   ├── local-first-principles.md # Local-first design principles
│   └── modules-interface.md     # Module interface contract
├── specifications/              # Module and component specifications
│   ├── modules/                # Individual module specifications
│   │   ├── downdoc.module.md
│   │   ├── pandoc.module.md
│   │   ├── text2markdown.module.md
│   │   ├── panwriter.module.md
│   │   ├── docverter.module.md
│   │   ├── lazyload.module.md
│   │   ├── orchestrator.module.md
│   │   ├── orchestrator-comm.module.md
│   │   ├── converter-orchestrator.module.md
│   │   └── logs.module.md
│   └── secure-converter.md      # Secure converter implementation
├── guides/                      # Practical implementation guides
│   ├── integration/
│   │   └── secure-converter-frontend-integration.md
│   └── security/
│       └── confirmation-security-guide.md
└── _legacy/                     # Deprecated files (migrated to canonical references)
    ├── references/              # Original reference files preserved for reference
    └── specifications/         # Deprecated specification files
```

## Documentation Types

### Canonical References

Documents in `references/` are **canonical** - they serve as the authoritative source of truth for:
- Configuration values
- Behavioral rules
- Format definitions
- Security policies
- API contracts

These documents can be mapped 1:1 to machine-readable configuration (e.g., `ascend.reference.json`).

### Specifications

Documents in `specs/` are **descriptive** - they describe:
- System architecture
- Design principles
- Roadmap and vision
- Implementation guidelines
- Module interface contracts

## Quick Navigation

### For Developers

1. **[core.md](references/core.md)** - Project identity, formats, and engines
2. **[modules-interface.md](specs/modules-interface.md)** - Module interface contract
3. **[conversion.md](references/conversion.md)** - Conversion pipeline and lifecycle
4. **[api.md](references/api.md)** - API endpoints and contracts

### For System Administrators

1. **[configuration.md](references/configuration.md)** - All configuration (profiles, limits, logging, paths, envmap, options)
2. **[conversion.md](references/conversion.md)** - Error handling and fallback strategies

### For Security Auditors

1. **[security.md](references/security.md)** - Security rules, threat model, sandboxing, validation, confirmation
2. **[configuration.md](references/configuration.md)** - Resource limits and security settings

### For Users

1. **[ui.md](references/ui.md)** - Frontend behavior, shortcuts, and batch processing
2. **[configuration.md](references/configuration.md)** - Conversion and encoding options

### Complete Documentation

- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Single file containing all documentation

## Documentation Principles

### 1. Canonical Status

Documents marked as **canonical** are the source of truth. Changes to canonical documents represent authoritative updates.

### 2. English Language

All documentation is written in English for international accessibility and technical precision.

### 3. Technical Precision

Documentation uses precise, technical language. Rules are explicit and unambiguous.

### 4. Non-Duplication

Information appears in one canonical location. Other documents reference, not duplicate.

### 5. Future-Proof

Documentation structure supports future machine-readable configuration generation.

## Additional Documentation

### Complete Documentation

- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Single file containing all documentation organized by sections

### Module Specifications

Detailed specifications for individual conversion modules are located in `specifications/modules/`. These are technical implementation details for each module wrapper:

- **[downdoc.module.md](specifications/modules/downdoc.module.md)** - AsciiDoc to Markdown converter
- **[pandoc.module.md](specifications/modules/pandoc.module.md)** - Pandoc wrapper for format conversions
- **[text2markdown.module.md](specifications/modules/text2markdown.module.md)** - Plain text to Markdown converter
- **[panwriter.module.md](specifications/modules/panwriter.module.md)** - Panwriter wrapper (placeholder)
- **[docverter.module.md](specifications/modules/docverter.module.md)** - Docverter wrapper (placeholder)
- **[lazyload.module.md](specifications/modules/lazyload.module.md)** - Lazy loading module for converters
- **[orchestrator.module.md](specifications/modules/orchestrator.module.md)** - Linear conversion orchestrator
- **[orchestrator-comm.module.md](specifications/modules/orchestrator-comm.module.md)** - Orchestrator communication system
- **[converter-orchestrator.module.md](specifications/modules/converter-orchestrator.module.md)** - Converter selection orchestrator
- **[logs.module.md](specifications/modules/logs.module.md)** - Structured logging system

### Component Specifications

- **[secure-converter.md](specifications/secure-converter.md)** - Secure conversion engine implementation

### Integration Guides

Practical implementation guides are located in `guides/`:

- **[secure-converter-frontend-integration.md](guides/integration/secure-converter-frontend-integration.md)** - Frontend integration guide
- **[confirmation-security-guide.md](guides/security/confirmation-security-guide.md)** - Security confirmation guide

### Legacy Files

Original documentation files have been migrated into canonical reference files and preserved in `_legacy/` for reference. These files are deprecated and should not be used for new development:

- `_legacy/references/` - Original reference files (27 files)
- `_legacy/specifications/` - Deprecated specification files (PIPELINE.md, modules.interface.md)

## Contributing

When adding or modifying documentation:

1. **Determine the document type:**
   - **Canonical reference** → `references/` (source of truth)
   - **System specification** → `specs/` (architecture, principles)
   - **Module specification** → `specifications/modules/` (module details)
   - **Implementation guide** → `guides/` (practical guidance)

2. **For canonical references:**
   - Update the appropriate file in `references/` (8 canonical files)
   - Do not create new files - merge into existing canonical files
   - Mark sections clearly with headers

3. **For module specifications:**
   - Create or update files in `specifications/modules/`
   - Follow the naming convention: `<module-name>.module.md`
   - Reference `specs/modules-interface.md` for interface contract

4. **General guidelines:**
   - Mark canonical documents clearly
   - Update this README if adding new sections
   - Ensure English language and technical precision
   - Avoid duplication - reference canonical sources instead
   - Do not use files in `_legacy/` - they are deprecated