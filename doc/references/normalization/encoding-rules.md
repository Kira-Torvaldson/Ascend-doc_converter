# Encoding Rules

## Purpose

This document defines the canonical encoding rules for Ascend. It specifies how text encoding is detected, normalized, and handled throughout the conversion pipeline.

## Encoding Standards

### Primary Encoding: UTF-8

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

## Encoding Detection

### Automatic Detection

**Rule:** When encoding is not specified, attempt automatic detection.

**Detection Order:**
1. Check for UTF-8 BOM
2. Validate UTF-8 byte sequences
3. Attempt Windows-1252 decoding
4. Fallback to Latin-1 (if enabled)

### Detection Strategy

**Default:** `auto` with UTF-8 priority

**Process:**
1. If BOM present, use BOM encoding
2. Validate UTF-8 byte sequences
3. If invalid UTF-8, attempt Windows-1252
4. If still invalid, use Latin-1 (if fallback enabled)

## Encoding Normalization

### Input Encoding

**Rule:** All input text is normalized to UTF-8 before processing.

**Process:**
1. Detect or use specified encoding
2. Decode to UTF-8
3. Handle invalid sequences according to strategy
4. Continue with UTF-8 text

### Output Encoding

**Rule:** All output text is written as UTF-8.

**Exception:** None. UTF-8 is always used for output.

## Invalid Character Handling

### Strategies

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `replace` | Replace with U+FFFD () | Default, safe |
| `remove` | Remove invalid characters | When structure must be preserved |
| `fail` | Throw error immediately | Strict validation |
| `transliterate` | Convert to ASCII equivalent | Legacy compatibility |

**Default:** `replace`

## Unicode Normalization

### Normalization Forms

| Form | Description | Use Case |
|------|-------------|----------|
| `NFC` | Canonical Composition | Default, recommended |
| `NFKC` | Compatibility Composition | Aggressive normalization |
| `none` | No normalization | Preserve exact representation |

**Default:** `NFC`

**Rule:** NFC normalization is applied by default to ensure consistent character representation without altering meaning.

## BOM Handling

### BOM Removal

**Rule:** BOM characters are always removed from input text.

**Rationale:**
- BOM can break parsers
- UTF-8 doesn't require BOM
- Consistent text representation

### BOM in Output

**Rule:** BOM is never added to output files.

**Rationale:**
- UTF-8 doesn't require BOM
- BOM can cause issues in some tools
- Consistent output format

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Encoding standards and priorities
- Detection strategies
- Normalization rules
- Invalid character handling
