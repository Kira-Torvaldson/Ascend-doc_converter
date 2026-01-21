# Normalization Reference

## Purpose

This document defines the canonical normalization references for Ascend, including text normalization, encoding rules, and typographic canonicalization. It serves as the authoritative reference for all normalization operations.

---

## Text Normalization

### Purpose

This section defines the canonical text normalization rules applied by Ascend. Normalization ensures consistent text representation and improves conversion reliability.

### Normalization Stages

#### Stage 1: BOM Removal

**Rule:** Remove all Byte Order Mark (BOM) characters from input text.

**BOM Variants:**
- UTF-8 BOM: `\uFEFF` (0xEF 0xBB 0xBF)
- UTF-16 LE BOM: 0xFF 0xFE
- UTF-16 BE BOM: 0xFE 0xFF

**Implementation:** Remove BOM from the beginning of text before any other processing.

#### Stage 2: Encoding Normalization

**Rule:** Normalize text encoding to UTF-8.

**Process:**
1. Detect current encoding (if not specified)
2. Convert to UTF-8
3. Handle invalid sequences according to strategy (replace, remove, fail)

**Default Strategy:** Replace invalid characters with Unicode replacement character (U+FFFD).

#### Stage 3: Smart Quote Replacement

**Rule:** Replace typographic quotes with standard ASCII quotes.

**Replacements:**
- Left double quote (`"`) → `"`
- Right double quote (`"`) → `"`
- Left single quote (`'`) → `'`
- Right single quote (`'`) → `'`

**Rationale:** Smart quotes can break parsers and converters. Standard quotes ensure compatibility.

#### Stage 4: Typographic Character Normalization

**Rule:** Normalize typographic characters to ASCII equivalents.

**Replacements:**
- Em dash (`—`) → `--`
- En dash (`–`) → `-`
- Non-breaking space (` `) → ` ` (regular space)
- Ellipsis (`…`) → `...`
- Zero-width space (`​`) → removed
- Zero-width non-breaking space (`\uFEFF`) → removed

**Rationale:** Typographic characters can cause parsing issues. ASCII equivalents ensure compatibility.

#### Stage 5: Control Character Removal

**Rule:** Remove problematic control characters while preserving formatting.

**Preserved Characters:**
- `\n` (0x0A) - Line feed
- `\r` (0x0D) - Carriage return
- `\t` (0x09) - Tab

**Removed Characters:**
- All other control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)

**Rationale:** Control characters can break parsers or cause security issues. Formatting characters are preserved.

### Normalization Order

Normalization must be applied in this exact order:
1. BOM removal (first)
2. Encoding normalization
3. Smart quote replacement
4. Typographic character normalization
5. Control character removal (last, to preserve formatting)

### Configuration

Normalization can be configured via conversion options:
- `normalization.encoding` - Encoding strategy
- `normalization.advanced.unicode.normalization` - Unicode normalization form (NFC, NFKC, none)
- `normalization.advanced.characterCleaning.*` - Character cleaning options

---

## Encoding Rules

### Purpose

This section defines the canonical encoding rules for Ascend. It specifies how text encoding is detected, normalized, and handled throughout the conversion pipeline.

### Encoding Standards

#### Primary Encoding: UTF-8

**Rule:** UTF-8 is the primary and preferred encoding for all text processing.

**Rationale:**
- Universal compatibility
- Supports all Unicode characters
- Standard for modern applications
- No BOM required (though BOM is removed if present)

### Supported Encodings

| Encoding | Identifier | Status | Use Case |
|----------|-----------|--------|----------|
| UTF-8 | `utf-8` | ✅ Primary | All modern text |
| ASCII | `ascii` | ✅ Supported | Plain ASCII text |
| Latin-1 | `latin1`, `iso-8859-1` | ✅ Supported | Legacy documents |
| Windows-1252 | `windows-1252`, `cp1252` | ⚠️ Auto-detected | Windows legacy files |

### Encoding Detection

#### Automatic Detection

**Rule:** When encoding is not specified, attempt automatic detection.

**Detection Order:**
1. Check for UTF-8 BOM
2. Validate UTF-8 byte sequences
3. Attempt Windows-1252 decoding
4. Fallback to Latin-1 (if enabled)

#### Detection Strategy

**Default:** `auto` with UTF-8 priority

**Process:**
1. If BOM present, use BOM encoding
2. Validate UTF-8 byte sequences
3. If invalid UTF-8, attempt Windows-1252
4. If still invalid, use Latin-1 (if fallback enabled)

### Encoding Normalization

#### Input Encoding

**Rule:** All input text is normalized to UTF-8 before processing.

**Process:**
1. Detect or use specified encoding
2. Decode to UTF-8
3. Handle invalid sequences according to strategy
4. Continue with UTF-8 text

#### Output Encoding

**Rule:** All output text is written as UTF-8.

**Exception:** None. UTF-8 is always used for output.

### Invalid Character Handling

#### Strategies

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `replace` | Replace with U+FFFD () | Default, safe |
| `remove` | Remove invalid characters | When structure must be preserved |
| `fail` | Throw error immediately | Strict validation |
| `transliterate` | Convert to ASCII equivalent | Legacy compatibility |

**Default:** `replace`

### Unicode Normalization

#### Normalization Forms

| Form | Description | Use Case |
|------|-------------|----------|
| `NFC` | Canonical Composition | Default, recommended |
| `NFKC` | Compatibility Composition | Aggressive normalization |
| `none` | No normalization | Preserve exact representation |

**Default:** `NFC`

**Rule:** NFC normalization is applied by default to ensure consistent character representation without altering meaning.

### BOM Handling

#### BOM Removal

**Rule:** BOM characters are always removed from input text.

**Rationale:**
- BOM can break parsers
- UTF-8 doesn't require BOM
- Consistent text representation

#### BOM in Output

**Rule:** BOM is never added to output files.

**Rationale:**
- UTF-8 doesn't require BOM
- BOM can cause issues in some tools
- Consistent output format

---

## Typographic Canonicalization

### Purpose

This section defines the canonical mappings for typographic characters to their ASCII equivalents. This ensures compatibility with parsers and converters that may not handle typographic characters correctly.

### Character Mappings

#### Quotes

| Typographic | ASCII | Unicode | Replacement |
|-------------|-------|---------|-------------|
| Left double quote | `"` | U+201C | `"` (U+0022) |
| Right double quote | `"` | U+201D | `"` (U+0022) |
| Left single quote | `'` | U+2018 | `'` (U+0027) |
| Right single quote | `'` | U+2019 | `'` (U+0027) |

#### Dashes

| Typographic | ASCII | Unicode | Replacement |
|-------------|-------|---------|-------------|
| Em dash | `—` | U+2014 | `--` (two hyphens) |
| En dash | `–` | U+2013 | `-` (single hyphen) |

#### Spaces

| Typographic | ASCII | Unicode | Replacement |
|-------------|-------|---------|-------------|
| Non-breaking space | ` ` | U+00A0 | ` ` (regular space, U+0020) |
| Zero-width space | `​` | U+200B | (removed) |
| Zero-width non-breaking space | `\uFEFF` | U+FEFF | (removed) |

#### Other Characters

| Typographic | ASCII | Unicode | Replacement |
|-------------|-------|---------|-------------|
| Ellipsis | `…` | U+2026 | `...` (three periods) |
| Prime | `′` | U+2032 | `'` (single quote) |
| Double prime | `″` | U+2033 | `"` (double quote) |

### Replacement Rules

#### Rule 1: Preserve Meaning

**Rule:** Replacements must preserve the semantic meaning of the text.

**Examples:**
- `"quoted text"` → `"quoted text"` (quotes preserved)
- `—em dash—` → `--em dash--` (dash preserved)
- `'single quote'` → `'single quote'` (quote preserved)

#### Rule 2: ASCII Equivalents

**Rule:** All replacements use standard ASCII characters.

**Rationale:**
- Maximum compatibility
- Parser-friendly
- No encoding issues

#### Rule 3: Context Preservation

**Rule:** Replacements preserve document structure and formatting.

**Examples:**
- Non-breaking spaces in structured text may be preserved in some contexts
- Zero-width characters are always removed (no semantic value)

### Application Order

Typographic canonicalization is applied:
1. After encoding normalization
2. Before control character removal
3. As part of the text normalization pipeline

### Configuration

Typographic canonicalization can be:
- **Enabled:** All mappings applied (default)
- **Disabled:** Original characters preserved
- **Selective:** Specific character types can be excluded

---

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Normalization rules and order
- Character replacement mappings
- Control character handling
- Encoding normalization strategy
- Encoding standards and priorities
- Detection strategies
- Invalid character handling
- Typographic character mappings
- Replacement rules
- ASCII equivalents
- Application order

Any changes to normalization rules must be reflected here first, then propagated to implementation code.
