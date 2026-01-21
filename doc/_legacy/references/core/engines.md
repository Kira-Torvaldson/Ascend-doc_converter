> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Conversion Engines

## Purpose

This document defines the canonical list of conversion engines (modules) available in Ascend, their capabilities, and their status. It serves as the authoritative reference for engine selection and routing.

## Engine Naming Convention

Engine identifiers must:
- Match the module name exactly
- Be lowercase with hyphens as separators
- Be unique across all engines
- Match the identifier in the module's `name` property

## Available Engines

### downdoc

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

### pandoc

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

### text2markdown

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

### panwriter

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

### docverter

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

## Engine Selection Rules

### 1. Format-Based Routing

The converter orchestrator selects engines based on:
- Source format whitelist match
- Target format whitelist match
- Engine availability and status

### 2. Priority Order

When multiple engines support the same conversion:
1. Native JavaScript engines (downdoc, text2markdown) are preferred
2. External binaries (pandoc) are used when native engines don't support the conversion
3. Placeholder engines are never selected (return error)

### 3. Lazy Loading

All engines are loaded on-demand via the lazy loading module:
- Reduces initial memory footprint
- Allows dynamic engine discovery
- Enables graceful handling of missing engines

## Engine Interface Contract

All engines must conform to the module interface defined in `doc/specs/modules.interface.md`:

- **Required Properties:** `name`, `supportedFormats`
- **Required Method:** `run(inputPath, outputPath, options)`
- **Return Format:** `ModuleResult` with `{ success, logs, error, duration }`

## Engine Status Definitions

- **✅ Active:** Fully implemented, tested, and available for use
- **⏳ Placeholder:** Defined but not yet implemented, returns error if called
- **🔧 Development:** Under active development, may be unstable
- **❌ Deprecated:** No longer maintained, will be removed in future version

## Canonical Status

This document is **canonical** and serves as the source of truth for:
- Engine availability and capabilities
- Conversion routing decisions
- Module registration in the orchestrator
- Status tracking for planned features

Changes to engine status or capabilities must be reflected here first.
