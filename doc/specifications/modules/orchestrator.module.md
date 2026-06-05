# Orchestrator Module

## Description

The `orchestrator` module is a mini-orchestrator that manages a linear conversion flow by chaining multiple conversion modules in sequence. This module creates a unique temporary directory for each conversion, executes the necessary modules one after another, and guarantees resource cleanup even in case of error.

## Module Name

**Identifier:** `orchestrator`  
**Type:** Linear orchestrator module  
**Role:** Management of multi-step linear conversion flow

## Objective

Enable conversion of a source file to a target format by passing through multiple conversion modules in sequence, when direct conversion is not available. The module automatically manages the creation and cleanup of intermediate temporary files.

## Functioning

### Linear Execution Flow

The module orchestrates a simple and predictable linear flow:

1. **Parameter Reception:** Source file, source format, target format
2. **Conversion Path Determination:** Identification of necessary modules
3. **Temporary Directory Creation:** Unique and isolated directory for the conversion
4. **Sequential Execution:** Each module is executed one after another
5. **Cleanup:** Temporary directory deletion (even in case of error)

### Flow Example

For a `AsciiDoc → Markdown → AsciiDoc` conversion:

```
Input: document.adoc (AsciiDoc)
  ↓
Step 1: downdoc module
  ↓
Intermediate: step1_output.md (Markdown)
  ↓
Step 2: pandoc module
  ↓
Output: final_output.adoc (AsciiDoc)
```

## Main Interface: `executeLinearConversion`

### Signature

```typescript
executeLinearConversion(inputFilePath: string, sourceFormat: string, targetFormat: string, options?: Object): Promise<ModuleResult>
```

### Functioning Description

The `executeLinearConversion` method orchestrates the execution of a linear conversion according to the following process:

#### 1. Input Validation

- Verifies that the source file exists
- Validates source and target formats

#### 2. Conversion Path Determination

The module automatically determines the sequence of necessary modules:

- **Direct Conversion:** If a converter directly supports the conversion, a single module is used
- **Conversion via Intermediate Format:** If direct conversion is not available, the module attempts to pass through an intermediate format (e.g., Markdown)
- **Security Limit:** Maximum 10 steps to avoid infinite loops

#### 3. Temporary Directory Creation

- Creates a unique temporary directory in `{tmpdir}/ascend-orchestrator/{conversionId}`
- The directory is isolated and secured (permissions 0o700)
- Each conversion has its own directory, no shared state

#### 4. Sequential Module Execution

For each conversion step:

- Copies the input file into the temporary directory (for the first step)
- Determines input and output paths
- Executes the module via `converter-orchestrator.executeConversion()`
- Verifies step success
- Uses the output as input for the next step

#### 5. Final Result Reading

- Reads the final output file from the temporary directory
- Returns the content in the result

#### 6. Systematic Cleanup

- The temporary directory is **always** cleaned, even in case of error
- Uses a `finally` block to guarantee cleanup
- Cleanup errors are logged but do not interrupt the flow

### Parameters

- **`inputFilePath`** (required): `string`
  - Absolute path to the source file to convert
  - The file must exist and be readable

- **`sourceFormat`** (required): `string`
  - Source format (markdown, asciidoc, html, txt, etc.)
  - Must match the actual file format

- **`targetFormat`** (required): `string`
  - Desired destination format (markdown, asciidoc, html, pdf, etc.)

- **`options`** (optional): `Object`
  - Specific conversion options
  - `conversionId`: Conversion ID for logs (optional, automatically generated if absent)
  - Other options passed to individual modules

### Return Value

The method returns a `Promise` that resolves with a `ModuleResult` object:

```typescript
{
  success: boolean,        // true if conversion successful, false otherwise
  logs: string | string[], // Execution logs (orchestrator + modules)
  error: string | null,   // Error message or null
  duration: number,       // Total duration in seconds
  outputFile?: string,    // Output file path (if success)
  outputContent?: string, // Output file content (if success)
  stepsExecuted?: number  // Number of steps executed (if success)
}
```

## Temporary Directory Management

### Creation

- **Location:** `{tmpdir}/ascend-orchestrator/{conversionId}`
- **Permissions:** 0o700 (read/write/execute for owner only)
- **Isolation:** Each conversion has its own unique directory
- **Security:** No access from outside the pipeline

### Internal Structure

```
{workDir}/
  ├── step0_input.{ext}      # Copy of source file
  ├── step1_output.{ext}     # Step 1 output (if multi-step)
  ├── step2_output.{ext}     # Step 2 output (if multi-step)
  └── final_output.{ext}     # Final file
```

### Cleanup

- **Guarantee:** Cleanup is **always** performed, even in case of error
- **Method:** Uses `rmSync` with `recursive: true` and `force: true`
- **Robustness:** Cleanup errors are logged but do not interrupt the flow
- **Timing:** Cleanup performed in the method's `finally` block

## Communication with converter-orchestrator

The `orchestrator` module communicates with the `converter-orchestrator` to avoid system overload:

### Load Control Sharing

- **Centralized Management:** The linear orchestrator manages load control for the entire multi-step conversion
- **Internal Calls:** Calls to converter-orchestrator from the linear orchestrator are marked with `_internal: true`
- **No Double Counting:** Individual steps do not acquire a separate concurrency slot
- **Unified Tracking:** All successes and failures are recorded in the controlled degradation manager

### Protection Mechanisms

1. **Overload Check:** Before starting, the linear orchestrator checks if the system can accept a new conversion
2. **Slot Acquisition:** A single concurrency slot is acquired for the entire multi-step conversion
3. **Resource Budget:** A resource budget is initialized for the entire conversion
4. **Result Recording:** Successes and failures are recorded for system load tracking

## Security and Isolation

### Minimal Security Obligations (V1)

The module respects the minimal security obligations defined in [modules.interface.md](../modules.interface.md):

#### 1. Strict Isolation

- **Unique Temporary Directory:** Each conversion has its own isolated directory
- **No Shared State:** No data is shared between two conversions
- **Restrictive Permissions:** Directory created with permissions 0o700

**Normative References:** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 2. Secure Error Handling

- **Exhaustive Capture:** All exceptions are captured and transformed into `ModuleResult` with `success: false`
- **No Global Crash:** No unhandled exception propagates to the main pipeline
- **Guaranteed Cleanup:** Cleanup is performed even in case of error

**Normative References:** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 3. Minimal Logging

- **Conversion ID:** The module includes the unique conversion ID in its logs
- **Timestamping:** The module records the start and end execution timestamp
- **Execution Logs:** The module produces logs describing each step
- **Final Status:** The module includes the final status (success/failure) in returned logs

**Normative References:** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 4. Security Limits

- **Maximum Steps:** Limit of 10 steps to avoid infinite loops
- **Path Validation:** File paths are validated before use
- **No Network Access:** The module must not access the network during execution

**Normative References:** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Execution Constraints

- **Isolation:** The module does not modify existing wrappers, it only orchestrates them
- **Linearity:** The flow remains simple and linear, no complex logic
- **Security:** The module delegates security to individual modules according to their obligations

## Expected Behavior

### On Success

1. The conversion path is determined and validated
2. The temporary directory is created
3. All steps are executed successfully
4. The final output file is created and read
5. The temporary directory is cleaned
6. The module returns a `ModuleResult` with `success: true`, `error: null`, detailed logs, execution duration, and additional information (`outputFile`, `outputContent`, `stepsExecuted`)

### On Failure

1. If the source file does not exist, the module immediately returns a `ModuleResult` with `success: false`
2. If no conversion path is found, the module returns a `ModuleResult` with `success: false`
3. If a step fails, the error is captured and transformed into a `ModuleResult` with `success: false`
4. The temporary directory is **always** cleaned, even in case of error
5. The module returns a `ModuleResult` with `success: false`, a descriptive error message in `error`, logs up to the failure point, and duration up to failure

### Possible Error Types

- **Source File Error:** The source file does not exist or is not readable
- **Conversion Path Error:** No conversion path was found
- **Step Error:** A conversion step failed (error captured and standardized)
- **Orchestration Error:** Error during flow execution (error captured and standardized)
- **Cleanup Error:** Temporary directory cleanup failed (logged but does not interrupt flow)

## Notes

### Flow Simplicity

The module is designed to be simple and linear:

- **No Complex Logic:** The flow remains predictable and easy to debug
- **Sequential Execution:** Modules are executed one after another, not in parallel
- **No Automatic Retry:** If a step fails, the conversion fails immediately

### Dependencies

The module depends on:

- **lazyload.module.js:** For module loading
- **converter-orchestrator.module.js:** For individual conversion execution
- **Conversion Modules:** Individual modules (downdoc, pandoc, etc.)

### Extensibility

The module can be extended for:

- **Path Strategies:** Add other strategies to determine the conversion path (e.g., via multiple intermediate formats)
- **Optimizations:** Parallelization of certain steps if necessary
- **Cache:** Caching of intermediate results to optimize performance

### Limitations

- **Linear Flow Only:** The module does not support complex flows with branches or conditions
- **Simple Intermediate Format:** The current strategy uses only Markdown as an intermediate format
- **No Content Validation:** The module does not validate the content of intermediate files

## Compliance

This module strictly respects the interface defined in [modules.interface.md](../modules.interface.md) and the minimal security obligations of version 1. Any modification of the module must maintain this compliance.

## References

- [modules.interface.md](../modules.interface.md) - Module interface contract
- [lazyload.module.md](./lazyload.module.md) - Lazy loading module
- [converter-orchestrator.module.md](./converter-orchestrator.module.md) - Converter orchestrator module
- [PIPELINE.md](../../PIPELINE.md) - Conversion pipeline specification
- [downdoc.module.md](./downdoc.module.md) - Downdoc module
- [pandoc.module.md](./pandoc.module.md) - Pandoc module
