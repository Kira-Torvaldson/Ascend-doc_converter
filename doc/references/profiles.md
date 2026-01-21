# Profiles Reference

## Purpose

This document defines the canonical profile references for Ascend, including Community, Pro, and Enterprise profiles. It serves as the authoritative reference for all profile configurations.

---

## Community Profile

### Purpose

This section defines the canonical Community profile configuration for Ascend. This profile represents the default, open-source community edition.

### Profile Characteristics

#### Target Audience

- Individual developers
- Small teams
- Open-source projects
- Personal use cases

#### Feature Set

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

#### Resource Limits

- **Concurrent Conversions:** 5
- **File Size Limit:** 10 MB
- **Timeout:** 30 seconds
- **Memory per Conversion:** 512 MB

#### Supported Formats

- **Input:** AsciiDoc, Markdown, Plain Text
- **Output:** Markdown, AsciiDoc

#### Security Level

- **Sandboxing:** Light (V1)
- **Network Isolation:** Planned (V2)
- **User Isolation:** Planned (V2)
- **Audit Logging:** Basic

### Configuration

#### Default Settings

- Execution profile: `default`
- Normalization: Standard
- Logging: Basic (30-day retention)
- Error reporting: Generic messages

#### Customization

**Allowed:**
- Resource limit adjustments (within bounds)
- Conversion options
- UI preferences

**Restricted:**
- Security feature modifications
- Format whitelist changes
- Core pipeline modifications

---

## Pro Profile

### Purpose

This section defines the canonical Pro profile configuration for Ascend. This profile represents a future commercial edition with enhanced features.

### Profile Characteristics

#### Target Audience

- Professional developers
- Small to medium businesses
- Commercial projects
- Teams requiring advanced features

#### Feature Set

**Included:**
- All Community features
- Extended format support (HTML, PDF, YAML, JSON)
- Advanced normalization options
- Enhanced security features
- Extended logging (90-day retention)
- Priority support

**Excluded:**
- Enterprise security features
- Advanced monitoring dashboards
- Custom integrations
- SLA guarantees

#### Resource Limits

- **Concurrent Conversions:** 10
- **File Size Limit:** 50 MB
- **Timeout:** 120 seconds
- **Memory per Conversion:** 2 GB

#### Supported Formats

- **Input:** AsciiDoc, Markdown, HTML, Plain Text, PDF, YAML, JSON
- **Output:** Markdown, AsciiDoc, HTML, PDF, YAML, JSON

#### Security Level

- **Sandboxing:** Enhanced (V2)
- **Network Isolation:** Active
- **User Isolation:** Active
- **Audit Logging:** Extended

### Configuration

#### Default Settings

- Execution profile: `performance`
- Normalization: Advanced
- Logging: Extended (90-day retention)
- Error reporting: Detailed (with diagnostics)

#### Customization

**Allowed:**
- All Community customizations
- Extended resource limits
- Advanced conversion options
- Custom execution profiles

**Restricted:**
- Enterprise security features
- Custom format support
- Core pipeline modifications

**Note:** This profile is planned for future release, not currently implemented.

---

## Enterprise Profile

### Purpose

This section defines the canonical Enterprise profile configuration for Ascend. This profile represents a future enterprise edition with maximum features and security.

### Profile Characteristics

#### Target Audience

- Large enterprises
- Regulated industries
- High-security environments
- Organizations requiring compliance

#### Feature Set

**Included:**
- All Pro features
- Full format support (all planned formats)
- Enterprise security features
- Advanced monitoring and dashboards
- Custom integrations
- SLA guarantees
- Dedicated support

**Excluded:**
- None (full feature set)

#### Resource Limits

- **Concurrent Conversions:** 20
- **File Size Limit:** 100 MB
- **Timeout:** 300 seconds
- **Memory per Conversion:** 4 GB

#### Supported Formats

- **Input:** All formats (AsciiDoc, Markdown, HTML, PDF, DOCX, RTF, YAML, JSON, TXT, etc.)
- **Output:** All formats

#### Security Level

- **Sandboxing:** Maximum (V2+)
- **Network Isolation:** Strict
- **User Isolation:** Strict
- **Audit Logging:** Comprehensive
- **Compliance:** ISO 27001, NIST SP 800-53, GDPR/RGPD

### Configuration

#### Default Settings

- Execution profile: `strict` (security-focused)
- Normalization: Maximum
- Logging: Comprehensive (1-year retention)
- Error reporting: Detailed with compliance tracking

#### Customization

**Allowed:**
- All Pro customizations
- Enterprise resource limits
- Custom security policies
- Custom format support
- Custom integrations

**Restricted:**
- Core security features (cannot be disabled)
- Compliance requirements (cannot be bypassed)

### Compliance Features

#### Standards Support

- **ISO 27001:** Information security management
- **ISO 27002:** Security controls
- **NIST SP 800-53:** Security and privacy controls
- **GDPR/RGPD:** Data protection compliance

#### Audit Features

- Comprehensive audit logging
- Immutable log storage
- Compliance reporting
- Security event tracking

**Note:** This profile is planned for future release, not currently implemented.

---

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Community profile features
- Resource limits
- Supported formats
- Configuration options
- Pro profile features
- Enterprise profile features
- Compliance features

Any changes to profile configurations must be reflected here first, then propagated to implementation code.
