# Converter Orchestrator Module

## Description

The `converter-orchestrator` module is a central orchestrator that manages the execution of all pipeline converters according to their capabilities and supported formats. This module automatically identifies the appropriate converter for each conversion, uses lazy loading to optimize memory consumption, and standardizes returns for all converters.

## Module Name

**Identifier:** `converter-orchestrator`  
**Type:** Central orchestrator module  
**Role:** Management and coordination of all pipeline converters

## Objective

Enable execution of all converters (downdoc, pandoc, text2markdown, panwriter, docverter, etc.) while respecting only the formats/languages provided in conversion options, while maintaining existing security, isolation, and structure.

## Supported Formats

The orchestrator module does not directly support formats, but coordinates conversions according to formats supported by each registered converter:

- **downdoc:** `asciidoc` → `markdown`
- **pandoc:** `markdown`, `asciidoc`, `html`, `txt`, `yaml`, `json` → `markdown`, `asciidoc`, `html`, `pdf`, `txt`, `yaml`, `json`
- **text2markdown:** `txt` → `markdown`
- **panwriter:** `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex` → `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`
- **docverter:** `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif` → `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`

**Note:** Only conversions to formats/languages defined in conversion options are available for this version. Other formats/languages may be added in future versions.

## Main Method: `executeConversion`

### Signature

```typescript
executeConversion(inputPath: string, outputPath: string, fromFormat: string, toFormat: string, options?: Object): Promise<ModuleResult>
```

### Functioning Description

The `executeConversion` method orchestrates the execution of a conversion according to the following process:

#### 1. Appropriate Converter Identification

- The module iterates through all converters registered in the registry
- For each converter, it checks if `fromFormat` and `toFormat` are supported
- The first converter that supports the requested conversion is selected
- If no converter supports the conversion, the module returns a `ModuleResult` with `success: false`

#### 2. Execution According to Converter Type

The module executes the conversion according to the converter's execution type:

- **Lazy Loading:** For modules conforming to the `modules.interface.md` interface
  - Uses the lazy loading module to load and execute the converter
  - Modules are loaded only when used
  - Memory consumption reduction

- **Command:** For external tools (e.g., Pandoc)
  - Uses secure command execution via `child_process.spawn`
  - Timeout management and error capture
  - Path and argument validation

#### 3. Result Standardization

- The module merges orchestrator logs with converter logs
- The result is standardized to respect the `ModuleResult` interface:
  - `success`: Boolean indicating success or failure
  - `logs`: Array or string containing all logs
  - `error`: Error message or `null` on success
  - `duration`: Total duration in seconds

#### 4. Error Handling

- All errors are captured and transformed into `ModuleResult` with `success: false`
- Error messages are secured (no sensitive system details)
- No unhandled exception propagates to the main pipeline

### Parameters

- **`inputPath`** (required): Absolute path to input file to convert
- **`outputPath`** (required): Absolute path to output file to create
- **`fromFormat`** (required): Source format (markdown, asciidoc, html, txt, etc.)
- **`toFormat`** (required): Destination format (markdown, asciidoc, html, pdf, etc.)
- **`options`** (optional): Object containing conversion options
  - `conversionId`: Conversion ID for logs (optional)
  - `timeout`: Timeout in milliseconds (optional, default according to converter)
  - Other options specific to selected converter

### Return Value

The method returns a `Promise` that resolves with a `ModuleResult` object:

```typescript
{
  success: boolean,        // true if conversion successful, false otherwise
  logs: string | string[], // Execution logs (orchestrator + converter)
  error: string | null,   // Error message or null
  duration: number        // Duration in seconds
}
```

## Converter Registry

The module maintains a registry of all available converters with their configurations:

- **Converter Name:** Unique identifier
- **Supported Formats:** Input (`from`) and output (`to`) formats
- **Execution Type:** `lazy-load` or `command`
- **Configuration:** Module path (for lazy-load) or binary path (for command)

### Adding a New Converter

To add a new converter to the registry:

1. Create the converter module conforming to the `modules.interface.md` interface
2. Add an entry in `CONVERTER_REGISTRY` with:
   - `name`: Converter name
   - `supportedFormats`: Supported formats (from/to)
   - `executionType`: `lazy-load` or `command`
   - `modulePath` or `binaryPath` according to type

No modification of existing code is necessary, only adding an entry to the registry is sufficient.

## Communication with Linear Orchestrator

The `converter-orchestrator` module communicates with the `linear orchestrator` to avoid system overload:

### Load Control Management

- **External Calls:** For direct calls (not from linear orchestrator), converter-orchestrator manages load control
- **Internal Calls:** For calls from linear orchestrator (marked with `_internal: true`), load control is managed by linear orchestrator
- **No Double Counting:** Internal calls do not acquire a separate concurrency slot
- **Unified Tracking:** Successes and failures are recorded only for external calls

### Protection Mechanisms

1. **Call Type Detection:** The module detects if the call is internal or external via the `_internal` option
2. **Conditional Load Control:** Load control is applied only for external calls
3. **Guaranteed Release:** Concurrency slots are always released in a `finally` block

## Security and Isolation

### Minimal Security Obligations (V1)

The module respects the minimal security obligations defined in [modules.interface.md](../modules.interface.md):

#### 1. Format Validation

- **Format Verification:** The module validates that requested formats are supported by at least one converter
- **Immediate Rejection:** If no converter supports the conversion, the module immediately returns a `ModuleResult` with `success: false`

**Normative References:** ISO 27001 (A.9.4.2), ISO 27002 (A.9.4.2), NIST SP 800-53 (SI-7), OWASP Top 10 (A03:2021)

#### 2. Light Isolation

- **No Direct Interaction:** The module does not directly interact with the rest of the system outside provided paths
- **Delegation to Converters:** Isolation is ensured by each individual converter according to its security obligations
- **No Network Access:** The module must not access the network during execution (unless a converter requires it, in which case it is documented)

**Normative References:** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 3. Secure Error Handling

- **Exhaustive Capture:** All exceptions and errors are captured and transformed into `ModuleResult` with `success: false`
- **No Global Crash:** No unhandled exception propagates to the main pipeline
- **Secured Error Messages:** Error messages do not contain sensitive system details

**Normative References:** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 4. Minimal Logging

- **Conversion ID:** The module includes the unique conversion ID in its logs
- **Timestamping:** The module records the start and end execution timestamp
- **Execution Logs:** The module produces logs describing main steps (identification, execution, result)
- **Final Status:** The module includes the final status (success/failure) in returned logs

**Normative References:** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Light Integrity Verification

- **Converter Documentation:** The module documents all registered converters and their supported formats
- **Modification Reporting:** The module may report any detected modification of converter integrity (optional in V1)

**Normative References:** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Execution Constraints

- **Isolation:** The module does not modify existing wrappers, it only orchestrates them
- **Performance:** The module uses lazy loading to optimize memory consumption
- **Security:** The module delegates security to individual converters according to their obligations

## Expected Behavior

### On Success

1. The appropriate converter is identified and executed
2. The output file is created at `outputPath` with converted content
3. The module returns a `ModuleResult` with `success: true`, `error: null`, detailed logs, and execution duration

### On Failure

1. If no converter supports the conversion, the module immediately returns a `ModuleResult` with `success: false`
2. If the converter fails, the error is captured and transformed into a `ModuleResult` with `success: false`
3. The module returns a `ModuleResult` with `success: false`, a descriptive error message in `error`, logs up to the failure point, and duration up to failure

### Possible Error Types

- **Unsupported Format Error:** No converter supports the requested conversion
- **Converter Error:** The selected converter failed (error captured and standardized)
- **Orchestration Error:** Error during converter identification or execution

## Notes

### Existing Preservation

The orchestrator module does not modify any existing wrapper:

- **No Wrapper Modification:** Existing wrappers (downdoc, pandoc, etc.) remain unchanged
- **Standardized Interface:** The module only standardizes returns, without modifying internal converter logic
- **Unchanged Paths:** Paths and interfaces of existing converters remain unchanged

### Lazy Loading

The module uses lazy loading to optimize memory consumption:

- **Deferred Loading:** Modules are loaded only when used
- **Cache:** Loaded modules are cached to avoid reloads
- **Memory Reduction:** Only actually used converters are loaded in memory

### Extensibility

The module is designed to be easily extensible:

- **Simple Addition:** Adding a new converter requires only adding an entry to the registry
- **No Code Modification:** No modification of existing code is necessary to add a new converter
- **Documentation:** Each converter must have its documentation in an associated `.module.md` file

### Format Limitations

**Important:** Only conversions to formats/languages defined in conversion options are available for this version. Other formats/languages may be added in future versions.

## Compliance

This module strictly respects the interface defined in [modules.interface.md](../modules.interface.md) and the minimal security obligations of version 1. Any modification of the module must maintain this compliance.

## References

- [modules.interface.md](../modules.interface.md) - Module interface contract
- [lazyload.module.md](./lazyload.module.md) - Lazy loading module
- [PIPELINE.md](../PIPELINE.md) - Conversion pipeline specification
- [downdoc.module.md](./downdoc.module.md) - Downdoc module
- [pandoc.module.md](./pandoc.module.md) - Pandoc module
- [text2markdown.module.md](./text2markdown.module.md) - Text2Markdown module
- [panwriter.module.md](./panwriter.module.md) - PanWriter module
- [docverter.module.md](./docverter.module.md) - Docverter module
