> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Threat Model

## Purpose

This document defines the canonical threat model for Ascend. It identifies potential security threats and the mitigations implemented to address them.

## Threat Categories

### 1. Input Validation Attacks

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

### 2. Resource Exhaustion Attacks

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

### 3. Code Injection Attacks

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

### 4. Data Exfiltration

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

### 5. Privilege Escalation

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

### 6. Information Disclosure

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

## Security Controls

### Defense in Depth

**Principle:** Multiple layers of security controls.

**Layers:**
1. Input validation
2. Sandboxing/isolation
3. Resource limits
4. Error handling
5. Logging and monitoring

### Fail Secure

**Principle:** System fails in a secure state.

**Implementation:**
- Reject invalid input immediately
- No processing of unvalidated data
- Cleanup on failure
- No partial state exposure

### Least Privilege

**Principle:** Minimum necessary privileges and access.

**Implementation:**
- Restricted file system access
- No network access
- Resource limits
- Isolated execution environment

## Risk Assessment

### High Risk

- Path traversal attacks → **Mitigated:** Strict path validation
- Resource exhaustion → **Mitigated:** Limits and monitoring
- Code injection → **Mitigated:** Sandboxing and validation

### Medium Risk

- Data exfiltration → **Mitigated:** Network blocking (V2)
- Privilege escalation → **Mitigated:** Isolation (V2)
- Information disclosure → **Mitigated:** Error sanitization

### Low Risk

- Denial of service (single user) → **Mitigated:** Resource limits
- Log injection → **Mitigated:** Log sanitization

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Identified threats
- Attack vectors
- Mitigation strategies
- Risk assessment
