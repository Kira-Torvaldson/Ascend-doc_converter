# Text Normalization

## Purpose

This document defines the canonical text normalization rules applied by Ascend. Normalization ensures consistent text representation and improves conversion reliability.

## Normalization Stages

### Stage 1: BOM Removal

**Rule:** Remove all Byte Order Mark (BOM) characters from input text.

**BOM Variants:**
- UTF-8 BOM: `\uFEFF` (0xEF 0xBB 0xBF)
- UTF-16 LE BOM: 0xFF 0xFE
- UTF-16 BE BOM: 0xFE 0xFF

**Implementation:** Remove BOM from the beginning of text before any other processing.

### Stage 2: Encoding Normalization

**Rule:** Normalize text encoding to UTF-8.

**Process:**
1. Detect current encoding (if not specified)
2. Convert to UTF-8
3. Handle invalid sequences according to strategy (replace, remove, fail)

**Default Strategy:** Replace invalid characters with Unicode replacement character (U+FFFD).

### Stage 3: Smart Quote Replacement

**Rule:** Replace typographic quotes with standard ASCII quotes.

**Replacements:**
- Left double quote (`"`) → `"`
- Right double quote (`"`) → `"`
- Left single quote (`'`) → `'`
- Right single quote (`'`) → `'`

**Rationale:** Smart quotes can break parsers and converters. Standard quotes ensure compatibility.

### Stage 4: Typographic Character Normalization

**Rule:** Normalize typographic characters to ASCII equivalents.

**Replacements:**
- Em dash (`—`) → `--`
- En dash (`–`) → `-`
- Non-breaking space (` `) → ` ` (regular space)
- Ellipsis (`…`) → `...`
- Zero-width space (`​`) → removed
- Zero-width non-breaking space (`\uFEFF`) → removed

**Rationale:** Typographic characters can cause parsing issues. ASCII equivalents ensure compatibility.

### Stage 5: Control Character Removal

**Rule:** Remove problematic control characters while preserving formatting.

**Preserved Characters:**
- `\n` (0x0A) - Line feed
- `\r` (0x0D) - Carriage return
- `\t` (0x09) - Tab

**Removed Characters:**
- All other control characters (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)

**Rationale:** Control characters can break parsers or cause security issues. Formatting characters are preserved.

## Normalization Order

Normalization must be applied in this exact order:
1. BOM removal (first)
2. Encoding normalization
3. Smart quote replacement
4. Typographic character normalization
5. Control character removal (last, to preserve formatting)

## Configuration

Normalization can be configured via conversion options:
- `normalization.encoding` - Encoding strategy
- `normalization.advanced.unicode.normalization` - Unicode normalization form (NFC, NFKC, none)
- `normalization.advanced.characterCleaning.*` - Character cleaning options

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Normalization rules and order
- Character replacement mappings
- Control character handling
- Encoding normalization strategy
