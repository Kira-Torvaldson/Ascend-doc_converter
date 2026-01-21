# UI Reference

## Purpose

This document defines the canonical UI references for Ascend, including frontend behavior and batch processing. It serves as the authoritative reference for all frontend interactions.

---

## Frontend Behavior

### Purpose

This section defines the canonical frontend behavior for Ascend. It specifies UI interactions, user flows, and frontend-specific rules.

### UI Components

#### Format Selectors

**Component:** Source and destination format dropdowns

**Behavior:**
- Display all available formats
- Disable formats marked as "coming soon"
- Show "(coming soon)" label for disabled formats
- Auto-adjust to maintain valid conversion pairs

**Valid Conversions:**
- AsciiDoc ↔ Markdown (enabled)
- Other format pairs (disabled, "coming soon")

#### Conversion Button

**Component:** "Convertir" (Convert) button

**Behavior:**
- Enabled only for valid conversions (AsciiDoc ↔ Markdown)
- Disabled during conversion
- Shows loading state during conversion

#### Progress Indicator

**Component:** Visual progress feedback

**Elements:**
- Spinner animation
- Progress message
- Animated progress bar
- Shimmer effect

**Timing:**
- Spinner: 1.2s rotation
- Progress bar: 2.5s animation
- Shimmer: 3s animation

#### Character Counter

**Component:** Text statistics display

**Metrics:**
- Character count
- Word count
- Line count

**Location:** Toolbar of source and result panels

#### Toast Notifications

**Component:** Temporary notification messages

**Types:**
- Success (✓ icon)
- Error (✕ icon)

**Behavior:**
- Auto-dismiss after 5 seconds
- Manual close button
- Slide-out animation on dismiss

### User Flows

#### Flow 1: Simple Conversion

1. User enters text in source panel
2. User selects source format (AsciiDoc or Markdown)
3. User selects destination format (opposite of source)
4. User clicks "Convertir"
5. Progress indicator shows
6. Result appears in destination panel
7. Success notification displays

#### Flow 2: Format Swap

1. User clicks swap button (⇄)
2. Source and destination formats swap
3. Source and destination content swap (if applicable)
4. UI updates to reflect swap

#### Flow 3: File Export

1. User clicks download button (⬇️)
2. System prompts for filename
3. User enters filename
4. System adds correct extension
5. File downloads to user's system

#### Flow 4: History Access

1. User clicks history button
2. History modal opens
3. User sees list of past conversions
4. User can restore or clear history

### Keyboard Shortcuts

#### Available Shortcuts

- `Ctrl+S`: Download/Save result
- `Ctrl+Enter`: Trigger conversion
- `Ctrl+K`: Clear source content
- `Ctrl+/`: Show shortcuts help

#### Shortcut Behavior

- Shortcuts work globally (when focus not in input)
- Modal dialogs can override shortcuts
- Shortcuts are documented in help modal

### State Management

#### Content State

- Source content: `adocInput` or `mdOutput` (depending on format)
- Destination content: Conversion result
- Editing state: Tracks if user is editing result

#### Conversion State

- Loading: Boolean flag
- Status: String message
- Just converted: Boolean flag (prevents immediate re-conversion)

#### UI State

- Notifications: Array of notification objects
- Modals: Boolean flags for each modal
- Navigation window: Position, size, minimized state

### Validation Rules

#### Rule 1: Format Pair Validation

**Rule:** Only AsciiDoc ↔ Markdown conversions are allowed.

**Enforcement:**
- Button disabled for invalid pairs
- Warning message displayed
- Auto-adjustment to valid pair

#### Rule 2: Content Validation

**Rule:** Empty content cannot be converted.

**Enforcement:**
- Button disabled if source empty
- Clear error message if attempted

#### Rule 3: Conversion State

**Rule:** Only one conversion at a time.

**Enforcement:**
- Button disabled during conversion
- New conversion requests queued or rejected

---

## Batch Processing

### Purpose

This section defines the canonical batch processing behavior for Ascend frontend. It specifies how multiple files are processed in a single operation.

### Batch Processing Service

#### Service Location

**File:** `api/frontend/services/bulk-processor.ts`

**Exports:**
- `bulkProcessFiles()`: Sequential processing
- `bulkProcessFilesConcurrent()`: Parallel processing
- `calculateBulkStats()`: Statistics calculation
- `filterSuccessful()`: Filter successful results
- `filterFailed()`: Filter failed results

### Processing Modes

#### Sequential Processing

**Function:** `bulkProcessFiles()`

**Behavior:**
- Process files one at a time
- Wait for each file to complete before next
- Progress callback after each file
- Individual file errors don't stop batch

**Use Case:** Default, recommended for stability

#### Concurrent Processing

**Function:** `bulkProcessFilesConcurrent()`

**Behavior:**
- Process multiple files in parallel
- Configurable concurrency limit (default: 1)
- Progress callback after each file
- Individual file errors don't stop batch

**Use Case:** Faster processing when server can handle it

### File Interface

#### BulkFile Type

```typescript
interface BulkFile {
  name: string;           // File name (for display)
  content: string;        // File content
  fromFormat: string;     // Source format
  toFormat: string;       // Target format
  options?: object;       // Optional conversion options
}
```

### Result Interface

#### BulkFileResult Type

```typescript
interface BulkFileResult {
  file: string;           // Original file name
  success: boolean;       // Conversion success
  result?: string;       // Converted content (if success)
  error?: string;        // Error message (if failed)
}
```

### Progress Tracking

#### Progress Interface

```typescript
interface BulkProgress {
  current: number;        // Current file index (1-based)
  total: number;          // Total number of files
  currentFile: string;    // Current file name
  percentage: number;     // Completion percentage (0-100)
}
```

#### Progress Callback

**Function:** `onProgress?: (progress: BulkProgress) => void`

**Usage:**
- Called after each file is processed
- Provides real-time progress updates
- Enables UI progress bar updates

### Error Handling

#### Per-File Errors

**Rule:** Individual file failures don't stop the batch.

**Behavior:**
- Failed file marked with `success: false`
- Error message in `error` field
- Processing continues with next file
- All results returned regardless of failures

#### Batch Errors

**Rule:** Batch-level errors stop processing.

**Behavior:**
- Invalid input (not array, empty array)
- Network errors
- System errors

### Statistics

#### Statistics Calculation

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

### API Integration

#### Endpoint Used

**Endpoint:** `POST /api/proxy/convert`

**Rationale:**
- Uses proxy endpoint for data normalization
- Handles BOM, encoding, Smart Quotes automatically
- Consistent with single-file conversion

#### Request Format

```json
{
  "content": "file content",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "options": {}
}
```

---

## Canonical Status

This document is **canonical** and defines the source of truth for:
- UI component behavior
- User interaction flows
- Keyboard shortcuts
- State management rules
- Batch processing interface
- Processing modes
- Progress tracking
- Error handling

Any changes to UI behavior must be reflected here first, then propagated to implementation code.
