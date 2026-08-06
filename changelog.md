# Changelog

## Purpose

This document provides a canonical record of changes to Ascend. It follows semantic versioning and documents all notable changes.

## Format

Each entry includes:
- Version number
- Release date
- Changes (Added, Changed, Fixed, Removed, Security)

## Version History

### 0.0.1.9.3 (2026-08-06)

#### Added
- Account UI language (`profile.uiLanguage`) translates Ascend UI (FR / EN / ES / DE) via `i18n` catalogs + `LocaleProvider`.
- Conversion language (`profile.defaultLanguage`) kept separate for document metadata only.
- Account identity presets (Perso / Pro / Client), signature templates, metadata fill, and interface accents (including metals).

#### Changed
- Converter chrome, settings (Compte / Conversion / Interface / Données / Métriques), modals, history, find/replace, and status/snackbars wired to `useT()` / `translate()`.
- Conversion status messages can be localized via optional labels on `convertText`.

### 0.0.1.9.2 (2026-08-05)

#### Added
- Fail-contracts e2e for `/api/from-markdown`, `/api/from-text`, `/api/from-html` (`EMPTY_INPUT`, `FORMAT_UNSUPPORTED`, `EMPTY_OUTPUT`, timeouts where applicable).
- Conversion metrics: `errors_by_code`, `errors_by_code_top`, `failures_by_route` ; persist ring buffer to `reports/conversion-metrics.json`.
- Settings → Métriques pane (`GET /api/metrics`) with auto-refresh ; header badge when failures > 0.
- UX banner for `ENGINE_FALLBACK` + stronger timeout hints.
- Shared verify helper `scripts/lib/verify-exit.js` (`exitClean`) for clean Pandoc shutdown in tests.

#### Changed
- Pandoc server shutdown on Windows uses `taskkill /T /F` ; verify/bench scripts exit cleanly.
- `/api/from-html` calls `htmlConversion.htmlToMarkdown` / `htmlToPlain` via module object (stubbable contracts).
- `check:ascend` / `check:ascend:ci` include `test:metrics` and from-text / from-markdown failure contracts.

#### Fixed
- Truncated string in `ConversionWarningsBanner` that broke frontend typecheck.

### 0.0.1.9.1 (2026-08-05)

#### Added
- `POST /api/from-markdown` (Markdown → HTML / TXT / AsciiDoc) and `POST /api/from-text` (TXT → HTML / Markdown) with `ConversionResult`.
- Dedicated UI result buffer `otherOutput` so Markdown→HTML/TXT never overwrites the Markdown source.
- Code `EMPTY_OUTPUT` (error envelope + UI messages) when conversion returns empty content.
- UI helpers `conversionPairs` / `sanitizeHtmlPreview` ; import `.html` / `.htm` as source.
- E2E script `verify-e2e-from-markdown-representative-scenarios.js` (wired in `check:ascend:ci`).

#### Changed
- Session draft persists/restores `otherOutput` ; history, ZIP, and diff read the correct result buffer.
- Client conversion timeout aligned with backend limits ; previous in-flight request aborted on new attempt.
- `markdownToPlainBestEffort` falls back locally only for non-timeout Pandoc failures ; timeouts rethrown.
- `/api/from-html` response keys normalized (`md`→`markdown`, `text`→`txt`).
- Result preview: HTML in sandboxed iframe ; Texte/Aperçu toggle only for rich formats.

#### Fixed
- Markdown→HTML/TXT UI path (wrong endpoint, format selectors, empty/clobbered result).
- Auto-history saving Markdown source instead of HTML/TXT result.
- Stale HTML/TXT result when changing source/target formats.

### 0.0.1.9 (2026-08-05)

#### Added
- Native `ConversionResult` on the Pandoc command path (success + structured failure codes).
- HTML wrappers `html-markdown` / `html-plain` (HTML ↔ MD / TXT) registered before Pandoc.
- Shared `orchestrator-result.js` helpers; `proxy-failure.js` classification by `error.code`.
- Verify scripts: `test:pandoc-result`, `test:proxy-failure-classify`, `test:html-wrappers`.

#### Changed
- Orchestrators (main / execution / converter) propagate structured `error` objects (no stringify).
- Early failures use canonical codes (`EMPTY_INPUT`, `FORMAT_UNSUPPORTED`, `RESOURCE_LIMIT_EXCEEDED`, …).
- `finalizeLog` + `releaseBudget` on main/converter teardown; parent `conversionId` kept across steps.
- Pandoc binary resolution: existing absolute path, else PATH (`pandoc`) — Windows-friendly.

#### Fixed
- Proxy `classifyProxyFailure` no longer collapses structured errors to generic `CONVERSION_FAILED`.

### 0.0.1.8.5 (2026-08-05)

#### Added
- Table cell-span path (Pandoc GFM + HTML colspan) with HTML→AsciiDoc roundtrip; golden `08-table-span`.
- Image width/height preservation; portable callout markers `(n)`; unresolved `{attr}` warnings (`ATTRIBUTE_UNRESOLVED`).
- `INCLUDE_NOT_RESOLVED` / attribute warnings surfaced with `code:` prefix in the UI banner.
- Simple HTML tables without spans normalized to pipe tables.

#### Changed
- Verification scripts (`golden`, `roundtrip`, `precision`, `admonitions`) shut down the Pandoc server on exit.

#### Fixed
- Pandoc dropping document titles on span-only tables; literal `&#10;` in GFM HTML tables.

### 0.0.1.8.4 (2026-08-05)

#### Added
- Conversion precision pipeline (`conversion-precision.js`) : definition lists, multi-paragraph admonitions, xref/anchor preservation, AsciiDoc bold in note bodies, Pandoc fallback for table cell spans.
- Soft-auto capacity profile (`capacity-profile.js`) deriving input/concurrency/timeout ceilings from host RAM/CPU (override via `ASCEND_CAPACITY=manual`).
- Shared `normalize-admonitions.js` ; verification scripts `test:admonitions`, `test:precision`, `test:capacity`.
- Golden fixtures `06-definition-list`, `07-admonition-multipara` ; roundtrip rules for new cases.
- Editor extractions `ConversionSidebar`, `AppConfirmModals` ; deferred text stats / lighter gutter.

#### Changed
- Admonitions normalize to portable Markdown blockquotes (`> **NOTE:**`) in default and BookStack modes.
- CI `check:ascend` / `check:ascend:ci` include admonition, precision, and capacity checks.
- Golden expected outputs for admonition and xref updated to the more precise forms.

#### Fixed
- BookStack hard-break/`**` mangling on note labels ; CRLF breaking AsciiDoc admonition blocks.
- Local MD→AsciiDoc nested lists flattened ; code fences missing `[source,lang]`.

### 0.0.1.8.3 (2026-08-04)

#### Added
- Settings rail navigation (Compte / Interface / Données); interface presets (Clair / Sombre / Minimal); editor font family.
- Settings export/import bundle with custom page background; default conversion profile applied only on empty session.
- Conversion profiles section, session draft, find/replace, diff panel, line numbers, and related editor utilities.
- `Ctrl+,` opens Settings; advanced UI options nested under Settings → Interface.

#### Changed
- Header/navbar sober chrome; Convert CTA removed from header and reinforced in Source panel.
- Sidebar and footer visual alignment with header/settings (calmer accents, consistent tokens).
- Settings multi-section accordion replaced by single active rail section; version sync check no longer requires hard-coded App.tsx label.

### 0.0.1.8.2 (2026-08-04)

#### Added
- Custom format / settings listboxes; « Autres options » category picker; panel actions menu (⋯) and dedicated clear buttons.
- Unified snackbar; mobile Source/Résultat tabs and drawer sidebar; live page-background preview in Settings.
- Keyboard shortcuts hook (`Ctrl/Cmd+Enter`, `S`, `K`, `H`, `/`) with modernized help modal.
- Conversion warnings banner from `ConversionResult.warnings` (success path).
- Extracted UI modules: `AppHeader`, `NavigationWindow`, `SourcePanel`, `ResultPanel`, `OtherOptionsPanel`, `AppFooter`, `ShortcutsHelpModal`.

#### Changed
- Footer simplified (brand, version, license, author).
- `App.tsx` further split for maintainability; `ConversionOptions` type moved to shared types.

### 0.0.1.8.1 (2026-08-03)

#### Added
- Custom page background option in Settings → Interface: decorative SVG, server photo (`rafale.jpg`), or personal image (localStorage, auto-compressed).
- Empty editor states with one-click sample documents.
- Unified Ascend confirmation modal (Escape, focus trap, theme-aware) for settings discard, history clear, edit/save/cancel, clear source/result, and conversion confirm/error.
- Floating-window chrome shared by Settings, History, and Navigation (min/max, taskbar, Escape).

#### Changed
- Photo backgrounds use contain + ambient blur fill (no aggressive crop/zoom); sidebar and header stay opaque theme colors over custom backgrounds.
- History modal upgrades: search, status chips, day groups, preview, keyboard navigation.

### 0.0.1.8 (2026-08-03)

#### Added
- `POST /api/convert` — standardized `ConversionResult` contract: success returns legacy fields plus `conversionResult`; failures return the ConversionResult shape with `detail` (same convention as the migrated conversion routes).
- `POST /api/proxy/convert` — `conversionResult` added alongside the legacy `{ success, result | error }` shape (kept for bulk-processor compatibility).
- Contract verification scripts `verify-e2e-convert-contract.js` and `verify-e2e-proxy-convert-contract.js`, wired into `check:ascend:ci`.
- Error envelope: `CONFIRMATION_*` codes mapped to `VALIDATION_ERROR` category with French hints.
- EnvMap schema keys: `API_KEY` (sensitive), `FRONTEND_URL`, `ASCEND_REPORTS_DIR`.
- Pandoc scenario (markdown → html) in `verify-e2e-convert-contract.js`, executed when the Pandoc binary is available (CI/Docker) and skipped otherwise.
- `POST /api/roundtrip` — `conversionResult` added alongside the legacy `{ success, state, logs, errors }` shape (last conversion route without the contract).
- Contract verification script `verify-e2e-roundtrip-contract.js`, wired into `check:ascend:ci` (success scenario conditional on Pandoc availability).

#### Performance
- Persistent Pandoc server (`pandoc server`, Pandoc >= 3.0): text conversions skip the per-request binary startup (~50 ms saved per request locally, more under load); lazy start, automatic CLI fallback when unavailable, opt-out via `PANDOC_SERVER_ENABLED=false` (new EnvMap key). Pandoc output line endings normalized to LF on both paths.
- `/api/to-markdown` runs fully in memory (direct `convertAsciiDoc`: downdoc with Pandoc fallback) — no temp directory, no disk I/O at all on the hot path.
- Pandoc helpers (`/api/to-asciidoc`, `/api/from-html` text formats) pipe input via stdin and read stdout (`safeSpawn` gained `stdinData` support) — no temp files; binary output formats (pdf/docx/epub) keep the file-based path.
- Conversion routes and converters no longer block the event loop on large documents: all remaining temp-file I/O in the request path (`adoc-to-md.converter`, `secure-converter`, roundtrip pipeline and route) is now async (`fs/promises`).
- `MimeTypeDetector` reads a 4 KB sample instead of the whole file, and the plain-text heuristic loops over char codes instead of allocating one string per character.
- `basicCleanup` (downdoc post-processing) rewritten as a single pass over the document instead of ~7 full regex/split passes (golden corpus verified identical).
- Roundtrip pipeline reuses already-read contents instead of re-reading both output files on success.
- HTTP response compression (`compression`, threshold 1 KB): multi-MB converted documents shrink drastically over the wire.
- Pandoc helpers in `convert.js` use the EnvMap `CONVERSION_TIMEOUT_MS` instead of a hardcoded 30 s.
- New `bench-large-doc.js` script to measure large-document latency (4 MB ≈ 0.5 s on `/api/to-markdown`).

#### Changed
- `api-key.middleware`, `cors.middleware`, and `/api/metrics` now read configuration through EnvMap instead of `process.env`.
- Zod validation failures (`validate.middleware`) now return the standardized error envelope (`error.code = INVALID_INPUT`, category, hint, issues in `error.details`) instead of `{ error: 'Invalid request', issues }`.
- EnvMap is now the single configuration source: `server.js`, `error-handler.middleware`, `structured-logger`, and `pipeline-security` no longer read `process.env` directly (legacy fallbacks removed).
- `secure-converter.js` limits aligned with EnvMap: `MAX_FILE_SIZE` follows `MAX_INPUT_SIZE_MB` and `DEFAULT_TIMEOUT` follows `CONVERSION_TIMEOUT_MS` (previously hardcoded 50 MB / 30 s).

#### Fixed
- `/api/convert` was failing at runtime for every conversion: `detectUnauthorizedAccess` was declared `static` but called on the instance, and the lazyload module require path was wrong in `secure-converter.js`.
- `ConfirmationTokenError` swapped `code` and `message` fields (constructor argument order).
- Token cleanup interval in `secure-converter.js` kept one-shot scripts and test runners from exiting (`unref()`).
- `SecurityLogger` never created its log directory (directory creation lived in a constructor that static methods never invoke), so security and anomaly logs failed with `ENOENT`.

#### Removed
- `api/backend/config/index.js` — dead configuration module (no remaining references).
- `api/backend/server-legacy.js` — legacy server entry point (no remaining references).

### 0.0.1.7 (2026-06-17)

#### Added
- `npm run check:docker:frontend` and `check:docker` — build `container/frontend/Dockerfile` + nginx SPA check.
- CI job `docker` — frontend image build step.
- Footer: source size limit and runbook hint.
- Conversion error modal: `error.code`, hint, and `requestId`.

#### Changed
- Rafale background visibility (lighter overlays when custom photo is loaded).
- `HistoryModalV2` panel uses theme modal CSS variables.
- Structured conversion failures open the error modal for all backend `error.code` values.

### 0.0.1.6 (2026-06-15)

#### Added
- Default page background SVG bundled with the frontend; optional `rafale.jpg` from `api/backend/public/`.
- UI components `ConversionLoadingBanner` and `HeaderStatusPill` (conversion status in header).
- `api/backend/public/README.md` — static asset setup guide.

#### Changed
- Header layout (logo, title, conversion status pill); harmonized panel buttons and loading banners.
- Settings panel texts use theme-aware CSS classes; release notes updated in UI.
- Runbook and `container/README.md` — Docker client version, WSL troubleshooting, CORS dev note.
- CORS middleware: allow any `http://localhost` / `127.0.0.1` origin in development (Vite port fallback).

#### Fixed
- Page background not rendering when `rafale.jpg` was missing (CSS variable `url()` resolution).
- Broken `.settings-field-error` CSS rule (PostCSS parse error).

### 0.0.1.5 (2026-06-05)

#### Added
- `npm run check:docker:backend` — build `container/backend/Dockerfile` and verify Pandoc in the image.
- CI job `docker` — backend image build gate on every push/PR.

#### Changed
- Version alignment across frontend/backend packages, lockfiles, README badge, and app metadata.
- Runbook and roadmap updated for Docker build validation before `0.0.2.0` beta.

### 0.0.1.4.9 (2026-06-05)

#### Added
- `npm run check:ascend:ci` — single validation chain for CI (version sync, e2e, golden, roundtrip, abuse).

#### Changed
- CI job `ascend` simplified to `check:ascend:ci` with root `npm ci` for Mocha abuse tests.
- Version alignment across frontend/backend packages, lockfiles, README badge, and app metadata.

### 0.0.1.4.8 (2026-06-03)

#### Added
- Golden fixture `adoc/complex/05-xref.adoc` and `adoc/simple/06-utf8.adoc`; Markdown fixture `markdown/complex/01-table.md`.
- CI e2e for `/api/text-to-markdown` and `/api/from-html` (representative + failure contracts).
- French UI messages and hints for all `SECURITY_ERROR_CODES`.

#### Changed
- Roundtrip semantic checks target cross-references (`05-xref`) instead of UTF-8 in the complex set.
- Version alignment across frontend/backend packages, lockfiles, README badge, and app metadata.

### 0.0.1.4.7 (2026-05-28)

#### Added
- Scripts `release:bump` and `check:version` (7 version zones).
- CI job **ascend** (golden corpus, roundtrip, e2e, API abuse tests).
- Golden corpus and semantic adoc ↔ md roundtrip tests.
- Structured error envelope (`error.code`, `category`, `hint`) and UI messages.
- `X-Request-Id` / `meta.requestId` correlation.
- `GET /api/metrics` and `GET /api/config/limits`.
- Pandoc in `container/backend` Docker image.
- Operations runbook (`doc/guides/operations/runbook.md`).

#### Changed
- Unified input limit **5 MB** (EnvMap, Express, modules, UI, Nginx 6m).
- Release alignment for frontend/backend package versions, lockfiles, README badge, and app metadata.

### 0.0.1.4.6 (2026-04-02)

#### Changed
- Extended `ConversionResult` contract documentation (Steps 10–11, Step 11 closure, handoff baseline).
- AsciiDoc → Markdown wrapper alignment and related e2e verification scripts for `/api/to-markdown`.
- Aligned README badge, package versions, and displayed app metadata to `0.0.1.4.6` (frontend/backend).

### 0.0.1.4.4 (2026-03-24)

#### Changed
- Stabilized frontend conversion states: reset of modified/editing markers after restore and clear actions.
- Blocked conversion launch while result panel is in edit mode to avoid invalid mixed states.
- Unified frontend pre-conversion validation messages for empty source and oversized source (2 MB).
- Polished modal wording and button consistency for clearer user-facing behavior.
- Aligned displayed app metadata and package versions to `0.0.1.4.4` (frontend/backend).

#### Fixed
- Fixed stale result editing state after source/result clear flows.
- Fixed inconsistent “What’s New” section version label in settings.
- Fixed footer author wording typo (`Made by TBE`).

### 0.0.1.4.3.1 (2026-03-23)

#### Changed
- Repository hygiene hotfix release after `0.0.1.4.3`
- Untracked generated dependencies and frontend build artifacts from Git index
- Preserved local development files while removing generated-file noise from version control

#### Impact
- No functional runtime change
- Cleaner diffs and safer maintenance workflow

### 0.0.1.4.3 (2026-03-23)

#### Added
- HTTPS-first Docker documentation by IP with fallback mapping guidance (`8080:80`, `8443:443`)
- Optional static asset guidance for background image (`/public/rafale.jpg`)
- Release synchronization across root and canonical documentation

#### Changed
- Root README files aligned with current Docker runtime behavior
- Canonical documentation version references aligned to `0.0.1.4.3`

### 0.0.1.4.2 (2026-03-23)

#### Added
- Validation and release-note updates for the general documentation flow

#### Changed
- Modified version badges and synchronized changelog entries across docs

### 0.0.1.4.1 (2026-03-23)

#### Changed
- Version bump to `0.0.1.4.1`

### 0.0.1.4 (2026-03-23)

#### Added
- Settings panel improvements (movable/resizable)
- Docker workflow integration and section state defaults

### 0.0.1.3 Rise (2026-01-27)

#### Added
- Complete documentation reorganization
- Canonical reference structure (`doc/references/`)
- New documentation categories (core, configuration, security, conversion, API, UI, profiles)
- Specifications directory (`doc/specs/`)
- Glossary and changelog
- Module interface specification

#### Changed
- Documentation structure reorganized for future-proof machine-readable configuration
- All documentation now in English (technical precision)
- Clear separation between canonical references and specifications
- Documentation ready for 1:1 mapping to `ascend.reference.json`

### 0.0.1.2.1 alpha (2026-01-19)

#### Added
- Environment diagnostic script (`api/backend/bin/check-env.js`)
- Data normalization proxy (`api/backend/services/proxy/secure-proxy.js`)
- Batch processing service (`api/frontend/services/bulk-processor.ts`)
- Comprehensive documentation reorganization

#### Changed
- Documentation structure reorganized into canonical references
- Version synchronization across all components
- README updated to reflect current limitations

#### Fixed
- Import path corrections in orchestrator modules
- Backend startup issues resolved

### 0.0.1.2.1 alpha (2026-01-19)

#### Added
- Structured logging system
- Log API endpoints (`/api/logs`, `/api/logs/:id`)
- Log viewing script (`api/logs/list-logs.js`)

#### Changed
- Backend reorganization (routes, middleware, services)
- Module exports clarified
- README consolidation

### 0.0.1.2.1 alpha (2026-01-19)

#### Added
- Text2Markdown module (placeholder → functional)
- PanWriter module (placeholder)
- Docverter module (placeholder)
- Converter orchestrator module
- Main and execution orchestrators
- Lazy loading module

#### Changed
- Module interface standardization
- Conversion routing via orchestrator

### 0.0.1.1 alpha (2026-01-19)

#### Added
- Initial release
- AsciiDoc ↔ Markdown conversion
- Basic UI
- Security framework (V1)
- Conversion options system

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Version history
- Change tracking
- Release dates
- Feature additions and removals
