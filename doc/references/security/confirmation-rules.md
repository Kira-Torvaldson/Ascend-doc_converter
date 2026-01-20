# Confirmation Rules

## Purpose

This document defines the canonical rules for user confirmation of conversions. The confirmation system ensures that sensitive or potentially destructive operations require explicit user approval.

## Confirmation Requirements

### Simple Conversions

**Rule:** Simple conversions do not require confirmation tokens.

**Simple Conversions:**
- AsciiDoc → Markdown (via downdoc)
- Markdown → AsciiDoc (via Pandoc)

**Rationale:** These conversions are low-risk and commonly used.

### Complex Conversions

**Rule:** Complex conversions require confirmation tokens.

**Complex Conversions:**
- All conversions via `/api/convert` endpoint
- Conversions with custom options
- Multi-step conversions

**Rationale:** These conversions may have side effects or require validation.

## Token System

### Token Generation

**Rule:** Tokens are generated server-side using cryptographically secure random generation.

**Requirements:**
- 32 bytes of random data
- Hex-encoded (64 characters)
- Unique per request
- Expiration: 60 seconds (default)

### Token Validation

**Rule:** Tokens must be validated before conversion execution.

**Validation Checks:**
1. Token exists in token store
2. Token has not expired
3. Token has not been consumed
4. Token matches expected metadata (if provided)

### Token Consumption

**Rule:** Tokens are single-use and consumed upon validation.

**Process:**
1. Token validated
2. Token immediately removed from store
3. Conversion proceeds
4. Token cannot be reused

## Confirmation Flow

### Step 1: Token Request

**Endpoint:** `POST /api/confirmation/request`

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

### Step 2: User Confirmation

**UI Action:** User confirms conversion in modal dialog.

**Backend Validation:** None. UI confirmation is not trusted.

### Step 3: Conversion with Token

**Endpoint:** `POST /api/convert`

**Request:**
```json
{
  "content": "...",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "token": "hex-encoded-token"
}
```

**Backend Validation:**
- Token must be valid
- Token must not be expired
- Token must not be consumed

## Security Principles

### Principle 1: No Trust of Frontend

**Rule:** Backend does not trust frontend UI confirmation.

**Enforcement:**
- Token validation is mandatory
- UI confirmation alone is insufficient
- Token must be present in conversion request

### Principle 2: Token Expiration

**Rule:** Tokens expire after a short time window.

**Default:** 60 seconds

**Rationale:** Prevents token reuse and limits attack window.

### Principle 3: Single Use

**Rule:** Tokens can only be used once.

**Enforcement:**
- Token removed from store upon validation
- Subsequent uses of same token are rejected

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Confirmation requirements
- Token system rules
- Security principles
- Validation flow
