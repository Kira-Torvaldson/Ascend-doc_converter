> ⚠️ **Deprecated:** Content migrated into canonical reference files (`specs/modules-interface.md`).

# Conversion Module Interface - Version 1

## Overview

This document defines the strict and normative contract that each conversion module (wrapper) must respect to be integrated into the Ascend pipeline. This V1 specification establishes minimal obligations compatible with ongoing development, while preparing for evolution toward enhanced security measures conforming to international standards.

## Fundamental Principle

Each conversion module is an independent functional unit that transforms a file from a source format to a destination format. The module must not know about the existence of other modules and must strictly respect this interface.

## Interface Contract

### Required Properties

Each module must expose the following properties:

#### 1. Module Name

**Property:** `name`  
**Type:** `string`  
**Description:** Unique identifier for the module  
**Constraints:**
- Lowercase with hyphens as separators
- No spaces or special characters
- Unique across all modules

**Examples:** `"downdoc"`, `"pandoc"`, `"text2markdown"`

#### 2. Supported Formats

**Property:** `supportedFormats`  
**Type:** `object`  
**Description:** Formats supported by the module  
**Structure:**
```javascript
{
  from: ["asciidoc", "markdown"],
  to: ["markdown", "html"]
}
```

**Constraints:**
- `from` and `to` must be arrays of strings
- Format identifiers must be lowercase
- Formats must match the canonical format list

### Required Method

#### `run(inputPath, outputPath, options)`

**Parameters:**
- `inputPath` (string): Absolute path to input file
- `outputPath` (string): Absolute path to output file
- `options` (object, optional): Conversion options

**Returns:** Promise or object with the following structure:
```javascript
{
  success: boolean,    // true if conversion succeeded
  logs: string|array, // execution logs
  error: string|null, // error message if failed
  duration: number    // execution duration in seconds
}
```

**Behavior:**
- Reads input file from `inputPath`
- Performs conversion
- Writes output file to `outputPath`
- Returns standardized result object

## Security Obligations (V1 - Minimal)

### 1. Basic Input Validation

Modules must:
- Validate that input file exists and is readable
- Validate file size is within reasonable limits
- Reject unsupported formats

**Reference Standards (Future):** ISO 27001, NIST SP 800-53

### 2. Light Isolation

Modules must:
- Execute within the provided temporary directory
- Not access files outside the temporary directory
- Not make network requests

**Reference Standards (Future):** ISO 27002, OWASP Top 10

### 3. Secure Error Handling

Modules must:
- Never throw unhandled exceptions
- Return error information in the result object
- Not expose system details in error messages

**Reference Standards (Future):** ISO 27001, GDPR/RGPD

### 4. Minimal Logging

Modules must:
- Log only essential information (module name, duration, status)
- Not log file content or sensitive data
- Use structured logging format

**Reference Standards (Future):** ISO 27001, GDPR/RGPD

### 5. Light Integrity Verification

Modules must:
- Verify output file was created
- Verify output file is readable
- Return error if output is invalid

**Reference Standards (Future):** ISO 27001, NIST SP 800-53

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
