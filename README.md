# Ascend

![Version](https://img.shields.io/badge/version-0.0.1.7-orange)
![Status](https://img.shields.io/badge/status-alpha-red)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.17.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Latest changes (v0.0.1.7)

- **UX & CI**
  - Conversion error modal with `error.code`, hint, and request ID.
  - Docker frontend build gate (`check:docker:frontend`) in CI.
  - Footer shows source size limit; Rafale background more visible.

## Overview

Ascend is an alpha-stage document conversion system. It performs conversions between declared formats via isolated modules (wrappers) that follow a strict interface contract. Each conversion runs in a unique temporary environment, with explicit input validation and structured logging.

The project prioritizes contractual strictness, passive security, and internal consistency over convenience or tolerance for ambiguous behavior.

## What this project is

Ascend is a conversion pipeline that:

- Executes conversions between explicitly declared formats
- Uses isolated wrappers (modules) that follow a uniform interface contract
- Orchestrates conversions via a deterministic, linear orchestrator
- Strictly validates all inputs before processing
- Produces structured logs for each conversion
- Manages configuration through a centralized layer (EnvMap, being integrated)
- Fails explicitly when conditions are not met

## What this project is not

Ascend is not:

- A universal converter (only explicitly declared formats are supported)
- A “magic detection” system (formats must be explicitly provided)
- A tolerant system (ambiguous behavior is rejected)
- Production-ready (the project is alpha; architecture is not frozen)
- “User-friendly” by design (explicit failure is preferred to implicit tolerance)
- A stable public API (internal endpoints may change)

## General philosophy

### Determinism

Each conversion follows an explicit and predictable path. No implicit heuristics, no undeclared automatic detection.

### Explicit failure

The system fails immediately and explicitly when:

- A format is not declared
- A validation fails
- A conversion path does not exist
- A resource is unavailable

No “graceful recovery” attempts and no “silent fallback”.

### Contractual strictness

All modules must follow a strict interface contract (`modules.interface.md`). No deviations are tolerated. A module that violates the contract is rejected.

### Traceability

Each conversion produces:

- A unique identifier
- A dedicated temporary folder
- Structured logs (JSON)
- Duration metrics
- An explicit final status (success or failure)

### Predictable behavior

No “magic”, no implicit inference. All execution paths are explicit and documented.

### Hostile input posture

All inputs are considered potentially malicious until explicitly validated:

- Path validation (no `..`, no symlinks)
- MIME validation
- File size limits
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
    └─ Delegation to the execution orchestrator
         ↓
Execution orchestrator (execution-orchestrator)
    ├─ Create a unique temporary directory
    ├─ Sequential step execution
    └─ Wrapper calls via the converter orchestrator
         ↓
Converter orchestrator (converter-orchestrator)
    ├─ Identify the appropriate converter
    ├─ Lazy loading
    └─ Execute the wrapper
         ↓
Wrapper (downdoc, pandoc, text2markdown, etc.)
    ├─ Input validation
    ├─ Isolated conversion
    └─ Standardized return object
```

### Converters as isolated wrappers

Each converter is an isolated module that:

- Follows the `modules.interface.md` contract
- Explicitly declares supported formats (`from` / `to`)
- Exposes `run(inputPath, outputPath, options)`
- Returns a standardized object: `{ success, logs, error, duration }`
- Runs in an isolated context (unique temp folder)

### Orchestrator as a deterministic conductor

The orchestrator:

- Determines the conversion path (direct or via intermediate format)
- Executes steps sequentially
- Manages intermediate files
- Cleans up temp resources
- Returns a standardized result

### Controlled configuration layer

EnvMap (being integrated) centralizes and validates access to environment variables:

- Static schema of allowed keys
- Type/bounds validation
- Path normalization
- No direct access to `process.env` in hardened areas

## Contracts and invariants

The following rules are non-negotiable.

### Converter rules

- A converter never modifies the input file
- A converter never writes outside the provided `outputPath`
- A converter always returns `{ success, logs, error, duration }`
- A converter must not read `process.env` directly (use EnvMap / config layer)
- A converter must not access the system outside provided paths
- A converter must not attempt conversions outside declared formats
- A converter must not emit logs containing raw user content

### Orchestrator rules

- Always creates a unique temp folder per conversion
- Always cleans up temporary resources, even on error
- Always validates formats before executing conversion
- Always rejects conversion when no path exists
- Never “guesses” a missing format

### Logging rules

- Each conversion generates a unique identifier
- Each conversion generates a structured JSON log file
- Logs must not contain raw user content
- Logs are written to a controlled folder (`api/logs`)
- Logs are accessible via the API (`/api/logs/:conversionId`)

### Security rules

- All paths are validated (no `..`, no symlinks)
- All MIME types are validated
- All file sizes are capped
- All formats are validated against a whitelist
- Strict network restriction: **planned** (not fully enforced in v0.0.1.5)
- No access to the system outside provided paths

## Currently supported formats

Only the following pairs are known to be functional:

- **AsciiDoc → Markdown**: via `downdoc`
- **Markdown → AsciiDoc**: via `pandoc`
- **Plain text → Markdown**: via `text2markdown`

### Explicit limitations

- Only declared capabilities are allowed
- No implicit conversion is attempted
- No automatic format detection is performed
- Other formats (HTML, PDF, YAML, JSON, etc.) are currently not supported

### Non-functional modules

The following modules are placeholder stubs:

- `panwriter`: returns `success: false` with an error message
- `docverter`: returns `success: false` with an error message

They may be implemented in a future release; no promise is made.

## Installation

### Prerequisites

- Node.js >= 16.17.0
- Pandoc installed and available in PATH
- Write permissions for `api/backend/tmp` and `api/logs`

### Install dependencies

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

## Development

Run frontend and backend in one command from the repository root.

### Prerequisites

- Node.js >= 16.17.0

### Install (root)

```bash
npm i
```

This installs root dependencies (including `concurrently`). Sub-project dependencies (`api/frontend`, `api/backend`) must still be installed separately (see Installation) before first use.

### Start

```bash
npm run dev
# or
npm run dev:all
```

Starts frontend (Vite) and backend (Node) in parallel.

### Separate commands

```bash
npm run dev:front   # frontend only (api/frontend)
npm run dev:back    # backend only (api/backend)
```

## Running

### Backend

```bash
cd api/backend
npm start
```

Backend listens on `http://localhost:3003`.

### Frontend

```bash
cd api/frontend
npm run dev
```

Frontend listens on `http://localhost:5173`.

## Usage

### Conversion via the UI

1. Select the source format (AsciiDoc, Markdown)
2. Select the target format (Markdown or AsciiDoc)
3. Type or paste content to convert
4. Click “Convert”

**Important**: only AsciiDoc ↔ Markdown conversions are functional.

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

**Important**: the internal API is unstable and may change without notice.

### Reading logs

```bash
GET /api/logs/:conversionId
```

Returns the structured JSON log for the conversion.

## Docker

Run the app with Docker Compose: see [DOCKER.md](DOCKER.md).

```bash
docker compose up --build
```

Default URL: `https://<IP>`  
HTTP (`http://<IP>`) is redirected to HTTPS.

If ports 80/443 are not available locally, use for example `8080:80` and `8443:443` in `docker-compose.yml`, then open `https://<IP>:8443`.

### Optional static asset

For the custom background image, place `rafale.jpg` in `api/backend/public/`.  
It will be served at `/public/rafale.jpg`.

## Documentation

Documentation lives under `doc/`:

- **Specifications**: interface contracts, module specifications
- **References**: canonical references (formats, configuration, security)
- **Guides**: integration and security guides

## License

Ascend is currently released under the MIT license during its alpha phase (v0.x).

The licensing model may evolve in future major versions (v1.x and beyond), including the possibility of a proprietary core or dual licensing.

See [LICENSE](LICENSE) for the full text.
