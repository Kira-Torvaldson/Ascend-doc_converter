> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Encoding Options Configuration

## Overview

This module defines the configuration structure for character encoding management during document conversion. It follows an API-first approach with safe default values and clear separation between input encoding, internal processing, and output encoding.

## Configuration Structure

### InputEncodingOptions (Input Encoding)

Manages detection and processing of source file encoding.

- **`encoding`** (`'auto'|'utf-8'|'ascii'|'latin-1'`)
  - Encoding to use for reading input file
  - `'auto'`: Automatic detection with UTF-8 priority
  - Default value: `'auto'`

- **`autoDetect`** (`boolean`)
  - Enable automatic encoding detection
  - If `true` and `encoding='auto'`, attempts to detect encoding
  - Default value: `true`

- **`fallbackToLatin1`** (`boolean`)
  - Use Latin-1 as fallback if UTF-8 fails (only if `autoDetect=true`)
  - **Warning**: May mask encoding errors
  - Default value: `false` (recommended for production)

**Impact**: Determines how characters are interpreted when reading the source file. Poor detection can corrupt content.

### OutputEncodingOptions (Output Encoding)

Manages output file encoding.

- **`encoding`** (`'utf-8'|'ascii'|'latin-1'`)
  - Encoding to use for writing output file
  - Default value: `'utf-8'` (recommended modern standard)

- **`addBOM`** (`boolean`)
  - Add BOM (Byte Order Mark) at the beginning of UTF-8 file
  - Useful for some Windows tools, but generally unnecessary
  - Default value: `false`

**Impact**: Determines how characters are encoded in the output file. UTF-8 is recommended for maximum compatibility.

### InvalidCharacterHandling (Invalid Character Handling)

Manages characters that cannot be represented in the target encoding.

- **`strategy`** (`'fail'|'replace'|'remove'|'transliterate'`)
  - **`'fail'`**: Fail immediately with explicit error (strict mode)
  - **`'replace'`**: Replace with substitution character (recommended)
  - **`'remove'`**: Silently remove (may alter meaning)
  - **`'transliterate'`**: Simple transliteration (é → e, etc.)
  - Default value: `'replace'`

- **`replacementChar`** (`string`)
  - Character used to replace invalid characters (if `strategy='replace'`)
  - Default value: `'\uFFFD'` (standard Unicode substitution character)

- **`logInvalidChars`** (`boolean`)
  - Log detected invalid characters for analysis
  - Important for production debugging
  - Default value: `true`

**Impact**: Determines how to handle characters that cannot be encoded. The `'replace'` strategy is safest as it preserves document structure.

### UnicodeNormalization (Unicode Normalization)

Normalizes Unicode characters to ensure consistent representation.

- **`form`** (`'none'|'NFC'|'NFKC'`)
  - **`'none'`**: No normalization
  - **`'NFC'`**: Canonical Composed Form (recommended)
  - **`'NFKC'`**: Compatibility Composed Form (more aggressive)
  - Default value: `'NFC'`

- **`preserveMeaning`** (`boolean`)
  - Ensures normalization does not alter content meaning
  - Activates additional checks
  - Default value: `true`

**Impact**: NFC normalization ensures characters are represented consistently (e.g., é can be represented as a single character or e+accent). Important for text comparison and processing.

### CharacterCleaning (Invisible Character Cleaning)

Removes or normalizes potentially problematic characters.

- **`removeControlChars`** (`boolean`)
  - Remove control characters (0x00-0x1F, except \t, \n, \r)
  - May fix corrupted files
  - Default value: `true`

- **`removeDirectionalChars`** (`boolean`)
  - Remove directional characters (RTL/LTR)
  - Avoids display issues in some tools
  - Default value: `true`

- **`removeZeroWidthChars`** (`boolean`)
  - Remove zero-width characters (invisible)
  - May mask security issues (invisible injection)
  - Default value: `true`

- **`normalizeWhitespace`** (`boolean`)
  - Normalize multiple spaces to single space
  - May alter intentional formatting
  - Default value: `false` (recommended)

**Impact**: Cleans content of potentially problematic characters. Important for security and compatibility.

### ProcessingMode (Processing Mode)

Defines global behavior in case of error or anomaly.

- **`mode`** (`'strict'|'tolerant'`)
  - **`'strict'`**: Immediate error on any problem
  - **`'tolerant'`**: Automatic cleanup + warnings
  - Default value: `'tolerant'`

- **`throwOnError`** (`boolean`)
  - Throw immediate error instead of continuing
  - Used in strict mode
  - Default value: `false`

- **`logWarnings`** (`boolean`)
  - Log warnings for later analysis
  - Important for production debugging
  - Default value: `true`

**Impact**: Determines whether processing continues in case of problem or stops immediately. Tolerant mode is recommended for production.

## Available Presets

### DefaultEncodingOptions (Recommended for Production)

- Auto-detected encoding (UTF-8 priority)
- Invalid character handling by replacement
- NFC normalization
- Cleaning of problematic characters
- Tolerant mode with logging

**Usage**: General use cases, standard document conversion.

### StrictEncodingOptions (Critical Environments)

- Explicit UTF-8 (no auto-detection)
- Immediate failure on invalid characters
- NFC normalization
- Strict cleaning
- Strict mode with immediate errors

**Usage**: Strict validation required, critical environments where errors must be immediately visible.

### PermissiveEncodingOptions (Legacy Documents)

- Auto-detection with Latin-1 fallback
- Transliteration of invalid characters
- NFKC normalization (more aggressive)
- Minimal cleaning
- Tolerant mode without warnings

**Usage**: Conversion of documents with mixed or unknown encodings, maximum content recovery even if corrupted.

## Usage Example

```javascript
const { mergeEncodingOptions, validateEncodingOptions } = require('./encoding-options');

// User options (partial)
const userOptions = {
  input: {
    encoding: 'utf-8', // Force UTF-8
  },
  invalidCharacters: {
    strategy: 'fail', // Fail on invalid characters
  },
  processingMode: {
    mode: 'strict', // Strict mode
  },
};

// Merge with default values
const options = mergeEncodingOptions(userOptions);

// Validate
const validation = validateEncodingOptions(options);
if (!validation.valid) {
  console.error('Invalid options:', validation.errors);
  return;
}

// Use options in processing
// ...
```

## Production Recommendations

1. **Input Encoding**: Use `'auto'` with `autoDetect=true` for flexibility, or explicit `'utf-8'` for security.

2. **Output Encoding**: Always use `'utf-8'` unless specific constraint.

3. **Invalid Characters**: Use `'replace'` with `logInvalidChars=true` for traceability.

4. **Normalization**: Use `'NFC'` with `preserveMeaning=true` to ensure consistency without altering meaning.

5. **Cleaning**: Enable cleaning of control and directional characters for security.

6. **Processing Mode**: Use `'tolerant'` with `logWarnings=true` for production, `'strict'` for validation.

## Security Notes

- Zero-width characters can be used for injection attacks. Cleaning is recommended.
- Control characters can corrupt display or be interpreted as commands.
- Normalization may mask some differences between similar characters. Use `preserveMeaning=true`.

## Compatibility

- UTF-8 is the modern standard and is recommended for all new projects.
- ASCII is compatible but limited (characters 0-127 only).
- Latin-1 (ISO-8859-1) is a legacy encoding, use only if necessary.
