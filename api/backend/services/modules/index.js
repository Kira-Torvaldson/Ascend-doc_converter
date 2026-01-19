'use strict'

/**
 * CONVERSION MODULES INDEX
 * 
 * Centralized export of all conversion modules conforming to the interface
 * defined in doc/specifications/modules.interface.md
 * 
 * To use modules with lazy loading, use lazyload.module.js
 */

const downdocModule = require('./downdoc.module.js')
const lazyLoadModule = require('./lazyload.module.js')
const converterOrchestratorModule = require('./converter-orchestrator.module.js')

module.exports = {
  // Direct modules (immediate loading)
  downdoc: downdocModule,
  
  // Lazy loading module (recommended for all converters)
  lazyLoad: lazyLoadModule,
  
  // Orchestrator module (coordination of all converters)
  orchestrator: converterOrchestratorModule
}
