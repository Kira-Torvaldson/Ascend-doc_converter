# Secure Conversion Engine

## Overview

The `secure-converter.js` module implements a complete security layer for file conversions using external tools like Pandoc. It ensures isolation, validation, and secure execution of conversions.

## Security Features

### 1. Strict Isolation Per Conversion

- Each conversion creates a unique temporary directory (UUID)
- No files are shared between two conversions
- Guaranteed cleanup even in case of error (try/finally)
- Configurable root directory: `/tmp/ascend-conversions/`

### 2. Secure Command Execution

- Uses only `child_process.spawn` (never `exec` or `execSync`)
- Absolute path to Pandoc binary
- Arguments constructed from strict whitelist
- No user arguments used directly
- Any conversion not listed in the whitelist is refused

### 3. Timeout and Forced Termination

- Configurable timeout (default: 30 seconds)
- Automatic termination if timeout exceeded
- SIGTERM then SIGKILL if necessary
- Ensures no process remains active

### 4. File Validation

- Maximum size check (50 MB by default)
- Detection of disguised binary files
- Source and destination format validation
- Rejection of empty or invalid files

### 5. Normalized Error Handling

- Typed errors with standardized codes
- No system details exposed to user
- Secure logging (without user data)
- Unique ID per conversion for tracking

## Usage

### Basic Example

**IMPORTANT**: The `confirmed: true` parameter is **MANDATORY** for all conversions. This ensures that a confirmation window has been validated on the frontend before execution.

```javascript
const { secureConvert } = require('./secure-converter.js')

try {
  const result = await secureConvert(
    '# Markdown content',
    'markdown',
    'asciidoc',
    { 
      timeout: 30000,
      confirmed: true // ✅ MANDATORY - must be true
    }
  )
  console.log(result)
} catch (error) {
  if (error instanceof ConversionError) {
    console.error('Error:', error.toSafeResponse())
  }
}
```

### Confirmation Validation

The secure-converter checks that `options.confirmed === true` before executing any conversion. If confirmation is not present or is `false`, a `CONFIRMATION_REQUIRED` error is thrown.

```javascript
// ❌ WITHOUT confirmation - will be rejected
await secureConvert(content, 'markdown', 'asciidoc', {})
// Error: CONFIRMATION_REQUIRED

// ✅ WITH confirmation - will be accepted
await secureConvert(content, 'markdown', 'asciidoc', { confirmed: true })
```

### Express Integration

See `secure-converter-integration-example.js` for a complete integration example in an Express API.

## Configuration

### Environment Variables

- `PANDOC_PATH`: Absolute path to Pandoc binary (default: `/usr/bin/pandoc`)

### Code Configuration

Modify `SECURITY_CONFIG` in `secure-converter.js`:

```javascript
const SECURITY_CONFIG = {
  CONVERSIONS_ROOT: '/custom/path/conversions',
  DEFAULT_TIMEOUT: 60000, // 60 seconds
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100 MB
  BINARY_PATHS: {
    pandoc: '/usr/local/bin/pandoc'
  }
}
```

## Supported Formats

Authorized conversions are defined in `CONVERSION_WHITELIST`. Currently supported formats:

- **Source**: markdown, asciidoc, html, txt, yaml, json
- **Destination**: markdown, asciidoc, html, pdf, txt, yaml, json

To add a new conversion, add an entry in `CONVERSION_WHITELIST`:

```javascript
'new_format_other_format': ['-f', 'new_format', '-t', 'other_format']
```

## Architecture

The module is structured in separate classes:

- **IsolationManager**: Isolation management (temporary directories)
- **FileValidator**: File and conversion validation
- **SecureCommandExecutor**: Secure command execution
- **ConversionError**: Normalized error handling

This architecture allows:
- Easy addition of resource limits
- Integration of a sandbox (e.g., Docker, chroot)
- Conversion monitoring
- Without major refactoring

## Logging

Events are logged with:
- ISO timestamp
- Unique conversion ID
- Event type (STARTED, SUCCESS, TIMEOUT, etc.)
- Details (without user data)

Example log:
```
[CONVERSION] {"timestamp":"2024-01-15T10:30:00.000Z","conversionId":"abc-123","event":"SUCCESS","details":"Conversion completed successfully"}
```

## Security

### Implemented Measures

✅ Complete isolation per conversion  
✅ Strict conversion whitelist  
✅ Input file validation  
✅ **User confirmation validation (MANDATORY)**  
✅ Timeout and forced process termination  
✅ No user arguments in commands  
✅ Absolute paths only  
✅ Guaranteed temporary file cleanup  
✅ Logging without user data  
✅ Normalized errors without system details

### Confirmation Validation

The secure-converter requires that user confirmation be validated before any conversion. This ensures that:
- The user has clicked "Yes" in a confirmation window
- No conversion can be executed automatically or by error
- Confirmation is verified both on frontend and backend

See `secure-converter-frontend-integration.md` for complete frontend integration.

### Production Recommendations

1. **Resource Limits**: Add CPU/RAM limits via cgroups or containers
2. **Sandboxing**: Run Pandoc in a Docker container or chroot
3. **Monitoring**: Monitor conversions (duration, failures, timeouts)
4. **Rate Limiting**: Limit number of conversions per user/IP
5. **Audit**: Log all conversion attempts (even failed)

## Migration from convert.js

To migrate progressively:

1. Import the new module:
```javascript
const { secureConvert } = require('./secure-converter.js')
```

2. Replace existing calls:
```javascript
// Before
const result = await convertWithPandoc(content, 'markdown', 'asciidoc')

// After
const result = await secureConvert(content, 'markdown', 'asciidoc')
```

3. Adapt error handling:
```javascript
try {
  const result = await secureConvert(...)
} catch (error) {
  if (error instanceof ConversionError) {
    // Handle normalized error
    res.status(400).json(error.toSafeResponse())
  }
}
```

## Tests

To test the module:

```javascript
const { secureConvert } = require('./secure-converter.js')

// Valid conversion test
const result = await secureConvert('# Test', 'markdown', 'asciidoc')
console.log('Result:', result)

// Validation test (should fail)
try {
  await secureConvert('', 'markdown', 'asciidoc')
} catch (error) {
  console.log('Expected error:', error.message)
}

// Timeout test (should fail after 1 second)
try {
  await secureConvert('# Very long test...', 'markdown', 'asciidoc', { timeout: 1000 })
} catch (error) {
  console.log('Expected timeout:', error.message)
}
```

## Support

For any questions or security issues, consult the documentation or open an issue.
