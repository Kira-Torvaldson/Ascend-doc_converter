# Resource Limits

## Purpose

This document defines the canonical resource limits enforced by the Ascend pipeline. These limits protect the system from resource exhaustion and ensure fair resource allocation.

## Limit Categories

### Time Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Conversion Timeout | 30 seconds | 300 seconds | Process termination (SIGTERM → SIGKILL) |
| Token Expiration | 60 seconds | 300 seconds | Token validation |
| Request Timeout | 30 seconds | 60 seconds | HTTP timeout |

### Memory Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Per-Conversion Memory | 512 MB | 2 GB | Process monitoring + termination |
| Total System Memory | 2 GB | 4 GB | Graceful degradation |
| Input File Size | 10 MB | 50 MB | Pre-validation |

### CPU Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Per-Process CPU | 100% (1 core) | 100% (1 core) | Process priority |
| Total System CPU | 80% | 95% | Graceful degradation |

### Concurrency Limits

| Limit Type | Default Value | Maximum Value | Enforcement |
|------------|---------------|---------------|-------------|
| Concurrent Conversions | 5 | 10 | Semaphore/queue |
| Pending Requests | 20 | 50 | Request queue |

## Limit Enforcement Rules

### 1. Hard Limits

Hard limits cannot be exceeded under any circumstances:
- File size limits (validated before processing)
- Maximum timeout values
- Maximum concurrent conversions

### 2. Soft Limits

Soft limits trigger warnings or degradation:
- Memory usage approaching limit → log warning
- CPU usage high → reduce priority of new conversions
- System load high → refuse new conversions

### 3. Graceful Degradation

When limits are approached:
- New conversions are refused with clear error messages
- Existing conversions continue to completion
- System state is monitored and logged
- Recovery is automatic when load decreases

## Limit Configuration

Limits can be configured via:
- Environment variables (for deployment)
- Configuration files (for per-instance tuning)
- API parameters (for per-request overrides, within bounds)

All configuration must respect maximum values defined in this document.

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Default resource limits
- Maximum allowed values
- Enforcement mechanisms
- Degradation policies
