> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Response Contracts

## Purpose

This document defines the canonical response contracts for Ascend API endpoints. It specifies response formats, status codes, and error structures.

## Success Response Format

### Standard Success Response

```json
{
  "result": "Converted content",
  "format": "markdown"
}
```

### Field Specifications

**Field:** `result` | `markdown` | `asciidoc`  
**Type:** `string`  
**Description:** Converted content  
**Encoding:** UTF-8

**Field:** `format`  
**Type:** `string`  
**Description:** Output format identifier  
**Constraints:** Lowercase, valid format identifier

## Error Response Format

### Standard Error Response

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

### Field Specifications

**Field:** `success`  
**Type:** `boolean`  
**Description:** Operation success status  
**Value:** Always `false` for errors

**Field:** `error`  
**Type:** `string`  
**Description:** Error code  
**Constraints:** Standardized error codes

**Field:** `message`  
**Type:** `string`  
**Description:** User-friendly error message  
**Constraints:** Generic, no system details

## Proxy Response Format

### Success Response

```json
{
  "success": true,
  "result": "Converted content"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

## HTTP Status Codes

### Success Codes

- **200 OK:** Request successful
- **201 Created:** Resource created (if applicable)

### Client Error Codes

- **400 Bad Request:** Validation error, malformed request
- **401 Unauthorized:** Authentication required (if implemented)
- **403 Forbidden:** Security violation, invalid token
- **404 Not Found:** Resource not found
- **429 Too Many Requests:** Rate limit exceeded

### Server Error Codes

- **500 Internal Server Error:** Unexpected server error
- **503 Service Unavailable:** System overloaded, temporarily unavailable

## Response Headers

### Standard Headers

- `Content-Type: application/json`
- `X-Conversion-Id: <uuid>` (if applicable)
- `X-Request-Id: <uuid>` (if applicable)

## Error Code Reference

### Validation Errors

- `VALIDATION_ERROR`: General validation failure
- `FILE_VALIDATION_ERROR`: File validation failure
- `FORMAT_VALIDATION_ERROR`: Format validation failure
- `SIZE_LIMIT_EXCEEDED`: File size exceeds limit

### Execution Errors

- `CONVERSION_FAILED`: Conversion module failed
- `EXECUTION_ERROR`: Process execution error
- `OUTPUT_MISSING`: Output file not created
- `BINARY_NOT_FOUND`: Required binary not found

### Timeout Errors

- `TIMEOUT`: Conversion exceeded time limit

### Resource Errors

- `RESOURCE_LIMIT_EXCEEDED`: Resource limit exceeded
- `MEMORY_LIMIT_EXCEEDED`: Memory limit exceeded
- `CPU_LIMIT_EXCEEDED`: CPU limit exceeded

### Security Errors

- `SECURITY_VIOLATION`: General security violation
- `UNAUTHORIZED_ACCESS`: Unauthorized file access
- `PATH_TRAVERSAL`: Path traversal attempt
- `NETWORK_ACCESS_DENIED`: Network access attempt

### Confirmation Errors

- `CONFIRMATION_REQUIRED`: Confirmation token required
- `CONFIRMATION_TOKEN_INVALID`: Invalid confirmation token
- `CONFIRMATION_TOKEN_EXPIRED`: Expired confirmation token
- `CONFIRMATION_TOKEN_CONSUMED`: Token already used

## Response Validation Rules

### Rule 1: Consistent Format

**Rule:** All responses follow standard format.

**Enforcement:**
- Success responses include result
- Error responses include error code and message
- No mixed formats

### Rule 2: Generic Error Messages

**Rule:** Error messages must not expose system details.

**Enforcement:**
- No file paths
- No stack traces
- No internal error details
- User-friendly language

### Rule 3: Proper Status Codes

**Rule:** HTTP status codes must match error type.

**Enforcement:**
- 400 for validation errors
- 403 for security violations
- 500 for server errors
- 503 for overload conditions

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Response formats
- Error structures
- Status codes
- Error code definitions
