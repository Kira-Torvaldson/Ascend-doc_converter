# Request Contracts

## Purpose

This document defines the canonical request contracts for Ascend API endpoints. It specifies required fields, optional fields, types, and validation rules.

## Common Request Fields

### Content Fields

**Field:** `content` | `text`  
**Type:** `string`  
**Required:** Yes (for conversion endpoints)  
**Constraints:**
- Non-empty string
- UTF-8 encoding
- Maximum length: 10 MB (default)

### Format Fields

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

### Options Field

**Field:** `options`  
**Type:** `object`  
**Required:** No  
**Constraints:**
- Valid conversion options structure
- Nested objects must match option schema

### Token Field

**Field:** `token`  
**Type:** `string`  
**Required:** Yes (for `/api/convert`)  
**Constraints:**
- Hex-encoded string (64 characters)
- Valid, non-expired token
- Not previously consumed

## Endpoint-Specific Contracts

### `/to-markdown`

**Required Fields:**
- `text`: string

**Optional Fields:**
- `options`: object

**Validation:**
- `text` must be non-empty
- `options` must be valid (if provided)

### `/to-asciidoc`

**Required Fields:**
- `text`: string

**Optional Fields:**
- None

**Validation:**
- `text` must be non-empty

### `/convert`

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

### `/api/proxy/convert`

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

### `/api/confirmation/request`

**Required Fields:**
- `fromFormat`: string
- `toFormat`: string

**Optional Fields:**
- `metadata`: object

**Validation:**
- Formats in whitelist
- Metadata structure valid (if provided)

## Request Validation Rules

### Rule 1: Type Validation

**Rule:** All fields must match expected types.

**Enforcement:**
- Type checking before processing
- Reject with 400 if type mismatch

### Rule 2: Required Fields

**Rule:** All required fields must be present.

**Enforcement:**
- Check presence of required fields
- Reject with 400 if missing

### Rule 3: Format Whitelist

**Rule:** Format fields must be in whitelist.

**Enforcement:**
- Validate against supported formats
- Reject with 400 if not whitelisted

### Rule 4: Content Size

**Rule:** Content must not exceed size limit.

**Enforcement:**
- Check content length
- Reject with 400 if exceeds limit

### Rule 5: Token Validation

**Rule:** Tokens must be valid and not expired.

**Enforcement:**
- Validate token exists
- Check expiration
- Reject with 403 if invalid

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Request field requirements
- Type specifications
- Validation rules
- Endpoint-specific contracts
