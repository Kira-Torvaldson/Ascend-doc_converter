# Ascend - AsciiDoc ⇄ Markdown Converter

Modern web application to convert documents between AsciiDoc and Markdown with a clear UI and modular backend services.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.17.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Run](#run)
- [Usage](#usage)
- [Architecture](#architecture)
- [API](#api)
- [Development](#development)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- Bidirectional conversion: AsciiDoc ↔ Markdown
- Modern UI with clean workflow
- File and folder import
- Document navigation (section tree)
- Result edit mode with confirmation dialogs
- Save/cancel workflow with automatic restore
- Fast copy and clear actions
- Explicit error handling

## Tech Stack

### Backend
- Node.js
- Express.js
- downdoc (AsciiDoc -> Markdown)
- Pandoc (Markdown -> AsciiDoc, HTML -> other formats)
- text2markdown (plain text -> Markdown)

### Frontend
- React 18
- TypeScript
- Vite
- CSS3

## Prerequisites

- Node.js 16.17.0+
- npm
- Pandoc (required for Markdown -> AsciiDoc and HTML conversions)
  - Install: [https://pandoc.org/installing.html](https://pandoc.org/installing.html)
  - Check: `pandoc --version`

## Installation

1. Clone the repository
```bash
git clone https://github.com/Kira-Torvaldson/ASCEND.git
cd ASCEND
```

2. Install backend dependencies
```bash
cd api/backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

## Run

### Development mode

Backend:
```bash
cd api/backend
npm run dev
```
Backend URL: `http://localhost:3003`

Frontend:
```bash
cd api/frontend
npm run dev
```
Frontend URL: `http://localhost:5173`

### Production mode

Backend:
```bash
cd api/backend
npm start
```

Frontend:
```bash
cd api/frontend
npm run build
npm run preview
```

## Usage

1. Open the UI at `http://localhost:5173`
2. Choose conversion direction
3. Paste/import content
4. Click Convert
5. Copy/edit/save the output as needed

## Docker

For containerized deployment, see `DOCKER.md` (if present on your branch).  
Default development remains local (`localhost:3003` + `localhost:5173`).

## API

### `POST /to-markdown`
Converts AsciiDoc to Markdown using downdoc.

### `POST /to-asciidoc`
Converts Markdown to AsciiDoc using Pandoc.

### `POST /from-html`
Converts HTML to target formats using Pandoc.

### `POST /text-to-markdown`
Converts plain text to Markdown using text2markdown.

### `POST /convert`
Generic conversion endpoint for supported formats.

Example:
```bash
curl -X POST http://localhost:3003/to-markdown \
  -H "Content-Type: application/json" \
  -d '{"text":"= Title\n\nAsciiDoc content"}'
```

## Architecture

```text
Ascend/
├── api/
│   ├── backend/
│   └── frontend/
├── lib/
├── test/
├── changelog.md
└── README.md
```

## Development

Backend scripts:
- `npm start`
- `npm run dev`

Frontend scripts:
- `npm run dev`
- `npm run build`
- `npm run preview`

Default ports:
- Backend: `3003`
- Frontend: `5173`

## Project Structure

- `api/backend/`: backend services, routes, conversion pipeline
- `api/frontend/`: React application and UI logic
- `api/shared/`: shared adapters and utilities
- `test/`: tests and validation scripts
- `changelog.md`: canonical release history

## Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a pull request

## License

MIT. See `LICENSE`.

## Support

Open an issue on GitHub for questions or bug reports.
