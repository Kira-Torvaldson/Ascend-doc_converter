const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { convertAsciiDoc, convertMarkdownWithPandoc, convertHtmlWithPandoc, convertWithPandoc, text2markdown } = require('../convert.js');

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
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        detail: "Le texte à convertir est vide"
      });
    }

    console.log(`[INFO] Conversion de ${text.length} caractères (AsciiDoc → Markdown) avec downdoc`);

    // Utiliser downdoc (méthode par défaut, on ne touche pas à cette partie)
    const markdown = await convertAsciiDoc(text, 'default');

    console.log(`[INFO] Conversion réussie: ${markdown.length} caractères de Markdown générés`);

    return res.json({ markdown });
  } catch (error) {
    console.error('[ERROR] Erreur lors de la conversion AsciiDoc → Markdown:', error);
    return res.status(500).json({
      detail: `Erreur lors de la conversion: ${error.message || String(error)}`
    });
  }
});

// Endpoint: Markdown → AsciiDoc (utilise Pandoc par défaut)
app.post('/to-asciidoc', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        detail: "Le texte à convertir est vide"
      });
    }

    console.log(`[INFO] Conversion de ${text.length} caractères (Markdown → AsciiDoc) avec Pandoc`);

    // Utiliser Pandoc pour la conversion (par défaut)
    const asciidoc = await convertMarkdownWithPandoc(text);

    console.log(`[INFO] Conversion réussie: ${asciidoc.length} caractères d'AsciiDoc générés`);

    return res.json({ asciidoc });
  } catch (error) {
    console.error('[ERROR] Erreur lors de la conversion Markdown → AsciiDoc:', error);
    return res.status(500).json({
      detail: `Erreur lors de la conversion: ${error.message || String(error)}`
    });
  }
});

// Endpoint: HTML → Autres formats (utilise Pandoc)
// Format de sortie à définir (markdown, asciidoc, etc.)
app.post('/from-html', async (req, res) => {
  try {
    const { text, to } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        detail: "Le texte HTML à convertir est vide"
      });
    }

    if (!to || typeof to !== 'string') {
      return res.status(400).json({
        detail: "Le format de sortie (to) doit être spécifié"
      });
    }

    console.log(`[INFO] Conversion de ${text.length} caractères (HTML → ${to}) avec Pandoc`);

    // Utiliser Pandoc pour la conversion HTML
    const result = await convertHtmlWithPandoc(text, to);

    console.log(`[INFO] Conversion réussie: ${result.length} caractères générés`);

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

// Endpoint générique: Conversion depuis n'importe quel format vers n'importe quel autre format (utilise Pandoc)
app.post('/convert', async (req, res) => {
  try {
    const { text, from, to } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        detail: "Le texte à convertir est vide"
      });
    }

    if (!from || typeof from !== 'string') {
      return res.status(400).json({
        detail: "Le format source (from) doit être spécifié"
      });
    }

    if (!to || typeof to !== 'string') {
      return res.status(400).json({
        detail: "Le format de sortie (to) doit être spécifié"
      });
    }

    console.log(`[INFO] Conversion de ${text.length} caractères (${from} → ${to}) avec Pandoc`);

    // Si conversion TXT → Markdown, utiliser text2markdown pour une meilleure détection
    if (from.toLowerCase() === 'txt' && to.toLowerCase() === 'markdown') {
      const markdown = text2markdown(text);
      console.log(`[INFO] Conversion réussie avec text2markdown: ${markdown.length} caractères générés`);
      return res.json({ result: markdown, format: to });
    }

    // Utiliser Pandoc pour les autres conversions
    const result = await convertWithPandoc(text, from, to);

    console.log(`[INFO] Conversion réussie: ${result.length} caractères générés`);

    return res.json({ result, format: to });
  } catch (error) {
    console.error('[ERROR] Erreur lors de la conversion:', error);
    return res.status(500).json({
      detail: `Erreur lors de la conversion: ${error.message || String(error)}`
    });
  }
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur backend démarré sur http://0.0.0.0:${PORT}`);
  console.log(`📝 API disponible sur http://localhost:${PORT}`);
  console.log(`🔄 Endpoints:`);
  console.log(`   POST /to-markdown - Convertir AsciiDoc → Markdown (downdoc)`);
  console.log(`   POST /to-asciidoc - Convertir Markdown → AsciiDoc (Pandoc)`);
  console.log(`   POST /from-html - Convertir HTML → autres formats (Pandoc)`);
  console.log(`   POST /text-to-markdown - Convertir Texte brut → Markdown (text2markdown)`);
  console.log(`   POST /convert - Convertir depuis n'importe quel format vers un autre (Pandoc/text2markdown)`);
});

