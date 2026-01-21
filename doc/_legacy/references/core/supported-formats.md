> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Supported Formats

## Purpose

This document defines the canonical list of supported input and output formats for Ascend. It serves as the authoritative reference for format validation, conversion routing, and API contracts.

## Format Naming Convention

All format identifiers must:
- Be lowercase
- Use standard format names (e.g., `markdown`, `asciidoc`, `html`)
- Match exactly across all system components
- Be normalized before use in any validation or routing logic

## Currently Supported Formats

### Input Formats

| Format | Identifier | Status | Engine |
|--------|-----------|--------|--------|
| AsciiDoc | `asciidoc` | ✅ Active | downdoc |
| Markdown | `markdown` | ✅ Active | Pandoc |
| Plain Text | `txt` | ✅ Active | text2markdown |
| HTML | `html` | ⏳ Planned | Pandoc |

### Output Formats

| Format | Identifier | Status | Engine |
|--------|-----------|--------|--------|
| Markdown | `markdown` | ✅ Active | downdoc |
| AsciiDoc | `asciidoc` | ✅ Active | Pandoc |
| Plain Text | `txt` | ⏳ Planned | Native |
| HTML | `html` | ⏳ Planned | Pandoc |

## Format Validation Rules

### 1. Whitelist Enforcement

Only formats explicitly listed in this document are accepted. Any format not in the whitelist must be rejected before any processing begins.

### 2. Format Pair Validation

The system validates that:
- The source format is in the input formats whitelist
- The target format is in the output formats whitelist
- A conversion path exists between the formats

### 3. Format Detection

When format is not explicitly provided:
- File extension is used as a hint
- Content analysis may be performed (MIME type, magic bytes)
- User declaration takes precedence over detection

## Planned Formats

The following formats are planned for future releases:

- **PDF** (`pdf`) - Input and output
- **YAML** (`yaml`) - Input and output
- **JSON** (`json`) - Input and output
- **DOCX** (`docx`) - Input and output (via docverter)
- **RTF** (`rtf`) - Input and output (via docverter)
- **ODT** (`odt`) - Input and output (via panwriter)

## Format-Specific Notes

### AsciiDoc

- **Extension:** `.adoc`, `.asciidoc`
- **MIME Type:** `text/x-asciidoc`
- **Encoding:** UTF-8 required
- **Special Features:** Supports BookStack/Parsedown compatibility mode

### Markdown

- **Extension:** `.md`, `.markdown`
- **MIME Type:** `text/markdown`
- **Encoding:** UTF-8 required
- **Flavors:** Standard Markdown, BookStack-compatible

### Plain Text

- **Extension:** `.txt`
- **MIME Type:** `text/plain`
- **Encoding:** UTF-8 preferred, auto-detection supported
- **Special Features:** Automatic structure detection (headings, lists)

## Conversion Matrix

| From \ To | Markdown | AsciiDoc | HTML | TXT |
|-----------|----------|----------|------|-----|
| AsciiDoc  | ✅       | -        | ⏳    | ⏳   |
| Markdown  | -        | ✅       | ⏳    | ⏳   |
| HTML      | ⏳       | ⏳       | -    | ⏳   |
| TXT       | ✅       | ⏳       | ⏳    | -   |

**Legend:**
- ✅ = Currently supported
- ⏳ = Planned
- - = Not applicable

## Canonical Status

This document is **canonical** and serves as the source of truth for:
- Format whitelist validation
- Conversion routing decisions
- API format parameter validation
- UI format selector options

Any changes to supported formats must be reflected here first, then propagated to:
- Format validation code
- Conversion orchestrator
- API documentation
- UI components
