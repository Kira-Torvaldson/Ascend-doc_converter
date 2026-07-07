# Spécification du contrat ConversionResult

## Introduction

Ce document définit la première référence officielle consolidée du futur contrat standardisé `ConversionResult` pour les conversions Ascend.
Il précise la structure du contrat, les règles de cohérence et la sémantique standardisée des codes d'erreur. Une première implémentation de référence d'assistants de résultats centralisés et un premier véritable chemin de conversion migré existent dans le backend ; une adoption plus large à travers le backend se poursuivra dans les étapes ultérieures.

## Blocs conceptuels

`ConversionResult` est organisé en six blocs conceptuels :

1. **Informations générales** : contexte global de conversion et identité.
2. **Fichier d'entrée** : informations sur le document source fournies au pipeline.
3. **Fichier de sortie** : informations générées sur le document de sortie.
4. **Observabilité** : avertissements et journaux qui expliquent le comportement d'exécution.
5. **Erreur** : informations d'échec standardisées pour les conversions infructueuses.
6. **Métadonnées techniques** : données techniques non essentielles extensibles.

Représentation de haut niveau :

```text
ConversionResult
├── General information
├── Input file
├── Output file
├── Observability
├── Error
└── Technical metadata
```

## Champs au niveau racine

| Champ | Objectif | Bloc conceptuel |
|---|---|---|
| `success` | Statut de conversion global. | Informations générales |
| `conversionId` | Identifiant de conversion unique. | Informations générales |
| `converter` | Convertisseur principal utilisé pour l'exécution. | Informations générales |
| `pipeline` | Liste ordonnée des étapes de conversion utilisées pour l'opération. | Informations générales |
| `inputFormat` | Format source déclaré pour la conversion. | Informations générales |
| `outputFormat` | Format cible déclaré pour la conversion. | Informations générales |
| `inputFile` | Bloc d’informations sur le fichier d’entrée. | Fichier d'entrée |
| `outputFile` | Bloc d'informations sur le fichier de sortie. | Fichier de sortie |
| `durationMs` | Durée totale d'exécution en millisecondes. | Informations générales |
| `startedAt` | Horodatage de début de conversion. | Informations générales |
| `finishedAt` | Horodatage de fin de conversion. | Informations générales |
| `warnings` | Collecte d'avertissements non bloquants. | Observabilité |
| `logs` | Collection d'entrées du journal d'exécution. | Observabilité |
| `error` | Bloc de défaillance standardisé. | Erreur |
| `meta` | Métadonnées techniques extensibles. | Métadonnées techniques |

## Structures d'objets imbriqués

### `inputFile`

Objectif : décrit le fichier source capturé par le pipeline de conversion.

- `originalName` : nom de fichier original du contexte source.
- `storedPath` : chemin interne utilisé pour les entrées stockées.
- `size` : métadonnées de taille de fichier d'entrée.
- `mimeType` : type MIME d'entrée détecté ou déclaré.

### `outputFile`

Objectif : décrit le fichier de sortie généré.

- `path` : chemin interne de la sortie générée.
- `size` : métadonnées de taille du fichier de sortie.
- `mimeType` : type MIME associé à la sortie.

### `error`

Objectif : décrit les informations d'échec standardisées lorsque la conversion échoue.

- `code` : identifiant d'erreur normalisé.
- `message` : message de diagnostic lisible par l'homme.
- `details` : informations contextuelles supplémentaires sur l'échec.
- `recoverable` : indique si une nouvelle tentative/récupération est conceptuellement possible.

### entrée `logs`

Objectif : décrit un enregistrement d'observabilité dans la collection `logs`.

- `level` : niveau de gravité du journal.
- `message` : contenu du message du journal.
- `timestamp` : horodatage de l'événement du journal.

## Types de champs

### Types de champs au niveau racine

| Champ | Type |
|---|---|
| `success` | `boolean` |
| `conversionId` | `string` |
| `converter` | `string` |
| `pipeline` | `string[]` |
| `inputFormat` | `string` |
| `outputFormat` | `string` |
| `inputFile` | `object` |
| `outputFile` | `object` |
| `durationMs` | `number` |
| `startedAt` | `string` |
| `finishedAt` | `string` |
| `warnings` | `string[]` |
| `logs` | `object[]` |
| `error` | `object` |
| `meta` | `object` |

### Types de champs imbriqués

#### `inputFile`

| Champ | Type |
|---|---|
| `originalName` | `string` |
| `storedPath` | `string` |
| `size` | `number` |
| `mimeType` | `string` |

#### `outputFile`

| Champ | Type |
|---|---|
| `path` | `string` |
| `size` | `number` |
| `mimeType` | `string` |

#### `error`

| Champ | Type |
|---|---|
| `code` | `string` |
| `message` | `string` |
| `details` | `string` |
| `recoverable` | `boolean` |

#### `logs` entry

| Champ | Type |
|---|---|
| `level` | `string` |
| `message` | `string` |
| `timestamp` | `string` |

## Règles de nullabilité

### Nullabilité au niveau racine

Champs de niveau racine non nuls :

- `success`
- `conversionId`
- `converter`
- `pipeline`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `durationMs`
- `startedAt`
- `finishedAt`
- `warnings`
- `logs`
- `meta`

Champs de niveau racine nuls :

- `outputFile`
- `error`

### Nullabilité imbriquée

#### `inputFile`

- `originalName` : non nul
- `storedPath` : non nul
- `size` : non nul
- `mimeType` : nullable

#### `outputFile` (si présent)

- `path` : non nul
- `size` : non nul
- `mimeType` : nullable

#### `error` (si présent)

- `code` : non nul
- `message` : non nul
- `details` : nullable
- `recoverable` : non nul

#### entrée `logs`

- `level` : non nul
- `message` : non nul
- `timestamp` : non nul

## Règles de cohérence sémantique

1. **Cohérence succès / erreur**
 - Si `success` est `true`, `error` doit être `null`.
 - Si `success` est `false`, `error` doit être présent.

2. **Succès / cohérence de sortie**
 - Si `success` est `true`, `outputFile` doit être présent.
 - Si `success` est `false`, `outputFile` peut être `null`.

3. **Les collections doivent toujours exister**
 - `pipeline` doit toujours exister sous forme de tableau.
 - `warnings` doit toujours exister sous forme de tableau.
 - `logs` doit toujours exister sous forme de tableau.
 - Ces collections peuvent être vides, mais elles ne doivent pas être omises.

4. **Les métadonnées doivent toujours exister**
 - `meta` doit toujours exister en tant qu'objet.
- Il peut être vide, mais il ne doit pas être omis.

5. **Le fichier d'entrée doit toujours exister**
 - `inputFile` doit toujours être présent.
 - Un résultat de conversion sans informations sur le fichier d'entrée n'est pas valide.

6. **Exhaustivité de l'objet d'erreur**
 - Lorsque `error` est présent, il doit inclure tous les champs `error` requis.
 - L'objet `error` ne doit pas être partiel ou mal formé.

7. **Exhaustivité du fichier de sortie**
 - Lorsque `outputFile` est présent, il doit inclure tous les champs `outputFile` requis.
 - L'objet `outputFile` ne doit pas être partiel ou mal formé.

8. **Exhaustivité de l'entrée du journal**
 - Chaque entrée du journal doit inclure tous les `logs` champs d'entrée requis.
 - Une entrée du journal ne doit pas être partielle ou mal formée.

9. **Sémantique du pipeline**
 - `pipeline` représente la liste ordonnée des étapes de conversion utilisées par l'opération.
 - Même pour une conversion en une seule étape, `pipeline` doit toujours être un tableau.

10. **Cohérence des horodatages et de la durée**
 - `startedAt`, `finishedAt` et `durationMs` doivent décrire la même opération de conversion.
 - `durationMs` doit représenter la durée d'exécution du résultat de conversion rapporté.

## Note de référence

Ce document est la base de référence officielle de la documentation pour le contrat `ConversionResult`.
L'implémentation du runtime, les fonctions d'assistance, la logique de validation et l'intégration backend seront introduites dans les étapes ultérieures.
# Contrat ConversionResult (blocs de haut niveau)

## Périmètre de cette étape

La sous-étape 1.1.1 a défini les six blocs conceptuels de haut niveau du futur contrat standardisé `ConversionResult`.

La sous-étape 1.1.2 a défini les champs de niveau racine de `ConversionResult` et a mappé chaque champ à son bloc conceptuel.

## Structure de haut niveau

```text
ConversionResult
├── General information
├── Input file
├── Output file
├── Observability
├── Error
└── Technical metadata
```

## Objectifs des blocs

### 1) Informations générales

Objectif : décrire le contexte global et l'identité de la conversion.

### 2) Fichier d'entrée

Objectif : décrire le document source fourni à la conversion pipeline.

### 3) Fichier de sortie

Objectif : décrire le document de sortie généré.

### 4) Observabilité

Objectif : décrire les journaux et les avertissements qui aident à comprendre ce qui s'est passé pendant la conversion.

### 5) Erreur

Objectif : décrire le bloc d'échec standardisé utilisé lorsqu'une conversion échoue.

### 6) Métadonnées techniques

Objectif : stocker des informations techniques non essentielles pour une extensibilité future sans polluer la structure principale.

## Champs au niveau racine

| Champ | Objectif | Bloc conceptuel |
|---|---|---|
| `success` | Statut de conversion global. | Informations générales |
| `conversionId` | Identifiant de conversion unique. | Informations générales |
| `converter` | Convertisseur principal utilisé pour l'exécution. | Informations générales |
| `pipeline` | Liste ordonnée des étapes du pipeline impliquées dans la conversion. | Informations générales |
| `inputFormat` | Format source déclaré pour la conversion. | Informations générales |
| `outputFormat` | Format cible déclaré pour la conversion. | Informations générales |
| `inputFile` | Bloc d'informations du fichier d'entrée imbriqué (détails définis ultérieurement). | Fichier d'entrée |
| `outputFile` | Bloc d'informations sur le fichier de sortie imbriqué (détails définis ultérieurement). | Fichier de sortie |
| `durationMs` | Durée totale d'exécution en millisecondes. | Informations générales |
| `startedAt` | Horodatage de début de conversion. | Informations générales |
| `finishedAt` | Horodatage de fin de conversion. | Informations générales |
| `warnings` | Collection d'avertissements non bloquants générés lors de l'exécution. | Observabilité |
| `logs` | Collecte des journaux d'exécution (structure définie ultérieurement). | Observabilité |
| `error` | Bloc d'échec standardisé utilisé en cas d'échec de la conversion (détails définis ultérieurement). | Erreur |
| `meta` | Bloc de métadonnées techniques extensible pour les informations non essentielles. | Métadonnées techniques |

## Structures d'objets imbriqués

Les sous-étapes 1.1.1 et 1.1.2 ont déjà défini les blocs conceptuels et les champs de niveau racine.  
Cette section définit la structure interne des principaux objets imbriqués référencés par `ConversionResult`.

### `inputFile`

Objectif : décrire le fichier source capturé par le pipeline de conversion.

Champs internes :

- `originalName` : nom de fichier d'origine fourni par l'appelant ou le contexte source.
- `storedPath` : chemin interne utilisé par le pipeline pour le fichier d'entrée stocké.
- `size` : métadonnées de taille du fichier d'entrée.
- `mimeType` : type MIME détecté ou déclaré pour l'entrée. file.

### `outputFile`

Objectif : décrire le fichier généré par le pipeline de conversion.

Champs internes :

- `path` : chemin interne du fichier de sortie généré.
- `size` : taille du fichier de sortie. métadonnées.
- `mimeType` : type MIME associé à la sortie produite.

### `error`

Objectif : fournir une structure de défaillance standardisée lorsque la conversion échoue.

Champs internes :

- `code` : identifiant d'erreur normalisé pour la classification.
- `message` : message d'erreur lisible par l'homme pour le diagnostic.
- `details` : informations contextuelles supplémentaires sur l'échec.
- `recoverable` : indicateur indiquant si une nouvelle tentative/récupération est conceptuellement possible.

### `logs`

Objectif : capturer les entrées de trace d'exécution pour l'observabilité.

Structure : collecte de journaux entrées.

Chaque entrée de journal contient :

- `level` : niveau de gravité du journal.
- `message` : contenu du message de journal.
- `timestamp` : marqueur temporel pour l'entrée de journal.

## Types de champs

Sous-étapes précédentes déjà définies :

- blocs conceptuels (`1.1.1`)
- champs de niveau racine (`1.1.2`)
- structures d'objets imbriquées (`1.1.3`)

Cette section définit le type de données exact pour chaque documenté champ.

### Champs et types au niveau racine

| Champ | Type |
|---|---|
| `success` | `boolean` |
| `conversionId` | `string` |
| `converter` | `string` |
| `pipeline` | `string[]` |
| `inputFormat` | `string` |
| `outputFormat` | `string` |
| `inputFile` | `object` |
| `outputFile` | `object` |
| `durationMs` | `number` |
| `startedAt` | `string` |
| `finishedAt` | `string` |
| `warnings` | `string[]` |
| `logs` | `object[]` |
| `error` | `object` |
| `meta` | `object` |

### Champs et types imbriqués

#### `inputFile`

| Champ | Type |
|---|---|
| `originalName` | `string` |
| `storedPath` | `string` |
| `size` | `number` |
| `mimeType` | `string` |

#### `outputFile`

| Champ | Type |
|---|---|
| `path` | `string` |
| `size` | `number` |
| `mimeType` | `string` |

#### `error`

| Champ | Type |
|---|---|
| `code` | `string` |
| `message` | `string` |
| `details` | `string` |
| `recoverable` | `boolean` |

#### entrée `logs`

| Champ | Type |
|---|---|
| `level` | `string` |
| `message` | `string` |
| `timestamp` | `string` |

## Reporté aux sous-étapes ultérieures

- Les restrictions de valeurs autorisées seront définies ultérieurement.
- L'implémentation du runtime sera effectuée ultérieurement.

## Règles de nullabilité

Les sous-étapes précédentes déjà défini :

- blocs conceptuels (`1.1.1`)
- champs de niveau racine (`1.1.2`)
- structures d'objets imbriquées (`1.1.3`)
- types de champs (`1.1.4`)

Cette section définit la nullité pour le niveau racine et les imbriqués champs.

### Nullabilité au niveau racine

#### Champs non nuls au niveau racine

- `success`
- `conversionId`
- `converter`
- `pipeline`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `durationMs`
- `startedAt`
- `finishedAt`
- `warnings`
- `logs`
- `meta`

#### Champs de niveau racine nullables

- `outputFile`
- `error`

### Nullabilité imbriquée

#### `inputFile`

- `originalName` : non nul
- `storedPath` : non nul
- `size` : non nul
- `mimeType` : nullable

#### `outputFile` (lorsque `outputFile` existe)

- `path` : non nul
- `size` : non nul
- `mimeType` : nullable

#### `error` (lorsque `error` existe)

- `code` : non nul
- `message` : non nul
- `details` : nullable
- `recoverable` : non nul

#### entrée `logs`

- `level` : non nul
- `message` : non nul
- `timestamp` : non-null

### Structures imbriquées présentes sous condition

- `outputFile` peut être `null` lorsque la conversion échoue.
- `error` peut être `null` lorsque la conversion réussit.

### Notes sémantiques du contrat

- Les collections `pipeline`, `warnings` et `logs` doivent toujours exister, même lorsqu'elles sont vides.
- `meta` doit toujours exister, même lorsqu'elles sont vides.

## Règles de cohérence sémantique

Sous-étapes précédentes déjà définies :

- blocs conceptuels (`1.1.1`)
- champs de niveau racine (`1.1.2`)
- structures d'objets imbriquées (`1.1.3`)
- types de champs (`1.1.4`)
- règles de nullabilité (`1.1.5`)

Cette section définit les règles de cohérence sémantique pour le futur `ConversionResult` contrat.

1. **Cohérence succès / erreur**
 - Si `success` est `true`, `error` doit être `null`.
 - Si `success` est `false`, `error` doit être présent.

2. **Succès / cohérence de sortie**
 - Si `success` est `true`, `outputFile` doit être présent.
 - Si `success` est `false`, `outputFile` peut être `null`.

3. **Les collections doivent toujours exister**
 - `pipeline` doit toujours exister sous forme de tableau.
 - `warnings` doit toujours exister sous forme de tableau.
 - `logs` doit toujours exister sous forme de tableau.
 - Ces collections peuvent être vides, mais elles ne doivent pas être omises.

4. **Les métadonnées doivent toujours exister**
 - `meta` doit toujours exister en tant qu'objet.
 - Il peut être vide, mais il ne doit pas être omis.

5. **Le fichier d'entrée doit toujours exister**
 - `inputFile` doit toujours être présent.
 - Un résultat de conversion sans informations sur le fichier d'entrée n'est pas valide.

6. **Exhaustivité de l'objet d'erreur**
 - Lorsque `error` est présent, il doit inclure tous les champs d'erreur obligatoires définis dans les sous-étapes précédentes.
 - L'objet `error` ne doit pas être partiel ou mal formé.

7. **Exhaustivité du fichier de sortie**
 - Lorsque `outputFile` est présent, il doit inclure tous les champs requis du fichier de sortie définis dans les sous-étapes précédentes.
 - L'objet `outputFile` ne doit pas être partiel ou mal formé.

8. **Exhaustivité de l'entrée du journal**
 - Chaque entrée du journal doit inclure tous les champs de journal requis définis dans les sous-étapes précédentes.
- Une entrée de journal ne doit pas être partielle ou mal formée.

9. **Sémantique du pipeline**
 - `pipeline` représente la liste ordonnée des étapes de conversion utilisées pour l'opération.
 - Même pour une conversion en une seule étape, `pipeline` doit toujours être un tableau.

10. **Cohérence des horodatages et de la durée**
 - `startedAt`, `finishedAt` et `durationMs` doivent toujours décrire la même opération de conversion.
 - `durationMs` doit représenter la durée d'exécution du résultat de conversion rapporté.

## Reporté aux sous-étapes ultérieures

- L'application de l'exécution sera implémentée ultérieurement.
- Les fonctions d'assistance et la logique de validation seront implémentées ultérieurement.
- Cette étape définit les règles contractuelles, pas le comportement d'exécution.

## Spécification des codes d'erreur standardisés

### Objectif

Cette section définit la référence officielle pour la sémantique standardisée des codes d'erreur utilisée par `error.code` dans `ConversionResult`.

### Identificateurs officiels des codes d'erreur

- `INVALID_INPUT`
- `EMPTY_INPUT`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_FORMAT`
- `MIME_MISMATCH`
- `CONVERTER_NOT_FOUND`
- `CONVERSION_FAILED`
- `EMPTY_OUTPUT`
- `OUTPUT_NOT_CREATED`
- `PIPELINE_FAILED`
- `INTERNAL_ERROR`

### Signification des codes d'erreur

| Code d'erreur | Signification |
|---|---|
| `INVALID_INPUT` | À utiliser pour une entrée de conversion généralement invalide ou un contexte de demande mal formé. |
| `EMPTY_INPUT` | À utiliser lorsque le fichier d'entrée existe mais qu'il est vide ou effectivement vide. |
| `FILE_TOO_LARGE` | À utiliser lorsque le fichier d'entrée dépasse la limite de taille autorisée. |
| `UNSUPPORTED_FORMAT` | À utiliser lorsque le format source ou cible n'est pas pris en charge par l'application ou le flux de conversion sélectionné. |
| `MIME_MISMATCH` | À utiliser lorsque le type MIME détecté ne correspond pas au type de fichier attendu ou au format déclaré. |
| `CONVERTER_NOT_FOUND` | À utiliser lorsqu'aucun convertisseur disponible ne peut gérer la conversion demandée. |
| `CONVERSION_FAILED` | À utiliser lorsqu'un convertisseur a été sélectionné et exécuté, mais que le processus de conversion a échoué. |
| `EMPTY_OUTPUT` | À utiliser lorsque la conversion est terminée mais que la sortie produite est vide ou inutilisable. |
| `OUTPUT_NOT_CREATED` | À utiliser lorsque le fichier de sortie attendu n'a pas été créé du tout. |
| `PIPELINE_FAILED` | À utiliser lorsqu'un pipeline en plusieurs étapes échoue à l'une de ses étapes. |
| `INTERNAL_ERROR` | À utiliser en cas de pannes internes inattendues qui ne correspondent pas à un code documenté plus spécifique. |

### Catégories de haut niveau

#### 1) Erreurs de saisie

Objectif : échecs causés par des données d'entrée invalides, vides, surdimensionnées ou incohérentes.

Codes inclus :

- `INVALID_INPUT`
- `EMPTY_INPUT`
- `FILE_TOO_LARGE`
- `MIME_MISMATCH`

#### 2) Erreurs de format et de compatibilité

Objectif : échecs causés par des formats non pris en charge ou une capacité de conversion manquante.

Codes inclus :

- `UNSUPPORTED_FORMAT`
- `CONVERTER_NOT_FOUND`

#### 3) Erreurs d'exécution de la conversion

Objectif : échecs où un convertisseur a été sélectionné et exécuté mais n'a pas produit un résultat de conversion valide.

Codes inclus :

- `CONVERSION_FAILED`
- `EMPTY_OUTPUT`
- `OUTPUT_NOT_CREATED`

#### 4) Erreurs de pipeline

Objectif : échecs dans un pipeline de conversion en plusieurs étapes documenté.

Codes inclus :

- `PIPELINE_FAILED`

#### 5) Erreurs d'application internes

Objectif : pannes internes inattendues qui ne correspondent pas à une catégorie plus spécifique.

Codes inclus :

- `INTERNAL_ERROR`

### Conseils en matière de récupérabilité

Interprétation :

- **Récupérable** : l'échec peut être résolu en modifiant les données d'entrée, les paramètres de requête ou le choix de conversion, sans modification du code backend.
- **Pas immédiatement récupérable** : l'échec indique généralement une fonctionnalité manquante, une panne de moteur/pipeline ou une panne d'application interne.

Probable récupérable :

- `INVALID_INPUT`
- `EMPTY_INPUT`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_FORMAT`
- `MIME_MISMATCH`

Généralement non récupérable immédiatement :

- `CONVERTER_NOT_FOUND`
- `CONVERSION_FAILED`
- `EMPTY_OUTPUT`
- `OUTPUT_NOT_CREATED`
- `PIPELINE_FAILED`
- `INTERNAL_ERROR`

### Règles d'utilisation

1. **Préférez le code documenté le plus spécifique**
 - N'utilisez pas de code générique lorsqu'un code documenté spécifique s'applique.
2. **Réservez `INTERNAL_ERROR` aux défaillances internes inattendues**
 - Ne l'utilisez pas pour des analyses de rentabilisation connues avec des codes documentés spécifiques.
3. **N'utilisez pas `CONVERSION_FAILED` lorsqu'aucun convertisseur n'a été sélectionné**
 - Utilisez `CONVERTER_NOT_FOUND` dans ce cas.
4. **N'utilisez pas `CONVERSION_FAILED` pour les formats non pris en charge**
 - Utilisez `UNSUPPORTED_FORMAT` pour les formats source/cible non pris en charge.
5. **Différencier l'absence de sortie et le vide de sortie**
 - Utilisez `OUTPUT_NOT_CREATED` lorsqu'aucun fichier de sortie n'existe.
 - Utilisez `EMPTY_OUTPUT` lorsque la sortie existe mais est vide ou inutilisable.
6. **Utilisez `PIPELINE_FAILED` uniquement pour les pannes de pipeline en plusieurs étapes**
 - Ne l'utilisez pas pour les pannes de convertisseur en une seule étape, sauf si un contexte de pipeline en plusieurs étapes documenté s'applique.
7. **Utilisez des codes orientés entrée pour les échecs de l'étage d'entrée**
- `INVALID_INPUT`, `EMPTY_INPUT`, `FILE_TOO_LARGE`, `MIME_MISMATCH`.
8. **Utilisez des codes orientés sortie pour les pannes de l'étage de sortie**
 - `OUTPUT_NOT_CREATED`, `EMPTY_OUTPUT`.
9. **Faire correspondre le code à l'étape de défaillance réelle**
 - Étape d'entrée -> codes orientés entrée.
 - Étape de sélection du convertisseur -> codes de format/compatibilité.
 - Étape d'exécution du convertisseur -> codes d'exécution de conversion.
 - Étape d'orchestration en plusieurs étapes -> `PIPELINE_FAILED`.
 - Étape interne inattendue -> `INTERNAL_ERROR`.
10. **Exposer une classification d'erreur principale**
 - Un échec signalé correspond à un `error.code` principal.
 - Un contexte supplémentaire peut être transporté par `error.details` et les journaux.

### Note de base

Il s'agit de la base de référence de la documentation officielle pour la sémantique standardisée des codes d'erreur dans `ConversionResult`.
L'implémentation du runtime, les fonctions d'assistance, les constantes au niveau source et l'intégration backend seront définies ultérieurement.

## Helpers centralisés de construction de résultat (Étape 1.3.1)

L'étape 1.3 démarre la standardisation des fonctions d'assistance centralisées utilisées pour construire `ConversionResult` objets.

### Objectif

Ces assistants existent pour :

- Produire `ConversionResult` objets conformes au contrat documenté.
- Centraliser la logique de construction de résultats répétée.
- Réduire les incohérences structurelles entre les convertisseurs, les wrappers et le code d'orchestration.
- Fournir une manière standardisée de créer des résultats de réussite et d'échec.

### Attendu garanties

Ces assistants sont censés :

- Produire des résultats correspondant à la structure documentée au niveau racine.
- Préserver les règles de cohérence sémantique déjà définies dans le contrat.
- Assurer la présence des collections et des blocs structurels requis.
- Standardiser la création des résultats de réussite et d'échec. chemins.

### Non-objectifs et limites de responsabilité

Ces assistants ne doivent **pas** :

- Choisir quel convertisseur doit être utilisé.
- Effectuer des décisions d'orchestration.
- Remplacer la logique de validation d'entrée.
- Remplacer la logique d'exécution du convertisseur.
- Remplacer le pipeline flux de contrôle.
- Décider des règles métier en dehors de la construction des résultats.
- Implémenter le comportement du frontend.

### Portée d'utilisation prévue

Ces assistants sont destinés à :

- Wrappers de convertisseur.
- Code d'orchestration.
- Chemins de création de résultats backend.
- Gestion standardisée des échecs paths.

### Pourquoi c'est important

La centralisation de la construction `ConversionResult` réduit les variations ad hoc de la forme des résultats et rend le comportement du backend plus prévisible et maintenable.

### Différé dans les sous-étapes ultérieures

- Les signatures des fonctions d'assistance seront définies plus tard.
- Les valeurs par défaut seront définies plus tard.
- L'implémentation du runtime viendra plus tard.

## API `createSuccessResult()` (Étape 1.3.2)

La sous-étape 1.3.2 définit le contrat API du futur `createSuccessResult()` helper.

### Objectif de la fonction

`createSuccessResult()` est l'assistant standardisé destiné à créer `ConversionResult` succès des objets conformes au contrat documenté.

### Charge utile d'entrée attendue

L'assistant est censé recevoir un objet de charge utile contenant :

- `conversionId`
- `converter`
- `pipeline`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `outputFile`
- `startedAt`
- `finishedAt`
- `durationMs`
- `warnings`
- `logs`
- `meta`

### Champ de charge utile significations

| Champ | Signification |
|---|---|
| `conversionId` | Identifiant unique de l'opération de conversion. |
| `converter` | Convertisseur principal utilisé pour une conversion réussie. |
| `pipeline` | Liste ordonnée des étapes de conversion utilisées. |
| `inputFormat` | Format source de la conversion. |
| `outputFormat` | Format cible de la conversion. |
| `inputFile` | Informations structurées sur le fichier d’entrée. |
| `outputFile` | Informations sur le fichier de sortie structuré. |
| `startedAt` | Horodatage de début de conversion. |
| `finishedAt` | Horodatage de fin de conversion. |
| `durationMs` | Durée de conversion en millisecondes. |
| `warnings` | Collecte d'avertissements non bloquants. |
| `logs` | Collecte des journaux d'exécution. |
| `meta` | Objet de métadonnées techniques extensibles. |

### Intention de sortie attendue

L'assistant est destiné à renvoyer un `ConversionResult` conforme au contrat avec :

- `success: true`
- `error: null`

### Portée note

Cette sous-étape définit uniquement le contrat de l'API d'assistance, pas les détails d'implémentation de l'exécution.

### Différé dans les sous-étapes ultérieures

- Les valeurs par défaut seront documentées ultérieurement.
- L'API `createFailureResult()` sera documentée ultérieurement.
- L'implémentation du runtime viendra plus tard.

## API `createFailureResult()` (Étape 1.3.3)

La sous-étape 1.3.3 définit le contrat API du futur `createFailureResult()` helper.

### Objectif de la fonction

`createFailureResult()` est l'assistant standardisé destiné à construire des `ConversionResult` objets défaillants conformes aux documents documentés. contrat.

### Charge utile d'entrée attendue

L'assistant devrait recevoir un objet de charge utile contenant :

- `conversionId`
- `converter`
- `pipeline`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `startedAt`
- `finishedAt`
- `durationMs`
- `error`
- `outputFile`
- `warnings`
- `logs`
- `meta`

### Signification des champs de charge utile

| Champ | Signification |
|---|---|
| `conversionId` | Identifiant unique de l'opération de conversion. |
| `converter` | Convertisseur principal impliqué dans le chemin de conversion ayant échoué, le cas échéant. |
| `pipeline` | Liste ordonnée des étapes de conversion impliquées dans l'opération ayant échoué. |
| `inputFormat` | Format source de la tentative de conversion. |
| `outputFormat` | Format cible de la tentative de conversion. |
| `inputFile` | Informations structurées sur le fichier d’entrée. |
| `startedAt` | Horodatage de début de conversion. |
| `finishedAt` | Horodatage de fin de conversion. |
| `durationMs` | Durée de conversion en millisecondes. |
| `error` | Objet d'erreur structuré décrivant la défaillance principale. |
| `outputFile` | Informations facultatives sur le fichier de sortie structuré lorsqu’il existe un artefact de sortie partiel ou inutilisable. |
| `warnings` | Collecte d'avertissements non bloquants. |
| `logs` | Collecte des journaux d'exécution. |
| `meta` | Objet de métadonnées techniques extensibles. |

### Intention de sortie attendue

L'assistant est destiné à renvoyer un `ConversionResult` conforme au contrat avec :

- `success: false`
- un `error` non nul
- `outputFile` généralement `null` lorsqu'aucun résultat valide n'a été produit

### Note de portée

Cette sous-étape définit uniquement le contrat de l'API d'assistance, pas les détails d'implémentation de l'exécution.

### Différé dans les sous-étapes ultérieures

- L'implémentation de l'exécution viendra plus tard.

## Valeurs par défaut des helpers (Étape 1.3.4)

Sous-étape 1.3.4 définit les valeurs par défaut pour les fonctions d'assistance centralisées `ConversionResult`.

### Objectif des valeurs par défaut

Les valeurs par défaut existent pour :

- Réduire les passe-partout répétitifs dans la construction des résultats.
- Garantir la cohérence structurelle.
- S'assurer que les tableaux et les conteneurs de métadonnées sont toujours présent.
- Évitez les résultats partiels mal formés causés par des conteneurs facultatifs omis.

### `createSuccessResult()` par défaut

- `success` est toujours `true`.
- `error` par défaut `null`.
- `warnings` est par défaut `[]`.
- `logs` est par défaut `[]`.
- `meta` est par défaut `{}`.
- `pipeline` peut être par défaut `[]` s'il est omis.

Aucune solution de repli implicite ne doit inventer des entrées métier requises manquantes telles que :

- `conversionId`
- `converter`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `outputFile`

### `createFailureResult()` valeurs par défaut

- `success` est toujours `false`.
- `outputFile` par défaut est `null`.
- `warnings` par défaut est `[]`.
- `logs` est par défaut `[]`.
- `meta` est par défaut `{}`.
- `pipeline` peut être par défaut `[]` s'il est omis.

Aucune solution de secours implicite ne doit inventer des entrées métier requises manquantes telles que :

- `conversionId`
- `inputFormat`
- `outputFormat`
- `inputFile`
- `error`

### Limite du comportement par défaut

Les valeurs par défaut sont uniquement des commodités structurelles. Ils ne doivent pas remplacer silencieusement les entrées métier requises.

### Note de portée

Cette sous-étape définit uniquement la valeur par défaut du contrat, pas les détails de mise en œuvre de l'exécution.

### Différée dans les sous-étapes ultérieures

- La mise en œuvre viendra plus tard.
- L'application de l'exécution est ne fait pas partie de cette sous-étape.

## Garanties minimales des helpers (Étape 1.3.5)

La sous-étape 1.3.5 définit les garanties minimales attendues des helpers de résultats centralisés.

### Pourquoi les garanties sont importantes

Ces garanties rendent la construction des résultats backend prévisible, réduisez les formes de résultats ad hoc et améliorez la maintenabilité.

### Structure et exhaustivité garanties

1. **Garantie de forme de contrat**
 - Les assistants doivent toujours renvoyer un objet correspondant à la structure documentée au niveau racine `ConversionResult`.

2. **Garantie d'exhaustivité structurelle**
 - Les assistants doivent toujours inclure les champs structurels requis du contrat, même lorsque des valeurs par défaut documentées sont utilisées pour les conteneurs facultatifs.

### Collections garanties et présence de métadonnées

3. **Garantie de présence de collection**
 - `pipeline` est toujours renvoyé sous forme de tableau.
 - `warnings` est toujours renvoyé sous forme de tableau.
 - `logs` est toujours renvoyé sous forme de tableau.
 - Ces collections peuvent être vides, mais ne doivent pas être omises.

4. **Garantie de présence des métadonnées**
 - `meta` est toujours renvoyé sous forme d'objet.
 - Il peut être vide, mais ne doit pas être omis.

### Sémantique de succès/échec garantie

5. **Garantie sémantique de succès/échec**
 - `createSuccessResult()` doit toujours renvoyer `success: true` et `error: null`.
 - `createFailureResult()` doit toujours renvoyer `success: false`.
- `createFailureResult()` doit toujours conserver un objet `error` primaire non nul.

6. **Garantie de gestion des sorties**
 - `createSuccessResult()` doit renvoyer un résultat en forme de succès destiné à des données de sortie valides.
 - `createFailureResult()` doit par défaut `outputFile` être `null` lorsqu'aucun artefact de sortie utilisable n'est disponible.

### Limite et non-invention garanties

7. ** Limite de non-invention **
 - Les assistants peuvent appliquer des valeurs structurelles par défaut, mais ne doivent pas inventer les données commerciales requises manquantes attendues des appelants.

8. **Garantie de prise en charge de la cohérence**
 - Les assistants sont destinés à réduire les résultats mal formés, incohérents ou partiellement construits sur les chemins backend.

### Ce que les assistants ne garantissent pas

Les assistants ne **ne remplacent **pas** :

- Logique de sélection du convertisseur.
- Orchestration logique.
- Validation métier complète.
- Exactitude de l'exécution du convertisseur.
- Comportement du frontend.

### Note de portée

Cette sous-étape définit uniquement les garanties au niveau du contrat. Les détails de l'implémentation du runtime sont hors de portée.

### Reporté dans les sous-étapes ultérieures

- La mise en œuvre viendra plus tard.
- Le code source de l'assistant ne fait pas partie de cette sous-étape.
- L'intégration backend viendra plus tard.

## Guide d'utilisation des helpers centralisés (Étape 1.3.7)

La sous-étape 1.3.7 clôture l'étape 1.3 avec des conseils d'utilisation pratiques pour les assistants `ConversionResult` centralisés.

### Aides disponibles

- `createSuccessResult(payload)`
- `createFailureResult(payload)`

### Quand utiliser chaque assistant

- Utilisez `createSuccessResult()` lorsque la conversion s'est terminée avec succès et que des informations de sortie valides sont disponibles.
- Utilisez `createFailureResult()` lorsque la conversion a échoué et qu'une erreur structurée principale doit être renvoyée.

### Qui doit les utiliser aides

Ces assistants sont destinés à :

- Wrappers de convertisseur.
- Chemins d'orchestrateur/création de résultats.
- Chemins de gestion des échecs du backend.
- Tout chemin backend qui doit renvoyer un `ConversionResult` standardisé.

### Appelant responsabilités

Les appelants doivent fournir des données commerciales/contextuelles réelles requises par le contrat, en particulier :

- Identité et contexte de conversion.
- Contexte du convertisseur ou du pipeline.
- Informations sur le fichier d'entrée.
- Informations sur le fichier de sortie pour les chemins de réussite.
- Informations d'erreur structurées en cas d'échec. chemins.

### Responsabilités des assistants

Les assistants centralisent :

- Construction en forme de contrat.
- Cohérence structurelle succès/échec.
- Tableaux par défaut et conteneurs de métadonnées.
- Assemblage de résultats standardisé.

### Anti-modèles à éviter

Les appelants ne doivent pas :

- Reconstruire manuellement les objets de résultat ad hoc lorsque des assistants sont disponibles.
- Utiliser `createSuccessResult()` pour les flux d'échec.
- Utiliser `createFailureResult()` sans objet d'erreur principal.
- S'appuyer sur des assistants pour remplacer la logique d'orchestration ou de sélection de convertisseur.
- Comptez sur des assistants pour inventer les données commerciales manquantes.

### Pourquoi cette règle d'utilisation est importante

L'utilisation standard des assistants réduit les incohérences, les doublons et les réponses backend mal formées.

### Clôture note

- L'intégration du convertisseur aura lieu plus tard.
- L'intégration de l'orchestrateur aura lieu plus tard.
- Ce guide d'utilisation est le pont opérationnel entre le contrat documenté et l'adoption future du backend.

## Sélection de la première cible de migration (Étape 1.4.1)

L'étape 1.4 commence la véritable adoption du backend de `ConversionResult` helpers centralisés dans les chemins de conversion existants.

### Première cible officiellement sélectionnée

**AsciiDoc -> Markdown via `adoc-to-md.converter.js` (`run()` path).**

### Pourquoi cette cible a été sélectionnée

- C'est un chemin de production déjà fonctionnel.
- Le flux est relativement compréhensible (validation des entrées, tentative de conversion, repli, écriture de sortie, retours de réussite/échec explicites).
- Il expose des branches de réussite et d'échec claires qui correspondent bien à l'utilisation de l'assistant.
- Il est représentatif du comportement de conversion réel (y compris les contrôles de sortie et la propagation des erreurs).

### Pourquoi il s'agit d'une première migration à faible risque et de grande valeur

- Faible risque : la migration peut être étendue à un module sans Refactor à l'échelle de l'orchestrateur.
- Valeur élevée : remplace de nombreux objets de retour ad hoc dans un chemin de conversion réel central.
- Résultat réutilisable : les modèles établis ici peuvent être appliqués à d'autres convertisseurs et chemins de pipeline.

### Note de portée

- Un mappage détaillé du flux vers l'assistant sera défini dans la sous-étape `1.4.2`.
- Aucun refactor d'exécution n'est effectué dans cette sous-étape.

## Cartographie du flux d'exécution actuel (Étape 1.4.2)

La sous-étape 1.4.2 cartographie le comportement d'exécution actuel de la cible sélectionnée avant l'intégration de l'assistant.

### Chemin sélectionné

**AsciiDoc -> Markdown via `adoc-to-md.converter.js` (`run()` chemin).**

### Flux actuel (tel qu'implémenté)

1. **Chemin d'entrée**
 - `main-orchestrator.execute()` résout le chemin de conversion et délègue à `execution-orchestrator.executeSteps()`.
 - `execution-orchestrator` appelle `executeConversion(inputPath, outputPath, fromFormat, toFormat, options)` dans `converter-orchestrator.module.js`.
 - Pour `asciidoc -> markdown`, le registre du convertisseur se résout en `downdoc` avec `lazy-load` exécution.

2. **Invocation du wrapper**
 - `converter-orchestrator` invoque le module via une exécution de chargement différé, qui appelle `downdocModule.run(inputPath, outputPath, options)`.
 - `downdocModule.run()` reçoit les chemins de fichiers et les options (y compris `conversionId`, mode facultatif).

3. **Gestion des entrées**
 - Le wrapper valide l'existence, la taille et l'extension de l'entrée.
 - Il lit le contenu du fichier d'entrée, supprime `:experimental:` dans l'en-tête et normalise l'entrée AsciiDoc.
 - Les états d'entrée vides/invalides renvoient des objets d'échec précoce.

4. **Exécution de la conversion**
 - La tentative principale utilise `downdoc(...)`.
 - En cas d'échec, elle revient à `convertAsciiDocWithPandoc(...)`.
 - Si les deux échouent, le wrapper renvoie l'échec avec un texte d'erreur composé.

5. **Post-traitement et gestion des artefacts de sortie**
 - Le nettoyage Markdown est appliqué.
 - La sortie est écrite dans `outputPath`, puis vérifiée (existe, vérifications du contenu, intégrité de la syntaxe de base).
 - Les artefacts non valides peuvent déclencher un nettoyage (`unlinkSync`) et un retour d'échec.

6. **Durée et journaux**
 - La durée est mesurée à l'intérieur du wrapper à l'aide de `startTime` et renvoyée sous la forme `duration` (secondes).
 - Les journaux sont accumulés dans un tableau local `logs` sur toutes les branches et renvoyés avec le résultat.

7. **Propagation des résultats**
 - Le wrapper renvoie des résultats sous forme d'objet en cas de succès ou d'échec ; il ne lance pas d'échecs opérationnels normaux.
 - `converter-orchestrator` fusionne les journaux du wrapper et normalise la forme renvoyée en `{ success, logs, error, duration }`.
 - `execution-orchestrator` applique ensuite la validation des artefacts post-wrapper et propage l'échec ou renvoie le succès avec les métadonnées de sortie (`outputFile`, `outputContent`, `stepsExecuted`).

### Forme actuelle du chemin de réussite (niveau de wrapper sélectionné)

`adoc-to-md.converter.js` la branche de réussite renvoie un `ConversionResult` standardisé (construit via `createSuccessResult()`), comprenant :

- `success: true`
- `error: null`
- `outputFile` présent
- `warnings`, `logs`, `pipeline` sous forme de tableaux
- `meta` en tant qu'objet (peut inclure un contexte au niveau du moteur tel que `engineUsed` / `fallbackReason`)

### Forme actuelle du chemin de défaillance (niveau de wrapper sélectionné)

`adoc-to-md.converter.js` les branches de défaillance renvoient un `ConversionResult` standardisé (construit via `createFailureResult()`), comprenant :

- `success: false`
- objet `error` structuré (`code`, `message`, `details`, `recoverable`)
- `outputFile` soit `null` ou structuré lorsqu'un artefact de sortie existe
- `warnings`, `logs`, `pipeline` sous forme de tableaux
- `meta` en tant qu'objet

### Observations pertinentes pour l'intégration

- Le wrapper renvoie des champs racine complets `ConversionResult` en cas de succès et d'échec (assistants centralisés).
- Un ancien champ `duration` (secondes) peut toujours exister pour des raisons de compatibilité ascendante, tandis que le champ du contrat est `durationMs`.
- L'identité du moteur sous-jacent reste traçable via les champs `converter: "downdoc"` et `meta` le cas échéant.

### Note de clôture

Le mappage de la charge utile du flux wrapper/orchestrateur actuel vers les assistants centralisés est documenté dans la sous-étape `1.4.3`.

## Cartographie des payloads pour l'adoption des helpers (Étape 1.4.3)

La sous-étape 1.4.3 définit le mappage des charges utiles pour l'adoption des helper avant l'intégration du runtime.

### Chemin sélectionné

**AsciiDoc -> Markdown via `adoc-to-md.converter.js` (`run()` chemin).**

### Mappage de charge utile réussi (`createSuccessResult(payload)`)

| Champ de charge utile | Source d'exécution actuelle | Note de cartographie |
|---|---|---|
| `conversionId` | `options.conversionId` propagé à travers les couches de l'orchestrateur et les journaux du wrapper | Mappage direct à partir du contexte de conversion. |
| `converter` | Convertisseur sélectionné dans le chemin de registre/d'exécution (`downdoc`) | Mappage direct comme `"downdoc"` pour ce chemin cible. |
| `pipeline` | Liste des étapes du chemin de conversion des orchestrateurs principaux/d'exécution | Dérivez sous forme d'étapes ordonnées (par exemple `["asciidoc->markdown"]`) au moment de l'intégration. |
| `inputFormat` | Format source de l'étape/de la demande (`asciidoc`) | Cartographie directe. |
| `outputFormat` | Format cible étape/requête (`markdown`) | Cartographie directe. |
| `inputFile` | Le chemin du fichier d'entrée existe dans la couche d'exécution (`currentInputFile` / entrée temporaire initiale) | Dérivez un bloc structuré localement à partir du chemin/statistiques du fichier pendant l'intégration. |
| `outputFile` | Disponible dans le résultat de réussite de l'exécution (`finalOutputFile`) | Dérivez le bloc structuré localement à partir du chemin de sortie final/des statistiques/de la dérivation MIME. |
| `startedAt` | Non explicitement conservé en tant que champ renvoyé | Dérivez du contexte de synchronisation local au point d'intégration (à partir de l'horodatage de début). |
| `finishedAt` | Non explicitement conservé en tant que champ renvoyé | Dérivez du contexte de synchronisation local au point d'intégration (horodatage de fin). |
| `durationMs` | Le courant `duration` est renvoyé en secondes | Normalisez en convertissant les secondes en millisecondes pendant l'intégration. |
| `warnings` | Aucune collecte d'avertissements dédiée dans la forme de retour actuelle | Utilisez l'assistant par défaut `[]` à moins que des avertissements capturés localement ne soient disponibles. |
| `logs` | Tableaux de journaux du wrapper et de l'orchestrateur (`logs`) | Mappage direct après la collecte de journaux fusionnés. |
| `meta` | Un contexte d'exécution supplémentaire existe (par exemple, moteur utilisé, raison de secours, nombre d'étapes) | Dérivez localement un objet de métadonnées léger ; par défaut `{}` si aucun. |

### Mappage de la charge utile de défaillance (`createFailureResult(payload)`)

| Champ de charge utile | Source d'exécution actuelle | Note de cartographie |
|---|---|---|
| `conversionId` | `options.conversionId` propagé à travers les couches | Mappage direct à partir du contexte de conversion. |
| `converter` | Convertisseur cible d'exécution (`downdoc`) lorsque la sélection du convertisseur a déjà eu lieu | Carte lorsqu'elle est connue ; peut être omis avant l’étape de sélection et traité comme une absence contextuelle. |
| `pipeline` | Étapes du chemin de conversion (si la résolution du chemin est déjà terminée) | Dériver une liste d'étapes ordonnées lorsqu'elle est disponible ; sinon, l'assistant par défaut `[]`. |
| `inputFormat` | Format source de la requête/étape (`asciidoc`) | Cartographie directe. |
| `outputFormat` | Format cible de la requête/étape (`markdown`) | Cartographie directe. |
| `inputFile` | Chemin temporaire d'entrée et contexte de fichier dans l'orchestrateur/flux d'exécution | Dérivez un bloc structuré localement à partir du chemin d’entrée/des statistiques connus lorsqu’ils sont disponibles. |
| `startedAt` | Non explicitement renvoyé | Dérivé du contexte de synchronisation local au point d'intégration. |
| `finishedAt` | Non explicitement renvoyé | Dérivé du contexte de synchronisation local au point d'intégration. |
| `durationMs` | Courant `duration` en secondes sur les branches défaillantes | Normalisez en millisecondes pendant l'intégration. |
| `error` | Le `error` actuel est basé sur des chaînes dans de nombreuses branches | Dérivez localement un objet d'erreur structuré (code/message/détails/récupérable) pendant l'intégration. |
| `outputFile` | Souvent absent en cas d'échec ; peut exister uniquement dans des scénarios d'artefacts partiels | Bloc de sortie dérivé de la carte lorsqu'un artefact utilisable existe ; sinon, utilisez l'assistant par défaut `null`. |
| `warnings` | Aucune collecte d'avertissements dédiée dans les retours d'échec actuels | Utilisez l'assistant par défaut `[]` sauf si les données d'avertissement sont explicitement disponibles. |
| `logs` | Les tableaux de journaux fusionnés actuels en cas d'échec renvoient | Cartographie directe. |
| `meta` | Des données contextuelles facultatives peuvent exister par étape (pipelineState, informations sur l'étape, contexte du moteur) | Dériver localement lorsque disponible ; sinon, l'assistant par défaut `{}`. |

### Observations pertinentes pour l'intégration

- `conversionId`, les formats et les journaux sont déjà disponibles dans le flux actuel et sont directement cartographiés.
- `duration` existe mais nécessite une normalisation d'unité (`seconds -> milliseconds`).
- `startedAt` et `finishedAt` ne sont actuellement pas transportés dans les objets de retour et doivent être dérivés aux points d'intégration.
- `inputFile`, `outputFile` et structuré `error` nécessitent une dérivation locale à partir du contexte de fichier/d'exécution existant.
- `warnings` n'est pas un champ de première classe dans les retours actuels et doit utiliser les valeurs d'assistance par défaut à moins qu'une capture d'avertissement explicite ne soit introduite. localement.

### Note de clôture

L'intégration d'exécution des chemins de réussite et d'échec a été implémentée sur le premier chemin de conversion migré et vérifiée via des scripts backend ciblés.

## Modèle de migration de l'étape 1.4 (validé le `downdoc`)

L'étape 1.4 a validé le premier véritable modèle d'adoption pour les assistants `ConversionResult` centralisés utilisant la conversion `downdoc` path.

### Séquence de migration réutilisable

- Sélectionnez un chemin de conversion stable et actuellement fonctionnel.
- Mappez son flux d'exécution actuel de bout en bout (points d'entrée, entrées, sorties, journaux, synchronisation, propagation des erreurs).
- Mappez les données d'exécution actuelles aux champs de charge utile d'assistance (succès et échec) avant de modifier le runtime. code.
- Intégrer `createSuccessResult()` sur le chemin de réussite (changement local minimal).
- Intégrer `createFailureResult()` sur le chemin d'échec (changement minimal et local).
- Harmoniser les lancers bruts restants et les chemins d'évacuation d'échec internes secondaires afin qu'ils ne contournent pas le contrat standardisé.
- Vérifier le comportement de réussite et d'échec avec une approche ciblée. scripts.
- Élargir la couverture du scénario de base avec un petit ensemble représentatif de cas de réussite/échec.

### Pourquoi `downdoc` était une bonne première cible

- Déjà fonctionnel et exercé dans des conversions réelles.
- Portée limitée (chemin d'emballage unique) avec succès/échec clair. branchement.
- Représentant du comportement de conversion réel (vérifications d'artefacts de sortie, comportement de repli, journalisation structurée).
- Faible risque de migration par rapport aux refactors à l'échelle de l'orchestration.

### Leçons pratiques apprises

- Migrez un chemin à la fois et conservez la différence locale au module sélectionné.
- Vérifiez d'abord le chemin de réussite, puis intégrez et validez le chemin d'échec.
- Préservez la logique de conversion existante et remplacez uniquement la construction des résultats.
- Gardez l'intégration de l'aide minimale ; éviter le nettoyage du backend sans rapport lors des premières migrations.
- Conserver de petits scripts de vérification comme contrôles de régression pour la forme et la sortie fonctionnelle.

### Conseils pour les futures migrations de convertisseur

- Commencez avec un seul chemin de convertisseur/wrapper, pas une couche d'orchestration entière.
- Documentez d'abord le flux d'exécution ; ne devinez pas.
- Définissez les mappages de charge utile avant de modifier le code.
- Gardez l'intégration limitée à la construction des résultats de réussite/échec et à la dérivation locale des champs manquants.
- Vérifiez les résultats de réussite et d'échec par rapport au contrat standardisé avant de continuer.

### Note de clôture

- `downdoc` sert désormais de première référence de migration pour l'adoption de l'assistant.
- Les futures migrations de convertisseurs devraient suivre le même modèle, le cas échéant.
- Un alignement plus large de l'orchestrateur appartient aux étapes ultérieures.

## Definition of Done de l'étape 1 (Release 0.0.1.4.6)

L'étape 1 est considérée comme terminée uniquement lorsque toutes les conditions suivantes sont vraies :

- Le contrat `ConversionResult` est documenté.
- Les structures imbriquées sont documentées (entrées `inputFile`, `outputFile`, `error`, `logs`).
- Les types de champs, les règles de nullabilité et les règles de cohérence sémantique sont documentées.
- Les codes d'erreur standardisés sont documentés, notamment :
 - identifiants
 - significations
 - catégories
 - conseils de récupération
 - règles d'utilisation
- Des assistants backend centralisés existent pour la création de résultats standardisés :
 - `createSuccessResult(payload)`
 - `createFailureResult(payload)`
- Une documentation d'aide existe et est cohérente, notamment :
 - limites de rôle et de responsabilité
 - API (attentes de charge utile et intention de sortie)
 - valeurs structurelles par défaut
 - garanties minimales
 - conseils d'utilisation
- Un véritable chemin de conversion a été migré vers les assistants :
 - `api/backend/services/modules/adoc-to-md.converter.js`
- Le chemin de conversion migré utilise `createSuccessResult()` en cas de succès.
- Le chemin du convertisseur migré utilise `createFailureResult()` en cas d'échec.
- Le chemin du convertisseur migré a un comportement de réussite standardisé (forme de réussite conforme au contrat).
- Le chemin du convertisseur migré a un comportement d'échec standardisé (forme d'échec conforme au contrat avec `error` structuré).
- La gestion des erreurs internes a été harmonisée sur le chemin migré afin que les sorties brutes basées sur le lancement évitables ne contournent pas le contrat standardisé.
- La dénomination du chemin migré est orientée vers le haut au niveau du fichier architectural (nom de fichier basé sur le rôle).
- La propagation du renommage est propre et aucune référence de fichier architectural obsolète ne subsiste.
- Le flux d'entrée réel du backend préserve le résultat standardisé pour le chemin migré (aucune couche intermédiaire ne reconstruit les formes de résultats ad hoc héritées).
- Les scripts de vérification ciblés réussissent pour :
 - résultat de réussite shape
 - forme du résultat de l'échec
 - couverture du scénario de référence

### L'étape 1 ne nécessite pas

- Migration de tous les convertisseurs/wrappers.
- Standardisation complète à l'échelle de l'orchestrateur.
- Modifications de l'UX frontend ou refonte de la forme de réponse au niveau de l'itinéraire. 
- Refactorisation large du pipeline au-delà du premier chemin migré.

### Pourquoi cette définition de Terminé est importante

- Elle marque la transition de la conception du contrat à une première adoption réelle validée dans le code backend.
- Elle évite toute ambiguïté sur la fermeture de l'étape 1.
- Elle établit une base de référence propre pour la prochaine step.

## Clôture de l'étape 1 (Release 0.0.1.4.6)

### A) Ce que l'étape 1 a réalisé

Étape 1 établie avec succès :

- Le contrat `ConversionResult` documenté (structure, objets imbriqués, types, nullabilité, règles de cohérence sémantique).
- Le modèle de code d'erreur standardisé documenté (identifiants, significations, catégories, conseils de récupération, règles d'utilisation).
- Assistants de résultats backend centralisés pour la création standardisée de résultats de réussite et d'échec.
- Une première migration d'exécution réelle d'un chemin de convertisseur à l'aide des assistants centralisés.
- Un modèle de migration validé qui peut être réutilisé pour une adoption future du convertisseur.

### B) Adoption concrète de l'exécution réalisée

- Le chemin AsciiDoc -> Markdown est le premier chemin d'exécution migré :
 - `api/backend/services/modules/adoc-to-md.converter.js`
- Le succès utilise `createSuccessResult(payload)`.
- L'échec utilise `createFailureResult(payload)`.
- Le chemin migré est vérifié via des scripts ciblés et de véritables contrôles de flux backend (vérification au niveau du module et du chemin d'entrée backend).

### C) Ce que l'étape 1 fournit désormais au projet

- Une base de contrat stable pour des résultats de conversion standardisés.
- Un modèle de résultat de réussite/échec standardisé soutenu par des assistants centralisés.
- Une première référence de migration validée pour les migrations ultérieures du convertisseur.
- Une base plus propre pour le travail d'alignement incrémentiel du backend.

### D) Ce qui reste explicitement en dehors de l'étape 1

La fermeture de l'étape 1 ne signifie pas que :

- Tous les convertisseurs sont migrés.
- L'orchestrateur complet est déjà standardisé de bout en bout.
- Le travail UX frontend est déjà effectué.
- La refactorisation plus large du pipeline est terminée.

### E) Transition note

Les prochains travaux devraient s'appuyer sur la base de référence de l'étape 1 (contrat + assistants + première référence de migration) plutôt que de rouvrir les questions de conception du contrat ou de première migration.

## Préparation de l'étape 2 (Release 0.0.1.4.6)

### Étape 2.1.1 — Points d'entrée plausibles du backend pour le véritable flux AsciiDoc -> Markdown

L'étape 2 commence par identifier les points d'entrée backend et les couches d'orchestration qui sont réellement impliqués dans le chemin AsciiDoc -> Markdown déjà migré, avant de sélectionner la cible d'alignement exacte de l'étape 2.

Les composants suivants sont vraisemblablement impliqués dans le flux réel (en fonction du câblage et des appels actuels du backend sites):

- **`api/backend/app.js`** : entrée d'application express où `/api` le middleware et les piles de routes sont montés.
- **`api/backend/routes/conversion.routes.js`** : entrée de route pour `POST /api/to-markdown` (AsciiDoc direct -> endpoint Markdown) qui écrit les fichiers temporaires et les envoie au `downdoc` chargé paresseux module.
- **`api/backend/routes/api.routes.js`** : entrée de route pour `POST /api/convert` (endpoint de conversion générique protégé par un jeton de confirmation) qui appelle `secureConvertWithToken(...)`.
- **`api/backend/middleware/security/validate.middleware.js`** : validation de demande basée sur Zod utilisée par les gestionnaires de route avant l'exécution de la conversion.
- **`api/backend/services/conversion/secure-converter.js`** : service de conversion sécurisé :
 - `secureConvertWithToken(...)` valide et consomme le token de confirmation, puis délègue à `secureConvert(...)`.
- `secureConvert(...)` gère l'isolation + la création de fichiers et (pour `asciidoc -> markdown`) les envois vers le convertisseur `downdoc` chargé paresseux.
- **`api/backend/services/modules/lazyload.module.js`** : Couche de répartition à chargement différé :
 - possède le mappage `AVAILABLE_MODULES` (`downdoc` -> `adoc-to-md.converter.js`)
 - charge le module à la demande et appelle `moduleInstance.run(...)`
 - préserve un `ConversionResult` complet si le module en renvoie déjà un.
- **`api/backend/services/modules/adoc-to-md.converter.js`** : Le module de conversion migré (AsciiDoc -> Markdown) renvoyant un `ConversionResult` standardisé via des assistants centralisés.

La cible exacte de l'alignement de l'étape 2 sera sélectionné à la sous-étape 2.1.2 sur la base de ce mappage de point d'entrée concret.

### Étape 2.1.2 — Point d'entrée principal du backend/orchestrateur (AsciiDoc -> Markdown)

La sous-étape 2.1.2 identifie le point d'entrée principal unique du backend/orchestrateur sur lequel concentrer le travail d'alignement de l'étape 2 pour l'AsciiDoc migré -> Flux de démarque.

**Point d'entrée principal sélectionné :** `api/backend/services/modules/lazyload.module.js`

**Pourquoi il s'agit du point d'entrée principal (fondé) :**

- C'est la **couche de répartition partagée** qui charge et invoque finalement le convertisseur migré via `runConverter('downdoc', ...)` / `runModule(...)`.
- Il s'agit du **premier composant de coordination backend au-dessus du convertisseur** qui peut encore **préserver, enrichir ou remodeler accidentellement** l'objet renvoyé par le convertisseur.
- Il contient déjà la décision sensible au contrat : **conserver un `ConversionResult`** complet lorsque le module en renvoie un (au lieu de reconstruire un `{ success, logs, error, duration }` hérité). forme).

**Primaire vs secondaire (dans le flux réel actuel) :**

- **Primaire** : `lazyload.module.js` (envoi du convertisseur + limite où la forme du résultat est médiée)
- **Secondaire (appelants / couches environnantes)** :
- `api/backend/routes/conversion.routes.js` (endpoint HTTP direct `POST /api/to-markdown` qui écrit des fichiers temporaires et appelle le répartiteur)
 - `api/backend/services/conversion/secure-converter.js` (service de conversion sécurisé qui distribue également au même chargeur paresseux pour `asciidoc -> markdown`)
 - `api/backend/routes/api.routes.js` (route de conversion générique protégée par jeton qui appelle `secureConvertWithToken(...)`)
 - `api/backend/middleware/security/validate.middleware.js` (demander la validation avant d'invoquer la conversion)
 - `api/backend/services/modules/adoc-to-md.converter.js` (l'implémentation du convertisseur migré lui-même)

L'objectif d'alignement officiel de l'étape 2 sera confirmé à la sous-étape 2.1.3.

### Étape 2.1.3 — Cible d'alignement confirmée de l'étape 2

La sous-étape 2.1.3 confirme formellement le composant backend sur lequel l'étape 2 se concentrera pour l'alignement au niveau de l'orchestrateur du flux AsciiDoc -> Markdown déjà migré.

**Cible d'alignement confirmée de l'étape 2 :** `api/backend/services/modules/lazyload.module.js`

**Pourquoi c'est la bonne étape 2 focus :**

- Il s'agit de la limite de coordination centrale où le convertisseur migré est distribué et où le résultat renvoyé peut être préservé ou remodelé.
- C'est l'endroit le plus direct au-dessus du convertisseur migré où la propagation standardisée `ConversionResult` peut être appliquée de manière cohérente pour les chemins de réussite et d'échec.
- Il empêche la régression vers les formats de résultats ad hoc existants lorsque les modules évoluent à des adoptions différentes. vitesses.

**Ce que l'étape 2 s'alignera à ce niveau (intention) :**

- Propagation standardisée des succès (préserver le contrat complet lorsqu'il est disponible).
- Propagation standardisée des échecs (éviter les reconstructions partielles/héritées qui suppriment les champs du contrat).
- Éviter la refonte ad hoc des résultats à travers les chemins de répartition.
- Gestion plus sûre des erreurs internes au niveau de la couche de répartition/coordination afin que les erreurs inattendues ne contournent pas le modèle de résultat standardisé.

Le mappage détaillé des flux de ce composant et de ses interactions commencera à la sous-étape 2.2.1.

### Étape 2.2.2 — Cartographie des flux backend orientés panne (AsciiDoc -> Markdown)

La sous-étape 2.2.2 mappe le flux backend orienté échec pour le chemin **AsciiDoc -> Markdown** déjà migré, en particulier via la cible d'alignement confirmée de l'étape 2.

- **Chemin migré** : AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Cible d'alignement confirmée de l'étape 2** : `api/backend/services/modules/lazyload.module.js`

#### Flux orienté échec (de bout en bout, fondé)

1. **Point d'entrée backend entrant (l'un des vrais appelants)** :
 - `POST /api/to-markdown` (`api/backend/routes/conversion.routes.js`) appelle `runConverter('downdoc', inputFile, outputFile, { conversionId, mode })`, **ou**
 - `POST /api/convert` (`api/backend/routes/api.routes.js`) appelle `secureConvertWithToken(...)` → `secureConvert(...)` (`api/backend/services/conversion/secure-converter.js`), qui appelle ensuite `runConverter('downdoc', inputFile, outputFile, { conversionId, mode })` pour `asciidoc -> markdown`.
2. **Limite de répartiteur / coordination** :
 - `runConverter(...)` délègue à `LazyLoadManager.runModule(...)` en `api/backend/services/modules/lazyload.module.js`.
3. **Lazy-load + résolution de registre** (à l'intérieur de `lazyload.module.js`) :
 - valide les chemins d'entrée/sortie (chemins absolus, l'entrée existe, le répertoire de sortie existe)
 - charge le module enregistré `downdoc` à partir du mappage `AVAILABLE_MODULES` (`downdoc` → `adoc-to-md.converter.js`)
 - invoque `moduleInstance.run(inputPath, outputPath, options)`.
4. **Invocation du convertisseur et création d'échec (premier résultat d'échec standardisé)** :
 - `api/backend/services/modules/adoc-to-md.converter.js` détecte une condition d'échec (par exemple, échec de validation d'entrée, entrée vide, panne de moteur, erreur inattendue).
 - Il crée un échec standardisé `ConversionResult` via `createDowndocFailure(...)`, qui appelle en interne **`createFailureResult(payload)`** (assistant centralisé) et renvoie le objet conforme au contrat.
5. **Propagation des échecs via la cible d'alignement** :
 - `lazyload.module.js` reçoit l'échec du module `ConversionResult`.
 - Il fusionne les journaux et **préserve la forme complète `ConversionResult`** (au lieu de reconstruire un objet hérité `{ success, logs, error, duration }`), tout en garantissant qu'un champ hérité `duration` (secondes) existe pour le retour en arrière compatibilité.
6. **Chemin de retour final de l'échec au niveau du backend (dépendant de l'appelant)** :
 - Dans `conversion.routes.js` (`POST /api/to-markdown`), le gestionnaire vérifie `if (!result.success)` et renvoie `500` avec un corps JSON hérité (actuellement `detail: "Conversion error: ..."`).
 - Dans `secure-converter.js`, le gestionnaire lance un `ConversionError('CONVERSION_FAILED', ...)` lorsque `result.success` est faux, qui est ensuite traduit en réponse d'erreur HTTP par sa couche route/contrôleur.

#### Où l'échec standardisé `ConversionResult` est créé pour la première fois

- **Première création en** : `api/backend/services/modules/adoc-to-md.converter.js`
- **Mécanisme** : `createDowndocFailure(...)` → `createFailureResult(payload)`

#### Comment le résultat d'échec standardisé se propage vers le haut

- `adoc-to-md.converter.js` renvoie un échec complet `ConversionResult` à `lazyload.module.js`.
- `lazyload.module.js` le préserve et le renvoie à son appelant (`conversion.routes.js` ou `secure-converter.js`).
- Les couches supérieures peuvent toujours choisir de **envelopper ou traduire** l'erreur dans des formes de réponse HTTP spécifiques à la route.

#### Observation fondée (points potentiels de remodelage/mauvaise gestion)

- Échecs qui se produisent **à l'intérieur de `lazyload.module.js` avant le module l'invocation** (échec de validation de chemin, échec de chargement de module, incompatibilité d'interface, exception interne de chargement paresseux) renvoie actuellement un **objet hérité de type ModuleResult** plutôt qu'un `ConversionResult` complet.
- Certaines routes HTTP **renvoie toujours des corps de réponse hérités** qui n'exposent pas l'objet `ConversionResult` standardisé complet même lorsqu'il existe.

La sous-étape 2.2.3 identifiera les points exacts où le contrat standardisé peut être modifié ou rompu sur cette voie orientée vers l'échec.

### Étape 2.2.3 — Points de risque du contrat (AsciiDoc -> Markdown)

La sous-étape 2.2.3 identifie les points backend exacts dans le flux AsciiDoc -> Markdown déjà mappé où le contrat standardisé `ConversionResult` peut encore être modifié, partiellement reconstruit, supprimé, enveloppé ou contourné.

- **Chemin migré** : AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Cible d'alignement de l'étape 2 confirmée** : `api/backend/services/modules/lazyload.module.js`

#### Points exacts de risque de contrat (fondés)

- **`api/backend/services/modules/lazyload.module.js` — les échecs pré-modules renvoient l'héritage shape**
 - **Pourquoi le risque existe** : les échecs survenant avant `moduleInstance.run(...)` (échec de validation de chemin, échecs de registre/chargement de module, échecs de validation d'interface, exceptions internes de chargement différé) renvoient un objet hérité de style `{ success, logs, error, duration }`.
 - **Type de risque** : remodelage/reconstruction partielle (champs de contrat manquants), enveloppes de succès/échec incohérentes, contournement de l'erreur standardisée codes.

- **`api/backend/services/modules/lazyload.module.js` — branche de secours héritée pour les modules non-ConversionResult**
 - **Pourquoi le risque existe** : lorsqu'un module ne renvoie pas un `ConversionResult` standardisé, lazyload reconstruit intentionnellement la forme du résultat hérité.
 - **Type de risque** : suppression des champs obligatoires (non `conversionId`, `inputFile`, `outputFile`, `meta`, etc.), encapsulation incohérente entre les modules en fonction de l'état d'adoption.

- **`api/backend/routes/conversion.routes.js` (`POST /api/to-markdown`) — remodelage de la réponse au niveau de la route**
 - **Pourquoi le risque existe** : le gestionnaire de route traduit les échecs dans un corps de réponse HTTP existant (par exemple, `status(500).json({ detail: "Conversion error: ..." })`) au lieu de renvoyer/conserver le `ConversionResult` standardisé complet.
 - **Type de risque** : emballage/traduction dans une forme de réponse incompatible ; perte de champs de contrat pour les clients.

- **`api/backend/services/conversion/secure-converter.js` — propagation basée sur le lancement au-dessus des résultats du convertisseur**
 - **Pourquoi le risque existe** : dans la branche `asciidoc -> markdown`, si `runConverter(...)` renvoie `success: false`, le service renvoie un `ConversionError('CONVERSION_FAILED', ...)` plutôt que de renvoyer l'échec `ConversionResult` vers le haut.
 - **Type de risque** : contournement de la propagation standardisée des défaillances via le lancement ; conversion d'une défaillance structurée en un chemin piloté par des exceptions.

- **`api/backend/routes/api.routes.js` (`POST /api/convert`) — enveloppe d'enveloppe autour du résultat de la conversion**
 - **Pourquoi le risque existe** : ce endpoint renvoie `{ success: true, result: <conversion output>, format }` (c'est-à-dire qu'il encapsule la sortie de conversion plutôt que d'exposer un `ConversionResult` standardisé comme contrat de réponse principal).
 - **Type de risque** : emballage incompatible ; perte potentielle de la sémantique de résultat standardisée à la limite HTTP.

- **`api/backend/middleware/security/validate.middleware.js` — première réponse 400 non formée comme ConversionResult**
 - **Pourquoi le risque existe** : les requêtes non valides sont court-circuitées avec `{ error: "Invalid request", issues: [...] }` qui ne suit pas le contrat `ConversionResult`.
 - **Type de risque** : enveloppe d'erreur incohérente à limite de route (attendue pour la validation, mais reste une divergence contractuelle pour les consommateurs d'API).

- **`api/backend/middleware/error-handler.middleware.js` — la réponse d'erreur globale est générique en production**
 - **Pourquoi le risque existe** : des erreurs inattendues générées sont transformées en `{ error: "Internal server error" }` en production, perdant le contexte de conversion structuré.
 - **Type de risque** : suppression/enveloppement à la limite d'erreur globale pour les applications basées sur le lancement. chemins.

#### Déjà sûr ou encore besoin d'alignement (état actuel)

- **Déjà sûr (préservation du contrat)** :
 - `api/backend/services/modules/adoc-to-md.converter.js` crée des résultats d'échec standardisés via `createFailureResult(...)`.
 - `api/backend/services/modules/lazyload.module.js` préserve l'intégralité `ConversionResult` objets renvoyés par le module migré (fusion des journaux et conservation d'un champ `duration` hérité).

- **A toujours besoin d'un alignement de l'étape 2** :
 - `lazyload.module.js` chemins d'échec qui se produisent avant l'invocation du module (actuellement en forme d'héritage).
 - Couches de route/service HTTP qui enveloppent, traduisent ou lancent au lieu de se propager. un `ConversionResult` entièrement standardisé de manière cohérente.

Le comportement cible et les décisions d'alignement seront définis dans la sous-étape 2.3.1 et suivantes.

### Étape 2.2.4 — Incohérences du flux actuel et observations d'alignement de l'étape 2 (AsciiDoc -> Markdown)

La sous-étape 2.2.4 consolide les incohérences fondées et les observations pertinentes pour l'alignement de l'étape 2 pour le flux backend AsciiDoc -> Markdown déjà migré, avant de définir le comportement cible.

- **Chemin migré** : AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Confirmé Cible d'alignement de l'étape 2** : `api/backend/services/modules/lazyload.module.js`

#### Incohérences actuelles clés / observations pertinentes pour l'alignement (fondées)

- **Enveloppes de résultats mitigées en fonction du stade de défaillance** :
 - Lorsque le convertisseur migré s'exécute, il renvoie une défaillance `ConversionResult` entièrement standardisée.
 - Lorsqu'une défaillance se produit *avant* l'invocation du convertisseur dans `lazyload.module.js` (validation du chemin, problèmes de chargement/interface du module, exception interne de chargement paresseux), l'objet renvoyé est de forme héritée.

- **La gestion des succès/échecs est asymétrique au-dessus du convertisseur** :
 - `lazyload.module.js` préserve les objets `ConversionResult` complets des modules migrés, mais utilise toujours la reconstruction héritée pour les autres cas.
 - `secure-converter.js` convertit un résultat de module `success:false` en un `ConversionError(...)` lancé, passant du retour de résultat au flux d'exception.

- **Les limites HTTP exposent toujours les formes de réponse héritées** :
 - `POST /api/to-markdown` renvoie les erreurs héritées `{ detail: ... }` plutôt que d'exposer les erreurs standardisées complètes. `ConversionResult`, même lorsqu'il est disponible.
 - `POST /api/convert` encapsule la sortie de conversion dans `{ success: true, result: ..., format }` plutôt que d'utiliser `ConversionResult` comme contrat de réponse principal.
 - Les échecs de validation de la demande (`validate.middleware.js`) renvoient une forme distincte non-ConversionResult 400, créant plusieurs erreurs visibles par le client enveloppes.

- **La responsabilité de l'élaboration des résultats est toujours répartie entre plusieurs couches de coordination** :
 - Le convertisseur est désormais propre et conforme au contrat.
 - Le répartiteur (`lazyload.module.js`), le service sécurisé (`secure-converter.js`) et les itinéraires appliquent toujours chacun leurs propres règles d'emballage/traduction.

#### Ce qui est déjà aligné et sûr

- Le convertisseur migré (`adoc-to-md.converter.js`) construit des résultats de réussite et d'échec conformes au contrat via des assistants centralisés.
- `lazyload.module.js` préserve et renvoie les objets `ConversionResult` complets lorsque les modules les fournissent déjà.

#### Ce qui nécessite encore le comportement de l'étape 2 alignement

- Normaliser les limites du répartiteur afin que *tous* les modes de défaillance (y compris les défaillances pré-modules) puissent être exprimés sans revenir aux formes héritées.
- Réduire ou standardiser l'encapsulage des routes/niveaux de service et la propagation basée sur le lancement afin que le modèle de résultat standardisé ne soit pas contourné ou supprimé.

#### Note de priorisation (la plus importante à traiter) premier)

- L'incohérence la plus importante est constituée des **échecs hérités à l'intérieur de `lazyload.module.js` avant l'invocation du module**, car il s'agit de la cible d'alignement confirmée de l'étape 2 et de la limite partagée la plus étroite qui peut empêcher la suppression de contrat entre plusieurs appelants.

La définition du comportement cible commence dans la sous-étape 2.3.1.

### Étape 2.3.1 — Comportement du chemin de réussite cible à la cible d'alignement de l'étape 2

La sous-étape 2.3.1 définit le **comportement du chemin de réussite cible** pour l'alignement de l'étape 2 à la limite de coordination backend/orchestrateur confirmée, pour AsciiDoc -> Markdown déjà migré flow.

- **Chemin migré** : AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Cible d'alignement de l'étape 2 confirmée** : `api/backend/services/modules/lazyload.module.js`

#### Cibler les attentes en matière de chemin de réussite (lorsque le convertisseur migré réussit)

Lorsque le convertisseur migré renvoie un **succès** standardisé `ConversionResult`, la cible d'alignement de l'étape 2 devrait :

- **Accepter** l'objet de succès standardisé `ConversionResult` comme forme de retour principale de l'invocation du module.
- **Préserver la structure du contrat au niveau racine** sans supprimer ni renommer les champs :
 - `success`, `conversionId`, `converter`, `pipeline`, `inputFormat`, `outputFormat`,
 `inputFile`, `outputFile`, `durationMs`, `startedAt`, `finishedAt`, `warnings`,
 `logs`, `error`, `meta`
- **Préserver la sémantique du succès** :
 - `success: true`
 - `error: null`
 - `outputFile` présent et complet (tel que défini par le contrat)
- **Éviter la reconstruction héritée** :
 - ne pas reconstruire ni remplacer le résultat de réussite standardisé par un objet `{ success, logs, error, duration }` hérité lorsqu'un objet `ConversionResult` complet est déjà disponible.
- **Garder la propagation prévisible** :
 - renvoyer le résultat de réussite standardisé préservé aux appelants de manière cohérente, quel que soit le point d'entrée backend qui a invoqué le chargeur paresseux (itinéraires ou services).

#### Enrichissement minimal acceptable (doit rester conforme au contrat)

L'enrichissement minimal n'est acceptable que s'il ne modifie pas la forme ou la sémantique du contrat, par exemple :

- **Journaux** : fusionner/ajouter les journaux au niveau du répartiteur à `logs` (en préservant `logs` sous forme de tableau).
- **Métadonnées** : fusionnez les métadonnées non conflictuelles au niveau du répartiteur dans `meta` (en préservant `meta` en tant qu'objet).
- **Contexte de pipeline** : ajoutez le contexte de pipeline uniquement s'il reste un tableau de chaînes et ne contredit pas le pipeline signalé par le convertisseur.
- **Champs de compatibilité hérités** : ajoutez un champ hérité `duration` (secondes) uniquement si les appelants existants le demandent, sans modifier `durationMs`.

#### Comportements inacceptables sur le chemin de réussite au niveau de cette couche

- **Suppression des champs** du résultat de réussite standardisé (par exemple, suppression de `inputFile`, `outputFile`, horodatages, `meta` ou `pipeline`).
- **Renommer ou remodeler** le résultat de réussite standardisé dans une autre enveloppe (par exemple, `{ success: true, result: ... }` ou formats de résultats de module existants).
- **Muter la sémantique du succès**, comme définir `error` sur une valeur non nulle en cas de succès, ou rendre `warnings/logs/meta/pipeline` facultatif/omis.
- **Inventer des données commerciales** qui devraient provenir du convertisseur ou de l'appelant (par exemple, fabriquer `conversionId`, `inputFile` ou `outputFile`).

Le comportement cible du chemin de défaillance sera défini à la sous-étape 2.3.2.

### Étape 2.3.2 — Comportement cible du chemin de défaillance à la cible d'alignement de l'étape 2

La sous-étape 2.3.2 définit les **Comportement du chemin d'échec cible** pour l'alignement de l'étape 2 à la limite de coordination backend/orchestrateur confirmée, pour le flux AsciiDoc -> Markdown déjà migré.

- **Chemin migré** : AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Cible d'alignement de l'étape 2 confirmée** : `api/backend/services/modules/lazyload.module.js`

#### Attentes en matière de chemin de défaillance cible (lorsque le convertisseur migré échoue)

Lorsque le convertisseur migré renvoie un **échec** standardisé `ConversionResult`, la cible d'alignement de l'étape 2 doit :

- **Accepter** l'échec standardisé `ConversionResult` objet comme forme de retour d'échec principale lors de l'appel du module.
- **Préserver la structure du contrat au niveau racine** sans supprimer ni renommer les champs :
 - `success`, `conversionId`, `converter`, `pipeline`, `inputFormat`, `outputFormat`,
 `inputFile`, `outputFile`, `durationMs`, `startedAt`, `finishedAt`, `warnings`,
 `logs`, `error`, `meta`
- **Préserver la sémantique d'échec** :
 - `success: false`
 - `error` non nul et structuré
 - `outputFile` cohérent avec la sémantique du contrat (nullable en cas d'échec, renseigné uniquement en cas de mise à la terre)
- **Préserver les informations d'erreur structurées** :
 - conserver `error.code`, `error.message`, `error.details` et `error.recoverable` intacts à moins qu'une normalisation justifiée et sécurisée par contrat ne soit requise
 - préserver la sémantique `error.code` documentée (n'affaiblissez pas les codes spécifiques en codes génériques sans raison fondée)
- **Éviter la reconstruction héritée** :
 - ne pas reconstruire ou remplacer l'échec standardisé résultat avec un objet `{ success, logs, error, duration }` hérité lorsqu'un `ConversionResult` complet est déjà disponible.
- **Éviter les remplacements génériques inutiles** :
 - ne remplacez pas une défaillance structurée significative provenant du convertisseur par `INTERNAL_ERROR` à moins que la forme de défaillance d'origine soit inutilisable ou véritablement indisponible.
- **Gardez la propagation des défaillances prévisible** :
 - retour le résultat d'échec standardisé conservé aux appelants de manière cohérente, quel que soit le point d'entrée back-end qui a invoqué le chargeur paresseux.

#### Enrichissement minimal acceptable (doit rester conforme au contrat)

L'enrichissement minimal n'est acceptable que s'il ne modifie pas la forme du contrat, la sémantique ou la classification de l'échec principal, par exemple :

- **Journaux** : fusionner/ajouter les journaux au niveau du répartiteur dans `logs` (en préservant `logs` en tant que tableau).
- **Métadonnées** : fusionner les métadonnées non conflictuelles au niveau du répartiteur dans `meta` (en préservant `meta` en tant qu'objet).
- **Contexte de défaillance du pipeline** : ajouter uniquement les informations contextuelles sur l'étape de défaillance s'il n'écrase pas ou ne dilue pas la classification principale `error.code`.
- **Champs de compatibilité hérités** : ajoutez un champ hérité `duration` (secondes) uniquement si les appelants existants l'exigent, sans modifier `durationMs`.

#### Comportements de chemin de défaillance inacceptables à cette couche

- **L'échec standardisé de l'emballage** entraîne des enveloppes incompatibles qui masquent les champs du contrat.
- **Suppression ou mutation** `error.code` d'une manière qui brise la sémantique documentée du code d'erreur.
- **Aplatissement des erreurs structurées** en chaînes génériques qui perdent la structure d'objet `error`.
- **Remplacement des échecs de convertisseur fondé** par des génériques injustifiés. `INTERNAL_ERROR`.
- **Suppression des champs d'échec obligatoires** (`conversionId`, `pipeline`, `inputFile`, horodatages, `logs`, `meta` ou structuré `error`).
- **Lancement d'erreurs brutes vers le haut** lorsqu'un résultat d'échec standardisé structuré existe déjà et peut être propagée.

Le comportement d'erreur interne au niveau de la cible d'alignement sera défini à la sous-étape 2.3.3.

### Étape 2.3.3 — Comportement d'erreur interne cible au niveau de la cible d'alignement de l'étape 2

La sous-étape 2.3.3 définit le **comportement d'erreur interne cible** pour l'alignement de l'étape 2 lorsque la couche de coordination elle-même échoue pendant le flux AsciiDoc -> Markdown déjà migré.

- **Chemin migré** : AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Cible d'alignement de l'étape 2 confirmée** : `api/backend/services/modules/lazyload.module.js`

#### Cible attentes en matière d'erreurs internes (échecs de la couche de coordination)

Pour les échecs de la couche de coordination interne (par exemple : incohérence du registre de module, échec de résolution/chargement de module, exception de chargement différé, exception d'orchestration au niveau du répartiteur), la cible d'alignement de l'étape 2 doit :

- **Éviter les échappements bruts basés sur le lancement** chaque fois qu'un résultat d'échec structuré peut être renvoyé conformément au contrat form.
- **Convertir les échecs de coordination interne** en échec standardisé `ConversionResult` lorsqu'aucun objet d'échec standardisé en aval valide n'est déjà disponible.
- **Préserver les échecs structurés en aval** lorsqu'ils existent déjà, plutôt que de les écraser par des échecs internes génériques.
- **Utiliser `INTERNAL_ERROR` uniquement lorsqu'il est fondé** :
 - appliquer `INTERNAL_ERROR` uniquement pour les véritables défaillances de la couche de coordination interne
- ne pas l'utiliser lorsqu'un code d'erreur documenté plus spécifique s'applique clairement
- **Préserver la sémantique d'erreur structurée** :
 - conserver `error` en tant qu'objet (`code`, `message`, `details`, `recoverable`)
 - conserver la classification des erreurs primaires stable, sauf si cela est justifié par l'échec réel source
- **Préserver l'intégralité du contrat en cas de défaillance interne** :
 - conserver les champs racine requis présents
 - conserver `warnings`, `logs`, `pipeline` sous forme de tableaux et `meta` en tant qu'objet
- **Préserver le contexte de débogage utile en toute sécurité** :
 - inclure un contexte interne significatif dans `error.details`, `logs` et/ou `meta`
 - évitez les échecs opaques de type chaîne uniquement qui perdent les informations de l'étape source
- **Garder la propagation prévisible** :
 - renvoie systématiquement un objet d'échec conforme au contrat aux appelants en amont, quel que soit le chemin d'entrée.

#### Acceptable gestion des erreurs internes à cette couche

- Conversion structurée des échecs internes du répartiteur/orchestration en objets d'échec `ConversionResult`.
- Enrichissement limité des journaux/métadonnées qui préserve la forme du contrat et la sémantique des échecs primaires.
- Préservation d'un résultat d'échec standardisé en aval lorsqu'il en existe déjà un.

#### Comportement d'erreur interne inacceptable au niveau de cette couche

- Propagation de jet brut qui contourne la propagation standardisée des résultats sans forte nécessité.
- Remplacement d'une défaillance structurée en aval valide par une défaillance interne générique injustifiée.
- Suppression ou mutation de `error.code` d'une manière qui rompt la sémantique documentée.
- Aplatissement de la structure interne échecs en sorties d'erreur de type chaîne uniquement ou opaques.
- Renvoi d'objets partiels qui ne correspondent pas à la structure `ConversionResult` documentée.

Les travaux de mise en œuvre/de correction commencent à la sous-étape 2.4.1.

### Étape 2.3.4 — Limite d'enrichissement et de normalisation à la cible d'alignement de l'étape 2

Sous-étape 2.3.4 définit ce que la cible d'alignement de l'étape 2 peut enrichir, ajouter ou normaliser sans rompre le contrat standardisé `ConversionResult`.

- **Chemin migré** : AsciiDoc -> Markdown via `downdoc` (`api/backend/services/modules/adoc-to-md.converter.js`)
- **Cible d'alignement de l'étape 2 confirmée** : `api/backend/services/modules/lazyload.module.js`

#### Catégories d'enrichissement acceptables (sans contrat)

Au niveau de cette couche de coordination, l'enrichissement n'est acceptable que s'il préserve la signification principale du résultat du convertisseur et la forme complète du contrat :

- **Journaux supplémentaires** :
 - ajouter les journaux de la couche de coordination à `logs`
 - ne pas supprimer ni réécrire les journaux de convertisseur existants
- **Métadonnées supplémentaires** :
 - ajouter des métadonnées de coordination non conflictuelles sous `meta`
 - conserver les métadonnées existantes fournies par le convertisseur
- **Informations contextuelles sur le pipeline** :
 - ajouter le contexte du pipeline délimité lorsqu'il reste cohérent avec le flux signalé par le convertisseur
 - ne remplacez pas l'identité du pipeline du convertisseur par une sémantique d'orchestration sans rapport
- **Contexte de coordination** :
- ajouter un contexte de répartition/chargement différé traçable uniquement s'il ne modifie pas la sémantique principale de réussite/échec

#### Comportements de normalisation minimaux acceptables

La normalisation minimale est acceptable uniquement pour maintenir la conformité du contrat stable :

- - Assurer que les champs de collection restent des tableaux (`pipeline`, `warnings`, `logs`).
- Assurez-vous que `meta` reste un objet ; ajouter des clés au lieu de remplacer l'objet entier.
- Ajouter les journaux sans détruire l'ordre de l'historique des journaux existant.
- Préserver l'identité structurée des échecs (`error.code`, `error.message`, `error.details`, `error.recoverable`) tout en ajoutant un contexte de coordination.
- Garder la cohérence sémantique `success/error` intacte (`success:true -> error:null`, `success:false -> error` présents).

#### Comportements de remodelage ou de remplacement inacceptables

La cible d'alignement ne doit pas :

- Remplacer la classification principale `error.code` par un code différent sans raison fondée.
- Aplatir ou remplacer le objet structuré `error` avec une erreur de chaîne générique uniquement.
- Reconstruire un résultat standardisé dans une forme ad hoc héritée.
- Supprimer les champs de contrat requis au niveau racine.
- Remplacer l'identité du résultat du convertisseur par une sémantique d'encapsulation/d'orchestration non liée.
- Transformer l'enrichissement en propriété de la construction complète du résultat lorsqu'un résultat standardisé existe déjà.
- Écraser Signification du succès/échec provenant du convertisseur avec la sémantique générique du répartiteur.

La mise en œuvre/la correction du runtime commence à la sous-étape 2.4.1.

### Étape 2.5.4 — Limite de sortie HTTP backend (`POST /api/to-markdown`)

Pour le chemin AsciiDoc → Markdown migré (`downdoc`), la limite de sortie backend effective pour les consommateurs JSON est **`POST /api/to-markdown`** dans `api/backend/routes/conversion.routes.js`.

- **Succès (HTTP 200)** : le corps de la réponse comprend `markdown` (charge utile principale pour les clients existants) et **`conversionResult`**, le `ConversionResult` standardisé complet renvoyé par `runConverter` pour cette requête.
- **Échec (HTTP 500)** : le corps de la réponse est l'échec standardisé `ConversionResult` avec `error` structuré (y compris `error.code`), plus une chaîne **`detail`** compatible avec l'héritage alignée sur `error.message` pour les clients qui lisent encore `detail`.

Vérification : `api/backend/scripts/verify-e2e-to-markdown-output-boundary.js` (et le script de contrat d'échec existant) exercent cette limite HTTP en cours de processus.

### Étape 2.6.1 — Résumé de l'alignement de l'étape 2 (AsciiDoc migré → Markdown)

Cette sous-étape résume les résultats concrets de l'alignement backend/orchestrateur complétés à l'étape 2 pour le chemin AsciiDoc → Markdown déjà migré (`downdoc`).

Aligne à l'étape 2 (résultats techniques backend/orchestrateur) :
- Confirmé `api/backend/services/modules/lazyload.module.js` comme objectif de coordination de l'étape 2 pour la propagation standardisée `ConversionResult` dans le chemin migré.
- Préservation des résultats de réussite standardisés `ConversionResult` au niveau de la couche de coordination (pas de suppression de champ ni de remodelage de l'enveloppe de réussite/erreur lorsqu'un résultat standardisé existe déjà).
- Préservation des résultats d'échec `ConversionResult` standardisés au niveau de la couche de coordination (y compris structuré `error.code` et champs requis au niveau racine).
- Échecs de coordination interne alignés (problèmes de couche de coordination autour du chargement paresseux/répartition) pour éviter de contourner la propagation des échecs standardisés et conserver une forme d'échec conforme au contrat.
- Remodelage ad hoc hérité réduit/supprimé sur le chemin AsciiDoc → Markdown migré lorsqu'un résultat standardisé est disponible.
- Vérifié que le le contrat standardisé survit à travers le flux backend réel migré par des scripts de vérification backend.
- Préservation vérifiée de la limite de sortie HTTP effective (`POST /api/to-markdown`) pour les charges utiles de réussite et d'échec.
- Scénarios représentatifs de bout en bout couverts pour le chemin migré (succès nominal et plusieurs modes d'échec représentatifs).

Alignement backend/orchestrateur vs. rester hors de portée :
- Aligné : propagation de la couche de coordination et comportement final de la limite HTTP pour le chemin `downdoc` migré.
- Non inclus dans le champ d'application (pour cette sous-étape) : harmonisation globale entre les endpoints non liés (par exemple, différents wrappers ou formes 400 de validation de demande), et tout travail de migration/alignement pour d'autres convertisseurs/pipelines.

Suivant : la sous-étape 2.6.2 sera documenter le modèle d'alignement réutilisable dérivé de ces résultats confirmés pour les futurs flux backend.

### Étape 2.6.2 — Modèle d'alignement backend/orchestre réutilisable (AsciiDoc migré → Markdown)

Cette sous-étape documente le modèle d'alignement réutilisable de l'étape 2 validé sur le chemin AsciiDoc → Markdown déjà migré (`downdoc`).

Séquence réutilisable (modèle pratique) :
- Identifier la véritable cible de coordination backend/orchestrateur pour le chemin migré (la couche étroite où les résultats standardisés peuvent être préservés ou remodelés).
- Cartographier le flux de réussite nominal et tous les flux orientés échec qui peuvent contourner/modifier le contrat (y compris les étapes d'échec avant l'invocation du module).
- Identifier points de risque de contrat dans chaque couche (répartiteur, wrappers de service, routes et toute propagation basée sur le lancement).
- Définir des comportements cibles en matière de réussite, d'échec, d'erreurs internes et de règles d'enrichissement/normalisation qui sont explicitement sécurisées par contrat.
- Corriger la préservation du chemin de réussite afin que les résultats de réussite standardisés soient propagés sans reconstruire les enveloppes existantes.
- Corriger la préservation du chemin d'échec afin de standardiser les résultats d'échec (y compris structurés `error.code`) conservent leurs champs racine et leur structure d'erreur requis.
- Corriger la gestion des erreurs de la couche de coordination interne afin que les erreurs internes ne contournent pas la propagation standardisée des résultats.
- Vérifier au niveau de la cible d'alignement (vérification de la couche locale).
- Vérifier le comportement de réussite et d'échec de bout en bout pour le chemin migré.
- Élargir la couverture de scénarios représentatifs de bout en bout pour réduire le « vert sur un cas » risque.
- Vérifier la préservation du contrat standardisé à la limite de sortie effective du backend (réponse HTTP/bord de retour réel pour les consommateurs JSON).

Pourquoi ce modèle est important :
- Il maintient l'étape 2 localisée et testable en concentrant l'alignement sur une cible de coordination confirmée au lieu de refactors larges.
- Il préserve le contrat standardisé à travers les couches environnantes (coordination et transport), pas seulement à l'intérieur. convertisseurs.
- Cela réduit le risque de refonte ad hoc héritée se cachant derrière une couverture partielle de réussite/échec.

Comment les flux futurs devraient utiliser ce modèle :
- Aligner un chemin à la fois pour garder la portée du contrat claire et la vérification ciblée.
- Documenter les décisions d'alignement avant une mise en œuvre plus large pour éviter la dérive.
- Préserver les résultats standardisés en aval plutôt que de les reconstruire dans des couches wrapper.
- Vérifiez à la fois le comportement local (cible d'alignement) et de bout en bout (limite de sortie effective) avant d'étendre la portée.

Ensuite : la sous-étape 2.6.3 formalisera la définition de Terminé pour l'étape 2, sur la base de ces résultats confirmés.

### Étape 2.6.4 — Résumé de l'achèvement de l'étape 2

Étape 2 note de clôture (version `0.0.1.4.6`) : L'étape 2 a réussi à établir un comportement backend/orchestrateur aligné sur le contrat pour le chemin d'exécution AsciiDoc -> Markdown déjà migré (`downdoc`).

#### A. Ce que l'étape 2 a réalisé
- Préservation des résultats de réussite/échec standardisés `ConversionResult` grâce à la coordination backend/orchestrateur couche pour le chemin d'exécution migré.
- Remodelage des résultats ad hoc hérités réduits/supprimés sur le chemin AsciiDoc migré -> Markdown lorsqu'un résultat standardisé est disponible.
- Alignement du chemin de réussite, du chemin d'échec et du comportement d'erreur de la cible interne au niveau de la cible de coordination backend confirmée.
- Validation de bout en bout effectuée pour que le contrat standardisé survit à travers le backend réel. 

#### B. Quelle adoption concrète du runtime a été réalisée
- Le chemin de conversion AsciiDoc -> Markdown est préservé de bout en bout non seulement à l'intérieur du convertisseur, mais également à travers la couche de coordination backend environnante.
- Le succès et l'échec restent standardisés à travers le flux backend réel pour ce chemin migré.
- La limite de sortie backend effective pour les consommateurs JSON préserve désormais le contrat standardisé pour le chemin migré.
- Une vérification représentative de bout en bout a été effectuée pour le succès et l'échec.

#### C. Ce que l'étape 2 fournit désormais au projet
- Une ligne de base validée de préservation de la couche backend pour les objets `ConversionResult` standardisés sur le premier chemin d'exécution migré.
- Un modèle d'alignement backend/orchestrateur réutilisable (documenté à l'étape 2.6.2) pour les flux de conversion futurs.
- Un chemin de référence plus solide pour la normalisation ultérieure du convertisseur/backend work.
- Une base plus propre qui empêche la réouverture de questions d'alignement de contrat déjà validées pour le chemin AsciiDoc -> Markdown migré.

#### D. Ce qui reste en dehors de l'étape 2
- L'achèvement de l'étape 2 n'implique pas que tous les flux backend sont alignés.
- L'achèvement de l'étape 2 n'implique pas que tous les convertisseurs sont migré.
- L'achèvement de l'étape 2 n'implique pas que le travail UX frontend est terminé.
- L'achèvement de l'étape 2 n'implique pas une refonte plus large du pipeline ou la refactorisation de l'orchestrateur à l'échelle de l'architecture est terminée.

#### E. Note de transition
- Les travaux futurs doivent s'appuyer sur la base de référence des étapes 1 et 2 et utiliser le modèle documenté comme point de départ, en évitant relance des mêmes questions d'alignement de contrat et de coordination du premier chemin pour le chemin AsciiDoc -> Markdown déjà migré.

### Étape 3.1.1 — Points d'entrée frontend (AsciiDoc migré -> Markdown)

L'étape 3 commence par identifier les couches concrètes frontend/UI qui consomment ou réagissent au résultat de la conversion backend pour le chemin déjà migré. AsciiDoc -> Flux Markdown (`POST /api/to-markdown`).

Points d'entrée/composants plausibles du frontend impliqués dans la consommation du résultat de la conversion (fondés) :

| Composant/module | Rôle dans le flux AsciiDoc -> Markdown |
|---|---|
| `api/frontend/src/App.tsx` | Conteneur principal de l'UI et couche d'orchestration : déclenche la conversion, possède l'état `status`/`loading`/notifications et écrit la sortie de conversion dans l'état du panneau de destination. |
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) | Couche d'appel API utilisée par `App.tsx` pour AsciiDoc -> Markdown : appelle `POST /api/to-markdown`, analyse JSON, extrait `data.markdown` et achemine les erreurs vers la notification ou vers le chemin modal d'erreur de conversion. |
| `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown`) | AsciiDoc dédié -> Assistant d'appel d'API Markdown (appelle également `POST /api/to-markdown` et consomme `data.markdown`). Présenté comme un point d'entrée plausible, même si le chemin `App.tsx` actuel utilise principalement `convertText`. |
| `api/frontend/src/converters/api.ts` (`API_BASE`) | Résolution d'URL de base backend utilisée par les sites d'appel du convertisseur. |
| `api/frontend/src/components/Panel.tsx` | Composant du panneau de texte source/destination : affiche les entrées de l'utilisateur et affiche la sortie Markdown convertie (le déclenchement en lecture seule/édition est contrôlé par l'état `App.tsx`). |
| `api/frontend/src/components/FormatSelector.tsx` | Composant de sélection de format qui pilote la sélection du chemin AsciiDoc -> Markdown dans `App.tsx`. |
| `api/frontend/src/App.tsx` (toast de notification) | Rendu des notifications de réussite/erreur en fonction des résultats de la conversion (`setNotification`). |
| `api/frontend/src/App.tsx` (erreur de conversion modale) | Surface d'affichage des erreurs pour des échecs de conversion spécifiques (déclenchés via `setShowConversionErrorModal` / `setConversionErrorMessage`). |

Remarque : la cible exacte d'alignement du frontend principal (la couche la plus étroite où la gestion compatible `ConversionResult` doit être introduite) sera sélectionnée à la sous-étape 3.1.2.

### Étape 3.1.2 — Point d'entrée du frontend principal (AsciiDoc migré -> Markdown)

Ce La sous-étape identifie le point d'entrée principal du frontend/UI pour le travail de l'étape 3 : l'endroit unique dans le flux frontend actuel où le résultat de la conversion AsciiDoc -> Markdown est coordonné de la manière la plus significative au-dessus de la réponse brute de l'API.

Point d'entrée principal (sélectionné) :
- `api/frontend/src/App.tsx` (en particulier l'orchestration de conversion dans `handleConvert`)

Pourquoi il s'agit du point d'entrée principal (fondé) :
- C'est là que le succès/l'échec de la conversion est coordonné dans l'état de l'UI (`loading`, `status`, les notifications et le modal d'erreur de conversion).
- Il décide où la sortie de conversion est écrite (par exemple `setMdOutput(...)` pour Destination Markdown), qui contrôle directement ce que l'utilisateur voit dans le panneau de résultats.
- Il s'agit de la couche de coordination la plus étroite « au-dessus de l'API » où les champs de résultats backend standardisés pourraient être préservés, ignorés ou mal gérés lors de l'alignement futur de l'étape 3 (sans encore refactoriser l'implémentation de l'appel API).

Secondaire (impliqué mais pas principal) :
- `api/frontend/src/converters/generic-converter.ts` (`convertText`) : premier consommateur de la charge utile HTTP JSON (analyse la réponse et extrait `data.markdown`), mais ne possède pas les principales décisions de coordination de l'UI.
- `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown`) : assistant plausible, mais le chemin actuel `App.tsx` AsciiDoc -> Markdown passe principalement par `convertText`.
- Composants de présentation de l'UI : `api/frontend/src/components/Panel.tsx`, `api/frontend/src/components/FormatSelector.tsx`, plus le toast de notification et le rendu modal d'erreur de conversion à l'intérieur `App.tsx`.

Remarque : la cible d'alignement officielle de l'étape 3 sera confirmée à la sous-étape 3.1.3.

### Étape 3.1.3 — Cible d'alignement frontend/UI confirmée de l'étape 3 (AsciiDoc migré -> Markdown)

Cette sous-étape confirme formellement l'étape officielle 3 cible d'alignement frontend/UI pour le flux de résultats de conversion AsciiDoc -> Markdown déjà migré.

Cible d'alignement confirmée de l'étape 3 :
- `api/frontend/src/App.tsx` (orchestration de la conversion dans `handleConvert`)

Pourquoi s'agit-il du bon objectif de l'étape 3 :
- C'est le principal « ci-dessus » le point de coordination de l'API où les résultats de la conversion sont traduits en un état d'UI et un comportement d'affichage des résultats visibles par l'utilisateur.
- C'est là que les informations standardisées de réussite/échec du backend peuvent être préservées et normalisées dans l'état de l'UI sans refactoriser prématurément le code de récupération de niveau inférieur ou les composants de l'UI.

Ce que l'étape 3 cherchera à aligner à ce niveau :
- Consommation standardisée des résultats de réussite (y compris la préservation des métadonnées significatives lorsqu'elles sont disponibles, sans interrompre le flux de charge utile `markdown` actuel).
- Consommation standardisée des résultats d'échec (préférer un contexte d'échec structuré aux heuristiques de message ad hoc lorsque cela est possible).
- Transitions d'état de l'UI propres pour le cycle de vie de la conversion (chargement/statut/notification/comportement modal dérivé de résultats standardisés).
- Évitement des chemins d'interprétation des résultats/erreurs du frontend hérités/ad hoc qui obscurcissent le backend structuré sémantique.

Suivant : le mappage détaillé du flux d'UI commence à la sous-étape 3.2.1.

### Étape 3.2.1 — Mappage nominal du flux frontal/UI (AsciiDoc -> Markdown)

Cette sous-étape mappe le flux frontal/UI nominal (orienté vers le succès) pour le chemin de résultat de conversion AsciiDoc -> Markdown déjà migré.

- Chemin migré : **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Cible d'alignement confirmée de l'étape 3 : `api/frontend/src/App.tsx` (`handleConvert`)

Flux de réussite nominal (fondé, étape par étape) :
1. L'utilisateur déclenche la conversion depuis l'UI (action de conversion gérée par `handleConvert` en `api/frontend/src/App.tsx`).
2. `App.tsx` détermine le texte source pour le format source actuel et effectue des vérifications de base en amont (non vide, limite de taille, compatibilité source/cible).
3. `App.tsx` dérive le chemin d'écriture de destination (rappel `setOutput`) afin que les résultats Markdown soient écrits dans `mdOutput` (via `setMdOutput`).
4. `App.tsx` appelle `convertText(...)` depuis `api/frontend/src/converters/generic-converter.ts` avec :
 - le texte source,
 - `sourceFormat='asciidoc'`, `targetFormat='markdown'`,
 - les paramètres d'état de l'UI (`setStatus`, `setLoading`, `setNotification`),
 - et le paramètre de sortie (qui met finalement à jour `mdOutput` pour les résultats Markdown).
5. `convertText` définit `status` sur « conversion en cours » et définit `loading=true`, puis émet `fetch` à `POST /api/to-markdown`.
6. Sur HTTP 200, `convertText` analyse la réponse JSON et extrait la charge utile principale (`data.markdown`), puis appelle `setOutput(result)`.
7. Le rappel `setOutput` dans l'état de mise à jour `App.tsx` (`setMdOutput(result)` pour la destination Markdown).
8. L'UI restitue le panneau de destination mis à jour avec le nouveau contenu Markdown (via le rendu piloté par l'état ; le panneau est affiché via `App.tsx` et le composant `Panel`).
9. `convertText` met à jour les commentaires visibles de l'UI de « succès » (`status` et notification) et définit enfin `loading=false`.

Où le backend standardisé `ConversionResult` est consommé pour la première fois dans le frontend :
- Le premier point de consommation du frontend est `api/frontend/src/converters/generic-converter.ts` (`convertText`) à **Analyse HTTP JSON** (`const data = await res.json()`).
- Dans le flux nominal actuel, le frontend ne consomme que `data.markdown` pour réussir ; les champs de résultats standardisés supplémentaires renvoyés à côté ne sont pas encore utilisés à l'étape 3.2.1.

Comment le résultat nominal se propage à travers les couches d'état/d'affichage du frontend :
- `convertText` -> `setOutput(result)` -> `App.tsx` état (`mdOutput`) -> rendu du panneau de destination (`Panel`), plus `status/loading/notification` mises à jour d'état pour les commentaires des utilisateurs.

Remarque : le flux d'UI orienté vers les échecs sera mappé dans sous-étape 3.2.2.

### Étape 3.2.2 — Cartographie du flux frontend/UI orienté panne (AsciiDoc -> Markdown)

Cette sous-étape mappe le flux frontend/UI orienté panne pour le chemin de résultat de conversion AsciiDoc -> Markdown déjà migré.

- Chemin migré : **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Cible d'alignement de l'étape 3 confirmée : `api/frontend/src/App.tsx` (`handleConvert`)

Flux orienté échec (fondé, étape par étape) :
1. L'utilisateur déclenche la conversion depuis l'UI (action de conversion gérée par `handleConvert` dans `api/frontend/src/App.tsx`).
2. `App.tsx` appelle `convertText(...)` à partir de `api/frontend/src/converters/generic-converter.ts` avec les setters d'état de l'UI et le setter de sortie pour le format de destination.
3. `convertText` définit `status` sur « conversion en cours » et définit `loading=true`, puis émet `fetch` à `POST /api/to-markdown`.
4. Le backend répond avec un statut non-2xx (par exemple HTTP 500 pour un échec de conversion). `convertText` entre dans la branche `!res.ok`.
5. `convertText` tente d'analyser le corps de l'échec au format JSON (`await res.json()`) et extrait uniquement la chaîne `detail` compatible avec l'héritage lorsqu'elle est présente (`errorJson.detail`), sinon elle revient au texte de réponse.
6. `convertText` classe certains échecs de conversion à l'aide d'heuristiques de chaîne sur `detail`/text (par exemple, « la sortie semble être AsciiDoc », « la sortie est identique… »). Dans ces cas, il :
 - ouvre le modal d'erreur de conversion (`setShowErrorModal(true)`),
 - définit un message d'erreur (`setErrorMessage(...)`),
 - définit un état d'échec et une notification d'erreur,
 - et renvoie plus tôt (aucune exception levée).
7. Pour les autres échecs HTTP, `convertText` renvoie un `Error(...)` avec un message composé (statut HTTP + `detail`/texte). La branche `catch` convertit ensuite cela en une mise à jour générique de notification/statut.
8. Comportement du panneau de résultats en cas d'échec : comme `setOutput(...)` n'est pas appelé en cas d'échec, le contenu du panneau de destination reste inchangé (il continue d'afficher le résultat réussi précédent, le cas échéant, ou reste vide).
9. `convertText` définit enfin `loading=false` (dans `finally`), restaurant l'UI à partir de l'état « en cours ».

Où l'échec standardisé du backend `ConversionResult` est consommé pour la première fois dans le frontend :
- Le premier point de consommation est `api/frontend/src/converters/generic-converter.ts` (`convertText`) pendant l'échec du corps analyse syntaxique (`await res.json()`).
- Cependant, la logique frontend actuelle ne consomme que `detail` (chaîne) et ne lit pas les champs d'échec structurés tels que `error.code` (même lorsqu'ils sont présents dans la réponse du backend).

Comment l'échec structuré se propage actuellement à travers les couches d'état/d'affichage du frontend :
- Défaillance structurée du backend -> (aplati en chaîne `detail`) -> `App.tsx` état de l'UI via `setStatus` / `setNotification`, et pour des messages d'échec de conversion spécifiques, `showConversionErrorModal` + `conversionErrorMessage`.

Observation fondée (où la sémantique d'échec peut être aplatie/ignorée/mal gérée plus tard):
- La classification des échecs est actuellement basée sur l'heuristique de sous-chaîne de message de `detail`, et non sur la norme `error.code`. Il s'agit d'un point principal où la sémantique d'échec structurée peut être perdue même si le backend renvoie un échec standardisé complet `ConversionResult`.

Remarque : la sous-étape 3.2.3 identifiera les points frontend exacts où la gestion sensible au contrat peut être modifiée ou interrompue.

### Étape 3.2.3 — Points de risque contractuel frontend/UI (AsciiDoc -> Markdown)

Cette sous-étape identifie les points exacts du frontend/UI dans le flux déjà mappé où la gestion standardisée du backend `ConversionResult` peut encore être modifiée, aplatie, ignorée, partiellement reconstruite ou mal gérée.

- Chemin migré : **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Objectif d'alignement confirmé de l'étape 3 : `api/frontend/src/App.tsx` (`handleConvert`)

#### Points exacts de risque contractuel (fondés)

| Couche / composant | Pourquoi c'est un point de risque contractuel | Type(s) de risque présent(s) dans le flux actuel |
|---|---|---|
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) — consommation corporelle réussie | Sur HTTP 200, il analyse JSON et n'extrait qu'une seule charge utile de chaîne principale (`data.markdown || data.asciidoc || data.result || ""`). Tout objet de résultat standardisé renvoyé avec la charge utile n’est pas consommé. | Ignorer les champs structurés ; réduire la sémantique de réussite à une seule chaîne de sortie ; perte potentielle de métadonnées (`conversionId`, `warnings`, `logs`, etc.). |
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) — consommation corporelle en panne | Sur `!res.ok`, il analyse JSON mais ne lit que `errorJson.detail` (chaîne) lorsqu'il est présent, sinon il revient au texte. Les champs d'échec structuré `ConversionResult` (par exemple `error.code`) ne sont pas lus. | Aplatissement de l'échec structuré en chaîne `detail` ; ignorer `error.code` ; perte du contexte de défaillance structuré. |
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) — classification des échecs de conversion | Certains échecs sont détectés via des heuristiques de sous-chaîne sur `detail`/text (par exemple, « la sortie semble être AsciiDoc », « la sortie est identique… »), et acheminés vers un chemin modal dédié. | Mise en forme/interprétation ad hoc par texte de message ; classification fragile; gestion asymétrique entre les types de pannes. |
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) — remplacement d'erreur générique | Pour les échecs HTTP non heuristiques, il renvoie `new Error(...)` et la branche `catch` convertit l'erreur en chaînes génériques de notification/statut. | Remplacement d'erreur générique ; perte de sémantique structurée par le backend ; surfaces de défaillance incohérentes (modal vs toast). |
| `api/frontend/src/App.tsx` (`handleConvert`) — sélection du chemin d'écriture du résultat | `App.tsx` définit `setOutput` pour décider où les résultats sont écrits (`setMdOutput` lorsque la cible est Markdown). Étant donné que seul un résultat de chaîne est transmis vers le haut, aucune donnée de contrat structuré ne peut se propager dans un état sans modification. | Ignorer les champs structurés au niveau de la couche de coordination principale de l'UI ; réduction à un état de résultat de chaîne uniquement. |
| `api/frontend/src/App.tsx` — comportement du panneau de résultats en cas d'échec | En cas d'échec, `setOutput` n'est pas invoqué, donc le contenu du panneau de destination reste inchangé (la sortie de succès précédente persiste ou reste vide). | Ambiguïté potentielle de l'état de l'UI concernant « le résultat actuel par rapport au dernier bien connu » ; le résultat de l’échec n’est pas représenté comme un état structuré. |

#### Déjà sûr ou encore besoin d'un alignement de l'étape 3

- Déjà sûr (affichage/câblage neutre par rapport au contrat) :
 - `api/frontend/src/components/Panel.tsx` : restitue le contenu textuel piloté par l'état ; ne remodèle pas les résultats du backend.
 - `api/frontend/src/components/FormatSelector.tsx` : pilote la sélection du format ; n'interprète pas les résultats du backend.

- Nécessite toujours un alignement à l'étape 3 (contrat-consommation/coordination) :
 - `api/frontend/src/converters/generic-converter.ts` (`convertText`) : point principal où les résultats du backend sont analysés et actuellement aplatis/filtrés.
 - `api/frontend/src/App.tsx` (`handleConvert` + coordination de l'état de l'UI) : point principal où les résultats sont traduits dans un état visible dans l'UI, actuellement sans propagation structurée des résultats.

Remarque : les incohérences actuelles de l'UI et les observations de risque contractuel seront consolidées à la sous-étape 3.2.4.

### Étape 3.2.4 — Incohérences actuelles du frontend/UI et observations d'alignement (AsciiDoc -> Markdown)

Cette sous-étape consolide les observations actuelles du frontend/UI à partir des flux nominaux/de défaillance cartographiés et de l'analyse des risques contractuels, avant de définir le comportement du frontend cible.

- Chemin migré : **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Cible d'alignement confirmée de l'étape 3 : `api/frontend/src/App.tsx` (`handleConvert`)

#### Principales incohérences actuelles du frontend/UI et observations pertinentes pour l'alignement

- **Asymétrie succès/échec au niveau de la consommation** :
 - Le succès est réduit à une charge utile de chaîne (`data.markdown` chemin), tandis que l'échec est principalement réduit à `detail` chaîne ou générique lancé erreurs.
 - La sémantique structurée du backend n'est pas consommée symétriquement entre le succès et l'échec.

- **Les champs structurés du backend sont analysés mais non conservés** :
 - Le point d'analyse du frontend existe (`await res.json()` dans `convertText`), mais les champs structurés tels que `conversionId`, `warnings`, `logs` et `error.code` ne sont pas propagés dans l'état de l'UI.
 - La gestion des résultats reste la chaîne en premier (`result` sortie + chaînes de message), et non le contrat en premier.

- **L'interprétation des échecs ad hoc reste active** :
 - Le routage des échecs vers le modal d'erreur de conversion dépend de l'heuristique de sous-chaîne de message de `detail`/text.
 - Les échecs qui ne correspondent pas sont convertis en messages toast/statut génériques, créant des surfaces d'échec divergentes.

- **Le comportement du panneau de résultats peut être retardé par rapport au résultat du backend en cas d'échec** :
 - En cas d'échec, aucune mise à jour de l'état de sortie ne se produit, de sorte que le panneau de résultats continue d'afficher le résultat réussi précédent (ou l'état vide).
 - Le contenu des résultats visible dans l'UI peut ne pas représenter explicitement le dernier résultat d'échec du backend.

- **La couche de coordination principale est déjà clairement localisée** :
 - `App.tsx` (`handleConvert`) est la cible de coordination confirmée où les transitions d'état de l'UI et le comportement d'affichage sont décidés.
- `convertText` est le point principal d'analyse/traduction où la sémantique de réponse du backend est actuellement aplatie.

#### Déjà aligné/sûr par rapport à encore besoin d'un alignement de comportement de l'étape 3

- **Déjà aligné/sûr (pour la portée actuelle) :**
 - La propriété du flux est claire (`App.tsx` comme cible, `convertText` comme couche d'analyse).
 - Les composants de câblage de l'UI (`Panel.tsx`, `FormatSelector.tsx`) sont des présentations/sélecteurs et ne remodèlent pas indépendamment les contrats backend.

- ** Nécessite toujours un alignement de comportement de l'étape 3 :**
 - Consommation frontend sensible aux contrats des champs de réussite/échec standardisés à `convertText` étape d'analyse/de traduction.
 - Coordination de l'état/affichage de l'UI sensible au contrat dans `App.tsx` afin que la sémantique des résultats soit représentée sans s'appuyer sur une heuristique de chaîne ad hoc.

#### Note de priorisation

- L'incohérence la plus prioritaire à résoudre en premier est **l'aplatissement du chemin d'échec dans `convertText`** (échec structuré réduit à `detail` et heuristique de sous-chaîne), car il s'agit du premier point frontal où la sémantique standardisée des échecs backend est actuellement perdue.

La définition du comportement frontal cible commence à la sous-étape 3.3.1.

### Étape 3.3.1 — Cibler le chemin de réussite frontal/UI Comportement (AsciiDoc -> Markdown)

Cette sous-étape définit le comportement frontend/UI du chemin de réussite cible pour l'alignement de l'étape 3 sur la cible de coordination frontend confirmée.

- Chemin migré : **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Étape 3 confirmée cible d'alignement : `api/frontend/src/App.tsx` (`handleConvert`)

#### Cibler les attentes en matière de comportement du chemin de réussite (lorsque le backend renvoie un succès standardisé `ConversionResult`)

Lorsque le chemin du backend migré renvoie un **succès** standardisé `ConversionResult`, la cible d'alignement de l'étape 3 doit :
- **Utiliser le résultat standardisé comme source de vérité** :
 - traiter `success === true` comme le succès condition, pas une heuristique locale.
 - conserver `success:true -> error:null` la cohérence sémantique.
- **Rendre la sortie cohérente avec le résultat de réussite** :
 - afficher la sortie convertie uniquement lorsque le résultat de réussite est cohérent avec le contrat (par exemple, une sortie significative est disponible pour que l'UI puisse être restituée).
 - éviter de présenter la sortie obsolète/précédente comme s'il s'agissait de la conversion réussie actuelle. résultat.
- **Préserver les informations de réussite significatives du backend** (ne pas remplacer par des hypothèses ad hoc) :
 - garder le contexte disponible (par exemple `conversionId`, `warnings`, `logs`, `durationMs`, horodatages, `meta`) accessible à des fins d'UI/d'état, même si tous les champs ne sont pas affichés dans l'UI initialement.
- **Gardez les transitions de l'UI du chemin de réussite prévisibles** :
 - `loading` / les transitions de statut / notification doivent refléter le résultat de réussite standardisé reçu.
 - les commentaires sur la réussite doivent être liés à la même tentative de conversion dont le résultat est affiché.

#### Consommation et rendu acceptables du chemin de réussite behavior

- Utiliser `success === true` comme condition de succès lorsqu'un résultat standardisé est disponible.
- Rendre la sortie Markdown convertie dans la zone de résultat prévue une fois le résultat de succès standardisé reçu et cohérent.
- Afficher un état d'UI de « succès » propre (statut/notification) après la réception du résultat de succès standardisé.
- Lecture des métadonnées standardisées. (par exemple `warnings`, `logs`, `durationMs`, `conversionId`) pour les besoins auxiliaires de l'UI/de l'état sans remodeler le résultat dans un modèle hérité.

#### Comportement de chemin de réussite inacceptable à ce niveau

- Traiter une demande comme réussie sans s'appuyer sur le standardisé résultat de réussite du backend lorsqu'il existe.
- Masquer les résultats de réussite manquants/incohérents en affichant quand même un état d'UI « succès ».
- Garder la sortie de réussite obsolète visible comme s'il s'agissait de la sortie de conversion actuelle lorsque la demande actuelle n'a pas produit le résultat affiché.
- Reconstruire un « objet de réussite » hérité/ad hoc à partir de données partielles qui ignorent les champs et la sémantique standardisés.
- Ignorer les champs standardisés pertinents qui sont déjà disponibles et nécessaires. pour une cohérence correcte de l'état de l'UI (par exemple, ignorer l'identité de conversion lors de la prévention de l'affichage obsolète).

Le comportement frontal du chemin de défaillance cible sera défini à la sous-étape 3.3.2.

### Étape 3.3.2 — Comportement frontal/UI du chemin de défaillance cible (AsciiDoc -> Markdown)

Cette sous-étape définit le comportement frontal/UI du chemin de défaillance cible pour l'alignement de l'étape 3 sur la cible de coordination frontend confirmée.

- Chemin migré : **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Cible d'alignement confirmée de l'étape 3 : `api/frontend/src/App.tsx` (`handleConvert`)

#### Attentes de comportement du chemin d'échec cible (lorsque le backend renvoie un échec standardisé `ConversionResult`)

Lorsque le chemin du backend migré renvoie un **échec** standardisé `ConversionResult`, la cible d'alignement de l'étape 3 doit :
- **Utiliser le résultat d'échec standardisé comme source de vérité** :
 - traite `success === false` plus un objet structuré non nul `error` comme condition d'échec.
 - préserve `error.code` et `error.message` comme identité d'échec principale (ne les remplacez pas par des chaînes locales génériques).
- **Préserve les informations d'échec structurées pour l'UI/l'état** :
 - conserve un backend significatif champs disponibles pour la couche d'UI (par exemple `conversionId`, `error.code`, `error.details`, `warnings`, `logs`, horodatages et `meta`) même si seul un sous-ensemble est affiché initialement.
 - préférez une interprétation limitée et sécurisée de l'UI à la reconstruction d'une erreur héritée model.
- **Représenter les résultats d'échec de manière cohérente dans l'UI** :
 - afficher un état d'échec dérivé du résultat structuré du backend (message et, le cas échéant, gestion basée sur le code).
- évitez de traiter une conversion échouée comme un succès partiel en raison d'hypothèses locales.
- **Empêchez les fausses déclarations de réussite** :
 - ne laissez pas la sortie réussie antérieure visible *comme s'il s'agissait du résultat de l'échec de la conversion*.
 - assurez-vous que l'UI indique clairement que la dernière tentative a échoué (même si la dernière bonne sortie connue reste disponible en tant que « résultat précédent »).
- **Conserver transitions de l'UI du chemin d'échec prévisibles** :
 - `loading` / statut / notification / transitions modales doivent refléter le résultat d'échec standardisé reçu.
 - le retour d'échec doit être lié à la même tentative de conversion dont le résultat est représenté.

#### Consommation et comportement de rendu du chemin d'échec acceptables

- Utilisation de `success === false` avec structuré `error` (y compris `error.code`) comme condition d'échec lorsqu'un résultat standardisé est disponible.
- Affichage d'un message d'échec lisible dérivé des informations d'erreur structurées fournies par le backend (par exemple `error.message`), éventuellement complétées par le contexte sûr de `error.details`.
- Utilisation de `error.code` pour des décisions d'UI limitées et explicites, le cas échéant (par exemple, choisir entre un modal « corrigez votre entrée » et un toast d'erreur générique), sans compter sur l'heuristique de sous-chaîne lorsqu'un code est disponible.
- Garder le panneau de résultats dans un état de sécurité lorsqu'aucune sortie actuelle valide n'existe (n'implique pas qu'une nouvelle conversion réussie s'est produite).
- Préserver la sémantique d'échec structurée dans l'état afin que la normalisation ultérieure de l'UI puisse rester. conscient du contrat.

#### Comportement inacceptable du chemin d'échec à ce niveau

- Aplatissement d'une défaillance backend standardisée dans un modèle d'erreur local uniquement composé de chaînes (par exemple, consommation uniquement `detail` et rejet de `error.code`).
- Suppression de `error.code` là où il est pertinent de corriger l'UI interprétation et travail d'alignement ultérieur.
- Traiter un échec de conversion comme un succès (ou un « succès avec avertissements ») sans que le résultat standardisé prenne en charge cette sémantique.
- Laisser la sortie précédente obsolète visible d'une manière qui implique qu'elle appartient à la tentative de conversion échouée.
- Reconstruire un objet d'erreur frontend hérité à partir de données partielles tout en ignorant l'échec standardisé du backend structure.

Le comportement de l'état intermédiaire/chargement/frontend (par exemple, transitions de conversion en cours et règles de réinitialisation) sera défini à la sous-étape 3.3.3.

### Étape 3.3.3 — Modèle d'état du front-end cible (inactif/chargement/succès/erreur) (AsciiDoc -> Markdown)

Cette sous-étape définit le modèle d'état intermédiaire/front-end cible pour l'alignement de l'étape 3 sur la cible de coordination front-end confirmée.

- Chemin migré : **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Cible d'alignement confirmée à l'étape 3 : `api/frontend/src/App.tsx` (`handleConvert`)

#### Définitions d'état (signification prévue et contraintes)

- **`idle`**
 - **Représente** : non tentative de conversion active en vol ; aucun nouveau résultat backend n'est actuellement en cours de traitement.
 - **Entrez quand** : chargement initial de l'application ; après qu'une tentative de conversion a été entièrement résolue et que les indicateurs transitoires se sont stabilisés ; une fois que l'utilisateur a effacé/rejeté les commentaires transitoires.
 - **Afficher/préserver** : UI stable ; le dernier contenu connu peut rester visible, mais ne doit pas impliquer qu'une nouvelle conversion vient d'avoir lieu.
 - **Éviter** : les indicateurs persistants de « chargement », « succès » ou « erreur » qui font référence à une tentative passée comme si elle était en cours.

- **`loading`**
 - **Représente** : une tentative de conversion est en cours (demande en cours / résultat en attente).
 - **Entrez quand** : la demande de conversion est initiée pour la tentative en cours.
 - **Afficher/préserver** : effacer l'indication en cours ; désactiver/garder les actions selon les besoins ; conserver le dernier contenu connu mais ne pas le présenter comme le résultat de la tentative en cours.
 - **Éviter** : implique l'achèvement ; afficher un indicateur de réussite avant qu'un résultat de réussite standardisé ne soit reçu ; états ambigus de « demi-succès ».

- **`success`**
 - **Représente** : la tentative de conversion actuelle terminée avec un succès standardisé cohérent `ConversionResult` et une sortie cohérente pour l'affichage.
 - **Entrez quand** : un résultat standardisé pour la tentative en cours est reçu avec `success === true` (et une sémantique de succès cohérente avec le contrat).
- **Afficher/préserver** : afficher la sortie convertie comme résultat actuel ; indicateurs d'erreur antérieurs clairs ; éventuellement faire apparaître des métadonnées liées au succès (par exemple des avertissements) sans les remodeler.
 - **Éviter** : déclarer le succès sans un résultat de succès standardisé et cohérent ; présentant la sortie obsolète comme sortie de la tentative actuelle.

- **`error`**
 - **Représente** : la tentative de conversion actuelle terminée avec un échec standardisé cohérent `ConversionResult`.
 - **Entrez quand** : un résultat standardisé pour la tentative en cours est reçu avec `success === false` et structuré `error` (y compris `error.code`).
 - **Afficher/préserver** : afficher un état d'échec dérivé des informations d'erreur structurées du backend ; préserver l'identité d'échec pour la cohérence de l'UI/de l'état (par exemple `error.code`) ; assurez-vous que l'UI communique que la dernière tentative a échoué.
 - **Éviter** : aplatir l'échec dans un état générique de chaîne uniquement ; masquer l'échec avec une UI réussie ; montrant une sortie antérieure obsolète *comme si elle avait été produite par la tentative échouée*.

#### Transitions d'état de haut niveau attendues

- `idle -> loading` : lorsque l'utilisateur lance une conversion.
- `loading -> success` : lorsque la tentative en cours renvoie un résultat de réussite standardisé et cohérent.
- `loading -> error` : lorsque la tentative en cours renvoie un résultat d'échec standardisé et cohérent.
- `success -> loading` : lorsqu'une nouvelle conversion commence après un succès précédent.
- `error -> loading` : lorsqu'une nouvelle conversion commence après un échec précédent.
- `success -> idle` / `error -> idle` : lorsque les indicateurs transitoires sont rejetés/effacés et qu'aucune tentative n'est en cours vol.

#### Comportement d'état acceptable ou inacceptable

- **Acceptable**
 - Entrez `loading` immédiatement lorsqu'une tentative de conversion démarre.
 - Effacez ou rétrogradez visuellement les indicateurs antérieurs trompeurs lorsqu'une nouvelle tentative démarre (par exemple, le « succès » antérieur ne doit pas apparaître comme l'actuel succès de la tentative).
 - Entrez `success` uniquement lorsque la tentative en cours a produit un résultat de réussite standardisé cohérent.
 - Entrez `error` uniquement lorsque la tentative en cours a produit un résultat d'échec standardisé cohérent.

- **Inacceptable**
 - Rester visuellement dans un état de « succès » précédent lors d'une nouvelle tentative `loading` sans distinction claire.
 - Afficher la sortie de réussite obsolète comme si elle appartenait à la conversion échouée actuelle.
 - Traiter l'achèvement de la demande comme un succès sans lire la sémantique de résultat standardisée.
 - Garder les indicateurs contradictoires actifs simultanément (par exemple, « succès » et « erreur » représentent tous deux la tentative en cours).

La sous-étape 3.3.4 définira la limite d'enrichissement/d'interprétation du frontend pour un comportement de l'UI sécurisé par les contrats.

### Étape 3.3.4 — Limite d'enrichissement et d'interprétation du frontend (AsciiDoc -> Markdown)

Cette sous-étape définit ce que le frontend peut interpréter, enrichir et normaliser de manière minimale en toute sécurité à partir d'un backend standardisé `ConversionResult` sans rompre la sémantique du contrat.

- Chemin migré : **AsciiDoc -> Markdown** (`POST /api/to-markdown`, `downdoc`)
- Étape confirmée 3 cibles d'alignement : `api/frontend/src/App.tsx` (`handleConvert`)

#### Comportements d'interprétation/enrichissement frontend acceptables

- Dériver le résultat de l'UI (`success`/`error`) à partir de la sémantique de résultat standardisée (`success` plus structuré `error` lorsque 
- Rendre la sortie convertie dans la zone de résultat prévue à partir des données de conversion fournies par le backend pour la tentative en cours.
- Afficher les informations d'échec lisibles dérivées des champs structurés d'échec du backend (principalement `error.message`, éventuellement `error.details`).
- Utiliser les valeurs `error.code` documentées pour des décisions limitées et explicites de l'UI, le cas échéant.
- Métadonnées/contexte de journal du backend auxiliaire de surface (`warnings`, `logs`, `durationMs`, `conversionId`, horodatages, `meta`) pour l'UI/contexte de prise en charge sans modifier la sémantique principale.
- Ajoutez un enrichissement purement présentationnel (étiquettes, icônes, états de couleur, texte du badge) qui ne modifie pas le backend sens.

#### Comportements de normalisation minimaux acceptables (sans danger pour les contrats)

- Mappez les champs backend standardisés dans les champs de modèle de vue/état locaux tout en préservant la sémantique d'origine.
- Préservez les structures de tableau/objet (`warnings`, `logs`, `meta`, structuré `error`) lors de l'adaptation des données pour display.
- Calcule les booléens de présentation (par exemple `isSuccessState`, `isErrorState`) à partir de la sémantique de résultat standardisée sans ignorer les données structurées source.
- Supprime ou rétrograde les artefacts d'affichage obsolètes lorsqu'un résultat plus récent remplace un résultat plus ancien, tout en conservant la cohérence des tentatives de conversion.

#### Inacceptable comportements de remodelage/aplatissement/invention

- Reconstruire un modèle de résultat de conversion frontal ad hoc hérité tout en ignorant la structure de résultat backend standardisée.
- Aplatir le `error` structuré en un modèle local générique opaque composé uniquement de chaînes.
- Remplacer la sémantique `error.code` par des suppositions locales arbitraires ou des heuristiques de sous-chaîne de message lorsque un code structuré est disponible.
- Traiter les heuristiques locales incomplètes comme faisant plus autorité que la sémantique des résultats du backend.
- Déduire le succès/l'échec à partir d'un état de l'UI sans rapport lorsque le résultat du backend définit déjà la sémantique des résultats.
- Masquer ou supprimer les champs backend significatifs nécessaires aux transitions d'état cohérentes et à l'interprétation de l'UI.
- Présenter une sortie obsolète ou des erreurs obsolètes. comme s'ils appartenaient à la tentative de conversion en cours.

La correction du runtime commence à la sous-étape 3.4.1.

### Étape 3.6.1 — Résumé de l'alignement de l'étape 3 (AsciiDoc migré -> Markdown)

Cette sous-étape résume les résultats concrets de l'alignement frontend/UI réalisés à l'étape 3 pour le AsciiDoc -> Chemin Markdown (`downdoc`) déjà migré.

Alignement à l'étape 3 (résultats techniques frontend/UI) :
- Confirmé `api/frontend/src/App.tsx` (`handleConvert`) comme cible d'alignement frontend/UI de l'étape 3 pour le chemin migré.
- Établissement d'une consommation standardisée de résultat d'échec au niveau de cette couche (sémantique de succès liée à des données de réussite cohérentes du backend `ConversionResult` pour la tentative en cours).
- Établissement d'une consommation standardisée de résultat d'échec au niveau de cette couche (sémantique structurée d'échec du backend préservée, y compris une gestion significative de `error` et pertinente de `error.code`).
- Comportement de l'état frontal intermédiaire aligné (`idle` / `loading` / `success` / `error`) avec des transitions cohérentes liées aux tentatives.
- Réduction des résultats/erreurs du frontend hérités/ad hoc sur le chemin migré (moins d'aplatissement des chaînes uniquement et moins de gestion des résultats uniquement heuristiques là où une sémantique backend structurée est disponible).
- Vérification que la sémantique backend standardisée survit à travers le flux frontend réel pour les deux tentatives de réussite et d'échec.
- Préservation vérifiée de la sémantique backend standardisée jusqu'à la limite de sortie effective de l'UI (visibilité des résultats, visibilité des erreurs et cohérence de l'état pour la tentative en cours).
- Couverture de scénarios frontend représentatifs de bout en bout élargie au-delà d'une seule paire succès/échec pour le chemin migré.

Alignement frontend/UI vs. rester hors de portée :
- Aligné : consommation du frontend, transitions d'état et cohérence visible des résultats/erreurs pour le flux AsciiDoc -> Markdown migré au niveau de la couche cible confirmée.
- Non inclus dans le champ d'application (pour cette sous-étape) : alignement d'autres flux de conversion, refonte de l'architecture globale de l'UI et harmonisation plus large du comportement du frontend au-delà du chemin migré.

Suivant : la sous-étape 3.6.2 documentera l'alignement du frontend réutilisable. modèle dérivé de ces résultats confirmés de l'étape 3.

### Étape 3.6.2 — Modèle d'alignement frontend/UI réutilisable (AsciiDoc migré -> Markdown)

Cette sous-étape documente le modèle d'alignement frontend/UI réutilisable de l'étape 3 validé sur le chemin AsciiDoc -> Markdown déjà migré (`downdoc`).

Séquence réutilisable (modèle pratique) :
- Identifiez la véritable cible d'alignement frontend/UI où les résultats de conversion sont coordonnés au-dessus du transport brut de l'API.
- Mappez les flux d'UI nominaux et orientés échec pour le chemin sélectionné, y compris le comportement des limites de sortie visibles.
- Identifiez les points de risque de contrat frontend où la sémantique structurée du backend peut être aplatie, ignorée, ou remplacé par des heuristiques ad hoc.
- Définir le comportement cible pour la consommation de succès, la consommation d'échec, les transitions d'état (`idle` / `loading` / `success` / `error`) et les limites d'interprétation/enrichissement.
- Corriger la consommation de succès-résultat afin que la sémantique standardisée du succès du backend devienne la source de vérité.
- Corrigez la consommation des résultats d’échec afin que la sémantique structurée des échecs du backend (y compris un `error.code` significatif) soit préservée.
- Corriger les transitions d'état intermédiaire/frontend pour supprimer les indicateurs obsolètes/conflits lors de tentatives répétées.
- Vérifier le comportement au niveau de la cible d'alignement confirmée.
- Vérifier le succès de bout en bout et le comportement d'échec de bout en bout pour le même chemin migré.
- Élargir la couverture des scénarios représentatifs avec un ensemble minimal de contrôles frontend maintenables.
- Vérifier que la sémantique backend standardisée demeure cohérent au niveau de la limite de sortie effective de l'UI.

Pourquoi ce modèle est important :
- Il empêche les refactorisations prématurées de l'UI en limitant le travail à une cible d'alignement confirmée et à un chemin migré à la fois.
- Il maintient l'alignement du front-end localisé, testable et vérifiable.
- Il préserve la sémantique du back-end via la couche d'UI au lieu de reconstruire l'héritage local. sens.

Comment les futurs flux frontend/UI devraient appliquer ce modèle :
- Aligner un chemin de conversion à la fois.
- Documenter le comportement du flux nominal/échec avant de larges changements de mise en œuvre.
- Consommer les résultats structurés du backend comme source de vérité.
- Préserver la sémantique de réussite/échec au lieu de les remplacer par des résultats locaux. heuristiques.
- Vérifier à la fois le comportement de la couche cible et le comportement visible de bout en bout avant d'étendre la portée.

Suivant : la sous-étape 3.6.3 formalisera la définition de Terminé pour l'étape 3 sur la base de ces résultats confirmés.

### Étape 3 Définition de Terminé (version 0.0.1.4.6)

L'étape 3 est considérée comme terminée uniquement lorsque tous les critères ci-dessous sont satisfaits pour le chemin AsciiDoc -> Markdown déjà migré :

- La véritable cible d'alignement frontend/UI a été identifiée.
- Le flux frontal/UI nominal a été cartographié.
- Le flux frontend/UI orienté échec a été cartographié.
- Les points de risque du contrat frontend ont été identifiés.
- Le comportement frontal du chemin de réussite cible a été défini.
- Le comportement frontal du chemin d'échec cible a été défini.
- Le comportement de l'état frontal cible `idle / loading / success / error` a été défini. définies.
- Les limites acceptables d'interprétation, d'enrichissement et de normalisation du frontend ont été définies.
- La cible d'alignement frontend confirmée consomme correctement les objets backend standardisés `ConversionResult` réussis pour le chemin migré.
- La cible d'alignement frontend confirmée consomme correctement les objets backend standardisés `ConversionResult` en échec pour le chemin migré.
- La cible d'alignement frontend confirmée gère L'état du frontend évolue de manière cohérente pour le chemin migré.
- La mise en forme ad hoc des résultats/erreurs du frontend a été réduite ou supprimée au niveau de cette couche pour le chemin migré.
- La vérification de la réussite du frontend de bout en bout passe par le flux réel.
- La vérification des échecs du frontend de bout en bout passe par le flux réel.
- Une couverture représentative du scénario frontend de bout en bout existe pour le chemin migré. chemin.
- La sémantique back-end standardisée survit jusqu'à la limite de sortie effective de l'UI pour le chemin migré.
- Le modèle d'alignement frontal réutilisable de l'étape 3 a été documenté.

Ce que l'étape 3 n'exige **pas** :
- Migration de tous les flux de conversion frontend.
- Refonte de l'ensemble de l'UI.
- Migration de tous les convertisseurs.
- Large refonte de l'architecture/de la gestion de l'état.
- Refonte du contrat backend.

Pourquoi cette définition de Terminé est importante :
- Il marque la transition d'une normalisation back-end uniquement vers la préservation front-end de la sémantique standardisée.
- Il supprime toute ambiguïté sur les critères de fermeture de l'étape 3.
- Il établit une base de référence claire pour le travail ultérieur de l'UI sans rouvrir les questions d'alignement déjà réglées pour ce chemin migré.

### Résumé de l'achèvement de l'étape 3

Étape 3 note de clôture (version `0.0.1.4.6`) : L'étape 3 a réussi à établir un comportement frontend/UI aligné sur le contrat pour l'AsciiDoc déjà migré -> chemin d'exécution Markdown (`downdoc`).

#### A. Ce que l'étape 3 a réalisé
- Préservation frontend/UI établie de la sémantique backend standardisée `ConversionResult` pour le premier runtime migré path.
- Réduction/suppression des résultats/erreurs du frontend ad hoc hérités sur le chemin migré.
- Alignement du chemin de réussite, du chemin d'échec et du comportement de l'état du frontend au niveau de la couche de coordination de l'UI confirmée.
- Validation de bout en bout terminée pour que la sémantique backend standardisée survive à travers le flux frontend réel.

#### B. Qu'est-ce que le concret L'adoption du frontend a été réalisée
- Le chemin AsciiDoc -> Markdown est désormais préservé non seulement dans les couches backend, mais également à travers la couche de coordination frontend/UI environnante.
- Le succès et l'échec restent sémantiquement alignés à travers le flux frontend réel pour ce chemin migré.
- La limite de sortie effective de l'UI préserve désormais la sémantique backend standardisée pour ce chemin migré.
- Représentant de bout en bout. La vérification du frontend a été effectuée pour ce chemin.

#### C. Ce que l'étape 3 fournit désormais au projet
- Une base de référence validée pour la préservation de la couche frontend pour une sémantique de conversion standardisée.
- Un modèle d'alignement frontend/UI réutilisable pour les futurs alignements de flux.
- Un chemin de référence plus solide pour les migrations ultérieures de flux frontend/backend.
- Un nettoyeur base pour les travaux ultérieurs d’amélioration de l’UI.

#### D. Ce qui reste en dehors de l'étape 3
- L'achèvement de l'étape 3 n'implique pas que tous les flux frontend sont alignés.
- L'achèvement de l'étape 3 n'implique pas que l'ensemble de l'UI a été repensé.
- L'achèvement de l'étape 3 n'implique pas que tous les convertisseurs/flux sont migrés.
- L'achèvement de l'étape 3 n'implique pas un frontend plus large. La refonte de l'architecture/de la gestion de l'état est terminée.
- L'achèvement de l'étape 3 n'implique pas que le futur raffinement de l'UX est terminé.

#### E. Note de transition
- Les travaux futurs devraient s'appuyer sur la base de référence des étapes 1 + 2 + 3 et éviter de rouvrir les questions de contrat, d'alignement du backend et de premier alignement de l'UI déjà validées pour les personnes migrées. AsciiDoc -> Chemin Markdown.

### Étape 4.1.1 — Chemins candidats pour la deuxième vague de migration réelle

L'étape 4 commence par identifier les chemins de conversion candidats plausibles pour la deuxième vague de migration réelle après le chemin AsciiDoc -> Markdown terminé.

Chemins candidats plausibles (fondés sur les données actuelles base de code):

| Parcours candidat | État de préparation actuel/pertinence | Pourquoi s'agit-il d'un candidat plausible à l'étape 4 |
|---|---|---|
| **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`) | Niveau de préparation élevé ; route backend dédiée explicite et convertisseur frontend dédié (`markdown-to-asciidoc.ts`) déjà utilisés dans des modèles similaires au chemin migré. | Frère le plus proche du premier chemin migré (paire bidirectionnelle), portée limitée, valeur représentative élevée pour valider la répétabilité du même modèle. |
| **Texte brut -> Markdown** (`POST /api/text-to-markdown`, module `text2markdown`) | État de préparation moyen-élevé ; route backend explicite + module de chargement paresseux dédié + mappage de endpoint générique explicite du frontend. | Comportement du convertisseur petit/confiné avec des limites claires ; bon candidat à faible risque pour une deuxième vraie migration avec contrôles de préservation du contrat. |
| **HTML -> format cible (notamment HTML -> Markdown)** (`POST /api/from-html`) | Préparation moyenne ; Une route backend dédiée existe et un convertisseur générique frontend mappe les conversions HTML à ce endpoint. | Chemin de production réel avec différentes caractéristiques d'entrée ; valeur représentative utile pour tester la réutilisation du modèle au-delà de la forme texte uniquement AsciiDoc/Markdown. |
| **Conversions génériques sécurisées via `/api/convert`** (`fromFormat`/`toFormat` avec jeton) | État de préparation moyen mais portée large ; la route et le chemin frontal existent, soutenus par un flux de conversion sécurisé. | Famille de candidats plausible mais plus large ; utile pour une expansion ultérieure après la validation d’une migration limitée du deuxième chemin. |

Remarque : la cible de migration principale de l'étape 4 sera sélectionnée à la sous-étape 4.1.2.

### Étape 4.1.2 — Sélection de la cible de migration principale de l'étape 4

Cette sous-étape sélectionne la cible de migration principale unique pour la deuxième véritable étape 4 de bout en bout wave.

Cible principale sélectionnée :
- **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)

Pourquoi ce chemin est sélectionné par rapport aux autres candidats :
- Il a une disponibilité actuelle élevée dans les couches backend et frontend (route backend dédiée et chemin de conversion frontend dédié déjà présents).
- Il est le candidat le plus limité et le moins risqué parmi les chemins existants réels, avec une portée claire et une ambiguïté limitée.
- Il s'agit du complément fonctionnel le plus puissant du premier chemin migré (`adoc -> md`), fournissant une contrepartie quasi symétrique avec une forme opérationnelle similaire.

Pourquoi il s'agit d'un deuxième objectif de migration fort pour la généralité du modèle :
- Il valide que l'étape 1/l'étape 2/l'étape 3 Le modèle de migration/alignement est réutilisable sur un deuxième chemin réel suffisamment proche pour une comparaison contrôlée mais suffisamment distinct pour tester la répétabilité.
- Il fournit une valeur représentative élevée pour le comportement de conversion de document bidirectionnel sans nécessiter de changements d'architecture importants.
- Il offre une base de référence pratique avant de s'étendre à des familles plus larges ou plus hétérogènes (par exemple, des combinaisons génériques `/api/convert`).

Remarque : confirmation officielle de l'objectif de l'étape 4. sera complété à la sous-étape 4.1.3.

### Étape 4.1.3 — Confirmation officielle de l'objectif de l'étape 4

Cette sous-étape confirme formellement l'objectif officiel de migration de l'étape 4 pour la deuxième véritable vague de migration de bout en bout.

Cible officielle confirmée de l'étape 4 :
- **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)

Pourquoi il s'agit de l'objectif correct de l'étape 4 :
- Il s'agit du candidat le plus solide de l'ensemble identifié, avec des chemins backend/frontend dédiés déjà en place et une portée de migration limitée.
- Il fournit une contrepartie quasi symétrique au premier chemin migré (`adoc -> md`), permettant une comparaison et une validation de répétabilité techniquement robuste.

Ce que l'étape 4 validera à travers cette cible :
- Réutilisation du contrat standardisé `ConversionResult` sur un deuxième chemin de convertisseur réel.
- Réutilisation de la sémantique centralisée d'aide aux résultats et de la sémantique standardisée des codes d'erreur.
- Réutilisation de la méthode d'alignement backend/orchestrateur sur un deuxième runtime. flow.
- Réutilisation de la méthode d'alignement frontend/UI pour préserver la sémantique de la limite de sortie effective de l'UI.
- Confirmation que le modèle de migration/alignement est réutilisable au-delà d'un seul chemin.

Remarque : le mappage détaillé du flux de convertisseur pour cette cible confirmée commence à la sous-étape 4.2.1.

### Étape 4.2.1 — Actuelle Mappage du flux d'exécution avant l'intégration de l'assistant (Markdown -> AsciiDoc)

Cette sous-étape mappe le comportement d'exécution actuel de la cible confirmée de l'étape 4 avant le mappage de la charge utile aux `ConversionResult` helpers centralisés.

- Deuxième cible de migration sélectionnée : **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)

Flux d'exécution actuel (fondé, étape par étape) :
1. **Point d'entrée** : `api/backend/routes/conversion.routes.js`, itinéraire `POST /to-asciidoc`.
2. **Demande de validation** : le niveau de route `validate(...)` nécessite `body.text` comme chaîne non vide (`z.string().min(1)`).
3. **Pré-vérification de l'itinéraire** : si `!text.trim()`, le gestionnaire renvoie HTTP `400` avec `{ detail: "The text to convert is empty" }`.
4. **Envoi de conversion** : acheminer les appels `convertMarkdownWithPandoc(text)` à partir de `api/backend/services/conversion/convert.js`.
5. **Gestion des entrées du convertisseur** (`convertMarkdownWithPandoc`) :
 - valide l'entrée de démarque (`non-empty string`),
 - crée un espace de travail temporaire (`ascend-pandoc-*`),
 - écrit `input.md`,
 - prépare `output.adoc`.
6. **Exécution** : exécute Pandoc jusqu'à `safeSpawn('pandoc', ['-f','markdown','-t','asciidoc','-o', outputFile, inputFile], timeout 30000ms)`.
7. **Branche de réussite** :
 - lit `output.adoc`,
 - applique la normalisation du formatage léger (`trimEnd() + '\n'`),
 - renvoie la chaîne AsciiDoc à router.
8. **Réponse de réussite de l'itinéraire** :
 - enregistre le succès,
 - renvoie HTTP `200` avec `{ asciidoc: <converted string> }`.
9. **Branche d'échec dans le convertisseur** :
 - erreur de sécurité d'expiration -> lance `Error('Pandoc conversion timed out')`,
 - autres échecs -> lance `Error('Failed to execute Pandoc conversion')`,
 - les fichiers/répertoires temporaires sont nettoyés en `finally`.
10. **Réponse en cas d'échec d'itinéraire** :
- détecte l'erreur générée,
 - enregistre l'erreur,
 - renvoie HTTP `500` avec `{ detail: "Conversion error: ..." }`.

Forme actuelle du chemin de réussite :
- HTTP `200` Charge utile JSON : `{ asciidoc: string }` (charge utile du résultat de la chaîne, pas encore d'enveloppe `ConversionResult` standardisée à ce sujet chemin cible).

Forme actuelle du chemin d'échec :
- Les échecs de validation/pré-vérification HTTP `400` et les échecs de conversion/d'exécution HTTP `500` utilisent des réponses `{ detail: string }` au niveau de la route.
- Les informations sur les échecs sont principalement basées sur des chaînes à la sortie de la route pour cela. path.

Observation pertinente pour l'intégration (fondée) :
- Cette cible suit actuellement un modèle de route directe + convertisseur-chaîne-retour (`{ asciidoc }` / `{ detail }`) plutôt que la forme `ConversionResult` standardisée construite par une assistante utilisée dans le premier chemin migré ; il s'agit de la principale lacune d'intégration pour le mappage des assistants de l'étape 4 à venir.

Suivant : le mappage de la charge utile vers les assistants centralisés pour cette cible confirmée commence à la sous-étape 4.2.2.

### Étape 4.2.2 — Mappage de la charge utile vers les assistants centralisés (Markdown -> AsciiDoc)

Cette sous-étape définit le mappage de charge utile pour la cible confirmée de l'étape 4 avant l'intégration de l'assistant d'exécution.

- Deuxième cible de migration sélectionnée : **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)

#### Mappage de charge utile du chemin de réussite (`createSuccessResult(payload)`)

| Champ de charge utile de l'assistant | Source d'exécution actuelle | Note de mappage d'intégration |
|---|---|---|
| `conversionId` | Non créé actuellement dans le chemin `/to-asciidoc` | Dérivez localement au moment de l'intégration (générez un ID par tentative dans la couche route/service). |
| `converter` | L'itinéraire utilise Pandoc via `convertMarkdownWithPandoc(...)` | Définissez sur `"pandoc"` pour ce chemin cible. |
| `pipeline` | Implicite dans l'appel de route + convertisseur | Définissez sur `["markdown->asciidoc"]` (identité du chemin délimité). |
| `inputFormat` | L'itinéraire est explicitement la source Markdown | Réglez sur `"markdown"`. |
| `outputFormat` | La cible de la route est AsciiDoc | Réglez sur `"asciidoc"`. |
| `inputFile` | `convertMarkdownWithPandoc` écrit temp `input.md` | Dérivez du contexte du fichier d'entrée temporaire lors de l'intégration (`originalName`, `storedPath`, `size`, `mimeType`) pendant que le fichier existe toujours. |
| `outputFile` | `convertMarkdownWithPandoc` écrit temp `output.adoc` | Dérivez du contexte du fichier de sortie temporaire avant le nettoyage (chemin/taille/mime). |
| `startedAt` | Pas actuellement suivi | Dérivé de l'horodatage local capturé au démarrage de la tentative. |
| `finishedAt` | Pas actuellement suivi | Dérivé de l'horodatage local capturé à la fin de la tentative. |
| `durationMs` | Pas actuellement suivi | Dérivez de `finished - started` en millisecondes. |
| `warnings` | Aucune liste d'avertissements actuellement émise dans ce chemin | Utilisez l'assistant par défaut (`[]`) à moins que des avertissements explicites ne soient ajoutés ultérieurement. |
| `logs` | Acheminer actuellement les journaux via `console.log` uniquement | Mappez un tableau de journaux limité par tentative (ou l'assistant par défaut `[]` s'il n'est pas collecté lors de l'étape d'intégration). |
| `meta` | Aucun objet de métadonnées structurées actuellement renvoyé | Utilisez l'assistance par défaut (`{}`) ou des métadonnées techniques minimales si disponibles. |

#### Cartographie de la charge utile du chemin de défaillance (`createFailureResult(payload)`)

| Champ de charge utile de l'assistant | Source d'exécution actuelle | Note de mappage d'intégration |
|---|---|---|
| `conversionId` | Non créé actuellement dans le chemin `/to-asciidoc` | Dérivez localement au moment de l'intégration (même ID de tentative que le modèle de chemin de réussite). |
| `converter` | Un échec se produit dans le chemin basé sur Pandoc | Réglez sur `"pandoc"`. |
| `pipeline` | Implicite dans le chemin sélectionné | Réglez sur `["markdown->asciidoc"]`. |
| `inputFormat` | Le format de la source de l'itinéraire est Markdown | Réglez sur `"markdown"`. |
| `outputFormat` | Le format de destination de l'itinéraire est AsciiDoc | Réglez sur `"asciidoc"`. |
| `inputFile` | Temp `input.md` existe pendant l'exécution du convertisseur | Dérivez du contexte d'entrée temporaire disponible (ou de l'objet de secours si l'échec se produit avant la création du fichier). |
| `startedAt` | Pas actuellement suivi | Dérivé de l'horodatage local de la tentative de démarrage. |
| `finishedAt` | Pas actuellement suivi | Dérivé de l'horodatage local de fin de tentative. |
| `durationMs` | Pas actuellement suivi | Dérivez du temps écoulé jusqu'à la fin de l'échec. |
| `error` | Actuellement aplati pour être lancé `Error(...)` puis route `{ detail: ... }` | Créez un objet d'erreur structuré (`code`, `message`, `details`, `recoverable`) à partir du contexte d'échec connu au moment de l'intégration. |
| `outputFile` | La sortie temporaire peut ne pas exister en cas de panne ; route ne l'expose actuellement pas | Utilisez `null` par défaut ; inclure l'objet uniquement s'il existe un artefact de sortie fondé. |
| `warnings` | Aucune liste d'avertissement émise actuellement | Utilisez l'assistant par défaut (`[]`). |
| `logs` | Les journaux de console existent mais aucune charge utile de journal structurée par tentative | Cartographier les journaux de tentatives délimités s’ils sont collectés ; sinon, l'assistant par défaut (`[]`). |
| `meta` | Aucun objet de métadonnées structurées actuellement émis | Utilisez l'assistance par défaut (`{}`) ou des métadonnées de contexte d'erreur minimales si disponibles. |

Observations pertinentes pour l'intégration (fondées) :
- **Déjà directement disponible** : identité du chemin (`markdown -> asciidoc`), famille de convertisseurs (`pandoc`), texte converti (`asciidoc`) en cas de succès.
- **Nécessite une dérivation locale pendant l'intégration** : `conversionId`, champs de synchronisation, journal structuré collection et blocs `inputFile`/`outputFile` stables avant le nettoyage temporaire.
- **Actuellement manquant en tant que sortie d'exécution structurée** : objet `error` aligné sur l'assistant (`code/message/details/recoverable`) et champs `meta`/`warnings` normalisés.

Suivant : runtime l'intégration du chemin de réussite pour cette cible confirmée commence à la sous-étape 4.2.3.

### Étape 4.3.2 — Cartographie du flux backend/orchestrateur (deuxième chemin migré)

Cette sous-étape mappe le flux backend/orchestrateur du deuxième chemin migré via la cible d'alignement confirmée de l'étape 4.3.

- Deuxième chemin de conversion migré : **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)
- Cible d'alignement confirmée de l'étape 4.3 : `api/backend/routes/conversion.routes.js` (`/to-asciidoc` gestionnaire)

#### Flux backend nominal (orienté vers le succès)

1. La requête entre `POST /api/to-asciidoc` dans `conversion.routes.js`.
2. La validation au niveau de la route (`validate` + `zod`) applique `body.text` comme forme d'entrée de chaîne non vide.
3. La route crée un contexte de coordination par tentative (`conversionId`, `startedAt`, `startedAtMs`).
4. La route invoque `convertMarkdownWithPandoc(text)` à partir de `services/conversion/convert.js`.
5. Le convertisseur crée des fichiers temporaires (`input.md`, `output.adoc`) et exécute Pandoc via `safeSpawn(...)`.
6. Le convertisseur renvoie la chaîne AsciiDoc convertie à acheminer en cas d'exécution réussie.
7. L'itinéraire génère un résultat de réussite standardisé via `createSuccessResult(...)` (champs de charge utile mappés).
8. La route renvoie HTTP `200` avec à la fois `asciidoc` et `conversionResult` (propagation du contrat de réussite jusqu'à la limite).

#### Flux backend orienté échec

1. **Branche d'échec de pré-conversion** : entrée vide/tronquée-vide dans la vérification préalable de l'itinéraire.
2. La route crée un échec standardisé via `createFailureResult(...)` avec `EMPTY_INPUT` fondé.
3. La route renvoie HTTP `400` avec des champs d'échec `conversionResult` plus `detail` compatible avec l'héritage.
4. **Branche d'échec d'exécution/de conversion** : le convertisseur est lancé (échec pandoc/délai d'attente/autre exception interne).
5. Le bloc Route Catch classe le contexte d'erreur (`CONVERSION_FAILED` pour la classe d'exécution pandoc ; `INTERNAL_ERROR` pour la classe interne à la route inattendue).
6. La route crée un échec standardisé via `createFailureResult(...)`, y compris `error` structuré (`code/message/details`) et renvoie HTTP `500` avec `detail` aligné sur `error.message`.

#### Où le `ConversionResult` standardisé est créé pour la première fois dans ce chemin

- Le premier point de création est actuellement la cible d'alignement confirmée elle-même (`conversion.routes.js`) via :
 - `createSuccessResult(...)` en cas de succès,
 - `createFailureResult(...)` sur les branches de pré-vérification et d'échec de capture.

#### Propagation vers le haut à travers les couches backend

- Pour ce chemin, la propagation est courte et direct :
 - le gestionnaire de route reçoit la demande,
 - la fonction de conversion renvoie/lance,
 - la cible d'alignement crée un résultat standardisé,
 - la route renvoie la charge utile HTTP JSON finale.
- Aucune couche de répartition de registre/orchestre de module de chargement paresseux n'est traversée pour ce chemin sélectionné.

#### Risque de contrat fondé observations (état actuel)

- La création de résultats standardisés et le retour final se produisent tous deux au niveau de l'itinéraire ; cela centralise le contrôle, mais signifie également que la mise en forme de la couche de route définit directement l'intégrité du contrat pour ce chemin.
- `detail` compatible avec l'héritage est toujours ajouté dans les réponses aux échecs ; Le contrat reste préservé, mais la cohérence du wrapper doit rester surveillée lors des contrôles d'alignement ultérieurs.

Suivant : l'identification des points de risque contractuel et la définition du comportement cible pour cette cible backend/orchestrateur suivent à la sous-étape 4.3.3.

### Étape 4.3.3 — Points de risque contractuel et comportement cible du backend/orchestrateur (deuxième migration Path)

Cette sous-étape identifie les points de risque du contrat et définit le comportement cible du backend/orchestrateur pour le deuxième chemin migré avant la correction de l'exécution.

- Deuxième chemin de conversion migré : **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)
- Cible d'alignement confirmée de l'étape 4.3 : `api/backend/routes/conversion.routes.js` (`/to-asciidoc` gestionnaire)

#### Points exacts de risque contractuel (fondés)

| Composant/couche | Pourquoi c'est un point de risque contractuel | Type de risque |
|---|---|---|
| `api/backend/routes/conversion.routes.js` (`/to-asciidoc` response shaping) | La création des résultats finaux standardisés et la mise en forme de la charge utile HTTP s'effectuent dans la même couche. Tout ajustement local de la forme de la réponse affecte directement l’intégrité du contrat. | Remodeler le risque à la limite finale du backend ; perte de champ potentielle/dérive de bouclage si la logique de routage change. |
| `api/backend/routes/conversion.routes.js` (`detail` compatibility wrapper on failures) | Les réponses aux échecs incluent actuellement à la fois des champs standardisés et `detail`. Ceci est compatible, mais peut dériver si les modifications futures donnent la priorité à la sortie uniquement du wrapper. | Risque de dérive de l'enveloppe ; retour potentiel à une forme ad hoc contenant uniquement des erreurs. |
| `api/backend/services/conversion/convert.js` (`convertMarkdownWithPandoc` throw-based internals) | Les composants internes du convertisseur lancent un `Error(...)` générique ; route les normalise actuellement, mais les messages throw peuvent toujours influencer la qualité de la classification et la précision des détails. | Risque de granularité de classification des erreurs internes ; cartographie des défaillances potentielles trop génériques si elle n’est pas normalisée de manière cohérente. |
| Pré-vérification et validation au niveau de l'itinéraire (`validate` middleware + vérification de l'itinéraire) | Il existe plusieurs points de rejet d’entrée (middleware et pré-vérification de route). La cohérence doit être préservée afin que les deux restent cohérents avec le contrat, le cas échéant. | Risque d’enveloppe de défaillance incohérent entre la validation précoce et les défaillances au niveau de la route. |

#### Déjà sûr alors qu'il reste encore besoin du travail d'alignement de l'étape 4.3

- **Déjà sûr (état actuel) :**
- La branche Succès crée un résultat standardisé via `createSuccessResult(...)`.
- Les branches d'échec créent des résultats standardisés via `createFailureResult(...)`.
- Les exceptions d'exécution internes sont normalisées au niveau de la cible d'alignement confirmée (aucun lancement brut ne s'échappe de ce chemin vers le client).

- **Besoin encore d'une attention particulière à l'alignement :**
- Gardez la mise en forme de la charge utile de la couche de route stable afin que `conversionResult` reste principal et que les champs obligatoires ne soient jamais supprimés.
- Conservez le wrapper de compatibilité des échecs (`detail`) uniquement additif et évitez la dérive vers des échecs du wrapper uniquement.
- Gardez la classification des codes d'erreur fondée et spécifique lorsqu'elle est disponible (évitez les régressions vers des classifications génériques uniquement).

#### Comportement du backend/orchestrateur cible pour ce chemin

- **Préservation du succès**
- Conserver le résultat de réussite standardisé comme forme de retour principale pour la tentative en cours.
- Gardez les champs racine requis intacts et sémantiquement cohérents (`success:true`, `error:null`, métadonnées de sortie valides).

- **Préservation des échecs**
- Préserver le résultat de défaillance standardisé comme forme de défaillance principale (`success:false`, structuré `error`, cohérent `outputFile` sémantique de défaillance).
- Gardez `error.code` significatif et aligné avec la sémantique documentée.

- **Gestion des erreurs internes**
 - Convertissez les exceptions internes inattendues en résultats d'échec standardisés au niveau de la cible d'alignement.
 - Utilisez `INTERNAL_ERROR` uniquement lorsqu'aucun code documenté plus spécifique n'est fondé sur le contexte d'échec.
 - Préservez le contexte utile dans `error.details`/`meta` sans fuite de composants internes bruyants ou mal formés.

- ** Limite d'enrichissement/normalisation acceptable**
 - Les champs de compatibilité additifs (par exemple, `detail`) ne sont acceptables que lorsqu'ils ne remplacent pas ou ne contredisent pas les champs standardisés.
 - Un enrichissement limité des métadonnées/journaux est acceptable lorsque la forme du contrat et la sémantique primaire restent inchangés.

- **Comportement de remodelage/de remplacement inacceptable**
 - Revenir à des échecs ad hoc `{ detail }` uniquement ou à des succès `{ asciidoc }` uniquement sans contexte de résultat standardisé.
 - Suppression des champs de contrat requis ou aplatissement du `error` structuré.
 - Reclassement d'erreurs fondées spécifiques dans codes génériques sans justification.
 - Mélange d'enveloppes incompatibles entre les branches de réussite/échec.

La correction au moment de l'exécution pour ces points de risque contractuel de l'étape 4.3 commence à la sous-étape 4.3.4.

### Étape 4.4.1 — Identification de la cible d'alignement front-end/UI (deuxième migration Path)

Cette sous-étape démarre l'alignement frontend/UI pour le deuxième chemin migré (**Markdown -> AsciiDoc**) et identifie la véritable cible de coordination frontend avant toute refactorisation de l'UI.

#### Couches de coordination frontend/UI candidates impliquées dans ce chemin

| Composant/couche | Rôle dans le flux `markdown -> asciidoc` | Niveau d'implication |
|---|---|---|
| `api/frontend/src/converters/generic-converter.ts` (`convertText`) | Premier consommateur frontend de la réponse backend `/api/to-asciidoc` ; analyse la charge utile HTTP, consomme `conversionResult` et relaie l'état de réussite/échec aux rappels de l'UI. | Direct |
| `api/frontend/src/App.tsx` (`handleConvert`) | Gestionnaire principal d’actions de conversion ; détermine le texte source/le paramètre de sortie, déclenche `convertText` et transmet les rappels d'état/d'erreur/d'état. | Direct |
| `api/frontend/src/App.tsx` (conversion states: `status`, `loading`, `conversionUiState`, `lastBackendConversionResult`) | Coordonne le cycle de vie par tentative et maintient la sémantique des résultats du backend disponible au niveau de la couche d'UI. | Direct |
| `api/frontend/src/App.tsx` (result panel rendering using `adocInput` / `mdOutput`) | La limite finale de l'UI où l'AsciiDoc converti est affiché ou le contenu obsolète peut être effacé/préservé. | Direct |
| `api/frontend/src/App.tsx` (error modal + notification rendering) | Présentation des échecs visible par l'utilisateur (`showConversionErrorModal`, `conversionErrorMessage`, `notification`). | Direct |
| `api/frontend/src/converters/markdown-to-asciidoc.ts` | Wrapper de convertisseur dédié hérité pour le même endpoint ; non utilisé par le chemin de déclenchement de conversion actif dans le courant `App.tsx`. | Secondaire/inactif dans le chemin d'exécution principal |

#### Cible d'alignement frontend/UI principale confirmée pour l'étape 4.4

- **Cible principale :** `api/frontend/src/App.tsx` (centrée sur `handleConvert` et sa limite de coordination état/résultat).

#### Pourquoi c'est la bonne cible de l'étape 4.4

- `App.tsx` est l'endroit où les tentatives de conversion sont orchestrées et où `convertText` est réellement invoqué pour le chemin d'exécution actif.
- `App.tsx` est l'endroit où le cycle de vie succès/échec de l'UI est coordonné (`loading`, `status`, `conversionUiState`) et où le backend `conversionResult` est stocké (`lastBackendConversionResult`).
- `App.tsx` est également la limite de sortie effective de l'UI (contenu du résultat, notifications, modal), où la sémantique du backend peut toujours être préservée, aplatie, ignorée ou mal mappée.
- `convertText` reste un participant direct important, mais le point de décision final en matière de préservation sémantique du frontend pour ce chemin est la couche de coordination `App.tsx`.

Suivant : le mappage détaillé des flux frontend/UI pour cette cible confirmée commence à la sous-étape 4.4.2.

### Étape 4.4.2 — Mappage des flux frontend/UI (deuxième chemin migré)

Cette sous-étape mappe le flux frontend/UI du deuxième chemin migré via la cible d’alignement confirmée de l’étape 4.4 avant la correction du frontend.

- Deuxième chemin de conversion migré : **Markdown -> AsciiDoc**
- Cible d'alignement confirmée de l'étape 4.4 : `api/frontend/src/App.tsx` (`handleConvert` et coordination état/affichage de l'UI), avec consommation directe de l'API en `api/frontend/src/converters/generic-converter.ts` (`convertText`)

#### Flux frontal/UI nominal (orienté vers le succès)

1. L'utilisateur déclenche la conversion à partir de la page principale (`App.tsx`), généralement via l'action de conversion gérée par `handleConvert`.
2. `handleConvert` calcule `sourceText` à partir de l'état actuel de l'UI (`mdOutput` lorsque la source est Markdown), prépare `setOutput` (écrit le résultat AsciiDoc dans `adocInput` lorsque la cible est AsciiDoc) et appelle `convertText(...)`.
3. `convertText` sélectionne le endpoint `POST /api/to-asciidoc`, définit le cycle de vie de la tentative sur chargement (`setLoading(true)`, `setConversionUiState('loading')`) et efface les indicateurs d'UI obsolètes et transitoires.
4. Le backend renvoie `200` avec `{ asciidoc, conversionResult }`.
5. `convertText` consomme d'abord `conversionResult` (valide le booléen `success`, nécessite `success === true`, le transmet via `setBackendConversionResult`).
6. `convertText` relaie ensuite le texte converti via `setOutput(asciidoc)`, met à jour le statut/notification en cas de succès et définit `conversionUiState('success')`.
7. `App.tsx` Les mises à jour d'état se propagent aux couches d'affichage : le panneau de résultats affiche le contenu AsciiDoc mis à jour (`adocInput`), l'état de réussite/la notification est visible et le chargement se termine.

#### Frontend/flux d'UI orienté échec

1. L'utilisateur déclenche la conversion via le même chemin `handleConvert`.
2. `convertText` entre dans le cycle de vie de chargement et envoie `POST /api/to-asciidoc`.
3. Sur une réponse HTTP non OK, `convertText` analyse JSON et vérifie l'échec du backend structuré (`success:false` + structuré `error`).
4. Lorsqu'un échec structuré est présent, `convertText` est le premier consommateur frontal de cet échec standardisé ; il le stocke via `setBackendConversionResult(structuredFailure)`.
5. `convertText` dérive des signaux d'échec visibles par l'utilisateur à partir de la charge utile structurée (notamment `error.code` / `error.message`), définit l'erreur de statut/notification, ouvre éventuellement le modal pour les codes de conversion sélectionnés et définit `conversionUiState('error')`.
6. `App.tsx` applique ces rappels à l'état de l'UI et aux couches d'affichage (notification d'erreur/modal + état du cycle de vie échoué), puis le chargement se termine.
7. Le résultat final visible est une tentative d'UI avec état d'erreur sans confirmation de réussite pour cette tentative ; La sémantique des échecs du backend est disponible dans `lastBackendConversionResult`.

#### Premier point de consommation frontend du résultat backend standardisé

- Le premier point de consommation pour le succès et l'échec structuré est `api/frontend/src/converters/generic-converter.ts` (`convertText`) immédiatement après l'analyse de la réponse HTTP, avant le rendu final de l'UI dans `App.tsx`.

#### Propagation à travers les couches d'état/d'affichage du frontend

- `convertText` -> relais de rappel (`setBackendConversionResult`, `setConversionUiState`, `setStatus`, `setNotification`, `setOutput`) -> `App.tsx` état (`lastBackendConversionResult`, cycle de vie/statut, état du contenu) -> panneaux/notification/modal rendus dans la limite effective de l'UI.

#### Observations fondées sur les risques contractuels du frontend (cartographie actuelle)

- Le succès et l'échec ne sont pas entièrement symétriques au niveau de la logique d'effacement de sortie (`setOutput("")` la branche obsolète est actuellement gardée pour le premier chemin migré, pas ce deuxième chemin).
- L'affichage du succès repose toujours sur le repli de la charge utile héritée (`data.markdown || data.asciidoc || data.result`), qui est compatible mais peut masquer les hypothèses spécifiques au format.
- Si le backend renvoie une charge utile non structurée non OK, l'UI revient à la gestion générique des erreurs de chaîne et peut perdre la sémantique structurée.
- `lastBackendConversionResult` est renseigné pour le succès/l'échec structuré, mais l'UI visible suit toujours principalement les conventions de statut/notification locales plutôt que le rendu direct du contrat complet champs.

Suivant : les points de risque du contrat et la définition du comportement cible du frontend/UI pour cette cible confirmée suivent dans la sous-étape 4.4.3.

### Étape 4.4.3 — Points de risque du contrat frontend/UI et comportement cible (deuxième chemin migré)

Cette sous-étape identifie le frontend/UI points de risque de contrat et définit le comportement frontal cible pour le deuxième chemin migré avant la correction de l'exécution.

- Deuxième chemin de conversion migré : **Markdown -> AsciiDoc**
- Cible d'alignement confirmée de l'étape 4.4 : `api/frontend/src/App.tsx` (limite de coordination de la conversion), avec consommation de première réponse en `api/frontend/src/converters/generic-converter.ts` (`convertText`)

#### Points de risque exacts liés au contrat frontend/UI (fondés)

| Composant/couche | Pourquoi c'est un point de risque contractuel | Type de risque |
|---|---|---|
| `api/frontend/src/converters/generic-converter.ts` (`setOutput("")` déclenchement clair et périmé) | La sortie obsolète en cas de défaillance structurée est actuellement contrôlée par `isMigratedAdocToMarkdown` et n'est pas symétrique pour `markdown -> asciidoc`. | Risque de résidu de réussite obsolète après des tentatives infructueuses de deuxième voie. |
| `api/frontend/src/converters/generic-converter.ts` (repli de la charge utile réussie : `data.markdown || data.asciidoc || data.result`) | La sélection des résultats accepte plusieurs clés héritées et n’applique pas la sémantique de charge utile de réussite spécifique au chemin au-delà de la disponibilité de base. | Risque de repli de forme héritée ; dérive sémantique possible si les clés de charge utile varient. |
| `api/frontend/src/converters/generic-converter.ts` (remplacement en cas d'échec non structuré) | Lorsque les réponses non OK ne sont pas structurées (`success:false` + `error`), le flux revient à la messagerie d'erreur de chaîne générique. | Risque d'aplatissement des erreurs structurées (perte `error.code/details`). |
| `api/frontend/src/App.tsx` (`status`/`notification` comme principaux signaux visibles) | La messagerie finale de l'UI est principalement dérivée des conventions locales de statut/notification plutôt que du rendu explicite des champs structurés du backend. | Risque de compression sémantique (contexte backend riche réduit à des chaînes d'UI génériques). |
| `api/frontend/src/App.tsx` (`handleConvert` + modèle d'état du panneau `adocInput`/`mdOutput`) | Le mappage de l’état du panneau résultat/source dépend du format et peut conserver des valeurs obsolètes si la gestion des échecs n’est pas cohérente. | Risque de cohérence asymétrique du panel de réussite/échec à la limite de l’UI. |

#### Déjà sûr ou encore nécessaire Alignement de l'étape 4.4

- **Déjà sûr (état actuel) :**
 - Le `conversionResult` structuré est consommé en premier dans le `convertText` pour le succès et l'échec structuré.
 - Le succès/l'échec structuré est propagé à `App.tsx` via `setBackendConversionResult`.
 - Les transitions d'état du cycle de vie des tentatives sont explicitement câblées (`loading -> success` et `loading -> error`) via `setConversionUiState`.

- ** Nécessite toujours une attention d'alignement :**
 - Échec de la symétrie de gestion des sorties obsolètes pour le deuxième migré path.
 - Dépendance plus forte de l'UI sur une sémantique d'échec structurée standardisée sur les chaînes de secours génériques.
 - Couplage plus étroit du chemin de réussite à la forme de charge utile du chemin attendu tout en préservant la gestion rétrocompatible.
 - Cohérence des limites de l'UI afin que les tentatives d'échec ne puissent pas apparaître comme une sortie réussie actuelle en raison d'un état obsolète.

#### Comportement frontal/UI cible pour cela path

- **Consommation/rendu de réussite**
 - Consommer le succès standardisé `conversionResult` comme résultat de tentative faisant autorité pour ce chemin.
 - Garder la sémantique de réussite requise cohérente à la limite de l'UI (`success:true`, `error:null`) pendant le rendu a renvoyé la sortie AsciiDoc pour la même tentative.

- **Consommation/rendu des échecs**
 - Préserver la sémantique des échecs standardisée (`success:false`, structuré `error`) sans aplatir les modèles d'erreur en chaîne uniquement lorsque des données structurées sont disponibles.
 - Préserver et afficher un comportement significatif piloté par `error.code` de manière cohérente pour ce chemin.

- **Transitions d'état du front-end (`idle/loading/success/error`)**
 - Une nouvelle tentative démarre à partir d'un état transitoire propre, entre en `loading` et atterrit de manière déterministe en `success` ou `error` pour cette même tentative.
 - Les tentatives d'échec ne doivent pas laisser une sortie/un état réussi périmé présenté comme le résultat de la tentative actuelle.

- **Interprétation/enrichissement acceptable frontière**
 - L'interprétation additive de l'UI est acceptable (texte d'état, notifications, routage modal) lorsqu'elle ne réécrit pas la sémantique de réussite/échec du backend.
 - Une normalisation minimale est acceptable pour l'affichage/la lisibilité si la signification du contrat structuré est préservée.

- **Comportement d'aplatissement/remodelage/état obsolète**
 - Remplacement de structuré échecs du backend avec des erreurs d'UI génériques de type chaîne uniquement lorsqu'un échec structuré est présent.
 - Ignorer la sémantique `error.code` significative et regrouper les échecs en catégories locales indifférenciées.
 - Traiter le contenu du panneau obsolète comme un succès de tentative en cours après un échec.
 - Reconstruire des enveloppes de réussite/échec incompatibles uniquement avec le frontend qui contredisent le backend `ConversionResult`.

La correction au moment de l'exécution pour ces points de risque de contrat frontend/UI de l'étape 4.4 commence à la sous-étape 4.4.4.

### Étape 4.5.1 — Comparaison croisée (premier et deuxième flux migrés)

Cette sous-étape compare le premier et le deuxième chemins migrés pour identifier les éléments de migration/alignement réutilisables, les détails spécifiques au chemin et ce que l'étape 4 valide sur la généralité du modèle.

- Premier chemin de conversion migré : **AsciiDoc -> Markdown**
- Deuxième chemin de conversion migré : **Markdown -> AsciiDoc**

#### Caractéristiques partagées ou différentes

| Zone de comparaison | Partagé sur les deux chemins | Différences spécifiques au chemin |
|---|---|---|
| Migration au niveau du convertisseur | Une sémantique `ConversionResult` standardisée est appliquée en cas de succès et d'échec. | Le premier chemin passe par l'orchestration du module à chargement différé (`downdoc`) ; le deuxième chemin utilise l'intégration directe au niveau de la route Pandoc (`/to-asciidoc`). |
| Préservation du backend/orchestrateur | La limite au niveau de la route préserve les enveloppes structurées de succès/échec et conserve `detail` comme champ de compatibilité additif. | Les entrées de classification des pannes diffèrent selon les composants internes du convertisseur et la profondeur de l'orchestration ; le deuxième chemin s'appuie sur `classifyToAsciidocInternalError` pour la normalisation au niveau de la route. |
| Préservation du frontend/UI | `convertText` est le premier consommateur frontal ; le résultat structuré est relayé vers `App.tsx` (`lastBackendConversionResult`, `conversionUiState`). | La clé de charge utile de réussite diffère selon le chemin (`markdown` vs `asciidoc`), et la gestion des sorties obsolètes nécessitait un renforcement explicite de la symétrie du deuxième chemin. |
| Style de vérification | Des contrôles contractuels ciblés et des validations minimales basées sur des scénarios ont été utilisés à chaque niveau, avec des affirmations explicites de réussite/échec et des attentes de terrain structurées. | Les ensembles de scénarios sont orientés chemin (différents déclencheurs de endpoint, de charge utile et d'erreur de convertisseur), y compris des vérifications de route d'erreur interne du deuxième chemin et des vérifications de séquence frontend markdown->asciidoc. |
| Gestion des formes d'erreur | Le `error` structuré (`code`, `message`, détails facultatifs) est traité comme une sémantique d'échec principale. | La distribution des codes d'erreur dépend des spécificités de l'exécution du chemin (`EMPTY_INPUT`, `CONVERSION_FAILED`, `INTERNAL_ERROR` contexte et comportement du classificateur). |
| Gestion des états/flux | Le modèle de cycle de vie des tentatives (`idle/loading/success/error`) et les règles de suppression des indicateurs obsolètes sont des objectifs d'alignement partagés. | La propriété de la sortie au niveau du chemin diffère (panneau cible `mdOutput` vs `adocInput`), nécessitant une protection contre les résultats obsolètes tenant compte du chemin. |

#### Éléments de migration/alignement réutilisables

- Les assistants centraux et les champs de contrat (`createSuccessResult`, `createFailureResult`, champs racine standardisés, structurés `error`) sont réutilisables à travers les flux.
- La séquence d'alignement en couches est réutilisable : migration du convertisseur -> préservation des limites backend/orchestrateur -> Consommation frontend/UI/alignement d'état -> vérification ciblée.
- L'approche de vérification est réutilisable : d'abord de petites assertions de contrat, puis des scénarios représentatifs, puis des contrôles de limites/cohérence.
- La politique de compatibilité additive est réutilisable : préserve la forme standardisée comme principale tout en conservant les champs d'emballage rétrocompatibles uniquement comme additifs.

#### Détails d'intégration spécifiques au chemin

- Runtime du convertisseur forme d'intégration (chemin du module de chargement paresseux vs route directe + chemin Pandoc).
- Câblage de la charge utile/clé de résultat du endpoint et propriété du panneau (sortie `markdown` vs sortie `asciidoc`).
- Heuristique de classification des erreurs et contexte de normalisation au niveau de la route.
- Risques d'artefacts obsolètes de l'UI liés à l'état de sortie cible de chaque chemin. emplacement.

#### Ce que l'étape 4 valide désormais sur la généralité du modèle

- Le modèle de migration/alignement n'est pas spécifique à un flux unique : il s'applique à deux conversions réelles dans des directions opposées avec une plomberie d'exécution différente.
- La sémantique `ConversionResult` standardisée peut être préservée de bout en bout (limite du backend à travers la limite effective de l'UI) avec des ajustements localisés et minimes plutôt qu’une refonte globale.
- La vérification multicouche reste pratique et reproductible pour des flux supplémentaires lorsque la même séquence d'alignement est suivie.

Ensuite : la sous-étape 4.5.2 documentera explicitement le modèle de migration/d'alignement multi-flux réutilisable.

### Étape 4.5.2 — Modèle de migration/alignement multi-flux réutilisable

Cette sous-étape documente le modèle d'alignement/migration multi-flux réutilisable modèle de migration/alignement multi-flux désormais validé sur deux chemins de conversion réels (**AsciiDoc -> Markdown** et **Markdown -> AsciiDoc**).

#### Séquence de bout en bout réutilisable

1. Sélectionnez un chemin de conversion réel délimité.
2. Mappez le flux d'exécution du convertisseur actuel (chemin de réussite, chemin d'échec, comportement d'erreur interne).
3. Mappez les entrées de charge utile d'exécution sur `createSuccessResult()` et `createFailureResult()`.
4. Intégrer la construction de résultats standardisés du chemin de réussite.
5. Intégrer la construction de résultats standardisés du chemin de défaillance.
6. Harmoniser les erreurs internes du convertisseur en sémantique de défaillance structurée.
7. Vérifiez le chemin du convertisseur de manière isolée (scénarios de réussite/échec ciblés).
8. Identifiez la cible d’alignement backend/orchestrateur pour le chemin sélectionné.
9. Cartographier la propagation des succès/échecs du backend via cette cible.
10. Identifiez les points de risque du contrat backend.
11. Corriger la préservation du backend des résultats standardisés.
12. Vérifiez le comportement du backend au niveau du flux et à la limite de sortie du backend.
13. Identifiez la cible d’alignement frontend/UI pour le même chemin.
14. Cartographier la consommation de succès/échec du frontend et la propagation de l'état.
15. Identifiez les points de risque du contrat frontal.
16. Corriger le comportement de réussite/échec/état du frontend avec des changements localisés minimes.
17. Vérifier la cohérence efficace des limites de sortie de l'UI (propriété de la tentative actuelle, contrôle de l'état obsolète).
18. Comparez les chemins précédemment migrés pour séparer les éléments réutilisables des détails spécifiques au chemin.

#### Pourquoi ce modèle est important

- Il démontre que le modèle de migration/alignement est réutilisable au-delà d'un seul chemin de conversion.
- Il réduit le risque de migrations ad hoc spécifiques au chemin en appliquant une méthode en couches stable.
- Il fournit à Ascend un chemin reproductible. base de référence pour les futures migrations et alignements de convertisseurs.

#### Ce qui reste stable par rapport à ce qui reste spécifique au chemin

- **Stable (niveau méthode) :**
 - Contrat standardisé `ConversionResult` comme enveloppe principale de réussite/échec.
 - Ordre des couches : convertisseur -> backend/orchestrateur -> frontend/UI -> vérification/consolidation.
 - Style de correction axé sur les risques (minimal, localisé, axé sur les limites).

- **Spécifique au chemin (niveau d'intégration) :**
 - Éléments internes du moteur/d'exécution (comportement du module de chargement paresseux, détails d'exécution directe de Pandoc, mécanique des fichiers temporaires).
 - Entrées de granularité/classification des détails des erreurs ancrées dans chaque chemin du convertisseur.
 - Assemblage de métadonnées locales et nuances d'emballage de compatibilité.
 - Nuances d'affichage de l'UI liées à la propriété du panneau cible et à la présentation des échecs spécifiques au chemin.

Suivant : la sous-étape 4.5.3 définira la convention multi-flux concise de l'étape 4, la définition de Terminé et le matériel orienté vers la fermeture.

### Étape 4.5.3 — Convention multi-flux de l'étape 4 et définition de Terminé

Cette sous-étape formalise la convention multi-flux concise et la définition officielle de Terminé (DoD) pour l'étape 4, basée sur le modèle validé sur deux chemins migrés réels.

#### Convention multi-flux concise pour les futures migrations paths

- Conserver le nom du convertisseur orienté vers l'ascendant et basé sur les rôles.
- Utiliser `createSuccessResult()` et `createFailureResult()` comme chemin de construction de résultat standard.
- Standardiser à la fois le succès et l'échec à la limite du convertisseur/route avant un travail étendu sur la couche environnante.
- Aligner la préservation du backend/orchestrateur après le convertisseur migration.
- Aligner la préservation du frontend/UI après l'alignement du backend.
- Vérifier dans l'ordre de progression : l'isolement d'abord, puis le flux/la limite du backend, puis le flux/la limite du frontend.
- Préserver la sémantique du backend dans les couches frontend ; éviter de reconstruire les anciens modèles de résultats/erreurs locaux.
- Migrer un chemin réel limité à la fois pour maintenir la vérification et la correction fondées.

#### Définition officielle de Terminé pour l'étape 4

L'étape 4 n'est terminée que si tous les critères ci-dessous sont vrais :

- Un deuxième chemin de conversion réel est sélectionné et formellement confirmé.
- Le deuxième chemin est migré vers des assistants `ConversionResult` standardisés.
- Son chemin de réussite est standardisé.
- Son chemin d'échec est standardisé.
- Sa gestion interne des erreurs au niveau du convertisseur est harmonisée.
- Le deuxième chemin passe une vérification isolée ciblée.
- L'alignement backend/orchestrateur est effectué pour le deuxième chemin.
- La préservation du succès/échec du backend/orchestrateur est vérifiée.
- La gestion des erreurs de la couche de coordination interne du backend/orchestrateur est corrigée ou préservée en toute sécurité lorsque cela est raisonnablement possible.
- L'alignement frontend/UI est effectué pour le deuxième chemin.
- La réussite et la consommation des échecs du frontend sont vérifiées.
- Le comportement de l'état du frontend est cohérent pour le deuxième chemin.
- La sémantique standardisée survit jusqu'à la limite de sortie effective de l'UI.
- Les premier et deuxième chemins migrés sont comparés.
- Un modèle de migration/d'alignement multi-flux réutilisable est documenté.

#### Ce que l'étape 4 ne nécessite pas

- Migration de toutes les conversions restantes chemins.
- Large refonte de l'architecture backend ou frontend.
- Refonte de l'UI à l'échelle du produit.
- Normalisation simultanée de chaque moteur à la fois.
- Inclusion des futurs ajouts de convertisseurs dans la clôture de l'étape 4.

#### Pourquoi ce DoD est important

- Il marque la transition de un flux de référence validé vers un modèle multi-flux réutilisable.
- Il lève l'ambiguïté sur ce que signifie « généralisation » dans le travail de migration d'Ascend.
- Il établit une base de référence propre pour les futures migrations de convertisseurs sans rouvrir les décisions déjà validées.

Ensuite : la note officielle de clôture de l'étape 4 suit à la sous-étape 4.5.4.

### Étape 5.1.1 — Éléments déjà partagés dans les flux migrés

L'étape 5 commence par identifier ce qui est déjà véritablement partagé entre les deux flux réels migrés, avant toute refactorisation de consolidation.

#### Éléments partagés ancrés (premier et deuxième chemins migrés)

| Élément partagé | Pourquoi il est considéré comme partagé |
|---|---|
| Utilisation standardisée de l'enveloppe `ConversionResult` | Les deux chemins migrés exposent désormais des résultats structurés de réussite/échec avec la même sémantique de contrat racine aux limites du back-end et via la consommation du front-end. |
| Modèle d'erreur de défaillance structuré (`error.code`, `error.message`, structuré `error`) | Les deux chemins préservent la sémantique structurée des échecs et gardent `error.code` significatif dans les réponses backend et les chemins de gestion frontend. |
| Utilisation centralisée de l'aide aux résultats du backend | Les deux migrations s'appuient sur une construction standardisée basée sur une aide (`createSuccessResult()` / `createFailureResult()`) comme principale méthode de création de résultats. |
| Convention de dénomination/orientation du convertisseur | Les deux convertisseurs migrés suivent une intention de dénomination/intégration orientée Ascend et basée sur les rôles plutôt qu'une dénomination ponctuelle ad hoc. |
| Principe de préservation backend/orchestrateur | Dans les deux cas, l’alignement du backend se concentre sur la préservation des résultats standardisés de bout en bout et sur le maintien des champs de compatibilité additifs plutôt que sur le remplacement du contrat. |
| Principe de préservation du frontend/UI | Dans les deux chemins, l'alignement du frontend utilise la première consommation dans la couche API de conversion et relaie la sémantique structurée dans l'état `App.tsx` et les résultats visibles de l'UI. |
| Attente du cycle de vie du frontend partagé (`idle/loading/success/error`) | Les deux chemins utilisent le même modèle de cycle de vie des tentatives et nécessitent un nettoyage des indicateurs obsolètes entre les tentatives pour maintenir la cohérence de la propriété des tentatives actuelles. |
| Modèle de vérification partagé | Les deux chemins ont été validés avec des contrôles en couches : vérification ciblée du convertisseur, vérification backend/orchestrateur, vérification frontend/UI et vérifications de cohérence des limites. |
| Documentation partagée/modèle d'alignement | Les deux chemins ont été documentés avec la même séquence : identification de la cible, cartographie des flux, identification des risques contractuels, mesures correctives et notes de consolidation. |

Suivant : la sous-étape 5.1.2 distinguera ce qui est un matériel de consolidation véritablement générique de ce qui reste un détail d'intégration spécifique au chemin.

### Étape 5.1.2 — Classification générique ou spécifique au chemin

Cette sous-étape distingue les candidats à la consolidation générique des éléments qui restent spécifiques au chemin, sur la base de preuves fondées sur les deux migrés 

#### Candidats à la consolidation véritablement génériques (stables sur les flux migrés)

| Catégorie | Pourquoi il est classé comme générique |
|---|---|
| Utilisation du contrat `ConversionResult` standardisé | Les deux flux préservent la même sémantique de contrat de réussite/échec aux limites du backend et du frontend. |
| Sémantique structurée du modèle d'erreur | Les deux flux utilisent l'échec structuré (`success:false`, `error.code`, `error.message`, détails facultatifs) comme signification principale de l'échec. |
| Modèle de construction de résultats basé sur une aide | Les deux flux s'appuient sur `createSuccessResult()` / `createFailureResult()` comme chemin de construction standard. |
| Règle de préservation du backend/orchestrateur | Les deux flux appliquent un emballage de compatibilité additif tout en gardant les champs de contrat standardisés principaux. |
| Première consommation frontend et modèle de relais | Les deux flux consomment le résultat structuré dans la couche API de conversion et sont relayés vers l'état de cycle de vie/d'affichage `App.tsx`. |
| Attente du cycle de vie des tentatives partagées | Les deux flux s'alignent sur `idle/loading/success/error` tentative de propriété avec des exigences de nettoyage à l'état obsolète. |
| Structure de vérification en couches | Les deux flux suivent l'isolement -> backend/orchestrateur -> frontend/UI -> progression de la vérification de la cohérence des limites. |
| Séquence de documentation de l'alignement | Les deux flux sont documentés avec la même progression (cible, cartographie des flux, risques, remédiation, consolidation). |

#### Éléments qui restent spécifiques au chemin (à conserver en local pour l'instant)

| Catégorie | Pourquoi cela reste spécifique au chemin |
|---|---|
| Composants internes du moteur/d'exécution | Le premier chemin utilise l'orchestration de module à chargement différé (`downdoc`), le deuxième chemin utilise l'intégration directe de la route Pandoc. |
| Détails de l'assemblage de métadonnées au niveau du convertisseur | Les entrées de dérivation de champ (synchronisation, métadonnées de fichier, contexte de transport, conditions d'artefact de sortie) diffèrent selon les mécanismes d'exécution du chemin. |
| Granularité détaillée de la classification des erreurs | Les signaux de classification des défaillances internes et le contenu précis `error.details` dépendent du contexte d'exécution spécifique au chemin. |
| Nuances clés de charge utile/résultat du endpoint | Les clés de charge utile de réussite et la propriété de sortie au niveau du chemin diffèrent (`markdown` vs `asciidoc` gestion des réponses/résultats). |
| Nuances de propriété du panneau cible de l'UI | Le placement des résultats et le risque d'artefact obsolète diffèrent car chaque chemin écrit dans un état de panneau différent (`mdOutput` vs `adocInput`). |
| Ensembles de scénarios représentatifs orientés chemin | Les scénarios de vérification et les cas d'injection de pannes diffèrent selon le comportement du convertisseur et la topologie du routage. |
| Détails de la surface d'emballage de compatibilité | Les wrappers additifs (par exemple le contexte d'utilisation `detail`) restent liés à l'historique d'intégration par chemin et aux consommateurs. |

Suivant : la sous-étape 5.1.3 confirmera quels domaines de consolidation doivent être prioritaires en premier.

### Étape 5.1.3 — Ordre de priorité de consolidation de l'étape 5

Cette sous-étape donne la priorité aux objectifs de consolidation sûrs pour l'étape 5, sur la base des éléments partagés/génériques déjà validés dans les deux pays migrés. flux.

#### Objectifs de consolidation hautement prioritaires (première vague)

| Zone/catégorie | Pourquoi une priorité élevée |
|---|---|
| Liste de contrôle partagée pour la préservation des contrats (limites backend + frontend) | Valeur de réutilisation la plus élevée dans les deux flux, faible profil de risque de mise en œuvre et impact direct sur la prévention de la dérive sémantique lors des migrations futures. |
| Convention de gestion unifiée des défaillances structurées (`error.code`-première sémantique) | Déjà stable dans les deux flux, faible risque de formalisation et valeur de maintenabilité élevée pour un comportement de défaillance et des diagnostics cohérents. |
| Squelette de vérification commun (isolation -> backend -> frontend -> limite effective) | Fortement réutilisable et déjà éprouvé ; le codifier d’abord améliore la répétabilité sans forcer l’unification de l’exécution. |
| Étapes de migration/alignement standard (identification de la cible -> cartographie des risques -> remédiation -> consolidation) | Fournit une clarté immédiate du processus pour les chemins futurs avec un risque minimal de rupture spécifique au chemin. |

#### Objectifs de consolidation moyennement prioritaires (deuxième vague)

| Zone/catégorie | Pourquoi une priorité moyenne |
|---|---|
| Modèles de dénomination/documentation partagés pour les sections de chemin migré | Utile pour la lisibilité et la cohérence, mais impact immédiat sur la sécurité d'exécution inférieur à celui des conventions de contrat/vérification. |
| Convention d'hygiène de l'état du frontend à flux croisés (`idle/loading/success/error` règles de nettoyage) | Réutilisable et précieux, mais nécessite une formulation soignée pour éviter de trop spécifier le comportement de l'UI au niveau du chemin local. |
| Conseils d'utilisation du wrapper de compatibilité (formulation de la politique uniquement additive) | Sujet de gouvernance important, mais partiellement lié aux contraintes d'intégration héritées du chemin local. |

#### Différé / conserver le chemin local pour l'instant

| Zone/catégorie | Pourquoi différé/chemin-local maintenant |
|---|---|
| Éléments internes du moteur/d'exécution (`downdoc` orchestration à chargement différé vs comportement de route Pandoc directe) | Différents modèles d'exécution avec des contraintes locales non triviales ; une unification prématurée augmenterait le risque de casse. |
| Détails de l'assemblage de métadonnées spécifiques au chemin | La dérivation des artefacts d’entrée/sortie diffère selon le flux ; devrait rester local jusqu'à ce que des chemins migrés supplémentaires confirment une communauté plus forte. |
| Granularité de détail des erreurs et heuristiques de classificateur spécifiques au chemin | Sémantiquement lié mais opérationnellement différent selon les moteurs/itinéraires ; forcer une consolidation précoce risque de générer une cartographie des erreurs trop généralisée. |
| Détails de propriété du panneau cible de l'UI (`mdOutput` vs `adocInput`) | Lié à la direction du chemin et à la composition actuelle de l'UI ; devrait rester local jusqu’à ce qu’une convergence plus large de l’UI soit intentionnellement planifiée. |

La mise en œuvre réelle de la consolidation de l'étape 5 commence à la sous-étape 5.2.1.

### Étape 5.2.4 — Validation de la cohérence des conventions backend partagées

Cette sous-étape valide que les conventions backend partagées sont désormais appliquées de manière cohérente sur les deux chemins backend migrés où ces conventions sont censées être commun.

#### Conventions back-end partagées confirmées alignées

| Convention/catégorie | Pourquoi est-il considéré comme aligné sur les deux chemins migrés |
|---|---|
| Construction de résultats standardisés basée sur une aide | Les deux chemins utilisent désormais des modèles de construction `ConversionResult` pilotés par les assistants pour les échecs standardisés au niveau de la route, avec une compatibilité additive `detail` préservée. |
| Préservation structurée des erreurs | Les deux chemins préservent les objets structurés `error` (`code`, `message`, détails facultatifs) et gardent `detail` aligné sur `error.message` dans les réponses d'échec. |
| Le contrat de réussite/échec façonne les attentes | Les deux chemins exposent des champs racine conformes au contrat et maintiennent la séparation sémantique succès/échec sans s’aplatir dans des enveloppes héritées uniquement. |
| Conventions de champ racine partagées (`pipeline`, `warnings`, `logs`, `meta`) | Les deux chemins fournissent systématiquement à ces champs des attentes de forme stables (sémantique du tableau/objet, valeurs appropriées au chemin). |
| Normalisation des entrées vides de pré-vérification de l'itinéraire | Les deux chemins acheminent désormais les entrées vides/vides via une gestion des échecs standardisée basée sur une aide (`EMPTY_INPUT`) plutôt que des branches de réponse ad hoc. |
| Principe de préservation sémantique côté backend | Les deux chemins conservent la sémantique standardisée comme signification principale de la charge utile, les wrappers de compatibilité restant uniquement additifs. |

#### Différences qui restent intentionnellement spécifiques au chemin

| Catégorie | Pourquoi intentionnellement spécifique au chemin |
|---|---|
| Modèle d'exécution du convertisseur/runtime | `AsciiDoc -> Markdown` utilise une orchestration à chargement différé `downdoc` ; `Markdown -> AsciiDoc` utilise le flux de conversion Pandoc direct. |
| Identité du convertisseur et valeurs du pipeline | Les identifiants `converter` et `pipeline` restent spécifiques au flux de par leur conception (`downdoc` / `asciidoc->markdown` vs `pandoc` / `markdown->asciidoc`). |
| Détails des métadonnées des artefacts d'entrée/sortie | Le nom des fichiers, les conventions de chemin de stockage et la sémantique des artefacts de sortie diffèrent en raison de la gestion du runtime spécifique à la direction. |
| Contexte détaillé de la classification des erreurs internes | Les métadonnées de l'étape de détail des erreurs restent ancrées dans le contexte d'exécution de chaque flux (par exemple, les étapes d'exécution du convertisseur et de validation de route). |

Suivant : la consolidation de la convention frontend commence à la sous-étape 5.3.1.

### Étape 5.3.1 — Éléments frontend/UI déjà partagés dans les flux migrés

Cette sous-étape démarre la consolidation de l'étape 5 côté frontend en identifiant ce qui est déjà véritablement partagé entre les deux frontend/UI migrés. flux, avant toute refactorisation du frontend.

#### Éléments frontend/UI partagés fondé

| Élément partagé | Pourquoi il est considéré comme partagé |
|---|---|
| Première consommation structurée de résultat de réussite dans la couche API de conversion | Les deux flux migrés consomment le succès du backend `conversionResult` d'abord en `convertText` avant les décisions finales de rendu de l'UI. |
| Première consommation structurée de résultat d'échec dans la couche API de conversion | Les deux flux migrés consomment des échecs backend structurés (`success:false`, structurés `error`) en `convertText` plutôt que de passer immédiatement par défaut à des modèles d'erreur locaux ad hoc. |
| Relais partagé dans l'état de conversion `App.tsx` | Les deux flux relaient les données de résultats backend standardisées via des rappels partagés (`setBackendConversionResult`, `setStatus`, `setNotification`, `setConversionUiState`). |
| Attente partagée de l'état du cycle de vie (`idle/loading/success/error`) | Les deux flux suivent la même attente de cycle de vie de tentative et utilisent des transitions `loading -> success/error` explicites. |
| Référence de nettoyage partagée à l'état obsolète au démarrage de la tentative | Les deux flux effacent les indicateurs transitoires obsolètes au démarrage d’une nouvelle tentative (notification/modal/message d’erreur/réinitialisation du résultat du backend) afin de réduire les artefacts de tentatives mixtes. |
| Règle de propriété partagée de la tentative actuelle pour l'affichage des résultats/erreurs | Les deux flux devraient présenter la sémantique de la tentative actuelle (et non le résidu de la tentative précédente) à la limite de sortie effective de l'UI. |
| Sémantique d'erreur structurée partagée pour la gestion de l'UI | Les deux flux préservent une disponibilité `error.code` significative pour la sémantique de branchement/notification au niveau de l'UI lorsque des échecs structurés sont disponibles. |
| Limite d'interprétation/enrichissement du frontend partagé | Les deux flux utilisent un mappage de présentation additif (texte de statut, notification, routage modal) tout en préservant la signification sémantique du backend comme principale. |
| Style de vérification frontend partagée | Les deux flux utilisent des tests axés sur les contrats autour du comportement de l'état `convertText`/UI, y compris des contrôles de cohérence de réussite/échec et d'état obsolète. |
| Documentation/modèle d'alignement du frontend partagé | Les deux flux ont été documentés avec la même séquence (identification de la cible, cartographie des flux, cartographie des risques contractuels, remédiation, vérification de la consolidation). |

Suivant : la sous-étape 5.3.2 distinguera ce qui est un matériel de consolidation frontend véritablement générique de ce qui reste un comportement frontend spécifique au chemin.

### Étape 5.3.2 — Classification générique frontend vs spécifique au chemin

Cette sous-étape distingue les candidats génériques à la consolidation frontend/UI des éléments frontend qui restent spécifiques au chemin, basé sur des preuves fondées sur les deux flux d'UI migrés.

#### Candidats véritablement génériques à la consolidation frontend/UI

| Catégorie | Pourquoi il est classé comme générique |
|---|---|
| Contrat de consommation structuré réussite-résultat | Les deux flux consomment le backend `conversionResult` comme principale source sémantique de succès dans `convertText` avant la présentation finale de l'UI. |
| Contrat structuré de consommation échec-résultat | Les deux flux consomment des défaillances structurées du backend (`success:false`, structurées `error`) comme sémantique de défaillance principale lorsqu'elles sont disponibles. |
| Modèle de relais de rappel de conversion partagé | Les deux flux relaient les mises à jour des résultats/états via la même interface de rappel dans `App.tsx` (`setBackendConversionResult`, `setStatus`, `setNotification`, `setConversionUiState`). |
| Modèle de cycle de vie des tentatives partagées (`idle/loading/success/error`) | Les deux flux dépendent des mêmes attentes d’état du cycle de vie et des mêmes transitions déterministes `loading -> success/error`. |
| Base de référence partagée pour le nettoyage des états périmés transitoires | Les deux flux effacent les indicateurs de tentative transitoire au début d’une nouvelle requête (notification/modal/message d’erreur/résultat du backend). |
| Principe de disponibilité partagée des erreurs structurées (`error.code`) | Les deux flux préservent la disponibilité `error.code` pour la gestion/le branchement au niveau de l'UI en cas de défaillance structurée. |
| Limite partagée d'interprétation/enrichissement | Les deux flux utilisent un mappage de présentation additif (statut, notification, routage modal) sans remplacer la signification sémantique du backend. |
| Structure de vérification frontend partagée | Les deux flux s'appuient sur des tests ciblés et sensibles aux contrats autour du comportement `convertText`, des transitions d'état et de la cohérence des états obsolètes. |

#### Éléments frontend qui restent spécifiques au chemin (à conserver en local pour l'instant)

| Catégorie | Pourquoi cela reste spécifique au chemin |
|---|---|
| Clé de charge utile du résultat et nuances de propriété du panneau | La charge utile/la propriété des résultats de réussite diffèrent selon la direction (`markdown` vs `asciidoc`) et sont mappées dans différents emplacements d'état du panneau (`mdOutput` vs `adocInput`). |
| Profil de risque de sortie périmée spécifique à la trajectoire | L'exposition résiduelle aux sorties obsolètes diffère selon la direction du flux et le panneau cible, de sorte que le comportement de la protection reste sensible au flux. |
| Nuance d'affichage des erreurs orientées chemin | L'accent modal/notification peut varier en fonction des signatures de défaillance spécifiques au flux et de la formulation historiquement établie destinée à l'utilisateur. |
| Détails de mise en forme du modèle de vue spécifique au chemin | La logique locale de sélection du texte source/résultat dans `handleConvert` dépend de la direction source/cible et ne peut pas encore être entièrement unifiée sans des modifications plus larges de l'UI. |
| Scénarios de tests représentatifs spécifiques au flux | Les entrées de scénario et les artefacts d’UI attendus diffèrent selon le sens de conversion et les conventions de charge utile du endpoint. |
| Texte d'affichage/message spécifique au chemin | Le texte d’état/d’erreur visible par l’utilisateur reste partiellement ajusté en fonction du contexte de flux et ne doit pas être sur-normalisé prématurément. |

Suivant : la sous-étape 5.3.3 confirmera quels domaines de consolidation frontend/UI doivent être prioritaires en premier.

### Étape 5.3.3 — Ordre de priorité de consolidation frontend/UI

Cette sous-étape donne la priorité aux cibles sécurisées de consolidation frontend/UI pour l'étape 5, sur la base de la classification générique par rapport au chemin déjà spécifique. validés pour les deux flux d'UI migrés.

#### Cibles de consolidation frontend/UI hautement prioritaires (première vague)

| Zone/catégorie | Pourquoi une priorité élevée |
|---|---|
| Conventions partagées de gestion des contrats `convertText` | Valeur de réutilisation la plus élevée et risque le plus faible : standardisez les règles de consommation de `conversionResult` (succès/échec), de préservation de `error.code` et d'application de la propriété de la tentative actuelle sans toucher au rendu de l'UI spécifique au chemin. |
| Référence de nettoyage partagée à l'état obsolète au démarrage de la tentative | Consolidation à faible risque avec des résultats UX/cohérence élevés ; réduit les artefacts de tentatives mixtes sur les deux chemins tout en restant additif. |
| Convention de transition du cycle de vie partagé (`idle/loading/success/error`) | Stabilise la sémantique de l'état pour les chemins et les migrations futures ; une petite normalisation localisée génère des gains de maintenabilité sans refonte de l’UI. |
| Conventions de vérification partagées pour les flux migrés | La consolidation des modèles de test (séquences de réussite/échec/état obsolète) améliore la confiance et la répétabilité sans modifier le comportement d'exécution. |

#### Objectifs de consolidation moyennement prioritaires (dernière vague)

| Zone/catégorie | Pourquoi une priorité moyenne |
|---|---|
| Conventions de messagerie/notification de l'UI partagée pour les échecs structurés | Précieux pour la cohérence, mais plus risqué car la formulation destinée à l'utilisateur et le routage modal peuvent être sensibles au chemin. |
| Documentation/modèles partagés pour les sections d'alignement du frontend | Améliore la lisibilité et la vitesse de migration future, mais ne modifie pas directement la sécurité d'exécution. |
| Utilitaires de normalisation minimale partagés (sécurité d'affichage) | Utile, mais doit éviter de se glisser dans une mise en forme de modèle de vue spécifique au chemin ; mieux après que les règles contractuelles/étatiques de la première vague soient verrouillées. |

#### Différé / conserver le chemin local pour l'instant

| Zone/catégorie | Pourquoi différé/chemin-local maintenant |
|---|---|
| Propriété du panneau cible et mappage des clés de charge utile (`mdOutput` vs `adocInput`, `markdown` vs `asciidoc`) | Dépend de la direction et étroitement couplé à la composition actuelle de l’UI ; une unification prématurée risque de briser la sémantique de l’affichage. |
| Nuance d'affichage d'erreur spécifique au chemin et heuristique modale | Toujours partiellement adapté aux signatures de défaillance spécifiques au flux ; doit rester local jusqu’à ce qu’une étape délibérée de convergence UX soit planifiée. |
| `handleConvert` détails de mise en forme du modèle de vue | Fortement dépendant de la logique de sélection source/cible et de la structure plus large de l'UI ; la consolidation serait plus risquée sans une étape de conception plus large. |

La mise en œuvre réelle de la consolidation du frontend/UI commence à la sous-étape 5.4.1.

### Étape 5.4.4 — Validation de la cohérence des conventions frontend/UI partagées

Cette sous-étape valide que les conventions frontend/UI partagées sont désormais appliquées de manière cohérente dans les deux flux frontend migrés où ces conventions sont censées être commun.

#### Les conventions de frontend/UI partagées sont confirmées alignées

| Convention/catégorie | Pourquoi est-il considéré comme aligné sur les deux flux frontaux migrés |
|---|---|
| La consommation structurée succès-résultat comme source de vérité | Les deux flux nécessitent désormais un champ de sortie structuré `conversionResult` valide et un flux attendu avant de traiter une demande comme réussie. |
| La consommation structurée des résultats d'échec comme source de vérité | Les deux flux consomment des échecs structurés (`success:false`, structurés `error`) directement dans `convertText` plutôt que de les réduire en erreurs locales génériques uniquement. |
| Préservation structurée des informations de défaillance (`error.code`) | Les deux flux préservent `error.code` pour le branchement de notification/modal et maintiennent la sémantique d'échec disponible dans `lastBackendConversionResult`. |
| Attentes partagées en matière de transition du cycle de vie (`idle/loading/success/error`) | Les deux flux suivent la même convention de cycle de vie des tentatives avec des transitions déterministes du chargement à l’état terminal. |
| Attentes partagées en matière de compensation des états obsolètes | Les deux flux effacent les indicateurs obsolètes transitoires au démarrage de la tentative et effacent les sorties obsolètes sur les branches de gestion des échecs/erreurs du chemin migré. |
| Évitement partagé d’une refonte uniquement héritée | Les deux flux conservent la sémantique back-end principale et utilisent le mappage d’UI local comme présentation additive, et non comme remplacement sémantique. |
| Préservation sémantique efficace et partagée des limites de l'UI | Les deux flux conservent la propriété de la tentative actuelle à la limite visible (sortie/notification/modale/état), empêchant ainsi le succès d'une tentative précédente obsolète de représenter les tentatives échouées actuelles. |

#### Différences qui restent intentionnellement spécifiques au chemin

| Catégorie | Pourquoi intentionnellement spécifique au chemin |
|---|---|
| Clé de charge utile du résultat et mappage de propriété du panneau | `adoc->md` et `md->adoc` ciblent légitimement différentes touches de sortie et emplacements d'état du panneau (`markdown`/`mdOutput` vs `asciidoc`/`adocInput`). |
| Nuance modale/message spécifique au flux | La formulation destinée à l'utilisateur et une certaine emphase modale restent liées aux signatures de défaillance spécifiques au flux et ne devraient pas encore être normalisées de force. |
| `handleConvert` mise en forme du modèle de vue en fonction de la direction | La logique de sélection du texte source/résultat reste couplée à l’orientation source/cible et à la composition plus large de l’UI. |
| Scénarios d'UI représentatifs orientés chemin | La couverture des scénarios diffère selon le sens de la conversion et le contexte de charge utile du endpoint, ce qui est attendu et acceptable. |

Suivant : Le travail de synthèse et de clôture de la convention de l'étape 5 commence à la sous-étape 5.5.1.

### Étape 5.5.1 — Résumé de la consolidation de l'étape 5

Cette sous-étape résume ce que l'étape 5 a concrètement consolidé au cours de la première et de la deuxième conversion migrées. chemins.

#### What Step 5 consolidé

- Les conventions de back-end partagées sont désormais explicitement alignées sur les deux chemins migrés là où cela est prévu (conventions de construction d'échecs basées sur l'assistance, conventions structurées de préservation des erreurs, conventions d'emballage de compatibilité additive).
- Les conventions de frontend/UI partagées sont désormais explicitement alignées sur les deux flux migrés lorsque cela est prévu (consommation structurée de réussite/échec, 
- La classification générique/commune vs spécifique au chemin a été formalisée du côté backend et frontend.
- L'ordre de priorité pour le travail de consolidation sécurisé a été défini puis exécuté par vagues ciblées.
- La dérive des conventions non sémantiques restante a été réduite/normalisée là où elle présentait un faible risque et était ancrée.
- Chemin croisé la validation a confirmé que les deux flux migrés suivent les mêmes règles partagées prévues lorsque ces règles sont communes.
- Les différences légitimes spécifiques au chemin ont été préservées au lieu d'être unifiées de force.
- Maintenabilité/lisibilité améliorée sans modifier la sémantique `ConversionResult` contractuelle documentée ou la sémantique de l'API.

#### Base de référence partagée/commune vs intentionnellement spécifique au chemin portée

- **Consolidé en tant que pratique partagée/commune**
- Modèles d'utilisation de l'assistant préservant les contrats
 - Règles structurées de préservation des formes d'erreur
 - Conventions de cycle de vie/état partagé et de nettoyage obsolète dans les flux frontend migrés
 - Conventions de vérification en couches et de validation de cohérence

- **Toujours intentionnellement spécifiques au chemin ou différées**
 - Éléments internes d'exécution du moteur/de l'exécution (`downdoc` chemin de chargement paresseux vs chemin Pandoc direct)
 - Propriété de la charge utile/des résultats en fonction de la direction et détails de mappage des panneaux
 - Granularité des détails d'erreur spécifiques au flux, nuances de messagerie et accent sur le scénario représentatif
 - Unification plus large de l'architecture/de l'UI au-delà de l'alignement sécurisé des conventions locales

Suivant : la sous-étape 5.5.2 formalisera le commun Base de référence de convention établie par l'étape 5.

### Étape 5.5.2 — Ligne de base de convention commune (établie par l'étape 5)

Cette sous-étape formalise la ligne de base de convention commune que l'étape 5 a stabilisée à travers les deux chemins de conversion migrés.

#### Base de référence commune du backend conventions

- Utiliser la construction de résultats standardisée basée sur l'assistance par défaut (`createSuccessResult()` / `createFailureResult()`).
- Appliquer des attentes standardisées de construction de succès/échec aux limites de l'itinéraire/de l'orchestre.
- Préserver la sémantique structurée `error` comme signification principale d'échec (`code`, `message`, facultatif détails).
- Conserver `pipeline`, `warnings`, `logs` et `meta` présents avec des attentes de forme stables.
- Conserver la dénomination/l'intégration du convertisseur orientée rôle et cohérente avec Ascend, le cas échéant.
- Préserver la sémantique backend standardisée comme signification principale de la charge utile ; les wrappers de compatibilité restent uniquement additifs.

#### Conventions de base communes du frontend/UI

- Consommer des résultats standardisés de réussite/échec du backend comme principale source sémantique de vérité pour les flux migrés.
- Suivre les attentes partagées du cycle de vie (`idle / loading / success / error`) pour la propriété de la tentative actuelle.
- Appliquer la suppression de l'état obsolète au démarrage de la tentative et sur les branches d'erreur du flux migré pour éviter affichage de réussite obsolète.
- Préserver la sémantique structurée des échecs dans la gestion de l'UI (`error.code` disponibilité et relais structuré vers l'état).
- Éviter la refonte des réussites/erreurs locales héritées lorsque la sémantique standardisée est disponible.
- Préserver la sémantique du backend jusqu'à la limite effective de l'UI (sortie, statut, notification/modale, cycle de vie 

#### Allocation spécifique au chemin de base par défaut ou mise à la terre

- **Base de référence par défaut pour les futurs flux migrés**
 - Les conventions backend et frontend répertoriées ci-dessus doivent être la référence de mise en œuvre/vérification par défaut.

- **Peut rester spécifique au chemin lorsque fondé**
 - Éléments internes de l'exécution du moteur/de l'exécution
 - Propriété de la charge utile/des résultats en fonction de la direction et mappage des panneaux
 - Granularité des détails des erreurs spécifiques au flux et nuances de formulation destinées à l'utilisateur
 - Accent sur le scénario représentatif lié à la topologie du chemin

#### Pourquoi cette référence est importante

- Elle évite de redéfinir les conventions déjà validées sur deux flux réels.
- Il améliore la maintenabilité et la cohérence à mesure que des flux supplémentaires sont migrés.
- Il fournit un point de départ stable pour les migrations futures sans forcer une abstraction excessive prématurée.

Suivant : la définition officielle de Terminé pour l'étape 5 suit dans la sous-étape 5.5.3.

### Étape 5 Définition de Terminé

Cette sous-étape formalise la définition officielle de Terminé pour l'étape 5 de la version `0.0.1.4.6`.

L'étape 5 n'est terminée que si tous les critères ci-dessous sont vrais :

- Les éléments véritablement partagés entre le premier et le deuxième flux migrés sont identifiés.
- Les éléments génériques/partagés sont clairement distingués des éléments spécifiques au chemin.
- Les priorités de consolidation sécurisées sont explicitement établies.
- Les conventions backend partagées sont consolidées le cas échéant.
- Les conventions backend partagées sont explicitement validées sur les deux chemins backend migrés.
- Les conventions frontend/UI partagées sont consolidées le cas échéant.
- Les conventions frontend/UI partagées sont explicitement validées dans les deux flux frontend migrés.
- La dérive des conventions non sémantiques restantes est réduite là où cela est sûr.
- Les différences légitimes spécifiques au chemin sont préservées. le cas échéant.
- Une convention de base commune est documentée pour les futurs flux migrés.
- La sémantique contractuelle standardisée `ConversionResult` reste inchangée.
- Les deux flux migrés restent fonctionnels et conformes au contrat après la consolidation.
- Les deux flux migrés restent sémantiquement alignés à la limite effective de l'UI/de sortie après la consolidation.

#### Ce que l'étape 5 ne nécessite pas

- Migration de flux de conversion supplémentaires.
- Large refonte de l'architecture backend.
- Large refonte du frontend/UI.
- Normalisation complète à l'échelle du produit en une seule étape.
- Élimination de tous les comportements spécifiques au chemin.
- Introduction de nouveaux cadres d'abstraction en tant que condition préalable.

#### Pourquoi cette définition de Terminé est importante

- Elle marque la transition de la validation du modèle sur deux flux à la stabilisation de la pratique partagée entre eux.
- Elle lève l'ambiguïté sur ce que signifie une « référence consolidée » dans Ascend.
- Elle fournit une base plus propre pour un travail d'extension ultérieur sans rouvrir les conditions établies. conventions.

Suivant : la note officielle de clôture de l'étape 5 suit dans la sous-étape 5.5.4.

### Étape 6.1.1 — Rester les chemins de candidats ancrés pour les futures vagues de migration

L'étape 6 commence par identifier les candidats à la migration ancrés restants qui sont déjà présents dans la base de code après les deux premières migrations. flux.

| Chemin de conversion des candidats | Statut actuel fondé | Pourquoi c'est un futur candidat réaliste à la migration |
|---|---|---|
| `Text -> Markdown` (`POST /api/text-to-markdown`) | La route backend existe dans `conversion.routes.js` ; Le routage frontal existe dans `convertText` (`txt -> markdown` sélection du endpoint). | Il s'agit déjà d'un chemin dédié (et non d'un chemin de secours générique uniquement), il peut donc être migré avec une portée limitée similaire aux vagues précédentes. |
| `HTML -> *` via Pandoc (`POST /api/from-html`) | La route backend existe pour `html -> target` ; Le routage frontend existe dans la branche `convertText` (branche `sourceFormat === 'html'`). | Flux réel déjà câblé de bout en bout avec propriété explicite de la route ; adapté à la passe de migration/alignement spécifique au chemin. |
| Route Pandoc générique (`POST /api/convert`) pour les paires de formats non migrées | Le service de conversion back-end prend en charge plusieurs formats (`txt`, `asciidoc`, `markdown`, `html`, `pdf`, `yaml`, `json`, `docx`, `epub`, `rst`, `tex`, `latex`); le frontend achemine déjà les paires non spécialisées vers `/api/convert`. | Il s’agit de la plus grande famille de candidats fondés pour les vagues futures, avec de nombreuses paires réelles déjà exécutables via un point d’entrée existant. |
| Chemin du wrapper frontal existant : `Markdown -> AsciiDoc` module wrapper (`converters/markdown-to-asciidoc.ts`) | Le module Wrapper existe toujours, tandis que le chemin d'exécution migré actif est piloté par `convertText` + `App.tsx`. | Il s'agit d'un candidat solide pour les futures décisions de nettoyage/alignement (conserver/déprécier/standardiser l'utilisation) une fois que les priorités de la vague de migration incluent l'harmonisation des wrappers. |
| Chemin du wrapper frontend existant : `AsciiDoc -> Markdown` module wrapper (`converters/asciidoc-to-markdown.ts`) | Le module Wrapper existe toujours, tandis que le chemin d'exécution migré actif est piloté par `convertText` + `App.tsx`. | Comme le wrapper opposé, il reste un candidat solide pour la consolidation future des points d’entrée front-end après les principales vagues de migration. |

Suivant : la sous-étape 6.1.2 classera ces candidats par état de préparation, risque et valeur pour la prochaine vague de migration.

### Clôture de l'étape 5

Cette sous-étape enregistre la note de clôture officielle de l'étape 5 de la libération `0.0.1.4.6`.

#### Ce que l'étape 5 a réalisé

L'étape 5 a établi :

- Une base de convention partagée entre les premier et deuxième chemins de conversion migrés.
- Consolidation côté back-end de conventions véritablement génériques et sûres à normaliser.
- Consolidation côté front-end/UI de conventions véritablement génériques et sûres à normaliser.
- Validation explicite que les deux flux migrés suivent les mêmes règles partagées prévues lorsque ces règles sont communes.
- Préservation des différences légitimes spécifiques au chemin là où elles appartiennent toujours.

#### Résultats concrets de la consolidation

- Les conventions backend partagées ont été identifiées, hiérarchisées, consolidées et validé.
- Les conventions frontend/UI partagées ont été identifiées, hiérarchisées, consolidées et validées.
- La dérive des conventions non sémantiques restantes a été réduite là où cela était sûr.
- La sémantique contractuelle standardisée `ConversionResult` est restée inchangée.
- Les deux flux migrés sont restés fonctionnels et sémantiquement alignés après la consolidation.

#### Quelle étape 5 maintenant fournit

- Une base de convention stable à deux flux pour les futurs travaux de migration.
- Une frontière plus claire entre les pratiques partagées/communes et le comportement spécifique au chemin.
- Une maintenabilité/lisibilité améliorée sur les deux premiers chemins migrés.
- Une base plus solide pour les migrations futures sans rouvrir des questions de convention déjà réglées.

#### Ce qui reste à l'extérieur Étape 5

La clôture de l'étape 5 n'implique **pas** que :

- Tous les chemins de conversion restants sont migrés.
- La refonte à l'échelle de l'architecture est terminée.
- La normalisation complète à l'échelle du produit est terminée.
- Tous les comportements spécifiques au chemin devraient disparaître.
- Le futur raffinement de l'UI/UX est terminé. terminé.
- Les travaux de l'étape 6 ont déjà commencé.

#### Note de transition

Les travaux futurs devraient s'appuyer sur la base de référence de convention partagée stabilisée établie aux étapes 1 à 5, plutôt que de rouvrir les décisions de contrat, d'alignement back-end, d'alignement front-end et de flux croisés déjà validées pour les deux premiers chemins migrés.

### Étape 6.1.2 — Classification des candidats (état de préparation, risque, valeur de migration)

Cette sous-étape classe les Les candidats à la migration bloqués restants ont été identifiés à l'étape 6.1.1 à l'aide de critères pragmatiques de préparation, de risque et de valeur de migration.

| Chemin de conversion des candidats | Préparation | Risque migratoire | Valeur de migration / signal prioritaire | Justification brève et fondée |
|---|---|---|---|---|
| `Text -> Markdown` (`/api/text-to-markdown`) | Élevé | Faible | Élevé | Une route backend dédiée et une branche frontend explicite existent déjà ; portée limitée et ajustement serré au modèle de migration à deux flux validé. |
| `HTML -> *` (`/api/from-html`) | Moyen-Haut | Moyen | Moyen-Haut | La véritable route et la branche frontend sont déjà présentes, mais le comportement multi-cible ajoute un peu plus de complexité de mappage/vérification qu'un chemin à sens unique. |
| Parcours multiformat générique (`/api/convert`) | Moyen | Élevé | Élevé (stratégique), moyen (à court terme) | Une large surface d'utilisation réelle et de nombreuses paires de formats offrent une forte valeur à long terme, mais la variance entre formats augmente le risque de migration/d'alignement pour une seule vague suivante. |
| Modules de wrapper hérités frontend (`asciidoc-to-markdown.ts`, `markdown-to-asciidoc.ts`) | Moyen | Faible-Moyen | Moyen | Candidats au nettoyage/alignement fondés avec une portée frontend limitée, mais ils sont secondaires par rapport aux priorités de migration du chemin de conversion au niveau de la route. |

#### Signal de force des candidats à court terme

- **Candidats à court terme plus forts :** `Text -> Markdown` d'abord, puis `HTML -> *` (bonne préparation avec un risque gérable et une valeur de migration claire).
- **Candidats à court terme plus faibles :** famille complète `/api/convert` comme prochaine vague immédiate (surface élevée et plus élevée) dépendance/complexité des risques), plus le nettoyage du wrapper uniquement comme priorité secondaire.

Suivant : la sous-étape 6.1.3 sélectionnera la prochaine vague de migration réaliste.

### Étape 6.1.3 — Sélection réaliste de la prochaine vague de migration

Cette sous-étape sélectionne la prochaine vague de migration réaliste en fonction de l'inventaire des candidats fondés et Classification de l'état de préparation/risque/valeur des étapes 6.1.1 et 6.1.2.

#### Vague de migration suivante sélectionnée

- **Vague sélectionnée principale :** `Text -> Markdown` (`POST /api/text-to-markdown`)

#### Pourquoi cette vague a été sélectionné

- Il présente le profil de préparation/risque le plus élevé parmi les candidats restants (préparation élevée, faible risque de migration, valeur pratique élevée).
- Il est déjà représenté par une route backend dédiée et une branche de routage frontend explicite, qui limite la portée de la migration.
- Il s'adapte directement au modèle de migration/alignement validé (convertisseur/normalisation de l'itinéraire -> préservation du backend -> consommation frontend/vérification de l'état) sans introduire complexité de l’orchestration multiformat.
- Il est susceptible de réussir sans rouvrir les conventions fondamentales établies des étapes 1 à 5.

#### Pourquoi cette vague est moins frictionnelle que les autres candidats

- Par rapport à `HTML -> *`, elle a moins de branches de format cible et donc une complexité de branchement de mappage/vérification plus faible.
- Par rapport à la large famille `/api/convert`, elle évite le risque de dépendance multiformat de grande surface en une seule vague.
- Par rapport aux candidats au nettoyage de type wrapper uniquement, il fournit une valeur de vague de migration directe sur un chemin de conversion actif plutôt qu'un nettoyage structurel secondaire.

Suivant : la sous-étape 6.2.1 définira l'ordre de migration et la stratégie d'exécution pour cette vague sélectionnée.

### Étape 6.2.1 — Ordre de migration et stratégie pour la vague sélectionnée

Cette sous-étape définit l'ordre de migration et la stratégie d'exécution pour la vague suivante sélectionnée identifiée à l'étape 6.1.3.

#### Candidat de la prochaine vague sélectionné

- `Text -> Markdown` (`POST /api/text-to-markdown`)

#### Migration recommandée commander

1. Migrez et vérifiez `Text -> Markdown` en tant que **onde à chemin unique** (exécution stricte d'un chemin à la fois).
2. Complétez la séquence validée complète sur ce chemin avant d'ouvrir tout candidat supplémentaire à l'étape 6 :
 - mappage du convertisseur/d'exécution et mappage de la charge utile d'assistance
 - normalisation réussite/échec
 - harmonisation des erreurs internes
- alignement et vérification du backend/orchestrateur
 - alignement et vérification du frontend/UI
 - contrôles de consolidation au niveau des limites

#### Pourquoi cette commande est recommandée

- `Text -> Markdown` a le profil de faible friction le plus fort (préparation la plus élevée, risque le plus faible, itinéraire/frontend clair propriété).
- Une vague stricte à chemin unique minimise le risque de chevauchement et maintient le diagnostic d'échec limité.
- Elle maximise la réutilisation du modèle de migration/alignement déjà validé des étapes 1 à 5 sans introduire de complexité de coordination multi-branches.
- Elle préserve la stabilité des conventions en empêchant une expansion prématurée vers des surfaces candidates plus larges.

#### Différée pendant/après cette date. wave

- La migration `HTML -> *` est différée jusqu'à ce que la vague `Text -> Markdown` soit entièrement terminée et validée.
- La migration de la famille `/api/convert` large reste reportée en raison de la surface/du risque multiformat.
- L'harmonisation du wrapper frontal reste reportée en tant que travail de nettoyage secondaire, ne faisant pas partie de cette vague immédiate 

Suivant : la sous-étape 6.2.2 définira les critères de préparation à la migration pour les flux de cette vague sélectionnée.

### Étape 6.2.2 — Critères de préparation à la migration pour la vague sélectionnée

Cette sous-étape définit les critères de préparation à la migration pour les chemins considérés pour l'entrée dans la stratégie de vague suivante sélectionnée (en commençant par `Text -> Markdown`).

#### Critères de préparation minimaux requis (indispensables)

- Le chemin de conversion est réel, accessible et actuellement câblé dans le code (route backend/chemin de service et chemin de déclenchement frontend pertinent).
- Le flux d'exécution est suffisamment compréhensible pour mapper de bout en bout (entrée, appel de conversion, chemin de sortie, branches d'échec).
- Les chemins nominaux de réussite et d'échec sont à la fois identifiables et testables.
- Le comportement des erreurs est suffisamment observable pour être classé et normalisé (pas entièrement opaque/introuvable).
- La limite de l'orchestration back-end est suffisamment traçable pour un travail d'alignement de style Étape 2.
- La limite de consommation Frontend/UI est suffisamment traçable pour un travail d'alignement de style Étape 3 (si le chemin est orienté vers l'utilisateur).
- La portée est suffisamment limitée pour être exécutée sans rouvrir des questions générales d'architecture ou de contrat.
- Aucune dépendance bloquante de moteur/d'exécution n'empêche actuellement le réalisme. exécution.

#### Signaux de préparation utiles mais non bloquants

- Les scripts/tests ciblés existants touchent déjà le chemin ou peuvent être étendus avec un minimum d'effort.
- Le chemin utilise partiellement les modèles d'aide/convention établis (même s'ils ne sont pas encore complètement alignés).
- Les signaux d'observabilité (journaux/erreurs) sont déjà présents et interprétable.
- Le chemin frontal utilise déjà les conventions `convertText`, réduisant ainsi le travail d'intégration supplémentaire.
- Les artefacts de migration antérieurs fournissent une réutilisation quasi directe des modèles pour ce chemin.

#### Signaux différés/non prêts (migrer ultérieurement)

- Le chemin n'est que partiellement présent ou n'est pas réellement accessible via l'exécution actuelle. câblage.
- Le comportement de réussite/échec ne peut pas être isolé de manière fiable sans un large refactor exploratoire.
- La dépendance critique du moteur est indisponible/instable, ce qui rend la validation non déterministe.
- Le chemin nécessite une refonte transversale de l'architecture/de l'UI pour migrer en toute sécurité.
- Le comportement d'erreur est trop opaque pour préserver la sémantique structurée sans conjectures à haut risque.
- La portée est intrinsèquement multi-chemins/multi-formats à la fois, avec un couplage élevé et un point d'entrée délimité peu clair.

#### Pourquoi ces critères sont importants

Ces critères maintiennent les vagues de migration futures à faible risque et contrôlées en garantissant que chaque candidat entre dans la migration uniquement lorsqu'il est délimité, traçable et exécutable via le modèle d'alignement déjà validé.

Ensuite : la sous-étape 6.2.3 classera les candidats restants en candidats faciles à gagner, à nettoyer d'abord et à reporter. groupes.

### Étape 6.2.3 — Regroupement pratique des candidats (gain facile / nettoyage d'abord / report)

Cette sous-étape classe les candidats restants en fonction de leur état de préparation pratique à la migration en utilisant les critères définis à l'étape 6.2.2.

#### Gain facile candidats

| Parcours candidat | Catégorie | Justification fondée |
|---|---|---|
| `Text -> Markdown` (`POST /api/text-to-markdown`) | Gain facile | Une route backend dédiée et une branche frontend explicite existent déjà, le comportement de réussite/échec est limité et traçable, et la portée de la migration correspond au modèle validé à faible friction. |

#### Candidats au nettoyage d'abord

| Parcours candidat | Catégorie | Justification fondée |
|---|---|---|
| `HTML -> *` (`POST /api/from-html`) | Le nettoyage d’abord | Le chemin d'exécution est réel et traçable, mais le comportement multi-cible augmente la charge de branchement/vérification ; bénéficie d’un petit nettoyage de préparation/contrainte avant l’exécution complète de la migration. |
| Modules de wrapper hérités frontend (`asciidoc-to-markdown.ts`, `markdown-to-asciidoc.ts`) | Le nettoyage d’abord | Ancrés et à faible risque en tant qu'objectifs de nettoyage, mais secondaires au travail de migration principal au niveau des routes ; Le rôle du wrapper doit être clarifié pour éviter le chevauchement/le bruit pendant l'exécution de la vague. |

#### Reporter pour les candidats ultérieurs

| Parcours candidat | Catégorie | Justification fondée |
|---|---|---|
| Famille multiformat générique (`POST /api/convert`) | Reporter à plus tard | Une large surface multiformat est réelle mais à couplage/variance élevé ; pas idéal pour une entrée immédiate d’onde à faible friction sans rouvrir une complexité multi-format plus large. |

Suivant : L'étape 6.3 définira la préparation commune de non-régression pour les futures vagues de migration.

### Étape 6.3.1 — Comparaison de la couverture de vérification existante et structure commune de non-régression

Cette sous-étape compare la couverture de vérification déjà utilisée dans les flux migrés et extrait la structure commune minimale de non-régression pour la migration future. vagues.

#### Couches de vérification déjà mises en évidence dans le projet

- Vérifications de réussite/échec du convertisseur isolé (pour le comportement au niveau du convertisseur et la sémantique des erreurs).
- Vérifications de scénarios représentatifs de base (petite couverture multi-scénarios par chemin migré).
- Vérifications de préservation du backend/orchestrateur (propagation du contrat et défaillance interne). normalisation au niveau des couches backend).
- Contrôles de préservation du frontend/UI (consommation structurée de réussite/échec et cohérence de transition d'état dans `convertText`/flux UI).
- Contrôles de réussite/échec de bout en bout (validation de la demande aux limites sur les endpoints migrés).
- Contrôles de limites efficaces :
 - contrat de limite de sortie backend vérifications,
 - vérifications efficaces de la cohérence des limites de sortie de l'UI (propriété de la tentative actuelle, comportement anti-obsolète).

#### Éléments de vérification communs et spécifiques au chemin

- **Déjà courants dans les flux migrés**
 - Assertions de champ racine du contrat pour les enveloppes de réussite/échec.
 - Échec structuré assertions (`error.code`, `error.message`, cohérence additive `detail`).
 - Au moins un succès nominal et un scénario d'échec fondé.
- Vérification de la cohérence du cycle de vie/état et de la protection contre les sorties obsolètes sur les flux frontaux migrés.
- Séquence en couches : vérifications de chemin isolé -> vérifications backend/orchestrateur -> vérifications frontend/UI -> vérifications des limites.

- **Toujours spécifique au chemin**
- Sondes d'injection de défauts moteur/d'exécution et méthodes de déclenchement d'erreurs internes.
- Assertions de propriété de charge utile/de sortie spécifiques à la direction (cibles `markdown` vs `asciidoc`).
- Mélange de scénarios représentatifs orientés chemin et attentes en matière de formulation d'erreurs adressées à l'utilisateur.

#### Structure de non-régression commune minimale pour les vagues futures

1. Vérification du chemin isolé : succès + échec structuré + une vérification de normalisation des erreurs internes.
2. Vérification backend/orchestrateur : préservation du contrat grâce à la coordination des itinéraires et aux limites de sortie.
3. Vérification frontend/UI : consommation structurée de réussite/échec, cohérence de transition `idle/loading/success/error`, sauvegardes en cas d'état obsolète.
4. Réussite de scénario représentatif : un ensemble compact couvrant une famille de défaillances nominales et au moins une famille de défaillances significatives.
5. Validation finale des limites : confirmer que la sémantique standardisée survit aux limites efficaces du backend/de l'UI.

Ensuite : la sous-étape 6.3.2 formalisera le kit de vérification minimum pour les futurs flux migrés.

### Étape 6.3.2 — Kit de vérification minimum réutilisable pour les futurs flux migrés

Cette sous-étape formalise le kit de vérification minimum réutilisable dérivé de la structure commune de non-régression validée à travers les flux migrés.

#### Vérifications minimales requises

- **Contrôle de réussite du convertisseur isolé**
- Vérifier la sortie de réussite nominale et la sémantique de réussite standardisée au niveau du convertisseur/du chemin.
- **Contrôle de défaillance du convertisseur isolé**
 - Vérifier qu'au moins un chemin de défaillance fondé renvoie/préserve la sémantique de défaillance structurée.
- **Contrôle de préservation du backend/orchestrateur**
 - Vérifier la propagation standardisée des résultats à travers la couche de coordination du backend.
- **Vérification de réussite de bout en bout**
 - Vérifiez que le succès survit depuis l'entrée de la demande jusqu'à la limite de sortie effective pour le chemin migré.
- **Contrôle d'échec de bout en bout**
 - Vérifiez que l'échec survit avec une sémantique d'erreur structurée (`error.code` disponible) jusqu'à la limite de sortie effective.
- **Vérification efficace des limites du backend**
 - Vérifiez la finale La limite de charge utile du back-end préserve la sémantique du contrat (y compris les champs de compatibilité additifs uniquement).

#### Vérifications recommandées mais facultatives

- **Ensemble de scénarios représentatifs compacts**
 - Ajoutez 2 à 4 scénarios pertinents pour le chemin (variantes de défaillance nominales + significatives) pour réduire les angles morts de régression.
- **normalisation des erreurs internes sonde**
 - Ajoutez une sonde de défaillance interne ciblée pour confirmer un comportement de normalisation structuré sûr.
- **Contrôle de cohérence des tentatives croisées**
 - Vérifiez la cohérence de la séquence de réussite->échec ou d'échec->succès pour les flux frontaux migrés.
- **Script de régression de limite ciblée**
 - Ajoutez un script/test dédié si le chemin a connu historique des risques de dérive des limites.

#### Vérifications conditionnelles/dépendantes du chemin

- **Contrôles de préservation du frontend/UI** (conditionnel)
 - Obligatoire lorsque le chemin est orienté vers l'utilisateur dans le flux de produit actuel ; peut être limité aux chemins internes/backend uniquement.
- **Vérification efficace des limites de l'UI** (conditionnel)
 - Requis lorsqu'une limite réelle de consommation/de rendu de l'UI existe pour le chemin migré.
- **Sondes internes spécifiques au moteur** (conditionnel)
 - S'appliquent uniquement lorsque le temps d'exécution d'un chemin permet une injection déterministe sûre de fautes ou est contrôlé déclencheurs d'erreurs internes.

#### Pourquoi ce kit est important

Ce kit maintient les vagues de migration à faible risque et comparables en appliquant un plancher de vérification minimum cohérent entre les flux tout en permettant des vérifications dépendantes du chemin lorsqu'elles sont fondées.

Suivant : la sous-étape 6.3.3 convertira ce kit de vérification en une migration playbook/checklist.

### Étape 6.3.3 — Playbook de migration opérationnelle (liste de contrôle réutilisable)

Cette sous-étape transforme le modèle de migration/d'alignement validé en un playbook opérationnel concis pour les futures migrations de flux de conversion.

#### Liste de contrôle de migration requise (par défaut séquence)

1. Confirmer l'état de préparation du candidat par rapport aux critères minimaux de l'étape 6.2.2.
2. Cartographier le convertisseur de courant/le flux d'exécution (chemin de réussite, chemin d'échec, comportement d'erreur interne).
3. Mappez les champs de charge utile en entrées `createSuccessResult()` / `createFailureResult()`.
4. Intégrer la construction standardisée des résultats du chemin de réussite.
5. Intégrer la construction standardisée des résultats du chemin de défaillance.
6. Harmonisez le comportement des erreurs internes dans une sémantique de défaillance structurée.
7. Exécutez la vérification du convertisseur/chemin isolé (vérifications du kit minimum requis).
8. Identifiez la cible d’alignement backend/orchestrateur pour le chemin.
9. Cartographier la propagation des succès/échecs du backend et les points de risque contractuel.
10. Appliquez une correction minimale du backend pour préserver une sémantique standardisée.
11. Vérifiez le comportement du contrat de limite de sortie backend.
12. Identifiez la cible d'alignement frontend/UI pour le même chemin (si orienté vers l'utilisateur).
13. Cartographier la consommation de succès/échec du frontend et le comportement de l'état.
14. Appliquer une correction frontend minimale pour la sémantique structurée + la cohérence de l'état.
15. Vérifier la cohérence efficace des limites de l’UI et les garanties obsolètes.
16. Exécutez la passe finale de non-régression multicouche à l'aide du kit de vérification minimum.
17. Enregistrez les notes de comparaison/consolidation des chemins par rapport aux flux précédemment migrés.

#### Éléments de la liste de contrôle conditionnels/lorsqu'applicables

- Appliquez l'alignement du frontend/UI et les vérifications des limites de l'UI uniquement lorsque le chemin est orienté vers l'utilisateur dans le flux de produit actuel.
- Ajoutez des sondes de panne interne spécifiques au moteur uniquement lorsque l'injection déterministe de pannes est réalisable et sûr.
- Développez les scénarios représentatifs uniquement lorsque la complexité du chemin justifie une couverture supplémentaire.
- Ajoutez des vérifications de compatibilité-wrapper uniquement lorsque des champs d'emballage additifs sont présents à la limite.
- Incluez des vérifications de nettoyage d'entrée de wrapper uniquement lorsque le chemin a encore un chevauchement de wrapper existant.

#### Arrêtez/différez les signaux (ne continuez pas encore)

- Le chemin n'est pas entièrement accessible ou le câblage est incomplet.
- Le comportement de réussite/échec ne peut pas être cartographié sans un large refactor exploratoire.
- La dépendance d'exécution critique/l'état du moteur est instable ou indisponible.
- La portée de la migration forcerait une refonte transversale de l'architecture/de l'UI.
- Le comportement des erreurs est trop opaque pour préserver la sémantique structurée en toute sécurité.
- Le candidat nécessite un couplage multi-chemins/multi-formats au-delà d'une portée d'ondes limitées.

#### Pourquoi ce playbook est important

Ce playbook maintient les migrations futures contrôlées, comparables et à faible risque en appliquer une séquence reproductible et limitée avec des portes de préparation explicites et des attentes de validation de non-régression.

Suivant : la sous-étape 6.4.1 résumera ce que l'étape 6 a préparé pour la prochaine vague de migration.

### Étape 6.4.1 — Résumé de la préparation de l'étape 6

Cette sous-étape résume ce que l'étape 6 a concrètement préparé pour les futures vagues de migration.

#### Ce que l'étape 6 a préparé

- Un inventaire fondé des candidats à la migration restants encore présents dans la base de code.
- Une classification pragmatique préparation/risque/valeur pour ces candidats.
- Sélection de la prochaine vague de migration réaliste (`Text -> Markdown`) avec des justification.
- Critères de préparation à la migration définissant les conditions minimales d'entrée pour les futures vagues candidates.
- Regroupement pratique en catégories faciles à gagner, nettoyage d'abord et différé.
- Une structure de non-régression commune minimale extraite des flux déjà migrés.
- Un kit de vérification minimum réutilisable pour les futurs flux migrés (contrôles obligatoires/facultatifs/conditionnels).
- Une migration opérationnelle playbook/liste de contrôle définissant la séquence requise, les étapes conditionnelles et les signaux d'arrêt/différation.

#### Matériel de planification stable vs travail de mise en œuvre hors champ

- **Maintenant préparé en tant que matériel de planification de migration stable**
 - Inventaire des candidats et logique de priorisation
 - Portes de préparation et justification de la sélection des vagues
 - Base de référence de non-régression et de vérification réutilisable
 - Migration opérationnelle réutilisable liste de contrôle

- **Toujours en dehors du champ d'application de l'étape 6**
 - Mise en œuvre réelle de la migration des flux supplémentaires
 - Modifications du code d'exécution/backend/frontend pour les nouveaux chemins
 - Travail plus large de refonte de l'architecture/de l'UI
 - Exécution des vagues de migration ultérieures au-delà de la préparation de la planification actuelle

Suivant : sous-étape 6.4.2 formalisera la préparation à la migration et la ligne de base du playbook établie par l'étape 6.

### Étape 6.4.2 — Préparation à la migration et référence du playbook

Cette sous-étape formalise la préparation à la migration par défaut et la base du playbook opérationnel préparée par l'étape 6 pour les futures vagues de migration.

#### Attentes de base en matière de préparation (conditions d'entrée par défaut)

- Le chemin du convertisseur existe et est actuellement accessible dans le câblage d'exécution.
- Le flux d'exécution est suffisamment compréhensible pour être cartographié de bout en bout.
- Les chemins de réussite et d'échec sont identifiables et testables.
- Le chemin back-end est suffisamment traçable pour le travail d'alignement de préservation des contrats.
- Le chemin frontend/UI est suffisamment traçable lorsque le flux est orienté vers l'utilisateur.
- La portée de la migration est suffisamment limitée pour une exécution en une seule vague.
- Aucune dépendance bloquante/état du moteur ne rend le flux non viable maintenant.

#### Attentes de base du Playbook (migration par défaut comportement)

- Migrer un flux réel limité à la fois.
- Cartographier le flux d'exécution avant le travail d'intégration de la charge utile d'assistance.
- Standardiser la sémantique de réussite et d'échec avant un alignement large de la couche environnante.
- Vérifier le comportement du convertisseur/chemin isolé avant l'alignement backend/frontend.
- Préserver la sémantique standardisée au lieu de reconstruire l'héritage local modèles.
- Appliquer le kit de vérification réutilisable minimum avant d'envisager une migration de flux en toute sécurité.

#### Adaptation spécifique au chemin de base par défaut ou mise à la terre

- **Base de référence par défaut**
 - Les attentes de préparation et de playbook ci-dessus doivent s'appliquer aux vagues futures, sauf exception fondée. existe.

- **Peut nécessiter une adaptation spécifique au chemin en cas de mise à la terre**
 - Fonctions internes du moteur/d'exécution et faisabilité déterministe de l'injection de fautes.
 - Propriété de la charge utile en fonction de la direction et mappage du panneau cible de l'UI.
 - Granularité des détails des erreurs spécifiques au flux et nuances de formulation destinées à l'utilisateur.
 - Accent mis sur le scénario requis par le chemin topologie ou comportement de dépendance externe.

#### Pourquoi cette référence est importante

- Elle réduit les nouvelles décisions sur les principes de migration déjà validés lors des étapes précédentes.
- Elle maintient les vagues futures contrôlées, comparables et limitées.
- Elle permet d'éviter les refactorisations prématurées et la portée de migration illimitée.

Suivant : la définition officielle de Terminé pour l'étape 6 suit dans la sous-étape. 6.4.3.

### Étape 6 Définition de Terminé

Cette sous-étape formalise la définition officielle de Terminé pour l'étape 6 de la version `0.0.1.4.6`.

L'étape 6 n'est terminée que si tous les critères ci-dessous sont vrais :

- Candidat restant ancré les chemins de conversion sont identifiés.
- Ces candidats sont classés par état de préparation, risque et valeur de migration.
- La prochaine vague de migration réaliste est sélectionnée.
- Un ordre/une stratégie de migration pour cette vague est définie.
- Des critères pratiques de préparation à la migration sont définis.
- Les candidats restants sont regroupés en catégories faciles à gagner, nettoyer d'abord et reporter pour plus tard. catégories.
- La couverture de vérification existante à travers les flux migrés est comparée.
- Une structure de non-régression commune minimale est extraite.
- Un kit de vérification minimum réutilisable est documenté.
- Un playbook/checklist de migration opérationnel est documenté.
- Une référence de préparation/playbook de migration est formalisée pour les vagues futures.
- L'étape 6 distingue clairement ce qui est préparé maintenant et ce qui nécessite une mise en œuvre future.

#### Ce que l'étape 6 ne nécessite pas

- Migration d'un troisième flux.
- Refactorisation des flux candidats restants.
- Refonte du backend ou du frontend.
- Mise en œuvre immédiate du prochain sélectionné. wave.
- Normalisation complète de tous les convertisseurs restants dans cette étape.

#### Pourquoi cette définition de Terminé est importante

- Elle marque la transition de la validation/consolidation des premiers flux migrés à la préparation des vagues futures de manière contrôlée.
- Elle lève l'ambiguïté sur ce que signifie « préparation à la migration » dans Ascend planification.
- Il fournit une base de planification stable pour une mise en œuvre future sans rouvrir les principes de migration sédentaire.

Suivant : la note officielle de clôture de l'étape 6 suit dans la sous-étape 6.4.4.

### Clôture de l'étape 6

Cette sous-étape enregistre la note officielle de clôture pour l'étape 6 de la libération `0.0.1.4.6`.

#### Ce que l'étape 6 a réalisé

L'étape 6 a été établie avec succès :

- Un inventaire fondé des candidats à la migration restants.
- Une classification pragmatique de l'état de préparation/risque/valeur pour ces candidats.
- Une prochaine vague de migration réaliste sélectionnée.
- Des critères explicites de préparation à la migration.
- Un cadre pratique facile à gagner/nettoyer d'abord/différer.
- Un minimum de non-régression et de vérification réutilisable. baseline.
- Un manuel/liste de contrôle de migration opérationnelle pour les flux futurs.

#### Résultats concrets de la préparation

- Ascend dispose désormais d'une méthode documentée pour décider quels flux restants doivent ensuite être migrés.
- Les futures vagues de migration peuvent être préparées sans rouvrir le contrat et les principes d'alignement déjà validés.
- Un kit de vérification minimum existe désormais pour comparer flux migrés futurs sur une base de référence commune.
- La planification de la migration est désormais plus contrôlée, comparable et à faible risque.

#### Ce que l'étape 6 fournit désormais

- Une base de référence stable pour la préparation à la migration.
- Un cadre de planification pratique pour les futures vagues.
- Une base de référence de vérification réutilisable pour les futures migrations flux.
- Un pont plus propre entre les premières migrations validées et les travaux de mise à l'échelle ultérieurs.

#### Ce qui reste en dehors de l'étape 6

La clôture de l'étape 6 n'implique **pas** que :

- La prochaine vague de migration sélectionnée a déjà été mise en œuvre.
- Un troisième flux a déjà été migré.
- Les flux candidats restants ont déjà été nettoyés.
- La refonte du backend ou du frontend est terminée.
- Tous les convertisseurs restants sont normalisés.
- Étape 7 le travail a déjà commencé.

#### Note de transition

Les travaux futurs devraient s'appuyer sur la préparation à la migration et la référence du manuel documentée dans les étapes 1 à 6, plutôt que de rouvrir les décisions déjà validées en matière de contrat, d'alignement, de consolidation et de méthode de migration.

### Étape 7.1.1 — Confirmation du premier flux exécutable (Vague sélectionnée)

L'étape 7 commence par confirmer le premier flux exécutable concret à l'intérieur de la vague de migration sélectionnée à l'étape 6.

- **Vague sélectionnée :** `Text -> Markdown` vague de migration
- **Premier flux concret à exécuter :** `Text -> Markdown` via `POST /api/text-to-markdown`

Pourquoi ce flux est confirmé en premier :

- Il a la préparation pratique la plus élevée parmi la portée de la vague sélectionnée.
- Il a la friction d'exécution et la complexité de dépendance attendues les plus faibles.
- Il est le mieux adapté au manuel de migration/alignement validé et au kit de vérification minimum.
- Elle offre les meilleures chances d'obtenir un résultat de première exécution propre pour l'étape 7 avant toute expansion de vague plus large.

Suivant : la sous-étape 7.1.2 définira l'ordre d'exécution pour les éléments restants de cette vague.

### Étape 7.1.2 — Ordre d'exécution pratique à l'intérieur de la vague sélectionnée

Cette sous-étape définit les ordre d'exécution à l'intérieur de la vague de migration sélectionnée avant le début de la mise en œuvre.

- **Vague de migration sélectionnée :** `Text -> Markdown` vague
- **Premier flux confirmé :** `Text -> Markdown` via `POST /api/text-to-markdown`

#### Ordre d'exécution recommandé

1. Exécuter `Text -> Markdown` la migration de bout en bout en tant que premier et unique élément de mise en œuvre actif dans la vague.
2. Exécutez une validation complète par rapport au playbook établi et au kit de vérification minimum pour ce flux.
3. Seulement après avoir validé la première preuve d'exécution, décidez s'il convient d'ouvrir le candidat suivant (`HTML -> *`) en tant qu'élément de vague de suivi distinct.

#### Pourquoi cet ordre est recommandé

- Il maintient la cadence strictement séquentielle et contrôlée (aucune interférence de migration parallèle).
- Il maximise la réutilisation de la méthode de migration/alignement validée sur le chemin de préparation le plus élevé. 
- Il minimise le risque de couplage tout en préservant des limites claires de diagnostic de défaillance.
- Il évite d'étendre la portée avant que les preuves de première exécution ne confirment le comportement à faible friction attendu.

#### Différé jusqu'à ce que les preuves de première exécution soient validées.

- `HTML -> *` reste différé jusqu'à ce que l'exécution et la vérification de `Text -> Markdown` soient terminées.
- La famille générique `/api/convert` reste différée (complexité de surface élevée).
- Le nettoyage axé sur le wrapper reste différé en tant que travail secondaire en dehors de cet ordre d'exécution immédiat.

Suivant : sous-étape 7.1.3 gèlera la portée d'exécution de l'étape 7.

### Étape 7.1.3 — Gel de la portée d'exécution de l'étape 7

Cette sous-étape gèle la portée d'exécution de l'étape 7 afin que la vague de migration sélectionnée reste délimitée, contrôlée et protégée contre la dérive de la portée avant la mise en œuvre.

- **Vague de migration sélectionnée :** `Text -> Markdown` wave
- **Premier flux exécutable confirmé :** `Text -> Markdown` via `POST /api/text-to-markdown`

#### IN scope pour l'étape 7

- Exécuter le travail de migration pour le premier flux confirmé uniquement (`Text -> Markdown`).
- Suivre l'ordre d'exécution défini à l'étape 7.1.2 (progression strictement séquentielle).
- Appliquer la séquence validée du playbook de migration/alignement des étapes 1 à 6.
- Appliquer le kit de vérification réutilisable minimum et les contrôles de limites pour ce flux.
- Effectuer uniquement les correctifs minimaux et limités au flux requis pour préserver la sémantique standardisée et la non-régression.

#### HORS de la portée de l'étape. 7

- Migrer en parallèle des flux supplémentaires non liés.
- Large refonte de l'architecture backend.
- Large refonte du frontend/UI.
- Construire de nouveaux frameworks/couches d'abstraction génériques sans besoin de blocage.
- Nettoyage à l'échelle du produit sans rapport avec la vague sélectionnée.
- Réouverture de décisions de contrat/alignement/convention déjà validées sans preuve de blocage fondée.

#### Reporté à plus tard

- `HTML -> *` migration jusqu'à ce que la première exécution du flux soit terminée et validée.
- Migration familiale générique `/api/convert`.
- Nettoyage axé sur le wrapper et travail d'harmonisation plus large.
- Toute normalisation de flux croisés plus importante au-delà de cette vague d'exécution limitée.

#### Pourquoi ce gel de la portée est important

Il maintient l'exécution de l'étape 7 à faible risque, diagnostiquable et comparable en empêchant l'expansion de la portée en cours de vol et en préservant une cadence de migration contrôlée en un seul flux.

Ensuite : la sous-étape 7.2.1 commencera le mappage du flux d'exécution du premier flux exécutable.

### Étape 7.2.1 — Cartographie du flux d'exécution actuel (avant l'intégration de l'assistance)

Cette sous-étape mappe le flux d'exécution actuel avant l'intégration de l'assistant pour le premier flux exécutable à l'intérieur de la vague de l'étape 7 sélectionnée.

- Vague de migration sélectionnée : **Texte -> Markdown**
- Premier flux exécutable : **`POST /api/text-to-markdown`**

#### Flux d'exécution actuel (fondé)

1. La requête entre `api/backend/routes/conversion.routes.js` à `router.post('/text-to-markdown', ...)`.
2. Le middleware de validation au niveau de la route (`validate` + `zod`) nécessite `body.text` comme forme de chaîne non vide (`z.string().min(1)`).
3. Le gestionnaire de route lit `text` à partir de `req.body`.
4. Route applique une deuxième pré-vérification locale : `if (!text.trim())` puis renvoie HTTP `400` avec `{ detail: "The text to convert is empty" }`.
5. La conversion des journaux d'itinéraire commence par la taille d'entrée (`console.log`).
6. La route invoque `text2markdown(text)` à partir de `api/backend/services/conversion/convert.js` (appelée avec `await` ; la fonction elle-même est synchrone et renvoie une chaîne ou lance).
7. `text2markdown` effectue une analyse/normalisation des lignes en mémoire (titres, listes, séparateurs, liens/e-mails simples), réduit les lignes vides supplémentaires et renvoie le texte Markdown normalisé se terminant par une nouvelle ligne.
8. La route enregistre le succès de la conversion et renvoie HTTP `200` avec `{ markdown }`.
9. Si une exception est levée (route/corps/exécution), la route `catch` enregistre l'erreur et renvoie HTTP `500` avec `{ detail: "Conversion error: ..." }`.

#### Forme actuelle du chemin de réussite

 - La réponse réussie est actuellement héritée/simple : `200` avec `{ markdown: string }`.
- Aucun objet `ConversionResult` standardisé n'est actuellement attaché sur ce chemin.

#### Forme actuelle du chemin d'échec

- Les réponses aux échecs sont actuellement des enveloppes de détails de chaîne :
 - Échecs de validation/pré-vérification : `400` avec `{ detail: string }`.
 - Échecs d'exécution : `500` avec `{ detail: string }`.
- L'objet structuré `error` (`code`, `message`, `details`) n'est actuellement pas émis sur ce chemin.

#### Observations pertinentes pour l'intégration (avant le mappage d'assistance)

- Aucun fichier temporaire n'est créé dans ce chemin ; la conversion s'effectue uniquement en mémoire.
- Aucune mesure de durée n'est actuellement suivie au niveau de l'itinéraire.
- Aucun tableau structuré `warnings`/`logs` ou objet `meta` n'est actuellement renvoyé.
- Les métadonnées d'artefact de sortie (fichier de sortie/objet chemin) ne sont pas présentes actuellement.
- La génération d'erreurs est actuellement basée sur le lancement/les détails de chaîne, avec points d'entrée de défaillance mixtes (validation du middleware, vérification de l'ajustage de la route, bloc catch).

Suivant : le mappage de la charge utile de ce flux actuel vers les assistants centralisés (`createSuccessResult()` / `createFailureResult()`) est défini dans la sous-étape 7.2.2.

### Étape 7.2.2 — Mappage de la charge utile vers les assistants centralisés (avant Intégration)

Cette sous-étape définit le mappage de la charge utile vers les assistants centralisés avant l'intégration à l'exécution pour le premier flux exécutable Step 7.

- Vague de migration sélectionnée : **Texte -> Markdown**
- Premier flux exécutable : **`POST /api/text-to-markdown`**

#### Mappage de la charge utile réussi (`createSuccessResult(payload)`)

| Champ | Source d'exécution actuelle | Stratégie de cartographie pour l'intégration |
|---|---|---|
| `conversionId` | Non créé actuellement dans l'itinéraire `/text-to-markdown` | Dérivez localement au début de la demande (même modèle d'UUID au niveau de la route utilisé dans les chemins migrés). |
| `converter` | L'itinéraire appelle actuellement `text2markdown(text)` directement | Définissez un identifiant de convertisseur stable pour ce flux (attendu : `"text2markdown"`). |
| `pipeline` | Non émis actuellement | Dérivez un pipeline à chemin fixe pour cet itinéraire (attendu : `["text->markdown"]`). |
| `inputFormat` | Implicite par itinéraire (`text-to-markdown`) | Définissez sur `"txt"` (ou `"text"` si la convention du projet l'exige), conformément à la sémantique de l'itinéraire. |
| `outputFormat` | Implicite par le retour de l'itinéraire (`markdown`) | Réglez sur `"markdown"`. |
| `inputFile` | Demander le corps du texte uniquement ; aucun objet d'artefact de fichier actuellement construit | Dérivez le descripteur d'entrée en mémoire à partir du texte de la demande (`originalName`, `storedPath`, `size`, `mimeType`). |
| `outputFile` | Texte du résultat disponible en mémoire ; aucun objet artefact de sortie actuellement construit | Dérivez le descripteur de sortie en mémoire à partir de la longueur de démarque produite et du type MIME. |
| `startedAt` | Pas actuellement suivi | Dérivé à la demande de l'horodatage de début. |
| `finishedAt` | Pas actuellement suivi | Dérivez à l’horodatage de réussite. |
| `durationMs` | Pas actuellement suivi | Dérive du delta de synchronisation de début/fin. |
| `warnings` | Pas structuré actuellement | Utilisez l'assistance par défaut (`[]`) à moins que des avertissements fondés ne soient introduits localement ultérieurement. |
| `logs` | Les journaux de la console existent mais aucune liste de journaux structurée par tentative | Utilisez l'assistant par défaut (`[]`) pour cette étape de migration. |
| `meta` | Non émis actuellement | Dérivez un objet de métadonnées d'itinéraire minimal (par exemple, identifiant d'itinéraire + mode de transport). |

#### Cartographie de la charge utile de défaillance (`createFailureResult(payload)`)

| Champ | Source d'exécution actuelle | Stratégie de cartographie pour l'intégration |
|---|---|---|
| `conversionId` | Pas créé actuellement | Dérivez localement au début de la demande (même identifiant que la tentative de branchement réussie). |
| `converter` | Appel direct au `text2markdown` | Définir sur le même identifiant de convertisseur stable que la branche réussie. |
| `pipeline` | Non émis actuellement | Dérivez une valeur de pipeline fixe pour ce flux (`["text->markdown"]`). |
| `inputFormat` | Sémantique des routes | Réglez systématiquement sur `"txt"` (ou équivalent approuvé par le projet). |
| `outputFormat` | Sémantique des routes | Réglez sur `"markdown"`. |
| `inputFile` | Demander le corps du texte uniquement | Dérivez le descripteur d’entrée en mémoire à partir du texte disponible (contenu vide ou fourni). |
| `startedAt` | Pas actuellement suivi | Dériver au début de la demande. |
| `finishedAt` | Pas actuellement suivi | Dériver à la fin de l'échec. |
| `durationMs` | Pas actuellement suivi | Dérivez le temps écoulé à la fin de l’échec. |
| `error` | Actuellement aplati à `{ detail: ... }` dans 400/500 réponses | Construisez un `error` structuré avec un `code/message/details` fondé (contexte de pré-vérification de route et d'échec d'exécution). |
| `outputFile` | Aucun artefact de sortie en cas d'échec aujourd'hui | Définissez `null` sauf si un artefact de sortie fondé existe au moment de l'échec. |
| `warnings` | Pas structuré actuellement | Utilisez l'assistant par défaut (`[]`). |
| `logs` | Seule la journalisation de la console existe | Utilisez l'assistant par défaut (`[]`) pour cette étape. |
| `meta` | Non émis actuellement | Dérivez un objet de métadonnées minimal (`route`, `transport`, marqueur d'étape facultatif). |

#### Observations pertinentes pour l'intégration

- **Déjà directement disponible :** texte d'entrée, démarque produite (succès), identité de l'itinéraire et contexte d'échec de capture/pré-vérification.
- **Doit être dérivé localement pendant l'intégration :** `conversionId`, champs de synchronisation, descripteurs d'entrée/sortie en mémoire et minimum `meta`.
- **Doit être normalisé à partir du comportement actuel :** la forme de défaillance actuelle `{ detail: ... }` doit être mappée à l'assistant structuré `error`.
- **Actuellement absent dans ce chemin :** charges utiles structurées `warnings`/`logs` et métadonnées d'artefact de sortie sur échec.

Suivant : l'intégration à l'exécution du chemin de réussite pour ce flux commence à la sous-étape 7.2.3.

### Étape 7.3.2 — Cartographie du flux backend/orchestre via la cible d'alignement confirmée

Cette sous-étape mappe le flux backend/orchestrateur du premier flux exécutable de l'étape 7 à travers la cible d'alignement confirmée, après l'intégration 7.2.3/7.2.4/7.2.5.

- Vague de migration sélectionnée : **Texte -> Markdown**
- Premier flux exécutable : **`POST /api/text-to-markdown`**
- Étape confirmée Cible d'alignement 7.3 : **`api/backend/routes/conversion.routes.js` à `router.post('/text-to-markdown', ...)`**

#### Flux backend nominal orienté vers le succès (exécution actuelle mise à la terre)

1. La requête entre dans le backend à `POST /api/text-to-markdown` dans `api/backend/routes/conversion.routes.js`.
2. Le middleware de validation au niveau de la route (`validate` + `zod`) accepte `body.text` comme `z.string()`.
3. La route initialise le contexte par tentative (`conversionId`, `startedAt`, `startedAtMs`) à l'intérieur de la cible d'alignement confirmée.
4. La route applique une pré-vérification sémantique locale (`!text.trim()`) et continue uniquement pour le texte non vide.
5. La route invoque l'exécution du convertisseur (`await text2markdown(text)`) jusqu'à `api/backend/services/conversion/convert.js`.
6. En cas de succès du convertisseur, la route dérive `finishedAt` et `durationMs`.
7. Le premier succès standardisé `ConversionResult` est créé dans la cible d'alignement via `createSuccessResult(...)`, avec :
 - champs convertisseur/pipeline/format (`text2markdown`, `["text->markdown"]`, `txt -> markdown`)
 - en mémoire `inputFile` et `outputFile`
 - timing (`startedAt`, `finishedAt`, `durationMs`)
 - `warnings: []`, `logs: []`, `meta` objet.
8. La route renvoie la charge utile finale de réussite au niveau du backend sous la forme `{ markdown, conversionResult }` à la limite de réponse HTTP.

#### Flux backend orienté vers les échecs (exécution mise à la terre actuelle)

1. Même point d’entrée backend et même validation au niveau de l’itinéraire que le flux de réussite.
2. Si la pré-vérification sémantique échoue (`!text.trim()`) :
 - l'échec est normalisé dans la cible d'alignement via `buildTextToMarkdownFailure(...)` -> `createFailureResult(...)`
 - le code fondé est `EMPTY_INPUT` avec `error.details.stage = "route-precheck"`
 - la réponse finale est HTTP `400` avec un résultat d'échec standardisé plus la compatibilité `detail`.
3. Si l'exécution du convertisseur renvoie :
 - le convertisseur local `try/catch` dans la cible d'alignement classe l'échec comme `CONVERSION_FAILED` (`stage = "converter-execution"`)
 - l'échec est normalisé via `buildTextToMarkdownFailure(...)` -> `createFailureResult(...)`
 - la réponse finale est HTTP `500` avec un résultat d'échec standardisé plus la compatibilité `detail`.
4. Si une exception inattendue au niveau de la route/interne se produit en dehors du catch local du convertisseur :
 - la route externe `catch` est classée comme `INTERNAL_ERROR` (`stage = "route-internal"`)
 - l'échec est normalisé via `buildTextToMarkdownFailure(...)` -> `createFailureResult(...)`
 - la réponse finale est HTTP `500` avec un résultat d'échec standardisé plus compatibilité `detail`.

#### Cycle de vie des résultats standardisé jusqu'à la cible confirmée

- **Premier point de création (succès) :** `createSuccessResult(...)` à l'intérieur de `router.post('/text-to-markdown', ...)` dans `conversion.routes.js`.
- **Premier point de création (échec) :** `createFailureResult(...)` via `buildTextToMarkdownFailure(...)` dans le même gestionnaire de route.
- **Propagation vers le haut :** un objet standardisé est créé et renvoyé directement par la cible confirmée (aucune couche d'orchestrateur backend supplémentaire ne le mute pour ce chemin).
- **Chemin de retour final du backend :** La réponse de route express (`res.json(...)`) est la limite de sortie backend effective pour ce flux.

#### Observations sur la préservation du contrat et les risques liés au contrat

##### Préservé correctement

- Les objets standardisés de réussite et d'échec sont tous deux créés dans la cible d'alignement avant l'émission de la réponse.
- Les champs de contrat requis au niveau racine sont préservés dans les réponses de réussite et d'échec.
- Les branches d'échec utilisent un `error` structuré avec des codes fondés (`EMPTY_INPUT`, `CONVERSION_FAILED`, `INTERNAL_ERROR`).
- `warnings`, `logs` et `meta` restent structurellement cohérents avec le contrat établi. baseline.

##### Enrichi en toute sécurité

- La compatibilité `detail` est additive (`detail === error.message`) et ne remplace pas la structure `error`.
- Le contexte de la scène est préservé dans `error.details.stage` pour les diagnostics.

##### Points de risque remodelés/déshabillés/emballés/contournés

- **Enveloppé (intentionnel) :** le succès est enveloppé comme `{ markdown, conversionResult }` et l'échec comme `{ ...conversionResult, detail }` ; ceci est cohérent avec les modèles de compatibilité des routes migrées existants.
- **Ne s'applique pas à ce flux :** aucune étape d'orchestration de registre/résolution de module de chargement différé n'est utilisée sur `text-to-markdown`, il n'y a donc aucun risque contractuel aux limites de registre/chargement paresseux pour ce chemin spécifique.
- **Risque résiduel (faible) :** les échecs de validation du middleware au niveau de la route qui se produisent avant l'exécution du gestionnaire peuvent toujours contourner la route construite `ConversionResult` mise en forme si le schéma redevient plus strict ; La vérification préalable actuelle de l'itinéraire `z.string()` plus évite cette dérive.

>Suivant : la sous-étape 7.3.3 identifiera les points de risque du contrat backend/orchestrateur et définira le comportement cible du backend/orchestrateur pour ce flux de l'étape 7.

### Étape 7.3.3 — Points de risque et cible du contrat backend/orchestrateur. Comportement (flux de la première étape 7)

Cette sous-étape identifie les points de risque liés au contrat backend/orchestrateur et définit le comportement du backend cible pour le premier flux exécutable de l'étape 7, en réutilisant le mappage de flux 7.3.2.

- Vague de migration sélectionnée : **Texte -> Markdown**
- Premier flux exécutable : **`POST /api/text-to-markdown`**
- Cible d'alignement confirmée à l'étape 7.3 : **`api/backend/routes/conversion.routes.js` à `router.post('/text-to-markdown', ...)`**

#### Points de risque exacts dans le flux backend/orchestrateur actuel

1. **Point d'échappement du middleware avant le gestionnaire (risque pré-cible)**
 - **Où :** étape de validation du middleware avant l'exécution du corps du gestionnaire de route.
 - **Pourquoi risqué :** si les contraintes de schéma redeviennent plus strictes (par exemple, retour à `min(1)`), le rejet de la demande peut se produire avant la construction `createFailureResult(...)` au niveau de la route, produisant une erreur non standardisée enveloppes.
 - **Statut actuel :** faible risque résiduel (actuellement atténué par `z.string()` + contrôle préalable de l'itinéraire).

2. **Asymétrie du wrapper HTTP à la limite de sortie**
 - **Où :** forme de réponse finale (`{ markdown, conversionResult }` en cas de succès contre `{ ...conversionResult, detail }` en cas d'échec).
 - **Pourquoi prendre le risque :** les consommateurs en aval qui lisent uniquement les clés de niveau supérieur peuvent dériver vers une gestion spécifique au chemin et ignorer l'objet standardisé comme source principale.
 - **Statut actuel :** un wrapper de compatibilité acceptable, mais toujours un risque de consommation contractuelle si les consommateurs ne sont pas disciplinés.

3. **Dérive de champ de compatibilité additive (`detail`)**
 - **Où :** les réponses d'échec incluent `detail` en plus de `error`.
 - **Pourquoi risqué :** les modifications futures pourraient accidentellement diverger `detail` de `error.message`, réintroduisant une sémantique parallèle.
 - **Actuel statut :** actuellement sûr (`detail === error.message`), mais nécessite des garde-corps continus.

4. **Risque de reconstruction partielle dans les mises à jour de l'assistant de route locale**
 - **Où :** `buildTextToMarkdownFailure(...)` et assemblage réussi de la charge utile dans la route.
 - **Pourquoi risqué :** les modifications futures pourraient omettre les champs requis au niveau racine (`warnings`, `logs`, `meta`, champs de synchronisation ou descripteurs de fichiers), provoquant un contrat silencieux érosion.
 - **Statut actuel :** actuellement sûr et complet, mais sensible à la maintenance.

5. **Risque de contournement brut dans les nouvelles branches internes**
 - **Où :** toute branche interne nouvellement introduite dans cette route ou chemin d'appel du convertisseur.
 - **Pourquoi risqué :** des erreurs non détectées ou renvoyées pourraient contourner la normalisation standardisée des échecs.
- **Statut actuel :** les branches principales sont normalisées (`converter-execution` et externe `catch`), un risque résiduel existe pour des modifications futures.

#### Points qui semblent déjà sûrs

- La création de succès standardisée est centralisée au niveau de la cible de l'itinéraire via `createSuccessResult(...)`.
- La création d'échecs standardisée est centralisée via `buildTextToMarkdownFailure(...)` -> `createFailureResult(...)`.
- Les catégories d'échecs connues sont normalisées avec des codes fondé :
 - `EMPTY_INPUT` (pré-vérification sémantique)
 - `CONVERSION_FAILED` (échec d'exécution du convertisseur)
 - `INTERNAL_ERROR` (route interne inattendue échec)
- La structure contractuelle requise est actuellement préservée dans les branches de réussite et d'échec, y compris `warnings`, `logs` et `meta`.
- Le contexte de diagnostic interne est préservé jusqu'à `error.details.stage` sans aplatir `error`.

#### Points qui nécessitent encore un alignement attention

- Protégez-vous contre la dérive de validation du pré-gestionnaire qui peut contourner les échecs standardisés construits par la route.
- Gardez l'enveloppement de compatibilité strictement additif et évitez la division sémantique entre les champs du wrapper et `conversionResult`.
- Maintenez les charges utiles d'assistance complètes sur le champ à mesure que le code de route évolue.
- Assurez-vous que toute future branche d'erreur interne dans ce flux est normalisée en `createFailureResult(...)` plutôt que divulgué en tant que comportement de lancement brut.

#### Comportement du backend/orchestrateur cible pour ce flux

##### Préservation du chemin de réussite (cible)

 - La cible d'alignement doit traiter `conversionResult` comme l'objet de réussite canonique et conserver tous les champs requis au niveau racine.
- L'enveloppement de la réponse (`{ markdown, conversionResult }`) n'est acceptable qu'en tant que transport de compatibilité ; aucune sémantique de réussite ne doit être déplacée en dehors de `conversionResult`.
- L'enrichissement sécurisé est limité aux champs de compatibilité additifs et aux mises à jour non destructives des métadonnées.

##### Préservation du chemin d'échec (cible)

- Toutes les conditions d'échec connues doivent renvoyer un échec standardisé `ConversionResult` de la cible d'alignement.
- `error` doit rester structuré (`code`, `message`, `details`, `recoverable`) avec des codes documentés fondés.
- `outputFile` doit rester cohérent avec la sémantique d'échec (`null` sauf si un artefact fondé existe).
- La compatibilité `detail` peut exister mais doit restent un miroir strict de `error.message`.

##### Gestion des erreurs internes (cible)

- Les exceptions internes inattendues doivent être interceptées et normalisées en échecs standardisés au niveau de la cible d'alignement.
- Utilisez `INTERNAL_ERROR` uniquement lorsqu'aucun code fondé plus spécifique ne s'applique.
- Préserver l'utilité contexte local dans `error.details` (par exemple `stage`, `rawMessage`) sans fuite de charges utiles brutes incompatibles.

##### Enrichissement/normalisation acceptable (cible)

- Enveloppement de réponse additif pour la compatibilité.
- Enrichissement additif de métadonnées/contexte dans `meta` et `error.details`.
- Descripteurs de synchronisation/fichier stables dérivés du contexte de route en mémoire.

##### Remodelage/aplatissement inacceptable (cible)

- Renvoi ad hoc `{ detail: ... }` comme seule charge utile d'échec.
- Omettre les champs racine du contrat requis en cas de succès ou d'échec.
- Remplacer le `error` structuré par des chaînes aplaties.
- Diverger des champs de compatibilité par rapport à la sémantique canonique `conversionResult`.
- Permettre aux lancers bruts d'échapper aux branches d'échec internes connues sans normalisation.

Suivant : sous-étape 7.3.4 appliquera une correction ciblée du backend/orchestrateur pour les écarts d'alignement restants identifiés ici.

### Étape 7.3.5 — Vérification et consolidation de la correction backend/orchestrateur (flux de la première étape 7)

Cette sous-étape vérifie et consolide la correction backend/orchestrateur appliquée à la première étape exécutable. 7.

- Vague de migration sélectionnée : **Texte -> Markdown**
- Premier flux exécutable : **`POST /api/text-to-markdown`**
- Cible d'alignement de l'étape 7.3 confirmée : **`api/backend/routes/conversion.routes.js` à `router.post('/text-to-markdown', ...)`**

#### Couverture de vérification exécuté

- `api/backend/scripts/verify-e2e-text-to-markdown-success-contract.js`
- `api/backend/scripts/verify-e2e-text-to-markdown-failure-contract.js`
- `api/backend/scripts/verify-e2e-text-to-markdown-representative-scenarios.js`
- `api/backend/scripts/verify-e2e-text-to-markdown-downstream-failure-preservation.js`

#### Résultats de la vérification consolidés

##### Chemin de réussite relais/préservation

- Les réponses réussies continuent d'exposer `{ markdown, conversionResult }`.
- `conversionResult.success === true` et `conversionResult.error === null` sont préservés.
- Les champs obligatoires au niveau racine restent présents et structurellement valides.
- Aucune reconstruction d'objet de réussite ad hoc héritée n'a été observée dans le chemin cible corrigé.

##### Relais/préservation du chemin de défaillance

- Les réponses aux pannes restent standardisées et préservent la structure `error`.
- Les valeurs `error.code` mises à la terre restent significatives (`EMPTY_INPUT` et `CONVERSION_FAILED` dans les chemins testés).
- Les champs obligatoires au niveau racine restent présents dans les échecs ; `outputFile` reste cohérent avec la sémantique des échecs (`null` pour les cas actuels fondés).
- Les réponses aux échecs ne sont pas aplaties dans des enveloppes de chaînes uniquement.

##### Gestion des erreurs de la couche de coordination interne

- Les échecs d'exécution du convertisseur interne sont normalisés et renvoyés sous forme d'échecs structurés.
- Les charges utiles de défaillance standardisées en aval sont préservées via la couche de route corrigée au lieu d'être écrasées par des défaillances internes génériques.
- La gestion des erreurs internes au niveau de la route externe reste en tant que normalisation de secours structurée lorsqu'aucune défaillance standardisée en aval valide n'est présente.

#### Note de consolidation

La cible backend/orchestrateur corrigée pour le premier flux de l'étape 7 est désormais cohérente préserve les objets `ConversionResult` standardisés pour le succès, l'échec attendu et la gestion des échecs de la couche de coordination interne dans les scénarios vérifiés.

Suivant : le travail backend/orchestrateur de l'étape 7 peut se poursuivre avec cette ligne de base de correction spécifique au flux considérée comme vérifiée et consolidée.

### Étape 7.4.3 — Points de risque du contrat frontend/UI et comportement cible (flux de la première étape 7)

Cette sous-étape identifie les points de risque du contrat frontend/UI fondés et définit le comportement frontend/UI cible pour le premier flux exécutable de l'étape 7, en réutilisant le mappage de coordination frontend déjà établi (`App.tsx` -> `convertText`).

- Vague de migration sélectionnée : **Texte -> Markdown**
- Premier flux exécutable : **`POST /api/text-to-markdown`**
- Chemin de coordination Frontend/UI considéré : **`api/frontend/src/App.tsx` (`handleConvert`) + `api/frontend/src/converters/generic-converter.ts` (`convertText`)**

#### Points de risque exacts du contrat frontend/UI (fondés)

1. **Risque de déclenchement d'entrée de flux (chemin d'accès à l'UI actuellement bloqué)**
 - **Où :** `App.tsx` `handleConvert` n'autorise actuellement que `asciidoc <-> markdown`.
 - **Pourquoi risqué :** la sémantique standardisée du backend corrigé `Text -> Markdown` peut être entièrement ignorée par l'exécution normale de l'UI car ce flux est rejeté avant l'appel `convertText` dans les chemins d'interaction courants.
 - **Impact :** les charges utiles backend préservant les contrats peuvent ne pas atteindre la limite effective de l'UI pour ce flux.

2. **Gestion des chemins non migrés dans `convertText` (risque de déclassement sémantique)**
 - **Où :** `generic-converter.ts` ne traite que deux chemins migrés comme `isMigratedContractPath`.
 - **Pourquoi risqué pour `txt -> markdown` :**
 - le succès ne nécessite pas `conversionResult` présence/validité ;
 - l'extraction de sortie utilise une solution de secours héritée (`data.markdown || data.asciidoc || data.result || ""`);
 - la suppression des sorties obsolètes sur les erreurs génériques est actuellement appliquée uniquement pour les chemins migrés.
 - **Impact :** la sémantique standardisée peut être partiellement contournée ou réduite au comportement d'extraction de sortie hérité.

3. **L'échec structuré n'est pas entièrement détenu par l'UI pour ce flux**
 - **Où :** en cas d'échec structuré, `setBackendConversionResult(...)` est appelé, mais le nettoyage des sorties obsolètes est conditionnel à `isMigratedContractPath`.
- **Pourquoi risqué :** pour `txt -> markdown`, la sortie réussie précédente peut rester visible après l'échec d'une tentative actuelle dans certaines branches d'erreur.
 - **Impact :** la propriété de la tentative actuelle dans le panneau de résultats peut devenir ambiguë.

4. **Asymétrie d'état/de contrat entre le succès et l'échec**
 - **Où :** le chemin de réussite pour les routes non migrées peut provenir uniquement des champs de sortie, tandis que le chemin d'échec peut s'appuyer sur une erreur structurée si elle est présente.
 - **Pourquoi risqué :** la sémantique de réussite/échec n'est pas appliquée symétriquement autour du canonique `conversionResult`.
 - **Impact :** L'UI peut préserver les erreurs du backend sémantique meilleure que la sémantique de réussite du backend pour ce flux spécifique.

5. **Risque de repli des messages hérités**
 - **Où :** les branches de secours dans `convertText` construisent toujours des erreurs de chaîne génériques à partir du texte/détail HTTP lorsque la charge utile structurée est absente ou ignorée.
 - **Pourquoi risqué :** un contexte backend significatif `error.code` peut être supprimé des commentaires visibles par l'utilisateur dans les branches héritées.
 - **Impact :** la compression sémantique vers le générique. La messagerie d'échec sous forme de chaîne uniquement reste possible.

#### Les points qui semblent déjà sûrs

- `convertText` peuvent déjà acheminer `txt -> markdown` vers `POST /api/text-to-markdown`.
- Les charges utiles d'échec structurées (`success === false` + structuré `error`) sont consommées à la réception, et `setBackendConversionResult` peut préserver l'objet brut d'échec du backend dans l'état de l'UI.
- Les transitions `conversionUiState` (`loading` -> `success`/`error`) sont déjà câblées via l'appel de conversion partagé.
- Les mécanismes modaux de notification/erreur sont déjà présents et peuvent rendre les échecs de conversion sans tout aplatir. branches.

#### Points nécessitant encore un travail d'alignement

- Activer le chemin d'exécution pratique de l'UI pour `txt -> markdown` sans contournement au niveau de déclenchement `handleConvert`/format.
- Promouvoir `txt -> markdown` pour préserver la parité de gestion des contrats avec les chemins déjà migrés dans `convertText`.
- Appliquer la propriété de la sortie de la tentative en cours (nettoyage des sorties obsolètes) pour ce flux sur toutes les catégories d'échec.
- Exiger que la sémantique de réussite canonique reste liée au `conversionResult` standardisé, et pas seulement au repli des clés de sortie héritées.

#### Comportement cible du frontend/UI pour ce flux

##### Consommation/rendu du succès (cible)

- L'UI doit traiter le backend `conversionResult` comme le source sémantique de succès canonique pour ce flux (même principe de préservation utilisé par les flux déjà migrés).
- Le rendu du panneau de résultats peut toujours utiliser le champ de transport `markdown`, mais uniquement lorsqu'il est cohérent avec un succès valide `conversionResult`.
- Les champs structurés requis du succès du backend doivent rester disponibles dans `lastBackendConversionResult` pour les diagnostics et l'UI cohérence.

##### Consommation/rendu des échecs (cible)

- L'UI doit préserver la sémantique structurée des échecs du backend (`error.code`, `error.message`, facultatif `error.details`) sans s'aplatir en chaînes génériques lorsque la charge utile structurée est présente.
- `error.code` devrait restent visibles/utilisables dans la logique d'état/de notification pour ce flux, comme cela a déjà été fait pour les chemins migrés.
- Les champs de texte de compatibilité (`detail`) ne sont acceptables qu'en tant que solution de secours additive, et non en remplacement de la sémantique d'erreur structurée.

##### `idle / loading / success / error` comportement de l'état (cible)

- La nouvelle tentative doit être effacée indicateurs transitoires obsolètes avant l'envoi de la demande.
- `loading` doit commencer au lancement de la demande et toujours se terminer en `success` ou `error`.
- Lors de toute tentative en cours échouée (structurée ou non structurée), la sortie de réussite précédente obsolète ne doit pas rester présentée comme résultat actuel pour ce flux.
- `lastBackendConversionResult` doit représenter la tentative en cours propriété et ne pas divulguer la sémantique des tentatives précédentes.

##### Interprétation/enrichissement acceptable (cible)

- Enrichissement additif au niveau de l'UI (étiquettes localisées, formulation modale, notifications) basé sur une sémantique structurée du backend.
- Messagerie de secours minimale lorsque le backend est véritablement non structuré.
- Projection non destructive du résultat du backend dans l'état de l'UI à des fins de diagnostic et de présentation.

##### Comportement d'aplatissement/remodelage/état obsolète inacceptable. (cible)

- Traiter le succès `txt -> markdown` comme valide uniquement à partir des clés de sortie héritées tout en ignorant la sémantique de succès standardisée contradictoire ou manquante.
- Aplatir les échecs structurés en erreurs génériques de chaîne uniquement lorsqu'une erreur de backend structurée est disponible.
- Supprimer `error.code` pour ce flux dans les branches où une erreur de backend structurée est disponible. existe.
- Laisser la sortie précédente obsolète visible après une tentative de conversion actuelle échouée.
- Reconstruire un modèle de réussite/échec parallèle uniquement sur le frontend qui diverge de la sémantique `ConversionResult` du backend.

Suivant : la sous-étape 7.4.4 appliquera une correction ciblée du frontend/de l'UI afin que ce flux suive le comportement cible défini ci-dessus.

### Étape 7.4.5 — Vérification et consolidation de la correction du frontend/UI (premier flux de la première étape 7)

Cette sous-étape vérifie et consolide la correction du frontend/UI pour le premier flux exécutable de l'étape 7 après les mises à jour 7.4.4.

- Vague de migration sélectionnée : **Texte -> Markdown**
- Premier flux exécutable : **`POST /api/text-to-markdown`**
- Cible frontend/UI vérifiée : **`api/frontend/src/converters/generic-converter.ts` (`convertText`)** avec coordination via **`api/frontend/src/App.tsx` (`handleConvert`)**

#### Couverture de vérification réexécution

- `api/frontend/src/converters/generic-converter.test.ts` (Vitest)
- comprend des contrôles dédiés de consommation de réussite/échec `txt -> markdown`
 - comprend des contrôles de cohérence d'état et de protection des sorties obsolètes

#### Résultats de vérification consolidés

##### Consommation/préservation du chemin de réussite

- Le succès standardisé `ConversionResult` est consommé comme sémantique canonique pour `txt -> markdown`.
- Le succès n'est plus accepté pour ce flux lorsque la sémantique de succès standardisée requise est manquante.
- La sémantique requise (`success === true`, `error === null`, présence d'objet de résultat structuré) est appliquée dans les branches vérifiées.

##### Chemin d'échec consommation/préservation

- Les échecs standardisés `ConversionResult` sont consommés sans s'aplatir dans des modèles locaux génériques contenant uniquement des chaînes lorsque la charge utile structurée est disponible.
- Les données d'échec structurées sont préservées, y compris `error.code` significative pour la gestion au niveau de l'UI.
- La sémantique des échecs du back-end reste accessible via l'état des résultats du back-end. relais.

##### Comportement de l'état du frontend (`idle/loading/success/error`)

- Les nouvelles tentatives entrent en `loading` et effacent les indicateurs transitoires obsolètes au démarrage de la tentative.
- Les tentatives échouées passent de manière cohérente à `error` avec un nettoyage de sortie obsolète sur ce flux.
- Transition des tentatives réussies de manière cohérente à `success` avec l'appropriation des résultats de la tentative actuelle.
- Des indicateurs de réussite/erreur obsolètes contradictoires ne sont pas observés dans les scénarios vérifiés.

#### Note de consolidation

Le premier flux frontend/UI de l'étape 7 préserve désormais la sémantique backend standardisée `ConversionResult` grâce à la gestion des succès/échecs et des transitions d'état cohérentes dans le cadre de la couverture de test vérifiée.

### Étape 7.5.2 — Vérification de la conformité du playbook par rapport au flux de l'étape 7 exécuté

Cette sous-étape vérifie si l'étape 7 exécutée en premier Le flux a suivi le playbook/checklist de migration opérationnelle de l'étape 6 (`Step 6.3.3`).

- Vague de migration sélectionnée : **Texte -> Markdown**
- Flux exécuté vérifié : **`POST /api/text-to-markdown`**
- Référence du playbook : **Étape 6.3.3, liste de contrôle de migration requise (éléments 1-17)**

#### Les étapes du playbook sont clairement terminées

- **Mappage du flux d'exécution :** terminé en `Step 7.2.1`.
- **Mappage de la charge utile :** terminé en `Step 7.2.2`.
- **Intégration de l'assistant de chemin de réussite :** terminé en `Step 7.2.3`.
- **Intégration de l'assistant de chemin de défaillance :** terminée en `Step 7.2.4`.
- **Harmonisation des erreurs internes :** terminée en `Step 7.2.5`.
- **Vérification isolée (au niveau du chemin) :** terminée en `Step 7.2.6` avec des scripts backend dédiés.
- **Identification de la cible backend/orchestrateur + mappage + remédiation + consolidation :**
 - définition de la cible/cartographie/du risque en `Step 7.3.2` et `Step 7.3.3`
 - remédiation en `Step 7.3.4`
 - vérification/consolidation en `Step 7.3.5`.
- **Mapping cible frontend/UI + définition du risque + remédiation + consolidation :**
 - définition du risque/comportement cible en `Step 7.4.3`
- remédiation en `Step 7.4.4`
- vérification/consolidation en `Step 7.4.5`.

#### Étapes réalisées de manière plus légère mais acceptable

- **Vérification des limites de sortie du backend :** exécutée via des scripts e2e ciblés au niveau de la route pour `text-to-markdown` (scénarios de réussite/d'échec/représentatifs plus préservation des échecs en aval), plutôt que d'introduire un nouveau harnais de vérification large.
- **Vérification efficace des limites de l'UI :** couverte par des tests ciblés de la couche de conversion frontend (`generic-converter.test.ts`) qui valident la consommation structurée de réussite/échec et les garanties d'état obsolète ; acceptable pour cette vague limitée à flux unique.
- **Passe finale de non-régression multicouche :** effectuée sous forme de passes de vérification backend et frontend ciblées et répétées pour ce flux au lieu d'un exécuteur de migration monolithique complet ; acceptable compte tenu du gel de la lunette d’onde.

#### Déviations fondées (le cas échéant)

- **Aucun écart de blocage trouvé.**
- Une compression mineure du séquençage s'est produite en documentant et en validant certains points de contrôle backend/frontend par incréments étroitement couplés, mais les intentions requises du playbook étaient toujours satisfaites.
- La note facultative de comparaison/consolidation de flux croisés (élément 17 du playbook) a été traitée sous une forme concise axée sur le flux plutôt que dans un nouveau chapitre de comparaison plus large, ce qui est acceptable à ce stade car l'étape 7 reste strictement limitée à un seul flux.

#### Écart à noter

- Aucun bloqueur actuel pour la conformité du playbook.
- La prudence résiduelle reste la même que celle mentionnée précédemment : préserver une mise en forme stricte du contrat au niveau de la route si les contraintes du middleware de validation sont renforcées dans les modifications futures.

#### Conclusion de conformité

Le premier flux exécuté de l’étape 7 est globalement conforme au manuel/liste de contrôle de migration de l’étape 6, avec les étapes requises terminées et uniquement des choix d’exécution légers limités et acceptables.

### Étape 7.5.3 — Observations d'exécution (surprises, frictions et écarts fondés)

Cette sous-étape capture les observations d'exécution fondées du premier flux de l'étape 7 (`Text -> Markdown`) à travers la migration du convertisseur, l'alignement backend/orchestrateur, l'alignement frontend/UI et la vérification/consolidation.

- Flux exécuté examiné : **`POST /api/text-to-markdown`**
- Portée révisée : **7.2.x + 7.3.x + 7.4.x + 7.5.2 consolidation**

#### Principales surprises et frictions observées

1. **Le contrôle du chemin d'entrée du front-end était plus restrictif que prévu**
 - `txt -> markdown` était présent dans la logique de routage de conversion mais toujours bloqué par les règles d'autorisation de conversion de l'UI dans `App.tsx`.
 - Cela a créé une inadéquation pratique entre la préparation à la migration du back-end et l'accessibilité efficace de l'UI.
 - **Classification :** surprise spécifique au flux notable mais acceptable (résolue lors 7.4.4).

2. **`convertText` la logique de préservation des contrats a été ajoutée à la liste blanche des chemins**
 - Les protections anti-aplatissement et anti-obsolètes étaient initialement limitées aux chemins précédemment migrés uniquement.
 - `txt -> markdown` nécessitait une inclusion explicite pour hériter des mêmes garanties de réussite/échec et d'état obsolète.
 - **Classification :** candidat à un raffinement futur pour les conseils du playbook (nouveaux flux peut nécessiter à plusieurs reprises cette extension explicite).

3. **La préservation des pannes standardisées en aval nécessitait une protection explicite**
 - La correction back-end a montré que les charges utiles de pannes standardisées en aval valides pouvaient être écrasées par une normalisation générique au niveau de la route à moins d'être explicitement préservées.
 - Une vérification de préservation dédiée était nécessaire pour éviter un remplacement injustifié par une gestion générique des pannes internes.
 - **Classification :** importante et devrait rester documentée pour les migrations futures.

4. **La pile de vérification est restée fiable mais a nécessité une superposition ciblée**
 - La qualité de la migration a été mieux validée par des contrôles backend et frontend ciblés plutôt que par une vaste suite.
- Cela s'est avéré efficace mais nécessite une couverture disciplinée par flux pour éviter les lacunes.
 - **Classification :** choix d'exécution acceptable ; renforce les recommandations du playbook existant pour les contrôles en couches.

5. **Le comportement de sortie de processus Windows est resté une friction opérationnelle récurrente**
 - Certains scripts de vérification autonomes nécessitaient une gestion explicite et retardée des sorties de processus pour éviter de se bloquer malgré des assertions logiquement complétées.
 - **Classification :** friction opérationnelle acceptable, mais devrait rester une partie des modèles d'hygiène des scripts.

#### Ce qui semble acceptable pour cette vague

- Gestion locale supplémentaire dans le frontend inclusion du chemin de contrat pour `txt -> markdown`.
- Stratégie de vérification ciblée (scripts/tests ciblés) au lieu d'un coureur global large pour cette vague à flux unique délimitée.
- Wrappers de compatibilité additifs (`detail`) tout en préservant la sémantique structurée canonique.

#### Ce qui devrait informer le playbook ultérieur raffinement

- Ajoutez un point de contrôle explicite indiquant que le contrôle d'entrée de conversion frontend doit être revalidé lorsqu'un nouveau chemin est migré.
- Ajoutez un point de contrôle explicite indiquant que toute logique de préservation de contrat de liste blanche de chemin dans les utilitaires de conversion frontend partagés doit être mise à jour lors de l'intégration d'un nouveau flux.
- Conservez un point de contrôle backend formel pour préserver les échecs standardisés en aval avant le repli. normalisation.

#### Qu'est-ce qui pourrait bloquer des migrations futures similaires si elles ne sont pas documentées

- Laisser les incohérences de contrôle d'entrée de l'UI non documentées (backend migré mais flux toujours inaccessible dans le chemin réel de l'UI).
- Oublier d'étendre les commutateurs de préservation des contrats frontaux partagés pour les flux nouvellement migrés.
- Remplacement significatif échecs standardisés en aval avec échecs internes génériques aux limites de la route/de l'orchestrateur.

#### Conclusion de l'observation

Le premier flux de l'étape 7 n'a pas révélé de surprise architecturale au niveau du bloqueur, mais il a révélé des frictions récurrentes lors de l'intégration du flux (contrôle de l'UI, listes blanches de chemin partagé et préservation des échecs en aval) qui devraient rester explicitement documentées pour que les vagues futures restent prévisibles.

### Étape 7.5.4 — Validation de la vérification des vagues (assez propre). Décision)

Cette sous-étape valide si la vague de l'étape 7 exécutée est suffisamment propre au niveau de la vérification de la vague pour passer au travail de synthèse/clôture (sans encore commencer l'étape 7.6).

- Vague validée : **Étape 7, première vague exécutée**
- Base de flux : **`Text -> Markdown` via `POST /api/text-to-markdown`**
- Preuves réutilisées : **7.2.x vérification isolée + 7.3.x vérification backend/orchestrator + 7.4.x vérification frontend/UI + 7.5.2 conformité playbook + 7.5.3 observations d'exécution**

#### Aspects validés / propres

- L'étape sélectionnée 7 est migré vers une sémantique standardisée basée sur l'assistance en matière de réussite et d'échec.
- La préservation du backend/orchestrateur est validée :
 - les objets de réussite/échec standardisés survivent à la propagation au niveau de la route,
 - les échecs internes sont normalisés de manière cohérente,
 - les échecs standardisés significatifs en aval sont préservés.
- La préservation du frontend/UI est validé :
 - une sémantique standardisée de réussite et d'échec structurée est utilisée,
 - `error.code` reste disponible le cas échéant,
 - les protections d'état obsolètes et la cohérence de transition d'état sont vérifiées pour ce flux.
- Les contrôles ciblés pertinents passent à travers les couches de vérification backend et frontend.
- Aucun bloqueur majeur non résolu n'a été identifié dans exécution, vérification ou examen de conformité.

#### Différences résiduelles acceptables (non bloquantes)

- L'asymétrie du wrapper de compatibilité reste intentionnelle (`{ markdown, conversionResult }` en cas de succès ; additif `detail` en cas d'échec) et est documentée.
- La vérification reste intentionnellement ciblée/en couches plutôt que étendue dans un large coureur d'onde monolithique ; acceptable pour cette vague limitée à flux unique.
- Les frictions opérationnelles documentées (par exemple, la gestion des sorties de processus Windows dans des scripts autonomes) restent des problèmes d'hygiène des scripts, et non des bloqueurs de migration.

#### Vérification des bloqueurs potentiels

- Aucun problème non résolu au niveau du bloqueur n'a été trouvé qui invaliderait l'exécution de la vague de l'étape 7 qualité.
- Les différences restantes sont limitées, documentées et acceptables dans le cadre de la vague gelée.

#### Conclusion de la vérification de la vague

La vague de l'étape 7 exécutée est considérée comme **suffisamment propre** au niveau de la vérification de la vague et est éligible pour passer aux travaux de synthèse/clôture de l'étape 7 lorsque prévu.

### Étape 7.6.1 — Résumé technique concis de l'exécution de l'étape 7

L'étape 7 a exécuté une vague de migration à flux unique limitée sur **Texte -> Markdown** (`POST /api/text-to-markdown`) et a transmis ce flux à travers la migration du chemin du convertisseur, l'alignement backend/frontend et la vérification au niveau de la vague.

#### Qu'est-ce que l'étape 7 en réalité exécuté

- **Flux exécuté :** `Text -> Markdown` comme première et unique cible d'implémentation en vague.
- **Exécution de la migration au niveau du convertisseur :**
 - construction de résultats standardisés du chemin de réussite intégrée à `createSuccessResult(...)` ;
- construction de résultats standardisée du chemin d'échec intégrée à `createFailureResult(...)`;
 - gestion des erreurs internes harmonisée pour préserver la sémantique structurée fondée (`EMPTY_INPUT`, `CONVERSION_FAILED`, `INTERNAL_ERROR`) et éviter les fuites brutes inutiles.
- **Exécution de l'alignement backend/orchestrateur :**
 - cible d'alignement au niveau de la route mappée et corrigé ;
 - propagation standardisée des succès/échecs préservée à travers la limite de sortie du backend;
 - échecs standardisés significatifs en aval préservés au lieu d'être écrasés par des solutions de secours internes génériques.
- **Exécution de l'alignement frontend/UI :**
 - `txt -> markdown` flux rendu préservant le contrat dans la logique de consommation de conversion ;
 - succès/échec standardisé sémantique consommée avec la préservation structurée des erreurs ;
 - cohérence de transition d'état renforcée (`loading -> success/error`) avec des protections d'état obsolètes pour ce flux.
- **Exécution de vérification et de consolidation :**
 - scripts de vérification backend isolés pour les scénarios de réussite/échec/représentatifs ;
 - vérification de remédiation backend, y compris la préservation des échecs en aval sonde ;
 - vérification frontend ciblée pour une consommation structurée de succès/échec et la cohérence de l'état;
 - vérifications de conformité du playbook et d'observation de l'exécution enregistrées;
 - décision suffisamment propre au niveau de la vague validée (`7.5.4`).

#### Ce que l'étape 7 a prouvé ou confirmé

- L'étape 6 Le playbook de migration est réutilisable sur le plan opérationnel sur ce nouveau flux limité.
- La sémantique `ConversionResult` standardisée peut être migrée de bout en bout sur `Text -> Markdown` sans refonte majeure.
- Une vérification en couches et une correction ciblée minimale sont suffisantes pour atteindre la propreté de la vérification des vagues pour cette portée.

#### Ce qui reste en dehors de l'étape 7 portée

- Exécution de la migration de chemins différés supplémentaires (`HTML -> *`, famille générique `/api/convert`, nettoyage plus large du wrapper).
- Large refonte de l'architecture à flux croisés ou refactorisation généralisée du cadre de migration.
- Nettoyage frontend/backend plus large à l'échelle du produit non requis par la vague délimitée de l'étape 7.

### Étape 7.6.2 — Mise à jour de la ligne de base multi-flux (expansion de l'ensemble de référence validé)

Cette sous-étape met à jour la ligne de base multi-flux validée pour inclure explicitement le flux de l'étape 7 exécuté dans l'ensemble de référence.

#### Ensemble de référence validé mis à jour

L'ensemble de référence validé comprend désormais trois flux exécutés :

1. Premier flux migré : **AsciiDoc -> Markdown** (`POST /api/to-markdown`)
2. Deuxième flux migré : **Markdown -> AsciiDoc** (`POST /api/to-asciidoc`)
3. Flux de l'étape 7 exécuté : **Texte -> Markdown** (`POST /api/text-to-markdown`)

#### Ce qui reste commun dans les flux validés

- La construction de résultats standardisée basée sur l'assistance est utilisée en cas de succès et d'échec (`createSuccessResult(...)`, `createFailureResult(...)`).
- La sémantique d'échec structurée est préservée avec des significations significatives. `error.code` et gestion non destructive de la compatibilité.
- La propagation backend/orchestrateur préserve la sémantique canonique `ConversionResult` à travers les limites de sortie au niveau de la route.
- La consommation de conversion frontend préserve la sémantique structurée et la cohérence de l'état (`loading/success/error`) avec des garanties d'état obsolète sur les chemins migrés.
- Le modèle de vérification en couches reste stable : ciblé vérifications de chemin, consolidation back-end, consolidation front-end et validation de la propreté au niveau de la vague.

#### Ce qui reste spécifique au chemin mais acceptable

- Les moteurs et les composants internes du convertisseur diffèrent selon le flux (downdoc/lazy-load, pandoc, text2markdown).
- Les wrappers de transport additifs diffèrent selon le endpoint (champs `markdown`/`asciidoc` plus compatibilité `detail` le cas échéant).
- La distribution des codes d'erreur et l'accent mis sur les scénarios diffèrent selon le chemin tout en restant dans la sémantique documentée.
- Vérification ciblée les scripts restent en forme de chemin (ensembles de scénarios spécifiques au flux), ce qui est acceptable dans le modèle de migration limité.

#### Impact sur la confiance de base pour les migrations futures

L'extension de l'ensemble de référence validé de deux à trois flux réels augmente la confiance dans le fait que le modèle de migration/alignement est réutilisable au-delà de la paire initiale, y compris un flux de texte léger en mémoire. Cela renforce la base pratique pour l'exécution des vagues futures tout en préservant la discipline à portée limitée.

### Étape 7 Définition de Terminé

L'étape 7 de la version `0.0.1.4.6` n'est terminée que si tous les critères ci-dessous sont satisfaits.

#### Critères d'achèvement (tous requis)

- Le premier flux exécutable de la vague Step 7 sélectionnée est formellement confirmé.
- La portée d'exécution de l'étape 7 est explicitement gelée et respectée.
- Le temps d'exécution du flux est mappé avant l'intégration.
- Le mappage de la charge utile vers les assistants centralisés est documenté.
- L'intégration du chemin de réussite est terminée.
- L'intégration du chemin d'échec est terminée.
- L'harmonisation des erreurs internes est terminée.
- Passes de vérification isolées pour le flux exécuté.
- L'alignement backend/orchestrateur est terminé.
- Réussite de la vérification backend/orchestrateur.
- L'alignement frontend/UI est terminé.
- Réussite de la vérification frontend/UI.
- Le flux exécuté est comparé aux flux déjà migrés dans l'ensemble de référence validé.
- La conformité du playbook est vérifiée par rapport à la liste de contrôle opérationnelle de l'étape 6.
- Les surprises/frictions d'exécution sont documentées avec des informations mises à la terre. classification.
- La vague est validée comme étant suffisamment propre pour la synthèse/fermeture.

#### L'étape 7 ne nécessite PAS

- Exécuter l'intégralité de la vague de migration restante.
- Migrer tous les flux différés.
- Large refonte de l'architecture backend/frontend.
- Réouverture déjà étapes fondamentales validées des étapes de version précédentes.

### Clôture de l'étape 7

L'étape 7 de la version `0.0.1.4.6` est clôturée avec l'exécution et la validation du premier flux concret de la prochaine vague de migration sélectionnée : **Texte -> Markdown** (`POST /api/text-to-markdown`).

#### Quelle étape 7 réalisé

- Exécution du premier flux concret dans la vague dans le cadre de la portée limitée de l'étape 7.
- Migration de ce flux au niveau du convertisseur/construction des résultats vers une sémantique standardisée basée sur l'assistance.
- Propagation backend/orchestrateur alignée pour ce flux, y compris la cohérence de la gestion des erreurs internes.
- Consommation frontend/UI et comportement d'état alignés pour ce flux.
- Vérification que ce flux suit le modèle de migration/alignement validé établi lors des étapes précédentes.

#### Résultat concret produit par l'étape 7

- Ajout d'un flux réellement exécuté supplémentaire à l'ensemble de référence validé.
- Confirmation que le manuel/liste de contrôle opérationnel de l'étape 6 est applicable dans l'exécution pratique.
- Confiance accrue dans la méthode de migration réutilisable avec un troisième flux réel.

#### Ce que l'étape 7 apporte désormais au projet

- Une base de référence de migration exécutée plus solide sur plusieurs flux réels.
- Une meilleure confiance dans l'exécution des éléments restants de la vague sélectionnée.
- Preuve supplémentaire que le modèle de migration/d'alignement évolue au-delà du modèle initialement validé. paire.

#### Ce qui reste en dehors de l'étape 7

- Exécution du reste de la vague de migration sélectionnée.
- Exécution de la migration des flux différés.
- Large travail de refonte du backend/frontend.
- Les travaux des étapes futures n'ont pas encore commencé.

#### Note de transition

Les travaux futurs devraient s'appuyer sur le résultat de l'exécution de l'étape 7 désormais validé et éviter de rouvrir les questions de migration/d'alignement déjà validées pour ce flux, à moins qu'un nouveau bloqueur fondé n'apparaisse.

### Étape 8.1.1 — Confirmation du prochain flux exécutable dans la vague sélectionnée

L'étape 8 commence par confirmer le prochain flux concret à exécuter après l'exécution du premier flux de l'étape 7, tout en conservant la même logique de décision et la même cadence séquentielle de la vague de migration.

- **Vague de migration sélectionnée :** `Text -> Markdown`-première vague avec différé candidats suivants
- **Flux de l'étape 7 déjà exécuté :** `Text -> Markdown` via `POST /api/text-to-markdown`
- **Prochain flux concret à exécuter :** `HTML -> *` via `POST /api/from-html` (prochain candidat de suivi)

#### Pourquoi ce flux est confirmé next

- Il a déjà été identifié comme le prochain candidat de suivi après la validation du premier flux dans l'ordre d'exécution établi.
- L'étape 7 s'est terminée proprement, donc la condition de report pour l'ouverture du candidat suivant est maintenant satisfaite.
- Elle reste l'option restante avec la plus faible friction par rapport à une migration familiale plus large de `/api/convert`.
- Elle préserve au mieux l'exécution séquentielle contrôlée et s'adapte à le playbook validé avant toute expansion de surface supérieure.

Suivant : la sous-étape 8.1.2 vérifiera si l'ordre de la vague nécessite un ajustement fondé après la preuve d'exécution de l'étape 7.

### Étape 8.1.2 — Examen de l'ordre d'exécution post-étape 7 pour la vague sélectionnée

Cette sous-étape vérifie si le L'ordre d'exécution de la vague de migration sélectionnée doit être ajusté une fois l'exécution de l'étape 7 terminée.

- **Vague de migration sélectionnée :** `Text -> Markdown`-première vague avec des candidats de suivi différés
- **Débit de l'étape 7 déjà exécuté :** `Text -> Markdown` via `POST /api/text-to-markdown`
- **Prochain flux actuellement recommandé :** `HTML -> *` via `POST /api/from-html`

#### Ordonner la décision après l'étape 7 des preuves

- **Décision :** l'ordre initial reste valide (aucun ajustement requis à ce stade).

#### Justification fondée

- L'étape 7 s'est terminée avec des résultats de vérification des ondes propres et aucune surprise architecturale au niveau du bloqueur.
- Les frictions observées à l'étape 7 ont été problèmes d'intégration de flux locaux (contrôle de l'UI, extension de la liste blanche des chemins, protection contre les pannes en aval) et ont été corrigés/documentés sans indiquer de candidat de remplacement de priorité plus élevée.
- Aucune dépendance cachée n'a été révélée qui justifierait la promotion d'une migration `/api/convert` plus large avant `HTML -> *`.
- Le candidat suivant (`HTML -> *`) offre toujours la progression la mieux contrôlée dans le cadre du playbook validé tout en préservant exécution séquentielle limitée.
- Le risque de couplage/interférence reste plus faible avec cet ordre qu'avec une expansion directe vers des chemins de conversion génériques de surface plus élevée.

Suivant : la sous-étape 8.1.3 gèlera la portée d'exécution restante de l'étape 8 avant le début de la mise en œuvre du flux suivant.

### Étape 8.1.3 — Portée d'exécution restante de l'étape 8. Geler

Cette sous-étape gèle la portée d'exécution restante de l'étape 8 pour garder la vague sélectionnée délimitée, contrôlée et protégée contre toute dérive de la portée avant la reprise de la mise en œuvre.

- **Vague de migration sélectionnée :** `Text -> Markdown`-première vague avec des candidats de suivi différés
- **Débit de l'étape 7 déjà exécuté :** `Text -> Markdown` via `POST /api/text-to-markdown`
- **Prochain flux exécutable confirmé :** `HTML -> *` via `POST /api/from-html`

#### IN portée pour l'exécution restante de l'étape 8

- Exécuter le travail de migration/d'alignement pour le prochain flux confirmé (`HTML -> *`) uniquement.
- Suivez l'ordre séquentiel validé (pas d'exécution multi-flux parallèle).
- Réutilisez le playbook de migration/alignement établi et le kit de vérification minimum.
- Limitez la mise en œuvre et la vérification aux couches au niveau du convertisseur, du backend/orchestrateur et du frontend/UI requises pour ce flux.
- Appliquez uniquement les correctifs minimaux et fondés requis pour préserver la sémantique et la vérification standardisées. cohérence.

#### HORS portée pour l'étape 8

- Migration de flux supplémentaires non liés au-delà du prochain flux confirmé.
- Large refonte de l'architecture backend.
- Large refonte du frontend/UI.
- Création de cadres de migration génériques sans besoin de blocage démontré.
- À l'échelle du produit nettoyage sans rapport avec la vague sélectionnée.
- Réouverture de décisions de contrat/alignement/convention déjà validées sans bloqueur fondé.

#### Reporté à plus tard

- Migration familiale générique `/api/convert`.
- Candidats à une vague différée supplémentaire au-delà `HTML -> *`.
- Harmonisation large axée sur le wrapper et nettoyage des flux croisés non essentiels.
- Tout travail de refonte plus important en dehors du modèle d'exécution à ondes limitées.

#### Pourquoi ce gel de la portée est important

Il préserve l'exécution séquentielle contrôlée, limite le risque de couplage, maintient les diagnostics clairs et empêche expansion à mi-vol qui réduirait la comparabilité avec la méthode de migration/alignement validée.

Suivant : la sous-étape 8.2.1 commencera le mappage du flux d'exécution du prochain flux exécutable confirmé.

### Étape 8.2.1 — Mappage du flux d'exécution actuel (avant l'intégration de l'assistant)

Cette sous-étape mappe le flux d'exécution actuel du prochain flux exécutable confirmé avant tout mappage ou intégration de charge utile basée sur l'assistant. work.

- **Vague de migration sélectionnée :** `Text -> Markdown`-première vague avec des candidats de suivi différés
- **Flux actuel de l'étape 8 :** `HTML -> *` via `POST /api/from-html`

#### Flux d'exécution actuel (fondé)

1. La demande entre `api/backend/routes/conversion.routes.js` à `router.post('/from-html', ...)`.
2. Le middleware de validation (`validate` + `zod`) nécessite :
 - `text: z.string().min(1)`
 - `to: z.string().min(1)`.
3. Le gestionnaire de route lit `{ text, to }` à partir de `req.body`.
4. La route applique une pré-vérification sémantique locale : `if (!text.trim())` -> HTTP `400` avec `{ detail: "The HTML text to convert is empty" }`.
5. Début des journaux d'itinéraire : `Converting <length> characters (HTML -> <to>) with Pandoc`.
6. Acheminer les appels `await convertHtmlWithPandoc(text, to)` à partir de `api/backend/services/conversion/convert.js`.
7. `convertHtmlWithPandoc` délègue directement à `convertWithPandoc(html, 'html', toFormat)`.
8. `convertWithPandoc` effectue :
 - validation d'entrée/format et normalisation du format,
 - Mappage de format Pandoc (`from` et `to`),
 - création de répertoire temporaire et de chemin de fichier d'entrée/sortie,
 - écriture du fichier d'entrée + `safeSpawn('pandoc', ...)` exécution,
- lecture du fichier de sortie et nettoyage du texte pour les formats de type texte,
 - nettoyage garanti des fichiers temporaires/répertoire temporaire en `finally`.
9. En cas de réussite au niveau de la route, la route enregistre la taille des résultats et renvoie HTTP `200` avec la charge utile dynamique `{ [to]: result }`.
10. Lors d'une capture au niveau de la route, la route enregistre l'erreur et renvoie HTTP `500` avec `{ detail: "Conversion error: ..." }`.

#### Forme actuelle du chemin de réussite

- HTTP `200` avec une clé de sortie dynamique uniquement (exemple : `{ markdown: string }`, `{ asciidoc: string }`, etc.).
- Non L'objet standardisé `ConversionResult` est actuellement attaché à ce chemin.
- Aucun champ de durée au niveau de la route ni aucune charge utile structurée `warnings`/`logs`/`meta` n'est actuellement renvoyé.

#### Forme actuelle du chemin d'échec

- Échec de validation/pré-vérification :
 - rejet du middleware pour les champs manquants/invalides (`z.string().min(1)`), ou
 - vérification sémantique des entrées vides -> HTTP `400` avec `{ detail: string }`.
- Conversion d'exécution/échec du service :
 - le service peut générer des erreurs normalisées (`Pandoc conversion failed`, délai d'attente ou échec d'exécution générique),
 - capture de route les transforme en HTTP `500` avec `{ detail: "Conversion error: ..." }`.
- L'échec structuré `ConversionResult` n'est pas émis actuellement.

#### Observations pertinentes pour l'intégration (avant le mappage de la charge utile)

- La route mélange actuellement le rejet au niveau du middleware et l'échec au niveau des détails uniquement enveloppes.
- `convertWithPandoc` est piloté par lancer et sauvegardé par fichier (fichiers temporaires/dir), tandis que les réponses de route sont des objets de détail uniquement ; aucun objet de résultat standardisé n'est propagé.
- Les informations du fichier de sortie existent en interne dans `convertWithPandoc` (temp `outputFile`) mais sont nettoyées avant la réponse et ne sont pas exposées en tant que métadonnées structurées.
- La durée et la télémétrie de tentative structurée ne sont pas mesurées/renvoyées à la limite de la route.
- Les informations sur les erreurs sont générées dans plusieurs couches (vérifications d'entrée/format, délai d'expiration/échec d'exécution, capture de route), puis aplaties dans `detail` à la limite de sortie.

Suivant : la sous-étape 8.2.2 définira le mappage de la charge utile de ce flux actuel vers les assistants centralisés (`createSuccessResult()` / `createFailureResult()`).

### Étape 8.2.2 — Mappage de la charge utile vers les assistants centralisés (avant l'intégration)

Cette sous-étape définit le mappage de la charge utile pour le flux actuel de l'étape 8 (`HTML -> *` via `POST /api/from-html`) avant l'intégration de l'assistant.

- **Vague de migration sélectionnée :** `Text -> Markdown`-première vague avec des candidats de suivi différés
- **Flux actuel de l'étape 8 :** `HTML -> *` via `POST /api/from-html`

#### Cartographie réussie de la charge utile (`createSuccessResult(payload)`)

| Champ | Source d'exécution dans le flux actuel | Statut du mappage | Stratégie de cartographie pour l'intégration |
|---|---|---|---|
| `conversionId` | Non créé actuellement dans l'itinéraire `/from-html` | Dérivable localement | Créez un identifiant de route par tentative au début de la demande (même modèle que les routes migrées). |
| `converter` | L'itinéraire utilise `convertHtmlWithPandoc(...)` | Dérivable localement | Utilisez l'identifiant du convertisseur stable : `"pandoc"`. |
| `pipeline` | Non émis actuellement | Dérivable localement | Utilisez un pipeline à chemin fixe pour cet itinéraire : `["html-><to>"]` (ou une liste équivalente normalisée). |
| `inputFormat` | Implicite par itinéraire (`from-html`) | Directement disponible | Réglez sur `"html"`. |
| `outputFormat` | Champ du corps de la demande `to` | Directement disponible | Défini sur la valeur normalisée `to` utilisée par l'appel de conversion à l'exécution. |
| `inputFile` | Corps de la requête `text` uniquement, pas de descripteur structuré aujourd'hui | Dérivable localement | Créez un descripteur d'entrée en mémoire à partir du corps HTML (`originalName`, `storedPath`, `size`, `mimeType`). |
| `outputFile` | La sortie convertie existe sous forme de chaîne (`result`) dans la route ; service a un fichier de sortie temporaire en interne | Dérivable localement | Créez un descripteur de sortie en mémoire au niveau de la réponse à partir de la longueur du contenu converti + du type MIME cible. |
| `startedAt` | Non suivi au niveau de l'itinéraire | Dérivable localement | Capture à l’horodatage de début de la demande. |
| `finishedAt` | Non suivi au niveau de l'itinéraire | Dérivable localement | Capture à l’horodatage de réussite. |
| `durationMs` | Non suivi au niveau de l'itinéraire | Dérivable localement | Calculez le temps écoulé du début à la fin. |
| `warnings` | Aucune liste d'avertissements structurée actuellement renvoyée | Aide par défaut | Utilisez l'assistant par défaut `[]` pour cette étape de migration. |
| `logs` | Journaux de console uniquement ; aucun journal structuré par tentative n'a été renvoyé | Aide par défaut | Utilisez l'assistant par défaut `[]` pour cette étape de migration. |
| `meta` | Aucune métadonnée structurée actuellement renvoyée | Dérivable localement | Ajoutez un minimum de métadonnées (identifiant/chemin d'itinéraire + transport en mémoire + marqueur de format cible facultatif). |

#### Cartographie de la charge utile de défaillance (`createFailureResult(payload)`)

| Champ | Source d'exécution dans le flux actuel | Statut du mappage | Stratégie de cartographie pour l'intégration |
|---|---|---|---|
| `conversionId` | Pas créé actuellement | Dérivable localement | Réutilisez le même identifiant par tentative créé au début de la demande. |
| `converter` | Le chemin de conversion utilise `convertHtmlWithPandoc` -> `convertWithPandoc` | Dérivable localement | Réglez sur `"pandoc"` pour ce flux. |
| `pipeline` | Non émis actuellement | Dérivable localement | Utilisez une représentation de pipeline fixe au niveau de l’itinéraire alignée sur le format cible. |
| `inputFormat` | Sémantique des routes | Directement disponible | Réglez sur `"html"`. |
| `outputFormat` | Champ du corps de la demande `to` | Directement disponible | Définir sur la valeur de format cible normalisée. |
| `inputFile` | Corps de la demande `text` uniquement | Dérivable localement | Créez un descripteur d'entrée en mémoire à partir du texte de requête disponible (y compris la casse vide/tronquée). |
| `startedAt` | Non suivi au niveau de l'itinéraire | Dérivable localement | Capture au début de la demande. |
| `finishedAt` | Non suivi au niveau de l'itinéraire | Dérivable localement | Capture à la fin de l'échec. |
| `durationMs` | Non suivi au niveau de l'itinéraire | Dérivable localement | Calcule le temps écoulé au point de retour de panne. |
| `error` | Actuellement aplati à `{ detail: ... }` dans les réponses de route et les lancements de services génériques | Dérivable localement | Créez une erreur structurée (`code`, `message`, `details`, `recoverable`) à partir de l'étape d'échec mise à la terre (pré-vérification vs exécution d'exécution/pandoc). |
| `outputFile` | Aucune métadonnée de sortie d'échec n'a été renvoyée aujourd'hui ; le fichier de sortie temporaire est nettoyé en interne | Généralement absent actuellement | Définissez `null` par défaut ; inclure uniquement si l’artefact de sortie de moment de l'échec fondé est disponible et peut être exposé en toute sécurité. |
| `warnings` | Aucune liste d'avertissements structurée actuellement renvoyée | Aide par défaut | Utilisez l'assistant par défaut `[]`. |
| `logs` | Journalisation de la console uniquement | Aide par défaut | Utilisez l'assistant par défaut `[]`. |
| `meta` | Aucune métadonnée structurée actuellement renvoyée | Dérivable localement | Ajoutez un minimum de métadonnées d'itinéraire/de transport et un marqueur d'étape de défaillance facultatif. |

#### Classification de disponibilité des champs (consolidée)

- **Directement disponible maintenant :** `inputFormat` (`html`), `outputFormat` (`to`), requête brute `text`, chaîne de sortie convertie en cas de succès.
- **Dérivable localement pendant intégration :** `conversionId`, `converter`, `pipeline`, `inputFile`, `outputFile` (succès), `startedAt`, `finishedAt`, `durationMs`, structuré `error`, minimal `meta`.
- **Attendu via les valeurs par défaut de l'assistant :** `warnings`, `logs` (tous deux comme `[]` à ce stade).
- **Actuellement absent/non exposé à la limite :** métadonnées de temps d'échec `outputFile` (le cycle de vie du fichier temporaire du service est interne et nettoyé avant la réponse).

Suivant : sous-étape 8.2.3 démarrera l'intégration du chemin de réussite d'exécution pour ce flux à l'aide de `createSuccessResult(...)`.

### Étape 8.3.1 — Identification de la véritable cible du backend/de l'orchestre (flux de l'étape 8)

#### Composants backend réellement impliqués pour `POST /api/from-html`

- **Route/contrôleur (véritable point d'entrée de ce flux) :** `api/backend/routes/conversion.routes.js`
 - `router.post('/from-html', ...)` effectue :
 - demande des pré-vérifications pour les pannes contractuelles (`text.trim()` et `to.trim()`)
 - `conversionResult` construction en cas de succès (`createSuccessResult(...)`)
 - harmonisation interne des pannes en cas d'erreur (`classifyFromHtmlInternalError(...)`, `buildFromHtmlFailure(...)`)
 - préservation standardisée des pannes en aval lorsqu'elle est présente (`extractStandardizedFailureFromError(...)`)

- **Middleware de validation (niveau type) Analyse Zod uniquement) :** `api/backend/middleware/security/validate.middleware.js`
 - renvoie une enveloppe `{ error, issues }` en cas d'échec de validation du schéma.
 - En pratique pour ce endpoint, les échecs en forme de contrat pour une entrée vide sont gérés par des pré-vérifications au niveau de la route.

- **Service de convertisseur/traitement (Pandoc dispatch, dispatch direct) :** `api/backend/services/conversion/convert.js`
 - `convertHtmlWithPandoc(html, to)` -> `convertWithPandoc(html, 'html', to)`
 - utilise `safeSpawn('pandoc', ...)` et effectue un nettoyage du fichier d'entrée/sortie temporaire dans `finally`
 - renvoie la sortie convertie sous forme de chaîne (pas d'emballage contractuel `ConversionResult` ici)

- **Générateurs de conversionResult (assistant de contrat partagé) :** `api/backend/src/utils/conversion-result.js`
 - `createSuccessResult(...)` et `createFailureResult(...)` appliquent des champs racine standardisés et des valeurs par défaut d'assistance (`warnings`, `logs`, `meta`, etc.)

- **Orchestreur / registre / chargeur paresseux : ne fait pas partie de ce chemin d'exécution de route spécifique**
 - `api/backend/services/modules/main-orchestrator.js`, `converter-orchestrator.module.js`, `lazyload.module.js` (et `runConverter`) ne sont pas invoqués par `router.post('/from-html', ...)`.
 - Le endpoint utilise la répartition de conversion directe via le `convertHtmlWithPandoc(...)`.

#### Cible d'alignement backend/orchestrateur retenue

- **Cible :** `api/backend/routes/conversion.routes.js` — spécifiquement le gestionnaire `router.post('/from-html', ...)` (et ses fonctions d'assistance locales `buildFromHtmlFailure(...)`, `classifyFromHtmlInternalError(...)`, `extractStandardizedFailureFromError(...)`).

#### Pourquoi cette cible est la point d'alignement correct

- **Là où le flux est invoqué :** le flux de l'étape 8 est directement démarré par `router.post('/from-html', ...)` (pas de chemin `/api/proxy/convert` / `executeConversionRequest(...)` pour ce endpoint).
- **Là où le succès/l'échec sont coordonnés :** le gestionnaire construit la charge utile de succès (`createSuccessResult(...)`) et, en cas d'échec, soit :
 - préserve un échec en aval déjà standardisé (`extractStandardizedFailureFromError(...)`), ou
 - classe l'erreur interne et renvoie un échec en forme de contrat (`buildFromHtmlFailure(...)`).
- **Où `ConversionResult` peut être préservé/enrichi/déformé/mis en cache :** le gestionnaire décide quelle erreur structurée renvoyer (`error.code/message/details`), et il définit/dérive des champs racine tels que `outputFile`, `warnings`, `logs` et `meta` à la limite de réponse.

### Étape 8.3.2 — Carte de flux backend/orchestre (étape 8 via 8.3.1 Target)

#### Flux de réussite (nominal) : `POST /api/from-html`

1. **Point d'entrée/point de départ du backend :** `api/backend/routes/conversion.routes.js`
 - `validate({ body: z.object({ text: z.string(), to: z.string() }) })` applique uniquement l'analyse Zod.
2. **Gestionnaire :** `router.post('/from-html', async (req, res) => { ... })`
 - Crée `conversionId = randomUUID()`, `startedAt`, `startedAtMs`.
3. **Contrôles préalables d'itinéraire :**
 - Si `!text.trim()` => pré-vérifier le flux de défaillance (voir ci-dessous).
 - Si `!to.trim()` => pré-vérifier le flux de défaillance (voir ci-dessous).
4. **Invocation du convertisseur (envoi direct, pas d'orchestrateur) :**
- `const result = await convertHtmlWithPandoc(text, to)`
 - Résolution du module : `convertHtmlWithPandoc` vient de `api/backend/services/conversion/convert.js`
 - Chaîne d'appel :
 - `convertHtmlWithPandoc(html, to)` -> `convertWithPandoc(html, 'html', to)`
 - `convertWithPandoc(...)` :
 - écrit un fichier d'entrée temporaire
 - exécute `safeSpawn('pandoc', ...)` avec `timeoutMs`
 - lit le fichier de sortie et normalise le texte renvoyé
 - nettoie les fichiers temporaires/répertoire dans `finally`
5. **Premier point de création du `ConversionResult` standardisé :**
 - `const conversionResult = createSuccessResult({ ... })` dans le gestionnaire `'/from-html'`
 - Champs racine renseignés :
 - `success: true`, `error: null`
 - `converter: 'pandoc'`
 - `pipeline: ['html-><normalizedTo>']`
 - `inputFormat: 'html'`, `outputFormat: <normalizedTo>`
 - `inputFile` (descripteur en mémoire), `outputFile` (descripteur en mémoire), `warnings: []`, `logs: []`, `meta: { route, transport, targetFormat }`
6. **Propagation vers le haut (réponse finale du backend) :**
 - `return res.json({ [to]: result, conversionResult })`
 - Le `ConversionResult` est donc **renvoyé sous la clé `conversionResult`** (encapsulé au niveau de la charge utile de réussite).

#### Flux d'échec (contrat harmonisé) : `POST /api/from-html`

##### A) Échec de la pré-vérification de la route (HTTP `400`)

1. **Vide `text` pré-vérification :**
 - Condition : `if (!text.trim())`
 - `const failure = buildFromHtmlFailure({ code: 'EMPTY_INPUT', ... })`
 - `buildFromHtmlFailure(...)` -> `createFailureResult(...)` (première création standardisée à l'itinéraire)
 - Retour final :
 - `return res.status(400).json({ ...failure, detail: failure.error.message })`
2. **Vide `to` pré-vérification :**
 - Condition : `if (!to.trim())`
 - `const failure = buildFromHtmlFailure({ code: 'CONVERSION_FAILED', details: { stage: 'route-precheck', reason: 'OUTPUT_FORMAT_EMPTY' }, ... })`
 - `buildFromHtmlFailure(...)` -> `createFailureResult(...)`
 - Retour final :
 - `return res.status(400).json({ ...failure, detail: failure.error.message })`

##### B) Échec d'exécution (HTTP `500`)

1. **Point d'interception :** `catch (error) { ... }` vers `convertHtmlWithPandoc(...)`.
2. **Chemin de préservation d'un `ConversionResult` déjà standardisé (si présent) :**
 - `const downstreamFailure = extractStandardizedFailureFromError(error)`
 - Si `downstreamFailure` est trouvé :
 - return:
 - `res.status(500).json({ ...downstreamFailure, detail: downstreamFailure.error.message })`
 - Remarque : le `ConversionResult` est renvoyé **à la racine niveau** (non enveloppé dans `conversionResult`) et un champ `detail` supplémentaire est ajouté.
3. **Classement + chemin de reconstruction (sinon) :**
 - `const classified = classifyFromHtmlInternalError(error)`
 - `const failure = buildFromHtmlFailure({ code: classified.code, message: classified.message, details: classified.details, outputFile: null, ... })`
- `buildFromHtmlFailure(...)` -> `createFailureResult(...)` (première création standardisée au niveau de l'itinéraire, à l'intérieur du `catch`)
 - retour final :
 - `return res.status(500).json({ ...failure, detail: failure.error.message })`

#### Où est créé le `ConversionResult` standardisé (résumé)

- **Succès nominal :** `createSuccessResult(...)` dans le gestionnaire `router.post('/from-html', ...)`.
- **Échec de pré-vérification :** `buildFromHtmlFailure(...)` -> `createFailureResult(...)` dans le gestionnaire, avant d'appeler Pandoc.
- **Échec d'exécution :**
 - si `extractStandardizedFailureFromError(error)` renvoie un échec standardisé : la première création est en aval (avant le throw), et le gestionnaire de route **le propage**;
 - sinon : `buildFromHtmlFailure(...)` -> `createFailureResult(...)` dans le `catch`.

#### Observations utiles sur les risques (remodeler / envelopper / supprimer / contourner)

1. ** Wrap vs niveau racine en fonction de l'état HTTP **
 - Succès (`200`) : `ConversionResult` est sous `conversionResult`.
 - Échec (`400`/`500`) : `ConversionResult` est renvoyé au niveau racine via `{ ...failure, detail: ... }`.
 - Risque : a le consommateur qui s'attend à une structure unique et cohérente peut se briser en fonction du chemin de réussite/échec.
2. **Ajout de la clé `detail`**
 - En cas d'échec, `detail` est ajouté au niveau racine, en plus de `error.message`/`error.details`.
 - Risque : les consommateurs stricts ne peuvent pas s'attendre à ce champ supplémentaire.
3. **La préservation est possible mais conditionnelle via `extractStandardizedFailureFromError`**
 - Si une défaillance aval est déjà standardisée et présente comme `error` (ou `error.conversionResult`), elle est restituée telle quelle (étalée) : bonne conservation.
 - Risque : si la forme « standardisée » est proche mais pas tout à fait conforme, `extractStandardizedFailureFromError` renverra `null` et l'itinéraire reconstruira un échec via `buildFromHtmlFailure` (perte possible des détails originaux).
4. **Contourner via des erreurs non contractuelles**
- Les erreurs de validation Zod de `validate(...)` répondent par `{ error, issues }` (et non un `ConversionResult`).
 - Risque : pour certaines saisies invalides (hors pré-vérifications d'itinéraire), le contrat `ConversionResult` peut ne pas être produit.
5. **La classification des erreurs dépend du texte du message**
 - `classifyFromHtmlInternalError(error)` correspond aux sous-chaînes de `error.message` pour choisir `CONVERSION_FAILED` ou `INTERNAL_ERROR`.
 - Risque : erreur de classification si le texte de l'exception change (le code structuré reste présent, mais la catégorie/étape peut varier).

### Étape 8.4.1 — Identification de la véritable cible Frontend/UI (flux de l'étape 8)

#### Composants frontend réellement impliqués pour l'étape 8 (`HTML -> *`, `POST /api/from-html`)

- **Couche d'appel API/routage du endpoint :** `api/frontend/src/converters/generic-converter.ts`
 - `convertText(...)` sélectionne le endpoint en fonction de `sourceFormat`/`targetFormat`.
 - Pour HTML, il est acheminé vers : `endpoint = \`${API_BASE}/api/from-html\`` and sends `{ text, vers : targetFormat }`.

- **Conversion action handler (UI entrypoint):** `api/frontend/src/App.tsx`
  - `handleConvert()` triggers `convertText(...)` and wires:
    - `setLoading`, `setStatus`
    - error-modal setters (`setShowConversionErrorModal`, `setConversio nErrorMessage`)
    - standardized backend result capture (`setLastBackendConversionResult`)
    - conversion lifecycle state (`setConversionUiState`)

- **State management (local component state):** `api/frontend/src/App.tsx`
  - `loading` + `status` (user-facing)
  - `conversionUiState : 'inactif' | 'chargement' | 'succès' | 'erreur'`
  - `lastBackendConversionResult` (stores the last standardized backend `ConversionResult` lorsqu'il est fourni)
- `showConversionErrorModal` + `conversionErrorMessage`
- tampons de sortie utilisés pour le rendu : `adocInput`, `mdOutput` (le panneau de destination lit à partir de ceux-ci)

- **Panneau de résultats (décision de rendu / surface d'affichage) :** `api/frontend/src/App.tsx`
- `resultCard` (useMemo) affiche le panneau de destination :
- affiche l'indicateur de chargement lorsque `loading === true`
- affiche la sortie basée sur `targetFormat` (principalement `mdOutput` pour les cibles non-asciidoc)

- **Surface d'erreur (décision de rendu / surface d'affichage) :** `api/frontend/src/App.tsx`
- erreur de conversion modale pilotée par `showConversionErrorModal` et `conversionErrorMessage`
- plus des notifications toast pilotées par `notification`

#### Cible d'alignement frontend/UI conservée

- **Cible :** `api/frontend/src/converters/generic-converter.ts` — la fonction `convertText(...)`.

#### Pourquoi cette cible est le bon point d'alignement

- **Là où le résultat du backend est consommé pour la première fois :** `convertText(...)` analyse les réponses HTTP (`res.ok` vs non), tente l'analyse JSON et extrait `conversionResult` (chemin de réussite) ou reconnaît les échecs structurés (`success === false` avec `error` structuré).
- **Là où le succès/l'échec sont coordonnés :** `convertText(...)` décide si la tentative actuelle est un succès ou une erreur, pilote `setConversionUiState('success'|'error')`, efface la sortie obsolète sur les chemins d'échec pour les flux de contrats migrés et sélectionne s'il faut ouvrir le modal d'erreur de conversion.
- **Lorsque l'affichage des résultats est décidé :** en réglant `setOutput(...)` (en conduisant `mdOutput` / `adocInput`) et en basculant `loading/status`, `convertText(...)` détermine ce que le panneau de résultats affichera pour la tentative en cours.
- **Là où la sémantique du backend peut toujours être préservée/aplatie/ignorée :** c'est la couche qui peut garder `error` structuré (via `setLastBackendConversionResult`) ou l'aplatir en chaînes/statut génériques ; c'est donc le principal endroit pour aligner l'UI sur la sémantique `ConversionResult` standardisée pour l'étape 8.

### Étape 8.4.2 — Carte de flux frontend/UI (étape 8 via la cible 8.4.1)

- **Nom du flux :** Étape 8 — `HTML -> *` (`POST /api/from-html`)
- **Cible frontend/UI confirmée :** `api/frontend/src/converters/generic-converter.ts` → `convertText(...)`

#### Premier point de consommation frontend du résultat backend standardisé

- **Point de consommation principal :** `convertText(...)` après `await res.json()`
 - Chemin de réussite : lit `data.conversionResult` (lorsqu'il est présent) et valide `conversionResult.success` est booléen ; si `success !== true`, il est traité comme un échec structuré.
 - Chemin d'échec : lorsque `!res.ok`, tente l'analyse JSON et traite la réponse comme un échec structuré si elle correspond à `success === false` avec l'objet `error`.

#### Flux de réussite (carte courte)

1. **Point d'entrée de l'UI :** `App.tsx` `handleConvert()` appelle `convertText(...)` et passe les setters :
 - `setStatus`, `setLoading`
 - `setShowConversionErrorModal`, `setConversionErrorMessage`
 - `setLastBackendConversionResult`
 - `setConversionUiState`
2. **Tentative d'initialisation dans `convertText(...)` :**
 - `setStatus("Conversion en cours...")`, `setLoading(true)`, `setConversionUiState('loading')`
 - efface les indicateurs de tentative précédente : `setNotification(null)`, ferme le modal d'erreur, efface le message d'erreur, efface `lastBackendConversionResult`
3. **Sélection du point final (spécifique à l'étape 8) :**
 - `sourceFormat === 'html'` → `endpoint = ${API_BASE}/api/from-html`, corps `{ text, to: targetFormat }`
4. **Gestion HTTP 200 :**
 - `data = await res.json()`
 - `conversionResult = data.conversionResult` (si présent)
 - Si `conversionResult.success === true` :
- `setLastBackendConversionResult(conversionResult)` (premier succès structuré persistant)
 - sélectionne le champ de sortie en fonction des indicateurs de migration :
 - L'étape 8 n'est actuellement **pas** incluse dans `isMigratedContractPath`, elle utilise donc la sélection de sortie héritée/non migrée : `data.markdown || data.asciidoc || data.result || ""`
 - `setOutput(result)`, `setStatus("Conversion réussie ✔")`, `setNotification(success)`, `setConversionUiState('success')`
5. **Rendu de l'UI :**
 - Le panneau de résultats `App.tsx` (`resultCard`) restitue la sortie de `mdOutput`/`adocInput` selon `targetFormat` et arrête d'afficher l'indicateur de chargement une fois que `loading` est faux.

#### Flux d'échec (court carte)

1. **Point d'entrée de l'UI :** `App.tsx` `handleConvert()` → `convertText(...)` (même câblage que le succès).
2. **Gestion HTTP non OK dans `convertText(...)` (`!res.ok`) :**
 - essaie `errorJson = await res.json()`
 - reconnaît un échec structuré lorsque :
 - `errorJson.success === false` et `errorJson.error` est un objet
 - si structuré :
 - `setLastBackendConversionResult(structuredFailure)` (premier échec structuré persistant)
 - choisit `backendMessage` parmi `structuredFailure.error.message` (des solutions de repli existent)
 - peut ouvrir le modal d'erreur de conversion pour les codes d'erreur sélectionnés (par exemple `CONVERSION_FAILED`, `OUTPUT_NOT_CREATED`, `OUTPUT_INVALID`, `OUTPUT_IS_INPUT`)
 - `setStatus("Erreur de conversion")`, `setNotification(error)`, `setConversionUiState('error')`, renvoie (pas de lancer)
3. **HTTP 200 mais échec structuré dans le corps (`conversionResult.success !== true`) :**
 - si `conversionResult` existe et `conversionResult.success !== true`, `convertText(...)` le traite comme un échec structuré :
 - `setLastBackendConversionResult(conversionResult)`
 - peut ouvrir une erreur modale en fonction de `error.code`
 - `setStatus("Erreur de conversion")`, `setNotification(error)`, `setConversionUiState('error')`, renvoie
4. **Chemin d'échec fourre-tout (réseau/délai d'attente/autre) :**
- abandon du délai d'attente → définit l'erreur de statut/notification et `conversionUiState('error')`
 - panne de réseau → définit l'erreur de statut/notification et `conversionUiState('error')`
 - erreurs génériques → définit l'erreur de statut/notification et `conversionUiState('error')`
5. **Rendu de l'UI :**
 - le modal d'erreur est piloté par `showConversionErrorModal` + `conversionErrorMessage`
 - la notification toast est pilotée par `notification`
 - le panneau de résultats continue d'afficher tout ce que les tampons de sortie contiennent actuellement (voir les risques).

#### Chemin de propagation via l'état/l'UI du frontend (ce qui bouge où)

- **Stockage structuré des résultats du backend :** `convertText(...)` → `setLastBackendConversionResult(...)` → `App.tsx` état `lastBackendConversionResult`
- **Tentative d'état de l'UI du cycle de vie :** `convertText(...)` → `setConversionUiState(...)` → `App.tsx` état `conversionUiState`
- **Contrôles de chargement/état :** `convertText(...)` → `setLoading(...)`, `setStatus(...)` → `App.tsx` états `loading`, `status`
- **Sortie affichée :** `convertText(...)` → `setOutput(...)` → `App.tsx` états `mdOutput` / `adocInput` → rendu du panneau de résultats (`resultCard`)
- **Affichage d'erreur :** `convertText(...)` → `setShowConversionErrorModal(...)` / `setConversionErrorMessage(...)` → rendu modal dans `App.tsx`

#### Observations fondées sur les risques contractuels (aplatissement/remodelage/ignorance/état obsolète)

1. **L'étape 8 n'est pas traitée comme un chemin de contrat migré dans `convertText(...)`**
 - `isMigratedContractPath` n'inclut pas `sourceFormat === 'html'`, donc le chemin de réussite de l'étape 8 ne nécessite pas (ni ne déclenche fortement) la présence de `conversionResult` avant d'afficher la sortie.
 - Risque : l'UI peut afficher la sortie « succès » même si `conversionResult` est manquant ou incohérent, car l'extraction de sortie est de style hérité (`data.markdown || data.asciidoc || ...`).
2. **En cas d'échec, l'effacement des sorties est conditionnel**
 - L'effacement des sorties périmées (`setOutput("")`) est gardé par `isMigratedContractPath` ; L'étape 8 est en dehors de cette protection.
 - Risque : une tentative échouée de l'étape 8 peut laisser une sortie précédente réussie visible dans le panneau de résultats, alors que l'UI est dans un état d'erreur (utilisation abusive d'un état périmé).
3. **La détection des pannes dépend de la forme de l'enveloppe de réponse**
- Les échecs structurés sont reconnus lorsque la charge utile est `success === false` avec un objet `error` (niveau racine).
 - Risque : si le backend renvoie des échecs enveloppés différemment (par exemple sous une clé), l'UI peut revenir à la gestion générique des chaînes et perdre la sémantique structurée.
4. **Logique modale d'erreur sélective basée sur `error.code`**
 - La décision d'ouvrir la modale d'erreur de conversion dépend de valeurs `error.code` spécifiques.
 - Risque : les valeurs `error.code` nouvelles/inconnues restent structurées dans l'état, mais peuvent ne pas déclencher la modale et s'appuieront uniquement sur le statut/toast (potentiellement « ignorant » les valeurs plus riches sémantique).

### Étape 8.4.3 — Points de risque du contrat frontend/UI + comportement cible (étape 8)

- **Nom du flux :** Étape 8 — `HTML -> *` (`POST /api/from-html`)
- **Cible frontend/UI confirmée :** `api/frontend/src/converters/generic-converter.ts` → `convertText(...)`

#### Points de risque contractuel (fondés, lieux précis)

1. **L'étape 8 n'est pas incluse dans le contrôle du « chemin de contrat migré »**
 - **Où :** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
 - **De quoi :** `isMigratedContractPath` est dérivé de :
 - `asciidoc -> markdown`, `markdown -> asciidoc`, `txt -> markdown`
 - (L'étape HTML 8 n'est pas incluse)
 - **Risque :** Le rendu réussi de l'étape 8 peut avoir lieu sans qu'il soit nécessaire qu'un `conversionResult` standardisé soit présent/valide.

2. **La sélection de sortie héritée peut ignorer la sémantique réelle du backend `ConversionResult`**
 - **Où :** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
 - **Quoi :** pour les chemins non migrés, la sortie est choisie via `data.markdown || data.asciidoc || data.result || ""`
 - **Risque :** même si `conversionResult` est manquant/incohérent, l'UI peut toujours restituer une chaîne de sortie et marquer la tentative comme « succès ».

3. **Risque d'état obsolète : l'effacement de la sortie en cas d'échec est conditionnel**
 - **Où :** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
 - **Quoi :** en cas d'échecs structurés et en catch, `setOutput("")` est gardé par `isMigratedContractPath`
 - **Risque :** pour l'étape 8, une tentative échouée peut laisser la précédente réussie résultat visible dans le panneau de résultats (sortie obsolète) tandis que l'UI affiche l'état d'erreur/toast/modal.

4. **La reconnaissance des échecs structurés dépend de la forme de l'enveloppe de réponse**
 - **Où :** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
 - **Quoi :** un échec structuré est reconnu lorsque (chemin non OK) :
 - `errorJson.success === false` et `errorJson.error` sont un objet
 - **Risque :** si le backend renvoie un objet différent enveloppe (par exemple, échec imbriqué sous une clé), le frontend revient à la gestion générique des chaînes, aplatissant la sémantique structurée.

5. **Réduction des échecs vers l'état générique de l'UI, sauf si un `error.code` connu déclenche le modal**
 - **Où :** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
 - **Quoi :** le modal d'erreur est affiché uniquement pour un sous-ensemble de codes (`CONVERSION_FAILED`, `OUTPUT_NOT_CREATED`, `OUTPUT_INVALID`, `OUTPUT_IS_INPUT`)
 - **Risque :** même avec une défaillance structurée préservée dans l'état, l'UI peut sous-communiquer la gravité/la signification (toast/statut uniquement), « ignorant » efficacement la sémantique plus riche dans `error.details`.

6. **`ConversionResult` est capturé, mais le rendu de l'UI n'est pas explicitement piloté par celui-ci (Étape 8)**
 - **Où :** `api/frontend/src/App.tsx` (`lastBackendConversionResult` état + `resultCard`)
 - **Quoi :** le rendu des résultats est piloté principalement par `mdOutput`/`adocInput` et `loading`, pas par `lastBackendConversionResult` comme source unique de vérité pour l'étape 8.
 - **Risque :** une inadéquation entre ce que le backend rapporte (résultat structuré) et ce que l'UI montre (sortie de chaîne) est possible.

#### Points de sécurité (déjà alignés / protecteurs)

1. **La première consommation de sémantique structurée existe et est explicite**
 - **Où :** `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`)
- **Quoi :** il extrait `data.conversionResult` sur les réponses réussies et reconnaît les échecs structurés sur les réponses non OK.

2. **Les défaillances structurées sont conservées en tant qu'objets structurés (non forcées dans des chaînes) lorsqu'elles sont reconnues**
 - **Où :** `convertText(...)` → `setLastBackendConversionResult(...)` (passé comme `setBackendConversionResult`)
 - **Quoi :** lorsqu'une défaillance structurée est détectée, l'objet est stocké dans l'état `App.tsx` tel quel.

3. **L'état du cycle de vie de la tentative est constamment mis à jour**
 - **Où :** `convertText(...)` définit `conversionUiState` sur `loading` puis `success`/`error`, et efface toujours `loading` dans `finally`.

4. **La tentative de démarrage efface certains indicateurs obsolètes**
 - **Où :** `convertText(...)` tentative d'initialisation
 - **Quoi :** efface la notification, ferme le modal d'erreur, efface le message d'erreur, efface `lastBackendConversionResult`.

#### Comportement frontal/UI cible (définition de l'étape 8)

##### Consommation et rendu du succès

- **Doit** traiter une tentative de conversion comme un « succès » uniquement si :
 - un `ConversionResult` standardisé est présent et `conversionResult.success === true`, et
 - les champs racine obligatoires sont présents (au moins : `success`, `error === null`, `warnings` tableau, `logs` tableau, `meta` objet et cohérent `outputFile`).
- **Doit** stocker le résultat de réussite standardisé comme source unique de vérité pour la tentative (`lastBackendConversionResult`).
- **Peut** dériver des champs d'affichage (étiquettes, chaînes d'état courtes) à partir de `conversionResult.meta` et `conversionResult.outputFormat`, mais ne doit pas reconstruire un « modèle de réussite hérité » ad hoc qui supprime les champs obligatoires.
- **Ne doit pas** marquer le succès uniquement parce qu'une chaîne de sortie existe dans le corps de la réponse.

##### Consommation et rendu des échecs

- **Doit** traiter une tentative de conversion comme un « échec » lorsque :
 - HTTP n'est pas OK et le corps est un échec standardisé (`success === false` avec `error` structuré), ou
 - HTTP est OK mais `conversionResult.success !== true`.
- **Doit** conserver `error` en tant qu'objet structuré et le conserver. `error.code` intact et affichable.
- **Ne doit pas** aplatir un échec structuré en une erreur générique de chaîne uniquement si la charge utile structurée est présente.
- **Peut** enrichir le rendu de l'UI avec une messagerie conviviale (modale/toast) dérivée de `error.code` et `error.message`, mais ne doit pas rejeter la structure objet.

##### `idle / loading / success / error` manipulation

- **Inactif :** aucune tentative en vol ; L'UI affiche un état neutre ; `lastBackendConversionResult` peut être nul.
- **Chargement :** une tentative est en cours ; L'UI doit afficher le chargement ; Le résultat de la tentative précédente ne doit pas être présenté comme le résultat de la tentative en cours.
- **Succès :** afficher le résultat + notification de réussite ; afficher le `ConversionResult` de la tentative actuelle comme métadonnées faisant autorité.
- **Erreur :** afficher la surface d'erreur (toast et/ou modale) ; la sortie de la tentative actuelle doit être effacée (ou explicitement étiquetée comme obsolète/non actuelle si elle est conservée pour le débogage).

##### Interprétation/enrichissement acceptable

- Acceptable :
 - présentation de `error.code` dans l'UI (facultatif),
 - mappage de `error.code` à un message localisé/utile,
 - dériver la gravité de l'UI de `error.code` / `error.details.stage`.
- Inacceptable :
 - ignorer `conversionResult` en faveur des heuristiques de sortie héritées,
 - remodeler les échecs en objets ad hoc `{ message, detail }` lorsqu'un échec standardisé est available,
 - laissant la sortie obsolète visible après une tentative ratée de l'étape 8 sans étiquetage explicite.

#### Note de transition

- La correction du runtime (modifications de code) pour ces points d'alignement frontend/UI commence à l'**étape 8.4.4**.

### Étape 8.5.1 — Étape 8 par rapport aux flux déjà migrés (comparaison)

- **Nom du flux :** Étape 8 — `HTML -> *` (`POST /api/from-html`)
- **Flux migrés de référence :** 
 - AsciiDoc → Markdown (`POST /api/to-markdown`, downdoc via lazy-loader) 
 - Markdown → AsciiDoc (`POST /api/to-asciidoc`, Pandoc) 
 - Texte → Markdown (`POST /api/text-to-markdown`, text2markdown)

#### Points partagés/communs (cohérents avec les flux migrés)

- **Construction de résultats standardisés au niveau de la route :** L'étape 8 construit `ConversionResult` à la limite HTTP (même modèle que `/to-asciidoc` et `/text-to-markdown`).
- **Modèle d'erreur structuré disponibilité :** les échecs exposent un `error` structuré avec `error.code` et `error.message` (cohérent avec les flux migrés).
- **Hook de préservation des défaillances structurées en aval :** une préservation au niveau de la route existe (`extractStandardizedFailureFromError(...)`) s'alignant sur le modèle « ne pas écraser une défaillance standardisée en aval ».
- **Alignement du consommateur principal du frontend :** la consommation de l'UI passe par la même couche d'ingestion principale (`api/frontend/src/converters/generic-converter.ts` → `convertText(...)`) que les autres flux migrés.
- **Parité de style de vérification :** L'étape 8 a le même style d'ensemble de scripts e2e « contrat de réussite / contrat d'échec / scénarios représentatifs » que les autres flux (scripts backend en `api/backend/scripts/`), plus une vérification de contrat d'erreur interne similaire à `/to-asciidoc`.

#### Différences acceptables/spécifiques au chemin (différentes mais OK pour ce flux)

- **Forme de sortie multi-cible :** L'étape 8 renvoie une clé de sortie dynamique (`{ [to]: result, conversionResult }`) car elle prend en charge plusieurs cibles ; les autres flux migrés renvoient généralement une clé de sortie fixe (`markdown` ou `asciidoc`).
- **Mode de répartition du convertisseur :** L'étape 8 utilise l'exécution directe de Pandoc via `convertHtmlWithPandoc` / `convertWithPandoc` (niveau de service `safeSpawn`), tandis que `to-markdown` utilise un module chargé paresseux (`runConverter('downdoc', ...)`) et `text-to-markdown` utilise une fonction de conversion.
- **Étendue du mappage MIME :** L'étape 8 maintient une carte format cible → mimeType pour remplir `outputFile.mimeType` dans plusieurs formats de sortie ; les flux à cible unique ont un mappage plus étroit.

#### Divergence à suivre (différences fondées qui peuvent nécessiter une attention particulière)

- **Asymétrie de l'enveloppe HTTP succès/échec (backend) :**
- Le succès renvoie `conversionResult` enveloppé sous `conversionResult`.
- L'échec renvoie les champs `ConversionResult` au niveau racine (plus `detail`).
- Ceci est cohérent avec le comportement actuel de l'étape 8, mais cela reste un risque de divergence par rapport à une attente d'une « enveloppe unique et cohérente » entre les flux.
- **Contournement de la validation middleware du contrat sur les entrées non valides (backend) :**
- `validate(...)` renvoie `{ error, issues }` pour les échecs de schéma (pas un `ConversionResult`), qui peut contourner le contrat standardisé pour certaines charges utiles invalides.
- Ceci n'est pas propre à l'étape 8, mais il s'agit d'une divergence de flux croisés qui mérite d'être suivie à mesure que la migration s'étend.
- **Heuristique de classification des erreurs (backend) :**
- `classifyFromHtmlInternalError(...)` est un message basé sur le texte pour sélectionner `CONVERSION_FAILED` vs `INTERNAL_ERROR`.
- Cela vaut la peine d'être suivi car il est plus fragile que la propagation des erreurs de code/typage.
- **L'UI de l'étape 8 est désormais « contrat d'abord » (frontend) mais s'appuie sur une clé de sortie dynamique :**
- Le frontend nécessite `conversionResult` et lit `data[targetFormat]`.
- Cela vaut la peine d'être suivi car toute dérive du backend dans la dénomination dynamique des clés (par exemple, différences de normalisation) peut interrompre le succès du rendu même si `ConversionResult` est valide.
- **Les modules wrapper hérités restent présents (frontend) :**
- Comme pour les flux déjà migrés, des wrappers dédiés existent à côté de `convertText(...)` ; cela est acceptable maintenant, mais reste un sujet de consolidation solide pour les vagues de nettoyage ultérieures.

### Étape 8.5.2 — Étape 6 Conformité au playbook/liste de contrôle (étape 8)

- **Nom du flux :** Étape 8 — `HTML -> *` (`POST /api/from-html`)
- **Référence du Playbook :** Étape 6.3.3 « Liste de contrôle de migration requise (éléments 1 à 17) »

#### Résumé de conformité

L'étape 8 suit globalement le playbook de migration de l'étape 6. Les éléments requis sont complétés, avec quelques exécutions « légères mais acceptables » spécifiques au chemin (notamment : la confirmation de la préparation et la réussite finale entre les couches sont attestées principalement par une vérification exécutable plutôt que par un chapitre de porte autonome).

#### Cartographie de la liste de contrôle (éléments 1 à 17)

1. **Confirmer l'état de préparation du candidat (critères minimaux de l'étape 6.2.2)** 
 - **Statut :** terminé (léger) 
 - **Preuve :** Gel de la portée de l'étape 8 + l'itinéraire est accessible et exercé ; la vérification isolée et l'exécution réussie de Pandoc confirment la viabilité de l'exécution.

2. **Cartographe du convertisseur de courant/flux d'exécution (succès/échec/interne)** 
 - **Statut :** terminé 
 - **Preuve :** Étape 8.2.1 (cartographie du flux d'exécution) + Étape 8.3.2 (carte de propagation backend).

3. **Mappez les champs de charge utile en entrées d'assistance (`createSuccessResult` / `createFailureResult`)** 
 - **Statut :** terminé 
 - **Preuve :** Étape 8.2.2 (tableaux de mappage de charge utile pour le succès et l'échec).

4. **Intégrer la construction standardisée des résultats du chemin de réussite** 
 - **Statut :** terminé 
 - **Preuve :** `POST /api/from-html` renvoie `conversionResult` en cas de succès ; vérifié par `api/backend/scripts/verify-e2e-from-html-success-contract.js`.

5. **Intégrer la construction standardisée des résultats du chemin d'échec** 
 - **Statut :** terminé 
 - **Preuve :** les échecs de pré-vérification au niveau de la route renvoient des charges utiles d'échec standardisées ; vérifié par `api/backend/scripts/verify-e2e-from-html-failure-contract.js` et des scénarios représentatifs.

6. **Harmoniser le comportement des erreurs internes dans une sémantique d'échec structurée** 
 - **Statut :** terminé 
 - **Preuve :** classification des erreurs internes + générateur d'échecs structurés pour `/from-html` ; vérifié par `api/backend/scripts/verify-e2e-from-html-internal-error-contract.js` (format de sortie non pris en charge → échec structuré avec `error.code` utilisable).

7. **Exécuter une vérification du convertisseur/chemin isolé (vérifications minimales du kit requis)** 
 - **Statut :** terminé 
 - **Preuve :** Scripts de l'étape 8.2.6 :
 - `verify-e2e-from-html-success-contract.js`
 - `verify-e2e-from-html-failure-contract.js`
 - `verify-e2e-from-html-representative-scenarios.js`
 - (plus erreur interne vérification du contrat)

8. **Identifier la cible d'alignement backend/orchestrateur pour le chemin** 
 - **Statut :** terminé 
 - **Preuve :** Étape 8.3.1 (cible retenue : `api/backend/routes/conversion.routes.js` `/from-html` gestionnaire).

9. **Cartographe de la propagation des succès/échecs du backend et des points de risque du contrat** 
 - **Statut :** terminé 
 - **Preuve :** Étape 8.3.2 (cartes des flux de réussite/échec + observations des risques).

10. **Appliquer une correction minimale du backend pour préserver la sémantique standardisée** 
 - **Statut :** terminé (sans opération) 
 - **Preuve :** la préservation du backend satisfait déjà aux vérifications du contrat ; aucun correctif backend supplémentaire n'a été requis pour l'étape 8 après vérification.

11. **Vérifier le comportement du contrat de limite de sortie backend** 
 - **Statut :** terminé 
 - **Preuve :** Les scripts e2e valident la limite HTTP effective (`POST /api/from-html`) pour le succès/l'échec, plus le cas d'erreur interne.

12. **Identifier la cible d'alignement frontend/UI (chemin orienté vers l'utilisateur)** 
 - **Statut :** terminé 
 - **Preuve :** Étape 8.4.1 (cible retenue : `api/frontend/src/converters/generic-converter.ts` `convertText(...)`).

13. **Cartographe de la consommation de réussite/d'échec du frontend et du comportement de l'état** 
 - **Statut :** terminé 
 - **Preuve :** Étape 8.4.2 (cartographie de flux à travers l'état/l'UI `convertText(...)` et `App.tsx`).

14. **Appliquer une correction frontend minimale pour la sémantique structurée + la cohérence de l'état** 
 - **Statut :** terminé 
 - **Preuve :** L'étape 8.4.4 fait passer l'étape 8 en premier dans `convertText(...)` (nécessite `conversionResult`, efface la sortie obsolète au démarrage de la tentative, utilise `data[targetFormat]`).

15. **Vérifier la cohérence efficace des limites de l'UI et les garanties obsolètes** 
 - **Statut :** terminé 
 - **Preuve :** L'étape 8.4.5 ajoute/exécute des contrôles `vitest` ciblés par l'étape 8 garantissant :
 - une consommation structurée de réussite/échec,
 - préservée `error.code`,
 - transitions d'état cohérentes,
 - aucune fuite de sortie obsolète.

16. **Exécutez la passe finale de non-régression multicouche à l'aide du kit de vérification minimum**
- **Statut :** terminé (léger) 
 - **Preuve :** backend `/from-html` suite de vérification de contrat e2e + frontend `vitest` + frontend `typecheck`.

17. **Enregistrer les notes de comparaison/consolidation par rapport aux flux migrés précédemment** 
 - **Statut :** terminé 
 - **Preuve :** Étape 8.5.1 (section de comparaison).

#### Écarts fondés par rapport au playbook (le cas échéant)

- Aucun écart au niveau du bloqueur observé. Le seul aspect « léger » est que la confirmation de l'état de préparation et la passe finale de non-régression inter-couches sont attestées principalement par une vérification exécutable plutôt que par un récit de porte explicite distinct.

### Étape 8.5.3 — Observations d'exécution de l'étape 8 (surprises, frictions, écarts)

- **Nom du flux :** Étape 8 — `HTML -> *` (`POST /api/from-html`)

#### Principales surprises/frictions observées (immobilisées)

1. **L'asymétrie de l'enveloppe entre le succès et l'échec du backend est apparue comme un risque réel pour le consommateur**
 - **Que s'est-il passé :** les réponses de réussite enveloppent le résultat standardisé sous `conversionResult`, tandis que les réponses d'échec renvoient les champs de résultat standardisés au niveau racine (plus `detail`).
 - **Pourquoi c'est important :** les consommateurs frontend doivent implémenter deux formes d'enveloppe pour préserver la sémantique sur les deux chemins.
 - **Classification :** notable (piste); acceptable pour l'étape 8 telle quelle, mais une considération de cohérence du contrat à flux croisés.

2. **La validation du middleware peut contourner le contrat standardisé**
 - **Que s'est-il passé :** Le middleware Zod `validate(...)` renvoie `{ error, issues }` pour les échecs de schéma, ce qui n'est pas un `ConversionResult`.
 - **Pourquoi c'est important :** tout flux qui s'appuie sur le niveau de route `createFailureResult(...)` pour une sémantique d'erreur uniforme a toujours un canal de contournement pour les erreurs non valides charges utiles.
- **Classification :** candidat de raffinement futur pour les conseils du playbook (et/ou la normalisation des limites) ; ne constitue pas un bloqueur pour la portée de la migration de l'étape 8.

3. **L'harmonisation des erreurs internes repose sur l'heuristique du texte du message**
 - **Que s'est-il passé :** `/from-html` la classification des erreurs internes choisit `CONVERSION_FAILED` contre `INTERNAL_ERROR` en faisant correspondre les sous-chaînes dans `error.message`.
 - **Pourquoi c'est important :** cette méthode est plus fragile que la propagation structurée des erreurs et peut modifier la classification si les messages sous-jacents changent.
 - **Classification :** notable ; mérite d'être suivi en tant que modèle récurrent qui peut nécessiter une approche plus robuste plus tard (mais acceptable dans le cadre de contraintes de changement minimal).

4. **L'UI de l'étape 8 nécessitait une correction « contrat d'abord » spécifique au chemin (état obsolète + sortie héritée)**
 - **Ce qui s'est passé :** initialement, l'étape 8 (`html -> *`) a été acheminée correctement mais n'a pas été incluse dans `isMigratedContractPath`, donc :
 - le rendu de sortie pourrait être piloté par l'ancien `data.markdown || data.asciidoc || data.result`,
 - la sortie obsolète pourrait rester visible après une tentative échouée car l'effacement de la sortie était conditionnel.
 - **Pourquoi c'était important :** même avec une sémantique standardisée du backend, l'UI pouvait les aplatir/ignorer silencieusement.
 - **Classification :** une surprise spécifique au flux acceptable, mais aussi un **candidat d'affinement futur** pour le playbook : les flux multi-cibles devraient être explicitement inclus dans le contrôle d'abord du contrat une fois la sémantique standardisée exister.

5. **La clé de sortie dynamique multi-cible augmente le risque de couplage**
 - **Que s'est-il passé :** la sortie réussie de l'étape 8 est effectuée sous une clé dynamique (`data[targetFormat]` / `{ [to]: result }`).
 - **Pourquoi c'était important :** de petites dérives de normalisation entre le backend `to` nommage et le frontend `targetFormat` les attentes peuvent interrompre l'affichage même si `ConversionResult` est valide.
 - **Classification :** acceptable/spécifique au chemin ; mérite d'être suivi car cela augmente l'importance de la « normalisation des clés de sortie » pour les flux multi-cibles.

6. **La vérification devait inclure une sonde d'erreur interne pour être sûr**
 - **Ce qui s'est passé :** au-delà des scripts de réussite/échec/de base nominaux, une vérification contractuelle supplémentaire des erreurs internes (format de sortie non pris en charge) était nécessaire pour valider l'harmonisation (`error.code` convivialité) en cas d'échec d'exécution.
 - **Pourquoi c'était important :** les chemins multiformats pilotés par Pandoc ont des modes de défaillance internes significatifs qui ne sont pas couverts par des pré-vérifications d'entrée vide uniquement.
 - **Classification :** acceptable et alignée sur les éléments conditionnels du playbook ; renforce le fait que les « sondes internes spécifiques au moteur (conditionnelles) » de l'étape 6 sont importantes pour les chemins multi-cibles pilotés par Pandoc.

#### L'une d'entre elles bloquerait-elle de futures migrations similaires si elle n'était pas documentée ?

- **Oui, si non documenté :**
 - asymétrie de l'enveloppe (forme de wrapper succès ou échec),
 - risque d'état obsolète sur les chemins d'UI non explicitement migrés,
 - couplage dynamique de normalisation de clé de sortie pour les flux multi-cibles.

Ce ne sont pas des bloqueurs pour l'étape 8 maintenant, mais ils le sont. « éléments à surveiller » exploitables pour les futures migrations de flux multi-cibles.

### Étape 8.5.4 — Validation de la vague et préparation à la clôture (étape 8)

- **Nom du flux :** Étape 8 — `HTML -> *` (`POST /api/from-html`)

#### Entrées de validation de la vague utilisé

- **Vérification de flux isolé :** Étape 8.2.6 (`verify-e2e-from-html-*.js`, y compris la sonde de contrat d'erreur interne)
- **Vérification backend/orchestrateur :** Étape 8.3.1–8.3.2 (identification de la cible + propagation/carte des risques) + `/from-html` vérifications de contrat à la limite HTTP
- **Vérification du frontend/de l'UI :** Étape 8.4.1 à 8.4.5 (identification de la cible + carte de flux de l'UI + correction + vérification ciblée de l'UI via `vitest`)
- **Comparaison de flux croisés :** Étape 8.5.1
- **Conformité du playbook :** Étape 8.5.2 (mappée par rapport à la liste de contrôle de l'étape 6.3.3 1–17)
- **Observations d'exécution :** Étape 8.5.3

#### Ce qui est validé (comportement propre et non régressif)

- **Le flux est migré et standardisé :** `/api/from-html` produit un `ConversionResult` standardisé en cas de succès et d'échecs (pré-vérification et runtime/interne).
- **La préservation du backend/orchestrateur fonctionne :** les échecs structurés préservent `error` en tant qu'objet avec `error.code` utilisable ; les défaillances structurées en aval ne sont pas écrasées sans raison.
- **La préservation du frontend/de l'UI fonctionne :** L'étape 8 est prioritaire sur le contrat au niveau de la couche d'ingestion principale de l'UI (`convertText(...)`), donc :
 - le succès appartient à `conversionResult.success === true` et à la clé de sortie attendue,
 - les échecs préservent la structure `error` (y compris `error.code`),
 - la sortie obsolète est effacée au démarrage de la tentative pour éviter les fuites dans la tentative actuelle.
- **Les contrôles pertinents réussissent :** les scripts de contrat backend e2e réussissent ; frontend `vitest` + `typecheck` réussite pour les scénarios de l'étape 8.
- **Aucun bloqueur majeur non résolu ne subsiste :** aucun problème restant n'empêche l'étape 8 de se comporter comme un flux migré standardisé orienté vers l'utilisateur.

#### Différences acceptables mais non bloquantes (documentées)

- **Asymétrie de l'enveloppe backend :** le succès s'enroule sous `conversionResult`, l'échec renvoie `ConversionResult` au niveau racine (+ `detail`). Ceci est documenté et géré par le frontend.
- **Contournement de la validation du middleware :** les requêtes de schéma invalide peuvent renvoyer `{ error, issues }` plutôt qu'un `ConversionResult` standardisé. Documenté comme un élément de surveillance à flux croisés.
- **Couplage de clé de sortie dynamique (multi-cible) :** La sortie réussie de l'étape 8 est sous `data[targetFormat]`. Documenté comme un risque de couplage multi-cibles à suivre.
- **Classification des erreurs internes du texte du message :** les heuristiques de classification restent basées sur les messages ; acceptable sous des contraintes de changement minime, mais documenté.

#### Décision de préparation à la clôture

- **Décision :** La vague de l'étape 8 est **suffisamment propre pour passer à la synthèse/clôture**.
- **Justification :** la sémantique contractuelle requise est préservée de bout en bout (backend + UI), la couverture de vérification existe et réussit, et les différences restantes sont acceptables, explicitement documenté et non bloquant.

### Étape 8.6.1 — Résumé de l'exécution de l'étape 8 (ce qui s'est réellement déroulé)

#### Flux exécuté

- **Flux exécuté :** Étape 8 — `HTML -> *` via `POST /api/from-html` (soutenu par Pandoc, sortie multi-cible).

#### Résultats de la migration au niveau du convertisseur

- **Construction de résultats standard :** L'étape 8 utilise des assistants centralisés (`createSuccessResult(...)` / `createFailureResult(...)`) à la limite de la route pour produire un `ConversionResult` standardisé pour les résultats de réussite et d'échec.
- **Harmonisation des erreurs internes :** les échecs d'exécution/de conversion interne sont classés et convertis en résultats d'échec structurés avec utilisable `error.code` (validé par une sonde de contrat d'erreur interne).

#### Résultats de l'alignement backend/orchestrateur

- **Cible d'alignement backend confirmée :** `api/backend/routes/conversion.routes.js` → `router.post('/from-html', ...)`.
- **Comportement de préservation :** la route préserve les échecs structurés lorsqu'ils sont présents et autrement construit des échecs structurés localement ; les champs racine obligatoires sont présents et stables à la limite HTTP.
- **Discipline de portée :** aucune refonte de l'orchestrateur n'a été introduite ; L'étape 8 reste une répartition appartenant à l'itinéraire vers la conversion Pandoc.

#### Résultats de l'alignement frontend/UI

- **Cible frontend/UI confirmée :** `api/frontend/src/converters/generic-converter.ts` → `convertText(...)`.
- **Ingestion de l'étape 8 du contrat en premier :** L'étape 8 (`html -> *`) est désormais traitée comme une chemin du contrat en premier :
 - le succès appartient à `conversionResult.success === true` et à la clé de sortie dynamique attendue (`data[targetFormat]`),
 - les échecs préservent la structure `error` et gardent `error.code` disponible,
 - la sortie obsolète est effacée lors de la tentative de démarrage pour éviter les fuites dans le courant tentative.

#### Ce qui a été vérifié

- **Backend (vérification de flux isolé) :**
 - vérification du contrat de réussite (`verify-e2e-from-html-success-contract.js`)
 - vérification du contrat d'échec (`verify-e2e-from-html-failure-contract.js`)
 - scénarios de base représentatifs (`verify-e2e-from-html-representative-scenarios.js`)
- Sonde de contrat d'erreur interne (`verify-e2e-from-html-internal-error-contract.js`)
- **Vérification du frontend/UI :**
 - `vitest` ciblée vérifie le comportement de contrat d'abord de l'étape 8 (succès, échecs structurés, prévention des états obsolètes)
 - `tsc --noEmit` réussite de la vérification de type

#### Quelle étape 8 confirmé / validé

- Le playbook/checklist opérationnel de l'étape 6 est pratiquement applicable à un flux multi-cible, soutenu par Pandoc et orienté utilisateur.
- La sémantique `ConversionResult` standardisée peut être préservée de bout en bout (limite backend → ingestion frontend → état de l'UI) avec une remédiation minimale et localisée si nécessaire.
- Le kit de vérification minimum est réutilisable pour l'étape 8, les sondes internes conditionnelles spécifiques au moteur étant utiles pour les modes de défaillance d'exécution pilotés par Pandoc.

#### Ce qui reste en dehors de la portée de l'étape 8

- Large refonte de l'architecture backend/de l'orchestrateur ou un modèle de réponse générique « une enveloppe pour les gouverner tous » sur tous les endpoints.
- Toute refonte du frontend au-delà de la remédiation contractuelle minimale de l'étape 8.
- Migration de flux supplémentaires au-delà du chemin exécuté de l'étape 8.
- Exécution de vagues ultérieures au-delà du travail de synthèse/clôture de l'étape 8 (géré par les étapes ultérieures).

### Étape 8.6.2 — Mise à jour de la ligne de base multi-flux (l'ensemble de référence validé comprend l'étape 8)

#### Ensemble de référence validé (élargi)

L'ensemble de référence validé comprend désormais explicitement **quatre** flux exécutés et orientés utilisateur avec une sémantique `ConversionResult` standardisée préservée de bout en bout :

- **Premier flux migré :** AsciiDoc → Markdown (`POST /api/to-markdown`, downdoc via lazy-loader)
- **Deuxième flux migré :** Markdown → AsciiDoc (`POST /api/to-asciidoc`, Pandoc)
- **Étape 7 du flux exécuté :** Texte → Markdown (`POST /api/text-to-markdown`, text2markdown)
- **Étape 8 du flux exécuté :** HTML → * (`POST /api/from-html`, Pandoc, multi-cible)

#### Ce qui reste commun à travers les flux validés

- **Disponibilité standardisée des contrats de résultats :** les chemins de réussite et d'échec donnent un `ConversionResult` standardisé avec un `error` structuré en cas d'échec (et un `error.code` utilisable), ainsi que des champs racine obligatoires (avertissements/logs/méta présence).
- **Préservation des limites d'abord :** la limite HTTP backend efficace et la couche d'ingestion frontend principale préservent la sémantique standardisée plutôt que de reconstruire des modèles hérités ad hoc comme source de vérité.
- **Position de vérification reproductible :** chaque flux a un style de kit de vérification minimum (succès/échec du contrat + scénarios représentatifs/de référence ; sondes d'erreurs internes lorsque fondé).

#### Ce qui reste spécifique au chemin mais acceptable

- **Différences de topologie du convertisseur :** orchestration de modules à chargement paresseux (`to-markdown`) vs exécution directe de Pandoc (`to-asciidoc`, `from-html`) vs fonction de convertisseur spécialisée (`text-to-markdown`).
- **Forme de sortie de charge utile différences :** clés de sortie fixes pour les flux à cible unique par rapport à une clé de sortie dynamique pour les sorties multi-cibles de l'étape 8 (`{ [to]: result }`).
- **Nuances de surface d'erreur :** les décisions modales/toast et la messagerie spécifique au code peuvent rester dépendantes du chemin tout en préservant la sémantique structurée.

#### Ce que cela change pour la confiance des migrations futures

- **Confiance accrue dans le fait que le modèle de migration évolue** au-delà des conversions de texte à cible unique vers :
 - flux multi-cibles,
 - modes d'erreur d'exécution pris en charge par Pandoc,
 - exigences d'ingestion du contrat de l'UI en premier (prévention des états obsolètes).
- **Base de référence plus claire pour les comparaisons futures :** les flux futurs peuvent être évalués par rapport à cet ensemble de quatre flux pour détecter la dérive du contrat, les incohérences d'enveloppe et L'état de l'UI risque plus tôt avec moins d'ambiguïté.

### Étape 8 Définition de Terminé

L'étape 8 n'est terminée que si tous les critères ci-dessous sont vrais :

- Le flux de l'étape 8 a été confirmé (flux exécutable sélectionné par l'étape 8 : `HTML -> *` via `POST /api/from-html`).
- La portée de l'étape 8 a été gelée (limitée au flux de l'étape 8 uniquement).
- Le flux d'exécution a été mappé (succès/échec/comportement interne traçables).
- Le mappage de la charge utile de l'assistant a été documenté (mappé dans les entrées `createSuccessResult()` / `createFailureResult()`).
- L'intégration du chemin de réussite a été terminée (le succès standardisé `ConversionResult` est produit).
- L'intégration du chemin d'échec a été terminée (l'échec standardisé `ConversionResult` est produit avec des `error`).
- L'harmonisation des erreurs internes a été achevée (les erreurs internes/d'exécution génèrent une sémantique de défaillance structurée ; les défaillances structurées en aval sont préservées le cas échéant).
- La vérification isolée a réussi (kit de vérification minimum pour l'étape 8, y compris des scénarios représentatifs ; sonde d'erreur interne le cas échéant).
- L'alignement backend/orchestrateur a été terminé (la véritable cible backend identifiée et traitée comme la préservation point).
- La vérification du backend/de l'orchestrateur a été réussie (le contrat limite HTTP a été vérifié pour le succès et l'échec, y compris le comportement d'erreur interne lorsqu'il est fondé).
- L'alignement du frontend/de l'UI a été terminé (la véritable cible d'ingestion/de coordination de l'UI a été identifiée et corrigée au minimum pour être le contrat d'abord).
- La vérification du frontend/de l'UI a été réussie (consommation de réussite/d'échec, préservation structurée `error.code`, cohérente `idle/loading/success/error` et les garanties obsolètes ont été vérifiées).
- La comparaison des flux croisés a été effectuée (l'étape 8 comparée aux flux migrés précédemment, avec des points communs et des divergences acceptables enregistrés).
- La conformité du playbook a été vérifiée (l'étape 8 mappée à la liste de contrôle de l'étape 6.3.3 ; tous les écarts légers sont enregistrés et non bloquants).
- Les observations d'exécution ont été documentées (surprises/frictions/écarts classés et capturés).
- La vague a été validée comme étant suffisamment propre pour la fermeture (décision explicite de préparation à la fermeture enregistrée).
- La ligne de base multi-flux a été mise à jour (l'ensemble de référence validé inclut explicitement l'étape 8).

#### Ce que l'étape 8 ne nécessite pas

- Large backend/orchestrateur refonte, refactorisation ou refonte « d'une enveloppe universelle » sur tous les endpoints.
- Refonte du frontend/UI au-delà d'une remédiation minimale du contrat d'abord pour le flux de l'étape 8.
- Migration de flux supplémentaires en dehors du flux exécuté de l'étape 8.
- Réouverture des décisions d'étape précédemment fermées sans nouveau bloqueur fondé.

### Clôture de l'étape 8

L'étape 8 se ferme officiellement après l'exécution d'**un flux réel supplémentaire destiné à l'utilisateur** dans la vague sélectionnée et la validation qu'elle suit le modèle standardisé de migration/d'alignement de bout en bout.

#### Quelle étape 8 a exécutée

- Exécuté le flux de l'étape 8 : **`HTML -> *`** via **`POST /api/from-html`** (soutenu par Pandoc, multi-cibles).

#### Quelle étape 8 atteint

- **Migration au niveau du convertisseur terminée** pour le flux Step 8 : sémantique `ConversionResult` standardisée intégrée pour le succès et l'échec, avec harmonisation des erreurs internes/d'exécution en échecs structurés.
- **Alignement backend/orchestrateur terminé** pour le flux Step 8 : la véritable cible de préservation du backend (`api/backend/routes/conversion.routes.js` `/from-html`) a été identifiée, mappé et vérifié à la limite HTTP.
- **Alignement frontend/UI terminé** pour le flux de l'étape 8 : la véritable cible d'ingestion/coordination de l'UI (`api/frontend/src/converters/generic-converter.ts` `convertText(...)`) a été corrigée au minimum pour être axée sur le contrat d'abord, préserver les échecs structurés (`error.code`) et empêcher les fuites d'état obsolète.
- **Vérification et consolidation terminées :** backend isolé Vérifications du contrat e2e + scénarios représentatifs + sonde d'erreur interne réussie ; Frontend ciblé `vitest` + `typecheck` réussis.
- **Validation de la vague terminée :** L'étape 8 a été acceptée comme suffisamment propre pour la fermeture, les différences acceptables restantes étant explicitement documentées.

#### Résultat concret ajouté à l'ensemble de flux validé

- L'ensemble de référence validé s'étend pour inclure **Étape 8 `POST /api/from-html`** aux côtés des flux préalablement validés (AsciiDoc→Markdown, Markdown→AsciiDoc, Text→Markdown).

#### Ce que cela confirme sur la méthode de migration/alignement

- Le playbook/liste de contrôle de l'étape 6 est réutilisable sur un flux **multi-cibles, soutenu par Pandoc et orienté vers l'utilisateur**.
- La sémantique `ConversionResult` standardisée peut être préservée de bout en bout avec une correction **minimale et localisée** lorsqu'une friction spécifique au chemin est découverte (notamment : ingestion du contrat d'UI en premier + état obsolète 

#### Ce qui reste en dehors de la portée de l'étape 8

- Migrer tous les flux restants (y compris les candidats différés).
- Épuiser toute la vague de migration plus large au-delà du flux unique de l'étape 8 exécuté.
- Large refonte du backend/orchestrateur ou vaste travail de refonte du frontend/UI.
- Commencer les étapes futures au-delà de l'étape 8 (aucun travail de l'étape 9 n'est impliqué par la clôture de l'étape 8).

#### Note de transition

Les travaux ultérieurs devraient s'appuyer sur la base de référence multi-flux validée et élargie et réutiliser les observations de risques documentées de l'étape 8, plutôt que de rouvrir des décisions de migration/d'alignement déjà validées à moins qu'un nouveau bloqueur ne se pose. apparaît.

### Étape 9.1.1 — Réévaluation des candidats après les étapes 7 et 8 (flux non migrés restants)

#### Contexte et entrées

Cette réévaluation réutilise l'inventaire/la classification des candidats de l'étape 6 (étapes 6.1.1–6.2.3) et intègre les preuves d'exécution de :

- **Étape 7 du flux exécuté :** Texte → Markdown (`POST /api/text-to-markdown`)
- **Étape 8 du flux exécuté :** HTML → * (`POST /api/from-html`)

L'ensemble de référence validé contient désormais quatre flux exécutés (voir Étape 8.6.2), ce qui augmente considérablement la confiance dans la répétabilité de la méthode tout en révélant également des frictions multi-cibles et de consommation d'UI à prendre en compte.

#### Flux de candidats non migrés restants (de l'inventaire de l'étape 6)

Après l'exécution des étapes 7 et 8, les candidats bloqués restants de l'inventaire de l'étape 6 sont :

- **Famille multiformat générique :** `POST /api/convert` (conversions sécurisées pour les paires de formats non spécialisés)
- **Frontend Legacy Wrapper modules :** 
 - `api/frontend/src/converters/asciidoc-to-markdown.ts` 
 - `api/frontend/src/converters/markdown-to-asciidoc.ts`

(`Text -> Markdown` et `HTML -> *` étaient les candidats exécutés à l'étape 7/8 et ne sont plus « restants ».)

#### Mise à jour de l'état de préparation/observations prioritaires (plus fortes/plus faibles/ inchangé)

##### Famille multiformat générique (`POST /api/convert`)

- **Signal :** légèrement plus fort (confiance), toujours très complexe (risque) 
- **Ce qui est devenu plus fort après les étapes 7 et 8 :**
 - L'étape 8 a prouvé que le playbook évoluait vers un **Soutenu par Pandoc, flux multi-cible** avec ingestion d'UI axée sur le contrat et protections obsolètes.
 - Les modèles de vérification de l'étape 7/8 (scripts de contrat + sondes d'erreurs internes + tests d'UI) fournissent un modèle plus clair pour une large famille comme `/api/convert`.
- **Ce qui reste plus faible/à haut risque :**
 - `/api/convert` est une **famille à haute surface** (nombreuses paires, flux de jetons/confirmation, potentiellement plusieurs couches de coordination interne), de sorte que le coût de migration/alignement par vague reste plus élevé que les itinéraires dédiés déjà exécutés.
 - L'étape 8 a mis en évidence les risques de forme d'enveloppe et de contournement de validation qui deviennent plus coûteux à l'échelle `/api/convert` à moins d'être explicitement contrôlés.
- **Mise à jour prioritaire :** inchangé en principe (toujours « reporter pour plus tard » en tant que candidat à une seule vague), mais la confiance dans la planification est plus élevée grâce à Preuve d'exécution de l'étape 8.

##### Modules de wrapper existants frontend (`asciidoc-to-markdown.ts`, `markdown-to-asciidoc.ts`)

- **Signal :** inchangé (toujours nettoyage/alignement secondaire) 
- **Ce que les étapes 7 et 8 ont changé :**
 - Avec l'étape 8 désormais axée sur le contrat en premier dans `convertText(...)`, la couche d'ingestion principale destinée à l'utilisateur est renforcée comme référence.
 - Le chevauchement des wrappers devient plus clair en tant que futur sujet de consolidation, mais pas comme une migration de prochaine vague. driver.
- **Mise à jour prioritaire :** inchangée (toujours un candidat au nettoyage limité du frontend uniquement, secondaire aux familles de conversion au niveau de la route).

#### Ce qui a globalement changé après les étapes 7 et 8

- La méthode de migration/alignement est désormais validée sur un ensemble plus large et plus représentatif (y compris l'ingestion multi-cible + Pandoc + UI contract-first), qui augmente la confiance pour les vagues futures.
- La principale mise en garde supplémentaire pour les futurs candidats est explicite : les flux multi-cibles et les grandes familles nécessitent une gestion prudente de la forme d'enveloppe et des protections agressives et obsolètes à la limite d'ingestion de l'UI.

### Étape 9.1.2 — Classification des candidats mise à jour (préparation/risque/valeur de migration)

Cette sous-étape met à jour la classification de l'étape 6. (Étape 6.1.2) pour les **candidats non migrés restants** en utilisant les preuves d'exécution des étapes 7 et 8.

#### Candidats restants (liste inchangée)

- Famille multiformat générique : `POST /api/convert`
- Modules wrapper frontend hérités :
 - `api/frontend/src/converters/asciidoc-to-markdown.ts`
 - `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Tableau de classification mis à jour

| Chemin de conversion des candidats | Préparation mise à jour | Risque de migration mis à jour | Valeur de migration mise à jour | Mouvement vs Étape 6 | Justification brève et fondée |
|---|---:|---:|---:|---|---|
| Famille multiformat générique (`POST /api/convert`) | Moyen | Élevé | Élevé (stratégique), moyen (à court terme) | Stable (confiance ↑) | Les étapes 7 à 8 valident la méthode et les modèles de vérification (y compris les sondes internes et l'ingestion de l'UI en priorité sur le contrat), ce qui augmente la confiance en matière de planification. Cependant, `/api/convert` reste une famille à grande surface, multiformat et protégée par jetons, avec un couplage et une variance plus élevés que les routes dédiées, de sorte que le risque pratique reste élevé. |
| Modules de wrapper hérités frontend (`asciidoc-to-markdown.ts`, `markdown-to-asciidoc.ts`) | Moyen | Faible-Moyen | Moyen | Stable | Les étapes 7 à 8 ont renforcé `convertText(...)` car la principale limite d'ingestion face à l'utilisateur et l'ingestion prouvée par contrat en premier peuvent y être localisées. Le chevauchement des wrappers reste un candidat limité au nettoyage/alignement, mais il reste secondaire par rapport aux migrations de familles de routes et ne modifie pas matériellement l'état de préparation/le risque/la valeur. |

#### Notes sur le mouvement (vers le haut / vers le bas / stable)

- **Amélioré :** aucun (le profil de préparation/de risque du candidat restant ne s'est pas suffisamment amélioré pour changer de catégorie).
- **Déclassé :** aucun.
- **Stable :** les deux candidats restants ; le principal changement est une confiance accrue et une documentation plus claire des risques, et non une reclassification.

### Étape 9.1.3 — Prochain objectif de migration réaliste/sélection de petites vagues

Cette sous-étape sélectionne le prochain objectif de migration réaliste (ou une très petite vague) à l'aide de la liste de candidats restants réévaluée (étape 9.1.1) et de la classification état de préparation/risque/valeur mise à jour (étape 9.1.2).

#### Candidats restants considérés

- Famille multiformat générique : `POST /api/convert` (préparation moyenne, risque élevé, valeur stratégique élevée)
- Modules de wrapper frontend hérités :
 - `api/frontend/src/converters/asciidoc-to-markdown.ts`
 - `api/frontend/src/converters/markdown-to-asciidoc.ts`
 (préparation moyenne, risque faible à moyen, valeur moyenne)

#### Sélection

- **Cible suivante sélectionnée (très petite vague) :** Alignement/consolidation du module wrapper existant du frontend
 - `api/frontend/src/converters/asciidoc-to-markdown.ts`
- `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Pourquoi c'est le meilleur choix après les étapes 7 et 8

- **Travail restant à faible risque avec une portée clairement délimitée :** après l'étape 8, la couche d'ingestion principale (`convertText(...)`) est prioritaire sur le contrat pour tous les flux validés ; Le chevauchement des wrappers est désormais le candidat restant le plus contenu pour réduire l'ambiguïté et le risque de dérive sans étendre la surface du backend.
- **Fort effet de levier pour les migrations futures :** la clarification/normalisation de l'utilisation du wrapper (conserver, déprécier ou rediriger vers les conventions `convertText`) réduit le bruit des « points d'entrée multiples », ce qui sera plus important si/quand le projet ouvre la large famille `/api/convert`.
- **Évite une expansion prématurée en grande surface :** `/api/convert` reste la famille la plus grande et la plus à risque ; la sélection de la consolidation du wrapper permet de conserver l'étape suivante réaliste et comparable au modèle validé sans rouvrir la complexité multi-format.

#### Ce qui reste reporté à plus tard

- **Différé :** Famille multiformat générique `POST /api/convert`
- Justification : superficie encore élevée et couplage/variance plus élevés que les itinéraires dédiés ; mieux abordé une fois que le chevauchement des wrappers est clarifié et avec une stratégie de sous-tranche `/api/convert` spécifiquement délimitée plutôt qu'une large vague « toutes les paires à la fois ».

### Étape 9.2.1 — Stratégie d'exécution pour la prochaine cible sélectionnée/petite vague

#### Cible/vague sélectionnée (à partir de l'étape 9.1.3)

- **Très petite vague frontend :** alignement/consolidation du module wrapper existant
- `api/frontend/src/converters/asciidoc-to-markdown.ts`
- `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Stratégie d'exécution pratique

- **Strictement un flux/module à la fois :** oui.
- Même s'il s'agit d'une « petite vague », chaque wrapper est traité comme sa propre unité délimitée pour simplifier la vérification et la restauration.

#### Ordre d'exécution recommandé

1. **Module d'entrée :** `api/frontend/src/converters/asciidoc-to-markdown.ts`
2. **Deuxième module :** `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Justification du flux d'entrée (pourquoi commencer ici)

- Le wrapper AsciiDoc → Markdown est la première direction historique migrée et est la « direction de référence » la plus courante dans le récit du projet et les artefacts de validation antérieurs.
- Commencer ici minimise l'ambiguïté lors de la décision de l'intention du wrapper (conserver vs redirection vs dépréciation) car les attentes contractuelles environnantes et la sémantique de l'UI sont les plus établies.

#### Ce qui reste différé jusqu'à ce que les résultats précédents soient validés

- **Différé :** `POST /api/convert` famille (conversions multi-formats génériques)
 - Rester différé jusqu'à ce que les décisions de chevauchement des wrappers soient validées, donc futures `/api/convert` le travail n'accumule pas d'ambiguïté supplémentaire au point d'entrée.

#### Pourquoi cette stratégie est la plus sûre et la plus pratique

- **Surface délimitée :** les modifications sont limitées aux modules wrapper frontend et n'étendent pas la surface backend.
- **Couplage faible :** la consolidation du wrapper peut être validée avec des tests unitaires ciblés sans nécessiter une large surface de bout en bout. Refonte de l'UI.
- **Effacer l'arrêt/la porte :** une fois le wrapper d'entrée aligné et vérifié, passer au deuxième wrapper uniquement si le comportement reste non régressif et si la sémantique reste en premier sur le contrat à la limite d'ingestion principale.

### Étape 9.2.2 — Gel de la portée + conditions d'entrée (prochain cycle de migration)

#### Cible sélectionnée / vague

- **Très petite vague de frontend :** alignement/consolidation du module wrapper existant
 - `api/frontend/src/converters/asciidoc-to-markdown.ts` (module d'entrée)
 - `api/frontend/src/converters/markdown-to-asciidoc.ts` (deuxième module)

#### Dans le champ d'application (doit rester délimité)

- Aligner/consolider les deux frontend existants modules wrapper afin qu'ils ne sapent pas la sémantique du contrat d'abord établie à la limite d'ingestion principale (`convertText(...)`).
- Ajoutez/ajustez uniquement les tests unitaires minimaux nécessaires pour vérifier que le comportement du wrapper reste cohérent et non régressif.
- Mises à jour de la documentation requises pour enregistrer les résultats, les risques et les preuves de vérification pour cette vague axée sur le wrapper.

#### Hors de portée (ne fait explicitement pas partie de ce cycle)

- Toute modification du backend (routes, convertisseurs, orchestrateurs, mise en forme de la charge utile).
- Toute migration de flux de conversion supplémentaires au-delà des deux modules wrapper.
- Toute refonte large du frontend/UI (composants, disposition, modifications majeures du modèle d'état).
- Toute tentative de refonte de l'enveloppe backend de l'étape 8 ou de globalisation d'un seul wrapper de réponse dans tous endpoints.

#### Différé (ne doit pas être extrait)

- **Différé :** Famille multiformat générique `POST /api/convert` (et toute extension au travail de conversion « toutes les paires »).
- Tout nettoyage de wrapper supplémentaire au-delà des deux modules de wrapper explicitement répertoriés.

#### Conditions Go / No-Go (doivent être remplies avant le début de l'exécution)

- **Conditions Go**
 - La ligne de base validée actuelle reste verte (tests frontend + réussite de la vérification de type).
 - Le chemin d'ingestion du contrat Step 8 en premier dans `convertText(...)` reste intact et vérifié.
 - Les modules wrapper sont toujours présents et clairement isolés en tant que points d'entrée séparés dans la base de code (ils peuvent donc être alignés sans toucher à l'UI sans rapport).

- **Conditions interdites**
 - Le travail nécessiterait des modifications du backend pour continuer (violation de la portée).
 - L'alignement du wrapper ne peut pas être effectué sans une refonte générale de l'UI/de l'état (violation de la portée).
 - Les tests de base existants échouent avant toute modification du wrapper (ligne de base de non-régression non établie).

#### Règle de non-expansion pendant exécution

- La portée ne doit pas s'étendre au-delà des deux modules wrapper et de leurs tests/docs directs, à moins qu'un problème **fondé et bloquant** ne soit découvert qui empêche tout alignement sûr dans cette portée délimitée. Dans ce cas, la réponse correcte est de documenter le bloqueur et de l'arrêter plutôt que d'élargir la vague.

#### Pourquoi ce gel de la portée maintient le prochain cycle sous contrôle et à faible risque

- Il limite les modifications à une petite surface frontend uniquement tout en préservant la sémantique contractuelle validée de bout en bout déjà obtenue à l'étape 8.
- Il fournit une autorisation/non-go claire. bloque et empêche la réintroduction du couplage multi-flux ou de l'expansion de la surface backend qui réduirait la comparabilité et augmenterait le risque de régression.

### Étape 9.2.3 — Package de transfert prêt à exécuter (prochain cycle de migration)

Cette section est le **point de départ du prochain cycle d'exécution**. Il consolide l'objectif sélectionné, la stratégie d'exécution, le gel de la portée et les attentes minimales en matière de préparation/vérification sans rouvrir les décisions de planification antérieures.

#### Cible sélectionnée / petite vague

- **Alignement/consolidation du wrapper frontend (très petite vague) :**
 - `api/frontend/src/converters/asciidoc-to-markdown.ts` (entrée)
 - `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Flux d'entrée

- **Module d'entrée :** `api/frontend/src/converters/asciidoc-to-markdown.ts`

#### Ordre d'exécution (strict)

1. Exécutez et validez l'alignement du wrapper pour `asciidoc-to-markdown.ts`.
2. Ce n'est qu'une fois que la validation reste verte, exécutez et validez l'alignement du wrapper pour `markdown-to-asciidoc.ts`.

#### Éléments concernés

 - Alignez les modules wrapper afin qu'ils n'introduisent pas un modèle de réussite-échec concurrent/hérité qui sape la sémantique du contrat d'abord à la limite d'ingestion principale (`api/frontend/src/converters/generic-converter.ts` → `convertText(...)`).
- Tests minimaux pour le comportement du wrapper et la non-régression.
- Mises à jour minimales de la documentation capturant les résultats, les risques et les preuves de vérification pour cette vague de wrapper.

#### Éléments différés (doivent rester différés)

- Famille multiformat générique `POST /api/convert` (et tout « étendre à toutes les paires » fonctionne).
- Toute migration de flux supplémentaire au-delà des deux modules wrapper.
- Toute modification du backend.
- Toute refonte générale de l'UI.

#### Conditions de préparation requises (go/no-go)

- **Go**
 - La ligne de base du frontend reste verte : `npm test` et `npm run typecheck` réussis.
 - L'ingestion du contrat en premier de l'étape 8 reste intacte et vérifiée en `convertText(...)` (pas de régression dans la référence validée à quatre flux set).
 - Les modules wrapper sont clairement identifiables et peuvent être mis à jour sans toucher aux composants de l'UI non liés.

- **No-Go**
 - Tout besoin de modifications du backend pour continuer.
 - Toute exigence de refonte de l'UI/de l'état en général pour aligner le comportement du wrapper.
 - Les tests de base ont échoué avant démarrage.

#### Attentes de vérification requises (minimum)

- **Vérification d'unité**
 - Ajouter/maintenir des tests axés sur le wrapper qui confirment que le comportement du wrapper ne :
 - aplatir les échecs structurés en chaînes,
 - autoriser les fuites de sortie/d'état obsolètes entre les tentatives,
 - contourner la sémantique du contrat d'abord pour les flux validés.
- **Vérification de non-régression**
 - Réexécuter `npm test` et `npm run typecheck` après l'alignement de chaque module wrapper.
 - Ne pas passer au deuxième wrapper si le wrapper d'entrée introduit des régressions.

#### Note de transfert

L'exécution future devrait commencer à partir de ce package, en traitant la sélection de l'étape 9.1.x et les décisions de portée des étapes 9.2.1 à 9.2.2 comme des entrées fixes à moins qu'un nouveau bloqueur fondé ne soit découvert.

### Étape 9.3.1 — Résumé de la préparation de l'étape 9 (prochain cycle de migration)

L'étape 9 prépare le prochain cycle de migration en réévaluer les candidats restants après l'exécution des étapes 7 et 8, mettre à jour les classifications, sélectionner la prochaine cible réaliste et geler un ensemble de stratégie/portée prêt à être exécuté.

#### Ce que l'étape 9 a réévalué

- Réévalué les candidats non migrés restants de l'inventaire de l'étape 6 après l'exécution des étapes 7 et 8 (étape 9.1.1).

#### Ce que l'étape 9 a reclassé

- Mise à jour de la classification état de préparation/risque/valeur pour les candidats restants à l'aide des apprentissages des étapes 7 à 8 (étape 9.1.2), en notant les changements de stabilité et de confiance.

#### Ce que l'étape 9 a sélectionné suivant

- Sélection de la petite vague réaliste suivante : **alignement/consolidation du wrapper hérité du frontend** (entrée `asciidoc-to-markdown.ts`, puis `markdown-to-asciidoc.ts`) (étape 9.1.3).
- Report explicite de la famille `POST /api/convert` à haute surface pour un travail ultérieur et délimité.

#### Quelle stratégie d'exécution l'étape 9 a définie

- Définition d'un ordre d'exécution et d'un module d'entrée stricts, un module à la fois (étape 9.2.1).

#### Quelles sont la portée et les conditions de préparation de l'étape 9 ont été gelées

- Portée gelée (dans le champ d'application/hors champ d'application/différé) et conditions d'entrée go/no-go pour maintenir le prochain cycle limité et à faible risque (étape 9.2.2).

#### Quel package de transfert l'étape 9 a produit

- Un package de transfert consolidé et prêt à être exécuté comprenant :
 - vague sélectionnée + module d'entrée
 - ordre d'exécution strict
 - portée limitée + éléments différés
 - portes de préparation
 - attentes de vérification minimales 
 (étape 9.2.3)

#### Ce qui nécessite encore une exécution réelle plus tard

- Implémenter les changements d'alignement du wrapper eux-mêmes et les valider dans pratique.
- Tout travail de migration sur la famille `/api/convert` différée (future sous-tranche délimitée) et toute migration de flux supplémentaire au-delà des deux modules wrapper.

### Clôture de l'étape 9

L'étape 9 se termine officiellement après la préparation du prochain cycle de migration avec une base de planification contrôlée et documentée, sans exécuter de nouvelle migration travail.

#### Ce que l'étape 9 a réévalué

- Réévalué les candidats non migrés restants de l'inventaire de l'étape 6 en utilisant les preuves d'exécution des étapes 7 et 8 (étapes 9.1.1 à 9.1.2).

#### Ce que l'étape 9 a reclassé

- Mise à jour de la classification état de préparation/risque/valeur pour les candidats restants, reflétant une confiance accrue dans la méthode tout en gardant les risques de surface élevés explicites (étape 9.1.2).

#### Ce que l'étape 9 a sélectionné ensuite

- Sélection de la prochaine petite vague réaliste : **héritage frontend Alignement/consolidation du wrapper** :
 - `api/frontend/src/converters/asciidoc-to-markdown.ts` (entrée)
 - `api/frontend/src/converters/markdown-to-asciidoc.ts`
 (Étape 9.1.3)

#### Quelle stratégie d'exécution l'étape 9 a définie

- Ordre d'exécution strict d'un module à la fois, avec `asciidoc-to-markdown.ts` comme module d'entrée et un stop/gate avant de passer au deuxième wrapper (étape 9.2.1).

#### Quelles limites de portée et conditions de passage/non-go L'étape 9 a été gelée

- Portée gelée sur deux modules de wrapper frontend + tests/docs minimaux uniquement ; les modifications du back-end, la refonte générale de l'UI et l'expansion `/api/convert` restent hors de portée. Les conditions Go/no-go sont explicitement définies pour conserver la non-régression et l'exécution limitée (étape 9.2.2).

#### Quel package de transfert prêt à exécuter l'étape 9 a produit

- Un package de transfert consolidé contenant :
 - vague sélectionnée + module d'entrée
 - ordre d'exécution strict
- éléments entrant dans le champ d'application/hors champ d'application/différés
 - conditions de préparation go/no-go
 - attentes minimales en matière de vérification 
 (étape 9.2.3)

#### Ce que l'étape 9 fournit désormais au projet

- Un point de départ stable et prêt à être exécuté pour le prochain cycle de migration qui ne le fait pas rouvrir les décisions de contrat/d'alignement validées de l'étape 7/8 à moins qu'un nouveau bloqueur fondé n'apparaisse.
- Des limites de report claires afin que les candidats à forte surface (notamment `/api/convert`) restent différés jusqu'à un cycle ultérieur et délimité.

#### Ce que l'étape 9 ne signifie pas

- Le flux suivant est déjà migré.
- La vague suivante est déjà exécutée.
- Tous les candidats restants sont maintenant prêts.
- Un vaste travail de refonte a été terminé.
- Un cycle d'exécution de l'étape 10 a déjà commencé.

### Étape 10.1.1 — Confirmation du flux d'entrée de l'étape 10 (à partir de l'étape 9 Handoff)

#### Flux d'entrée d'exécution sélectionné

- **Module d'entrée/flux à exécuter en premier :** `api/frontend/src/converters/asciidoc-to-markdown.ts` (point d'entrée de la vague d'alignement/de consolidation du wrapper hérité tel que défini à l'étape 9.2.3).

#### Confirmation de préparation (go/no-go)

- **Les conditions de démarrage confirmées sont toujours valables :**
 - La ligne de base du frontend est verte (`npm test` et `npm run typecheck` réussite).
 - Le chemin d'ingestion du contrat d'abord de l'étape 8 dans `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`) reste intact et vérifié par les tests existants.
 - Le module wrapper d'entrée existe et est suffisamment isolé pour être aligné sans nécessitant des modifications de l'UI sans rapport.

#### Pourquoi cela reste la prochaine cible d'exécution correcte

- Il s'agit de l'étape suivante la moins risquée et la plus limitée qui réduit l'ambiguïté multi-points d'entrée sans étendre la surface du backend.
- Elle s'aligne directement sur la portée gelée et la stratégie d'exécution stricte préparée à l'étape 9 (un module à la fois, valider avant en cours).

#### Remarque sur le bloqueur (uniquement si fondé)

- Aucun bloqueur fondé identifié à l'entrée de l'étape 10 : les portes de préparation sont satisfaites et la portée reste exécutable comme prévu.

### Étape 10.2.1 — Cartographie du flux d'exécution actuel (avant l'aide Intégration)

- **Nom du flux :** Entrée d'exécution de l'étape 10 — wrapper frontend existant `AsciiDoc -> Markdown` via `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown(...)`)
- **Point de terminaison backend utilisé :** `POST /api/to-markdown` (via `${API_BASE}/api/to-markdown`)

#### Entrée point

- `api/frontend/src/converters/asciidoc-to-markdown.ts` exporte `convertAsciiDocToMarkdown(text, setStatus, setOutput, setLoading, setNotification, [setShowErrorModal], [setErrorMessage])`.
- Il s'agit d'un wrapper orienté vers l'UI qui **ne renvoie pas d'objet de résultat** ; il pilote l'état de l'UI via les rappels du setter transmis.

#### Wrapper / convertisseur principal

- Fonction wrapper : `convertAsciiDocToMarkdown(...)`
- Moteur interne : navigateur `fetch(...)` vers la route backend `POST /api/to-markdown`
- Timeout : `AbortController` avec un timeout de 30 s.

#### Entrée paramètres

- `text: string` (Contenu source AsciiDoc)
- Paramètres de l'UI :
 - `setStatus: (string) => void`
 - `setOutput: (string) => void`
 - `setLoading: (boolean) => void`
 - `setNotification: (Notification | null) => void`
 - facultatif `setShowErrorModal`, `setErrorMessage`

#### Gestion des fichiers temporaires

- Aucune dans le wrapper frontend (pas d'E/S de fichier). Tout comportement de fichier temporaire appartient au backend (`/api/to-markdown` chemin de route).

#### Chemin de réussite (comportement actuel)

1. Pré-vérification : si `!text.trim()` → définit le statut (« veuillez saisir du texte ») et revient plus tôt.
2. Définit `status` sur « conversion en cours », définit `loading=true`.
3. Problèmes `fetch(POST ${API_BASE}/api/to-markdown, body: { text })` avec délai d'attente d'abandon.
4. Si `res.ok` :
 - `data = await res.json()`
 - `setOutput(data.markdown ?? "")`
 - définit le statut « succès » + notification de succès.
5. Définit toujours `loading=false` dans `finally`.

#### Chemin d'échec (comportement actuel)

La gestion des échecs est **mixte** : la fonction retourne parfois plus tôt (échec géré), et parfois lance puis rattrape (capture générique), tout en pilotant toujours l'UI via des rappels.

1. **HTTP non-OK (`!res.ok`) :**
 - Tentatives d'analyse de JSON ; préfère `errorJson.detail` lorsqu'il est présent ; sinon, on revient au texte de réponse.
 - Si le message d'erreur correspond à une famille connue « la sortie est toujours AsciiDoc / la sortie est égale à l'entrée » :
 - ouvre un modal d'erreur de conversion (si les rappels sont fournis),
 - définit l'état + la notification d'erreur,
 - ** renvoie ** (pas de lancement).
 - Sinon, lance `new Error("HTTP error ...")` qui est géré par l'extérieur `catch`.
2. **Timeout/réseau/autres exceptions (`catch`) :**
 - Délai d'expiration (`AbortError`) → statut + notification d'erreur (message de délai d'attente).
 - Pannes de réseau (`NetworkError` / `Failed to fetch`) → statut + notification d'erreur (impossible d'atteindre le backend).
 - Sinon → statut + notification d'erreur avec une « erreur d'appel API » générique message.
3. Définit toujours `loading=false` dans `finally`.

#### Forme de réussite actuelle (limite effective de l'UI)

- **Sortie :** `setOutput(data.markdown ?? "")` (chaîne)
- **Statut/notification :** chaînes de réussite uniquement
- **Sémantique du résultat de conversion :** non consommée/stockée ici ; `conversionResult` dans la réponse du backend est actuellement ignoré par ce wrapper.

#### Forme d'échec actuelle (limite effective de l'UI)

- **Forme d'erreur :** aplatie en :
 - chaînes d'état,
 - messages de notification,
 - message modal facultatif (pour un sous-ensemble correspondant de noms connus textes d'erreur).
- **Sémantique de défaillance structurée (`ConversionResult.error.code`, etc.) :** non préservée/propagée par ce wrapper ; il est piloté par message.

#### Observations pertinentes pour l'intégration (avant toute intégration d'assistance)

- Le wrapper est **piloté par l'état hérité** : il possède le cycle de vie des tentatives d'UI via des setters plutôt que de renvoyer un résultat structuré.
- Il est **piloté par les détails/messages** et ne consomme pas de `ConversionResult` standardisé. sémantique de réussite/échec même lorsque le backend les fournit.
- Il mélange les **retours anticipés** (échecs gérés) avec **throw/catch** (échec générique), ce qui complique une consommation cohérente en aval.
- Il n'a **pas d'effacement explicite des sorties obsolètes** au démarrage de la tentative ; la cohérence de la sortie dépend des appelants et de l'ordre des mises à jour de l'état de l'UI.

### Étape 10.2.2 — Mappage de la charge utile de l'assistant vers les constructeurs centralisés (avant l'intégration)

- **Nom du flux :** Entrée d'exécution de l'étape 10 — wrapper frontal existant `AsciiDoc -> Markdown` (`api/frontend/src/converters/asciidoc-to-markdown.ts`)
- **Assistants cibles :** `createSuccessResult(payload)` / `createFailureResult(payload)` (contrat standardisé `ConversionResult`)
- **Intention de mappage :** définir comment ce flux doit **consommer et préserver** la sémantique backend standardisée (de préférence) et ce qui peut/ne peut pas être dérivé localement au niveau de la couche wrapper.

#### Cartographie réussie de la charge utile (`createSuccessResult(payload)`)

| Champ | Source d'exécution dans le flux de wrapper actuel de l'étape 10 | Statut du mappage | Stratégie de cartographie pour l'intégration |
|---|---|---|---|
| `conversionId` | Backend `data.conversionResult.conversionId` (si présent) | Direct (de préférence), sinon manquant | Exiger le backend `conversionResult` et passer par `conversionId` inchangé. N'en générez pas de nouveau dans le wrapper de l'UI. |
| `converter` | Backend `data.conversionResult.converter` (si présent) | Direct (de préférence), sinon manquant | Passez par le backend (`downdoc`/`pandoc` etc.) pour éviter les suppositions de l'UI. |
| `pipeline` | Back-end `data.conversionResult.pipeline` | Direct (de préférence), sinon manquant | Passer tel quel. |
| `inputFormat` | Back-end `data.conversionResult.inputFormat` | Direct (de préférence), sinon dérivable | Préférer la valeur backend ; s'il est absent, dérivez comme `'asciidoc'` de la sémantique du wrapper. |
| `outputFormat` | Back-end `data.conversionResult.outputFormat` | Direct (de préférence), sinon dérivable | Préférer la valeur backend ; en cas d'absence, dérivez comme `'markdown'`. |
| `inputFile` | Back-end `data.conversionResult.inputFile` | Direct (préféré), sinon dérivable (faible) | Préférez le descripteur backend. L'UI peut dériver un descripteur en mémoire d'une longueur de `text`, mais cela est plus faible que les métadonnées appartenant au backend. |
| `outputFile` | Back-end `data.conversionResult.outputFile` | Direct (préféré), sinon dérivable (faible) | Préférez le descripteur backend. L'UI peut dériver un descripteur de sortie en mémoire à partir de la longueur `data.markdown`, mais le backend est la source canonique. |
| `startedAt` | Heure de début de la tentative du backend `data.conversionResult.startedAt` ou du wrapper | Direct (de préférence), sinon dérivable | Préférez le backend `startedAt` ; en cas d'absence, capturez l'horodatage de début de la tentative du wrapper. |
| `finishedAt` | Backend `data.conversionResult.finishedAt` ou heure d'achèvement du wrapper | Direct (de préférence), sinon dérivable | Préférez le backend `finishedAt` ; en cas d'absence, capturez l'horodatage d'achèvement du wrapper. |
| `durationMs` | Backend `data.conversionResult.durationMs` ou temps écoulé du wrapper | Direct (de préférence), sinon dérivable | Préférer la durée du backend ; sinon, calculez `Date.now() - startedAtMs` dans le wrapper. |
| `warnings` | Back-end `data.conversionResult.warnings` | Direct (de préférence), sinon par défaut | La valeur par défaut est `[]` en cas d'absence, mais préférez la valeur backend. |
| `logs` | Back-end `data.conversionResult.logs` | Direct (de préférence), sinon par défaut | La valeur par défaut est `[]` en cas d'absence, mais préférez la valeur backend. |
| `meta` | Back-end `data.conversionResult.meta` | Direct (préféré), sinon par défaut/dérivable | Préférer la valeur backend ; sinon, la valeur par défaut est `{}` et inclut éventuellement des métadonnées minimales de wrapper (par exemple `{ uiWrapper: 'asciidoc-to-markdown' }`). |

#### Cartographie de la charge utile de défaillance (`createFailureResult(payload)`)

| Champ | Source d'exécution dans le flux de wrapper actuel de l'étape 10 | Statut du mappage | Stratégie de cartographie pour l'intégration |
|---|---|---|---|
| `conversionId` | Enveloppe de défaillance du backend (de préférence), sinon manquante | Direct (de préférence), sinon manquant | Préférez consommer un échec standardisé depuis le backend ; ne créez pas de nouveau conversionId pour un échec du backend dans le wrapper. |
| `converter` | Enveloppe de défaillance du backend `converter` | Direct (de préférence), sinon manquant | Passer depuis le backend. |
| `pipeline` | Enveloppe de défaillance du backend `pipeline` | Direct (de préférence), sinon manquant | Passer tel quel. |
| `inputFormat` | Enveloppe de défaillance du backend `inputFormat` | Direct (de préférence), sinon dérivable | Préférer le back-end ; dériver `'asciidoc'` seulement si nécessaire. |
| `outputFormat` | Enveloppe de défaillance du backend `outputFormat` | Direct (de préférence), sinon dérivable | Préférer le back-end ; dériver `'markdown'` seulement si nécessaire. |
| `inputFile` | Enveloppe de défaillance du backend `inputFile` | Direct (préféré), sinon dérivable (faible) | Préférer le descripteur backend ; le wrapper ne peut dériver qu'un descripteur minimal en mémoire à partir de `text`. |
| `startedAt` | Enveloppe d'échec du backend `startedAt` ou démarrage de la tentative de wrapper | Direct (de préférence), sinon dérivable | Préférer le back-end ; sinon, capturez l'horodatage de début de la tentative. |
| `finishedAt` | Enveloppe d'échec du backend `finishedAt` ou temps d'achèvement du wrapper | Direct (de préférence), sinon dérivable | Préférer le back-end ; sinon, capturez l'horodatage d'achèvement. |
| `durationMs` | Enveloppe d'échec du backend `durationMs` ou wrapper écoulé | Direct (de préférence), sinon dérivable | Préférer le back-end ; sinon, calculez le temps écoulé. |
| `error` | Enveloppe de défaillance du backend `error` (structurée) | Direct (de préférence), sinon manquant | Conserver l'erreur de backend structurée (`code`, `message`, `details`, `recoverable`). Ne remplacez pas par des erreurs de chaîne uniquement lorsqu'une erreur structurée est disponible. |
| `outputFile` | Enveloppe de défaillance du backend `outputFile` (généralement nulle) | Direct (de préférence), sinon par défaut | Préférer le back-end ; par défaut à `null` en cas d'absence. |
| `warnings` | Enveloppe de défaillance du backend `warnings` | Direct (de préférence), sinon par défaut | Par défaut, `[]` en cas d'absence. |
| `logs` | Enveloppe de défaillance du backend `logs` | Direct (de préférence), sinon par défaut | La valeur par défaut est `[]` en cas d'absence. |
| `meta` | Enveloppe de défaillance du backend `meta` | Direct (préféré), sinon par défaut/dérivable | Préférez la méta backend ; sinon, la valeur par défaut est `{}` avec un marqueur d'emballage minimal si nécessaire. |

#### Classification de la disponibilité des champs (réalité de la couche wrapper)

- **Direct (de préférence, propriété du backend) :** tous les champs `ConversionResult` standardisés lorsque `data.conversionResult` est présent en cas de succès et lorsque le backend renvoie une enveloppe d'échec standardisée au niveau racine sur les réponses non OK.
- **Dérivable localement (repli acceptable, plus faible) :** `inputFormat`, `outputFormat`, `startedAt`, `finishedAt`, `durationMs`, descripteurs minimaux `inputFile`/`outputFile` (en mémoire) basés sur la taille des chaînes.
- **Par défaut :** `warnings: []`, `logs: []`, `meta: {}` uniquement lorsqu'ils ne sont pas fournis (mais le backend doit être la source canonique lorsqu'une sémantique standardisée existe).
- **Manquant dans l'implémentation actuelle du wrapper (pré-intégration) :** structuré `ConversionResult` consommation/préservation ; Le wrapper actuel aplatit les échecs en chaînes/modaux et ignore `conversionResult` sur les réponses réussies.

### Étape 10.2.3 — Intégrer `createSuccessResult()` dans le chemin de réussite de l'étape 10

- **Modification appliquée (succès uniquement) :** `api/frontend/src/converters/asciidoc-to-markdown.ts` consomme désormais le backend `data.conversionResult` sur le chemin `res.ok` et crée un résultat **succès standardisé entièrement façonné** via `createSuccessResult(payload)` (en préservant les champs appartenant au backend tels que `conversionId`, `converter`, `pipeline`, les formats, les fichiers, le timing, `warnings`, `logs`, `meta`).
- **Remarque sur la portée :** la gestion des échecs est intentionnellement inchangée ici (réservée pour une étape ultérieure).

### Étape 10.2.4 — Intégrer `createFailureResult()` dans le chemin de défaillance de l'étape 10

- **Modifier appliqué (en cas d'échec uniquement) :** `api/frontend/src/converters/asciidoc-to-markdown.ts` standardise désormais les sorties d'échec du wrapper en renvoyant un résultat **d'échec standardisé entièrement formé** via `createFailureResult(payload)`, en préservant les enveloppes d'échec du backend lorsqu'elles sont présentes (niveau racine `ConversionResult` sur les réponses non OK) et en revenant aux formes standardisées minimales `INTERNAL_ERROR`/`EMPTY_INPUT` uniquement pour les échecs côté client (délai d'attente/réseau/pré-vérification).

### Étape 10.2.5 — Harmoniser la gestion des erreurs internes (pas de contournement de contrat)

- **Modification appliquée :** suppression des échappements internes évitables restants « lancer puis attraper » pour le chemin non OK `/api/to-markdown` et les échecs de validation de réponse réussie. Ces sorties renvoient désormais directement un échec standardisé `ConversionResult`, gardant intact le chemin de réussite déjà intégré.

### Étape 10.3.1 — Identifier la véritable cible d'alignement backend/orchestre (étape 10)

- **Nom du flux :** Entrée d'exécution de l'étape 10 — `AsciiDoc -> Markdown` via `POST /api/to-markdown`
- **Objectif de cette étape :** identifier la véritable cible backend/orchestrateur où le succès/échec de ce flux est coordonné et où `ConversionResult` peut encore être préservé, remodelé ou interrompu.

#### Véritables couches de coordination backend impliquées

- **Cible d'entrée/route HTTP (coordination frontière):** `api/backend/routes/conversion.routes.js` → `router.post('/to-markdown', ...)`
 - Possède la validation de la demande (`validate.middleware.js` + schéma Zod)
 - Possède la pré-vérification au niveau de la route (`EMPTY_INPUT`) et la mise en forme de la réponse :
 - Enveloppe de réponse de réussite : `{ markdown, conversionResult: result }`
 - Enveloppe de réponse d'échec : niveau racine `ConversionResult` + héritage `detail`
 - Possède la validation de sortie au niveau de la route (par exemple, « la sortie est une entrée », « la sortie ressemble à AsciiDoc ») et convertit celles-ci en échecs standardisés via `buildFailureFromSuccessfulResult(...)`.
- **Couche backend « orchestration/dispatch » (coordination de l'exécution du convertisseur) :**
- `api/backend/services/modules/lazyload.module.js` → `runConverter(moduleName, inputPath, outputPath, options)`
 - Responsable du chargement paresseux du module, de la validation du chemin, des vérifications de format, de la validation des résultats du module et de l'exécution de la conversion via l'interface de module partagée.
- **Module de conversion (implémentation du moteur) :**
 - `api/backend/services/modules/adoc-to-md.converter.js` (enregistré comme nom de module `'downdoc'`)
 - Produit le `ConversionResult` standardisé en cas de succès/échec à l'intérieur des limites du module (puis conservé vers le haut par `lazyload`).

#### Cible d'alignement backend/orchestrateur choisie

- **Cible principale pour l'alignement backend/orchestrateur de l'étape 10 :** `api/backend/routes/conversion.routes.js` (`POST /api/to-markdown`)

#### Pourquoi c'est le bon focus

- **C'est ici que le flux est invoqué :** c'est le point d'entrée HTTP concret utilisé par le wrapper de l'étape 10.
- **C'est ici que le succès/l'échec est coordonné à la limite de la réponse :** il décide de la forme finale de l'enveloppe (succès enveloppe `conversionResult` ; les échecs sont au niveau de la racine avec `detail`), qui est l'endroit le plus courant où la dérive de contrat est introduite.
- **C'est le dernier point à préserver/enrichir sans rompre la sémantique :** il peut post-traiter la sortie et peut remodeler un résultat standardisé en aval (par exemple via `buildFailureFromSuccessfulResult`), c'est donc le meilleur endroit unique pour vérifier/aligner la préservation du contrat avant d'aborder plus profondément couches.

### Étape 10.3.2 — Carte de flux backend/orchestre (étape 10 via la cible 10.3.1)

- **Nom du flux :** Entrée d'exécution de l'étape 10 — `AsciiDoc -> Markdown` via `POST /api/to-markdown`
- **Cible backend confirmée :** `api/backend/routes/conversion.routes.js` (`router.post('/to-markdown', ...)`)

#### Flux de réussite (backend)

1. **Entrée HTTP :** `POST /api/to-markdown` → `conversion.routes.js`.
2. **Demande de validation :** `validate.middleware.js` + Zod assure `{ text: string, options?: any }`.
3. **Prévérification de l'itinéraire :** si `!text.trim()` → l'itinéraire génère un échec standardisé (`EMPTY_INPUT`) et renvoie **400** sous la forme `{ ...failure, detail: failure.error.message }`. (Il s'agit d'un chemin d'échec ; voir ci-dessous.)
4. **Normalisation des entrées + fichiers temporaires :**
 - Supprime la balise `:experimental:` d'en-tête uniquement et normalise AsciiDoc (`removeExperimentalTag`, `normalizeAsciiDocInput`).
 - Crée un répertoire temporaire et écrit `input.adoc` + prépare `output.md`.
5. **Répartition / coordination du convertisseur :** appels de route :
 - `runConverter('downdoc', inputFile, outputFile, { conversionId, mode })`
 - Ceci entre `api/backend/services/modules/lazyload.module.js` qui :
 - valide les chemins (couche de coordination `INVALID_INPUT` en cas d'échec),
 - charge paresseusement le module `downdoc` (renvoie `CONVERTER_NOT_FOUND` ou `INTERNAL_ERROR` en cas d'échec de chargement),
 - exécute `moduleInstance.run(...)`,
 - **préserve le succès/échec standardisé `ConversionResult`** lorsque le résultat du module est déjà conforme, tout en fusionnant dans les journaux de chargement différé et en normalisant `warnings`/`meta`.
6. **Première création d'un résultat standardisé :** à l'intérieur du **module de conversion** `api/backend/services/modules/adoc-to-md.converter.js` :
 - En cas de succès, le module renvoie `createSuccessResult({...})` avec des champs standardisés complets (y compris `conversionId`, formats, blocs de fichiers, timing, `warnings`, `logs`, `meta`).
7. **Propagation vers le haut :** `lazyload.module.js` renvoie le `ConversionResult` standardisé inchangé (sauf fusionné `logs` + assurant `warnings` tableau + `meta` objet + ajout de l'héritage `duration` secondes).
8. **Post-traitement de l'itinéraire :** l'itinéraire lit `output.md` dans `markdown` et applique la validation de sortie au niveau de l'itinéraire (voir les points de risque ci-dessous). Si la validation réussit :
 - renvoie **200** `{ markdown, conversionResult: result }` où `result` est le succès standardisé `ConversionResult`.

#### Flux d'échecs (backend)

Les échecs peuvent être créés à trois couches distinctes ; tous doivent toujours produire un `ConversionResult` standardisé à la limite HTTP.

1. **Échec de la vérification préalable de l'itinéraire (`EMPTY_INPUT`) :**
 - Si `!text.trim()` → `buildToMarkdownFailure(...)` crée un échec standardisé.
 - Renvoyé sous la forme **400** avec le corps `{ ...failure, detail: failure.error.message }`.
2. **Coordination de Lazyload/échecs internes (échecs standardisés créés dans lazyload) :**
- Échec de validation du chemin → standardisé `INVALID_INPUT`.
 - Échec de chargement du module → standardisé `CONVERTER_NOT_FOUND` ou `INTERNAL_ERROR`.
 - Vérifications de format non prises en charge (lorsque `fromFormat`/`toFormat` sont fournis) → standardisé `UNSUPPORTED_FORMAT`.
 - Erreurs inattendues dans lazyload → standardisé `INTERNAL_ERROR`.
 - Ces échecs se propagent à la route via `result = await runConverter(...)`.
3. **Échecs du module convertisseur (échecs standardisés créés dans le module) :**
 - `adoc-to-md.converter.js` renvoie les échecs standardisés en utilisant son `createDowndocFailure(...)` interne pour les cas fondés tels que :
 - `CONVERSION_FAILED` (par exemple, sortie identique à l'entrée, la sortie contient AsciiDoc au lieu de Markdown),
 - `OUTPUT_NOT_CREATED` (problèmes d'écriture de sortie),
 - `INTERNAL_ERROR` (exceptions inattendues).
 - Lazyload préserve cet échec standardisé.
4. **Gestion de l'itinéraire de `result.success === false` :**
 - Journaux d'itinéraire `result.error.message` et renvoie **500** sous la forme `{ ...result, detail: errorMessage }` (standardisé au niveau racine `ConversionResult` plus `detail`).
5. **Échecs de validation de sortie au niveau de la route (échecs standardisés créés dans la route, dérivés d'un succès en aval) :**
 - Si la route lit `markdown` et trouve :
 - `markdown === processedText` → construit l'échec à partir du succès en utilisant `buildFailureFromSuccessfulResult(result, { code: 'CONVERSION_FAILED', details: { reason: 'OUTPUT_IS_INPUT' } })`.
 - "la sortie semble être une heuristique AsciiDoc" → similaire `CONVERSION_FAILED` avec `{ reason: 'OUTPUT_INVALID_FORMAT' }`.
 - Renvoyé sous la forme de **500** échec standardisé au niveau racine plus `detail`.
6. **Échecs de route fourre-tout :**
 - Si une exception se produit et que `result` a été un succès standardisé, la route la convertit en `INTERNAL_ERROR` standardisé via `buildFailureFromSuccessfulResult(...)` (étape : `route-postprocessing`).
 - Sinon, la route construit une base standardisée `INTERNAL_ERROR` via `buildToMarkdownFailure(...)` (étape : `route-internal`).

#### Point de création de résultat standardisé + propagation

- **Première création de succès standardisée :** `api/backend/services/modules/adoc-to-md.converter.js` (`createSuccessResult(...)`).
- **La première création d'échec standardisé :** peut survenir dans :
 - vérification préalable de l'itinéraire (`buildToMarkdownFailure` → `EMPTY_INPUT`),
 - coordination du chargement différé (`buildInternalFailure` → `INVALID_INPUT`/`UNSUPPORTED_FORMAT`/`CONVERTER_NOT_FOUND`/`INTERNAL_ERROR`),
 - module de conversion (`createDowndocFailure` → `CONVERSION_FAILED`/`OUTPUT_NOT_CREATED`/`INTERNAL_ERROR`).
- **Propagation vers le haut :** `lazyload.module.js` est la couche clé « préserver ou casser » ; il détecte explicitement les résultats standardisés et les renvoie avec `logs` fusionné + `warnings`/`meta` normalisés, puis la route les renvoie à HTTP (succès sous `conversionResult`, échec à la racine avec `detail`).

#### Points de risque de contrat backend fondés (étape 10)

- **Asymétrie de l'enveloppe à la limite HTTP :** le succès renvoie `{ markdown, conversionResult }` mais les échecs renvoient `ConversionResult` + `detail` au niveau racine. Toute ingestion frontend doit gérer les deux formes.
- **Échecs dérivés de l'itinéraire en cas de succès en aval :** `buildFailureFromSuccessfulResult(...)` doit préserver les champs racine requis ; c'est un endroit courant pour supprimer/remodeler accidentellement des champs (en particulier `outputFile`, `meta`, `warnings`, `logs`).
- **Heuristique au niveau de l'itinéraire pour « la sortie est AsciiDoc / la sortie est égale à l'entrée » :** correcte et fondée, mais basée sur le message/heuristique. Si les heuristiques dérivent, elles pourraient mal classer et produire un code d'échec qui entre en conflit avec la sémantique des couches plus profondes.
- **Lazyload repli vers la forme héritée :** si un module renvoie un objet hérité non standardisé, `lazyload.module.js` revient à une forme de retour héritée (`{ success, logs, error, duration }`) qui romprait le contrat à la limite de la route à moins qu'elle ne soit traitée. Pour l'étape 10, le module `downdoc` est migré et devrait rester standardisé, mais il s'agit toujours d'un risque fondé pour les modifications futures du module.

### Étape 10.3.3 — Points de risque du contrat backend + comportement cible (étape 10)

- **Nom du flux :** Entrée d'exécution de l'étape 10 — `AsciiDoc -> Markdown` via `POST /api/to-markdown`
- **Cible backend confirmée :** `api/backend/routes/conversion.routes.js` (`/to-markdown`)

#### Où les résultats standardisés peuvent être remodelés/supprimés/encapsulés/contournés

- **(Risque) Asymétrie de l'enveloppe de réponse HTTP au niveau de la route border**
 - Succès : `{ markdown, conversionResult: result }` (le résultat standardisé est *imbriqué* sous `conversionResult`)
 - Échec : `{ ...failureResult, detail }` (le résultat standardisé est *root-level* plus `detail`)
 - Risque : les consommateurs en aval peuvent « oublier » une forme et aplatir/ignorer les champs structurés.
- **(Risque) Échec dérivé de la route construit à partir d'un succès en aval**
- `buildFailureFromSuccessfulResult(result, ...)` convertit un succès standardisé en un échec standardisé.
 - Risque : perte accidentelle de champ (par exemple `outputFile`, `meta`, `warnings`, `logs`) ou dérive sémantique (changement de codes/messages/détails).
- **(Risque) Repli hérité de Lazyload path**
 - `lazyload.module.js` préserve les résultats standardisés *uniquement si* le résultat du module « semble standardisé » ; sinon, il renvoie une forme héritée (`{ success, logs, error, duration }`).
 - Risque : toute régression dans la forme de module `downdoc` pourrait provoquer une rupture de contrat silencieuse à `/api/to-markdown`.
- **(Risque) Erreurs internes de la couche de coordination produisant des résultats partiellement spécifiés**
 - Lazyload `buildInternalFailure(...)` et les blocs de capture de route créent des échecs standardisés ; le risque est des blocs incomplets/incorrects (tableaux/méta) ou des valeurs par défaut `error.code` incompatibles.
- **(Risque) Post-traitement/validation de sortie dans la route**
 - La route lit `output.md` et exécute des heuristiques (`OUTPUT_IS_INPUT`, `OUTPUT_INVALID_FORMAT`) qui peuvent remplacer un module « réussi » résultat.
 - Risque : mauvaise classification (heuristique faux positif) et utilisation incohérente du code d'erreur.

#### Points de sécurité (déjà alignés / faible risque)

- **(Sûr) Construction des résultats du module de conversion**
 - `api/backend/services/modules/adoc-to-md.converter.js` utilise des constructeurs centralisés (`createSuccessResult` / `createDowndocFailure`) et renvoie un `ConversionResult` standardisé entièrement formé.
- **(Sûr) Branche de préservation des résultats standardisés de Lazyload**
 - Lorsque le module renvoie un succès/échec standardisé, lazyload le préserve explicitement et seulement :
 - fusionne dans les journaux de lazyload,
 - normalise `warnings` à un tableau,
 - normalise `meta` à un objet,
 - ajoute un ancien champ `duration` (secondes) sans supprimer `durationMs`.

#### Comportement du backend cible (étape 10)

**Préservation du succès**
- La route doit renvoyer **200** avec :
 - `markdown: string` (non vide)
 - `conversionResult: ConversionResult` où :
 - `success === true`
 - `error === null`
 - tous les champs racine obligatoires existent (y compris `warnings: []`, `logs: []`, `meta: {}`)
- Ni la route ni lazyload ne peuvent reconstruire les « objets de réussite hérités » à la place du résultat standardisé.

**Préservation des échecs**
- La route doit renvoyer un échec standardisé **au niveau racine** `ConversionResult` en cas de non-OK, plus l'héritage `detail` :
 - `success === false`
 - `error` reste structuré et `error.code` reste stable/utilisable
 - les champs racine obligatoires restent présents (`warnings`, `logs`, `meta`, etc.)
- Si une couche aval a déjà produit une échec standardisé (module ou lazyload), la route doit **le conserver** et ajoutez uniquement `detail` (et ajoutez éventuellement des métadonnées d'itinéraire sécurisé).

**Erreurs de coordination internes**
- Les échecs de coordination Lazyload (validation du chemin, chargement de module, vérifications de format, exceptions inattendues) doivent toujours être convertis en échecs standardisés (`INVALID_INPUT`, `CONVERTER_NOT_FOUND`, `UNSUPPORTED_FORMAT`, `INTERNAL_ERROR`) et ne doivent pas apparaître comme des erreurs brutes émises à la limite HTTP.
- Les blocs de capture de route doivent convertir les exceptions inattendues en échecs standardisés `INTERNAL_ERROR`, préférant :
 - "dériver l'échec d'un succès connu" (`buildFailureFromSuccessfulResult`) lorsqu'un résultat de réussite existe déjà, sinon
 - "construire un nouvel échec" (`buildToMarkdownFailure`) avec un timing correct + blocs.

**Enrichissement acceptable**
- L'ajout/la fusion de journaux (journaux de chargement/d'exécution paresseux) est acceptable.
- L'ajout de clés `meta` au niveau de la route (par exemple `{ route: '/api/to-markdown', transport: 'in-memory', stage: ... }`) est acceptable **seulement si** il ne supprime/n'écrase pas les méta significatives fournies par le module.
- L'ajout de l'ancienne chaîne `detail` pour la compatibilité client est acceptable, mais elle ne doit pas remplacer les blocs structurés `error`.

**Remodelage inacceptable**
- Renvoi des formes héritées sans champs racine requis (par exemple, `{ success, error, logs, duration }` uniquement) à `/api/to-markdown`.
- Aplatissement des échecs structurés en une chaîne uniquement `error` ou suppression de `error.code`.
- Suppression des collections requises (`pipeline`, `warnings`, `logs`) ou `meta`.
- Écrasement d'un échec standardisé en aval par un nouvel échec ad hoc sans mappage de raison/code fondé.

### Étape 10.3.5 — Vérification et consolidation de la correction du backend/de l'orchestre (étape 10)

- **Vérification terminée :** Réexécution des vérifications HTTP e2e isolées pour `POST /api/to-markdown` ainsi que `lazyload.runConverter('downdoc', ...)` scripts de flux backend existants pour confirmer la préservation après l'étape 10.3.4 de correction de la couche de route.
- **Scripts utilisés :**
 - `api/backend/scripts/verify-e2e-to-markdown-output-boundary.js` (succès + échec HTTP frontière)
 - `api/backend/scripts/verify-e2e-to-markdown-failure-contract.js`
 - `api/backend/scripts/verify-e2e-to-markdown-representative-scenarios.js`
 - `api/backend/scripts/verify-backend-flow-adoc-to-md-internal-failure.js` (couche de coordination `INVALID_INPUT`)
 - `api/backend/scripts/verify-backend-flow-adoc-to-md-failure.js` et `verify-backend-flow-adoc-to-md.js` (downdoc standardisé succès/échec via lazyload)
- **Résultat :** Tous les contrôles ont été réussis ; aucune modification de code de suivi n'a été requise pour cette étape de consolidation.

### Étape 10.4.1 — Identifier la véritable cible d'alignement frontend/UI (étape 10)

- **Nom du flux :** Entrée d'exécution de l'étape 10 — wrapper hérité frontend `AsciiDoc -> Markdown` (`api/frontend/src/converters/asciidoc-to-markdown.ts`)
- **Objectif de cette étape :** identifiez la véritable cible frontend/UI où la sémantique de réussite/échec de l'étape 10 est consommée pour la première fois et où la préservation du contrat peut encore dériver.

#### Couches frontend/UI impliquées (contexte réel de l'étape 10)

- **Couche de conversion Wrapper (module d'entrée de l'étape 10) :**
 - `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown(...)`)
 - Appelle `POST /api/to-markdown`, consomme les charges utiles de réussite/échec du backend, crée des résultats standardisés locaux (`createSuccessResult`, `createFailureResult`) et pilote les paramétreurs d'UI (`setStatus`, `setOutput`, `setLoading`, `setNotification`, paramètres modaux facultatifs).
- **Couche d'état/de rendu de l'application (propriétaire global de l'UI) :**
 - `api/frontend/src/App.tsx` possède l'état/le rendu visible de l'UI (`status`, `output`, chargement, notifications, visibilité modale, etc.).
 - Il importe les symboles wrapper de `./converters`, mais dans le câblage d'exécution actuel, le chemin de conversion actif est `convertText(...)`.
- **Chemin de conversion général actif (limite de référence) :**
 - `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`) est actuellement invoqué par `App.tsx` pour les actions de conversion et reste le chemin de production actif pour `asciidoc -> markdown` à ce stade. étape.

#### Cible d'alignement frontend/UI choisie

- **Cible d'alignement frontend/UI de l'étape principale 10 :** `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown(...)`)

#### Pourquoi c'est le bon objectif

- **C'est l'étape 10 a sélectionné le flux d'exécution du package de transfert de l'étape 9** et donc l'unité de migration/alignement prévue pour ce cycle.
- **Il s'agit de la première limite de consommation pour la sémantique du contrat backend de l'étape 10 au sein de ce flux** (analyse de la réponse HTTP + construction des résultats de réussite/échec).
- **C'est là que le succès/l'échec peut encore être remodelé localement avant d'atteindre les paramètres d'état de l'UI**, ce qui en fait l'endroit le plus pertinent pour vérifier/préserver sémantique standardisée pour ce flux spécifique.
- **Remarque d'exécution actuelle :** ce wrapper n'est actuellement pas appelé par `App.tsx` (qui utilise `convertText(...)`), donc l'alignement du frontend à l'étape 10 reste intentionnellement limité à l'exactitude au niveau du wrapper avant toute décision de routage plus large de l'UI.

### Étape 10.4.2 — Carte de flux frontend/UI. (Étape 10 via la cible 10.4.1)

- **Nom du flux :** Entrée d'exécution de l'étape 10 — wrapper hérité du frontend `AsciiDoc -> Markdown` (`api/frontend/src/converters/asciidoc-to-markdown.ts`)
- **Cible frontend/UI confirmée :** `convertAsciiDocToMarkdown(...)` dans `api/frontend/src/converters/asciidoc-to-markdown.ts`

#### Flux de réussite (frontend/UI)

1. **Entrée wrapper :** `convertAsciiDocToMarkdown(text, setStatus, setOutput, setLoading, setNotification, [setShowErrorModal], [setErrorMessage])`.
2. **État de pré-tentative :** définit `status` sur "Conversion en cours..." et `loading=true`.
3. **Appel HTTP :** `fetch(${API_BASE}/api/to-markdown, { method: 'POST', body: { text } })`.
4. **Branche HTTP de succès (`res.ok`) :**
 - Analyse le corps JSON et définit `setOutput(data.markdown ?? "")`.
 - Lit `data.conversionResult` et le valide comme succès (`success === true`).
 - Crée un succès standardisé local avec `createSuccessResult(payload)` à partir des champs backend (`conversionId`, convertisseur, pipeline, formats, fichiers, timing, avertissements, journaux, méta).
5. **Achèvement de l'UI :** définit le statut/notification de réussite, renvoie le succès standardisé `ConversionResult` et `finally` définit `loading=false`.

#### Flux d'échec (frontend/UI)

1. **Échec de la pré-vérification du client :** si `!text.trim()`, renvoie `createFailureResult(...)` (`EMPTY_INPUT`) immédiatement.
2. ** Branche HTTP non OK (`!res.ok`) :**
 - Analyse le corps/texte de l'erreur backend.
 - Tente de consommer un échec backend standardisé (niveau racine ou enveloppe `conversionResult`).
 - Construit/renvoie `createFailureResult(...)`:
 - préfère les champs structurés backend lorsque présent,
 - remplit sinon une solution de secours standardisée minimale (`INTERNAL_ERROR` ou locale `OUTPUT_INVALID` pour une branche modale de validation de sortie mise à la terre).
 - Définit l'état/la notification d'erreur et le modal facultatif avant de revenir.
3. **Échecs de capture (timeout/réseau/générique) :**
 - Timeout (`AbortError`) => renvoie un échec standardisé `INTERNAL_ERROR` (détails du délai d'attente).
 - Erreurs réseau => renvoie un échec standardisé `INTERNAL_ERROR` (détails du réseau).
 - Generic catch => renvoie le `e.conversionResult` existant lorsqu'il est présent, sinon il est construit échec standardisé `INTERNAL_ERROR`.
4. **Toutes les branches d'échec** se terminent par `loading=false` dans `finally`.

#### Premier point de consommation front-end du résultat backend standardisé

- **Premier point de consommation :** à l'intérieur de `convertAsciiDocToMarkdown(...)` lors de l'analyse de la réponse backend :
 - **Succès :** `data.conversionResult` est lu et mappé en local `createSuccessResult(...)`.
 - **Échec :** la réponse non OK JSON est vérifiée pour une défaillance standardisée du backend (échec au niveau racine ou `conversionResult`) avant la construction de secours.

#### Propagation via l'état du frontend et l'UI

- **Dans la portée du wrapper :**
 - Le résultat standardisé est produit et renvoyé par la fonction wrapper (`Promise<ConversionResult>` sémantique).
 - Les effets secondaires de l'UI sont pilotés via des setters de rappel :
 - `setStatus(...)`
 - `setOutput(...)`
 - `setLoading(...)`
 - `setNotification(...)`
 - facultatif `setShowErrorModal(...)` / `setErrorMessage(...)`
- **Remarque globale d'exécution de l'UI :**
 - `App.tsx` exécute actuellement les conversions via `convertText(...)` (convertisseur générique), pas ce wrapper.
 - Par conséquent, la propagation des résultats du wrapper de l'étape 10 est actuellement un chemin de contrat au niveau du wrapper, pas encore le rendu actif à l'échelle de l'application. chemin.

#### Points de risque du contrat frontal fondé (étape 10)

- **Canaux de sortie doubles dans le wrapper :** le résultat du contrat est renvoyé, tandis que l'UI est également mise à jour via les setters. Si les futurs appelants ignorent le `ConversionResult` renvoyé, la sémantique peut toujours se dégrader vers un état d'UI piloté par message.
- **Pression de gestion de l'asymétrie de l'enveloppe :** le succès attend `data.conversionResult`, l'échec attend un échec standardisé au niveau racine (ou un repli imbriqué). Toute dérive de l'enveloppe du backend peut forcer une logique de repli et affaiblir la fidélité sémantique.
- **Branche modale heuristique :** la détection des échecs liés à la sortie repose toujours en partie sur la correspondance du texte du message ; si les messages dérivent, le comportement modal et le choix du code de secours local peuvent diverger du backend `error.code`.
- **Non câblé comme chemin d'exécution actif :** car `App.tsx` passe actuellement par `convertText(...)`, l'exactitude au niveau du wrapper ne garantit pas automatiquement la cohérence du rendu actif de l'UI jusqu'à ce que le routage soit intentionnellement aligné.

### Étape 10.4.3 — Points de risque du contrat frontend/UI + comportement cible (étape 10)

- **Nom du flux :** Étape 10 — wrapper hérité `AsciiDoc -> Markdown`
- **Cible frontend/UI confirmée :** `api/frontend/src/converters/asciidoc-to-markdown.ts` → `convertAsciiDocToMarkdown(...)`
- **Base :** Cette étape réutilise l'**étape 10.4.2** Carte de flux frontend/UI (branches succès/échec, premier point de consommation, propagation du setter). Cela ne change **pas** le code ; il définit le **risque** et le **comportement cible** avant la **étape 10.4.4** de remédiation.

#### Points de risque contractuel (lieux exacts et fondés + catégories de risque)

Chaque élément ci-dessous correspond à un ou plusieurs des éléments suivants : **aplatissement**, **remodelage hérité**, **ignorer partiellement**, **succès/erreur générique uniquement**, **erreur de chaîne uniquement**, **état obsolète**.

1. **Double canal : renvoyé `ConversionResult` par rapport à l'UI pilotée par un setter**
 - **Où :** `convertAsciiDocToMarkdown(...)` (fonction entière).
 - **Quoi :** le wrapper renvoie à la fois un objet standardisé et met à jour `setStatus` / `setOutput` / `setNotification` (et les setters modaux facultatifs).
 - **Catégories de risque :** **ignorer partiellement** (les appelants peuvent ignorer `ConversionResult`) ; **aplatissement** (l'UI peut refléter uniquement les chaînes de statut/notification) ; **remodelage hérité** (« modèle d'UI hérité » implicite = état de la chaîne + toast + sortie brute sans champs structurés).

2. **Le chemin de réussite peut définir la sortie avant la validation de `data.conversionResult`**
 - **Où :** après `res.ok` : `setOutput(data.markdown ?? "")` puis validation de `data.conversionResult`.
 - **Catégories de risque :** **état obsolète** / UI trompeuse (sortie brièvement visible avant l'échec de la validation) ; Risque de **succès générique** si l'utilisateur perçoit la « sortie apparue » comme un succès.

3. **Asymétrie d'enveloppe et d'analyse (succès vs échec)**
 - **Où :** le succès se lit `data.conversionResult` ; non-OK analyse l'échec au niveau racine ou le `conversionResult` imbriqué.
- **Catégories de risques :** **ignorance partielle** / **aplatissement** lorsque les chemins de secours utilisent `INTERNAL_ERROR` et perdent en amont `error.code` ; **erreur générique de chaîne uniquement** lorsque seul `detail`/texte apparaît dans les notifications.

4. **Branche modale heuristique pilotée par les sous-chaînes de message**
 - **Où :** `!res.ok` chemin : `errorMessageToCheck.includes(...)` pour les phrases AsciiDoc toujours présentes / de sortie inchangées.
 - **Catégories de risque :** **remodelage hérité** (modal + local `OUTPUT_INVALID` vs backend `error.code`) ; **aplatissement** (comportement piloté par le texte du message au lieu de `error.code`).

5. **Échecs et codes synthétiques créés par le client**
 - **Où :** vérification préalable (`EMPTY_INPUT`), délai d'attente/réseau/catch (`INTERNAL_ERROR`), quelques solutions de secours HTTP.
 - **Catégories de risque :** échecs de client **génériques** acceptables lorsqu'aucun corps backend n'existe ; **ignorer partiellement** si une défaillance du backend structuré est présente mais n'est pas analysée en premier.

6. **Aucune intégration avec `lastBackendConversionResult` / `conversionUiState` (état du contrat au niveau de l'application)**
 - **Où :** le wrapper est uniquement de rappel ; `App.tsx` n'invoque pas cette fonction pour la conversion aujourd'hui.
 - **Catégories de risque :** **ignorer partiellement** au niveau de l'application (le résultat structuré n'atteint jamais l'état du contrat global) ; **dérivation à double chemin** avec `convertText(...)`.

7. **Chemin de production actif par rapport au wrapper de l'étape 10**
 - **Où :** `generic-converter.ts` (`convertText(...)`) vs `asciidoc-to-markdown.ts`.
 - **Catégories de risque :** **les règles de remodelage** / **état périmé** peuvent différer (par exemple, compensation en premier lieu par le contrat, `setBackendConversionResult`) ; **La gestion générique des succès/erreurs** peut différer pour le même endpoint.

#### Points qui semblent déjà sûrs/protecteurs

- **R1 — Porte de réussite explicite :** Le chemin HTTP 200 nécessite `data.conversionResult` avec `success === true` avant le succès standardisé (`createSuccessResult`) ; ne traite pas HTTP 200 seul comme un succès.
- **R2 — Passthrough d'échec structuré :** un JSON non OK est interprété comme un échec standardisé lorsque `success === false` et `error` sont structurés ; les champs sont transmis dans `createFailureResult(payload)` lorsqu'ils sont présents.
- **R3 — Forme de retour harmonisée :** les branches renvoient des objets de réussite/échec standardisés (constructeurs locaux), et non un succès ponctuel uniquement.
- **R4 — Cycle de vie de chargement :** `setLoading(true)` pour la tentative ; `finally` efface toujours le chargement (indicateur de chargement cohérent pour ce wrapper).

#### Points qui nécessitent encore un travail d'alignement (avant/pendant 10.4.4)

- **A1 — Ordre des résultats avant validation** (point de risque 2) : éviter les résultats trompeurs/perception obsolète ; aligner sur le comportement cible ci-dessous.
- **A2 — Intégration de l'appelant :** `App.tsx` n'appelle pas ce wrapper ; la valeur de retour structurée ne circule pas dans `lastBackendConversionResult` / `conversionUiState` (points de risque 6 à 7).
- **A3 — Modal heuristique vs `error.code` :** préférez `error.code` pour le branchement lorsque le backend le fournit (point de risque 4).
- **A4 — Implémentation double :** `convertText(...)` vs wrapper pour `asciidoc -> markdown` doit être unifié ou explicitement documenté pour éviter les divergences (point de risque 7).

#### Comportement cible du frontend/UI (définition de l'étape 10 — base de 10.4.4)

##### Consommation et rendu réussis

 - **Doit** traiter la tentative comme réussie uniquement lorsque le backend fournit un succès standardisé `ConversionResult` (`success === true`, `error === null`) et les champs obligatoires sont présents.
- **Doit** utiliser le backend `conversionResult` comme source de vérité pour la sémantique du succès ; **ne doit pas** déduire le succès à partir de `markdown` seul.
- **Peut** dériver `setOutput` de `data.markdown` uniquement lorsque la sémantique de succès ci-dessus est satisfaite (ou réorganiser afin que la sortie ne soit définie qu'après validation—voir 10.4.4+ correction).
- **Peut** enrichir les étiquettes de l'UI à partir de `meta` / `warnings` pour l'affichage, sans supprimer ni remplacer les champs obligatoires.

##### Consommation et rendu des échecs

- **Doit** traiter HTTP non-OK comme un échec lorsque le backend renvoie un corps d'échec standardisé.
- **Doit** conserver les `error` et `error.code` structurés lorsqu'ils sont présents ; les codes synthétiques locaux ne sont destinés qu'aux vrais cas côté client ou non analysables.
- **Peut** afficher un modal pour des classes d'échec mises à la terre spécifiques, mais **doit** préférer `error.code` lorsqu'il est disponible à l'heuristique de message pour la classification et le branchement UX.

##### Inactif/chargement/succès/gestion de l'état d'erreur

- **Doit** conserver `loading` cohérent : `true` lors de la tentative, `false` en `finally`.
- **Devrait** aligner `conversionUiState` (inactif/chargement/succès/erreur) avec la vérité du backend lorsque ce wrapper est connecté à `App.tsx` (actuellement différé).
- **Ne doit pas** présenter le résultat d'une tentative précédente comme le succès de la tentative actuelle lorsque le backend signale un échec (risque de sortie obsolète lorsque la sortie est définie avant la validation – voir le point de risque 2).
- **Remarque :** ce wrapper à lui seul ne définit pas `conversionUiState` ou `lastBackendConversionResult` ; ce sont des problèmes **App** jusqu'à l'intégration – voir les éléments d'alignement A2/A4.

##### Interprétation/enrichissement acceptable

- **Acceptable :** fusionnant `meta` avec `{ uiWrapper: 'asciidoc-to-markdown', stage: ... }` pour la traçabilité.
- **Acceptable :** chaînes françaises destinées à l'utilisateur dans `setStatus` / `setNotification` tant que le `ConversionResult` renvoyé reste l'enregistrement structuré canonique.

##### Comportement inacceptable d'aplatissement, de remodelage et d'état obsolète

- **Inacceptable :** traiter HTTP 200 comme un succès si `conversionResult.success !== true`.
- **Inacceptable :** déduire le succès d'un `markdown` non vide lorsque `conversionResult` est manquant ou `success !== true`.
- **Inacceptable :** remplacement des échecs du backend structuré par des erreurs de chaîne uniquement lorsqu'un corps structuré est disponible (les notifications/statuts ne doivent pas devenir le seul support de la sémantique des échecs).
- **Inacceptable :** réduire les échecs structurés à un toast générique « d'erreur » sans conserver `error.code` / structuré `error` dans la valeur de retour canonique (et dans l'état de l'application une fois câblé).
- **Inacceptable :** ignorer le `ConversionResult` renvoyé chez les appelants de telle sorte que l'état de l'UI contredit la structure `success` / `error.code`.
- **Inacceptable :** laissant une sortie obsolète visible en cas d'échec d'une tentative lorsque le flux est intégré au panneau de résultats (voir points de risque 2 et A1).

#### Remarque sur la prochaine étape de correction

- La correction du runtime/UI pour l'étape 10 est enregistrée dans **Étape 10.4.4** (appliquée).

### Étape 10.4.4 — Correction du frontend/de l'UI (wrapper de l'étape 10, appliqué)

- **Module :** `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown`)
- **Résumé :** a aligné le wrapper de l'étape 10 avec le modèle de contrat d'abord utilisé dans `convertText` pour `/api/to-markdown` : effacer les indicateurs obsolètes au démarrage de la tentative ; donner la priorité aux échecs HTTP standardisés au niveau racine ; définir la sortie de démarque uniquement après que `conversionResult` ait validé le succès ; rappels facultatifs `setBackendConversionResult` / `setConversionUiState` ; cohérent `loading` + `error`/`success` État de l'UI lorsque ces rappels sont fournis.

### Étape 10.4.5 — Vérification et consolidation de la correction du frontend/UI (étape 10)

- **Vérification terminée :** Flux de wrapper de l'étape 10 (`api/frontend/src/converters/asciidoc-to-markdown.ts`) a été revérifié avec des tests ciblés et des contrôles de régression complets du frontend.
- **Contrôles ciblés ajoutés :** `api/frontend/src/converters/asciidoc-to-markdown.test.ts`
 - la branche réussie utilise le backend `conversionResult` comme source de vérité,
 - la branche non OK préserve les échecs structurés du backend, y compris `error.code`,
 - HTTP 200 sans `conversionResult` est traité comme un échec (pas de sortie de succès périmée).
- **Résultat de la consolidation :** la sémantique du contrat succès/échec et les transitions chargement/erreur/succès sont cohérentes pour ce wrapper ; aucun correctif de suivi n'a été requis au-delà de la correction localisée du wrapper de l'étape 10.4.4.

### Étape 10.5.1 — Étape 10 par rapport aux flux déjà validés (comparaison)

 - **Flux de l'étape 10 dans la portée :** wrapper existant frontend `AsciiDoc -> Markdown` (`api/frontend/src/converters/asciidoc-to-markdown.ts`) utilisant le backend `POST /api/to-markdown`.
- **Base de référence de comparaison validée :** flux et couches précédemment validés (AsciiDoc→Markdown chemin de contrat, Markdown→AsciiDoc, Text→Markdown et Step 8 HTML→*), y compris les constructeurs au niveau du convertisseur, la préservation du backend/orchestrateur et le contrat d'abord `convertText(...)` manipulation.

#### Construction des résultats du convertisseur

- **Cohérent**
 - La couche de convertisseur/module backend construit toujours des objets `ConversionResult` standardisés à l'aide de générateurs de réussite/échec centralisés.
 - Blocs structurels requis (`warnings`, `logs`, `meta`, structuré `error`) restent présents à travers le succès et l'échec.
- **Différent mais acceptable**
 - L'étape 10 valide spécifiquement le chemin de consommation/réémission au niveau du wrapper pour un flux backend déjà standardisé, plutôt que d'introduire une nouvelle migration de convertisseur.
- **Nécessite une attention ultérieure**
 - Aucun au niveau de la construction du convertisseur. pour cette étape ; Les travaux de l’étape 10 n’ont pas révélé de nouvelle lacune contractuelle au niveau du convertisseur.

#### Préservation du backend/orchestrateur

- **Cohérent**
 - Le succès standardisé est préservé jusqu'à l'enveloppe de succès HTTP (`{ markdown, conversionResult }`).
 - L'échec standardisé est préservé à la racine en cas de non-OK avec `error.code` structuré et compatibilité `detail`.
 - Échecs de coordination interne sont convertis en échecs structurés plutôt qu'en fuites de jets bruts.
- **Différent mais acceptable**
 - L'étape 10 nécessitait une petite garde/coercition de route locale pour les formes de bord de défaillance non standard, mais restait dans le même modèle de préservation utilisé par les flux validés.
- **Besoin d'une attention ultérieure**
 - L'asymétrie de l'enveloppe (succès imbriqué vs échec au niveau racine) reste connue caractéristique de flux croisés que les consommateurs doivent continuer à gérer explicitement.

#### Préservation du frontend/UI

- **Cohérent**
 - La sémantique axée sur le contrat est désormais appliquée dans le wrapper de l'étape 10 : le succès/l'échec `ConversionResult` détermine le résultat ; les échecs structurés sont préservés ; la sortie obsolète est effacée pour les nouvelles tentatives et les échecs.
 - Les rappels d'état facultatifs (`setBackendConversionResult`, `setConversionUiState`) permettent la parité avec le comportement de contrat d'abord déjà utilisé dans `convertText(...)`.
- **Différent mais acceptable**
 - La cible de l'étape 10 est un module wrapper hérité, tandis que le comportement d'exécution validé le plus actif est centralisé dans `convertText(...)`; cet alignement du wrapper étendu est acceptable pour un cycle de migration limité.
- **Nécessite une attention ultérieure**
 - Le câblage d'exécution achemine toujours les conversions d'applications via `convertText(...)` plutôt que via ce wrapper ; la consolidation/unification des points d'entrée AsciiDoc→Markdown dupliqués reste un sujet de nettoyage ultérieur.

#### Forme de gestion des erreurs

- **Cohérent**
- Les échecs structurés du backend sont préservés et `error.code` reste disponible pour le comportement de l'UI (y compris le branchement modal).
 - HTTP 200 sans succès valide `conversionResult` est traité comme un échec et non comme un succès par sortie.
- **Différent mais acceptable**
 - Le wrapper conserve la synthèse de secours localisée (`INTERNAL_ERROR`, `OUTPUT_INVALID`) pour les conditions non structurées/côtées transport ; cela correspond à un modèle validé antérieur où les solutions de secours sont utilisées uniquement lorsque l'échec structuré du backend n'est pas disponible.
- **Nécessite une attention ultérieure**
 - Des vérifications de messages heuristiques existent toujours pour une branche modale ; ils sont réduits/gardés par `error.code`, mais le branchement complet du code en premier reste une direction de durcissement futur.

#### Gestion de l'état (`idle/loading/success/error` + contrôle de l'état périmé)

- **Cohérent**
 - Le cycle de vie des tentatives est cohérent : le démarrage efface l'état transitoire et la sortie, définit le chargement ; les chemins du terminal définissent le succès/l'erreur lorsque le rappel est fourni ; `finally` efface le chargement.
 - La sortie de réussite obsolète ne reste pas comme sortie de tentative en cours sur les chemins d'échec.
- **Différent mais acceptable**
 - Ce wrapper ne possède pas directement les transitions d'état globales `idle` au niveau de l'application, à moins qu'elles ne soient câblées par les rappels de l'appelant ; ceci est acceptable pour une correction à l'échelle du wrapper.
- **Nécessite une attention ultérieure**
 - La parité complète au niveau de l'application dépend de si/quand ce wrapper est utilisé comme chemin d'exécution actif au lieu de (ou à côté) `convertText(...)`.

#### Style de vérification

- **Cohérent**
 - Utilise de petites vérifications ciblées ainsi que des contrôles de régression de base, correspondant au style de vérification de projet établi :
 - scripts de contrat e2e backend pour `/api/to-markdown`,
 - frontend vitest + typecheck,
 - tests de wrapper ciblés de l'étape 10 pour le comportement de réussite/échec/état.
- **Différent mais acceptable**
- L'étape 10 ajoute des tests spécifiques au wrapper (`asciidoc-to-markdown.test.ts`) car la portée de cette étape est la préservation du frontend au niveau du wrapper, et non une nouvelle famille de endpoints.
- **Nécessite une attention ultérieure**
 - Gardez les tests du wrapper synchronisés avec les règles contractuelles `convertText(...)` pour éviter toute dérive future entre les points d'entrée parallèles.

#### Comparaison consolidée résultat

- **Conforme aux flux validés :** la construction/préservation standardisée des résultats reste intacte dans le convertisseur, le backend/orchestrateur et la gestion frontend du wrapper de l'étape 10.
- **Différent mais acceptable :** L'étape 10 se concentre sur l'alignement et la vérification locaux du wrapper tandis que le routage de production actif reste centralisé dans `convertText(...)`.
- **Divergence notable par rapport track:** La gestion AsciiDoc → Markdown à double chemin (`convertText(...)` vs wrapper) est toujours la principale surface de dérive restante pour la consolidation future, mais ne constitue pas un bloqueur pour l'achèvement actuel de l'étape 10.

### Étape 10.5.2 — Étape 6 - Vérification de la conformité du Playbook (flux de l'étape 10)

- **Flux dans la portée :** Étape 10 wrapper d'entrée d'exécution `api/frontend/src/converters/asciidoc-to-markdown.ts` pour le backend `POST /api/to-markdown`.
- **Référence du playbook :** Critères de migration/liste de contrôle de l'étape 6 déjà utilisés pour les flux validés antérieurs.

#### Éléments du playbook clairement complétés

1. **Mappage du flux d'exécution** 
 - Terminé à l'étape 10.2.1 (entrée du runtime du wrapper, chemins de réussite/échec, comportement de lancement/retour, points de production de métadonnées).
2. **Mappage de la charge utile** 
 - Terminé à l'étape 10.2.2 (mapping champ par champ vers `createSuccessResult(payload)` / `createFailureResult(payload)`, avec classification directe/dérivable/par défaut/manquant).
3. **Intégration du chemin de réussite** 
 - Terminé à l'étape 10.2.3 (le chemin de réussite consomme le backend `conversionResult`, valide la sémantique de réussite, crée un résultat de réussite standardisé).
4. **Intégration du chemin de défaillance** 
 - Terminé à l'étape 10.2.4 (chemins de défaillance standardisés via `createFailureResult`, préservant les défaillances structurées du backend lorsqu'elles sont disponibles).
5. **Harmonisation des erreurs internes** 
 - Terminé à l'étape 10.2.5 (suppression des détours évitables ; sorties internes converties en échecs structurés).
6. **Vérification isolée** 
 - Terminé à l'étape 10.2.6 avec des scripts de vérification ciblés `/api/to-markdown` (succès nominal, échec fondé, petit ensemble de références).
7. **Alignement backend/orchestrateur** 
 - Terminé au cours des étapes 10.3.1 à 10.3.4 (cible identifiée/cartographiée/portée sur le risque/corrigée) et consolidé dans 10.3.5.
8. **Alignement frontend/UI** 
 - Terminé au cours des étapes 10.4.1 à 10.4.4 (cible identifiée/cartographiée/portée sur le risque/corrigée) et consolidé dans 10.4.5.
9. **Vérification des limites (le cas échéant)** 
 - Effectué via des vérifications des limites HTTP backend (`verify-e2e-to-markdown-output-boundary.js`) et des tests frontend axés sur le wrapper (`asciidoc-to-markdown.test.ts`) confirmant la sémantique du contrat aux limites d'intégration.

#### Achèvement plus léger mais acceptable

- **Profondeur de vérification des limites frontends :** 
 - Des tests axés sur le wrapper ont été ajoutés et des contrôles de régression complets du frontend ont été réussis, mais l'exécution de l'application active utilise actuellement `convertText(...)`.  
 - Ceci est acceptable pour l'étape 10 car la cible ciblée était explicitement le module wrapper de l'étape 10, et non la refonte du routage global.
- **Intégration du modèle d'état au niveau de l'application :** 
 - Le wrapper prend désormais en charge en option `setBackendConversionResult` / `setConversionUiState` pour la parité du contrat en premier, mais l'utilisation de ce wrapper au niveau de l'application n'est pas encore le chemin actif.  
 - Acceptable dans le cadre de l'étape 10 ; La consolidation plus large du chemin d'UI est différée.

#### Déviations fondées (documentées, non bloquantes)

1. **Les points d'entrée frontend à double chemin restent** 
 - `convertText(...)` reste la route de conversion active tandis que `convertAsciiDocToMarkdown(...)` est désormais aligné sur le contrat.  
 - Il s'agit d'une surface de divergence connue, documentée pour une consolidation ultérieure, mais pas un bloqueur de l'étape 10.
2. **L'asymétrie de l'enveloppe HTTP persiste à la limite du backend** 
 - Le succès renvoie `{ markdown, conversionResult }` ; échec renvoie un échec standardisé au niveau racine + `detail`.  
 - Ceci est cohérent avec le comportement validé actuel et explicitement géré dans la logique frontend ; il ne s'agit pas d'un échec de conformité.
3. **Branche heuristique résiduelle dans le comportement modal du wrapper** 
 - La détection basée sur les messages existe toujours comme solution de secours, désormais secondaire par rapport à `error.code` lorsqu'elle est disponible.  
 - Fondé et acceptable pour la portée actuelle ; une simplification complète du code d'abord peut être un renforcement futur.

#### Verdict global de conformité du playbook de l'étape 6 (étape 10)

- **Conformité globale :** **Oui** — L'étape 10 suit le playbook de migration de l'étape 6 avec tous les éléments de base requis terminés et vérifiés.
- **Statut d'écart :** uniquement limité, documenté, les écarts non bloquants subsistent (principalement la consolidation du point d'entrée du frontend et la gestion de l'asymétrie de l'enveloppe), tous deux déjà suivis pour les vagues ultérieures.

### Étape 10.5.3 — Observations d'exécution de l'étape 10 (surprises, frictions, écarts notables)

- **Portée révisée :** réutilisation de la ligne de base de la migration du convertisseur, alignement backend/orchestrateur et correction, alignement du wrapper frontend/UI, vérification et contrôles de consolidation pour l'étape 10.

#### Principales surprises/frictions constatées

1. **Réalité inattendue de l'exécution frontend par rapport au flux d'entrée prévu**
 - La cible d'exécution de l'étape 10 était l'ancien wrapper `asciidoc-to-markdown.ts`, mais les appels de conversion d'exécution d'application actifs sont toujours acheminés via `convertText(...)`.
 - Cela a créé une séparation pratique entre le « comportement du module aligné » et le « chemin d'UI actuellement actif », nécessitant un contrôle minutieux de la portée.

2. **Gestion à double chemin pour le même itinéraire de conversion (`/api/to-markdown`)**
 - `convertText(...)` et `convertAsciiDocToMarkdown(...)` transportent désormais une logique de contrat pour le même chemin.
 - Cela augmente la charge de traitement locale et le risque de dérive (transitions d'état, déclenchement modal, règles de sortie obsolètes, utilisation du rappel).

3. **L'asymétrie de l'enveloppe back-end reste un point de friction persistant**
 - Forme de réponse de réussite : `{ markdown, conversionResult }`
 - Forme de réponse d'échec : échec standardisé au niveau racine + `detail`
 - La logique frontend doit garder deux interprétations d'enveloppe synchronisées, ce qui ajoute une complexité d'analyse spécifique au chemin.

4. **Friction de forme d'erreur : `error.code` par rapport aux vérifications heuristiques des messages**
 - Même après avoir préservé les échecs structurés, une branche frontend utilise toujours l'heuristique de modèle de message pour le repli du comportement modal.
 - Ceci est réalisable mais plus fragile que le branchement purement piloté par le code.

5. **Pression de repli de la couche limite**
 - La route backend/lazyload nécessitait des garde-fous explicites contre les formes de bords non standardisées pour maintenir la sécurité du contrat de frontière HTTP.
 - Cela confirme que la préservation aux limites est toujours un risque actif même lorsque les composants internes du convertisseur/module sont déjà standardisés.

6. **Écart de vérification découvert et comblé au cours de l'étape 10**
 - La couverture précédente était forte sur les contrats de endpoint backend et le comportement du convertisseur générique, mais les tests directs au niveau du wrapper pour `asciidoc-to-markdown.ts` manquaient.
 - Un fichier de test de wrapper ciblé a été ajouté pour combler cette lacune et vérifier explicitement le comportement de la source de vérité.

#### Classification

##### Surprises acceptables spécifiques au flux

 - La cible du wrapper n'étant pas le chemin d'exécution de l'application actif actuel est acceptable pour ce cycle de migration limité, car l'étape 10 a explicitement défini l'alignement sur le module wrapper sélectionné.
- L'asymétrie de l'enveloppe est acceptable en tant que caractéristique de compatibilité connue, à condition que l'analyse reste explicite et testée.
- Repli synthétique local les échecs (`INTERNAL_ERROR`, etc.) ne sont acceptables que lorsque les échecs structurés du backend ne sont pas disponibles.

##### Candidats ultérieurs au raffinement du playbook

- **Candidat au raffinement 1 :** ajoutez un point de contrôle explicite de « vérification du câblage d'exécution active » au début de chaque cycle pour détecter lorsque les modules cibles sélectionnés ne constituent pas le chemin d'exécution actif de l'application.
- **Candidat au raffinement 2 :** inclut une règle standard pour éviter la duplication de la logique contractuelle pour le même endpoint entre les points d'entrée frontaux parallèles, sauf si un chevauchement temporaire est intentionnel. documenté.
- **Candidat de raffinement 3 :** renforce les conseils du frontend vers un comportement `error.code`-first avec des heuristiques de message uniquement comme solution de secours, et exige des tests pour cet ordre.
- **Candidat de raffinement 4 :** inclut une exigence par défaut pour un ensemble de tests direct au niveau du wrapper chaque fois qu'un wrapper (pas seulement des convertisseurs génériques) est la migration target.

##### Problèmes qui doivent rester documentés (non bloquants mais importants)

- La gestion du frontend à double chemin `AsciiDoc -> Markdown` (`convertText(...)` vs wrapper) reste la principale surface de dérive future.
- L'asymétrie de l'enveloppe de réussite/échec du backend doit rester explicite dans les documents/tests pour éviter les accidents aplatissement.
- L'alignement du contrat de l'étape 10 est vérifié et acceptable, mais la simplification complète à long terme dépend du travail ultérieur de consolidation du point d'entrée du frontend (en dehors de la portée de l'étape 10).

### Étape 10.5.4 — Validation du cycle de l'étape 10 et préparation à la clôture

- **Entrée de validation utilisée :** résultats de vérification isolés (10.2.6), vérification de la correction du backend/orchestrator (10.3.5), vérification de la correction du frontend/UI (10.4.5), comparaison de flux croisés (10.5.1), conformité du playbook (10.5.2) et observations d'exécution (10.5.3).

#### Ce qui est validé

- **Flow migré et standardisé :** Le flux de wrapper de l'étape 10 consomme et renvoie désormais une sémantique standardisée de réussite/échec `ConversionResult` avec les champs structurés requis.
- **La préservation du backend/de l'orchestrateur fonctionne :** `/api/to-markdown` le comportement des limites préserve la conversion standardisée des succès/échecs, structurée `error.code` et des échecs de coordination interne.
- **La préservation du frontend/de l'UI fonctionne (étape 10 target) :** `asciidoc-to-markdown.ts` traite désormais le succès/l'échec du backend `ConversionResult` comme source de vérité, préserve les données d'échec structurées et maintient la gestion cohérente de l'état de tentative.
- **Les vérifications pertinentes réussissent :** les scripts e2e backend et les exécutions de tests/vérifications de type frontend ont réussi pour les scénarios liés à l'étape 10, y compris les vérifications axées sur le wrapper ajoutées dans 10.4.5.
- **Aucun bloqueur majeur non résolu identifié :** aucun bloqueur fondé n'empêche la clôture de l'étape 10 dans le cadre de la cible d'exécution définie.

#### Ce qui reste acceptable mais non bloquant

- **Les deux points d'entrée frontend restent :** `convertText(...)` est toujours le chemin d'exécution de l'application actif tandis que le wrapper de l'étape 10 est maintenant aligné ; ceci est documenté et différé pour une consolidation ultérieure.
- **L'asymétrie de l'enveloppe persiste :** le succès reste enveloppé (`conversionResult`) tandis que l'échec est au niveau racine + `detail` ; ceci est connu, explicitement géré et testé.
- **Une branche de repli heuristique résiduelle existe :** Le repli modal basé sur les messages existe toujours sous une forme limitée, secondaire au `error.code` structuré lorsqu'il est disponible.

#### Décision de fermeture

- **Décision :** **Le cycle de l'étape 10 est suffisamment propre pour fermeture.**
- **Justification :** les points de contrôle de migration/alignement/vérification requis sont terminés et réussis ; les différences restantes sont documentées, acceptables et non bloquantes pour ce cycle.

### Étape 10.6.1 — Résumé de l'exécution de l'étape 10 (ce qui s'est réellement déroulé)

- **Flux exécuté :** L'étape 10 a exécuté le flux d'entrée de wrapper sélectionné `api/frontend/src/converters/asciidoc-to-markdown.ts` pour `AsciiDoc -> Markdown` (`POST /api/to-markdown`).

#### Travail au niveau du convertisseur

- La ligne de base du convertisseur déjà migrée réutilisée (module `downdoc`) et la construction standardisée confirmée `ConversionResult` sont restées intactes (succès + préservation de la forme d'échec à la limite module/sortie).

#### Backend/orchestrateur work

- Identifié et cartographié la véritable cible du backend (chemin `conversion.routes.js` `/to-markdown` + `lazyload.runConverter`).
- Application d'une correction de préservation localisée afin que la gestion au niveau de la route conserve une sémantique de succès/échec standardisée, préserve la structure `error`/`error.code` et évite une rupture de contrat évitable aux limites des limites.
- Comportement du contrat back-end revérifié grâce à des contrôles de endpoints isolés et de niveau de flux.

#### Travail du frontend/UI

- Identifié et mappé le wrapper cible du frontend de l'étape 10 (`convertAsciiDocToMarkdown(...)`).
- Appliqué une correction localisée du wrapper afin que le backend `ConversionResult` soit la source de vérité pour la gestion des succès/échecs, les échecs structurés sont préservés, la sortie/l'état obsolète est effacé par tentative et facultatif `conversionUiState`/backend-result rappels sont pris en charge.
- Comportement consolidé avec des tests de wrapper ciblés.

#### Travaux de vérification et de consolidation

- Exécution d'une vérification isolée pour `/api/to-markdown` (succès nominal, échec fondé, ensemble de références représentatifs).
- Exécution de la préservation du backend/orchestrator vérifications, vérifications axées sur le wrapper frontend, ainsi que régression frontend (`vitest`) et vérification de type (`tsc --noEmit`).
- Comparaison de flux croisés enregistrée, vérification de conformité du playbook et observations d'exécution.

#### Ce que l'étape 10 a confirmé

- Le flux Step 10 préserve les contrats de bout en bout au sein de sa cible : la sortie du convertisseur standardisée, la préservation du backend/orchestrateur, la préservation du wrapper frontend et le comportement cohérent de l'état de tentative sont tous vérifiés.
- Le playbook de l'étape 6 reste applicable et efficace pour ce cycle, avec uniquement des écarts non bloquants documentés.

#### Ce qui reste en dehors de la portée de l'étape 10

- Large consolidation du routage d'exécution du frontend (active `convertText(...)` l'unification du chemin par rapport au chemin du wrapper) est différée.
- La refonte globale de l'UI ou le travail plus large de refactorisation des flux croisés est hors de portée.
- Les éléments du cycle futur (synthèse post-étape 10/expansion de la ligne de base au-delà de ce cycle) ne sont pas démarrés ici.

### Étape 10.6.2 — Mise à jour de la ligne de base multi-flux (référence validée L'ensemble comprend l'étape 10)

#### Ensemble de référence validé (élargi)

La ligne de base multi-flux validée inclut désormais explicitement l'**Étape 10** comme **unité d'exécution validée** supplémentaire pour le chemin **`AsciiDoc -> Markdown`** :

- **Route backend (endpoint inchangé) :** `POST /api/to-markdown` (downdoc via Lazy Loader) — déjà fait partie de la ligne de base en tant que **premier flux migré**.
- **Ajout de l'étape 10 (nouvelle surface d'alignement) :** le **wrapper frontend hérité** `api/frontend/src/converters/asciidoc-to-markdown.ts` (`convertAsciiDocToMarkdown(...)`) est désormais **aligné sur le contrat, vérifié et accepté** dans le cadre de l'ensemble de référence pour cet itinéraire.

En d'autres termes, la ligne de base s'étend de « endpoint + générique ». `convertText(...)` gestion du contrat d'abord » pour inclure également un modèle de préservation de contrat **direct, au niveau du wrapper** pour le même itinéraire, sans introduire de nouveau endpoint de conversion backend.

#### Ce qui reste commun dans les flux validés

- **Sémantique `ConversionResult` standardisée** sur le succès et l'échec, y compris `error` structurée / `error.code` le cas échéant, plus les champs racine requis (avertissements/journaux/métacollections).
- **Préservation des limites d'abord :** les réponses HTTP du backend et les chemins d'ingestion principaux du frontend préservent la sémantique standardisée plutôt que de s'aplatir dans des modèles hérités ad hoc comme source de vérité.
- **Posture de vérification reproductible :** contrôles de réussite/échec du contrat, scénarios représentatifs/de référence le cas échéant et ciblés tests pour le comportement du contrat d'abord (y compris les tests au niveau du wrapper pour l'étape 10).

#### Ce qui reste spécifique au chemin mais acceptable

- **Topologie frontend :** L'étape 10 valide un **module wrapper autonome** tandis que le routage de production peut toujours utiliser `convertText(...)` pour le même endpoint — le chevauchement est documenté et acceptable pour ce cycle.
- **Asymétrie d'enveloppe :** le succès peut imbriquer `conversionResult` tandis que l'échec peut être au niveau racine + `detail` — géré explicitement par flux.
- **Heuristiques résiduelles :** des solutions de secours limitées basées sur les messages peuvent rester là où les codes structurés ne sont pas disponibles — acceptables lorsqu'ils sont secondaires à `error.code`.

#### Ce que cela améliore pour l'avenir confiance en la migration

- Démontre que le playbook de l'étape 6 s'applique aux **vagues ciblées sur le wrapper** (pas seulement les nouveaux endpoints ou uniquement les `convertText(...)` modifications).
- Réduit l'ambiguïté lorsque le transfert nomme un **module hérité** comme entrée d'exécution : la ligne de base inclut désormais un exemple complet d'alignement et de vérification au niveau du wrapper.
- Rend la dérive future plus facile à détecter : **même itinéraire, deux surfaces frontends** est un point de comparaison explicite et documenté.

### Étape 10 Définition de Terminé

L'étape 10 est terminée uniquement si tous les critères ci-dessous sont vrais :

- Le flux d'entrée a été confirmé.
- La portée a été gelée.
- Le flux d'exécution a été mappé.
- Le mappage de la charge utile de l'assistant a été documenté.
- L'intégration du chemin de réussite a été terminée.
- L'intégration du chemin d'échec a été terminée.
- Erreur interne l'harmonisation a été terminée.
- La vérification isolée a été réussie.
- L'alignement du backend/de l'orchestrateur a été terminé.
- La vérification du backend/de l'orchestrateur a été réussie.
- L'alignement du frontend/de l'UI a été terminé.
- La vérification du frontend/de l'UI a été réussie.
- La comparaison de flux croisés a été terminée.
- La conformité du Playbook a été vérifié.
- Les observations d'exécution ont été documentées.
- Le cycle a été validé comme étant suffisamment propre pour être clôturé.
- La ligne de base multi-flux a été mise à jour.

#### Ce que l'étape 10 ne nécessite pas

- Toute refactorisation ou refonte de base au-delà des mises à jour localisées de préservation des contrats de l'étape 10.
- Tout nouveau travail de migration en dehors du flux de l'étape 10 et de ses points de contrôle de vérification/alignement requis.
- Démarrage des travaux de suivi après l'étape 10 (y compris l'étape 11).

### Clôture de l'étape 10

L'étape 10 a exécuté un flux réel supplémentaire : `AsciiDoc -> Markdown` à `POST /api/to-markdown`, avec le flux d'entrée de wrapper sélectionné `convertAsciiDocToMarkdown(...)` comme surface d'exécution définie.

L'étape 10 a permis d'achever le contrat en préservant ce flux : la migration du convertisseur a été terminée, l'alignement backend/orchestrateur a été terminé, l'alignement frontend/UI a été terminé et le flux a été vérifié et accepté pour fermeture.

Résultat concret de l'ensemble validé : la ligne de base multi-flux a été à nouveau étendue pour inclure cette unité d'exécution de l'étape 10 en tant que référence validée pour l'alignement au niveau du wrapper sur une route déjà migrée.

Confirmation de la méthode : l'étape 10 confirme la La méthode de migration/alignement reste efficace pour les vagues ciblées et contractuelles à travers la sortie du convertisseur, la préservation des limites du back-end et la gestion de l'ingestion/de l'état du front-end, avec une vérification à chaque couche.

Ce qui reste en dehors de la portée de l'étape 10 : les migrations de flux restantes, le travail de refonte/refactorisation à grande échelle et tout travail d'exécution de l'étape 11.

L'étape 10 ne signifie pas que tous les flux restants sont migrés, ne signifie pas une refonte à grande échelle. le travail est terminé et ne signifie pas que l'étape 11 a déjà commencé.

Note de transition : les travaux ultérieurs peuvent commencer à partir de cette ligne de base validée élargie en tant que phase distincte, sans rouvrir la portée de l'étape 10.

### Étape 11.1.1 — Réévaluation des candidats après l'étape 10 (restant non migrés Flux)

#### Contexte et apports

Cette réévaluation réutilise l'inventaire des candidats de l'étape 6 et les classifications précédentes (étapes 6.1.1 à 6.1.2, étapes 9.1.1 à 9.1.2) et intègre les preuves d'exécution de l'**étape 10** : un alignement `AsciiDoc -> Markdown` **ciblé sur le wrapper** sur `POST /api/to-markdown` (`api/frontend/src/converters/asciidoc-to-markdown.ts`), élargissant la référence multi-flux validée (voir étape 10.6.2).

#### Flux de candidats non migrés restants (de l'inventaire de l'étape 6, mis à jour)

Après l'exécution de l'étape 10, les candidats bloqués restants sont :

- **Famille multi-format générique :** `POST /api/convert` (conversions sécurisées pour les formats non spécialisés paires).
- **Module wrapper existant du frontend :** `api/frontend/src/converters/markdown-to-asciidoc.ts` (deuxième module de l'ordre d'exécution de l'étape 9.2.1 ; pas encore exécuté).

`api/frontend/src/converters/asciidoc-to-markdown.ts` n'est **plus un candidat à la migration restant** pour cette tranche d'inventaire : il a été exécuté et accepté à l'étape 10.

#### Mise à jour de l'état de préparation/observations prioritaires (plus fort / plus faible / inchangé)

##### Famille multiformat générique (`POST /api/convert`)

- **Signal :** **plus fort** (confiance de planification), **inchangé** (surface élevée / risque pratique élevé).  
- **Ce qui est devenu plus fort après l'étape 10 :** la méthode est désormais validée sur une forme réelle supplémentaire : **un alignement de contrat au niveau du wrapper** sur le même itinéraire qu'un flux backend déjà migré, avec une documentation explicite à double surface frontend. Cela augmente la confiance dans le fait que les vagues futures peuvent être ciblées de manière étroite sans supposer un seul point d’entrée d’ingestion.  
- **Ce qui reste le même :** `/api/convert` reste une **grande famille multi-paires et protégée par jetons** ; L'étape 10 ne réduit pas son couplage inhérent ni sa largeur.  
- **Mise à jour de la priorité/de l'état de préparation :** **inchangé** en principe (toujours « reporter jusqu'à une stratégie de sous-tranche délimitée »), avec une confiance de planification **légèrement plus élevée** pour une exécution éventuelle.

##### Wrapper existant frontend (`markdown-to-asciidoc.ts`)

- **Signal :** **plus fort** (préparation à court terme et clarté d'exécution).  
- **Ce qui est devenu plus fort après l'étape 10 :** L'étape 10 est un **précédent** terminé pour la même classe de travail (emballage isolé, succès/échec du contrat d'abord, préservation des limites du backend, tests ciblés). Le **deuxième** module du transfert de l'étape 9 est désormais la prochaine unité délimitée évidente.
- **Mise à jour de priorité/préparation :** **doit être mise à jour** — traiter comme le **prochain suivi limité prioritaire** dans la piste de wrapper héritée (supérieure à un compartiment de « paire de wrapper » indifférencié).

#### Ce que l'étape 10 implique pour l'ensemble restant (méthode)

- **Les ondes ciblées sur le wrapper** sont ancrées et des migrations reproductibles, pas seulement centrées sur `convertText(...)` ou axées sur l'itinéraire.  
- **Les surfaces frontends doubles** pour un itinéraire sont acceptables lorsqu'elles sont documentées et vérifiées ; les futurs candidats doivent assumer des points de comparaison explicites.

#### Notes sur le mouvement (résumé)

- **Plus fort :** `POST /api/convert` (confiance uniquement), `markdown-to-asciidoc.ts` (préparation + priorité pour le prochain travail de wrapper délimité).  
- **Plus faible :** aucun parmi les candidats restants sur la liste.  
- **Inchangé :** `/api/convert` profil de risque et position de « reporter la famille élargie » ; Le risque de migration `markdown-to-asciidoc.ts` reste faible à moyen par rapport au risque `/api/convert`.  

#### Limite de la sous-étape suivante

Cette étape ne sélectionne **pas** la prochaine vague de migration ni n'ouvre l'étape 11.1.3.

### Étape 11.1.2 — Classification des candidats mise à jour (état de préparation/risque/valeur de migration)

Cette sous-étape met à jour la précédente classification des candidats restants (étape 9.1.2), en utilisant la liste restante réévaluée de l'étape 11.1.1 et les preuves d'exécution de l'étape 10.

#### Candidats restants (liste réutilisée)

- Famille multiformat générique : `POST /api/convert`
- Module wrapper existant frontend : `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Tableau de classification mis à jour

| Chemin de conversion des candidats | Préparation mise à jour | Risque de migration mis à jour | Valeur de migration mise à jour | Mouvement par rapport à la classification précédente | Justification brève et fondée |
|---|---:|---:|---:|---|---|
| Famille multiformat générique (`POST /api/convert`) | Moyen | Élevé | Élevé (stratégique), moyen (à court terme) | Stable (confiance en hausse) | L'étape 10 ajoute des preuves d'exécution au niveau du wrapper et renforce la confiance de la méthode, mais `/api/convert` reste une famille multi-paires à haute surface, protégée par des jetons, avec un risque et un couplage pratiques substantiels. |
| Wrapper hérité du frontend (`api/frontend/src/converters/markdown-to-asciidoc.ts`) | Moyen-Haut | Faible-Moyen | Moyen-élevé (à court terme), moyen (stratégique) | Déplacé vers le haut | L'étape 10 a complété le même modèle de suivi de wrapper de bout en bout dans la direction opposée, réduisant ainsi l'ambiguïté et augmentant la préparation/priorité à court terme pour ce candidat wrapper restant. |

#### Notes sur le mouvement (haut/bas/stable)

- **Déplacé vers le haut :** `api/frontend/src/converters/markdown-to-asciidoc.ts` (l'état de préparation et la valeur de migration à court terme ont augmenté après l'étape 10 précédente).
- **Déplacé vers le bas :** aucun.
- **Stable :** `POST /api/convert` (bandes de classification reste le même ; la confiance en matière de planification a augmenté mais le profil de risque/complexité est inchangé).

#### Limite d'étape

Cette étape met à jour uniquement la classification et ne démarre **pas** l'étape 11.2.3.

### Étape 11.1.3 — Prochain objectif de migration réaliste/sélection de petites vagues (après l'étape 10) Réévaluation)

Cette sous-étape sélectionne la prochaine cible de migration réaliste à l'aide des candidats restants réévalués (étape 11.1.1) et de la classification mise à jour (étape 11.1.2).

#### Candidats restants considérés

- Famille multiformat générique : `POST /api/convert` (État de préparation : moyen, risque : élevé, valeur : stratégique élevé / moyen à court terme).
- Module wrapper existant frontend : `api/frontend/src/converters/markdown-to-asciidoc.ts` (état de préparation : moyen-élevé, risque : faible-moyen, valeur : moyen-élevé à court terme).

#### Sélection

- **Cible suivante sélectionnée (unité délimitée la plus forte) :** `api/frontend/src/converters/markdown-to-asciidoc.ts`.

#### Pourquoi il s'agit désormais du meilleur prochain choix

- **Meilleur profil de préparation au risque parmi les candidats restants :** après l'étape 10, `markdown-to-asciidoc.ts` est le candidat restant le plus préparé et le plus à faible risque.
- **Précédent direct de l'étape 10 :** L'étape 10 a déjà validé le même modèle d'exécution wrapper-track de bout en bout à l'opposé direction, réduisant l'ambiguïté concernant la portée, les attentes en matière de comportement et la posture de vérification.
- **Maintient une discipline de migration limitée :** la sélection d'une cible wrapper préserve le modèle de petites vagues et évite une expansion prématurée dans la large famille `/api/convert`.
- **Valeur pratique immédiate :** il ferme la contrepartie wrapper restante et réduit la dérive du double wrapper tout en préservant le contrat d'abord sémantique.

#### Ce qui reste différé

- **Différé :** Famille multiformat générique `POST /api/convert` en tant que large vague familiale.
- **Justification :** malgré une plus grande confiance en matière de planification, elle reste à haut niveau de surface et à haut risque ; elle ne doit être ouverte que comme une stratégie de sous-tranche délimitée séparément, et non comme une vague suivante large.

#### Limite d'étape

Cette étape sélectionne uniquement la cible suivante et ne démarre **pas** l'étape 11.2.3.

### Étape 11.2.1 — Stratégie d'exécution pour la prochaine cible sélectionnée/petite Wave

#### Cible/vague sélectionnée (à partir de l'étape 11.1.3)

- **Unité délimitée unique :** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) pour **Markdown → AsciiDoc** via **`POST /api/to-asciidoc`** (itinéraire soutenu par Pandoc, par module documentation).

#### Strictement un flux à la fois

- **Oui.** Traitez cela comme **une unité d'exécution de wrapper** de bout en bout (wrapper + son contrat de route backend + vérification), reflétant la discipline du wrapper de l'étape 10. Ne pas paralléliser des surfaces de migration supplémentaires dans la même vague.

#### Ordre d'exécution pratique

1. **Confirmer la surface de saisie :** `convertMarkdownToAsciiDoc(...)` dans `markdown-to-asciidoc.ts` (chemins de réussite/échec, champs de sortie hérités, comportement de chargement/notification).
2. **Mappez le runtime au backend :** `POST /api/to-asciidoc` limite d'orchestration et de convertisseur (même modèle en couches que l'étape 10 : module → route → HTTP).
3. **Aligner la sémantique du contrat :** succès et échec `ConversionResult` gestion, harmonisation des erreurs internes et comportement de sortie/état obsolète cohérent avec le modèle de wrapper validé.
4. **Vérifier :** vérifications d'itinéraires isolés + tests axés sur le wrapper + non-régression (`npm test`, `npm run typecheck`) selon le cas applicable à cette cible.

#### Flux d'entrée (dans le champ d'application)

- **Flux d'entrée :** `convertMarkdownToAsciiDoc(...)` → `POST /api/to-asciidoc`.

#### Ce qui reste différé jusqu'à ce que les résultats d'exécution antérieurs soient validés

- **Différé :** Famille multiformat générique `POST /api/convert` (famille large ; reste hors de portée jusqu'à ce qu'une stratégie de sous-tranche délimitée séparément).
- **Différé :** Toute cible de migration supplémentaire au-delà de cette vague de wrapper unique. (y compris l'extension de la portée au nettoyage de « tous les anciens points d'entrée » en un seul passage).
- **Différé :** Large refonte du frontend/de l'UI sans rapport avec l'alignement du contrat du wrapper délimité.

#### Pourquoi cette commande est la plus sûre et la plus pratique

- **La plus petite unité comparable :** un wrapper + une route dédiée correspond au modèle éprouvé de l'étape 10 et maintient la restauration et vérification traitable.
- **Précédent clair :** L'étape 10 a déjà établi des attentes en matière d'alignement du contrat en premier au niveau du wrapper et de posture de vérification sur la direction appariée.
- **Évite les risques de surface élevés :** il n'ouvre pas `/api/convert` tout en réduisant la dérive réelle du wrapper existant restant.

#### Limite de marche

Cette étape définit uniquement la stratégie d'exécution et ne démarre **pas** l'étape 11.3.1.

### Étape 11.2.2 — Gel du périmètre + conditions d'entrée (prochain cycle de migration)

#### Cible / vague sélectionnée (réutilisée)

- **Unité délimitée unique :** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) pour **Markdown → AsciiDoc** via **`POST /api/to-asciidoc`**, exécuté en utilisant l'ordre et la superposition décrits à l'**Étape 11.2.1**.

#### Dans la portée (doit rester délimité)

- **Alignement du wrapper :** gestion des succès/échecs en premier lieu du contrat pour `convertMarkdownToAsciiDoc(...)` (y compris le comportement de sortie/état obsolète et la préservation structurée `error`/`error.code` le cas échéant), conformément au modèle de wrapper validé de l'étape 10.
- **Préservation des limites backend/orchestrateur (localisée) :** seuls les ajustements minimaux de route/orchestrateur/convertisseur sont nécessaires afin que `POST /api/to-asciidoc` préserve la sémantique `ConversionResult` standardisée à la limite HTTP (reflétant la posture « préserver, ne pas reconcevoir » de l'étape 10).
- **Vérification :** contrôles isolés pour cette route + tests axés sur le wrapper + non-régression (`npm test`, `npm run typecheck`) selon ce qui est applicable à cette cible.
- **Documentation :** enregistrez les résultats, les risques, les preuves de vérification et toutes les notes explicites à double surface (wrapper vs `convertText(...)`) pour ce cycle.

#### Hors de portée (ne fait explicitement pas partie de ce cycle)

- **Refonte étendue du backend** (nouveaux endpoints sans rapport avec ce flux, grands refactors d'orchestrateur, unification de l'enveloppe cross-route).
- **Famille multi-format générique** `POST /api/convert` (toute migration large « toutes paires »).
- **Refonte large du frontend/de l'UI** (mise en page, modifications majeures du modèle d'état, composants non liés) au-delà de ce qui est strictement requis pour l'alignement du contrat du wrapper délimité.
- **Projets de consolidation des points d'entrée** (par exemple, imposer une stratégie de routage front-end unique dans l'application) au-delà de la documentation du chevauchement.

#### Différé (ne doit pas être retiré)

- **`POST /api/convert`** jusqu'à ce qu'une stratégie de sous-tranche délimitée séparément existe.
- **Toute cible de migration supplémentaire** au-delà de ce wrapper unique + sa limite `POST /api/to-asciidoc`.
- **Synthèse de suivi/planification du cycle suivant** au-delà de la documentation des bloqueurs (ne pas commencer l'étape 11.3.2 

#### Conditions Go / No-Go (doivent être remplies avant le début de l'exécution)

- **Go**
 - La ligne de base multi-flux validée reste verte : `npm test` et `npm run typecheck` réussissent.
 - Le chemin d'ingestion principal du contrat en premier dans `convertText(...)` reste intact et non régressé pour les flux déjà validés.
 - Le module wrapper cible existe et est identifiable comme une surface d'entrée isolée (les modifications localisées sont réalisables sans réécritures larges de l'UI).
 - Le précédent wrapper de l'étape 10 reste disponible en tant que modèle d'exécution comparable (même classe de playbook).

- **No-Go**
 - Les tests de base échouent déjà avant les modifications (non plancher de non-régression digne de confiance).
 - Un alignement sûr nécessiterait une expansion **illimitée** de la surface du backend ou une refonte **globale** de la forme de réponse (viole la posture de préservation de ce cycle).
 - Un alignement sûr nécessiterait une refonte **large** de l'UI/de l'état sans rapport avec ce wrapper (violation de la portée).

#### Règle de non-expansion pendant exécution

- La portée ne doit pas s'étendre au-delà de **`markdown-to-asciidoc.ts`**, les **`POST /api/to-asciidoc`** travaux de préservation des limites strictement requis pour la sémantique du contrat et les tests/documents **minimaux**, à moins qu'un problème **fondé et bloquant** ne soit découvert qui rend l'achèvement en toute sécurité impossible dans cette portée. Dans ce cas : **documentez le bloqueur et arrêtez** plutôt que d'élargir la vague.

#### Pourquoi ce gel de la portée maintient le cycle suivant sous contrôle

- Il préserve la **comparabilité** avec l'étape 10 (un wrapper + une route dédiée + vérification en couches).
- Il empêche l'expansion prématurée des **hautes surfaces** (`/api/convert`) tout en s'attaquant au dernier point de dérive du wrapper hérité.
- Il maintient la restauration possible en limitant les surfaces touchées et en exigeant des portes explicites avant l'exécution.

#### Limite de l'étape

Cette étape gèle uniquement la portée et les conditions d'entrée et ne démarre **pas**r l'étape 11.3.2.

### Étape 11.2.3 — Package de transfert prêt à exécuter (prochain cycle de migration)

Cette section constitue la référence de transfert d'exécution pour le cycle suivant. Il consolide la cible sélectionnée, la stratégie, le gel de la portée, les portes de préparation et les attentes minimales de vérification sans rouvrir les décisions antérieures.

#### Cible/vague sélectionnée

- **Cible délimitée unique :** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) pour **Markdown -> AsciiDoc** via `POST /api/to-asciidoc`.

#### Flux d'entrée

- **Flux d'entrée d'exécution :** `convertMarkdownToAsciiDoc(...)` -> `POST /api/to-asciidoc`.

#### Ordre d'exécution (strict)

1. Confirmer le comportement d'entrée du wrapper (`success`, `failure`, chargement/notification, points de risque d'état obsolète).
2. Cartographiez et alignez la limite route/orchestre/convertisseur pour `POST /api/to-asciidoc` selon les règles de préservation du contrat.
3. Appliquer un alignement limité du contrat succès/échec/erreur interne pour ce flux uniquement.
4. Exécutez les portes de vérification requises avant d’envisager une extension de la portée.

#### Éléments concernés (minimum)

- Alignement localisé du wrapper pour la sémantique `ConversionResult` du contrat d'abord.
- Préservation localisée des limites du backend/orchestrateur pour `POST /api/to-asciidoc` (préserver, ne pas reconcevoir).
- Tests et documents minimaux nécessaires pour vérifier et enregistrer cela cycle.

#### Éléments différés (doivent rester différés)

- Famille multiformat générique `POST /api/convert` jusqu'à ce qu'un plan de sous-tranche délimité séparément existe.
- Toutes les cibles de migration au-delà de cette seule paire wrapper + route.
- Large refonte frontend/backend et consolidation du point d'entrée à l'échelle de l'application. 

#### Conditions de préparation requises (avant le début de l'exécution)

- La ligne de base reste verte (`npm test`, `npm run typecheck`).
- `convertText(...)` le comportement de contrat d'abord pour les flux déjà validés reste intact.
- Le wrapper cible reste suffisamment isolé pour des flux localisés. changements.
- Aucun bloqueur fondé ne nécessite un backend illimité ou une refonte complète de l'UI.

#### Attentes de vérification requises (minimum)

- Vérifications isolées au niveau de la route pour `POST /api/to-asciidoc` comportement de réussite/échec/erreur interne.
- Vérifications axées sur le wrapper prouvant le contrat en premier. manipulation et protection contre les états obsolètes.
- Porte de non-régression : réexécutez `npm test` et `npm run typecheck` après l'alignement.
- Documenter explicitement toutes les différences spécifiques au flux acceptées.

#### Point de départ de l'exécution pour les travaux futurs

L'exécution future devrait commencer à partir de ce package comme référence fixe pour le cycle suivant ; si un bloqueur bloqué apparaît, documentez-le et arrêtez-le plutôt que d'élargir la portée.

#### Limite de l'étape

Cette étape fournit uniquement le package de transfert et ne démarre **pas** l'étape 11.3.1.

### Étape 11.3.1 — Résumé de la préparation de l'étape 11 (prochaine migration Cycle)

L'étape 11 prépare le prochain cycle de migration en consolidant la réévaluation, la classification, la sélection des cibles, la stratégie d'exécution, le gel de la portée et un package de transfert prêt à exécuter sans exécuter les modifications de migration.

#### Ce que l'étape 11 a préparé

 - Réévalué les candidats non migrés restants après l'étape 10 et mis à jour leurs signaux de force.
- Mise à jour de la classification état de préparation/risque/valeur de migration pour les candidats restants.
- Sélection de la prochaine cible délimitée la plus forte : `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) via `POST /api/to-asciidoc`.
- Définition d'une stratégie d'exécution stricte à flux unique, d'un ordre d'exécution explicite et d'une stratégie différée limites.
- Portée gelée (dans le champ d'application/hors champ d'application/différé), portes go/no-go et règle de non-expansion.
- Produit un package de transfert prêt à être exécuté comme référence fixe pour le démarrage futur de l'exécution.

#### Ce qui est maintenant prêt pour le prochain cycle

- Un flux d'entrée et un ordre d'exécution uniques et clairement définis.
- Conditions préalables explicites de préparation et attentes minimales en matière de vérification.
- Une posture de risque limitée qui préserve la comparabilité avec l'étape 10 et évite une expansion prématurée de `/api/convert`.

#### Ce qui nécessite encore une exécution réelle plus tard

- Mise en œuvre et validation du processus réel `markdown-to-asciidoc.ts` modifications de migration/alignement.
- Exécution d'une vérification au niveau de l'itinéraire et au niveau du wrapper sur les modifications de code exécutées.
- Tout travail de migration sur les candidats différés (notamment le large `POST /api/convert` travail familial) dans un cycle futur délimité distinct.

#### Limite d'étape

Cette étape n'est qu'un résumé et ne **ne pas** commencer l'étape 11.3.2.

### Étape 11.3.2 — Planification formalisée + référence de transfert (par défaut pour le cycle suivant)

Cette section formalise les résultats de la planification de l'étape 11 comme référence par défaut pour une exécution future, à moins qu'un nouveau bloqueur fondé ne nécessite une exception explicite.

#### Référence formalisée (à partir de l'étape 11)

- **Ensemble de candidats restants réévalué :** `POST /api/convert` famille + `api/frontend/src/converters/markdown-to-asciidoc.ts`.
- **Référence de classification mise à jour :** `/api/convert` reste préparation moyenne / risque élevé / valeur stratégique élevée (stable, confiance en hausse) ; `markdown-to-asciidoc.ts` est le candidat avancé à court terme (état de préparation moyen-élevé, risque faible-moyen, valeur à court terme plus élevée).
- **Cible suivante par défaut sélectionnée :** cible wrapper délimitée unique `convertMarkdownToAsciiDoc(...)` via `POST /api/to-asciidoc`.
- **Base de référence de la stratégie d'exécution :** séquence stricte d'un flux à la fois (enveloppe d'entrée -> alignement des limites de la route/de l'orchestrateur -> alignement du contrat limité -> portes de vérification).
- **Base de contrôle de la portée :** limites fixes dans le champ d'application/hors champ d'application/différées, conditions explicites de go/no-go et règle de non-expansion (bloqueur de document et arrêt si l'exécution limitée devient dangereuse).
- **Base de transfert :** Le package de transfert de l'étape 11.2.3 est le point de départ d'exécution requis.

#### Attentes par défaut pour le cycle suivant

- Commencer à partir du package de transfert de l'étape 11.2.3 sans rouvrir la sélection de cible, la classification, les limites de portée ou les définitions de portes.
- Exécuter uniquement le wrapper sélectionné + sa limite de route selon la méthode de premier contrat préservée. et les attentes de vérification requises.
- Gardez `/api/convert` et d'autres éléments de grande surface différés jusqu'à ce qu'un plan de sous-tranche délimité séparé soit explicitement approuvé.

#### Les allocations spécifiques au chemin qui peuvent encore rester

- Les détails du comportement de l'UI au niveau du wrapper (notifications/texte d'état et gestion locale de l'état obsolète) peuvent rester spécifiques au chemin si le contrat la sémantique est préservée.
- Les spécificités de l'enveloppe du endpoint peuvent rester spécifiques au chemin lorsqu'elles sont explicitement documentées et vérifiées (pas d'aplatissement implicite dans des modèles ad hoc).
- Les heuristiques de secours locales peuvent rester uniquement comme comportement secondaire lorsque la structure `error.code` n'est pas disponible et doivent rester documentées.

#### Étape frontière

Cette étape formalise uniquement les orientations de base et ne commence **pas** l'étape 11.3.3.

### Étape 11.3.3 — Étape 11 Définition de Terminé

L'étape 11 n'est terminée que si tous les critères ci-dessous sont vrais :

- Les flux candidats restants étaient réévalué après l'étape 10.
- La classification de l'état de préparation, du risque et de la valeur de migration a été mise à jour.
- La prochaine cible de migration réaliste ou petite vague a été sélectionnée.
- La stratégie d'exécution a été définie.
- La portée de l'exécution a été gelée.
- Les éléments dans le champ d'application, hors champ et différés ont été documentés.
- Les conditions Go / No-Go ont été définies.
- Un package de transfert prêt à exécuter a été documenté.
- Un résumé concis de l'étape 11 a été documenté.
- Une planification et la ligne de base du transfert a été formalisée.
- L'étape 11 a clairement distingué ce qui est prêt pour une exécution ultérieure de ce qui reste différé.

#### Ce que l'étape 11 ne nécessite pas

- Exécuter les modifications de code du cycle de migration suivant ou terminer la migration du wrapper sélectionné elle-même.
- Tout refactor, refonte de la ligne de base ou refonte générale du produit au-delà documentation de planification et de transfert.
- Démarrage de l'étape 12 ou de tout travail de phase d'exécution appartenant à un cycle ultérieur.

#### Limite d'étape

Cette section définit uniquement les critères d'achèvement de l'étape 11 et ne commence **pas** l'étape 11.3.4.

### Étape 11. Clôture

#### Ce que l'étape 11 a réévalué

- Les candidats non migrés restants circulent après l'étape 10 : `POST /api/convert` et `api/frontend/src/converters/markdown-to-asciidoc.ts` (voir étape 11.1.1).

#### Ce que l'étape 11 a reclassé

- Mise à jour de l'état de préparation, du risque et de la valeur de migration pour les candidats restants (étape 11.1.2) : `/api/convert` stable avec une confiance de planification plus élevée ; `markdown-to-asciidoc.ts` est devenu le candidat wrapper à court terme.

#### Ce que l'étape 11 a sélectionné comme prochaine cible ou petite vague

- **Cible suivante à une seule limite :** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) avec **`POST /api/to-asciidoc`** (étape 11.1.3).

#### Quelle stratégie d'exécution l'étape 11 a définie

- Ordre d'exécution strict **un flux à la fois** : confirmer l'entrée du wrapper → mapper et aligner la limite `POST /api/to-asciidoc` → alignement du contrat délimité → portes de vérification (étape 11.2.1).

#### Quelles sont les limites du champ d'application et les conditions d'accès/non-accès à l'étape 11 gelées

- Éléments dans le champ d'application/hors champ d'application/différés, portes **go/no-go** et règle de **non-expansion** pour le cycle suivant (étape 11.2.2).

#### Quel package de transfert l'étape 11 a produit

- **Étape 11.2.3** transfert prêt à être exécuté : cible sélectionnée, flux d'entrée, ordre d'exécution, travail minimum dans le cadre, liste différée, conditions de préparation et attentes en matière de vérification.

#### Quelle étape 11 fournit désormais pour le prochain cycle de migration

- Une **référence par défaut contrôlée et documentée** (étape 11.3.2) plus un enregistrement de préparation concis (étape 11.3.1) et des critères d'achèvement explicites (étape 11.3.3), sans exécuter de code de migration.

#### Exécution vs préparation (explicite)

- **L'étape 11 n'a pas exécuté le cycle suivant :** aucune mise en œuvre de la migration ni aucune correction de route/wrapper n'a été effectuée dans le cadre de l'étape 11.
- **L'étape 11 a préparé le cycle suivant de manière contrôlée et documentée :** la sélection, la stratégie, le gel de la portée, les portes et le transfert sont des entrées fixes pour une exécution future.
- **Les éléments différés restent différés** (particulièrement larges `POST /api/convert` travail familial) jusqu'à ce qu'une stratégie de sous-tranches délimitée séparément soit choisie.
- **Les travaux de contrat, d'alignement et de consolidation déjà validés ne doivent pas être rouverts** sans un **véritable bloqueur fondé** ; les travaux futurs devraient s'appuyer sur la base de référence formalisée plutôt que de remettre en cause des décisions réglées.

#### Ce que l'étape 11 ne signifie pas

- Le flux suivant est déjà migré.
- La prochaine vague est déjà exécutée.
- Tous les candidats restants sont maintenant prêts.
- L'étape 12 a déjà été exécutée. commencé.

#### Limite d'étape

L'étape 11 se termine ici en tant que jalon de planification et de transfert uniquement et ne commence **pas** l'étape 12.1.2.

### Étape 12.1.1 — Confirmation du flux d'entrée à l'étape 12 (à partir de l'étape 11 Handoff)

#### Package de transfert examiné

- **Source de vérité :** **Étape 11.2.3** (Package de transfert prêt à exécuter), renforcée par **Étape 11.3.2** (référence par défaut formalisée).

#### Flux d'entrée d'exécution confirmé (exact)

- **Module Wrapper :** `api/frontend/src/converters/markdown-to-asciidoc.ts`
- **Fonction d'entrée :** `convertMarkdownToAsciiDoc(...)`
- **Point de terminaison backend :** `POST /api/to-asciidoc`
- **Direction :** Markdown → AsciiDoc (documentation d'itinéraire par module soutenu par Pandoc)

Il s'agit de la **seule** exécution dans le cadre entrée pour l'étape 12 dans le cadre du plan étape 11 gelé (emballage unique + limite de route unique).

#### État de préparation et vérification de départ/non-go (critères de l'étape 11.2.2/11.2.3)

- **Conditions de départ (doivent toujours être valables immédiatement avant tout changement de code de l'étape 12) :**
 - Vert de base : `npm test` et `npm run typecheck` réussissent.
 - Le comportement de contrat d'abord `convertText(...)` pour les flux déjà validés reste intact (non-régression sur les chemins migrés précédents).
 - Le wrapper `markdown-to-asciidoc.ts` reste une surface d'entrée isolée et localisée.
 - Aucune exigence d'expansion illimitée du backend, de refonte globale de l'enveloppe ou de refonte large de l'UI/de l'état. pour continuer sous la portée gelée.

- **Conditions de non-Go (arrêt et document) :**
 - La ligne de base échouait déjà avant les modifications.
 - Seul le chemin « sûr » violerait la portée gelée (travail backend/UI illimité).

**État de l'étape 12.1.1 :** Le flux défini par le transfert **correspond toujours** au point d'entrée prévu et **toujours s'aligne sur l'intention de go/no-go gelée**. La vérification réelle au niveau de la commande doit être réexécutée au début de l'exécution (cette sous-étape ne remplace pas l'exécution des vérifications).

#### Pourquoi cela reste la bonne cible d'exécution suivante

 - Il s'agit de la **sélection explicite de l'étape 11** et complète la paire **wrapper hérité restant** après l'étape 10, en utilisant le même **wrapper + route dédiée** modèle.
- Il préserve le **risque limité** par rapport aux travaux différés en haute surface (`POST /api/convert`).
- Elle est **directement comparable** à l'étape 10 pour la posture de vérification et les attentes contractuelles d'abord.

#### Note du bloqueur (uniquement si mise à la terre)

- **Aucun bloqueur fondé n'a été enregistré** pour l'étape 12.1.1 en fonction du package de transfert et de la portée gelée. Si une condition go échoue lors de l'exécution des commandes, traitez-la comme un **nouveau bloqueur fondé** et arrêtez-vous plutôt que d'élargir la portée.

#### Limite d'étape

Cette étape confirme uniquement le flux d'entrée et les portes et ne démarre **pas** l'étape 12.2.2.

### Étape 12.1.2 — Gel de la portée avant Étape 12 Exécution

#### Flux d'entrée confirmé réutilisé (à partir de l'étape 12.1.1)

- `api/frontend/src/converters/markdown-to-asciidoc.ts`
- `convertMarkdownToAsciiDoc(...)`
- `POST /api/to-asciidoc`

#### Dans le champ d'application (doit rester borné)

- Alignement localisé du wrapper d'entrée de l'étape 12 pour préserver le comportement de réussite/échec du contrat en premier.
- Préservation localisée à la limite `POST /api/to-asciidoc` uniquement lorsque cela est requis pour la sémantique du contrat de ce flux.
- Vérification minimale et mises à jour de la documentation liées directement à ce flux de l'étape 12.

#### Out de portée (explicitement exclu)

- Refonte étendue du backend, refonte de l'enveloppe inter-routes ou toute refactorisation à l'échelle de l'architecture.
- Migration familiale multiformat générique via `POST /api/convert`.
- Refonte globale du frontend/de l'UI ou consolidation du routage du point d'entrée à l'échelle de l'application.
- Toute exécution de migration sur des flux supplémentaires au-delà du flux d'entrée confirmé à l'étape 12.

#### Différé (doit rester différé)

- `POST /api/convert` travail familial large jusqu'à ce qu'une sous-tranche délimitée séparément soit explicitement sélectionnée.
- Toute cible de migration autre que `markdown-to-asciidoc.ts` + `POST /api/to-asciidoc`.
- Travaux de planification/synthèse futurs au-delà de ce gel de la portée de l'étape 12.

#### Limites d'exécution (règle de non-expansion)

- La portée ne doit pas s'étendre au-delà de la limite du wrapper unique + de la route unique ci-dessus.
- Si une réalisation en toute sécurité nécessite des modifications illimitées du backend, une refonte complète de l'UI ou une extension multi-flux, traitez-le comme un bloqueur ancré : documentez-le et arrêtez-le.
- Pas de « déplacement du champ d'application par commodité » : tout élément qui n'est pas explicitement dans le champ d'application reste exclu à moins qu'un véritable bloqueur ne soit prouvé.

#### Pourquoi ce gel de la portée permet de garder l'étape 12 sous contrôle

- Il maintient l'étape 12 comparable au modèle de planification validé de l'étape 10/11 (unité délimitée unique).
- Il protège la non-régression en évitant une expansion prématurée vers des candidats différés à grande surface.
- Il permet de faciliter la restauration et la vérification en limitant les surfaces touchées avant le début du travail de migration.

#### Limite de marche

Cette étape gèle uniquement la portée de l'étape 12 et ne démarre **pas** l'étape 12.2.2.

### Étape 12.2.1 — Cartographie du flux d'exécution actuel (avant l'intégration de l'assistant)

#### Flux sous inspection

- **Flux d'exécution de l'étape 12 :** Markdown -> Chemin du wrapper AsciiDoc
- **Entrée frontend :** `api/frontend/src/converters/markdown-to-asciidoc.ts` -> `convertMarkdownToAsciiDoc(...)`
- **Point de terminaison backend :** `POST /api/to-asciidoc` (`api/backend/routes/conversion.routes.js`)

#### Point d'entrée

- Appels d'UI `convertMarkdownToAsciiDoc(text, setStatus, setOutput, setLoading, setNotification, [setConversionMode])`.
- Wrapper effectue une prévérification locale (`!text.trim()`), définit l'état de l'UI d'exécution, puis appelle `fetch(${API_BASE}/api/to-asciidoc)` avec le corps JSON `{ text }`.

#### Convertisseur principal / wrapper

- **Frontend wrapper :** `convertMarkdownToAsciiDoc(...)` (Wrapper asynchrone piloté par l'UI ; aucun objet de résultat renvoyé).
- **Moteur de conversion back-end :** `convertMarkdownWithPandoc(text)` à l'intérieur de la route `/to-asciidoc`.
- **Créateurs de contrats à la limite du backend :** `createSuccessResult(...)` en cas de succès et `createFailureResult(...)` via `buildToAsciidocFailure(...)` en cas de succès échec.

#### Paramètres d'entrée

- **Entrée du wrapper frontal :** Markdown `text` plus rappels du setter (`setStatus`, `setOutput`, `setLoading`, `setNotification`, facultatif `setConversionMode`).
- **Entrée de la route backend :** `req.body.text` (validé sous forme de chaîne par `validate(...)` + schéma zod), puis garde d'entrée vide au niveau de la route.

#### Gestion des fichiers temporaires

- **Wrapper frontal :** aucun.
- **Chemin de la route backend `/to-asciidoc` :** Métadonnées du contrat de demande/réponse en mémoire (`in-memory://...`) et aucune écriture/nettoyage explicite du fichier temporaire dans ce chemin de route.

#### Chemin de réussite (exécution actuelle)

1. Wrapper définit le statut/chargement (+ mode de conversion facultatif) et appelle le backend.
2. Le backend valide la demande, vérifie les entrées non vides, exécute `convertMarkdownWithPandoc(text)`.
3. Le backend calcule `finishedAt`/`durationMs`, construit `conversionResult` avec :
 - métadonnées de sortie (`outputFile`, taille, mime),
 - `warnings: []`, `logs: []`,
 - métaroute (`/api/to-asciidoc`, `in-memory`).
4. Le backend répond `200` par `{ asciidoc, conversionResult }`.
5. Wrapper lit actuellement `data.asciidoc`, définit la notification de sortie/statut/succès.

#### Chemin d'échec (exécution actuelle)

- **Échecs du backend :**
 - Entrée vide -> `400` échec standardisé à partir de `buildToAsciidocFailure(...)` (+ `detail`).
 - Erreurs de conversion internes -> classées par `classifyToAsciidocInternalError(...)`, puis `500` échec standardisé (+ `detail`).
- **Échecs du frontend :**
 - HTTP non OK -> le wrapper renvoie `Error("Erreur HTTP ...")` après la lecture du texte.
- Abandon/réseau/autres erreurs gérées dans `catch` -> statut + ensemble de notifications d'erreur.
 - `finally` efface toujours l'état de chargement.

#### Comportement de retour/lancement

- **Comportement externe du wrapper :** renvoie `Promise<void>` et ne propage pas le résultat typé objets.
- **Style de contrôle :** style interne mixte (début `return` sur une entrée vide + `throw` sur une gestion HTTP non OK + `catch`), mais extérieurement, aucune erreur non détectée n'est intentionnellement exposée.
- **Route backend :** renvoie les charges utiles de réussite ou d'échec JSON (ne renvoie pas les exceptions JS à appelant).

#### Où la durée, les journaux, les avertissements, les sorties et les erreurs sont produits

- **Durée :** la route backend calcule `durationMs` au moment de la création du résultat de réussite/échec.
- **Avertissements/journaux :** les générateurs de résultats backend émettent actuellement `warnings: []` et `logs: []` (tableaux vides explicites).
- **Sortie :** la charge utile de réussite du backend inclut `asciidoc` ; le frontend utilise `data.asciidoc` pour mettre à jour la sortie de l'UI.
- **Erreur :** l'échec standardisé du backend inclut les `error` structurés (+ `error.code`) et `detail` ; le frontend consomme actuellement le texte de transport/erreur dans les branches catch plutôt que d'analyser la charge utile d'échec standardisée comme source de vérité.

#### Observations pertinentes pour l'intégration (avant 12.2.2)

- Le backend émet déjà un `ConversionResult` standardisé sur le succès/l'échec à la limite de la route.
- Frontend le wrapper reste de forme héritée (champ de sortie + texte d'erreur HTTP renvoyé) et n'est pas encore le premier contrat sur `conversionResult` / sémantique d'échec structurée.
- Cela crée une inadéquation d'enveloppe de succès/échec connue au point d'ingestion du wrapper, qui est la cible d'intégration principale pour le mappage/alignement de l'assistant de l'étape 12.

#### Étape border

Cette étape mappe uniquement le comportement d'exécution actuel et ne démarre **pas** l'étape 12.2.3.

### Étape 12.2.2 — Mappage de la charge utile de l'assistant (avant l'intégration)

Ce mappage réutilise le flux d'exécution de l'étape 12.2.1 et définit l'approvisionnement pratique de la charge utile pour `createSuccessResult(payload)` et `createFailureResult(payload)` pour le flux `markdown-to-asciidoc`.

#### Statut du mappage légende

- **Direct :** directement disponible à partir des entrées/résultats d'exécution actuels.
- **Dérivable :** peut être calculé localement à partir des données disponibles.
- **Par défaut :** assistant attendu/valeur par défaut lorsqu'il n'est pas explicitement défini.
- **Manquant :** non disponible actuellement au niveau du wrapper sans ajout câblage.

#### `createSuccessResult(payload)` cartographie

| Champ | Statut du mappage | Source pratique pour le flux de l'étape 12 |
|---|---|---|
| `conversionId` | Direct | `conversionResult.conversionId` de la charge utile de réussite du backend. |
| `converter` | Direct | `conversionResult.converter` (le backend définit actuellement `pandoc`). |
| `pipeline` | Direct | `conversionResult.pipeline` (backend actuellement `['markdown->asciidoc']`). |
| `inputFormat` | Direct | `conversionResult.inputFormat` (`markdown`). |
| `outputFormat` | Direct | `conversionResult.outputFormat` (`asciidoc`). |
| `inputFile` | Direct | `conversionResult.inputFile` du résultat de la limite du backend. |
| `outputFile` | Direct | `conversionResult.outputFile` du résultat de la limite du backend. |
| `startedAt` | Direct | `conversionResult.startedAt`. |
| `finishedAt` | Direct | `conversionResult.finishedAt`. |
| `durationMs` | Direct | `conversionResult.durationMs`. |
| `warnings` | Direct | `conversionResult.warnings` (tableau vide actuellement explicite). |
| `logs` | Direct | `conversionResult.logs` (tableau vide actuellement explicite). |
| `meta` | Direct | `conversionResult.meta` (métadonnées d'itinéraire/transport). |

#### `createFailureResult(payload)` cartographie

| Champ | Statut du mappage | Source pratique pour le flux de l'étape 12 |
|---|---|---|
| `conversionId` | Direct | `failure.conversionId` lorsque le backend renvoie un échec standardisé. |
| `converter` | Direct | `failure.converter` du résultat de l'échec du backend (`pandoc`). |
| `pipeline` | Direct | `failure.pipeline` du résultat d'un échec du backend. |
| `inputFormat` | Direct | `failure.inputFormat` du résultat d'un échec du backend. |
| `outputFormat` | Direct | `failure.outputFormat` du résultat de l'échec du backend. |
| `inputFile` | Direct | `failure.inputFile` du résultat de l'échec du backend. |
| `outputFile` | Direct | `failure.outputFile` (actuellement nul sur les échecs de route). |
| `startedAt` | Direct | `failure.startedAt` du résultat d'un échec du backend. |
| `finishedAt` | Direct | `failure.finishedAt` du résultat de l'échec du backend. |
| `durationMs` | Direct | `failure.durationMs` du résultat de l'échec du backend. |
| `warnings` | Direct | `failure.warnings` (tableau vide actuellement explicite). |
| `logs` | Direct | `failure.logs` (tableau vide actuellement explicite). |
| `meta` | Direct | `failure.meta` du résultat d'un échec du backend. |
| `error` | Direct | `failure.error` (code structuré/message/détails). |

#### Champs dérivables localement (repli lorsque la charge utile de limite structurée n'est pas disponible)

- `inputFormat` : constante de débit fixe `markdown`.
- `outputFormat` : constante de débit fixe `asciidoc`.
- `pipeline` : constante de débit fixe `['markdown->asciidoc']`.
- `converter` : attente de débit fixe `pandoc` pour cet itinéraire.
- `inputFile.size` : dérivable à partir de la longueur du texte source si nécessaire.

#### Champs par défaut de l'assistance (limités repli)

- `warnings` : tableau vide par défaut du helper si absent.
- `logs` : tableau vide par défaut du helper si absent.
- `meta` : objet helper/route par défaut si absent.
- `outputFile` : défaut du helper `null` sur échecs sans production sortie.

#### Actuellement manquant au niveau du wrapper (sans câblage d'intégration supplémentaire)

- Ingestion de charge utile de défaillance structurée garantie dans toutes les branches d'erreur du wrapper (le wrapper actuel lance/analyse le texte en cas de non-OK avant le mappage du premier contrat).
- Génération locale de `startedAt`/`finishedAt`/`durationMs` dignes de confiance. valeurs équivalentes à la qualité du contrat back-end si la charge utile du back-end n'est pas consommée.
- Fiable `conversionId` dans les branches de défaillance de transport/réseau où aucune charge utile JSON du back-end n'est disponible.

#### Note relative à l'intégration

- Le backend fournit déjà presque tous les champs de charge utile requis directement pour le succès et l'échec ; L'intégration de l'assistant de l'étape 12 doit donner la priorité à **faire en sorte que le wrapper consomme d'abord les objets backend standardisés `conversionResult`/échec**, avec la dérivation locale/les valeurs par défaut uniquement comme solution de repli limitée.

#### Limite de l'étape

Cette étape définit uniquement le mappage de la charge utile de l'assistant et ne démarre **pas**r l'étape 12.2.3.

### Étape 12.2.6 — Vérification isolée après 12.2.3 / 12.2.4 / 12.2.5

#### Portée de la vérification

- Flux en cours de vérification : `POST /api/to-asciidoc` (Étape 12 sélectionnée flow).
- Style de vérification réutilisé à partir de `api/backend/scripts/` :
- `verify-e2e-to-asciidoc-success-contract.js`
 - `verify-e2e-to-asciidoc-failure-contract.js`
 - `verify-e2e-to-asciidoc-representative-scenarios.js`
 - `verify-e2e-to-asciidoc-internal-error-contract.js`

#### Scénarios exécutés

- **Scénario de réussite nominale :** entrée de titre/paragraphe démarque -> HTTP 200 avec `asciidoc` + standardisé `conversionResult`.
- **Scénario d'échec fondé :** entrée de démarque vide/vierge -> HTTP 400 avec échec standardisé `ConversionResult` et structuré `error.code = EMPTY_INPUT`.
- **Petit ensemble de scénarios de base :** script représentatif couvrant deux entrées de réussite et deux échecs EMPTY_INPUT.
- **Contrôle d'harmonisation des erreurs internes :** chemin d'erreur Pandoc interne forcé -> échec standardisé HTTP 500 `ConversionResult` avec classification interne fondée.

#### Résultats

- **Statut de réussite :** PASS — la réponse réussie inclut `conversionResult` avec les champs de contrat racine attendus.
- **Statut d'échec :** PASS — les réponses aux échecs incluent des champs racine standardisés, structurés `error.code` et `detail` alignés sur `error.message`.
- **Statut de base :** PASS — ensemble de scénarios représentatifs validés pour `/api/to-asciidoc`.
- **Statut d'erreur interne :** PASS — le chemin interne reste dans le contrat d'échec standardisé après harmonisation.

#### Petite note de correctif

- Aucun correctif de code supplémentaire n'a été requis pour la vérification de l'étape 12.2.6.  
- Note opérationnelle : une exécution multi-script combinée bloquée après les contrôles représentatifs ; la réexécution du script d'erreur interne de manière isolée s'est terminée avec succès et a confirmé le comportement du contrat.

#### Limite de l'étape

Cette étape vérifie uniquement le flux isolé de l'étape 12 et ne démarre **pas** l'étape 12.3.1.

### Étape 12.3.1 — Identifier la véritable cible d'alignement backend/orchestre (étape 12)

#### Flux de l'étape 12 en cours d'inspection

- **Entrée frontend (portée de l'étape 12) :** `api/frontend/src/converters/markdown-to-asciidoc.ts` -> `convertMarkdownToAsciiDoc(...)` -> **`POST /api/to-asciidoc`**
- **Surface backend :** Gestionnaire de route express dans **`api/backend/routes/conversion.routes.js`** pour **`POST /to-asciidoc`** (monté sous `/api`).

#### Les couches de coordination backend en fait impliqué

1. **HTTP + routage :** Express `router.post('/to-asciidoc', ...)`.
2. **Demande de validation :** `validate({ body: z.object({ text: z.string() }) })` (middleware de schéma).
3. **Prévérification au niveau de la route :** entrée vide/espace -> échec standardisé via `buildToAsciidocFailure(...)` (HTTP `400`).
4. **Appel du moteur de conversion :** `convertMarkdownWithPandoc(text)` à partir de **`api/backend/services/conversion/convert.js`** (sous-processus Pandoc, fichiers temporaires sous le répertoire temporaire du système d'exploitation, nettoyage dans `finally`).
5. **Assemblage du contrat :** `createSuccessResult(successPayload)` sur le succès ; `buildToAsciidocFailure(...)` -> `createFailureResult(failurePayload)` en cas d'échec ; `classifyToAsciidocInternalError(...)` pour le classement interne ; secours de capture imbriqué pour les échecs internes secondaires (étape 12.2.5).

**Non impliqué pour cette route :** `lazyload.runConverter(...)` / chemin de registre du module (utilisé par d'autres flux tels que `/api/to-markdown`, mais **pas** le gestionnaire de l'étape 12 `to-asciidoc`).

#### True cible d'alignement backend/orchestrator (choisie)

- **Cible d'alignement principale :** **`api/backend/routes/conversion.routes.js`** — le **`/to-asciidoc`** gestionnaire de route et ses **assistants locaux** dans le même fichier (`buildToAsciidocFailure`, `classifyToAsciidocInternalError`, mise en forme de la réponse avec `detail`).

#### Pourquoi c'est le bon calque

- Il s'agit de la **limite HTTP** où le succès/échec standardisé `ConversionResult` est assemblé et renvoyé au client.
- C'est là que les **risques contractuels au niveau de la route** sont contrôlés (prévérification, classification des erreurs internes, comportement harmonisé du chemin de capture) sans dépendre d'un saut d'orchestration de chargement différé distinct pour ce flux.
- Le comportement du moteur (`convertMarkdownWithPandoc`) est un **en aval dépendance**; Le travail d'alignement doit d'abord préserver la sémantique de conversion et se concentrer sur la préservation du contrat au niveau de la **limite de route**.

#### Limite d'étape

Cette étape identifie uniquement la cible d'alignement et ne démarre **pas** l'étape 12.3.2.

### Étape 12.3.2 — Carte de flux backend/orchestre (étape 12 via 12.3.1 Cible)

- **Nom du flux :** Entrée d'exécution de l'étape 12 — Markdown → AsciiDoc via `POST /api/to-asciidoc`
- **Cible backend confirmée :** `api/backend/routes/conversion.routes.js` (`router.post('/to-asciidoc', ...)`)

#### Flux de réussite (backend)

1. **Entrée HTTP :** `POST /api/to-asciidoc` → `conversion.routes.js`.
2. **Demande de validation :** `validate.middleware.js` + Zod garantit `{ text: string }` (validation au niveau du schéma avant l'exécution du gestionnaire de route).
3. **Prévérification de l'itinéraire :** si `!text.trim()` → chemin de défaillance standardisé (voir flux de défaillance) et **n'appelle pas** Pandoc.
4. **Appel du moteur (résultat de chaîne sans contrat) :** `convertMarkdownWithPandoc(text)` dans `api/backend/services/conversion/convert.js` :
 - écrit l'entrée temporaire sous le répertoire temporaire du système d'exploitation, exécute le sous-processus Pandoc, lit la chaîne de sortie, nettoie les artefacts temporaires dans `finally`.
 - renvoie du **texte AsciiDoc brut** (pas un `ConversionResult`).
5. **Temps + assemblage de contrat à la limite de la route :** la route calcule `finishedAt` et `durationMs`, construit `successPayload`, puis :
 - `conversionResult = createSuccessResult(successPayload)`.
6. **Réponse HTTP :** renvoie **200** avec `{ asciidoc, conversionResult }` (sortie AsciiDoc dupliquée : chaîne `asciidoc` de niveau supérieur plus `conversionResult` imbriquée standardisée).

#### Flux de pannes (backend)

Les pannes sont produites **dans la route** (et éventuellement déclenchées par des lancements de moteur) ; il n'y a **pas de saut d'orchestration à chargement différé** pour ce endpoint.

1. **Échec de la vérification préalable de l'itinéraire (`EMPTY_INPUT`) :**
 - Si `!text.trim()` après la validation du schéma → `buildToAsciidocFailure(...)` → `createFailureResult(...)` à l'intérieur de `buildToAsciidocFailure`.
 - Renvoyé sous la forme **400** `{ ...failure, detail: failure.error.message }`.
2. **Échecs d'exécution du moteur / Pandoc :**
 - `convertMarkdownWithPandoc(text)` lancers → interceptés par l'itinéraire `catch`.
 - `classifyToAsciidocInternalError(error)` mappe les modèles de message à `CONVERSION_FAILED` vs `INTERNAL_ERROR`.
 - `buildToAsciidocFailure(...)` → échec standardisé renvoyé comme **500** `{ ...failure, detail: failure.error.message }`.
3. **Échec interne secondaire dans la construction de l'échec (étape 12.2.5) :**
 - Si la construction de la réponse d'échec principale est lancée, `catch` imbriqué renvoie un `INTERNAL_ERROR` standardisé de secours toujours via `buildToAsciidocFailure(...)`.

**Remarque :** les échecs de validation de JSON/schéma non valides sont gérés par le middleware et ne peuvent **pas** être un `ConversionResult` standardisé (modèle de route croisée connu ; point de risque contractuel fondé).

#### Résultat standardisé — premier point de création + propagation vers le haut

- **Première création réussie standardisée :** `createSuccessResult(successPayload)` dans **`conversion.routes.js`** immédiatement après le retour réussi de `convertMarkdownWithPandoc(text)` text.
- **Première création d'échec standardisée :** `createFailureResult(failurePayload)` à l'intérieur de **`buildToAsciidocFailure(...)`** (même fichier), invoquée à partir de la vérification préalable de la route et des chemins de gestion des erreurs.
- **Propagation vers le haut :** il n'y a **pas de couche orchestrateur intermédiaire** pour ce flux :
 - Le moteur renvoie du **texte uniquement** vers le haut jusqu'à la route.
 - La route est la **seule** couche qui construit un `ConversionResult` standardisé et émet la réponse HTTP JSON.

#### Points de risque du contrat back-end fondés (étape 12)

- **Asymétrie de l'enveloppe HTTP :** le succès imbrique le résultat standardisé sous `conversionResult`, tandis que les échecs sont standardisés au **niveau racine** `ConversionResult` plus `detail` (même modèle structurel que les autres routes dédiées).
- **Risque de contournement de la validation du middleware :** Zod Les échecs `validate(...)` peuvent renvoyer des formes d'erreur autres que `ConversionResult` à moins qu'ils ne soient normalisés séparément à la limite.
- **Fragilité de classification des erreurs internes :** `classifyToAsciidocInternalError` repose sur la correspondance de sous-chaîne de `error.message` pour les cas liés à Pandoc ; la dérive des messages peut changer la classification `CONVERSION_FAILED` par rapport à `INTERNAL_ERROR`.
- **Abstraction des erreurs du moteur :** `convertMarkdownWithPandoc` peut générer/relancer des erreurs de wrapper génériques, réduisant ainsi le signal structuré avant la classification de la route.

#### Limite d'étape

Cette étape mappe uniquement le comportement du flux backend et ne démarre **pas**r l'étape 12.3.3.

### Étape 12.3.3 — Points de risque du contrat backend + comportement cible (étape 12)

- **Nom du flux :** Entrée d'exécution de l'étape 12 — Markdown → AsciiDoc via `POST /api/to-asciidoc`
- **Cible backend confirmée :** `api/backend/routes/conversion.routes.js` (`router.post('/to-asciidoc', ...)`)
- **Utilise :** la carte de flux backend/orchestrator de **Étape 12.3.2**

#### Là où il est standardisé, `ConversionResult` peut toujours être remodelé / dépouillé / enveloppé / reconstruit / contourné

- **(Risque) Asymétrie de l'enveloppe de réponse HTTP à la limite de la route**
 - Succès : `{ asciidoc, conversionResult }` (le résultat standardisé est *imbriqué* sous `conversionResult`).
 - Échec : `{ ...failureResult, detail }` (le résultat standardisé est *root-level* plus `detail`).
 - Risque : les consommateurs ne peuvent traiter que `asciidoc` / `detail` et ignorez les champs structurés.
- **(Risque) Contournement de la validation du middleware**
 - Les échecs de schéma JSON/Zod non valides peuvent renvoyer `{ error, issues }` plutôt qu'un `ConversionResult` (modèle de route croisée connu).
- Risque : les clients qui privilégient le contrat ne peuvent pas s'appuyer sur une forme d'échec unique pour tous les chemins d'erreur HTTP.
- **(Risque) Le moteur génère des signaux non structurés**
 - `convertMarkdownWithPandoc` renvoie/renvoie des erreurs qui ne sont pas `ConversionResult` ; la classification dépend de `classifyToAsciidocInternalError` heuristiques de message.
 - Risque : la dérive des messages change `CONVERSION_FAILED` vs `INTERNAL_ERROR` sans code structuré du moteur.
- **(Risque) Complexité du chemin de construction des échecs**
 - Construction d'échec primaire + repli imbriqué (étape 12.2.5) peut masquer l'exception d'origine si le générateur d'échec principal lancers.
 - Risque : perte de fidélité du diagnostic à moins que les champs `details`/`stage` restent explicites et stables.

#### Points de sécurité (déjà alignés / faible dérive)

- **(Sûr) Constructeurs standardisés de route-local pour `/to-asciidoc`**
 - Utilisations réussies `createSuccessResult(successPayload)` une fois que la sortie du moteur est connue.
 - L'échec utilise `buildToAsciidocFailure(...)` -> `createFailureResult(failurePayload)` pour les échecs de route fondé.
- **(Sûr) Aucun saut d'orchestration à chargement différé pour cette route**
 - Il n'existe pas de deuxième couche capable de convertir silencieusement les résultats standardisés en formes de module héritées (contrairement aux flux préservés par lazyload).
- **(Sûr) Preuve de vérification isolée (étape 12.2.6)**
 - Les scripts de réussite/échec/erreur interne confirment les champs racine standardisés pour les chemins d'itinéraire principaux.

#### Points qui nécessitent encore une prise en compte explicite de l'alignement (pas nécessairement rompu)

- **La forme d'erreur du middleware** reste une surface de compatibilité distincte de celle normalisée par l'itinéraire. échecs.
- **La classification interne basée sur les messages** doit être traitée comme une dépendance de stabilité (tests/docs), et non comme une garantie sémantique de Pandoc.

#### Comportement du backend cible (étape 12) — avant la remédiation

**Préservation du succès**

- Renvoie **200** avec :
 - `asciidoc: string` (texte de sortie AsciiDoc)
 - `conversionResult: ConversionResult` où :
 - `success === true`
 - `error === null`
 - les champs racine obligatoires existent (y compris les collections `warnings`, `logs`, `meta`)
- Ne remplacez pas `conversionResult` par des objets de réussite hérités ad hoc.

**Préservation des échecs**

- Pour les échecs gérés par l'itinéraire (`400`/`500` de `/to-asciidoc`), renvoie un échec standardisé **au niveau racine** `ConversionResult` plus `detail` :
 - `success === false`
 - structuré `error` avec stable `error.code` là où il est fondé (`EMPTY_INPUT`, `CONVERSION_FAILED`, `INTERNAL_ERROR`, etc.)
 - les champs racine requis restent présents
- Ne pas aplatir les échecs structurés en réponses de type chaîne uniquement à la limite de la route.

**Erreurs de coordination internes**

- Les erreurs de moteur/internes doivent être converties en échecs standardisés via `buildToAsciidocFailure` + classification, non apparues comme brutes exceptions non gérées à la limite HTTP.
- Si la construction de l'échec elle-même échoue, le repli doit toujours être un `INTERNAL_ERROR` standardisé avec une sémantique `details.stage` explicite (telle qu'implémentée à l'étape 12.2.5).

**Enrichissement acceptable**

- Ajout de `detail` aux côtés du `error` structuré pour la compatibilité client.
- Enrichissement de `meta` avec des clés de portée d'itinéraire **sans** supprimer/écraser le `meta` existant significatif des constructeurs.
- Ajout de champs de diagnostic sécurisés sous `error.details` / `details.stage` lorsque fondé.

**Remodelage/aplatissement inacceptable**

- Renvoi de réponses qui omettent les `ConversionResult` champs racine requis pour `/to-asciidoc` chemins de réussite/échec qui sont destinés à être contractuels en premier.
- Remplacement du `error` structuré par un modèle d'erreur constitué de chaînes uniquement au niveau de la route. 
- Suppression des collections `error.code`, `pipeline`, `warnings`, `logs` ou `meta` des résultats standardisés.

#### Limite d'étape

Cette étape définit uniquement les points de risque et le comportement cible et ne démarre **pas** l'étape 12.3.4.

### Étape 12.3.4 — Correction du backend/de l'orchestre (étape 12)

#### Ce qui a été corrigé (minimal, route + moteur pour ce flux)

- **`convertMarkdownWithPandoc` préservation des erreurs :** `api/backend/services/conversion/convert.js` renvoie désormais les erreurs de wrapper avec **`Error` `cause` chaînage** afin que l'erreur de chemin Pandoc d'origine ne soit pas rejetée derrière une surface générique de message uniquement.
- **La classification d'itinéraire utilise le contexte d'erreur complet :** `api/backend/routes/conversion.routes.js` ajoute `collectAsciidocErrorMessages(...)` et met à jour `classifyToAsciidocInternalError` pour classer à l'aide du **message concaténé chaîne** (y compris `error.cause`), en gardant `CONVERSION_FAILED` vs `INTERNAL_ERROR` fondés sur la vraie sémantique Pandoc lorsque cela est possible.

#### Vérification (isolée)

- Réexécution des scripts existants : `verify-e2e-to-asciidoc-success-contract.js`, `verify-e2e-to-asciidoc-failure-contract.js`, `verify-e2e-to-asciidoc-representative-scenarios.js`, `verify-e2e-to-asciidoc-internal-error-contract.js`.

#### Limite de l'étape

Cette étape applique uniquement la correction localisée du backend et ne démarre **pas** l'étape 12.3.5.

### Étape 12.3.5 — Vérification et consolidation de la correction backend/orchestre (étape 12)

#### Ce qui a été vérifié (post-12.3.4)

- **Préservation standard du succès :** Les réponses HTTP **200** renvoient toujours `asciidoc` plus `conversionResult` imbriqué produit par `createSuccessResult(...)`, avec les champs racine requis intacts (les scripts affirment le contrat de réussite complet).
- **Préservation standard des échecs :** Réponses HTTP **400** / **500** renvoie toujours des objets d'échec standardisés `ConversionResult` au niveau racine ** (pas d'erreurs de chaîne uniquement), avec l'héritage `detail` aux côtés du `error` structuré.
- **Structuré `error` + `error.code` :** les scripts d'échec affirment que `error.code` est présent et stable pour les cas fondés (par exemple `EMPTY_INPUT`) ; Le script d'erreur interne affirme `CONVERSION_FAILED` pour l'échec forcé du chemin Pandoc.
- **Erreurs de coordination/moteur internes :** l'échec forcé `convertMarkdownWithPandoc` est converti en un échec de route standardisé (HTTP **500**) sans contourner le contrat ; Le repli imbriqué de construction d'échecs reste disponible (étape 12.2.5).

#### Réexécution des vérifications (ce flux)

- `api/backend/scripts/verify-e2e-to-asciidoc-success-contract.js`
- `api/backend/scripts/verify-e2e-to-asciidoc-failure-contract.js`
- `api/backend/scripts/verify-e2e-to-asciidoc-representative-scenarios.js`
- `api/backend/scripts/verify-e2e-to-asciidoc-internal-error-contract.js`

**Résultat :** tous réussis en une seule exécution enchaînée après une petite stabilisation du script de vérification (voir ci-dessous).

#### Petit correctif de suivi (faisceau de vérification uniquement)

- **`verify-e2e-to-asciidoc-representative-scenarios.js`:** ajout d'un `process.exit(...)` explicite avec le même court modèle retardé utilisé par d'autres scripts e2e afin que les exécutions de vérification enchaînées ne se bloquent pas en attendant que la boucle d'événements Node se vide.

#### Déclaration de consolidation

- La couche backend/orchestrator de l'étape 12 pour `POST /api/to-asciidoc` est **vérifiée** pour préserver la sémantique `ConversionResult` standardisée pour les chemins de réussite et d'échec après l'étape 12.3.4, avec des données structurées `error` intactes et des erreurs internes acheminées via l'échec standardisé builders.

#### Limite d'étape

Cette étape termine la vérification/consolidation du backend/orchestrateur pour l'étape 12 et ne démarre **pas** l'étape 12.4.1.

### Étape 12.4.1 — Identifier la véritable cible d'alignement frontend/UI (étape 12)

- **Nom du flux :** Entrée d'exécution de l'étape 12 — Markdown → AsciiDoc (`POST /api/to-asciidoc`)
- **Objectif de cette étape :** identifier la véritable cible frontend/UI où la sémantique de réussite/échec de l'étape 12 est consommée pour la première fois et où la préservation du contrat peut encore dériver.

#### Couches frontend/UI impliqué (contexte réel de l'étape 12)

- **Couche de conversion Wrapper (module d'entrée de l'étape 12 à partir du transfert de l'étape 11) :**
 - `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`)
 - Appels `POST /api/to-asciidoc`, pilote l'UI via les setters (`setStatus`, `setOutput`, `setLoading`, `setNotification`, facultatif `setConversionMode`).
- **Couche d'état/de rendu de l'application (propriétaire global de l'UI) :**
 - `api/frontend/src/App.tsx` possède l'état visible de l'UI (panneaux source/résultat, chargement, notifications, modaux, sélection de format) et les actions de conversion des fils.
- **Chemin de conversion général actif (limite de référence pour le même endpoint) :**
 - `api/frontend/src/converters/generic-converter.ts` (`convertText(...)`) est invoqué par `App.tsx` pour le chemin **simple** Markdown → AsciiDoc (`sourceFormat === 'markdown'` && `targetFormat === 'asciidoc'`) et utilise **`/api/to-asciidoc`** comme endpoint HTTP.

#### Cible d'alignement frontend/UI choisie

- **Cible d'alignement frontend/UI de l'étape 12 principale :** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`)

#### Pourquoi il s'agit du focus correct

- **Il s'agit de la surface d'exécution sélectionnée à l'étape 12 à partir du package de transfert de l'étape 11** et donc de l'unité de migration/alignement limitée prévue pour cela cycle.
- **Il s'agit de la première limite de consommation pour la sémantique du contrat backend de l'étape 12 au sein de ce flux** (analyse de la réponse HTTP + mappage dans l'état de l'UI).
- **C'est là que le succès/l'échec peut encore être remodelé localement** (focus hérité `data.asciidoc`, erreurs HTTP renvoyées, messagerie catch-branch) avant les paramétreurs de l'UI, ce qui en fait l'endroit le plus pertinent pour vérifier/préserver la sémantique standardisée pour ce cycle spécifique. wrapper.
- **Remarque d'exécution actuelle :** le chemin d'accès actif de l'application pour cette paire de formats est toujours **`convertText(...)`** (`generic-converter.ts`), donc l'alignement frontal de l'étape 12 reste intentionnellement limité à l'exactitude du **niveau wrapper** (parallèle à l'étape 10) avant toute consolidation de routage plus large.

#### Étape frontière

Cette étape identifie uniquement la cible d'alignement frontend/UI et ne démarre **pas** l'étape 12.4.2.

### Étape 12.4.2 — Carte de flux frontend/UI (étape 12 via la cible 12.4.1)

- **Nom du flux :** Entrée d'exécution de l'étape 12 — Markdown → AsciiDoc (`POST /api/to-asciidoc`)
- **Cible frontend/UI confirmée :** `convertMarkdownToAsciiDoc(...)` dans `api/frontend/src/converters/markdown-to-asciidoc.ts`

#### Flux de réussite (frontend/UI)

1. **Entrée wrapper :** `convertMarkdownToAsciiDoc(text, setStatus, setOutput, setLoading, setNotification, [setConversionMode])`.
2. **Prévérification locale :** si `!text.trim()` → définit la chaîne d'état et **retourne plus tôt** (aucun appel réseau ; aucun `ConversionResult` impliqué).
3. **Interface utilisateur de pré-tentative :** définit le statut (« conversion en cours »), `loading=true`, facultatif `setConversionMode('md-to-adoc')`.
4. **Appel HTTP :** `fetch(POST ${API_BASE}/api/to-asciidoc, { text })` avec délai d'abandon de 30 s.
5. **Branche HTTP de réussite (`res.ok`) :**
 - `data = await res.json()`
 - **Extraction de sortie :** `setOutput(data.asciidoc ?? "")` (champ de sortie de niveau supérieur hérité).
 - **Backend `ConversionResult` :** présent sur les réponses réussies sous la forme `data.conversionResult`, mais **non lu ou validé** dans le wrapper actuel mise en œuvre.
 - **Commentaires des utilisateurs :** chaîne d'état de réussite + réussite `setNotification`.

#### Flux d'échec (frontend/UI)

1. **HTTP non-OK (`!res.ok`) :**
 - Lit **raw** `res.text()` dans `errorText`, puis **lance** `Error("Erreur HTTP ...")` (chemin d'erreur stringly).
 - L'échec standardisé structuré JSON du backend n'est **pas analysé** comme `ConversionResult` dans cette branche.
2. **Abandon / délai d'attente :** `AbortError` → statut + notification d'erreur (message local client).
3. **Erreurs de réseau :** correspondance de sous-chaîne sur `e.message` pour `NetworkError` / `Failed to fetch` → messagerie dédiée.
4. **Autres erreurs :** message de capture générique `Erreur lors de l'appel à l'API : ...` de `e.message`.
5. **Enfin :** `setLoading(false)` s'exécute toujours.

#### Là où le backend `ConversionResult` est consommé pour la première fois (wrapper actuel)

- **Succès :** le premier point où la réponse du backend est interprétée est `await res.json()`, mais le wrapper **seulement** utilise `data.asciidoc` pour la sortie. **`data.conversionResult` n'est pas consommé** (non validé, non mappé, non transmis à l'état au-delà du couplage implicite via la chaîne `asciidoc` en double).
- **Échec :** le premier point est soit un `res.text()` brut (non OK), soit un texte d'exception dans `catch`. **Les `error` / `error.code` structurés à partir de corps de défaillance standardisés ne sont pas consommés** comme source de vérité.

#### Comment l'état et le rendu se déplacent (au niveau du wrapper)

- Le wrapper n'a **pas d'état React interne** ; il invoque uniquement les **rappels** transmis par le parent :
 - **`setOutput`** met à jour quelle que soit la liaison du parent (généralement panneau de résultats / tampon AsciiDoc).
- **`setStatus`**, **`setLoading`**, **`setNotification`** mettent à jour la messagerie Chrome et le comportement du spinner.
 - Facultatif **`setConversionMode`** met à jour l'indicateur de mode lorsqu'il est fourni.
- **Le câblage parent (`App.tsx`) n'est pas exécuté dans ce chemin de wrapper** sauf si un appelant utilise explicitement cette fonction ; le chemin de production actif pour le même endpoint est `convertText(...)` (voir l'étape 12.4.1).

#### Risques frontend/UI fondés (aplatissement/remodelage/ignorance/état obsolète)

- **Ignorer le succès standardisé `conversionResult` :** le succès de l'UI est piloté par **`asciidoc` chaîne uniquement**, donc les champs de contrat (avertissements/logs/méta/timing) sont invisibles au niveau de cette couche.
- **Aplatissement des échecs structurés :** les réponses non OK deviennent une **chaîne unique lancée** ; **`error.code` n'est pas préservé** jusqu'à la sémantique de l'UI.
- **Risque de sortie obsolète :** les chemins d'échec **ne s'effacent pas** `setOutput` ; si une tentative précédente a produit une sortie, une tentative échouée peut laisser **AsciiDoc périmé visible** à moins que le parent ne l'efface ailleurs.
- **Incompatibilité d'enveloppe :** le succès du backend imbrique `conversionResult` tandis que les échecs sont au niveau racine + `detail` ; le wrapper n'implémente pas d'analyse explicite à double forme.

#### Limite d'étape

Cette étape mappe uniquement le comportement d'exécution du frontend/UI et ne démarre **pas** l'étape 12.4.3.

### Étape 12.4.3 — Points de risque du contrat frontend/UI + comportement cible (étape 12)

- **Nom du flux :** Étape 12 — wrapper hérité Markdown → AsciiDoc (`POST /api/to-asciidoc`)
- **Cible frontend/UI confirmée :** `api/frontend/src/converters/markdown-to-asciidoc.ts` → `convertMarkdownToAsciiDoc(...)`
- **Base :** Réutilise l'**Étape 12.4.2** Carte de flux frontend/UI (branches succès/échec, premier point d'analyse, propagation du setter). Cette étape définit uniquement le **risque** et le **comportement cible** (aucune modification de code).

#### Points de risque du contrat (fondés)

1. **Succès : `conversionResult` ignoré ; sortie pilotée par la chaîne `asciidoc` uniquement**
 - **Où :** branche `res.ok` après `await res.json()`.
- **Risque :** **aplatissement** / **ignorance partielle** — les avertissements/journaux/méta/timing et la validation de réussite (`success === true`) ne sont pas appliqués ; L'UI peut sembler « réussie » à partir des chaînes alors que la sémantique du contrat est inconnue.

2. **Échec : HTTP non OK réduit à une chaîne lancée**
 - **Où :** `!res.ok` → `res.text()` → `throw new Error(...)`.
 - **Risque :** **aplatissement** — backend structuré `error` / `error.code` / niveau racine `ConversionResult` non consommé ; les notifications reflètent uniquement le texte HTTP.

3. **Sortie périmée en cas d'échec de tentatives**
 - **Où :** les branches d'échec n'appellent pas `setOutput('')` ou équivalent.
 - **Risque :** **utilisation abusive d'un état périmé** — l'AsciiDoc précédent peut rester visible après une tentative infructueuse.

4. **Asymétrie de l'enveloppe non gérée**
 - **Où :** le succès s'attend à `{ asciidoc, conversionResult }` ; les échecs sont un résultat standardisé au niveau racine + `detail`.
 - **Risque :** **remodelage** / **ignorer partiellement** — pas d'analyse JSON explicite à double chemin ; les échecs ne peuvent jamais être interprétés comme des objets standardisés.

5. **Classification des erreurs client uniquement**
 - **Où :** `catch` utilise `AbortError`, vérifications de sous-chaînes réseau, générique `e.message`.
 - **Risque :** **acceptable** pour les véritables erreurs du client ; **trompeur** si une défaillance structurée du backend aurait pu être analysée mais n'a pas été tentée.

6. **Dérive à double chemin vs `convertText(...)`**
 - **Où :** `App.tsx` utilise `convertText(...)` pour la même paire de endpoints ; ce wrapper est facultatif/hérité.
 - **Risque :** **incohérent** comportement de premier contrat pour des routes backend identiques à moins que les deux chemins ne soient alignés et documentés.

7. **Aucun rappel pour le backend `ConversionResult` / état du contrat au niveau de l'application**
 - **Où :** le wrapper n'expose que les setters de chaîne/statut (pas de hook de style `setBackendConversionResult` dans la signature actuelle).
 - **Risque :** **ignorer partiellement** au niveau de l'application — les résultats structurés n'atteignent jamais l'état du contrat global lorsque ce wrapper est utilisé.

#### Points qui semblent déjà sûrs/protecteurs

- **S1 — Chargement du cycle de vie :** `setLoading(true)` pour la tentative ; `finally` efface toujours le chargement.
- **S2 — Pré-vérification locale vide :** évite un appel réseau lorsque l'entrée est vide (protection côté client ; distinct du backend `EMPTY_INPUT`).
- **S3 — Délai d'expiration limité :** AbortController limite les requêtes bloquées (sécurité côté client).

#### Points qui nécessitent encore un travail d'alignement (avant/pendant 12.4.4)

- **A1 — Succès du contrat en premier :** validez `data.conversionResult` avant de traiter la tentative comme un succès ; dériver `output` du contrat + `asciidoc` de manière cohérente.
- **A2 — Échec du premier contrat :** analyser JSON pour détecter un échec standardisé en cas de non-OK avant de revenir au texte.
- **A3 — Sortie périmée :** effacer ou marquer la sortie invalide lors de la tentative de démarrage et/ou en cas d'échec lorsqu'il est intégré au panneau de résultats.
- **A4 — Double chemin :** conserver le wrapper comportement aligné sur `convertText(...)` pour `/api/to-asciidoc`, ou documenter une divergence intentionnelle.

#### Comportement cible du frontend/UI (définition de l'étape 12 — base de 12.4.4)

##### Gestion du succès

 - **Doit** traiter la tentative comme réussie uniquement lorsque le backend fournit un succès standardisé `ConversionResult` (`success === true`, `error === null`) avec des champs obligatoires, portés sous `data.conversionResult` pour cet itinéraire.
- **Doit** utiliser `conversionResult` comme source de vérité pour la sémantique du succès ; **ne doit pas** déduire le succès à partir de `asciidoc` non vide seul.
- **Peut** définir une sortie AsciiDoc visible à partir de `data.asciidoc` **après** que la sémantique de succès soit validée (ou à partir des champs à l'intérieur de `conversionResult` lorsqu'ils sont cohérents).

##### Gestion des échecs

- **Doit** analyser l'échec standardisé JSON sur un HTTP non OK lorsque le corps est JSON, en préservant `error` et `error.code` lorsqu'ils sont présents.
- **Doit** utiliser les échecs structurés du backend comme enregistrement canonique des échecs lorsqu'ils sont disponibles ; utiliser les échecs de clients synthétiques uniquement lorsqu'aucun corps structuré n'existe.

##### Transitions inactive / chargement / succès / erreur

- **Doit** garder le chargement cohérent : `true` pendant la tentative, `false` dans `finally`.
- **Devrait** éviter de présenter une notification de réussite lorsque le contrat de réussite du backend est non satisfait.
- **Ne doit pas** laisser le résultat d'une tentative précédente visible comme s'il s'agissait du résultat d'une tentative infructueuse lorsque le panneau de résultats est intégré au contrat (règle de sortie périmée).

##### Interprétation acceptable

- **Acceptable :** chaînes françaises destinées à l'utilisateur en `setStatus` / `setNotification` tant que la sémantique du contrat structuré reste disponible pour l'appelant (via des rappels futurs ou une forme de retour dans une étape ultérieure).
- **Acceptable :** messages limités au client uniquement pour les véritables erreurs de délai d'attente/réseau lorsqu'aucun corps backend n'existe.

##### Aplatissement inacceptable ou comportement obsolète

- **Inacceptable :** traitement HTTP 200 comme succès si `conversionResult` est manquant ou `conversionResult.success !== true`.
- **Inacceptable :** rejet du `error.code` structuré lorsqu'un corps d'échec standardisé est disponible.
- **Inacceptable :** échec UX de chaîne uniquement lorsque l'échec JSON `ConversionResult` était disponible pour l'analyse.
- **Inacceptable :** affichant une sortie AsciiDoc obsolète après une tentative infructueuse sans effacement explicite ni marquage de l'état d'erreur.

#### Limite d'étape

Cette étape définit uniquement le risque front-end/UI et le comportement cible et ne démarre **pas** l'étape 12.4.4.

### Étape 12.4.4 — Correction du front-end/UI (Markdown → wrapper AsciiDoc)

- **Implémenté dans :** `api/frontend/src/converters/markdown-to-asciidoc.ts` → `convertMarkdownToAsciiDoc(...)`.
- **Remarque en anglais :** Le succès est contrôlé sur le backend `data.conversionResult` (`success === true`) avant d'écrire la sortie `asciidoc`. Les corps non OK sont lus une fois sous forme de texte puis analysés en JSON de manière à ce que les `error` / `error.code` structurés soient préservés lorsqu'ils sont présents. Les `setBackendConversionResult` et `setConversionUiState` facultatifs s'alignent sur le wrapper de l'étape 10 ; la sortie et le résultat du backend sont effacés au démarrage de la tentative pour éviter les erreurs ou les succès de l'UI.

#### Limite d'étape

Cette étape implémente uniquement la correction du wrapper de l'étape 12 et ne démarre **pas** l'étape 12.4.5.

### Étape 12.4.5 — Vérification + consolidation (étape 12 wrapper)

- **Portée :** `api/frontend/src/converters/markdown-to-asciidoc.ts` → `convertMarkdownToAsciiDoc(...)` uniquement.
- **Note de vérification en anglais :** Le chemin de réussite nécessite `data.conversionResult` avec `success === true` avant `setOutput(data.asciidoc)`. Les échecs HTTP utilisent une seule lecture de corps (`text` + `JSON.parse`) ; les échecs standardisés au niveau racine alimentent `createFailureResult` donc `error.code` survit à la normalisation ; la branche structurée stocke le même objet normalisé que la valeur de retour. Chaque nouvelle tentative efface la notification, la sortie et le résultat facultatif du backend, définit le chargement, puis l'état facultatif de l'UI `loading` ; `finally` efface toujours le chargement. Les échecs client uniquement (prévérification vide, délai d'attente, réseau) émettent un `ConversionResultFailure` synthétique avec une méta explicite. Petit suivi : la vérification préalable efface la notification pour éviter un toast de réussite obsolète ; l'échec HTTP structuré utilise un objet normalisé pour le rappel et le retour.

#### Limite d'étape

Cette étape enregistre uniquement la vérification et ne démarre **pas** l'étape 12.6.1.

### Étape 12.5.1 — Comparaison de flux croisés (étape 12 vs validation flux)

**Portée de l'étape 12 (cette comparaison) :** route backend `POST /api/to-asciidoc` plus wrapper frontend `api/frontend/src/converters/markdown-to-asciidoc.ts` → `convertMarkdownToAsciiDoc(...)`.

**Référence validée/homologue (référence déjà documentée) :** la référence multi-flux inclut **Markdown → AsciiDoc** comme deuxième flux migré (voir Étape 7.6.2 / Étape 8.6.2). L'homologue **au niveau du wrapper** le plus proche pour le comportement du frontend est l'**Étape 10** (`convertAsciiDocToMarkdown`, `POST /api/to-markdown`) : même modèle intentionnel (le wrapper du premier contrat, `App.tsx` utilise toujours principalement `convertText(...)`). D'autres flux validés (**Texte → Markdown**, Étape 7 ; **`POST /api/from-html`** multi-cible, Étape 8) partagent la même posture de contrat de haut niveau + de vérification en couches mais diffèrent davantage par le moteur, l'enveloppe ou l'entrée de l'UI (`generic-converter` accent) ; ils sont référencés ici pour des raisons d'exhaustivité de base, tandis que l'**Étape 10 par rapport à l'Étape 12** est la comparaison de pommes à pommes la plus serrée.

#### Construction des résultats du convertisseur

| Aspects | Cohérent | Différent mais acceptable |
| --- | --- | --- |
| Back-end | `createSuccessResult(...)` / `createFailureResult(...)` (ou des constructeurs spécifiques à une route tels que `buildToAsciidocFailure`) produisent des formes canoniques `ConversionResult` à la limite HTTP ; le succès porte `conversionResult` imbriqué, les échecs sont des objets standardisés au niveau racine + `detail`. | Les champs de moteur et de charge utile diffèrent (sortie Pandoc markdown → asciidoc vs downdoc/lazyload markdown pour `to-markdown`). |
| Wrapper frontal | Les champs locaux `createSuccessResult` / `createFailureResult` reflètent les champs backend dans une valeur de retour normalisée ; la vérification préalable du client vide renvoie un échec synthétique `EMPTY_INPUT`. | Le wrapper de l'étape 10 inclut des paramètres **modaux** facultatifs et des branches supplémentaires (voir ci-dessous) ; Ce n’est pas le cas de l’emballage de l’étape 12 : surface plus étroite. |

#### Préservation du backend/orchestrateur

- **Cohérent :** Les cibles de préservation au niveau de la route sont explicites (`conversion.routes.js`) ; les erreurs internes sont classées et mappées sur des échecs structurés plutôt que sur des corps HTTP contenant uniquement des chaînes ; la vérification est basée sur des scripts (Étape 12 : `verify-e2e-to-asciidoc-*` ; Étape 10 : `verify-e2e-to-markdown-*` et scripts orientés lazyload).
- **Différence acceptable :** `to-asciidoc` utilise l'orchestration Pandoc directe et `classifyToAsciidocInternalError` + `collectAsciidocErrorMessages` ; `to-markdown` utilise un downdoc chargé paresseux et différents générateurs d'échecs : la topologie correspond à la règle validée du « moteur spécifique au chemin ».

#### Frontend / Préservation de l'UI

- **Cohérent :** Le succès n'est **pas** déduit du seul texte de sortie brut : `data.conversionResult` doit exister et `success === true` avant succès de l'UI et de l'écriture de la sortie principale (`asciidoc` / `markdown` respectivement). Les réponses non OK tentent d’abord de consommer des échecs JSON structurés. De nouvelles tentatives effacent la sortie/notification antérieure (et le support de résultat backend facultatif) pour limiter l'UI obsolète.
- **Différent mais acceptable :** Fils d'emballage de l'étape 10 **modaux d'erreur facultatifs** et un chemin **piloté par code** `shouldShowConversionErrorModalForCode` plus une heuristique de **forme de sortie** mise à la terre pour les mauvaises sorties connues. Le wrapper de l'étape 12 n'a **pas** de paramètres modaux, ce qui est acceptable car les modes de défaillance dominants diffèrent et l'étape 12 reste limitée à la portée du wrapper.
- **Divergence remarquable (documentée ailleurs) :** Pour les mêmes endpoints, **`App.tsx` utilise `convertText(...)`** comme chemin en direct ; les wrappers dédiés (étape 10/étape 12) sont des surfaces **parallèles et vérifiées** jusqu'à ce que la consolidation du routage soit explicitement dans la portée.

#### Forme de gestion des erreurs

- **Cohérent :** Les échecs structurés du backend conservent `error` et, le cas échéant, **`error.code`** dans la messagerie de l'UI (par exemple, notification suffixe) et dans les retours normalisés `ConversionResult`. Les échecs client uniquement (délai d'expiration, réseau, analyse) utilisent des échecs synthétiques avec `meta.stage` / `uiWrapper` explicites pour la traçabilité.
- **Différent mais acceptable :** La gestion non OK de l'étape 12 utilise une **lecture d'un seul corps** (`text` puis `JSON.parse`) pour éviter de consommer deux fois le flux de réponse ; La mise en œuvre de l'étape 10 mélangeait historiquement des modèles `json`/`text` par endroits. L'approche de l'étape 12 est une **amélioration de la clarté locale**, et non une division du contrat.
- **Peut nécessiter une attention ultérieure :** **déduplication** à long terme de blocs d'assistance identiques (`normalizeError`, `createSuccessResult`, etc.) entre les wrappers pour réduire la dérive - hors de portée de l'étape 12.5.1.

#### Gestion des états

- **Cohérent :** `setLoading(true)` pour les tentatives qui entrent dans le `try` ; **`finally` toujours** `setLoading(false)` ; les chemins de défaillance effacent `setOutput('')` le cas échéant ; `setConversionUiState('loading' | 'success' | 'error')` facultatif lorsqu'il est fourni.
- **Différent mais acceptable :** L'étape 10 efface également l'état modal facultatif au démarrage de la tentative ; L'étape 12 n'a aucun modal – rien à effacer.

#### Style de vérification

- **Cohérent :** **Vérification en couches** : scripts de contrat backend e2e (succès, échec, scénarios représentatifs, erreur interne le cas échéant) ; **documentation** frontend du comportement et de la consolidation du contrat d'abord (l'étape 12.3.5/12.4.5 reflète le style de l'étape 10.3.5/10.4.x).
- **Différent mais acceptable :** Le script **les noms et les décomptes** diffèrent selon la route ; La section backend de l'étape 10 fait référence à des sondes de module lazyload supplémentaires, adaptées à l'architecture de `to-markdown`.

#### Résumé : cohérent vs acceptable vs attention ultérieure

- **Cohérent :** Standardisé `ConversionResult` en tant que source sémantique de vérité à la frontière et dans le chemin de retour du wrapper ; échecs structurés avec `error.code` là où le backend les fournit ; cycle de vie de chargement cohérent ; atténuation des sorties obsolètes lors de nouvelles tentatives ; vérification e2e limitée par itinéraire.
- **Différent mais acceptable :** Moteur/orchestration et scripts spécifiques au chemin ; Étape 10 modale + UX heuristique vs API plus fine de l'étape 12 ; noms des champs de sortie (`asciidoc` vs `markdown`).
- **Peut nécessiter une attention ultérieure (non bloquant pour l'étape 12) :** Routage d'application par rapport aux wrappers dédiés ; module d'assistance frontal partagé pour éviter les définitions `createSuccessResult` / `createFailureResult` en double ; alignement facultatif de `convertText` avec chaque comportement de wrapper dédié une fois le routage unifié.

#### Limite d'étape

Cette étape enregistre uniquement la comparaison de flux croisés et ne démarre **pas** l'étape 12.5.2.

### Étape 12.5.2 — Conformité du playbook de migration de l'étape 6 (étape 12 flux)

**Référence du Playbook :** Étape **6.3.3** — *Liste de contrôle de migration requise (éléments 1 à 17)* et notes *Conditionnelles/si applicable*.

**Preuve de l'étape 12 dans ce document :** Étapes **12.1.x** à **12.5.1** (confirmation de l'entrée, gel de la portée, mappage d'exécution + charge utile, alignement/correction/vérification du backend, alignement/remédiation/vérification du frontend, comparaison de flux croisés).

#### Mappage de la liste de contrôle (éléments 1 à 17)

| # | Élément du manuel de jeu | Étape 12 preuves | Force d'achèvement |
| --- | --- | --- | --- |
| 1 | Confirmer l'état de préparation du candidat (critères minimaux de l'étape 6.2.2) | **12.1.1** (flux d'entrée + go/no-go à partir du transfert de l'étape 11), **12.1.2** (gel de la portée) | **Plus léger mais acceptable :** la préparation est encadrée via le transfert de l'étape 11 + la portée gelée plutôt que de répéter textuellement l'étape 6.2.2 ; l'intention correspond à la porte du playbook. |
| 2 | Cartographier le flux d'exécution actuel (succès, échec, erreur interne) | **12.2.1** | **Clairement complété** |
| 3 | Mappez les champs de charge utile en entrées `createSuccessResult()` / `createFailureResult()` | **12.2.2** | **Clairement complété** |
| 4 | Intégrer la construction standardisée des résultats du chemin de réussite | Route backend + assistants (voir **12.3.x**) ; **12.3.4** le cas échéant | **Clairement complété** |
| 5 | Intégrer la construction standardisée des résultats du chemin de défaillance | Route backend + modèle `buildToAsciidocFailure` ; **12.3.4** | **Clairement complété** |
| 6 | Harmoniser le comportement des erreurs internes dans une sémantique de défaillance structurée | **12.3.4** (`collectAsciidocErrorMessages`, `classifyToAsciidocInternalError`, `convert.js` provoquent un chaînage) ; **12.3.5** script d'erreur interne | **Clairement complété** |
| 7 | Exécuter une vérification de convertisseur/chemin isolé (kit minimum) | **12.2.6** ; Scripts e2e répertoriés dans **12.3.5** | **Clairement complété** |
| 8 | Identifier la cible d'alignement backend/orchestrateur | **12.3.1** | **Clairement complété** |
| 9 | Cartographier la propagation des succès/échecs du backend et les points de risque du contrat | **12.3.2**, **12.3.3** | **Clairement complété** |
| 10 | Appliquer une correction minimale du backend | **12.3.4** | **Clairement complété** |
| 11 | Vérifier le comportement du contrat de limite de sortie backend | **12.3.5** | **Clairement complété** |
| 12 | Identifier la cible d'alignement frontend/UI (si orientée utilisateur) | **12.4.1** | **Clairement complété** (un chemin destiné à l'utilisateur existe ; le wrapper est la cible d'alignement délimitée – voir la note conditionnelle ci-dessous). |
| 13 | Cartographier la consommation de succès/échec du frontend et le comportement de l'état | **12.4.2**, **12.4.3** | **Clairement complété** |
| 14 | Appliquer une correction minimale du frontend | **12.4.4** | **Clairement complété** |
| 15 | Vérifier la cohérence des limites de l'UI + les garanties obsolètes | **12.4.5** | **Clairement complété** |
| 16 | Passe finale de non-régression multicouche (kit minimum) | **12.3.5** + **12.4.5** + récit de réexécution du script enchaîné | **Clairement complété** (scripts backend explicites ; frontend vérifié via consolidation + attente de vérification de type lors du transfert, pas un chapitre vitest distinct de l'étape 12). |
| 17 | Comparaison/consolidation des chemins d'enregistrement par rapport aux flux migrés | **12.5.1** | **Clairement terminé** |

#### Éléments conditionnels du playbook (étape 6.3.3)

- **Alignement du frontend face à l'utilisateur :** L'étape 12 applique **12.4.x** au **wrapper** (`markdown-to-asciidoc.ts`). **`App.tsx` utilise toujours `convertText(...)`** pour la même paire de endpoints ; cela correspond au modèle **Étape 10** (alignement au niveau du wrapper en premier, consolidation du routage des applications différée). **Classification :** **Plus léger mais acceptable** achèvement des éléments 12 à 15 par rapport à une entrée hypothétique « uniquement App.tsx » – toujours fondée et documentée.
- **Sondes de défaillance interne spécifiques au moteur :** **12.3.5** références `verify-e2e-to-asciidoc-internal-error-contract.js`. **Classification :** **Clairement complété** (conditionnellement satisfaite lorsque cela est possible).
- **Compatibilité-wrapper / chevauchement hérité :** `detail` + `asciidoc` les champs de niveau supérieur sont documentés ; **12.4.x** traite de la consommation du wrapper. **Classification :** **Clairement complété** le cas échéant.

#### Déviations fondées (non bloquantes)

1. **Porte de préparation (élément 1) :** Exprimé via le transfert de l'**étape 11** + le gel **12.1.2** plutôt qu'une nouvelle liste de contrôle autonome de l'étape 6.2.2. **Classification :** séquençage acceptable ; même intention que les notes du playbook de style étape 7.5.2.
2. **Entrée principale de l'UI par rapport à la cible d'alignement :** L'environnement d'exécution du produit utilise **`convertText`** ; Étape 12 **Corrigé le wrapper dédié** uniquement. **Classification :** **déviation fondée** (routage), **acceptable** dans le cadre du playbook « frontend conditionnel » et du précédent de l'étape 10 ; **peut nécessiter une attention ultérieure** si le routage est unifié.
3. ** Passage multicouche (élément 16) : ** Le backend est piloté par script ; La consolidation du frontend est un **documentaire + récit de vérification** dans **12.4.5** plutôt qu'un chapitre distinct « Suite Vitest frontend de l'étape 12 ». **Classification :** **plus légère mais acceptable**, alignée sur la formulation de style étape 8.5.2 où les contrôles exécutables + les preuves de consolidation suffisent.

#### Déclaration de conformité globale

Le flux de l'étape 12 (**Markdown → AsciiDoc**, `POST /api/to-asciidoc` + `markdown-to-asciidoc.ts` wrapper) **est globalement conforme** à le playbook de migration de l'**étape 6.3.3** : **les éléments requis 1 à 17 sont satisfaits** avec les preuves des étapes **12.1.x à 12.5.1**, et **aucun signal d'arrêt/de report du playbook** de l'étape 6.3.3 n'est déclenché pour cette portée limitée. Les lacunes restantes sont **documentées, délimitées et acceptables** (routage wrapper-first vs `App.tsx` ; cadrage de préparation léger).

#### Limite d'étape

Cette étape enregistre uniquement l'évaluation de la conformité du playbook et ne démarre **pas** l'étape 12.5.3.

### Étape 12.5.3 — Observations d'exécution (surprises, frictions, écarts, étape 12)

Cette sous-étape enregistre les surprises et frictions **fondées** observées lors de l'exécution du flux de l'étape 12 (**Markdown → AsciiDoc**, `POST /api/to-asciidoc` + `markdown-to-asciidoc.ts`), à travers la migration du convertisseur, l'alignement backend, l'alignement frontend et la vérification/consolidation. Il ne rouvre **pas** les décisions de migration fermées ; il préserve la traçabilité pour les responsables et l'affinement futur du playbook.

#### Migration du convertisseur

| Observations | Catégorie | Remarques |
| --- | --- | --- |
| **Champs de transport doubles en cas de succès** (`asciidoc` chaîne de premier niveau **et** imbriquée `conversionResult`) | Comportement spécifique au chemin / friction contractuelle | Les consommateurs doivent traiter **`conversionResult` comme source sémantique de vérité** ; la chaîne AsciiDoc en double est respectueuse de l'héritage mais crée un risque **double canal** si l'une est validée et l'autre ignorée (atténuée dans **12.4.4** pour le wrapper). |
| **Duplication de l'assistant frontal** (`createSuccessResult` / `createFailureResult` / `normalizeError` dupliqué par module wrapper) | Candidat ultérieur au raffinement du playbook | Même modèle qu’à l’étape 10 ; augmente le risque de dérive sur les petites modifications. Acceptable pour la portée limitée de l’étape 12 ; Le **module partagé** reste un futur objectif de consolidation (**12.5.1**). |

#### Alignement backend/orchestrateur

| Observations | Catégorie | Remarques |
| --- | --- | --- |
| **Pandoc en tant que dépendance d'exécution externe** | Dépendance cachée / surprise opérationnelle | Le comportement de la route dépend d'une **installation Pandoc fonctionnelle** et d'une exécution stable du processus ; les échecs apparaissent via des messages spécifiques au moteur, nécessitant une **classification** plutôt qu'une seule chaîne générique (**12.3.4**). |
| **Profondeur de la surface d'erreur (relance du wrapper + chaîne `cause`)** | Complexité d'exécution inattendue | La correction initiale de l'étape 12 nécessitait un chaînage **`Error.cause`** dans `convert.js` et **`collectAsciidocErrorMessages`** afin que la classification des routes voie la **chaîne de messages complète**, et pas seulement le texte de l'enveloppe externe (**12.3.4**). |
| ** Limite `CONVERSION_FAILED` vs `INTERNAL_ERROR` ** | Forme d'erreur / frottement de propagation | La classification est **heuristique de message** ; fondé mais sensible aux changements de formulation dans les couches inférieures — **doit rester documenté** pour toute personne réglant les chemins d'erreur Pandoc. |
| **Enveloppe de défaillance au niveau racine + `detail`** | Modèle de compatibilité acceptable | Comme pour les autres routes migrées : les clients peuvent lire `detail` tandis que les consommateurs sous contrat utilisent `error` structuré ; **ce n'est pas un défaut** si les deux restent renseignés de manière cohérente (**12.3.3** / **12.3.5**). |

#### Alignement frontend/UI

| Observations | Catégorie | Remarques |
| --- | --- | --- |
| **`App.tsx` utilise `convertText(...)`, pas le wrapper de l'étape 12** | Frottement architectural fondé | **Deux surfaces d'ingestion** pour le même endpoint (**12.4.1**) ; l'emballage est vérifié de manière isolée. **Doit rester documenté** jusqu'à ce que le routage soit intentionnellement unifié (**12.5.1**, **12.5.2**). |
| **Succès vs échec Asymétrie de l'enveloppe JSON** (imbriqué `conversionResult` sur le succès vs l'échec au niveau racine) | Frottement en forme d'erreur | Le frontend doit implémenter **l'analyse à double chemin** (`!res.ok` vs `res.ok`) ; Le wrapper de l’étape 12 résout ce problème explicitement (**12.4.3** / **12.4.4**). |
| **Facultatif `setBackendConversionResult` / `setConversionUiState` non câblé à partir de `App.tsx` pour ce wrapper** | Vérification/écart d'état (limité) | L'état du contrat global peut **ne pas** refléter les tentatives de wrapper à moins qu'un appelant ne transmette les paramètres —**acceptable** pour la portée du wrapper existant ; **raffinement ultérieur** si l'application passe au wrapper. |

#### Vérification et consolidation

| Observations | Catégorie | Remarques |
| --- | --- | --- |
| **La course e2e enchaînée a nécessité un ajustement du harnais** (modèle `verify-e2e-to-asciidoc-representative-scenarios.js` + `process.exit`) | Surprise acceptable | **Écart de vérification** dans le script (blocage de la boucle d'événement), pas dans le code produit (**12.3.5**). **Classe de problèmes** qui doit rester dans les notes de version/le document contractuel pour des exécutions enchaînées reproductibles. |
| **Vérification frontend principalement documentaire (12.4.5) vs chapitre dédié Vitest** | Achèvement plus léger | Les scripts backend exécutables contiennent la preuve automatisée la plus lourde ; La consolidation frontend est **preuve + récit** — alignée sur les notes d'écart **12.5.2**. **Affinement ultérieur :** tests facultatifs au niveau du wrapper si le routage favorise le wrapper. |
| **La sonde d'erreur interne dépend de la faisabilité de l'injection de défauts** | Gestion spécifique au chemin | L'injection de défaillance du chemin Pandoc est **spécifique au moteur** ; élément conditionnel du playbook satisfait là où il est sûr (**12.3.5**). |

#### Surprises acceptables (non bloquantes)

- **La charge utile de réussite à double champ** et **l'échec racine + `detail`** sont des choix de **compatibilité documentée**, et non une dérive ad hoc, tant que `ConversionResult` reste canonique.
- **Correspondances d'alignement de l'UI au niveau du wrapper uniquement** **Étape 10** précédente et portée **12.1.2** gelée.
- **Comportement de sortie du script des scénarios représentatifs** corrigé avec un **petit changement de harnais uniquement** : friction opérationnelle acceptable.

#### Candidats ultérieurs au raffinement du playbook

- Puce explicite du playbook pour **"assistant ConversionResult de l'interface partagée module"** après que N wrappers dupliquent les mêmes blocs.
- Liste de contrôle explicite **"double entrée d'application vs wrapper dédié"** lorsque le même endpoint `fetch` apparaît dans `generic-converter` et un wrapper hérité.
- **Modèle de script e2e chaîné** (retardé `process.exit`) promu en **script npm partagé** ou extrait de document à éviter blocages ponctuels par itinéraire.

#### Problèmes qui doivent rester documentés (jusqu'à ce que le produit change)

- **Deux chemins d'ingestion en direct** (`convertText` contre `convertMarkdownToAsciiDoc`) pour **`/api/to-asciidoc`**.
- **Classification heuristique des erreurs internes** pour les échecs Pandoc (`classifyToAsciidocInternalError` + chaîne de messages) — toute modification du texte d'erreur en amont peut décaler les codes.
- **Exigence de **faisceau de vérification** pour les exécutions enchaînées sur un script de **scénarios représentatifs** (voir **12.3.5**).

#### Limite d'étape

Cette étape enregistre uniquement les observations d'exécution et ne démarre **pas**r l'étape 12.5.4.

### Étape 12.5.4 — Validation du cycle de l'étape 12 et préparation à la fermeture

**Entrées de validation utilisées :** vérification isolée (**12.2.6**), vérification de la correction du backend/orchestrateur (**12.3.5**), vérification de la correction du frontend/UI (**12.4.5**), comparaison de flux croisés (**12.5.1**), playbook conformité (**12.5.2**) et observations d'exécution (**12.5.3**).

#### Ce qui est validé

- **Flux migré et standardisé :** `POST /api/to-asciidoc` produit des formes standardisées de réussite/échec `ConversionResult` (imbriquées `conversionResult` en cas de succès ; échec au niveau racine + `detail`); le wrapper de l'étape 12 (`markdown-to-asciidoc.ts`) consomme et renvoie une sémantique `ConversionResult` alignée selon **12.4.4** / **12.4.5**.
- **La préservation du backend/orchestrateur fonctionne :** La route + le chemin du moteur préservent le succès/l'échec structuré, `error.code` pour les cas fondés, l'harmonisation des erreurs internes via la classification + `cause` chaînage (**12.3.4**, **12.3.5**) ; Les scripts e2e (`verify-e2e-to-asciidoc-success-contract.js`, `verify-e2e-to-asciidoc-failure-contract.js`, `verify-e2e-to-asciidoc-representative-scenarios.js`, `verify-e2e-to-asciidoc-internal-error-contract.js`) sont réexécutés et enregistrés **passage** en consolidation.
- **La préservation du frontend/UI fonctionne (cible de l'étape 12) :** Wrapper traite le backend `conversionResult` comme une source de vérité de succès, préserve les échecs structurés (y compris `error.code`), cohérent `loading`/tentative de réinitialisation, facultatif `setBackendConversionResult` / `setConversionUiState` (**12.4.5**).
- **Comparaison de flux croisés enregistrée :** **12.5.1** documente la cohérence par rapport aux pairs de l'étape 10 et la ligne de base validée ; les différences acceptables spécifiques au chemin sont explicites.
- **Conformité du Playbook enregistrée :** **12.5.2** cartographie l'étape **6.3.3**, éléments 1 à 17 jusqu'à l'étape 12, preuves ; conformité globale **oui**, avec des écarts légers limités documentés.
- **Observations d'exécution enregistrées :** **12.5.3** capture les surprises/frictions au sol ; aucun ne constitue un bloqueur **majeur** non résolu pour la portée indiquée de ce cycle (**12.1.2**).
- **Les contrôles pertinents réussissent :** Le kit de contrat backend pour cette route est **explicite et vert** dans le récit du document ; La vérification frontend est **consolidation + comportement de priorité au contrat** dans le wrapper (**12.4.5**, **12.5.2** note de l'article 16) — alignée sur la posture de vérification acceptée de l'étape 12.
- **Aucun bloqueur majeur non résolu :** Les signaux d'arrêt/différation de l'étape **6.3.3** ne sont **pas** déclenchés pour la portée de l'étape 12 gelée ; les éléments restants sont des différences **résiduelles documentées**, et non des défauts bloquants.

#### Ce qui reste acceptable mais non bloquant

- **Ingestion double frontend pour le même endpoint :** `convertText(...)` reste le chemin `App.tsx` actif tandis que le wrapper Step 12 est aligné de manière isolée—**documenté** (**12.4.1**, **12.5.1**, **12.5.3**), même modèle qu'à l'étape 10.
- **Asymétrie de l'enveloppe succès/échec** (succès imbriqué `conversionResult` vs échec au niveau racine + `detail`) —**explicitement géré** dans le wrapper ; compatibilité `detail` conservée.
- **Blocs d'assistance frontend dupliqués** entre les wrappers—**acceptable** pour ce cycle ; **candidat de raffinement** (**12.5.3**).
- **Exécution dépendant de Pandoc** et **classification heuristique des erreurs internes**—**fondée et documentée** ; les opérateurs/mainteneurs doivent respecter la stabilité du texte d'erreur en amont (**12.5.3**).
- **Les scénarios représentatifs du harnais e2e** nécessitaient une **petite stabilisation `process.exit`** — harnais uniquement ; **documenté** (**12.3.5**).
- **Frontend proof mettant l'accent** sur les scripts backend e2e + récit de consolidation plutôt qu'un chapitre vitest de l'étape 12 autonome—**non bloquant** selon **12.5.2** / **12.5.3**.

#### Décision de clôture

- **Décision :** **Le cycle de l'étape 12 est suffisamment propre pour la fermeture** dans le cadre gelé (**12.1.2**) : Markdown → AsciiDoc (`POST /api/to-asciidoc`) + `convertMarkdownToAsciiDoc(...)` alignement et vérification du wrapper.
- **Justification :** La migration, la préservation du backend, la préservation du wrapper frontend, la vérification en couches, la comparaison des flux croisés, la conformité du playbook et les observations d'exécution sont **complètes et enregistrées** ; les différences résiduelles sont **acceptables, explicites et non bloquantes**.

### Étape 12.6.1 — Résumé de l'exécution de l'étape 12 (ce qui s'est réellement exécuté)

- **Flux exécuté :** L'étape 12 a exécuté l'entrée limitée **Markdown → AsciiDoc** via **`POST /api/to-asciidoc`**, avec la surface frontend sélectionnée **`api/frontend/src/converters/markdown-to-asciidoc.ts`** → **`convertMarkdownToAsciiDoc(...)`** (gel de la portée **12.1.2**).

#### Travail au niveau du convertisseur

- Conversion **Pandoc** confirmée via **`convertMarkdownWithPandoc`** derrière l'itinéraire ; le **cartographie de la charge utile d'assistance** documentée dans les entrées `createSuccessResult` / `createFailureResult` (**12.2.2**).
- **Le `ConversionResult`** standardisé à la limite de la route pour le succès et l'échec était la ligne de base ; Le travail de l'étape 12 a mis l'accent sur la **préservation**, le **contexte d'erreur interne** (chaîne de causes/classification) et la **vérification** plutôt que le remplacement du moteur.

#### Travail backend/orchestrateur

- **Cible :** `api/backend/routes/conversion.routes.js` **`/to-asciidoc`** + `api/backend/services/conversion/convert.js` (Pandoc chemin).
- **Correction (12.3.4) :** **`Error.cause` chaînage** lors du nouveau lancement, **`collectAsciidocErrorMessages`**, **`classifyToAsciidocInternalError`** mises à jour afin que les échecs de route restent **structurés** et que les codes restent **fondé** lorsque cela est possible.
- **Vérification (12.3.5) :** Réexécution **`verify-e2e-to-asciidoc-success-contract.js`**, **`verify-e2e-to-asciidoc-failure-contract.js`**, **`verify-e2e-to-asciidoc-representative-scenarios.js`** (plus harnais **`process.exit`** stabilisation), **`verify-e2e-to-asciidoc-internal-error-contract.js`**.

#### Travail frontend/UI

- **Cible :** **`convertMarkdownToAsciiDoc(...)`** (**12.4.4**) : contrat d'abord **`data.conversionResult`** gate, gestion structurée du JSON non OK (lecture d'un seul corps), **`error.code`** dans l'UX le cas échéant, atténuation des états obsolètes au niveau de la tentative, facultatif **`setBackendConversionResult`** / **`setConversionUiState`**.
- **Consolidation (12.4.5) :** Récit de vérification du wrapper enregistré ; **n'a pas** recâblé **`App.tsx`**—**`convertText(...)`** reste le chemin actif pour la même paire de endpoints (**12.4.1**).

#### Travaux de vérification et de consolidation

- **Contrôles isolés/de flux :** **12.2.6** et suite backend e2e ci-dessus (**12.3.5**).
- **Transversal :** **12.5.1** (comparaison), **12.5.2** (étape **6.3.3** playbook), **12.5.3** (observations), **12.5.4** (préparation à la clôture).

#### Quelle étape 12 confirmé

- **Markdown → AsciiDoc** est **migré et standardisé** à la **limite HTTP** et sur le **wrapper de l'étape 12** pour la sémantique **`ConversionResult`** de contrat d'abord dans la portée gelée.
- **La préservation du backend** et la **préservation du frontend au niveau du wrapper** fonctionnent comme prévu lors de la vérification ; **la double entrée résiduelle** (`convertText` vs wrapper) est **documentée**, pas une dérive silencieuse.
- Le playbook de l'**étape 6** s'applique à ce cycle avec des écarts **limités et documentés** (**12.5.2**).

#### Ce qui reste en dehors de la portée de l'étape 12

- **`App.tsx` unification du routage** avec le wrapper dédié (ou une passe de parité comportementale complète) en tant qu'élément de **suivi**.
- **`POST /api/convert`** famille large, **`POST /api/from-html`** / autres vagues différées, **déduplication d'assistance **globale**, **refonte de l'UI**.
- **Étape 13** planification/exécution—**non démarrée** ici.

#### Limite de l'étape

Cette étape enregistre uniquement le résumé de l'exécution et ne démarre **pas** l'étape 12.6.2.

### Étape 12.6.2 — Mise à jour de la ligne de base multi-flux (l'ensemble de référence validé inclut l'étape 12)

#### Ensemble de référence validé (élargi)

La ligne de base multi-flux validée inclut désormais explicitement l'**Étape 12** en tant qu'**unité d'exécution validée** supplémentaire pour le chemin **Markdown → AsciiDoc** :

- **Route backend (endpoint inchangé) :** `POST /api/to-asciidoc` (soutenu par Pandoc) — fait déjà partie de la ligne de base en tant que **deuxième flux migré** (voir Étape 7.6.2 / Étape 8.6.2).
- **Ajout de l'étape 12 (nouvelle surface d'alignement) :** le **wrapper frontend hérité** `api/frontend/src/converters/markdown-to-asciidoc.ts` (`convertMarkdownToAsciiDoc(...)`) est désormais **aligné sur le contrat, vérifié et accepté** dans le cadre de l'ensemble de référence pour cet itinéraire.

La ligne de base inclut donc, pour **`/api/to-asciidoc`**, à la fois **générique `convertText(...)` gestion du contrat en premier** (chemin d'accès actif à l'application) et un modèle de préservation de contrat **direct, au niveau du wrapper** (sans ajouter de nouveau endpoint de conversion backend) reflétant le modèle de l'étape **10** pour **`/api/to-markdown`**.

#### Flux précédemment validés (contexte)

Le plus large L'ensemble validé inclut toujours les flux documentés précédemment : par ex. **AsciiDoc → Markdown** (`/api/to-markdown`, downdoc), **Markdown → AsciiDoc** au point final (**`/api/to-asciidoc`**), **Text → Markdown** (Étape 7), **`POST /api/from-html`** multi-cible (Étape 8), plus la validation explicite **wrapper** de **Étape 10** sur **`asciidoc-to-markdown.ts`**. **Étape 12** étend la même idée sur le wrapper de la route dédiée **direction inverse**.

#### Ce qui reste commun à travers les flux validés

- **Sémantique `ConversionResult` standardisée** sur le succès et l'échec : `error` / `error.code` structuré le cas échéant, champs racine obligatoires (y compris les collections `warnings`, `logs`, `meta`).
- **Préservation des limites d'abord :** les réponses HTTP backend et les couches d'ingestion (convertisseur générique et/ou wrappers dédiés le cas échéant) traitent les résultats standardisés comme la source de vérité plutôt que les formes héritées aplaties ad hoc.
- **Posture de vérification reproductible :** sondes de réussite/échec des contrats, scénarios représentatifs le cas échéant, sondes d'erreurs internes une fois mises à la terre, plus consolidation au niveau du cycle (conformité du playbook, comparaison de flux croisés, observations d'exécution).

#### Ce qui reste spécifique au chemin mais acceptable

- **Topologie du moteur :** Pandoc (`to-asciidoc`) vs downdoc/lazyload (`to-markdown`) vs text2markdown / HTML multi-cible – attendu dans le cadre du modèle de migration limité.
- **Topologie frontend :** **L'étape 12** valide un **wrapper autonome** tandis que **`App.tsx`** peut toujours appeler **`convertText(...)`** pour le même endpoint — la double surface est **documentée** (même modèle que l'étape **10**).
- **Asymétrie de l'enveloppe** (succès imbriqué `conversionResult` vs échec au niveau racine + `detail`) et **compatibilité `detail`**—gérée explicitement par flux.
- **Emphase sur la vérification :** les scripts backend e2e contiennent une preuve automatisée solide pour les routes ; les cycles de wrapper peuvent s'appuyer en outre sur un **récit de consolidation** lorsque cela est acceptable (**12.4.5** / **12.5.2**).

#### Ce que cela améliore pour la confiance en matière de migration future

- **Preuve symétrique :** les deux **itinéraires aller-retour du texte principal** (`/api/to-markdown` et `/api/to-asciidoc`) ont désormais une histoire d'alignement **documentée et vérifiée au niveau du wrapper** (étape **10** + étape **12**), pas seulement le endpoint + `convertText` comportement.
- Renforce le fait que le playbook **Étape 6** s'applique aux **modules wrapper hérités** nommés dans les transferts, pour les chemins **Pandoc** ainsi que **downdoc**.
- Rend la **détection de dérive** plus facile : même endpoint, **deux surfaces d'ingestion frontend** (`convertText` vs wrapper dédié) est un point de comparaison de base explicite pour **Markdown → AsciiDoc** car il était déjà pour **AsciiDoc → Markdown**.

#### Limite d'étape

Cette étape enregistre uniquement l'expansion de la ligne de base et ne démarre **pas** l'étape 12.6.4.

### Étape 12.6.3 — Definition of Done de l'étape 12

L'étape 12 est complète uniquement si tous les critères ci-dessous sont vrais :

- Le flux d'entrée de l'étape 12 a été confirmé.
- La portée de l'étape 12 a été gelée.
- Le flux d'exécution a été mappé.
- Le mappage de la charge utile de l'assistance a été documenté.
- L'intégration du chemin de réussite a été terminée.
- L'intégration du chemin d'échec a été terminée.
- L'harmonisation des erreurs internes a été terminée.
- Vérification isolée réussie.
- L'alignement backend/orchestrateur a été terminé.
- La vérification backend/orchestrateur a réussi.
- L'alignement frontend/UI a été terminé.
- La vérification du frontend/UI a été réussie.
- La comparaison des flux croisés a été terminée.
- La conformité du playbook a été vérifiée.
- Les observations d'exécution ont été documentées.
- Le cycle a été validé comme étant suffisamment propre pour être fermé.
- La ligne de base multi-flux a été mise à jour.

#### Ce que l'étape 12 ne nécessite pas

- Large consolidation du routage `App.tsx` (chemin actif `convertText(...)` vs unification du wrapper dédié) au-delà de la documentation de la double surface.
- Migration ou refonte de la famille générique `POST /api/convert`, `POST /api/from-html` vagues différées ou globale extraction du module d'assistance, sauf notes explicitement hors de portée.
- Refonte globale de l'UI ou refactorisation de l'architecture transversale.
- Démarrage du travail d'exécution de l'**étape 13** à partir de cette Definition of Done seule.

#### Limite de l'étape

Cette étape enregistre la définition de l'étape 12 de Terminé uniquement et ne démarre **pas**r l'étape 12.6.4.

### Étape 12.6.4 — Clôture de l'étape 12

## Clôture de l'étape 12

Step 12 exécutée **un flux réel supplémentaire** : **Markdown → AsciiDoc** jusqu'à **`POST /api/to-asciidoc`**, avec l'entrée wrapper sélectionnée **`convertMarkdownToAsciiDoc(...)`** dans **`api/frontend/src/converters/markdown-to-asciidoc.ts`** comme surface d'exécution délimitée (portée gelée **12.1.2**).

**Ce que l'étape 12 a réalisé :** **la migration du convertisseur** a été **terminée** pour ce flux (sémantique `ConversionResult` standardisée préservée à la limite de la route avec conversion basée sur Pandoc). **L'alignement backend/orchestrateur** a été **terminé** pour ce flux (contexte d'erreur route + moteur, classification, vérification **12.3.4** / **12.3.5**). **L'alignement frontend/UI** a été **terminé** pour ce flux (consommation prioritaire du contrat wrapper, sauvegardes obsolètes, **12.4.4** / **12.4.5**). Le flux a été **vérifié** par rapport à la liste de contrôle de l'étape 12 et **accepté pour clôture** (**12.5.4**).

**Résultat concret ajouté à l'ensemble de flux validé :** la **ligne de base multi-flux validée a été à nouveau étendue** (**12.6.2**) pour inclure **l'étape 12** en tant qu'unité d'exécution validée **au niveau du wrapper** sur **`/api/to-asciidoc`** : refléter le modèle **Étape 10** pour **`/api/to-markdown`** sans ajouter de nouveau endpoint backend.

**Ce que l'étape 12 confirme à propos de la méthode de migration/alignement :** le playbook de l'**Étape 6** s'applique aux **modules wrapper hérités** et aux chemins **Pandoc**, pas seulement au downdoc/lazyload ; **La préservation des limites** `ConversionResult` plus **la vérification en couches** (isolé, backend e2e, consolidation frontend, comparaison de flux croisés **12.5.1**, playbook **12.5.2**, observations **12.5.3**) reste une recette reproductible et limitée.

**Ce qui reste en dehors du champ d'application de l'étape 12 :** vagues de migration différées (**`/api/convert`**, **`from-html`**, etc.), consolidation du routage **App.tsx** par rapport au wrapper dédié, extraction d'assistance **globale**, refonte de l'UI et **étape 13** planification/exécution jusqu'à ce qu'elle soit explicitement démarrée.

**Note de transition :** les travaux de suivi peuvent s'appuyer sur cette **base de référence élargie** en tant que **nouvelle phase**, sans rouvrir **l'étape 12** portée ou décisions déjà gelées sous **12.1.2**.

**L'étape 12 ne signifie pas :**

- tous les flux restants sont migrés,
- un vaste travail de refonte est effectué, ou
- **L'étape 13** a déjà commencé.

#### Étape frontière

Cette étape enregistre uniquement la clôture officielle de l'étape 12 et ne démarre **pas** l'étape 13.
