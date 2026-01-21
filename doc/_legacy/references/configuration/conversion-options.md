> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Conversion Options - Documentation

## Overview

The conversion options system allows fine-grained configuration of document conversion behavior. It is designed to be modular, extensible, and API-oriented.

## Option Structure

Options are organized into 7 main categories:

1. **Content Analysis** - Content analysis
2. **Normalization** - Content normalization
3. **Rendering** - Document rendering options
4. **Format Specific** - Format-specific options
5. **Security** - Security and robustness
6. **Metadata** - Document metadata
7. **Developer** - Developer options

---

## 1. Content Analysis

### `analysisMode`
- **Type**: `string`
- **Values**: `'basic'` | `'heuristic'` | `'strict'`
- **Default**: `'heuristic'`
- **Description**: Determines the analysis mode for raw text content
  - `basic`: Minimal analysis, fast processing
  - `heuristic`: Intelligent analysis with automatic detection (recommended)
  - `strict`: Strict analysis with precise rules

### `headingDetection`
- **Type**: `Object`
- **Default**: 
  ```json
  {
    "enabled": true,
    "detectAllCaps": true,
    "detectSeparators": true,
    "detectNumbering": true,
    "minLength": 3,
    "maxLength": 100
  }
  ```
- **Description**: Automatic heading detection rules
  - `enabled`: Enable heading detection
  - `detectAllCaps`: Detect uppercase lines as headings
  - `detectSeparators`: Detect separators (===, ---)
  - `detectNumbering`: Detect numbering (1., 2., etc.)
  - `minLength`: Minimum length to consider as heading
  - `maxLength`: Maximum length to consider as heading

### `listDetection`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "enabled": true,
    "detectBullets": true,
    "detectNumbered": true,
    "preserveIndentation": true,
    "normalizeIndentation": true,
    "indentSize": 2
  }
  ```
- **Description**: List and indentation management
  - `enabled`: Enable list detection
  - `detectBullets`: Detect bullets (*, -, +)
  - `detectNumbered`: Detect numbered lists
  - `preserveIndentation`: Preserve original indentation
  - `normalizeIndentation`: Normalize indentation (tabs → spaces)
  - `indentSize`: Indentation size in spaces

---

## 2. Normalization

### `encoding`
- **Type**: `string`
- **Values**: `'utf-8'` | `'latin1'` | `'ascii'`
- **Default**: `'utf-8'`
- **Description**: Source text encoding

### `lineBreaks`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "normalize": true,
    "target": "unix",
    "removeTrailing": true,
    "maxConsecutive": 2
  }
  ```
- **Description**: Line break normalization
  - `normalize`: Normalize line breaks
  - `target`: Target format (`'unix'` (\n) | `'windows'` (\r\n) | `'mac'` (\r))
  - `removeTrailing`: Remove trailing line breaks at end of file
  - `maxConsecutive`: Maximum number of consecutive line breaks

### `removeNonAscii`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Remove non-ASCII characters (optional, disabled by default)

### `tabs`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "convertToSpaces": true,
    "tabSize": 2
  }
  ```
- **Description**: Tab conversion
  - `convertToSpaces`: Convert tabs to spaces
  - `tabSize`: Tab size in spaces

---

## 3. Rendering

### `tableOfContents`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "enabled": false,
    "depth": 3,
    "position": "top"
  }
  ```
- **Description**: Table of contents generation
  - `enabled`: Generate table of contents
  - `depth`: Maximum depth (1-6)
  - `position`: Position (`'top'` | `'bottom'` | `'none'`)

### `sectionNumbering`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "enabled": false,
    "depth": 3,
    "style": "numeric"
  }
  ```
- **Description**: Section numbering
  - `enabled`: Number sections
  - `depth`: Maximum numbering depth
  - `style`: Numbering style (`'numeric'` | `'alpha'` | `'roman'`)

### `lineWrap`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "enabled": false,
    "maxWidth": 80,
    "hardWrap": false
  }
  ```
- **Description**: Maximum line width
  - `enabled`: Enable automatic line wrapping
  - `maxWidth`: Maximum width in characters
  - `hardWrap`: Forced line break (hard wrap)

### `listStyle`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "bulletStyle": "dash",
    "numberedStyle": "numeric",
    "indentChar": " ",
    "indentSize": 2
  }
  ```
- **Description**: List style
  - `bulletStyle`: Bullet style (`'dash'` | `'asterisk'` | `'plus'` | `'circle'`)
  - `numberedStyle`: Numbered list style (`'numeric'` | `'alpha'` | `'roman'`)
  - `indentChar`: Indentation character
  - `indentSize`: Indentation size

---

## 4. Format Specific

### `markdown`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "flavor": "commonmark",
    "gfmExtensions": {
      "tables": true,
      "strikethrough": true,
      "taskLists": true,
      "autolinks": true
    },
    "preserveHtml": false,
    "codeFenceStyle": "backtick"
  }
  ```
- **Description**: Markdown options
  - `flavor`: Markdown variant (`'commonmark'` | `'gfm'` | `'markdown'`)
  - `gfmExtensions`: GitHub Flavored Markdown extensions
  - `preserveHtml`: Preserve HTML in Markdown
  - `codeFenceStyle`: Code block style (`'backtick'` | `'tilde'`)

### `asciidoc`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "compatMode": "asciidoctor",
    "attributes": {
      "doctype": "article",
      "toc": "left",
      "numbered": false,
      "sectanchors": true,
      "sectlinks": true
    },
    "safeMode": "safe"
  }
  ```
- **Description**: AsciiDoc options
  - `compatMode`: Compatibility mode (`'asciidoctor'` | `'asciidoc'`)
  - `attributes`: AsciiDoc attributes
  - `safeMode`: Security mode (`'unsafe'` | `'safe'` | `'server'` | `'secure'`)

### `pdf`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "pageSize": "a4",
    "orientation": "portrait",
    "margins": {
      "top": "2.5cm",
      "right": "2cm",
      "bottom": "2.5cm",
      "left": "2cm"
    },
    "fontFamily": "default",
    "fontSize": "12pt",
    "template": null,
    "engine": "pdflatex"
  }
  ```
- **Description**: PDF options
  - `pageSize`: Page size (`'a4'` | `'letter'` | `'legal'` | `'a3'`)
  - `orientation`: Orientation (`'portrait'` | `'landscape'`)
  - `margins`: Page margins
  - `fontFamily`: Font family
  - `fontSize`: Font size
  - `template`: Path to custom template (optional)
  - `engine`: PDF generation engine

### `html`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "standalone": true,
    "embedImages": false,
    "css": null,
    "minify": false
  }
  ```
- **Description**: HTML options
  - `standalone`: Complete HTML document with `<html>`, `<head>`, `<body>`
  - `embedImages`: Embed images as base64
  - `css`: Path to CSS stylesheet (optional)
  - `minify`: Minify HTML

---

## 5. Security

### `maxFileSize`
- **Type**: `number`
- **Default**: `10485760` (10 MB)
- **Description**: Maximum file size in bytes

### `conversionTimeout`
- **Type**: `number`
- **Default**: `30000` (30 seconds)
- **Description**: Conversion timeout in milliseconds

### `externalResources`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "allowExternalLinks": true,
    "allowImages": true,
    "allowScripts": false,
    "allowStyles": true,
    "sandboxMode": false
  }
  ```
- **Description**: External resource management
  - `allowExternalLinks`: Allow external links
  - `allowImages`: Allow images
  - `allowScripts`: Allow scripts (disabled by default for security)
  - `allowStyles`: Allow styles
  - `sandboxMode`: Sandbox mode (complete isolation)

### `validation`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "enabled": true,
    "strictMode": false,
    "maxErrors": 10
  }
  ```
- **Description**: Validation options
  - `enabled`: Enable validation
  - `strictMode`: Strict mode (rejects minor errors)
  - `maxErrors`: Maximum number of errors before aborting

---

## 6. Metadata

### `title`
- **Type**: `string | null`
- **Default**: `null`
- **Description**: Document title

### `author`
- **Type**: `string | null`
- **Default**: `null`
- **Description**: Document author

### `date`
- **Type**: `string | null`
- **Default**: `null`
- **Description**: Document date (ISO 8601 or custom format). If `null`, uses current date

### `language`
- **Type**: `string`
- **Default**: `'fr'`
- **Description**: Document language (ISO 639-1 code: fr, en, es, etc.)

### `license`
- **Type**: `string | null`
- **Default**: `null`
- **Description**: Document license

### `custom`
- **Type**: `Object`
- **Default**: `{}`
- **Description**: Custom metadata (key-value)

---

## 7. Developer

### `debugMode`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Debug mode (display detailed information)

### `exportIntermediate`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Export intermediate formats

### `showPipeline`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Display conversion pipeline

### `logging`
- **Type**: `Object`
- **Default**:
  ```json
  {
    "level": "info",
    "verbose": false,
    "saveLogs": false
  }
  ```
- **Description**: Logging options
  - `level`: Log level (`'debug'` | `'info'` | `'warn'` | `'error'`)
  - `verbose`: Verbose mode
  - `saveLogs`: Save logs to file

---

## Usage

### Basic Example

```javascript
const { mergeOptions, validateOptions } = require('./conversion-options');

// Default options
const options = mergeOptions();

// Custom options
const customOptions = mergeOptions({
  contentAnalysis: {
    analysisMode: 'strict'
  },
  security: {
    maxFileSize: 5 * 1024 * 1024 // 5 MB
  },
  metadata: {
    title: 'My Document',
    author: 'John Doe',
    language: 'fr'
  }
});

// Validation
const validation = validateOptions(customOptions);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### API Example

```javascript
// API endpoint
app.post('/convert', async (req, res) => {
  const { text, from, to, options } = req.body;
  
  // Merge with default options
  const conversionOptions = mergeOptions(options || {});
  
  // Validate
  const validation = validateOptions(conversionOptions);
  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }
  
  // Use options for conversion
  const result = await convertWithOptions(text, from, to, conversionOptions);
  res.json({ result });
});
```

---

## Safe Default Values

All options are configured with safe and predictable default values:

- **Security**: Scripts disabled, validation enabled, size limits
- **Performance**: Reasonable timeout, balanced analysis mode
- **Compatibility**: Standard formats (UTF-8, CommonMark, Asciidoctor)
- **Robustness**: Validation enabled, error handling

---

## Extension

To add new options:

1. Add structure in `conversion-options.js` file
2. Define default values
3. Update `validateOptions` function if necessary
4. Document in `conversion-options.md`
