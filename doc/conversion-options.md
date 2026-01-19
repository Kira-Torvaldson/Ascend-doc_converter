# Options de Conversion - Documentation

## Vue d'ensemble

Le système d'options de conversion permet de configurer finement le comportement des conversions de documents. Il est conçu pour être modulaire, extensible et orienté API.

## Structure des options

Les options sont organisées en 7 catégories principales :

1. **Content Analysis** - Analyse du contenu
2. **Normalization** - Normalisation du contenu
3. **Rendering** - Options de rendu documentaire
4. **Format Specific** - Options spécifiques aux formats
5. **Security** - Sécurité et robustesse
6. **Metadata** - Métadonnées du document
7. **Developer** - Options développeur

---

## 1. Content Analysis (Analyse du contenu)

### `analysisMode`
- **Type**: `string`
- **Valeurs**: `'basic'` | `'heuristic'` | `'strict'`
- **Défaut**: `'heuristic'`
- **Description**: Détermine le mode d'analyse du contenu texte brut
  - `basic`: Analyse minimale, traitement rapide
  - `heuristic`: Analyse intelligente avec détection automatique (recommandé)
  - `strict`: Analyse stricte avec règles précises

### `headingDetection`
- **Type**: `Object`
- **Défaut**: 
  ```json
  {
    "enabled": true,
    "detectAllCaps": true,
    "detectSeparators": true,
    "detectNumbering": true,
    "minLength": 3,
    "maxLength": 100
  }
  ```
- **Description**: Règles de détection automatique des titres
  - `enabled`: Activer la détection des titres
  - `detectAllCaps`: Détecter les lignes en majuscules comme titres
  - `detectSeparators`: Détecter les séparateurs (===, ---)
  - `detectNumbering`: Détecter la numérotation (1., 2., etc.)
  - `minLength`: Longueur minimale pour considérer comme titre
  - `maxLength`: Longueur maximale pour considérer comme titre

### `listDetection`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "enabled": true,
    "detectBullets": true,
    "detectNumbered": true,
    "preserveIndentation": true,
    "normalizeIndentation": true,
    "indentSize": 2
  }
  ```
- **Description**: Gestion des listes et indentations
  - `enabled`: Activer la détection des listes
  - `detectBullets`: Détecter les puces (*, -, +)
  - `detectNumbered`: Détecter les listes numérotées
  - `preserveIndentation`: Préserver l'indentation originale
  - `normalizeIndentation`: Normaliser l'indentation (tabs → espaces)
  - `indentSize`: Taille d'indentation en espaces

---

## 2. Normalization (Normalisation du contenu)

### `encoding`
- **Type**: `string`
- **Valeurs**: `'utf-8'` | `'latin1'` | `'ascii'`
- **Défaut**: `'utf-8'`
- **Description**: Encodage du texte source

### `lineBreaks`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "normalize": true,
    "target": "unix",
    "removeTrailing": true,
    "maxConsecutive": 2
  }
  ```
- **Description**: Normalisation des sauts de ligne
  - `normalize`: Normaliser les sauts de ligne
  - `target`: Format cible (`'unix'` (\n) | `'windows'` (\r\n) | `'mac'` (\r))
  - `removeTrailing`: Supprimer les sauts de ligne en fin de fichier
  - `maxConsecutive`: Nombre maximum de sauts de ligne consécutifs

### `removeNonAscii`
- **Type**: `boolean`
- **Défaut**: `false`
- **Description**: Supprimer les caractères non-ASCII (optionnel, désactivé par défaut)

### `tabs`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "convertToSpaces": true,
    "tabSize": 2
  }
  ```
- **Description**: Conversion des tabulations
  - `convertToSpaces`: Convertir les tabulations en espaces
  - `tabSize`: Taille d'une tabulation en espaces

---

## 3. Rendering (Options de rendu documentaire)

### `tableOfContents`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "enabled": false,
    "depth": 3,
    "position": "top"
  }
  ```
- **Description**: Génération de la table des matières
  - `enabled`: Générer une table des matières
  - `depth`: Profondeur maximale (1-6)
  - `position`: Position (`'top'` | `'bottom'` | `'none'`)

### `sectionNumbering`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "enabled": false,
    "depth": 3,
    "style": "numeric"
  }
  ```
- **Description**: Numérotation des sections
  - `enabled`: Numéroter les sections
  - `depth`: Profondeur maximale de numérotation
  - `style`: Style de numérotation (`'numeric'` | `'alpha'` | `'roman'`)

### `lineWrap`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "enabled": false,
    "maxWidth": 80,
    "hardWrap": false
  }
  ```
- **Description**: Largeur maximale des lignes
  - `enabled`: Activer le retour à la ligne automatique
  - `maxWidth`: Largeur maximale en caractères
  - `hardWrap`: Retour à la ligne forcé (hard wrap)

### `listStyle`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "bulletStyle": "dash",
    "numberedStyle": "numeric",
    "indentChar": " ",
    "indentSize": 2
  }
  ```
- **Description**: Style des listes
  - `bulletStyle`: Style des puces (`'dash'` | `'asterisk'` | `'plus'` | `'circle'`)
  - `numberedStyle`: Style des listes numérotées (`'numeric'` | `'alpha'` | `'roman'`)
  - `indentChar`: Caractère d'indentation
  - `indentSize`: Taille d'indentation

---

## 4. Format Specific (Options spécifiques aux formats)

### `markdown`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "flavor": "commonmark",
    "gfmExtensions": {
      "tables": true,
      "strikethrough": true,
      "taskLists": true,
      "autolinks": true
    },
    "preserveHtml": false,
    "codeFenceStyle": "backtick"
  }
  ```
- **Description**: Options Markdown
  - `flavor`: Variante Markdown (`'commonmark'` | `'gfm'` | `'markdown'`)
  - `gfmExtensions`: Extensions GitHub Flavored Markdown
  - `preserveHtml`: Préserver le HTML dans le Markdown
  - `codeFenceStyle`: Style des blocs de code (`'backtick'` | `'tilde'`)

### `asciidoc`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "compatMode": "asciidoctor",
    "attributes": {
      "doctype": "article",
      "toc": "left",
      "numbered": false,
      "sectanchors": true,
      "sectlinks": true
    },
    "safeMode": "safe"
  }
  ```
- **Description**: Options AsciiDoc
  - `compatMode`: Mode de compatibilité (`'asciidoctor'` | `'asciidoc'`)
  - `attributes`: Attributs AsciiDoc
  - `safeMode`: Mode de sécurité (`'unsafe'` | `'safe'` | `'server'` | `'secure'`)

### `pdf`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "pageSize": "a4",
    "orientation": "portrait",
    "margins": {
      "top": "2.5cm",
      "right": "2cm",
      "bottom": "2.5cm",
      "left": "2cm"
    },
    "fontFamily": "default",
    "fontSize": "12pt",
    "template": null,
    "engine": "pdflatex"
  }
  ```
- **Description**: Options PDF
  - `pageSize`: Taille de page (`'a4'` | `'letter'` | `'legal'` | `'a3'`)
  - `orientation`: Orientation (`'portrait'` | `'landscape'`)
  - `margins`: Marges de la page
  - `fontFamily`: Famille de police
  - `fontSize`: Taille de police
  - `template`: Chemin vers un template personnalisé (optionnel)
  - `engine`: Moteur de génération PDF

### `html`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "standalone": true,
    "embedImages": false,
    "css": null,
    "minify": false
  }
  ```
- **Description**: Options HTML
  - `standalone`: Document HTML complet avec `<html>`, `<head>`, `<body>`
  - `embedImages`: Intégrer les images en base64
  - `css`: Chemin vers une feuille de style CSS (optionnel)
  - `minify`: Minifier le HTML

---

## 5. Security (Sécurité et robustesse)

### `maxFileSize`
- **Type**: `number`
- **Défaut**: `10485760` (10 MB)
- **Description**: Taille maximale du fichier en octets

### `conversionTimeout`
- **Type**: `number`
- **Défaut**: `30000` (30 secondes)
- **Description**: Timeout de conversion en millisecondes

### `externalResources`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "allowExternalLinks": true,
    "allowImages": true,
    "allowScripts": false,
    "allowStyles": true,
    "sandboxMode": false
  }
  ```
- **Description**: Gestion des ressources externes
  - `allowExternalLinks`: Autoriser les liens externes
  - `allowImages`: Autoriser les images
  - `allowScripts`: Autoriser les scripts (désactivé par défaut pour sécurité)
  - `allowStyles`: Autoriser les styles
  - `sandboxMode`: Mode sandbox (isolation complète)

### `validation`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "enabled": true,
    "strictMode": false,
    "maxErrors": 10
  }
  ```
- **Description**: Options de validation
  - `enabled`: Activer la validation
  - `strictMode`: Mode strict (rejette les erreurs mineures)
  - `maxErrors`: Nombre maximum d'erreurs avant d'abandonner

---

## 6. Metadata (Métadonnées du document)

### `title`
- **Type**: `string | null`
- **Défaut**: `null`
- **Description**: Titre du document

### `author`
- **Type**: `string | null`
- **Défaut**: `null`
- **Description**: Auteur du document

### `date`
- **Type**: `string | null`
- **Défaut**: `null`
- **Description**: Date du document (ISO 8601 ou format personnalisé). Si `null`, utilise la date actuelle

### `language`
- **Type**: `string`
- **Défaut**: `'fr'`
- **Description**: Langue du document (code ISO 639-1: fr, en, es, etc.)

### `license`
- **Type**: `string | null`
- **Défaut**: `null`
- **Description**: Licence du document

### `custom`
- **Type**: `Object`
- **Défaut**: `{}`
- **Description**: Métadonnées personnalisées (clé-valeur)

---

## 7. Developer (Options développeur)

### `debugMode`
- **Type**: `boolean`
- **Défaut**: `false`
- **Description**: Mode debug (affichage d'informations détaillées)

### `exportIntermediate`
- **Type**: `boolean`
- **Défaut**: `false`
- **Description**: Exporter les formats intermédiaires

### `showPipeline`
- **Type**: `boolean`
- **Défaut**: `false`
- **Description**: Afficher le pipeline de conversion

### `logging`
- **Type**: `Object`
- **Défaut**:
  ```json
  {
    "level": "info",
    "verbose": false,
    "saveLogs": false
  }
  ```
- **Description**: Options de logging
  - `level`: Niveau de log (`'debug'` | `'info'` | `'warn'` | `'error'`)
  - `verbose`: Mode verbeux
  - `saveLogs`: Sauvegarder les logs dans un fichier

---

## Utilisation

### Exemple basique

```javascript
const { mergeOptions, validateOptions } = require('./conversion-options');

// Default options
const options = mergeOptions();

// Custom options
const customOptions = mergeOptions({
  contentAnalysis: {
    analysisMode: 'strict'
  },
  security: {
    maxFileSize: 5 * 1024 * 1024 // 5 MB
  },
  metadata: {
    title: 'Mon Document',
    author: 'John Doe',
    language: 'fr'
  }
});

// Validation
const validation = validateOptions(customOptions);
if (!validation.valid) {
  console.error('Erreurs de validation:', validation.errors);
}
```

### Exemple avec API

```javascript
// Endpoint API
app.post('/convert', async (req, res) => {
  const { text, from, to, options } = req.body;
  
  // Merge with default options
  const conversionOptions = mergeOptions(options || {});
  
  // Valider
  const validation = validateOptions(conversionOptions);
  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }
  
  // Utiliser les options pour la conversion
  const result = await convertWithOptions(text, from, to, conversionOptions);
  res.json({ result });
});
```

---

## Valeurs par défaut sûres

Toutes les options sont configurées avec des valeurs par défaut sûres et prévisibles :

- **Sécurité**: Scripts désactivés, validation activée, limites de taille
- **Performance**: Timeout raisonnable, mode d'analyse équilibré
- **Compatibilité**: Formats standards (UTF-8, CommonMark, Asciidoctor)
- **Robustesse**: Validation activée, gestion d'erreurs

---

## Extension

Pour ajouter de nouvelles options :

1. Ajouter la structure dans le fichier `conversion-options.js`
2. Définir les valeurs par défaut
3. Mettre à jour la fonction `validateOptions` si nécessaire
4. Documenter dans `conversion-options.md`
