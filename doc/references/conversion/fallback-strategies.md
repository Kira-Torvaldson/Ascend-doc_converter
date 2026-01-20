# Fallback Strategies

## Purpose

This document defines the canonical fallback strategies used by Ascend when primary conversion methods fail or are unavailable.

## Fallback Principles

### Principle 1: No Silent Fallbacks

**Rule:** Fallbacks must be explicit and logged.

**Rationale:**
- User awareness of fallback usage
- Audit trail of fallback decisions
- Debugging and troubleshooting

### Principle 2: Graceful Degradation

**Rule:** System degrades gracefully when primary methods unavailable.

**Behavior:**
- Clear error messages
- No partial conversions
- Clean failure state

### Principle 3: Format-Specific Fallbacks

**Rule:** Fallbacks are format-specific, not generic.

**Rationale:**
- Maintains conversion quality
- Prevents format corruption
- Clear error when no fallback available

## Fallback Scenarios

### Scenario 1: Module Unavailable

**Situation:** Required conversion module is not available.

**Fallback:** None

**Behavior:**
- Conversion rejected immediately
- Clear error: "Conversion module not available"
- No attempt at alternative conversion

**Rationale:** Prevents format corruption from incompatible modules.

### Scenario 2: Module Execution Failure

**Situation:** Module execution fails (crash, error).

**Fallback:** None

**Behavior:**
- Conversion marked as failed
- Error logged with details
- No retry with alternative module

**Rationale:** Failure indicates fundamental issue, not temporary problem.

### Scenario 3: Timeout

**Situation:** Conversion exceeds time limit.

**Fallback:** None

**Behavior:**
- Process terminated
- Conversion marked as failed
- Error: "Conversion timeout"

**Rationale:** Timeout indicates problem, not recoverable condition.

### Scenario 4: Resource Limit Exceeded

**Situation:** Resource limit (memory, CPU) exceeded.

**Fallback:** None

**Behavior:**
- Process terminated
- Conversion marked as failed
- Error: "Resource limit exceeded"

**Rationale:** Resource limits are hard constraints.

## No-Fallback Policy

### Rationale

**Rule:** Ascend does not implement automatic fallbacks.

**Reasons:**
1. **Format Integrity:** Fallbacks may corrupt format
2. **Predictability:** Users expect consistent behavior
3. **Error Clarity:** Clear errors better than silent fallbacks
4. **Security:** Fallbacks may introduce vulnerabilities

### User-Controlled Alternatives

**Rule:** Users can manually select alternative conversion paths.

**Process:**
1. User receives error
2. User selects alternative format/module
3. User initiates new conversion
4. New conversion with different parameters

## Future Considerations

### Potential Fallbacks (Not Implemented)

**Note:** These are potential future enhancements, not current behavior.

- **Format Approximation:** Convert to similar format when exact unavailable
- **Simplified Conversion:** Strip features when full conversion fails
- **Multi-Step Fallback:** Try alternative conversion paths automatically

**Status:** These are design considerations for future versions, not current policy.

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Fallback policies
- No-fallback rationale
- Error handling when no fallback
- Future considerations
