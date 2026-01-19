# Module Docverter

## Description

Le module `docverter` est un wrapper pour l'outil Docverter, un service de conversion de documents. Ce module implémente l'interface définie dans [modules.interface.md](../modules.interface.md) et respecte les obligations de sécurité minimales de la version 1.

**Note :** Ce module est actuellement en préparation pour intégration future. L'implémentation complète sera ajoutée lors de l'intégration de Docverter dans le pipeline.

## Nom du module

**Identifiant :** `docverter`  
**Type :** Module de conversion de documents  
**Outil sous-jacent :** Docverter (à intégrer)

## Formats supportés

**Formats d'entrée (`from`) :**
- `rtf` : Format Rich Text Format
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
- `rtf` : Format Rich Text Format
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

**Note :** Les formats supportés et les combinaisons de conversion autorisées seront confirmés lors de l'intégration complète de Docverter.

## Méthode `run`

### Signature

```typescript
run(inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

### Description du fonctionnement (à implémenter)

La méthode `run` effectuera la conversion d'un fichier d'un format vers un autre selon le processus suivant (à implémenter) :

#### 1. Lecture sécurisée du fichier d'entrée

- Le module lira le fichier situé à `inputPath` en utilisant l'encodage approprié (binaire pour les images, texte pour les documents)
- Toute erreur de lecture devra être capturée et transformée en `ModuleResult` avec `success: false`

#### 2. Validation des entrées

- Le module validera que le contenu lu est valide
- Le module vérifiera la taille du fichier (selon les limites configurées)
- Le module vérifiera que le type de fichier correspond au format déclaré (validation MIME si applicable)

#### 3. Conversion via Docverter

- Le module utilisera Docverter pour effectuer la conversion
- La méthode d'intégration (API REST, service local, binaire) sera déterminée lors de l'implémentation
- Les options de conversion seront passées à Docverter selon sa configuration
- Si Docverter est un service externe, le module gérera les appels réseau de manière sécurisée

#### 4. Écriture du résultat dans le fichier de sortie

- Le module écrira le contenu converti dans le fichier situé à `outputPath`
- L'encodage sera déterminé selon le format de sortie (binaire pour les images, texte pour les documents)
- Toute erreur d'écriture devra être capturée et transformée en `ModuleResult` avec `success: false`

#### 5. Retour du résultat

- Le module retournera un objet `ModuleResult` conforme au contrat défini dans [modules.interface.md](../modules.interface.md)
- Le champ `success` sera `true` si la conversion et l'écriture ont réussi, `false` sinon
- Le champ `logs` contiendra les logs d'exécution
- Le champ `error` sera `null` en cas de succès, ou contiendra un message d'erreur descriptif en cas d'échec
- Le champ `duration` contiendra la durée totale d'exécution en secondes

### Paramètres

- **`inputPath`** (requis) : Chemin absolu vers le fichier d'entrée à convertir
- **`outputPath`** (requis) : Chemin absolu vers le fichier de sortie à créer
- **`options`** (optionnel) : Objet contenant les options de conversion
  - `fromFormat` : Format source (requis pour déterminer la conversion)
  - `toFormat` : Format de destination (requis pour déterminer la conversion)
  - `conversionId` : ID de conversion pour les logs (optionnel)
  - Autres options spécifiques à Docverter (à définir lors de l'implémentation)

### Valeur de retour

La méthode retournera une `Promise` qui se résout avec un objet `ModuleResult` :

```typescript
{
  success: boolean,        // true si conversion réussie, false sinon
  logs: string | string[], // Logs d'exécution
  error: string | null,   // Message d'erreur ou null
  duration: number        // Durée en secondes
}
```

## Sécurité et isolation

### Obligations de sécurité minimales (V1)

Le module respectera les obligations de sécurité minimales définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Validation basique des entrées

- **Vérification de la taille** : Le module validera que le fichier d'entrée ne dépasse pas la limite maximale configurée
- **Vérification du type** : Le module validera que le fichier correspond au format déclaré (validation MIME si applicable)
- **Rejet immédiat** : Si les validations échouent, le module retournera immédiatement un `ModuleResult` avec `success: false`

**Références normatives :** ISO 27001 (A.9.4.2), ISO 27002 (A.9.4.2), NIST SP 800-53 (SI-7), OWASP Top 10 (A03:2021)

#### 2. Isolement léger

- **Aucune interaction directe** : Le module n'interagira pas directement avec le reste du système en dehors des chemins `inputPath` et `outputPath` fournis par le pipeline
- **Exécution dans un contexte isolé** : Le module s'exécutera dans un dossier temporaire unique par conversion, fourni par le pipeline
- **Accès réseau contrôlé** : Si Docverter nécessite un accès réseau (API REST), le module devra gérer les appels de manière sécurisée (timeout, validation des réponses, pas d'exposition de données sensibles)

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 3. Gestion sécurisée des erreurs

- **Capture exhaustive** : Toutes les exceptions et erreurs devront être capturées et transformées en `ModuleResult` avec `success: false`
- **Pas de crash global** : Aucune exception non gérée ne devra remonter au pipeline principal
- **Messages d'erreur sécurisés** : Les messages d'erreur ne devront pas exposer de détails système sensibles

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 4. Journalisation minimale

- **ID de conversion** : Le module devra inclure l'ID de conversion unique dans ses logs
- **Horodatage** : Le module devra enregistrer l'horodatage de début et de fin d'exécution
- **Logs d'exécution** : Le module devra produire des logs décrivant les étapes principales
- **Statut final** : Le module devra inclure le statut final (succès/échec) dans les logs retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Vérification légère de l'intégrité

- **Vérification du service** : Le module vérifiera que Docverter est disponible avant exécution
- **Documentation des dépendances** : Le module documentera ses dépendances (Docverter et sa version requise, méthode d'intégration)
- **Signalement des modifications** : Le module pourra signaler toute modification détectée de l'intégrité (optionnel en V1)

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Contraintes d'exécution

- **Isolation** : Le module ne devra pas modifier le fichier d'entrée, ne devra accéder qu'aux fichiers fournis, et ne devra pas créer de fichiers en dehors du répertoire autorisé
- **Performance** : Le module devra respecter les timeouts imposés par le pipeline et libérer les ressources après exécution
- **Sécurité** : Le module devra valider les chemins de fichiers avant utilisation et utiliser des méthodes sécurisées d'exécution ou d'appel réseau

## Comportement attendu

### En cas de succès (à implémenter)

1. Le fichier de sortie sera créé à l'emplacement `outputPath` avec le contenu converti
2. Le fichier de sortie sera valide et conforme au format de destination
3. Le module retournera un `ModuleResult` avec `success: true`, `error: null`, des logs détaillés et la durée d'exécution

### En cas d'échec (à implémenter)

1. Aucun fichier de sortie ne sera créé (ou sera supprimé s'il a été créé partiellement)
2. Le module retournera un `ModuleResult` avec `success: false`, un message d'erreur descriptif dans `error`, les logs jusqu'au point d'échec, et la durée jusqu'à l'échec

## Notes

### Statut actuel

Ce module est actuellement en préparation pour intégration future. L'implémentation complète sera ajoutée lors de l'intégration de Docverter dans le pipeline.

### Docverter

Docverter est un service de conversion de documents qui supporte de nombreux formats (documents Office, images, formats texte). Les détails d'intégration (API REST, service local, binaire) seront déterminés lors de l'implémentation.

### Formats supportés

Les formats supportés par Docverter incluent les formats de documents Office (DOCX, XLSX, PPTX, ODT, ODS, ODP), les formats texte (RTF, HTML, TXT, Markdown), les formats image (PNG, JPG, JPEG, GIF), et le format PDF. La liste exacte et les combinaisons de conversion autorisées seront confirmées lors de l'intégration.

### Performance

Les caractéristiques de performance seront documentées lors de l'implémentation complète. Si Docverter est un service externe, les considérations de latence réseau devront être prises en compte.

## Conformité

Ce module respectera strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations de sécurité minimales de la version 1. Toute modification du module devra maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [PIPELINE.md](../PIPELINE.md) - Spécification du pipeline de conversion
