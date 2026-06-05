# API Reference

## Purpose

This document defines the canonical API references for Ascend, including endpoints, request contracts, and response contracts. It serves as the authoritative reference for all API consumers.

---

## Endpoints

### Purpose

This section defines the canonical API endpoints for Ascend.

### Base URL

**Development:** `http://localhost:3003`  
**Production:** Configurable via environment variable

### Conversion Endpoints

#### `POST /to-markdown`

Convert AsciiDoc to Markdown.

**Request:**
```json
{
  "text": "AsciiDoc content",
  "options": {}
}
```

**Response:**
```json
{
  "markdown": "Converted Markdown content"
}
```

**Status:** ✅ Active  
**Engine:** downdoc  
**Confirmation:** Not required

#### `POST /to-asciidoc`

Convert Markdown to AsciiDoc.

**Request:**
```json
{
  "text": "Markdown content"
}
```

**Response:**
```json
{
  "asciidoc": "Converted AsciiDoc content"
}
```

**Status:** ✅ Active  
**Engine:** Pandoc  
**Confirmation:** Not required

#### `POST /convert`

Generic conversion endpoint with token validation.

**Request:**
```json
{
  "content": "Source content",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "token": "confirmation-token",
  "options": {}
}
```

**Response:**
```json
{
  "result": "Converted content",
  "format": "markdown"
}
```

**Status:** ✅ Active  
**Engine:** Determined by orchestrator  
**Confirmation:** Required (token)

### Proxy Endpoints

#### `POST /api/proxy/convert`

Normalized conversion endpoint with data sanitization.

**Request:**
```json
{
  "content": "Content (may contain BOM, Smart Quotes, etc.)",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "options": {},
  "token": "optional-token"
}
```

**Response:**
```json
{
  "success": true,
  "result": "Sanitized and converted content"
}
```

**Status:** ✅ Active  
**Features:** BOM removal, encoding normalization, Smart Quote replacement  
**Confirmation:** Optional (if token provided)

### Security Endpoints

#### `POST /api/confirmation/request`

Request confirmation token for sensitive conversions.

**Request:**
```json
{
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "metadata": {}
}
```

**Response:**
```json
{
  "token": "hex-encoded-token",
  "expiresIn": 60
}
```

**Status:** ✅ Active  
**Token Lifetime:** 60 seconds (default)

#### `GET /api/confirmation/stats`

Get confirmation token statistics.

**Response:**
```json
{
  "active": 5,
  "expired": 10,
  "consumed": 20
}
```

**Status:** ✅ Active

### Logging Endpoints

#### `GET /api/logs/:conversionId`

Get log for specific conversion.

**Response:**
```json
{
  "conversionId": "uuid",
  "timestamp": "ISO-8601",
  "status": "SUCCESS",
  "modules": [...],
  "duration": 1.23
}
```

**Status:** ✅ Active

#### `GET /api/logs`

List all conversion logs.

**Response:**
```json
[
  {
    "conversionId": "uuid",
    "timestamp": "ISO-8601",
    "status": "SUCCESS"
  }
]
```

**Status:** ✅ Active

### Error Responses

#### Standard Error Format
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

#### HTTP Status Codes
- `200 OK`: Success
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required (if implemented)
- `403 Forbidden`: Security violation
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: System overloaded

---

## Request Contracts

### Purpose

This section defines the canonical request contracts for Ascend API endpoints. It specifies required fields, optional fields, types, and validation rules.

### Common Request Fields

#### Content Fields

**Field:** `content` | `text`  
**Type:** `string`  
**Required:** Yes (for conversion endpoints)  
**Constraints:**
- Non-empty string
- UTF-8 encoding
- Maximum length: 10 MB (default)

#### Format Fields

**Field:** `fromFormat` | `from`  
**Type:** `string`  
**Required:** Yes  
**Constraints:**
- Must be in supported formats whitelist
- Lowercase
- Valid format identifier

**Field:** `toFormat` | `to`  
**Type:** `string`  
**Required:** Yes  
**Constraints:**
- Must be in supported formats whitelist
- Lowercase
- Valid format identifier

#### Options Field

**Field:** `options`  
**Type:** `object`  
**Required:** No  
**Constraints:**
- Valid conversion options structure
- Nested objects must match option schema

#### Token Field

**Field:** `token`  
**Type:** `string`  
**Required:** Yes (for `/api/convert`)  
**Constraints:**
- Hex-encoded string (64 characters)
- Valid, non-expired token
- Not previously consumed

### Endpoint-Specific Contracts

#### `/to-markdown`

**Required Fields:**
- `text`: string

**Optional Fields:**
- `options`: object

**Validation:**
- `text` must be non-empty
- `options` must be valid (if provided)

#### `/to-asciidoc`

**Required Fields:**
- `text`: string

**Optional Fields:**
- None

**Validation:**
- `text` must be non-empty

#### `/convert`

**Required Fields:**
- `content`: string
- `fromFormat`: string
- `toFormat`: string
- `token`: string

**Optional Fields:**
- `options`: object

**Validation:**
- All required fields present
- Formats in whitelist
- Token valid and not expired
- Options valid (if provided)

#### `/api/proxy/convert`

**Required Fields:**
- `content`: string
- `fromFormat`: string
- `toFormat`: string

**Optional Fields:**
- `options`: object
- `token`: string

**Validation:**
- All required fields present
- Formats in whitelist
- Token valid (if provided)

#### `/api/confirmation/request`

**Required Fields:**
- `fromFormat`: string
- `toFormat`: string

**Optional Fields:**
- `metadata`: object

**Validation:**
- Formats in whitelist
- Metadata structure valid (if provided)

### Request Validation Rules

#### Rule 1: Type Validation

**Rule:** All fields must match expected types.

**Enforcement:**
- Type checking before processing
- Reject with 400 if type mismatch

#### Rule 2: Required Fields

**Rule:** All required fields must be present.

**Enforcement:**
- Check presence of required fields
- Reject with 400 if missing

#### Rule 3: Format Whitelist

**Rule:** Format fields must be in whitelist.

**Enforcement:**
- Validate against supported formats
- Reject with 400 if not whitelisted

#### Rule 4: Content Size

**Rule:** Content must not exceed size limit.

**Enforcement:**
- Check content length
- Reject with 400 if exceeds limit

#### Rule 5: Token Validation

**Rule:** Tokens must be valid and not expired.

**Enforcement:**
- Validate token exists
- Check expiration
- Reject with 403 if invalid

---

## Response Contracts

### Purpose

This section defines the canonical response contracts for Ascend API endpoints. It specifies response formats, status codes, and error structures.

### Success Response Format

#### Standard Success Response

```json
{
  "result": "Converted content",
  "format": "markdown"
}
```

#### Field Specifications

**Field:** `result` | `markdown` | `asciidoc`  
**Type:** `string`  
**Description:** Converted content  
**Encoding:** UTF-8

**Field:** `format`  
**Type:** `string`  
**Description:** Output format identifier  
**Constraints:** Lowercase, valid format identifier

### Error Response Format

#### Standard Error Response

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

#### Field Specifications

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

### Proxy Response Format

#### Success Response

```json
{
  "success": true,
  "result": "Converted content"
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

### HTTP Status Codes

#### Success Codes

- **200 OK:** Request successful
- **201 Created:** Resource created (if applicable)

#### Client Error Codes

- **400 Bad Request:** Validation error, malformed request
- **401 Unauthorized:** Authentication required (if implemented)
- **403 Forbidden:** Security violation, invalid token
- **404 Not Found:** Resource not found
- **429 Too Many Requests:** Rate limit exceeded

#### Server Error Codes

- **500 Internal Server Error:** Unexpected server error
- **503 Service Unavailable:** System overloaded, temporarily unavailable

### Response Headers

#### Standard Headers

- `Content-Type: application/json`
- `X-Conversion-Id: <uuid>` (if applicable)
- `X-Request-Id: <uuid>` (if applicable)

### Error Code Reference

#### Validation Errors

- `VALIDATION_ERROR`: General validation failure
- `FILE_VALIDATION_ERROR`: File validation failure
- `FORMAT_VALIDATION_ERROR`: Format validation failure
- `SIZE_LIMIT_EXCEEDED`: File size exceeds limit

#### Execution Errors

- `CONVERSION_FAILED`: Conversion module failed
- `EXECUTION_ERROR`: Process execution error
- `OUTPUT_MISSING`: Output file not created
- `BINARY_NOT_FOUND`: Required binary not found

#### Timeout Errors

- `TIMEOUT`: Conversion exceeded time limit

#### Resource Errors

- `RESOURCE_LIMIT_EXCEEDED`: Resource limit exceeded
- `MEMORY_LIMIT_EXCEEDED`: Memory limit exceeded
- `CPU_LIMIT_EXCEEDED`: CPU limit exceeded

#### Security Errors

- `SECURITY_VIOLATION`: General security violation
- `UNAUTHORIZED_ACCESS`: Unauthorized file access
- `PATH_TRAVERSAL`: Path traversal attempt
- `NETWORK_ACCESS_DENIED`: Network access attempt

#### Confirmation Errors

- `CONFIRMATION_REQUIRED`: Confirmation token required
- `CONFIRMATION_TOKEN_INVALID`: Invalid confirmation token
- `CONFIRMATION_TOKEN_EXPIRED`: Expired confirmation token
- `CONFIRMATION_TOKEN_CONSUMED`: Token already used

### Response Validation Rules

#### Rule 1: Consistent Format

**Rule:** All responses follow standard format.

**Enforcement:**
- Success responses include result
- Error responses include error code and message
- No mixed formats

#### Rule 2: Generic Error Messages

**Rule:** Error messages must not expose system details.

**Enforcement:**
- No file paths
- No stack traces
- No internal error details
- User-friendly language

#### Rule 3: Proper Status Codes

**Rule:** HTTP status codes must match error type.

**Enforcement:**
- 400 for validation errors
- 403 for security violations
- 500 for server errors
- 503 for overload conditions

---

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Available endpoints
- Request/response formats
- Endpoint status
- Error handling
- Request field requirements
- Type specifications
- Validation rules
- Endpoint-specific contracts
- Response formats
- Error structures
- Status codes
- Error code definitions

Any changes to API contracts must be reflected here first, then propagated to implementation code.
