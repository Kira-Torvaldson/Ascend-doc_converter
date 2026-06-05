# Pandoc Module

## Description

The `pandoc` module is a wrapper for the universal conversion tool Pandoc that converts documents between many formats. This module implements the interface defined in [modules.interface.md](../modules.interface.md) and respects the minimal security obligations of version 1.

## Module Name

**Identifier:** `pandoc`  
**Type:** Multi-format conversion module  
**Underlying tool:** Pandoc (external system binary)

## Supported Formats

**Input formats (`from`):**
- `markdown`: Standard Markdown format
- `asciidoc`: Standard AsciiDoc format
- `html`: HTML format
- `txt`: Plain text (interpreted as Markdown by Pandoc)
- `yaml`: YAML format
- `json`: JSON format

**Output formats (`to`):**
- `markdown`: Standard Markdown format
- `asciidoc`: Standard AsciiDoc format
- `html`: HTML format
- `pdf`: PDF format
- `txt`: Plain text
- `yaml`: YAML format
- `json`: JSON format

**Structure:**
```typescript
supportedFormats: {
  from: ['markdown', 'asciidoc', 'html', 'txt', 'yaml', 'json'],
  to: ['markdown', 'asciidoc', 'html', 'pdf', 'txt', 'yaml', 'json']
}
```

**Note:** Authorized conversions are defined by a strict whitelist. Only format combinations listed in the whitelist can be executed.

## `run` Method

### Signature

```typescript
run(inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

### Operation Description

The `run` method performs the conversion of a file from one format to another according to the following process:

#### 1. Input validation

- The module validates that the input file exists and is accessible
- The module checks file size (according to configured limits)
- The module verifies that the file type corresponds to the declared format (basic validation by extension)
- The module validates that the format combination (from/to) is authorized by the whitelist
- If validations fail, the module immediately returns a `ModuleResult` with `success: false`

#### 2. Pandoc binary existence check

- The module verifies that the Pandoc binary is available at the configured path
- The default path is `/usr/bin/pandoc` but can be overridden via the `PANDOC_PATH` environment variable
- If the binary is not found, the module returns a `ModuleResult` with `success: false` and an appropriate error message

#### 3. Secure Pandoc command construction

- The module constructs Pandoc arguments from the whitelist of authorized conversions
- Arguments are constructed securely:
  - Source format (`-f`) and destination format (`-t`) come from the whitelist
  - Output path (`-o`): secure absolute path provided by the pipeline
  - Input path: secure absolute path provided by the pipeline
- No user argument is used directly in the command

#### 4. Secure execution via child_process.spawn

- The module executes Pandoc using `child_process.spawn` (never `exec` or `execSync`)
- The process is launched with:
  - Working directory (`cwd`): parent directory of the input file (isolated temporary directory)
  - `stdio`: `['ignore', 'pipe', 'pipe']` to ignore stdin and capture stdout/stderr
- The module captures standard output (stdout) and error output (stderr) separately

#### 5. Timeout management

- The module applies a configurable timeout (default: 30 seconds)
- If the timeout is exceeded:
  - The process is interrupted with `SIGTERM`
  - If the process does not terminate within 5 seconds, it is killed with `SIGKILL`
  - The module returns a `ModuleResult` with `success: false` and a timeout error message

#### 6. Output handling

- Pandoc writes directly to the output file (`outputPath`) via the `-o` argument
- The module verifies that the output file was created and is valid
- Standard output (stdout) is captured for logs but is generally not used for content (Pandoc writes to the file)
- Error output (stderr) is captured for logs and diagnosis

#### 7. Result validation

- The module verifies that the output file exists and is not empty
- The module verifies the Pandoc process exit code (0 = success, other = failure)
- If the exit code indicates failure, the module returns a `ModuleResult` with `success: false` and stderr error messages

#### 8. Result return

- The module returns a `ModuleResult` object conforming to the contract defined in [modules.interface.md](../modules.interface.md)
- The `success` field must be `true` if conversion succeeded (exit code 0 and valid output file), `false` otherwise
- The `logs` field must contain execution logs (start, arguments used, Pandoc stderr output, end)
- The `error` field must be `null` on success, or contain a descriptive error message on failure
- The `duration` field must contain the total execution duration in seconds (validation, execution, verification)

### Parameters

- **`inputPath`** (required): Absolute path to input file to convert
- **`outputPath`** (required): Absolute path to output file to create
- **`options`** (optional): Object containing conversion options
  - `fromFormat`: Source format (required to determine conversion)
  - `toFormat`: Destination format (required to determine conversion)
  - `conversionId`: Conversion ID for logs (optional)
  - `timeout`: Timeout in milliseconds (optional, default: 30000)

### Return Value

The method returns a `Promise` that resolves with a `ModuleResult` object:

```typescript
{
  success: boolean,        // true if conversion succeeded, false otherwise
  logs: string | string[], // Execution logs (includes Pandoc stderr)
  error: string | null,   // Error message or null
  duration: number        // Duration in seconds
}
```

## Security and Isolation

### Minimal Security Obligations (V1)

The module respects the minimal security obligations defined in [modules.interface.md](../modules.interface.md):

#### 1. Basic input validation

- **Size check**: The module validates that the input file does not exceed the configured maximum limit
- **Type check**: The module validates that the file corresponds to the declared format (by extension or basic content validation)
- **Whitelist validation**: The module validates that the format combination (from/to) is authorized by the strict whitelist
- **Immediate rejection**: If validations fail, the module immediately returns a `ModuleResult` with `success: false` and an appropriate error message

**Normative references:** ISO 27001 (A.9.4.2), ISO 27002 (A.9.4.2), NIST SP 800-53 (SI-7), OWASP Top 10 (A03:2021)

#### 2. Light isolation

- **No direct interaction**: The module does not interact directly with the rest of the system outside the `inputPath` and `outputPath` paths provided by the pipeline
- **Execution in isolated context**: The module executes in a unique temporary directory per conversion, provided by the pipeline
- **Isolated working directory**: The Pandoc process is launched with `cwd` pointing to the parent directory of the input file (isolated temporary directory)
- **No network access**: The module must not access the network during execution (guaranteed by the execution environment)

**Normative references:** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 3. Secure error handling

- **Exhaustive capture**: All exceptions and errors must be captured and transformed into a `ModuleResult` with `success: false`
- **No global crash**: No unhandled exception must propagate to the main pipeline
- **Secure error messages**: Error messages must not expose sensitive system details (full paths, environment variables, complete stack traces)
- **Consistency**: In case of error, the module must not create an output file, or must delete it if partially created
- **Timeout handling**: Processes that exceed the timeout are properly interrupted (SIGTERM then SIGKILL if necessary)

**Normative references:** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 4. Minimal logging

- **Conversion ID**: The module must include the unique conversion ID in its logs (provided by the pipeline via options)
- **Timestamp**: The module must record the timestamp of execution start and end
- **Execution logs**: The module must produce logs describing main steps (validation, execution, verification)
- **Stderr capture**: Pandoc error messages (stderr) are captured and included in logs
- **Final status**: The module must include the final status (success/failure) and exit code in returned logs

**Normative references:** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Light integrity verification

- **Binary verification**: The module verifies that the Pandoc binary exists at the configured path before execution
- **Dependency documentation**: The module must document its dependencies (Pandoc and its required version)
- **Modification reporting**: The module may report any detected modification of binary integrity (optional in V1)

**Normative references:** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Execution Constraints

- **Isolation**: The module must not modify the input file, must only access provided files, and must not create files outside the authorized directory
- **Performance**: The module must respect timeouts imposed by the pipeline and release resources after execution
- **Security**: 
  - The module must use `spawn` only (never `exec` or `execSync`)
  - Command arguments must come from the strict whitelist
  - No user argument must be used directly in the command
  - File paths must be validated before use

## Expected Behavior

### On Success

1. The output file is created at the `outputPath` location with the converted content
2. The output file is valid and conforms to the destination format
3. The Pandoc process exit code is 0
4. The module returns a `ModuleResult` with `success: true`, `error: null`, detailed logs, and execution duration

### On Failure

1. No output file is created (or is deleted if partially created)
2. The module returns a `ModuleResult` with `success: false`, a descriptive error message in `error`, logs up to the failure point (including Pandoc stderr), and duration until failure

### Possible Error Types

- **Validation error**: File too large, invalid file type, unauthorized format combination
- **Binary error**: Pandoc binary not found at configured path
- **Execution error**: Failure when launching the Pandoc process
- **Timeout error**: The Pandoc process exceeds the configured timeout
- **Conversion error**: Pandoc returns a non-zero exit code (invalid content, unsupported format, etc.)
- **Output file error**: The output file is not created or is invalid after execution

## Notes

### Pandoc Tool

The module uses the universal conversion tool Pandoc, which is an external system binary. This characteristic requires:

- **System installation**: Pandoc must be installed on the system and accessible via the configured path
- **External dependency**: The module depends on the availability and version of installed Pandoc
- **Performance**: Pandoc is particularly performant for complex conversions and large documents
- **Multi-format support**: Pandoc supports a wide range of document formats

### Conversion Whitelist

The module uses a strict whitelist to define authorized conversions. This approach guarantees:

- **Security**: Only validated format combinations can be executed
- **Control**: The pipeline precisely controls which conversions are permitted
- **Maintainability**: Adding new conversions requires explicit modification of the whitelist

### Secure Execution

The module uses `child_process.spawn` to execute Pandoc securely:

- **Isolation**: The process is launched in an isolated working directory
- **Output capture**: stdout and stderr are captured separately for logs
- **Timeout**: A timeout is applied to avoid blocking conversions
- **Proper interruption**: Processes that exceed the timeout are properly interrupted

### Performance

Since Pandoc is an external tool, conversion involves:

- **Startup latency**: Launching the Pandoc process introduces initial latency
- **Performance**: Pandoc is optimized for complex and large conversions
- **System resources**: Pandoc uses system resources (CPU, memory) during execution

## Compliance

This module strictly respects the interface defined in [modules.interface.md](../modules.interface.md) and the minimal security obligations of version 1. Any modification of the module must maintain this compliance.

## References

- [modules.interface.md](../modules.interface.md) - Module interface contract
- [PIPELINE.md](../PIPELINE.md) - Conversion pipeline specification
- [Pandoc Documentation](https://pandoc.org/) - Official Pandoc documentation
