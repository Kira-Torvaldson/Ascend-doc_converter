> ⚠️ **Deprecated:** Content migrated into canonical reference files (`references/conversion.md`).

# Conversion Pipeline Specification

## Overview

This document defines the rules and principles that the conversion pipeline must follow. It is an internal normative specification that describes the expected behavior of the system without imposing a particular implementation.

## Fundamental Principle: Strict Isolation

### Rule 1: One conversion = one completely isolated execution

Each conversion must be treated as an atomic and independent operation. No conversion must be able to interfere with another, whether through:
- Sharing temporary files
- Sharing memory state
- Sharing system resources
- Modifying global variables

### Rule 2: Unique temporary directory per conversion

The pipeline must create a unique temporary directory for each conversion. This directory:
- Must be identified by a unique UUID generated in a cryptographically secure manner
- Must be created in a dedicated root directory (e.g., `/tmp/ascend-conversions/`)
- Must have restrictive permissions (mode 0o700)
- Must never be shared between two simultaneous or successive conversions

### Rule 3: No shared state between two conversions

The pipeline must not maintain any persistent state between two conversions. Each conversion must:
- Create its own temporary resources
- Not depend on resources created by a previous conversion
- Not modify resources used by other conversions

## Module Chaining

### Rule 4: Modules communicate only through files

Modules must not communicate directly with each other. Communication must be:
- File-based: output file of module N becomes input file of module N+1
- Explicit: file paths are passed explicitly between modules
- No shared memory or variables

### Rule 5: Modules are independent

Each module must:
- Not know about the existence of other modules
- Not depend on the execution order of other modules
- Be executable in isolation (for testing)

## Pipeline Responsibilities

### Rule 6: Temporary directory management

The pipeline is responsible for:
- Creating the temporary directory before conversion starts
- Providing absolute paths to modules
- Cleaning up the temporary directory after conversion (success or failure)

### Rule 7: Log and error capture

The pipeline must:
- Capture stdout/stderr from each module
- Aggregate logs from all modules
- Return a standardized result object

## Module Contract

### Required Interface

Each module must expose:

#### `name` (string)
Unique identifier for the module (e.g., `"downdoc"`, `"pandoc"`).

#### `supportedFormats` (object)
```javascript
{
  from: ["asciidoc"],
  to: ["markdown"]
}
```

#### `run(inputPath, outputPath, options)` (function)
- **inputPath**: Absolute path to input file
- **outputPath**: Absolute path to output file
- **options**: Optional conversion options object
- **Returns**: Promise or object with `{ success, logs, error, duration }`

### Return Format

```javascript
{
  success: true|false,
  logs: string|array,
  error: string|null,
  duration: number  // in seconds
}
```

## Security Rules (V1 - Minimal)

### Rule 8: Basic input validation

Modules must:
- Validate that input file exists and is readable
- Validate file size is within limits
- Reject invalid formats

### Rule 9: Light isolation

Modules must:
- Execute within the provided temporary directory
- Not access files outside the temporary directory
- Not make network requests

### Rule 10: Secure error handling

Modules must:
- Never throw unhandled exceptions
- Return error information in the result object
- Not expose system details in error messages

### Rule 11: Minimal logging

Modules must:
- Log only essential information (module name, duration, status)
- Not log file content or sensitive data
- Use structured logging format

### Rule 12: Light integrity verification

Modules must:
- Verify output file was created
- Verify output file is readable
- Return error if output is invalid

## Future Security Enhancements (V2+)

These measures are mentioned for future implementation, not currently enforced:

- **ISO 27001**: Information security management system
- **ISO 27002**: Security controls
- **NIST SP 800-53**: Security and privacy controls
- **OWASP Top 10**: Web application security risks
- **GDPR/RGPD**: Data protection compliance

## Notes

- This specification is V1 and establishes minimal security obligations compatible with ongoing development.
- Future versions will enhance security measures to align with international standards.
- All modules must respect this contract to be integrated into the pipeline.
