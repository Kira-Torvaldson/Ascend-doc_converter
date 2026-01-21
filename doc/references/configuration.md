# Configuration Reference

## Purpose

This document defines the canonical configuration references for Ascend, including execution profiles, resource limits, logging policies, paths and storage, environment variables, and conversion options. It serves as the authoritative reference for all configuration decisions.

---

## Execution Profiles

### Purpose

Execution profiles control how conversions are executed. They determine resource limits, timeout values, and concurrency controls.

### Profile Types

#### Default Profile

**Identifier:** `default`  
**Use Case:** Standard document conversions  
**Resource Limits:**
- **Timeout:** 30 seconds
- **Max Memory:** 512 MB
- **Max CPU:** 100% (single core)
- **Max File Size:** 10 MB
- **Concurrent Conversions:** 5

#### Strict Profile

**Identifier:** `strict`  
**Use Case:** High-security environments, untrusted inputs  
**Resource Limits:**
- **Timeout:** 15 seconds
- **Max Memory:** 256 MB
- **Max CPU:** 50% (single core)
- **Max File Size:** 5 MB
- **Concurrent Conversions:** 2

#### Performance Profile

**Identifier:** `performance`  
**Use Case:** Large files, batch processing  
**Resource Limits:**
- **Timeout:** 120 seconds
- **Max Memory:** 2 GB
- **Max CPU:** 100% (single core)
- **Max File Size:** 50 MB
- **Concurrent Conversions:** 3

### Profile Selection

Profiles are selected based on:
1. Explicit user configuration (if provided)
2. Conversion type (simple vs. complex)
3. System load conditions
4. Security requirements

### Resource Limit Enforcement

All resource limits are enforced at the pipeline level:
- **Timeout:** Applied via process monitoring and SIGTERM/SIGKILL
- **Memory:** Monitored via process RSS tracking
- **CPU:** Limited via process priority and scheduling
- **File Size:** Validated before conversion starts
- **Concurrency:** Enforced via semaphore/queue mechanism

---

## Resource Limits

### Purpose

This section defines the canonical resource limits enforced by the Ascend pipeline. These limits protect the system from resource exhaustion and ensure fair resource allocation.

### Limit Categories

#### Time Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Conversion Timeout | 30 seconds | 300 seconds | Process termination (SIGTERM → SIGKILL) |
| Token Expiration | 60 seconds | 300 seconds | Token validation |
| Request Timeout | 30 seconds | 60 seconds | HTTP timeout |

#### Memory Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Per-Conversion Memory | 512 MB | 2 GB | Process monitoring + termination |
| Total System Memory | 2 GB | 4 GB | Graceful degradation |
| Input File Size | 10 MB | 50 MB | Pre-validation |

#### CPU Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Per-Process CPU | 100% (1 core) | 100% (1 core) | Process priority |
| Total System CPU | 80% | 95% | Graceful degradation |

#### Concurrency Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Concurrent Conversions | 5 | 10 | Semaphore/queue |
| Pending Requests | 20 | 50 | Request queue |

### Limit Enforcement Rules

#### 1. Hard Limits

Hard limits cannot be exceeded under any circumstances:
- File size limits (validated before processing)
- Maximum timeout values
- Maximum concurrent conversions

#### 2. Soft Limits

Soft limits trigger warnings or degradation:
- Memory usage approaching limit → log warning
- CPU usage high → reduce priority of new conversions
- System load high → refuse new conversions

#### 3. Graceful Degradation

When limits are approached:
- New conversions are refused with clear error messages
- Existing conversions continue to completion
- System state is monitored and logged
- Recovery is automatic when load decreases

### Limit Configuration

Limits can be configured via:
- Environment variables (for deployment)
- Configuration files (for per-instance tuning)
- API parameters (for per-request overrides, within bounds)

All configuration must respect maximum values defined in this document.

---

## Logging Policy

### Purpose

This section defines the canonical logging policy for Ascend. It specifies what is logged, how logs are structured, retention policies, and security requirements.

### Log Categories

#### 1. Conversion Logs

**Purpose:** Track individual conversion operations  
**Format:** JSON  
**Location:** `api/logs/<conversion-id>.log`  
**Retention:** 30 days (configurable)

**Content:**
- Conversion ID (UUID)
- Timestamp (ISO 8601)
- Source and target formats
- Modules executed
- Duration
- Final status (SUCCESS, FAILED, TIMEOUT, etc.)
- Error messages (sanitized)

**Security:**
- No user content
- No file paths (only relative paths within temp directory)
- No sensitive data

#### 2. Security Logs

**Purpose:** Track security events and violations  
**Format:** JSON  
**Location:** Security event log (separate from conversion logs)  
**Retention:** 90 days (configurable)

**Content:**
- Security event type
- Timestamp
- Conversion ID (if applicable)
- Violation details (sanitized)
- Action taken

**Events Logged:**
- Path traversal attempts
- Network access attempts
- Resource limit violations
- Unauthorized format attempts
- Token validation failures

#### 3. System Logs

**Purpose:** Track system health and errors  
**Format:** Structured text or JSON  
**Location:** System log (stdout/stderr or file)  
**Retention:** 7 days (configurable)

**Content:**
- System events (startup, shutdown)
- Error conditions
- Resource usage warnings
- Degradation events

### Log Structure

#### Conversion Log Format

```json
{
  "conversionId": "uuid",
  "timestamp": "ISO-8601",
  "sourceFormat": "asciidoc",
  "targetFormat": "markdown",
  "modules": [
    {
      "name": "downdoc",
      "duration": 1.23,
      "status": "SUCCESS"
    }
  ],
  "totalDuration": 1.23,
  "status": "SUCCESS",
  "error": null
}
```

### Logging Rules

#### 1. No User Content

Logs must never contain:
- File content
- User-provided text
- Personal information
- Sensitive data

#### 2. Sanitization

All logged data must be sanitized:
- File paths → relative paths only
- Error messages → generic messages (no system details)
- User input → removed or hashed

#### 3. Structured Format

All logs must be structured (JSON preferred) for:
- Machine parsing
- Automated analysis
- Integration with log aggregation systems

#### 4. Minimal Logging

Only essential information is logged:
- Conversion metadata
- Security events
- System errors
- Performance metrics

### Log Access

#### API Access

Logs are accessible via:
- `GET /api/logs/<conversion-id>` - Single conversion log
- `GET /api/logs` - List all conversion logs

#### File System Access

Logs are stored in:
- `api/logs/` directory
- One file per conversion
- JSON format for parsing

### Retention Policy

- **Conversion Logs:** 30 days (default, configurable)
- **Security Logs:** 90 days (default, configurable)
- **System Logs:** 7 days (default, configurable)

Automatic cleanup removes logs older than retention period.

---

## Paths and Storage

### Purpose

This section defines the canonical paths and storage locations used by Ascend. It serves as the reference for file system organization and path validation.

### Directory Structure

#### Root Directories

```
Ascend/
├── api/
│   ├── backend/          # Backend application
│   ├── frontend/         # Frontend application
│   └── logs/            # Conversion logs (writable)
├── doc/                  # Documentation
├── lib/                  # Core libraries
└── test/                 # Tests
```

#### Temporary Directories

**Base Path:** System temp directory (OS-specific)  
**Pattern:** `<temp-dir>/ascend-<conversion-id>/`  
**Permissions:** 0o700 (owner read/write/execute only)  
**Lifetime:** Created per conversion, deleted after completion

**Example:**
- Linux/macOS: `/tmp/ascend-<uuid>/`
- Windows: `C:\Users\<user>\AppData\Local\Temp\ascend-<uuid>\`

#### Log Directory

**Path:** `api/logs/`  
**Permissions:** Writable by application  
**Content:** JSON log files, one per conversion  
**Naming:** `<conversion-id>.log`

#### Static Assets

**Backend Public:** `api/backend/public/`  
**Backend Static:** `api/backend/static/`  
**Frontend Dist:** `api/frontend/dist/` (production build)

### Path Validation Rules

#### 1. Absolute Paths Required

All file operations must use absolute paths:
- Input files: Resolved to absolute path before use
- Output files: Generated as absolute paths
- Temporary files: Created with absolute paths

#### 2. Path Traversal Protection

All paths must be validated to prevent:
- `../` sequences
- Symlink following (in secure mode)
- Access outside authorized directories

#### 3. Temporary Directory Isolation

All conversion files must be within:
- The conversion's unique temporary directory
- No access to files outside this directory
- No creation of files in system directories

#### 4. Whitelist Validation

Only paths matching whitelisted patterns are allowed:
- Temporary directory pattern
- Log directory pattern
- Static asset directories (read-only)

### Storage Requirements

#### Writable Directories

The following directories must be writable:
- `api/logs/` - For conversion logs
- System temp directory - For temporary conversion files
- `api/backend/public/` - For user-uploaded assets (if enabled)

#### Read-Only Directories

The following directories are read-only:
- `doc/` - Documentation
- `lib/` - Core libraries
- `api/backend/static/` - Static HTML files

### Path Resolution

#### Input File Resolution

1. User provides relative or absolute path
2. System resolves to absolute path
3. Validates path is within authorized scope
4. Checks file exists and is readable
5. Validates file size within limits

#### Output File Resolution

1. System generates absolute path in temp directory
2. Validates path is within temp directory
3. Creates parent directories if needed
4. Writes output file
5. Returns relative path or content to user

---

## Environment Variables (EnvMap)

### Purpose

This section defines the canonical environment variable management system for Ascend. EnvMap provides a centralized, secure, and validated interface for all runtime configuration values.

### Philosophy

#### Single Source of Truth

EnvMap serves as the **single source of truth** for all environment-based configuration. All modules should access environment variables through EnvMap rather than directly from `process.env`.

#### Security by Design

- **Whitelist-based**: Only explicitly defined keys are accessible
- **Type-safe**: All values are validated against expected types
- **Path-safe**: Paths are normalized and validated for traversal attacks
- **Secret-safe**: Sensitive values are never exposed in logs or dumps

#### Future-Proof Architecture

The module is designed with future compliance in mind:
- Schema versioning for evolution
- Environment-specific configurations (dev/staging/prod)
- Prepared for ISO 27001, SOC 2 compliance (not yet implemented)

### Module Interface

#### `get(key)`

Returns the validated value for an environment variable.

**Parameters:**
- `key` (string): Environment variable key

**Returns:**
- Validated value or default value

**Throws:**
- Error if key is not in schema

**Example:**
```javascript
const port = envMap.get('PORT') // Returns 3003 (default) or configured value
```

#### `has(key)`

Checks if an environment variable is defined in the schema.

**Parameters:**
- `key` (string): Environment variable key

**Returns:**
- `boolean`: True if key exists in schema

#### `assert(key)`

Asserts that an environment variable exists and is valid.

**Parameters:**
- `key` (string): Environment variable key

**Throws:**
- Error if key is missing or invalid

#### `dumpSafe()`

Returns all non-sensitive environment variables as an object.

**Returns:**
- Object with all non-sensitive key-value pairs
- Sensitive keys are replaced with `[REDACTED]`

### Schema Definition

#### Supported Types

- **`string`**: Text values
- **`number`**: Numeric values (with optional min/max bounds)
- **`boolean`**: Boolean values (true/false, 1/0, yes/no)
- **`path`**: File system paths (normalized and validated)

#### Schema Properties

Each environment variable in the schema defines:

- **`type`**: Expected type (required)
- **`default`**: Default value if not set (optional)
- **`min`**: Minimum value for numbers (optional)
- **`max`**: Maximum value for numbers (optional)
- **`sensitive`**: Whether the value contains secrets (default: false)
- **`validator`**: Custom validation function (optional)

### Currently Supported Keys

#### Server Configuration

- **`PORT`**: Server port (number, default: 3003, range: 1-65535)
- **`NODE_ENV`**: Node environment (string, default: 'development', values: development/staging/production/test)

#### Pandoc Configuration

- **`PANDOC_PATH`**: Path to Pandoc binary (path, default: '/usr/bin/pandoc')

#### Logging Configuration

- **`LOGS_DIR`**: Directory for log files (path, default: 'api/logs')
- **`MAX_LOG_SIZE`**: Maximum log file size in bytes (number, default: 10485760, range: 1024-104857600)
- **`LOG_RETENTION_DAYS`**: Log retention period in days (number, default: 30, range: 1-365)

#### Security and Resource Limits

- **`MAX_CONCURRENT_CONVERSIONS`**: Maximum concurrent conversions (number, default: 5, range: 1-50)
- **`MAX_CPU_TIME_MS`**: Maximum CPU time per conversion in milliseconds (number, default: 30000, range: 1000-300000)
- **`MAX_MEMORY_MB`**: Maximum memory per conversion in MB (number, default: 512, range: 64-4096)
- **`MAX_WALL_TIME_MS`**: Maximum wall-clock time per conversion in milliseconds (number, default: 60000, range: 1000-600000)

#### Overload Detection

- **`OVERLOAD_CPU_PERCENT`**: CPU usage threshold for overload detection (number, default: 80.0, range: 0-100)
- **`OVERLOAD_MEMORY_PERCENT`**: Memory usage threshold for overload detection (number, default: 80.0, range: 0-100)
- **`OVERLOAD_FAILURE_RATE`**: Failure rate threshold for overload detection (number, default: 0.2, range: 0-1)

#### Anomaly Detection

- **`ABNORMAL_DURATION_MULT`**: Multiplier for abnormal duration detection (number, default: 3.0, range: 1.0-10.0)
- **`ABNORMAL_MEMORY_MULT`**: Multiplier for abnormal memory detection (number, default: 2.0, range: 1.0-10.0)

#### Security Logging

- **`SECURITY_LOG_PATH`**: Path for security logs (path, default: system temp directory)

### Validation Rules

#### Type Validation

- **String**: Converted to string, no additional validation
- **Number**: Must be a valid number, checked against min/max bounds
- **Boolean**: Accepts true/false, 1/0, yes/no (case-insensitive)
- **Path**: Resolved to absolute path, checked for traversal attacks (`..`)

#### Path Validation

All paths are:
- Resolved to absolute paths
- Checked for path traversal sequences (`..`)
- Validated against allowed directories (project root or system temp)
- Verified to exist (for binary paths)

### Security Features

#### Whitelist Enforcement

Only keys explicitly defined in the schema are accessible. Any attempt to access an undefined key throws an error.

#### Path Traversal Protection

All path values are checked for traversal sequences and normalized to prevent directory escape attacks.

#### Secret Protection

Values marked as `sensitive: true` are:
- Never included in `dumpSafe()` output
- Replaced with `[REDACTED]` in any public dumps
- Not logged or exposed in error messages

---

## Conversion Options

### Purpose

This section defines the conversion options system that allows fine-grained configuration of document conversion behavior. It is designed to be modular, extensible, and API-oriented.

### Option Structure

Options are organized into 7 main categories:

1. **Content Analysis** - Content analysis
2. **Normalization** - Content normalization
3. **Rendering** - Document rendering options
4. **Format Specific** - Format-specific options
5. **Security** - Security and robustness
6. **Metadata** - Document metadata
7. **Developer** - Developer options

### Content Analysis

#### `analysisMode`

- **Type**: `string`
- **Values**: `'basic'` | `'heuristic'` | `'strict'`
- **Default**: `'heuristic'`
- **Description**: Determines the analysis mode for raw text content
  - `basic`: Minimal analysis, fast processing
  - `heuristic`: Intelligent analysis with automatic detection (recommended)
  - `strict`: Strict analysis with precise rules

#### `headingDetection`

- **Type**: `Object`
- **Default**: 
  ```json
  {
    "enabled": true,
    "detectAllCaps": true,
    "detectSeparators": true,
    "detectNumbering": true,
    "minLength": 3,
    "maxLength": 100
  }
  ```
- **Description**: Automatic heading detection rules

#### `listDetection`

- **Type**: `Object`
- **Default**:
  ```json
  {
    "enabled": true,
    "detectBullets": true,
    "detectNumbered": true,
    "preserveIndentation": true,
    "normalizeIndentation": true,
    "indentSize": 2
  }
  ```
- **Description**: List and indentation management

### Normalization

#### `encoding`

- **Type**: `string`
- **Values**: `'utf-8'` | `'latin1'` | `'ascii'`
- **Default**: `'utf-8'`
- **Description**: Source text encoding

#### `lineBreaks`

- **Type**: `Object`
- **Default**:
  ```json
  {
    "normalize": true,
    "target": "unix",
    "removeTrailing": true,
    "maxConsecutive": 2
  }
  ```
- **Description**: Line break normalization

#### `removeNonAscii`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Remove non-ASCII characters (optional, disabled by default)

#### `tabs`

- **Type**: `Object`
- **Default**:
  ```json
  {
    "convertToSpaces": true,
    "tabSize": 2
  }
  ```
- **Description**: Tab conversion

### Rendering

#### `tableOfContents`

- **Type**: `Object`
- **Default**:
  ```json
  {
    "enabled": false,
    "depth": 3,
    "position": "top"
  }
  ```
- **Description**: Table of contents generation

#### `sectionNumbering`

- **Type**: `Object`
- **Default**:
  ```json
  {
    "enabled": false,
    "depth": 3,
    "style": "numeric"
  }
  ```
- **Description**: Section numbering

#### `lineWrap`

- **Type**: `Object`
- **Default**:
  ```json
  {
    "enabled": false,
    "maxWidth": 80,
    "hardWrap": false
  }
  ```
- **Description**: Maximum line width

### Format Specific

#### `markdown`

- **Type**: `Object`
- **Default**:
  ```json
  {
    "flavor": "commonmark",
    "gfmExtensions": {
      "tables": true,
      "strikethrough": true,
      "taskLists": true,
      "autolinks": true
    },
    "preserveHtml": false,
    "codeFenceStyle": "backtick"
  }
  ```
- **Description**: Markdown options

#### `asciidoc`

- **Type**: `Object`
- **Default**:
  ```json
  {
    "compatMode": "asciidoctor",
    "attributes": {
      "doctype": "article",
      "toc": "left",
      "numbered": false,
      "sectanchors": true,
      "sectlinks": true
    },
    "safeMode": "safe"
  }
  ```
- **Description**: AsciiDoc options

### Security

#### `maxFileSize`

- **Type**: `number`
- **Default**: `10485760` (10 MB)
- **Description**: Maximum file size in bytes

#### `conversionTimeout`

- **Type**: `number`
- **Default**: `30000` (30 seconds)
- **Description**: Conversion timeout in milliseconds

#### `externalResources`

- **Type**: `Object`
- **Default**:
  ```json
  {
    "allowExternalLinks": true,
    "allowImages": true,
    "allowScripts": false,
    "allowStyles": true,
    "sandboxMode": false
  }
  ```
- **Description**: External resource management

### Metadata

#### `title`

- **Type**: `string | null`
- **Default**: `null`
- **Description**: Document title

#### `author`

- **Type**: `string | null`
- **Default**: `null`
- **Description**: Document author

#### `date`

- **Type**: `string | null`
- **Default**: `null`
- **Description**: Document date (ISO 8601 or custom format). If `null`, uses current date

#### `language`

- **Type**: `string`
- **Default**: `'fr'`
- **Description**: Document language (ISO 639-1 code: fr, en, es, etc.)

---

## Encoding Options

### Purpose

This section defines the configuration structure for character encoding management during document conversion. It follows an API-first approach with safe default values and clear separation between input encoding, internal processing, and output encoding.

### Input Encoding Options

#### `encoding`

- **Type**: `'auto'|'utf-8'|'ascii'|'latin-1'`
- **Default**: `'auto'`
- **Description**: Encoding to use for reading input file
  - `'auto'`: Automatic detection with UTF-8 priority

#### `autoDetect`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable automatic encoding detection

#### `fallbackToLatin1`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Use Latin-1 as fallback if UTF-8 fails (only if `autoDetect=true`)
- **Warning**: May mask encoding errors

### Output Encoding Options

#### `encoding`

- **Type**: `'utf-8'|'ascii'|'latin-1'`
- **Default**: `'utf-8'`
- **Description**: Encoding to use for writing output file

#### `addBOM`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Add BOM (Byte Order Mark) at the beginning of UTF-8 file

### Invalid Character Handling

#### `strategy`

- **Type**: `'fail'|'replace'|'remove'|'transliterate'`
- **Default**: `'replace'`
- **Description**: Strategy for handling characters that cannot be represented in the target encoding
  - **`'fail'`**: Fail immediately with explicit error (strict mode)
  - **`'replace'`**: Replace with substitution character (recommended)
  - **`'remove'`**: Silently remove (may alter meaning)
  - **`'transliterate'`**: Simple transliteration (é → e, etc.)

#### `replacementChar`

- **Type**: `string`
- **Default**: `'\uFFFD'` (standard Unicode substitution character)
- **Description**: Character used to replace invalid characters (if `strategy='replace'`)

#### `logInvalidChars`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Log detected invalid characters for analysis

### Unicode Normalization

#### `form`

- **Type**: `'none'|'NFC'|'NFKC'`
- **Default**: `'NFC'`
- **Description**: Unicode normalization form
  - **`'none'`**: No normalization
  - **`'NFC'`**: Canonical Composed Form (recommended)
  - **`'NFKC'`**: Compatibility Composed Form (more aggressive)

#### `preserveMeaning`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Ensures normalization does not alter content meaning

### Character Cleaning

#### `removeControlChars`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Remove control characters (0x00-0x1F, except \t, \n, \r)

#### `removeDirectionalChars`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Remove directional characters (RTL/LTR)

#### `removeZeroWidthChars`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Remove zero-width characters (invisible)

#### `normalizeWhitespace`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Normalize multiple spaces to single space

### Processing Mode

#### `mode`

- **Type**: `'strict'|'tolerant'`
- **Default**: `'tolerant'`
- **Description**: Global behavior in case of error or anomaly
  - **`'strict'`**: Immediate error on any problem
  - **`'tolerant'`**: Automatic cleanup + warnings

#### `throwOnError`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Throw immediate error instead of continuing

#### `logWarnings`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Log warnings for later analysis

---

## Advanced Normalization Options

### Purpose

This section defines advanced normalization options that improve consistency, stability, cross-format compatibility, and security related to characters and encoding.

**Fundamental Principle**: No option enabled by default should alter the meaning of the text.

### Unicode Management

#### `mode`

- **Type**: `'full'|'restricted'|'disabled'`
- **Default**: `'full'`
- **Description**: Unicode support mode
  - **`'full'`**: Full support for all valid Unicode characters (recommended)
  - **`'restricted'`**: Limited to specified Unicode ranges
  - **`'disabled'`**: Disables advanced Unicode support

#### `normalization`

- **Type**: `'none'|'NFC'|'NFKC'`
- **Default**: `'NFC'`
- **Description**: Unicode normalization form
  - **`'none'`**: No normalization
  - **`'NFC'`**: Canonical Composed Form (recommended, does not modify meaning)
  - **`'NFKC'`**: Compatibility Composed Form (more aggressive, may modify some characters)

#### `detectConfusables`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Detects visually confusable characters (e.g., Cyrillic vs Latin)

#### `confusablesAction`

- **Type**: `'none'|'warn'|'replace'`
- **Default**: `'warn'`
- **Description**: Action on detected confusable characters
  - **`'none'`**: Do nothing
  - **`'warn'`**: Warn only (non-destructive, recommended)
  - **`'replace'`**: Replace with equivalent character

### Character Cleaning

#### `removeControlChars`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Removes invisible control characters (0x00-0x1F, except \t, \n, \r)
- **Note**: Disabled by default to avoid being destructive

#### `removeDirectionalChars`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Removes directional characters (RTL/LTR marks)
- **Note**: Disabled by default to preserve display

#### `removeNonPrintableChars`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Removes non-printable characters
- **Note**: Disabled by default to avoid being destructive

#### `preserveWhitespace`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Preserves essential whitespace (tabs, newlines)

### Transliteration and Fallback

#### `strategy`

- **Type**: `'none'|'simple'|'configurable'`
- **Default**: `'none'`
- **Description**: Transliteration strategy
  - **`'none'`**: No transliteration (recommended by default)
  - **`'simple'`**: Simple transliteration (é → e)
  - **`'configurable'`**: Advanced configurable strategy

#### `enableTransliteration`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enables simple transliteration (é → e, ñ → n, etc.)
- **Note**: Disabled by default to preserve meaning

### Content Validation

#### `rejectInvalidSequences`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Rejects invalid Unicode sequences
- **Note**: Important for security and stability. Enabled by default.

#### `rejectPrivateChars`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Rejects private characters (Private Use Area, 0xE000-0xF8FF)
- **Note**: May be legitimate in some contexts. Disabled by default.

#### `warnOutOfRange`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Reports characters outside allowed range

#### `allowedRanges`

- **Type**: `Array<{start: number, end: number}>`
- **Default**: `[]`
- **Description**: Allowed Unicode ranges (empty = all except Private Use Area)

### Processing Mode

#### `mode`

- **Type**: `'strict'|'tolerant'`
- **Default**: `'tolerant'`
- **Description**: Global behavior in case of error or anomaly
  - **`'strict'`**: Immediate error on any problem
  - **`'tolerant'`**: Automatic cleanup + warnings

#### `throwOnError`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Throws immediate error instead of continuing

#### `logWarnings`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Logs warnings for later analysis

#### `continueOnWarning`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Continues processing despite warnings

### Non-Destructiveness Guarantees

Default options guarantee that:

- ✅ NFC normalization does not modify meaning (only representation)
- ✅ Cleaning is disabled by default
- ✅ Transliteration is disabled by default
- ✅ Warnings are used rather than automatic modifications
- ✅ Validation rejects only invalid sequences (security)

**Important**: Enabling cleaning or transliteration may alter meaning. Always verify with `checkOptionsSafety()` before enabling these options.

---

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Default resource limits
- Maximum allowed values
- Enforcement mechanisms
- Degradation policies
- Log content requirements
- Log format specifications
- Retention policies
- Security requirements
- Directory structure
- Path validation rules
- Storage requirements
- Environment variable schema
- Validation rules
- Security features
- Conversion option structures
- Encoding configuration
- Advanced normalization options

Any changes to configuration must be reflected here first, then propagated to implementation code.
