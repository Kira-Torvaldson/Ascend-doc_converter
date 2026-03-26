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
