# Référence de l'interface utilisateur

## Objectif

Ce document définit les références canoniques de l'interface utilisateur pour Ascend, incluant le comportement du frontend et le traitement par lots. Il constitue la référence faisant autorité pour toutes les interactions frontend.

---

## Comportement du frontend

### Objectif

Cette section définit le comportement canonique du frontend pour Ascend. Elle spécifie les interactions de l'interface utilisateur, les parcours utilisateur et les règles spécifiques au frontend.

### Composants de l'interface utilisateur

#### Sélecteurs de format

**Composant :** Listes déroulantes de format source et destination

**Comportement :**
- Afficher tous les formats disponibles
- Désactiver les formats marqués comme « à venir »
- Afficher le libellé « (à venir) » pour les formats désactivés
- Ajustement automatique pour maintenir des paires de conversion valides

**Conversions valides :**
- AsciiDoc ↔ Markdown (activé)
- Autres paires de formats (désactivées, « à venir »)

#### Bouton de conversion

**Composant :** Bouton « Convertir »

**Comportement :**
- Activé uniquement pour les conversions valides (AsciiDoc ↔ Markdown)
- Désactivé pendant la conversion
- Affiche l'état de chargement pendant la conversion

#### Indicateur de progression

**Composant :** Retour visuel de progression

**Éléments :**
- Animation de spinner
- Message de progression
- Barre de progression animée
- Effet shimmer

**Durées :**
- Spinner : rotation de 1,2 s
- Barre de progression : animation de 2,5 s
- Shimmer : animation de 3 s

#### Compteur de caractères

**Composant :** Affichage des statistiques de texte

**Métriques :**
- Nombre de caractères
- Nombre de mots
- Nombre de lignes

**Emplacement :** Barre d'outils des panneaux source et résultat

#### Notifications toast

**Composant :** Messages de notification temporaires

**Types :**
- Succès (icône ✓)
- Erreur (icône ✕)

**Comportement :**
- Fermeture automatique après 5 secondes
- Bouton de fermeture manuelle
- Animation de glissement à la fermeture

### Parcours utilisateur

#### Parcours 1 : Conversion simple

1. L'utilisateur saisit du texte dans le panneau source
2. L'utilisateur sélectionne le format source (AsciiDoc ou Markdown)
3. L'utilisateur sélectionne le format destination (opposé de la source)
4. L'utilisateur clique sur « Convertir »
5. L'indicateur de progression s'affiche
6. Le résultat apparaît dans le panneau destination
7. Une notification de succès s'affiche

#### Parcours 2 : Inversion des formats

1. L'utilisateur clique sur le bouton d'inversion (⇄)
2. Les formats source et destination sont inversés
3. Le contenu source et destination est inversé (le cas échéant)
4. L'interface se met à jour pour refléter l'inversion

#### Parcours 3 : Export de fichier

1. L'utilisateur clique sur le bouton de téléchargement (⬇️)
2. Le système demande un nom de fichier
3. L'utilisateur saisit le nom de fichier
4. Le système ajoute l'extension correcte
5. Le fichier est téléchargé sur le système de l'utilisateur

#### Parcours 4 : Accès à l'historique

1. L'utilisateur clique sur le bouton historique
2. La modale d'historique s'ouvre
3. L'utilisateur voit la liste des conversions passées
4. L'utilisateur peut restaurer ou effacer l'historique

### Raccourcis clavier

#### Raccourcis disponibles

- `Ctrl+S` : Télécharger/enregistrer le résultat
- `Ctrl+Enter` : Déclencher la conversion
- `Ctrl+K` : Effacer le contenu source
- `Ctrl+/` : Afficher l'aide des raccourcis

#### Comportement des raccourcis

- Les raccourcis fonctionnent globalement (lorsque le focus n'est pas dans un champ de saisie)
- Les modales peuvent remplacer les raccourcis
- Les raccourcis sont documentés dans la modale d'aide

### Gestion de l'état

#### État du contenu

- Contenu source : `adocInput` ou `mdOutput` (selon le format)
- Contenu destination : Résultat de la conversion
- État d'édition : Suit si l'utilisateur modifie le résultat

#### État de conversion

- Chargement : Indicateur booléen
- Statut : Message textuel
- Conversion récente : Indicateur booléen (empêche une reconversion immédiate)

#### État de l'interface

- Notifications : Tableau d'objets de notification
- Modales : Indicateurs booléens pour chaque modale
- Fenêtre de navigation : Position, taille, état minimisé

### Règles de validation

#### Règle 1 : Validation des paires de formats

**Règle :** Seules les conversions AsciiDoc ↔ Markdown sont autorisées.

**Application :**
- Bouton désactivé pour les paires invalides
- Message d'avertissement affiché
- Ajustement automatique vers une paire valide

#### Règle 2 : Validation du contenu

**Règle :** Un contenu vide ne peut pas être converti.

**Application :**
- Bouton désactivé si la source est vide
- Message d'erreur clair en cas de tentative

#### Règle 3 : État de conversion

**Règle :** Une seule conversion à la fois.

**Application :**
- Bouton désactivé pendant la conversion
- Nouvelles demandes de conversion mises en file d'attente ou rejetées

---

## Traitement par lots

### Objectif

Cette section définit le comportement canonique du traitement par lots pour le frontend Ascend. Elle spécifie comment plusieurs fichiers sont traités en une seule opération.

### Service de traitement par lots

#### Emplacement du service

**Fichier :** `api/frontend/services/bulk-processor.ts`

**Exports :**
- `bulkProcessFiles()` : Traitement séquentiel
- `bulkProcessFilesConcurrent()` : Traitement parallèle
- `calculateBulkStats()` : Calcul des statistiques
- `filterSuccessful()` : Filtrer les résultats réussis
- `filterFailed()` : Filtrer les résultats échoués

### Modes de traitement

#### Traitement séquentiel

**Fonction :** `bulkProcessFiles()`

**Comportement :**
- Traiter les fichiers un par un
- Attendre l'achèvement de chaque fichier avant le suivant
- Rappel de progression après chaque fichier
- Les erreurs individuelles n'arrêtent pas le lot

**Cas d'usage :** Par défaut, recommandé pour la stabilité

#### Traitement concurrent

**Fonction :** `bulkProcessFilesConcurrent()`

**Comportement :**
- Traiter plusieurs fichiers en parallèle
- Limite de concurrence configurable (par défaut : 1)
- Rappel de progression après chaque fichier
- Les erreurs individuelles n'arrêtent pas le lot

**Cas d'usage :** Traitement plus rapide lorsque le serveur peut le supporter

### Interface de fichier

#### Type BulkFile

```typescript
interface BulkFile {
  name: string;           // File name (for display)
  content: string;        // File content
  fromFormat: string;     // Source format
  toFormat: string;       // Target format
  options?: object;       // Optional conversion options
}
```

### Interface de résultat

#### Type BulkFileResult

```typescript
interface BulkFileResult {
  file: string;           // Original file name
  success: boolean;       // Conversion success
  result?: string;       // Converted content (if success)
  error?: string;        // Error message (if failed)
}
```

### Suivi de progression

#### Interface de progression

```typescript
interface BulkProgress {
  current: number;        // Current file index (1-based)
  total: number;          // Total number of files
  currentFile: string;    // Current file name
  percentage: number;     // Completion percentage (0-100)
}
```

#### Rappel de progression

**Fonction :** `onProgress?: (progress: BulkProgress) => void`

**Utilisation :**
- Appelé après le traitement de chaque fichier
- Fournit des mises à jour de progression en temps réel
- Permet la mise à jour de la barre de progression de l'interface

### Gestion des erreurs

#### Erreurs par fichier

**Règle :** Les échecs individuels de fichiers n'arrêtent pas le lot.

**Comportement :**
- Fichier échoué marqué avec `success: false`
- Message d'erreur dans le champ `error`
- Le traitement continue avec le fichier suivant
- Tous les résultats sont retournés indépendamment des échecs

#### Erreurs de lot

**Règle :** Les erreurs au niveau du lot arrêtent le traitement.

**Comportement :**
- Entrée invalide (pas un tableau, tableau vide)
- Erreurs réseau
- Erreurs système

### Statistiques

#### Calcul des statistiques

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

### Intégration API

#### Point de terminaison utilisé

**Point de terminaison :** `POST /api/proxy/convert`

**Justification :**
- Utilise le point de terminaison proxy pour la normalisation des données
- Gère automatiquement le BOM, l'encodage et les guillemets typographiques
- Cohérent avec la conversion de fichier unique

#### Format de requête

```json
{
  "content": "file content",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "options": {}
}
```

---

## Statut canonique

Ce document est **canonique** et constitue la source de vérité pour :
- Le comportement des composants de l'interface
- Les parcours d'interaction utilisateur
- Les raccourcis clavier
- Les règles de gestion de l'état
- L'interface de traitement par lots
- Les modes de traitement
- Le suivi de progression
- La gestion des erreurs

Toute modification du comportement de l'interface doit d'abord être reflétée ici, puis propagée vers le code d'implémentation.
