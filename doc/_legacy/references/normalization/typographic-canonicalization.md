> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Typographic Canonicalization

## Purpose

This document defines the canonical mappings for typographic characters to their ASCII equivalents. This ensures compatibility with parsers and converters that may not handle typographic characters correctly.

## Character Mappings

### Quotes

| Typographic | ASCII | Unicode | Replacement |
|-------------|-------|---------|-------------|
| Left double quote | `"` | U+201C | `"` (U+0022) |
| Right double quote | `"` | U+201D | `"` (U+0022) |
| Left single quote | `'` | U+2018 | `'` (U+0027) |
| Right single quote | `'` | U+2019 | `'` (U+0027) |

### Dashes

| Typographic | ASCII | Unicode | Replacement |
|-------------|-------|---------|-------------|
| Em dash | `—` | U+2014 | `--` (two hyphens) |
| En dash | `–` | U+2013 | `-` (single hyphen) |

### Spaces

| Typographic | ASCII | Unicode | Replacement |
|-------------|-------|---------|-------------|
| Non-breaking space | ` ` | U+00A0 | ` ` (regular space, U+0020) |
| Zero-width space | `​` | U+200B | (removed) |
| Zero-width non-breaking space | `\uFEFF` | U+FEFF | (removed) |

### Other Characters

| Typographic | ASCII | Unicode | Replacement |
|-------------|-------|---------|-------------|
| Ellipsis | `…` | U+2026 | `...` (three periods) |
| Prime | `′` | U+2032 | `'` (single quote) |
| Double prime | `″` | U+2033 | `"` (double quote) |

## Replacement Rules

### Rule 1: Preserve Meaning

**Rule:** Replacements must preserve the semantic meaning of the text.

**Examples:**
- `"quoted text"` → `"quoted text"` (quotes preserved)
- `—em dash—` → `--em dash--` (dash preserved)
- `'single quote'` → `'single quote'` (quote preserved)

### Rule 2: ASCII Equivalents

**Rule:** All replacements use standard ASCII characters.

**Rationale:**
- Maximum compatibility
- Parser-friendly
- No encoding issues

### Rule 3: Context Preservation

**Rule:** Replacements preserve document structure and formatting.

**Examples:**
- Non-breaking spaces in structured text may be preserved in some contexts
- Zero-width characters are always removed (no semantic value)

## Application Order

Typographic canonicalization is applied:
1. After encoding normalization
2. Before control character removal
3. As part of the text normalization pipeline

## Configuration

Typographic canonicalization can be:
- **Enabled:** All mappings applied (default)
- **Disabled:** Original characters preserved
- **Selective:** Specific character types can be excluded

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Typographic character mappings
- Replacement rules
- ASCII equivalents
- Application order
