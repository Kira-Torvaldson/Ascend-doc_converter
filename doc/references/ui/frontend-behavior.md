# Frontend Behavior

## Purpose

This document defines the canonical frontend behavior for Ascend. It specifies UI interactions, user flows, and frontend-specific rules.

## UI Components

### Format Selectors

**Component:** Source and destination format dropdowns

**Behavior:**
- Display all available formats
- Disable formats marked as "coming soon"
- Show "(coming soon)" label for disabled formats
- Auto-adjust to maintain valid conversion pairs

**Valid Conversions:**
- AsciiDoc ↔ Markdown (enabled)
- Other format pairs (disabled, "coming soon")

### Conversion Button

**Component:** "Convertir" (Convert) button

**Behavior:**
- Enabled only for valid conversions (AsciiDoc ↔ Markdown)
- Disabled during conversion
- Shows loading state during conversion

### Progress Indicator

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

### Character Counter

**Component:** Text statistics display

**Metrics:**
- Character count
- Word count
- Line count

**Location:** Toolbar of source and result panels

### Toast Notifications

**Component:** Temporary notification messages

**Types:**
- Success (✓ icon)
- Error (✕ icon)

**Behavior:**
- Auto-dismiss after 5 seconds
- Manual close button
- Slide-out animation on dismiss

## User Flows

### Flow 1: Simple Conversion

1. User enters text in source panel
2. User selects source format (AsciiDoc or Markdown)
3. User selects destination format (opposite of source)
4. User clicks "Convertir"
5. Progress indicator shows
6. Result appears in destination panel
7. Success notification displays

### Flow 2: Format Swap

1. User clicks swap button (⇄)
2. Source and destination formats swap
3. Source and destination content swap (if applicable)
4. UI updates to reflect swap

### Flow 3: File Export

1. User clicks download button (⬇️)
2. System prompts for filename
3. User enters filename
4. System adds correct extension
5. File downloads to user's system

### Flow 4: History Access

1. User clicks history button
2. History modal opens
3. User sees list of past conversions
4. User can restore or clear history

## Keyboard Shortcuts

### Available Shortcuts

- `Ctrl+S`: Download/Save result
- `Ctrl+Enter`: Trigger conversion
- `Ctrl+K`: Clear source content
- `Ctrl+/`: Show shortcuts help

### Shortcut Behavior

- Shortcuts work globally (when focus not in input)
- Modal dialogs can override shortcuts
- Shortcuts are documented in help modal

## State Management

### Content State

- Source content: `adocInput` or `mdOutput` (depending on format)
- Destination content: Conversion result
- Editing state: Tracks if user is editing result

### Conversion State

- Loading: Boolean flag
- Status: String message
- Just converted: Boolean flag (prevents immediate re-conversion)

### UI State

- Notifications: Array of notification objects
- Modals: Boolean flags for each modal
- Navigation window: Position, size, minimized state

## Validation Rules

### Rule 1: Format Pair Validation

**Rule:** Only AsciiDoc ↔ Markdown conversions are allowed.

**Enforcement:**
- Button disabled for invalid pairs
- Warning message displayed
- Auto-adjustment to valid pair

### Rule 2: Content Validation

**Rule:** Empty content cannot be converted.

**Enforcement:**
- Button disabled if source empty
- Clear error message if attempted

### Rule 3: Conversion State

**Rule:** Only one conversion at a time.

**Enforcement:**
- Button disabled during conversion
- New conversion requests queued or rejected

## Canonical Status

This document is **canonical** and defines the source of truth for:
- UI component behavior
- User interaction flows
- Keyboard shortcuts
- State management rules
