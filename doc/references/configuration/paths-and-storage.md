# Paths and Storage Configuration

## Purpose

This document defines the canonical paths and storage locations used by Ascend. It serves as the reference for file system organization and path validation.

## Directory Structure

### Root Directories

```
Ascend/
├── api/
│   ├── backend/          # Backend application
│   ├── frontend/         # Frontend application
│   └── logs/            # Conversion logs (writable)
├── doc/                  # Documentation
├── lib/                  # Core libraries
└── test/                 # Tests
```

### Temporary Directories

**Base Path:** System temp directory (OS-specific)  
**Pattern:** `<temp-dir>/ascend-<conversion-id>/`  
**Permissions:** 0o700 (owner read/write/execute only)  
**Lifetime:** Created per conversion, deleted after completion

**Example:**
- Linux/macOS: `/tmp/ascend-<uuid>/`
- Windows: `C:\Users\<user>\AppData\Local\Temp\ascend-<uuid>\`

### Log Directory

**Path:** `api/logs/`  
**Permissions:** Writable by application  
**Content:** JSON log files, one per conversion  
**Naming:** `<conversion-id>.log`

### Static Assets

**Backend Public:** `api/backend/public/`  
**Backend Static:** `api/backend/static/`  
**Frontend Dist:** `api/frontend/dist/` (production build)

## Path Validation Rules

### 1. Absolute Paths Required

All file operations must use absolute paths:
- Input files: Resolved to absolute path before use
- Output files: Generated as absolute paths
- Temporary files: Created with absolute paths

### 2. Path Traversal Protection

All paths must be validated to prevent:
- `../` sequences
- Symlink following (in secure mode)
- Access outside authorized directories

### 3. Temporary Directory Isolation

All conversion files must be within:
- The conversion's unique temporary directory
- No access to files outside this directory
- No creation of files in system directories

### 4. Whitelist Validation

Only paths matching whitelisted patterns are allowed:
- Temporary directory pattern
- Log directory pattern
- Static asset directories (read-only)

## Storage Requirements

### Writable Directories

The following directories must be writable:
- `api/logs/` - For conversion logs
- System temp directory - For temporary conversion files
- `api/backend/public/` - For user-uploaded assets (if enabled)

### Read-Only Directories

The following directories are read-only:
- `doc/` - Documentation
- `lib/` - Core libraries
- `api/backend/static/` - Static HTML files

## Path Resolution

### Input File Resolution

1. User provides relative or absolute path
2. System resolves to absolute path
3. Validates path is within authorized scope
4. Checks file exists and is readable
5. Validates file size within limits

### Output File Resolution

1. System generates absolute path in temp directory
2. Validates path is within temp directory
3. Creates parent directories if needed
4. Writes output file
5. Returns relative path or content to user

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Directory structure
- Path validation rules
- Storage requirements
- Temporary file handling
