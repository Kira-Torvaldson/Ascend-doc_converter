# Core Reference

## Purpose

This document defines the canonical core references for Ascend, including project identity, supported formats, and conversion engines. It serves as the foundational reference for all other documentation and implementation decisions.

---

## Project Identity

### Purpose

This section defines the canonical identity, purpose, and core principles of the Ascend project.

### Project Identity

**Name:** Ascend  
**Type:** Local-first document conversion pipeline  
**Primary Function:** Convert documents between formats (currently AsciiDoc ↔ Markdown)  
**Architecture:** Modular, isolated, secure conversion pipeline  
**Philosophy:** Local-First, security by design, minimal resource footprint

### Core Principles

#### 1. Local-First

- All conversions execute entirely on the local machine
- No network access required or permitted during conversion
- No external service dependencies for core functionality
- Data remains on the user's system throughout the conversion process

#### 2. Isolation

- Each conversion executes in a completely isolated environment
- No shared state between conversions
- Unique temporary directory per conversion
- No interference between concurrent conversions

#### 3. Security by Design

- Strict input validation before any processing
- Sandboxed execution environment
- Resource limits enforced per conversion
- No trust of external inputs

#### 4. Modularity

- Conversion modules are independent units
- Standard interface contract for all modules
- Lazy loading to minimize memory footprint
- Extensible architecture for future formats

#### 5. Reliability

- Robust error handling without system crashes
- Guaranteed cleanup of resources
- Controlled degradation under load
- Comprehensive logging for auditability

### Current Status

**Version:** 0.0.1.2.2 alpha  
**Supported Conversions:** AsciiDoc ↔ Markdown  
**Future Formats:** HTML, PDF, YAML, JSON, TXT (planned)

### Target Audience

- **Primary:** Developers integrating document conversion into applications
- **Secondary:** System administrators deploying Ascend
- **Tertiary:** Security auditors reviewing the system

### Relationship to Other Documentation

This document is the root reference. All other documentation should align with these core principles:

- **Configuration references** must respect security and isolation principles
- **Security documentation** must implement the security-by-design principle
- **Conversion pipeline documentation** must follow the isolation and modularity principles
- **API documentation** must reflect the local-first philosophy

---

## Supported Formats

### Purpose

This section defines the canonical list of supported input and output formats for Ascend. It serves as the authoritative reference for format validation, conversion routing, and API contracts.

### Format Naming Convention

All format identifiers must:
- Be lowercase
- Use standard format names (e.g., `markdown`, `asciidoc`, `html`)
- Match exactly across all system components
- Be normalized before use in any validation or routing logic

### Currently Supported Formats

#### Input Formats

| Format | Identifier | Status | Engine |
|--------|-----------|--------|--------|
| AsciiDoc | `asciidoc` | ✅ Active | downdoc |
| Markdown | `markdown` | ✅ Active | Pandoc |
| Plain Text | `txt` | ✅ Active | text2markdown |
| HTML | `html` | ⏳ Planned | Pandoc |

#### Output Formats

| Format | Identifier | Status | Engine |
|--------|-----------|--------|--------|
| Markdown | `markdown` | ✅ Active | downdoc |
| AsciiDoc | `asciidoc` | ✅ Active | Pandoc |
| Plain Text | `txt` | ⏳ Planned | Native |
| HTML | `html` | ⏳ Planned | Pandoc |

### Format Validation Rules

#### 1. Whitelist Enforcement

Only formats explicitly listed in this document are accepted. Any format not in the whitelist must be rejected before any processing begins.

#### 2. Format Pair Validation

The system validates that:
- The source format is in the input formats whitelist
- The target format is in the output formats whitelist
- A conversion path exists between the formats

#### 3. Format Detection

When format is not explicitly provided:
- File extension is used as a hint
- Content analysis may be performed (MIME type, magic bytes)
- User declaration takes precedence over detection

### Planned Formats

The following formats are planned for future releases:

- **PDF** (`pdf`) - Input and output
- **YAML** (`yaml`) - Input and output
- **JSON** (`json`) - Input and output
- **DOCX** (`docx`) - Input and output (via docverter)
- **RTF** (`rtf`) - Input and output (via docverter)
- **ODT** (`odt`) - Input and output (via panwriter)

### Format-Specific Notes

#### AsciiDoc

- **Extension:** `.adoc`, `.asciidoc`
- **MIME Type:** `text/x-asciidoc`
- **Encoding:** UTF-8 required
- **Special Features:** Supports BookStack/Parsedown compatibility mode

#### Markdown

- **Extension:** `.md`, `.markdown`
- **MIME Type:** `text/markdown`
- **Encoding:** UTF-8 required
- **Flavors:** Standard Markdown, BookStack-compatible

#### Plain Text

- **Extension:** `.txt`
- **MIME Type:** `text/plain`
- **Encoding:** UTF-8 preferred, auto-detection supported
- **Special Features:** Automatic structure detection (headings, lists)

### Conversion Matrix

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

---

## Conversion Engines

### Purpose

This section defines the canonical list of conversion engines (modules) available in Ascend, their capabilities, and their status. It serves as the authoritative reference for engine selection and routing.

### Engine Naming Convention

Engine identifiers must:
- Match the module name exactly
- Be lowercase with hyphens as separators
- Be unique across all engines
- Match the identifier in the module's `name` property

### Available Engines

#### downdoc

**Identifier:** `downdoc`  
**Status:** ✅ Active  
**Type:** JavaScript library (native)  
**Supported Conversions:**
- From: `asciidoc`
- To: `markdown`

**Characteristics:**
- Pure JavaScript implementation
- No external binary dependencies
- Fast in-memory conversion
- Supports BookStack/Parsedown compatibility mode

**Module Reference:** `api/backend/services/modules/downdoc.module.js`

#### pandoc

**Identifier:** `pandoc`  
**Status:** ✅ Active  
**Type:** External binary (command-line tool)  
**Supported Conversions:**
- From: `markdown`, `html`
- To: `asciidoc`, `html`, `pdf`, `docx`, `epub`, `rst`, `tex`, `latex`

**Characteristics:**
- Requires Pandoc binary installation
- Executed via `child_process.spawn`
- Supports extensive format range
- Timeout and resource limits enforced

**Module Reference:** Managed by converter-orchestrator (no direct module wrapper)

#### text2markdown

**Identifier:** `text2markdown`  
**Status:** ✅ Active  
**Type:** JavaScript library (native)  
**Supported Conversions:**
- From: `txt`
- To: `markdown`

**Characteristics:**
- Pure JavaScript implementation
- Automatic structure detection
- Detects headings, lists, code blocks
- No external dependencies

**Module Reference:** `api/backend/services/modules/text2markdown.module.js`

#### panwriter

**Identifier:** `panwriter`  
**Status:** ⏳ Placeholder  
**Type:** Planned (external service/library)  
**Supported Conversions:**
- From: `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`
- To: `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`

**Characteristics:**
- Not yet implemented
- Planned for future release
- Will support Office document formats

**Module Reference:** `api/backend/services/modules/panwriter.module.js` (placeholder)

#### docverter

**Identifier:** `docverter`  
**Status:** ⏳ Placeholder  
**Type:** Planned (external service/library)  
**Supported Conversions:**
- From: `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`
- To: `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`

**Characteristics:**
- Not yet implemented
- Planned for future release
- Will support extensive format range including images

**Module Reference:** `api/backend/services/modules/docverter.module.js` (placeholder)

### Engine Selection Rules

#### 1. Format-Based Routing

The converter orchestrator selects engines based on:
- Source format whitelist match
- Target format whitelist match
- Engine availability and status

#### 2. Priority Order

When multiple engines support the same conversion:
1. Native JavaScript engines (downdoc, text2markdown) are preferred
2. External binaries (pandoc) are used when native engines don't support the conversion
3. Placeholder engines are never selected (return error)

#### 3. Lazy Loading

All engines are loaded on-demand via the lazy loading module:
- Reduces initial memory footprint
- Allows dynamic engine discovery
- Enables graceful handling of missing engines

### Engine Interface Contract

All engines must conform to the module interface defined in `doc/specs/modules-interface.md`:

- **Required Properties:** `name`, `supportedFormats`
- **Required Method:** `run(inputPath, outputPath, options)`
- **Return Format:** `ModuleResult` with `{ success, logs, error, duration }`

### Engine Status Definitions

- **✅ Active:** Fully implemented, tested, and available for use
- **⏳ Placeholder:** Defined but not yet implemented, returns error if called
- **🔧 Development:** Under active development, may be unstable
- **❌ Deprecated:** No longer maintained, will be removed in future version

---

## Canonical Status

This document is **canonical** and serves as the source of truth for:
- Project identity and purpose
- Core architectural principles
- Design philosophy decisions
- Project status and roadmap direction
- Format whitelist validation
- Conversion routing decisions
- API format parameter validation
- UI format selector options
- Engine availability and capabilities
- Module registration in the orchestrator
- Status tracking for planned features

Any changes to this document represent fundamental shifts in project direction and require careful consideration.
