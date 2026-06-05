# Conversion Reference

## Purpose

This document defines the canonical conversion references for Ascend, including pipeline behavior, error handling, and fallback strategies. It serves as the authoritative reference for all conversion operations.

---

## Conversion Pipeline

### Purpose

This section defines the canonical conversion pipeline behavior for Ascend. It describes the lifecycle of a conversion, the stages involved, and the rules that govern execution.

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

---

## Error Handling

### Purpose

This section defines the canonical error handling rules for Ascend. It specifies error codes, error messages, and handling strategies.

### Error Categories

#### Validation Errors

**Category:** Input validation failures

**Error Codes:**
- `VALIDATION_ERROR`: General validation failure
- `FILE_VALIDATION_ERROR`: File validation failure
- `FORMAT_VALIDATION_ERROR`: Format validation failure
- `SIZE_LIMIT_EXCEEDED`: File size exceeds limit

**Behavior:**
- Reject immediately
- No resources allocated
- Clear error message returned

#### Execution Errors

**Category:** Errors during conversion execution

**Error Codes:**
- `CONVERSION_FAILED`: Conversion module failed
- `EXECUTION_ERROR`: Process execution error
- `OUTPUT_MISSING`: Output file not created
- `BINARY_NOT_FOUND`: Required binary not found

**Behavior:**
- Terminate conversion
- Cleanup resources
- Log error details
- Return generic error to user

#### Timeout Errors

**Category:** Conversion exceeded time limit

**Error Code:** `TIMEOUT`

**Behavior:**
- Force terminate process (SIGTERM → SIGKILL)
- Cleanup resources
- Log timeout event
- Return timeout error

#### Resource Errors

**Category:** Resource limit violations

**Error Codes:**
- `RESOURCE_LIMIT_EXCEEDED`: Resource limit exceeded
- `MEMORY_LIMIT_EXCEEDED`: Memory limit exceeded
- `CPU_LIMIT_EXCEEDED`: CPU limit exceeded

**Behavior:**
- Terminate process immediately
- Cleanup resources
- Log violation details
- Return resource error

#### Security Errors

**Category:** Security violations

**Error Codes:**
- `SECURITY_VIOLATION`: General security violation
- `UNAUTHORIZED_ACCESS`: Unauthorized file access
- `PATH_TRAVERSAL`: Path traversal attempt
- `NETWORK_ACCESS_DENIED`: Network access attempt

**Behavior:**
- Terminate immediately
- Log security event
- Return generic error (no details)
- Alert security monitoring (if configured)

### Error Response Format

#### Standard Error Response

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

### Error Message Rules

#### Rule 1: Generic Messages
- No system details
- No file paths
- No internal error information

#### Rule 2: User-Friendly
- Clear and actionable
- Explain what went wrong
- Suggest resolution when possible

#### Rule 3: Consistent
- Same error code = same message
- Predictable error responses
- Documented error codes

### Error Logging

#### Log Content

**Included:**
- Error code
- Conversion ID
- Timestamp
- Module name (if applicable)
- Sanitized error details

**Excluded:**
- User content
- System file paths
- Stack traces (in user-facing errors)
- Sensitive data

#### Log Levels

- **ERROR:** Conversion failures, security violations
- **WARN:** Resource warnings, validation issues
- **INFO:** Normal operation events

### Error Recovery

#### Automatic Recovery

**Rule:** No automatic retry of failed conversions.

**Rationale:**
- Prevents infinite loops
- User controls retry
- Clear failure state

#### Manual Recovery

**Rule:** Users can retry failed conversions.

**Process:**
1. User receives error
2. User fixes issue (if applicable)
3. User retries conversion
4. New conversion ID generated

---

## Fallback Strategies

### Purpose

This section defines the canonical fallback strategies used by Ascend when primary conversion methods fail or are unavailable.

### Fallback Principles

#### Principle 1: No Silent Fallbacks

**Rule:** Fallbacks must be explicit and logged.

**Rationale:**
- User awareness of fallback usage
- Audit trail of fallback decisions
- Debugging and troubleshooting

#### Principle 2: Graceful Degradation

**Rule:** System degrades gracefully when primary methods unavailable.

**Behavior:**
- Clear error messages
- No partial conversions
- Clean failure state

#### Principle 3: Format-Specific Fallbacks

**Rule:** Fallbacks are format-specific, not generic.

**Rationale:**
- Maintains conversion quality
- Prevents format corruption
- Clear error when no fallback available

### Fallback Scenarios

#### Scenario 1: Module Unavailable

**Situation:** Required conversion module is not available.

**Fallback:** None

**Behavior:**
- Conversion rejected immediately
- Clear error: "Conversion module not available"
- No attempt at alternative conversion

**Rationale:** Prevents format corruption from incompatible modules.

#### Scenario 2: Module Execution Failure

**Situation:** Module execution fails (crash, error).

**Fallback:** None

**Behavior:**
- Conversion marked as failed
- Error logged with details
- No retry with alternative module

**Rationale:** Failure indicates fundamental issue, not temporary problem.

#### Scenario 3: Timeout

**Situation:** Conversion exceeds time limit.

**Fallback:** None

**Behavior:**
- Process terminated
- Conversion marked as failed
- Error: "Conversion timeout"

**Rationale:** Timeout indicates problem, not recoverable condition.

#### Scenario 4: Resource Limit Exceeded

**Situation:** Resource limit (memory, CPU) exceeded.

**Fallback:** None

**Behavior:**
- Process terminated
- Conversion marked as failed
- Error: "Resource limit exceeded"

**Rationale:** Resource limits are hard constraints.

### No-Fallback Policy

#### Rationale

**Rule:** Ascend does not implement automatic fallbacks.

**Reasons:**
1. **Format Integrity:** Fallbacks may corrupt format
2. **Predictability:** Users expect consistent behavior
3. **Error Clarity:** Clear errors better than silent fallbacks
4. **Security:** Fallbacks may introduce vulnerabilities

#### User-Controlled Alternatives

**Rule:** Users can manually select alternative conversion paths.

**Process:**
1. User receives error
2. User selects alternative format/module
3. User initiates new conversion
4. New conversion with different parameters

### Future Considerations

#### Potential Fallbacks (Not Implemented)

**Note:** These are potential future enhancements, not current behavior.

- **Format Approximation:** Convert to similar format when exact unavailable
- **Simplified Conversion:** Strip features when full conversion fails
- **Multi-Step Fallback:** Try alternative conversion paths automatically

**Status:** These are design considerations for future versions, not current policy.

---

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Pipeline lifecycle
- Execution stages
- Module selection
- Error handling
- Error codes and categories
- Error response format
- Error message rules
- Logging requirements
- Fallback policies
- No-fallback rationale
- Error handling when no fallback
- Future considerations

Any changes to conversion behavior must be reflected here first, then propagated to implementation code.
