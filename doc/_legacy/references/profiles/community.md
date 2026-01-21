> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Community Profile

## Purpose

This document defines the canonical Community profile configuration for Ascend. This profile represents the default, open-source community edition.

## Profile Characteristics

### Target Audience

- Individual developers
- Small teams
- Open-source projects
- Personal use cases

### Feature Set

**Included:**
- AsciiDoc ↔ Markdown conversion
- Basic normalization
- Standard security features
- Local execution only
- Basic logging

**Excluded:**
- Advanced format support (PDF, DOCX, etc.)
- Enterprise security features
- Advanced monitoring
- API rate limiting (beyond basic)
- Priority support

### Resource Limits

- **Concurrent Conversions:** 5
- **File Size Limit:** 10 MB
- **Timeout:** 30 seconds
- **Memory per Conversion:** 512 MB

### Supported Formats

- **Input:** AsciiDoc, Markdown, Plain Text
- **Output:** Markdown, AsciiDoc

### Security Level

- **Sandboxing:** Light (V1)
- **Network Isolation:** Planned (V2)
- **User Isolation:** Planned (V2)
- **Audit Logging:** Basic

## Configuration

### Default Settings

- Execution profile: `default`
- Normalization: Standard
- Logging: Basic (30-day retention)
- Error reporting: Generic messages

### Customization

**Allowed:**
- Resource limit adjustments (within bounds)
- Conversion options
- UI preferences

**Restricted:**
- Security feature modifications
- Format whitelist changes
- Core pipeline modifications

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Community profile features
- Resource limits
- Supported formats
- Configuration options
