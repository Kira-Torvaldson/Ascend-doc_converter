# LazyLoader Module

## Description

The LazyLoader module is a centralized deferred loading (lazy loading) manager for all converters in the document conversion pipeline. This module reduces memory consumption at startup by loading each converter only at the time of its first use, while maintaining a uniform interface and minimal security obligations.

### Module Role

The LazyLoader module acts as an intermediary between the conversion pipeline and individual conversion modules. It manages dynamic loading, caching, validation, and isolated execution of each converter, guaranteeing efficient use of system resources.

### Lazy Loading Principle

Lazy loading consists of deferring the loading of a module until it is actually needed. Instead of loading all converters at pipeline startup, the LazyLoader module loads each converter only during its first use, then caches it for subsequent uses.

### Memory and Performance Benefits

- **Reduced memory consumption**: Unused modules consume no memory. Only actually used converters are loaded into memory.
- **Faster startup**: The pipeline starts without waiting for all converters to load, reducing initialization time.
- **Resource optimization**: System resources (CPU, memory) are allocated only for converters necessary for a given conversion.
- **Scalability**: Adding new converters does not increase memory consumption at startup, allowing pipeline extension without impact on initial performance.

## Exposed Interface

### `run` Method

**Signature:**
```typescript
run(moduleName: string, inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

**Description:**
Executes a converter with automatic lazy loading. The module is loaded on first use, then cached for subsequent uses.

**Parameters:**
- **`moduleName`** (required): Name of the converter module to use (e.g., `'downdoc'`, `'pandoc'`, `'text2markdown'`)
- **`inputPath`** (required): Absolute path to input file to convert
- **`outputPath`** (required): Absolute path to output file to create
- **`options`** (optional): Module-specific conversion options
  - `conversionId`: Unique conversion identifier for logging
  - Other options defined by each individual module

**Return Value:**
Returns a `Promise` that resolves with a `ModuleResult` object conforming to the contract defined in [modules.interface.md](../modules.interface.md):

```typescript
{
  success: boolean,        // Conversion status (true if success, false if failure)
  logs: string | string[], // Execution logs (includes module loading logs)
  error: string | null,     // Error message (null if success)
  duration: number         // Total duration in seconds (includes loading time if applicable)
}
```

**Behavior:**
1. Checks if the module is already loaded and cached
2. Loads the module on demand if necessary
3. Validates that the module respects the interface defined in [modules.interface.md](../modules.interface.md)
4. Executes the module's `run` method with provided parameters
5. Merges loading logs with logs returned by the module
6. Returns the uniform result conforming to the contract

### Compatibility with Existing Wrappers

The LazyLoader module is fully compatible with all existing wrappers that respect the interface defined in [modules.interface.md](../modules.interface.md). No modification is necessary to existing wrappers. The LazyLoader module acts as a transparent abstraction layer that:

- Maintains the standard `run(inputPath, outputPath, options)` interface
- Returns the standard result format `{ success, logs, error, duration }`
- Preserves all functionalities and options of individual modules
- Ensures backward compatibility with existing code

## Internal Functioning

### Dynamic Loading of Converters

The LazyLoader module loads each converter only on first use. The loading process follows these steps:

1. **Cache verification**: The module checks if the requested converter is already loaded and available in cache
2. **Registration verification**: The module verifies that the converter is registered in the registry of available modules
3. **Module loading**: The module uses Node.js loading mechanism (`require()`) to load the converter file
4. **Interface validation**: The module validates that the loaded converter respects the interface defined in [modules.interface.md](../modules.interface.md)
5. **Caching**: The loaded module is cached to avoid reloads during subsequent uses

### Instance Cache

The LazyLoader module maintains a cache of loaded converter instances. This cache allows:

- **Avoid repeated reloads**: Once loaded, a converter remains in memory for subsequent conversions
- **Optimize performance**: Loading time is paid only once per converter
- **Reduce memory consumption**: Unused converters are never loaded, even if registered

The cache is maintained in memory for the process lifetime. Loaded modules remain available until the end of pipeline execution.

### Isolated Execution in Dedicated Temporary Directory

Each conversion executes in an isolated context. The LazyLoader module guarantees that:

- **Isolation per conversion**: Each conversion uses a unique temporary directory provided by the pipeline
- **No interference**: Simultaneous conversions cannot interfere with each other
- **Automatic cleanup**: Temporary resources are cleaned up after each conversion

Isolation is ensured by the main pipeline, which provides `inputPath` and `outputPath` paths located in dedicated temporary directories.

### Minimal Path and File Validation

Before executing a conversion, the LazyLoader module performs minimal validation:

- **Path validation**: Verification that `inputPath` and `outputPath` are valid absolute paths
- **Existence validation**: Verification that the input file exists and is accessible
- **Registration validation**: Verification that the requested converter module is registered and available

These minimal validations are complemented by stricter validations performed by each individual converter module according to the interface defined in [modules.interface.md](../modules.interface.md).

## Security

### No System Access Outside Provided Paths

The LazyLoader module guarantees strict isolation by ensuring that:

- **Limited access to provided paths**: Only `inputPath` and `outputPath` files provided by the pipeline are accessible
- **No network access**: The module attempts no network connection during loading or execution
- **No system modification**: The module modifies no files outside the conversion context
- **Module isolation**: Each loaded converter module executes in its own context, without access to other modules or the system

### Exception Handling to Avoid Global Crash

The LazyLoader module implements exhaustive exception handling:

- **Capture of all errors**: All exceptions are captured and transformed into a `ModuleResult` with `success: false`
- **No exception propagation**: No unhandled exception propagates to the main pipeline
- **Secure error messages**: Error messages do not contain sensitive system details (full paths, environment variables, complete stack traces)
- **Error caching**: Loading errors are cached to avoid repeated attempts on failing modules

This handling guarantees that the pipeline remains stable even in case of loading or execution error of a converter.

### Minimal Logging

The LazyLoader module produces minimal logging conforming to minimal V1 security obligations:

- **Loaded module**: Logs indicate which module was loaded and when
- **Timestamp**: Each operation is timestamped for traceability
- **Success/failure**: The status of each operation (loading, validation, execution) is recorded
- **Duration**: Loading and execution duration is recorded for performance analysis

Logs are merged with logs returned by each converter module to provide complete conversion traceability.

### Preparation for Future Stricter Security Measures

The LazyLoader module is designed to evolve toward stricter security measures conforming to international standards:

- **Extensible architecture**: The module structure allows adding additional validations without modifying the interface
- **Extension points**: Extension points are provided for integrating integrity checks, digital signatures, and enhanced access controls
- **Structured logging**: Current logging can be extended to include structured formats (JSON, standardized formats) and log integrity

**Normative references for future evolution:**
- **ISO 27001** (A.12.4.1): Event logging
- **ISO 27002** (A.12.4.1): Event logging
- **NIST SP 800-53** (AU-2, AU-3): Audit events and record content
- **GDPR/RGPD** (Art. 30, 32): Record of processing activities and security of processing

## Performance and Limits

### List of Supported Converters

The LazyLoader module supports all converters that respect the interface defined in [modules.interface.md](../modules.interface.md). Currently registered converters include:

- **downdoc**: AsciiDoc to Markdown conversion
- **pandoc**: Multi-format conversion (coming soon)
- **text2markdown**: Text to Markdown conversion (coming soon)
- **docverter**: Conversion via Docverter service (coming soon)
- **panwriter**: Conversion via Panwriter (coming soon)

New converters can be added dynamically via registration in the module registry.

### Reduced Memory Impact Compared to Global Loading

Deferred loading significantly reduces memory consumption:

- **At startup**: Only the LazyLoader module structure is loaded into memory (a few kilobytes)
- **During use**: Only actually used converters are loaded (typically a few megabytes per converter)
- **Comparison**: Global loading of all converters could consume several tens of megabytes at startup, even if no converter is used

The exact memory impact depends on individual converters and their dependencies, but lazy loading guarantees that no memory is allocated for unused converters.

### Note on Initial Latency During First Load

The first load of a converter introduces additional latency:

- **Loading time**: Initial loading of a converter can take from a few milliseconds to a few hundred milliseconds, depending on module size and its dependencies
- **Impact on first conversion**: The first conversion using a given converter will be slightly slower than subsequent conversions
- **Cache for subsequent conversions**: Once loaded, the converter is cached and subsequent conversions do not have this initial latency

This latency is generally negligible compared to conversion time itself, and the memory benefit justifies this slight penalty on first use.

## Developer Notes

### How to Add a New Converter to the Lazy Loader

To add a new converter to the lazy loading system:

1. **Create the converter module**: Create a new module conforming to the interface defined in [modules.interface.md](../modules.interface.md)
2. **Register the module**: Add an entry in the `AVAILABLE_MODULES` registry of the `lazyload.module.js` file:
   ```javascript
   'new-converter': {
     path: path.join(MODULES_DIR, 'new-converter.module.js'),
     name: 'new-converter'
   }
   ```
3. **Use the converter**: The converter is automatically available via the LazyLoader module's `run()` method

The LazyLoader module will automatically load the new converter on its first use, without additional modification necessary.

### Extension of Logging or Future Security

The LazyLoader module is designed to be extensible:

- **Structured logging**: Current logging can be extended to include structured formats (JSON, standardized formats) and log integrity
- **Integrity verification**: Extension points are provided for integrating integrity checks (hash, digital signatures) of loaded modules
- **Enhanced access controls**: The structure allows adding access controls based on security policies
- **Audit and compliance**: Logging can be extended to include audit information conforming to ISO 27001/27002, NIST SP 800-53, and GDPR/RGPD standards

Future extensions must maintain compatibility with the existing interface and minimal V1 security obligations.

### References to Standards and Best Practices

The LazyLoader module is designed taking into account the following standards and best practices:

- **ISO 27001**: Information security management systems
  - A.9.1.2: Restrictions on access to networks and network services
  - A.9.4.2: Access control to systems and applications
  - A.12.4.1: Event logging
  - A.12.6.1: Management of technical vulnerabilities

- **ISO 27002**: Security controls - Guidelines for controls
  - A.9.1.2: Network separation
  - A.9.4.2: Access control policies and procedures
  - A.12.4.1: Event logging
  - A.12.6.1: Vulnerability management

- **NIST SP 800-53**: Security and Privacy Controls for Information Systems and Organizations
  - SC-7: System boundary protection
  - SC-39: Process isolation
  - SI-7: Software, firmware, and information integrity
  - SI-11: Error handling
  - AU-2: Audit events
  - AU-3: Content of audit records

- **OWASP Top 10**: Top 10 Web Application Security Risks
  - A01:2021 - Broken Access Control: Appropriate access control
  - A03:2021 - Injection: Input validation and sanitization
  - A04:2021 - Insecure Design: Robust error handling
  - A06:2021 - Vulnerable Components: Dependency management

- **GDPR/RGPD**: General Data Protection Regulation (EU 2016/679)
  - Art. 30: Record of processing activities
  - Art. 32: Security of processing

These references serve as a guide for future evolution of the module toward enhanced security measures, while maintaining minimal V1 obligations compatible with ongoing development.

## Compliance

The LazyLoader module strictly respects:

- The interface defined in [modules.interface.md](../modules.interface.md)
- Minimal V1 security obligations
- The uniform return contract `{ success, logs, error, duration }`
- Compatibility with all existing wrappers

Any modification of the module must maintain this compliance and preserve backward compatibility with existing code.

## References

- [modules.interface.md](../modules.interface.md) - Module interface contract
- [downdoc.module.md](./downdoc.module.md) - Example of module using lazy loading
- [PIPELINE.md](../PIPELINE.md) - Conversion pipeline specification
