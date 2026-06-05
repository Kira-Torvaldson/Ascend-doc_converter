> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Advanced Normalization Options

## Overview

This module defines advanced normalization options that improve consistency, stability, cross-format compatibility, and security related to characters and encoding.

**Fundamental Principle**: No option enabled by default should alter the meaning of the text.

## Configuration Structure

### UnicodeManagement (Advanced Unicode Management)

Manages Unicode support and character normalization.

- **`mode`** (`'full'|'restricted'|'disabled'`)
  - **`'full'`**: Full support for all valid Unicode characters (recommended)
  - **`'restricted'`**: Limited to specified Unicode ranges
  - **`'disabled'`**: Disables advanced Unicode support
  - Default value: `'full'`
  - **Impact**: Determines which Unicode characters are accepted. The `'full'` mode is recommended for maximum compatibility.

- **`normalization`** (`'none'|'NFC'|'NFKC'`)
  - **`'none'`**: No normalization
  - **`'NFC'`**: Canonical Composed Form (recommended, does not modify meaning)
  - **`'NFKC'`**: Compatibility Composed Form (more aggressive, may modify some characters)
  - Default value: `'NFC'`
  - **Impact**: NFC normalization ensures consistent character representation (e.g., é can be represented as a single character or e+accent). NFC is non-destructive, NFKC may modify some characters.

- **`detectConfusables`** (`boolean`)
  - Detects visually confusable characters (e.g., Cyrillic vs Latin)
  - Default value: `true`
  - **Impact**: Detects characters that can be visually confused, useful for security (homoglyph attack detection).

- **`confusablesAction`** (`'none'|'warn'|'replace'`)
  - **`'none'`**: Do nothing
  - **`'warn'`**: Warn only (non-destructive, recommended)
  - **`'replace'`**: Replace with equivalent character
  - Default value: `'warn'`
  - **Impact**: Determines the action on detected confusable characters. `'warn'` is non-destructive and allows traceability.

### CharacterCleaning (Character Cleaning)

Removes or normalizes potentially problematic characters.

- **`removeControlChars`** (`boolean`)
  - Removes invisible control characters (0x00-0x1F, except \t, \n, \r)
  - Default value: `false` (disabled to avoid being destructive)
  - **Impact**: May fix corrupted files, but may also remove legitimate characters. Disabled by default.

- **`removeDirectionalChars`** (`boolean`)
  - Removes directional characters (RTL/LTR marks)
  - Default value: `false` (disabled to preserve display)
  - **Impact**: Avoids display issues in some tools, but may alter bidirectional text display. Disabled by default.

- **`removeNonPrintableChars`** (`boolean`)
  - Removes non-printable characters
  - Default value: `false` (disabled to avoid being destructive)
  - **Impact**: Cleans content, but may remove legitimate characters. Disabled by default.

- **`preserveWhitespace`** (`boolean`)
  - Preserves essential whitespace (tabs, newlines)
  - Default value: `true`
  - **Impact**: Ensures document structure (indentation, line breaks) is preserved.

### TransliterationAndFallback (Transliteration and Fallback)

Manages conversion of Unicode characters to ASCII equivalents.

- **`strategy`** (`'none'|'simple'|'configurable'`)
  - **`'none'`**: No transliteration (recommended by default)
  - **`'simple'`**: Simple transliteration (é → e)
  - **`'configurable'`**: Advanced configurable strategy
  - Default value: `'none'`
  - **Impact**: Transliteration may alter meaning (é → e loses accent). Disabled by default to preserve meaning.

- **`enableTransliteration`** (`boolean`)
  - Enables simple transliteration (é → e, ñ → n, etc.)
  - Default value: `false`
  - **Impact**: May alter text meaning. Disabled by default.

- **`unicodeToAscii`** (`UnicodeToAsciiFallback`)
  - Unicode → ASCII fallback strategy
  - Default value: `{ enabled: false, method: 'transliterate', replacementChar: '?' }`
  - **Impact**: Allows converting Unicode characters to ASCII, but may be destructive. Disabled by default.

  - **`enabled`** (`boolean`): Enables Unicode → ASCII fallback
  - **`method`** (`'remove'|'replace'|'transliterate'`): Conversion method
  - **`replacementChar`** (`string`): Replacement character if `method='replace'`

### ContentValidation (Content Validation)

Validates Unicode compliance of content.

- **`rejectInvalidSequences`** (`boolean`)
  - Rejects invalid Unicode sequences
  - Default value: `true`
  - **Impact**: Important for security and stability. Enabled by default.

- **`rejectPrivateChars`** (`boolean`)
  - Rejects private characters (Private Use Area, 0xE000-0xF8FF)
  - Default value: `false` (may be legitimate in some contexts)
  - **Impact**: Private characters may be used in specific contexts. Disabled by default.

- **`warnOutOfRange`** (`boolean`)
  - Reports characters outside allowed range
  - Default value: `true`
  - **Impact**: Allows traceability of issues without interrupting processing.

- **`allowedRanges`** (`Array<{start: number, end: number}>`)
  - Allowed Unicode ranges (empty = all except Private Use Area)
  - Default value: `[]`
  - **Impact**: Allows restricting accepted characters if necessary.

### ProcessingMode (Processing Mode)

Defines global behavior in case of error or anomaly.

- **`mode`** (`'strict'|'tolerant'`)
  - **`'strict'`**: Immediate error on any problem
  - **`'tolerant'`**: Automatic cleanup + warnings
  - Default value: `'tolerant'`

- **`throwOnError`** (`boolean`)
  - Throws immediate error instead of continuing
  - Default value: `false`

- **`logWarnings`** (`boolean`)
  - Logs warnings for later analysis
  - Default value: `true`

- **`continueOnWarning`** (`boolean`)
  - Continues processing despite warnings
  - Default value: `true`

**Impact**: Determines whether processing continues in case of problem or stops immediately. Tolerant mode is recommended for production.

## Available Presets

### DefaultAdvancedNormalizationOptions (Recommended for Production)

- Full Unicode mode
- NFC normalization (non-destructive)
- Confusable detection with warnings only
- Cleaning disabled by default (non-destructive)
- Transliteration disabled (preserves meaning)
- Active validation (security)
- Tolerant mode with logging

**Usage**: General use cases, standard document conversion. Ensures consistency without altering meaning.

### StrictAdvancedNormalizationOptions (Critical Environments)

- Full Unicode mode
- NFC normalization
- Confusable detection with warnings
- Strict cleaning enabled
- Transliteration disabled
- Strict validation (rejects private characters)
- Strict mode with immediate errors

**Usage**: Strict validation required, critical environments where errors must be immediately visible.

### PermissiveAdvancedNormalizationOptions (Legacy Documents)

- Full Unicode mode
- NFKC normalization (more aggressive)
- Confusable detection disabled
- Cleaning enabled (except directional characters)
- Transliteration enabled
- Permissive validation
- Tolerant mode without warnings

**Usage**: Conversion of documents with mixed or unknown encodings, maximum content recovery even if corrupted.

## Unicode Range Reference

The module exposes `UnicodeRanges` with commonly used ranges:

- `BASIC_LATIN`: ASCII (0x0000-0x007F)
- `LATIN_1_SUPPLEMENT`: Latin-1 (0x0080-0x00FF)
- `LATIN_EXTENDED_A/B`: Latin extensions
- `GENERAL_PUNCTUATION`: General punctuation
- `PRIVATE_USE_AREA`: Private use area (to reject by default)
- `CONTROL_CHARS`: Control characters
- `DIRECTIONAL_CHARS`: Directional characters (RTL/LTR)
- `ZERO_WIDTH_CHARS`: Zero-width characters

## Usage Example

```javascript
const { 
  mergeAdvancedNormalizationOptions, 
  validateAdvancedNormalizationOptions,
  checkOptionsSafety 
} = require('./normalization-advanced-options');

// User options (partial)
const userOptions = {
  unicode: {
    normalization: 'NFC', // Force NFC
  },
  characterCleaning: {
    removeControlChars: true, // Enable cleaning
  },
  processingMode: {
    mode: 'strict', // Strict mode
  },
};

// Merge with default values
const options = mergeAdvancedNormalizationOptions(userOptions);

// Validate
const validation = validateAdvancedNormalizationOptions(options);
if (!validation.valid) {
  console.error('Invalid options:', validation.errors);
  return;
}

// Check safety (non-destructiveness)
const safety = checkOptionsSafety(options);
if (!safety.safe) {
  console.warn('Security warnings:', safety.warnings);
}

// Use options in processing
// ...
```

## Production Recommendations

1. **Unicode Normalization**: Use `'NFC'` with `preserveMeaning=true` to ensure consistency without altering meaning.

2. **Cleaning**: Disable by default (`removeControlChars: false`, etc.) unless necessary. Enable only if you are sure it will not remove legitimate content.

3. **Transliteration**: Disable by default (`strategy: 'none'`) to preserve meaning. Enable only if ASCII conversion is explicitly required.

4. **Validation**: Enable `rejectInvalidSequences: true` for security. `rejectPrivateChars` may be enabled in strict mode.

5. **Processing Mode**: Use `'tolerant'` with `logWarnings: true` for production, `'strict'` for validation.

6. **Confusables**: Enable `detectConfusables: true` with `confusablesAction: 'warn'` for security without modification.

## Non-Destructiveness Guarantees

Default options guarantee that:

- ✅ NFC normalization does not modify meaning (only representation)
- ✅ Cleaning is disabled by default
- ✅ Transliteration is disabled by default
- ✅ Warnings are used rather than automatic modifications
- ✅ Validation rejects only invalid sequences (security)

**Important**: Enabling cleaning or transliteration may alter meaning. Always verify with `checkOptionsSafety()` before enabling these options.

## Security Notes

- Zero-width characters can be used for injection attacks. Cleaning is recommended if processing untrusted content.
- Confusable characters (homoglyphs) can be used for phishing attacks. Detection with warnings is recommended.
- Invalid Unicode sequences can corrupt display or be interpreted as commands. Validation is essential.

## Integration with conversion-options.js

These options can be integrated into the `normalization` section of `conversion-options.js`:

```javascript
const { getAdvancedNormalizationPreset } = require('./normalization-advanced-options');

const ConversionOptions = {
  normalization: {
    encoding: 'utf-8',
    lineBreaks: { /* ... */ },
    // Additional options
    advanced: getAdvancedNormalizationPreset('default'),
  },
  // ...
};
```
