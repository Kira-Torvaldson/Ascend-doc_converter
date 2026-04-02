# ConversionResult Contract Specification

## Introduction

This document defines the first official consolidated baseline of the future standardized `ConversionResult` contract for Ascend conversions.
It specifies the contract structure, consistency rules, and the standardized error-code semantics. A first reference implementation of centralized result helpers and a first real migrated converter path exist in the backend; broader adoption across the backend will continue in later steps.

## Conceptual blocks

`ConversionResult` is organized into six conceptual blocks:

1. **General information**: global conversion context and identity.
2. **Input file**: source document information provided to the pipeline.
3. **Output file**: generated output document information.
4. **Observability**: warnings and logs that explain execution behavior.
5. **Error**: standardized failure information for unsuccessful conversions.
6. **Technical metadata**: extensible non-core technical data.

High-level representation:

```text
ConversionResult
├── General information
├── Input file
├── Output file
├── Observability
├── Error
└── Technical metadata
```

## Root-level fields

| Field | Purpose | Conceptual block |
|---|---|---|
| `success` | Global conversion status. | General information |
| `conversionId` | Unique conversion identifier. | General information |
| `converter` | Main converter used for execution. | General information |
| `pipeline` | Ordered list of conversion steps used for the operation. | General information |
| `inputFormat` | Source format declared for the conversion. | General information |
| `outputFormat` | Target format declared for the conversion. | General information |
| `inputFile` | Input file information block. | Input file |
| `outputFile` | Output file information block. | Output file |
| `durationMs` | Total execution duration in milliseconds. | General information |
| `startedAt` | Conversion start timestamp. | General information |
| `finishedAt` | Conversion end timestamp. | General information |
| `warnings` | Collection of non-blocking warnings. | Observability |
| `logs` | Collection of execution log entries. | Observability |
| `error` | Standardized failure block. | Error |
| `meta` | Extensible technical metadata. | Technical metadata |

## Nested object structures

### `inputFile`

Purpose: describes the source file captured by the conversion pipeline.

- `originalName`: original file name from source context.
- `storedPath`: internal path used for stored input.
- `size`: input file size metadata.
- `mimeType`: detected or declared input MIME type.

### `outputFile`

Purpose: describes the generated output file.

- `path`: internal path of generated output.
- `size`: output file size metadata.
- `mimeType`: MIME type associated with output.

### `error`

Purpose: describes standardized failure information when conversion is unsuccessful.

- `code`: normalized error identifier.
- `message`: human-readable diagnostic message.
- `details`: additional contextual failure information.
- `recoverable`: indicates whether retry/recovery is conceptually possible.

### `logs` entry

Purpose: describes one observability record in the `logs` collection.

- `level`: log severity level.
- `message`: log message content.
- `timestamp`: log event timestamp.

## Field types

### Root-level field types

| Field | Type |
|---|---|
| `success` | `boolean` |
| `conversionId` | `string` |
| `converter` | `string` |
| `pipeline` | `string[]` |
| `inputFormat` | `string` |
| `outputFormat` | `string` |
| `inputFile` | `object` |
| `outputFile` | `object` |
| `durationMs` | `number` |
| `startedAt` | `string` |
| `finishedAt` | `string` |
| `warnings` | `string[]` |
| `logs` | `object[]` |
| `error` | `object` |
| `meta` | `object` |

### Nested field types

#### `inputFile`

| Field | Type |
|---|---|
| `originalName` | `string` |
| `storedPath` | `string` |
| `size` | `number` |
| `mimeType` | `string` |

#### `outputFile`

| Field | Type |
|---|---|
| `path` | `string` |
| `size` | `number` |
| `mimeType` | `string` |

#### `error`

| Field | Type |
|---|---|
| `code` | `string` |
| `message` | `string` |
| `details` | `string` |
| `recoverable` | `boolean` |

#### `logs` entry

| Field | Type |
|---|---|
| `level` | `string` |
| `message` | `string` |
| `timestamp` | `string` |

## Nullability rules

### Root-level nullability

Non-null root-level fields:

- `success`
- `conversionId`
- `converter`
- `pipeline`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `durationMs`
- `startedAt`
- `finishedAt`
- `warnings`
- `logs`
- `meta`

Nullable root-level fields:

- `outputFile`
- `error`

### Nested nullability

#### `inputFile`

- `originalName`: non-null
- `storedPath`: non-null
- `size`: non-null
- `mimeType`: nullable

#### `outputFile` (when present)

- `path`: non-null
- `size`: non-null
- `mimeType`: nullable

#### `error` (when present)

- `code`: non-null
- `message`: non-null
- `details`: nullable
- `recoverable`: non-null

#### `logs` entry

- `level`: non-null
- `message`: non-null
- `timestamp`: non-null

## Semantic consistency rules

1. **Success / error coherence**
   - If `success` is `true`, `error` must be `null`.
   - If `success` is `false`, `error` must be present.

2. **Success / output coherence**
   - If `success` is `true`, `outputFile` must be present.
   - If `success` is `false`, `outputFile` may be `null`.

3. **Collections must always exist**
   - `pipeline` must always exist as an array.
   - `warnings` must always exist as an array.
   - `logs` must always exist as an array.
   - These collections may be empty, but they must not be omitted.

4. **Metadata must always exist**
   - `meta` must always exist as an object.
   - It may be empty, but it must not be omitted.

5. **Input file must always exist**
   - `inputFile` must always be present.
   - A conversion result without input file information is invalid.

6. **Error object completeness**
   - When `error` is present, it must include all required `error` fields.
   - The `error` object must not be partial or malformed.

7. **Output file completeness**
   - When `outputFile` is present, it must include all required `outputFile` fields.
   - The `outputFile` object must not be partial or malformed.

8. **Log entry completeness**
   - Every log entry must include all required `logs` entry fields.
   - A log entry must not be partial or malformed.

9. **Pipeline semantics**
   - `pipeline` represents the ordered list of conversion steps used by the operation.
   - Even for a single-step conversion, `pipeline` must still be an array.

10. **Timestamps and duration coherence**
    - `startedAt`, `finishedAt`, and `durationMs` must describe the same conversion operation.
    - `durationMs` must represent the execution duration of the reported conversion result.

## Baseline note

This document is the official documentation baseline for the `ConversionResult` contract.
Runtime implementation, helper functions, validation logic, and backend integration will be introduced in later steps.
# ConversionResult Contract (High-Level Blocks)

## Scope of this step

Sub-step 1.1.1 defined the six high-level conceptual blocks of the future standardized `ConversionResult` contract.

Sub-step 1.1.2 defined the root-level fields of `ConversionResult` and mapped each field to its conceptual block.

## High-level structure

```text
ConversionResult
├── General information
├── Input file
├── Output file
├── Observability
├── Error
└── Technical metadata
```

## Block purposes

### 1) General information

Purpose: describe the global conversion context and identity.

### 2) Input file

Purpose: describe the source document provided to the conversion pipeline.

### 3) Output file

Purpose: describe the generated output document.

### 4) Observability

Purpose: describe logs and warnings that help understand what happened during the conversion.

### 5) Error

Purpose: describe the standardized failure block used when a conversion fails.

### 6) Technical metadata

Purpose: store non-core technical information for future extensibility without polluting the main structure.

## Root-level fields

| Field | Purpose | Conceptual block |
|---|---|---|
| `success` | Global conversion status. | General information |
| `conversionId` | Unique conversion identifier. | General information |
| `converter` | Main converter used for execution. | General information |
| `pipeline` | Ordered list of pipeline steps involved in the conversion. | General information |
| `inputFormat` | Source format declared for the conversion. | General information |
| `outputFormat` | Target format declared for the conversion. | General information |
| `inputFile` | Nested input file information block (details defined later). | Input file |
| `outputFile` | Nested output file information block (details defined later). | Output file |
| `durationMs` | Total execution duration in milliseconds. | General information |
| `startedAt` | Conversion start timestamp. | General information |
| `finishedAt` | Conversion end timestamp. | General information |
| `warnings` | Collection of non-blocking warnings generated during execution. | Observability |
| `logs` | Execution log collection (structure defined later). | Observability |
| `error` | Standardized failure block used when conversion fails (details defined later). | Error |
| `meta` | Extensible technical metadata block for non-core information. | Technical metadata |

## Nested object structures

Sub-steps 1.1.1 and 1.1.2 already defined the conceptual blocks and root-level fields.  
This section defines the internal structure of the main nested objects referenced by `ConversionResult`.

### `inputFile`

Purpose: describe the source file captured by the conversion pipeline.

Internal fields:

- `originalName`: original file name provided by the caller or source context.
- `storedPath`: internal path used by the pipeline for the stored input file.
- `size`: input file size metadata.
- `mimeType`: detected or declared MIME type for the input file.

### `outputFile`

Purpose: describe the file generated by the conversion pipeline.

Internal fields:

- `path`: internal path of the generated output file.
- `size`: output file size metadata.
- `mimeType`: MIME type associated with the produced output.

### `error`

Purpose: provide a standardized failure structure when conversion is unsuccessful.

Internal fields:

- `code`: normalized error identifier for classification.
- `message`: human-readable error message for diagnostics.
- `details`: additional contextual information about the failure.
- `recoverable`: flag indicating whether retry/recovery is conceptually possible.

### `logs`

Purpose: capture execution trace entries for observability.

Structure: collection of log entries.

Each log entry contains:

- `level`: log severity level.
- `message`: log message content.
- `timestamp`: time marker for the log entry.

## Field types

Previous sub-steps already defined:

- conceptual blocks (`1.1.1`)
- root-level fields (`1.1.2`)
- nested object structures (`1.1.3`)

This section defines the exact data type for each documented field.

### Root-level fields and types

| Field | Type |
|---|---|
| `success` | `boolean` |
| `conversionId` | `string` |
| `converter` | `string` |
| `pipeline` | `string[]` |
| `inputFormat` | `string` |
| `outputFormat` | `string` |
| `inputFile` | `object` |
| `outputFile` | `object` |
| `durationMs` | `number` |
| `startedAt` | `string` |
| `finishedAt` | `string` |
| `warnings` | `string[]` |
| `logs` | `object[]` |
| `error` | `object` |
| `meta` | `object` |

### Nested fields and types

#### `inputFile`

| Field | Type |
|---|---|
| `originalName` | `string` |
| `storedPath` | `string` |
| `size` | `number` |
| `mimeType` | `string` |

#### `outputFile`

| Field | Type |
|---|---|
| `path` | `string` |
| `size` | `number` |
| `mimeType` | `string` |

#### `error`

| Field | Type |
|---|---|
| `code` | `string` |
| `message` | `string` |
| `details` | `string` |
| `recoverable` | `boolean` |

#### `logs` entry

| Field | Type |
|---|---|
| `level` | `string` |
| `message` | `string` |
| `timestamp` | `string` |

## Deferred to later sub-steps

- Allowed value restrictions will be defined later.
- Runtime implementation will be done later.

## Nullability rules

Previous sub-steps already defined:

- conceptual blocks (`1.1.1`)
- root-level fields (`1.1.2`)
- nested object structures (`1.1.3`)
- field types (`1.1.4`)

This section defines nullability for root-level and nested fields.

### Root-level nullability

#### Non-null root-level fields

- `success`
- `conversionId`
- `converter`
- `pipeline`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `durationMs`
- `startedAt`
- `finishedAt`
- `warnings`
- `logs`
- `meta`

#### Nullable root-level fields

- `outputFile`
- `error`

### Nested nullability

#### `inputFile`

- `originalName`: non-null
- `storedPath`: non-null
- `size`: non-null
- `mimeType`: nullable

#### `outputFile` (when `outputFile` exists)

- `path`: non-null
- `size`: non-null
- `mimeType`: nullable

#### `error` (when `error` exists)

- `code`: non-null
- `message`: non-null
- `details`: nullable
- `recoverable`: non-null

#### `logs` entry

- `level`: non-null
- `message`: non-null
- `timestamp`: non-null

### Conditionally present nested structures

- `outputFile` may be `null` when conversion fails.
- `error` may be `null` when conversion succeeds.

### Contract semantics notes

- Collections `pipeline`, `warnings`, and `logs` must always exist, even when empty.
- `meta` must always exist, even when empty.

## Semantic consistency rules

Previous sub-steps already defined:

- conceptual blocks (`1.1.1`)
- root-level fields (`1.1.2`)
- nested object structures (`1.1.3`)
- field types (`1.1.4`)
- nullability rules (`1.1.5`)

This section defines semantic consistency rules for the future `ConversionResult` contract.

1. **Success / error coherence**
   - If `success` is `true`, `error` must be `null`.
   - If `success` is `false`, `error` must be present.

2. **Success / output coherence**
   - If `success` is `true`, `outputFile` must be present.
   - If `success` is `false`, `outputFile` may be `null`.

3. **Collections must always exist**
   - `pipeline` must always exist as an array.
   - `warnings` must always exist as an array.
   - `logs` must always exist as an array.
   - These collections may be empty, but they must not be omitted.

4. **Metadata must always exist**
   - `meta` must always exist as an object.
   - It may be empty, but it must not be omitted.

5. **Input file must always exist**
   - `inputFile` must always be present.
   - A conversion result without input file information is invalid.

6. **Error object completeness**
   - When `error` is present, it must include all required error fields defined in previous sub-steps.
   - The `error` object must not be partial or malformed.

7. **Output file completeness**
   - When `outputFile` is present, it must include all required output file fields defined in previous sub-steps.
   - The `outputFile` object must not be partial or malformed.

8. **Log entry completeness**
   - Every log entry must include all required log fields defined in previous sub-steps.
   - A log entry must not be partial or malformed.

9. **Pipeline semantics**
   - `pipeline` represents the ordered list of conversion steps used for the operation.
   - Even for a single-step conversion, `pipeline` must still be an array.

10. **Timestamps and duration coherence**
    - `startedAt`, `finishedAt`, and `durationMs` must always describe the same conversion operation.
    - `durationMs` must represent the execution duration of the conversion result being reported.

## Deferred to later sub-steps

- Runtime enforcement will be implemented later.
- Helper functions and validation logic will be implemented later.
- This step defines contract rules, not runtime behavior.

## Standardized error code specification

### Purpose

This section defines the official baseline for standardized error-code semantics used by `error.code` in `ConversionResult`.

### Official error code identifiers

- `INVALID_INPUT`
- `EMPTY_INPUT`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_FORMAT`
- `MIME_MISMATCH`
- `CONVERTER_NOT_FOUND`
- `CONVERSION_FAILED`
- `EMPTY_OUTPUT`
- `OUTPUT_NOT_CREATED`
- `PIPELINE_FAILED`
- `INTERNAL_ERROR`

### Error code meanings

| Error code | Meaning |
|---|---|
| `INVALID_INPUT` | Use for generally invalid conversion input or malformed request context. |
| `EMPTY_INPUT` | Use when the input file exists but is empty or effectively empty. |
| `FILE_TOO_LARGE` | Use when the input file exceeds the allowed size limit. |
| `UNSUPPORTED_FORMAT` | Use when source or target format is not supported by the application or selected conversion flow. |
| `MIME_MISMATCH` | Use when detected MIME type does not match expected file type or declared format. |
| `CONVERTER_NOT_FOUND` | Use when no available converter can handle the requested conversion. |
| `CONVERSION_FAILED` | Use when a converter was selected and executed, but the conversion process failed. |
| `EMPTY_OUTPUT` | Use when conversion completed but produced output is empty or unusable. |
| `OUTPUT_NOT_CREATED` | Use when the expected output file was not created at all. |
| `PIPELINE_FAILED` | Use when a multi-step pipeline fails at one of its stages. |
| `INTERNAL_ERROR` | Use for unexpected internal failures that do not fit a more specific documented code. |

### High-level categories

#### 1) Input errors

Purpose: failures caused by invalid, empty, oversized, or inconsistent input data.

Included codes:

- `INVALID_INPUT`
- `EMPTY_INPUT`
- `FILE_TOO_LARGE`
- `MIME_MISMATCH`

#### 2) Format and compatibility errors

Purpose: failures caused by unsupported formats or missing converter capability.

Included codes:

- `UNSUPPORTED_FORMAT`
- `CONVERTER_NOT_FOUND`

#### 3) Conversion execution errors

Purpose: failures where a converter was selected and executed but did not produce a valid conversion result.

Included codes:

- `CONVERSION_FAILED`
- `EMPTY_OUTPUT`
- `OUTPUT_NOT_CREATED`

#### 4) Pipeline errors

Purpose: failures in a documented multi-step conversion pipeline.

Included codes:

- `PIPELINE_FAILED`

#### 5) Internal application errors

Purpose: unexpected internal failures that do not match a more specific category.

Included codes:

- `INTERNAL_ERROR`

### Recoverability guidance

Interpretation:

- **Recoverable**: failure may be resolved by changing input data, request parameters, or conversion choice, without backend code changes.
- **Not immediately recoverable**: failure usually indicates missing capability, engine/pipeline failure, or internal application failure.

Likely recoverable:

- `INVALID_INPUT`
- `EMPTY_INPUT`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_FORMAT`
- `MIME_MISMATCH`

Generally not immediately recoverable:

- `CONVERTER_NOT_FOUND`
- `CONVERSION_FAILED`
- `EMPTY_OUTPUT`
- `OUTPUT_NOT_CREATED`
- `PIPELINE_FAILED`
- `INTERNAL_ERROR`

### Usage rules

1. **Prefer the most specific documented code**
   - Do not use a generic code when a specific documented code applies.
2. **Reserve `INTERNAL_ERROR` for unexpected internal failures**
   - Do not use it for known business cases with specific documented codes.
3. **Do not use `CONVERSION_FAILED` when no converter was selected**
   - Use `CONVERTER_NOT_FOUND` in that case.
4. **Do not use `CONVERSION_FAILED` for unsupported formats**
   - Use `UNSUPPORTED_FORMAT` for unsupported source/target format.
5. **Differentiate output absence vs output emptiness**
   - Use `OUTPUT_NOT_CREATED` when no output file exists.
   - Use `EMPTY_OUTPUT` when output exists but is empty or unusable.
6. **Use `PIPELINE_FAILED` only for multi-step pipeline failures**
   - Do not use it for single-step converter failures unless a documented multi-step pipeline context applies.
7. **Use input-oriented codes for input-stage failures**
   - `INVALID_INPUT`, `EMPTY_INPUT`, `FILE_TOO_LARGE`, `MIME_MISMATCH`.
8. **Use output-oriented codes for output-stage failures**
   - `OUTPUT_NOT_CREATED`, `EMPTY_OUTPUT`.
9. **Match code to actual failure stage**
   - Input stage -> input-oriented codes.
   - Converter selection stage -> format/compatibility codes.
   - Converter execution stage -> conversion execution codes.
   - Multi-step orchestration stage -> `PIPELINE_FAILED`.
   - Unexpected internal stage -> `INTERNAL_ERROR`.
10. **Expose one primary error classification**
   - One reported failure maps to one primary `error.code`.
   - Additional context may be carried by `error.details` and logs.

### Baseline note

This is the official documentation baseline for standardized error-code semantics in `ConversionResult`.
Runtime implementation, helper functions, source-level constants, and backend integration will be defined later.

## Centralized result-building helpers (Step 1.3.1)

Step 1.3 starts the standardization of centralized helper functions used to build `ConversionResult` objects.

### Purpose

These helpers exist to:

- Produce `ConversionResult` objects that conform to the documented contract.
- Centralize repeated result-construction logic.
- Reduce structural inconsistency across converters, wrappers, and orchestration code.
- Provide one standardized way to create success and failure results.

### Expected guarantees

These helpers are expected to:

- Produce results matching the documented root-level structure.
- Preserve semantic consistency rules already defined in the contract.
- Ensure the presence of required collections and structural blocks.
- Standardize success and failure result creation paths.

### Non-goals and responsibility boundaries

These helpers must **not**:

- Choose which converter should be used.
- Perform orchestration decisions.
- Replace input validation logic.
- Replace converter execution logic.
- Replace pipeline control flow.
- Decide business rules outside result construction.
- Implement frontend behavior.

### Intended usage scope

These helpers are intended for:

- Converter wrappers.
- Orchestration code.
- Backend result-building paths.
- Standardized failure-handling paths.

### Why this matters

Centralizing `ConversionResult` construction reduces ad hoc result-shape variations and makes backend behavior more predictable and maintainable.

### Deferred in later sub-steps

- Helper function signatures will be defined later.
- Default values will be defined later.
- Runtime implementation will come later.

## `createSuccessResult()` API (Step 1.3.2)

Sub-step 1.3.2 defines the API contract of the future `createSuccessResult()` helper.

### Function purpose

`createSuccessResult()` is the standardized helper intended to build successful `ConversionResult` objects that conform to the documented contract.

### Expected input payload

The helper is expected to receive a payload object containing:

- `conversionId`
- `converter`
- `pipeline`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `outputFile`
- `startedAt`
- `finishedAt`
- `durationMs`
- `warnings`
- `logs`
- `meta`

### Payload field meanings

| Field | Meaning |
|---|---|
| `conversionId` | Unique identifier for the conversion operation. |
| `converter` | Main converter used for the successful conversion. |
| `pipeline` | Ordered list of conversion steps used. |
| `inputFormat` | Source format of the conversion. |
| `outputFormat` | Target format of the conversion. |
| `inputFile` | Structured input file information. |
| `outputFile` | Structured output file information. |
| `startedAt` | Conversion start timestamp. |
| `finishedAt` | Conversion end timestamp. |
| `durationMs` | Conversion duration in milliseconds. |
| `warnings` | Non-blocking warning collection. |
| `logs` | Execution log collection. |
| `meta` | Extensible technical metadata object. |

### Expected output intent

The helper is intended to return a contract-compliant `ConversionResult` with:

- `success: true`
- `error: null`

### Scope note

This sub-step defines only the helper API contract, not runtime implementation details.

### Deferred in later sub-steps

- Default values will be documented later.
- The `createFailureResult()` API will be documented later.
- Runtime implementation will come later.

## `createFailureResult()` API (Step 1.3.3)

Sub-step 1.3.3 defines the API contract of the future `createFailureResult()` helper.

### Function purpose

`createFailureResult()` is the standardized helper intended to build failed `ConversionResult` objects that conform to the documented contract.

### Expected input payload

The helper is expected to receive a payload object containing:

- `conversionId`
- `converter`
- `pipeline`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `startedAt`
- `finishedAt`
- `durationMs`
- `error`
- `outputFile`
- `warnings`
- `logs`
- `meta`

### Payload field meanings

| Field | Meaning |
|---|---|
| `conversionId` | Unique identifier for the conversion operation. |
| `converter` | Main converter involved in the failed conversion path, when applicable. |
| `pipeline` | Ordered list of conversion steps involved in the failed operation. |
| `inputFormat` | Source format of the attempted conversion. |
| `outputFormat` | Target format of the attempted conversion. |
| `inputFile` | Structured input file information. |
| `startedAt` | Conversion start timestamp. |
| `finishedAt` | Conversion end timestamp. |
| `durationMs` | Conversion duration in milliseconds. |
| `error` | Structured error object describing the primary failure. |
| `outputFile` | Optional structured output file information when a partial or unusable output artifact exists. |
| `warnings` | Non-blocking warning collection. |
| `logs` | Execution log collection. |
| `meta` | Extensible technical metadata object. |

### Expected output intent

The helper is intended to return a contract-compliant `ConversionResult` with:

- `success: false`
- a non-null `error`
- `outputFile` typically `null` when no valid output was produced

### Scope note

This sub-step defines only the helper API contract, not runtime implementation details.

### Deferred in later sub-steps

- Runtime implementation will come later.

## Helper default values (Step 1.3.4)

Sub-step 1.3.4 defines default values for centralized `ConversionResult` helper functions.

### Purpose of defaults

Defaults exist to:

- Reduce repetitive boilerplate in result construction.
- Guarantee structural consistency.
- Ensure arrays and metadata containers are always present.
- Avoid malformed partial results caused by omitted optional containers.

### `createSuccessResult()` defaults

- `success` is always `true`.
- `error` defaults to `null`.
- `warnings` defaults to `[]`.
- `logs` defaults to `[]`.
- `meta` defaults to `{}`.
- `pipeline` may default to `[]` if omitted.

No implicit fallback should invent missing required business inputs such as:

- `conversionId`
- `converter`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `outputFile`

### `createFailureResult()` defaults

- `success` is always `false`.
- `outputFile` defaults to `null`.
- `warnings` defaults to `[]`.
- `logs` defaults to `[]`.
- `meta` defaults to `{}`.
- `pipeline` may default to `[]` if omitted.

No implicit fallback should invent missing required business inputs such as:

- `conversionId`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `error`

### Boundary of defaulting behavior

Defaults are structural conveniences only. They must not silently replace required business inputs.

### Scope note

This sub-step defines the default-value contract only, not runtime implementation details.

### Deferred in later sub-steps

- Implementation will come later.
- Runtime enforcement is not part of this sub-step.

## Helper minimum guarantees (Step 1.3.5)

Sub-step 1.3.5 defines the minimum guarantees expected from centralized result helpers.

### Why guarantees matter

These guarantees make backend result construction predictable, reduce ad hoc result shapes, and improve maintainability.

### Guaranteed structure and completeness

1. **Contract shape guarantee**
   - Helpers must always return an object matching the documented `ConversionResult` root-level structure.

2. **Structural completeness guarantee**
   - Helpers must always include required structural fields of the contract, even when documented defaults are used for optional containers.

### Guaranteed collections and metadata presence

3. **Collection presence guarantee**
   - `pipeline` is always returned as an array.
   - `warnings` is always returned as an array.
   - `logs` is always returned as an array.
   - These collections may be empty, but must not be omitted.

4. **Metadata presence guarantee**
   - `meta` is always returned as an object.
   - It may be empty, but must not be omitted.

### Guaranteed success/failure semantics

5. **Success/failure semantic guarantee**
   - `createSuccessResult()` must always return `success: true` and `error: null`.
   - `createFailureResult()` must always return `success: false`.
   - `createFailureResult()` must always preserve a non-null primary `error` object.

6. **Output handling guarantee**
   - `createSuccessResult()` must return a success-shaped result intended for valid output data.
   - `createFailureResult()` must default `outputFile` to `null` when no usable output artifact is available.

### Boundary and non-invention guarantees

7. **Non-invention boundary**
   - Helpers may apply structural defaults, but must not invent missing required business data expected from callers.

8. **Consistency support guarantee**
   - Helpers are intended to reduce malformed, inconsistent, or partially constructed results across backend paths.

### What helpers do not guarantee

Helpers do **not** replace:

- Converter selection logic.
- Orchestration logic.
- Full business validation.
- Converter execution correctness.
- Frontend behavior.

### Scope note

This sub-step defines contract-level guarantees only. Runtime implementation details are out of scope.

### Deferred in later sub-steps

- Implementation will come later.
- Helper source code is not part of this sub-step.
- Backend integration will come later.

## Centralized helper usage guidance (Step 1.3.7)

Sub-step 1.3.7 closes step 1.3 with practical usage guidance for centralized `ConversionResult` helpers.

### Available helpers

- `createSuccessResult(payload)`
- `createFailureResult(payload)`

### When to use each helper

- Use `createSuccessResult()` when conversion completed successfully and valid output information is available.
- Use `createFailureResult()` when conversion failed and a primary structured error must be returned.

### Who should use these helpers

These helpers are intended for:

- Converter wrappers.
- Orchestrator/result-building paths.
- Backend failure-handling paths.
- Any backend path that must return a standardized `ConversionResult`.

### Caller responsibilities

Callers must provide real business/context data required by the contract, especially:

- Conversion identity and context.
- Converter or pipeline context.
- Input file information.
- Output file information for success paths.
- Structured error information for failure paths.

### Helper responsibilities

Helpers centralize:

- Contract-shape construction.
- Success/failure structural consistency.
- Default arrays and metadata containers.
- Standardized result assembly.

### Anti-patterns to avoid

Callers should not:

- Manually rebuild ad hoc result objects when helpers are available.
- Use `createSuccessResult()` for failure flows.
- Use `createFailureResult()` without a primary error object.
- Rely on helpers to replace orchestration or converter-selection logic.
- Rely on helpers to invent missing business data.

### Why this usage rule matters

Standardized helper usage reduces inconsistency, duplicate boilerplate, and malformed backend responses.

### Closing note

- Converter integration will happen later.
- Orchestrator integration will happen later.
- This usage guidance is the operational bridge between the documented contract and future backend adoption.

## First migration target selection (Step 1.4.1)

Step 1.4 begins real backend adoption of centralized `ConversionResult` helpers in existing conversion paths.

### Officially selected first target

**AsciiDoc -> Markdown via `adoc-to-md.converter.js` (`run()` path).**

### Why this target was selected

- It is an already functional production path.
- The flow is relatively understandable (input validation, conversion attempt, fallback, output writing, explicit success/failure returns).
- It exposes clear success and failure branches that map well to helper usage.
- It is representative of real conversion behavior (including output checks and error propagation).

### Why this is a low-risk and high-value first migration

- Low risk: migration can be scoped to one module without orchestrator-wide refactor.
- High value: replaces many ad hoc return objects in a central real conversion path.
- Reusable outcome: patterns established here can be applied to other converters and pipeline paths.

### Scope note

- Detailed flow-to-helper mapping will be defined in sub-step `1.4.2`.
- No runtime refactor is performed in this sub-step.

## Current runtime flow mapping (Step 1.4.2)

Sub-step 1.4.2 maps the current runtime behavior of the selected target before helper integration.

### Selected path

**AsciiDoc -> Markdown via `adoc-to-md.converter.js` (`run()` path).**

### Current flow (as implemented)

1. **Entry path**
   - `main-orchestrator.execute()` resolves conversion path and delegates to `execution-orchestrator.executeSteps()`.
   - `execution-orchestrator` calls `executeConversion(inputPath, outputPath, fromFormat, toFormat, options)` in `converter-orchestrator.module.js`.
   - For `asciidoc -> markdown`, converter registry resolves to `downdoc` with `lazy-load` execution.

2. **Wrapper invocation**
   - `converter-orchestrator` invokes the module through lazy-load execution, which calls `downdocModule.run(inputPath, outputPath, options)`.
   - `downdocModule.run()` receives file paths and options (including `conversionId`, optional mode).

3. **Input handling**
   - The wrapper validates input existence, size, and extension.
   - It reads input file content, removes `:experimental:` in header, and normalizes AsciiDoc input.
   - Empty/invalid input states return early failure objects.

4. **Conversion execution**
   - Primary attempt uses `downdoc(...)`.
   - On failure, it falls back to `convertAsciiDocWithPandoc(...)`.
   - If both fail, wrapper returns failure with composed error text.

5. **Post-processing and output artifact handling**
   - Markdown cleanup is applied.
   - Output is written to `outputPath`, then verified (exists, content checks, basic syntax sanity).
   - Invalid artifacts can trigger cleanup (`unlinkSync`) and failure return.

6. **Duration and logs**
   - Duration is measured inside the wrapper using `startTime` and returned as `duration` (seconds).
   - Logs are accumulated in a local `logs` array across all branches and returned with the result.

7. **Result propagation**
   - The wrapper returns object-shaped results on both success and failure; it does not throw for normal operational failures.
   - `converter-orchestrator` merges wrapper logs and normalizes returned shape to `{ success, logs, error, duration }`.
   - `execution-orchestrator` then applies post-wrapper artifact validation and either propagates failure or returns success with output metadata (`outputFile`, `outputContent`, `stepsExecuted`).

### Current success path shape (selected wrapper level)

`adoc-to-md.converter.js` success branch returns a standardized `ConversionResult` (built via `createSuccessResult()`), including:

- `success: true`
- `error: null`
- `outputFile` present
- `warnings`, `logs`, `pipeline` as arrays
- `meta` as an object (may include engine-level context such as `engineUsed` / `fallbackReason`)

### Current failure path shape (selected wrapper level)

`adoc-to-md.converter.js` failure branches return a standardized `ConversionResult` (built via `createFailureResult()`), including:

- `success: false`
- structured `error` object (`code`, `message`, `details`, `recoverable`)
- `outputFile` either `null` or structured when an output artifact exists
- `warnings`, `logs`, `pipeline` as arrays
- `meta` as an object

### Integration-relevant observations

- The wrapper returns full `ConversionResult` root fields on both success and failure (centralized helpers).
- A legacy `duration` (seconds) field may still exist for backward compatibility, while the contract field is `durationMs`.
- Underlying engine identity remains traceable via `converter: "downdoc"` and `meta` fields where applicable.

### Closing note

Payload mapping from the current wrapper/orchestrator flow to centralized helpers is documented in sub-step `1.4.3`.

## Payload mapping for helper adoption (Step 1.4.3)

Sub-step 1.4.3 defines payload mapping for helper adoption before runtime integration.

### Selected path

**AsciiDoc -> Markdown via `adoc-to-md.converter.js` (`run()` path).**

### Success payload mapping (`createSuccessResult(payload)`)

| Payload field | Current runtime source | Mapping note |
|---|---|---|
| `conversionId` | `options.conversionId` propagated across orchestrator layers and wrapper logs | Direct mapping from conversion context. |
| `converter` | Selected converter in registry/execution path (`downdoc`) | Direct mapping as `"downdoc"` for this target path. |
| `pipeline` | Conversion path step list from main/execution orchestrators | Derive as ordered steps (e.g. `["asciidoc->markdown"]`) at integration time. |
| `inputFormat` | Step/request source format (`asciidoc`) | Direct mapping. |
| `outputFormat` | Step/request target format (`markdown`) | Direct mapping. |
| `inputFile` | Input file path exists in execution layer (`currentInputFile` / initial temp input) | Derive structured block locally from file path/stats during integration. |
| `outputFile` | Available in execution success result (`finalOutputFile`) | Derive structured block locally from final output path/stats/mime derivation. |
| `startedAt` | Not explicitly persisted as a returned field | Derive from local timing context at integration point (from start timestamp). |
| `finishedAt` | Not explicitly persisted as a returned field | Derive from local timing context at integration point (end timestamp). |
| `durationMs` | Current `duration` is returned in seconds | Normalize by converting seconds to milliseconds during integration. |
| `warnings` | No dedicated warnings collection in current return shape | Use helper default `[]` unless locally captured warnings are available. |
| `logs` | Wrapper and orchestrator log arrays (`logs`) | Direct mapping after merged log collection. |
| `meta` | Additional runtime context exists (e.g. engine used, fallback reason, step counts) | Derive lightweight metadata object locally; default `{}` if none. |

### Failure payload mapping (`createFailureResult(payload)`)

| Payload field | Current runtime source | Mapping note |
|---|---|---|
| `conversionId` | `options.conversionId` propagated across layers | Direct mapping from conversion context. |
| `converter` | Execution target converter (`downdoc`) when converter selection already occurred | Map when known; may be omitted before selection stage and handled as contextual absence. |
| `pipeline` | Conversion path steps (if path resolution already completed) | Derive ordered step list when available; otherwise helper default `[]`. |
| `inputFormat` | Request/step source format (`asciidoc`) | Direct mapping. |
| `outputFormat` | Request/step target format (`markdown`) | Direct mapping. |
| `inputFile` | Input temp path and file context in orchestrator/execution flow | Derive structured block locally from known input path/stats when available. |
| `startedAt` | Not explicitly returned | Derive from local timing context at integration point. |
| `finishedAt` | Not explicitly returned | Derive from local timing context at integration point. |
| `durationMs` | Current `duration` in seconds on failure branches | Normalize to milliseconds during integration. |
| `error` | Current `error` is string-based in many branches | Derive structured error object locally (code/message/details/recoverable) during integration. |
| `outputFile` | Often absent on failure; may exist only in partial artifact scenarios | Map derived output block when usable artifact exists; otherwise use helper default `null`. |
| `warnings` | No dedicated warnings collection in current failure returns | Use helper default `[]` unless warning data is explicitly available. |
| `logs` | Current merged log arrays on failure returns | Direct mapping. |
| `meta` | Optional contextual data may exist by stage (pipelineState, step info, engine context) | Derive locally when available; otherwise helper default `{}`. |

### Integration-relevant observations

- `conversionId`, formats, and logs are already available in current flow and map directly.
- `duration` exists but requires unit normalization (`seconds -> milliseconds`).
- `startedAt` and `finishedAt` are not currently carried in return objects and must be derived at integration points.
- `inputFile`, `outputFile`, and structured `error` require local derivation from existing file/runtime context.
- `warnings` is not a first-class field in current returns and should use helper defaults unless explicit warning capture is introduced locally.

### Closing note

Runtime integration of the success and failure paths has been implemented on the first migrated converter path and verified via focused backend scripts.

## Step 1.4 migration pattern (validated on `downdoc`)

Step 1.4 validated the first real adoption pattern for centralized `ConversionResult` helpers using the `downdoc` conversion path.

### Reusable migration sequence

- Select one stable, currently working conversion path.
- Map its current runtime flow end-to-end (entry points, inputs, outputs, logs, timing, error propagation).
- Map current runtime data to helper payload fields (success and failure) before editing runtime code.
- Integrate `createSuccessResult()` on the success path (minimal, local change).
- Integrate `createFailureResult()` on the failure path (minimal, local change).
- Harmonize remaining raw throws and secondary internal failure escape paths so they do not bypass the standardized contract.
- Verify success and failure behavior with focused scripts.
- Broaden baseline scenario coverage with a small representative set of success/failure cases.

### Why `downdoc` was a good first target

- Already functional and exercised in real conversions.
- Bounded scope (single wrapper path) with clear success/failure branching.
- Representative of real-world conversion behavior (output artifact checks, fallback behavior, structured logging).
- Low migration risk compared to orchestration-wide refactors.

### Practical lessons learned

- Migrate one path at a time and keep the diff local to the selected module.
- Verify the success path first, then integrate and validate the failure path.
- Preserve the existing conversion logic and only replace result construction.
- Keep helper integration minimal; avoid unrelated backend cleanup during first migrations.
- Maintain small verification scripts as regression checks for both shape and functional output.

### Guidance for future converter migrations

- Start with a single converter/wrapper path, not a whole orchestration layer.
- Document the runtime flow first; do not guess.
- Define payload mappings before changing code.
- Keep integration scoped to success/failure result construction and local derivation of missing fields.
- Verify both success and failure outputs against the standardized contract before moving on.

### Closing note

- `downdoc` now serves as the first migration reference for helper adoption.
- Future converter migrations should follow the same pattern where applicable.
- Broader orchestrator alignment belongs to later steps.

## Step 1 Definition of Done (Release 0.0.1.4.6)

Step 1 is considered complete only when all of the following are true:

- The `ConversionResult` contract is documented.
- Nested structures are documented (`inputFile`, `outputFile`, `error`, `logs` entries).
- Field types, nullability rules, and semantic consistency rules are documented.
- Standardized error codes are documented, including:
  - identifiers
  - meanings
  - categories
  - recoverability guidance
  - usage rules
- Centralized backend helpers exist for standardized result creation:
  - `createSuccessResult(payload)`
  - `createFailureResult(payload)`
- Helper documentation exists and is coherent, including:
  - role and responsibility boundaries
  - API (payload expectations and output intent)
  - structural defaults
  - minimum guarantees
  - usage guidance
- One real converter path has been migrated to the helpers:
  - `api/backend/services/modules/adoc-to-md.converter.js`
- The migrated converter path uses `createSuccessResult()` on success.
- The migrated converter path uses `createFailureResult()` on failure.
- The migrated converter path has standardized success behavior (contract-compliant success shape).
- The migrated converter path has standardized failure behavior (contract-compliant failure shape with structured `error`).
- Internal error handling has been harmonized on the migrated path so avoidable raw throw-based exits do not bypass the standardized contract.
- The migrated path naming is Ascend-oriented at the architectural file level (role-based file name).
- Rename propagation is clean and no stale architectural file reference remains.
- The real backend entry flow preserves the standardized result for the migrated path (no intermediate layer reconstructs legacy ad hoc result shapes).
- Focused verification scripts pass for:
  - success result shape
  - failure result shape
  - baseline scenario coverage

### Step 1 does not require

- Migrating all converters/wrappers.
- Full orchestrator-wide standardization.
- Frontend UX changes or response-shape redesign at the route layer.
- Broad pipeline refactoring beyond the first migrated path.

### Why this Definition of Done matters

- It marks the transition from contract design to a validated first real adoption in backend code.
- It prevents ambiguity about Step 1 closure.
- It establishes a clean baseline for the next step.

## Step 1 Closure (Release 0.0.1.4.6)

### A) What Step 1 achieved

Step 1 successfully established:

- The documented `ConversionResult` contract (structure, nested objects, types, nullability, semantic consistency rules).
- The documented standardized error-code model (identifiers, meanings, categories, recoverability guidance, usage rules).
- Centralized backend result helpers for standardized success and failure result creation.
- A first real runtime migration of a converter path using the centralized helpers.
- A validated migration pattern that can be reused for future converter adoption.

### B) Concrete runtime adoption achieved

- The AsciiDoc -> Markdown path is the first migrated runtime path:
  - `api/backend/services/modules/adoc-to-md.converter.js`
- Success uses `createSuccessResult(payload)`.
- Failure uses `createFailureResult(payload)`.
- The migrated path is verified through focused scripts and real backend flow checks (module-level and backend-entry-path verification).

### C) What Step 1 now provides to the project

- A stable contract baseline for standardized conversion results.
- A standardized success/failure result model backed by centralized helpers.
- A validated first migration reference for subsequent converter migrations.
- A cleaner foundation for incremental backend alignment work.

### D) What remains explicitly outside Step 1

Step 1 closure does not mean that:

- All converters are migrated.
- The full orchestrator is already standardized end-to-end.
- Frontend UX work is already done.
- Broader pipeline refactoring is complete.

### E) Transition note

Next work should build on the Step 1 baseline (contract + helpers + first migration reference) rather than reopening contract design or first-migration questions.

## Step 2 Preparation (Release 0.0.1.4.6)

### Step 2.1.1 — Plausible backend entry points for the real AsciiDoc -> Markdown flow

Step 2 starts by identifying the backend entry points and orchestration layers that are actually involved in the already migrated AsciiDoc -> Markdown path, before selecting the exact Step 2 alignment target.

The following components are plausibly involved in the real flow (based on current backend wiring and call sites):

- **`api/backend/app.js`**: Express application entry where `/api` middleware and route stacks are mounted.
- **`api/backend/routes/conversion.routes.js`**: Route entry for `POST /api/to-markdown` (direct AsciiDoc -> Markdown endpoint) which writes temp files and dispatches to the lazy-loaded `downdoc` module.
- **`api/backend/routes/api.routes.js`**: Route entry for `POST /api/convert` (generic conversion endpoint guarded by confirmation token) which calls `secureConvertWithToken(...)`.
- **`api/backend/middleware/security/validate.middleware.js`**: Zod-based request validation used by the route handlers before conversion is executed.
- **`api/backend/services/conversion/secure-converter.js`**: Secure conversion service:
  - `secureConvertWithToken(...)` validates and consumes the confirmation token, then delegates to `secureConvert(...)`.
  - `secureConvert(...)` handles isolation + file creation and (for `asciidoc -> markdown`) dispatches to the lazy-loaded `downdoc` converter.
- **`api/backend/services/modules/lazyload.module.js`**: Lazy-load dispatch layer:
  - owns `AVAILABLE_MODULES` mapping (`downdoc` -> `adoc-to-md.converter.js`)
  - loads the module on demand and calls `moduleInstance.run(...)`
  - preserves a full `ConversionResult` if the module already returns one.
- **`api/backend/services/modules/adoc-to-md.converter.js`**: The migrated converter module (AsciiDoc -> Markdown) returning a standardized `ConversionResult` via centralized helpers.

The exact Step 2 alignment target will be selected in sub-step 2.1.2 based on this concrete entry-point mapping.

### Step 2.1.2 — Primary backend/orchestrator entry point (AsciiDoc -> Markdown)

Sub-step 2.1.2 identifies the single primary backend/orchestrator entry point to focus Step 2 alignment work for the migrated AsciiDoc -> Markdown flow.

**Selected primary entry point:** `api/backend/services/modules/lazyload.module.js`

**Why this is the primary entry point (grounded):**

- It is the **shared dispatch layer** that ultimately loads and invokes the migrated converter via `runConverter('downdoc', ...)` / `runModule(...)`.
- It is the **first backend coordination component above the converter** that can still **preserve, enrich, or accidentally reshape** the converter’s returned object.
- It already contains the contract-sensitive decision: **preserve a full `ConversionResult`** when the module returns one (instead of reconstructing a legacy `{ success, logs, error, duration }` shape).

**Primary vs. secondary (in the current real flow):**

- **Primary**: `lazyload.module.js` (converter dispatch + boundary where result shape is mediated)
- **Secondary (callers / surrounding layers)**:
  - `api/backend/routes/conversion.routes.js` (direct HTTP endpoint `POST /api/to-markdown` that writes temp files and calls the dispatcher)
  - `api/backend/services/conversion/secure-converter.js` (secure conversion service that also dispatches to the same lazy loader for `asciidoc -> markdown`)
  - `api/backend/routes/api.routes.js` (generic token-guarded conversion route that calls `secureConvertWithToken(...)`)
  - `api/backend/middleware/security/validate.middleware.js` (request validation before invoking conversion)
  - `api/backend/services/modules/adoc-to-md.converter.js` (the migrated converter implementation itself)

The official Step 2 alignment target will be confirmed in sub-step 2.1.3.

### Step 2.1.3 — Confirmed Step 2 alignment target

Sub-step 2.1.3 formally confirms the backend component that Step 2 will focus on for orchestrator-level alignment of the already migrated AsciiDoc -> Markdown flow.

**Confirmed Step 2 alignment target:** `api/backend/services/modules/lazyload.module.js`

**Why this is the correct Step 2 focus:**

- It is the central coordination boundary where the migrated converter is dispatched and where the returned result can be preserved or reshaped.
- It is the most direct place above the migrated converter where standardized `ConversionResult` propagation can be enforced consistently for both success and failure paths.
- It prevents regression into legacy ad hoc result formats when modules evolve at different adoption speeds.

**What Step 2 will align at this level (intent):**

- Standardized success propagation (preserve the full contract when available).
- Standardized failure propagation (avoid partial/legacy reconstructions that drop contract fields).
- Avoidance of ad hoc result reshaping across dispatch paths.
- Safer internal error handling at the dispatch/coordination layer so unexpected errors do not bypass the standardized result model.

Detailed flow mapping of this component and its interactions will begin in sub-step 2.2.1.

### Step 2.2.2 — Failure-oriented backend flow mapping (AsciiDoc -> Markdown)

Sub-step 2.2.2 maps the failure-oriented backend flow for the already migrated **AsciiDoc -> Markdown** path, specifically through the confirmed Step 2 alignment target.

- **Migrated path**: AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Confirmed Step 2 alignment target**: `api/backend/services/modules/lazyload.module.js`

#### Failure-oriented flow (end-to-end, grounded)

1. **Incoming backend entry point (one of the real callers)**:
   - `POST /api/to-markdown` (`api/backend/routes/conversion.routes.js`) calls `runConverter('downdoc', inputFile, outputFile, { conversionId, mode })`, **or**
   - `POST /api/convert` (`api/backend/routes/api.routes.js`) calls `secureConvertWithToken(...)` → `secureConvert(...)` (`api/backend/services/conversion/secure-converter.js`), which then calls `runConverter('downdoc', inputFile, outputFile, { conversionId, mode })` for `asciidoc -> markdown`.
2. **Dispatcher / coordination boundary**:
   - `runConverter(...)` delegates to `LazyLoadManager.runModule(...)` in `api/backend/services/modules/lazyload.module.js`.
3. **Lazy-load + registry resolution** (inside `lazyload.module.js`):
   - validates input/output paths (absolute paths, input exists, output directory exists)
   - loads the registered module `downdoc` from the `AVAILABLE_MODULES` mapping (`downdoc` → `adoc-to-md.converter.js`)
   - invokes `moduleInstance.run(inputPath, outputPath, options)`.
4. **Converter invocation and failure creation (first standardized failure result)**:
   - `api/backend/services/modules/adoc-to-md.converter.js` detects a failure condition (e.g., input validation failure, empty input, engine failure, unexpected error).
   - It builds a standardized failure `ConversionResult` via `createDowndocFailure(...)`, which internally calls **`createFailureResult(payload)`** (centralized helper) and returns the contract-compliant object.
5. **Failure propagation through the alignment target**:
   - `lazyload.module.js` receives the module’s failure `ConversionResult`.
   - It merges logs and **preserves the full `ConversionResult` shape** (instead of rebuilding a legacy `{ success, logs, error, duration }` object), while ensuring a legacy `duration` (seconds) field exists for backward compatibility.
6. **Final backend-level failure return path (caller-dependent)**:
   - In `conversion.routes.js` (`POST /api/to-markdown`), the handler checks `if (!result.success)` and returns `500` with a legacy JSON body (currently `detail: "Conversion error: ..."`).
   - In `secure-converter.js`, the handler throws a `ConversionError('CONVERSION_FAILED', ...)` when `result.success` is false, which is then translated into an HTTP error response by its route/controller layer.

#### Where the standardized failure `ConversionResult` is first created

- **First created in**: `api/backend/services/modules/adoc-to-md.converter.js`
- **Mechanism**: `createDowndocFailure(...)` → `createFailureResult(payload)`

#### How the standardized failure result propagates upward

- `adoc-to-md.converter.js` returns a full failure `ConversionResult` to `lazyload.module.js`.
- `lazyload.module.js` preserves it and returns it to its caller (`conversion.routes.js` or `secure-converter.js`).
- Higher layers may still choose to **wrap or translate** the error into route-specific HTTP response shapes.

#### Grounded observation (potential reshaping/mishandling points)

- Failures that occur **inside `lazyload.module.js` before module invocation** (path validation failure, module load failure, interface mismatch, internal lazy-load exception) currently return a **legacy ModuleResult-like object** rather than a full `ConversionResult`.
- Some HTTP routes still **return legacy response bodies** that do not expose the full standardized `ConversionResult` object even when it exists.

Sub-step 2.2.3 will identify the exact points where the standardized contract can be altered or broken across this failure-oriented path.

### Step 2.2.3 — Contract-risk points (AsciiDoc -> Markdown)

Sub-step 2.2.3 identifies the exact backend points in the already mapped AsciiDoc -> Markdown flow where the standardized `ConversionResult` contract may still be altered, partially rebuilt, stripped, wrapped, or bypassed.

- **Migrated path**: AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Confirmed Step 2 alignment target**: `api/backend/services/modules/lazyload.module.js`

#### Exact contract-risk points (grounded)

- **`api/backend/services/modules/lazyload.module.js` — pre-module failures return legacy shape**
  - **Why risk exists**: failures occurring before `moduleInstance.run(...)` (path validation failure, module registry/load failures, interface validation failures, internal lazy-load exceptions) return a legacy `{ success, logs, error, duration }`-style object.
  - **Risk type**: reshaping/partial rebuild (contract fields missing), inconsistent success/failure envelopes, bypass of standardized error codes.

- **`api/backend/services/modules/lazyload.module.js` — legacy fallback branch for non-ConversionResult modules**
  - **Why risk exists**: when a module does not return a standardized `ConversionResult`, lazyload intentionally rebuilds the legacy result shape.
  - **Risk type**: stripping required fields (no `conversionId`, `inputFile`, `outputFile`, `meta`, etc.), inconsistent wrapping between modules depending on adoption state.

- **`api/backend/routes/conversion.routes.js` (`POST /api/to-markdown`) — route-level response reshaping**
  - **Why risk exists**: the route handler translates failures into a legacy HTTP response body (e.g., `status(500).json({ detail: "Conversion error: ..." })`) instead of returning/preserving the full standardized `ConversionResult`.
  - **Risk type**: wrapping/translation into incompatible response shape; loss of contract fields for clients.

- **`api/backend/services/conversion/secure-converter.js` — throw-based propagation above converter results**
  - **Why risk exists**: in the `asciidoc -> markdown` branch, if `runConverter(...)` returns `success: false`, the service throws a `ConversionError('CONVERSION_FAILED', ...)` rather than returning the failure `ConversionResult` upward.
  - **Risk type**: bypass of standardized failure propagation via throw; conversion of structured failure into exception-driven path.

- **`api/backend/routes/api.routes.js` (`POST /api/convert`) — wrapper envelope around conversion result**
  - **Why risk exists**: this endpoint returns `{ success: true, result: <conversion output>, format }` (i.e., wraps the conversion output rather than exposing a standardized `ConversionResult` as the primary response contract).
  - **Risk type**: incompatible wrapping; potential loss of standardized result semantics at the HTTP boundary.

- **`api/backend/middleware/security/validate.middleware.js` — early 400 response not shaped as ConversionResult**
  - **Why risk exists**: invalid requests are short-circuited with `{ error: "Invalid request", issues: [...] }` which does not follow the `ConversionResult` contract.
  - **Risk type**: inconsistent error envelope at route boundary (expected for validation, but still a contract divergence for API consumers).

- **`api/backend/middleware/error-handler.middleware.js` — global error response is generic in production**
  - **Why risk exists**: unexpected thrown errors are turned into `{ error: "Internal server error" }` in production, losing structured conversion context.
  - **Risk type**: stripping/wrapping at the global error boundary for throw-based paths.

#### Already-safe vs. still-needs-alignment (current state)

- **Already safe (contract-preserving)**:
  - `api/backend/services/modules/adoc-to-md.converter.js` creates standardized failure results via `createFailureResult(...)`.
  - `api/backend/services/modules/lazyload.module.js` preserves full `ConversionResult` objects returned by the migrated module (merging logs and keeping a legacy `duration` field).

- **Still needs Step 2 alignment**:
  - `lazyload.module.js` failure paths that occur before module invocation (currently legacy-shaped).
  - HTTP route/service layers that wrap, translate, or throw instead of propagating a full standardized `ConversionResult` consistently.

Target behavior and alignment decisions will be defined in sub-step 2.3.1 and following.

### Step 2.2.4 — Current flow inconsistencies and Step 2 alignment observations (AsciiDoc -> Markdown)

Sub-step 2.2.4 consolidates the grounded inconsistencies and Step 2 alignment-relevant observations for the already migrated AsciiDoc -> Markdown backend flow, before defining target behavior.

- **Migrated path**: AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Confirmed Step 2 alignment target**: `api/backend/services/modules/lazyload.module.js`

#### Key current inconsistencies / alignment-relevant observations (grounded)

- **Mixed result envelopes depending on failure stage**:
  - When the migrated converter runs, it returns a full standardized `ConversionResult` failure.
  - When failure occurs *before* converter invocation inside `lazyload.module.js` (path validation, module load/interface issues, internal lazy-load exception), the returned object is legacy-shaped.

- **Success/failure handling is asymmetric above the converter**:
  - `lazyload.module.js` preserves full `ConversionResult` objects from migrated modules, but still uses legacy reconstruction for other cases.
  - `secure-converter.js` converts a `success:false` module result into a thrown `ConversionError(...)`, switching from result-return to exception flow.

- **HTTP boundaries still expose legacy response shapes**:
  - `POST /api/to-markdown` returns legacy `{ detail: ... }` errors rather than exposing the full standardized `ConversionResult`, even when available.
  - `POST /api/convert` wraps the conversion output in `{ success: true, result: ..., format }` rather than using `ConversionResult` as the primary response contract.
  - Request validation failures (`validate.middleware.js`) return a distinct non-ConversionResult 400 shape, creating multiple client-visible error envelopes.

- **Result-shaping responsibility is still split across multiple coordination layers**:
  - The converter is now clean and contract-compliant.
  - The dispatcher (`lazyload.module.js`), secure service (`secure-converter.js`), and routes still each apply their own wrapping/translation rules.

#### What is already aligned and safe

- The migrated converter (`adoc-to-md.converter.js`) constructs contract-compliant success and failure results via centralized helpers.
- `lazyload.module.js` preserves and returns full `ConversionResult` objects when modules already provide them.

#### What still needs Step 2 behavior alignment

- Normalize the dispatcher boundary so that *all* failure modes (including pre-module failures) can be expressed without falling back to legacy shapes.
- Reduce or standardize route/service-level wrapping and throw-based propagation so the standardized result model is not bypassed or stripped.

#### Prioritization note (most important to address first)

- The highest-leverage inconsistency is **legacy-shaped failures inside `lazyload.module.js` before module invocation**, because it is the confirmed Step 2 alignment target and the narrowest shared boundary that can prevent contract stripping across multiple callers.

Target behavior definition begins in sub-step 2.3.1.

### Step 2.3.1 — Target success-path behavior at the Step 2 alignment target

Sub-step 2.3.1 defines the **target success-path behavior** for Step 2 alignment at the confirmed backend/orchestrator coordination boundary, for the already migrated AsciiDoc -> Markdown flow.

- **Migrated path**: AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Confirmed Step 2 alignment target**: `api/backend/services/modules/lazyload.module.js`

#### Target success-path expectations (when the migrated converter succeeds)

When the migrated converter returns a standardized **success** `ConversionResult`, the Step 2 alignment target is expected to:

- **Accept** the standardized success `ConversionResult` object as the primary return shape from the module invocation.
- **Preserve the root-level contract structure** without dropping or renaming fields:
  - `success`, `conversionId`, `converter`, `pipeline`, `inputFormat`, `outputFormat`,
    `inputFile`, `outputFile`, `durationMs`, `startedAt`, `finishedAt`, `warnings`,
    `logs`, `error`, `meta`
- **Preserve success semantics**:
  - `success: true`
  - `error: null`
  - `outputFile` present and complete (as defined by the contract)
- **Avoid legacy reconstruction**:
  - do not rebuild or replace the standardized success result with a legacy `{ success, logs, error, duration }` object when a full `ConversionResult` is already available.
- **Keep propagation predictable**:
  - return the preserved standardized success result to callers consistently, regardless of which backend entry point invoked the lazy loader (routes or services).

#### Acceptable minimal enrichment (must remain contract-compliant)

Minimal enrichment is acceptable only if it does not change the contract shape or semantics, for example:

- **Logs**: merge/append dispatcher-level logs to `logs` (preserving `logs` as an array).
- **Metadata**: merge non-conflicting dispatcher-level metadata into `meta` (preserving `meta` as an object).
- **Pipeline context**: append pipeline context only if it remains an array of strings and does not contradict the converter’s reported pipeline.
- **Legacy compatibility fields**: add a legacy `duration` (seconds) field only if required by existing callers, without modifying `durationMs`.

#### Unacceptable success-path behaviors at this layer

- **Stripping fields** from the standardized success result (e.g., dropping `inputFile`, `outputFile`, timestamps, `meta`, or `pipeline`).
- **Renaming or reshaping** the standardized success result into another envelope (e.g., `{ success: true, result: ... }` or legacy module result formats).
- **Mutating success semantics**, such as setting `error` to a non-null value on success, or making `warnings/logs/meta/pipeline` optional/omitted.
- **Inventing business data** that should come from the converter or caller (e.g., fabricating `conversionId`, `inputFile`, or `outputFile` values).

Failure-path target behavior will be defined in sub-step 2.3.2.

### Step 2.3.2 — Target failure-path behavior at the Step 2 alignment target

Sub-step 2.3.2 defines the **target failure-path behavior** for Step 2 alignment at the confirmed backend/orchestrator coordination boundary, for the already migrated AsciiDoc -> Markdown flow.

- **Migrated path**: AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Confirmed Step 2 alignment target**: `api/backend/services/modules/lazyload.module.js`

#### Target failure-path expectations (when the migrated converter fails)

When the migrated converter returns a standardized **failure** `ConversionResult`, the Step 2 alignment target is expected to:

- **Accept** the standardized failure `ConversionResult` object as the primary failure return shape from module invocation.
- **Preserve the root-level contract structure** without dropping or renaming fields:
  - `success`, `conversionId`, `converter`, `pipeline`, `inputFormat`, `outputFormat`,
    `inputFile`, `outputFile`, `durationMs`, `startedAt`, `finishedAt`, `warnings`,
    `logs`, `error`, `meta`
- **Preserve failure semantics**:
  - `success: false`
  - `error` non-null and structured
  - `outputFile` consistent with contract semantics (nullable on failure, populated only when grounded)
- **Preserve structured error information**:
  - keep `error.code`, `error.message`, `error.details`, and `error.recoverable` intact unless a justified, contract-safe normalization is required
  - preserve documented `error.code` semantics (do not weaken specific codes into generic ones without grounded reason)
- **Avoid legacy reconstruction**:
  - do not rebuild or replace the standardized failure result with a legacy `{ success, logs, error, duration }` object when a full `ConversionResult` is already available.
- **Avoid unnecessary generic replacement**:
  - do not replace a meaningful converter-originated structured failure with `INTERNAL_ERROR` unless the original failure shape is unusable or genuinely unavailable.
- **Keep failure propagation predictable**:
  - return the preserved standardized failure result to callers consistently, regardless of which backend entry point invoked the lazy loader.

#### Acceptable minimal enrichment (must remain contract-compliant)

Minimal enrichment is acceptable only if it does not change contract shape, semantics, or primary failure classification, for example:

- **Logs**: merge/append dispatcher-level logs into `logs` (preserving `logs` as an array).
- **Metadata**: merge non-conflicting dispatcher-level metadata into `meta` (preserving `meta` as an object).
- **Pipeline failure context**: append contextual failure-stage information only if it does not overwrite or dilute the primary `error.code` classification.
- **Legacy compatibility fields**: add a legacy `duration` (seconds) field only if required by existing callers, without modifying `durationMs`.

#### Unacceptable failure-path behaviors at this layer

- **Wrapping** standardized failure results into incompatible envelopes that hide contract fields.
- **Dropping or mutating** `error.code` in a way that breaks documented error-code semantics.
- **Flattening structured errors** into generic strings that lose `error` object structure.
- **Replacing grounded converter failures** with unjustified generic `INTERNAL_ERROR`.
- **Stripping required failure fields** (`conversionId`, `pipeline`, `inputFile`, timestamps, `logs`, `meta`, or structured `error`).
- **Throwing raw errors upward** when a structured standardized failure result already exists and can be propagated.

Internal error behavior at the alignment target will be defined in sub-step 2.3.3.

### Step 2.3.3 — Target internal-error behavior at the Step 2 alignment target

Sub-step 2.3.3 defines the **target internal-error behavior** for Step 2 alignment when the coordination layer itself fails during the already migrated AsciiDoc -> Markdown flow.

- **Migrated path**: AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Confirmed Step 2 alignment target**: `api/backend/services/modules/lazyload.module.js`

#### Target internal-error expectations (coordination-layer failures)

For internal coordination-layer failures (for example: module registry inconsistency, module resolution/load failure, lazy-load exception, dispatcher-level orchestration exception), the Step 2 alignment target is expected to:

- **Avoid raw throw-based escapes** whenever a structured failure result can be returned in contract-compliant form.
- **Convert internal coordination failures** into a standardized failure `ConversionResult` when no valid downstream standardized failure object is already available.
- **Preserve downstream structured failures** when they already exist, rather than overwriting them with generic internal failures.
- **Use `INTERNAL_ERROR` only when grounded**:
  - apply `INTERNAL_ERROR` only for genuine internal coordination-layer failures
  - do not use it when a more specific documented error code clearly applies
- **Preserve structured error semantics**:
  - keep `error` as an object (`code`, `message`, `details`, `recoverable`)
  - keep primary error classification stable unless justified by the actual failure source
- **Preserve contract completeness under internal failure**:
  - keep required root fields present
  - keep `warnings`, `logs`, `pipeline` as arrays and `meta` as an object
- **Preserve useful debugging context safely**:
  - include meaningful internal context in `error.details`, `logs`, and/or `meta`
  - avoid opaque string-only failures that lose source-stage information
- **Keep propagation predictable**:
  - return a contract-compliant failure object consistently to upstream callers, regardless of entry path.

#### Acceptable internal-error handling at this layer

- Structured conversion of dispatcher/orchestration internal failures into failure `ConversionResult` objects.
- Limited logs/metadata enrichment that preserves contract shape and primary failure semantics.
- Preservation of a downstream standardized failure result when one already exists.

#### Unacceptable internal-error behavior at this layer

- Raw throw propagation that bypasses standardized result propagation without strong necessity.
- Replacing a valid downstream structured failure with an unjustified generic internal failure.
- Dropping or mutating `error.code` in a way that breaks documented semantics.
- Flattening structured internal failures into string-only or opaque error outputs.
- Returning partial objects that do not match the documented `ConversionResult` structure.

Implementation/remediation work begins in sub-step 2.4.1.

### Step 2.3.4 — Enrichment and normalization boundary at the Step 2 alignment target

Sub-step 2.3.4 defines what the Step 2 alignment target may enrich, append, or normalize without breaking the standardized `ConversionResult` contract.

- **Migrated path**: AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Confirmed Step 2 alignment target**: `api/backend/services/modules/lazyload.module.js`

#### Acceptable enrichment categories (contract-safe)

At this coordination layer, enrichment is acceptable only when it preserves the converter’s primary result meaning and full contract shape:

- **Additional logs**:
  - append coordination-layer logs to `logs`
  - do not remove or rewrite existing converter logs
- **Additional metadata**:
  - append non-conflicting coordination metadata under `meta`
  - preserve existing converter-provided metadata
- **Contextual pipeline information**:
  - append bounded pipeline context when it remains consistent with the converter-reported flow
  - do not replace the converter’s pipeline identity with unrelated orchestration semantics
- **Coordination context**:
  - add traceable dispatch/lazy-load context only if it does not alter primary success/failure semantics

#### Acceptable minimal normalization behaviors

Minimal normalization is acceptable only to keep contract compliance stable:

- Ensure collection fields remain arrays (`pipeline`, `warnings`, `logs`).
- Ensure `meta` remains an object; append keys instead of replacing the whole object.
- Append logs without destroying existing log history order.
- Preserve structured failure identity (`error.code`, `error.message`, `error.details`, `error.recoverable`) while adding coordination context.
- Keep `success/error` semantic coherence intact (`success:true -> error:null`, `success:false -> error` present).

#### Unacceptable reshaping or override behaviors

The alignment target must not:

- Replace the primary `error.code` classification with a different code without grounded reason.
- Flatten or replace the structured `error` object with a generic string-only error.
- Rebuild a standardized result into a legacy ad hoc shape.
- Remove required root-level contract fields.
- Replace converter result identity with unrelated wrapper/orchestration semantics.
- Turn enrichment into ownership of full result construction when a standardized result already exists.
- Overwrite converter-originated success/failure meaning with generic dispatcher semantics.

Runtime implementation/remediation begins in sub-step 2.4.1.

### Step 2.5.4 — Backend HTTP output boundary (`POST /api/to-markdown`)

For the migrated AsciiDoc → Markdown path (`downdoc`), the effective backend output boundary for JSON consumers is **`POST /api/to-markdown`** in `api/backend/routes/conversion.routes.js`.

- **Success (HTTP 200)**: the response body includes `markdown` (primary payload for existing clients) and **`conversionResult`**, the full standardized `ConversionResult` returned by `runConverter` for that request.
- **Failure (HTTP 500)**: the response body is the standardized failure `ConversionResult` with structured `error` (including `error.code`), plus a legacy-compatible **`detail`** string aligned with `error.message` for clients that still read `detail`.

Verification: `api/backend/scripts/verify-e2e-to-markdown-output-boundary.js` (and the existing failure-contract script) exercise this HTTP boundary in-process.

### Step 2.6.1 — Step 2 Alignment Summary (Migrated AsciiDoc → Markdown)

This sub-step summarizes the concrete backend/orchestrator alignment outcomes completed in Step 2 for the already migrated AsciiDoc → Markdown path (`downdoc`).

Aligned in Step 2 (backend/orchestrator technical outcomes):
- Confirmed `api/backend/services/modules/lazyload.module.js` as the Step 2 coordination target for standardized `ConversionResult` propagation in the migrated path.
- Preserved standardized `ConversionResult` success results at the coordination layer (no field stripping or success/error envelope reshaping when a standardized result already exists).
- Preserved standardized `ConversionResult` failure results at the coordination layer (including structured `error.code` and required root-level fields).
- Aligned internal coordination failures (coordination-layer issues around lazy-load / dispatch) to avoid bypassing standardized failure propagation and to keep a contract-compliant failure shape.
- Reduced/removed legacy ad hoc reshaping on the migrated AsciiDoc → Markdown path when a standardized result is available.
- Verified that the standardized contract survives through the real migrated backend flow by backend verification scripts.
- Verified preservation to the effective HTTP output boundary (`POST /api/to-markdown`) for both success and failure payloads.
- Covered representative end-to-end scenarios for the migrated path (nominal success and multiple representative failure modes).

Backend/orchestrator alignment vs. remaining out of scope:
- Aligned: coordination-layer propagation and final HTTP boundary behavior for the migrated `downdoc` path.
- Not in scope (for this sub-step): global harmonization across unrelated endpoints (e.g. different wrappers or request-validation 400 shapes), and any migration/alignment work for other converters/pipelines.

Next: sub-step 2.6.2 will document the reusable alignment pattern derived from these confirmed outcomes for future backend flows.

### Step 2.6.2 — Reusable Backend/Orchestrator Alignment Pattern (Migrated AsciiDoc → Markdown)

This sub-step documents the reusable Step 2 alignment pattern validated on the already migrated AsciiDoc → Markdown path (`downdoc`).

Reusable sequence (practical pattern):
- Identify the real backend/orchestrator coordination target for the migrated path (the narrow layer where standardized results can be preserved or reshaped).
- Map the nominal success flow and all failure-oriented flows that can bypass/alter the contract (including failure stages before module invocation).
- Identify contract-risk points in each layer (dispatcher, service wrappers, routes, and any throw-based propagation).
- Define target behaviors for success, failure, internal errors, and enrichment/normalization rules that are explicitly contract-safe.
- Remediate success-path preservation so standardized success results are propagated without rebuilding legacy envelopes.
- Remediate failure-path preservation so standardized failure results (including structured `error.code`) keep their required root fields and error structure.
- Remediate internal coordination-layer error handling so internal faults do not bypass standardized result propagation.
- Verify at the alignment target (local layer verification).
- Verify end-to-end success and failure behavior for the migrated path.
- Broaden representative end-to-end scenario coverage to reduce “green on one case” risk.
- Verify preservation of the standardized contract at the effective backend output boundary (actual HTTP response/return edge for JSON consumers).

Why this pattern matters:
- It keeps Step 2 localized and testable by focusing alignment on a confirmed coordination target instead of broad refactors.
- It preserves the standardized contract through surrounding layers (coordination and transport), not only inside converters.
- It reduces the risk of legacy ad hoc reshaping hiding behind partial success/failure coverage.

How future flows should use this pattern:
- Align one path at a time to keep contract scope clear and verification focused.
- Document alignment decisions before broader implementation to prevent drift.
- Preserve standardized downstream results rather than rebuilding them in wrapper layers.
- Verify both local (alignment target) and end-to-end (effective output boundary) behavior before expanding scope.

Next: sub-step 2.6.3 will formalize the Definition of Done for Step 2, based on these confirmed outcomes.

### Step 2.6.4 — Step 2 Completion Summary

Step 2 closure note (release `0.0.1.4.6`): Step 2 successfully established contract-aligned backend/orchestrator behavior for the already migrated AsciiDoc -> Markdown runtime path (`downdoc`).

#### A. What Step 2 achieved
- Preserved standardized `ConversionResult` success/failure outputs through the backend/orchestrator coordination layer for the migrated runtime path.
- Reduced/removed legacy ad hoc result reshaping on the migrated AsciiDoc -> Markdown path when a standardized result is available.
- Aligned success-path, failure-path, and internal-target error behavior at the confirmed backend coordination target.
- Performed end-to-end validation that the standardized contract survives through the real backend flow.

#### B. What concrete runtime adoption was achieved
- The AsciiDoc -> Markdown conversion path is preserved end-to-end not only inside the converter, but also through the surrounding backend coordination layer.
- Success and failure remain standardized through the real backend flow for this migrated path.
- The effective backend output boundary for JSON consumers now preserves the standardized contract for the migrated path.
- Representative end-to-end verification was completed for both success and failure.

#### C. What Step 2 now provides to the project
- A validated backend-layer preservation baseline for standardized `ConversionResult` objects on the first migrated runtime path.
- A reusable backend/orchestrator alignment pattern (documented in Step 2.6.2) for future conversion flows.
- A stronger reference path for subsequent converter/backend standardization work.
- A cleaner foundation that prevents reopening already validated contract-alignment questions for the migrated AsciiDoc -> Markdown path.

#### D. What remains outside Step 2
- Step 2 completion does not imply that all backend flows are aligned.
- Step 2 completion does not imply that all converters are migrated.
- Step 2 completion does not imply that frontend UX work is completed.
- Step 2 completion does not imply broader pipeline redesign or architecture-wide orchestrator refactoring is complete.

#### E. Transition note
- Future work should build on the Step 1 + Step 2 baseline and use the documented pattern as the starting point, avoiding re-litigation of the same contract-alignment and first-path coordination questions for the already migrated AsciiDoc -> Markdown path.

### Step 3.1.1 — Frontend Entry Points (Migrated AsciiDoc -> Markdown)

Step 3 begins by identifying the concrete frontend/UI layers that consume or react to the backend conversion result for the already migrated AsciiDoc -> Markdown flow (`POST /api/to-markdown`).

Plausible frontend entry points/components involved in consuming the conversion result (grounded):

| Component / module | Role in the AsciiDoc -> Markdown flow |
|---|---|
| `api/frontend/src/App.tsx` | Primary UI container and orchestration layer: triggers conversion, owns `status`/`loading`/notifications state, and writes the conversion output into the destination panel state. |
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) | API-call layer used by `App.tsx` for AsciiDoc -> Markdown: calls `POST /api/to-markdown`, parses JSON, extracts `data.markdown`, and routes errors into either notification or the conversion-error modal pathway. |
| `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown`) | Dedicated AsciiDoc -> Markdown API-call helper (also calls `POST /api/to-markdown` and consumes `data.markdown`). Present as a plausible entry point, even if the current `App.tsx` path primarily uses `convertText`. |
| `api/frontend/src/converters/api.ts` (`API_BASE`) | Backend base URL resolution used by the converter call sites. |
| `api/frontend/src/components/Panel.tsx` | Source/destination text panel component: displays user input and shows the converted Markdown output (read-only/edit gating is controlled by `App.tsx` state). |
| `api/frontend/src/components/FormatSelector.tsx` | Format selection component that drives the AsciiDoc -> Markdown path selection in `App.tsx`. |
| `api/frontend/src/App.tsx` (notification toast) | Success/error notification rendering driven by conversion outcomes (`setNotification`). |
| `api/frontend/src/App.tsx` (conversion error modal) | Error display surface for specific conversion failures (triggered via `setShowConversionErrorModal` / `setConversionErrorMessage`). |

Note: the exact primary frontend alignment target (the narrowest layer where `ConversionResult`-aware handling should be introduced) will be selected in sub-step 3.1.2.

### Step 3.1.2 — Primary Frontend Entry Point (Migrated AsciiDoc -> Markdown)

This sub-step identifies the primary frontend/UI entry point for Step 3 work: the single place in the current frontend flow where the AsciiDoc -> Markdown conversion result is most meaningfully coordinated above the raw API response.

Primary entry point (selected):
- `api/frontend/src/App.tsx` (specifically the conversion orchestration in `handleConvert`)

Why this is the primary entry point (grounded):
- It is where conversion success/failure is coordinated into UI state (`loading`, `status`, notifications, and the conversion error modal).
- It decides where the conversion output is written (e.g. `setMdOutput(...)` for Markdown destination), which directly controls what the user sees in the result panel.
- It is the narrowest “above the API” coordination layer where standardized backend result fields could be preserved, ignored, or mishandled in future Step 3 alignment (without refactoring the API call implementation yet).

Secondary (involved but not primary):
- `api/frontend/src/converters/generic-converter.ts` (`convertText`): first consumer of the HTTP JSON payload (parses the response and extracts `data.markdown`), but does not own the main UI coordination decisions.
- `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown`): plausible helper, but the current `App.tsx` AsciiDoc -> Markdown path primarily flows through `convertText`.
- UI presentation components: `api/frontend/src/components/Panel.tsx`, `api/frontend/src/components/FormatSelector.tsx`, plus the notification toast and conversion-error modal rendering inside `App.tsx`.

Note: the official Step 3 alignment target will be confirmed in sub-step 3.1.3.

### Step 3.1.3 — Confirmed Step 3 Frontend/UI Alignment Target (Migrated AsciiDoc -> Markdown)

This sub-step formally confirms the official Step 3 frontend/UI alignment target for the already migrated AsciiDoc -> Markdown conversion-result flow.

Confirmed Step 3 alignment target:
- `api/frontend/src/App.tsx` (conversion orchestration in `handleConvert`)

Why this is the correct Step 3 focus:
- It is the primary “above the API” coordination point where conversion outcomes are translated into user-visible UI state and result display behavior.
- It is where standardized backend success/failure information can be preserved and normalized into UI state without prematurely refactoring lower-level fetch code or UI components.

What Step 3 will seek to align at this level:
- Standardized success result consumption (including preserving meaningful metadata when available, without breaking the current `markdown` payload flow).
- Standardized failure result consumption (prefer structured failure context over ad hoc message heuristics where feasible).
- Clean UI state transitions for the conversion lifecycle (loading/status/notification/modal behavior derived from standardized outcomes).
- Avoidance of legacy/ad hoc frontend result/error interpretation paths that obscure structured backend semantics.

Next: detailed UI-flow mapping begins in sub-step 3.2.1.

### Step 3.2.1 — Nominal Frontend/UI Flow Mapping (AsciiDoc -> Markdown)

This sub-step maps the nominal (success-oriented) frontend/UI flow for the already migrated AsciiDoc -> Markdown conversion-result path.

- Migrated path: **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Confirmed Step 3 alignment target: `api/frontend/src/App.tsx` (`handleConvert`)

Nominal success flow (grounded, step-by-step):
1. The user triggers conversion from the UI (Convert action handled by `handleConvert` in `api/frontend/src/App.tsx`).
2. `App.tsx` determines the source text for the current source format and performs basic preflight checks (non-empty, size limit, source/target compatibility).
3. `App.tsx` derives the destination write-path (`setOutput` callback) so that Markdown results are written into `mdOutput` (via `setMdOutput`).
4. `App.tsx` calls `convertText(...)` from `api/frontend/src/converters/generic-converter.ts` with:
   - the source text,
   - `sourceFormat='asciidoc'`, `targetFormat='markdown'`,
   - UI state setters (`setStatus`, `setLoading`, `setNotification`),
   - and the output setter (which ultimately updates `mdOutput` for Markdown results).
5. `convertText` sets `status` to “conversion in progress” and sets `loading=true`, then issues `fetch` to `POST /api/to-markdown`.
6. On HTTP 200, `convertText` parses the response JSON and extracts the primary payload (`data.markdown`), then calls `setOutput(result)`.
7. The `setOutput` callback in `App.tsx` updates state (`setMdOutput(result)` for Markdown destination).
8. The UI renders the updated destination panel with the new Markdown content (via state-driven rendering; the panel is displayed through `App.tsx` and the `Panel` component).
9. `convertText` updates visible “success” UI feedback (`status` and notification) and finally sets `loading=false`.

Where the standardized backend `ConversionResult` is first consumed in the frontend:
- The first frontend consumption point is `api/frontend/src/converters/generic-converter.ts` (`convertText`) at **HTTP JSON parsing** (`const data = await res.json()`).
- In the current nominal flow, the frontend consumes only `data.markdown` for success; any additional standardized result fields returned alongside it are not yet used in Step 3.2.1.

How the nominal result propagates through frontend state/display layers:
- `convertText` -> `setOutput(result)` -> `App.tsx` state (`mdOutput`) -> destination panel render (`Panel`), plus `status/loading/notification` state updates for user feedback.

Note: the failure-oriented UI flow will be mapped in sub-step 3.2.2.

### Step 3.2.2 — Failure-Oriented Frontend/UI Flow Mapping (AsciiDoc -> Markdown)

This sub-step maps the failure-oriented frontend/UI flow for the already migrated AsciiDoc -> Markdown conversion-result path.

- Migrated path: **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Confirmed Step 3 alignment target: `api/frontend/src/App.tsx` (`handleConvert`)

Failure-oriented flow (grounded, step-by-step):
1. The user triggers conversion from the UI (Convert action handled by `handleConvert` in `api/frontend/src/App.tsx`).
2. `App.tsx` calls `convertText(...)` from `api/frontend/src/converters/generic-converter.ts` with UI state setters and the output setter for the destination format.
3. `convertText` sets `status` to “conversion in progress” and sets `loading=true`, then issues `fetch` to `POST /api/to-markdown`.
4. The backend responds with a non-2xx status (e.g. HTTP 500 for conversion failure). `convertText` enters the `!res.ok` branch.
5. `convertText` attempts to parse the failure body as JSON (`await res.json()`) and extracts only the legacy-compatible `detail` string when present (`errorJson.detail`), otherwise it falls back to response text.
6. `convertText` classifies certain conversion failures using string heuristics on `detail`/text (e.g. “output appears to be AsciiDoc”, “output is identical…”). For those cases it:
   - opens the conversion error modal (`setShowErrorModal(true)`),
   - sets an error message (`setErrorMessage(...)`),
   - sets a failure status and error notification,
   - and returns early (no exception thrown).
7. For other HTTP failures, `convertText` throws an `Error(...)` with a composed message (HTTP status + `detail`/text). The `catch` branch then converts that into a generic notification/status update.
8. Result panel behavior on failure: because `setOutput(...)` is not called on failure, the destination panel content remains unchanged (it continues to display the previous successful result, if any, or stays empty).
9. `convertText` finally sets `loading=false` (in `finally`), restoring the UI from the “in progress” state.

Where the standardized backend failure `ConversionResult` is first consumed in the frontend:
- The first consumption point is `api/frontend/src/converters/generic-converter.ts` (`convertText`) during failure-body parsing (`await res.json()`).
- However, the current frontend logic consumes only `detail` (string) and does not read structured failure fields such as `error.code` (even when present in the backend response).

How the structured failure currently propagates through frontend state/display layers:
- Structured backend failure -> (flattened to `detail` string) -> `App.tsx` UI state via `setStatus` / `setNotification`, and for specific conversion-failure messages, `showConversionErrorModal` + `conversionErrorMessage`.

Grounded observation (where failure semantics can be flattened/ignored/mishandled later):
- Failure classification is currently based on message substring heuristics from `detail`, not on standardized `error.code`. This is a primary point where structured failure semantics can be lost even if the backend returns a full standardized failure `ConversionResult`.

Note: sub-step 3.2.3 will identify the exact frontend points where contract-aware handling can be altered or broken.

### Step 3.2.3 — Frontend/UI Contract-Risk Points (AsciiDoc -> Markdown)

This sub-step identifies the exact frontend/UI points in the already mapped flow where standardized backend `ConversionResult` handling can still be altered, flattened, ignored, partially rebuilt, or mishandled.

- Migrated path: **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Confirmed Step 3 alignment target: `api/frontend/src/App.tsx` (`handleConvert`)

#### Exact contract-risk points (grounded)

| Layer / component | Why it is a contract-risk point | Risk type(s) present in current flow |
|---|---|---|
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) — success body consumption | On HTTP 200, it parses JSON and extracts only a single primary string payload (`data.markdown || data.asciidoc || data.result || ""`). Any standardized result object returned alongside the payload is not consumed. | Ignoring structured fields; reducing success semantics to a single output string; potential loss of metadata (`conversionId`, `warnings`, `logs`, etc.). |
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) — failure body consumption | On `!res.ok`, it parses JSON but only reads `errorJson.detail` (string) when present, otherwise falls back to text. The structured failure `ConversionResult` fields (e.g. `error.code`) are not read. | Flattening structured failure into `detail` string; ignoring `error.code`; loss of structured failure context. |
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) — conversion failure classification | Certain failures are detected via substring heuristics on `detail`/text (e.g. “output appears to be AsciiDoc”, “output is identical…”), and routed into a dedicated modal path. | Ad hoc shaping / interpretation by message text; brittle classification; asymmetric handling between failure types. |
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) — generic error replacement | For non-heuristic HTTP failures it throws `new Error(...)` and the `catch` branch converts the error into generic notification/status strings. | Generic error replacement; loss of backend-structured semantics; inconsistent failure surfaces (modal vs toast). |
| `api/frontend/src/App.tsx` (`handleConvert`) — result write-path selection | `App.tsx` defines `setOutput` to decide where results are written (`setMdOutput` when target is Markdown). Because only a string result is passed upward, any structured contract data cannot propagate into state without changes. | Ignoring structured fields at the primary UI coordination layer; reduction to string-only result state. |
| `api/frontend/src/App.tsx` — result panel behavior on failure | On failures, `setOutput` is not invoked, so the destination panel content remains unchanged (previous success output persists, or stays empty). | Potential UI-state ambiguity about “current result vs last known good”; failure outcome not represented as a structured state. |

#### Already safe vs. still needs Step 3 alignment

- Already safe (contract-neutral display / wiring):
  - `api/frontend/src/components/Panel.tsx`: renders state-driven text content; does not reshape backend results.
  - `api/frontend/src/components/FormatSelector.tsx`: drives format selection; does not interpret backend results.

- Still needs Step 3 alignment (contract-consumption / coordination):
  - `api/frontend/src/converters/generic-converter.ts` (`convertText`): primary point where backend results are parsed and currently flattened/filtered.
  - `api/frontend/src/App.tsx` (`handleConvert` + UI state coordination): primary point where outcomes are translated into UI-visible state, currently without structured result propagation.

Note: current UI inconsistencies and contract-risk observations will be consolidated in sub-step 3.2.4.

### Step 3.2.4 — Current Frontend/UI Inconsistencies and Alignment Observations (AsciiDoc -> Markdown)

This sub-step consolidates the current frontend/UI observations from the mapped nominal/failure flows and contract-risk analysis, before defining target frontend behavior.

- Migrated path: **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Confirmed Step 3 alignment target: `api/frontend/src/App.tsx` (`handleConvert`)

#### Key current frontend/UI inconsistencies and alignment-relevant observations

- **Success/failure asymmetry at consumption level**:
  - Success is reduced to a string payload (`data.markdown` path), while failure is primarily reduced to `detail` string or generic thrown errors.
  - Structured backend semantics are not consumed symmetrically across success and failure.

- **Structured backend fields are parsed but not preserved**:
  - The frontend parse point exists (`await res.json()` in `convertText`), but structured fields such as `conversionId`, `warnings`, `logs`, and `error.code` are not propagated into UI state.
  - Result handling remains string-first (`result` output + message strings), not contract-first.

- **Ad hoc failure interpretation remains active**:
  - Failure routing to the conversion-error modal depends on message substring heuristics from `detail`/text.
  - Non-matching failures are converted to generic toast/status messages, creating divergent failure surfaces.

- **Result panel behavior can lag backend outcome on failure**:
  - On failure, no output state update occurs, so the result panel continues to display the previous successful result (or empty state).
  - UI-visible result content may not explicitly represent the latest backend failure outcome.

- **Primary coordination layer already clearly localized**:
  - `App.tsx` (`handleConvert`) is the confirmed coordination target where UI state transitions and display behavior are decided.
  - `convertText` is the main parse/translation point where backend response semantics currently get flattened.

#### Already aligned/safe vs. still needs Step 3 behavior alignment

- **Already aligned/safe (for current scope):**
  - Flow ownership is clear (`App.tsx` as target, `convertText` as parse layer).
  - UI wiring components (`Panel.tsx`, `FormatSelector.tsx`) are presentation/selectors and do not independently reshape backend contracts.

- **Still needs Step 3 behavior alignment:**
  - Contract-aware frontend consumption of standardized success/failure fields at `convertText` parse/translation stage.
  - Contract-aware UI state/display coordination in `App.tsx` so outcome semantics are represented without relying on ad hoc string heuristics.

#### Prioritization note

- The highest-priority inconsistency to address first is **failure-path flattening in `convertText`** (structured failure reduced to `detail` and substring heuristics), because it is the earliest frontend point where standardized backend failure semantics are currently lost.

Target frontend behavior definition begins in sub-step 3.3.1.

### Step 3.3.1 — Target Success-Path Frontend/UI Behavior (AsciiDoc -> Markdown)

This sub-step defines the target success-path frontend/UI behavior for Step 3 alignment at the confirmed frontend coordination target.

- Migrated path: **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Confirmed Step 3 alignment target: `api/frontend/src/App.tsx` (`handleConvert`)

#### Target success-path behavior expectations (when the backend returns a standardized success `ConversionResult`)

When the migrated backend path returns a standardized **success** `ConversionResult`, the Step 3 alignment target is expected to:
- **Use the standardized result as source of truth**:
  - treat `success === true` as the success condition, not local heuristics.
  - keep `success:true -> error:null` semantic coherence.
- **Render output coherently with the success result**:
  - display the converted output only when the success result is contract-coherent (e.g. a meaningful output is available for the UI to render).
  - avoid presenting stale/previous output as if it were the current successful conversion outcome.
- **Preserve meaningful success information from the backend** (do not replace with ad hoc assumptions):
  - keep available context (e.g. `conversionId`, `warnings`, `logs`, `durationMs`, timestamps, `meta`) accessible for UI/state purposes, even if not all fields are shown in the UI initially.
- **Keep success-path UI transitions predictable**:
  - `loading` / status / notification transitions should reflect the received standardized success outcome.
  - success feedback should be tied to the same conversion attempt whose output is displayed.

#### Acceptable success-path consumption and rendering behavior

- Using `success === true` as the success condition when a standardized result is available.
- Rendering the converted Markdown output in the intended result area once the standardized success result is received and coherent.
- Showing a clean “success” UI state (status/notification) after the standardized success result is received.
- Reading standardized metadata (e.g. `warnings`, `logs`, `durationMs`, `conversionId`) for auxiliary UI/state needs without reshaping the result into a legacy model.

#### Unacceptable success-path behavior at this level

- Treating a request as successful without relying on the standardized backend success result when it exists.
- Masking missing/inconsistent success results by showing a “success” UI state anyway.
- Keeping stale success output visible as if it were the current conversion output when the current request did not produce the displayed result.
- Reconstructing a legacy/ad hoc “success object” from partial data that discards standardized fields and semantics.
- Ignoring relevant standardized fields that are already available and necessary for correct UI state coherence (e.g. ignoring conversion identity when preventing stale display).

Target failure-path frontend behavior will be defined in sub-step 3.3.2.

### Step 3.3.2 — Target Failure-Path Frontend/UI Behavior (AsciiDoc -> Markdown)

This sub-step defines the target failure-path frontend/UI behavior for Step 3 alignment at the confirmed frontend coordination target.

- Migrated path: **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Confirmed Step 3 alignment target: `api/frontend/src/App.tsx` (`handleConvert`)

#### Target failure-path behavior expectations (when the backend returns a standardized failed `ConversionResult`)

When the migrated backend path returns a standardized **failure** `ConversionResult`, the Step 3 alignment target is expected to:
- **Use the standardized failure result as source of truth**:
  - treat `success === false` plus a structured non-null `error` object as the failure condition.
  - preserve `error.code` and `error.message` as the primary failure identity (do not replace them with generic local strings).
- **Preserve structured failure information for UI/state**:
  - keep meaningful backend fields available to the UI layer (e.g. `conversionId`, `error.code`, `error.details`, `warnings`, `logs`, timestamps, and `meta`) even if only a subset is displayed initially.
  - prefer limited, contract-safe UI interpretation over rebuilding a legacy error model.
- **Represent failure outcomes coherently in the UI**:
  - show a failure state derived from the structured backend result (message and, where relevant, code-based handling).
  - avoid treating a failed conversion as a partial success through local assumptions.
- **Prevent stale-success misrepresentation**:
  - do not leave prior successful output visible *as if it were the result of the failed conversion*.
  - ensure the UI makes it clear that the latest attempt failed (even if the last known good output remains available as “previous result”).
- **Keep failure-path UI transitions predictable**:
  - `loading` / status / notification / modal transitions should reflect the received standardized failure outcome.
  - failure feedback should be tied to the same conversion attempt whose result is being represented.

#### Acceptable failure-path consumption and rendering behavior

- Using `success === false` with structured `error` (including `error.code`) as the failure condition when a standardized result is available.
- Displaying a readable failure message derived from backend-provided structured error information (e.g. `error.message`), optionally supplemented by safe context from `error.details`.
- Using `error.code` for limited, explicit UI decisions where appropriate (e.g. choosing between a “fix your input” modal vs a generic error toast), without relying on substring heuristics when a code is available.
- Keeping the result panel in a failure-safe state when no valid current output exists (do not imply a new successful conversion occurred).
- Preserving structured failure semantics in state so later UI normalization can remain contract-aware.

#### Unacceptable failure-path behavior at this level

- Flattening a standardized backend failure into a string-only local error model (e.g. consuming only `detail` and discarding `error.code`).
- Dropping `error.code` where it is relevant to correct UI interpretation and later alignment work.
- Treating a failed conversion as success (or “success with warnings”) without the standardized result supporting that semantics.
- Leaving stale previous output visible in a way that implies it belongs to the failed conversion attempt.
- Rebuilding a legacy frontend error object from partial data while ignoring the standardized backend failure structure.

Intermediate/loading/frontend state behavior (e.g. conversion-in-progress transitions and reset rules) will be defined in sub-step 3.3.3.

### Step 3.3.3 — Target Frontend State Model (idle/loading/success/error) (AsciiDoc -> Markdown)

This sub-step defines the target intermediate/frontend state model for Step 3 alignment at the confirmed frontend coordination target.

- Migrated path: **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Confirmed Step 3 alignment target: `api/frontend/src/App.tsx` (`handleConvert`)

#### State definitions (intended meaning and constraints)

- **`idle`**
  - **Represents**: no active conversion attempt in flight; no new backend result currently being processed.
  - **Enter when**: initial app load; after a conversion attempt has fully resolved and transient indicators have settled; after the user clears/dismisses transient feedback.
  - **Display/preserve**: stable UI; last known content may remain visible, but must not imply a new conversion just occurred.
  - **Avoid**: lingering “loading”, “success”, or “error” indicators that refer to a past attempt as if it were current.

- **`loading`**
  - **Represents**: a conversion attempt is in progress (request in flight / result pending).
  - **Enter when**: the conversion request is initiated for the current attempt.
  - **Display/preserve**: clear in-progress indication; disable/guard actions as needed; preserve last known content but do not present it as the current attempt’s result.
  - **Avoid**: implying completion; showing a success indicator before a standardized success result is received; ambiguous “half success” states.

- **`success`**
  - **Represents**: the current conversion attempt completed with a coherent standardized success `ConversionResult` and a coherent output for display.
  - **Enter when**: a standardized result for the current attempt is received with `success === true` (and contract-coherent success semantics).
  - **Display/preserve**: display the converted output as the current result; clear prior error indicators; optionally surface success-related metadata (e.g. warnings) without reshaping.
  - **Avoid**: declaring success without a coherent standardized success result; presenting stale output as the current attempt’s output.

- **`error`**
  - **Represents**: the current conversion attempt completed with a coherent standardized failure `ConversionResult`.
  - **Enter when**: a standardized result for the current attempt is received with `success === false` and structured `error` (including `error.code`).
  - **Display/preserve**: show a failure state derived from structured backend error information; preserve failure identity for UI/state coherence (e.g. `error.code`); ensure the UI communicates that the latest attempt failed.
  - **Avoid**: flattening the failure into generic string-only state; masking failure with a success UI; showing stale prior output *as if it were produced by the failed attempt*.

#### Expected high-level state transitions

- `idle -> loading`: when the user initiates a conversion.
- `loading -> success`: when the current attempt returns a coherent standardized success result.
- `loading -> error`: when the current attempt returns a coherent standardized failure result.
- `success -> loading`: when a new conversion begins after a previous success.
- `error -> loading`: when a new conversion begins after a previous failure.
- `success -> idle` / `error -> idle`: when transient indicators are dismissed/cleared and no attempt is in flight.

#### Acceptable vs. unacceptable state behavior

- **Acceptable**
  - Enter `loading` immediately when a conversion attempt starts.
  - Clear or visually demote misleading prior indicators when a new attempt starts (e.g. prior “success” should not appear as the current attempt’s success).
  - Enter `success` only when the current attempt produced a coherent standardized success result.
  - Enter `error` only when the current attempt produced a coherent standardized failure result.

- **Unacceptable**
  - Remaining visually in a previous “success” state during a new `loading` attempt without clear distinction.
  - Showing stale success output as if it belongs to the current failed conversion.
  - Treating request completion as success without reading standardized result semantics.
  - Keeping conflicting indicators active simultaneously (e.g. “success” and “error” both representing the current attempt).

Sub-step 3.3.4 will define the frontend enrichment/interpretation boundary for contract-safe UI behavior.

### Step 3.3.4 — Frontend Enrichment and Interpretation Boundary (AsciiDoc -> Markdown)

This sub-step defines what the frontend may safely interpret, enrich, and minimally normalize from a standardized backend `ConversionResult` without breaking contract semantics.

- Migrated path: **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Confirmed Step 3 alignment target: `api/frontend/src/App.tsx` (`handleConvert`)

#### Acceptable frontend interpretation/enrichment behaviors

- Derive UI outcome (`success`/`error`) from standardized result semantics (`success` plus structured `error` when failure).
- Render converted output in the intended result area from backend-provided conversion data for the current attempt.
- Show readable failure information derived from structured backend failure fields (primarily `error.message`, optionally `error.details`).
- Use documented `error.code` values for limited, explicit UI decisions when relevant.
- Surface auxiliary backend metadata/log context (`warnings`, `logs`, `durationMs`, `conversionId`, timestamps, `meta`) for UI/supporting context without changing primary semantics.
- Add purely presentational enrichment (labels, icons, color states, badge text) that does not alter backend meaning.

#### Acceptable minimal normalization behaviors (contract-safe)

- Map standardized backend fields into local view-model/state fields while preserving original semantics.
- Preserve array/object structures (`warnings`, `logs`, `meta`, structured `error`) when adapting data for display.
- Compute presentational booleans (e.g. `isSuccessState`, `isErrorState`) from standardized result semantics without discarding source structured data.
- Clear or demote stale display artifacts when a newer result supersedes an older one, while keeping conversion-attempt coherence.

#### Unacceptable reshaping/flattening/invention behaviors

- Rebuilding a legacy ad hoc frontend conversion-result model while ignoring the standardized backend result structure.
- Flattening structured `error` into an opaque generic string-only local model.
- Replacing `error.code` semantics with arbitrary local guesses or message-substring heuristics when structured code is available.
- Treating incomplete local heuristics as more authoritative than the backend result semantics.
- Inferring success/failure from unrelated UI state when the backend result already defines outcome semantics.
- Hiding or dropping meaningful backend fields needed for coherent state transitions and UI interpretation.
- Presenting stale output or stale errors as if they belong to the current conversion attempt.

Runtime remediation begins in sub-step 3.4.1.

### Step 3.6.1 — Step 3 Alignment Summary (Migrated AsciiDoc -> Markdown)

This sub-step summarizes the concrete frontend/UI alignment outcomes completed in Step 3 for the already migrated AsciiDoc -> Markdown path (`downdoc`).

Aligned in Step 3 (frontend/UI technical outcomes):
- Confirmed `api/frontend/src/App.tsx` (`handleConvert`) as the Step 3 frontend/UI alignment target for the migrated path.
- Established standardized success-result consumption at this layer (success semantics tied to coherent backend `ConversionResult` success data for the current attempt).
- Established standardized failure-result consumption at this layer (structured backend failure semantics preserved, including meaningful `error` and relevant `error.code` handling).
- Aligned intermediate frontend state behavior (`idle` / `loading` / `success` / `error`) with coherent attempt-bound transitions.
- Reduced legacy/ad hoc frontend result/error shaping on the migrated path (less string-only flattening and less heuristic-only outcome handling where structured backend semantics are available).
- Verified that standardized backend semantics survive through the real frontend flow for both success and failure attempts.
- Verified preservation of standardized backend semantics to the effective UI output boundary (result visibility, error visibility, and state coherence for the current attempt).
- Broadened representative end-to-end frontend scenario coverage beyond a single success/failure pair for the migrated path.

Frontend/UI alignment vs. remaining out of scope:
- Aligned: frontend consumption, state transitions, and visible output/error coherence for the migrated AsciiDoc -> Markdown flow at the confirmed target layer.
- Not in scope (for this sub-step): alignment of other conversion flows, global UI architecture redesign, and broader frontend behavior harmonization beyond the migrated path.

Next: sub-step 3.6.2 will document the reusable frontend alignment pattern derived from these confirmed Step 3 outcomes.

### Step 3.6.2 — Reusable Frontend/UI Alignment Pattern (Migrated AsciiDoc -> Markdown)

This sub-step documents the reusable Step 3 frontend/UI alignment pattern validated on the already migrated AsciiDoc -> Markdown path (`downdoc`).

Reusable sequence (practical pattern):
- Identify the real frontend/UI alignment target where conversion outcomes are coordinated above raw API transport.
- Map nominal and failure-oriented UI flows for the selected path, including visible output boundary behavior.
- Identify frontend contract-risk points where structured backend semantics can be flattened, ignored, or replaced by ad hoc heuristics.
- Define target behavior for success consumption, failure consumption, state transitions (`idle` / `loading` / `success` / `error`), and interpretation/enrichment boundaries.
- Remediate success-result consumption so standardized backend success semantics become the source of truth.
- Remediate failure-result consumption so structured backend failure semantics (including meaningful `error.code`) are preserved.
- Remediate intermediate/frontend state transitions to remove stale/conflicting indicators across repeated attempts.
- Verify behavior at the confirmed alignment target.
- Verify end-to-end success and end-to-end failure behavior for the same migrated path.
- Broaden representative scenario coverage with a minimal maintainable set of frontend checks.
- Verify that standardized backend semantics remain coherent at the effective UI output boundary.

Why this pattern matters:
- It prevents premature broad UI refactors by constraining work to one confirmed alignment target and one migrated path at a time.
- It keeps frontend alignment localized, testable, and auditable.
- It preserves backend semantics through the UI layer instead of rebuilding local legacy meaning.

How future frontend/UI flows should apply this pattern:
- Align one conversion path at a time.
- Document nominal/failure flow behavior before broad implementation changes.
- Consume structured backend results as the source of truth.
- Preserve success/failure semantics instead of replacing them with local heuristics.
- Verify both target-layer behavior and end-to-end visible behavior before expanding scope.

Next: sub-step 3.6.3 will formalize the Definition of Done for Step 3 based on these confirmed outcomes.

### Step 3 Definition of Done (release 0.0.1.4.6)

Step 3 is considered complete only when all criteria below are satisfied for the already migrated AsciiDoc -> Markdown path:

- The real frontend/UI alignment target has been identified.
- The nominal frontend/UI flow has been mapped.
- The failure-oriented frontend/UI flow has been mapped.
- Frontend contract-risk points have been identified.
- Target success-path frontend behavior has been defined.
- Target failure-path frontend behavior has been defined.
- Target `idle / loading / success / error` frontend state behavior has been defined.
- Acceptable frontend interpretation, enrichment, and normalization boundaries have been defined.
- The confirmed frontend alignment target correctly consumes standardized successful backend `ConversionResult` objects for the migrated path.
- The confirmed frontend alignment target correctly consumes standardized failed backend `ConversionResult` objects for the migrated path.
- The confirmed frontend alignment target handles frontend state transitions coherently for the migrated path.
- Legacy ad hoc frontend result/error shaping has been reduced or removed at this layer for the migrated path.
- End-to-end frontend success verification passes through the real flow.
- End-to-end frontend failure verification passes through the real flow.
- Representative end-to-end frontend scenario coverage exists for the migrated path.
- Standardized backend semantics survive to the effective UI output boundary for the migrated path.
- The reusable Step 3 frontend alignment pattern has been documented.

What Step 3 does **not** require:
- Migration of all frontend conversion flows.
- Redesign of the whole UI.
- Migration of all converters.
- Broad architecture/state-management redesign.
- Backend contract redesign.

Why this Definition of Done matters:
- It marks the transition from backend-only standardization toward frontend preservation of standardized semantics.
- It removes ambiguity about Step 3 closure criteria.
- It establishes a clean baseline for later UI work without reopening already-settled alignment questions for this migrated path.

### Step 3 Completion Summary

Step 3 closure note (release `0.0.1.4.6`): Step 3 successfully established contract-aligned frontend/UI behavior for the already migrated AsciiDoc -> Markdown runtime path (`downdoc`).

#### A. What Step 3 achieved
- Established frontend/UI preservation of standardized backend `ConversionResult` semantics for the first migrated runtime path.
- Reduced/removed legacy ad hoc frontend result/error shaping on the migrated path.
- Aligned success-path, failure-path, and frontend-state behavior at the confirmed UI coordination layer.
- Completed end-to-end validation that standardized backend semantics survive through the real frontend flow.

#### B. What concrete frontend adoption was achieved
- The AsciiDoc -> Markdown path is now preserved not only in backend layers, but also through the surrounding frontend/UI coordination layer.
- Success and failure remain semantically aligned through the real frontend flow for this migrated path.
- The effective UI output boundary now preserves standardized backend semantics for this migrated path.
- Representative end-to-end frontend verification was completed for this path.

#### C. What Step 3 now provides to the project
- A validated frontend-layer preservation baseline for standardized conversion semantics.
- A reusable frontend/UI alignment pattern for future flow alignments.
- A stronger reference path for later frontend/backend flow migrations.
- A cleaner foundation for subsequent UI refinement work.

#### D. What remains outside Step 3
- Step 3 completion does not imply that all frontend flows are aligned.
- Step 3 completion does not imply that the whole UI has been redesigned.
- Step 3 completion does not imply that all converters/flows are migrated.
- Step 3 completion does not imply that broader frontend architecture/state-management redesign is complete.
- Step 3 completion does not imply that future UX refinement is complete.

#### E. Transition note
- Future work should build on the Step 1 + Step 2 + Step 3 baseline and avoid reopening already validated contract, backend-alignment, and first-UI-alignment questions for the migrated AsciiDoc -> Markdown path.

### Step 4.1.1 — Candidate Paths for the Second Real Migration Wave

Step 4 starts by identifying plausible candidate conversion paths for the second real migration wave after the completed AsciiDoc -> Markdown path.

Plausible candidate paths (grounded in current codebase):

| Candidate path | Current readiness / relevance | Why this is a plausible Step 4 candidate |
|---|---|---|
| **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`) | High readiness; explicit dedicated backend route and dedicated frontend converter (`markdown-to-asciidoc.ts`) already in use patterns similar to the migrated path. | Closest sibling to the first migrated path (bidirectional pair), bounded scope, high representative value for validating repeatability of the same model. |
| **Plain text -> Markdown** (`POST /api/text-to-markdown`, module `text2markdown`) | Medium-high readiness; explicit backend route + dedicated lazy-load module + explicit frontend generic endpoint mapping. | Small/contained converter behavior with clear boundaries; good low-risk candidate for a second real migration with contract-preservation checks. |
| **HTML -> target format (notably HTML -> Markdown)** (`POST /api/from-html`) | Medium readiness; dedicated backend route exists and frontend generic converter maps HTML conversions to this endpoint. | Real production path with different input characteristics; useful representative value for testing model reuse beyond AsciiDoc/Markdown text-only shape. |
| **Generic secured conversions via `/api/convert`** (`fromFormat`/`toFormat` with token) | Medium readiness but broad scope; route and frontend path exist, backed by secure conversion flow. | Plausible but larger candidate family; useful for later expansion after one bounded second-path migration is validated. |

Note: the primary Step 4 migration target will be selected in sub-step 4.1.2.

### Step 4.1.2 — Primary Step 4 Migration Target Selection

This sub-step selects the single primary migration target for the second real Step 4 end-to-end wave.

Selected primary target:
- **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)

Why this path is selected over other candidates:
- It has high current readiness in both backend and frontend layers (dedicated backend route and dedicated frontend converter path already present).
- It is the most bounded and low-risk candidate among real existing paths, with clear scope and limited ambiguity.
- It is the strongest functional complement to the first migrated path (`adoc -> md`), providing a near-symmetric counterpart with similar operational shape.

Why this is a strong second migration target for model generality:
- It validates that the Step 1 / Step 2 / Step 3 migration/alignment model is reusable on a second real path that is close enough for controlled comparison but distinct enough to test repeatability.
- It provides high representative value for bidirectional document-conversion behavior without requiring broad architecture changes.
- It offers a practical baseline before expanding to broader or more heterogeneous families (e.g. generic `/api/convert` combinations).

Note: official Step 4 target confirmation will be completed in sub-step 4.1.3.

### Step 4.1.3 — Official Step 4 Target Confirmation

This sub-step formally confirms the official Step 4 migration target for the second real end-to-end migration wave.

Confirmed official Step 4 target:
- **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)

Why this is the correct Step 4 focus:
- It is the strongest grounded candidate from the identified set, with dedicated backend/frontend paths already in place and a bounded migration scope.
- It provides a near-symmetric counterpart to the first migrated path (`adoc -> md`), making comparison and repeatability validation technically robust.

What Step 4 will validate through this target:
- Reuse of the standardized `ConversionResult` contract on a second real converter path.
- Reuse of centralized result-helper semantics and standardized error-code semantics.
- Reuse of backend/orchestrator alignment method on a second runtime flow.
- Reuse of frontend/UI alignment method to preserve semantics to the effective UI output boundary.
- Confirmation that the migration/alignment model is reusable beyond a single path.

Note: detailed converter-flow mapping for this confirmed target begins in sub-step 4.2.1.

### Step 4.2.1 — Current Runtime Flow Mapping Before Helper Integration (Markdown -> AsciiDoc)

This sub-step maps the current runtime behavior of the confirmed Step 4 target before payload mapping to centralized `ConversionResult` helpers.

- Selected second migration target: **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)

Current runtime flow (grounded, step-by-step):
1. **Entry point**: `api/backend/routes/conversion.routes.js`, route `POST /to-asciidoc`.
2. **Request validation**: route-level `validate(...)` requires `body.text` as a non-empty string (`z.string().min(1)`).
3. **Route pre-check**: if `!text.trim()`, handler returns HTTP `400` with `{ detail: "The text to convert is empty" }`.
4. **Conversion dispatch**: route calls `convertMarkdownWithPandoc(text)` from `api/backend/services/conversion/convert.js`.
5. **Converter input handling** (`convertMarkdownWithPandoc`):
   - validates markdown input (`non-empty string`),
   - creates temp workspace (`ascend-pandoc-*`),
   - writes `input.md`,
   - prepares `output.adoc`.
6. **Execution**: runs Pandoc through `safeSpawn('pandoc', ['-f','markdown','-t','asciidoc','-o', outputFile, inputFile], timeout 30000ms)`.
7. **Success branch**:
   - reads `output.adoc`,
   - applies light formatting normalization (`trimEnd() + '\n'`),
   - returns AsciiDoc string to route.
8. **Route success response**:
   - logs success,
   - returns HTTP `200` with `{ asciidoc: <converted string> }`.
9. **Failure branch in converter**:
   - timeout security error -> throws `Error('Pandoc conversion timed out')`,
   - other failures -> throws `Error('Failed to execute Pandoc conversion')`,
   - temp files/directories are cleaned in `finally`.
10. **Route failure response**:
   - catches thrown error,
   - logs error,
   - returns HTTP `500` with `{ detail: "Conversion error: ..." }`.

Current success path shape:
- HTTP `200` JSON payload: `{ asciidoc: string }` (string result payload, no standardized `ConversionResult` envelope yet on this target path).

Current failure path shape:
- HTTP `400` validation/pre-check failures and HTTP `500` conversion/runtime failures use route-level `{ detail: string }` responses.
- Failure information is primarily string-based at route output for this path.

Integration-relevant observation (grounded):
- This target currently follows a direct route + converter-string-return pattern (`{ asciidoc }` / `{ detail }`) rather than the standardized helper-built `ConversionResult` shape used in the first migrated path; this is the main integration gap for upcoming Step 4 helper mapping.

Next: payload mapping to centralized helpers for this confirmed target begins in sub-step 4.2.2.

### Step 4.2.2 — Payload Mapping to Centralized Helpers (Markdown -> AsciiDoc)

This sub-step defines payload mapping for the confirmed Step 4 target before runtime helper integration.

- Selected second migration target: **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)

#### Success-path payload mapping (`createSuccessResult(payload)`)

| Helper payload field | Current runtime source | Integration mapping note |
|---|---|---|
| `conversionId` | Not currently created in `/to-asciidoc` path | Derive locally at integration time (generate per-attempt ID in route/service layer). |
| `converter` | Route uses Pandoc via `convertMarkdownWithPandoc(...)` | Set to `"pandoc"` for this target path. |
| `pipeline` | Implicit in route + converter call | Set to `["markdown->asciidoc"]` (bounded path identity). |
| `inputFormat` | Route is explicitly Markdown source | Set to `"markdown"`. |
| `outputFormat` | Route target is AsciiDoc | Set to `"asciidoc"`. |
| `inputFile` | `convertMarkdownWithPandoc` writes temp `input.md` | Derive from temp input file context at integration (`originalName`, `storedPath`, `size`, `mimeType`) while file still exists. |
| `outputFile` | `convertMarkdownWithPandoc` writes temp `output.adoc` | Derive from temp output file context before cleanup (path/size/mime). |
| `startedAt` | Not currently tracked | Derive from local timestamp captured at attempt start. |
| `finishedAt` | Not currently tracked | Derive from local timestamp captured at attempt end. |
| `durationMs` | Not currently tracked | Derive from `finished - started` in milliseconds. |
| `warnings` | No warning list currently emitted in this path | Use helper default (`[]`) unless explicit warnings are added later. |
| `logs` | Route currently logs via `console.log` only | Map a bounded per-attempt log array (or helper default `[]` if not collected in integration step). |
| `meta` | No structured metadata object currently returned | Use helper default (`{}`) or minimal technical metadata if available. |

#### Failure-path payload mapping (`createFailureResult(payload)`)

| Helper payload field | Current runtime source | Integration mapping note |
|---|---|---|
| `conversionId` | Not currently created in `/to-asciidoc` path | Derive locally at integration time (same attempt ID as success path model). |
| `converter` | Failure occurs in Pandoc-based path | Set to `"pandoc"`. |
| `pipeline` | Implicit in selected path | Set to `["markdown->asciidoc"]`. |
| `inputFormat` | Route source format is Markdown | Set to `"markdown"`. |
| `outputFormat` | Route destination format is AsciiDoc | Set to `"asciidoc"`. |
| `inputFile` | Temp `input.md` exists during converter execution | Derive from available temp input context (or fallback object if failure occurs before file creation). |
| `startedAt` | Not currently tracked | Derive from local attempt-start timestamp. |
| `finishedAt` | Not currently tracked | Derive from local attempt-end timestamp. |
| `durationMs` | Not currently tracked | Derive from elapsed time at failure completion. |
| `error` | Currently flattened to thrown `Error(...)` then route `{ detail: ... }` | Build structured error object (`code`, `message`, `details`, `recoverable`) from known failure context at integration time. |
| `outputFile` | Temp output may not exist on failure; route currently does not expose it | Use `null` by default; include object only if grounded output artifact exists. |
| `warnings` | No warning list currently emitted | Use helper default (`[]`). |
| `logs` | Console logs exist but no structured per-attempt log payload | Map bounded attempt logs if collected; otherwise helper default (`[]`). |
| `meta` | No structured metadata object currently emitted | Use helper default (`{}`) or minimal error-context metadata if available. |

Integration-relevant observations (grounded):
- **Already directly available**: path identity (`markdown -> asciidoc`), converter family (`pandoc`), converted text (`asciidoc`) on success.
- **Requires local derivation during integration**: `conversionId`, timing fields, structured log collection, and stable `inputFile`/`outputFile` blocks before temp cleanup.
- **Currently missing as structured runtime output**: helper-aligned `error` object (`code/message/details/recoverable`) and normalized `meta`/`warnings` fields.

Next: runtime integration of the success path for this confirmed target begins in sub-step 4.2.3.

### Step 4.3.2 — Backend/Orchestrator Flow Mapping (Second Migrated Path)

This sub-step maps the backend/orchestrator flow of the second migrated path through the confirmed Step 4.3 alignment target.

- Second migrated conversion path: **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)
- Confirmed Step 4.3 alignment target: `api/backend/routes/conversion.routes.js` (`/to-asciidoc` handler)

#### Nominal backend flow (success-oriented)

1. Request enters `POST /api/to-asciidoc` in `conversion.routes.js`.
2. Route-level validation (`validate` + `zod`) enforces `body.text` as non-empty string input shape.
3. Route creates per-attempt coordination context (`conversionId`, `startedAt`, `startedAtMs`).
4. Route invokes `convertMarkdownWithPandoc(text)` from `services/conversion/convert.js`.
5. Converter creates temp files (`input.md`, `output.adoc`) and executes Pandoc via `safeSpawn(...)`.
6. Converter returns converted AsciiDoc string to route on successful execution.
7. Route builds standardized success result via `createSuccessResult(...)` (mapped payload fields).
8. Route returns HTTP `200` with both `asciidoc` and `conversionResult` (success contract propagation to boundary).

#### Failure-oriented backend flow

1. **Pre-conversion failure branch**: blank/trimmed-empty input in route pre-check.
2. Route builds standardized failure via `createFailureResult(...)` with grounded `EMPTY_INPUT`.
3. Route returns HTTP `400` with failure `conversionResult` fields plus legacy-compatible `detail`.
4. **Runtime/conversion failure branch**: converter throws (pandoc failure/timeout/other internal exception).
5. Route catch block classifies error context (`CONVERSION_FAILED` for pandoc execution class; `INTERNAL_ERROR` for unexpected route-internal class).
6. Route builds standardized failure via `createFailureResult(...)` including structured `error` (`code/message/details`) and returns HTTP `500` with `detail` aligned to `error.message`.

#### Where standardized `ConversionResult` is first created in this path

- First creation point is currently the confirmed alignment target itself (`conversion.routes.js`) via:
  - `createSuccessResult(...)` on success,
  - `createFailureResult(...)` on pre-check and catch failure branches.

#### Upward propagation through backend layers

- For this path, propagation is short and direct:
  - route handler receives request,
  - converter function returns/throws,
  - alignment target creates standardized result,
  - route returns final HTTP JSON payload.
- No lazy-load module registry/orchestrator dispatch layer is traversed for this selected path.

#### Grounded contract-risk observations (current state)

- Standardized result creation and final return both occur at route level; this centralizes control but also means route-layer shaping directly defines contract integrity for this path.
- Legacy-compatible `detail` is still appended in failure responses; contract remains preserved, but wrapper consistency must remain monitored in later alignment checks.

Next: contract-risk point identification and target-behavior definition for this backend/orchestrator target follow in sub-step 4.3.3.

### Step 4.3.3 — Contract-Risk Points and Target Backend/Orchestrator Behavior (Second Migrated Path)

This sub-step identifies the contract-risk points and defines target backend/orchestrator behavior for the second migrated path before runtime remediation.

- Second migrated conversion path: **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)
- Confirmed Step 4.3 alignment target: `api/backend/routes/conversion.routes.js` (`/to-asciidoc` handler)

#### Exact contract-risk points (grounded)

| Component / layer | Why it is a contract-risk point | Risk type |
|---|---|---|
| `api/backend/routes/conversion.routes.js` (`/to-asciidoc` response shaping) | Final standardized result creation and HTTP payload shaping happen in the same layer. Any local response-shape tweak directly affects contract integrity. | Reshaping risk at final backend boundary; potential field loss/wrapping drift if route logic changes. |
| `api/backend/routes/conversion.routes.js` (`detail` compatibility wrapper on failures) | Failure responses currently include both standardized fields and `detail`. This is compatible, but can drift if future edits prioritize wrapper-only output. | Wrapper drift risk; potential reversion to ad hoc error-only shape. |
| `api/backend/services/conversion/convert.js` (`convertMarkdownWithPandoc` throw-based internals) | Converter internals throw generic `Error(...)`; route currently normalizes these, but throw messages can still influence classification quality and details precision. | Internal-error classification granularity risk; potential overly generic failure mapping if not normalized consistently. |
| Route-level pre-check and validation split (`validate` middleware + route trim check) | Multiple input rejection points exist (middleware and route pre-check). Consistency must be preserved so both remain contract-coherent where applicable. | Inconsistent failure envelope risk between early validation and route-level failures. |

#### Already safe vs. still needs Step 4.3 alignment work

- **Already safe (current state):**
  - Success branch creates standardized result via `createSuccessResult(...)`.
  - Failure branches create standardized results via `createFailureResult(...)`.
  - Internal runtime exceptions are normalized at the confirmed alignment target (no raw throw escapes from this path to the client).

- **Still needs alignment attention:**
  - Keep route-layer payload shaping stable so `conversionResult` remains primary and required fields are never stripped.
  - Keep failure compatibility wrapper (`detail`) additive-only and prevent drift toward wrapper-only failures.
  - Keep error-code classification grounded and specific where available (avoid regressions toward generic-only classifications).

#### Target backend/orchestrator behavior for this path

- **Success preservation**
  - Preserve standardized success result as primary return shape for the current attempt.
  - Keep required root fields intact and semantically coherent (`success:true`, `error:null`, valid output metadata).

- **Failure preservation**
  - Preserve standardized failure result as primary failure shape (`success:false`, structured `error`, coherent `outputFile` failure semantics).
  - Keep `error.code` meaningful and aligned with documented semantics.

- **Internal-error handling**
  - Convert unexpected internal exceptions into standardized failure results at the alignment target.
  - Use `INTERNAL_ERROR` only when no more specific documented code is grounded by the failure context.
  - Preserve useful context in `error.details`/`meta` without leaking noisy or malformed internals.

- **Acceptable enrichment/normalization boundary**
  - Additive compatibility fields (e.g., `detail`) are acceptable only when they do not replace or contradict standardized fields.
  - Limited metadata/log enrichment is acceptable when contract shape and primary semantics remain unchanged.

- **Unacceptable reshaping/override behavior**
  - Reverting to ad hoc `{ detail }`-only failures or `{ asciidoc }`-only success without standardized result context.
  - Dropping required contract fields or flattening structured `error`.
  - Reclassifying specific grounded errors into generic codes without justification.
  - Mixing incompatible envelopes between success/failure branches.

Runtime remediation for these Step 4.3 contract-risk points begins in sub-step 4.3.4.

### Step 4.4.1 — Frontend/UI Alignment Target Identification (Second Migrated Path)

This sub-step starts frontend/UI alignment for the second migrated path (**Markdown -> AsciiDoc**) and identifies the real frontend coordination target before any UI refactoring.

#### Candidate frontend/UI coordination layers involved in this path

| Component / layer | Role in `markdown -> asciidoc` flow | Involvement level |
|---|---|---|
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) | First frontend consumer of backend `/api/to-asciidoc` response; parses HTTP payload, consumes `conversionResult`, and relays success/failure state to UI callbacks. | Direct |
| `api/frontend/src/App.tsx` (`handleConvert`) | Main conversion action handler; determines source text/output setter, triggers `convertText`, and wires status/error/state callbacks. | Direct |
| `api/frontend/src/App.tsx` (conversion states: `status`, `loading`, `conversionUiState`, `lastBackendConversionResult`) | Coordinates per-attempt lifecycle and keeps backend result semantics available at UI layer. | Direct |
| `api/frontend/src/App.tsx` (result panel rendering using `adocInput` / `mdOutput`) | Final UI boundary where converted AsciiDoc is displayed or stale content can be cleared/preserved. | Direct |
| `api/frontend/src/App.tsx` (error modal + notification rendering) | User-visible failure presentation (`showConversionErrorModal`, `conversionErrorMessage`, `notification`). | Direct |
| `api/frontend/src/converters/markdown-to-asciidoc.ts` | Legacy dedicated converter wrapper for same endpoint; not used by the active conversion trigger path in current `App.tsx`. | Secondary / inactive in primary runtime path |

#### Confirmed primary frontend/UI alignment target for Step 4.4

- **Primary target:** `api/frontend/src/App.tsx` (centered on `handleConvert` and its state/result coordination boundary).

#### Why this is the correct Step 4.4 focus

- `App.tsx` is where conversion attempts are orchestrated and where `convertText` is actually invoked for the active runtime path.
- `App.tsx` is where success/failure UI lifecycle is coordinated (`loading`, `status`, `conversionUiState`) and where backend `conversionResult` is stored (`lastBackendConversionResult`).
- `App.tsx` is also the effective UI output boundary (result content, notifications, modal), which is where backend semantics can still be preserved, flattened, ignored, or mismapped.
- `convertText` remains an important direct participant, but the final frontend semantic preservation decision point for this path is the `App.tsx` coordination layer.

Next: detailed frontend/UI flow mapping for this confirmed target begins in sub-step 4.4.2.

### Step 4.4.2 — Frontend/UI Flow Mapping (Second Migrated Path)

This sub-step maps the frontend/UI flow of the second migrated path through the confirmed Step 4.4 alignment target before frontend remediation.

- Second migrated conversion path: **Markdown -> AsciiDoc**
- Confirmed Step 4.4 alignment target: `api/frontend/src/App.tsx` (`handleConvert` and UI state/display coordination), with direct API consumption in `api/frontend/src/converters/generic-converter.ts` (`convertText`)

#### Nominal frontend/UI flow (success-oriented)

1. User triggers conversion from the main page (`App.tsx`), typically through the convert action handled by `handleConvert`.
2. `handleConvert` computes `sourceText` from current UI state (`mdOutput` when source is Markdown), prepares `setOutput` (writes AsciiDoc result into `adocInput` when target is AsciiDoc), and calls `convertText(...)`.
3. `convertText` selects endpoint `POST /api/to-asciidoc`, sets attempt lifecycle to loading (`setLoading(true)`, `setConversionUiState('loading')`), and clears transient stale UI indicators.
4. Backend returns `200` with `{ asciidoc, conversionResult }`.
5. `convertText` first consumes `conversionResult` (validates boolean `success`, requires `success === true`, forwards it through `setBackendConversionResult`).
6. `convertText` then relays converted text via `setOutput(asciidoc)`, updates status/notification to success, and sets `conversionUiState('success')`.
7. `App.tsx` state updates propagate to display layers: result panel shows updated AsciiDoc content (`adocInput`), success status/notification is visible, and loading ends.

#### Failure-oriented frontend/UI flow

1. User triggers conversion through the same `handleConvert` path.
2. `convertText` enters loading lifecycle and sends `POST /api/to-asciidoc`.
3. On non-OK HTTP response, `convertText` parses JSON and checks for structured backend failure (`success:false` + structured `error`).
4. When structured failure is present, `convertText` is the first frontend consumer of that standardized failure; it stores it via `setBackendConversionResult(structuredFailure)`.
5. `convertText` derives user-visible failure signals from structured payload (notably `error.code` / `error.message`), sets status/notification error, optionally opens modal for selected conversion codes, and sets `conversionUiState('error')`.
6. `App.tsx` applies these callbacks to UI state and display layers (error notification/modal + failed lifecycle state), then loading ends.
7. Final visible outcome is an error-state UI attempt with no success confirmation for that attempt; backend failure semantics are available in `lastBackendConversionResult`.

#### First frontend consumption point of standardized backend result

- First consumption point for both success and structured failure is `api/frontend/src/converters/generic-converter.ts` (`convertText`) immediately after HTTP response parsing, before final UI rendering in `App.tsx`.

#### Propagation through frontend state/display layers

- `convertText` -> callback relay (`setBackendConversionResult`, `setConversionUiState`, `setStatus`, `setNotification`, `setOutput`) -> `App.tsx` state (`lastBackendConversionResult`, lifecycle/status, content state) -> rendered panels/notification/modal in the effective UI boundary.

#### Grounded frontend contract-risk observations (current mapping)

- Success and failure are not fully symmetric at output clearing logic (`setOutput("")` stale-clear branch is currently guarded for the first migrated path, not this second path).
- Success display still relies on legacy payload fallback (`data.markdown || data.asciidoc || data.result`), which is compatible but can hide format-specific assumptions.
- If backend returns non-structured non-OK payload, frontend falls back to generic string error handling and may lose structured semantics.
- `lastBackendConversionResult` is populated for structured success/failure, but visible UI still primarily follows local status/notification conventions rather than direct rendering of full contract fields.

Next: contract-risk points and target frontend/UI behavior definition for this confirmed target follow in sub-step 4.4.3.

### Step 4.4.3 — Frontend/UI Contract-Risk Points and Target Behavior (Second Migrated Path)

This sub-step identifies frontend/UI contract-risk points and defines target frontend behavior for the second migrated path before runtime remediation.

- Second migrated conversion path: **Markdown -> AsciiDoc**
- Confirmed Step 4.4 alignment target: `api/frontend/src/App.tsx` (conversion coordination boundary), with first response consumption in `api/frontend/src/converters/generic-converter.ts` (`convertText`)

#### Exact frontend/UI contract-risk points (grounded)

| Component / layer | Why it is a contract-risk point | Risk type |
|---|---|---|
| `api/frontend/src/converters/generic-converter.ts` (`setOutput("")` stale-clear gating) | Output stale-clear on structured failure is currently gated by `isMigratedAdocToMarkdown` and is not symmetric for `markdown -> asciidoc`. | Stale-success residue risk after failed second-path attempts. |
| `api/frontend/src/converters/generic-converter.ts` (success payload fallback: `data.markdown || data.asciidoc || data.result`) | Result selection accepts multiple legacy keys and does not enforce path-specific success payload semantics beyond basic availability. | Legacy-shape fallback risk; possible semantic drift if payload keys vary. |
| `api/frontend/src/converters/generic-converter.ts` (non-structured failure fallback) | When non-OK responses are not structured (`success:false` + `error`), flow falls back to generic string error messaging. | Structured error flattening risk (`error.code/details` loss). |
| `api/frontend/src/App.tsx` (`status`/`notification` as primary visible signals) | Final UI messaging is mostly derived from local status/notification conventions rather than explicit rendering of structured backend fields. | Semantic compression risk (rich backend context reduced to generic UI strings). |
| `api/frontend/src/App.tsx` (`handleConvert` + panel state model `adocInput`/`mdOutput`) | Result/source panel state mapping is format-dependent and can preserve stale values if failure handling is not consistently aligned. | Asymmetric success/failure panel coherence risk at UI boundary. |

#### Already safe vs. still needs Step 4.4 alignment

- **Already safe (current state):**
  - Structured `conversionResult` is consumed first in `convertText` for both success and structured failure.
  - Structured success/failure is propagated to `App.tsx` via `setBackendConversionResult`.
  - Attempt lifecycle state transitions are explicitly wired (`loading -> success` and `loading -> error`) through `setConversionUiState`.

- **Still needs alignment attention:**
  - Failure stale-output handling symmetry for the second migrated path.
  - Stronger frontend reliance on standardized structured failure semantics over generic fallback strings.
  - Tighter success-path coupling to expected path payload shape while preserving backward-compatible handling.
  - UI boundary consistency so failure attempts cannot appear as current successful output due to stale state.

#### Target frontend/UI behavior for this path

- **Success consumption/rendering**
  - Consume standardized success `conversionResult` as the authoritative attempt result for this path.
  - Keep required success semantics coherent at UI boundary (`success:true`, `error:null`) while rendering returned AsciiDoc output for the same attempt.

- **Failure consumption/rendering**
  - Preserve standardized failure semantics (`success:false`, structured `error`) without flattening to string-only error models when structured data is available.
  - Preserve and surface meaningful `error.code`-driven behavior consistently for this path.

- **Frontend state transitions (`idle/loading/success/error`)**
  - New attempt starts from clean transient state, enters `loading`, and lands deterministically in `success` or `error` for that same attempt.
  - Failure attempts must not leave stale successful output/state presented as current attempt outcome.

- **Acceptable interpretation/enrichment boundary**
  - Additive UI interpretation is acceptable (status text, notifications, modal routing) when it does not rewrite backend success/failure semantics.
  - Minimal normalization is acceptable for display/readability if structured contract meaning is preserved.

- **Unacceptable flattening/reshaping/stale-state behavior**
  - Replacing structured backend failures with generic string-only UI errors when structured failure is present.
  - Ignoring meaningful `error.code` semantics and collapsing failures into undifferentiated local categories.
  - Treating stale panel content as current-attempt success after failure.
  - Rebuilding incompatible frontend-only success/failure envelopes that contradict backend `ConversionResult`.

Runtime remediation for these Step 4.4 frontend/UI contract-risk points begins in sub-step 4.4.4.

### Step 4.5.1 — Cross-Path Comparison (First vs Second Migrated Flows)

This sub-step compares the first and second migrated paths to identify reusable migration/alignment elements, path-specific details, and what Step 4 validates about model generality.

- First migrated conversion path: **AsciiDoc -> Markdown**
- Second migrated conversion path: **Markdown -> AsciiDoc**

#### Shared vs different characteristics

| Comparison area | Shared across both paths | Path-specific differences |
|---|---|---|
| Converter-level migration | Standardized `ConversionResult` semantics are enforced for success and failure. | First path runs through lazy-load module orchestration (`downdoc`); second path uses direct Pandoc route-level integration (`/to-asciidoc`). |
| Backend/orchestrator preservation | Route-level boundary preserves structured success/failure envelopes and keeps `detail` as additive compatibility field. | Failure classification inputs differ by converter internals and orchestration depth; second path relies on `classifyToAsciidocInternalError` for route-level normalization. |
| Frontend/UI preservation | `convertText` is first frontend consumer; structured result is relayed to `App.tsx` (`lastBackendConversionResult`, `conversionUiState`). | Success payload key differs by path (`markdown` vs `asciidoc`), and stale-output handling needed explicit second-path symmetry hardening. |
| Verification style | Focused contract checks and minimal scenario-based validations were used at each layer, with explicit success/failure assertions and structured-field expectations. | Scenario sets are path-oriented (different endpoint, payload, and converter-error triggers), including second-path internal-error route checks and markdown->asciidoc frontend sequence checks. |
| Error-shape handling | Structured `error` (`code`, `message`, optional details) is treated as primary failure semantics. | Error-code distribution depends on path runtime specifics (`EMPTY_INPUT`, `CONVERSION_FAILED`, `INTERNAL_ERROR` context and classifier behavior). |
| State/flow handling | Attempt lifecycle model (`idle/loading/success/error`) and stale-indicator clearing rules are shared alignment goals. | Path-level output ownership differs (`mdOutput` vs `adocInput` target panel), requiring path-aware stale-result protection. |

#### Reusable migration/alignment elements

- Central helpers and contract fields (`createSuccessResult`, `createFailureResult`, standardized root fields, structured `error`) are reusable across flows.
- Layered alignment sequence is reusable: converter migration -> backend/orchestrator boundary preservation -> frontend/UI consumption/state alignment -> focused verification.
- Verification approach is reusable: small contract assertions first, then representative scenarios, then boundary/coherence checks.
- Additive compatibility policy is reusable: preserve standardized shape as primary while keeping backward-compatible wrapper fields only as additive.

#### Path-specific integration details

- Converter runtime integration shape (lazy-load module path vs direct route+Pandoc path).
- Endpoint payload/result key wiring and panel ownership (`markdown` output vs `asciidoc` output).
- Error classification heuristics and route-level normalization context.
- UI stale-artifact risks tied to each path's target output state location.

#### What Step 4 now validates about model generality

- The migration/alignment model is not single-flow specific: it applies across two opposite-direction real conversions with different runtime plumbing.
- Standardized `ConversionResult` semantics can be preserved end-to-end (backend boundary through effective UI boundary) with localized, minimal adjustments rather than broad redesign.
- Cross-layer verification remains practical and repeatable for additional flows when the same alignment sequence is followed.

Next: sub-step 4.5.2 will document the reusable multi-flow migration/alignment pattern explicitly.

### Step 4.5.2 — Reusable Multi-Flow Migration/Alignment Pattern

This sub-step documents the reusable multi-flow migration/alignment pattern now validated across two real conversion paths (**AsciiDoc -> Markdown** and **Markdown -> AsciiDoc**).

#### Reusable end-to-end sequence

1. Select one bounded real conversion path.
2. Map the current converter runtime flow (success path, failure path, internal error behavior).
3. Map runtime payload inputs to `createSuccessResult()` and `createFailureResult()`.
4. Integrate success-path standardized result construction.
5. Integrate failure-path standardized result construction.
6. Harmonize converter internal errors into structured failure semantics.
7. Verify the converter path in isolation (focused success/failure scenarios).
8. Identify the backend/orchestrator alignment target for the selected path.
9. Map backend success/failure propagation through that target.
10. Identify backend contract-risk points.
11. Remediate backend preservation of standardized results.
12. Verify backend behavior at flow level and backend output boundary.
13. Identify the frontend/UI alignment target for the same path.
14. Map frontend success/failure consumption and state propagation.
15. Identify frontend contract-risk points.
16. Remediate frontend success/failure/state behavior with minimal localized changes.
17. Verify effective UI output boundary coherence (current-attempt ownership, stale-state control).
18. Compare against previously migrated paths to separate reusable elements from path-specific details.

#### Why this pattern matters

- It demonstrates that the migration/alignment model is reusable beyond a single conversion path.
- It reduces risk of path-specific ad hoc migrations by enforcing a stable layered method.
- It provides Ascend with a repeatable baseline for future converter migrations and alignments.

#### What stays stable vs. what stays path-specific

- **Stable (method-level):**
  - Standardized `ConversionResult` contract as primary success/failure envelope.
  - Layer order: converter -> backend/orchestrator -> frontend/UI -> verification/consolidation.
  - Risk-driven remediation style (minimal, localized, boundary-focused).

- **Path-specific (integration-level):**
  - Engine/runtime internals (lazy-load module behavior, direct Pandoc execution details, temp-file mechanics).
  - Error-detail granularity/classification inputs grounded in each converter path.
  - Local metadata assembly and compatibility-wrapper nuances.
  - UI display nuances tied to target-panel ownership and path-specific failure presentation.

Next: sub-step 4.5.3 will define concise Step 4 multi-flow convention, Definition of Done, and closure-oriented material.

### Step 4.5.3 — Step 4 Multi-Flow Convention and Definition of Done

This sub-step formalizes the concise multi-flow convention and official Definition of Done (DoD) for Step 4, based on the validated model across two real migrated paths.

#### Concise multi-flow convention for future migrated paths

- Keep converter naming Ascend-oriented and role-based.
- Use `createSuccessResult()` and `createFailureResult()` as the standard result-construction path.
- Standardize both success and failure at converter/route boundary before broad surrounding-layer work.
- Align backend/orchestrator preservation after converter migration.
- Align frontend/UI preservation after backend alignment.
- Verify in progression order: isolation first, then backend flow/boundary, then frontend flow/boundary.
- Preserve backend semantics in frontend layers; avoid rebuilding legacy local result/error models.
- Migrate one bounded real path at a time to keep verification and remediation grounded.

#### Official Definition of Done for Step 4

Step 4 is complete only if all criteria below are true:

- A second real conversion path is selected and formally confirmed.
- The second path is migrated to standardized `ConversionResult` helpers.
- Its success path is standardized.
- Its failure path is standardized.
- Its internal converter-level error handling is harmonized.
- The second path passes focused isolated verification.
- Backend/orchestrator alignment is performed for the second path.
- Backend/orchestrator success/failure preservation is verified.
- Backend/orchestrator internal coordination-layer error handling is remediated or safely preserved where reasonably possible.
- Frontend/UI alignment is performed for the second path.
- Frontend success and failure consumption is verified.
- Frontend state behavior is coherent for the second path.
- Standardized semantics survive to the effective UI output boundary.
- The first and second migrated paths are compared.
- A reusable multi-flow migration/alignment pattern is documented.

#### What Step 4 does not require

- Migration of all remaining conversion paths.
- Broad backend or frontend architecture redesign.
- Product-wide UI redesign.
- Simultaneous normalization of every engine at once.
- Inclusion of future converter additions in Step 4 closure.

#### Why this DoD matters

- It marks transition from one validated reference flow to a reusable multi-flow model.
- It removes ambiguity about what "generalization" means in Ascend migration work.
- It establishes a clean baseline for future converter migrations without reopening already validated decisions.

Next: the official Step 4 closure note follows in sub-step 4.5.4.

### Step 5.1.1 — Already Shared Elements Across Migrated Flows

Step 5 starts by identifying what is already genuinely shared across the two real migrated flows, before any consolidation refactoring.

#### Grounded shared elements (first and second migrated paths)

| Shared element | Why it is considered shared |
|---|---|
| Standardized `ConversionResult` envelope usage | Both migrated paths now expose structured success/failure results with the same root contract semantics at backend boundaries and through frontend consumption. |
| Structured failure error model (`error.code`, `error.message`, structured `error`) | Both paths preserve structured failure semantics and keep `error.code` meaningful in backend responses and frontend handling paths. |
| Centralized backend result-helper usage | Both migrations rely on standardized helper-based construction (`createSuccessResult()` / `createFailureResult()`) as the primary result-building method. |
| Converter naming/orientation convention | Both migrated converters follow Ascend-oriented, role-based naming/integration intent rather than ad hoc one-off naming. |
| Backend/orchestrator preservation principle | In both paths, backend alignment focuses on preserving standardized results end-to-end and keeping compatibility fields additive rather than replacing the contract. |
| Frontend/UI preservation principle | In both paths, frontend alignment uses first-consumption in conversion API layer and relays structured semantics into `App.tsx` state and visible UI outcomes. |
| Shared frontend lifecycle expectation (`idle/loading/success/error`) | Both paths use the same attempt-lifecycle model and require stale-indicator cleanup between attempts to keep current-attempt ownership coherent. |
| Shared verification pattern | Both paths were validated with layered checks: focused converter verification, backend/orchestrator verification, frontend/UI verification, and boundary-coherence checks. |
| Shared documentation/alignment pattern | Both paths were documented with the same sequence: target identification, flow mapping, contract-risk identification, remediation, and consolidation notes. |

Next: sub-step 5.1.2 will distinguish what is truly generic consolidation material from what remains path-specific integration detail.

### Step 5.1.2 — Generic vs Path-Specific Classification

This sub-step distinguishes generic consolidation candidates from elements that remain path-specific, based on grounded evidence across the two migrated flows.

#### Truly generic consolidation candidates (stable across migrated flows)

| Category | Why it is classified as generic |
|---|---|
| Standardized `ConversionResult` contract usage | Both flows preserve the same success/failure contract semantics at backend and frontend boundaries. |
| Structured error-model semantics | Both flows use structured failure (`success:false`, `error.code`, `error.message`, optional details) as primary failure meaning. |
| Helper-based result construction pattern | Both flows rely on `createSuccessResult()` / `createFailureResult()` as the standard construction path. |
| Backend/orchestrator preservation rule | Both flows enforce additive compatibility wrapping while keeping standardized contract fields primary. |
| Frontend first-consumption and relay pattern | Both flows consume structured result in conversion API layer and relay into `App.tsx` lifecycle/display state. |
| Shared attempt lifecycle expectation | Both flows align to `idle/loading/success/error` attempt ownership with stale-state cleanup requirements. |
| Layered verification structure | Both flows follow isolation -> backend/orchestrator -> frontend/UI -> boundary coherence verification progression. |
| Alignment documentation sequence | Both flows are documented with the same progression (target, flow map, risks, remediation, consolidation). |

#### Elements that remain path-specific (keep local for now)

| Category | Why it remains path-specific |
|---|---|
| Engine/runtime internals | First path uses lazy-load module orchestration (`downdoc`), second path uses direct Pandoc route integration. |
| Converter-level metadata assembly details | Field derivation inputs (timing, file metadata, transport context, output artifact conditions) differ by path execution mechanics. |
| Error-classification detail granularity | Internal failure classification signals and precise `error.details` content depend on path-specific runtime context. |
| Endpoint payload/result key nuances | Success payload keys and path-level output ownership differ (`markdown` vs `asciidoc` response/result handling). |
| UI target-panel ownership nuances | Result placement and stale-artifact risk differ because each path writes to different panel state (`mdOutput` vs `adocInput`). |
| Path-oriented representative scenario sets | Verification scenarios and fault-injection cases differ by converter behavior and route topology. |
| Compatibility wrapper surface details | Additive wrappers (for example `detail` usage context) remain tied to per-path integration history and consumers. |

Next: sub-step 5.1.3 will confirm which consolidation areas should be prioritized first.

### Step 5.1.3 — Step 5 Consolidation Priority Order

This sub-step prioritizes safe consolidation targets for Step 5, based on shared/generic elements already validated across both migrated flows.

#### High-priority consolidation targets (first wave)

| Area/category | Why high priority |
|---|---|
| Shared contract-preservation checklist (backend + frontend boundaries) | Highest reuse value across both flows, low implementation-risk profile, and direct impact on preventing semantic drift in future migrations. |
| Unified structured-failure handling convention (`error.code`-first semantics) | Already stable in both flows, low risk to formalize, and high maintainability value for consistent failure behavior and diagnostics. |
| Common verification skeleton (isolation -> backend -> frontend -> effective boundary) | Strongly reusable and already proven; codifying it first improves repeatability without forcing runtime unification. |
| Standard migration/alignment stage gates (target identification -> risk mapping -> remediation -> consolidation) | Provides immediate process clarity for future paths with minimal risk of path-specific breakage. |

#### Medium-priority consolidation targets (second wave)

| Area/category | Why medium priority |
|---|---|
| Shared naming/documentation templates for migrated-path sections | Useful for readability and consistency, but lower immediate runtime-safety impact than contract/verification conventions. |
| Cross-flow frontend state hygiene convention (`idle/loading/success/error` cleanup rules) | Reusable and valuable, but requires careful wording to avoid overspecifying path-local UI behavior. |
| Compatibility-wrapper usage guidance (additive-only policy wording) | Important governance topic, but partially tied to path-local legacy integration constraints. |

#### Deferred / keep path-local for now

| Area/category | Why deferred/path-local now |
|---|---|
| Engine/runtime internals (`downdoc` lazy-load orchestration vs direct Pandoc route behavior) | Different execution models with non-trivial local constraints; premature unification would increase breakage risk. |
| Path-specific metadata assembly details | Input/output artifact derivation differs per flow; should remain local until additional migrated paths confirm stronger commonality. |
| Path-specific error-detail granularity and classifier heuristics | Semantically related but operationally different across engines/routes; forcing early consolidation risks over-generalized error mapping. |
| UI target-panel ownership details (`mdOutput` vs `adocInput`) | Bound to path direction and current UI composition; should stay local until broader UI convergence is intentionally planned. |

Actual Step 5 consolidation implementation begins in sub-step 5.2.1.

### Step 5.2.4 — Shared Backend Convention Consistency Validation

This sub-step validates that shared backend conventions are now consistently applied across the two migrated backend paths where those conventions are intended to be common.

#### Shared backend conventions confirmed aligned

| Convention/category | Why considered aligned across both migrated paths |
|---|---|
| Helper-based standardized result construction | Both paths now use helper-driven `ConversionResult` construction patterns for route-level standardized failures, with additive `detail` compatibility preserved. |
| Structured error preservation | Both paths preserve structured `error` objects (`code`, `message`, optional details) and keep `detail` aligned to `error.message` in failure responses. |
| Success/failure contract shape expectations | Both paths expose contract-compliant root fields and maintain success/failure semantic separation without flattening into legacy-only envelopes. |
| Shared root-field conventions (`pipeline`, `warnings`, `logs`, `meta`) | Both paths consistently provide these fields with stable shape expectations (array/object semantics, path-appropriate values). |
| Route pre-check empty-input normalization | Both paths now route empty/blank input through standardized helper-based failure handling (`EMPTY_INPUT`) rather than ad hoc response branches. |
| Backend-side semantic preservation principle | Both paths preserve standardized semantics as primary payload meaning, with compatibility wrappers remaining additive-only. |

#### Differences that remain intentionally path-specific

| Category | Why intentionally path-specific |
|---|---|
| Converter/runtime execution model | `AsciiDoc -> Markdown` uses lazy-load `downdoc` orchestration; `Markdown -> AsciiDoc` uses direct Pandoc conversion flow. |
| Converter identity and pipeline values | `converter` and `pipeline` identifiers remain flow-specific by design (`downdoc` / `asciidoc->markdown` vs `pandoc` / `markdown->asciidoc`). |
| Input/output artifact metadata details | File naming, storage-path conventions, and output artifact semantics differ due to direction-specific runtime handling. |
| Internal error-classification detail context | Error-detail stage metadata remains grounded in each flow’s execution context (for example converter-execution vs route validation stages). |

Next: frontend convention consolidation begins in sub-step 5.3.1.

### Step 5.3.1 — Already Shared Frontend/UI Elements Across Migrated Flows

This sub-step starts frontend-side Step 5 consolidation by identifying what is already genuinely shared across the two migrated frontend/UI flows, before any frontend refactoring.

#### Grounded shared frontend/UI elements

| Shared element | Why it is considered shared |
|---|---|
| Structured success-result first consumption in conversion API layer | Both migrated flows consume backend success `conversionResult` first in `convertText` before final UI rendering decisions. |
| Structured failure-result first consumption in conversion API layer | Both migrated flows consume structured backend failure (`success:false`, structured `error`) in `convertText` rather than defaulting immediately to ad hoc local error models. |
| Shared relay into `App.tsx` conversion state | Both flows relay standardized backend result data through shared callbacks (`setBackendConversionResult`, `setStatus`, `setNotification`, `setConversionUiState`). |
| Shared lifecycle-state expectation (`idle/loading/success/error`) | Both flows follow the same attempt lifecycle expectation and use explicit `loading -> success/error` transitions. |
| Shared stale-state cleanup baseline at attempt start | Both flows clear transient stale indicators at new attempt start (notification/modal/error-message/backend-result reset) to reduce mixed-attempt artifacts. |
| Shared current-attempt ownership rule for result/error display | Both flows are expected to present current-attempt semantics (not previous-attempt residue) at the effective UI output boundary. |
| Shared structured error semantics for UI handling | Both flows preserve meaningful `error.code` availability for UI-level branching/notification semantics when structured failures are available. |
| Shared frontend interpretation/enrichment boundary | Both flows use additive presentation mapping (status text, notification, modal routing) while preserving backend semantic meaning as primary. |
| Shared frontend verification style | Both flows use focused contract-aware tests around `convertText`/UI state behavior, including success/failure and stale-state coherence checks. |
| Shared frontend documentation/alignment pattern | Both flows have been documented with the same sequence (target identification, flow mapping, contract-risk mapping, remediation, consolidation verification). |

Next: sub-step 5.3.2 will distinguish what is truly generic frontend consolidation material from what remains path-specific frontend behavior.

### Step 5.3.2 — Frontend Generic vs Path-Specific Classification

This sub-step distinguishes generic frontend/UI consolidation candidates from frontend elements that remain path-specific, based on grounded evidence across the two migrated UI flows.

#### Truly generic frontend/UI consolidation candidates

| Category | Why it is classified as generic |
|---|---|
| Structured success-result consumption contract | Both flows consume backend `conversionResult` as the primary success semantic source in `convertText` before final UI presentation. |
| Structured failure-result consumption contract | Both flows consume structured backend failures (`success:false`, structured `error`) as primary failure semantics when available. |
| Shared conversion callback relay model | Both flows relay result/state updates through the same callback interface into `App.tsx` (`setBackendConversionResult`, `setStatus`, `setNotification`, `setConversionUiState`). |
| Shared attempt lifecycle model (`idle/loading/success/error`) | Both flows depend on the same lifecycle-state expectations and deterministic `loading -> success/error` transitions. |
| Shared transient stale-state cleanup baseline | Both flows clear transient attempt indicators at new request start (notification/modal/error message/backend result). |
| Shared structured-error availability principle (`error.code`) | Both flows preserve `error.code` availability for UI-level handling/branching when structured failure is present. |
| Shared interpretation/enrichment boundary | Both flows use additive presentation mapping (status, notification, modal routing) without replacing backend semantic meaning. |
| Shared frontend verification structure | Both flows rely on focused, contract-aware tests around `convertText` behavior, state transitions, and stale-state coherence. |

#### Frontend elements that remain path-specific (keep local for now)

| Category | Why it remains path-specific |
|---|---|
| Result payload key and panel ownership nuances | Success payload/result ownership differs by direction (`markdown` vs `asciidoc`) and maps into different panel state slots (`mdOutput` vs `adocInput`). |
| Path-specific stale-output risk profile | Residual stale-output exposure differs by flow direction and target panel, so guard behavior remains flow-sensitive. |
| Path-oriented error display nuance | Modal/notification emphasis can vary by flow-specific failure signatures and historically established user-facing wording. |
| Path-specific view-model shaping details | Local source/result text selection logic in `handleConvert` depends on source/target direction and cannot be fully unified yet without broader UI changes. |
| Flow-specific representative test scenarios | Scenario inputs and expected UI artifacts differ by conversion direction and endpoint payload conventions. |
| Path-specific display/message wording | User-visible status/error text remains partially tuned per flow context and should not be over-normalized prematurely. |

Next: sub-step 5.3.3 will confirm which frontend/UI consolidation areas should be prioritized first.

### Step 5.3.3 — Frontend/UI Consolidation Priority Order

This sub-step prioritizes safe frontend/UI consolidation targets for Step 5, based on the generic vs path-specific classification already validated across both migrated UI flows.

#### High-priority frontend/UI consolidation targets (first wave)

| Area/category | Why high priority |
|---|---|
| Shared `convertText` contract-handling conventions | Highest reuse value and lowest risk: standardize the rules for consuming `conversionResult` (success/failure), preserving `error.code`, and enforcing current-attempt ownership without touching path-specific UI rendering. |
| Shared stale-state cleanup baseline at attempt start | Low-risk consolidation with high UX/consistency payoff; reduces mixed-attempt artifacts across both paths while remaining additive. |
| Shared lifecycle transition convention (`idle/loading/success/error`) | Stabilizes state semantics for both paths and future migrations; small, localized normalization yields maintainability gains without UI redesign. |
| Shared verification conventions for migrated flows | Consolidating test patterns (success/failure/stale-state sequences) improves confidence and repeatability without changing runtime behavior. |

#### Medium-priority consolidation targets (later wave)

| Area/category | Why medium priority |
|---|---|
| Shared UI messaging/notification conventions for structured failures | Valuable for consistency, but riskier because user-facing wording and modal routing can be path-sensitive. |
| Shared documentation/templates for frontend alignment sections | Improves readability and future migration speed, but does not directly change runtime safety. |
| Shared minimal normalization utilities (display-safe) | Useful, but must avoid creeping into path-specific view-model shaping; best after first-wave contract/state rules are locked. |

#### Deferred / keep path-local for now

| Area/category | Why deferred/path-local now |
|---|---|
| Target-panel ownership and payload key mapping (`mdOutput` vs `adocInput`, `markdown` vs `asciidoc`) | Direction-dependent and tightly coupled to current UI composition; premature unification risks breaking display semantics. |
| Path-specific error-display nuance and modal heuristics | Still partly tuned to flow-specific failure signatures; should remain local until a deliberate UX convergence step is planned. |
| `handleConvert` view-model shaping details | Highly dependent on source/target selection logic and broader UI structure; consolidation would be higher-risk without a broader design step. |

Actual frontend/UI consolidation implementation begins in sub-step 5.4.1.

### Step 5.4.4 — Shared Frontend/UI Convention Consistency Validation

This sub-step validates that shared frontend/UI conventions are now consistently applied across the two migrated frontend flows where those conventions are intended to be common.

#### Shared frontend/UI conventions confirmed aligned

| Convention/category | Why considered aligned across both migrated frontend flows |
|---|---|
| Structured success-result consumption as source of truth | Both flows now require a valid structured `conversionResult` and expected flow output field before treating a request as successful. |
| Structured failure-result consumption as source of truth | Both flows consume structured failures (`success:false`, structured `error`) directly in `convertText` rather than collapsing them into generic-only local errors. |
| Structured failure information preservation (`error.code`) | Both flows preserve `error.code` for notification/modal branching and keep failure semantics available in `lastBackendConversionResult`. |
| Shared lifecycle transition expectations (`idle/loading/success/error`) | Both flows follow the same attempt lifecycle convention with deterministic loading-to-terminal-state transitions. |
| Shared stale-state clearing expectations | Both flows clear transient stale indicators at attempt start and clear stale output on migrated-path failure/error handling branches. |
| Shared avoidance of legacy-only reshaping | Both flows keep backend semantics primary and use local UI mapping as additive presentation, not semantic replacement. |
| Shared effective UI-boundary semantic preservation | Both flows maintain current-attempt ownership at the visible boundary (output/notification/modal/state), preventing stale previous-attempt success from representing current failed attempts. |

#### Differences that remain intentionally path-specific

| Category | Why intentionally path-specific |
|---|---|
| Result payload key and panel ownership mapping | `adoc->md` and `md->adoc` legitimately target different output keys and panel state slots (`markdown`/`mdOutput` vs `asciidoc`/`adocInput`). |
| Flow-specific modal/message nuance | User-facing wording and some modal emphasis remain tied to flow-specific failure signatures and should not be force-normalized yet. |
| `handleConvert` direction-dependent view-model shaping | Source/result text selection logic remains coupled to source/target direction and broader UI composition. |
| Path-oriented representative UI scenarios | Scenario coverage differs by conversion direction and endpoint payload context, which is expected and acceptable. |

Next: Step 5 synthesis and convention-closure work begins in sub-step 5.5.1.

### Step 5.5.1 — Step 5 Consolidation Summary

This sub-step summarizes what Step 5 has concretely consolidated across the first and second migrated conversion paths.

#### What Step 5 consolidated

- Shared backend conventions are now explicitly aligned across both migrated paths where intended (helper-based failure construction conventions, structured error preservation conventions, additive compatibility-wrapping conventions).
- Shared frontend/UI conventions are now explicitly aligned across both migrated flows where intended (structured success/failure consumption, lifecycle-state expectations, stale-state cleanup expectations, current-attempt ownership expectations).
- Generic/common vs path-specific classification was formalized on both backend and frontend sides.
- Priority order for safe consolidation work was defined and then executed in focused waves.
- Remaining non-semantic convention drift was reduced/normalized where low-risk and grounded.
- Cross-path validation confirmed both migrated flows follow the same intended shared rules where those rules are common.
- Legitimate path-specific differences were preserved instead of force-unified.
- Maintainability/readability improved without changing documented `ConversionResult` contract semantics or API semantics.

#### Shared/common baseline vs intentionally path-specific scope

- **Consolidated as shared/common practice**
  - Contract-preserving helper usage patterns
  - Structured error-shape preservation rules
  - Shared lifecycle/state and stale-cleanup conventions in migrated frontend flows
  - Layered verification and consistency-validation conventions

- **Still intentionally path-specific or deferred**
  - Engine/runtime execution internals (`downdoc` lazy-load path vs direct Pandoc path)
  - Direction-dependent payload/result ownership and panel mapping details
  - Flow-specific error-detail granularity, messaging nuance, and representative scenario emphasis
  - Broader architectural/UI unification beyond safe local convention alignment

Next: sub-step 5.5.2 will formalize the common convention baseline established by Step 5.

### Step 5.5.2 — Common Convention Baseline (Established by Step 5)

This sub-step formalizes the common convention baseline that Step 5 has stabilized across the two migrated conversion paths.

#### Common backend baseline conventions

- Use standardized helper-based result construction as default (`createSuccessResult()` / `createFailureResult()`).
- Apply standardized success/failure construction expectations at route/orchestrator boundaries.
- Preserve structured `error` semantics as primary failure meaning (`code`, `message`, optional details).
- Keep `pipeline`, `warnings`, `logs`, and `meta` present with stable shape expectations.
- Keep converter naming/integration role-oriented and Ascend-consistent where applicable.
- Preserve standardized backend semantics as primary payload meaning; compatibility wrappers remain additive-only.

#### Common frontend/UI baseline conventions

- Consume standardized backend success/failure results as primary semantic source of truth for migrated flows.
- Follow shared lifecycle expectations (`idle / loading / success / error`) for current-attempt ownership.
- Apply stale-state clearing at attempt start and on migrated-flow error branches to prevent stale success display.
- Preserve structured failure semantics in UI handling (`error.code` availability and structured relay to state).
- Avoid legacy local success/error reshaping when standardized semantics are available.
- Preserve backend semantics to the effective UI boundary (output, status, notification/modal, lifecycle state).

#### Baseline-by-default vs grounded path-specific allowance

- **Baseline-by-default for future migrated flows**
  - The backend and frontend conventions listed above should be the default implementation/verification baseline.

- **May remain path-specific when grounded**
  - Engine/runtime execution internals
  - Direction-dependent payload/result ownership and panel mapping
  - Flow-specific error-detail granularity and user-facing wording nuances
  - Representative scenario emphasis tied to path topology

#### Why this baseline matters

- It avoids re-deciding conventions already validated across two real flows.
- It improves maintainability and consistency as additional flows are migrated.
- It provides a stable starting point for future migrations without forcing premature over-abstraction.

Next: the official Definition of Done for Step 5 follows in sub-step 5.5.3.

### Step 5 Definition of Done

This sub-step formalizes the official Definition of Done for Step 5 of release `0.0.1.4.6`.

Step 5 is complete only if all criteria below are true:

- Elements genuinely shared across the first and second migrated flows are identified.
- Generic/shared elements are clearly distinguished from path-specific elements.
- Safe consolidation priorities are explicitly established.
- Shared backend conventions are consolidated where appropriate.
- Shared backend conventions are explicitly validated across both migrated backend paths.
- Shared frontend/UI conventions are consolidated where appropriate.
- Shared frontend/UI conventions are explicitly validated across both migrated frontend flows.
- Remaining non-semantic convention drift is reduced where safe.
- Legitimate path-specific differences are preserved where appropriate.
- A common convention baseline is documented for future migrated flows.
- Standardized `ConversionResult` contract semantics remain unchanged.
- Both migrated flows remain working and contract-compliant after consolidation.
- Both migrated flows remain semantically aligned at the effective UI/output boundary after consolidation.

#### What Step 5 does not require

- Migration of additional conversion flows.
- Broad backend architecture redesign.
- Broad frontend/UI redesign.
- Full product-wide normalization in one step.
- Elimination of all path-specific behavior.
- Introduction of new abstraction frameworks as a prerequisite.

#### Why this Definition of Done matters

- It marks the transition from validating the model on two flows to stabilizing shared practice across them.
- It removes ambiguity about what a "consolidated baseline" means in Ascend.
- It provides a cleaner foundation for later scale-out work without reopening settled conventions.

Next: the official Step 5 closure note follows in sub-step 5.5.4.

### Step 6.1.1 — Remaining Grounded Candidate Paths for Future Migration Waves

Step 6 starts by identifying the remaining grounded migration candidates that are already present in the codebase after the first two migrated flows.

| Candidate conversion path | Current grounded status | Why it is a realistic future migration candidate |
|---|---|---|
| `Text -> Markdown` (`POST /api/text-to-markdown`) | Backend route exists in `conversion.routes.js`; frontend routing exists in `convertText` (`txt -> markdown` endpoint selection). | It is already a dedicated path (not generic fallback-only), so it can be migrated with bounded scope similar to prior waves. |
| `HTML -> *` via Pandoc (`POST /api/from-html`) | Backend route exists for `html -> target`; frontend routing exists in `convertText` (`sourceFormat === 'html'` branch). | Real flow already wired end-to-end with explicit route ownership; suitable for path-specific migration/alignment pass. |
| Generic Pandoc route (`POST /api/convert`) for non-migrated format pairs | Backend conversion service supports multiple formats (`txt`, `asciidoc`, `markdown`, `html`, `pdf`, `yaml`, `json`, `docx`, `epub`, `rst`, `tex`, `latex`); frontend already routes non-specialized pairs to `/api/convert`. | It is the largest grounded candidate family for future waves, with many real pairs already runnable through one existing entry point. |
| Legacy frontend wrapper path: `Markdown -> AsciiDoc` wrapper module (`converters/markdown-to-asciidoc.ts`) | Wrapper module still exists, while active migrated runtime path is driven by `convertText` + `App.tsx`. | It is a grounded candidate for future cleanup/alignment decisions (retain/deprecate/standardize usage) once migration-wave priorities include wrapper harmonization. |
| Legacy frontend wrapper path: `AsciiDoc -> Markdown` wrapper module (`converters/asciidoc-to-markdown.ts`) | Wrapper module still exists, while active migrated runtime path is driven by `convertText` + `App.tsx`. | Like the opposite wrapper, it remains a grounded candidate for future consolidation of frontend entry points after core migration waves. |

Next: sub-step 6.1.2 will classify these candidates by readiness, risk, and value for the next migration wave.

### Step 5 Closure

This sub-step records the official closure note for Step 5 of release `0.0.1.4.6`.

#### What Step 5 achieved

Step 5 established:

- A shared convention baseline across the first and second migrated conversion paths.
- Backend-side consolidation of conventions that were truly generic and safe to normalize.
- Frontend/UI-side consolidation of conventions that were truly generic and safe to normalize.
- Explicit validation that both migrated flows follow the same intended shared rules where those rules are common.
- Preservation of legitimate path-specific differences where they still belong.

#### Concrete consolidation outcomes

- Shared backend conventions were identified, prioritized, consolidated, and validated.
- Shared frontend/UI conventions were identified, prioritized, consolidated, and validated.
- Remaining non-semantic convention drift was reduced where safe.
- Standardized `ConversionResult` contract semantics remained unchanged.
- Both migrated flows remained working and semantically aligned after consolidation.

#### What Step 5 now provides

- A stable two-flow convention baseline for future migration work.
- A clearer boundary between shared/common practice and path-specific behavior.
- Improved maintainability/readability across the first two migrated paths.
- A stronger base for future migrations without reopening already settled convention questions.

#### What remains outside Step 5

Step 5 closure does **not** imply that:

- All remaining conversion paths are migrated.
- Architecture-wide redesign is complete.
- Full product-wide normalization is complete.
- All path-specific behavior should disappear.
- Future UI/UX refinement is complete.
- Step 6 work has already started.

#### Transition note

Future work should build on the stabilized shared convention baseline established in Steps 1-5, rather than reopening already validated contract, backend-alignment, frontend-alignment, and cross-flow convention decisions for the first two migrated paths.

### Step 6.1.2 — Candidate Classification (Readiness, Risk, Migration Value)

This sub-step classifies the remaining grounded migration candidates identified in Step 6.1.1 using pragmatic readiness, risk, and migration-value criteria.

| Candidate conversion path | Readiness | Migration risk | Migration value / priority signal | Short grounded justification |
|---|---|---|---|---|
| `Text -> Markdown` (`/api/text-to-markdown`) | High | Low | High | Dedicated backend route and explicit frontend branch already exist; bounded scope and close fit to the validated two-flow migration pattern. |
| `HTML -> *` (`/api/from-html`) | Medium-High | Medium | Medium-High | Real route and frontend branch are already present, but multi-target behavior adds slightly more mapping/verification complexity than a single-direction path. |
| Generic multi-format route (`/api/convert`) | Medium | High | High (strategic), Medium (near-term) | Broad real usage surface and many format pairs provide strong long-term value, but cross-format variance increases migration/alignment risk for a single next wave. |
| Frontend legacy wrapper modules (`asciidoc-to-markdown.ts`, `markdown-to-asciidoc.ts`) | Medium | Low-Medium | Medium | Grounded cleanup/alignment candidates with bounded frontend scope, but they are secondary to route-level conversion-path migration priorities. |

#### Near-term candidate strength signal

- **Stronger near-term candidates:** `Text -> Markdown` first, then `HTML -> *` (good readiness with manageable risk and clear migration value).
- **Weaker near-term candidates:** full `/api/convert` family as an immediate next wave (high surface and higher dependency/risk complexity), plus wrapper-only cleanup as a secondary priority.

Next: sub-step 6.1.3 will select the next realistic migration wave.

### Step 6.1.3 — Next Realistic Migration Wave Selection

This sub-step selects the next realistic migration wave based on the grounded candidate inventory and readiness/risk/value classification from Steps 6.1.1 and 6.1.2.

#### Selected next migration wave

- **Primary selected wave:** `Text -> Markdown` (`POST /api/text-to-markdown`)

#### Why this wave was selected

- It has the strongest readiness/risk profile among remaining candidates (high readiness, low migration risk, high practical value).
- It is already represented by a dedicated backend route and an explicit frontend routing branch, which keeps migration scope bounded.
- It fits the validated migration/alignment model directly (converter/route normalization -> backend preservation -> frontend consumption/state verification) without introducing cross-format orchestration complexity.
- It is likely to succeed without reopening settled foundational conventions from Steps 1-5.

#### Why this wave is lower-friction than other candidates

- Compared with `HTML -> *`, it has fewer target-format branches and therefore lower mapping/verification branching complexity.
- Compared with the broad `/api/convert` family, it avoids high-surface multi-format dependency risk in a single wave.
- Compared with wrapper-only cleanup candidates, it provides direct migration-wave value on an active conversion path rather than secondary structural cleanup.

Next: sub-step 6.2.1 will define migration order and execution strategy for this selected wave.

### Step 6.2.1 — Migration Order and Strategy for the Selected Wave

This sub-step defines migration order and execution strategy for the selected next wave identified in Step 6.1.3.

#### Selected next wave candidate

- `Text -> Markdown` (`POST /api/text-to-markdown`)

#### Recommended migration order

1. Migrate and verify `Text -> Markdown` as a **single-path wave** (strict one-path-at-a-time execution).
2. Complete the full validated sequence on this path before opening any additional Step 6 candidate:
   - converter/runtime mapping and helper payload mapping
   - success/failure standardization
   - internal-error harmonization
   - backend/orchestrator alignment and verification
   - frontend/UI alignment and verification
   - boundary-level consolidation checks

#### Why this order is recommended

- `Text -> Markdown` has the strongest low-friction profile (highest readiness, lowest risk, clear route/frontend ownership).
- A strict single-path wave minimizes overlap risk and keeps failure diagnosis bounded.
- It maximizes reuse of the already validated migration/alignment model from Steps 1-5 without introducing multi-branch coordination complexity.
- It preserves convention stability by preventing premature expansion to broader candidate surfaces.

#### Deferred within/after this wave

- `HTML -> *` migration is deferred until the `Text -> Markdown` wave is fully completed and validated.
- Broad `/api/convert` family migration remains deferred due to multi-format surface/risk.
- Frontend wrapper harmonization remains deferred as secondary cleanup work, not part of this immediate wave strategy.

Next: sub-step 6.2.2 will define migration-readiness criteria for flows in this selected wave.

### Step 6.2.2 — Migration-Readiness Criteria for the Selected Wave

This sub-step defines migration-readiness criteria for paths considered for entry into the selected next wave strategy (starting with `Text -> Markdown`).

#### Minimum required readiness criteria (must-have)

- The conversion path is real, reachable, and currently wired in code (backend route/service path and relevant frontend trigger path).
- Runtime flow is sufficiently understandable to map end-to-end (input, conversion call, output path, failure branches).
- Nominal success and failure paths are both identifiable and testable.
- Error behavior is observable enough to classify and normalize (not fully opaque/untraceable).
- Backend orchestration boundary is traceable enough for Step 2-style alignment work.
- Frontend/UI consumption boundary is traceable enough for Step 3-style alignment work (if the path is user-facing).
- Scope is bounded enough to execute without reopening broad architecture or contract questions.
- No blocking engine/runtime dependency is currently preventing realistic execution.

#### Helpful but non-blocking readiness signals

- Existing focused scripts/tests already touch the path or can be extended with minimal effort.
- Path uses established helper/convention patterns partially (even if not fully aligned yet).
- Observability signals (logs/errors) are already present and interpretable.
- Frontend path already uses `convertText` conventions, reducing additional integration work.
- Prior migration artifacts provide near-direct pattern reuse for this path.

#### Defer / unready signals (migrate later)

- Path is only partially present or not actually reachable through current runtime wiring.
- Success/failure behavior cannot be reliably isolated without broad exploratory refactor.
- Critical engine dependency is unavailable/unstable, making validation non-deterministic.
- Path requires cross-cutting architecture/UI redesign to migrate safely.
- Error behavior is too opaque to preserve structured semantics without high-risk guesswork.
- Scope is inherently multi-path/multi-format at once, with high coupling and unclear bounded entry point.

#### Why these criteria matter

These criteria keep future migration waves low-risk and controlled by ensuring each candidate enters migration only when bounded, traceable, and executable through the already validated alignment model.

Next: sub-step 6.2.3 will classify remaining candidates into easy-win, cleanup-first, and defer groups.

### Step 6.2.3 — Practical Candidate Grouping (Easy Win / Cleanup-First / Defer)

This sub-step classifies remaining grounded candidates by practical migration readiness using the criteria defined in Step 6.2.2.

#### Easy win candidates

| Candidate path | Category | Grounded justification |
|---|---|---|
| `Text -> Markdown` (`POST /api/text-to-markdown`) | Easy win | Dedicated backend route and explicit frontend branch already exist, success/failure behavior is bounded and traceable, and migration scope fits the validated low-friction model. |

#### Cleanup-first candidates

| Candidate path | Category | Grounded justification |
|---|---|---|
| `HTML -> *` (`POST /api/from-html`) | Cleanup-first | Runtime path is real and traceable, but multi-target behavior increases branching/verification load; benefits from small preparation/constraint cleanup before full migration execution. |
| Frontend legacy wrapper modules (`asciidoc-to-markdown.ts`, `markdown-to-asciidoc.ts`) | Cleanup-first | Grounded and low-risk as cleanup targets, but secondary to primary route-level migration work; wrapper role should be clarified to avoid overlap/noise during wave execution. |

#### Defer for later candidates

| Candidate path | Category | Grounded justification |
|---|---|---|
| Generic multi-format family (`POST /api/convert`) | Defer for later | Broad multi-format surface is real but high-coupling/high-variance; not ideal for immediate low-friction wave entry without reopening wider cross-format complexity. |

Next: Step 6.3 will define common non-regression preparation for future migration waves.

### Step 6.3.1 — Existing Verification Coverage Comparison and Common Non-Regression Structure

This sub-step compares verification coverage already used across migrated flows and extracts the minimum common non-regression structure for future migration waves.

#### Verification layers already evidenced in the project

- Isolated converter success/failure checks (for converter-level behavior and error semantics).
- Baseline representative scenario checks (small multi-scenario coverage per migrated path).
- Backend/orchestrator preservation checks (contract propagation and internal-failure normalization at backend layers).
- Frontend/UI preservation checks (structured success/failure consumption and state-transition coherence in `convertText`/UI flow).
- End-to-end success/failure checks (request-to-boundary validation on migrated endpoints).
- Effective boundary checks:
  - backend output boundary contract checks,
  - effective UI output-boundary coherence checks (current-attempt ownership, anti-stale behavior).

#### Common vs path-specific verification elements

- **Already common across migrated flows**
  - Contract-root field assertions for success/failure envelopes.
  - Structured failure assertions (`error.code`, `error.message`, additive `detail` consistency).
  - At least one nominal success and one grounded failure scenario.
  - Verification of lifecycle/state coherence and stale-output protection on migrated frontend flows.
  - Layered sequence: isolated path checks -> backend/orchestrator checks -> frontend/UI checks -> boundary checks.

- **Still path-specific**
  - Engine/runtime fault-injection probes and internal-error trigger methods.
  - Direction-specific payload/output ownership assertions (`markdown` vs `asciidoc` targets).
  - Path-oriented representative scenario mix and user-facing error wording expectations.

#### Minimum common non-regression structure for future waves

1. Isolated path verification: success + structured failure + one internal-error normalization check.
2. Backend/orchestrator verification: contract preservation through route coordination and output boundary.
3. Frontend/UI verification: structured success/failure consumption, `idle/loading/success/error` transition coherence, stale-state safeguards.
4. Representative scenario pass: a compact set covering nominal and at least one meaningful failure family.
5. Final boundary validation: confirm standardized semantics survive to effective backend/UI boundaries.

Next: sub-step 6.3.2 will formalize the minimum verification kit for future migrated flows.

### Step 6.3.2 — Minimum Reusable Verification Kit for Future Migrated Flows

This sub-step formalizes the minimum reusable verification kit derived from the common non-regression structure validated across migrated flows.

#### Minimum required checks

- **Isolated converter success check**
  - Verify nominal success output and standardized success semantics at converter/path level.
- **Isolated converter failure check**
  - Verify at least one grounded failure path returns/preserves structured failure semantics.
- **Backend/orchestrator preservation check**
  - Verify standardized result propagation through the backend coordination layer.
- **End-to-end success check**
  - Verify success survives from request entry to effective output boundary for the migrated path.
- **End-to-end failure check**
  - Verify failure survives with structured error semantics (`error.code` available) to effective output boundary.
- **Effective backend boundary check**
  - Verify final backend payload boundary preserves contract semantics (including additive compatibility fields only).

#### Recommended but optional checks

- **Compact representative scenario set**
  - Add 2-4 path-relevant scenarios (nominal + meaningful failure variants) to reduce regression blind spots.
- **Internal-error normalization probe**
  - Add one targeted internal-failure probe to confirm safe structured normalization behavior.
- **Cross-attempt coherence check**
  - Verify success->failure or failure->success sequence coherence for migrated frontend flows.
- **Focused boundary regression script**
  - Add a dedicated script/test if the path has known boundary drift risk history.

#### Conditional / path-dependent checks

- **Frontend/UI preservation checks** (conditional)
  - Required when the path is user-facing in the current product flow; may be scoped down for backend-only/internal paths.
- **Effective UI boundary check** (conditional)
  - Required when a real UI consumption/rendering boundary exists for the migrated path.
- **Engine-specific internal probes** (conditional)
  - Apply only when a path’s runtime allows safe deterministic fault injection or controlled internal-error triggers.

#### Why this kit matters

This kit keeps migration waves low-risk and comparable by enforcing a consistent minimum verification floor across flows while allowing path-dependent checks where grounded.

Next: sub-step 6.3.3 will convert this verification kit into a migration playbook/checklist.

### Step 6.3.3 — Operational Migration Playbook (Reusable Checklist)

This sub-step turns the validated migration/alignment model into a concise operational playbook for future conversion-flow migrations.

#### Required migration checklist (default sequence)

1. Confirm candidate readiness against Step 6.2.2 minimum criteria.
2. Map current converter/runtime flow (success path, failure path, internal error behavior).
3. Map payload fields into `createSuccessResult()` / `createFailureResult()` inputs.
4. Integrate standardized success-path result construction.
5. Integrate standardized failure-path result construction.
6. Harmonize internal error behavior into structured failure semantics.
7. Run isolated converter/path verification (minimum kit required checks).
8. Identify backend/orchestrator alignment target for the path.
9. Map backend success/failure propagation and contract-risk points.
10. Apply minimal backend remediation to preserve standardized semantics.
11. Verify backend output boundary contract behavior.
12. Identify frontend/UI alignment target for the same path (if user-facing).
13. Map frontend success/failure consumption and state behavior.
14. Apply minimal frontend remediation for structured semantics + state coherence.
15. Verify effective UI boundary coherence and stale-state safeguards.
16. Run final cross-layer non-regression pass using the minimum verification kit.
17. Record path comparison/consolidation notes against previously migrated flows.

#### Conditional / when-applicable checklist items

- Apply frontend/UI alignment and UI-boundary checks only when the path is user-facing in the current product flow.
- Add engine-specific internal-failure probes only when deterministic fault-injection is feasible and safe.
- Expand representative scenarios only when path complexity justifies additional coverage.
- Add compatibility-wrapper checks only when additive wrapper fields are present at the boundary.
- Include wrapper-entry cleanup checks only when the path still has legacy wrapper overlap.

#### Stop / defer signals (do not proceed yet)

- Path is not fully reachable or wiring is incomplete.
- Success/failure behavior cannot be mapped without broad exploratory refactor.
- Critical runtime dependency/engine state is unstable or unavailable.
- Migration scope would force cross-cutting architecture/UI redesign.
- Error behavior is too opaque to preserve structured semantics safely.
- Candidate requires multi-path/multi-format coupling beyond a bounded wave scope.

#### Why this playbook matters

This playbook keeps future migrations controlled, comparable, and low-risk by enforcing a repeatable, bounded sequence with explicit readiness gates and non-regression validation expectations.

Next: sub-step 6.4.1 will summarize what Step 6 has prepared for the next migration wave.

### Step 6.4.1 — Step 6 Preparation Summary

This sub-step summarizes what Step 6 has concretely prepared for future migration waves.

#### What Step 6 prepared

- A grounded inventory of remaining migration candidates still present in the codebase.
- A pragmatic readiness/risk/value classification for those candidates.
- Selection of the next realistic migration wave (`Text -> Markdown`) with explicit rationale.
- Migration-readiness criteria defining minimum entry conditions for future wave candidates.
- Practical grouping into easy-win, cleanup-first, and defer categories.
- A minimum common non-regression structure extracted from already migrated flows.
- A minimum reusable verification kit for future migrated flows (required/optional/conditional checks).
- An operational migration playbook/checklist defining required sequence, conditional steps, and stop/defer signals.

#### Stable planning material vs out-of-scope implementation work

- **Now prepared as stable migration-planning material**
  - Candidate inventory and prioritization logic
  - Readiness gates and wave-selection rationale
  - Reusable non-regression and verification baseline
  - Reusable operational migration checklist

- **Still outside Step 6 scope**
  - Actual migration implementation of additional flows
  - Runtime/backend/frontend code changes for new paths
  - Broader architecture/UI redesign work
  - Execution of later migration waves beyond current planning preparation

Next: sub-step 6.4.2 will formalize the migration-readiness and playbook baseline established by Step 6.

### Step 6.4.2 — Migration-Readiness and Playbook Baseline

This sub-step formalizes the default migration-readiness and operational playbook baseline prepared by Step 6 for future migration waves.

#### Readiness-baseline expectations (default entry conditions)

- Converter path exists and is currently reachable in runtime wiring.
- Runtime flow is understandable enough to map end-to-end.
- Success and failure paths are identifiable and testable.
- Backend path is traceable enough for contract-preservation alignment work.
- Frontend/UI path is traceable enough when the flow is user-facing.
- Migration scope is bounded enough for one-wave execution.
- No blocking dependency/engine state makes the flow non-viable now.

#### Playbook-baseline expectations (default migration behavior)

- Migrate one bounded real flow at a time.
- Map runtime flow before helper payload integration work.
- Standardize success and failure semantics before broad surrounding-layer alignment.
- Verify isolated converter/path behavior before backend/frontend alignment.
- Preserve standardized semantics instead of rebuilding legacy local models.
- Apply the minimum reusable verification kit before considering a flow safely migrated.

#### Baseline-by-default vs grounded path-specific adaptation

- **Baseline-by-default**
  - Readiness and playbook expectations above should apply to future waves unless a grounded exception exists.

- **May require path-specific adaptation when grounded**
  - Engine/runtime internals and deterministic fault-injection feasibility.
  - Direction-dependent payload ownership and UI target-panel mapping.
  - Flow-specific error-detail granularity and user-facing wording nuances.
  - Scenario emphasis required by path topology or external dependency behavior.

#### Why this baseline matters

- It reduces re-decision of migration principles already validated in previous steps.
- It keeps future waves controlled, comparable, and bounded.
- It helps avoid premature refactors and unbounded migration scope.

Next: the official Definition of Done for Step 6 follows in sub-step 6.4.3.

### Step 6 Definition of Done

This sub-step formalizes the official Definition of Done for Step 6 of release `0.0.1.4.6`.

Step 6 is complete only if all criteria below are true:

- Remaining grounded candidate conversion paths are identified.
- Those candidates are classified by readiness, risk, and migration value.
- The next realistic migration wave is selected.
- A migration order/strategy for that wave is defined.
- Practical migration-readiness criteria are defined.
- Remaining candidates are grouped into easy-win, cleanup-first, and defer-for-later categories.
- Existing verification coverage across migrated flows is compared.
- A minimum common non-regression structure is extracted.
- A minimum reusable verification kit is documented.
- An operational migration playbook/checklist is documented.
- A migration-readiness/playbook baseline is formalized for future waves.
- Step 6 clearly distinguishes what is prepared now versus what requires future implementation.

#### What Step 6 does not require

- Migration of a third flow.
- Refactoring remaining candidate flows.
- Backend or frontend redesign.
- Immediate implementation of the selected next wave.
- Complete normalization of all remaining converters in this step.

#### Why this Definition of Done matters

- It marks the transition from validating/consolidating the first migrated flows to preparing future waves in a controlled way.
- It removes ambiguity about what "migration readiness" means in Ascend planning.
- It provides a stable planning baseline for future implementation without reopening settled migration principles.

Next: the official Step 6 closure note follows in sub-step 6.4.4.

### Step 6 Closure

This sub-step records the official closure note for Step 6 of release `0.0.1.4.6`.

#### What Step 6 achieved

Step 6 successfully established:

- A grounded inventory of remaining migration candidates.
- A pragmatic readiness/risk/value classification for those candidates.
- A selected next realistic migration wave.
- Explicit migration-readiness criteria.
- A practical easy-win / cleanup-first / defer framework.
- A reusable minimum non-regression and verification baseline.
- An operational migration playbook/checklist for future flows.

#### Concrete preparation outcomes

- Ascend now has a documented method for deciding which remaining flows should be migrated next.
- Future migration waves can be prepared without reopening already validated contract and alignment principles.
- A minimum verification kit now exists for comparing future migrated flows on a common baseline.
- Migration planning is now more controlled, comparable, and low-risk.

#### What Step 6 now provides

- A stable migration-readiness baseline.
- A practical future-wave planning framework.
- A reusable verification baseline for future migrated flows.
- A cleaner bridge between validated early migrations and later scaling work.

#### What remains outside Step 6

Step 6 closure does **not** imply that:

- The selected next migration wave has already been implemented.
- A third flow has already been migrated.
- Remaining candidate flows have already been cleaned up.
- Backend or frontend redesign is complete.
- All remaining converters are normalized.
- Step 7 work has already started.

#### Transition note

Future work should build on the migration-readiness and playbook baseline documented in Steps 1-6, rather than reopening already validated contract, alignment, consolidation, and migration-method decisions.

### Step 7.1.1 — First Executable Flow Confirmation (Selected Wave)

Step 7 starts by confirming the first concrete executable flow inside the migration wave selected in Step 6.

- **Selected wave:** `Text -> Markdown` migration wave
- **First concrete flow to execute:** `Text -> Markdown` via `POST /api/text-to-markdown`

Why this flow is confirmed first:

- It has the highest practical readiness among the selected-wave scope.
- It has the lowest expected execution friction and dependency complexity.
- It is the best fit for the validated migration/alignment playbook and minimum verification kit.
- It provides the strongest chance of a clean first execution outcome for Step 7 before any broader wave expansion.

Next: sub-step 7.1.2 will define the execution order for the remaining items in this wave.

### Step 7.1.2 — Practical Execution Order Inside the Selected Wave

This sub-step defines the practical execution order inside the selected migration wave before implementation starts.

- **Selected migration wave:** `Text -> Markdown` wave
- **First confirmed flow:** `Text -> Markdown` via `POST /api/text-to-markdown`

#### Recommended execution order

1. Execute `Text -> Markdown` migration end-to-end as the first and only active in-wave implementation item.
2. Run full validation against the established playbook and minimum verification kit for this flow.
3. Only after validated first execution evidence, decide whether to open the next candidate (`HTML -> *`) as a separate follow-on wave item.

#### Why this order is recommended

- It keeps cadence strictly sequential and controlled (no parallel migration interference).
- It maximizes reuse of the validated migration/alignment method on the highest-readiness path first.
- It minimizes coupling risk while preserving clear failure diagnosis boundaries.
- It avoids expanding scope before first-execution evidence confirms expected low-friction behavior.

#### Deferred until first execution evidence is validated

- `HTML -> *` remains deferred until `Text -> Markdown` execution and verification are complete.
- Generic `/api/convert` family remains deferred (high-surface complexity).
- Wrapper-focused cleanup remains deferred as secondary work outside this immediate execution order.

Next: sub-step 7.1.3 will freeze the Step 7 execution scope.

### Step 7.1.3 — Step 7 Execution Scope Freeze

This sub-step freezes the Step 7 execution scope so the selected migration wave remains bounded, controlled, and protected from scope creep before implementation.

- **Selected migration wave:** `Text -> Markdown` wave
- **First confirmed executable flow:** `Text -> Markdown` via `POST /api/text-to-markdown`

#### IN scope for Step 7

- Execute migration work for the confirmed first flow only (`Text -> Markdown`).
- Follow the execution order defined in Step 7.1.2 (strictly sequential progression).
- Apply the validated migration/alignment playbook sequence from Steps 1-6.
- Apply the minimum reusable verification kit and boundary checks for this flow.
- Perform only minimal, flow-bounded fixes required to preserve standardized semantics and non-regression.

#### OUT of scope for Step 7

- Migrating unrelated additional flows in parallel.
- Broad backend architecture redesign.
- Broad frontend/UI redesign.
- Building new generic frameworks/abstraction layers without a blocking need.
- Product-wide cleanup unrelated to the selected wave.
- Reopening already validated contract/alignment/convention decisions without grounded blocker evidence.

#### Deferred until later

- `HTML -> *` migration until the first flow execution is complete and validated.
- Generic `/api/convert` family migration.
- Wrapper-focused cleanup and broader harmonization work.
- Any larger cross-flow normalization beyond this bounded execution wave.

#### Why this scope freeze matters

It keeps Step 7 execution low-risk, diagnosable, and comparable by preventing mid-flight scope expansion and preserving a controlled one-flow migration cadence.

Next: sub-step 7.2.1 will begin runtime flow mapping of the first executable flow.

### Step 7.2.1 — Current Runtime Flow Mapping (Before Helper Integration)

This sub-step maps the current runtime flow before helper integration for the first executable flow inside the selected Step 7 wave.

- Selected migration wave: **Text -> Markdown**
- First executable flow: **`POST /api/text-to-markdown`**

#### Current runtime flow (grounded)

1. Request enters `api/backend/routes/conversion.routes.js` at `router.post('/text-to-markdown', ...)`.
2. Route-level validation middleware (`validate` + `zod`) requires `body.text` as non-empty string shape (`z.string().min(1)`).
3. Route handler reads `text` from `req.body`.
4. Route applies a second local pre-check: `if (!text.trim())` then returns HTTP `400` with `{ detail: "The text to convert is empty" }`.
5. Route logs conversion start with input size (`console.log`).
6. Route invokes `text2markdown(text)` from `api/backend/services/conversion/convert.js` (called with `await`; function itself is synchronous and returns a string or throws).
7. `text2markdown` performs in-memory line parsing/normalization (headings, lists, separators, simple links/emails), collapses extra blank lines, and returns normalized Markdown text ending with a newline.
8. Route logs conversion success and returns HTTP `200` with `{ markdown }`.
9. If any exception is thrown (route/body/runtime), route `catch` logs error and returns HTTP `500` with `{ detail: "Conversion error: ..." }`.

#### Current success-path shape

- Success response is currently legacy/simple: `200` with `{ markdown: string }`.
- No standardized `ConversionResult` object is currently attached on this path.

#### Current failure-path shape

- Failure responses are currently string-detail envelopes:
  - Validation/pre-check failures: `400` with `{ detail: string }`.
  - Runtime failures: `500` with `{ detail: string }`.
- Structured `error` object (`code`, `message`, `details`) is not currently emitted on this path.

#### Integration-relevant observations (before helper mapping)

- No temp files are created in this path; conversion is in-memory only.
- No duration measurement is currently tracked at route level.
- No structured `warnings`/`logs` arrays or `meta` object are currently returned.
- Output artifact metadata (output file/path object) is not currently present.
- Error generation is currently throw/string-detail based, with mixed failure entry points (middleware validation, route trim check, catch block).

Next: payload mapping from this current flow to centralized helpers (`createSuccessResult()` / `createFailureResult()`) is defined in sub-step 7.2.2.

### Step 7.2.2 — Payload Mapping to Centralized Helpers (Before Integration)

This sub-step defines payload mapping to centralized helpers before runtime integration for the first executable Step 7 flow.

- Selected migration wave: **Text -> Markdown**
- First executable flow: **`POST /api/text-to-markdown`**

#### Success payload mapping (`createSuccessResult(payload)`)

| Field | Current runtime source | Mapping strategy for integration |
|---|---|---|
| `conversionId` | Not currently created in `/text-to-markdown` route | Derive locally at request start (same route-level UUID pattern used in migrated paths). |
| `converter` | Route currently calls `text2markdown(text)` directly | Set to a stable converter identifier for this flow (expected: `"text2markdown"`). |
| `pipeline` | Not currently emitted | Derive fixed path pipeline for this route (expected: `["text->markdown"]`). |
| `inputFormat` | Implied by route (`text-to-markdown`) | Set to `"txt"` (or `"text"` if project convention requires), consistently with route semantics. |
| `outputFormat` | Implied by route return (`markdown`) | Set to `"markdown"`. |
| `inputFile` | Request body text only; no file artifact object currently built | Derive in-memory input descriptor from request text (`originalName`, `storedPath`, `size`, `mimeType`). |
| `outputFile` | Result text available in memory; no output artifact object currently built | Derive in-memory output descriptor from produced markdown length and mime type. |
| `startedAt` | Not currently tracked | Derive at request start timestamp. |
| `finishedAt` | Not currently tracked | Derive at success completion timestamp. |
| `durationMs` | Not currently tracked | Derive from start/end timing delta. |
| `warnings` | Not currently structured | Use helper default (`[]`) unless grounded warnings are introduced locally later. |
| `logs` | Console logs exist but no structured per-attempt log list | Use helper default (`[]`) for this migration step. |
| `meta` | Not currently emitted | Derive minimal route metadata object (for example route id + transport mode). |

#### Failure payload mapping (`createFailureResult(payload)`)

| Field | Current runtime source | Mapping strategy for integration |
|---|---|---|
| `conversionId` | Not currently created | Derive locally at request start (same id as success branch attempt). |
| `converter` | Direct call to `text2markdown` | Set to same stable converter identifier as success branch. |
| `pipeline` | Not currently emitted | Derive fixed pipeline value for this flow (`["text->markdown"]`). |
| `inputFormat` | Route semantics | Set consistently to `"txt"` (or project-approved equivalent). |
| `outputFormat` | Route semantics | Set to `"markdown"`. |
| `inputFile` | Request body text only | Derive in-memory input descriptor from available text (empty or provided content). |
| `startedAt` | Not currently tracked | Derive at request start. |
| `finishedAt` | Not currently tracked | Derive at failure completion. |
| `durationMs` | Not currently tracked | Derive elapsed time at failure completion. |
| `error` | Currently flattened to `{ detail: ... }` in 400/500 responses | Build structured `error` with grounded `code/message/details` (route-precheck vs runtime failure context). |
| `outputFile` | No output artifact on failure today | Set `null` unless grounded output artifact exists at failure time. |
| `warnings` | Not currently structured | Use helper default (`[]`). |
| `logs` | Only console logging exists | Use helper default (`[]`) for this step. |
| `meta` | Not currently emitted | Derive minimal metadata object (`route`, `transport`, optional stage marker). |

#### Integration-relevant observations

- **Already directly available:** input text, produced markdown (success), route identity, and catch/pre-check failure context.
- **Must be derived locally during integration:** `conversionId`, timing fields, in-memory input/output descriptors, and minimal `meta`.
- **Must be normalized from current behavior:** current `{ detail: ... }` failure shape should be mapped to structured helper `error`.
- **Currently absent in this path:** structured `warnings`/`logs` payloads and output artifact metadata on failure.

Next: runtime integration of the success path for this flow begins in sub-step 7.2.3.

### Step 7.3.2 — Backend/Orchestrator Flow Mapping Through the Confirmed Alignment Target

This sub-step maps the backend/orchestrator flow of the first executable Step 7 flow through the confirmed alignment target, after 7.2.3/7.2.4/7.2.5 integration.

- Selected migration wave: **Text -> Markdown**
- First executable flow: **`POST /api/text-to-markdown`**
- Confirmed Step 7.3 alignment target: **`api/backend/routes/conversion.routes.js` at `router.post('/text-to-markdown', ...)`**

#### Nominal success-oriented backend flow (current grounded runtime)

1. Request enters backend at `POST /api/text-to-markdown` in `api/backend/routes/conversion.routes.js`.
2. Route-level validation middleware (`validate` + `zod`) accepts `body.text` as `z.string()`.
3. Route initializes per-attempt context (`conversionId`, `startedAt`, `startedAtMs`) inside the confirmed alignment target.
4. Route applies local semantic pre-check (`!text.trim()`) and continues only for non-empty text.
5. Route invokes converter execution (`await text2markdown(text)`) through `api/backend/services/conversion/convert.js`.
6. On converter success, route derives `finishedAt` and `durationMs`.
7. First standardized success `ConversionResult` is created in the alignment target via `createSuccessResult(...)`, with:
   - converter/pipeline/format fields (`text2markdown`, `["text->markdown"]`, `txt -> markdown`)
   - in-memory `inputFile` and `outputFile`
   - timing (`startedAt`, `finishedAt`, `durationMs`)
   - `warnings: []`, `logs: []`, `meta` object.
8. Route returns final backend-level success payload as `{ markdown, conversionResult }` to the HTTP response boundary.

#### Failure-oriented backend flow (current grounded runtime)

1. Same backend entry point and route-level validation as success flow.
2. If semantic pre-check fails (`!text.trim()`):
   - failure is normalized in the alignment target through `buildTextToMarkdownFailure(...)` -> `createFailureResult(...)`
   - grounded code is `EMPTY_INPUT` with `error.details.stage = "route-precheck"`
   - final response is HTTP `400` with standardized failure result plus compatibility `detail`.
3. If converter execution throws:
   - converter-local `try/catch` in the alignment target classifies failure as `CONVERSION_FAILED` (`stage = "converter-execution"`)
   - failure is normalized through `buildTextToMarkdownFailure(...)` -> `createFailureResult(...)`
   - final response is HTTP `500` with standardized failure result plus compatibility `detail`.
4. If unexpected route-level/internal exception occurs outside converter-local catch:
   - outer route `catch` classifies as `INTERNAL_ERROR` (`stage = "route-internal"`)
   - failure is normalized through `buildTextToMarkdownFailure(...)` -> `createFailureResult(...)`
   - final response is HTTP `500` with standardized failure result plus compatibility `detail`.

#### Standardized result lifecycle through the confirmed target

- **First creation point (success):** `createSuccessResult(...)` inside `router.post('/text-to-markdown', ...)` in `conversion.routes.js`.
- **First creation point (failure):** `createFailureResult(...)` via `buildTextToMarkdownFailure(...)` in the same route handler.
- **Upward propagation:** standardized object is created and returned directly by the confirmed target (no additional backend orchestrator layer mutates it for this path).
- **Final backend return path:** Express route response (`res.json(...)`) is the effective backend output boundary for this flow.

#### Contract-preservation and contract-risk observations

##### Preserved correctly

- Standardized success and failure objects are both created in the alignment target before response emission.
- Required root-level contract fields are preserved in both success and failure responses.
- Failure branches use structured `error` with grounded codes (`EMPTY_INPUT`, `CONVERSION_FAILED`, `INTERNAL_ERROR`).
- `warnings`, `logs`, and `meta` remain structurally consistent with the established contract baseline.

##### Safely enriched

- Compatibility `detail` is additive (`detail === error.message`) and does not replace structured `error`.
- Stage context is preserved in `error.details.stage` for internal diagnostics.

##### Reshaped/stripped/wrapped/bypassed risk points

- **Wrapped (intentional):** success is wrapped as `{ markdown, conversionResult }` and failure as `{ ...conversionResult, detail }`; this is consistent with existing migrated-route compatibility patterns.
- **Not applicable for this flow:** no lazy-loader registry/module-resolution orchestration step is used on `text-to-markdown`, so there is no contract risk at registry/lazy-load boundaries for this specific path.
- **Residual risk (low):** route-level middleware validation failures that occur before handler execution can still bypass route-built `ConversionResult` shaping if schema becomes stricter again; current `z.string()` plus route pre-check avoids this drift.

Next: sub-step 7.3.3 will identify backend/orchestrator contract-risk points and define target backend/orchestrator behavior for this Step 7 flow.

### Step 7.3.3 — Backend/Orchestrator Contract-Risk Points and Target Behavior (First Step 7 Flow)

This sub-step identifies grounded backend/orchestrator contract-risk points and defines the target backend behavior for the first executable Step 7 flow, reusing the 7.3.2 flow mapping.

- Selected migration wave: **Text -> Markdown**
- First executable flow: **`POST /api/text-to-markdown`**
- Confirmed Step 7.3 alignment target: **`api/backend/routes/conversion.routes.js` at `router.post('/text-to-markdown', ...)`**

#### Exact risk points in the current backend/orchestrator flow

1. **Middleware-before-handler escape point (pre-target risk)**
   - **Where:** validation middleware stage before route handler body execution.
   - **Why risky:** if schema constraints become stricter again (for example back to `min(1)`), request rejection may happen before route-level `createFailureResult(...)` construction, producing non-standardized error envelopes.
   - **Current status:** low residual risk (currently mitigated by `z.string()` + route pre-check).

2. **HTTP wrapper asymmetry at output boundary**
   - **Where:** final response shape (`{ markdown, conversionResult }` on success vs `{ ...conversionResult, detail }` on failure).
   - **Why risky:** downstream consumers that read only top-level keys may drift into path-specific handling and ignore the standardized object as primary source.
   - **Current status:** acceptable compatibility wrapper, but still a contract-consumption risk if consumers are not disciplined.

3. **Additive compatibility field drift (`detail`)**
   - **Where:** failure responses include `detail` in addition to `error`.
   - **Why risky:** future edits could accidentally diverge `detail` from `error.message`, reintroducing parallel semantics.
   - **Current status:** currently safe (`detail === error.message`), but requires ongoing guardrails.

4. **Partial rebuild risk in route-local helper updates**
   - **Where:** `buildTextToMarkdownFailure(...)` and success payload assembly in the route.
   - **Why risky:** future edits could omit required root-level fields (`warnings`, `logs`, `meta`, timing fields, or file descriptors), causing silent contract erosion.
   - **Current status:** currently safe and complete, but maintenance-sensitive.

5. **Raw throw bypass risk in new internal branches**
   - **Where:** any newly introduced internal branch in this route or converter call path.
   - **Why risky:** uncaught or re-thrown errors could bypass standardized failure normalization.
   - **Current status:** core branches are normalized (`converter-execution` and outer `catch`), residual risk exists for future modifications.

#### Points that already appear safe

- Standardized success creation is centralized at route target via `createSuccessResult(...)`.
- Standardized failure creation is centralized via `buildTextToMarkdownFailure(...)` -> `createFailureResult(...)`.
- Known failure categories are normalized with grounded codes:
  - `EMPTY_INPUT` (semantic pre-check)
  - `CONVERSION_FAILED` (converter execution failure)
  - `INTERNAL_ERROR` (unexpected route-internal failure)
- Required contract structure is currently preserved in both success and failure branches, including `warnings`, `logs`, and `meta`.
- Internal diagnostic context is preserved through `error.details.stage` without flattening `error`.

#### Points that still require alignment attention

- Protect against pre-handler validation drift that can bypass route-built standardized failures.
- Keep compatibility wrapping strictly additive and prevent semantic split between wrapper fields and `conversionResult`.
- Maintain field-complete helper payloads as route code evolves.
- Ensure any future internal error branch in this flow is normalized into `createFailureResult(...)` rather than leaked as raw throw behavior.

#### Target backend/orchestrator behavior for this flow

##### Success-path preservation (target)

- The alignment target must treat `conversionResult` as the canonical success object and preserve all required root-level fields.
- Response wrapping (`{ markdown, conversionResult }`) is acceptable only as compatibility transport; no success semantics should be moved outside `conversionResult`.
- Safe enrichment is limited to additive compatibility fields and non-destructive metadata updates.

##### Failure-path preservation (target)

- All known failure conditions must return a standardized failure `ConversionResult` from the alignment target.
- `error` must remain structured (`code`, `message`, `details`, `recoverable`) with grounded documented codes.
- `outputFile` must remain coherent with failure semantics (`null` unless a grounded artifact exists).
- Compatibility `detail` may exist but must remain a strict mirror of `error.message`.

##### Internal-error handling (target)

- Unexpected internal exceptions must be caught and normalized to standardized failures at the alignment target.
- Use `INTERNAL_ERROR` only when no more specific grounded code applies.
- Preserve useful local context in `error.details` (for example `stage`, `rawMessage`) without leaking incompatible raw payloads.

##### Acceptable enrichment/normalization (target)

- Additive response wrapping for compatibility.
- Additive metadata/context enrichment in `meta` and `error.details`.
- Stable timing/file descriptors derived from in-memory route context.

##### Unacceptable reshaping/flattening (target)

- Returning ad-hoc `{ detail: ... }` as the only failure payload.
- Omitting required contract root fields in success or failure.
- Replacing structured `error` with flattened strings.
- Diverging compatibility fields from canonical `conversionResult` semantics.
- Allowing raw throws to escape known internal failure branches without normalization.

Next: sub-step 7.3.4 will apply targeted backend/orchestrator remediation for remaining alignment gaps identified here.

### Step 7.3.5 — Verification and Consolidation of Backend/Orchestrator Remediation (First Step 7 Flow)

This sub-step verifies and consolidates the backend/orchestrator remediation applied to the first executable Step 7 flow.

- Selected migration wave: **Text -> Markdown**
- First executable flow: **`POST /api/text-to-markdown`**
- Confirmed Step 7.3 alignment target: **`api/backend/routes/conversion.routes.js` at `router.post('/text-to-markdown', ...)`**

#### Verification coverage executed

- `api/backend/scripts/verify-e2e-text-to-markdown-success-contract.js`
- `api/backend/scripts/verify-e2e-text-to-markdown-failure-contract.js`
- `api/backend/scripts/verify-e2e-text-to-markdown-representative-scenarios.js`
- `api/backend/scripts/verify-e2e-text-to-markdown-downstream-failure-preservation.js`

#### Consolidated verification outcomes

##### Success-path relay/preservation

- Success responses continue to expose `{ markdown, conversionResult }`.
- `conversionResult.success === true` and `conversionResult.error === null` are preserved.
- Required root-level fields remain present and structurally valid.
- No legacy ad-hoc success object reconstruction was observed in the remediated target path.

##### Failure-path relay/preservation

- Failure responses remain standardized and preserve structured `error`.
- Grounded `error.code` values remain meaningful (`EMPTY_INPUT` and `CONVERSION_FAILED` in tested paths).
- Required root-level fields remain present in failures; `outputFile` stays coherent with failure semantics (`null` for current grounded cases).
- Failure responses are not flattened to string-only envelopes.

##### Internal coordination-layer error handling

- Internal converter-execution failures are normalized and returned as structured failures.
- Downstream standardized failure payloads are preserved through the remediated route layer instead of being overwritten by generic internal failures.
- Outer route-level internal error handling remains as structured fallback normalization when no valid downstream standardized failure is present.

#### Consolidation note

The remediated backend/orchestrator target for the Step 7 first flow now consistently preserves standardized `ConversionResult` objects for success, expected failure, and internal coordination-layer failure handling under the verified scenarios.

Next: Step 7 backend/orchestrator work can proceed with this flow-specific remediation baseline considered verified and consolidated.

### Step 7.4.3 — Frontend/UI Contract-Risk Points and Target Behavior (First Step 7 Flow)

This sub-step identifies grounded frontend/UI contract-risk points and defines the target frontend/UI behavior for the first executable Step 7 flow, reusing the already established frontend coordination mapping (`App.tsx` -> `convertText`).

- Selected migration wave: **Text -> Markdown**
- First executable flow: **`POST /api/text-to-markdown`**
- Frontend/UI coordination path considered: **`api/frontend/src/App.tsx` (`handleConvert`) + `api/frontend/src/converters/generic-converter.ts` (`convertText`)**

#### Exact frontend/UI contract-risk points (grounded)

1. **Flow-entry gating risk (UI path currently blocked)**
   - **Where:** `App.tsx` `handleConvert` currently allows only `asciidoc <-> markdown`.
   - **Why risky:** the remediated backend `Text -> Markdown` standardized semantics can be fully ignored by normal UI execution because this flow is rejected before `convertText` call in common interaction paths.
   - **Impact:** contract-preserving backend payloads may not reach the effective UI boundary for this flow.

2. **Non-migrated-path handling in `convertText` (semantic downgrading risk)**
   - **Where:** `generic-converter.ts` treats only two migrated paths as `isMigratedContractPath`.
   - **Why risky for `txt -> markdown`:**
     - success does not require `conversionResult` presence/validity;
     - output extraction uses legacy fallback (`data.markdown || data.asciidoc || data.result || ""`);
     - stale-output clearing on generic errors is currently enforced only for migrated paths.
   - **Impact:** standardized semantics can be partially bypassed or reduced to legacy output extraction behavior.

3. **Structured failure not fully owned by UI for this flow**
   - **Where:** on structured failure, `setBackendConversionResult(...)` is called, but stale output cleanup is conditional on `isMigratedContractPath`.
   - **Why risky:** for `txt -> markdown`, previous successful output can remain visible after a failed current attempt in some error branches.
   - **Impact:** current-attempt ownership at the result panel may become ambiguous.

4. **State/contract asymmetry between success and failure**
   - **Where:** success path for non-migrated routes may proceed from output fields alone, while failure path can rely on structured error if present.
   - **Why risky:** success/failure semantics are not enforced symmetrically around canonical `conversionResult`.
   - **Impact:** UI may preserve backend error semantics better than backend success semantics for this specific flow.

5. **Legacy message fallback risk**
   - **Where:** fallback branches in `convertText` still construct generic string errors from HTTP text/detail when structured payload is absent or ignored.
   - **Why risky:** meaningful backend `error.code` context can be dropped from user-visible feedback in legacy branches.
   - **Impact:** semantic compression to generic string-only failure messaging remains possible.

#### Points that already appear safe

- `convertText` can already route `txt -> markdown` to `POST /api/text-to-markdown`.
- Structured failure payloads (`success === false` + structured `error`) are consumed when received, and `setBackendConversionResult` can preserve raw backend failure object in UI state.
- `conversionUiState` transitions (`loading` -> `success`/`error`) are already wired through the shared conversion call.
- Notification/error modal mechanisms are already present and can render conversion failures without flattening all branches.

#### Points still requiring alignment work

- Enable practical UI execution path for `txt -> markdown` without bypass at `handleConvert`/format gating level.
- Promote `txt -> markdown` to contract-preserving handling parity with already migrated paths in `convertText`.
- Enforce current-attempt output ownership (stale-output cleanup) for this flow on all failure categories.
- Require canonical success semantics to stay tied to standardized `conversionResult`, not only legacy output-key fallback.

#### Target frontend/UI behavior for this flow

##### Success consumption/rendering (target)

- UI should treat backend `conversionResult` as the canonical success semantic source for this flow (same preservation principle used by already migrated flows).
- Result panel rendering may still use `markdown` transport field, but only when consistent with a valid success `conversionResult`.
- Required structured fields from backend success should remain available in `lastBackendConversionResult` for diagnostics and UI coherence.

##### Failure consumption/rendering (target)

- UI should preserve structured backend failure semantics (`error.code`, `error.message`, optional `error.details`) without flattening into generic strings when structured payload is present.
- `error.code` should remain visible/usable in status/notification logic for this flow, as already done for migrated paths.
- Compatibility text fields (`detail`) are acceptable only as additive fallback, not as replacement for structured error semantics.

##### `idle / loading / success / error` state behavior (target)

- New attempt must clear stale transient indicators before request dispatch.
- `loading` must start at request launch and always terminate in `success` or `error`.
- On any failed current attempt (structured or non-structured), stale previous success output should not remain presented as current result for this flow.
- `lastBackendConversionResult` should represent current-attempt ownership and not leak previous attempt semantics.

##### Acceptable interpretation/enrichment (target)

- Additive UI-level enrichment (localized labels, modal wording, notifications) based on structured backend semantics.
- Minimal fallback messaging when backend is genuinely non-structured.
- Non-destructive projection of backend result into UI state for diagnostics and presentation.

##### Unacceptable flattening/reshaping/stale-state behavior (target)

- Treating `txt -> markdown` success as valid purely from legacy output keys while ignoring contradictory or missing standardized success semantics.
- Flattening structured failures into string-only generic errors when structured backend error is available.
- Dropping `error.code` for this flow in branches where structured backend error exists.
- Leaving stale previous output visible after a failed current conversion attempt.
- Rebuilding a parallel frontend-only success/failure model that diverges from backend `ConversionResult` semantics.

Next: sub-step 7.4.4 will apply targeted frontend/UI remediation so this flow follows the target behavior defined above.

### Step 7.4.5 — Verification and Consolidation of Frontend/UI Remediation (First Step 7 Flow)

This sub-step verifies and consolidates the frontend/UI remediation for the first executable Step 7 flow after 7.4.4 updates.

- Selected migration wave: **Text -> Markdown**
- First executable flow: **`POST /api/text-to-markdown`**
- Frontend/UI target verified: **`api/frontend/src/converters/generic-converter.ts` (`convertText`)** with coordination through **`api/frontend/src/App.tsx` (`handleConvert`)**

#### Verification coverage re-run

- `api/frontend/src/converters/generic-converter.test.ts` (Vitest)
  - includes dedicated `txt -> markdown` success/failure consumption checks
  - includes state-coherence and stale-output protection checks

#### Consolidated verification outcomes

##### Success-path consumption/preservation

- Standardized success `ConversionResult` is consumed as canonical semantics for `txt -> markdown`.
- Success is no longer accepted for this flow when required standardized success semantics are missing.
- Required semantics (`success === true`, `error === null`, structured result object presence) are enforced in verified branches.

##### Failure-path consumption/preservation

- Standardized failed `ConversionResult` is consumed without flattening into generic string-only local models when structured payload is available.
- Structured failure data is preserved, including meaningful `error.code` for UI-level handling.
- Backend failure semantics remain accessible via frontend backend-result state relay.

##### Frontend state behavior (`idle/loading/success/error`)

- New attempts enter `loading` and clear transient stale indicators at attempt start.
- Failed attempts transition coherently to `error` with stale output cleanup on this flow.
- Successful attempts transition coherently to `success` with current-attempt output ownership.
- Conflicting stale success/error indicators are not observed in verified scenarios.

#### Consolidation note

The first Step 7 frontend/UI flow now preserves standardized backend `ConversionResult` semantics through success/failure handling and coherent state transitions under the verified test coverage.

### Step 7.5.2 — Playbook Conformance Check Against Executed Step 7 Flow

This sub-step verifies whether the executed Step 7 first flow followed the Step 6 operational migration playbook/checklist (`Step 6.3.3`).

- Selected migration wave: **Text -> Markdown**
- Executed flow checked: **`POST /api/text-to-markdown`**
- Playbook reference: **Step 6.3.3 required migration checklist (items 1-17)**

#### Playbook steps clearly completed

- **Runtime flow mapping:** completed in `Step 7.2.1`.
- **Payload mapping:** completed in `Step 7.2.2`.
- **Success-path helper integration:** completed in `Step 7.2.3`.
- **Failure-path helper integration:** completed in `Step 7.2.4`.
- **Internal-error harmonization:** completed in `Step 7.2.5`.
- **Isolated verification (path-level):** completed in `Step 7.2.6` with dedicated backend scripts.
- **Backend/orchestrator target identification + mapping + remediation + consolidation:**
  - target/mapping/risk definition in `Step 7.3.2` and `Step 7.3.3`
  - remediation in `Step 7.3.4`
  - verification/consolidation in `Step 7.3.5`.
- **Frontend/UI target mapping + risk definition + remediation + consolidation:**
  - risk/target behavior definition in `Step 7.4.3`
  - remediation in `Step 7.4.4`
  - verification/consolidation in `Step 7.4.5`.

#### Steps completed in a lighter but acceptable way

- **Backend output-boundary verification:** executed via focused route-level e2e scripts for `text-to-markdown` (success/failure/representative scenarios plus downstream-failure preservation), rather than introducing a new broad verification harness.
- **Effective UI-boundary verification:** covered through focused frontend conversion-layer tests (`generic-converter.test.ts`) that validate structured success/failure consumption and stale-state safeguards; acceptable for this bounded single-flow wave.
- **Final cross-layer non-regression pass:** performed as repeated targeted backend + frontend verification passes for this flow instead of a monolithic full-suite migration runner; acceptable given the wave scope freeze.

#### Grounded deviations (if any)

- **No blocking deviation found.**
- Minor sequencing compression occurred by documenting and validating some backend/frontend checkpoints in tightly coupled increments, but required playbook intents were still satisfied.
- The optional cross-flow comparison/consolidation note (playbook item 17) was handled in concise flow-focused form rather than a broad new comparison chapter, which is acceptable at this stage because Step 7 remains strictly single-flow scoped.

#### Gap worth noting

- No current blocker for playbook conformance.
- Residual caution remains the same as previously noted: preserve strict route-level contract shaping if validation middleware constraints are tightened in future edits.

#### Conformance conclusion

The executed Step 7 first flow conforms overall to the Step 6 migration playbook/checklist, with required steps completed and only bounded, acceptable light-weight execution choices.

### Step 7.5.3 — Execution Observations (Surprises, Frictions, and Grounded Deviations)

This sub-step captures grounded execution observations from the first Step 7 flow (`Text -> Markdown`) across converter migration, backend/orchestrator alignment, frontend/UI alignment, and verification/consolidation.

- Executed flow reviewed: **`POST /api/text-to-markdown`**
- Scope reviewed: **7.2.x + 7.3.x + 7.4.x + 7.5.2 consolidation**

#### Main surprises and frictions observed

1. **Frontend entry-path gating was more restrictive than expected**
   - `txt -> markdown` was present in conversion routing logic but still blocked by UI conversion-allow rules in `App.tsx`.
   - This created a practical mismatch between backend migration readiness and effective UI reachability.
   - **Classification:** notable but acceptable flow-specific surprise (resolved during 7.4.4).

2. **`convertText` contract-preservation logic was path-whitelisted**
   - The anti-flattening and anti-stale protections were initially scoped to previously migrated paths only.
   - `txt -> markdown` required explicit inclusion to inherit the same success/failure and stale-state safeguards.
   - **Classification:** future-refinement candidate for playbook guidance (new flows may repeatedly require this explicit extension).

3. **Downstream standardized failure preservation needed explicit guarding**
   - Backend remediation showed that valid downstream standardized failure payloads could be overwritten by generic route-level normalization unless explicitly preserved.
   - A dedicated preservation check was needed to avoid unjustified replacement with generic internal failure handling.
   - **Classification:** important and should remain documented for future migrations.

4. **Verification stack remained reliable but required focused layering**
   - Migration quality was best validated through targeted backend + frontend checks rather than one broad suite.
   - This was effective but requires disciplined per-flow coverage to avoid gaps.
   - **Classification:** acceptable execution choice; reinforces existing playbook recommendation for layered checks.

5. **Windows process-exit behavior remained a recurring operational friction**
   - Some standalone verification scripts needed explicit delayed process exit handling to avoid hanging despite logically completed assertions.
   - **Classification:** acceptable operational friction, but should remain part of script hygiene patterns.

#### What appears acceptable for this wave

- Additional local handling in frontend contract-path inclusion for `txt -> markdown`.
- Focused verification strategy (targeted scripts/tests) instead of broad global runner for this bounded single-flow wave.
- Additive compatibility wrappers (`detail`) while preserving canonical structured semantics.

#### What should inform later playbook refinement

- Add an explicit checkpoint that frontend conversion-entry gating must be revalidated when a new path is migrated.
- Add an explicit checkpoint that any path-whitelist contract-preservation logic in shared frontend conversion utilities must be updated when onboarding a new flow.
- Keep a formal backend checkpoint to preserve downstream standardized failures before fallback normalization.

#### What could block similar future migrations if undocumented

- Leaving UI entry-gating mismatches undocumented (backend migrated but flow still unreachable in real UI path).
- Forgetting to extend shared frontend contract-preservation switches for newly migrated flows.
- Replacing meaningful downstream standardized failures with generic internal failures at route/orchestrator boundaries.

#### Observation conclusion

The Step 7 first flow did not reveal a blocker-level architectural surprise, but it did reveal recurring flow-onboarding frictions (UI gating, shared-path whitelists, and downstream-failure preservation) that should remain explicitly documented to keep future waves predictable.

### Step 7.5.4 — Wave Verification Validation (Clean-Enough Decision)

This sub-step validates whether the executed Step 7 wave is clean enough at wave-verification level to move forward to synthesis/closure work (without starting Step 7.6 yet).

- Wave validated: **Step 7 first executed wave**
- Flow basis: **`Text -> Markdown` via `POST /api/text-to-markdown`**
- Evidence reused: **7.2.x isolated verification + 7.3.x backend/orchestrator verification + 7.4.x frontend/UI verification + 7.5.2 playbook conformance + 7.5.3 execution observations**

#### Validated / clean aspects

- The selected Step 7 flow is migrated to standardized helper-based semantics on success and failure.
- Backend/orchestrator preservation is validated:
  - standardized success/failure objects survive route-level propagation,
  - internal failures are normalized coherently,
  - downstream meaningful standardized failures are preserved.
- Frontend/UI preservation is validated:
  - standardized success and structured failure semantics are consumed,
  - `error.code` remains available where relevant,
  - stale-state protections and state-transition coherence are verified for this flow.
- Relevant targeted checks pass across backend and frontend verification layers.
- No unresolved major blocker was identified in execution, verification, or conformance review.

#### Acceptable residual differences (non-blocking)

- Compatibility wrapper asymmetry remains intentional (`{ markdown, conversionResult }` on success; additive `detail` on failure) and is documented.
- Verification remains intentionally focused/layered rather than expanded into a broad monolithic wave runner; acceptable for this bounded single-flow wave.
- Documented operational frictions (for example Windows process-exit handling in standalone scripts) remain script-hygiene concerns, not migration blockers.

#### Potential blockers check

- No blocker-level unresolved issue was found that would invalidate Step 7 wave execution quality.
- Remaining differences are bounded, documented, and acceptable within the frozen wave scope.

#### Wave-verification conclusion

The executed Step 7 wave is considered **clean enough** at wave-verification level and is eligible to proceed to Step 7 synthesis/closure work when scheduled.

### Step 7.6.1 — Concise Technical Summary of Step 7 Execution

Step 7 executed a bounded single-flow migration wave on **Text -> Markdown** (`POST /api/text-to-markdown`) and carried that flow through converter-path migration, backend/frontend alignment, and wave-level verification.

#### What Step 7 actually executed

- **Executed flow:** `Text -> Markdown` as the first and only in-wave implementation target.
- **Converter-level migration execution:**
  - success-path standardized result construction integrated with `createSuccessResult(...)`;
  - failure-path standardized result construction integrated with `createFailureResult(...)`;
  - internal error handling harmonized to preserve grounded structured semantics (`EMPTY_INPUT`, `CONVERSION_FAILED`, `INTERNAL_ERROR`) and avoid unnecessary raw-throw leakage.
- **Backend/orchestrator alignment execution:**
  - route-level alignment target mapped and remediated;
  - standardized success/failure propagation preserved through the backend output boundary;
  - downstream meaningful standardized failures preserved instead of being overwritten by generic internal fallbacks.
- **Frontend/UI alignment execution:**
  - `txt -> markdown` flow made contract-preserving in conversion consumption logic;
  - standardized success/failure semantics consumed with structured error preservation;
  - state-transition coherence reinforced (`loading -> success/error`) with stale-state safeguards for this flow.
- **Verification and consolidation execution:**
  - isolated backend verification scripts for success/failure/representative scenarios;
  - backend remediation verification including downstream failure-preservation probe;
  - focused frontend verification for structured success/failure consumption and state coherence;
  - playbook conformance and execution-observation checks recorded;
  - wave-level clean-enough decision validated (`7.5.4`).

#### What Step 7 proved or confirmed

- The Step 6 migration playbook is operationally reusable on this new bounded flow.
- Standardized `ConversionResult` semantics can be migrated end-to-end on `Text -> Markdown` without broad redesign.
- Layered verification and minimal targeted remediation are sufficient to reach wave-verification cleanliness for this scope.

#### What remains outside Step 7 scope

- Migration execution of additional deferred paths (`HTML -> *`, generic `/api/convert` family, broader wrapper cleanup).
- Broad cross-flow architecture redesign or generalized migration framework refactor.
- Broader product-wide frontend/backend cleanup not required by the bounded Step 7 wave.

### Step 7.6.2 — Multi-Flow Baseline Update (Validated Reference Set Expansion)

This sub-step updates the validated multi-flow baseline to explicitly include the executed Step 7 flow in the reference set.

#### Updated validated reference set

The validated reference set now includes three executed flows:

1. First migrated flow: **AsciiDoc -> Markdown** (`POST /api/to-markdown`)
2. Second migrated flow: **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)
3. Executed Step 7 flow: **Text -> Markdown** (`POST /api/text-to-markdown`)

#### What remains common across the validated flows

- Standardized helper-based result construction is used on success and failure (`createSuccessResult(...)`, `createFailureResult(...)`).
- Structured failure semantics are preserved with meaningful `error.code` and non-destructive compatibility handling.
- Backend/orchestrator propagation preserves canonical `ConversionResult` semantics through route-level output boundaries.
- Frontend conversion consumption preserves structured semantics and state coherence (`loading/success/error`) with stale-state safeguards on migrated paths.
- Layered verification pattern remains stable: focused path checks, backend consolidation, frontend consolidation, and wave-level cleanliness validation.

#### What remains path-specific but acceptable

- Converter engines and internals differ by flow (downdoc/lazy-load, pandoc, text2markdown).
- Additive transport wrappers differ by endpoint (`markdown`/`asciidoc` fields plus compatibility `detail` where applicable).
- Error-code distribution and scenario emphasis differ by path while remaining within documented semantics.
- Targeted verification scripts remain path-shaped (flow-specific scenario sets), which is acceptable under the bounded migration model.

#### Baseline-confidence impact for future migrations

Expanding the validated reference set from two to three real flows increases confidence that the migration/alignment model is reusable beyond the initial pair, including a lightweight in-memory text flow. This strengthens the practical baseline for future wave execution while preserving bounded-scope discipline.

### Step 7 Definition of Done

Step 7 of release `0.0.1.4.6` is complete only if all criteria below are satisfied.

#### Completion criteria (all required)

- The first executable flow in the selected Step 7 wave is formally confirmed.
- The Step 7 execution scope is explicitly frozen and respected.
- The flow runtime is mapped before integration.
- Payload mapping to centralized helpers is documented.
- Success-path integration is completed.
- Failure-path integration is completed.
- Internal-error harmonization is completed.
- Isolated verification passes for the executed flow.
- Backend/orchestrator alignment is completed.
- Backend/orchestrator verification passes.
- Frontend/UI alignment is completed.
- Frontend/UI verification passes.
- The executed flow is compared against already migrated flows in the validated baseline set.
- Playbook conformance is checked against the Step 6 operational checklist.
- Execution surprises/frictions are documented with grounded classification.
- The wave is validated as clean enough for synthesis/closure.

#### Step 7 does NOT require

- Executing the entire remaining migration wave.
- Migrating all deferred flows.
- Broad backend/frontend architecture redesign.
- Reopening already validated foundational steps from earlier release stages.

### Step 7 Closure

Step 7 of release `0.0.1.4.6` is closed with execution and validation of the first concrete flow from the selected next migration wave: **Text -> Markdown** (`POST /api/text-to-markdown`).

#### What Step 7 achieved

- Executed the first in-wave concrete flow under the Step 7 bounded scope.
- Migrated that flow at converter/result-construction level to standardized helper-based semantics.
- Aligned backend/orchestrator propagation for that flow, including internal-error handling coherence.
- Aligned frontend/UI consumption and state behavior for that flow.
- Verified that this flow follows the validated migration/alignment model established in earlier steps.

#### Concrete result produced by Step 7

- Added one more real executed flow to the validated reference set.
- Confirmed that the Step 6 operational playbook/checklist is applicable in practical execution.
- Expanded confidence in the reusable migration method with a third real flow.

#### What Step 7 now provides to the project

- A stronger executed migration baseline across multiple real flows.
- Better confidence for executing the remaining items of the selected wave.
- Additional evidence that the migration/alignment model scales beyond the initial validated pair.

#### What remains outside Step 7

- Execution of the rest of the selected migration wave.
- Migration execution of deferred flows.
- Broad backend/frontend redesign work.
- Future-step work not started yet.

#### Transition note

Future work should build on the now-validated Step 7 execution result and avoid reopening already validated migration/alignment questions for this flow unless a new grounded blocker appears.

### Step 8.1.1 — Confirmation of the Next Executable Flow in the Selected Wave

Step 8 begins by confirming the next concrete flow to execute after the completed Step 7 first-flow execution, while keeping the same migration-wave decision logic and sequential cadence.

- **Selected migration wave:** `Text -> Markdown`-first wave with deferred follow-on candidates
- **Step 7 flow already executed:** `Text -> Markdown` via `POST /api/text-to-markdown`
- **Next concrete flow to execute:** `HTML -> *` via `POST /api/from-html` (next follow-on candidate)

#### Why this flow is confirmed next

- It was already identified as the next follow-on candidate after first-flow validation in the established execution order.
- Step 7 completed cleanly, so the defer condition for opening the next candidate is now satisfied.
- It remains the lowest-friction remaining option compared with broader `/api/convert` family migration.
- It best preserves controlled sequential execution and fit with the validated playbook before any higher-surface expansion.

Next: sub-step 8.1.2 will verify whether the wave order needs any grounded adjustment after the Step 7 execution evidence.

### Step 8.1.2 — Post-Step-7 Execution Order Review for the Selected Wave

This sub-step reviews whether the selected migration-wave execution order should be adjusted after the completed Step 7 execution.

- **Selected migration wave:** `Text -> Markdown`-first wave with deferred follow-on candidates
- **Step 7 flow already executed:** `Text -> Markdown` via `POST /api/text-to-markdown`
- **Currently recommended next flow:** `HTML -> *` via `POST /api/from-html`

#### Ordering decision after Step 7 evidence

- **Decision:** the original order remains valid (no adjustment required at this stage).

#### Grounded rationale

- Step 7 completed with clean wave-verification outcomes and no blocker-level architectural surprise.
- Observed frictions in Step 7 were flow-local onboarding issues (UI gating, path-whitelist extension, downstream failure-preservation guard) and were remediated/documented without indicating a higher-priority replacement candidate.
- No hidden dependency was revealed that would justify promoting broader `/api/convert` migration ahead of `HTML -> *`.
- The next candidate (`HTML -> *`) still provides the best controlled progression under the validated playbook while preserving bounded sequential execution.
- Coupling/interference risk remains lower with this order than with expanding directly to higher-surface generic conversion paths.

Next: sub-step 8.1.3 will freeze the remaining Step 8 execution scope before implementation of the next flow begins.

### Step 8.1.3 — Remaining Step 8 Execution Scope Freeze

This sub-step freezes the remaining execution scope of Step 8 to keep the selected wave bounded, controlled, and protected from scope creep before implementation resumes.

- **Selected migration wave:** `Text -> Markdown`-first wave with deferred follow-on candidates
- **Step 7 flow already executed:** `Text -> Markdown` via `POST /api/text-to-markdown`
- **Next confirmed executable flow:** `HTML -> *` via `POST /api/from-html`

#### IN scope for the remaining Step 8 execution

- Execute migration/alignment work for the next confirmed flow (`HTML -> *`) only.
- Follow the validated sequential order (no parallel multi-flow execution).
- Reuse the established migration/alignment playbook and minimum verification kit.
- Keep implementation and verification bounded to converter-level, backend/orchestrator, and frontend/UI layers required for this flow.
- Apply only minimal, grounded fixes required to preserve standardized semantics and verification coherence.

#### OUT of scope for Step 8

- Migrating unrelated additional flows beyond the next confirmed flow.
- Broad backend architecture redesign.
- Broad frontend/UI redesign.
- Building generic migration frameworks without a demonstrated blocking need.
- Product-wide cleanup unrelated to the selected wave.
- Reopening already validated contract/alignment/convention decisions without a grounded blocker.

#### Deferred until later

- Generic `/api/convert` family migration.
- Additional deferred wave candidates beyond `HTML -> *`.
- Broad wrapper-focused harmonization and non-essential cross-flow cleanup.
- Any larger redesign work outside the bounded wave execution model.

#### Why this scope freeze matters

It preserves controlled sequential execution, limits coupling risk, keeps diagnostics clear, and prevents mid-flight expansion that would reduce comparability with the validated migration/alignment method.

Next: sub-step 8.2.1 will begin runtime flow mapping of the next confirmed executable flow.

### Step 8.2.1 — Current Runtime Flow Mapping (Before Helper Integration)

This sub-step maps the current runtime flow of the next confirmed executable flow before any helper-based payload mapping or integration work.

- **Selected migration wave:** `Text -> Markdown`-first wave with deferred follow-on candidates
- **Current Step 8 flow:** `HTML -> *` via `POST /api/from-html`

#### Current runtime flow (grounded)

1. Request enters `api/backend/routes/conversion.routes.js` at `router.post('/from-html', ...)`.
2. Validation middleware (`validate` + `zod`) requires:
   - `text: z.string().min(1)`
   - `to: z.string().min(1)`.
3. Route handler reads `{ text, to }` from `req.body`.
4. Route applies local semantic pre-check: `if (!text.trim())` -> HTTP `400` with `{ detail: "The HTML text to convert is empty" }`.
5. Route logs start: `Converting <length> characters (HTML -> <to>) with Pandoc`.
6. Route calls `await convertHtmlWithPandoc(text, to)` from `api/backend/services/conversion/convert.js`.
7. `convertHtmlWithPandoc` delegates directly to `convertWithPandoc(html, 'html', toFormat)`.
8. `convertWithPandoc` performs:
   - input/format validation and format normalization,
   - Pandoc format mapping (`from` and `to`),
   - temporary directory and input/output file path creation,
   - input file write + `safeSpawn('pandoc', ...)` execution,
   - output file read and text cleanup for text-like formats,
   - guaranteed temp-file/temp-dir cleanup in `finally`.
9. On route-level success, route logs result size and returns HTTP `200` with dynamic payload `{ [to]: result }`.
10. On route-level catch, route logs error and returns HTTP `500` with `{ detail: "Conversion error: ..." }`.

#### Current success-path shape

- HTTP `200` with a dynamic output key only (example: `{ markdown: string }`, `{ asciidoc: string }`, etc.).
- No standardized `ConversionResult` object is currently attached on this path.
- No route-level duration field or structured `warnings`/`logs`/`meta` payload is currently returned.

#### Current failure-path shape

- Validation/pre-check failure:
  - middleware rejection for missing/invalid fields (`z.string().min(1)`), or
  - route semantic empty-input check -> HTTP `400` with `{ detail: string }`.
- Runtime conversion/service failure:
  - service can throw normalized errors (`Pandoc conversion failed`, timeout, or generic execution failure),
  - route catch transforms them to HTTP `500` with `{ detail: "Conversion error: ..." }`.
- Structured failure `ConversionResult` is not currently emitted.

#### Integration-relevant observations (before payload mapping)

- The route currently mixes middleware-level rejection and route-level detail-only failure envelopes.
- `convertWithPandoc` is throw-driven and file-backed (temp files/dir), while route responses are detail-only objects; no standardized result object is propagated.
- Output file information exists internally in `convertWithPandoc` (temp `outputFile`) but is cleaned up before response and not exposed as structured metadata.
- Duration and structured attempt telemetry are not measured/returned at route boundary.
- Error information is generated in multiple layers (input/format checks, spawn timeout/exec failure, route catch), then flattened into `detail` at output boundary.

Next: sub-step 8.2.2 will define payload mapping from this current flow to centralized helpers (`createSuccessResult()` / `createFailureResult()`).

### Step 8.2.2 — Payload Mapping to Centralized Helpers (Before Integration)

This sub-step defines payload mapping for the current Step 8 flow (`HTML -> *` via `POST /api/from-html`) before helper integration.

- **Selected migration wave:** `Text -> Markdown`-first wave with deferred follow-on candidates
- **Current Step 8 flow:** `HTML -> *` via `POST /api/from-html`

#### Success payload mapping (`createSuccessResult(payload)`)

| Field | Runtime source in current flow | Mapping status | Mapping strategy for integration |
|---|---|---|---|
| `conversionId` | Not currently created in `/from-html` route | Derivable locally | Create per-attempt route id at request start (same pattern as migrated routes). |
| `converter` | Route uses `convertHtmlWithPandoc(...)` | Derivable locally | Use stable converter identifier: `"pandoc"`. |
| `pipeline` | Not currently emitted | Derivable locally | Use fixed path pipeline for this route: `["html-><to>"]` (or normalized equivalent list). |
| `inputFormat` | Implied by route (`from-html`) | Directly available | Set to `"html"`. |
| `outputFormat` | Request body field `to` | Directly available | Set to normalized `to` value used by runtime conversion call. |
| `inputFile` | Request body `text` only, no structured descriptor today | Derivable locally | Build in-memory input descriptor from HTML body (`originalName`, `storedPath`, `size`, `mimeType`). |
| `outputFile` | Converted output exists as string (`result`) in route; service has temp output file internally | Derivable locally | Build response-level in-memory output descriptor from converted content length + target mime type. |
| `startedAt` | Not tracked at route level | Derivable locally | Capture at request start timestamp. |
| `finishedAt` | Not tracked at route level | Derivable locally | Capture at success completion timestamp. |
| `durationMs` | Not tracked at route level | Derivable locally | Compute elapsed time from start to completion. |
| `warnings` | No structured warning list currently returned | Helper default | Use helper default `[]` for this migration step. |
| `logs` | Console logs only; no per-attempt structured logs returned | Helper default | Use helper default `[]` for this migration step. |
| `meta` | No structured metadata currently returned | Derivable locally | Add minimal metadata (route id/path + in-memory transport + optional target format marker). |

#### Failure payload mapping (`createFailureResult(payload)`)

| Field | Runtime source in current flow | Mapping status | Mapping strategy for integration |
|---|---|---|---|
| `conversionId` | Not currently created | Derivable locally | Reuse same per-attempt id created at request start. |
| `converter` | Conversion path uses `convertHtmlWithPandoc` -> `convertWithPandoc` | Derivable locally | Set to `"pandoc"` for this flow. |
| `pipeline` | Not currently emitted | Derivable locally | Use fixed route-level pipeline representation aligned with target format. |
| `inputFormat` | Route semantics | Directly available | Set to `"html"`. |
| `outputFormat` | Request body field `to` | Directly available | Set to normalized target format value. |
| `inputFile` | Request body `text` only | Derivable locally | Build in-memory input descriptor from available request text (including empty/trimmed case). |
| `startedAt` | Not tracked at route level | Derivable locally | Capture at request start. |
| `finishedAt` | Not tracked at route level | Derivable locally | Capture at failure completion. |
| `durationMs` | Not tracked at route level | Derivable locally | Compute elapsed time at failure return point. |
| `error` | Currently flattened to `{ detail: ... }` in route responses and generic service throws | Derivable locally | Build structured error (`code`, `message`, `details`, `recoverable`) from grounded failure stage (pre-check vs runtime/pandoc execution). |
| `outputFile` | No failure output metadata returned today; temp output file is cleaned up internally | Typically absent currently | Set `null` by default; include only if grounded failure-time output artifact is available and safe to expose. |
| `warnings` | No structured warning list currently returned | Helper default | Use helper default `[]`. |
| `logs` | Console logging only | Helper default | Use helper default `[]`. |
| `meta` | No structured metadata currently returned | Derivable locally | Add minimal route/transport metadata and optional failure-stage marker. |

#### Field availability classification (consolidated)

- **Directly available now:** `inputFormat` (`html`), `outputFormat` (`to`), raw request `text`, converted output string on success.
- **Derivable locally during integration:** `conversionId`, `converter`, `pipeline`, `inputFile`, `outputFile` (success), `startedAt`, `finishedAt`, `durationMs`, structured `error`, minimal `meta`.
- **Expected via helper defaults:** `warnings`, `logs` (both as `[]` at this stage).
- **Currently absent / not exposed at boundary:** failure-time `outputFile` metadata (service temp-file lifecycle is internal and cleaned before response).

Next: sub-step 8.2.3 will start runtime success-path integration for this flow using `createSuccessResult(...)`.

### Step 8.3.1 — Identification of the True Backend/Orchestrator Target (Step 8 Flow)

#### Backend components actually involved for `POST /api/from-html`

- **Route / controller (real entrypoint of this flow):** `api/backend/routes/conversion.routes.js`
  - `router.post('/from-html', ...)` performs:
    - request pre-checks for contract-grounded failures (`text.trim()` and `to.trim()`)
    - `conversionResult` construction on success (`createSuccessResult(...)`)
    - internal failure harmonization on error (`classifyFromHtmlInternalError(...)`, `buildFromHtmlFailure(...)`)
    - downstream standardized failure preservation when present (`extractStandardizedFailureFromError(...)`)

- **Validation middleware (type-level Zod parsing only):** `api/backend/middleware/security/validate.middleware.js`
  - returns a `{ error, issues }` envelope on schema validation failure.
  - In practice for this endpoint, the contract-shaped failures for empty input are handled by route-level pre-checks.

- **Converter / treatment service (Pandoc dispatch, dispatch direct):** `api/backend/services/conversion/convert.js`
  - `convertHtmlWithPandoc(html, to)` -> `convertWithPandoc(html, 'html', to)`
  - uses `safeSpawn('pandoc', ...)` and performs temp input/output file cleanup in `finally`
  - returns the converted output as a string (no `ConversionResult` contract packaging here)

- **ConversionResult builders (shared contract helper):** `api/backend/src/utils/conversion-result.js`
  - `createSuccessResult(...)` and `createFailureResult(...)` apply standardized root fields and helper defaults (`warnings`, `logs`, `meta`, etc.)

- **Orchestrator / registry / lazy loader: not part of this specific route execution path**
  - `api/backend/services/modules/main-orchestrator.js`, `converter-orchestrator.module.js`, `lazyload.module.js` (and `runConverter`) are not invoked by `router.post('/from-html', ...)`.
  - The endpoint uses direct conversion dispatch via `convertHtmlWithPandoc(...)`.

#### Backend/orchestrator alignment target retained

- **Target:** `api/backend/routes/conversion.routes.js` — specifically the `router.post('/from-html', ...)` handler (and its local helper functions `buildFromHtmlFailure(...)`, `classifyFromHtmlInternalError(...)`, `extractStandardizedFailureFromError(...)`).

#### Why this target is the correct alignment point

- **Where the flow is invoked:** the Step 8 flow is directly started by `router.post('/from-html', ...)` (no `/api/proxy/convert` / `executeConversionRequest(...)` path for this endpoint).
- **Where success / failure are coordinated:** the handler constructs the success payload (`createSuccessResult(...)`) and, on failure, either:
  - preserves an already-standardized downstream failure (`extractStandardizedFailureFromError(...)`), or
  - classifies the internal error and returns a contract-shaped failure (`buildFromHtmlFailure(...)`).
- **Where `ConversionResult` can be preserved/enriched/deformed/cached:** the handler decides which structured error to return (`error.code/message/details`), and it sets/derives root fields such as `outputFile`, `warnings`, `logs`, and `meta` at the response boundary.

### Step 8.3.2 — Backend/Orchestrator Flow Map (Step 8 via 8.3.1 Target)

#### Success flow (nominal): `POST /api/from-html`

1. **Backend entrypoint / start point:** `api/backend/routes/conversion.routes.js`
   - `validate({ body: z.object({ text: z.string(), to: z.string() }) })` applies Zod parsing only.
2. **Handler :** `router.post('/from-html', async (req, res) => { ... })`
   - Creates `conversionId = randomUUID()`, `startedAt`, `startedAtMs`.
3. **Route pre-checks:**
   - If `!text.trim()` => pre-check failure flow (see below).
   - If `!to.trim()` => pre-check failure flow (see below).
4. **Converter invocation (direct dispatch, no orchestrator):**
   - `const result = await convertHtmlWithPandoc(text, to)`
   - Module resolution: `convertHtmlWithPandoc` comes from `api/backend/services/conversion/convert.js`
   - Call chain:
     - `convertHtmlWithPandoc(html, to)` -> `convertWithPandoc(html, 'html', to)`
     - `convertWithPandoc(...)` :
       - writes a temp input file
       - executes `safeSpawn('pandoc', ...)` with `timeoutMs`
       - reads the output file and normalizes returned text
       - cleans up temp files/dir in `finally`
5. **First creation point of the standardized `ConversionResult`:**
   - `const conversionResult = createSuccessResult({ ... })` in the `'/from-html'` handler
   - Root fields populated:
     - `success: true`, `error: null`
     - `converter: 'pandoc'`
     - `pipeline: ['html-><normalizedTo>']`
     - `inputFormat: 'html'`, `outputFormat: <normalizedTo>`
     - `inputFile` (descriptor in-memory), `outputFile` (descriptor in-memory), `warnings: []`, `logs: []`, `meta: { route, transport, targetFormat }`
6. **Upward propagation (final backend response):**
   - `return res.json({ [to]: result, conversionResult })`
   - The `ConversionResult` is therefore **returned under the `conversionResult` key** (wrapped at the success payload level).

#### Failure flow (harmonized contract): `POST /api/from-html`

##### A) Route pre-check failure (HTTP `400`)

1. **Empty `text` pre-check:**
   - Condition : `if (!text.trim())`
   - `const failure = buildFromHtmlFailure({ code: 'EMPTY_INPUT', ... })`
   - `buildFromHtmlFailure(...)` -> `createFailureResult(...)` (first standardized creation at the route)
   - Final return:
     - `return res.status(400).json({ ...failure, detail: failure.error.message })`
2. **Empty `to` pre-check:**
   - Condition : `if (!to.trim())`
   - `const failure = buildFromHtmlFailure({ code: 'CONVERSION_FAILED', details: { stage: 'route-precheck', reason: 'OUTPUT_FORMAT_EMPTY' }, ... })`
   - `buildFromHtmlFailure(...)` -> `createFailureResult(...)`
   - Final return:
     - `return res.status(400).json({ ...failure, detail: failure.error.message })`

##### B) Runtime failure (HTTP `500`)

1. **Interception point:** `catch (error) { ... }` around `convertHtmlWithPandoc(...)`.
2. **Preservation path for an already-standardized `ConversionResult` (if present):**
   - `const downstreamFailure = extractStandardizedFailureFromError(error)`
   - If `downstreamFailure` is found:
     - return:
       - `res.status(500).json({ ...downstreamFailure, detail: downstreamFailure.error.message })`
     - Note: the `ConversionResult` is returned **at the root level** (not wrapped in `conversionResult`) and an additional `detail` field is added.
3. **Classification + reconstruction path (otherwise):**
   - `const classified = classifyFromHtmlInternalError(error)`
   - `const failure = buildFromHtmlFailure({ code: classified.code, message: classified.message, details: classified.details, outputFile: null, ... })`
   - `buildFromHtmlFailure(...)` -> `createFailureResult(...)` (first standardized creation at the route, inside the `catch`)
   - final return:
     - `return res.status(500).json({ ...failure, detail: failure.error.message })`

#### Where the standardized `ConversionResult` is created (summary)

- **Nominal success:** `createSuccessResult(...)` in the `router.post('/from-html', ...)` handler.
- **Pre-check failure:** `buildFromHtmlFailure(...)` -> `createFailureResult(...)` in the handler, before calling Pandoc.
- **Runtime failure:**
  - if `extractStandardizedFailureFromError(error)` returns a standardized failure: the first creation is downstream (before the throw), and the route handler **propagates it**;
  - otherwise: `buildFromHtmlFailure(...)` -> `createFailureResult(...)` in the `catch`.

#### Useful risk observations (reshape / wrap / strip / bypass)

1. **Wrap vs root-level depending on HTTP status**
   - Success (`200`): `ConversionResult` is under `conversionResult`.
   - Failure (`400`/`500`): `ConversionResult` is returned at the root level via `{ ...failure, detail: ... }`.
   - Risk: a consumer that expects a single consistent structure can break depending on success/failure path.
2. **Addition of the `detail` key**
   - On failure, `detail` is added at the root level, in addition to `error.message`/`error.details`.
   - Risk: strict consumers may not expect this extra field.
3. **Preservation is possible but conditional via `extractStandardizedFailureFromError`**
   - If a downstream failure is already standardized and present as `error` (or `error.conversionResult`), it is returned as-is (spread): good preservation.
   - Risk: if the “standardized” shape is close but not exactly compliant, `extractStandardizedFailureFromError` will return `null` and the route will reconstruct a failure via `buildFromHtmlFailure` (possible loss of original details).
4. **Bypass via non-contract errors**
   - Zod validation errors from `validate(...)` respond with `{ error, issues }` (not a `ConversionResult`).
   - Risk: for certain invalid inputs (outside route pre-checks), the `ConversionResult` contract may not be produced.
5. **Error classification depends on message text**
   - `classifyFromHtmlInternalError(error)` matches substrings in `error.message` to choose `CONVERSION_FAILED` vs `INTERNAL_ERROR`.
   - Risk: misclassification if the exception text changes (structured code remains present, but category/stage can vary).

### Step 8.4.1 — Identification of the True Frontend/UI Target (Step 8 Flow)

#### Frontend components actually involved for Step 8 (`HTML -> *`, `POST /api/from-html`)

- **API call layer / endpoint routing:** `api/frontend/src/converters/generic-converter.ts`
  - `convertText(...)` selects endpoint based on `sourceFormat`/`targetFormat`.
  - For HTML, it routes to: `endpoint = \`${API_BASE}/api/from-html\`` and sends `{ text, to: targetFormat }`.

- **Conversion action handler (UI entrypoint):** `api/frontend/src/App.tsx`
  - `handleConvert()` triggers `convertText(...)` and wires:
    - `setLoading`, `setStatus`
    - error-modal setters (`setShowConversionErrorModal`, `setConversionErrorMessage`)
    - standardized backend result capture (`setLastBackendConversionResult`)
    - conversion lifecycle state (`setConversionUiState`)

- **State management (local component state):** `api/frontend/src/App.tsx`
  - `loading` + `status` (user-facing)
  - `conversionUiState: 'idle' | 'loading' | 'success' | 'error'`
  - `lastBackendConversionResult` (stores the last standardized backend `ConversionResult` when provided)
  - `showConversionErrorModal` + `conversionErrorMessage`
  - output buffers used for rendering: `adocInput`, `mdOutput` (destination panel reads from these)

- **Result panel (render decision / display surface):** `api/frontend/src/App.tsx`
  - `resultCard` (useMemo) renders the destination panel:
    - shows loading indicator when `loading === true`
    - displays output based on `targetFormat` (mostly `mdOutput` for non-asciidoc targets)

- **Error surface (render decision / display surface):** `api/frontend/src/App.tsx`
  - conversion error modal driven by `showConversionErrorModal` and `conversionErrorMessage`
  - plus toast notifications driven by `notification`

#### Frontend/UI alignment target retained

- **Target:** `api/frontend/src/converters/generic-converter.ts` — the `convertText(...)` function.

#### Why this target is the correct alignment point

- **Where the backend result is first consumed:** `convertText(...)` parses HTTP responses (`res.ok` vs not), attempts JSON parsing, and extracts `conversionResult` (success path) or recognizes structured failures (`success === false` with structured `error`).
- **Where success / failure are coordinated:** `convertText(...)` decides whether the current attempt is success vs error, drives `setConversionUiState('success'|'error')`, clears stale output on failure paths for migrated contract flows, and selects whether to open the conversion error modal.
- **Where result display is decided:** by setting `setOutput(...)` (driving `mdOutput` / `adocInput`) and toggling `loading/status`, `convertText(...)` determines what the result panel will show for the current attempt.
- **Where backend semantics can still be preserved/flattened/ignored:** this is the layer that can keep `error` structured (via `setLastBackendConversionResult`) or flatten it into generic strings/status; therefore it is the primary place to align the UI with standardized `ConversionResult` semantics for Step 8.

### Step 8.4.2 — Frontend/UI Flow Map (Step 8 via 8.4.1 Target)

- **Flow name:** Step 8 — `HTML -> *` (`POST /api/from-html`)
- **Confirmed frontend/UI target:** `api/frontend/src/converters/generic-converter.ts` → `convertText(...)`

#### First frontend consumption point of the standardized backend result

- **Primary consumption point:** `convertText(...)` after `await res.json()`
  - Success path: reads `data.conversionResult` (when present) and validates `conversionResult.success` is boolean; if `success !== true` it is treated as a structured failure.
  - Failure path: when `!res.ok`, attempts JSON parsing and treats the response as a structured failure if it matches `success === false` with `error` object.

#### Success flow (short map)

1. **UI entrypoint:** `App.tsx` `handleConvert()` calls `convertText(...)` and passes setters:
   - `setStatus`, `setLoading`
   - `setShowConversionErrorModal`, `setConversionErrorMessage`
   - `setLastBackendConversionResult`
   - `setConversionUiState`
2. **Attempt initialization in `convertText(...)`:**
   - `setStatus("Conversion en cours...")`, `setLoading(true)`, `setConversionUiState('loading')`
   - clears previous attempt indicators: `setNotification(null)`, closes error modal, clears error message, clears `lastBackendConversionResult`
3. **Endpoint selection (Step 8 specific):**
   - `sourceFormat === 'html'` → `endpoint = ${API_BASE}/api/from-html`, body `{ text, to: targetFormat }`
4. **HTTP 200 handling:**
   - `data = await res.json()`
   - `conversionResult = data.conversionResult` (if present)
   - If `conversionResult.success === true`:
     - `setLastBackendConversionResult(conversionResult)` (first persisted structured success)
     - selects output field based on migration flags:
       - Step 8 is currently **not** included in `isMigratedContractPath`, so it uses the legacy/non-migrated output selection: `data.markdown || data.asciidoc || data.result || ""`
     - `setOutput(result)`, `setStatus("Conversion réussie ✔")`, `setNotification(success)`, `setConversionUiState('success')`
5. **UI rendering:**
   - `App.tsx` result panel (`resultCard`) renders the output from `mdOutput`/`adocInput` according to `targetFormat`, and stops showing the loading indicator once `loading` is false.

#### Failure flow (short map)

1. **UI entrypoint:** `App.tsx` `handleConvert()` → `convertText(...)` (same wiring as success).
2. **HTTP non-OK handling in `convertText(...)` (`!res.ok`):**
   - tries `errorJson = await res.json()`
   - recognizes a structured failure when:
     - `errorJson.success === false` and `errorJson.error` is an object
   - if structured:
     - `setLastBackendConversionResult(structuredFailure)` (first persisted structured failure)
     - chooses `backendMessage` from `structuredFailure.error.message` (fallbacks exist)
     - may open conversion error modal for selected error codes (e.g. `CONVERSION_FAILED`, `OUTPUT_NOT_CREATED`, `OUTPUT_INVALID`, `OUTPUT_IS_INPUT`)
     - `setStatus("Erreur de conversion")`, `setNotification(error)`, `setConversionUiState('error')`, returns (no throw)
3. **HTTP 200 but structured-failure in body (`conversionResult.success !== true`):**
   - if `conversionResult` exists and `conversionResult.success !== true`, `convertText(...)` treats it as a structured failure:
     - `setLastBackendConversionResult(conversionResult)`
     - may open error modal depending on `error.code`
     - `setStatus("Erreur de conversion")`, `setNotification(error)`, `setConversionUiState('error')`, returns
4. **Catch-all failure path (network/timeout/other):**
   - abort timeout → sets status/notification error and `conversionUiState('error')`
   - network failure → sets status/notification error and `conversionUiState('error')`
   - generic errors → sets status/notification error and `conversionUiState('error')`
5. **UI rendering:**
   - error modal is driven by `showConversionErrorModal` + `conversionErrorMessage`
   - toast notification is driven by `notification`
   - result panel continues to render whatever output buffers currently contain (see risks).

#### Propagation path through frontend state/UI (what moves where)

- **Structured backend result storage:** `convertText(...)` → `setLastBackendConversionResult(...)` → `App.tsx` state `lastBackendConversionResult`
- **Attempt lifecycle UI state:** `convertText(...)` → `setConversionUiState(...)` → `App.tsx` state `conversionUiState`
- **Loading/status controls:** `convertText(...)` → `setLoading(...)`, `setStatus(...)` → `App.tsx` states `loading`, `status`
- **Displayed output:** `convertText(...)` → `setOutput(...)` → `App.tsx` states `mdOutput` / `adocInput` → result panel rendering (`resultCard`)
- **Error display:** `convertText(...)` → `setShowConversionErrorModal(...)` / `setConversionErrorMessage(...)` → modal rendering in `App.tsx`

#### Grounded contract-risk observations (flattening / reshaping / ignoring / stale state)

1. **Step 8 is not treated as a migrated contract path in `convertText(...)`**
   - `isMigratedContractPath` does not include `sourceFormat === 'html'`, so the Step 8 success path does not require (nor strongly gate on) `conversionResult` presence before displaying output.
   - Risk: UI can display “success” output even if `conversionResult` is missing or inconsistent, because output extraction is legacy-style (`data.markdown || data.asciidoc || ...`).
2. **On failure, output clearing is conditional**
   - Stale-output clearing (`setOutput("")`) is guarded by `isMigratedContractPath`; Step 8 is outside this guard.
   - Risk: a failed Step 8 attempt can leave a previous successful output visible in the result panel, while the UI is in an error state (stale-state misuse).
3. **Failure detection depends on response envelope shape**
   - Structured failures are recognized when the payload is `success === false` with an `error` object (root-level).
   - Risk: if the backend returns failures wrapped differently (e.g. under a key) the UI may fall back to generic string handling and lose structured semantics.
4. **Selective error-modal logic based on `error.code`**
   - The decision to open the conversion error modal depends on specific `error.code` values.
   - Risk: new/unknown `error.code` values remain structured in state, but may not trigger the modal and will rely on status/toast only (potentially “ignoring” richer semantics).

### Step 8.4.3 — Frontend/UI Contract-Risk Points + Target Behavior (Step 8)

- **Flow name:** Step 8 — `HTML -> *` (`POST /api/from-html`)
- **Confirmed frontend/UI target:** `api/frontend/src/converters/generic-converter.ts` → `convertText(...)`

#### Contract-risk points (grounded, exact places)

1. **Step 8 is not included in the “migrated contract path” gating**
   - **Where:** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
   - **What:** `isMigratedContractPath` is derived from:
     - `asciidoc -> markdown`, `markdown -> asciidoc`, `txt -> markdown`
     - (HTML Step 8 is not included)
   - **Risk:** Step 8 success rendering can proceed without requiring a standardized `conversionResult` to be present/valid.

2. **Legacy output selection can ignore the actual backend `ConversionResult` semantics**
   - **Where:** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
   - **What:** for non-migrated paths, output is chosen via `data.markdown || data.asciidoc || data.result || ""`
   - **Risk:** even if `conversionResult` is missing/inconsistent, UI can still render some output string and mark the attempt as “success”.

3. **Stale-state risk: output clearing on failure is conditional**
   - **Where:** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
   - **What:** on structured failures and in catch, `setOutput("")` is guarded by `isMigratedContractPath`
   - **Risk:** for Step 8, a failed attempt can leave the previous successful result visible in the result panel (stale output) while the UI shows error status/toast/modal.

4. **Structured failure recognition depends on response envelope shape**
   - **Where:** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
   - **What:** a structured failure is recognized when (non-OK path):
     - `errorJson.success === false` and `errorJson.error` is an object
   - **Risk:** if the backend returns a different envelope (e.g., failure nested under a key), frontend falls back to generic string handling, flattening structured semantics.

5. **Reduction of failures to generic UI state unless a known `error.code` triggers the modal**
   - **Where:** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
   - **What:** error modal is shown only for a subset of codes (`CONVERSION_FAILED`, `OUTPUT_NOT_CREATED`, `OUTPUT_INVALID`, `OUTPUT_IS_INPUT`)
   - **Risk:** even with a structured failure preserved in state, UI can under-communicate severity/meaning (toast/status only), effectively “ignoring” richer semantics in `error.details`.

6. **`ConversionResult` is captured, but UI rendering is not explicitly driven by it (Step 8)**
   - **Where:** `api/frontend/src/App.tsx` (`lastBackendConversionResult` state + `resultCard`)
   - **What:** result rendering is driven primarily by `mdOutput`/`adocInput` and `loading`, not by `lastBackendConversionResult` as the single source of truth for Step 8.
   - **Risk:** mismatch between what the backend reports (structured result) and what the UI shows (string output) is possible.

#### Safe points (already aligned / protective)

1. **First consumption of structured semantics exists and is explicit**
   - **Where:** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
   - **What:** it extracts `data.conversionResult` on success responses and recognizes structured failures on non-OK responses.

2. **Structured failures are preserved as structured objects (not forced into strings) when recognized**
   - **Where:** `convertText(...)` → `setLastBackendConversionResult(...)` (passed as `setBackendConversionResult`)
   - **What:** when a structured failure is detected, the object is stored in `App.tsx` state as-is.

3. **Attempt lifecycle state is consistently updated**
   - **Where:** `convertText(...)` sets `conversionUiState` to `loading` then `success`/`error`, and always clears `loading` in `finally`.

4. **Attempt start clears some stale indicators**
   - **Where:** `convertText(...)` attempt initialization
   - **What:** clears notification, closes error modal, clears error message, clears `lastBackendConversionResult`.

#### Target frontend/UI behavior (definition for Step 8)

##### Success consumption and rendering

- **Must** treat a conversion attempt as “success” only if:
  - a standardized `ConversionResult` is present and `conversionResult.success === true`, and
  - required root fields are present (at least: `success`, `error === null`, `warnings` array, `logs` array, `meta` object, and coherent `outputFile`).
- **Must** store the standardized success result as the single source of truth for the attempt (`lastBackendConversionResult`).
- **May** derive display fields (labels, short status strings) from `conversionResult.meta` and `conversionResult.outputFormat`, but must not reconstruct an ad-hoc “legacy success model” that drops required fields.
- **Must not** mark success solely because some output string exists in the response body.

##### Failure consumption and rendering

- **Must** treat a conversion attempt as “failure” when either:
  - HTTP is non-OK and the body is a standardized failure (`success === false` with structured `error`), or
  - HTTP is OK but `conversionResult.success !== true`.
- **Must** preserve `error` as a structured object and keep `error.code` intact and displayable.
- **Must not** flatten a structured failure into a generic string-only error if the structured payload is present.
- **May** enrich UI rendering with user-friendly messaging (modal/toast) derived from `error.code` and `error.message`, but must not discard the structured object.

##### `idle / loading / success / error` handling

- **Idle:** no attempt in flight; UI shows neutral state; `lastBackendConversionResult` may be null.
- **Loading:** an attempt is in flight; UI must show loading; previous attempt output must not be presented as the current attempt’s output.
- **Success:** show output + success notification; show the current attempt’s `ConversionResult` as the authoritative metadata.
- **Error:** show error surface (toast and/or modal); current attempt’s output should be cleared (or explicitly labeled as stale/non-current if retained for debugging).

##### Acceptable interpretation/enrichment

- Acceptable:
  - presenting `error.code` in UI (optionally),
  - mapping `error.code` to a localized/helpful message,
  - deriving UI severity from `error.code` / `error.details.stage`.
- Unacceptable:
  - ignoring `conversionResult` in favor of legacy output heuristics,
  - reshaping failures into ad-hoc `{ message, detail }` objects when a standardized failure is available,
  - leaving stale output visible after a failed Step 8 attempt without explicit labeling.

#### Transition note

- Runtime remediation (code changes) for these frontend/UI alignment points starts in **Step 8.4.4**.

### Step 8.5.1 — Step 8 vs Already-Migrated Flows (Comparison)

- **Flow name:** Step 8 — `HTML -> *` (`POST /api/from-html`)
- **Reference migrated flows:**  
  - AsciiDoc → Markdown (`POST /api/to-markdown`, downdoc via lazy-loader)  
  - Markdown → AsciiDoc (`POST /api/to-asciidoc`, Pandoc)  
  - Text → Markdown (`POST /api/text-to-markdown`, text2markdown)

#### Shared/common points (consistent with migrated flows)

- **Route-level standardized result construction:** Step 8 builds `ConversionResult` at the HTTP boundary (same pattern as `/to-asciidoc` and `/text-to-markdown`).
- **Structured error model availability:** failures expose a structured `error` with `error.code` and `error.message` (consistent with migrated flows).
- **Downstream structured failure preservation hook:** route-level preservation exists (`extractStandardizedFailureFromError(...)`) aligning with the “do not overwrite a downstream standardized failure” pattern.
- **Frontend primary consumer alignment:** UI consumption runs through the same primary ingestion layer (`api/frontend/src/converters/generic-converter.ts` → `convertText(...)`) as the other migrated flows.
- **Verification style parity:** Step 8 has the same “success contract / failure contract / representative scenarios” e2e script set style as other flows (backend scripts in `api/backend/scripts/`), plus an internal-error contract check similar to `/to-asciidoc`.

#### Acceptable/path-specific differences (different but OK for this flow)

- **Multi-target output shape:** Step 8 returns a dynamic output key (`{ [to]: result, conversionResult }`) because it supports multiple targets; other migrated flows typically return a fixed output key (`markdown` or `asciidoc`).
- **Converter dispatch mode:** Step 8 uses direct Pandoc execution via `convertHtmlWithPandoc` / `convertWithPandoc` (service-level `safeSpawn`), whereas `to-markdown` uses a lazy-loaded module (`runConverter('downdoc', ...)`) and `text-to-markdown` uses a converter function.
- **MIME mapping breadth:** Step 8 maintains a target-format → mimeType map to populate `outputFile.mimeType` across multiple output formats; single-target flows have a narrower mapping.

#### Divergence worth tracking (grounded differences that may need attention)

- **Success vs failure HTTP envelope asymmetry (backend):**
  - Success returns `conversionResult` wrapped under `conversionResult`.
  - Failure returns the `ConversionResult` fields at the root level (plus `detail`).
  - This is consistent with how Step 8 currently behaves, but it remains a divergence risk compared to a “single consistent envelope” expectation across flows.
- **Middleware validation bypass of contract on invalid inputs (backend):**
  - `validate(...)` returns `{ error, issues }` for schema failures (not a `ConversionResult`), which can bypass standardized contract for certain invalid payloads.
  - This is not unique to Step 8, but it is a cross-flow divergence worth tracking as migration expands.
- **Error classification heuristic (backend):**
  - `classifyFromHtmlInternalError(...)` is message-text based for selecting `CONVERSION_FAILED` vs `INTERNAL_ERROR`.
  - Worth tracking because it is more brittle than code/typed error propagation.
- **Step 8 UI now “contract-first” (frontend) but relies on dynamic output key:**
  - The frontend requires `conversionResult` and reads `data[targetFormat]`.
  - Worth tracking because any backend drift in the dynamic key naming (e.g., normalization differences) can break success rendering even if `ConversionResult` is valid.
- **Legacy wrapper modules remain present (frontend):**
  - As with the already migrated flows, dedicated wrappers exist alongside `convertText(...)`; this is acceptable now, but remains a grounded consolidation topic for later cleanup waves.

### Step 8.5.2 — Step 6 Playbook/Checklist Conformance (Step 8)

- **Flow name:** Step 8 — `HTML -> *` (`POST /api/from-html`)
- **Playbook reference:** Step 6.3.3 “Required migration checklist (items 1–17)”

#### Conformance summary

Step 8 follows the Step 6 migration playbook overall. Required items are completed, with a few path-specific “lightweight but acceptable” executions (notably: readiness confirmation and final cross-layer pass are evidenced primarily by executable verification rather than a standalone gate chapter).

#### Checklist mapping (items 1–17)

1. **Confirm candidate readiness (Step 6.2.2 minimum criteria)**  
   - **Status:** completed (lightweight)  
   - **Evidence:** Step 8 scope freeze + the route is reachable and exercised; isolated verification and successful Pandoc execution confirm runtime viability.

2. **Map current converter/runtime flow (success/failure/internal)**  
   - **Status:** completed  
   - **Evidence:** Step 8.2.1 (runtime flow mapping) + Step 8.3.2 (backend propagation map).

3. **Map payload fields into helper inputs (`createSuccessResult` / `createFailureResult`)**  
   - **Status:** completed  
   - **Evidence:** Step 8.2.2 (payload mapping tables for success and failure).

4. **Integrate standardized success-path result construction**  
   - **Status:** completed  
   - **Evidence:** `POST /api/from-html` returns `conversionResult` on success; verified by `api/backend/scripts/verify-e2e-from-html-success-contract.js`.

5. **Integrate standardized failure-path result construction**  
   - **Status:** completed  
   - **Evidence:** route-level pre-check failures return standardized failure payloads; verified by `api/backend/scripts/verify-e2e-from-html-failure-contract.js` and representative scenarios.

6. **Harmonize internal error behavior into structured failure semantics**  
   - **Status:** completed  
   - **Evidence:** internal error classification + structured failure builder for `/from-html`; verified by `api/backend/scripts/verify-e2e-from-html-internal-error-contract.js` (unsupported output format → structured failure with usable `error.code`).

7. **Run isolated converter/path verification (minimum kit required checks)**  
   - **Status:** completed  
   - **Evidence:** Step 8.2.6 scripts:
     - `verify-e2e-from-html-success-contract.js`
     - `verify-e2e-from-html-failure-contract.js`
     - `verify-e2e-from-html-representative-scenarios.js`
     - (plus internal-error contract check)

8. **Identify backend/orchestrator alignment target for the path**  
   - **Status:** completed  
   - **Evidence:** Step 8.3.1 (target retained: `api/backend/routes/conversion.routes.js` `/from-html` handler).

9. **Map backend success/failure propagation and contract-risk points**  
   - **Status:** completed  
   - **Evidence:** Step 8.3.2 (success/failure flow maps + risk observations).

10. **Apply minimal backend remediation to preserve standardized semantics**  
   - **Status:** completed (no-op)  
   - **Evidence:** backend preservation already satisfied the contract checks; no additional backend fix was required for Step 8 after verification.

11. **Verify backend output boundary contract behavior**  
   - **Status:** completed  
   - **Evidence:** e2e scripts validate the effective HTTP boundary (`POST /api/from-html`) for success/failure, plus internal-error case.

12. **Identify frontend/UI alignment target (user-facing path)**  
   - **Status:** completed  
   - **Evidence:** Step 8.4.1 (target retained: `api/frontend/src/converters/generic-converter.ts` `convertText(...)`).

13. **Map frontend success/failure consumption and state behavior**  
   - **Status:** completed  
   - **Evidence:** Step 8.4.2 (flow mapping through `convertText(...)` and `App.tsx` state/UI).

14. **Apply minimal frontend remediation for structured semantics + state coherence**  
   - **Status:** completed  
   - **Evidence:** Step 8.4.4 makes Step 8 contract-first in `convertText(...)` (requires `conversionResult`, clears stale output at attempt start, uses `data[targetFormat]`).

15. **Verify effective UI boundary coherence and stale-state safeguards**  
   - **Status:** completed  
   - **Evidence:** Step 8.4.5 adds/executes Step 8-targeted `vitest` checks ensuring:
     - structured success/failure consumption,
     - preserved `error.code`,
     - coherent state transitions,
     - no stale output leak.

16. **Run final cross-layer non-regression pass using the minimum verification kit**  
   - **Status:** completed (lightweight)  
   - **Evidence:** backend `/from-html` e2e contract verification suite + frontend `vitest` + frontend `typecheck`.

17. **Record comparison/consolidation notes vs previously migrated flows**  
   - **Status:** completed  
   - **Evidence:** Step 8.5.1 (comparison section).

#### Grounded deviations from the playbook (if any)

- No blocker-level deviation observed. The only “lightweight” aspect is that readiness confirmation and the final cross-layer non-regression pass are evidenced primarily by executable verification rather than a separate explicit gate narrative.

### Step 8.5.3 — Step 8 Execution Observations (Surprises, Frictions, Deviations)

- **Flow name:** Step 8 — `HTML -> *` (`POST /api/from-html`)

#### Main surprises / frictions observed (grounded)

1. **Backend success vs failure envelope asymmetry surfaced as a real consumer-risk**
   - **What happened:** success responses wrap the standardized result under `conversionResult`, while failure responses return the standardized result fields at the root level (plus `detail`).
   - **Why it mattered:** frontend consumers must implement two envelope shapes to preserve semantics across both paths.
   - **Classification:** notable (track); acceptable for Step 8 as-is, but a cross-flow contract consistency consideration.

2. **Middleware validation can bypass the standardized contract**
   - **What happened:** Zod `validate(...)` middleware returns `{ error, issues }` for schema failures, which is not a `ConversionResult`.
   - **Why it mattered:** any flow that relies on route-level `createFailureResult(...)` for uniform error semantics still has a bypass channel for invalid payloads.
   - **Classification:** future-refinement candidate for playbook guidance (and/or boundary standardization); not a blocker for Step 8 migration scope.

3. **Internal error harmonization relies on message-text heuristics**
   - **What happened:** `/from-html` internal error classification chooses `CONVERSION_FAILED` vs `INTERNAL_ERROR` by matching substrings in `error.message`.
   - **Why it mattered:** this is more brittle than structured error propagation and can shift classification if underlying messages change.
   - **Classification:** notable; worth tracking as a recurring pattern that may require a more robust approach later (but acceptable within minimal-change constraints).

4. **Step 8 UI needed a path-specific “contract-first” remediation (stale-state + legacy output)**
   - **What happened:** initially, Step 8 (`html -> *`) was routed correctly but was not included in `isMigratedContractPath`, so:
     - output rendering could be driven by legacy `data.markdown || data.asciidoc || data.result`,
     - stale output could remain visible after a failed attempt because output clearing was conditional.
   - **Why it mattered:** even with backend standardized semantics, UI could silently flatten/ignore them.
   - **Classification:** acceptable flow-specific surprise, but also a **future-refinement candidate** for the playbook: multi-target flows should be explicitly included in contract-first gating once standardized semantics exist.

5. **Multi-target dynamic output key increases coupling risk**
   - **What happened:** success output for Step 8 is carried under a dynamic key (`data[targetFormat]` / `{ [to]: result }`).
   - **Why it mattered:** small normalization drifts between backend `to` naming and frontend `targetFormat` expectations can break display even if `ConversionResult` is valid.
   - **Classification:** acceptable/path-specific; worth tracking because it raises the “output key normalization” importance for multi-target flows.

6. **Verification had to include an internal-error probe to be confident**
   - **What happened:** beyond nominal success/failure/baseline scripts, an additional internal-error contract check (unsupported output format) was needed to validate harmonization (`error.code` usability) under runtime failure.
   - **Why it mattered:** multi-format Pandoc-driven paths have meaningful internal failure modes that are not covered by empty-input pre-checks alone.
   - **Classification:** acceptable and aligned with conditional playbook items; reinforces that Step 6’s “engine-specific internal probes (conditional)” is important for Pandoc-driven multi-target paths.

#### Would any of these block similar future migrations if undocumented?

- **Yes, if left undocumented:**
  - envelope asymmetry (success vs failure wrapper shape),
  - stale-state risk on non-explicitly-migrated UI paths,
  - dynamic output-key normalization coupling for multi-target flows.

These are not blockers for Step 8 now, but they are actionable “watch items” for future multi-target flow migrations.

### Step 8.5.4 — Wave Validation and Closure Readiness (Step 8)

- **Flow name:** Step 8 — `HTML -> *` (`POST /api/from-html`)

#### Wave validation inputs used

- **Isolated flow verification:** Step 8.2.6 (`verify-e2e-from-html-*.js`, including internal-error contract probe)
- **Backend/orchestrator verification:** Step 8.3.1–8.3.2 (target identification + propagation/risk map) + `/from-html` contract checks at the HTTP boundary
- **Frontend/UI verification:** Step 8.4.1–8.4.5 (target identification + UI flow map + remediation + targeted UI verification via `vitest`)
- **Cross-flow comparison:** Step 8.5.1
- **Playbook conformance:** Step 8.5.2 (mapped against Step 6.3.3 checklist 1–17)
- **Execution observations:** Step 8.5.3

#### What is validated (clean, non-regressing behavior)

- **Flow is migrated and standardized:** `/api/from-html` produces standardized `ConversionResult` on success and on failures (pre-check and runtime/internal).
- **Backend/orchestrator preservation works:** structured failures preserve `error` as an object with usable `error.code`; downstream structured failures are not overwritten without reason.
- **Frontend/UI preservation works:** Step 8 is contract-first at the primary UI ingestion layer (`convertText(...)`), so:
  - success is owned by `conversionResult.success === true` and the expected output key,
  - failures preserve structured `error` (including `error.code`),
  - stale output is cleared at attempt start to prevent leakage into the current attempt.
- **Relevant checks pass:** backend e2e contract scripts pass; frontend `vitest` + `typecheck` pass for Step 8 scenarios.
- **No unresolved major blocker remains:** no remaining issue prevents Step 8 from behaving as a standardized, user-facing migrated flow.

#### Acceptable but non-blocking differences (documented)

- **Backend envelope asymmetry:** success wraps under `conversionResult`, failure returns root-level `ConversionResult` (+ `detail`). This is documented and handled by the frontend.
- **Middleware validation bypass:** invalid-schema requests can return `{ error, issues }` rather than a standardized `ConversionResult`. Documented as a cross-flow watch item.
- **Dynamic output key coupling (multi-target):** Step 8 success output is under `data[targetFormat]`. Documented as a multi-target coupling risk to track.
- **Message-text internal error classification:** classification heuristics remain message-based; acceptable under minimal-change constraints, but documented.

#### Closure readiness decision

- **Decision:** Step 8 wave is **clean enough to move to synthesis/closure**.
- **Rationale:** required contract semantics are preserved end-to-end (backend + UI), verification coverage exists and passes, and remaining differences are acceptable, explicitly documented, and non-blocking.

### Step 8.6.1 — Step 8 Execution Summary (What Actually Ran)

#### Executed flow

- **Flow executed:** Step 8 — `HTML -> *` via `POST /api/from-html` (Pandoc-backed, multi-target output).

#### Converter-level migration results

- **Standardized result construction:** Step 8 uses centralized helpers (`createSuccessResult(...)` / `createFailureResult(...)`) at the route boundary to produce a standardized `ConversionResult` for both success and failure outcomes.
- **Internal error harmonization:** runtime/internal conversion failures are classified and converted into structured failure results with usable `error.code` (validated by an internal-error contract probe).

#### Backend/orchestrator alignment results

- **Confirmed backend alignment target:** `api/backend/routes/conversion.routes.js` → `router.post('/from-html', ...)`.
- **Preservation behavior:** the route preserves structured failures when present and otherwise builds structured failures locally; required root fields are present and stable at the HTTP boundary.
- **Scope discipline:** no orchestrator redesign was introduced; Step 8 remains a route-owned dispatch to Pandoc conversion.

#### Frontend/UI alignment results

- **Confirmed frontend/UI target:** `api/frontend/src/converters/generic-converter.ts` → `convertText(...)`.
- **Contract-first Step 8 ingestion:** Step 8 (`html -> *`) is now treated as a contract-first path:
  - success is owned by `conversionResult.success === true` and the expected dynamic output key (`data[targetFormat]`),
  - failures preserve structured `error` and keep `error.code` available,
  - stale output is cleared at attempt start to prevent leakage into the current attempt.

#### What was verified

- **Backend (isolated flow verification):**
  - success contract verification (`verify-e2e-from-html-success-contract.js`)
  - failure contract verification (`verify-e2e-from-html-failure-contract.js`)
  - representative baseline scenarios (`verify-e2e-from-html-representative-scenarios.js`)
  - internal-error contract probe (`verify-e2e-from-html-internal-error-contract.js`)
- **Frontend/UI verification:**
  - targeted `vitest` checks for Step 8 contract-first behavior (success, structured failures, stale-state prevention)
  - `tsc --noEmit` typecheck pass

#### What Step 8 confirmed / validated

- The Step 6 operational playbook/checklist is practically applicable to a multi-target, Pandoc-backed, user-facing flow.
- Standardized `ConversionResult` semantics can be preserved end-to-end (backend boundary → frontend ingestion → UI state) with minimal, localized remediation when needed.
- The minimum verification kit is reusable for Step 8, with conditional engine-specific internal probes being valuable for Pandoc-driven runtime failure modes.

#### What remains outside Step 8 scope

- Broad backend architecture/orchestrator redesign or a generic “one-envelope-to-rule-them-all” response model across all endpoints.
- Any frontend redesign beyond minimal Step 8 contract-first remediation.
- Migration of additional flows beyond the Step 8 executed path.
- Subsequent wave execution beyond Step 8 synthesis/closure work (handled by later steps).

### Step 8.6.2 — Multi-Flow Baseline Update (Validated Reference Set Includes Step 8)

#### Validated reference set (expanded)

The validated reference set now explicitly includes **four** executed, user-facing flows with standardized `ConversionResult` semantics preserved end-to-end:

- **First migrated flow:** AsciiDoc → Markdown (`POST /api/to-markdown`, downdoc via lazy-loader)
- **Second migrated flow:** Markdown → AsciiDoc (`POST /api/to-asciidoc`, Pandoc)
- **Step 7 executed flow:** Text → Markdown (`POST /api/text-to-markdown`, text2markdown)
- **Step 8 executed flow:** HTML → * (`POST /api/from-html`, Pandoc, multi-target)

#### What remains common across the validated flows

- **Standardized result contract availability:** success and failure paths yield a standardized `ConversionResult` with structured `error` on failures (and usable `error.code`), plus required root fields (warnings/logs/meta presence).
- **Boundary-first preservation:** the effective backend HTTP boundary and the primary frontend ingestion layer preserve standardized semantics rather than rebuilding ad-hoc legacy models as the source of truth.
- **Repeatable verification posture:** each flow has a minimum verification kit style (contract success/failure + representative/baseline scenarios; internal-error probes when grounded).

#### What remains path-specific but acceptable

- **Converter topology differences:** lazy-loaded module orchestration (`to-markdown`) vs direct Pandoc execution (`to-asciidoc`, `from-html`) vs specialized converter function (`text-to-markdown`).
- **Payload output shape differences:** fixed output keys for single-target flows vs a dynamic output key for Step 8 multi-target outputs (`{ [to]: result }`).
- **Error-surface nuances:** modal/toast decisions and code-specific messaging can remain path-dependent while preserving structured semantics.

#### What this changes for future migration confidence

- **Higher confidence that the migration model scales** beyond single-target text conversions into:
  - multi-target flows,
  - Pandoc-backed runtime error modes,
  - UI contract-first ingestion requirements (stale-state prevention).
- **Clearer baseline for future comparisons:** future flows can be evaluated against this four-flow set to spot contract drift, envelope inconsistencies, and UI state risks earlier with less ambiguity.

### Step 8 Definition of Done

Step 8 is complete only if all criteria below are true:

- The Step 8 flow was confirmed (Step 8 selected executable flow: `HTML -> *` via `POST /api/from-html`).
- The Step 8 scope was frozen (bounded to Step 8 flow only).
- The runtime flow was mapped (success/failure/internal behavior traceable).
- Helper payload mapping was documented (mapped into `createSuccessResult()` / `createFailureResult()` inputs).
- Success-path integration was completed (standardized success `ConversionResult` is produced).
- Failure-path integration was completed (standardized failure `ConversionResult` is produced with structured `error`).
- Internal-error harmonization was completed (internal/runtime errors yield structured failure semantics; downstream structured failures are preserved where applicable).
- Isolated verification passed (minimum verification kit for Step 8, including representative scenarios; internal-error probe when applicable).
- Backend/orchestrator alignment was completed (true backend target identified and treated as the preservation point).
- Backend/orchestrator verification passed (HTTP boundary contract verified for success and failure, including internal error behavior when grounded).
- Frontend/UI alignment was completed (true UI ingestion/coordination target identified and remediated minimally to be contract-first).
- Frontend/UI verification passed (success/failure consumption, structured `error.code` preservation, coherent `idle/loading/success/error`, and stale-state safeguards verified).
- Cross-flow comparison was completed (Step 8 compared against previously migrated flows, with common points and acceptable divergences recorded).
- Playbook conformance was checked (Step 8 mapped against Step 6.3.3 checklist; any lightweight deviations are recorded and non-blocking).
- Execution observations were documented (surprises/frictions/deviations classified and captured).
- The wave was validated as clean enough for closure (explicit closure readiness decision recorded).
- The multi-flow baseline was updated (validated reference set explicitly includes Step 8).

#### What Step 8 does not require

- Broad backend/orchestrator redesign, refactors, or “one universal envelope” redesign across all endpoints.
- Frontend/UI redesign beyond minimal contract-first remediation for the Step 8 flow.
- Migration of additional flows outside Step 8’s executed flow.
- Reopening previously closed step decisions without a new grounded blocker.

### Step 8 Closure

Step 8 officially closes after executing **one additional real, user-facing flow** in the selected wave and validating that it follows the standardized migration/alignment model end-to-end.

#### What Step 8 executed

- Executed the Step 8 flow: **`HTML -> *`** via **`POST /api/from-html`** (Pandoc-backed, multi-target).

#### What Step 8 achieved

- **Converter-level migration completed** for the Step 8 flow: standardized `ConversionResult` semantics integrated for success and failure, with internal/runtime error harmonization into structured failures.
- **Backend/orchestrator alignment completed** for the Step 8 flow: the true backend preservation target (`api/backend/routes/conversion.routes.js` `/from-html`) was identified, mapped, and verified at the HTTP boundary.
- **Frontend/UI alignment completed** for the Step 8 flow: the true UI ingestion/coordination target (`api/frontend/src/converters/generic-converter.ts` `convertText(...)`) was remediated minimally to be contract-first, preserve structured failures (`error.code`), and prevent stale-state leakage.
- **Verification and consolidation completed:** isolated backend e2e contract checks + representative scenarios + internal-error probe passed; targeted frontend `vitest` + `typecheck` passed.
- **Wave validation completed:** Step 8 was accepted as clean enough for closure, with remaining acceptable differences explicitly documented.

#### Concrete result added to the validated flow set

- The validated reference set expands to include **Step 8 `POST /api/from-html`** alongside the previously validated flows (AsciiDoc→Markdown, Markdown→AsciiDoc, Text→Markdown).

#### What this confirms about the migration/alignment method

- The Step 6 playbook/checklist is reusable on a **multi-target, Pandoc-backed, user-facing** flow.
- Standardized `ConversionResult` semantics can be preserved end-to-end with **minimal, localized** remediation when a path-specific friction is discovered (notably: UI contract-first ingestion + stale-state safeguards).

#### What remains outside Step 8 scope

- Migrating all remaining flows (including any deferred candidates).
- Exhausting the entire broader migration wave beyond the single executed Step 8 flow.
- Broad backend/orchestrator redesign or broad frontend/UI redesign work.
- Starting future steps beyond Step 8 (no Step 9 work is implied by Step 8 closure).

#### Transition note

Later work should build on the expanded validated multi-flow baseline and reuse Step 8’s documented risk observations, rather than reopening already-validated migration/alignment decisions unless a new grounded blocker appears.

### Step 9.1.1 — Post-Step-7-and-8 Candidate Reassessment (Remaining Unmigrated Flows)

#### Context and inputs

This reassessment reuses the Step 6 candidate inventory/classification (Steps 6.1.1–6.2.3) and incorporates the execution evidence from:

- **Step 7 executed flow:** Text → Markdown (`POST /api/text-to-markdown`)
- **Step 8 executed flow:** HTML → * (`POST /api/from-html`)

The validated reference set now contains four executed flows (see Step 8.6.2), which materially increases confidence in the repeatability of the method while also revealing multi-target and UI-consumption frictions to account for.

#### Remaining unmigrated candidate flows (from Step 6 inventory)

After Steps 7 and 8 execution, the remaining grounded candidates from the Step 6 inventory are:

- **Generic multi-format family:** `POST /api/convert` (secured conversions for non-specialized format pairs)
- **Frontend legacy wrapper modules:**  
  - `api/frontend/src/converters/asciidoc-to-markdown.ts`  
  - `api/frontend/src/converters/markdown-to-asciidoc.ts`

(`Text -> Markdown` and `HTML -> *` were the Step 7/8 executed candidates and are no longer “remaining”.)

#### Updated readiness / priority observations (stronger / weaker / unchanged)

##### Generic multi-format family (`POST /api/convert`)

- **Signal:** slightly stronger (confidence), still high-complexity (risk)  
- **What got stronger after Steps 7 and 8:**
  - Step 8 proved the playbook scales to a **Pandoc-backed, multi-target** flow with contract-first UI ingestion and stale-state safeguards.
  - Step 7/8 verification patterns (contract scripts + internal-error probes + UI tests) provide a clearer template for a broad family like `/api/convert`.
- **What remains weaker / high-risk:**
  - `/api/convert` is a **high-surface family** (many pairs, token/confirmation flow, potentially multiple internal coordination layers), so the migration/alignment cost per wave remains higher than the already executed dedicated routes.
  - Step 8 highlighted envelope-shape and validation-bypass risks that become more costly at `/api/convert` scale unless explicitly controlled.
- **Priority update:** unchanged in principle (still “defer for later” as a single-wave candidate), but planning confidence is higher thanks to Step 8’s execution evidence.

##### Frontend legacy wrapper modules (`asciidoc-to-markdown.ts`, `markdown-to-asciidoc.ts`)

- **Signal:** unchanged (still secondary cleanup/alignment)  
- **What Steps 7 and 8 changed:**
  - With Step 8 now contract-first in `convertText(...)`, the primary user-facing ingestion layer is reinforced as the baseline.
  - Wrapper overlap becomes clearer as a future consolidation topic, but not a next-wave migration driver.
- **Priority update:** unchanged (still a bounded frontend-only cleanup candidate, secondary to route-level conversion families).

#### What changed overall after Step 7 and Step 8

- The migration/alignment method is now validated on a broader, more representative set (including multi-target + Pandoc + UI contract-first ingestion), which increases confidence for future waves.
- The main additional caution for future candidates is explicit: multi-target flows and broad families require careful envelope-shape handling and aggressive stale-state safeguards at the UI ingestion boundary.

### Step 9.1.2 — Updated Candidate Classification (Readiness / Risk / Migration Value)

This sub-step updates the Step 6 classification (Step 6.1.2) for the **remaining unmigrated candidates** using execution evidence from Steps 7 and 8.

#### Remaining candidates (unchanged list)

- Generic multi-format family: `POST /api/convert`
- Frontend legacy wrapper modules:
  - `api/frontend/src/converters/asciidoc-to-markdown.ts`
  - `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Updated classification table

| Candidate conversion path | Updated readiness | Updated migration risk | Updated migration value | Movement vs Step 6 | Short grounded justification |
|---|---:|---:|---:|---|---|
| Generic multi-format family (`POST /api/convert`) | Medium | High | High (strategic), Medium (near-term) | Stable (confidence ↑) | Steps 7–8 validate the method and verification patterns (including internal probes and contract-first UI ingestion), which increases planning confidence. However, `/api/convert` remains a high-surface, multi-format, token-guarded family with higher coupling and variance than dedicated routes, so practical risk remains high. |
| Frontend legacy wrapper modules (`asciidoc-to-markdown.ts`, `markdown-to-asciidoc.ts`) | Medium | Low–Medium | Medium | Stable | Steps 7–8 reinforced `convertText(...)` as the primary user-facing ingestion boundary and proved contract-first ingestion can be localized there. Wrapper overlap remains a bounded cleanup/alignment candidate, but it is still secondary to route-family migrations and does not materially change readiness/risk/value. |

#### Notes on movement (up / down / stable)

- **Moved up:** none (no remaining candidate’s readiness/risk profile materially improved enough to change category).
- **Moved down:** none.
- **Stable:** both remaining candidates; the main change is increased confidence and clearer risk documentation, not a reclassification.

### Step 9.1.3 — Next Realistic Migration Target / Small Wave Selection

This sub-step selects the next realistic migration target (or a very small wave) using the reassessed remaining candidate list (Step 9.1.1) and the updated readiness/risk/value classification (Step 9.1.2).

#### Remaining candidates considered

- Generic multi-format family: `POST /api/convert` (Medium readiness, High risk, High strategic value)
- Frontend legacy wrapper modules:
  - `api/frontend/src/converters/asciidoc-to-markdown.ts`
  - `api/frontend/src/converters/markdown-to-asciidoc.ts`
  (Medium readiness, Low–Medium risk, Medium value)

#### Selection

- **Selected next target (very small wave):** Frontend legacy wrapper module alignment/consolidation
  - `api/frontend/src/converters/asciidoc-to-markdown.ts`
  - `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Why this is the best next choice after Steps 7 and 8

- **Lowest-risk remaining work with clear bounded scope:** after Step 8, the primary ingestion layer (`convertText(...)`) is contract-first for all validated flows; wrapper overlap is now the most contained remaining candidate to reduce ambiguity and drift risk without expanding backend surface.
- **High leverage for future migrations:** clarifying/standardizing wrapper usage (retain vs deprecate vs redirect to `convertText` conventions) reduces “multiple entrypoints” noise, which will matter more if/when the project opens the broad `/api/convert` family.
- **Avoids premature high-surface expansion:** `/api/convert` remains the largest and highest-risk family; selecting wrapper consolidation keeps the next step realistic and comparable to the validated model without reopening cross-format complexity.

#### What remains deferred for later

- **Deferred:** Generic multi-format family `POST /api/convert`
  - Rationale: still high surface area and higher coupling/variance than dedicated routes; better approached after wrapper overlap is clarified and with a specifically bounded `/api/convert` sub-slice strategy rather than a broad “all pairs at once” wave.

### Step 9.2.1 — Execution Strategy for the Next Selected Target / Small Wave

#### Selected target / wave (from Step 9.1.3)

- **Very small frontend wave:** legacy wrapper module alignment/consolidation
  - `api/frontend/src/converters/asciidoc-to-markdown.ts`
  - `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Practical execution strategy

- **Strictly one flow/module at a time:** yes.
  - Even though this is a “small wave”, each wrapper is treated as its own bounded unit to keep verification and rollback simple.

#### Recommended execution order

1. **Entry module:** `api/frontend/src/converters/asciidoc-to-markdown.ts`
2. **Second module:** `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Entry flow rationale (why start here)

- The AsciiDoc → Markdown wrapper is the historical first migrated direction and is the most common “reference direction” in the project’s narrative and earlier validation artifacts.
- Starting here minimizes ambiguity when deciding wrapper intent (retain vs redirect vs deprecate) because the surrounding contract expectations and UI semantics are most established.

#### What stays deferred until earlier results are validated

- **Deferred:** `POST /api/convert` family (generic multi-format conversions)
  - Keep deferred until wrapper overlap decisions are validated, so future `/api/convert` work does not accumulate additional entrypoint ambiguity.

#### Why this strategy is the safest and most practical

- **Bounded surface:** changes are limited to frontend wrapper modules and do not expand backend surface area.
- **Low coupling:** wrapper consolidation can be validated with focused unit tests without requiring broad end-to-end UI rework.
- **Clear stop/gate:** after the entry wrapper is aligned and verified, proceed to the second wrapper only if behavior remains non-regressing and semantics remain contract-first at the primary ingestion boundary.

### Step 9.2.2 — Scope Freeze + Entry Conditions (Next Migration Cycle)

#### Selected target / wave

- **Very small frontend wave:** legacy wrapper module alignment/consolidation
  - `api/frontend/src/converters/asciidoc-to-markdown.ts` (entry module)
  - `api/frontend/src/converters/markdown-to-asciidoc.ts` (second module)

#### In scope (must remain bounded)

- Align/consolidate the two legacy frontend wrapper modules so they do not undermine contract-first semantics established at the primary ingestion boundary (`convertText(...)`).
- Add/adjust only the minimal unit tests needed to verify wrapper behavior remains coherent and non-regressing.
- Documentation updates required to record outcomes, risks, and verification evidence for this wrapper-focused wave.

#### Out of scope (explicitly not part of this cycle)

- Any backend changes (routes, converters, orchestrators, payload shaping).
- Any migration of additional conversion flows beyond the two wrapper modules.
- Any broad frontend/UI redesign (components, layout, major state model changes).
- Any attempt to redesign the Step 8 backend envelope or globalize a single response wrapper across all endpoints.

#### Deferred (must not be pulled in)

- **Deferred:** Generic multi-format family `POST /api/convert` (and any expansion to “all pairs” conversion work).
- Any additional wrapper cleanup beyond the two explicitly listed wrapper modules.

#### Go / No-Go conditions (must hold before execution starts)

- **Go conditions**
  - The current validated baseline remains green (frontend tests + typecheck pass).
  - The Step 8 contract-first ingestion path in `convertText(...)` remains intact and verified.
  - The wrapper modules are still present and clearly isolated as separate entrypoints in the codebase (so they can be aligned without touching unrelated UI).

- **No-Go conditions**
  - The work would require backend changes to proceed (scope violation).
  - The wrapper alignment cannot be done without broad UI/state redesign (scope violation).
  - Existing baseline tests are failing before any wrapper changes (non-regression baseline not established).

#### Non-expansion rule during execution

- Scope must not expand beyond the two wrapper modules and their direct tests/docs unless a **grounded, blocking** issue is discovered that prevents any safe alignment under this bounded scope. In that case, the correct response is to document the blocker and stop rather than widen the wave.

#### Why this scope freeze keeps the next cycle controlled and low-risk

- It limits changes to a small, frontend-only surface while preserving the validated end-to-end contract semantics already achieved through Step 8.
- It provides clear go/no-go gates and prevents reintroducing multi-flow coupling or backend surface expansion that would reduce comparability and increase regression risk.

### Step 9.2.3 — Ready-to-Execute Handoff Package (Next Migration Cycle)

This section is the **starting point for the next execution cycle**. It consolidates the selected target, execution strategy, scope freeze, and minimum readiness/verification expectations without reopening earlier planning decisions.

#### Selected target / small wave

- **Frontend wrapper alignment/consolidation (very small wave):**
  - `api/frontend/src/converters/asciidoc-to-markdown.ts` (entry)
  - `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Entry flow

- **Entry module:** `api/frontend/src/converters/asciidoc-to-markdown.ts`

#### Execution order (strict)

1. Execute and validate wrapper alignment for `asciidoc-to-markdown.ts`.
2. Only after validation stays green, execute and validate wrapper alignment for `markdown-to-asciidoc.ts`.

#### In-scope items

- Align the wrapper modules so they do not introduce a competing/legacy success-failure model that undermines contract-first semantics at the primary ingestion boundary (`api/frontend/src/converters/generic-converter.ts` → `convertText(...)`).
- Minimal tests for wrapper behavior and non-regression.
- Minimal documentation updates capturing outcomes, risks, and verification evidence for this wrapper wave.

#### Deferred items (must stay deferred)

- Generic multi-format family `POST /api/convert` (and any “expand to all pairs” work).
- Any additional flow migration beyond the two wrapper modules.
- Any backend changes.
- Any broad UI redesign.

#### Required readiness conditions (go/no-go)

- **Go**
  - Frontend baseline remains green: `npm test` and `npm run typecheck` pass.
  - Step 8 contract-first ingestion remains intact and verified in `convertText(...)` (no regression in the four-flow validated reference set).
  - Wrapper modules are clearly identifiable and can be updated without touching unrelated UI components.

- **No-Go**
  - Any need for backend changes to proceed.
  - Any requirement to redesign UI/state broadly to align wrapper behavior.
  - Baseline tests failing before starting.

#### Required verification expectations (minimum)

- **Unit verification**
  - Add/maintain wrapper-focused tests that confirm wrapper behavior does not:
    - flatten structured failures into strings,
    - allow stale output/state leakage across attempts,
    - bypass contract-first semantics for validated flows.
- **Non-regression verification**
  - Re-run `npm test` and `npm run typecheck` after each wrapper module is aligned.
  - Do not proceed to the second wrapper if the entry wrapper introduces regressions.

#### Handoff note

Future execution should begin from this package, treating Step 9.1.x selection and Step 9.2.1–9.2.2 scope decisions as fixed inputs unless a new grounded blocker is discovered.

### Step 9.3.1 — Step 9 Preparation Summary (Next Migration Cycle)

Step 9 prepares the next migration cycle by reassessing remaining candidates after Steps 7 and 8 execution, updating classifications, selecting the next realistic target, and freezing a ready-to-execute strategy/scope package.

#### What Step 9 reassessed

- Reassessed the remaining unmigrated candidates from the Step 6 inventory after Step 7 and Step 8 execution evidence (Step 9.1.1).

#### What Step 9 reclassified

- Updated readiness/risk/value classification for the remaining candidates using Step 7–8 learnings (Step 9.1.2), noting stability and confidence changes.

#### What Step 9 selected next

- Selected the next realistic small wave: **frontend legacy wrapper alignment/consolidation** (`asciidoc-to-markdown.ts` entry, then `markdown-to-asciidoc.ts`) (Step 9.1.3).
- Explicitly deferred the high-surface `POST /api/convert` family for later, bounded work.

#### What execution strategy Step 9 defined

- Defined strict, one-module-at-a-time execution order and entry module (Step 9.2.1).

#### What scope and readiness conditions Step 9 froze

- Frozen scope (in-scope/out-of-scope/deferred) and go/no-go entry conditions to keep the next cycle bounded and low-risk (Step 9.2.2).

#### What handoff package Step 9 produced

- A consolidated, ready-to-execute handoff package including:
  - selected wave + entry module
  - strict execution order
  - bounded scope + deferred items
  - readiness gates
  - minimum verification expectations  
  (Step 9.2.3)

#### What still requires actual execution later

- Implementing the wrapper alignment changes themselves and validating them in practice.
- Any migration work on the deferred `/api/convert` family (future bounded sub-slice), and any additional flow migrations beyond the two wrapper modules.

### Step 9 Closure

Step 9 officially closes after preparing the next migration cycle with a controlled, documented planning baseline, without executing any new migration work.

#### What Step 9 reassessed

- Reassessed the remaining unmigrated candidates from the Step 6 inventory using execution evidence from Steps 7 and 8 (Steps 9.1.1–9.1.2).

#### What Step 9 reclassified

- Updated readiness/risk/value classification for remaining candidates, reflecting increased method confidence while keeping high-surface risks explicit (Step 9.1.2).

#### What Step 9 selected next

- Selected the next realistic small wave: **frontend legacy wrapper alignment/consolidation**:
  - `api/frontend/src/converters/asciidoc-to-markdown.ts` (entry)
  - `api/frontend/src/converters/markdown-to-asciidoc.ts`
  (Step 9.1.3)

#### What execution strategy Step 9 defined

- Strict one-module-at-a-time execution order, with `asciidoc-to-markdown.ts` as the entry module and a stop/gate before proceeding to the second wrapper (Step 9.2.1).

#### What scope boundaries and go / no-go conditions Step 9 froze

- Frozen scope to two frontend wrapper modules + minimal tests/docs only; backend changes, broad UI redesign, and `/api/convert` expansion remain out of scope. Go/no-go conditions are explicitly defined to keep non-regression and bounded execution (Step 9.2.2).

#### What ready-to-execute handoff package Step 9 produced

- A consolidated handoff package containing:
  - selected wave + entry module
  - strict execution order
  - in-scope/out-of-scope/deferred items
  - go/no-go readiness conditions
  - minimum verification expectations  
  (Step 9.2.3)

#### What Step 9 now provides to the project

- A stable, ready-to-execute starting point for the next migration cycle that does not reopen validated Step 7/8 contract/alignment decisions unless a new grounded blocker appears.
- Clear deferral boundaries so high-surface candidates (notably `/api/convert`) remain deferred until a later, bounded cycle.

#### What Step 9 does not mean

- The next flow is already migrated.
- The next wave is already executed.
- All remaining candidates are now ready.
- Broad redesign work has been completed.
- A Step 10 execution cycle has already started.

### Step 10.1.1 — Step 10 Entry Flow Confirmation (From Step 9 Handoff)

#### Selected execution entry flow

- **Entry module / flow to execute first:** `api/frontend/src/converters/asciidoc-to-markdown.ts` (legacy wrapper alignment/consolidation wave entry point as defined in Step 9.2.3).

#### Readiness confirmation (go/no-go)

- **Confirmed go conditions still hold:**
  - Frontend baseline is green (`npm test` and `npm run typecheck` pass).
  - The Step 8 contract-first ingestion path in `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`) remains intact and verified by existing tests.
  - The entry wrapper module exists and is isolated enough to be aligned without requiring unrelated UI changes.

#### Why this remains the correct next execution target

- It is the lowest-risk, most bounded next step that reduces multi-entrypoint ambiguity without expanding backend surface area.
- It aligns directly with the frozen scope and strict execution strategy prepared in Step 9 (one module at a time, validate before proceeding).

#### Blocker note (only if grounded)

- No grounded blocker identified at Step 10 entry: readiness gates are satisfied and scope remains executable as planned.

### Step 10.2.1 — Current Runtime Flow Mapping (Before Helper Integration)

- **Flow name:** Step 10 execution entry — legacy frontend wrapper `AsciiDoc -> Markdown` via `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown(...)`)
- **Backend endpoint used:** `POST /api/to-markdown` (via `${API_BASE}/api/to-markdown`)

#### Entry point

- `api/frontend/src/converters/asciidoc-to-markdown.ts` exports `convertAsciiDocToMarkdown(text, setStatus, setOutput, setLoading, setNotification, [setShowErrorModal], [setErrorMessage])`.
- It is a UI-facing wrapper that **does not return a result object**; it drives UI state via the passed setter callbacks.

#### Main wrapper / converter

- Wrapper function: `convertAsciiDocToMarkdown(...)`
- Internal engine: browser `fetch(...)` to backend route `POST /api/to-markdown`
- Timeout: `AbortController` with 30s timeout.

#### Input parameters

- `text: string` (AsciiDoc source content)
- UI setters:
  - `setStatus: (string) => void`
  - `setOutput: (string) => void`
  - `setLoading: (boolean) => void`
  - `setNotification: (Notification | null) => void`
  - optional `setShowErrorModal`, `setErrorMessage`

#### Temporary file handling

- None in the frontend wrapper (no file I/O). Any temp-file behavior is backend-owned (`/api/to-markdown` route path).

#### Success path (current behavior)

1. Pre-check: if `!text.trim()` → sets status (“please enter text”) and returns early.
2. Sets `status` to “conversion in progress”, sets `loading=true`.
3. Issues `fetch(POST ${API_BASE}/api/to-markdown, body: { text })` with abort timeout.
4. If `res.ok`:
   - `data = await res.json()`
   - `setOutput(data.markdown ?? "")`
   - sets status “success” + success notification.
5. Always sets `loading=false` in `finally`.

#### Failure path (current behavior)

Failure handling is **mixed**: the function sometimes returns early (handled failure), and sometimes throws then catches (generic catch), while always driving UI via callbacks.

1. **HTTP non-OK (`!res.ok`):**
   - Attempts to parse JSON; prefers `errorJson.detail` when present; otherwise falls back to response text.
   - If the error message matches a known “output is still AsciiDoc / output equals input” family:
     - opens a conversion error modal (if callbacks provided),
     - sets status + error notification,
     - **returns** (no throw).
   - Otherwise throws `new Error("HTTP error ...")` which is handled by the outer `catch`.
2. **Timeout/network/other exceptions (`catch`):**
   - Timeout (`AbortError`) → status + error notification (timeout message).
   - Network failures (`NetworkError` / `Failed to fetch`) → status + error notification (cannot reach backend).
   - Otherwise → status + error notification with a generic “API call error” message.
3. Always sets `loading=false` in `finally`.

#### Current success shape (effective UI boundary)

- **Output:** `setOutput(data.markdown ?? "")` (string)
- **Status/notification:** success strings only
- **ConversionResult semantics:** not consumed/stored here; `conversionResult` in the backend response is currently ignored by this wrapper.

#### Current failure shape (effective UI boundary)

- **Error shape:** flattened into:
  - status strings,
  - notification messages,
  - optional modal message (for a matched subset of known error texts).
- **Structured failure semantics (`ConversionResult.error.code`, etc.):** not preserved/propagated by this wrapper; it is message-driven.

#### Integration-relevant observations (before any helper integration)

- The wrapper is **legacy state-driving**: it owns the UI attempt lifecycle via setters rather than returning a structured result.
- It is **detail/message-driven** and does not consume standardized `ConversionResult` success/failure semantics even when the backend provides them.
- It mixes **early returns** (handled failures) with **throw/catch** (generic failure), which complicates consistent downstream consumption.
- It has **no explicit stale-output clearing** at attempt start; output consistency depends on callers and the order of UI state updates.

### Step 10.2.2 — Helper Payload Mapping to Centralized Builders (Before Integration)

- **Flow name:** Step 10 execution entry — legacy frontend wrapper `AsciiDoc -> Markdown` (`api/frontend/src/converters/asciidoc-to-markdown.ts`)
- **Target helpers:** `createSuccessResult(payload)` / `createFailureResult(payload)` (standardized `ConversionResult` contract)
- **Mapping intent:** define how this flow should **consume and preserve** standardized backend semantics (preferred) and what can/cannot be derived locally at the wrapper layer.

#### Success payload mapping (`createSuccessResult(payload)`)

| Field | Runtime source in current Step 10 wrapper flow | Mapping status | Mapping strategy for integration |
|---|---|---|---|
| `conversionId` | Backend `data.conversionResult.conversionId` (if present) | Direct (preferred), otherwise missing | Require backend `conversionResult` and pass through `conversionId` unchanged. Do not generate a new one in the UI wrapper. |
| `converter` | Backend `data.conversionResult.converter` (if present) | Direct (preferred), otherwise missing | Pass through from backend (`downdoc`/`pandoc` etc.) to avoid UI guesses. |
| `pipeline` | Backend `data.conversionResult.pipeline` | Direct (preferred), otherwise missing | Pass through as-is. |
| `inputFormat` | Backend `data.conversionResult.inputFormat` | Direct (preferred), otherwise derivable | Prefer backend value; if absent, derive as `'asciidoc'` from wrapper semantics. |
| `outputFormat` | Backend `data.conversionResult.outputFormat` | Direct (preferred), otherwise derivable | Prefer backend value; if absent, derive as `'markdown'`. |
| `inputFile` | Backend `data.conversionResult.inputFile` | Direct (preferred), otherwise derivable (weak) | Prefer backend descriptor. UI can derive an in-memory descriptor from `text` length, but this is weaker than backend-owned metadata. |
| `outputFile` | Backend `data.conversionResult.outputFile` | Direct (preferred), otherwise derivable (weak) | Prefer backend descriptor. UI can derive in-memory output descriptor from `data.markdown` length, but backend is the canonical source. |
| `startedAt` | Backend `data.conversionResult.startedAt` or wrapper attempt start time | Direct (preferred), otherwise derivable | Prefer backend `startedAt`; if absent, capture wrapper attempt start timestamp. |
| `finishedAt` | Backend `data.conversionResult.finishedAt` or wrapper completion time | Direct (preferred), otherwise derivable | Prefer backend `finishedAt`; if absent, capture wrapper completion timestamp. |
| `durationMs` | Backend `data.conversionResult.durationMs` or wrapper elapsed time | Direct (preferred), otherwise derivable | Prefer backend duration; otherwise compute `Date.now() - startedAtMs` in wrapper. |
| `warnings` | Backend `data.conversionResult.warnings` | Direct (preferred), otherwise defaulted | Default to `[]` if absent, but prefer backend value. |
| `logs` | Backend `data.conversionResult.logs` | Direct (preferred), otherwise defaulted | Default to `[]` if absent, but prefer backend value. |
| `meta` | Backend `data.conversionResult.meta` | Direct (preferred), otherwise defaulted/derivable | Prefer backend value; otherwise default `{}` and optionally include minimal wrapper metadata (e.g. `{ uiWrapper: 'asciidoc-to-markdown' }`). |

#### Failure payload mapping (`createFailureResult(payload)`)

| Field | Runtime source in current Step 10 wrapper flow | Mapping status | Mapping strategy for integration |
|---|---|---|---|
| `conversionId` | Backend failure envelope (preferred), otherwise missing | Direct (preferred), otherwise missing | Prefer consuming a standardized failure from backend; do not mint a new conversionId for a backend failure in the wrapper. |
| `converter` | Backend failure envelope `converter` | Direct (preferred), otherwise missing | Pass through from backend. |
| `pipeline` | Backend failure envelope `pipeline` | Direct (preferred), otherwise missing | Pass through as-is. |
| `inputFormat` | Backend failure envelope `inputFormat` | Direct (preferred), otherwise derivable | Prefer backend; derive `'asciidoc'` only if necessary. |
| `outputFormat` | Backend failure envelope `outputFormat` | Direct (preferred), otherwise derivable | Prefer backend; derive `'markdown'` only if necessary. |
| `inputFile` | Backend failure envelope `inputFile` | Direct (preferred), otherwise derivable (weak) | Prefer backend descriptor; wrapper can only derive a minimal in-memory descriptor from `text`. |
| `startedAt` | Backend failure envelope `startedAt` or wrapper attempt start | Direct (preferred), otherwise derivable | Prefer backend; otherwise capture attempt start timestamp. |
| `finishedAt` | Backend failure envelope `finishedAt` or wrapper completion time | Direct (preferred), otherwise derivable | Prefer backend; otherwise capture completion timestamp. |
| `durationMs` | Backend failure envelope `durationMs` or wrapper elapsed | Direct (preferred), otherwise derivable | Prefer backend; otherwise compute elapsed time. |
| `error` | Backend failure envelope `error` (structured) | Direct (preferred), otherwise missing | Preserve structured backend error (`code`, `message`, `details`, `recoverable`). Do not replace with string-only errors when a structured error is available. |
| `outputFile` | Backend failure envelope `outputFile` (typically null) | Direct (preferred), otherwise defaulted | Prefer backend; default to `null` when missing. |
| `warnings` | Backend failure envelope `warnings` | Direct (preferred), otherwise defaulted | Default to `[]` if absent. |
| `logs` | Backend failure envelope `logs` | Direct (preferred), otherwise defaulted | Default to `[]` if absent. |
| `meta` | Backend failure envelope `meta` | Direct (preferred), otherwise defaulted/derivable | Prefer backend meta; otherwise default `{}` with minimal wrapper marker if needed. |

#### Field availability classification (wrapper-layer reality)

- **Direct (preferred, backend-owned):** all standardized `ConversionResult` fields when `data.conversionResult` is present on success, and when the backend returns a root-level standardized failure envelope on non-OK responses.
- **Derivable locally (acceptable fallback, weaker):** `inputFormat`, `outputFormat`, `startedAt`, `finishedAt`, `durationMs`, minimal `inputFile`/`outputFile` descriptors (in-memory) based on string sizes.
- **Defaultable:** `warnings: []`, `logs: []`, `meta: {}` only when not provided (but backend should be the canonical source when standardized semantics exist).
- **Missing in the current wrapper implementation (pre-integration):** structured `ConversionResult` consumption/preservation; current wrapper flattens failures into strings/modals and ignores `conversionResult` on success responses.

### Step 10.2.3 — Integrate `createSuccessResult()` into the Step 10 Success Path

- **Change applied (success-only):** `api/frontend/src/converters/asciidoc-to-markdown.ts` now consumes backend `data.conversionResult` on the `res.ok` path and builds a **fully-shaped standardized success** result via `createSuccessResult(payload)` (preserving backend-owned fields such as `conversionId`, `converter`, `pipeline`, formats, files, timing, `warnings`, `logs`, `meta`).
- **Scope note:** failure handling is intentionally unchanged here (reserved for a later step).

### Step 10.2.4 — Integrate `createFailureResult()` into the Step 10 Failure Path

- **Change applied (failure-only):** `api/frontend/src/converters/asciidoc-to-markdown.ts` now standardizes the wrapper’s failure exits by returning a **fully-shaped standardized failure** result via `createFailureResult(payload)`, preserving backend failure envelopes when present (root-level `ConversionResult` on non-OK responses) and falling back to minimal standardized `INTERNAL_ERROR`/`EMPTY_INPUT` shapes only for client-side failures (timeout/network/pre-check).

### Step 10.2.5 — Harmonize Internal Error Handling (No Contract Bypass)

- **Change applied:** removed remaining avoidable “throw-then-catch” internal escapes for the `/api/to-markdown` non-OK path and success-response validation failures. These exits now return a standardized failure `ConversionResult` directly, keeping the already-integrated success path intact.

### Step 10.3.1 — Identify the Real Backend/Orchestrator Alignment Target (Step 10)

- **Flow name:** Step 10 execution entry — `AsciiDoc -> Markdown` via `POST /api/to-markdown`
- **Goal of this step:** identify the true backend/orchestrator target where this flow’s success/failure is coordinated and where `ConversionResult` can still be preserved, reshaped, or broken.

#### Real backend coordination layers involved

- **HTTP entry / route target (coordination boundary):** `api/backend/routes/conversion.routes.js` → `router.post('/to-markdown', ...)`
  - Owns request validation (`validate.middleware.js` + Zod schema)
  - Owns route-level precheck (`EMPTY_INPUT`) and response shaping:
    - Success response envelope: `{ markdown, conversionResult: result }`
    - Failure response envelope: root-level `ConversionResult` + legacy `detail`
  - Owns route-level output validation (e.g. “output is input”, “output looks like AsciiDoc”) and converts those into standardized failures via `buildFailureFromSuccessfulResult(...)`.
- **Backend “orchestration/dispatch” layer (converter execution coordination):**
  - `api/backend/services/modules/lazyload.module.js` → `runConverter(moduleName, inputPath, outputPath, options)`
  - Responsible for lazy-loading the module, path validation, format checks, module-result validation, and conversion execution through the shared module interface.
- **Converter module (engine implementation):**
  - `api/backend/services/modules/adoc-to-md.converter.js` (registered as module name `'downdoc'`)
  - Produces the standardized `ConversionResult` on success/failure inside the module boundary (then preserved upward by `lazyload`).

#### Chosen backend/orchestrator alignment target

- **Primary target for Step 10 backend/orchestrator alignment:** `api/backend/routes/conversion.routes.js` (`POST /api/to-markdown`)

#### Why this is the correct focus

- **This is where the flow is invoked:** it is the concrete HTTP entrypoint used by the Step 10 wrapper.
- **This is where success/failure is coordinated at the response boundary:** it decides the final envelope shape (success wraps `conversionResult`; failures are root-level with `detail`), which is the most common place contract drift is introduced.
- **This is the last point to preserve/enrich without breaking semantics:** it may post-process output and can reshape a downstream standardized result (e.g. via `buildFailureFromSuccessfulResult`), so it is the best single place to verify/align contract preservation before touching deeper layers.

### Step 10.3.2 — Backend/Orchestrator Flow Map (Step 10 via 10.3.1 Target)

- **Flow name:** Step 10 execution entry — `AsciiDoc -> Markdown` via `POST /api/to-markdown`
- **Confirmed backend target:** `api/backend/routes/conversion.routes.js` (`router.post('/to-markdown', ...)`)

#### Success flow (backend)

1. **HTTP entry:** `POST /api/to-markdown` → `conversion.routes.js`.
2. **Request validation:** `validate.middleware.js` + Zod ensures `{ text: string, options?: any }`.
3. **Route precheck:** if `!text.trim()` → route builds standardized failure (`EMPTY_INPUT`) and returns **400** as `{ ...failure, detail: failure.error.message }`. (This is a failure path; see below.)
4. **Input normalization + temp files:**
   - Removes header-only `:experimental:` tag and normalizes AsciiDoc (`removeExperimentalTag`, `normalizeAsciiDocInput`).
   - Creates temp dir and writes `input.adoc` + prepares `output.md`.
5. **Converter dispatch / coordination:** route calls:
   - `runConverter('downdoc', inputFile, outputFile, { conversionId, mode })`
   - This enters `api/backend/services/modules/lazyload.module.js` which:
     - validates paths (coordination-layer `INVALID_INPUT` on failure),
     - lazy-loads the `downdoc` module (returns `CONVERTER_NOT_FOUND` or `INTERNAL_ERROR` on load failure),
     - executes `moduleInstance.run(...)`,
     - **preserves standardized `ConversionResult` success/failure** when the module result already conforms, while merging in lazyload logs and normalizing `warnings`/`meta`.
6. **First creation of standardized result:** inside the **converter module** `api/backend/services/modules/adoc-to-md.converter.js`:
   - On success, the module returns `createSuccessResult({...})` with full standardized fields (including `conversionId`, formats, file blocks, timing, `warnings`, `logs`, `meta`).
7. **Propagation upward:** `lazyload.module.js` returns the standardized `ConversionResult` unchanged (except merged `logs` + ensuring `warnings` array + `meta` object + adding legacy `duration` seconds).
8. **Route post-processing:** the route reads `output.md` into `markdown` and applies route-level output validation (see risk points below). If validation passes:
   - returns **200** `{ markdown, conversionResult: result }` where `result` is the standardized success `ConversionResult`.

#### Failure flow (backend)

Failures can be created at three distinct layers; all must still yield standardized `ConversionResult` at the HTTP boundary.

1. **Route precheck failure (`EMPTY_INPUT`):**
   - If `!text.trim()` → `buildToMarkdownFailure(...)` creates standardized failure.
   - Returned as **400** with body `{ ...failure, detail: failure.error.message }`.
2. **Lazyload coordination/internal failures (standardized failures created in lazyload):**
   - Path validation failure → standardized `INVALID_INPUT`.
   - Module loading failure → standardized `CONVERTER_NOT_FOUND` or `INTERNAL_ERROR`.
   - Unsupported format checks (when `fromFormat`/`toFormat` provided) → standardized `UNSUPPORTED_FORMAT`.
   - Unexpected errors in lazyload → standardized `INTERNAL_ERROR`.
   - These failures propagate back to the route via `result = await runConverter(...)`.
3. **Converter-module failures (standardized failures created in module):**
   - `adoc-to-md.converter.js` returns standardized failures using its internal `createDowndocFailure(...)` for grounded cases such as:
     - `CONVERSION_FAILED` (e.g., output identical to input, output contains AsciiDoc instead of Markdown),
     - `OUTPUT_NOT_CREATED` (output write problems),
     - `INTERNAL_ERROR` (unexpected exceptions).
   - Lazyload preserves this standardized failure.
4. **Route handling of `result.success === false`:**
   - Route logs `result.error.message` and returns **500** as `{ ...result, detail: errorMessage }` (root-level standardized `ConversionResult` plus `detail`).
5. **Route-level output-validation failures (standardized failures created in route, derived from a downstream success):**
   - If the route reads `markdown` and finds:
     - `markdown === processedText` → builds failure from success using `buildFailureFromSuccessfulResult(result, { code: 'CONVERSION_FAILED', details: { reason: 'OUTPUT_IS_INPUT' } })`.
     - “output appears to be AsciiDoc” heuristics → similar `CONVERSION_FAILED` with `{ reason: 'OUTPUT_INVALID_FORMAT' }`.
   - Returned as **500** root-level standardized failure plus `detail`.
6. **Route catch-all failures:**
   - If an exception occurs and `result` was a standardized success, route converts it into standardized `INTERNAL_ERROR` via `buildFailureFromSuccessfulResult(...)` (stage: `route-postprocessing`).
   - Otherwise route builds a base standardized `INTERNAL_ERROR` via `buildToMarkdownFailure(...)` (stage: `route-internal`).

#### Standardized result creation point + propagation

- **First standardized success creation:** `api/backend/services/modules/adoc-to-md.converter.js` (`createSuccessResult(...)`).
- **First standardized failure creation:** may occur in:
  - route precheck (`buildToMarkdownFailure` → `EMPTY_INPUT`),
  - lazyload coordination (`buildInternalFailure` → `INVALID_INPUT`/`UNSUPPORTED_FORMAT`/`CONVERTER_NOT_FOUND`/`INTERNAL_ERROR`),
  - converter module (`createDowndocFailure` → `CONVERSION_FAILED`/`OUTPUT_NOT_CREATED`/`INTERNAL_ERROR`).
- **Upward propagation:** `lazyload.module.js` is the key “preserve-or-break” layer; it explicitly detects standardized results and returns them with merged `logs` + normalized `warnings`/`meta`, then the route returns them to HTTP (success under `conversionResult`, failure at root with `detail`).

#### Grounded backend contract-risk points (Step 10)

- **Envelope asymmetry at HTTP boundary:** success returns `{ markdown, conversionResult }` but failures return root-level `ConversionResult` + `detail`. Any frontend ingestion must handle both shapes.
- **Route-derived failures from downstream success:** `buildFailureFromSuccessfulResult(...)` must preserve required root fields; this is a common place to accidentally drop/reshape fields (especially `outputFile`, `meta`, `warnings`, `logs`).
- **Route-level heuristics for “output is AsciiDoc / output equals input”:** correct and grounded, but message/heuristic-driven. If heuristics drift, they could misclassify and produce a failure code that conflicts with deeper-layer semantics.
- **Lazyload fallback to legacy shape:** if a module ever returns a non-standardized legacy object, `lazyload.module.js` falls back to a legacy return shape (`{ success, logs, error, duration }`) which would break the contract at the route boundary unless handled. For Step 10, the `downdoc` module is migrated and should stay standardized, but this is still a grounded risk for future module changes.

### Step 10.3.3 — Backend Contract-Risk Points + Target Behavior (Step 10)

- **Flow name:** Step 10 execution entry — `AsciiDoc -> Markdown` via `POST /api/to-markdown`
- **Confirmed backend target:** `api/backend/routes/conversion.routes.js` (`/to-markdown`)

#### Where standardized results may be reshaped / stripped / wrapped / bypassed

- **(Risk) HTTP response envelope asymmetry at the route boundary**
  - Success: `{ markdown, conversionResult: result }` (standardized result is *nested* under `conversionResult`)
  - Failure: `{ ...failureResult, detail }` (standardized result is *root-level* plus `detail`)
  - Risk: downstream consumers may “forget” one shape and flatten/ignore structured fields.
- **(Risk) Route-derived failure built from a downstream success**
  - `buildFailureFromSuccessfulResult(result, ...)` converts a standardized success into a standardized failure.
  - Risk: accidental field loss (e.g. `outputFile`, `meta`, `warnings`, `logs`) or semantic drift (changing codes/messages/details).
- **(Risk) Lazyload legacy fallback path**
  - `lazyload.module.js` preserves standardized results *only if* the module result “looks standardized”; otherwise it returns a legacy shape (`{ success, logs, error, duration }`).
  - Risk: any regression in `downdoc` module shape could cause a silent contract break at `/api/to-markdown`.
- **(Risk) Coordination-layer internal errors producing partially specified results**
  - Lazyload `buildInternalFailure(...)` and route catch blocks create standardized failures; risk is incomplete/incorrect blocks (arrays/meta) or mismatched `error.code` defaults.
- **(Risk) Post-processing/output validation in the route**
  - Route reads `output.md` and runs heuristics (`OUTPUT_IS_INPUT`, `OUTPUT_INVALID_FORMAT`) that can override a “successful” module result.
  - Risk: misclassification (heuristic false positive) and inconsistent error-code usage.

#### Safe points (already aligned / low risk)

- **(Safe) Converter module result construction**
  - `api/backend/services/modules/adoc-to-md.converter.js` uses centralized builders (`createSuccessResult` / `createDowndocFailure`) and returns a fully-shaped standardized `ConversionResult`.
- **(Safe) Lazyload standardized-result preservation branch**
  - When the module returns a standardized success/failure, lazyload explicitly preserves it and only:
    - merges in lazyload logs,
    - normalizes `warnings` to an array,
    - normalizes `meta` to an object,
    - adds a legacy `duration` field (seconds) without removing `durationMs`.

#### Target backend behavior (Step 10)

**Success preservation**
- Route must return **200** with:
  - `markdown: string` (non-empty)
  - `conversionResult: ConversionResult` where:
    - `success === true`
    - `error === null`
    - all required root fields exist (including `warnings: []`, `logs: []`, `meta: {}`)
- Neither the route nor lazyload may reconstruct “legacy success objects” in place of the standardized result.

**Failure preservation**
- Route must return a **root-level** standardized failure `ConversionResult` on non-OK, plus legacy `detail`:
  - `success === false`
  - `error` remains structured and `error.code` remains stable/usable
  - required root fields remain present (`warnings`, `logs`, `meta`, etc.)
- If a downstream layer already produced a standardized failure (module or lazyload), the route must **preserve it** and only add `detail` (and optionally add safe route metadata).

**Internal coordination errors**
- Lazyload coordination failures (path validation, module loading, format checks, unexpected exceptions) must always be converted into standardized failures (`INVALID_INPUT`, `CONVERTER_NOT_FOUND`, `UNSUPPORTED_FORMAT`, `INTERNAL_ERROR`) and must not surface as raw thrown errors at the HTTP boundary.
- Route catch blocks must convert unexpected exceptions into standardized `INTERNAL_ERROR` failures, preferring:
  - “derive failure from known success” (`buildFailureFromSuccessfulResult`) when a success result already exists, otherwise
  - “build fresh failure” (`buildToMarkdownFailure`) with correct timing + blocks.

**Acceptable enrichment**
- Adding/merging logs (lazyload loading/execution logs) is acceptable.
- Adding route-level `meta` keys (e.g. `{ route: '/api/to-markdown', transport: 'in-memory', stage: ... }`) is acceptable **only if** it does not remove/overwrite meaningful module-provided meta.
- Adding the legacy `detail` string for client compatibility is acceptable, but it must not replace structured `error` blocks.

**Unacceptable reshaping**
- Returning legacy shapes without required root fields (e.g. `{ success, error, logs, duration }` only) at `/api/to-markdown`.
- Flattening structured failures into a string-only `error` or dropping `error.code`.
- Dropping required collections (`pipeline`, `warnings`, `logs`) or `meta`.
- Overwriting a downstream standardized failure with a new ad-hoc failure without a grounded reason/code mapping.

### Step 10.3.5 — Backend/Orchestrator Remediation Verification and Consolidation (Step 10)

- **Verification completed:** Re-ran isolated HTTP e2e checks for `POST /api/to-markdown` plus existing `lazyload.runConverter('downdoc', ...)` backend-flow scripts to confirm preservation after Step 10.3.4 route-layer remediation.
- **Scripts used:**
  - `api/backend/scripts/verify-e2e-to-markdown-output-boundary.js` (success + failure HTTP boundary)
  - `api/backend/scripts/verify-e2e-to-markdown-failure-contract.js`
  - `api/backend/scripts/verify-e2e-to-markdown-representative-scenarios.js`
  - `api/backend/scripts/verify-backend-flow-adoc-to-md-internal-failure.js` (coordination-layer `INVALID_INPUT`)
  - `api/backend/scripts/verify-backend-flow-adoc-to-md-failure.js` and `verify-backend-flow-adoc-to-md.js` (downdoc standardized success/failure through lazyload)
- **Outcome:** All checks passed; no follow-up code changes were required for this consolidation step.

### Step 10.4.1 — Identify the Real Frontend/UI Alignment Target (Step 10)

- **Flow name:** Step 10 execution entry — frontend legacy wrapper `AsciiDoc -> Markdown` (`api/frontend/src/converters/asciidoc-to-markdown.ts`)
- **Goal of this step:** identify the true frontend/UI target where Step 10 success/failure semantics are first consumed and where contract preservation can still drift.

#### Frontend/UI layers involved (real Step 10 context)

- **Wrapper conversion layer (Step 10 entry module):**
  - `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown(...)`)
  - Calls `POST /api/to-markdown`, consumes backend success/failure payloads, builds local standardized results (`createSuccessResult`, `createFailureResult`), and drives UI setters (`setStatus`, `setOutput`, `setLoading`, `setNotification`, optional modal setters).
- **App state/render layer (global UI owner):**
  - `api/frontend/src/App.tsx` owns visible UI state/rendering (`status`, `output`, loading, notifications, modal visibility, etc.).
  - It imports wrapper symbols from `./converters`, but in current runtime wiring the active conversion path is `convertText(...)`.
- **Active general conversion path (reference boundary):**
  - `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`) is currently invoked by `App.tsx` for conversion actions and remains the active production path for `asciidoc -> markdown` at this stage.

#### Chosen frontend/UI alignment target

- **Primary Step 10 frontend/UI alignment target:** `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown(...)`)

#### Why this is the correct focus

- **It is the Step 10 selected execution flow from the Step 9 handoff package** and therefore the intended migration/alignment unit for this cycle.
- **It is the first consumption boundary for Step 10 backend contract semantics within this flow** (HTTP response parsing + success/failure result construction).
- **It is where success/failure can still be locally reshaped before reaching UI state setters**, making it the most relevant place to verify/preserve standardized semantics for this specific flow.
- **Current runtime note:** this wrapper is currently not called by `App.tsx` (which uses `convertText(...)`), so Step 10 frontend alignment remains intentionally scoped to wrapper-level correctness before any broader UI routing decisions.

### Step 10.4.2 — Frontend/UI Flow Map (Step 10 via 10.4.1 Target)

- **Flow name:** Step 10 execution entry — frontend legacy wrapper `AsciiDoc -> Markdown` (`api/frontend/src/converters/asciidoc-to-markdown.ts`)
- **Confirmed frontend/UI target:** `convertAsciiDocToMarkdown(...)` in `api/frontend/src/converters/asciidoc-to-markdown.ts`

#### Success flow (frontend/UI)

1. **Wrapper entry:** `convertAsciiDocToMarkdown(text, setStatus, setOutput, setLoading, setNotification, [setShowErrorModal], [setErrorMessage])`.
2. **Pre-attempt state:** sets `status` to "Conversion en cours..." and `loading=true`.
3. **HTTP call:** `fetch(${API_BASE}/api/to-markdown, { method: 'POST', body: { text } })`.
4. **Success HTTP branch (`res.ok`):**
   - Parses JSON body and sets `setOutput(data.markdown ?? "")`.
   - Reads `data.conversionResult` and validates it as success (`success === true`).
   - Builds a local standardized success with `createSuccessResult(payload)` from backend fields (`conversionId`, converter, pipeline, formats, files, timing, warnings, logs, meta).
5. **UI completion:** sets success status/notification, returns standardized success `ConversionResult`, and `finally` sets `loading=false`.

#### Failure flow (frontend/UI)

1. **Client precheck failure:** if `!text.trim()`, returns `createFailureResult(...)` (`EMPTY_INPUT`) immediately.
2. **HTTP non-OK branch (`!res.ok`):**
   - Parses backend error body/text.
   - Attempts to consume standardized backend failure (root-level or `conversionResult` envelope).
   - Builds/returns `createFailureResult(...)`:
     - prefers backend structured fields when present,
     - otherwise fills minimal standardized fallback (`INTERNAL_ERROR` or local `OUTPUT_INVALID` for grounded output-validation modal branch).
   - Sets error status/notification and optional modal before returning.
3. **Catch failures (timeout/network/generic):**
   - Timeout (`AbortError`) => returns standardized `INTERNAL_ERROR` failure (timeout details).
   - Network errors => returns standardized `INTERNAL_ERROR` failure (network details).
   - Generic catch => returns existing `e.conversionResult` when present, otherwise builds standardized `INTERNAL_ERROR` failure.
4. **All failure branches** end with `loading=false` in `finally`.

#### First frontend consumption point of standardized backend result

- **First consumption point:** inside `convertAsciiDocToMarkdown(...)` when parsing backend response:
  - **Success:** `data.conversionResult` is read and mapped into local `createSuccessResult(...)`.
  - **Failure:** non-OK response JSON is checked for standardized backend failure (root-level failure or `conversionResult`) before fallback construction.

#### Propagation through frontend state and UI

- **Within wrapper scope:**
  - Standardized result is produced and returned by the wrapper function (`Promise<ConversionResult>` semantics).
  - UI side effects are driven through callback setters:
    - `setStatus(...)`
    - `setOutput(...)`
    - `setLoading(...)`
    - `setNotification(...)`
    - optional `setShowErrorModal(...)` / `setErrorMessage(...)`
- **Global UI runtime note:**
  - `App.tsx` currently executes conversions through `convertText(...)` (generic converter), not this wrapper.
  - Therefore Step 10 wrapper result propagation is currently a wrapper-level contract path, not yet the active app-wide rendering path.

#### Grounded frontend contract-risk points (Step 10)

- **Dual output channels in wrapper:** contract result is returned, while UI is also updated via setters. If future callers ignore returned `ConversionResult`, semantics may still degrade to message-driven UI state.
- **Envelope asymmetry handling pressure:** success expects `data.conversionResult`, failure expects root-level standardized failure (or nested fallback). Any backend envelope drift can force fallback logic and weaken semantic fidelity.
- **Heuristic modal branch:** output-related failure detection still relies partly on message text matching; if messages drift, modal behavior and local fallback code choice may diverge from backend `error.code`.
- **Not wired as active runtime path:** because `App.tsx` currently routes through `convertText(...)`, wrapper-level correctness does not automatically guarantee active UI rendering consistency until routing is intentionally aligned.

### Step 10.4.3 — Frontend/UI Contract-Risk Points + Target Behavior (Step 10)

- **Flow name:** Step 10 — legacy wrapper `AsciiDoc -> Markdown`
- **Confirmed frontend/UI target:** `api/frontend/src/converters/asciidoc-to-markdown.ts` → `convertAsciiDocToMarkdown(...)`
- **Basis:** This step reuses the **Step 10.4.2** frontend/UI flow map (success/failure branches, first consumption point, setter propagation). It does **not** change code; it defines **risk** and **target behavior** before **Step 10.4.4** remediation.

#### Contract-risk points (grounded, exact places + risk categories)

Each item below maps to one or more of: **flattening**, **legacy reshaping**, **partial ignore**, **generic success/error only**, **string-only error**, **stale state**.

1. **Dual channel: returned `ConversionResult` vs setter-driven UI**
   - **Where:** `convertAsciiDocToMarkdown(...)` (entire function).
   - **What:** the wrapper both returns a standardized object and updates `setStatus` / `setOutput` / `setNotification` (and optional modal setters).
   - **Risk categories:** **partial ignore** (callers may ignore `ConversionResult`); **flattening** (UI may reflect only status/notification strings); **legacy reshaping** (implicit “legacy UI model” = string status + toast + raw output without structured fields).

2. **Success path may set output before validating `data.conversionResult`**
   - **Where:** after `res.ok`: `setOutput(data.markdown ?? "")` then validation of `data.conversionResult`.
   - **Risk categories:** **stale state** / misleading UI (output briefly visible before validation fails); **generic success** risk if the user perceives “output appeared” as success.

3. **Envelope and parsing asymmetry (success vs failure)**
   - **Where:** success reads `data.conversionResult`; non-OK parses root-level failure or nested `conversionResult`.
   - **Risk categories:** **partial ignore** / **flattening** when fallback paths use `INTERNAL_ERROR` and lose upstream `error.code`; **generic string-only error** when only `detail`/text is surfaced in notifications.

4. **Heuristic modal branch driven by message substrings**
   - **Where:** `!res.ok` path: `errorMessageToCheck.includes(...)` for AsciiDoc-still-present / output-unchanged phrases.
   - **Risk categories:** **legacy reshaping** (modal + local `OUTPUT_INVALID` vs backend `error.code`); **flattening** (behavior driven by message text instead of `error.code`).

5. **Client-built synthetic failures and codes**
   - **Where:** precheck (`EMPTY_INPUT`), timeout/network/catch (`INTERNAL_ERROR`), some HTTP fallbacks.
   - **Risk categories:** acceptable **generic** client failures when no backend body exists; **partial ignore** if a structured backend failure is present but not parsed first.

6. **No integration with `lastBackendConversionResult` / `conversionUiState` (App-level contract state)**
   - **Where:** wrapper is callback-only; `App.tsx` does not invoke this function for conversion today.
   - **Risk categories:** **partial ignore** at app level (structured result never reaches global contract state); **dual-path drift** with `convertText(...)`.

7. **Active production path vs Step 10 wrapper**
   - **Where:** `generic-converter.ts` (`convertText(...)`) vs `asciidoc-to-markdown.ts`.
   - **Risk categories:** **reshaping** / **stale-state** rules may differ (e.g. contract-first clearing, `setBackendConversionResult`); **generic success/error** handling may differ for the same endpoint.

#### Points that already look safe / protective

- **R1 — Explicit success gate:** HTTP 200 path requires `data.conversionResult` with `success === true` before standardized success (`createSuccessResult`); does not treat HTTP 200 alone as success.
- **R2 — Structured failure passthrough:** non-OK JSON is interpreted as standardized failure when `success === false` and `error` is structured; fields are passed into `createFailureResult(payload)` when present.
- **R3 — Harmonized return shape:** branches return standardized success/failure objects (local builders), not ad-hoc throw-only success.
- **R4 — Loading lifecycle:** `setLoading(true)` for the attempt; `finally` always clears loading (coherent loading flag for this wrapper).

#### Points that still need alignment work (before / during 10.4.4)

- **A1 — Output-before-validation ordering** (risk point 2): avoid misleading output/stale perception; align with target behavior below.
- **A2 — Caller integration:** `App.tsx` does not call this wrapper; structured return value does not flow into `lastBackendConversionResult` / `conversionUiState` (risk points 6–7).
- **A3 — Heuristic modal vs `error.code`:** prefer `error.code` for branching when backend provides it (risk point 4).
- **A4 — Dual implementation:** `convertText(...)` vs wrapper for `asciidoc -> markdown` should be unified or explicitly documented to prevent divergence (risk point 7).

#### Target frontend/UI behavior (definition for Step 10 — basis for 10.4.4)

##### Success consumption and rendering

- **Must** treat the attempt as successful only when the backend provides a standardized success `ConversionResult` (`success === true`, `error === null`) and required fields are present.
- **Must** use backend `conversionResult` as the source of truth for success semantics; **must not** infer success from `markdown` alone.
- **May** derive `setOutput` from `data.markdown` only when success semantics above are satisfied (or reorder so output is set only after validation—see 10.4.4+ remediation).
- **May** enrich UI labels from `meta` / `warnings` for display, without dropping or replacing required fields.

##### Failure consumption and rendering

- **Must** treat HTTP non-OK as failure when the backend returns a standardized failure body.
- **Must** preserve structured `error` and `error.code` when present; local synthetic codes are only for true client-side or unparseable cases.
- **May** show a modal for specific grounded failure classes, but **must** prefer `error.code` when available over message heuristics for classification and UX branching.

##### Idle / loading / success / error state handling

- **Must** keep `loading` coherent: `true` during the attempt, `false` in `finally`.
- **Should** align `conversionUiState` (idle/loading/success/error) with backend truth when this wrapper is wired into `App.tsx` (currently deferred).
- **Must not** present a prior attempt’s output as the current attempt’s success when the backend reports failure (stale-output risk when output is set before validation—see risk point 2).
- **Note:** this wrapper alone does not set `conversionUiState` or `lastBackendConversionResult`; those are **App** concerns until integration—see alignment items A2/A4.

##### Acceptable interpretation / enrichment

- **Acceptable:** merging `meta` with `{ uiWrapper: 'asciidoc-to-markdown', stage: ... }` for traceability.
- **Acceptable:** user-facing French strings in `setStatus` / `setNotification` as long as the returned `ConversionResult` remains the canonical structured record.

##### Unacceptable flattening / reshaping / stale-state behavior

- **Unacceptable:** treating HTTP 200 as success if `conversionResult.success !== true`.
- **Unacceptable:** inferring success from non-empty `markdown` when `conversionResult` is missing or `success !== true`.
- **Unacceptable:** replacing structured backend failures with string-only errors when a structured body is available (notifications/status must not become the only carrier of failure semantics).
- **Unacceptable:** reducing structured failures to a generic “error” toast without preserving `error.code` / structured `error` in the canonical return value (and in app state once wired).
- **Unacceptable:** ignoring returned `ConversionResult` in callers such that UI state contradicts structured `success` / `error.code`.
- **Unacceptable:** leaving stale output visible for a failed attempt when the flow is integrated with the result panel (see risk point 2 and A1).

#### Note on next remediation step

- Runtime/UI remediation for Step 10 is recorded in **Step 10.4.4** (applied).

### Step 10.4.4 — Frontend/UI Remediation (Step 10 wrapper, applied)

- **Module:** `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown`)
- **Summary:** aligned the Step 10 wrapper with the contract-first pattern used in `convertText` for `/api/to-markdown`: clear stale indicators at attempt start; prioritize root-level standardized HTTP failures; set markdown output only after `conversionResult` validates success; optional `setBackendConversionResult` / `setConversionUiState` callbacks; coherent `loading` + `error`/`success` UI state when those callbacks are provided.

### Step 10.4.5 — Frontend/UI Remediation Verification and Consolidation (Step 10)

- **Verification completed:** Step 10 wrapper flow (`api/frontend/src/converters/asciidoc-to-markdown.ts`) was re-checked with focused tests plus full frontend regression checks.
- **Focused checks added:** `api/frontend/src/converters/asciidoc-to-markdown.test.ts`
  - success branch uses backend `conversionResult` as source of truth,
  - non-OK branch preserves structured backend failure including `error.code`,
  - HTTP 200 without `conversionResult` is treated as failure (no stale success output).
- **Consolidation result:** success/failure contract semantics and loading/error/success transitions are coherent for this wrapper; no follow-up fix was required beyond the localized Step 10.4.4 wrapper remediation.

### Step 10.5.1 — Step 10 vs Already Validated Flows (Comparison)

- **Step 10 flow in scope:** frontend legacy wrapper `AsciiDoc -> Markdown` (`api/frontend/src/converters/asciidoc-to-markdown.ts`) using backend `POST /api/to-markdown`.
- **Validated comparison baseline:** previously validated flows and layers (AsciiDoc→Markdown contract path, Markdown→AsciiDoc, Text→Markdown, and Step 8 HTML→*), including converter-level builders, backend/orchestrator preservation, and contract-first `convertText(...)` handling.

#### Converter result construction

- **Consistent**
  - Backend converter/module layer still builds standardized `ConversionResult` objects using centralized success/failure builders.
  - Required structural blocks (`warnings`, `logs`, `meta`, structured `error`) remain present across success and failure.
- **Different but acceptable**
  - Step 10 specifically validates the wrapper-level consumption/re-emission path for an already standardized backend flow, rather than introducing a new converter migration.
- **Needs later attention**
  - None at converter-construction level for this step; Step 10 work did not uncover a new converter-level contract gap.

#### Backend/orchestrator preservation

- **Consistent**
  - Standardized success is preserved to HTTP success envelope (`{ markdown, conversionResult }`).
  - Standardized failure is preserved at root on non-OK with structured `error.code` and compatibility `detail`.
  - Internal coordination failures are converted to structured failures rather than leaking raw throws.
- **Different but acceptable**
  - Step 10 required a small route-local guard/coercion for non-standard failure edge shapes, but remained within the same preservation model used by validated flows.
- **Needs later attention**
  - Envelope asymmetry (success nested vs failure root-level) remains a known cross-flow characteristic that consumers must continue to handle explicitly.

#### Frontend/UI preservation

- **Consistent**
  - Contract-first semantics are now applied inside the Step 10 wrapper: success/failure `ConversionResult` drives outcome; structured failures are preserved; stale output is cleared for new attempts and failures.
  - Optional state callbacks (`setBackendConversionResult`, `setConversionUiState`) allow parity with contract-first behavior already used in `convertText(...)`.
- **Different but acceptable**
  - Step 10 target is a legacy wrapper module, while most active validated runtime behavior is centralized in `convertText(...)`; this scoped wrapper alignment is acceptable for a bounded migration cycle.
- **Needs later attention**
  - Runtime wiring still routes app conversions through `convertText(...)` rather than this wrapper; consolidation/unification of duplicated AsciiDoc→Markdown entrypoints remains a later cleanup topic.

#### Error-handling shape

- **Consistent**
  - Structured backend failures are preserved and `error.code` remains available for UI behavior (including modal branching).
  - HTTP 200 without valid success `conversionResult` is treated as failure, not success-by-output.
- **Different but acceptable**
  - Wrapper keeps localized fallback synthesis (`INTERNAL_ERROR`, `OUTPUT_INVALID`) for unstructured/transport-side conditions; this matches prior validated pattern where fallbacks are used only when structured backend failure is unavailable.
- **Needs later attention**
  - Heuristic message checks still exist for one modal branch; they are reduced/guarded by `error.code`, but full code-first branching remains a future hardening direction.

#### State handling (`idle/loading/success/error` + stale-state control)

- **Consistent**
  - Attempt lifecycle is coherent: start clears transient state and output, sets loading; terminal paths set success/error when callback is provided; `finally` clears loading.
  - Stale success output does not remain as current-attempt output on failure paths.
- **Different but acceptable**
  - This wrapper does not own global app-level `idle` state transitions directly unless wired by caller callbacks; this is acceptable for a wrapper-scoped remediation.
- **Needs later attention**
  - Full app-level parity depends on whether/when this wrapper is used as an active runtime path instead of (or alongside) `convertText(...)`.

#### Verification style

- **Consistent**
  - Uses small focused checks plus baseline regression checks, matching established project verification style:
    - backend e2e contract scripts for `/api/to-markdown`,
    - frontend vitest + typecheck,
    - targeted Step 10 wrapper tests for success/failure/state behavior.
- **Different but acceptable**
  - Step 10 adds wrapper-specific tests (`asciidoc-to-markdown.test.ts`) because this step’s scope is wrapper-level frontend preservation, not a new endpoint family.
- **Needs later attention**
  - Keep wrapper tests synchronized with `convertText(...)` contract rules to avoid future drift between parallel entrypoints.

#### Consolidated comparison outcome

- **Consistent with validated flows:** standardized result construction/preservation remains intact across converter, backend/orchestrator, and Step 10 wrapper frontend handling.
- **Different but acceptable:** Step 10 focuses on wrapper-local alignment and verification while active production routing remains centralized in `convertText(...)`.
- **Noteworthy divergence to track:** dual-path AsciiDoc→Markdown handling (`convertText(...)` vs wrapper) is still the main remaining drift surface for future consolidation, though not a blocker for current Step 10 completion.

### Step 10.5.2 — Step 6 Playbook Conformance Check (Step 10 Flow)

- **Flow in scope:** Step 10 execution entry wrapper `api/frontend/src/converters/asciidoc-to-markdown.ts` for backend `POST /api/to-markdown`.
- **Playbook reference:** Step 6 migration/checklist criteria already used for prior validated flows.

#### Clearly completed playbook items

1. **Runtime flow mapping**  
   - Completed in Step 10.2.1 (wrapper runtime entry, success/failure paths, throw/return behavior, metadata production points).
2. **Payload mapping**  
   - Completed in Step 10.2.2 (field-by-field mapping to `createSuccessResult(payload)` / `createFailureResult(payload)`, with direct/derivable/default/missing classification).
3. **Success-path integration**  
   - Completed in Step 10.2.3 (success path consumes backend `conversionResult`, validates success semantics, builds standardized success result).
4. **Failure-path integration**  
   - Completed in Step 10.2.4 (failure paths standardized via `createFailureResult`, preserving backend structured failures where available).
5. **Internal-error harmonization**  
   - Completed in Step 10.2.5 (removed avoidable throw-detours; internal exits converted to structured failures).
6. **Isolated verification**  
   - Completed in Step 10.2.6 with focused `/api/to-markdown` verification scripts (nominal success, grounded failure, small baseline set).
7. **Backend/orchestrator alignment**  
   - Completed across Step 10.3.1–10.3.4 (target identified/mapped/risk-scoped/remediated) and consolidated in 10.3.5.
8. **Frontend/UI alignment**  
   - Completed across Step 10.4.1–10.4.4 (target identified/mapped/risk-scoped/remediated) and consolidated in 10.4.5.
9. **Boundary verification (where applicable)**  
   - Completed via backend HTTP boundary checks (`verify-e2e-to-markdown-output-boundary.js`) and wrapper-focused frontend tests (`asciidoc-to-markdown.test.ts`) confirming contract semantics at integration boundaries.

#### Lighter but acceptable completion

- **Frontend boundary verification depth:**  
  - Wrapper-focused tests were added and full frontend regression checks passed, but active app runtime currently uses `convertText(...)`.  
  - This is acceptable for Step 10 because the scoped target was explicitly the Step 10 wrapper module, not global routing redesign.
- **State model integration at app level:**  
  - Wrapper now supports optional `setBackendConversionResult` / `setConversionUiState` for contract-first parity, but app-level use of this wrapper is not yet the active path.  
  - Acceptable within Step 10 scope; broader UI-path consolidation is deferred.

#### Grounded deviations (documented, non-blocking)

1. **Dual-path frontend entrypoints remain**  
   - `convertText(...)` remains the active conversion route while `convertAsciiDocToMarkdown(...)` is now contract-aligned.  
   - This is a known divergence surface, documented for later consolidation, but not a Step 10 blocker.
2. **HTTP envelope asymmetry persists at backend boundary**  
   - Success returns `{ markdown, conversionResult }`; failure returns root-level standardized failure + `detail`.  
   - This is consistent with current validated behavior and explicitly handled in frontend logic; not a conformance failure.
3. **Residual heuristic branch in wrapper modal behavior**  
   - Message-based detection still exists as fallback, now secondary to `error.code` where available.  
   - Grounded and acceptable for current scope; full code-first simplification can be future hardening.

#### Overall Step 6 playbook conformance verdict (Step 10)

- **Overall conformance:** **Yes** — Step 10 follows the Step 6 migration playbook with all required core items completed and verified.
- **Deviation status:** only scoped, documented, non-blocking deviations remain (primarily frontend entrypoint consolidation and envelope asymmetry handling), both already tracked for later waves.

### Step 10.5.3 — Step 10 Execution Observations (Surprises, Frictions, Notable Deviations)

- **Scope reviewed:** converter migration baseline reuse, backend/orchestrator alignment and remediation, frontend/UI wrapper alignment, verification and consolidation checks for Step 10.

#### Main grounded surprises / frictions observed

1. **Unexpected frontend runtime reality vs planned entry flow**
   - Step 10 execution target was the legacy wrapper `asciidoc-to-markdown.ts`, but active app runtime conversion calls still route through `convertText(...)`.
   - This created a practical split between “aligned module behavior” and “currently active UI path,” requiring careful scope control.

2. **Dual-path handling for the same conversion route (`/api/to-markdown`)**
   - Both `convertText(...)` and `convertAsciiDocToMarkdown(...)` now carry contract logic for the same path.
   - This increases local handling burden and drift risk (state transitions, modal gating, stale-output rules, callback usage).

3. **Backend envelope asymmetry remains a persistent friction point**
   - Success response shape: `{ markdown, conversionResult }`
   - Failure response shape: root-level standardized failure + `detail`
   - Frontend logic must keep two envelope interpretations in sync, which adds path-specific parsing complexity.

4. **Error-shape friction: `error.code` vs heuristic message checks**
   - Even after preserving structured failures, one frontend branch still uses message-pattern heuristics for modal behavior fallback.
   - This is workable but more fragile than pure code-driven branching.

5. **Boundary-layer fallback pressure**
   - Backend route/lazyload needed explicit guardrails against non-standardized edge shapes to keep HTTP boundary contract-safe.
   - This confirms that preservation at boundaries is still an active risk even when converter/module internals are already standardized.

6. **Verification gap discovered and closed during Step 10**
   - Prior coverage was strong on backend endpoint contracts and generic converter behavior, but direct wrapper-level tests for `asciidoc-to-markdown.ts` were missing.
   - A focused wrapper test file was added to close this gap and verify source-of-truth behavior explicitly.

#### Classification

##### Acceptable flow-specific surprises

- Wrapper target not being the current active app runtime path is acceptable for this bounded migration cycle, because Step 10 explicitly scoped alignment to the selected wrapper module.
- Envelope asymmetry is acceptable as a known compatibility characteristic, provided parsing remains explicit and tested.
- Local synthetic fallback failures (`INTERNAL_ERROR`, etc.) are acceptable only when structured backend failures are unavailable.

##### Later playbook refinement candidates

- **Refinement candidate 1:** add an explicit “active runtime wiring check” checkpoint early in each cycle to detect when selected target modules are not the app’s active execution path.
- **Refinement candidate 2:** include a standard rule to avoid duplicated contract logic for the same endpoint across parallel frontend entrypoints unless temporary overlap is intentionally documented.
- **Refinement candidate 3:** strengthen frontend guidance toward `error.code`-first behavior with message heuristics only as fallback, and require tests for that ordering.
- **Refinement candidate 4:** include a default requirement for one direct wrapper-level test set whenever a wrapper (not only generic converters) is the migration target.

##### Issues that must stay documented (non-blocking but important)

- Dual-path `AsciiDoc -> Markdown` frontend handling (`convertText(...)` vs wrapper) remains the main future drift surface.
- Backend success/failure envelope asymmetry must remain explicit in docs/tests to prevent accidental flattening.
- Step 10’s contract alignment is verified and acceptable, but full long-term simplification depends on later frontend entrypoint consolidation work (outside Step 10 scope).

### Step 10.5.4 — Step 10 Cycle Validation and Closure Readiness

- **Validation inputs used:** isolated verification results (10.2.6), backend/orchestrator remediation verification (10.3.5), frontend/UI remediation verification (10.4.5), cross-flow comparison (10.5.1), playbook conformance (10.5.2), and execution observations (10.5.3).

#### What is validated

- **Flow migrated and standardized:** Step 10 wrapper flow now consumes and returns standardized success/failure `ConversionResult` semantics with required structured fields.
- **Backend/orchestrator preservation works:** `/api/to-markdown` boundary behavior preserves standardized success/failure, structured `error.code`, and internal coordination failure conversion.
- **Frontend/UI preservation works (Step 10 target):** `asciidoc-to-markdown.ts` now treats backend success/failure `ConversionResult` as source of truth, preserves structured failure data, and keeps attempt-state handling coherent.
- **Relevant checks pass:** backend e2e scripts and frontend test/typecheck runs passed for Step 10-related scenarios, including wrapper-focused checks added in 10.4.5.
- **No unresolved major blocker identified:** no grounded blocker prevents Step 10 closure under the scoped execution target.

#### What remains acceptable but non-blocking

- **Dual frontend entrypoints remain:** `convertText(...)` is still the active app runtime path while the Step 10 wrapper is now aligned; this is documented and deferred for later consolidation.
- **Envelope asymmetry persists:** success remains wrapped (`conversionResult`) while failure is root-level + `detail`; this is known, explicitly handled, and tested.
- **Residual heuristic fallback branch exists:** message-based modal fallback still exists in a bounded form, secondary to structured `error.code` when available.

#### Closure decision

- **Decision:** **Step 10 cycle is clean enough for closure.**
- **Rationale:** required migration/alignment/verification checkpoints are completed and passing; remaining differences are documented, acceptable, and non-blocking for this cycle.

### Step 10.6.1 — Step 10 Execution Summary (What Actually Ran)

- **Executed flow:** Step 10 executed the selected wrapper entry flow `api/frontend/src/converters/asciidoc-to-markdown.ts` for `AsciiDoc -> Markdown` (`POST /api/to-markdown`).

#### Converter-level work

- Reused already-migrated converter baseline (`downdoc` module) and confirmed standardized `ConversionResult` construction remained intact (success + failure shape preservation at module/output boundary).

#### Backend/orchestrator work

- Identified and mapped the real backend target (`conversion.routes.js` `/to-markdown` + `lazyload.runConverter` path).
- Applied localized preservation remediation so route-level handling keeps standardized success/failure semantics, preserves structured `error`/`error.code`, and avoids avoidable contract break at boundary edges.
- Re-verified backend contract behavior through isolated endpoint and flow-level checks.

#### Frontend/UI work

- Identified and mapped the Step 10 frontend target wrapper (`convertAsciiDocToMarkdown(...)`).
- Applied localized wrapper remediation so backend `ConversionResult` is the source of truth for success/failure handling, structured failures are preserved, stale output/state is cleared per attempt, and optional `conversionUiState`/backend-result callbacks are supported.
- Consolidated behavior with focused wrapper tests.

#### Verification and consolidation work

- Ran isolated verification for `/api/to-markdown` (nominal success, grounded failure, representative baseline set).
- Ran backend/orchestrator preservation checks, frontend wrapper-focused checks, plus frontend regression (`vitest`) and typecheck (`tsc --noEmit`).
- Recorded cross-flow comparison, playbook conformance check, and execution observations.

#### What Step 10 confirmed

- The Step 10 flow is contract-preserving end-to-end within its scoped target: standardized converter output, backend/orchestrator preservation, frontend wrapper preservation, and coherent attempt-state behavior are all verified.
- The Step 6 playbook remains applicable and effective for this cycle, with only documented non-blocking deviations.

#### What remains outside Step 10 scope

- Broad frontend runtime routing consolidation (active `convertText(...)` path vs wrapper path unification) is deferred.
- Global UI redesign or broader cross-flow refactor work is out of scope.
- Future cycle items (post-Step 10 synthesis/baseline expansion beyond this cycle) are not started here.

### Step 10.6.2 — Multi-Flow Baseline Update (Validated Reference Set Includes Step 10)

#### Validated reference set (expanded)

The validated multi-flow baseline now explicitly includes **Step 10** as an additional **validated execution unit** for the **`AsciiDoc -> Markdown`** path:

- **Backend route (unchanged endpoint):** `POST /api/to-markdown` (downdoc via lazy loader) — already part of the baseline as the **first migrated flow**.
- **Step 10 addition (new alignment surface):** the **legacy frontend wrapper** `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown(...)`) is now **contract-aligned, verified, and accepted** as part of the reference set for this route.

In other words, the baseline expands from “endpoint + generic `convertText(...)` contract-first handling” to also include a **direct, wrapper-level** contract preservation pattern for the same route, without introducing a new backend conversion endpoint.

#### What remains common across the validated flows

- **Standardized `ConversionResult` semantics** on success and failure, including structured `error` / `error.code` where applicable, plus required root fields (warnings/logs/meta collections).
- **Boundary-first preservation:** backend HTTP responses and the primary frontend ingestion paths preserve standardized semantics rather than flattening into ad-hoc legacy models as the source of truth.
- **Repeatable verification posture:** contract success/failure checks, representative/baseline scenarios where applicable, and targeted tests for contract-first behavior (including wrapper-level tests for Step 10).

#### What remains path-specific but acceptable

- **Frontend topology:** Step 10 validates a **standalone wrapper module** while production routing may still use `convertText(...)` for the same endpoint — overlap is documented and acceptable for this cycle.
- **Envelope asymmetry:** success may nest `conversionResult` while failure may be root-level + `detail` — handled explicitly per flow.
- **Residual heuristics:** bounded message-based fallbacks may remain where structured codes are unavailable — acceptable when secondary to `error.code`.

#### What this improves for future migration confidence

- Demonstrates the Step 6 playbook applies to **wrapper-targeted waves** (not only new endpoints or only `convertText(...)` changes).
- Reduces ambiguity when the handoff names a **legacy module** as the execution entry: the baseline now includes a completed example of wrapper-level alignment + verification.
- Makes future drift easier to detect: **same route, two frontend surfaces** is an explicit, documented comparison point.

### Step 10 Definition of Done

Step 10 is complete only if all criteria below are true:

- The entry flow was confirmed.
- The scope was frozen.
- The runtime flow was mapped.
- Helper payload mapping was documented.
- Success-path integration was completed.
- Failure-path integration was completed.
- Internal-error harmonization was completed.
- Isolated verification passed.
- Backend/orchestrator alignment was completed.
- Backend/orchestrator verification passed.
- Frontend/UI alignment was completed.
- Frontend/UI verification passed.
- Cross-flow comparison was completed.
- Playbook conformance was checked.
- Execution observations were documented.
- The cycle was validated as clean enough for closure.
- The multi-flow baseline was updated.

#### What Step 10 does not require

- Any refactor or baseline redesign beyond localized Step 10 contract-preservation updates.
- Any new migration work outside the Step 10 scoped flow and its required verification/alignment checkpoints.
- Starting post-Step 10 follow-up work (including Step 11).

### Step 10 Closure

Step 10 executed one additional real flow: `AsciiDoc -> Markdown` through `POST /api/to-markdown`, with the selected wrapper entry flow `convertAsciiDocToMarkdown(...)` as the scoped execution surface.

Step 10 achieved contract-preserving completion for that flow: converter migration was completed, backend/orchestrator alignment was completed, frontend/UI alignment was completed, and the flow was verified and accepted for closure.

Concrete validated-set result: the multi-flow baseline was expanded again to include this Step 10 execution unit as a validated reference for wrapper-level alignment on an already-migrated route.

Method confirmation: Step 10 confirms the migration/alignment method remains effective for scoped, contract-first waves across converter output, backend boundary preservation, and frontend ingestion/state handling, with verification at each layer.

What remains outside Step 10 scope: remaining flow migrations, broad redesign/refactor work, and any Step 11 execution work.

Step 10 does not mean all remaining flows are migrated, does not mean broad redesign work is done, and does not mean Step 11 has already started.

Transition note: later work can proceed from this expanded validated baseline as a separate phase, without reopening Step 10 scope.

### Step 11.1.1 — Post-Step-10 Candidate Reassessment (Remaining Unmigrated Flows)

#### Context and inputs

This reassessment reuses the Step 6 candidate inventory and the earlier classifications (Steps 6.1.1–6.1.2, Step 9.1.1–9.1.2) and incorporates execution evidence from **Step 10**: a **wrapper-targeted** `AsciiDoc -> Markdown` alignment on `POST /api/to-markdown` (`api/frontend/src/converters/asciidoc-to-markdown.ts`), expanding the validated multi-flow baseline (see Step 10.6.2).

#### Remaining unmigrated candidate flows (from Step 6 inventory, updated)

After Step 10 execution, the remaining grounded candidates are:

- **Generic multi-format family:** `POST /api/convert` (secured conversions for non-specialized format pairs).
- **Frontend legacy wrapper module:** `api/frontend/src/converters/markdown-to-asciidoc.ts` (second module from the Step 9.2.1 execution order; not yet executed).

`api/frontend/src/converters/asciidoc-to-markdown.ts` is **no longer a remaining migration candidate** for this inventory slice: it was executed and accepted in Step 10.

#### Updated readiness / priority observations (stronger / weaker / unchanged)

##### Generic multi-format family (`POST /api/convert`)

- **Signal:** **stronger** (planning confidence), **unchanged** (high surface / high practical risk).  
- **What got stronger after Step 10:** the method is now validated on an additional real shape: **wrapper-level** contract alignment on the same route as an already-migrated backend flow, with explicit dual-frontend-surface documentation. That increases confidence that future waves can be scoped narrowly without assuming a single ingestion entrypoint.  
- **What stays the same:** `/api/convert` remains a **large, multi-pair, token-guarded** family; Step 10 does not reduce its inherent coupling or breadth.  
- **Priority / readiness update:** **unchanged** in principle (still “defer until a bounded sub-slice strategy”), with **slightly higher** planning confidence for eventual execution.

##### Frontend legacy wrapper (`markdown-to-asciidoc.ts`)

- **Signal:** **stronger** (near-term readiness and execution clarity).  
- **What got stronger after Step 10:** Step 10 is a completed **precedent** for the same class of work (isolated wrapper, contract-first success/failure, backend boundary preservation, targeted tests). The Step 9 handoff’s **second** module is now the obvious next bounded unit.  
- **Priority / readiness update:** **should be updated** — treat as the **next prioritized bounded follow-on** within the legacy wrapper track (higher than an undifferentiated “wrapper pair” bucket).

#### What Step 10 implies for the remaining set (method)

- **Wrapper-targeted waves** are grounded and repeatable, not only `convertText(...)`-centric or route-first migrations.  
- **Dual frontend surfaces** for one route are acceptable when documented and verified; future candidates should assume explicit comparison points.

#### Notes on movement (summary)

- **Stronger:** `POST /api/convert` (confidence only), `markdown-to-asciidoc.ts` (readiness + priority for next bounded wrapper work).  
- **Weaker:** none among the remaining listed candidates.  
- **Unchanged:** `/api/convert` risk profile and “defer broad family” stance; `markdown-to-asciidoc.ts` remains low–medium migration risk relative to `/api/convert`.  

#### Next sub-step boundary

This step does **not** select the next migration wave or open Step 11.1.3.

### Step 11.1.2 — Updated Candidate Classification (Readiness / Risk / Migration Value)

This sub-step updates the previous remaining-candidate classification (Step 9.1.2), using the reassessed remaining list from Step 11.1.1 and execution evidence from Step 10.

#### Remaining candidates (reused list)

- Generic multi-format family: `POST /api/convert`
- Frontend legacy wrapper module: `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Updated classification table

| Candidate conversion path | Updated readiness | Updated migration risk | Updated migration value | Movement vs previous classification | Short grounded justification |
|---|---:|---:|---:|---|---|
| Generic multi-format family (`POST /api/convert`) | Medium | High | High (strategic), Medium (near-term) | Stable (confidence up) | Step 10 adds wrapper-level execution evidence and strengthens method confidence, but `/api/convert` remains a high-surface, token-guarded, multi-pair family with substantial practical risk and coupling. |
| Frontend legacy wrapper (`api/frontend/src/converters/markdown-to-asciidoc.ts`) | Medium-High | Low-Medium | Medium-High (near-term), Medium (strategic) | Moved up | Step 10 completed the same wrapper-track pattern end-to-end on the opposite direction, reducing ambiguity and increasing near-term readiness/priority for this remaining wrapper candidate. |

#### Notes on movement (up / down / stable)

- **Moved up:** `api/frontend/src/converters/markdown-to-asciidoc.ts` (readiness and near-term migration value increased after Step 10 precedent).
- **Moved down:** none.
- **Stable:** `POST /api/convert` (classification bands stay the same; planning confidence increased but risk/complexity profile is unchanged).

#### Step boundary

This step updates classification only and does **not** start Step 11.2.3.

### Step 11.1.3 — Next Realistic Migration Target / Small Wave Selection (Post-Step-10 Reassessment)

This sub-step selects the next realistic migration target using the reassessed remaining candidates (Step 11.1.1) and updated classification (Step 11.1.2).

#### Remaining candidates considered

- Generic multi-format family: `POST /api/convert` (Readiness: Medium, Risk: High, Value: High strategic / Medium near-term).
- Frontend legacy wrapper module: `api/frontend/src/converters/markdown-to-asciidoc.ts` (Readiness: Medium-High, Risk: Low-Medium, Value: Medium-High near-term).

#### Selection

- **Selected next target (single strongest bounded unit):** `api/frontend/src/converters/markdown-to-asciidoc.ts`.

#### Why this is now the best next choice

- **Best readiness-to-risk profile among remaining candidates:** after Step 10, `markdown-to-asciidoc.ts` is the highest-readiness and lower-risk remaining candidate.
- **Direct Step 10 precedent:** Step 10 already validated the same wrapper-track execution model end-to-end on the opposite direction, reducing ambiguity for scope, behavior expectations, and verification posture.
- **Maintains bounded migration discipline:** selecting one wrapper target preserves the small-wave pattern and avoids premature expansion into the broad `/api/convert` family.
- **Immediate practical value:** it closes the remaining wrapper counterpart and reduces dual-wrapper drift while preserving contract-first semantics.

#### What remains deferred

- **Deferred:** Generic multi-format family `POST /api/convert` as a broad family wave.
- **Rationale:** despite stronger planning confidence, it remains high-surface and high-risk; it should be opened only as a separately bounded sub-slice strategy, not as a broad next wave.

#### Step boundary

This step selects the next target only and does **not** start Step 11.2.3.

### Step 11.2.1 — Execution Strategy for the Next Selected Target / Small Wave

#### Selected target / wave (from Step 11.1.3)

- **Single bounded unit:** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) for **Markdown → AsciiDoc** via **`POST /api/to-asciidoc`** (Pandoc-backed route, per module documentation).

#### Strictly one flow at a time

- **Yes.** Treat this as **one wrapper execution unit** end-to-end (wrapper + its backend route contract + verification), mirroring the Step 10 wrapper discipline. Do not parallelize additional migration surfaces in the same wave.

#### Practical execution order

1. **Confirm entry surface:** `convertMarkdownToAsciiDoc(...)` in `markdown-to-asciidoc.ts` (success/failure paths, legacy output fields, loading/notification behavior).
2. **Map runtime to backend:** `POST /api/to-asciidoc` orchestration and converter boundary (same layered pattern as Step 10: module → route → HTTP).
3. **Align contract semantics:** success and failure `ConversionResult` handling, internal-error harmonization, and stale-output/state behavior consistent with the validated wrapper pattern.
4. **Verify:** isolated route checks + wrapper-focused tests + non-regression (`npm test`, `npm run typecheck`) as applicable to this target.

#### Entry flow (in-scope)

- **Entry flow:** `convertMarkdownToAsciiDoc(...)` → `POST /api/to-asciidoc`.

#### What stays deferred until earlier execution results are validated

- **Deferred:** Generic multi-format family `POST /api/convert` (broad family; remains out of scope until a separately bounded sub-slice strategy).
- **Deferred:** Any additional migration targets beyond this single wrapper wave (including expanding scope to “all legacy entrypoints” cleanup in one pass).
- **Deferred:** Broad frontend/UI redesign unrelated to bounded wrapper contract alignment.

#### Why this order is the safest and most practical

- **Smallest comparable unit:** one wrapper + one dedicated route matches the proven Step 10 model and keeps rollback and verification tractable.
- **Clear precedent:** Step 10 already established expectations for wrapper-level contract-first alignment and verification posture on the paired direction.
- **Avoids high-surface risk:** it does not open `/api/convert` while still reducing real drift from the remaining legacy wrapper.

#### Step boundary

This step defines execution strategy only and does **not** start Step 11.3.1.

### Step 11.2.2 — Scope Freeze + Entry Conditions (Next Migration Cycle)

#### Selected target / wave (reused)

- **Single bounded unit:** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) for **Markdown → AsciiDoc** via **`POST /api/to-asciidoc`**, executed using the order and layering described in **Step 11.2.1**.

#### In scope (must remain bounded)

- **Wrapper alignment:** contract-first success/failure handling for `convertMarkdownToAsciiDoc(...)` (including stale output/state behavior and structured `error` / `error.code` preservation where applicable), consistent with the validated Step 10 wrapper pattern.
- **Backend/orchestrator boundary preservation (localized):** only the minimum route/orchestrator/converter-edge adjustments needed so `POST /api/to-asciidoc` preserves standardized `ConversionResult` semantics at the HTTP boundary (mirroring Step 10’s “preserve, don’t redesign” posture).
- **Verification:** isolated checks for this route + wrapper-focused tests + non-regression (`npm test`, `npm run typecheck`) as applicable to this target.
- **Documentation:** record outcomes, risks, verification evidence, and any explicit dual-surface notes (wrapper vs `convertText(...)`) for this cycle.

#### Out of scope (explicitly not part of this cycle)

- **Broad backend redesign** (new endpoints unrelated to this flow, large orchestrator refactors, cross-route envelope unification).
- **Generic multi-format family** `POST /api/convert` (any broad “all pairs” migration).
- **Broad frontend/UI redesign** (layout, major state model changes, unrelated components) beyond what is strictly required for bounded wrapper contract alignment.
- **Entrypoint consolidation projects** (e.g., forcing a single frontend routing strategy across the app) beyond documenting overlap.

#### Deferred (must not be pulled in)

- **`POST /api/convert`** until a separately bounded sub-slice strategy exists.
- **Any additional migration targets** beyond this single wrapper + its `POST /api/to-asciidoc` boundary.
- **Follow-on synthesis / next-cycle planning** beyond documenting blockers (do not start Step 11.3.2 here).

#### Go / No-Go conditions (must hold before execution starts)

- **Go**
  - The validated multi-flow baseline remains green: `npm test` and `npm run typecheck` pass.
  - The primary contract-first ingestion path in `convertText(...)` remains intact and non-regressed for already validated flows.
  - The target wrapper module exists and is identifiable as an isolated entry surface (localized changes are feasible without broad UI rewrites).
  - Step 10’s wrapper precedent remains available as the comparable execution model (same playbook class).

- **No-Go**
  - Baseline tests are already failing before changes (no trustworthy non-regression floor).
  - Safe alignment would require **unbounded** backend surface expansion or **global** response-shape redesign (violates this cycle’s preservation posture).
  - Safe alignment would require **broad** UI/state redesign unrelated to this wrapper (scope violation).

#### Non-expansion rule during execution

- Scope must not expand beyond **`markdown-to-asciidoc.ts`**, the **`POST /api/to-asciidoc`** boundary preservation work strictly required for contract semantics, and **minimal** tests/docs—unless a **grounded, blocking** issue is discovered that makes safe completion impossible under this scope. In that case: **document the blocker and stop** rather than widening the wave.

#### Why this scope freeze keeps the next cycle controlled

- It preserves **comparability** with Step 10 (one wrapper + one dedicated route + layered verification).
- It prevents premature **high-surface** expansion (`/api/convert`) while still addressing the last legacy-wrapper drift point.
- It keeps rollback tractable by limiting touched surfaces and requiring explicit gates before execution.

#### Step boundary

This step freezes scope and entry conditions only and does **not** start Step 11.3.2.

### Step 11.2.3 — Ready-to-Execute Handoff Package (Next Migration Cycle)

This section is the execution handoff baseline for the next cycle. It consolidates the selected target, strategy, scope freeze, readiness gates, and minimum verification expectations without reopening prior decisions.

#### Selected target / wave

- **Single bounded target:** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) for **Markdown -> AsciiDoc** via `POST /api/to-asciidoc`.

#### Entry flow

- **Execution entry flow:** `convertMarkdownToAsciiDoc(...)` -> `POST /api/to-asciidoc`.

#### Execution order (strict)

1. Confirm wrapper entry behavior (`success`, `failure`, loading/notification, stale-state risk points).
2. Map and align the route/orchestrator/converter boundary for `POST /api/to-asciidoc` under contract-preservation rules.
3. Apply bounded success/failure/internal-error contract alignment for this flow only.
4. Run required verification gates before considering any scope expansion.

#### In-scope items (minimum)

- Localized wrapper alignment for contract-first `ConversionResult` semantics.
- Localized backend/orchestrator boundary preservation for `POST /api/to-asciidoc` (preserve, do not redesign).
- Minimal tests and docs needed to verify and record this cycle.

#### Deferred items (must stay deferred)

- Generic multi-format family `POST /api/convert` until a separately bounded sub-slice plan exists.
- Any migration targets beyond this single wrapper + route pair.
- Broad frontend/backend redesign and app-wide entrypoint consolidation work.

#### Required readiness conditions (before execution starts)

- Baseline remains green (`npm test`, `npm run typecheck`).
- `convertText(...)` contract-first behavior for already validated flows remains intact.
- Target wrapper remains isolated enough for localized changes.
- No grounded blocker requires unbounded backend or broad UI redesign.

#### Required verification expectations (minimum)

- Route-level isolated checks for `POST /api/to-asciidoc` success/failure/internal-error behavior.
- Wrapper-focused checks proving contract-first handling and stale-state protection.
- Non-regression gate: rerun `npm test` and `npm run typecheck` after alignment.
- Document any accepted flow-specific differences explicitly.

#### Execution start point for future work

Future execution should start from this package as the fixed baseline for the next cycle; if a grounded blocker appears, document it and stop rather than widening scope.

#### Step boundary

This step provides the handoff package only and does **not** start Step 11.3.1.

### Step 11.3.1 — Step 11 Preparation Summary (Next Migration Cycle)

Step 11 prepares the next migration cycle by consolidating reassessment, classification, target selection, execution strategy, scope freeze, and a ready-to-execute handoff package without executing migration changes.

#### What Step 11 prepared

- Reassessed the remaining unmigrated candidates after Step 10 and updated their strength signals.
- Updated readiness/risk/migration-value classification for the remaining candidates.
- Selected the next strongest bounded target: `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) via `POST /api/to-asciidoc`.
- Defined strict one-flow-at-a-time execution strategy, explicit execution order, and deferred boundaries.
- Frozen scope (in-scope / out-of-scope / deferred), go/no-go gates, and non-expansion rule.
- Produced a ready-to-execute handoff package as the fixed baseline for future execution start.

#### What is now ready for the next cycle

- A single, clearly scoped entry flow and execution order.
- Explicit readiness prerequisites and minimum verification expectations.
- A bounded risk posture that preserves comparability with Step 10 and avoids premature `/api/convert` expansion.

#### What still requires actual execution later

- Implementing and validating the actual `markdown-to-asciidoc.ts` migration/alignment changes.
- Running route-level and wrapper-level verification on executed code changes.
- Any migration work on deferred candidates (notably broad `POST /api/convert` family work) in a separate bounded future cycle.

#### Step boundary

This step is summary-only and does **not** start Step 11.3.2.

### Step 11.3.2 — Formalized Planning + Handoff Baseline (Default for Next Cycle)

This section formalizes the Step 11 planning outputs as the default baseline for future execution unless a new grounded blocker requires an explicit exception.

#### Formalized baseline (from Step 11)

- **Reassessed remaining candidate set:** `POST /api/convert` family + `api/frontend/src/converters/markdown-to-asciidoc.ts`.
- **Updated classification baseline:** `/api/convert` remains Medium readiness / High risk / High strategic value (stable, confidence up); `markdown-to-asciidoc.ts` is the moved-up near-term candidate (Medium-High readiness, Low-Medium risk, higher near-term value).
- **Selected default next target:** single bounded wrapper target `convertMarkdownToAsciiDoc(...)` via `POST /api/to-asciidoc`.
- **Execution strategy baseline:** strict one-flow-at-a-time sequence (entry wrapper -> route/orchestrator boundary alignment -> bounded contract alignment -> verification gates).
- **Scope-control baseline:** fixed in-scope/out-of-scope/deferred boundaries, explicit go/no-go conditions, and non-expansion rule (document blocker and stop if bounded execution becomes unsafe).
- **Handoff baseline:** Step 11.2.3 package is the required execution start point.

#### Default expectations for the next cycle

- Start from the Step 11.2.3 handoff package without reopening target selection, classification, scope boundaries, or gate definitions.
- Execute only the selected wrapper + its route boundary under the preserved contract-first method and required verification expectations.
- Keep `/api/convert` and other broad-surface items deferred until a separate bounded sub-slice plan is explicitly approved.

#### Path-specific allowances that may still remain

- Wrapper-level UI behavior details (notifications/status text and local stale-state handling) may stay path-specific if contract semantics are preserved.
- Endpoint envelope specifics can remain path-specific when explicitly documented and verified (no implicit flattening into ad-hoc models).
- Local fallback heuristics may remain only as secondary behavior when structured `error.code` is unavailable, and must stay documented.

#### Step boundary

This step formalizes baseline guidance only and does **not** start Step 11.3.3.

### Step 11.3.3 — Step 11 Definition of Done

Step 11 is complete only if all criteria below are true:

- The remaining candidate flows were reassessed after Step 10.
- The readiness, risk, and migration-value classification was updated.
- The next realistic migration target or small wave was selected.
- The execution strategy was defined.
- The execution scope was frozen.
- In-scope, out-of-scope, and deferred items were documented.
- Go / no-go conditions were defined.
- A ready-to-execute handoff package was documented.
- A concise Step 11 summary was documented.
- A planning and handoff baseline was formalized.
- Step 11 clearly distinguished what is ready for later execution versus what remains deferred.

#### What Step 11 does not require

- Executing the next migration cycle’s code changes or completing the selected wrapper migration itself.
- Any refactor, baseline redesign, or broad product redesign beyond planning and handoff documentation.
- Starting Step 12 or any execution-phase work that belongs to a later cycle.

#### Step boundary

This section defines Step 11 completion criteria only and does **not** start Step 11.3.4.

### Step 11 Closure

#### What Step 11 reassessed

- The remaining unmigrated candidate flows after Step 10: `POST /api/convert` and `api/frontend/src/converters/markdown-to-asciidoc.ts` (see Step 11.1.1).

#### What Step 11 reclassified

- Updated readiness, risk, and migration-value for those remaining candidates (Step 11.1.2): `/api/convert` stable with higher planning confidence; `markdown-to-asciidoc.ts` moved up as the near-term wrapper candidate.

#### What Step 11 selected as the next target or small wave

- **Single bounded next target:** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) with **`POST /api/to-asciidoc`** (Step 11.1.3).

#### What execution strategy Step 11 defined

- Strict **one-flow-at-a-time** execution order: confirm wrapper entry → map and align the `POST /api/to-asciidoc` boundary → bounded contract alignment → verification gates (Step 11.2.1).

#### What scope boundaries and go / no-go conditions Step 11 froze

- In-scope / out-of-scope / deferred items, **go / no-go** gates, and **non-expansion** rule for the next cycle (Step 11.2.2).

#### What handoff package Step 11 produced

- **Step 11.2.3** ready-to-execute handoff: selected target, entry flow, execution order, minimum in-scope work, deferred list, readiness conditions, and verification expectations.

#### What Step 11 now provides for the next migration cycle

- A **controlled, documented default baseline** (Step 11.3.2) plus a concise preparation record (Step 11.3.1) and explicit completion criteria (Step 11.3.3), without executing migration code.

#### Execution vs preparation (explicit)

- **Step 11 did not execute the next cycle:** no migration implementation or route/wrapper remediation was performed as part of Step 11.
- **Step 11 prepared the next cycle in a controlled and documented way:** selection, strategy, scope freeze, gates, and handoff are fixed inputs for future execution.
- **Deferred items remain deferred** (notably broad `POST /api/convert` family work) until a separately bounded sub-slice strategy is chosen.
- **Already validated contract, alignment, and consolidation work should not be reopened** without a **real, grounded blocker**; future work should build on the formalized baseline rather than relitigating settled decisions.

#### What Step 11 does not mean

- The next flow is already migrated.
- The next wave is already executed.
- All remaining candidates are now ready.
- Step 12 has already started.

#### Step boundary

Step 11 closes here as a planning and handoff milestone only and does **not** start Step 12.1.2.

### Step 12.1.1 — Step 12 Entry Flow Confirmation (From Step 11 Handoff)

#### Handoff package reviewed

- **Source of truth:** **Step 11.2.3** (Ready-to-Execute Handoff Package), reinforced by **Step 11.3.2** (formalized default baseline).

#### Confirmed execution entry flow (exact)

- **Wrapper module:** `api/frontend/src/converters/markdown-to-asciidoc.ts`
- **Entry function:** `convertMarkdownToAsciiDoc(...)`
- **Backend endpoint:** `POST /api/to-asciidoc`
- **Direction:** Markdown → AsciiDoc (Pandoc-backed route per module documentation)

This is the **only** in-scope execution entry for Step 12 under the frozen Step 11 plan (single wrapper + single route boundary).

#### Readiness and go / no-go verification (Step 11.2.2 / 11.2.3 criteria)

- **Go conditions (must still hold immediately before any Step 12 code changes):**
  - Baseline green: `npm test` and `npm run typecheck` pass.
  - `convertText(...)` contract-first behavior for already validated flows remains intact (non-regression on prior migrated paths).
  - The `markdown-to-asciidoc.ts` wrapper remains an isolated, localized entry surface.
  - No requirement for unbounded backend expansion, global envelope redesign, or broad UI/state redesign to proceed under the frozen scope.

- **No-Go conditions (stop and document):**
  - Baseline already failing before changes.
  - Only “safe” path would violate frozen scope (unbounded backend/UI work).

**Step 12.1.1 status:** The handoff-defined flow **still matches** the intended entry point and **still aligns with the frozen go / no-go intent**. Actual command-level verification must be re-run at execution start (this sub-step does not substitute for running the checks).

#### Why this remains the correct next execution target

- It is the **explicit Step 11 selection** and completes the **remaining legacy wrapper** pair after Step 10, using the same **wrapper + dedicated route** pattern.
- It preserves **bounded risk** versus deferred high-surface work (`POST /api/convert`).
- It is **directly comparable** to Step 10 for verification posture and contract-first expectations.

#### Blocker note (only if grounded)

- **No grounded blocker recorded** for Step 12.1.1 based on the handoff package and frozen scope. If any go condition fails when commands are run, treat that as a **new grounded blocker** and stop rather than widening scope.

#### Step boundary

This step confirms entry flow and gates only and does **not** start Step 12.2.2.

### Step 12.1.2 — Scope Freeze Before Step 12 Execution

#### Confirmed entry flow reused (from Step 12.1.1)

- `api/frontend/src/converters/markdown-to-asciidoc.ts`
- `convertMarkdownToAsciiDoc(...)`
- `POST /api/to-asciidoc`

#### In scope (must remain bounded)

- Localized alignment of the Step 12 entry wrapper to preserve contract-first success/failure behavior.
- Localized preservation at the `POST /api/to-asciidoc` boundary only where required for this flow’s contract semantics.
- Minimal verification and documentation updates tied directly to this Step 12 flow.

#### Out of scope (explicitly excluded)

- Broad backend redesign, cross-route envelope redesign, or any architecture-wide refactor.
- Generic multi-format family migration via `POST /api/convert`.
- Broad frontend/UI redesign or app-wide entrypoint-routing consolidation.
- Any migration execution on additional flows beyond the confirmed Step 12 entry flow.

#### Deferred (must stay deferred)

- `POST /api/convert` broad-family work until a separately bounded sub-slice is explicitly selected.
- Any migration targets other than `markdown-to-asciidoc.ts` + `POST /api/to-asciidoc`.
- Future planning/synthesis work beyond this Step 12 scope freeze.

#### Execution boundaries (non-expansion rule)

- Scope must not expand beyond the single wrapper + single route boundary above.
- If safe completion would require unbounded backend changes, broad UI redesign, or multi-flow expansion, treat it as a grounded blocker: document it and stop.
- No “scope creep by convenience”: any item not explicitly in scope remains excluded unless a real blocker is proven.

#### Why this scope freeze keeps Step 12 controlled

- It keeps Step 12 comparable to the validated Step 10/11 planning model (single bounded unit).
- It protects non-regression by avoiding premature expansion into high-surface deferred candidates.
- It keeps rollback and verification tractable by limiting touched surfaces before migration work begins.

#### Step boundary

This step freezes Step 12 scope only and does **not** start Step 12.2.2.

### Step 12.2.1 — Current Runtime Flow Mapping (Before Helper Integration)

#### Flow under inspection

- **Step 12 execution flow:** Markdown -> AsciiDoc wrapper path
- **Frontend entry:** `api/frontend/src/converters/markdown-to-asciidoc.ts` -> `convertMarkdownToAsciiDoc(...)`
- **Backend endpoint:** `POST /api/to-asciidoc` (`api/backend/routes/conversion.routes.js`)

#### Entry point

- UI calls `convertMarkdownToAsciiDoc(text, setStatus, setOutput, setLoading, setNotification, [setConversionMode])`.
- Wrapper performs local precheck (`!text.trim()`), sets runtime UI state, then calls `fetch(${API_BASE}/api/to-asciidoc)` with JSON body `{ text }`.

#### Main converter / wrapper

- **Frontend wrapper:** `convertMarkdownToAsciiDoc(...)` (UI-driven async wrapper; no returned result object).
- **Backend conversion engine:** `convertMarkdownWithPandoc(text)` inside route `/to-asciidoc`.
- **Contract builders at backend boundary:** `createSuccessResult(...)` on success and `createFailureResult(...)` via `buildToAsciidocFailure(...)` on failure.

#### Input parameters

- **Frontend wrapper input:** Markdown `text` plus setter callbacks (`setStatus`, `setOutput`, `setLoading`, `setNotification`, optional `setConversionMode`).
- **Backend route input:** `req.body.text` (validated as string by `validate(...)` + zod schema), then route-level empty-input guard.

#### Temporary file handling

- **Frontend wrapper:** none.
- **Backend `/to-asciidoc` route path:** in-memory request/response contract metadata (`in-memory://...`) and no explicit temp-file write/cleanup in this route path.

#### Success path (current runtime)

1. Wrapper sets status/loading (+ optional conversion mode) and calls backend.
2. Backend validates request, checks non-empty input, runs `convertMarkdownWithPandoc(text)`.
3. Backend computes `finishedAt`/`durationMs`, builds `conversionResult` with:
   - output metadata (`outputFile`, size, mime),
   - `warnings: []`, `logs: []`,
   - route meta (`/api/to-asciidoc`, `in-memory`).
4. Backend responds `200` with `{ asciidoc, conversionResult }`.
5. Wrapper currently reads `data.asciidoc`, sets output/status/success notification.

#### Failure path (current runtime)

- **Backend failures:**
  - Empty input -> `400` standardized failure from `buildToAsciidocFailure(...)` (+ `detail`).
  - Internal conversion errors -> classified by `classifyToAsciidocInternalError(...)`, then `500` standardized failure (+ `detail`).
- **Frontend failures:**
  - Non-OK HTTP -> wrapper throws `Error("Erreur HTTP ...")` after reading text.
  - Abort/network/other errors handled in `catch` -> status + error notification set.
  - `finally` always clears loading state.

#### Return / throw behavior

- **Wrapper external behavior:** returns `Promise<void>` and does not propagate typed result objects.
- **Control style:** mixed internal style (early `return` on empty input + `throw` on non-OK HTTP + `catch` handling), but outwardly no uncaught error is intentionally exposed.
- **Backend route:** returns JSON success or failure payloads (does not return JS exceptions to caller).

#### Where duration, logs, warnings, output, and error are produced

- **Duration:** backend route computes `durationMs` at success/failure result creation time.
- **Warnings/logs:** backend result builders currently emit `warnings: []` and `logs: []` (explicit empty arrays).
- **Output:** backend success payload includes `asciidoc`; frontend uses `data.asciidoc` to update UI output.
- **Error:** backend standardized failure includes structured `error` (+ `error.code`) and `detail`; frontend currently consumes transport/error text in catch branches rather than parsing standardized failure payload as source-of-truth.

#### Integration-relevant observations (pre-12.2.2)

- Backend already emits standardized `ConversionResult` on both success/failure at route boundary.
- Frontend wrapper remains legacy-shaped (output field + thrown HTTP error text) and is not yet contract-first on `conversionResult` / structured failure semantics.
- This creates a known success/failure envelope mismatch at the wrapper ingestion point, which is the primary integration target for Step 12 helper mapping/alignment.

#### Step boundary

This step maps current runtime behavior only and does **not** start Step 12.2.3.

### Step 12.2.2 — Helper Payload Mapping (Before Integration)

This mapping reuses the Step 12.2.1 runtime flow and defines practical payload sourcing for `createSuccessResult(payload)` and `createFailureResult(payload)` for the `markdown-to-asciidoc` flow.

#### Mapping status legend

- **Direct:** directly available from current runtime inputs/results.
- **Derivable:** can be computed locally from available data.
- **Default:** expected helper/default value when not explicitly set.
- **Missing:** not currently available at wrapper level without additional wiring.

#### `createSuccessResult(payload)` mapping

| Field | Mapping status | Practical source for Step 12 flow |
|---|---|---|
| `conversionId` | Direct | `conversionResult.conversionId` from backend success payload. |
| `converter` | Direct | `conversionResult.converter` (backend currently sets `pandoc`). |
| `pipeline` | Direct | `conversionResult.pipeline` (backend currently `['markdown->asciidoc']`). |
| `inputFormat` | Direct | `conversionResult.inputFormat` (`markdown`). |
| `outputFormat` | Direct | `conversionResult.outputFormat` (`asciidoc`). |
| `inputFile` | Direct | `conversionResult.inputFile` from backend boundary result. |
| `outputFile` | Direct | `conversionResult.outputFile` from backend boundary result. |
| `startedAt` | Direct | `conversionResult.startedAt`. |
| `finishedAt` | Direct | `conversionResult.finishedAt`. |
| `durationMs` | Direct | `conversionResult.durationMs`. |
| `warnings` | Direct | `conversionResult.warnings` (currently explicit empty array). |
| `logs` | Direct | `conversionResult.logs` (currently explicit empty array). |
| `meta` | Direct | `conversionResult.meta` (route/transport metadata). |

#### `createFailureResult(payload)` mapping

| Field | Mapping status | Practical source for Step 12 flow |
|---|---|---|
| `conversionId` | Direct | `failure.conversionId` when backend returns standardized failure. |
| `converter` | Direct | `failure.converter` from backend failure result (`pandoc`). |
| `pipeline` | Direct | `failure.pipeline` from backend failure result. |
| `inputFormat` | Direct | `failure.inputFormat` from backend failure result. |
| `outputFormat` | Direct | `failure.outputFormat` from backend failure result. |
| `inputFile` | Direct | `failure.inputFile` from backend failure result. |
| `outputFile` | Direct | `failure.outputFile` (currently null on route failures). |
| `startedAt` | Direct | `failure.startedAt` from backend failure result. |
| `finishedAt` | Direct | `failure.finishedAt` from backend failure result. |
| `durationMs` | Direct | `failure.durationMs` from backend failure result. |
| `warnings` | Direct | `failure.warnings` (currently explicit empty array). |
| `logs` | Direct | `failure.logs` (currently explicit empty array). |
| `meta` | Direct | `failure.meta` from backend failure result. |
| `error` | Direct | `failure.error` (structured code/message/details). |

#### Locally derivable fields (fallback when structured boundary payload is unavailable)

- `inputFormat`: fixed flow constant `markdown`.
- `outputFormat`: fixed flow constant `asciidoc`.
- `pipeline`: fixed flow constant `['markdown->asciidoc']`.
- `converter`: fixed flow expectation `pandoc` for this route.
- `inputFile.size`: derivable from source text length when needed.

#### Helper-default fields (bounded fallback)

- `warnings`: helper default empty array if absent.
- `logs`: helper default empty array if absent.
- `meta`: helper/route default object if absent.
- `outputFile`: helper default `null` on failures without produced output.

#### Currently missing at wrapper level (without additional integration wiring)

- Guaranteed structured failure payload ingestion in all wrapper error branches (current wrapper throws/parses text on non-OK before contract-first mapping).
- Local generation of trustworthy `startedAt`/`finishedAt`/`durationMs` values equivalent to backend contract quality if backend payload is not consumed.
- Reliable `conversionId` in transport/network failure branches where no backend JSON payload is available.

#### Integration-relevant note

- The backend already provides nearly all required payload fields directly for both success and failure; Step 12 helper integration should prioritize **making the wrapper consume standardized backend `conversionResult`/failure objects first**, with local derivation/defaults only as bounded fallback.

#### Step boundary

This step defines helper payload mapping only and does **not** start Step 12.2.3.

### Step 12.2.6 — Isolated Verification After 12.2.3 / 12.2.4 / 12.2.5

#### Verification scope

- Flow under verification: `POST /api/to-asciidoc` (Step 12 selected flow).
- Verification style reused from `api/backend/scripts/`:
  - `verify-e2e-to-asciidoc-success-contract.js`
  - `verify-e2e-to-asciidoc-failure-contract.js`
  - `verify-e2e-to-asciidoc-representative-scenarios.js`
  - `verify-e2e-to-asciidoc-internal-error-contract.js`

#### Scenarios executed

- **Nominal success scenario:** markdown heading/paragraph input -> HTTP 200 with `asciidoc` + standardized `conversionResult`.
- **Grounded failure scenario:** empty/blank markdown input -> HTTP 400 with standardized failure `ConversionResult` and structured `error.code = EMPTY_INPUT`.
- **Small baseline scenario set:** representative script covering two success inputs and two EMPTY_INPUT failures.
- **Internal-error harmonization check:** forced internal Pandoc error path -> HTTP 500 standardized failure `ConversionResult` with grounded internal classification.

#### Results

- **Success status:** PASS — success response includes `conversionResult` with expected root contract fields.
- **Failure status:** PASS — failure responses include standardized root fields, structured `error.code`, and `detail` aligned to `error.message`.
- **Baseline status:** PASS — representative scenario set validated for `/api/to-asciidoc`.
- **Internal-error status:** PASS — internal path remains within standardized failure contract after harmonization.

#### Tiny fix note

- No additional code fix was required for Step 12.2.6 verification.  
- Operational note: one combined multi-script run stalled after the representative checks; re-running the internal-error script in isolation completed successfully and confirmed contract behavior.

#### Step boundary

This step verifies the isolated Step 12 flow only and does **not** start Step 12.3.1.

### Step 12.3.1 — Identify the Real Backend/Orchestrator Alignment Target (Step 12)

#### Step 12 flow under inspection

- **Frontend entry (Step 12 scope):** `api/frontend/src/converters/markdown-to-asciidoc.ts` -> `convertMarkdownToAsciiDoc(...)` -> **`POST /api/to-asciidoc`**
- **Backend surface:** Express route handler in **`api/backend/routes/conversion.routes.js`** for **`POST /to-asciidoc`** (mounted under `/api`).

#### Backend coordination layers actually involved

1. **HTTP + routing:** Express `router.post('/to-asciidoc', ...)`.
2. **Request validation:** `validate({ body: z.object({ text: z.string() }) })` (schema middleware).
3. **Route-level precheck:** empty/whitespace input -> standardized failure via `buildToAsciidocFailure(...)` (HTTP `400`).
4. **Conversion engine call:** `convertMarkdownWithPandoc(text)` from **`api/backend/services/conversion/convert.js`** (Pandoc subprocess, temp files under OS temp dir, cleanup in `finally`).
5. **Contract assembly:** `createSuccessResult(successPayload)` on success; `buildToAsciidocFailure(...)` -> `createFailureResult(failurePayload)` on failure; `classifyToAsciidocInternalError(...)` for internal classification; nested catch fallback for secondary internal failures (Step 12.2.5).

**Not involved for this route:** `lazyload.runConverter(...)` / module registry path (used by other flows such as `/api/to-markdown`, but **not** the Step 12 `to-asciidoc` handler).

#### True backend/orchestrator alignment target (chosen)

- **Primary alignment target:** **`api/backend/routes/conversion.routes.js`** — the **`/to-asciidoc`** route handler and its **local helpers** in the same file (`buildToAsciidocFailure`, `classifyToAsciidocInternalError`, response shaping with `detail`).

#### Why this is the correct layer

- It is the **HTTP boundary** where standardized `ConversionResult` success/failure is assembled and returned to the client.
- It is where **route-level contract risks** are controlled (precheck, internal error classification, harmonized catch-path behavior) without depending on a separate lazy-load orchestration hop for this flow.
- Engine behavior (`convertMarkdownWithPandoc`) is a **downstream dependency**; alignment work should preserve conversion semantics and focus contract preservation at the **route boundary** first.

#### Step boundary

This step identifies the alignment target only and does **not** start Step 12.3.2.

### Step 12.3.2 — Backend/Orchestrator Flow Map (Step 12 via 12.3.1 Target)

- **Flow name:** Step 12 execution entry — Markdown → AsciiDoc via `POST /api/to-asciidoc`
- **Confirmed backend target:** `api/backend/routes/conversion.routes.js` (`router.post('/to-asciidoc', ...)`)

#### Success flow (backend)

1. **HTTP entry:** `POST /api/to-asciidoc` → `conversion.routes.js`.
2. **Request validation:** `validate.middleware.js` + Zod ensures `{ text: string }` (schema-level validation before the route handler runs).
3. **Route precheck:** if `!text.trim()` → standardized failure path (see failure flow) and **does not** call Pandoc.
4. **Engine call (non-contract string result):** `convertMarkdownWithPandoc(text)` in `api/backend/services/conversion/convert.js`:
   - writes temp input under OS temp dir, runs Pandoc subprocess, reads output string, cleans up temp artifacts in `finally`.
   - returns **plain AsciiDoc text** (not a `ConversionResult`).
5. **Timing + contract assembly at route boundary:** route computes `finishedAt` and `durationMs`, builds `successPayload`, then:
   - `conversionResult = createSuccessResult(successPayload)`.
6. **HTTP response:** returns **200** with `{ asciidoc, conversionResult }` (AsciiDoc output duplicated: top-level `asciidoc` string plus standardized nested `conversionResult`).

#### Failure flow (backend)

Failures are produced **in the route** (and optionally triggered by engine throws); there is **no lazy-load orchestration hop** for this endpoint.

1. **Route precheck failure (`EMPTY_INPUT`):**
   - If `!text.trim()` after schema validation → `buildToAsciidocFailure(...)` → `createFailureResult(...)` inside `buildToAsciidocFailure`.
   - Returned as **400** `{ ...failure, detail: failure.error.message }`.
2. **Engine / Pandoc execution failures:**
   - `convertMarkdownWithPandoc(text)` throws → caught by route `catch`.
   - `classifyToAsciidocInternalError(error)` maps message patterns to `CONVERSION_FAILED` vs `INTERNAL_ERROR`.
   - `buildToAsciidocFailure(...)` → standardized failure returned as **500** `{ ...failure, detail: failure.error.message }`.
3. **Secondary internal failure in failure construction (Step 12.2.5):**
   - If building the primary failure response throws, nested `catch` returns a fallback standardized `INTERNAL_ERROR` still via `buildToAsciidocFailure(...)`.

**Note:** invalid JSON / schema validation failures are handled by middleware and may **not** be a standardized `ConversionResult` (known cross-route pattern; grounded contract-risk point).

#### Standardized result — first creation point + upward propagation

- **First standardized success creation:** `createSuccessResult(successPayload)` in **`conversion.routes.js`** immediately after successful `convertMarkdownWithPandoc(text)` returns output text.
- **First standardized failure creation:** `createFailureResult(failurePayload)` inside **`buildToAsciidocFailure(...)`** (same file), invoked from route precheck and from error handling paths.
- **Propagation upward:** there is **no intermediate orchestrator layer** for this flow:
  - Engine returns **text only** upward to the route.
  - Route is the **sole** layer that constructs standardized `ConversionResult` and emits the HTTP JSON response.

#### Grounded backend contract-risk points (Step 12)

- **HTTP envelope asymmetry:** success nests standardized result under `conversionResult`, while failures are **root-level** standardized `ConversionResult` plus `detail` (same structural pattern as other dedicated routes).
- **Middleware validation bypass risk:** Zod `validate(...)` failures can return non-`ConversionResult` error shapes unless separately standardized at the boundary.
- **Internal error classification brittleness:** `classifyToAsciidocInternalError` relies on substring matching of `error.message` for Pandoc-related cases; message drift can change `CONVERSION_FAILED` vs `INTERNAL_ERROR` classification.
- **Engine error abstraction:** `convertMarkdownWithPandoc` may throw/rethrow generic wrapper errors, reducing structured signal before route classification.

#### Step boundary

This step maps backend flow behavior only and does **not** start Step 12.3.3.

### Step 12.3.3 — Backend Contract-Risk Points + Target Behavior (Step 12)

- **Flow name:** Step 12 execution entry — Markdown → AsciiDoc via `POST /api/to-asciidoc`
- **Confirmed backend target:** `api/backend/routes/conversion.routes.js` (`router.post('/to-asciidoc', ...)`)
- **Uses:** backend/orchestrator flow map from **Step 12.3.2**

#### Where standardized `ConversionResult` may still be reshaped / stripped / wrapped / rebuilt / bypassed

- **(Risk) HTTP response envelope asymmetry at the route boundary**
  - Success: `{ asciidoc, conversionResult }` (standardized result is *nested* under `conversionResult`).
  - Failure: `{ ...failureResult, detail }` (standardized result is *root-level* plus `detail`).
  - Risk: consumers may treat only `asciidoc` / `detail` and ignore structured fields.
- **(Risk) Middleware validation bypass**
  - Invalid JSON / Zod schema failures may return `{ error, issues }` rather than a `ConversionResult` (known cross-route pattern).
  - Risk: contract-first clients cannot rely on a single failure shape for all HTTP error paths.
- **(Risk) Engine throws as unstructured signals**
  - `convertMarkdownWithPandoc` throws/rethrows errors that are not `ConversionResult`; classification depends on `classifyToAsciidocInternalError` message heuristics.
  - Risk: message drift changes `CONVERSION_FAILED` vs `INTERNAL_ERROR` without a structured code from the engine.
- **(Risk) Failure-construction path complexity**
  - Primary failure build + nested fallback (Step 12.2.5) can mask the original exception if the primary failure builder throws.
  - Risk: loss of diagnostic fidelity unless `details`/`stage` fields remain explicit and stable.

#### Safe points (already aligned / low drift)

- **(Safe) Route-local standardized builders for `/to-asciidoc`**
  - Success uses `createSuccessResult(successPayload)` after engine output is known.
  - Failure uses `buildToAsciidocFailure(...)` -> `createFailureResult(failurePayload)` for grounded route failures.
- **(Safe) No lazy-load orchestration hop for this route**
  - There is no second layer that can silently convert standardized results into legacy module shapes (unlike lazyload-preserved flows).
- **(Safe) Isolated verification evidence (Step 12.2.6)**
  - Success/failure/internal-error scripts confirm standardized root fields for the primary route paths.

#### Points that still need explicit alignment awareness (not necessarily broken)

- **Middleware error shape** remains a separate compatibility surface from route-standardized failures.
- **Message-based internal classification** should be treated as a stability dependency (tests/docs), not a semantic guarantee from Pandoc.

#### Target backend behavior (Step 12) — before remediation

**Success preservation**

- Return **200** with:
  - `asciidoc: string` (AsciiDoc output text)
  - `conversionResult: ConversionResult` where:
    - `success === true`
    - `error === null`
    - required root fields exist (including `warnings`, `logs`, `meta` collections)
- Do not replace `conversionResult` with ad-hoc legacy success objects.

**Failure preservation**

- For route-handled failures (`400`/`500` from `/to-asciidoc`), return a **root-level** standardized failure `ConversionResult` plus `detail`:
  - `success === false`
  - structured `error` with stable `error.code` where grounded (`EMPTY_INPUT`, `CONVERSION_FAILED`, `INTERNAL_ERROR`, etc.)
  - required root fields remain present
- Do not flatten structured failures to string-only responses at the route boundary.

**Internal coordination errors**

- Engine/internal errors must be converted into standardized failures via `buildToAsciidocFailure` + classification, not surfaced as raw unhandled exceptions at the HTTP boundary.
- If failure construction itself fails, fallback must still be a standardized `INTERNAL_ERROR` with explicit `details.stage` semantics (as implemented in Step 12.2.5).

**Acceptable enrichment**

- Adding `detail` alongside structured `error` for client compatibility.
- Enriching `meta` with route-scoped keys **without** deleting/overwriting meaningful existing `meta` from builders.
- Appending safe diagnostic fields under `error.details` / `details.stage` when grounded.

**Unacceptable reshaping / flattening**

- Returning responses that omit required `ConversionResult` root fields for `/to-asciidoc` success/failure paths that are intended to be contract-first.
- Replacing structured `error` with a string-only error model at the route boundary.
- Stripping `error.code`, `pipeline`, `warnings`, `logs`, or `meta` collections from standardized results.

#### Step boundary

This step defines risk points and target behavior only and does **not** start Step 12.3.4.

### Step 12.3.4 — Backend/Orchestrator Remediation (Step 12)

#### What was remediated (minimal, route + engine for this flow)

- **`convertMarkdownWithPandoc` error preservation:** `api/backend/services/conversion/convert.js` now rethrows wrapper errors with **`Error` `cause` chaining** so the original Pandoc-path error is not discarded behind a generic message-only surface.
- **Route classification uses full error context:** `api/backend/routes/conversion.routes.js` adds `collectAsciidocErrorMessages(...)` and updates `classifyToAsciidocInternalError` to classify using the **concatenated message chain** (including `error.cause`), keeping `CONVERSION_FAILED` vs `INTERNAL_ERROR` grounded on real Pandoc semantics where possible.

#### Verification (isolated)

- Re-ran existing scripts: `verify-e2e-to-asciidoc-success-contract.js`, `verify-e2e-to-asciidoc-failure-contract.js`, `verify-e2e-to-asciidoc-representative-scenarios.js`, `verify-e2e-to-asciidoc-internal-error-contract.js`.

#### Step boundary

This step applies localized backend remediation only and does **not** start Step 12.3.5.

### Step 12.3.5 — Backend/Orchestrator Remediation Verification and Consolidation (Step 12)

#### What was verified (post-12.3.4)

- **Standardized success preservation:** HTTP **200** responses still return `asciidoc` plus nested `conversionResult` produced by `createSuccessResult(...)`, with required root fields intact (scripts assert the full success contract).
- **Standardized failure preservation:** HTTP **400** / **500** responses still return **root-level** standardized failure `ConversionResult` objects (not string-only errors), with legacy `detail` alongside structured `error`.
- **Structured `error` + `error.code`:** failure scripts assert `error.code` is present and stable for grounded cases (e.g. `EMPTY_INPUT`); internal-error script asserts `CONVERSION_FAILED` for the forced Pandoc-path failure.
- **Internal coordination / engine errors:** forced `convertMarkdownWithPandoc` failure is converted to a standardized route failure (HTTP **500**) without bypassing the contract; nested failure-construction fallback remains available (Step 12.2.5).

#### Checks re-run (this flow)

- `api/backend/scripts/verify-e2e-to-asciidoc-success-contract.js`
- `api/backend/scripts/verify-e2e-to-asciidoc-failure-contract.js`
- `api/backend/scripts/verify-e2e-to-asciidoc-representative-scenarios.js`
- `api/backend/scripts/verify-e2e-to-asciidoc-internal-error-contract.js`

**Result:** all passed in a single chained run after a tiny verification-script stabilization (see below).

#### Tiny follow-up fix (verification harness only)

- **`verify-e2e-to-asciidoc-representative-scenarios.js`:** added explicit `process.exit(...)` with the same short delayed pattern used by other e2e scripts so chained verification runs do not hang waiting for the Node event loop to empty.

#### Consolidation statement

- The Step 12 backend/orchestrator layer for `POST /api/to-asciidoc` is **verified** to preserve standardized `ConversionResult` semantics for success and failure paths after Step 12.3.4, with structured `error` data intact and internal errors routed through the standardized failure builders.

#### Step boundary

This step completes backend/orchestrator verification/consolidation for Step 12 and does **not** start Step 12.4.1.

### Step 12.4.1 — Identify the Real Frontend/UI Alignment Target (Step 12)

- **Flow name:** Step 12 execution entry — Markdown → AsciiDoc (`POST /api/to-asciidoc`)
- **Goal of this step:** identify the true frontend/UI target where Step 12 success/failure semantics are first consumed and where contract preservation can still drift.

#### Frontend/UI layers involved (real Step 12 context)

- **Wrapper conversion layer (Step 12 entry module from the Step 11 handoff):**
  - `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`)
  - Calls `POST /api/to-asciidoc`, drives UI via setters (`setStatus`, `setOutput`, `setLoading`, `setNotification`, optional `setConversionMode`).
- **App state/render layer (global UI owner):**
  - `api/frontend/src/App.tsx` owns visible UI state (source/result panels, loading, notifications, modals, format selection) and wires conversion actions.
- **Active general conversion path (reference boundary for the same endpoint):**
  - `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`) is invoked by `App.tsx` for the **simple** Markdown → AsciiDoc path (`sourceFormat === 'markdown'` && `targetFormat === 'asciidoc'`) and uses **`/api/to-asciidoc`** as the HTTP endpoint.

#### Chosen frontend/UI alignment target

- **Primary Step 12 frontend/UI alignment target:** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`)

#### Why this is the correct focus

- **It is the Step 12 selected execution surface from the Step 11 handoff package** and therefore the intended bounded migration/alignment unit for this cycle.
- **It is the first consumption boundary for Step 12 backend contract semantics within this flow** (HTTP response parsing + mapping into UI state).
- **It is where success/failure can still be locally reshaped** (legacy `data.asciidoc` focus, thrown HTTP errors, catch-branch messaging) before UI setters, making it the most relevant place to verify/preserve standardized semantics for this specific wrapper.
- **Current runtime note:** the active app path for this format pair is still **`convertText(...)`** (`generic-converter.ts`), so Step 12 frontend alignment remains intentionally scoped to **wrapper-level** correctness (parallel to Step 10) before any broader routing consolidation.

#### Step boundary

This step identifies the frontend/UI alignment target only and does **not** start Step 12.4.2.

### Step 12.4.2 — Frontend/UI Flow Map (Step 12 via 12.4.1 Target)

- **Flow name:** Step 12 execution entry — Markdown → AsciiDoc (`POST /api/to-asciidoc`)
- **Confirmed frontend/UI target:** `convertMarkdownToAsciiDoc(...)` in `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Success flow (frontend/UI)

1. **Wrapper entry:** `convertMarkdownToAsciiDoc(text, setStatus, setOutput, setLoading, setNotification, [setConversionMode])`.
2. **Local precheck:** if `!text.trim()` → sets status string and **returns early** (no network call; no `ConversionResult` involved).
3. **Pre-attempt UI:** sets status (“conversion in progress”), `loading=true`, optional `setConversionMode('md-to-adoc')`.
4. **HTTP call:** `fetch(POST ${API_BASE}/api/to-asciidoc, { text })` with 30s abort timeout.
5. **Success HTTP branch (`res.ok`):**
   - `data = await res.json()`
   - **Output extraction:** `setOutput(data.asciidoc ?? "")` (legacy top-level output field).
   - **Backend `ConversionResult`:** present on success responses as `data.conversionResult`, but **not read or validated** in the current wrapper implementation.
   - **User feedback:** success status string + success `setNotification`.

#### Failure flow (frontend/UI)

1. **HTTP non-OK (`!res.ok`):**
   - Reads **raw** `res.text()` into `errorText`, then **throws** `Error("Erreur HTTP ...")` (stringly error path).
   - Structured standardized failure JSON from the backend is **not parsed** as `ConversionResult` in this branch.
2. **Abort / timeout:** `AbortError` → status + error notification (client-local message).
3. **Network-ish errors:** substring match on `e.message` for `NetworkError` / `Failed to fetch` → dedicated messaging.
4. **Other errors:** generic catch message `Erreur lors de l'appel à l'API : ...` from `e.message`.
5. **Finally:** `setLoading(false)` always runs.

#### Where the backend `ConversionResult` is first consumed (current wrapper)

- **Success:** the first point the backend response is interpreted is `await res.json()`, but the wrapper **only** uses `data.asciidoc` for output. **`data.conversionResult` is not consumed** (not validated, not mapped, not forwarded to state beyond implicit coupling via the duplicate `asciidoc` string).
- **Failure:** the first point is either raw `res.text()` (non-OK) or exception text in `catch`. **Structured `error` / `error.code` from standardized failure bodies are not consumed** as the source of truth.

#### How state and rendering move (wrapper-level)

- The wrapper has **no internal React state**; it only invokes **callbacks** passed from the parent:
  - **`setOutput`** updates whatever the parent binds (typically result panel / AsciiDoc buffer).
  - **`setStatus`**, **`setLoading`**, **`setNotification`** update chrome messaging and spinner behavior.
  - Optional **`setConversionMode`** updates mode indicator when provided.
- **Parent wiring (`App.tsx`) is not executed in this wrapper path** unless a caller explicitly uses this function; the active production path for the same endpoint is `convertText(...)` (see Step 12.4.1).

#### Grounded frontend/UI risks (flattening / reshaping / ignoring / stale-state)

- **Ignoring standardized success `conversionResult`:** success UI is driven by **`asciidoc` string only**, so contract fields (warnings/logs/meta/timing) are invisible at this layer.
- **Flattening structured failures:** non-OK responses become a **single thrown string**; **`error.code` is not preserved** through to UI semantics.
- **Stale output risk:** failure paths **do not clear** `setOutput`; if a prior attempt produced output, a failed attempt may leave **stale AsciiDoc visible** unless the parent clears it elsewhere.
- **Envelope mismatch:** backend success nests `conversionResult` while failures are root-level + `detail`; the wrapper does not implement explicit dual-shape parsing.

#### Step boundary

This step maps frontend/UI runtime behavior only and does **not** start Step 12.4.3.

### Step 12.4.3 — Frontend/UI Contract-Risk Points + Target Behavior (Step 12)

- **Flow name:** Step 12 — legacy wrapper Markdown → AsciiDoc (`POST /api/to-asciidoc`)
- **Confirmed frontend/UI target:** `api/frontend/src/converters/markdown-to-asciidoc.ts` → `convertMarkdownToAsciiDoc(...)`
- **Basis:** Reuses the **Step 12.4.2** frontend/UI flow map (success/failure branches, first parse point, setter propagation). This step defines **risk** and **target behavior** only (no code changes).

#### Contract-risk points (grounded)

1. **Success: `conversionResult` ignored; output driven by `asciidoc` string only**
   - **Where:** `res.ok` branch after `await res.json()`.
   - **Risk:** **flattening** / **partial ignore** — warnings/logs/meta/timing and success validation (`success === true`) are not applied; UI can look “successful” from strings while contract semantics are unknown.

2. **Failure: HTTP non-OK reduced to thrown string**
   - **Where:** `!res.ok` → `res.text()` → `throw new Error(...)`.
   - **Risk:** **flattening** — structured backend `error` / `error.code` / root-level `ConversionResult` not consumed; notifications reflect HTTP text only.

3. **Stale output on failed attempts**
   - **Where:** failure branches do not call `setOutput('')` or equivalent.
   - **Risk:** **stale-state misuse** — previous AsciiDoc may remain visible after a failed attempt.

4. **Envelope asymmetry not handled**
   - **Where:** success expects `{ asciidoc, conversionResult }`; failures are root-level standardized result + `detail`.
   - **Risk:** **reshaping** / **partial ignore** — no explicit dual-path JSON parsing; failures may never be interpreted as standardized objects.

5. **Client-only error classification**
   - **Where:** `catch` uses `AbortError`, network substring checks, generic `e.message`.
   - **Risk:** **acceptable** for true client faults; **misleading** if a structured backend failure could have been parsed but was not attempted.

6. **Dual-path drift vs `convertText(...)`**
   - **Where:** `App.tsx` uses `convertText(...)` for the same endpoint pair; this wrapper is optional/legacy.
   - **Risk:** **inconsistent** contract-first behavior for identical backend routes unless both paths are aligned and documented.

7. **No callback for backend `ConversionResult` / app-level contract state**
   - **Where:** wrapper only exposes string/status setters (no `setBackendConversionResult`-style hook in current signature).
   - **Risk:** **partial ignore** at app level — structured results never reach global contract state when this wrapper is used.

#### Points that already look safe / protective

- **S1 — Loading lifecycle:** `setLoading(true)` for the attempt; `finally` always clears loading.
- **S2 — Local empty precheck:** avoids a network call when input is empty (client-side guard; distinct from backend `EMPTY_INPUT`).
- **S3 — Bounded timeout:** AbortController limits hung requests (client-side safety).

#### Points that still need alignment work (before / during 12.4.4)

- **A1 — Contract-first success:** validate `data.conversionResult` before treating the attempt as success; derive `output` from contract + `asciidoc` consistently.
- **A2 — Contract-first failure:** parse JSON for standardized failure on non-OK before falling back to text.
- **A3 — Stale output:** clear or mark invalid output at attempt start and/or on failure when integrated with the result panel.
- **A4 — Dual path:** keep wrapper behavior aligned with `convertText(...)` for `/api/to-asciidoc`, or document intentional divergence.

#### Target frontend/UI behavior (definition for Step 12 — basis for 12.4.4)

##### Success handling

- **Must** treat the attempt as successful only when the backend provides a standardized success `ConversionResult` (`success === true`, `error === null`) with required fields, carried under `data.conversionResult` for this route.
- **Must** use `conversionResult` as the source of truth for success semantics; **must not** infer success from non-empty `asciidoc` alone.
- **May** set visible AsciiDoc output from `data.asciidoc` **after** success semantics are validated (or from fields inside `conversionResult` when consistent).

##### Failure handling

- **Must** parse standardized failure JSON on non-OK HTTP when the body is JSON, preserving `error` and `error.code` when present.
- **Must** use structured backend failures as the canonical failure record when available; use synthetic client failures only when no structured body exists.

##### Idle / loading / success / error transitions

- **Must** keep loading coherent: `true` during the attempt, `false` in `finally`.
- **Should** avoid presenting a success notification when the backend success contract is not satisfied.
- **Must not** leave prior attempt output visible as if it were the result of a failed attempt when the result panel is contract-integrated (stale-output rule).

##### Acceptable interpretation

- **Acceptable:** user-facing French strings in `setStatus` / `setNotification` as long as structured contract semantics remain available to the caller (via future callbacks or return shape in a later step).
- **Acceptable:** bounded client-only messages for true timeout/network faults when no backend body exists.

##### Unacceptable flattening or stale-state behavior

- **Unacceptable:** treating HTTP 200 as success if `conversionResult` is missing or `conversionResult.success !== true`.
- **Unacceptable:** discarding structured `error.code` when a standardized failure body is available.
- **Unacceptable:** string-only failure UX when JSON `ConversionResult` failure was available to parse.
- **Unacceptable:** showing stale AsciiDoc output after a failed attempt without explicit clearing or error-state marking.

#### Step boundary

This step defines frontend/UI risk and target behavior only and does **not** start Step 12.4.4.

### Step 12.4.4 — Frontend/UI remediation (Markdown → AsciiDoc wrapper)

- **Implemented in:** `api/frontend/src/converters/markdown-to-asciidoc.ts` → `convertMarkdownToAsciiDoc(...)`.
- **English note:** Success is gated on backend `data.conversionResult` (`success === true`) before writing `asciidoc` output. Non-OK bodies are read once as text then JSON-parsed so structured `error` / `error.code` are preserved when present. Optional `setBackendConversionResult` and `setConversionUiState` align with the Step 10 wrapper; output and backend result are cleared at attempt start to avoid stale success/error UI.

#### Step boundary

This step implements Step 12 wrapper remediation only and does **not** start Step 12.4.5.

### Step 12.4.5 — Verification + consolidation (Step 12 wrapper)

- **Scope:** `api/frontend/src/converters/markdown-to-asciidoc.ts` → `convertMarkdownToAsciiDoc(...)` only.
- **English verification note:** Success path requires `data.conversionResult` with `success === true` before `setOutput(data.asciidoc)`. HTTP failures use a single body read (`text` + `JSON.parse`); root-level standardized failures feed `createFailureResult` so `error.code` survives normalization; the structured branch stores the same normalized object as the return value. Each new attempt clears notification, output, and optional backend result, sets loading, then optional UI state `loading`; `finally` always clears loading. Client-only failures (empty precheck, timeout, network) emit synthetic `ConversionResultFailure` with explicit meta. Tiny follow-up: precheck clears notification to avoid a stale success toast; structured HTTP failure uses one normalized object for both callback and return.

#### Step boundary

This step records verification only and does **not** start Step 12.6.1.

### Step 12.5.1 — Cross-flow comparison (Step 12 vs validated flows)

**Step 12 scope (this comparison):** backend route `POST /api/to-asciidoc` plus frontend wrapper `api/frontend/src/converters/markdown-to-asciidoc.ts` → `convertMarkdownToAsciiDoc(...)`.

**Validated / peer reference (already documented baseline):** the multi-flow baseline includes **Markdown → AsciiDoc** as the second migrated flow (see Step 7.6.2 / Step 8.6.2). The closest **wrapper-level** peer for frontend behavior is **Step 10** (`convertAsciiDocToMarkdown`, `POST /api/to-markdown`): same intentional pattern (contract-first wrapper, `App.tsx` still primarily uses `convertText(...)`). Other validated flows (**Text → Markdown**, Step 7; **`POST /api/from-html`** multi-target, Step 8) share the same high-level contract + layered verification posture but differ more in engine, envelope, or UI entry (`generic-converter` emphasis); they are referenced here for baseline completeness, while **Step 10 vs Step 12** is the tightest apples-to-apples wrapper comparison.

#### Converter result construction

| Aspect | Consistent | Different but acceptable |
| --- | --- | --- |
| Backend | `createSuccessResult(...)` / `createFailureResult(...)` (or route-specific builders such as `buildToAsciidocFailure`) produce canonical `ConversionResult` shapes at the HTTP boundary; success carries nested `conversionResult`, failures are root-level standardized objects + `detail`. | Engine and payload fields differ (Pandoc markdown→asciidoc vs downdoc/lazyload markdown output for `to-markdown`). |
| Frontend wrapper | Local `createSuccessResult` / `createFailureResult` mirror backend fields into a normalized return value; empty client precheck returns synthetic `EMPTY_INPUT` failure. | Step 10’s wrapper includes optional **modal** parameters and extra branches (see below); Step 12’s wrapper does not—narrower surface. |

#### Backend / orchestrator preservation

- **Consistent:** Route-level preservation targets are explicit (`conversion.routes.js`); internal errors are classified and mapped to structured failures rather than string-only HTTP bodies; verification is script-backed (Step 12: `verify-e2e-to-asciidoc-*`; Step 10: `verify-e2e-to-markdown-*` and lazyload-oriented scripts).
- **Acceptable difference:** `to-asciidoc` uses direct Pandoc orchestration and `classifyToAsciidocInternalError` + `collectAsciidocErrorMessages`; `to-markdown` uses lazy-loaded downdoc and different failure builders—topology matches the validated “path-specific engine” rule.

#### Frontend / UI preservation

- **Consistent:** Success is **not** inferred from raw output text alone: `data.conversionResult` must exist and `success === true` before success UI and primary output write (`asciidoc` / `markdown` respectively). Non-OK responses attempt structured JSON failure consumption first. New attempts clear prior output/notification (and optional backend result holder) to limit stale UI.
- **Different but acceptable:** Step 10 wrapper wires **optional error modals** and a **code-driven** `shouldShowConversionErrorModalForCode` path plus grounded **output-shape** heuristics for known bad outputs. Step 12 wrapper has **no** modal setters—acceptable because the dominant failure modes differ and Step 12 remains wrapper-scoped.
- **Noteworthy divergence (documented elsewhere):** For the same endpoints, **`App.tsx` uses `convertText(...)`** as the live path; dedicated wrappers (Step 10 / Step 12) are **parallel, verified** surfaces until routing consolidation is explicitly in scope.

#### Error handling shape

- **Consistent:** Structured backend failures keep `error` and, where grounded, **`error.code`** in UI messaging (e.g. notification suffix) and in normalized `ConversionResult` returns. Client-only failures (timeout, network, parse) use synthetic failures with explicit `meta.stage` / `uiWrapper` for traceability.
- **Different but acceptable:** Step 12 non-OK handling uses a **single body read** (`text` then `JSON.parse`) to avoid consuming the response stream twice; Step 10’s implementation historically mixed `json`/`text` patterns in places—Step 12’s approach is a **local clarity improvement**, not a contract split.
- **May need later attention:** Long-term **deduplication** of identical helper blocks (`normalizeError`, `createSuccessResult`, etc.) across wrappers to reduce drift—out of scope for Step 12.5.1.

#### State handling

- **Consistent:** `setLoading(true)` for attempts that enter the `try`; **`finally` always** `setLoading(false)`; failure paths clear `setOutput('')` when appropriate; optional `setConversionUiState('loading' | 'success' | 'error')` when provided.
- **Different but acceptable:** Step 10 also clears optional modal state at attempt start; Step 12 has no modals—nothing to clear.

#### Verification style

- **Consistent:** **Layered** verification: backend e2e contract scripts (success, failure, representative scenarios, internal-error where applicable); frontend **documentation** of contract-first behavior and consolidation (Step 12.3.5 / 12.4.5 mirrors Step 10.3.5 / 10.4.x style).
- **Different but acceptable:** Script **names and counts** differ per route; Step 10’s backend section references additional lazyload module probes—appropriate to `to-markdown`’s architecture.

#### Summary: consistent vs acceptable vs later attention

- **Consistent:** Standardized `ConversionResult` as the semantic source of truth at the boundary and in the wrapper return path; structured failures with `error.code` where the backend supplies them; coherent loading lifecycle; stale-output mitigation on new attempts; bounded e2e verification per route.
- **Different but acceptable:** Engine/orchestration and path-specific scripts; Step 10 modal + heuristic UX vs Step 12 slimmer API; output field names (`asciidoc` vs `markdown`).
- **May need later attention (non-blocking for Step 12):** App routing vs dedicated wrappers; shared frontend helper module to avoid duplicate `createSuccessResult` / `createFailureResult` definitions; optional alignment of `convertText` with every dedicated-wrapper behavior once routing is unified.

#### Step boundary

This step records cross-flow comparison only and does **not** start Step 12.5.2.

### Step 12.5.2 — Step 6 migration playbook conformance (Step 12 flow)

**Playbook reference:** Step **6.3.3** — *Required migration checklist (items 1–17)* and *Conditional / when-applicable* notes.

**Step 12 evidence in this document:** Steps **12.1.x** through **12.5.1** (entry confirmation, scope freeze, runtime + payload mapping, backend alignment/remediation/verification, frontend alignment/remediation/verification, cross-flow comparison).

#### Checklist mapping (items 1–17)

| # | Playbook item | Step 12 evidence | Completion strength |
| --- | --- | --- | --- |
| 1 | Confirm candidate readiness (Step 6.2.2 minimum criteria) | **12.1.1** (entry flow + go/no-go from Step 11 handoff), **12.1.2** (scope freeze) | **Lighter but acceptable:** readiness is framed via Step 11 handoff + frozen scope rather than repeating Step 6.2.2 verbatim; intent matches the playbook gate. |
| 2 | Map current runtime flow (success, failure, internal error) | **12.2.1** | **Clearly completed** |
| 3 | Map payload fields into `createSuccessResult()` / `createFailureResult()` inputs | **12.2.2** | **Clearly completed** |
| 4 | Integrate standardized success-path result construction | Backend route + helpers (see **12.3.x**); **12.3.4** where relevant | **Clearly completed** |
| 5 | Integrate standardized failure-path result construction | Backend route + `buildToAsciidocFailure` pattern; **12.3.4** | **Clearly completed** |
| 6 | Harmonize internal error behavior into structured failure semantics | **12.3.4** (`collectAsciidocErrorMessages`, `classifyToAsciidocInternalError`, `convert.js` cause chaining); **12.3.5** internal-error script | **Clearly completed** |
| 7 | Run isolated converter/path verification (minimum kit) | **12.2.6**; e2e scripts listed in **12.3.5** | **Clearly completed** |
| 8 | Identify backend/orchestrator alignment target | **12.3.1** | **Clearly completed** |
| 9 | Map backend success/failure propagation and contract-risk points | **12.3.2**, **12.3.3** | **Clearly completed** |
| 10 | Apply minimal backend remediation | **12.3.4** | **Clearly completed** |
| 11 | Verify backend output boundary contract behavior | **12.3.5** | **Clearly completed** |
| 12 | Identify frontend/UI alignment target (if user-facing) | **12.4.1** | **Clearly completed** (user-facing path exists; wrapper is the bounded alignment target—see conditional note below). |
| 13 | Map frontend success/failure consumption and state behavior | **12.4.2**, **12.4.3** | **Clearly completed** |
| 14 | Apply minimal frontend remediation | **12.4.4** | **Clearly completed** |
| 15 | Verify UI boundary coherence + stale-state safeguards | **12.4.5** | **Clearly completed** |
| 16 | Final cross-layer non-regression pass (minimum kit) | **12.3.5** + **12.4.5** + chained script re-run narrative | **Clearly completed** (backend scripts explicit; frontend verified via consolidation + typecheck expectation in handoff, not a separate Step 12 vitest chapter). |
| 17 | Record path comparison/consolidation vs migrated flows | **12.5.1** | **Clearly completed** |

#### Conditional playbook items (Step 6.3.3)

- **User-facing frontend alignment:** Step 12 applies **12.4.x** to the **wrapper** (`markdown-to-asciidoc.ts`). **`App.tsx` still uses `convertText(...)`** for the same endpoint pair; this matches the **Step 10** pattern (wrapper-level alignment first, app routing consolidation deferred). **Classification:** **Lighter but acceptable** completion of items 12–15 relative to a hypothetical “only App.tsx” entry—still grounded and documented.
- **Engine-specific internal-failure probes:** **12.3.5** references `verify-e2e-to-asciidoc-internal-error-contract.js`. **Classification:** **Clearly completed** (conditional satisfied where feasible).
- **Compatibility-wrapper / legacy overlap:** `detail` + `asciidoc` top-level fields are documented; **12.4.x** addresses wrapper consumption. **Classification:** **Clearly completed** where applicable.

#### Grounded deviations (non-blocking)

1. **Readiness gate (item 1):** Expressed through **Step 11** handoff + **12.1.2** freeze rather than a standalone Step 6.2.2 re-checklist. **Classification:** acceptable sequencing; same intent as Step 7.5.2-style playbook notes.
2. **Primary UI entry vs alignment target:** Product runtime uses **`convertText`**; Step 12 **remediated the dedicated wrapper** only. **Classification:** **grounded deviation** (routing), **acceptable** under playbook “conditional frontend” and prior Step 10 precedent; **may need later attention** if routing is unified.
3. **Cross-layer pass (item 16):** Backend is script-driven; frontend consolidation is **documentary + verification narrative** in **12.4.5** rather than a separate “Step 12 frontend vitest suite” chapter. **Classification:** **lighter but acceptable**, aligned with Step 8.5.2-style wording where executable checks + consolidation evidence suffice.

#### Overall conformance statement

The Step 12 flow (**Markdown → AsciiDoc**, `POST /api/to-asciidoc` + `markdown-to-asciidoc.ts` wrapper) **conforms overall** to the **Step 6.3.3** migration playbook: **required items 1–17 are satisfied** with evidence in Steps **12.1.x–12.5.1**, and **no playbook stop/defer signal** from Step 6.3.3 is triggered for this bounded scope. Remaining gaps are **documented, bounded, and acceptable** (wrapper-first vs `App.tsx` routing; lightweight readiness framing).

#### Step boundary

This step records playbook conformance assessment only and does **not** start Step 12.5.3.

### Step 12.5.3 — Execution observations (surprises, frictions, deviations, Step 12)

This sub-step records **grounded** surprises and frictions observed while executing the Step 12 flow (**Markdown → AsciiDoc**, `POST /api/to-asciidoc` + `markdown-to-asciidoc.ts`), across converter migration, backend alignment, frontend alignment, and verification/consolidation. It does **not** reopen closed migration decisions; it preserves traceability for maintainers and future playbook refinement.

#### Converter migration

| Observation | Category | Notes |
| --- | --- | --- |
| **Dual transport fields on success** (`asciidoc` top-level string **and** nested `conversionResult`) | Path-specific behavior / contract friction | Consumers must treat **`conversionResult` as semantic source of truth**; the duplicate AsciiDoc string is legacy-friendly but creates a **dual-channel** risk if one is validated and the other ignored (mitigated in **12.4.4** for the wrapper). |
| **Frontend helper duplication** (`createSuccessResult` / `createFailureResult` / `normalizeError` duplicated per wrapper module) | Later playbook refinement candidate | Same pattern as Step 10; increases drift risk on small edits. Acceptable for bounded Step 12 scope; **shared module** remains a future consolidation target (**12.5.1**). |

#### Backend / orchestrator alignment

| Observation | Category | Notes |
| --- | --- | --- |
| **Pandoc as an external runtime dependency** | Hidden dependency / operational surprise | Route behavior depends on a **working Pandoc install** and stable process execution; failures surface through engine-specific messages, requiring **classification** rather than a single generic string (**12.3.4**). |
| **Error surface depth (wrapper rethrow + `cause` chain)** | Unexpected runtime complexity | Original Step 12 remediation required **`Error.cause` chaining** in `convert.js` and **`collectAsciidocErrorMessages`** so route classification sees the **full message chain**, not only the outer wrapper text (**12.3.4**). |
| **`CONVERSION_FAILED` vs `INTERNAL_ERROR` boundary** | Error-shape / propagation friction | Classification is **message-heuristic**; grounded but sensitive to wording changes in lower layers—**must stay documented** for anyone tuning Pandoc error paths. |
| **Root-level failure envelope + `detail`** | Acceptable compatibility pattern | Same as other migrated routes: clients may read `detail` while contract consumers use structured `error`; **not a defect** if both remain populated consistently (**12.3.3** / **12.3.5**). |

#### Frontend / UI alignment

| Observation | Category | Notes |
| --- | --- | --- |
| **`App.tsx` uses `convertText(...)`, not the Step 12 wrapper** | Grounded architectural friction | **Two ingestion surfaces** for the same endpoint (**12.4.1**); wrapper is verified in isolation. **Must stay documented** until routing is intentionally unified (**12.5.1**, **12.5.2**). |
| **Success vs failure JSON envelope asymmetry** (nested `conversionResult` on success vs root-level failure) | Error-shape friction | Frontend must implement **dual-path parsing** (`!res.ok` vs `res.ok`); Step 12 wrapper addresses this explicitly (**12.4.3** / **12.4.4**). |
| **Optional `setBackendConversionResult` / `setConversionUiState` not wired from `App.tsx` for this wrapper** | Verification / state gap (bounded) | Global contract state may **not** reflect wrapper attempts unless a caller passes setters—**acceptable** for legacy wrapper scope; **later refinement** if App switches to the wrapper. |

#### Verification and consolidation

| Observation | Category | Notes |
| --- | --- | --- |
| **Chained e2e run required a harness tweak** (`verify-e2e-to-asciidoc-representative-scenarios.js` + `process.exit` pattern) | Acceptable surprise | **Verification gap** in the script (event loop hang), not in product code (**12.3.5**). **Issue class** that should stay in release notes / contract doc for reproducible chained runs. |
| **Frontend verification primarily documentary (12.4.5) vs dedicated vitest chapter** | Lighter completion | Executable backend scripts carry the heaviest automated proof; frontend consolidation is **evidence + narrative**—aligned with **12.5.2** deviation notes. **Later refinement:** optional wrapper-level tests if routing promotes the wrapper. |
| **Internal-error probe depends on fault-injection feasibility** | Path-specific handling | Pandoc-path failure injection is **engine-specific**; playbook conditional item satisfied where safe (**12.3.5**). |

#### Acceptable surprises (non-blocking)

- **Dual field success payload** and **root + `detail` failure** are **documented compatibility** choices, not ad-hoc drift, as long as `ConversionResult` remains canonical.
- **Wrapper-level-only** UI alignment matches **Step 10** precedent and frozen **12.1.2** scope.
- **Representative-scenarios script exit behavior** fixed with a **tiny harness-only** change—acceptable operational friction.

#### Later playbook refinement candidates

- Explicit playbook bullet for **“shared frontend ConversionResult helper module”** after N wrappers duplicate the same blocks.
- Explicit **“dual App entry vs dedicated wrapper”** checklist when the same `fetch` endpoint appears in `generic-converter` and a legacy wrapper.
- **Chained e2e script** template (delayed `process.exit`) promoted to a **shared npm script** or doc snippet to avoid one-off hangs per route.

#### Issues that must stay documented (until product changes)

- **Two live ingestion paths** (`convertText` vs `convertMarkdownToAsciiDoc`) for **`/api/to-asciidoc`**.
- **Heuristic internal-error classification** for Pandoc failures (`classifyToAsciidocInternalError` + message chain)—any change to error text upstream can shift codes.
- **Verification harness** requirement for chained runs on **representative-scenarios** script (see **12.3.5**).

#### Step boundary

This step records execution observations only and does **not** start Step 12.5.4.

### Step 12.5.4 — Step 12 cycle validation and closure readiness

**Validation inputs used:** isolated verification (**12.2.6**), backend/orchestrator remediation verification (**12.3.5**), frontend/UI remediation verification (**12.4.5**), cross-flow comparison (**12.5.1**), playbook conformance (**12.5.2**), and execution observations (**12.5.3**).

#### What is validated

- **Flow migrated and standardized:** `POST /api/to-asciidoc` produces standardized success/failure `ConversionResult` shapes (nested `conversionResult` on success; root-level failure + `detail`); the Step 12 wrapper (`markdown-to-asciidoc.ts`) consumes and returns aligned `ConversionResult` semantics per **12.4.4** / **12.4.5**.
- **Backend/orchestrator preservation works:** Route + engine path preserve structured success/failure, `error.code` for grounded cases, internal-error harmonization via classification + `cause` chaining (**12.3.4**, **12.3.5**); e2e scripts (`verify-e2e-to-asciidoc-success-contract.js`, `verify-e2e-to-asciidoc-failure-contract.js`, `verify-e2e-to-asciidoc-representative-scenarios.js`, `verify-e2e-to-asciidoc-internal-error-contract.js`) re-run and recorded **passing** in consolidation.
- **Frontend/UI preservation works (Step 12 target):** Wrapper treats backend `conversionResult` as success source of truth, preserves structured failures (including `error.code`), coherent `loading`/attempt resets, optional `setBackendConversionResult` / `setConversionUiState` (**12.4.5**).
- **Cross-flow comparison recorded:** **12.5.1** documents consistency vs Step 10 peer and validated baseline; acceptable path-specific differences are explicit.
- **Playbook conformance recorded:** **12.5.2** maps Step **6.3.3** items 1–17 to Step 12 evidence; overall conformance **yes**, with bounded lightweight deviations documented.
- **Execution observations recorded:** **12.5.3** captures grounded surprises/frictions; none constitute an unresolved **major** blocker for this cycle’s stated scope (**12.1.2**).
- **Relevant checks pass:** Backend contract kit for this route is **explicit and green** in doc narrative; frontend verification is **consolidation + contract-first behavior** in the wrapper (**12.4.5**, **12.5.2** item 16 note)—aligned with the accepted Step 12 verification posture.
- **No unresolved major blocker:** Stop/defer signals from Step **6.3.3** are **not** triggered for the frozen Step 12 scope; remaining items are **documented residual** differences, not blocking defects.

#### What remains acceptable but non-blocking

- **Dual frontend ingestion for the same endpoint:** `convertText(...)` remains the active `App.tsx` path while the Step 12 wrapper is aligned in isolation—**documented** (**12.4.1**, **12.5.1**, **12.5.3**), same pattern as Step 10.
- **Success/failure envelope asymmetry** (nested success `conversionResult` vs root-level failure + `detail`)—**explicitly handled** in the wrapper; compatibility `detail` retained.
- **Duplicated frontend helper blocks** across wrappers—**acceptable** for this cycle; **refinement candidate** (**12.5.3**).
- **Pandoc-dependent runtime** and **heuristic internal-error classification**—**grounded and documented**; operators/maintainers must respect upstream error-text stability (**12.5.3**).
- **Representative-scenarios e2e harness** required a **tiny `process.exit` stabilization**—harness-only; **documented** (**12.3.5**).
- **Frontend proof emphasis** on backend e2e scripts + consolidation narrative rather than a standalone Step 12 vitest chapter—**non-blocking** per **12.5.2** / **12.5.3**.

#### Closure decision

- **Decision:** **The Step 12 cycle is clean enough for closure** under the frozen scope (**12.1.2**): Markdown → AsciiDoc (`POST /api/to-asciidoc`) + `convertMarkdownToAsciiDoc(...)` wrapper alignment and verification.
- **Rationale:** Migration, backend preservation, frontend wrapper preservation, layered verification, cross-flow comparison, playbook conformance, and execution observations are **complete and recorded**; residual differences are **acceptable, explicit, and non-blocking**.

### Step 12.6.1 — Step 12 execution summary (what actually ran)

- **Executed flow:** Step 12 executed the bounded entry **Markdown → AsciiDoc** via **`POST /api/to-asciidoc`**, with the selected frontend surface **`api/frontend/src/converters/markdown-to-asciidoc.ts`** → **`convertMarkdownToAsciiDoc(...)`** (scope freeze **12.1.2**).

#### Converter-level work

- Confirmed **Pandoc** conversion via **`convertMarkdownWithPandoc`** behind the route; documented **helper payload mapping** into `createSuccessResult` / `createFailureResult` inputs (**12.2.2**).
- **Standardized `ConversionResult`** at the route boundary for success and failure was the baseline; Step 12 work emphasized **preservation**, **internal-error context** (cause chain / classification), and **verification** rather than replacing the engine.

#### Backend/orchestrator work

- **Target:** `api/backend/routes/conversion.routes.js` **`/to-asciidoc`** + `api/backend/services/conversion/convert.js` (Pandoc path).
- **Remediation (12.3.4):** **`Error.cause` chaining** on rethrow, **`collectAsciidocErrorMessages`**, **`classifyToAsciidocInternalError`** updates so route failures stay **structured** and codes stay **grounded** where possible.
- **Verification (12.3.5):** Re-ran **`verify-e2e-to-asciidoc-success-contract.js`**, **`verify-e2e-to-asciidoc-failure-contract.js`**, **`verify-e2e-to-asciidoc-representative-scenarios.js`** (plus harness **`process.exit`** stabilization), **`verify-e2e-to-asciidoc-internal-error-contract.js`**.

#### Frontend/UI work

- **Target:** **`convertMarkdownToAsciiDoc(...)`** (**12.4.4**): contract-first **`data.conversionResult`** gating, structured non-OK JSON handling (single body read), **`error.code`** in UX where relevant, attempt-level stale-state mitigation, optional **`setBackendConversionResult`** / **`setConversionUiState`**.
- **Consolidation (12.4.5):** Recorded wrapper verification narrative; **did not** rewire **`App.tsx`**—**`convertText(...)`** remains the active path for the same endpoint pair (**12.4.1**).

#### Verification and consolidation work

- **Isolated / flow checks:** **12.2.6** and backend e2e suite above (**12.3.5**).
- **Cross-cutting:** **12.5.1** (comparison), **12.5.2** (Step **6.3.3** playbook), **12.5.3** (observations), **12.5.4** (closure readiness).

#### What Step 12 confirmed

- **Markdown → AsciiDoc** is **migrated and standardized** at the **HTTP boundary** and on the **Step 12 wrapper** for contract-first **`ConversionResult`** semantics within frozen scope.
- **Backend preservation** and **wrapper-level frontend preservation** work as intended under verification; **residual dual entry** (`convertText` vs wrapper) is **documented**, not a silent drift.
- The **Step 6** playbook applies to this cycle with **bounded, documented** deviations (**12.5.2**).

#### What remains outside Step 12 scope

- **`App.tsx` routing** unification with the dedicated wrapper (or full behavioral parity pass) as a **follow-on** item.
- **`POST /api/convert`** broad family, **`POST /api/from-html`** / other deferred waves, **global** helper deduplication, **UI redesign**.
- **Step 13** planning/execution—**not started** here.

#### Step boundary

This step records execution summary only and does **not** start Step 12.6.2.

### Step 12.6.2 — Multi-flow baseline update (validated reference set includes Step 12)

#### Validated reference set (expanded)

The validated multi-flow baseline now explicitly includes **Step 12** as an additional **validated execution unit** for the **Markdown → AsciiDoc** path:

- **Backend route (unchanged endpoint):** `POST /api/to-asciidoc` (Pandoc-backed) — already part of the baseline as the **second migrated flow** (see Step 7.6.2 / Step 8.6.2).
- **Step 12 addition (new alignment surface):** the **legacy frontend wrapper** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) is now **contract-aligned, verified, and accepted** as part of the reference set for this route.

The baseline therefore includes, for **`/api/to-asciidoc`**, both **generic `convertText(...)` contract-first handling** (active app path) and a **direct, wrapper-level** contract preservation pattern—without adding a new backend conversion endpoint—mirroring the Step **10** pattern for **`/api/to-markdown`**.

#### Previously validated flows (context)

The broader validated set still includes the flows documented earlier: e.g. **AsciiDoc → Markdown** (`/api/to-markdown`, downdoc), **Markdown → AsciiDoc** at the endpoint (**`/api/to-asciidoc`**), **Text → Markdown** (Step 7), **`POST /api/from-html`** multi-target (Step 8), plus **Step 10**’s explicit **wrapper** validation on **`asciidoc-to-markdown.ts`**. **Step 12** extends the same idea on the **reverse-direction** dedicated route’s wrapper.

#### What remains common across the validated flows

- **Standardized `ConversionResult` semantics** on success and failure: structured `error` / `error.code` where applicable, required root fields (including `warnings`, `logs`, `meta` collections).
- **Boundary-first preservation:** backend HTTP responses and ingestion layers (generic converter and/or dedicated wrappers where aligned) treat standardized results as the source of truth rather than ad-hoc flattened legacy shapes.
- **Repeatable verification posture:** contract success/failure probes, representative scenarios where applicable, internal-error probes when grounded, plus cycle-level consolidation (playbook conformance, cross-flow comparison, execution observations).

#### What remains path-specific but acceptable

- **Engine topology:** Pandoc (`to-asciidoc`) vs downdoc/lazyload (`to-markdown`) vs text2markdown / multi-target HTML—expected under the bounded migration model.
- **Frontend topology:** **Step 12** validates a **standalone wrapper** while **`App.tsx`** may still call **`convertText(...)`** for the same endpoint—dual surface is **documented** (same pattern as Step **10**).
- **Envelope asymmetry** (nested success `conversionResult` vs root-level failure + `detail`) and **compatibility `detail`**—handled explicitly per flow.
- **Verification emphasis:** backend e2e scripts carry strong automated proof for routes; wrapper cycles may rely additionally on **consolidation narrative** where acceptable (**12.4.5** / **12.5.2**).

#### What this improves for future migration confidence

- **Symmetric evidence:** both **primary text round-trip routes** (`/api/to-markdown` and `/api/to-asciidoc`) now have a **documented, verified wrapper-level** alignment story (Step **10** + Step **12**), not only endpoint + `convertText` behavior.
- Reinforces that the **Step 6** playbook applies to **legacy wrapper modules** named in handoffs, for **Pandoc** as well as **downdoc** paths.
- Makes **drift detection** easier: same endpoint, **two frontend ingestion surfaces** (`convertText` vs dedicated wrapper) is an explicit baseline comparison point for **Markdown → AsciiDoc** as it already was for **AsciiDoc → Markdown**.

#### Step boundary

This step records baseline expansion only and does **not** start Step 12.6.4.

### Step 12.6.3 — Step 12 Definition of Done

Step 12 is complete only if all criteria below are true:

- The Step 12 entry flow was confirmed.
- The Step 12 scope was frozen.
- The runtime flow was mapped.
- Helper payload mapping was documented.
- Success-path integration was completed.
- Failure-path integration was completed.
- Internal-error harmonization was completed.
- Isolated verification passed.
- Backend/orchestrator alignment was completed.
- Backend/orchestrator verification passed.
- Frontend/UI alignment was completed.
- Frontend/UI verification passed.
- Cross-flow comparison was completed.
- Playbook conformance was checked.
- Execution observations were documented.
- The cycle was validated as clean enough for closure.
- The multi-flow baseline was updated.

#### What Step 12 does not require

- Broad `App.tsx` routing consolidation (active `convertText(...)` path vs dedicated wrapper unification) beyond documenting the dual surface.
- Migration or redesign of the generic `POST /api/convert` family, `POST /api/from-html` deferred waves, or global helper-module extraction, except as explicitly out-of-scope notes.
- Global UI redesign or cross-cutting architecture refactor.
- Starting **Step 13** execution work from this Definition of Done alone.

#### Step boundary

This step records the Step 12 Definition of Done only and does **not** start Step 12.6.4.

### Step 12.6.4 — Step 12 Closure

## Step 12 Closure

Step 12 executed **one additional real flow**: **Markdown → AsciiDoc** through **`POST /api/to-asciidoc`**, with the selected wrapper entry **`convertMarkdownToAsciiDoc(...)`** in **`api/frontend/src/converters/markdown-to-asciidoc.ts`** as the scoped execution surface (frozen scope **12.1.2**).

**What Step 12 achieved:** **converter migration** was **completed** for that flow (standardized `ConversionResult` semantics preserved at the route boundary with Pandoc-backed conversion). **Backend/orchestrator alignment** was **completed** for that flow (route + engine error context, classification, verification **12.3.4** / **12.3.5**). **Frontend/UI alignment** was **completed** for that flow (wrapper contract-first consumption, stale-state safeguards, **12.4.4** / **12.4.5**). The flow was **verified** against the Step 12 checklist and **accepted for closure** (**12.5.4**).

**Concrete result added to the validated flow set:** the **validated multi-flow baseline was expanded again** (**12.6.2**) to include **Step 12** as a **wrapper-level** validated execution unit on **`/api/to-asciidoc`**—mirroring the **Step 10** pattern for **`/api/to-markdown`** without adding a new backend endpoint.

**What Step 12 confirms about the migration/alignment method:** the **Step 6** playbook applies to **legacy wrapper modules** and **Pandoc** paths, not only downdoc/lazyload; **boundary-first** `ConversionResult` preservation plus **layered verification** (isolated, backend e2e, frontend consolidation, cross-flow comparison **12.5.1**, playbook **12.5.2**, observations **12.5.3**) remains a repeatable, bounded recipe.

**What remains outside Step 12 scope:** deferred migration waves (**`/api/convert`**, **`from-html`**, etc.), **App.tsx** routing consolidation vs the dedicated wrapper, **global** helper extraction, **UI** redesign, and **Step 13** planning/execution until explicitly started.

**Transition note:** follow-on work may build on this **expanded baseline** as a **new phase**, without reopening **Step 12** scope or decisions already frozen under **12.1.2**.

**Step 12 does not mean:**

- all remaining flows are migrated,
- broad redesign work is done, or
- **Step 13** has already started.

#### Step boundary

This step records Step 12 official closure only and does **not** start Step 13.
