# Frontend Integration - Confirmation Validation

## Overview

The `secure-converter` now requires that user confirmation be validated before executing a conversion. This ensures that the user has clicked "Yes" in a confirmation window before the conversion is launched.

## Secure-Converter Modification

The module now checks the `confirmed: true` parameter in options:

```javascript
// ❌ WITHOUT confirmation - will be rejected
await secureConvert(content, 'markdown', 'asciidoc', {})

// ✅ WITH confirmation - will be accepted
await secureConvert(content, 'markdown', 'asciidoc', { confirmed: true })
```

## React Frontend Integration

### Step 1: Add state for confirmation

```typescript
const [conversionConfirmed, setConversionConfirmed] = useState<boolean>(false);
const [showConversionModal, setShowConversionModal] = useState<boolean>(false);
```

### Step 2: Modify handleConvert to display modal

```typescript
const handleConvert = useCallback(() => {
  // First check if we have content
  let sourceText = "";
  if (sourceFormat === 'asciidoc') {
    sourceText = adocTextAreaRef.current?.value || adocInput;
  } else if (sourceFormat === 'markdown') {
    sourceText = mdOutput;
  } else {
    sourceText = adocInput;
  }

  if (!sourceText.trim()) {
    setStatus("Please enter text to convert");
    return;
  }

  // Display confirmation modal instead of converting directly
  setShowConversionModal(true);
}, [sourceFormat, adocInput, mdOutput]);
```

### Step 3: Create confirmation function

```typescript
const confirmConversion = useCallback(() => {
  setConversionConfirmed(true);
  setShowConversionModal(false);
  
  // Now execute conversion with confirmed: true
  let sourceText = "";
  if (sourceFormat === 'asciidoc') {
    sourceText = adocTextAreaRef.current?.value || adocInput;
  } else if (sourceFormat === 'markdown') {
    sourceText = mdOutput;
  } else {
    sourceText = adocInput;
  }

  const setOutput = (result: string) => {
    if (targetFormat === 'markdown' || targetFormat === 'html' || targetFormat === 'pdf' || targetFormat === 'yaml' || targetFormat === 'json' || targetFormat === 'txt') {
      setMdOutput(result);
    } else if (targetFormat === 'asciidoc') {
      setAdocInput(result);
    }
  };

  setJustConverted(true);
  convertText(
    sourceText,
    sourceFormat,
    targetFormat,
    setStatus,
    setOutput,
    setLoading,
    setNotification,
    conversionOptions,
    true // confirmed: true
  );
  
  setTimeout(() => setJustConverted(false), 2000);
  setConversionConfirmed(false); // Reset after conversion
}, [sourceFormat, targetFormat, adocInput, mdOutput, conversionOptions]);
```

### Step 4: Modify convertText to accept confirmed

```typescript
async function convertText(
  text: string,
  sourceFormat: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt',
  targetFormat: 'asciidoc' | 'markdown' | 'html' | 'pdf' | 'yaml' | 'json' | 'txt',
  setStatus: (s: string) => void,
  setOutput: (s: string) => void,
  setLoading: (b: boolean) => void,
  setNotification: (n: { message: string; type: 'success' | 'error'; visible: boolean } | null) => void,
  conversionOptions?: any,
  confirmed: boolean = false // New parameter
) {
  // ... existing validation ...

  // Check confirmation if using secure-converter
  if (!confirmed) {
    setStatus("Confirmation required for conversion");
    setNotification({
      message: "Please confirm the conversion",
      type: 'error',
      visible: true
    });
    return;
  }

  // ... rest of conversion code ...
  
  // In API call, include confirmed: true
  const body = {
    text,
    from: sourceFormat,
    to: targetFormat,
    options: conversionOptions,
    confirmed: true // ✅ Confirmation sent to backend
  };

  const res = await fetch(`${API_BASE}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal
  });
  
  // ... rest of code ...
}
```

### Step 5: Add confirmation modal in JSX

```tsx
{/* Confirmation modal for conversion */}
{showConversionModal && (
  <div className="modal-overlay" onClick={() => setShowConversionModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h3>Confirm conversion</h3>
      <p>
        Do you want to convert from <strong>{getFormatTitle(sourceFormat)}</strong> to <strong>{getFormatTitle(targetFormat)}</strong>?
      </p>
      <div className="modal-buttons">
        <button
          onClick={confirmConversion}
          style={{ 
            background: "#10b981", // Green for "Yes"
            flex: 1
          }}
        >
          Yes
        </button>
        <button
          onClick={() => setShowConversionModal(false)}
          style={{ 
            background: "#ef4444", // Red for "No"
            flex: 1
          }}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}
```

## Backend Modification

In `api/backend/server.js`, modify the `/convert` endpoint to use secure-converter:

```javascript
const { secureConvert, ConversionError } = require('../secure-converter.js');

app.post('/convert', async (req, res) => {
  try {
    const { text, from, to, options, confirmed } = req.body;

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST',
        message: 'Content must be a non-empty string'
      });
    }

    if (!from || !to) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST',
        message: 'from and to formats are required'
      });
    }

    // Confirmation verification (MANDATORY)
    if (confirmed !== true) {
      return res.status(400).json({
        error: true,
        code: 'CONFIRMATION_REQUIRED',
        message: 'User confirmation is required before executing conversion'
      });
    }

    // Use secure-converter with confirmation
    const result = await secureConvert(text, from, to, {
      timeout: 30000,
      confirmed: true
    });

    res.json({
      success: true,
      result,
      from,
      to
    });

  } catch (error) {
    if (error instanceof ConversionError) {
      const statusCode = error.code === 'CONFIRMATION_REQUIRED' || 
                        error.code === 'VALIDATION_ERROR' || 
                        error.code === 'FILE_VALIDATION_ERROR'
        ? 400
        : error.code === 'TIMEOUT'
        ? 408
        : 500;

      res.status(statusCode).json(error.toSafeResponse());
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({
        error: true,
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred'
      });
    }
  }
});
```

## Complete Flow

1. **User clicks "Convert"**
   - `handleConvert()` is called
   - Confirmation modal is displayed
   - Conversion is NOT yet launched

2. **User clicks "Yes" in modal**
   - `confirmConversion()` is called
   - `confirmed: true` is set
   - `convertText()` is called with `confirmed: true`
   - API is called with `confirmed: true` in body

3. **Backend receives request**
   - Checks that `confirmed === true`
   - If not, returns `CONFIRMATION_REQUIRED` error
   - If yes, executes `secureConvert()` with `confirmed: true`

4. **secure-converter validates**
   - Checks that `options.confirmed === true`
   - If not, throws `ConversionError` with code `CONFIRMATION_REQUIRED`
   - If yes, proceeds with conversion

## Security

This approach ensures that:
- ✅ No conversion can be executed without user confirmation
- ✅ Confirmation is verified at two levels (frontend and backend)
- ✅ Backend refuses any request without `confirmed: true`
- ✅ Secure-converter refuses any conversion without confirmation

## Testing

To test:

1. Try to convert without confirmation → should fail
2. Click "Yes" in modal → conversion should succeed
3. Click "No" in modal → conversion should not be launched
