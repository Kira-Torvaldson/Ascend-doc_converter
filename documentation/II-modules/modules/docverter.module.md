# Module Docverter

## Description

Le module `docverter` est un wrapper pour l'outil Docverter, un service de conversion de documents. Ce module implémente l'interface définie dans [modules.interface.md](../modules.interface.md) et respecte les obligations minimales de sécurité de la version 1.

**Note :** Ce module est actuellement en préparation pour une intégration future. L'implémentation complète sera ajoutée lorsque Docverter sera intégré au pipeline.

## Nom du module

**Identifiant :** `docverter`  
**Type :** Module de conversion de documents  
**Outil sous-jacent :** Docverter (à intégrer)

## Formats pris en charge

**Formats d'entrée (`from`) :**
- `rtf` : Rich Text Format
- `pdf` : Format PDF
- `html` : Format HTML
- `txt` : Texte brut
- `markdown` : Format Markdown standard
- `docx` : Format Microsoft Word
- `xlsx` : Format Microsoft Excel
- `pptx` : Format Microsoft PowerPoint
- `odt` : Format OpenDocument Text
- `ods` : Format OpenDocument Spreadsheet
- `odp` : Format OpenDocument Presentation
- `png` : Format image PNG
- `jpg` : Format image JPEG
- `jpeg` : Format image JPEG
- `gif` : Format image GIF

**Formats de sortie (`to`) :**
- `rtf` : Rich Text Format
- `pdf` : Format PDF
- `html` : Format HTML
- `txt` : Texte brut
- `markdown` : Format Markdown standard
- `docx` : Format Microsoft Word
- `xlsx` : Format Microsoft Excel
- `pptx` : Format Microsoft PowerPoint
- `odt` : Format OpenDocument Text
- `ods` : Format OpenDocument Spreadsheet
- `odp` : Format OpenDocument Presentation
- `png` : Format image PNG
- `jpg` : Format image JPEG
- `jpeg` : Format image JPEG
- `gif` : Format image GIF

**Structure :**
```typescript
supportedFormats: {
  from: ['rtf', 'pdf', 'html', 'txt', 'markdown', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'png', 'jpg', 'jpeg', 'gif'],
  to: ['rtf', 'pdf', 'html', 'txt', 'markdown', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'png', 'jpg', 'jpeg', 'gif']
}
```

**Note :** Les formats pris en charge et les combinaisons de conversion autorisées seront confirmés lors de l'intégration complète de Docverter.

## Méthode `run`

### Signature

```typescript
run(inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

### Description du fonctionnement (à implémenter)

La méthode `run` effectuera la conversion d'un fichier d'un format vers un autre selon le processus suivant (à implémenter) :

#### 1. Lecture sécurisée du fichier d'entrée

- Le module lira le fichier situé à `inputPath` en utilisant l'encodage approprié (binaire pour les images, texte pour les documents)
- Toute erreur de lecture doit être capturée et transformée en `ModuleResult` avec `success: false`

#### 2. Validation de l'entrée

- Le module validera que le contenu lu est valide
- Le module vérifiera la taille du fichier (selon les limites configurées)
- Le module vérifiera que le type de fichier correspond au format déclaré (validation MIME si applicable)

#### 3. Conversion via Docverter

- Le module utilisera Docverter pour effectuer la conversion
- La méthode d'intégration (API REST, service local, binaire) sera déterminée lors de l'implémentation
- Les options de conversion seront transmises à Docverter selon sa configuration
- Si Docverter est un service externe, le module gérera les appels réseau de manière sécurisée

#### 4. Écriture du résultat dans le fichier de sortie

- Le module écrira le contenu converti dans le fichier situé à `outputPath`
- L'encodage sera déterminé selon le format de sortie (binaire pour les images, texte pour les documents)
- Toute erreur d'écriture doit être capturée et transformée en `ModuleResult` avec `success: false`

#### 5. Retour du résultat

- Le module retournera un objet `ModuleResult` conforme au contrat défini dans [modules.interface.md](../modules.interface.md)
- Le champ `success` sera `true` si la conversion et l'écriture ont réussi, `false` sinon
- Le champ `logs` contiendra les journaux d'exécution
- Le champ `error` sera `null` en cas de succès, ou contiendra un message d'erreur descriptif en cas d'échec
- Le champ `duration` contiendra la durée totale d'exécution en secondes

### Paramètres

- **`inputPath`** (obligatoire) : Chemin absolu vers le fichier d'entrée à convertir
- **`outputPath`** (obligatoire) : Chemin absolu vers le fichier de sortie à créer
- **`options`** (optionnel) : Objet contenant les options de conversion
  - `fromFormat` : Format source (obligatoire pour déterminer la conversion)
  - `toFormat` : Format de destination (obligatoire pour déterminer la conversion)
  - `conversionId` : ID de conversion pour les journaux (optionnel)
  - Autres options spécifiques à Docverter (à définir lors de l'implémentation)

### Valeur de retour

La méthode retournera une `Promise` qui se résout avec un objet `ModuleResult` :

```typescript
{
  success: boolean,        // true si la conversion a réussi, false sinon
  logs: string | string[], // Journaux d'exécution
  error: string | null,   // Message d'erreur ou null
  duration: number        // Durée en secondes
}
```

## Sécurité et isolation

### Obligations minimales de sécurité (V1)

Le module respectera les obligations minimales de sécurité définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Validation basique de l'entrée

- **Vérification de la taille** : Le module validera que le fichier d'entrée ne dépasse pas la limite maximale configurée
- **Vérification du type** : Le module validera que le fichier correspond au format déclaré (validation MIME si applicable)
- **Rejet immédiat** : Si les validations échouent, le module retournera immédiatement un `ModuleResult` avec `success: false`

**Références normatives :** ISO 27001 (A.9.4.2), ISO 27002 (A.9.4.2), NIST SP 800-53 (SI-7), OWASP Top 10 (A03:2021)

#### 2. Isolation légère

- **Aucune interaction directe** : Le module n'interagira pas directement avec le reste du système en dehors des chemins `inputPath` et `outputPath` fournis par le pipeline
- **Exécution dans un contexte isolé** : Le module s'exécutera dans un répertoire temporaire unique par conversion, fourni par le pipeline
- **Accès réseau contrôlé** : Si Docverter nécessite un accès réseau (API REST), le module devra gérer les appels de manière sécurisée (délai d'expiration, validation de la réponse, pas d'exposition de données sensibles)

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 3. Gestion sécurisée des erreurs

- **Capture exhaustive** : Toutes les exceptions et erreurs doivent être capturées et transformées en `ModuleResult` avec `success: false`
- **Aucun crash global** : Aucune exception non gérée ne doit se propager au pipeline principal
- **Messages d'erreur sécurisés** : Les messages d'erreur ne doivent pas exposer de détails système sensibles

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 4. Journalisation minimale

- **ID de conversion** : Le module doit inclure l'identifiant unique de conversion dans ses journaux
- **Horodatage** : Le module doit enregistrer l'horodatage du début et de la fin d'exécution
- **Journaux d'exécution** : Le module doit produire des journaux décrivant les étapes principales
- **Statut final** : Le module doit inclure le statut final (succès/échec) dans les journaux retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Vérification légère de l'intégrité

- **Vérification du service** : Le module vérifiera que Docverter est disponible avant l'exécution
- **Documentation des dépendances** : Le module documentera ses dépendances (Docverter et sa version requise, méthode d'intégration)
- **Signalement des modifications** : Le module pourra signaler toute modification détectée de l'intégrité (optionnel en V1)

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Contraintes d'exécution

- **Isolation** : Le module ne doit pas modifier le fichier d'entrée, doit uniquement accéder aux fichiers fournis, et ne doit pas créer de fichiers en dehors du répertoire autorisé
- **Performance** : Le module doit respecter les délais d'expiration imposés par le pipeline et libérer les ressources après l'exécution
- **Sécurité** : Le module doit valider les chemins de fichiers avant utilisation et utiliser des méthodes d'exécution ou d'appel réseau sécurisées

## Comportement attendu

### En cas de succès (à implémenter)

1. Le fichier de sortie sera créé à l'emplacement `outputPath` avec le contenu converti
2. Le fichier de sortie sera valide et conforme au format de destination
3. Le module retournera un `ModuleResult` avec `success: true`, `error: null`, des journaux détaillés et la durée d'exécution

### En cas d'échec (à implémenter)

1. Aucun fichier de sortie ne sera créé (ou sera supprimé s'il a été partiellement créé)
2. Le module retournera un `ModuleResult` avec `success: false`, un message d'erreur descriptif dans `error`, des journaux jusqu'au point d'échec, et la durée jusqu'à l'échec

## Notes

### État actuel

Ce module est actuellement en préparation pour une intégration future. L'implémentation complète sera ajoutée lorsque Docverter sera intégré au pipeline.

### Docverter

Docverter est un service de conversion de documents qui prend en charge de nombreux formats (documents Office, images, formats texte). Les détails d'intégration (API REST, service local, binaire) seront déterminés lors de l'implémentation.

### Formats pris en charge

Les formats pris en charge par Docverter incluent les formats de documents Office (DOCX, XLSX, PPTX, ODT, ODS, ODP), les formats texte (RTF, HTML, TXT, Markdown), les formats image (PNG, JPG, JPEG, GIF) et le format PDF. La liste exacte et les combinaisons de conversion autorisées seront confirmées lors de l'intégration.

### Performance

Les caractéristiques de performance seront documentées lors de l'implémentation complète. Si Docverter est un service externe, les considérations de latence réseau doivent être prises en compte.

## Conformité

Ce module respectera strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations minimales de sécurité de la version 1. Toute modification du module doit maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [PIPELINE.md](../PIPELINE.md) - Spécification du pipeline de conversion
