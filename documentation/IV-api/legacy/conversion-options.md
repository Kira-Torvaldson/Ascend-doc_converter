> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Référence des options de conversion

## Objectif

Ce document définit les options de conversion canoniques disponibles dans Ascend. Les options permettent un contrôle fin du comportement de conversion.

## Structure des options

Les options de conversion sont organisées en 7 catégories principales :

1. **Content Analysis** — Analyse du contenu et détection de structure
2. **Normalization** — Normalisation du texte et encodage
3. **Rendering** — Fonctionnalités de rendu de document
4. **Format Specific** — Options spécifiques au format
5. **Security** — Sécurité et robustesse
6. **Metadata** — Métadonnées du document
7. **Developer** — Options développeur

## Catégories d'options

### 1. Content Analysis

**Objectif :** Contrôler la façon dont le contenu est analysé et structuré.

**Options :**
- `analysisMode` : `'basic'` | `'heuristic'` | `'strict'` (par défaut : `'heuristic'`)
- `headingDetection` : Objet avec les règles de détection
  - `enabled` : boolean (par défaut : `true`)
  - `detectAllCaps` : boolean (par défaut : `true`)
  - `detectSeparators` : boolean (par défaut : `true`)
  - `detectNumbering` : boolean (par défaut : `true`)
  - `minLength` : number (par défaut : `3`)
  - `maxLength` : number (par défaut : `100`)
- `listDetection` : Objet avec les règles de détection de listes
  - `enabled` : boolean (par défaut : `true`)
  - `detectBullets` : boolean (par défaut : `true`)
  - `detectNumbered` : boolean (par défaut : `true`)
  - `preserveIndentation` : boolean (par défaut : `true`)
  - `normalizeIndentation` : boolean (par défaut : `true`)
  - `indentSize` : number (par défaut : `2`)

### 2. Normalization

**Objectif :** Contrôler la normalisation du texte et l'encodage.

**Options :**
- `encoding` : `'utf-8'` | `'latin1'` | `'ascii'` (par défaut : `'utf-8'`)
- `lineBreaks` : Objet avec la normalisation des sauts de ligne
  - `normalize` : boolean (par défaut : `true`)
  - `target` : `'unix'` | `'windows'` | `'mac'` (par défaut : `'unix'`)
  - `removeTrailing` : boolean (par défaut : `true`)
  - `maxConsecutive` : number (par défaut : `2`)
- `tabs` : Objet avec la conversion des tabulations
  - `convertToSpaces` : boolean (par défaut : `true`)
  - `tabSize` : number (par défaut : `2`)
- `advanced` : Objet avec les options de normalisation avancées
  - Voir `doc/references/normalization/` pour les options détaillées

### 3. Rendering

**Objectif :** Contrôler les fonctionnalités de rendu de document.

**Options :**
- `tableOfContents` : Objet avec la génération de table des matières
  - `enabled` : boolean (par défaut : `false`)
  - `depth` : number (par défaut : `3`)
  - `position` : `'top'` | `'bottom'` | `'none'` (par défaut : `'top'`)
- `sectionNumbering` : Objet avec la numérotation des sections
  - `enabled` : boolean (par défaut : `false`)
  - `depth` : number (par défaut : `3`)
  - `style` : `'numeric'` | `'alpha'` | `'roman'` (par défaut : `'numeric'`)
- `lineWrap` : Objet avec le retour à la ligne
  - `enabled` : boolean (par défaut : `false`)
  - `maxWidth` : number (par défaut : `80`)
  - `hardWrap` : boolean (par défaut : `false`)
- `listStyle` : Objet avec le style des listes
  - `bulletStyle` : `'dash'` | `'asterisk'` | `'plus'` | `'circle'` (par défaut : `'dash'`)
  - `numberedStyle` : `'numeric'` | `'alpha'` | `'roman'` (par défaut : `'numeric'`)
  - `indentChar` : string (par défaut : `' '`)
  - `indentSize` : number (par défaut : `2`)

### 4. Format Specific

**Objectif :** Options de conversion spécifiques au format.

**Options :**
- `markdown` : Objet avec les options spécifiques à Markdown
  - `flavor` : `'commonmark'` | `'gfm'` | `'pandoc'` (par défaut : `'commonmark'`)
  - `gfmExtensions` : Objet avec les extensions GitHub Flavored Markdown
  - `parsedown` : boolean (par défaut : `false`) — Compatibilité BookStack/Parsedown
- `asciidoc` : Objet avec les options spécifiques à AsciiDoc
  - Options spécifiques au format (voir l'implémentation)

### 5. Security

**Objectif :** Options de sécurité et de robustesse.

**Options :**
- `timeout` : number (millisecondes, par défaut : `30000`)
- `maxFileSize` : number (octets, par défaut : `10485760` = 10 MB)
- `confirmed` : boolean (par défaut : `false`) — Statut de confirmation utilisateur

### 6. Metadata

**Objectif :** Métadonnées du document.

**Options :**
- `title` : string (optionnel)
- `author` : string (optionnel)
- `language` : string (code ISO 639-1, par défaut : `'fr'`)

### 7. Developer

**Objectif :** Options développeur et de débogage.

**Options :**
- Options spécifiques au développeur (voir l'implémentation)

## Validation des options

### Règles de validation

1. **Validation de type :** Les options doivent correspondre aux types attendus
2. **Validation de plage :** Les options numériques doivent être dans des plages valides
3. **Validation d'énumération :** Les options textuelles doivent provenir des valeurs autorisées
4. **Validation de structure :** Les options objet doivent avoir les propriétés requises

### Fusion avec les valeurs par défaut

**Règle :** Les options fournies par l'utilisateur sont fusionnées avec les valeurs par défaut.

**Processus :**
1. Commencer avec les options par défaut
2. Fusion profonde des options utilisateur
3. Valider les options fusionnées
4. Utiliser les options validées

## Documentation associée

- **Normalization Options :** `doc/references/normalization/text-normalization.md`
- **Encoding Options :** `doc/references/normalization/encoding-rules.md`
- **Advanced Normalization :** `doc/references/configuration/normalization-advanced-options.md` (legacy, being migrated)

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les options de conversion disponibles
- Les types et valeurs des options
- Les valeurs par défaut
- Les règles de validation

**Note :** Pour les structures d'options détaillées et l'implémentation, voir `api/backend/conversion-options.js`.
