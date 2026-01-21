# Orchestrator Communication

## Description

This document describes the communication architecture between two distinct orchestrators that work together to execute document conversions, avoiding overload and efficiently distributing the load.

## Orchestrator Architecture

### Main Orchestrator (`main-orchestrator.js`)

**Role:** Main orchestrator that receives user requests, chooses the conversion path, and delegates tasks to the second orchestrator.

**Responsibilities:**
- Reception of user requests (content, source and target formats)
- Content and format validation
- Conversion path determination (direct or via intermediate format)
- Load control management (overload check, concurrency slot acquisition)
- Resource budget initialization
- Temporary input file creation
- Delegation to execution orchestrator
- Success/failure recording for load tracking
- Temporary input file cleanup
- Concurrency slot release

**Main Interface:**
```typescript
executeConversionRequest(content: string, sourceFormat: string, targetFormat: string, options?: Object): Promise<ModuleResult>
```

### Execution Orchestrator (`execution-orchestrator.js`)

**Role:** Secondary orchestrator that executes conversions step by step, uses necessary modules, and returns results.

**Responsibilities:**
- Reception of conversion path and input file from main orchestrator
- Temporary directory creation for execution
- Sequential execution of conversion steps
- Use of converter-orchestrator for each step (with `_internal: true` flag)
- Intermediate file management
- Final result reading
- Temporary directory cleanup
- Result return to main orchestrator

**Main Interface:**
```typescript
executeConversionSteps(inputFilePath: string, conversionPath: Array, options?: Object): Promise<ModuleResult>
```

## Communication Flow

### 1. Request Reception

```
User → Main Orchestrator
  - Source content
  - Source format
  - Target format
  - Conversion options
```

### 2. Load Check

```
Main Orchestrator
  ↓
Checks system overload (gracefulDegradationManager)
  ↓
Acquires concurrency slot (concurrencyController)
  ↓
Initializes resource budget (resourceBudgetManager)
```

### 3. Path Determination

```
Main Orchestrator
  ↓
Determines conversion path (findConversionPath)
  ↓
Example: AsciiDoc → Markdown → AsciiDoc
  [
    { from: 'asciidoc', to: 'markdown', converter: 'auto' },
    { from: 'markdown', to: 'asciidoc', converter: 'auto' }
  ]
```

### 4. Temporary File Creation

```
Main Orchestrator
  ↓
Creates temporary input file
  - Location: {tmpdir}/ascend-main/{conversionId}_input.{ext}
  - Content: Source content provided by user
```

### 5. Delegation to Execution Orchestrator

```
Main Orchestrator → Execution Orchestrator
  - inputFilePath: Temporary input file path
  - conversionPath: Determined conversion path
  - options: Conversion options (with conversionId)
```

### 6. Step Execution

```
Execution Orchestrator
  ↓
Creates execution temporary directory
  - Location: {tmpdir}/ascend-execution/{conversionId}
  ↓
Copies input file into temporary directory
  ↓
For each step:
  - Executes via converter-orchestrator (with _internal: true)
  - Uses output as input for next step
  ↓
Reads final result
```

### 7. Result Return

```
Execution Orchestrator → Main Orchestrator
  {
    success: boolean,
    logs: string[],
    error: string | null,
    duration: number,
    outputContent: string,
    stepsExecuted: number
  }
```

### 8. Cleanup and Release

```
Main Orchestrator
  ↓
Records success/failure (gracefulDegradationManager)
  ↓
Releases concurrency slot (concurrencyController)
  ↓
Cleans temporary input file
  ↓
Returns result to user
```

## Communication Format

### Request from Main Orchestrator to Execution Orchestrator

```typescript
{
  inputFilePath: string,        // Absolute path to input file
  conversionPath: Array<{        // Conversion path
    from: string,                // Step source format
    to: string,                  // Step target format
    converter: string            // 'auto' (determined by converter-orchestrator)
  }>,
  options: {
    conversionId: string,        // Unique conversion ID
    _internal: true,             // Flag indicating internal call
    // ... other options
  }
}
```

### Response from Execution Orchestrator to Main Orchestrator

```typescript
{
  success: boolean,               // Execution status
  logs: string | string[],       // Execution logs
  error: string | null,         // Error message or null
  duration: number,              // Duration in seconds
  outputContent: string,         // Final file content (if success)
  stepsExecuted: number,         // Number of steps executed
  outputFile?: string,           // Final file path (optional)
  workDirectory?: string         // Temporary directory used (optional)
}
```

## Temporary Directory Management

### Main Temporary Directory

**Location:** `{tmpdir}/ascend-main/{conversionId}_input.{ext}`

**Management:**
- Created by main orchestrator
- Contains only the initial input file
- Cleaned by main orchestrator in `finally` block

**Permissions:** 0o700 (read/write/execute for owner only)

### Execution Temporary Directory

**Location:** `{tmpdir}/ascend-execution/{conversionId}/`

**Management:**
- Created by execution orchestrator
- Contains all intermediate files and final file
- Structure:
  ```
  {workDir}/
    ├── step0_input.{ext}      # Copy of source file
    ├── step1_output.{ext}      # Step 1 output (if multi-step)
    ├── step2_output.{ext}      # Step 2 output (if multi-step)
    └── final_output.{ext}     # Final file
  ```
- Cleaned by execution orchestrator in `finally` block

**Permissions:** 0o700 (read/write/execute for owner only)

### Isolation and Security

- **No Shared State:** Each conversion has its own unique temporary directories
- **Guaranteed Cleanup:** Directories are always cleaned, even in case of error
- **No External Access:** Modules only have access to paths provided by orchestrators

## Standardized Return Format

Both orchestrators return a standardized format conforming to `modules.interface.md`:

```typescript
interface ModuleResult {
  success: boolean;           // Conversion status
  logs: string | string[];    // Execution logs
  error: string | null;       // Error message (null if success)
  duration: number;           // Duration in seconds
}
```

### Additional Information

The execution orchestrator may include additional information in the result:

```typescript
{
  ...ModuleResult,
  outputContent?: string,     // Final file content
  stepsExecuted?: number,      // Number of steps executed
  outputFile?: string,         // Final file path
  workDirectory?: string      // Temporary directory used
}
```

## Security and Isolation

### Minimal Security Obligations (V1)

Both orchestrators respect the minimal security obligations defined in [modules.interface.md](../modules.interface.md):

#### 1. Strict Isolation

- **Unique Temporary Directories:** Each conversion has its own isolated directories
- **No Shared State:** No data is shared between two conversions
- **Restrictive Permissions:** Directories created with permissions 0o700

**Normative References:** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 2. Secure Error Handling

- **Exhaustive Capture:** All exceptions are captured and transformed into `ModuleResult` with `success: false`
- **No Global Crash:** No unhandled exception propagates to the main pipeline
- **Guaranteed Cleanup:** Cleanup is performed even in case of error

**Normative References:** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 3. Minimal Logging

- **Conversion ID:** Orchestrators include the unique conversion ID in their logs
- **Timestamping:** Orchestrators record the start and end execution timestamp
- **Execution Logs:** Orchestrators produce logs describing each step
- **Final Status:** Orchestrators include the final status (success/failure) in returned logs

**Normative References:** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 4. Load Control

- **Overload Check:** Main orchestrator checks overload before accepting a conversion
- **Concurrency Limit:** A single concurrency slot is acquired per conversion (managed by main orchestrator)
- **Resource Budget:** A resource budget is initialized for each conversion
- **Controlled Degradation:** Successes and failures are recorded to detect overload

**Normative References:** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Secure Communication

- **`_internal` Flag:** Calls from main orchestrator to execution orchestrator are marked with `_internal: true`
- **No Double Counting:** Individual steps do not acquire a separate concurrency slot
- **Unified Tracking:** All successes and failures are recorded in the controlled degradation manager

## Future Extensibility

### Adding New Orchestrators

The architecture allows easy addition of new orchestrators:

1. **Create the new orchestrator module:** Conforming to the standard interface
2. **Define the role:** Specialized in a type of conversion or particular strategy
3. **Integrate communication:** Use the same communication mechanisms as existing orchestrators
4. **Manage load control:** Use the same load control mechanisms

### Advanced Conversion Strategies

The system can be extended to support:

- **Multiple Intermediate Formats:** Instead of only Markdown, use multiple intermediate formats
- **Path Optimization:** Choose the shortest or fastest path
- **Parallelization:** Execute certain steps in parallel if possible
- **Cache:** Cache intermediate results to optimize performance

### Asynchronous Communication

For now, communication is synchronous. The architecture can be extended to support:

- **Queue:** Use a queue for conversions
- **Notifications:** Notify the user when conversion is complete
- **Real-time Status:** Provide real-time status of progress

## Expected Behavior

### On Success

1. Main orchestrator receives request and checks load
2. Conversion path is determined
3. Temporary input file is created
4. Execution orchestrator executes all steps successfully
5. Final result is returned to main orchestrator
6. Resources are cleaned (input file, execution directory)
7. Concurrency slot is released
8. Result is returned to user

### On Failure

1. If load check fails, main orchestrator immediately returns an error
2. If conversion path cannot be found, main orchestrator returns an error
3. If a step fails, execution orchestrator returns an error to main orchestrator
4. Resources are **always** cleaned, even in case of error
5. Concurrency slot is **always** released
6. Failure is recorded for load tracking

## Technical Notes

### Flow Simplicity

The communication flow is simple and linear:

- **No Complex Logic:** The flow remains predictable and easy to debug
- **Sequential Execution:** Steps are executed one after another
- **No Automatic Retry:** If a step fails, the conversion fails immediately

### Dependencies

Orchestrators depend on:

- **converter-orchestrator.module.js:** For individual conversion execution
- **lazyload.module.js:** For module loading
- **pipeline-security.js:** For load control and security
- **Conversion Modules:** Individual modules (downdoc, pandoc, etc.)

### Limitations

- **Linear Flow Only:** The system does not support complex flows with branches or conditions
- **Simple Intermediate Format:** The current strategy uses only Markdown as an intermediate format
- **Synchronous Communication:** Communication is synchronous (no queue)

## Compliance

Both orchestrators strictly respect the interface defined in [modules.interface.md](../modules.interface.md) and the minimal security obligations of version 1. Any modification of orchestrators must maintain this compliance.

## References

- [modules.interface.md](../modules.interface.md) - Module interface contract
- [converter-orchestrator.module.md](./converter-orchestrator.module.md) - Converter orchestrator module
- [orchestrator.module.md](./orchestrator.module.md) - Linear orchestrator module (legacy)
- [PIPELINE.md](../../PIPELINE.md) - Conversion pipeline specification
- [lazyload.module.md](./lazyload.module.md) - Lazy loading module
