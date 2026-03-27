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
