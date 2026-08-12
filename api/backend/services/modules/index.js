'use strict'

/**
 * CONVERSION MODULES INDEX
 * 
 * Centralized export of all conversion modules/wrappers conforming to the interface
 * defined in doc/specifications/modules.interface.md
 * 
 * To use modules with lazy loading, use lazyload.module.js
 */

// ============================================================================
// CONVERSION WRAPPERS (Modules de conversion)
// ============================================================================

const downdocModule = require('./adoc-to-md.converter.js')
const text2markdownModule = require('./text2markdown.module.js')
const panwriterModule = require('./panwriter.module.js')
const docverterModule = require('./docverter.module.js')
// panwriter / docverter: stub files only — not registered in lazy-load / orchestrator

// ============================================================================
// ORCHESTRATION MODULES (Modules d'orchestration)
// ============================================================================

const lazyLoadModule = require('./lazyload.module.js')
const converterOrchestratorModule = require('./converter-orchestrator.module.js')
const linearOrchestratorModule = require('./orchestrator.js')
const mainOrchestratorModule = require('./main-orchestrator.js')
const executionOrchestratorModule = require('./execution-orchestrator.js')

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // ========================================================================
  // CONVERSION WRAPPERS
  // ========================================================================
  // Direct conversion modules (immediate loading)
  // These modules convert between specific formats
  
  /**
   * Downdoc wrapper: Converts AsciiDoc to Markdown
   * Formats: asciidoc → markdown
   */
  downdoc: downdocModule,
  
  /**
   * Text2Markdown wrapper: Converts plain text to Markdown with automatic structure detection
   * Formats: txt → markdown
   */
  text2markdown: text2markdownModule,
  
  /**
   * PanWriter stub (offline — not in active registry). Returns CONVERTER_NOT_FOUND.
   */
  panwriter: panwriterModule,
  
  /**
   * Docverter stub (offline — not in active registry). Returns CONVERTER_NOT_FOUND.
   */
  docverter: docverterModule,
  
  // Note: Pandoc is NOT a wrapper module - it's executed via command-line
  // and managed by converterOrchestrator with executionType: 'command'
  // Pandoc is available through converterOrchestrator, not as a direct export
  
  // ========================================================================
  // ORCHESTRATION MODULES
  // ========================================================================
  // Modules that coordinate and manage conversions
  
  /**
   * Lazy loading module: Loads converters on-demand to reduce memory consumption
   * Recommended for all converters
   */
  lazyLoad: lazyLoadModule,
  
  /**
   * Converter orchestrator: Coordinates all converters and selects the appropriate one
   * based on input/output formats
   */
  converterOrchestrator: converterOrchestratorModule,
  
  /**
   * Linear orchestrator: Executes linear multi-step conversion flow (legacy)
   */
  linearOrchestrator: linearOrchestratorModule,
  
  /**
   * Main orchestrator: Primary orchestrator that receives requests and delegates
   * to execution orchestrator
   */
  mainOrchestrator: mainOrchestratorModule,
  
  /**
   * Execution orchestrator: Secondary orchestrator that executes conversion steps
   * sequentially
   */
  executionOrchestrator: executionOrchestratorModule
}
