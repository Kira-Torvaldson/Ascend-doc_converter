/**
 * ============================================================================
 * BULK PROCESSOR SERVICE (Batch Conversion Handler)
 * ============================================================================
 * 
 * This service enables batch processing of multiple files for conversion.
 * It allows the frontend to select multiple files and convert them all
 * in a single operation, with progress tracking and error handling.
 * 
 * PURPOSE:
 * --------
 * - Process multiple files in a single batch operation
 * - Track progress for each file individually
 * - Handle per-file errors without stopping the entire batch
 * - Provide detailed results for each conversion
 * - Optimize network requests and user experience
 * 
 * ARCHITECTURE:
 * ------------
 * This service is completely additive and non-intrusive to the backend.
 * It uses the existing /api/proxy/convert endpoint for each file,
 * orchestrating multiple requests from the frontend side.
 * 
 * FLOW:
 * -----
 * 1. User selects multiple files in the UI
 * 2. Frontend calls bulkProcessFiles() with file list
 * 3. Service iterates over each file:
 *    a. Reads file content
 *    b. Calls /api/proxy/convert for conversion
 *    c. Tracks success/failure
 *    d. Updates progress
 * 4. Returns array of results for all files
 * 
 * ERROR HANDLING:
 * --------------
 * - Individual file failures don't stop the batch
 * - Each file result includes success status and error message if failed
 * - Progress callback allows UI to update in real-time
 * 
 * ============================================================================
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a single file in a batch conversion operation
 */
export interface BulkFile {
  /** File name (for display purposes) */
  name: string
  /** File content as string */
  content: string
  /** Source format (e.g., "asciidoc", "markdown") */
  fromFormat: string
  /** Target format (e.g., "markdown", "asciidoc") */
  toFormat: string
  /** Optional conversion options */
  options?: Record<string, any>
}

/**
 * Result of a single file conversion within a batch
 */
export interface BulkFileResult {
  /** Original file name */
  file: string
  /** Whether conversion succeeded */
  success: boolean
  /** Converted content (only present if success is true) */
  result?: string
  /** Error message (only present if success is false) */
  error?: string
}

/**
 * Progress information for batch processing
 */
export interface BulkProgress {
  /** Current file index (0-based) */
  current: number
  /** Total number of files */
  total: number
  /** Current file name being processed */
  currentFile: string
  /** Percentage complete (0-100) */
  percentage: number
}

/**
 * Progress callback function type
 * Called after each file is processed to update UI
 */
export type ProgressCallback = (progress: BulkProgress) => void

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Base URL for the backend API
 * Defaults to current origin, can be overridden for different environments
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin

/**
 * Timeout for individual conversion requests (milliseconds)
 * Prevents hanging requests from blocking the entire batch
 */
const CONVERSION_TIMEOUT = 30000 // 30 seconds

/**
 * Maximum number of concurrent conversions
 * Processing files sequentially prevents server overload
 * Set to 1 for sequential processing (recommended for stability)
 */
const MAX_CONCURRENT = 1

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates percentage complete from current and total
 * 
 * @param current - Current index (0-based)
 * @param total - Total count
 * @returns Percentage (0-100)
 */
function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}

/**
 * Creates a progress object for callback
 * 
 * @param current - Current file index (0-based)
 * @param total - Total number of files
 * @param fileName - Name of current file
 * @returns Progress object
 */
function createProgress(
  current: number,
  total: number,
  fileName: string
): BulkProgress {
  return {
    current: current + 1, // Convert to 1-based for display
    total,
    currentFile: fileName,
    percentage: calculatePercentage(current, total)
  }
}

/**
 * Creates an error result for a failed conversion
 * 
 * @param fileName - Name of the file that failed
 * @param error - Error message or Error object
 * @returns BulkFileResult with success: false
 */
function createErrorResult(fileName: string, error: string | Error): BulkFileResult {
  return {
    file: fileName,
    success: false,
    error: error instanceof Error ? error.message : error
  }
}

/**
 * Creates a success result for a completed conversion
 * 
 * @param fileName - Name of the file that succeeded
 * @param result - Converted content
 * @returns BulkFileResult with success: true
 */
function createSuccessResult(fileName: string, result: string): BulkFileResult {
  return {
    file: fileName,
    success: true,
    result
  }
}

// ============================================================================
// CONVERSION API CALL
// ============================================================================

/**
 * Calls the backend conversion proxy endpoint for a single file
 * 
 * This function makes an HTTP POST request to /api/proxy/convert
 * with the file content and conversion parameters. It handles
 * network errors, timeouts, and API errors gracefully.
 * 
 * @param file - BulkFile object containing file data and conversion params
 * @returns Promise resolving to converted content or throwing an error
 */
async function convertSingleFile(file: BulkFile): Promise<string> {
  // Construct the API endpoint URL
  const url = `${API_BASE_URL}/api/proxy/convert`
  
  // Prepare request body
  const requestBody = {
    content: file.content,
    fromFormat: file.fromFormat,
    toFormat: file.toFormat,
    options: file.options || {}
  }
  
  // Create AbortController for timeout handling
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, CONVERSION_TIMEOUT)
  
  try {
    // Make the conversion request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })
    
    // Clear timeout since request completed
    clearTimeout(timeoutId)
    
    // Parse response JSON
    const data = await response.json()
    
    // Check if conversion was successful
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: Conversion failed`)
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Conversion failed without error message')
    }
    
    // Return converted content
    if (!data.result) {
      throw new Error('Conversion succeeded but returned no result')
    }
    
    return data.result
    
  } catch (error) {
    // Clear timeout if still active
    clearTimeout(timeoutId)
    
    // Handle different error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Conversion timeout after ${CONVERSION_TIMEOUT}ms`)
      }
      throw error
    }
    
    throw new Error('Unknown error during conversion')
  }
}

// ============================================================================
// MAIN BULK PROCESSING FUNCTION
// ============================================================================

/**
 * Processes multiple files in batch, converting each one sequentially
 * 
 * This is the main entry point for bulk conversion. It processes files
 * one at a time (sequential processing) to prevent server overload and
 * ensure reliable error handling.
 * 
 * PROCESSING STRATEGY:
 * -------------------
 * - Sequential processing (one file at a time)
 * - Progress updates after each file
 * - Individual file errors don't stop the batch
 * - All results returned regardless of individual failures
 * 
 * @param files - Array of BulkFile objects to convert
 * @param onProgress - Optional callback function called after each file
 * @returns Promise resolving to array of BulkFileResult objects
 * 
 * @example
 * ```typescript
 * const files = [
 *   { name: 'doc1.adoc', content: '...', fromFormat: 'asciidoc', toFormat: 'markdown' },
 *   { name: 'doc2.adoc', content: '...', fromFormat: 'asciidoc', toFormat: 'markdown' }
 * ]
 * 
 * const results = await bulkProcessFiles(files, (progress) => {
 *   console.log(`Processing ${progress.current}/${progress.total}: ${progress.currentFile}`)
 * })
 * 
 * results.forEach(result => {
 *   if (result.success) {
 *     console.log(`${result.file}: Success`)
 *   } else {
 *     console.error(`${result.file}: ${result.error}`)
 *   }
 * })
 * ```
 */
export async function bulkProcessFiles(
  files: BulkFile[],
  onProgress?: ProgressCallback
): Promise<BulkFileResult[]> {
  // Validate input
  if (!Array.isArray(files)) {
    throw new Error('Files must be an array')
  }
  
  if (files.length === 0) {
    return []
  }
  
  // Initialize results array
  const results: BulkFileResult[] = []
  const total = files.length
  
  // Process each file sequentially
  // Sequential processing prevents server overload and ensures
  // predictable behavior even if one file takes a long time
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // Call progress callback if provided
    // This allows the UI to update in real-time
    if (onProgress) {
      onProgress(createProgress(i, total, file.name))
    }
    
    try {
      // Attempt conversion
      const convertedContent = await convertSingleFile(file)
      
      // Create success result
      const result = createSuccessResult(file.name, convertedContent)
      results.push(result)
      
    } catch (error) {
      // Handle conversion error
      // Individual file failures don't stop the batch
      const result = createErrorResult(
        file.name,
        error instanceof Error ? error : new Error('Unknown conversion error')
      )
      results.push(result)
    }
  }
  
  // Final progress update (100% complete)
  if (onProgress) {
    onProgress(createProgress(total, total, ''))
  }
  
  // Return all results
  return results
}

/**
 * Processes multiple files with concurrency control
 * 
 * This variant processes files in parallel (up to MAX_CONCURRENT)
 * for faster processing when server can handle it. Use with caution
 * as it may overload the server with too many simultaneous requests.
 * 
 * @param files - Array of BulkFile objects to convert
 * @param onProgress - Optional callback function called after each file
 * @param maxConcurrent - Maximum number of concurrent conversions (default: 1)
 * @returns Promise resolving to array of BulkFileResult objects
 */
export async function bulkProcessFilesConcurrent(
  files: BulkFile[],
  onProgress?: ProgressCallback,
  maxConcurrent: number = MAX_CONCURRENT
): Promise<BulkFileResult[]> {
  // Validate input
  if (!Array.isArray(files)) {
    throw new Error('Files must be an array')
  }
  
  if (files.length === 0) {
    return []
  }
  
  // Initialize results array (pre-allocate for parallel processing)
  const results: BulkFileResult[] = new Array(files.length)
  const total = files.length
  
  // Process files in batches (chunks of maxConcurrent)
  for (let i = 0; i < files.length; i += maxConcurrent) {
    // Get batch of files to process concurrently
    const batch = files.slice(i, i + maxConcurrent)
    
    // Process batch in parallel
    const batchPromises = batch.map(async (file, batchIndex) => {
      const globalIndex = i + batchIndex
      
      try {
        // Call progress callback
        if (onProgress) {
          onProgress(createProgress(globalIndex, total, file.name))
        }
        
        // Attempt conversion
        const convertedContent = await convertSingleFile(file)
        
        // Create success result
        return createSuccessResult(file.name, convertedContent)
        
      } catch (error) {
        // Handle conversion error
        return createErrorResult(
          file.name,
          error instanceof Error ? error : new Error('Unknown conversion error')
        )
      }
    })
    
    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises)
    
    // Store results in correct positions
    batchResults.forEach((result, batchIndex) => {
      results[i + batchIndex] = result
    })
  }
  
  // Final progress update
  if (onProgress) {
    onProgress(createProgress(total, total, ''))
  }
  
  // Return all results
  return results
}

// ============================================================================
// STATISTICS AND SUMMARY FUNCTIONS
// ============================================================================

/**
 * Calculates summary statistics from bulk conversion results
 * 
 * @param results - Array of BulkFileResult objects
 * @returns Object with success count, failure count, and total
 */
export function calculateBulkStats(results: BulkFileResult[]): {
  total: number
  successful: number
  failed: number
  successRate: number
} {
  const total = results.length
  const successful = results.filter(r => r.success).length
  const failed = total - successful
  const successRate = total > 0 ? (successful / total) * 100 : 0
  
  return {
    total,
    successful,
    failed,
    successRate: Math.round(successRate * 100) / 100 // Round to 2 decimal places
  }
}

/**
 * Filters results to only successful conversions
 * 
 * @param results - Array of BulkFileResult objects
 * @returns Array of successful BulkFileResult objects
 */
export function filterSuccessful(results: BulkFileResult[]): BulkFileResult[] {
  return results.filter(r => r.success)
}

/**
 * Filters results to only failed conversions
 * 
 * @param results - Array of BulkFileResult objects
 * @returns Array of failed BulkFileResult objects
 */
export function filterFailed(results: BulkFileResult[]): BulkFileResult[] {
  return results.filter(r => !r.success)
}
