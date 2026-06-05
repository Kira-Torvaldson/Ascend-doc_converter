# Text2Markdown Module

## Description

The `text2markdown` module is a wrapper for converting plain text to Markdown with automatic structure detection. This module implements the interface defined in [modules.interface.md](../modules.interface.md) and respects the minimal security obligations of version 1.

## Module Name

**Identifier:** `text2markdown`  
**Type:** Plain text to Markdown conversion module  
**Underlying library:** Native JavaScript conversion (automatic detection)

## Supported Formats

**Input formats (`from`):**
- `txt`: Plain text

**Output formats (`to`):**
- `markdown`: Standard Markdown format

**Structure:**
```typescript
supportedFormats: {
  from: ['txt'],
  to: ['markdown']
}
```

## `run` Method

### Signature

```typescript
run(inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

### Operation Description

The `run` method performs the conversion of a plain text file to Markdown according to the following process:

#### 1. Secure input file reading

- The module reads the file located at `inputPath` using UTF-8 encoding
- Reading must be performed synchronously or asynchronously depending on the implementation
- Any read error (file not found, insufficient permissions, invalid encoding) must be captured and transformed into a `ModuleResult` with `success: false`

#### 2. Input validation

- The module validates that the read content is a non-empty string
- The module checks file size (according to configured limits)
- The module verifies that the file type corresponds to plain text (basic validation by extension or content)

#### 3. In-memory conversion with automatic detection

- The module analyzes text content line by line to automatically detect structures
- Detected structures include:
  - **Titles**: Lines in uppercase, lines followed by separators (`===` or `---`)
  - **Lists**: Lines starting with markers (`-`, `*`, `+`, `1.`, `2.`, etc.)
  - **Code blocks**: Lines indented with 4 spaces or a tab
  - **Horizontal separators**: Lines containing only `---`, `***`, or `___`
  - **Links**: URLs (http://, https://, www.)
  - **Emails**: Email addresses automatically detected
- Conversion occurs entirely in memory, without creating intermediate temporary files
- The module applies formatting rules to guarantee valid Markdown

#### 4. Result post-processing

- The module applies basic cleanup to the generated Markdown:
  - Normalization of multiple blank lines (maximum 2 consecutive blank lines)
  - Normalization of file endings (single final newline)
  - Closure of open lists and code blocks
- The module guarantees that the result is valid and well-formatted Markdown

#### 5. Writing result to output file

- The module writes the converted Markdown content to the file located at `outputPath`
- Writing must be performed in UTF-8
- The output file's parent directory must exist (guaranteed by the pipeline)
- Any write error must be captured and transformed into a `ModuleResult` with `success: false`

#### 6. Result return

- The module returns a `ModuleResult` object conforming to the contract defined in [modules.interface.md](../modules.interface.md)
- The `success` field must be `true` if conversion and writing succeeded, `false` otherwise
- The `logs` field must contain execution logs (start, steps, detected structures, end)
- The `error` field must be `null` on success, or contain a descriptive error message on failure
- The `duration` field must contain the total execution duration in seconds (read, conversion, post-processing, write)

### Parameters

- **`inputPath`** (required): Absolute path to input plain text file
- **`outputPath`** (required): Absolute path to output Markdown file
- **`options`** (optional): Object containing conversion options
  - `conversionId`: Conversion ID for logs (optional)
  - Other module-specific options (to be defined according to future needs)

### Return Value

The method returns a `Promise` that resolves with a `ModuleResult` object:

```typescript
{
  success: boolean,        // true if conversion succeeded, false otherwise
  logs: string | string[], // Execution logs
  error: string | null,   // Error message or null
  duration: number        // Duration in seconds
}
```

## Security and Isolation

### Minimal Security Obligations (V1)

The module respects the minimal security obligations defined in [modules.interface.md](../modules.interface.md):

#### 1. Basic input validation

- **Size check**: The module validates that the input file does not exceed the configured maximum limit
- **Type check**: The module validates that the file corresponds to a plain text file (by extension `.txt` or basic content validation)
- **Immediate rejection**: If validations fail, the module immediately returns a `ModuleResult` with `success: false` and an appropriate error message

**Normative references:** ISO 27001 (A.9.4.2), ISO 27002 (A.9.4.2), NIST SP 800-53 (SI-7), OWASP Top 10 (A03:2021)

#### 2. Light isolation

- **No direct interaction**: The module does not interact directly with the rest of the system outside the `inputPath` and `outputPath` paths provided by the pipeline
- **Execution in isolated context**: The module executes in a unique temporary directory per conversion, provided by the pipeline
- **No temporary files**: The module does not use additional temporary files, all conversion occurs in memory
- **No network access**: The module must not access the network during execution

**Normative references:** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 3. Secure error handling

- **Exhaustive capture**: All exceptions and errors must be captured and transformed into a `ModuleResult` with `success: false`
- **No global crash**: No unhandled exception must propagate to the main pipeline
- **Secure error messages**: Error messages must not expose sensitive system details (full paths, environment variables, complete stack traces)
- **Consistency**: In case of error, the module must not create an output file, or must delete it if partially created

**Normative references:** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 4. Minimal logging

- **Conversion ID**: The module must include the unique conversion ID in its logs (provided by the pipeline via options or context)
- **Timestamp**: The module must record the timestamp of execution start and end
- **Execution logs**: The module must produce logs describing main steps (read, conversion, detected structures, write)
- **Final status**: The module must include the final status (success/failure) in returned logs

**Normative references:** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Light integrity verification

- **Optional hash**: The module may expose a hash or checksum of its code (optional in V1)
- **Dependency documentation**: The module must document its dependencies (no external dependencies, native JavaScript conversion)
- **Modification reporting**: The module may report any detected modification of its integrity (optional in V1)

**Normative references:** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Execution Constraints

- **Isolation**: The module must not modify the input file, must only access provided files, and must not create files outside the authorized directory
- **Performance**: The module must respect timeouts imposed by the pipeline and release resources after execution
- **Security**: The module must not execute system commands and must validate file paths before use

## Expected Behavior

### On Success

1. The output file is created at the `outputPath` location with the converted Markdown content
2. The output file is valid and conforms to Markdown format
3. The module returns a `ModuleResult` with `success: true`, `error: null`, detailed logs, and execution duration

### On Failure

1. No output file is created (or is deleted if partially created)
2. The module returns a `ModuleResult` with `success: false`, a descriptive error message in `error`, logs up to the failure point, and duration until failure

### Possible Error Types

- **Read error**: Input file not found, insufficient permissions, invalid encoding
- **Validation error**: File too large, invalid file type, empty content
- **Conversion error**: Failure during structure detection or conversion
- **Write error**: Insufficient permissions, insufficient disk space, non-existent parent directory

## Notes

### Automatic Detection

The module uses intelligent automatic detection to identify structures in plain text:

- **Titles**: Detection based on uppercase, separators, and common patterns
- **Lists**: Detection of list markers (ordered and unordered)
- **Code blocks**: Detection based on indentation (4 spaces or tab)
- **Links and emails**: Detection by regular expressions

This approach allows converting unstructured plain text to valid Markdown without manual intervention.

### Performance

Since conversion occurs entirely in memory, the module is particularly performant for medium-sized files. For very large files, memory consumption must be monitored.

### Limitations

- Automatic detection may not be perfect for all plain text formats
- Complex structures may require manual post-editing
- The module only supports unidirectional conversion (txt → markdown)

## Compliance

This module strictly respects the interface defined in [modules.interface.md](../modules.interface.md) and the minimal security obligations of version 1. Any modification of the module must maintain this compliance.

## References

- [modules.interface.md](../modules.interface.md) - Module interface contract
- [PIPELINE.md](../PIPELINE.md) - Conversion pipeline specification
