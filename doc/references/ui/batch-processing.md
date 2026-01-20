# Batch Processing

## Purpose

This document defines the canonical batch processing behavior for Ascend frontend. It specifies how multiple files are processed in a single operation.

## Batch Processing Service

### Service Location

**File:** `api/frontend/services/bulk-processor.ts`

**Exports:**
- `bulkProcessFiles()`: Sequential processing
- `bulkProcessFilesConcurrent()`: Parallel processing
- `calculateBulkStats()`: Statistics calculation
- `filterSuccessful()`: Filter successful results
- `filterFailed()`: Filter failed results

## Processing Modes

### Sequential Processing

**Function:** `bulkProcessFiles()`

**Behavior:**
- Process files one at a time
- Wait for each file to complete before next
- Progress callback after each file
- Individual file errors don't stop batch

**Use Case:** Default, recommended for stability

### Concurrent Processing

**Function:** `bulkProcessFilesConcurrent()`

**Behavior:**
- Process multiple files in parallel
- Configurable concurrency limit (default: 1)
- Progress callback after each file
- Individual file errors don't stop batch

**Use Case:** Faster processing when server can handle it

## File Interface

### BulkFile Type

```typescript
interface BulkFile {
  name: string;           // File name (for display)
  content: string;        // File content
  fromFormat: string;     // Source format
  toFormat: string;       // Target format
  options?: object;       // Optional conversion options
}
```

## Result Interface

### BulkFileResult Type

```typescript
interface BulkFileResult {
  file: string;           // Original file name
  success: boolean;       // Conversion success
  result?: string;       // Converted content (if success)
  error?: string;        // Error message (if failed)
}
```

## Progress Tracking

### Progress Interface

```typescript
interface BulkProgress {
  current: number;        // Current file index (1-based)
  total: number;          // Total number of files
  currentFile: string;    // Current file name
  percentage: number;     // Completion percentage (0-100)
}
```

### Progress Callback

**Function:** `onProgress?: (progress: BulkProgress) => void`

**Usage:**
- Called after each file is processed
- Provides real-time progress updates
- Enables UI progress bar updates

## Error Handling

### Per-File Errors

**Rule:** Individual file failures don't stop the batch.

**Behavior:**
- Failed file marked with `success: false`
- Error message in `error` field
- Processing continues with next file
- All results returned regardless of failures

### Batch Errors

**Rule:** Batch-level errors stop processing.

**Behavior:**
- Invalid input (not array, empty array)
- Network errors
- System errors

## Statistics

### Statistics Calculation

**Function:** `calculateBulkStats(results: BulkFileResult[])`

**Returns:**
```typescript
{
  total: number;          // Total files
  successful: number;     // Successful conversions
  failed: number;         // Failed conversions
  successRate: number;    // Success rate (0-100)
}
```

## API Integration

### Endpoint Used

**Endpoint:** `POST /api/proxy/convert`

**Rationale:**
- Uses proxy endpoint for data normalization
- Handles BOM, encoding, Smart Quotes automatically
- Consistent with single-file conversion

### Request Format

```json
{
  "content": "file content",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "options": {}
}
```

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Batch processing interface
- Processing modes
- Progress tracking
- Error handling
