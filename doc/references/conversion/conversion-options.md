# Conversion Options Reference

## Purpose

This document defines the canonical conversion options available in Ascend. Options allow fine-grained control over conversion behavior.

## Option Structure

Conversion options are organized into 7 main categories:

1. **Content Analysis** - Content analysis and structure detection
2. **Normalization** - Text normalization and encoding
3. **Rendering** - Document rendering features
4. **Format Specific** - Format-specific options
5. **Security** - Security and robustness
6. **Metadata** - Document metadata
7. **Developer** - Developer options

## Option Categories

### 1. Content Analysis

**Purpose:** Control how content is analyzed and structured.

**Options:**
- `analysisMode`: `'basic'` | `'heuristic'` | `'strict'` (default: `'heuristic'`)
- `headingDetection`: Object with detection rules
  - `enabled`: boolean (default: `true`)
  - `detectAllCaps`: boolean (default: `true`)
  - `detectSeparators`: boolean (default: `true`)
  - `detectNumbering`: boolean (default: `true`)
  - `minLength`: number (default: `3`)
  - `maxLength`: number (default: `100`)
- `listDetection`: Object with list detection rules
  - `enabled`: boolean (default: `true`)
  - `detectBullets`: boolean (default: `true`)
  - `detectNumbered`: boolean (default: `true`)
  - `preserveIndentation`: boolean (default: `true`)
  - `normalizeIndentation`: boolean (default: `true`)
  - `indentSize`: number (default: `2`)

### 2. Normalization

**Purpose:** Control text normalization and encoding.

**Options:**
- `encoding`: `'utf-8'` | `'latin1'` | `'ascii'` (default: `'utf-8'`)
- `lineBreaks`: Object with line break normalization
  - `normalize`: boolean (default: `true`)
  - `target`: `'unix'` | `'windows'` | `'mac'` (default: `'unix'`)
  - `removeTrailing`: boolean (default: `true`)
  - `maxConsecutive`: number (default: `2`)
- `tabs`: Object with tab conversion
  - `convertToSpaces`: boolean (default: `true`)
  - `tabSize`: number (default: `2`)
- `advanced`: Object with advanced normalization options
  - See `doc/references/normalization/` for detailed options

### 3. Rendering

**Purpose:** Control document rendering features.

**Options:**
- `tableOfContents`: Object with TOC generation
  - `enabled`: boolean (default: `false`)
  - `depth`: number (default: `3`)
  - `position`: `'top'` | `'bottom'` | `'none'` (default: `'top'`)
- `sectionNumbering`: Object with section numbering
  - `enabled`: boolean (default: `false`)
  - `depth`: number (default: `3`)
  - `style`: `'numeric'` | `'alpha'` | `'roman'` (default: `'numeric'`)
- `lineWrap`: Object with line wrapping
  - `enabled`: boolean (default: `false`)
  - `maxWidth`: number (default: `80`)
  - `hardWrap`: boolean (default: `false`)
- `listStyle`: Object with list styling
  - `bulletStyle`: `'dash'` | `'asterisk'` | `'plus'` | `'circle'` (default: `'dash'`)
  - `numberedStyle`: `'numeric'` | `'alpha'` | `'roman'` (default: `'numeric'`)
  - `indentChar`: string (default: `' '`)
  - `indentSize`: number (default: `2`)

### 4. Format Specific

**Purpose:** Format-specific conversion options.

**Options:**
- `markdown`: Object with Markdown-specific options
  - `flavor`: `'commonmark'` | `'gfm'` | `'pandoc'` (default: `'commonmark'`)
  - `gfmExtensions`: Object with GitHub Flavored Markdown extensions
  - `parsedown`: boolean (default: `false`) - BookStack/Parsedown compatibility
- `asciidoc`: Object with AsciiDoc-specific options
  - Format-specific options (see implementation)

### 5. Security

**Purpose:** Security and robustness options.

**Options:**
- `timeout`: number (milliseconds, default: `30000`)
- `maxFileSize`: number (bytes, default: `10485760` = 10 MB)
- `confirmed`: boolean (default: `false`) - User confirmation status

### 6. Metadata

**Purpose:** Document metadata.

**Options:**
- `title`: string (optional)
- `author`: string (optional)
- `language`: string (ISO 639-1 code, default: `'fr'`)

### 7. Developer

**Purpose:** Developer and debugging options.

**Options:**
- Developer-specific options (see implementation)

## Option Validation

### Validation Rules

1. **Type Validation:** Options must match expected types
2. **Range Validation:** Numeric options must be within valid ranges
3. **Enum Validation:** String options must be from allowed values
4. **Structure Validation:** Object options must have required properties

### Default Merging

**Rule:** User-provided options are merged with defaults.

**Process:**
1. Start with default options
2. Deep merge user options
3. Validate merged options
4. Use validated options

## Related Documentation

- **Normalization Options:** `doc/references/normalization/text-normalization.md`
- **Encoding Options:** `doc/references/normalization/encoding-rules.md`
- **Advanced Normalization:** `doc/references/configuration/normalization-advanced-options.md` (legacy, being migrated)

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Available conversion options
- Option types and values
- Default values
- Validation rules

**Note:** For detailed option structures and implementation, see `api/backend/conversion-options.js`.
