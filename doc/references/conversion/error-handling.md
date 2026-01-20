# Error Handling

## Purpose

This document defines the canonical error handling rules for Ascend. It specifies error codes, error messages, and handling strategies.

## Error Categories

### Validation Errors

**Category:** Input validation failures

**Error Codes:**
- `VALIDATION_ERROR`: General validation failure
- `FILE_VALIDATION_ERROR`: File validation failure
- `FORMAT_VALIDATION_ERROR`: Format validation failure
- `SIZE_LIMIT_EXCEEDED`: File size exceeds limit

**Behavior:**
- Reject immediately
- No resources allocated
- Clear error message returned

### Execution Errors

**Category:** Errors during conversion execution

**Error Codes:**
- `CONVERSION_FAILED`: Conversion module failed
- `EXECUTION_ERROR`: Process execution error
- `OUTPUT_MISSING`: Output file not created
- `BINARY_NOT_FOUND`: Required binary not found

**Behavior:**
- Terminate conversion
- Cleanup resources
- Log error details
- Return generic error to user

### Timeout Errors

**Category:** Conversion exceeded time limit

**Error Code:** `TIMEOUT`

**Behavior:**
- Force terminate process (SIGTERM → SIGKILL)
- Cleanup resources
- Log timeout event
- Return timeout error

### Resource Errors

**Category:** Resource limit violations

**Error Codes:**
- `RESOURCE_LIMIT_EXCEEDED`: Resource limit exceeded
- `MEMORY_LIMIT_EXCEEDED`: Memory limit exceeded
- `CPU_LIMIT_EXCEEDED`: CPU limit exceeded

**Behavior:**
- Terminate process immediately
- Cleanup resources
- Log violation details
- Return resource error

### Security Errors

**Category:** Security violations

**Error Codes:**
- `SECURITY_VIOLATION`: General security violation
- `UNAUTHORIZED_ACCESS`: Unauthorized file access
- `PATH_TRAVERSAL`: Path traversal attempt
- `NETWORK_ACCESS_DENIED`: Network access attempt

**Behavior:**
- Terminate immediately
- Log security event
- Return generic error (no details)
- Alert security monitoring (if configured)

## Error Response Format

### Standard Error Response

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

### Error Message Rules

**Rule 1: Generic Messages**
- No system details
- No file paths
- No internal error information

**Rule 2: User-Friendly**
- Clear and actionable
- Explain what went wrong
- Suggest resolution when possible

**Rule 3: Consistent**
- Same error code = same message
- Predictable error responses
- Documented error codes

## Error Logging

### Log Content

**Included:**
- Error code
- Conversion ID
- Timestamp
- Module name (if applicable)
- Sanitized error details

**Excluded:**
- User content
- System file paths
- Stack traces (in user-facing errors)
- Sensitive data

### Log Levels

- **ERROR:** Conversion failures, security violations
- **WARN:** Resource warnings, validation issues
- **INFO:** Normal operation events

## Error Recovery

### Automatic Recovery

**Rule:** No automatic retry of failed conversions.

**Rationale:**
- Prevents infinite loops
- User controls retry
- Clear failure state

### Manual Recovery

**Rule:** Users can retry failed conversions.

**Process:**
1. User receives error
2. User fixes issue (if applicable)
3. User retries conversion
4. New conversion ID generated

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Error codes and categories
- Error response format
- Error message rules
- Logging requirements
