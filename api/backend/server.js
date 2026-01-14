const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { convertAsciiDoc, convertMarkdownWithPandoc, convertHtmlWithPandoc, convertWithPandoc, text2markdown } = require('../convert.js');
const { mergeOptions, validateOptions } = require('../conversion-options.js');
const { 
  generateConfirmationToken, 
  validateAndConsumeToken, 
  getTokenStats,
  secureConvertWithToken,
  ConfirmationTokenError
} = require('../secure-converter.js');

// __dirname est automatiquement disponible en CommonJS
const PROJECT_ROOT = path.join(__dirname, '..', '..');

const app = express();
const PORT = 3003;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
  ],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' })); // Augmenter la limite pour les gros fichiers
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Route racine - Page HTML simple
app.get('/', (req, res) => {
  try {
    const htmlPath = path.join(__dirname, 'static', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    res.send(html);
  } catch (error) {
    res.status(500).send('Erreur lors du chargement de la page');
  }
});

// Endpoint: AsciiDoc → Markdown (utilise downdoc uniquement)
app.post('/to-markdown', async (req, res) => {
  try {
    const { text, options } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        detail: "Le texte à convertir est vide"
      });
    }

    // Check if Parsedown is enabled in options
    const useParsedown = options?.formatSpecific?.markdown?.parsedown || false;
    const mode = useParsedown ? 'bookstack' : 'default';

    console.log(`[INFO] Converting ${text.length} characters (AsciiDoc → Markdown) with downdoc${useParsedown ? ' (Parsedown/BookStack mode)' : ''}`);

    // Use downdoc with appropriate mode
    const markdown = await convertAsciiDoc(text, mode);

    console.log(`[INFO] Conversion successful: ${markdown.length} Markdown characters generated`);

    return res.json({ markdown });
  } catch (error) {
    console.error('[ERROR] Error during AsciiDoc → Markdown conversion:', error);
    return res.status(500).json({
      detail: `Conversion error: ${error.message || String(error)}`
    });
  }
});

// Endpoint: Markdown → AsciiDoc (uses Pandoc by default)
app.post('/to-asciidoc', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        detail: "The text to convert is empty"
      });
    }

    console.log(`[INFO] Converting ${text.length} characters (Markdown → AsciiDoc) with Pandoc`);

    // Use Pandoc for conversion (default)
    const asciidoc = await convertMarkdownWithPandoc(text);

    console.log(`[INFO] Conversion successful: ${asciidoc.length} AsciiDoc characters generated`);

    return res.json({ asciidoc });
  } catch (error) {
    console.error('[ERROR] Error during Markdown → AsciiDoc conversion:', error);
    return res.status(500).json({
      detail: `Conversion error: ${error.message || String(error)}`
    });
  }
});

// Endpoint: HTML → Other formats (uses Pandoc)
// Output format to define (markdown, asciidoc, etc.)
app.post('/from-html', async (req, res) => {
  try {
    const { text, to } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        detail: "The HTML text to convert is empty"
      });
    }

    if (!to || typeof to !== 'string') {
      return res.status(400).json({
        detail: "Output format (to) must be specified"
      });
    }

    console.log(`[INFO] Converting ${text.length} characters (HTML → ${to}) with Pandoc`);

    // Use Pandoc for HTML conversion
    const result = await convertHtmlWithPandoc(text, to);

    console.log(`[INFO] Conversion successful: ${result.length} characters generated`);

    return res.json({ result, format: to });
  } catch (error) {
    console.error('[ERROR] Erreur lors de la conversion HTML:', error);
    return res.status(500).json({
      detail: `Erreur lors de la conversion: ${error.message || String(error)}`
    });
  }
});

// Endpoint: Texte brut → Markdown (utilise text2markdown)
app.post('/text-to-markdown', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        detail: "Le texte à convertir est vide"
      });
    }

    console.log(`[INFO] Conversion de ${text.length} caractères (Texte → Markdown) avec text2markdown`);

    // Utiliser text2markdown pour la conversion
    const markdown = text2markdown(text);

    console.log(`[INFO] Conversion réussie: ${markdown.length} caractères de Markdown générés`);

    return res.json({ markdown });
  } catch (error) {
    console.error('[ERROR] Erreur lors de la conversion Texte → Markdown:', error);
    return res.status(500).json({
      detail: `Erreur lors de la conversion: ${error.message || String(error)}`
    });
  }
});

// ============================================================================
// SECURED CONFIRMATION ENDPOINTS
// ============================================================================

/**
 * Endpoint to generate a confirmation token
 * 
 * Frontend must call this endpoint BEFORE displaying the confirmation modal.
 * The generated token must be included in the final conversion request.
 * 
 * POST /api/confirmation/request
 * Body: {
 *   fromFormat: string,
 *   toFormat: string,
 *   contentSize?: number (optional, for additional validation)
 * }
 */
app.post('/api/confirmation/request', (req, res) => {
  try {
    const { fromFormat, toFormat, contentSize } = req.body;

    // Basic validation
    if (!fromFormat || !toFormat) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST',
        message: 'fromFormat and toFormat are required'
      });
    }

    // Generate confirmation token with metadata
    const tokenData = generateConfirmationToken({
      fromFormat: fromFormat.toLowerCase(),
      toFormat: toFormat.toLowerCase(),
      contentSize: contentSize || 0,
      requestedAt: new Date().toISOString()
    });

    // Return token (without exposing sensitive information)
    res.json({
      success: true,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      ttl: tokenData.ttl
    });

  } catch (error) {
    console.error('[ERROR] Error during token generation:', error);
    res.status(500).json({
      error: true,
      code: 'TOKEN_GENERATION_ERROR',
      message: 'Failed to generate confirmation token'
    });
  }
});

/**
 * Endpoint to get token statistics (monitoring, optional)
 * GET /api/confirmation/stats
 */
app.get('/api/confirmation/stats', (req, res) => {
  try {
    const stats = getTokenStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      code: 'STATS_ERROR',
      message: 'Failed to get token statistics'
    });
  }
});

// ============================================================================
// SECURED CONVERSION ENDPOINT
// ============================================================================

/**
 * Generic endpoint: Conversion with confirmation token validation
 * 
 * POST /convert
 * Body: {
 *   text: string,
 *   from: string,
 *   to: string,
 *   options?: object,
 *   confirmationToken: string (REQUIRED)
 * }
 * 
 * SECURITY:
 * - Confirmation token is REQUIRED
 * - Token is validated and consumed (single use)
 * - No conversion can be executed without valid token
 * - Backend does NOT trust the frontend UI
 */
app.post('/convert', async (req, res) => {
  try {
    const { text, from, to, options, confirmationToken } = req.body;

    // Validate required parameters
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST',
        message: 'Content must be a non-empty string'
      });
    }

    if (!from || typeof from !== 'string') {
      return res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST',
        message: 'Source format (from) is required'
      });
    }

    if (!to || typeof to !== 'string') {
      return res.status(400).json({
        error: true,
        code: 'INVALID_REQUEST',
        message: 'Target format (to) is required'
      });
    }

    // CRITICAL CHECK: Confirmation token is REQUIRED
    // Backend does NOT trust the UI. Even if user
    // clicked "Yes" in a modal, backend must verify
    // that a valid token was generated and is present.
    if (!confirmationToken || typeof confirmationToken !== 'string') {
      return res.status(403).json({
        error: true,
        code: 'CONFIRMATION_TOKEN_MISSING',
        message: 'Confirmation token is required. Please request a confirmation token first.'
      });
    }

    // Merge and validate conversion options
    const conversionOptions = mergeOptions(options || {});
    const validation = validateOptions(conversionOptions);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_OPTIONS',
        message: 'Invalid conversion options',
        errors: validation.errors
      });
    }

    // Check file size
    const textSize = Buffer.byteLength(text, 'utf8');
    if (textSize > conversionOptions.security.maxFileSize) {
      return res.status(400).json({
        error: true,
        code: 'FILE_TOO_LARGE',
        message: `File size (${textSize} bytes) exceeds maximum allowed size (${conversionOptions.security.maxFileSize} bytes)`
      });
    }

    // Prepare expected metadata for additional token validation
    const expectedMetadata = {
      fromFormat: from.toLowerCase(),
      toFormat: to.toLowerCase()
    };

    // Use secured conversion engine with token validation
    // This function validates and consumes the token before executing conversion
    let result;
    
    try {
      // For TXT → Markdown conversions, use text2markdown (no Pandoc)
      // But still validate token first
      if (from.toLowerCase() === 'txt' && to.toLowerCase() === 'markdown') {
        // Validate token first
        const tokenValidation = validateAndConsumeToken(confirmationToken, expectedMetadata);
        if (!tokenValidation.valid) {
          const statusCode = tokenValidation.error === 'CONFIRMATION_TOKEN_EXPIRED' ? 410 : 403;
          return res.status(statusCode).json({
            error: true,
            code: tokenValidation.error || 'CONFIRMATION_TOKEN_INVALID',
            message: tokenValidation.message || 'Invalid confirmation token'
          });
        }
        // Token valid, proceed with text2markdown
        result = text2markdown(text);
      } else {
        // Use secureConvertWithToken which automatically validates token
        result = await secureConvertWithToken(text, from, to, {
          confirmationToken,
          expectedMetadata,
          timeout: 30000
        });
      }
    } catch (conversionError) {
      // Handle token errors specifically
      if (conversionError instanceof ConfirmationTokenError || 
          conversionError.code?.startsWith('CONFIRMATION_TOKEN_')) {
        const statusCode = conversionError.code === 'CONFIRMATION_TOKEN_EXPIRED' ? 410 : 403;
        return res.status(statusCode).json(conversionError.toSafeResponse());
      }
      
      // Propagate conversion error
      throw conversionError;
    }

    // Conversion successful
    return res.json({
      success: true,
      result,
      format: to,
      options: conversionOptions
    });

  } catch (error) {
    // Handle conversion errors
    if (error instanceof ConfirmationTokenError) {
      return res.status(403).json(error.toSafeResponse());
    }

    console.error('[ERROR] Error during conversion:', error.message);
    return res.status(500).json({
      error: true,
      code: 'CONVERSION_ERROR',
      message: 'An error occurred during conversion'
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server started on http://0.0.0.0:${PORT}`);
  console.log(`📝 API available on http://localhost:${PORT}`);
  console.log(`🔄 Endpoints:`);
  console.log(`   POST /to-markdown - Convert AsciiDoc → Markdown (downdoc)`);
  console.log(`   POST /to-asciidoc - Convert Markdown → AsciiDoc (Pandoc)`);
  console.log(`   POST /from-html - Convert HTML → other formats (Pandoc)`);
  console.log(`   POST /text-to-markdown - Convert Plain text → Markdown (text2markdown)`);
  console.log(`   POST /convert - Convert from any format to another (Pandoc/text2markdown)`);
});

