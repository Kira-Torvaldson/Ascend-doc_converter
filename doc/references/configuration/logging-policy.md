# Logging Policy

## Purpose

This document defines the canonical logging policy for Ascend. It specifies what is logged, how logs are structured, retention policies, and security requirements.

## Log Categories

### 1. Conversion Logs

**Purpose:** Track individual conversion operations  
**Format:** JSON  
**Location:** `api/logs/<conversion-id>.log`  
**Retention:** 30 days (configurable)

**Content:**
- Conversion ID (UUID)
- Timestamp (ISO 8601)
- Source and target formats
- Modules executed
- Duration
- Final status (SUCCESS, FAILED, TIMEOUT, etc.)
- Error messages (sanitized)

**Security:**
- No user content
- No file paths (only relative paths within temp directory)
- No sensitive data

### 2. Security Logs

**Purpose:** Track security events and violations  
**Format:** JSON  
**Location:** Security event log (separate from conversion logs)  
**Retention:** 90 days (configurable)

**Content:**
- Security event type
- Timestamp
- Conversion ID (if applicable)
- Violation details (sanitized)
- Action taken

**Events Logged:**
- Path traversal attempts
- Network access attempts
- Resource limit violations
- Unauthorized format attempts
- Token validation failures

### 3. System Logs

**Purpose:** Track system health and errors  
**Format:** Structured text or JSON  
**Location:** System log (stdout/stderr or file)  
**Retention:** 7 days (configurable)

**Content:**
- System events (startup, shutdown)
- Error conditions
- Resource usage warnings
- Degradation events

## Log Structure

### Conversion Log Format

```json
{
  "conversionId": "uuid",
  "timestamp": "ISO-8601",
  "sourceFormat": "asciidoc",
  "targetFormat": "markdown",
  "modules": [
    {
      "name": "downdoc",
      "duration": 1.23,
      "status": "SUCCESS"
    }
  ],
  "totalDuration": 1.23,
  "status": "SUCCESS",
  "error": null
}
```

## Logging Rules

### 1. No User Content

Logs must never contain:
- File content
- User-provided text
- Personal information
- Sensitive data

### 2. Sanitization

All logged data must be sanitized:
- File paths → relative paths only
- Error messages → generic messages (no system details)
- User input → removed or hashed

### 3. Structured Format

All logs must be structured (JSON preferred) for:
- Machine parsing
- Automated analysis
- Integration with log aggregation systems

### 4. Minimal Logging

Only essential information is logged:
- Conversion metadata
- Security events
- System errors
- Performance metrics

## Log Access

### API Access

Logs are accessible via:
- `GET /api/logs/<conversion-id>` - Single conversion log
- `GET /api/logs` - List all conversion logs

### File System Access

Logs are stored in:
- `api/logs/` directory
- One file per conversion
- JSON format for parsing

## Retention Policy

- **Conversion Logs:** 30 days (default, configurable)
- **Security Logs:** 90 days (default, configurable)
- **System Logs:** 7 days (default, configurable)

Automatic cleanup removes logs older than retention period.

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Log content requirements
- Log format specifications
- Retention policies
- Security requirements
