#!/usr/bin/env node
'use strict'

/**
 * ============================================================================
 * ENVIRONMENT DIAGNOSTIC SCRIPT (Pre-flight Check)
 * ============================================================================
 * 
 * This script performs a comprehensive environment sanity check before
 * launching the Ascend application. It verifies critical dependencies and
 * system capabilities to prevent runtime failures.
 * 
 * PURPOSE:
 * --------
 * - Verify Pandoc installation and accessibility
 * - Check disk write permissions in critical directories
 * - Validate Node.js version compatibility
 * - Ensure required system resources are available
 * 
 * USAGE:
 * ------
 * Run this script before starting the server:
 *   node api/backend/bin/check-env.js
 * 
 * The script will exit with code 0 if all checks pass, or non-zero if
 * any critical issue is detected. Clear error messages guide the user
 * to resolve problems.
 * 
 * PLATFORM COMPATIBILITY:
 * -----------------------
 * - Windows (PowerShell, CMD)
 * - macOS (Terminal, zsh, bash)
 * - Linux (bash, sh)
 * 
 * ============================================================================
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Minimum required Node.js version
 * Ascend requires Node.js 16.17.0 or higher for modern features
 */
const MIN_NODE_VERSION = '16.17.0'

/**
 * Directories that must be writable for the application to function
 * These paths are relative to the project root
 */
const REQUIRED_WRITABLE_DIRS = [
  'api/logs',           // Log files directory
  'api/backend/public', // Static assets directory
]

/**
 * Test file name for write permission checks
 * This file is created temporarily and immediately deleted
 */
const TEST_FILE_NAME = '.ascend-write-test'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Compares two semantic version strings
 * 
 * @param {string} version1 - First version string (e.g., "16.17.0")
 * @param {string} version2 - Second version string (e.g., "18.0.0")
 * @returns {number} - Negative if version1 < version2, positive if >, 0 if equal
 * 
 * Example:
 *   compareVersions('16.17.0', '18.0.0') => -1
 *   compareVersions('18.0.0', '16.17.0') => 1
 *   compareVersions('16.17.0', '16.17.0') => 0
 */
function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)
  
  // Compare major, minor, and patch versions
  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] < v2Parts[i]) return -1
    if (v1Parts[i] > v2Parts[i]) return 1
  }
  
  return 0
}

/**
 * Normalizes a version string by removing 'v' prefix and extracting
 * the first three version components (major.minor.patch)
 * 
 * @param {string} versionString - Raw version string (e.g., "v18.0.0" or "18.0.0")
 * @returns {string} - Normalized version (e.g., "18.0.0")
 */
function normalizeVersion(versionString) {
  // Remove 'v' prefix if present
  const cleaned = versionString.replace(/^v/i, '')
  
  // Extract major.minor.patch (ignore pre-release and build metadata)
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}`
  }
  
  return cleaned
}

/**
 * Checks if a directory exists and is accessible
 * 
 * @param {string} dirPath - Absolute or relative path to directory
 * @returns {boolean} - True if directory exists and is readable
 */
function directoryExists(dirPath) {
  try {
    const stats = fs.statSync(dirPath)
    return stats.isDirectory()
  } catch (error) {
    return false
  }
}

/**
 * Checks if a directory is writable by attempting to create and delete a test file
 * This is the most reliable method across all platforms
 * 
 * @param {string} dirPath - Absolute path to directory
 * @returns {Object} - { writable: boolean, error?: string }
 */
function checkDirectoryWritable(dirPath) {
  const testFilePath = path.join(dirPath, TEST_FILE_NAME)
  
  try {
    // Attempt to write a test file
    fs.writeFileSync(testFilePath, 'test', 'utf8')
    
    // Attempt to read it back (verifies write succeeded)
    fs.readFileSync(testFilePath, 'utf8')
    
    // Clean up: delete the test file
    fs.unlinkSync(testFilePath)
    
    return { writable: true }
  } catch (error) {
    // Clean up if file was created but read/delete failed
    try {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath)
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    return {
      writable: false,
      error: error.message || 'Unknown write error'
    }
  }
}

/**
 * Ensures a directory exists, creating it if necessary
 * Uses recursive creation to handle nested paths
 * 
 * @param {string} dirPath - Absolute path to directory
 * @returns {Object} - { success: boolean, error?: string }
 */
function ensureDirectoryExists(dirPath) {
  try {
    if (!directoryExists(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to create directory'
    }
  }
}

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

/**
 * Checks Node.js version compatibility
 * Verifies that the current Node.js version meets minimum requirements
 * 
 * @returns {Object} - { passed: boolean, message: string, version?: string }
 */
function checkNodeVersion() {
  const currentNodeVersion = process.version
  const normalizedCurrent = normalizeVersion(currentNodeVersion)
  const normalizedMin = normalizeVersion(MIN_NODE_VERSION)
  
  const comparison = compareVersions(normalizedCurrent, normalizedMin)
  
  if (comparison >= 0) {
    return {
      passed: true,
      message: `✓ Node.js version ${normalizedCurrent} meets requirement (>= ${MIN_NODE_VERSION})`,
      version: normalizedCurrent
    }
  } else {
    return {
      passed: false,
      message: `✗ Node.js version ${normalizedCurrent} is below minimum requirement (>= ${MIN_NODE_VERSION})`,
      version: normalizedCurrent
    }
  }
}

/**
 * Checks if Pandoc is installed and accessible in the system PATH
 * Pandoc is required for Markdown → AsciiDoc conversions
 * 
 * This function attempts to execute 'pandoc --version' and parses the output
 * to verify Pandoc is properly installed and functional.
 * 
 * @returns {Object} - { passed: boolean, message: string, version?: string }
 */
function checkPandoc() {
  try {
    // Execute 'pandoc --version' command
    // This command is cross-platform and returns version information
    const output = execSync('pandoc --version', {
      encoding: 'utf8',
      timeout: 5000, // 5 second timeout
      stdio: ['ignore', 'pipe', 'pipe'] // Ignore stdin, capture stdout/stderr
    })
    
    // Parse version from output
    // Pandoc version output format: "pandoc 2.19.2"
    const versionMatch = output.match(/pandoc\s+([\d.]+)/i)
    const version = versionMatch ? versionMatch[1] : 'unknown'
    
    return {
      passed: true,
      message: `✓ Pandoc is installed (version ${version})`,
      version: version
    }
  } catch (error) {
    // Pandoc command failed or not found
    let errorMessage = 'Pandoc is not installed or not accessible in PATH'
    
    if (error.code === 'ENOENT') {
      errorMessage = 'Pandoc executable not found in system PATH'
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Pandoc version check timed out'
    }
    
    return {
      passed: false,
      message: `✗ ${errorMessage}`,
      suggestion: 'Install Pandoc from https://pandoc.org/installing.html'
    }
  }
}

/**
 * Checks write permissions for a specific directory
 * Creates the directory if it doesn't exist, then tests write capability
 * 
 * @param {string} dirPath - Absolute path to directory
 * @param {string} relativePath - Relative path for display purposes
 * @returns {Object} - { passed: boolean, message: string }
 */
function checkDirectoryWritePermission(dirPath, relativePath) {
  // First, ensure the directory exists
  const createResult = ensureDirectoryExists(dirPath)
  if (!createResult.success) {
    return {
      passed: false,
      message: `✗ Cannot create directory: ${relativePath} (${createResult.error})`
    }
  }
  
  // Test write permission
  const writeCheck = checkDirectoryWritable(dirPath)
  if (writeCheck.writable) {
    return {
      passed: true,
      message: `✓ Directory is writable: ${relativePath}`
    }
  } else {
    return {
      passed: false,
      message: `✗ Directory is not writable: ${relativePath} (${writeCheck.error})`,
      suggestion: `Check file permissions for ${relativePath}`
    }
  }
}

/**
 * Checks write permissions for all required directories
 * Iterates through REQUIRED_WRITABLE_DIRS and verifies each one
 * 
 * @returns {Object} - { passed: boolean, messages: string[], failures: string[] }
 */
function checkAllWritePermissions() {
  const projectRoot = path.resolve(__dirname, '..', '..', '..')
  const messages = []
  const failures = []
  let allPassed = true
  
  for (const relativeDir of REQUIRED_WRITABLE_DIRS) {
    const absoluteDir = path.join(projectRoot, relativeDir)
    const result = checkDirectoryWritePermission(absoluteDir, relativeDir)
    
    messages.push(result.message)
    
    if (!result.passed) {
      allPassed = false
      failures.push(relativeDir)
      if (result.suggestion) {
        messages.push(`  → ${result.suggestion}`)
      }
    }
  }
  
  return {
    passed: allPassed,
    messages: messages,
    failures: failures
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main function that runs all environment checks
 * Exits with code 0 if all checks pass, non-zero otherwise
 */
function main() {
  console.log('\n' + '='.repeat(60))
  console.log('🔍 Ascend Environment Diagnostic')
  console.log('='.repeat(60) + '\n')
  
  let allChecksPassed = true
  const checkResults = []
  
  // Check 1: Node.js version
  console.log('Checking Node.js version...')
  const nodeCheck = checkNodeVersion()
  console.log(`  ${nodeCheck.message}`)
  checkResults.push(nodeCheck)
  if (!nodeCheck.passed) {
    allChecksPassed = false
  }
  
  console.log('')
  
  // Check 2: Pandoc installation
  console.log('Checking Pandoc installation...')
  const pandocCheck = checkPandoc()
  console.log(`  ${pandocCheck.message}`)
  if (pandocCheck.suggestion) {
    console.log(`  → ${pandocCheck.suggestion}`)
  }
  checkResults.push(pandocCheck)
  if (!pandocCheck.passed) {
    allChecksPassed = false
  }
  
  console.log('')
  
  // Check 3: Write permissions
  console.log('Checking disk write permissions...')
  const writeCheck = checkAllWritePermissions()
  writeCheck.messages.forEach(msg => console.log(`  ${msg}`))
  checkResults.push(writeCheck)
  if (!writeCheck.passed) {
    allChecksPassed = false
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  if (allChecksPassed) {
    console.log('✅ All environment checks passed!')
    console.log('   The application is ready to start.\n')
    process.exit(0)
  } else {
    console.log('❌ Environment check failed!')
    console.log('   Please resolve the issues above before starting the application.\n')
    process.exit(1)
  }
}

// Execute main function if script is run directly
// This allows the script to be imported as a module or executed standalone
if (require.main === module) {
  main()
}

// Export functions for potential programmatic use
module.exports = {
  checkNodeVersion,
  checkPandoc,
  checkAllWritePermissions,
  compareVersions,
  normalizeVersion
}
