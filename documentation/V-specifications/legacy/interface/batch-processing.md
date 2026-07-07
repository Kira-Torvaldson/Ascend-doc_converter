> ⚠️ **Deprecated:** Contenu migré vers les fichiers de référence canoniques.

# Traitement par lots

## Objectif

Ce document définit le comportement canonique du traitement par lots pour le frontend Ascend. Il précise comment plusieurs fichiers sont traités dans une seule opération.

## Service de traitement par lots

### Emplacement du service

**Fichier :** `api/frontend/services/bulk-processor.ts`

**Exports :**
- `bulkProcessFiles()` : Traitement séquentiel
- `bulkProcessFilesConcurrent()` : Traitement parallèle
- `calculateBulkStats()` : Calcul des statistiques
- `filterSuccessful()` : Filtrer les résultats réussis
- `filterFailed()` : Filtrer les résultats échoués

## Modes de traitement

### Traitement séquentiel

**Fonction :** `bulkProcessFiles()`

**Comportement :**
- Traite les fichiers un par un
- Attend la fin de chaque fichier avant le suivant
- Callback de progression après chaque fichier
- Les erreurs individuelles n'interrompent pas le lot

**Cas d'usage :** Par défaut, recommandé pour la stabilité

### Traitement concurrent

**Fonction :** `bulkProcessFilesConcurrent()`

**Comportement :**
- Traite plusieurs fichiers en parallèle
- Limite de concurrence configurable (par défaut : 1)
- Callback de progression après chaque fichier
- Les erreurs individuelles n'interrompent pas le lot

**Cas d'usage :** Traitement plus rapide lorsque le serveur peut le supporter

## Interface fichier

### Type BulkFile

```typescript
interface BulkFile {
  name: string;           // File name (for display)
  content: string;        // File content
  fromFormat: string;     // Source format
  toFormat: string;       // Target format
  options?: object;       // Optional conversion options
}
```

## Interface résultat

### Type BulkFileResult

```typescript
interface BulkFileResult {
  file: string;           // Original file name
  success: boolean;       // Conversion success
  result?: string;       // Converted content (if success)
  error?: string;        // Error message (if failed)
}
```

## Suivi de progression

### Interface de progression

```typescript
interface BulkProgress {
  current: number;        // Current file index (1-based)
  total: number;          // Total number of files
  currentFile: string;    // Current file name
  percentage: number;     // Completion percentage (0-100)
}
```

### Callback de progression

**Fonction :** `onProgress?: (progress: BulkProgress) => void`

**Utilisation :**
- Appelé après le traitement de chaque fichier
- Fournit des mises à jour de progression en temps réel
- Permet la mise à jour de la barre de progression dans l'interface

## Gestion des erreurs

### Erreurs par fichier

**Règle :** Les échecs individuels n'interrompent pas le lot.

**Comportement :**
- Fichier échoué marqué avec `success: false`
- Message d'erreur dans le champ `error`
- Le traitement continue avec le fichier suivant
- Tous les résultats sont retournés malgré les échecs

### Erreurs de lot

**Règle :** Les erreurs au niveau du lot interrompent le traitement.

**Comportement :**
- Entrée invalide (pas un tableau, tableau vide)
- Erreurs réseau
- Erreurs système

## Statistiques

### Calcul des statistiques

**Fonction :** `calculateBulkStats(results: BulkFileResult[])`

**Retourne :**
```typescript
{
  total: number;          // Total files
  successful: number;     // Successful conversions
  failed: number;         // Failed conversions
  successRate: number;    // Success rate (0-100)
}
```

## Intégration API

### Point de terminaison utilisé

**Point de terminaison :** `POST /api/proxy/convert`

**Justification :**
- Utilise le point de terminaison proxy pour la normalisation des données
- Gère automatiquement le BOM, l'encodage et les guillemets typographiques
- Cohérent avec la conversion fichier unique

### Format de requête

```json
{
  "content": "file content",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "options": {}
}
```

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- L'interface de traitement par lots
- Les modes de traitement
- Le suivi de progression
- La gestion des erreurs
