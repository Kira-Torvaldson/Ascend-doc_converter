# Ascend

![Version](https://img.shields.io/badge/version-0.0.1.3_Rise-orange)
![Status](https://img.shields.io/badge/status-alpha-red)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.17.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Latest changes (0.0.1.3 Rise)

- **UI (frontend)**
  - Header simplified (logo only) with stable height.
  - Logo enlarged (render tests) while keeping a compact header.
  - Footer displays the **version automatically** from `api/frontend/package.json` and includes **Copyleft**.
- **AsciiDoc → Markdown conversion**
  - On conversion failure (AsciiDoc returned instead of Markdown), a **modal** appears asking to **edit the source** and **retry** the conversion.
- **Documentation**
  - Reorganized `doc/` so only essentials remain at root level (`README.md`, `changelog.md`).
  - Merged `doc/DOCUMENTATION.md` into `doc/README.md` (full documentation is now in `doc/README.md`).
  - Glossary moved to `doc/references/glossary.md`.

## Overview

Ascend is an alpha-stage document conversion system. It runs conversions between explicitly declared formats via isolated wrappers (modules) that follow a strict interface contract. Each conversion runs in a unique temporary environment, with explicit input validation and structured logging.

The project favors contractual rigidity, passive security, and internal consistency over convenience or tolerance of ambiguous behavior.

## What this project is

Ascend is a conversion pipeline that:

- Runs conversions between explicitly declared formats
- Uses isolated wrappers (modules) that follow a uniform interface contract
- Orchestrates conversions via a deterministic linear orchestrator
- Strictly validates all inputs before processing
- Generates structured logs for each conversion
- Manages configuration through a centralized layer (EnvMap, integration in progress)
- Fails explicitly when conditions are not met

## What this project is not

Ascend is not:

- A universal converter: only explicitly declared formats are supported
- A magic detection system: formats must be explicitly provided
- A tolerant system: any ambiguous behavior is rejected
- A production-ready product: the project is in alpha, architecture is not frozen
- A user-friendly system: explicit failure is preferred over implicit tolerance
- A system with a stable public API: the internal API is unstable and may change

## General philosophy

### Determinism

Each conversion follows an explicit, predictable path. No implicit heuristics, no undeclared automatic detection.

### Explicit failure

The system fails immediately and explicitly when:
- A format is not declared
- Validation fails
- No conversion path exists
- A resource is unavailable

No attempt at "graceful recovery" or "silent fallback".

### Contractual rigidity

All modules follow a strict interface contract (`modules.interface.md`). No deviation is tolerated. A module that does not comply with the contract is rejected.

### Traceability

Each conversion produces:
- A unique identifier
- A dedicated temporary directory
- Structured logs (JSON)
- Duration metrics
- An explicit final status (success or failure)

### Predictable behavior

No magic behavior, no implicit inference. All execution paths are explicit and documented.

### Hostile treatment of inputs

All inputs are treated as potentially malicious until explicitly validated:
- Path validation (no `..`, no symlinks)
- MIME type validation
- File size validation
- Declared format validation
- Encoding validation

## Architecture

### Simplified view

```
User request
    ↓
Main orchestrator (main-orchestrator)
    ├─ Initial validation
    ├─ Load control
    ├─ Conversion path determination
    └─ Delegation to execution orchestrator
         ↓
Execution orchestrator (execution-orchestrator)
    ├─ Unique temporary directory creation
    ├─ Sequential step execution
    └─ Wrapper calls via converter orchestrator
         ↓
Converter orchestrator (converter-orchestrator)
    ├─ Appropriate converter identification
    ├─ Lazy loading
    └─ Wrapper execution
         ↓
Wrapper (downdoc, pandoc, text2markdown, etc.)
    ├─ Input validation
    ├─ Isolated conversion
    └─ Standardized return object
```

### Converters as isolated wrappers

Each converter is an isolated module that:
- Complies with the `modules.interface.md` contract
- Explicitly declares supported formats (`from` / `to`)
- Exposes a `run(inputPath, outputPath, options)` method
- Returns a standardized object: `{ success, logs, error, duration }`
- Runs in an isolated context (unique temporary directory)

### Orchestrator as linear conductor

The orchestrator:
- Determines the conversion path (direct or via intermediate format)
- Executes steps sequentially
- Manages intermediate files
- Cleans up temporary resources
- Returns a standardized result

### Controlled configuration layer

EnvMap (integration in progress) centralizes and validates access to environment variables:
- Static schema of allowed keys
- Type and range validation
- Path normalization
- No direct access to `process.env` allowed

## Contracts and invariants

The following rules are non-negotiable:

### Converter rules

- A converter never modifies the input file
- A converter never writes outside the provided `outputPath`
- A converter always returns a standardized object: `{ success, logs, error, duration }`
- A converter never reads `process.env` directly (uses EnvMap)
- A converter never accesses the system outside the provided paths
- A converter never attempts conversion outside its declared formats
- A converter never generates logs containing raw user data

### Orchestrator rules

- The orchestrator always creates a unique temporary directory per conversion
- The orchestrator always cleans up temporary resources, even on error
- The orchestrator always validates formats before running a conversion
- The orchestrator always rejects a conversion if no path exists
- The orchestrator never attempts to "guess" a missing format

### Logging rules

- Each conversion generates a unique identifier
- Each conversion generates a structured JSON log file
- No log contains raw user data
- All logs are written to a controlled directory (`api/logs`)
- Logs are accessible via the API (`/api/logs/:conversionId`)

### Security rules

- All paths are validated (no `..`, no symlinks)
- All MIME types are validated
- All file sizes are capped
- All formats are validated against a whitelist
- No network access is allowed during a conversion
- No system access outside the provided paths

## Currently supported formats

Only the following pairs are actually functional:

- **AsciiDoc → Markdown**: Via the `downdoc` wrapper
- **Markdown → AsciiDoc**: Via the `pandoc` wrapper
- **Plain text → Markdown**: Via the `text2markdown` wrapper

### Explicit limitations

- Only declared capabilities are allowed
- No implicit conversion is attempted
- No automatic format detection is performed
- Other formats (HTML, PDF, YAML, JSON, etc.) are not currently supported

### Non-functional modules

The following modules are non-functional placeholders:
- `panwriter`: Returns `success: false` with error message
- `docverter`: Returns `success: false` with error message

These modules may be added in a future version, but no promise is made.

## Logging and traceability

### Conversion identifier

Each conversion receives a unique identifier (UUID) that allows:
- Tracking the conversion in logs
- Accessing structured logs via the API
- Correlating events from the same conversion

### Unique temporary directory

Each conversion runs in a unique temporary directory:
- Created at the start of the conversion
- Systematically cleaned up at the end (even on error)
- Complete isolation between conversions

### Structured logs

Each conversion generates a JSON file in `api/logs/` containing:
- Conversion identifier
- Start and end timestamps
- Module execution order
- Input and output files for each step
- Execution duration per module
- Final status (success or failure)
- Detailed log messages (no user data)

### Duration metrics

Each conversion records:
- Total conversion duration
- Execution duration per module
- Duration of each pipeline step

### Explicit final status

Each conversion ends with an explicit status:
- `success: true`: Conversion succeeded
- `success: false`: Conversion failed (with detailed error message)

No ambiguous or partial status is returned.

## Current project state

### Alpha: concrete meaning

The "alpha" status means here:

- **Architecture still crystallizing**: Internal structure may change without notice
- **Contracts still subject to change**: Module interface may be modified
- **Partial but intentional security**: Security measures are in place but not exhaustive
- **Unstable internal API**: Internal endpoints may change between versions
- **Documentation being reorganized**: Documentation is being structured and translated

### What is stable

- Module interface contract (`modules.interface.md`)
- Standardized module return format
- Isolation-per-conversion principle
- Strict input validation principle

### What may change

- Internal orchestrator structure
- Internal API paths
- Log structure
- Security mechanisms (additions, modifications)
- Configuration layer (EnvMap integration in progress)

## Honest disclaimer

### Explicit failure by design

The system fails explicitly by design. It does not attempt "graceful recovery" or "guessing" intentions. If a condition is not met, the conversion fails immediately with an explicit error message.

### Rejection of ambiguous behavior

Any ambiguous behavior is rejected:
- Undeclared format → Failure
- Validation failed → Failure
- Non-existent conversion path → Failure
- Unavailable resource → Failure

No attempt at "fallback" or "recovery" is made.

### No indulgence intended

The system is not designed to be "tolerant" or "user-friendly". It favors:
- Internal consistency over adoption
- Rigidity over convenience
- Explicit failure over vague success
- Traceability over simplicity

### Consequences for users

Users must:
- Explicitly provide source and target formats
- Respect validation constraints
- Accept that the system fails explicitly when conditions are not met
- Not expect "magic" or "intelligent" behavior

## Installation

### Prerequisites

- Node.js >= 16.17.0
- Pandoc installed and available in PATH
- Write permissions for `api/backend/tmp` and `api/logs`

### Installing dependencies

```bash
# Backend
cd api/backend
npm install

# Frontend
cd api/frontend
npm install
```

### Environment check

```bash
cd api/backend
node bin/check-env.js
```

This script checks:
- Node.js version
- Pandoc installation
- Write permissions

## Running

### Backend

```bash
cd api/backend
npm start
```

Server starts at `http://localhost:3003`.

### Frontend

```bash
cd api/frontend
npm run dev
```

Interface starts at `http://localhost:5173`.

## Usage

### Conversion via the interface

1. Select source format (AsciiDoc, Markdown)
2. Select target format (Markdown or AsciiDoc)
3. Enter or paste content to convert
4. Click "Convert"

**Important**: Only AsciiDoc ↔ Markdown conversions are functional.

### Conversion via the API

```bash
POST /api/convert
Content-Type: application/json

{
  "text": "...",
  "from": "asciidoc",
  "to": "markdown",
  "options": {}
}
```

**Important**: The internal API is unstable and may change without notice.

### Viewing logs

```bash
GET /api/logs/:conversionId
```

Returns the structured JSON log for the conversion.

## Documentation

Documentation is organized in the `doc/` directory:

- **Specifications**: Interface contracts, module specifications
- **References**: Canonical references (formats, configuration, security)
- **Guides**: Integration and security guides

## License

MIT

See the [LICENSE](LICENSE) file for the full license text.
