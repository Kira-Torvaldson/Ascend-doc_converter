# Security Reference

## Purpose

This document defines the canonical security references for Ascend, including sandboxing rules, file validation, confirmation rules, and threat model. It serves as the authoritative reference for all security decisions.

---

## Sandboxing Rules

### Purpose

Sandboxing ensures that conversion modules execute in isolated, secure environments with restricted access to system resources.

### Isolation Principles

#### Principle 1: Unique Temporary Directory

**Rule:** Each conversion executes in a unique, isolated temporary directory.

**Requirements:**
- Directory created with UUID-based name
- Permissions: 0o700 (owner-only access)
- Located in system temp directory
- Deleted after conversion completion (success or failure)

#### Principle 2: No Network Access

**Rule:** Conversion modules must not have network access during execution.

**Enforcement:**
- Network access attempts are detected and blocked
- Violations result in immediate conversion termination
- Security event logged

**Rationale:** Prevents data exfiltration and external dependencies.

#### Principle 3: Restricted File System Access

**Rule:** Modules can only access files within their assigned temporary directory.

**Allowed:**
- Read input file (provided by pipeline)
- Write output file (to specified path)
- Create temporary files (within temp directory)

**Forbidden:**
- Access files outside temp directory
- Modify files outside temp directory
- Follow symlinks outside temp directory
- Access system directories

#### Principle 4: Resource Limits

**Rule:** Each conversion has strict resource limits enforced by the pipeline.

**Limits:**
- CPU: 100% of single core (default)
- Memory: 512 MB (default, configurable)
- Time: 30 seconds (default, configurable)
- File size: 10 MB input (default, configurable)

### Sandbox Implementation

#### Current Implementation (V1)

**Level:** Light isolation

**Mechanisms:**
- Unique temporary directory per conversion
- Path validation (prevents traversal)
- Resource monitoring
- Process timeout enforcement

**Not Yet Implemented:**
- User isolation (runs as same user)
- Network namespace isolation
- Container-based sandboxing
- System call filtering

#### Future Implementation (V2+)

**Planned Enhancements:**
- Execution under dedicated non-privileged user
- Network namespace isolation
- Container-based sandboxing (Docker, etc.)
- System call filtering (seccomp, etc.)
- Capability dropping

### Violation Detection

#### Path Traversal Attempts

**Detection:** Path validation before file operations

**Response:**
- Conversion immediately terminated
- Security event logged
- Error returned to user (generic message)

#### Network Access Attempts

**Detection:** Network monitoring or sandbox mechanisms

**Response:**
- Conversion immediately terminated
- Security event logged
- Error returned to user (generic message)

#### Resource Limit Violations

**Detection:** Continuous resource monitoring

**Response:**
- Process terminated (SIGTERM → SIGKILL)
- Conversion marked as failed
- Event logged with violation details

---

## File Validation

### Purpose

This section defines the canonical file validation rules enforced by Ascend. These rules ensure that only valid, safe files are processed.

### Validation Stages

#### Stage 1: Format Whitelist Validation

**Rule:** Only formats in the supported formats whitelist are accepted.

**Process:**
1. Validate source format is in input formats whitelist
2. Validate target format is in output formats whitelist
3. Reject immediately if format not whitelisted

#### Stage 2: Path Validation

**Rule:** All file paths must be validated for security.

**Checks:**
- Path must be absolute (no relative paths)
- No path traversal sequences (`../`, `..\\`)
- No symlinks (in secure mode)
- Path must resolve to authorized directory

**Rejection:** Any path validation failure results in immediate rejection.

#### Stage 3: File Size Validation

**Rule:** File size must be within configured limits.

**Default Limits:**
- Maximum input file size: 10 MB
- Configurable per execution profile

**Process:**
1. Check file size before reading
2. Reject if exceeds limit
3. No resources allocated for oversized files

#### Stage 4: MIME Type Validation

**Rule:** Actual file type must match declared format.

**Process:**
1. Detect actual file type (MIME type, magic bytes)
2. Compare with declared format
3. Reject if mismatch detected

**Rationale:** Prevents binary files disguised as text files.

#### Stage 5: Content Validation

**Rule:** File content must be valid for the declared format.

**Checks:**
- Valid encoding (UTF-8 preferred)
- Format-specific structure validation
- No embedded binary content (for text formats)

### Validation Order

Validation must occur in this order:
1. Format whitelist (before any file operations)
2. Path validation (before file access)
3. File size (before reading)
4. MIME type (after reading header)
5. Content validation (during/after reading)

### Rejection Behavior

#### Immediate Rejection

**Rule:** Invalid files are rejected before any processing begins.

**Requirements:**
- No temporary files created
- No resources allocated
- Clear error message returned
- Security event logged (if applicable)

#### Error Messages

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

---

## Confirmation Rules

### Purpose

This section defines the canonical rules for user confirmation of conversions. The confirmation system ensures that sensitive or potentially destructive operations require explicit user approval.

### Confirmation Requirements

#### Simple Conversions

**Rule:** Simple conversions do not require confirmation tokens.

**Simple Conversions:**
- AsciiDoc → Markdown (via downdoc)
- Markdown → AsciiDoc (via Pandoc)

**Rationale:** These conversions are low-risk and commonly used.

#### Complex Conversions

**Rule:** Complex conversions require confirmation tokens.

**Complex Conversions:**
- All conversions via `/api/convert` endpoint
- Conversions with custom options
- Multi-step conversions

**Rationale:** These conversions may have side effects or require validation.

### Token System

#### Token Generation

**Rule:** Tokens are generated server-side using cryptographically secure random generation.

**Requirements:**
- 32 bytes of random data
- Hex-encoded (64 characters)
- Unique per request
- Expiration: 60 seconds (default)

#### Token Validation

**Rule:** Tokens must be validated before conversion execution.

**Validation Checks:**
1. Token exists in token store
2. Token has not expired
3. Token has not been consumed
4. Token matches expected metadata (if provided)

#### Token Consumption

**Rule:** Tokens are single-use and consumed upon validation.

**Process:**
1. Token validated
2. Token immediately removed from store
3. Conversion proceeds
4. Token cannot be reused

### Confirmation Flow

#### Step 1: Token Request

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

#### Step 2: User Confirmation

**UI Action:** User confirms conversion in modal dialog.

**Backend Validation:** None. UI confirmation is not trusted.

#### Step 3: Conversion with Token

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

### Security Principles

#### Principle 1: No Trust of Frontend

**Rule:** Backend does not trust frontend UI confirmation.

**Enforcement:**
- Token validation is mandatory
- UI confirmation alone is insufficient
- Token must be present in conversion request

#### Principle 2: Token Expiration

**Rule:** Tokens expire after a short time window.

**Default:** 60 seconds

**Rationale:** Prevents token reuse and limits attack window.

#### Principle 3: Single Use

**Rule:** Tokens can only be used once.

**Enforcement:**
- Token removed from store upon validation
- Subsequent uses of same token are rejected

---

## Threat Model

### Purpose

This section defines the canonical threat model for Ascend. It identifies potential security threats and the mitigations implemented to address them.

### Threat Categories

#### 1. Input Validation Attacks

**Threat:** Malicious or malformed input causing system compromise.

**Attack Vectors:**
- Path traversal (`../` sequences)
- Oversized files (resource exhaustion)
- Binary files disguised as text
- Invalid encoding causing parser crashes

**Mitigations:**
- Strict path validation
- File size limits
- MIME type validation
- Encoding normalization
- Format whitelist enforcement

#### 2. Resource Exhaustion Attacks

**Threat:** Excessive resource consumption causing denial of service.

**Attack Vectors:**
- Large file uploads
- Many concurrent conversions
- Memory exhaustion
- CPU exhaustion

**Mitigations:**
- File size limits (10 MB default)
- Concurrent conversion limits (5 default)
- Memory limits per conversion (512 MB default)
- CPU limits per conversion
- Timeout enforcement (30 seconds default)
- Graceful degradation under load

#### 3. Code Injection Attacks

**Threat:** Execution of arbitrary code through malicious input.

**Attack Vectors:**
- Command injection in file paths
- Code injection in content
- Process manipulation

**Mitigations:**
- Path validation (no user input in paths)
- Whitelist-based command construction
- Process isolation (sandboxing)
- No `eval()` or dynamic code execution

#### 4. Data Exfiltration

**Threat:** Unauthorized data transmission outside the system.

**Attack Vectors:**
- Network access from conversion modules
- File system access outside temp directory
- Logging sensitive data

**Mitigations:**
- Network access blocked during conversion
- File system access restricted to temp directory
- No sensitive data in logs
- Path validation prevents external access

#### 5. Privilege Escalation

**Threat:** Gaining elevated system privileges.

**Attack Vectors:**
- Exploiting process privileges
- Accessing system files
- Modifying system configuration

**Mitigations:**
- Non-privileged execution (planned V2)
- File system restrictions
- No system file access
- Resource limits prevent system impact

#### 6. Information Disclosure

**Threat:** Leaking sensitive system or user information.

**Attack Vectors:**
- Error messages exposing system details
- Logs containing sensitive data
- File paths in error messages

**Mitigations:**
- Generic error messages
- No system paths in errors
- Log sanitization
- No user content in logs

### Security Controls

#### Defense in Depth

**Principle:** Multiple layers of security controls.

**Layers:**
1. Input validation
2. Sandboxing/isolation
3. Resource limits
4. Error handling
5. Logging and monitoring

#### Fail Secure

**Principle:** System fails in a secure state.

**Implementation:**
- Reject invalid input immediately
- No processing of unvalidated data
- Cleanup on failure
- No partial state exposure

#### Least Privilege

**Principle:** Minimum necessary privileges and access.

**Implementation:**
- Restricted file system access
- No network access
- Resource limits
- Isolated execution environment

### Risk Assessment

#### High Risk

- Path traversal attacks → **Mitigated:** Strict path validation
- Resource exhaustion → **Mitigated:** Limits and monitoring
- Code injection → **Mitigated:** Sandboxing and validation

#### Medium Risk

- Data exfiltration → **Mitigated:** Network blocking (V2)
- Privilege escalation → **Mitigated:** Isolation (V2)
- Information disclosure → **Mitigated:** Error sanitization

#### Low Risk

- Denial of service (single user) → **Mitigated:** Resource limits
- Log injection → **Mitigated:** Log sanitization

---

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Sandboxing principles
- Isolation requirements
- Resource limits
- Violation handling
- Validation rules and order
- File size limits
- MIME type checking
- Rejection behavior
- Confirmation requirements
- Token system rules
- Security principles
- Validation flow
- Identified threats
- Attack vectors
- Mitigation strategies
- Risk assessment

Any changes to security rules must be reflected here first, then propagated to implementation code.
