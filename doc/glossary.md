# Glossary

## Purpose

This document defines canonical terminology used throughout Ascend documentation and codebase.

## Terms

### A

**AsciiDoc**  
A lightweight markup language for writing documents. Supported input and output format in Ascend.

### B

**BOM (Byte Order Mark)**  
A Unicode character used to indicate text encoding. Removed by Ascend's normalization process.

**Batch Processing**  
Processing multiple files in a single operation with progress tracking.

### C

**Canonical**  
Authoritative, definitive reference. Documents marked as canonical are the source of truth.

**Conversion**  
Process of transforming a document from one format to another.

**Conversion ID**  
Unique identifier (UUID) assigned to each conversion operation.

**Converter**  
Module that performs format conversion (e.g., downdoc, pandoc).

### D

**Downdoc**  
JavaScript library for converting AsciiDoc to Markdown. Used by Ascend's downdoc module.

### E

**Engine**  
Conversion engine or module that performs format transformation.

**Execution Profile**  
Configuration profile defining resource limits and execution parameters.

### F

**Format**  
Document format identifier (e.g., `markdown`, `asciidoc`, `html`).

**Format Whitelist**  
List of formats explicitly allowed for conversion. Formats not in whitelist are rejected.

### I

**Isolation**  
Principle that each conversion executes in complete isolation from others.

### L

**Lazy Loading**  
Technique of loading modules only when needed, reducing initial memory footprint.

**Local-First**  
Architecture principle where all processing occurs locally without external dependencies.

### M

**Markdown**  
Lightweight markup language. Supported input and output format in Ascend.

**Module**  
Independent conversion unit conforming to the standard module interface.

**Module Interface**  
Standard contract that all conversion modules must implement.

### N

**Normalization**  
Process of standardizing text representation (encoding, characters, formatting).

### O

**Orchestrator**  
Component that coordinates conversion execution and module selection.

### P

**Pandoc**  
Universal document converter. Used by Ascend for Markdown → AsciiDoc and other conversions.

**Pipeline**  
Sequence of stages that process a conversion from input to output.

**Placeholder**  
Module that is defined but not yet implemented. Returns error if called.

### S

**Sandboxing**  
Isolation technique that restricts module access to system resources.

**Smart Quotes**  
Typographic quotation marks (curly quotes) that are normalized to standard ASCII quotes.

### T

**Temporary Directory**  
Unique, isolated directory created for each conversion. Deleted after completion.

**Token**  
Cryptographically secure token used for conversion confirmation.

### U

**UUID**  
Universally Unique Identifier. Used for conversion IDs and temporary directory names.

### W

**Whitelist**  
List of explicitly allowed values. Anything not in the whitelist is rejected.

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Terminology definitions
- Acronym explanations
- Concept clarifications
