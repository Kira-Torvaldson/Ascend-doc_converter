# Module Interface Specification

## Purpose

This document defines the canonical module interface contract for Ascend. All conversion modules must conform to this interface.

## Interface Contract

### Required Properties

#### `name`

**Type:** `string`  
**Description:** Unique identifier for the module  
**Constraints:**
- Lowercase with hyphens as separators
- No spaces or special characters
- Unique across all modules

**Examples:** `"downdoc"`, `"pandoc"`, `"text2markdown"`

#### `supportedFormats`

**Type:** `object`  
**Structure:**
```typescript
{
  from: string[],  // Input formats accepted
  to: string[]      // Output formats produced
}
```

**Constraints:**
- `from` and `to` must be non-empty arrays
- Format identifiers must be lowercase
- Formats must be from the supported formats whitelist

### Required Method: `run`

**Signature:**
```typescript
run(inputPath: string, outputPath: string, options?: object): Promise<ModuleResult>
```

**Parameters:**
- `inputPath`: Absolute path to input file (required)
- `outputPath`: Absolute path to output file (required)
- `options`: Conversion options (optional)

**Return Type:**
```typescript
interface ModuleResult {
  success: boolean;        // Conversion status
  logs: string | string[]; // Execution logs
  error: string | null;    // Error message (null if success)
  duration: number;        // Duration in seconds
}
```

## Security Obligations (V1)

### 1. Basic Input Validation

- Validate file size (within limits)
- Validate file type (extension or basic signature)
- Reject immediately if validation fails

### 2. Light Isolation

- Use provided temporary directory only
- Access only `inputPath` and `outputPath`
- No file creation outside authorized directory

### 3. Secure Error Handling

- Catch all exceptions
- Return `ModuleResult` with `success: false`
- No unhandled exceptions
- Generic error messages (no system details)

### 4. Minimal Logging

- Log conversion ID (if provided)
- Log start/end timestamps
- Log final status
- Log duration

### 5. Light Integrity Verification

- Module hash/checksum (optional in V1)
- Dependency documentation
- Modification detection (optional in V1)

## Behavioral Requirements

### On Success

1. Create output file at `outputPath`
2. Output file must be valid and conform to target format
3. Return `ModuleResult` with `success: true`, `error: null`

### On Failure

1. Do not create output file (or delete if partially created)
2. Return `ModuleResult` with `success: false`, `error: <message>`

## Execution Constraints

### Isolation

- Must not modify input file
- Must only access `inputPath` and `outputPath`
- Must not create files outside authorized directory
- Must not access network (V1 minimum)

### Performance

- Must respect timeout (if provided)
- Must release resources after execution
- Must not block main process

### Security

- Must not execute unvalidated system commands
- Must not use user data in system commands
- Must validate file paths before use

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Module interface contract
- Required properties and methods
- Security obligations
- Behavioral requirements

**Reference:** This specification is based on `doc/specifications/modules.interface.md` (legacy) and serves as the canonical version.
