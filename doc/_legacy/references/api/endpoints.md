> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# API Endpoints

## Purpose

This document defines the canonical API endpoints for Ascend. It serves as the authoritative reference for API consumers.

## Base URL

**Development:** `http://localhost:3003`  
**Production:** Configurable via environment variable

## Endpoint Categories

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

#### `POST /from-html`

Convert HTML to other formats.

**Request:**
```json
{
  "text": "HTML content",
  "to": "markdown"
}
```

**Response:**
```json
{
  "result": "Converted content",
  "format": "markdown"
}
```

**Status:** ⏳ Available but not enabled in UI  
**Engine:** Pandoc  
**Confirmation:** Not required

#### `POST /text-to-markdown`

Convert plain text to Markdown.

**Request:**
```json
{
  "text": "Plain text content"
}
```

**Response:**
```json
{
  "markdown": "Converted Markdown content"
}
```

**Status:** ⏳ Available but not enabled in UI  
**Engine:** text2markdown  
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

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

### HTTP Status Codes

- `200 OK`: Success
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required (if implemented)
- `403 Forbidden`: Security violation
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: System overloaded

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Available endpoints
- Request/response formats
- Endpoint status
- Error handling
