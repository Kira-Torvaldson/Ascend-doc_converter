> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Execution Profile Configuration

## Purpose

This document defines the canonical execution profiles that control how conversions are executed. Execution profiles determine resource limits, timeout values, and concurrency controls.

## Profile Types

### Default Profile

**Identifier:** `default`  
**Use Case:** Standard document conversions  
**Resource Limits:**
- **Timeout:** 30 seconds
- **Max Memory:** 512 MB
- **Max CPU:** 100% (single core)
- **Max File Size:** 10 MB
- **Concurrent Conversions:** 5

### Strict Profile

**Identifier:** `strict`  
**Use Case:** High-security environments, untrusted inputs  
**Resource Limits:**
- **Timeout:** 15 seconds
- **Max Memory:** 256 MB
- **Max CPU:** 50% (single core)
- **Max File Size:** 5 MB
- **Concurrent Conversions:** 2

### Performance Profile

**Identifier:** `performance`  
**Use Case:** Large files, batch processing  
**Resource Limits:**
- **Timeout:** 120 seconds
- **Max Memory:** 2 GB
- **Max CPU:** 100% (single core)
- **Max File Size:** 50 MB
- **Concurrent Conversions:** 3

## Profile Selection

Profiles are selected based on:
1. Explicit user configuration (if provided)
2. Conversion type (simple vs. complex)
3. System load conditions
4. Security requirements

## Resource Limit Enforcement

All resource limits are enforced at the pipeline level:
- **Timeout:** Applied via process monitoring and SIGTERM/SIGKILL
- **Memory:** Monitored via process RSS tracking
- **CPU:** Limited via process priority and scheduling
- **File Size:** Validated before conversion starts
- **Concurrency:** Enforced via semaphore/queue mechanism

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Default resource limits
- Profile configurations
- Timeout values
- Concurrency controls
