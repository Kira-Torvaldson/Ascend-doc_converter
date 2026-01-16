/**
 * ============================================================================
 * SERVICES - Exports centralisés des services
 * ============================================================================
 */

// Re-export from convert.js for backward compatibility
const convertService = require('./convert.js')
const docverterService = require('./docverter-service.js')
const panwriterService = require('./panwriter-service.js')
const secureConverterService = require('./secure-converter-service.js')

module.exports = {
  // Conversion services (from convert.js)
  convertAsciiDoc: convertService.convertAsciiDoc,
  convertMarkdownWithPandoc: convertService.convertMarkdownWithPandoc,
  convertHtmlWithPandoc: convertService.convertHtmlWithPandoc,
  convertWithPandoc: convertService.convertWithPandoc,
  text2markdown: convertService.text2markdown,
  basicCleanup: convertService.basicCleanup,
  
  // Docverter service
  ...docverterService,
  
  // PanWriter service
  ...panwriterService,
  
  // Secure converter service
  ...secureConverterService,
}
