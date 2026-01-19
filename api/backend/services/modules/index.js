'use strict'

/**
 * INDEX DES MODULES DE CONVERSION
 * 
 * Export centralisé de tous les modules de conversion conformes à l'interface
 * définie dans doc/specifications/modules.interface.md
 * 
 * Pour utiliser les modules avec lazy loading, utilisez lazyload.module.js
 */

const downdocModule = require('./downdoc.module.js')
const lazyLoadModule = require('./lazyload.module.js')

module.exports = {
  // Modules directs (chargement immédiat)
  downdoc: downdocModule,
  
  // Module de lazy loading (recommandé pour tous les converters)
  lazyLoad: lazyLoadModule
}
