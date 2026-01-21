# Ascend - Complete Documentation

**Version:** 0.0.1.2.2 alpha  
**Last Updated:** 2026-01-19  
**Status:** Alpha - Architecture in crystallization

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Core Principles](#2-core-principles)
3. [Architecture](#3-architecture)
4. [Supported Formats](#4-supported-formats)
5. [Conversion Engines](#5-conversion-engines)
6. [Module Interface](#6-module-interface)
7. [Conversion Pipeline](#7-conversion-pipeline)
8. [API Reference](#8-api-reference)
9. [Security](#9-security)
10. [Configuration](#10-configuration)
11. [Local-First Principles](#11-local-first-principles)
12. [Roadmap](#12-roadmap)
13. [Glossary](#13-glossary)
14. [Changelog](#14-changelog)

---

## 1. Project Identity

### Purpose

Ascend is a local-first document conversion pipeline. It converts documents between formats (currently AsciiDoc ↔ Markdown) using isolated, modular conversion wrappers that respect strict interface contracts.

### Core Principles

#### 1. Local-First
- All conversions execute entirely on the local machine
- No network access required or permitted during conversion
- No external service dependencies for core functionality
- Data remains on the user's system throughout the conversion process

#### 2. Isolation
- Each conversion executes in a completely isolated environment
- No shared state between conversions
- Unique temporary directory per conversion
- No interference between concurrent conversions

#### 3. Security by Design
- Strict input validation before any processing
- Sandboxed execution environment
- Resource limits enforced per conversion
- No trust of external inputs

#### 4. Modularity
- Conversion modules are independent units
- Standard interface contract for all modules
- Lazy loading to minimize memory footprint
- Extensible architecture for future formats

#### 5. Reliability
- Robust error handling without system crashes
- Guaranteed cleanup of resources
- Controlled degradation under load
- Comprehensive logging for auditability

### Current Status

**Version:** 0.0.1.2.2 alpha  
**Supported Conversions:** AsciiDoc ↔ Markdown, Plain Text → Markdown  
**Future Formats:** HTML, PDF, YAML, JSON, TXT (planned)

---

## 2. Core Principles

### Determinism

Each conversion follows an explicit and predictable path. No implicit heuristics, no undeclared automatic detection.

### Explicit Failure

The system fails immediately and explicitly when:
- A format is not declared
- A validation fails
- A conversion path does not exist
- A resource is unavailable

No attempt at "graceful recovery" or "silent fallback".

### Contractual Rigidity

All modules respect a strict interface contract (`modules.interface.md`). No deviation is tolerated. A module that does not respect the contract is rejected.

### Traceability

Each conversion generates:
- A unique identifier
- A dedicated temporary directory
- Structured logs (JSON)
- Duration metrics
- Explicit final status (success or failure)

### Predictable Behavior

No magical behavior, no implicit inference. All execution paths are explicit and documented.

### Hostile Input Treatment

All inputs are considered potentially malicious until explicitly validated:
- Path validation (no `..`, no symlinks)
- MIME type validation
- File size validation
- Declared format validation
- Encoding validation

---

## 3. Architecture

### Architectural Principles

#### Principle 1: Local-First
- All processing occurs locally, no external dependencies
- No network access during conversion
- No external API calls
- All engines run locally
- Data never leaves the system

#### Principle 2: Modularity
- System composed of independent, interchangeable modules
- Standard module interface
- Lazy loading of modules
- Module isolation
- Extensible architecture

#### Principle 3: Isolation
- Each conversion executes in complete isolation
- Unique temporary directory per conversion
- No shared state
- Resource limits per conversion
- Clean separation of concerns

#### Principle 4: Security by Design
- Security built into architecture, not added later
- Input validation at boundaries
- Sandboxed execution
- Resource limits
- Comprehensive logging

### System Components

#### Frontend Layer
**Technology:** React 18 + TypeScript + Vite

**Components:**
- UI components (Panel, FormatSelector, Modal, etc.)
- Conversion services (API clients)
- Batch processing service
- State management (React hooks)

**Responsibilities:**
- User interface
- User interaction
- API communication
- Client-side validation

#### Backend Layer
**Technology:** Node.js + Express

**Components:**
- API routes (conversion, security, logs)
- Conversion services
- Security modules
- Logging system
- Orchestrators

**Responsibilities:**
- Request handling
- Conversion orchestration
- Security enforcement
- Resource management

#### Conversion Layer
**Technology:** Module-based architecture

**Components:**
- Conversion modules (downdoc, pandoc, text2markdown, etc.)
- Lazy loading system
- Converter orchestrator
- Execution orchestrator

**Responsibilities:**
- Format conversion
- Module selection
- Execution coordination
- Result validation

#### Security Layer
**Technology:** Integrated security modules

**Components:**
- Pipeline security (concurrency, resources, anomalies)
- Input validation
- Sandboxing (V1: light, V2: enhanced)
- Token management

**Responsibilities:**
- Security enforcement
- Threat detection
- Resource protection
- Audit logging

### Data Flow

#### Conversion Request Flow
1. **Frontend:** User initiates conversion
2. **API:** Request received and validated
3. **Security:** Security checks (concurrency, resources, validation)
4. **Orchestrator:** Conversion path determined
5. **Module:** Conversion executed
6. **Result:** Output validated and returned
7. **Cleanup:** Resources released

#### File Flow
1. **Input:** User content → Temporary file
2. **Processing:** Temporary file → Module → Temporary output file
3. **Output:** Temporary output file → Result content
4. **Cleanup:** All temporary files deleted

---

## 4. Supported Formats

### Format Naming Convention

All format identifiers must:
- Be lowercase
- Use standard format names (e.g., `markdown`, `asciidoc`, `html`)
- Match exactly across all system components
- Be normalized before use in any validation or routing logic

### Currently Supported Formats

#### Input Formats

| Format | Identifier | Status | Engine |
|--------|-----------|--------|--------|
| AsciiDoc | `asciidoc` | ✅ Active | downdoc |
| Markdown | `markdown` | ✅ Active | Pandoc |
| Plain Text | `txt` | ✅ Active | text2markdown |
| HTML | `html` | ⏳ Planned | Pandoc |

#### Output Formats

| Format | Identifier | Status | Engine |
|--------|-----------|--------|--------|
| Markdown | `markdown` | ✅ Active | downdoc |
| AsciiDoc | `asciidoc` | ✅ Active | Pandoc |
| Plain Text | `txt` | ⏳ Planned | Native |
| HTML | `html` | ⏳ Planned | Pandoc |

### Format Validation Rules

#### 1. Whitelist Enforcement
Only formats explicitly listed are accepted. Any format not in the whitelist must be rejected before any processing begins.

#### 2. Format Pair Validation
The system validates that:
- The source format is in the input formats whitelist
- The target format is in the output formats whitelist
- A conversion path exists between the formats

#### 3. Format Detection
When format is not explicitly provided:
- File extension is used as a hint
- Content analysis may be performed (MIME type, magic bytes)
- User declaration takes precedence over detection

### Conversion Matrix

| From \ To | Markdown | AsciiDoc | HTML | TXT |
|-----------|----------|----------|------|-----|
| AsciiDoc  | ✅       | -        | ⏳    | ⏳   |
| Markdown  | -        | ✅       | ⏳    | ⏳   |
| HTML      | ⏳       | ⏳       | -    | ⏳   |
| TXT       | ✅       | ⏳       | ⏳    | -   |

**Legend:**
- ✅ = Currently supported
- ⏳ = Planned
- - = Not applicable

### Planned Formats

- **PDF** (`pdf`) - Input and output
- **YAML** (`yaml`) - Input and output
- **JSON** (`json`) - Input and output
- **DOCX** (`docx`) - Input and output (via docverter)
- **RTF** (`rtf`) - Input and output (via docverter)
- **ODT** (`odt`) - Input and output (via panwriter)

---

## 5. Conversion Engines

### Engine Naming Convention

Engine identifiers must:
- Match the module name exactly
- Be lowercase with hyphens as separators
- Be unique across all engines
- Match the identifier in the module's `name` property

### Available Engines

#### downdoc
**Identifier:** `downdoc`  
**Status:** ✅ Active  
**Type:** JavaScript library (native)  
**Supported Conversions:**
- From: `asciidoc`
- To: `markdown`

**Characteristics:**
- Pure JavaScript implementation
- No external binary dependencies
- Fast in-memory conversion
- Supports BookStack/Parsedown compatibility mode

#### pandoc
**Identifier:** `pandoc`  
**Status:** ✅ Active  
**Type:** External binary (command-line tool)  
**Supported Conversions:**
- From: `markdown`, `html`
- To: `asciidoc`, `html`, `pdf`, `docx`, `epub`, `rst`, `tex`, `latex`

**Characteristics:**
- Requires Pandoc binary installation
- Executed via `child_process.spawn`
- Supports extensive format range
- Timeout and resource limits enforced

#### text2markdown
**Identifier:** `text2markdown`  
**Status:** ✅ Active  
**Type:** JavaScript library (native)  
**Supported Conversions:**
- From: `txt`
- To: `markdown`

**Characteristics:**
- Pure JavaScript implementation
- Automatic structure detection
- Detects headings, lists, code blocks
- No external dependencies

#### panwriter
**Identifier:** `panwriter`  
**Status:** ⏳ Placeholder  
**Type:** Planned (external service/library)  
**Supported Conversions:**
- From: `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`
- To: `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`

**Characteristics:**
- Not yet implemented
- Planned for future release
- Will support Office document formats

#### docverter
**Identifier:** `docverter`  
**Status:** ⏳ Placeholder  
**Type:** Planned (external service/library)  
**Supported Conversions:**
- From: `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`
- To: `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`

**Characteristics:**
- Not yet implemented
- Planned for future release
- Will support extensive format range including images

### Engine Selection Rules

#### 1. Format-Based Routing
The converter orchestrator selects engines based on:
- Source format whitelist match
- Target format whitelist match
- Engine availability and status

#### 2. Priority Order
When multiple engines support the same conversion:
1. Native JavaScript engines (downdoc, text2markdown) are preferred
2. External binaries (pandoc) are used when native engines don't support the conversion
3. Placeholder engines are never selected (return error)

#### 3. Lazy Loading
All engines are loaded on-demand via the lazy loading module:
- Reduces initial memory footprint
- Allows dynamic engine discovery
- Enables graceful handling of missing engines

---

## 6. Module Interface

### Purpose

This document defines the canonical module interface contract for Ascend. All conversion modules must conform to this interface.

### Required Properties

#### `name`
**Type:** `string`  
**Description:** Unique identifier for the module  
**Constraints:**
- Lowercase with hyphens as separators
- No spaces or special characters
- Unique across all modules

**Examples:** `"downdoc"`, `"pandoc"`, `"text2markdown"`

#### `supportedFormats`
**Type:** `object`  
**Structure:**
```typescript
{
  from: string[],  // Input formats accepted
  to: string[]      // Output formats produced
}
```

**Constraints:**
- `from` and `to` must be non-empty arrays
- Format identifiers must be lowercase
- Formats must be from the supported formats whitelist

### Required Method: `run`

**Signature:**
```typescript
run(inputPath: string, outputPath: string, options?: object): Promise<ModuleResult>
```

**Parameters:**
- `inputPath`: Absolute path to input file (required)
- `outputPath`: Absolute path to output file (required)
- `options`: Conversion options (optional)

**Return Type:**
```typescript
interface ModuleResult {
  success: boolean;        // Conversion status
  logs: string | string[]; // Execution logs
  error: string | null;    // Error message (null if success)
  duration: number;        // Duration in seconds
}
```

### Security Obligations (V1)

#### 1. Basic Input Validation
- Validate file size (within limits)
- Validate file type (extension or basic signature)
- Reject immediately if validation fails

#### 2. Light Isolation
- Use provided temporary directory only
- Access only `inputPath` and `outputPath`
- No file creation outside authorized directory

#### 3. Secure Error Handling
- Catch all exceptions
- Return `ModuleResult` with `success: false`
- No unhandled exceptions
- Generic error messages (no system details)

#### 4. Minimal Logging
- Log conversion ID (if provided)
- Log start/end timestamps
- Log final status
- Log duration

#### 5. Light Integrity Verification
- Module hash/checksum (optional in V1)
- Dependency documentation
- Modification detection (optional in V1)

### Behavioral Requirements

#### On Success
1. Create output file at `outputPath`
2. Output file must be valid and conform to target format
3. Return `ModuleResult` with `success: true`, `error: null`

#### On Failure
1. Do not create output file (or delete if partially created)
2. Return `ModuleResult` with `success: false`, `error: <message>`

### Execution Constraints

#### Isolation
- Must not modify input file
- Must only access `inputPath` and `outputPath`
- Must not create files outside authorized directory
- Must not access network (V1 minimum)

#### Performance
- Must respect timeout (if provided)
- Must release resources after execution
- Must not block main process

#### Security
- Must not execute unvalidated system commands
- Must not use user data in system commands
- Must validate file paths before use

---

## 7. Conversion Pipeline

### Pipeline Principles

#### Principle 1: Strict Isolation
**Rule:** Each conversion executes in complete isolation from all other conversions.

**Requirements:**
- Unique temporary directory per conversion
- No shared state between conversions
- No interference between concurrent conversions
- Guaranteed cleanup after completion

#### Principle 2: File-Based Communication
**Rule:** Modules communicate exclusively through files.

**Requirements:**
- Input file provided to module
- Output file created by module
- No direct inter-module communication
- No shared memory or variables

#### Principle 3: Linear Execution
**Rule:** Conversion steps execute sequentially in a linear flow.

**Requirements:**
- Steps executed one after another
- Output of step N becomes input of step N+1
- No parallel execution of steps
- Clear execution order

### Conversion Lifecycle

#### Phase 1: Initialization
**Duration:** < 1 second

**Steps:**
1. Generate unique conversion ID (UUID)
2. Create unique temporary directory
3. Validate user confirmation (if required)
4. Validate input content
5. Validate conversion format pair (whitelist)

**Validation Failures:** Conversion rejected immediately, no resources allocated.

#### Phase 2: Preparation
**Duration:** < 1 second

**Steps:**
1. Determine file extensions (source and target)
2. Generate absolute file paths (within temp directory)
3. Write input file to temp directory
4. Validate paths (prevent traversal)

**Path Validation:** All paths must be within temp directory.

#### Phase 3: Execution
**Duration:** Variable (typically 1-30 seconds)

**Steps:**
1. Select appropriate conversion module
2. Execute module with validated parameters
3. Capture stdout/stderr
4. Monitor timeout
5. Force termination if timeout exceeded

**Module Execution:**
- Module receives input file path
- Module creates output file
- Module returns result object
- Pipeline validates output file exists

#### Phase 4: Finalization
**Duration:** < 1 second

**Steps:**
1. Verify output file exists
2. Read converted content
3. Log conversion success
4. Return result to caller

**Output Validation:**
- File must exist
- File must be readable
- File must contain valid content

#### Phase 5: Cleanup
**Duration:** < 1 second

**Steps:**
1. Delete temporary directory recursively
2. Log cleanup errors (non-fatal)
3. Release resources
4. Decrement concurrency counter

**Cleanup Guarantee:** Cleanup always executes, even on error.

### Module Selection

#### Selection Rules
1. Check module `supportedFormats.from` includes source format
2. Check module `supportedFormats.to` includes target format
3. Verify module is available (not placeholder)
4. Select first matching module

#### Fallback Strategy
If no module matches:
- Conversion rejected with clear error
- No fallback to alternative modules
- Error logged

### Error Handling

#### Error Categories

| Category | Behavior | Example |
|----------|----------|---------|
| Validation Error | Reject immediately | Invalid format |
| Execution Error | Terminate, cleanup | Module crash |
| Timeout | Force kill, cleanup | Process hangs |
| Resource Limit | Terminate, cleanup | Memory exceeded |

#### Error Response
**Rule:** Errors return standardized error objects.

**Structure:**
```json
{
  "success": false,
  "error": "Error code",
  "message": "User-friendly message"
}
```

**Error Messages:**
- Generic (no system details)
- User-friendly
- Actionable when possible

---

## 8. API Reference

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

## 9. Security

### Threat Model

#### Threat Categories

##### 1. Input Validation Attacks
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

##### 2. Resource Exhaustion Attacks
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

##### 3. Code Injection Attacks
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

##### 4. Data Exfiltration
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

### Sandboxing Rules

#### Isolation Principles

##### Principle 1: Unique Temporary Directory
**Rule:** Each conversion executes in a unique, isolated temporary directory.

**Requirements:**
- Directory created with UUID-based name
- Permissions: 0o700 (owner-only access)
- Located in system temp directory
- Deleted after conversion completion (success or failure)

##### Principle 2: No Network Access
**Rule:** Conversion modules must not have network access during execution.

**Enforcement:**
- Network access attempts are detected and blocked
- Violations result in immediate conversion termination
- Security event logged

##### Principle 3: Restricted File System Access
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

##### Principle 4: Resource Limits
**Rule:** Each conversion has strict resource limits enforced by the pipeline.

**Limits:**
- CPU: 100% of single core (default)
- Memory: 512 MB (default, configurable)
- Time: 30 seconds (default, configurable)
- File size: 10 MB input (default, configurable)

### Resource Limits

#### Time Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Conversion Timeout | 30 seconds | 300 seconds | Process termination (SIGTERM → SIGKILL) |
| Token Expiration | 60 seconds | 300 seconds | Token validation |
| Request Timeout | 30 seconds | 60 seconds | HTTP timeout |

#### Memory Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Per-Conversion Memory | 512 MB | 2 GB | Process monitoring + termination |
| Total System Memory | 2 GB | 4 GB | Graceful degradation |
| Input File Size | 10 MB | 50 MB | Pre-validation |

#### CPU Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Per-Process CPU | 100% (1 core) | 100% (1 core) | Process priority |
| Total System CPU | 80% | 95% | Graceful degradation |

#### Concurrency Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Concurrent Conversions | 5 | 10 | Semaphore/queue |
| Pending Requests | 20 | 50 | Request queue |

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

---

## 10. Configuration

### Resource Limits

See [Security - Resource Limits](#resource-limits) section above.

### Execution Profiles

Execution profiles define resource limits and execution parameters for different use cases.

**Default Profile:**
- Timeout: 30 seconds
- Memory: 512 MB
- CPU: 100% (1 core)
- Concurrent: 5 conversions

**Strict Profile:**
- Timeout: 10 seconds
- Memory: 256 MB
- CPU: 50% (1 core)
- Concurrent: 2 conversions

**Permissive Profile:**
- Timeout: 60 seconds
- Memory: 1 GB
- CPU: 100% (1 core)
- Concurrent: 10 conversions

### Logging Policy

**Log Location:** `api/logs/`  
**Log Format:** JSON  
**Log Retention:** 30 days (default)  
**Log Size Limit:** 10 MB per log file

**Logged Information:**
- Conversion ID
- Timestamp
- Module execution order
- Duration
- Status (success/failure)
- Error messages (sanitized)

**Not Logged:**
- User content
- System paths
- Sensitive data
- Personal information

### Paths and Storage

**Temporary Directory:** System temp directory (`/tmp` on Unix, `%TEMP%` on Windows)  
**Logs Directory:** `api/logs/`  
**Configuration:** Local files (environment variables, config files)

---

## 11. Local-First Principles

### Core Principles

#### Principle 1: No External Dependencies
**Rule:** Core functionality must not depend on external services.

**Requirements:**
- No API calls to external services
- No cloud dependencies
- No internet connection required
- All engines run locally

**Rationale:** Ensures reliability, privacy, and offline operation.

#### Principle 2: Data Locality
**Rule:** All data remains on the local system.

**Requirements:**
- No data transmission to external servers
- No cloud storage
- No external logging services
- All processing local

**Rationale:** Privacy, security, and performance.

#### Principle 3: Offline Operation
**Rule:** System must function without network connectivity.

**Requirements:**
- All features work offline
- No network checks required
- No online activation
- No telemetry (unless explicitly enabled)

**Rationale:** Reliability and user control.

#### Principle 4: Resource Efficiency
**Rule:** System must be resource-efficient.

**Requirements:**
- Minimal memory footprint
- Efficient CPU usage
- Lazy loading of modules
- Resource limits enforced

**Rationale:** Suitable for local deployment, low-resource systems.

#### Principle 5: User Control
**Rule:** Users have full control over the system.

**Requirements:**
- No forced updates
- Configurable behavior
- User-controlled data
- Transparent operation

**Rationale:** User autonomy and trust.

### Implementation Guidelines

#### Network Access
**Rule:** Network access is forbidden during conversion.

**Enforcement:**
- Network monitoring (V2)
- Sandboxing prevents network access
- Security violations logged

#### External Services
**Rule:** No external service dependencies.

**Exceptions:**
- Optional telemetry (user-enabled)
- Optional update checks (user-enabled)
- Documentation links (read-only)

#### Data Storage
**Rule:** All data stored locally.

**Locations:**
- Temporary files: System temp directory
- Logs: `api/logs/` directory
- Configuration: Local files
- User data: LocalStorage (frontend)

#### Resource Management
**Rule:** Efficient resource usage.

**Strategies:**
- Lazy loading of modules
- Resource limits per conversion
- Cleanup after each conversion
- No resource accumulation

---

## 12. Roadmap

### Current Status

**Version:** 0.0.1.2.2 alpha  
**Status:** Active development  
**Focus:** Core functionality and stability

### Planned Releases

#### 0.0.2.0 beta
**Target Date:** TBD  
**Focus:** Stability and format expansion

**Planned Features:**
- HTML conversion support
- Plain text conversion improvements
- Enhanced error handling
- Performance optimizations
- Extended test coverage

#### 0.0.3.0
**Target Date:** TBD  
**Focus:** Format expansion

**Planned Features:**
- PDF conversion support
- YAML/JSON conversion support
- Extended format matrix
- Format detection improvements

#### 0.1.0.0
**Target Date:** TBD  
**Focus:** Production readiness

**Planned Features:**
- Security enhancements (V2)
- Network isolation
- User isolation
- Enhanced sandboxing
- Production-grade error handling
- Comprehensive documentation

#### 0.2.0.0
**Target Date:** TBD  
**Focus:** Advanced features

**Planned Features:**
- DOCX/RTF conversion (via docverter)
- Office document support (via panwriter)
- Advanced normalization options
- Custom execution profiles
- API rate limiting

#### 1.0.0.0
**Target Date:** TBD  
**Focus:** Feature complete

**Planned Features:**
- Full format matrix support
- Enterprise security features
- Compliance features (ISO 27001, NIST, GDPR)
- Advanced monitoring
- Custom integrations

### Long-Term Vision

#### Format Support
**Goal:** Support all common document formats

**Planned Formats:**
- Text formats: AsciiDoc, Markdown, HTML, TXT, RTF
- Office formats: DOCX, XLSX, PPTX, ODT, ODS, ODP
- Data formats: YAML, JSON, XML, CSV
- Publishing formats: PDF, EPUB
- Image formats: PNG, JPG, SVG (for embedded content)

#### Security Evolution
**V1 (Current):** Light isolation, basic validation  
**V2 (Planned):** Enhanced sandboxing, network isolation  
**V3 (Future):** Full containerization, compliance features

#### Performance Goals
**Current:**
- Single conversion: < 5 seconds (typical)
- Concurrent: 5 conversions

**Target:**
- Single conversion: < 2 seconds (typical)
- Concurrent: 20+ conversions
- Batch processing: 100+ files

---

## 13. Glossary

### A

**AsciiDoc**  
A lightweight markup language for writing documents. Supported input and output format in Ascend.

### B

**BOM (Byte Order Mark)**  
A Unicode character used to indicate text encoding. Removed by Ascend's normalization process.

**Batch Processing**  
Processing multiple files in a single operation with progress tracking.

### C

**Canonical**  
Authoritative, definitive reference. Documents marked as canonical are the source of truth.

**Conversion**  
Process of transforming a document from one format to another.

**Conversion ID**  
Unique identifier (UUID) assigned to each conversion operation.

**Converter**  
Module that performs format conversion (e.g., downdoc, pandoc).

### D

**Downdoc**  
JavaScript library for converting AsciiDoc to Markdown. Used by Ascend's downdoc module.

### E

**Engine**  
Conversion engine or module that performs format transformation.

**Execution Profile**  
Configuration profile defining resource limits and execution parameters.

### F

**Format**  
Document format identifier (e.g., `markdown`, `asciidoc`, `html`).

**Format Whitelist**  
List of formats explicitly allowed for conversion. Formats not in whitelist are rejected.

### I

**Isolation**  
Principle that each conversion executes in complete isolation from others.

### L

**Lazy Loading**  
Technique of loading modules only when needed, reducing initial memory footprint.

**Local-First**  
Architecture principle where all processing occurs locally without external dependencies.

### M

**Markdown**  
Lightweight markup language. Supported input and output format in Ascend.

**Module**  
Independent conversion unit conforming to the standard module interface.

**Module Interface**  
Standard contract that all conversion modules must implement.

### N

**Normalization**  
Process of standardizing text representation (encoding, characters, formatting).

### O

**Orchestrator**  
Component that coordinates conversion execution and module selection.

### P

**Pandoc**  
Universal document converter. Used by Ascend for Markdown → AsciiDoc and other conversions.

**Pipeline**  
Sequence of stages that process a conversion from input to output.

**Placeholder**  
Module that is defined but not yet implemented. Returns error if called.

### S

**Sandboxing**  
Isolation technique that restricts module access to system resources.

**Smart Quotes**  
Typographic quotation marks (curly quotes) that are normalized to standard ASCII quotes.

### T

**Temporary Directory**  
Unique, isolated directory created for each conversion. Deleted after completion.

**Token**  
Cryptographically secure token used for conversion confirmation.

### U

**UUID**  
Universally Unique Identifier. Used for conversion IDs and temporary directory names.

### W

**Whitelist**  
List of explicitly allowed values. Anything not in the whitelist is rejected.

---

## 14. Changelog

### 0.0.1.2.2 alpha (2026-01-19)

#### Added
- Complete documentation reorganization
- Canonical reference structure (`doc/references/`)
- New documentation categories (core, configuration, security, conversion, API, UI, profiles)
- Specifications directory (`doc/specs/`)
- Glossary and changelog
- Module interface specification

#### Changed
- Documentation structure reorganized for future-proof machine-readable configuration
- All documentation now in English (technical precision)
- Clear separation between canonical references and specifications
- Documentation ready for 1:1 mapping to `ascend.reference.json`

### 0.0.1.2.1 alpha (2026-01-19)

#### Added
- Environment diagnostic script (`api/backend/bin/check-env.js`)
- Data normalization proxy (`api/backend/services/proxy/secure-proxy.js`)
- Batch processing service (`api/frontend/services/bulk-processor.ts`)
- Comprehensive documentation reorganization

#### Changed
- Documentation structure reorganized into canonical references
- Version synchronization across all components
- README updated to reflect current limitations

#### Fixed
- Import path corrections in orchestrator modules
- Backend startup issues resolved

### 0.0.1.1 alpha (2026-01-19)

#### Added
- Initial release
- AsciiDoc ↔ Markdown conversion
- Basic UI
- Security framework (V1)
- Conversion options system

---

**End of Documentation**
