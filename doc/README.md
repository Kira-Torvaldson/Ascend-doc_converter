# Ascend Documentation

## Purpose

This directory contains the canonical documentation for Ascend. Documentation is organized into reference documents (canonical sources of truth) and specifications (descriptive documents).

## Documentation Structure

```
doc/
├── README.md                    # This file
├── glossary.md                  # Terminology definitions
├── changelog.md                 # Version history
├── references/                  # Canonical references (source of truth)
│   ├── core/                   # Core identity and capabilities
│   │   ├── ascend-identity.md
│   │   ├── supported-formats.md
│   │   └── engines.md
│   ├── configuration/          # Configuration contracts
│   │   ├── execution-profile.md
│   │   ├── resource-limits.md
│   │   ├── logging-policy.md
│   │   └── paths-and-storage.md
│   ├── normalization/          # Normalization rules
│   │   ├── text-normalization.md
│   │   ├── encoding-rules.md
│   │   └── typographic-canonicalization.md
│   ├── security/               # Security rules
│   │   ├── sandboxing.md
│   │   ├── file-validation.md
│   │   ├── confirmation-rules.md
│   │   └── threat-model.md
│   ├── conversion/             # Conversion behavior
│   │   ├── pipeline.md
│   │   ├── conversion-options.md
│   │   ├── error-handling.md
│   │   └── fallback-strategies.md
│   ├── api/                   # API contracts
│   │   ├── endpoints.md
│   │   ├── request-contracts.md
│   │   └── response-contracts.md
│   ├── ui/                    # Frontend behavior
│   │   ├── frontend-behavior.md
│   │   └── batch-processing.md
│   └── profiles/              # Product profiles
│       ├── community.md
│       ├── pro.md
│       └── enterprise.md
└── specs/                     # Specifications (descriptive)
    ├── roadmap.md
    ├── architecture.md
    └── local-first-principles.md
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

## Quick Navigation

### For Developers

1. **[ascend-identity.md](references/core/ascend-identity.md)** - Project identity and principles
2. **[supported-formats.md](references/core/supported-formats.md)** - Available formats
3. **[engines.md](references/core/engines.md)** - Conversion engines
4. **[pipeline.md](references/conversion/pipeline.md)** - Conversion lifecycle
5. **[endpoints.md](references/api/endpoints.md)** - API reference

### For System Administrators

1. **[execution-profile.md](references/configuration/execution-profile.md)** - Resource limits
2. **[resource-limits.md](references/configuration/resource-limits.md)** - Detailed limits
3. **[logging-policy.md](references/configuration/logging-policy.md)** - Logging configuration
4. **[paths-and-storage.md](references/configuration/paths-and-storage.md)** - File system layout

### For Security Auditors

1. **[threat-model.md](references/security/threat-model.md)** - Security threats and mitigations
2. **[sandboxing.md](references/security/sandboxing.md)** - Isolation mechanisms
3. **[file-validation.md](references/security/file-validation.md)** - Input validation rules
4. **[confirmation-rules.md](references/security/confirmation-rules.md)** - Token system

### For Users

1. **[frontend-behavior.md](references/ui/frontend-behavior.md)** - UI behavior and shortcuts
2. **[batch-processing.md](references/ui/batch-processing.md)** - Processing multiple files
3. **[conversion-options.md](references/conversion/conversion-options.md)** - Configuration options

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

## Legacy Documentation

Previous documentation structure has been reorganized. Old files may still exist but are being migrated to the new structure. Refer to canonical references for authoritative information.

## Contributing

When adding or modifying documentation:
1. Determine if it's a reference (canonical) or specification (descriptive)
2. Place in appropriate directory
3. Mark canonical documents clearly
4. Update this README if adding new sections
5. Ensure English language and technical precision
