# Sandboxing Rules

## Purpose

This document defines the canonical sandboxing rules for Ascend. Sandboxing ensures that conversion modules execute in isolated, secure environments with restricted access to system resources.

## Isolation Principles

### Principle 1: Unique Temporary Directory

**Rule:** Each conversion executes in a unique, isolated temporary directory.

**Requirements:**
- Directory created with UUID-based name
- Permissions: 0o700 (owner-only access)
- Located in system temp directory
- Deleted after conversion completion (success or failure)

### Principle 2: No Network Access

**Rule:** Conversion modules must not have network access during execution.

**Enforcement:**
- Network access attempts are detected and blocked
- Violations result in immediate conversion termination
- Security event logged

**Rationale:** Prevents data exfiltration and external dependencies.

### Principle 3: Restricted File System Access

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

### Principle 4: Resource Limits

**Rule:** Each conversion has strict resource limits enforced by the pipeline.

**Limits:**
- CPU: 100% of single core (default)
- Memory: 512 MB (default, configurable)
- Time: 30 seconds (default, configurable)
- File size: 10 MB input (default, configurable)

## Sandbox Implementation

### Current Implementation (V1)

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

### Future Implementation (V2+)

**Planned Enhancements:**
- Execution under dedicated non-privileged user
- Network namespace isolation
- Container-based sandboxing (Docker, etc.)
- System call filtering (seccomp, etc.)
- Capability dropping

## Violation Detection

### Path Traversal Attempts

**Detection:** Path validation before file operations

**Response:**
- Conversion immediately terminated
- Security event logged
- Error returned to user (generic message)

### Network Access Attempts

**Detection:** Network monitoring or sandbox mechanisms

**Response:**
- Conversion immediately terminated
- Security event logged
- Error returned to user (generic message)

### Resource Limit Violations

**Detection:** Continuous resource monitoring

**Response:**
- Process terminated (SIGTERM → SIGKILL)
- Conversion marked as failed
- Event logged with violation details

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Sandboxing principles
- Isolation requirements
- Resource limits
- Violation handling
