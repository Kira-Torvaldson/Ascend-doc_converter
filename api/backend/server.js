const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { convertAsciiDoc, convertMarkdown } = require('../convert.js');

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

// Endpoint: AsciiDoc → Markdown
app.post('/to-markdown', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        detail: "Le texte à convertir est vide"
      });
    }

    console.log(`[INFO] Conversion de ${text.length} caractères (AsciiDoc → Markdown)`);

    // Utiliser directement convert.js (qui utilise downdoc)
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

// Endpoint: Markdown → AsciiDoc
app.post('/to-asciidoc', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        detail: "Le texte à convertir est vide"
      });
    }

    console.log(`[INFO] Conversion de ${text.length} caractères (Markdown → AsciiDoc)`);

    // Utiliser directement convert.js (fonction convertMarkdown améliorée)
    const asciidoc = convertMarkdown(text);

    console.log(`[INFO] Conversion réussie: ${asciidoc.length} caractères d'AsciiDoc générés`);

    return res.json({ asciidoc });
  } catch (error) {
    console.error('[ERROR] Erreur lors de la conversion Markdown → AsciiDoc:', error);
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
  console.log(`   POST /to-markdown - Convertir AsciiDoc → Markdown`);
  console.log(`   POST /to-asciidoc - Convertir Markdown → AsciiDoc`);
});

