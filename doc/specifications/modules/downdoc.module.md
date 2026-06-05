# Downdoc Module

## Description

The `downdoc` module is a wrapper for the JavaScript downdoc library that converts AsciiDoc documents to Markdown. This module implements the interface defined in [modules.interface.md](../modules.interface.md) and respects the minimal security obligations of version 1.

## Module Name

**Identifier:** `downdoc`  
**Type:** AsciiDoc to Markdown conversion module  
**Underlying library:** downdoc (native JavaScript library)

## Supported Formats

**Input formats (`from`):**
- `asciidoc`: Standard AsciiDoc format

**Output formats (`to`):**
- `markdown`: Standard Markdown format

**Structure:**
```typescript
supportedFormats: {
  from: ['asciidoc'],
  to: ['markdown']
}
```

## `run` Method

### Signature

```typescript
run(inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

### Operation Description

The `run` method performs the conversion of an AsciiDoc file to Markdown according to the following process:

#### 1. Secure input file reading

- The module reads the file located at `inputPath` using UTF-8 encoding
- Reading must be performed synchronously or asynchronously depending on the implementation
- Any read error (file not found, insufficient permissions, invalid encoding) must be captured and transformed into a `ModuleResult` with `success: false`

#### 2. Input validation

- The module validates that the read content is a non-empty string
- The module checks file size (according to configured limits)
- The module verifies that the file type corresponds to AsciiDoc (basic validation by extension or content)

#### 3. In-memory conversion via downdoc library

- The module uses the downdoc library to convert AsciiDoc content to Markdown
- Conversion occurs entirely in memory, without creating intermediate temporary files
- The module may apply conversion options if provided in the `options` parameter
- Supported options may include:
  - Conversion mode (standard or BookStack/Parsedown compatible)
  - Specific extensions (parsedown, etc.)

#### 4. Result post-processing

- The module applies basic cleanup to the generated Markdown to correct common issues with the downdoc library
- Corrections include notably:
  - Correction of malformed horizontal rules (`- --` → `---`)
  - Removal of trailing spaces
  - Normalization of file endings (single final newline)
- If BookStack mode is enabled, the module applies an additional adapter to guarantee compatibility with Parsedown

#### 5. Writing result to output file

- The module writes the converted Markdown content to the file located at `outputPath`
- Writing must be performed in UTF-8
- The output file's parent directory must exist (guaranteed by the pipeline)
- Any write error must be captured and transformed into a `ModuleResult` with `success: false`

#### 6. Result return

- The module returns a `ModuleResult` object conforming to the contract defined in [modules.interface.md](../modules.interface.md)
- The `success` field must be `true` if conversion and writing succeeded, `false` otherwise
- The `logs` field must contain execution logs (start, steps, end)
- The `error` field must be `null` on success, or contain a descriptive error message on failure
- The `duration` field must contain the total execution duration in seconds (read, conversion, post-processing, write)

### Parameters

- **`inputPath`** (required): Absolute path to input AsciiDoc file
- **`outputPath`** (required): Absolute path to output Markdown file
- **`options`** (optional): Object containing conversion options
  - `mode`: Conversion mode (`'default'` or `'bookstack'`)
  - Other options specific to the downdoc library

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
- **Type check**: The module validates that the file corresponds to an AsciiDoc file (by extension `.adoc` or `.asciidoc`, or by basic content validation)
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
- **Execution logs**: The module must produce logs describing main steps (read, conversion, write)
- **Final status**: The module must include the final status (success/failure) in returned logs

**Normative references:** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Light integrity verification

- **Optional hash**: The module may expose a hash or checksum of its code (optional in V1)
- **Dependency documentation**: The module must document its dependencies (downdoc library and its version)
- **Modification reporting**: The module may report any detected modification of its integrity (optional in V1)

**Normative references:** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Execution Constraints

- **Isolation**: The module must not modify the input file, must only access provided files, and must not create files outside the authorized directory
- **Performance**: The module must respect timeouts imposed by the pipeline and release resources after execution
- **Security**: The module must not execute unvalidated system commands and must validate file paths before use

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
- **Conversion error**: Downdoc library failure, invalid AsciiDoc content
- **Write error**: Insufficient permissions, insufficient disk space, non-existent parent directory

## Notes

### Downdoc Library

The module uses the JavaScript downdoc library, which is a native library that does not require external tools. This characteristic allows fast and lightweight execution, without system dependencies.

### Post-processing

The module applies systematic post-processing to correct known issues with the downdoc library, notably incorrect conversion of horizontal rules. This post-processing guarantees consistent output quality.

### BookStack Mode

The module supports a special conversion mode for BookStack, which applies additional adaptations to guarantee compatibility with the Parsedown parser used by BookStack. This mode is activated via the `mode: 'bookstack'` option.

### Performance

Since conversion occurs entirely in memory, the module is particularly performant for medium-sized files. For very large files, memory consumption must be monitored.

## Compliance

This module strictly respects the interface defined in [modules.interface.md](../modules.interface.md) and the minimal security obligations of version 1. Any modification of the module must maintain this compliance.

## References

- [modules.interface.md](../modules.interface.md) - Module interface contract
- [PIPELINE.md](../PIPELINE.md) - Conversion pipeline specification
