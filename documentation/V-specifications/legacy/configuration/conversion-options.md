> ⚠️ **Deprecated:** Contenu migré vers les fichiers de référence canoniques.

# Options de conversion — Documentation

## Vue d'ensemble

Le système d'options de conversion permet une configuration fine du comportement de conversion de documents. Il est conçu pour être modulaire, extensible et orienté API.

## Structure des options

Les options sont organisées en 7 catégories principales :

1. **Content Analysis** — Analyse du contenu
2. **Normalization** — Normalisation du contenu
3. **Rendering** — Options de rendu du document
4. **Format Specific** — Options spécifiques au format
5. **Security** — Sécurité et robustesse
6. **Metadata** — Métadonnées du document
7. **Developer** — Options développeur

---

## 1. Content Analysis

### `analysisMode`
- **Type** : `string`
- **Values** : `'basic'` | `'heuristic'` | `'strict'`
- **Default** : `'heuristic'`
- **Description** : Détermine le mode d'analyse pour le contenu texte brut
  - `basic` : Analyse minimale, traitement rapide
  - `heuristic` : Analyse intelligente avec détection automatique (recommandé)
  - `strict` : Analyse stricte avec règles précises

### `headingDetection`
- **Type** : `Object`
- **Default** : 
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
- **Description** : Règles de détection automatique des titres
  - `enabled` : Activer la détection des titres
  - `detectAllCaps` : Détecter les lignes en majuscules comme titres
  - `detectSeparators` : Détecter les séparateurs (===, ---)
  - `detectNumbering` : Détecter la numérotation (1., 2., etc.)
  - `minLength` : Longueur minimale pour considérer comme titre
  - `maxLength` : Longueur maximale pour considérer comme titre

### `listDetection`
- **Type** : `Object`
- **Default**:
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
- **Description** : Gestion des listes et de l'indentation
  - `enabled` : Activer la détection des listes
  - `detectBullets` : Détecter les puces (*, -, +)
  - `detectNumbered` : Détecter les listes numérotées
  - `preserveIndentation` : Préserver l'indentation d'origine
  - `normalizeIndentation` : Normaliser l'indentation (tabs → spaces)
  - `indentSize` : Taille de l'indentation en espaces

---

## 2. Normalization

### `encoding`
- **Type** : `string`
- **Values** : `'utf-8'` | `'latin1'` | `'ascii'`
- **Default** : `'utf-8'`
- **Description** : Encodage du texte source

### `lineBreaks`
- **Type** : `Object`
- **Default**:
  ```json
  {
    "normalize": true,
    "target": "unix",
    "removeTrailing": true,
    "maxConsecutive": 2
  }
  ```
- **Description** : Normalisation des sauts de ligne
  - `normalize` : Normaliser les sauts de ligne
  - `target` : Format cible (`'unix'` (\n) | `'windows'` (\r\n) | `'mac'` (\r))
  - `removeTrailing` : Supprimer les sauts de ligne en fin de fichier
  - `maxConsecutive` : Nombre maximal de sauts de ligne consécutifs

### `removeNonAscii`
- **Type** : `boolean`
- **Default** : `false`
- **Description** : Supprimer les caractères non-ASCII (optionnel, désactivé par défaut)

### `tabs`
- **Type** : `Object`
- **Default**:
  ```json
  {
    "convertToSpaces": true,
    "tabSize": 2
  }
  ```
- **Description** : Conversion des tabulations
  - `convertToSpaces` : Convertir les tabulations en espaces
  - `tabSize` : Taille de tabulation en espaces

---

## 3. Rendering

### `tableOfContents`
- **Type** : `Object`
- **Default**:
  ```json
  {
    "enabled": false,
    "depth": 3,
    "position": "top"
  }
  ```
- **Description** : Génération de la table des matières
  - `enabled` : Générer la table des matières
  - `depth` : Profondeur maximale (1-6)
  - `position` : Position (`'top'` | `'bottom'` | `'none'`)

### `sectionNumbering`
- **Type** : `Object`
- **Default**:
  ```json
  {
    "enabled": false,
    "depth": 3,
    "style": "numeric"
  }
  ```
- **Description** : Numérotation des sections
  - `enabled` : Numéroter les sections
  - `depth` : Profondeur maximale de numérotation
  - `style` : Style de numérotation (`'numeric'` | `'alpha'` | `'roman'`)

### `lineWrap`
- **Type** : `Object`
- **Default**:
  ```json
  {
    "enabled": false,
    "maxWidth": 80,
    "hardWrap": false
  }
  ```
- **Description** : Largeur maximale des lignes
  - `enabled` : Activer le retour à la ligne automatique
  - `maxWidth` : Largeur maximale en caractères
  - `hardWrap` : Retour à la ligne forcé (hard wrap)

### `listStyle`
- **Type** : `Object`
- **Default**:
  ```json
  {
    "bulletStyle": "dash",
    "numberedStyle": "numeric",
    "indentChar": " ",
    "indentSize": 2
  }
  ```
- **Description** : Style des listes
  - `bulletStyle` : Style des puces (`'dash'` | `'asterisk'` | `'plus'` | `'circle'`)
  - `numberedStyle` : Style des listes numérotées (`'numeric'` | `'alpha'` | `'roman'`)
  - `indentChar` : Caractère d'indentation
  - `indentSize` : Taille de l'indentation

---

## 4. Format Specific

### `markdown`
- **Type** : `Object`
- **Default**:
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
- **Description** : Options Markdown
  - `flavor` : Variante Markdown (`'commonmark'` | `'gfm'` | `'markdown'`)
  - `gfmExtensions` : Extensions GitHub Flavored Markdown
  - `preserveHtml` : Préserver le HTML dans Markdown
  - `codeFenceStyle` : Style des blocs de code (`'backtick'` | `'tilde'`)

### `asciidoc`
- **Type** : `Object`
- **Default**:
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
- **Description** : Options AsciiDoc
  - `compatMode` : Mode de compatibilité (`'asciidoctor'` | `'asciidoc'`)
  - `attributes` : Attributs AsciiDoc
  - `safeMode` : Mode de sécurité (`'unsafe'` | `'safe'` | `'server'` | `'secure'`)

### `pdf`
- **Type** : `Object`
- **Default**:
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
- **Description** : Options PDF
  - `pageSize` : Taille de page (`'a4'` | `'letter'` | `'legal'` | `'a3'`)
  - `orientation` : Orientation (`'portrait'` | `'landscape'`)
  - `margins` : Marges de page
  - `fontFamily` : Famille de police
  - `fontSize` : Taille de police
  - `template` : Chemin vers un modèle personnalisé (optionnel)
  - `engine` : Moteur de génération PDF

### `html`
- **Type** : `Object`
- **Default**:
  ```json
  {
    "standalone": true,
    "embedImages": false,
    "css": null,
    "minify": false
  }
  ```
- **Description** : Options HTML
  - `standalone` : Document HTML complet avec `<html>`, `<head>`, `<body>`
  - `embedImages` : Intégrer les images en base64
  - `css` : Chemin vers une feuille de style CSS (optionnel)
  - `minify` : Minifier le HTML

---

## 5. Security

### `maxFileSize`
- **Type** : `number`
- **Default** : `10485760` (10 MB)
- **Description** : Taille maximale du fichier en octets

### `conversionTimeout`
- **Type** : `number`
- **Default** : `30000` (30 seconds)
- **Description** : Délai d'expiration de la conversion en millisecondes

### `externalResources`
- **Type** : `Object`
- **Default**:
  ```json
  {
    "allowExternalLinks": true,
    "allowImages": true,
    "allowScripts": false,
    "allowStyles": true,
    "sandboxMode": false
  }
  ```
- **Description** : Gestion des ressources externes
  - `allowExternalLinks` : Autoriser les liens externes
  - `allowImages` : Autoriser les images
  - `allowScripts` : Autoriser les scripts (désactivé par défaut pour la sécurité)
  - `allowStyles` : Autoriser les styles
  - `sandboxMode` : Mode sandbox (isolation complète)

### `validation`
- **Type** : `Object`
- **Default**:
  ```json
  {
    "enabled": true,
    "strictMode": false,
    "maxErrors": 10
  }
  ```
- **Description** : Options de validation
  - `enabled` : Activer la validation
  - `strictMode` : Mode strict (rejette les erreurs mineures)
  - `maxErrors` : Nombre maximal d'erreurs avant abandon

---

## 6. Metadata

### `title`
- **Type** : `string | null`
- **Default** : `null`
- **Description** : Titre du document

### `author`
- **Type** : `string | null`
- **Default** : `null`
- **Description** : Auteur du document

### `date`
- **Type** : `string | null`
- **Default** : `null`
- **Description** : Date du document (ISO 8601 ou format personnalisé). Si `null`, utilise la date courante

### `language`
- **Type** : `string`
- **Default** : `'fr'`
- **Description** : Langue du document (code ISO 639-1 : fr, en, es, etc.)

### `license`
- **Type** : `string | null`
- **Default** : `null`
- **Description** : Licence du document

### `custom`
- **Type** : `Object`
- **Default** : `{}`
- **Description** : Métadonnées personnalisées (clé-valeur)

---

## 7. Developer

### `debugMode`
- **Type** : `boolean`
- **Default** : `false`
- **Description** : Mode débogage (affiche des informations détaillées)

### `exportIntermediate`
- **Type** : `boolean`
- **Default** : `false`
- **Description** : Exporter les formats intermédiaires

### `showPipeline`
- **Type** : `boolean`
- **Default** : `false`
- **Description** : Afficher le pipeline de conversion

### `logging`
- **Type** : `Object`
- **Default**:
  ```json
  {
    "level": "info",
    "verbose": false,
    "saveLogs": false
  }
  ```
- **Description** : Options de journalisation
  - `level` : Niveau de journal (`'debug'` | `'info'` | `'warn'` | `'error'`)
  - `verbose` : Mode verbeux
  - `saveLogs` : Enregistrer les journaux dans un fichier

---

## Usage

### Exemple de base

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
    title: 'My Document',
    author: 'John Doe',
    language: 'fr'
  }
});

// Validation
const validation = validateOptions(customOptions);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### Exemple API

```javascript
// API endpoint
app.post('/convert', async (req, res) => {
  const { text, from, to, options } = req.body;
  
  // Merge with default options
  const conversionOptions = mergeOptions(options || {});
  
  // Validate
  const validation = validateOptions(conversionOptions);
  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }
  
  // Use options for conversion
  const result = await convertWithOptions(text, from, to, conversionOptions);
  res.json({ result });
});
```

---

## Valeurs par défaut sûres

Toutes les options sont configurées avec des valeurs par défaut sûres et prévisibles :

- **Security** : Scripts désactivés, validation activée, limites de taille
- **Performance** : Délai d'expiration raisonnable, mode d'analyse équilibré
- **Compatibility** : Formats standard (UTF-8, CommonMark, Asciidoctor)
- **Robustness** : Validation activée, gestion des erreurs

---

## Extension

Pour ajouter de nouvelles options :

1. Ajouter la structure dans le fichier `conversion-options.js`
2. Définir les valeurs par défaut
3. Mettre à jour la fonction `validateOptions` si nécessaire
4. Documenter dans `conversion-options.md`
