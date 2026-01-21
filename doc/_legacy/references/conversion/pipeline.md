> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Conversion Pipeline

## Purpose

This document defines the canonical conversion pipeline behavior for Ascend. It describes the lifecycle of a conversion, the stages involved, and the rules that govern execution.

## Pipeline Principles

### Principle 1: Strict Isolation

**Rule:** Each conversion executes in complete isolation from all other conversions.

**Requirements:**
- Unique temporary directory per conversion
- No shared state between conversions
- No interference between concurrent conversions
- Guaranteed cleanup after completion

### Principle 2: File-Based Communication

**Rule:** Modules communicate exclusively through files.

**Requirements:**
- Input file provided to module
- Output file created by module
- No direct inter-module communication
- No shared memory or variables

### Principle 3: Linear Execution

**Rule:** Conversion steps execute sequentially in a linear flow.

**Requirements:**
- Steps executed one after another
- Output of step N becomes input of step N+1
- No parallel execution of steps
- Clear execution order

## Conversion Lifecycle

### Phase 1: Initialization

**Duration:** < 1 second

**Steps:**
1. Generate unique conversion ID (UUID)
2. Create unique temporary directory
3. Validate user confirmation (if required)
4. Validate input content
5. Validate conversion format pair (whitelist)

**Validation Failures:** Conversion rejected immediately, no resources allocated.

### Phase 2: Preparation

**Duration:** < 1 second

**Steps:**
1. Determine file extensions (source and target)
2. Generate absolute file paths (within temp directory)
3. Write input file to temp directory
4. Validate paths (prevent traversal)

**Path Validation:** All paths must be within temp directory.

### Phase 3: Execution

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

### Phase 4: Finalization

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

### Phase 5: Cleanup

**Duration:** < 1 second

**Steps:**
1. Delete temporary directory recursively
2. Log cleanup errors (non-fatal)
3. Release resources
4. Decrement concurrency counter

**Cleanup Guarantee:** Cleanup always executes, even on error.

## Module Selection

### Selection Rules

1. Check module `supportedFormats.from` includes source format
2. Check module `supportedFormats.to` includes target format
3. Verify module is available (not placeholder)
4. Select first matching module

### Fallback Strategy

If no module matches:
- Conversion rejected with clear error
- No fallback to alternative modules
- Error logged

## Error Handling

### Error Categories

| Category | Behavior | Example |
|----------|----------|---------|
| Validation Error | Reject immediately | Invalid format |
| Execution Error | Terminate, cleanup | Module crash |
| Timeout | Force kill, cleanup | Process hangs |
| Resource Limit | Terminate, cleanup | Memory exceeded |

### Error Response

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

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Pipeline lifecycle
- Execution stages
- Module selection
- Error handling
