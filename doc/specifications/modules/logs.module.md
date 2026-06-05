# Structured Logging Module

## Description

The structured logging module generates JSON log files for each conversion, enabling detailed tracking, audit, and easy debugging. Logs are stored in a controlled directory and accessible via an API endpoint.

## Module Name

**Identifier:** `structured-logger`  
**Type:** Logging module  
**Role:** Generation and management of structured logs for conversions

## Objective

Provide a structured, accessible, and readable logging system for each conversion, enabling:
- Detailed tracking of conversion execution
- Audit and compliance
- Facilitated debugging
- Performance analysis
- Preparation for integration with dashboards or analysis systems

## Log Structure and JSON Format

### Complete Structure

```json
{
  "conversionId": "uuid-unique",
  "timestamp": {
    "start": "2024-01-01T12:00:00.000Z",
    "end": "2024-01-01T12:00:05.123Z"
  },
  "formats": {
    "source": "asciidoc",
    "target": "markdown"
  },
  "status": "success",
  "execution": {
    "steps": [
      {
        "stepNumber": 1,
        "module": "downdoc",
        "fromFormat": "asciidoc",
        "toFormat": "markdown",
        "inputFile": "step0_input.adoc",
        "outputFile": "step1_output.md",
        "duration": 1.234,
        "status": "success",
        "logs": ["Log message 1", "Log message 2"],
        "error": null
      }
    ],
    "totalDuration": 5.123,
    "modulesExecuted": ["downdoc", "pandoc"]
  },
  "files": {
    "input": "input.adoc",
    "output": "final_output.md",
    "intermediate": [
      {
        "step": 1,
        "file": "step1_output.md"
      }
    ]
  },
  "logs": [
    {
      "timestamp": "2024-01-01T12:00:00.000Z",
      "level": "info",
      "message": "Main orchestrator started"
    }
  ],
  "error": null,
  "metadata": {
    "contentSize": 1024
  }
}
```

### Detailed Fields

#### `conversionId`
- **Type:** `string`
- **Description:** Unique conversion identifier (UUID)
- **Example:** `"550e8400-e29b-41d4-a716-446655440000"`

#### `timestamp`
- **Type:** `object`
- **Description:** Conversion start and end timestamp
- **Fields:**
  - `start`: Start date in ISO 8601 format
  - `end`: End date in ISO 8601 format (null if in progress)

#### `formats`
- **Type:** `object`
- **Description:** Source and target formats of the conversion
- **Fields:**
  - `source`: Source format (e.g., "asciidoc", "markdown", "html")
  - `target`: Target format (e.g., "markdown", "asciidoc", "pdf")

#### `status`
- **Type:** `string`
- **Description:** Final conversion status
- **Possible Values:**
  - `"running"`: Conversion in progress
  - `"success"`: Conversion successful
  - `"error"`: Conversion failed

#### `execution`
- **Type:** `object`
- **Description:** Information about conversion execution
- **Fields:**
  - `steps`: Array of execution steps (see below)
  - `totalDuration`: Total duration in seconds (decimal number)
  - `modulesExecuted`: List of executed modules (array of strings)

#### `execution.steps[]`
- **Type:** `array` of objects
- **Description:** Details of each execution step
- **Fields per step:**
  - `stepNumber`: Step number (integer, starts at 1)
  - `module`: Name of executed module (e.g., "downdoc", "pandoc")
  - `fromFormat`: Step source format
  - `toFormat`: Step target format
  - `inputFile`: Input file name (basename only)
  - `outputFile`: Output file name (basename only)
  - `duration`: Execution duration in seconds (decimal number)
  - `status`: Step status ("success", "error", "skipped")
  - `logs`: Detailed step logs (array of strings)
  - `error`: Error message (null if success)

#### `files`
- **Type:** `object`
- **Description:** Information about used files
- **Fields:**
  - `input`: Input file name (basename only)
  - `output`: Output file name (basename only)
  - `intermediate`: Array of intermediate files

#### `files.intermediate[]`
- **Type:** `array` of objects
- **Description:** List of created intermediate files
- **Fields:**
  - `step`: Step number that created the file
  - `file`: File name (basename only)

#### `logs`
- **Type:** `array` of objects
- **Description:** Detailed log messages
- **Message structure:**
  - `timestamp`: Timestamp in ISO 8601 format
  - `level`: Log level ("info", "warn", "error", "debug")
  - `message`: Log message
  - Other optional metadata

#### `error`
- **Type:** `string | null`
- **Description:** Error message if conversion failed (null if success)

#### `metadata`
- **Type:** `object`
- **Description:** Additional metadata (without sensitive data)
- **Fields:**
  - `contentSize`: Content size in characters (optional)

## API Endpoint: `/api/logs`

### GET `/api/logs/:conversionId`

Retrieves the log of a specific conversion.

**Parameters:**
- `conversionId` (required): Unique conversion identifier

**Success Response (200):**
```json
{
  "conversionId": "uuid-unique",
  "timestamp": { ... },
  "formats": { ... },
  "status": "success",
  "execution": { ... },
  "files": { ... },
  "logs": [ ... ],
  "error": null,
  "metadata": { ... }
}
```

**Error Response (404):**
```json
{
  "error": true,
  "code": "LOG_NOT_FOUND",
  "message": "Log not found for conversion ID: uuid-unique"
}
```

**Usage Example from Terminal:**
```bash
# With curl
curl http://localhost:3003/api/logs/550e8400-e29b-41d4-a716-446655440000

# With curl and jq to format JSON
curl -s http://localhost:3003/api/logs/550e8400-e29b-41d4-a716-446655440000 | jq

# Save to file
curl -s http://localhost:3003/api/logs/550e8400-e29b-41d4-a716-446655440000 > conversion.log

# With Node.js script (from api/logs/)
cd api/logs
node list-logs.js                                    # List all logs
node list-logs.js {conversionId}                    # Display specific log
```

### GET `/api/logs`

Lists all available logs.

**Query Parameters:**
- `limit` (optional): Maximum number of logs to return (default: 100)

**Success Response (200):**
```json
{
  "success": true,
  "count": 10,
  "logs": [
    {
      "conversionId": "uuid-1",
      "filename": "uuid-1.log",
      "size": 2048,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "modifiedAt": "2024-01-01T12:05:00.000Z"
    },
    {
      "conversionId": "uuid-2",
      "filename": "uuid-2.log",
      "size": 1536,
      "createdAt": "2024-01-01T12:10:00.000Z",
      "modifiedAt": "2024-01-01T12:15:00.000Z"
    }
  ]
}
```

**Usage Example from Terminal:**
```bash
# List all logs
curl http://localhost:3003/api/logs

# List with limit
curl "http://localhost:3003/api/logs?limit=50"

# Format with jq
curl -s http://localhost:3003/api/logs | jq '.logs[] | {conversionId, status, duration: .execution.totalDuration}'
```

## Metrics and Collected Data

### Performance Metrics

- **Total Duration:** Total conversion execution time
- **Duration per Step:** Execution time of each module
- **Execution Order:** Exact sequence of executed modules

### File Metrics

- **Input File:** Name and path (sanitized) of source file
- **Output File:** Name and path (sanitized) of final file
- **Intermediate Files:** List of all files created during conversion

### Execution Metrics

- **Executed Modules:** List of all used modules
- **Each Step Status:** Success or failure of each step
- **Log Messages:** All log messages with timestamp and level

### Status Metrics

- **Final Status:** Success or failure of complete conversion
- **Error Messages:** Detailed error messages in case of failure
- **Timestamping:** Start and end date and time

## Security and Audit

### Sensitive Data Protection

The module automatically applies log sanitization to protect sensitive data:

1. **File Paths:** Only file names (basename) are kept, not full paths
2. **Metadata:** Sensitive metadata (IP, User-Agent) is not recorded in logs
3. **Content:** No source file content is recorded in logs

### Access Control

- **Controlled Directory:** Logs are stored in a directory controlled by the pipeline (`/logs`)
- **Permissions:** Log directory is created with restrictive permissions (0o750)
- **Isolation:** Each conversion has its own log file, isolated from others

### Audit and Compliance

Structured logs enable:
- **Complete Traceability:** Each conversion is traceable via its unique ID
- **Precise Timestamping:** All events are timestamped
- **Compliance:** Standardized JSON format for integration with audit systems
- **Retention:** Configurable retention policy (30 days by default)

**Normative References:** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

## Best Practices

### For Development

1. **Regularly Check Logs:** Use the `/api/logs` endpoint to verify proper functioning
2. **Analyze Durations:** Monitor execution durations to detect performance issues
3. **Track Errors:** Analyze error logs to identify recurring problems

### For Audit

1. **Archive Logs:** Logs are automatically archived after the retention period
2. **Export Logs:** Use the API endpoint to export logs to analysis systems
3. **Monitor Disk Space:** Logs are limited in size (10 MB by default)

### For Debugging

1. **Identify Conversion:** Use the `conversionId` to retrieve the complete log
2. **Analyze Steps:** Examine each step to identify where the error occurred
3. **Verify Files:** Check input and output file names

## Integration with Orchestrators

### Main Orchestrator

The main orchestrator initializes the log at the start of conversion and finalizes it at the end:

```javascript
// Initialization
initializeLog(conversionId, sourceFormat, targetFormat, options)

// Event Recording
addLogMessage(conversionId, 'info', 'Message')
recordInputFile(conversionId, inputFilePath)

// Finalization
finalizeLog(conversionId, 'success', { totalDuration, stepsExecuted })
```

### Execution Orchestrator

The execution orchestrator records each execution step:

```javascript
// Step Recording
recordStep(conversionId, {
  stepNumber: 1,
  module: 'downdoc',
  fromFormat: 'asciidoc',
  toFormat: 'markdown',
  inputFile: 'input.adoc',
  outputFile: 'output.md',
  duration: 1.234,
  status: 'success',
  logs: [...],
  error: null
})

// Output File Recording
recordOutputFile(conversionId, outputFilePath)
```

## Configuration

### Environment Variables

- `LOGS_DIR`: Log storage directory (default: `{project_root}/logs`)
- `MAX_LOG_SIZE`: Maximum log file size in bytes (default: 10485760 = 10 MB)
- `LOG_RETENTION_DAYS`: Retention period in days (default: 30)

### Log Directory Structure

```
logs/
├── {conversionId1}.log
├── {conversionId2}.log
├── {conversionId3}.log
└── archived/
    ├── {old_conversionId1}.log
    └── {old_conversionId2}.log
```

## Preparation for Dashboards and Analysis Systems

### Standardized JSON Format

The standardized JSON format enables easy integration with:
- **Elasticsearch:** Log indexing and search
- **Grafana:** Performance metrics visualization
- **Prometheus:** Metrics collection for monitoring
- **Splunk:** Event analysis and correlation

### Exportable Metrics

The following metrics can be easily extracted:
- Success/failure rate
- Average execution durations
- Most used modules
- Most frequent conversion formats
- Average conversion size

### Integration Example

```javascript
// Example of metrics extraction for dashboard
const log = readLog(conversionId);
const metrics = {
  success: log.status === 'success',
  duration: log.execution.totalDuration,
  steps: log.execution.steps.length,
  modules: log.execution.modulesExecuted
};
```

## Technical Notes

### Performance

- **Synchronous Writing:** Logs are written synchronously to guarantee consistency
- **In-Memory Cache:** Active logs are cached for fast access
- **Automatic Cleanup:** Old logs are automatically cleaned according to retention policy

### Limitations

- **Maximum Size:** Each log file is limited to 10 MB by default
- **Retention:** Logs are deleted after the retention period (30 days by default)
- **Storage:** Logs are stored on local file system

## References

- [modules.interface.md](../modules.interface.md) - Module interface contract
- [orchestrator-comm.module.md](./orchestrator-comm.module.md) - Orchestrator communication
- [PIPELINE.md](../../PIPELINE.md) - Conversion pipeline specification
