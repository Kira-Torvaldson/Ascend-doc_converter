> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Environment Map (EnvMap)

## Purpose

This document defines the canonical environment variable management system for Ascend. EnvMap provides a centralized, secure, and validated interface for all runtime configuration values.

## Philosophy

### Single Source of Truth

EnvMap serves as the **single source of truth** for all environment-based configuration. All modules should access environment variables through EnvMap rather than directly from `process.env`.

### Security by Design

- **Whitelist-based**: Only explicitly defined keys are accessible
- **Type-safe**: All values are validated against expected types
- **Path-safe**: Paths are normalized and validated for traversal attacks
- **Secret-safe**: Sensitive values are never exposed in logs or dumps

### Future-Proof Architecture

The module is designed with future compliance in mind:
- Schema versioning for evolution
- Environment-specific configurations (dev/staging/prod)
- Prepared for ISO 27001, SOC 2 compliance (not yet implemented)

## Module Interface

### `get(key)`

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

### `has(key)`

Checks if an environment variable is defined in the schema.

**Parameters:**
- `key` (string): Environment variable key

**Returns:**
- `boolean`: True if key exists in schema

**Example:**
```javascript
if (envMap.has('PANDOC_PATH')) {
  // Use Pandoc path
}
```

### `assert(key)`

Asserts that an environment variable exists and is valid.

**Parameters:**
- `key` (string): Environment variable key

**Throws:**
- Error if key is missing or invalid

**Example:**
```javascript
envMap.assert('PANDOC_PATH') // Throws if missing or invalid
```

### `dumpSafe()`

Returns all non-sensitive environment variables as an object.

**Returns:**
- Object with all non-sensitive key-value pairs
- Sensitive keys are replaced with `[REDACTED]`

**Example:**
```javascript
const config = envMap.dumpSafe()
// { PORT: 3003, NODE_ENV: 'development', ... }
```

## Schema Definition

### Supported Types

- **`string`**: Text values
- **`number`**: Numeric values (with optional min/max bounds)
- **`boolean`**: Boolean values (true/false, 1/0, yes/no)
- **`path`**: File system paths (normalized and validated)

### Schema Properties

Each environment variable in the schema defines:

- **`type`**: Expected type (required)
- **`default`**: Default value if not set (optional)
- **`min`**: Minimum value for numbers (optional)
- **`max`**: Maximum value for numbers (optional)
- **`sensitive`**: Whether the value contains secrets (default: false)
- **`validator`**: Custom validation function (optional)

## Currently Supported Keys

### Server Configuration

- **`PORT`**: Server port (number, default: 3003, range: 1-65535)
- **`NODE_ENV`**: Node environment (string, default: 'development', values: development/staging/production/test)

### Pandoc Configuration

- **`PANDOC_PATH`**: Path to Pandoc binary (path, default: '/usr/bin/pandoc')

### Logging Configuration

- **`LOGS_DIR`**: Directory for log files (path, default: 'api/logs')
- **`MAX_LOG_SIZE`**: Maximum log file size in bytes (number, default: 10485760, range: 1024-104857600)
- **`LOG_RETENTION_DAYS`**: Log retention period in days (number, default: 30, range: 1-365)

### Security and Resource Limits

- **`MAX_CONCURRENT_CONVERSIONS`**: Maximum concurrent conversions (number, default: 5, range: 1-50)
- **`MAX_CPU_TIME_MS`**: Maximum CPU time per conversion in milliseconds (number, default: 30000, range: 1000-300000)
- **`MAX_MEMORY_MB`**: Maximum memory per conversion in MB (number, default: 512, range: 64-4096)
- **`MAX_WALL_TIME_MS`**: Maximum wall-clock time per conversion in milliseconds (number, default: 60000, range: 1000-600000)

### Overload Detection

- **`OVERLOAD_CPU_PERCENT`**: CPU usage threshold for overload detection (number, default: 80.0, range: 0-100)
- **`OVERLOAD_MEMORY_PERCENT`**: Memory usage threshold for overload detection (number, default: 80.0, range: 0-100)
- **`OVERLOAD_FAILURE_RATE`**: Failure rate threshold for overload detection (number, default: 0.2, range: 0-1)

### Anomaly Detection

- **`ABNORMAL_DURATION_MULT`**: Multiplier for abnormal duration detection (number, default: 3.0, range: 1.0-10.0)
- **`ABNORMAL_MEMORY_MULT`**: Multiplier for abnormal memory detection (number, default: 2.0, range: 1.0-10.0)

### Security Logging

- **`SECURITY_LOG_PATH`**: Path for security logs (path, default: system temp directory)

## Validation Rules

### Type Validation

- **String**: Converted to string, no additional validation
- **Number**: Must be a valid number, checked against min/max bounds
- **Boolean**: Accepts true/false, 1/0, yes/no (case-insensitive)
- **Path**: Resolved to absolute path, checked for traversal attacks (`..`)

### Path Validation

All paths are:
- Resolved to absolute paths
- Checked for path traversal sequences (`..`)
- Validated against allowed directories (project root or system temp)
- Verified to exist (for binary paths)

### Custom Validation

Schema entries can define custom `validator` functions for additional validation logic.

## Security Features

### Whitelist Enforcement

Only keys explicitly defined in the schema are accessible. Any attempt to access an undefined key throws an error.

### Path Traversal Protection

All path values are checked for traversal sequences and normalized to prevent directory escape attacks.

### Secret Protection

Values marked as `sensitive: true` are:
- Never included in `dumpSafe()` output
- Replaced with `[REDACTED]` in any public dumps
- Not logged or exposed in error messages

## Integration Guidelines

### Migration Strategy

1. **Import EnvMap** in modules that use environment variables
2. **Replace direct access** to `process.env.X` with `envMap.get('X')`
3. **Keep backward compatibility** by maintaining existing `process.env` access during transition
4. **Validate** that behavior remains unchanged

### Example Migration

**Before:**
```javascript
const pandocPath = process.env.PANDOC_PATH || '/usr/bin/pandoc'
```

**After:**
```javascript
const { envMap } = require('../config/envmap.module.js')
const pandocPath = envMap.get('PANDOC_PATH')
```

## Future Enhancements

### Schema Versioning

The schema includes a `version` field to support future schema evolution without breaking existing configurations.

### Environment-Specific Configurations

The module is prepared to support environment-specific configurations (dev/staging/prod) through the `env` field in schema metadata.

### Compliance Standards

The architecture is prepared for future compliance with:
- **ISO 27001**: Information security management
- **SOC 2**: Security, availability, processing integrity
- **NIST SP 800-53**: Security and privacy controls

These standards are mentioned for future implementation, not currently enforced.

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Environment variable schema
- Validation rules
- Security features
- Integration guidelines
