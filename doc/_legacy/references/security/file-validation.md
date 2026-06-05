> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# File Validation Rules

## Purpose

This document defines the canonical file validation rules enforced by Ascend. These rules ensure that only valid, safe files are processed.

## Validation Stages

### Stage 1: Format Whitelist Validation

**Rule:** Only formats in the supported formats whitelist are accepted.

**Process:**
1. Validate source format is in input formats whitelist
2. Validate target format is in output formats whitelist
3. Reject immediately if format not whitelisted

**Reference:** `doc/references/core/supported-formats.md`

### Stage 2: Path Validation

**Rule:** All file paths must be validated for security.

**Checks:**
- Path must be absolute (no relative paths)
- No path traversal sequences (`../`, `..\\`)
- No symlinks (in secure mode)
- Path must resolve to authorized directory

**Rejection:** Any path validation failure results in immediate rejection.

### Stage 3: File Size Validation

**Rule:** File size must be within configured limits.

**Default Limits:**
- Maximum input file size: 10 MB
- Configurable per execution profile

**Process:**
1. Check file size before reading
2. Reject if exceeds limit
3. No resources allocated for oversized files

### Stage 4: MIME Type Validation

**Rule:** Actual file type must match declared format.

**Process:**
1. Detect actual file type (MIME type, magic bytes)
2. Compare with declared format
3. Reject if mismatch detected

**Rationale:** Prevents binary files disguised as text files.

### Stage 5: Content Validation

**Rule:** File content must be valid for the declared format.

**Checks:**
- Valid encoding (UTF-8 preferred)
- Format-specific structure validation
- No embedded binary content (for text formats)

## Validation Order

Validation must occur in this order:
1. Format whitelist (before any file operations)
2. Path validation (before file access)
3. File size (before reading)
4. MIME type (after reading header)
5. Content validation (during/after reading)

## Rejection Behavior

### Immediate Rejection

**Rule:** Invalid files are rejected before any processing begins.

**Requirements:**
- No temporary files created
- No resources allocated
- Clear error message returned
- Security event logged (if applicable)

### Error Messages

**Rule:** Error messages must be generic and not expose system details.

**Allowed:**
- "Invalid file format"
- "File size exceeds limit"
- "File validation failed"

**Forbidden:**
- System file paths
- Internal error details
- Stack traces
- Configuration values

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Validation rules and order
- File size limits
- MIME type checking
- Rejection behavior
