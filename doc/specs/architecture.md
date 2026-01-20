# Architecture Specification

## Purpose

This document defines the canonical architecture of Ascend. It describes the system components, their relationships, and architectural principles.

## Architectural Principles

### Principle 1: Local-First

**Definition:** All processing occurs locally, no external dependencies.

**Implementation:**
- No network access during conversion
- No external API calls
- All engines run locally
- Data never leaves the system

### Principle 2: Modularity

**Definition:** System composed of independent, interchangeable modules.

**Implementation:**
- Standard module interface
- Lazy loading of modules
- Module isolation
- Extensible architecture

### Principle 3: Isolation

**Definition:** Each conversion executes in complete isolation.

**Implementation:**
- Unique temporary directory per conversion
- No shared state
- Resource limits per conversion
- Clean separation of concerns

### Principle 4: Security by Design

**Definition:** Security built into architecture, not added later.

**Implementation:**
- Input validation at boundaries
- Sandboxed execution
- Resource limits
- Comprehensive logging

## System Components

### Frontend Layer

**Technology:** React 18 + TypeScript + Vite

**Components:**
- UI components (Panel, FormatSelector, Modal, etc.)
- Conversion services (API clients)
- Batch processing service
- State management (React hooks)

**Responsibilities:**
- User interface
- User interaction
- API communication
- Client-side validation

### Backend Layer

**Technology:** Node.js + Express

**Components:**
- API routes (conversion, security, logs)
- Conversion services
- Security modules
- Logging system
- Orchestrators

**Responsibilities:**
- Request handling
- Conversion orchestration
- Security enforcement
- Resource management

### Conversion Layer

**Technology:** Module-based architecture

**Components:**
- Conversion modules (downdoc, pandoc, text2markdown, etc.)
- Lazy loading system
- Converter orchestrator
- Execution orchestrator

**Responsibilities:**
- Format conversion
- Module selection
- Execution coordination
- Result validation

### Security Layer

**Technology:** Integrated security modules

**Components:**
- Pipeline security (concurrency, resources, anomalies)
- Input validation
- Sandboxing (V1: light, V2: enhanced)
- Token management

**Responsibilities:**
- Security enforcement
- Threat detection
- Resource protection
- Audit logging

## Data Flow

### Conversion Request Flow

1. **Frontend:** User initiates conversion
2. **API:** Request received and validated
3. **Security:** Security checks (concurrency, resources, validation)
4. **Orchestrator:** Conversion path determined
5. **Module:** Conversion executed
6. **Result:** Output validated and returned
7. **Cleanup:** Resources released

### File Flow

1. **Input:** User content → Temporary file
2. **Processing:** Temporary file → Module → Temporary output file
3. **Output:** Temporary output file → Result content
4. **Cleanup:** All temporary files deleted

## Component Relationships

### Frontend ↔ Backend

**Communication:** HTTP REST API  
**Protocol:** JSON  
**Authentication:** None (local-first)  
**Security:** CORS, input validation

### Backend ↔ Modules

**Communication:** File-based  
**Protocol:** File paths, standard interface  
**Isolation:** Temporary directories  
**Security:** Sandboxing, resource limits

### Orchestrator ↔ Modules

**Communication:** Standard interface  
**Protocol:** `run(inputPath, outputPath, options)`  
**Coordination:** Sequential execution  
**Security:** Validation, monitoring

## Architectural Patterns

### Pattern 1: Pipeline Architecture

**Description:** Linear processing pipeline with stages.

**Stages:**
1. Input validation
2. Preparation
3. Execution
4. Finalization
5. Cleanup

### Pattern 2: Module Registry

**Description:** Central registry of available modules.

**Implementation:**
- Converter orchestrator maintains registry
- Dynamic module discovery
- Lazy loading on demand

### Pattern 3: Orchestrator Pattern

**Description:** Main orchestrator delegates to execution orchestrator.

**Separation:**
- Main: Request handling, load control
- Execution: Step-by-step execution

## Canonical Status

This document is **canonical** and defines the source of truth for:
- Architectural principles
- System components
- Data flow
- Component relationships
