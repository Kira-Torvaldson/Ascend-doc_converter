# Référence API

## Objectif

Ce document définit les références API canoniques pour Ascend, incluant les points de terminaison, les contrats de requête et les contrats de réponse. Il constitue la référence faisant autorité pour tous les consommateurs de l'API.

---

## Points de terminaison

### Objectif

Cette section définit les points de terminaison API canoniques pour Ascend.

### URL de base

**Développement :** `http://localhost:3003`  
**Production :** Configurable via variable d'environnement

### Points de terminaison de conversion

#### `POST /to-markdown`

Convertir AsciiDoc en Markdown.

**Requête :**
```json
{
  "text": "AsciiDoc content",
  "options": {}
}
```

**Réponse :**
```json
{
  "markdown": "Converted Markdown content"
}
```

**Statut :** ✅ Actif  
**Moteur :** downdoc  
**Confirmation :** Non requise

#### `POST /to-asciidoc`

Convertir Markdown en AsciiDoc.

**Requête :**
```json
{
  "text": "Markdown content"
}
```

**Réponse :**
```json
{
  "asciidoc": "Converted AsciiDoc content"
}
```

**Statut :** ✅ Actif  
**Moteur :** Pandoc  
**Confirmation :** Non requise

#### `POST /convert`

Point de terminaison de conversion générique avec validation de jeton.

**Requête :**
```json
{
  "content": "Source content",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "token": "confirmation-token",
  "options": {}
}
```

**Réponse :**
```json
{
  "result": "Converted content",
  "format": "markdown"
}
```

**Statut :** ✅ Actif  
**Moteur :** Déterminé par l'orchestrateur  
**Confirmation :** Requise (jeton)

### Points de terminaison proxy

#### `POST /api/proxy/convert`

Point de terminaison de conversion normalisé avec assainissement des données.

**Requête :**
```json
{
  "content": "Content (may contain BOM, Smart Quotes, etc.)",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "options": {},
  "token": "optional-token"
}
```

**Réponse :**
```json
{
  "success": true,
  "result": "Sanitized and converted content"
}
```

**Statut :** ✅ Actif  
**Fonctionnalités :** Suppression du BOM, normalisation de l'encodage, remplacement des guillemets typographiques  
**Confirmation :** Optionnelle (si un jeton est fourni)

### Points de terminaison de sécurité

#### `POST /api/confirmation/request`

Demander un jeton de confirmation pour les conversions sensibles.

**Requête :**
```json
{
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "metadata": {}
}
```

**Réponse :**
```json
{
  "token": "hex-encoded-token",
  "expiresIn": 60
}
```

**Statut :** ✅ Actif  
**Durée de vie du jeton :** 60 secondes (par défaut)

#### `GET /api/confirmation/stats`

Obtenir les statistiques des jetons de confirmation.

**Réponse :**
```json
{
  "active": 5,
  "expired": 10,
  "consumed": 20
}
```

**Statut :** ✅ Actif

### Points de terminaison de journalisation

#### `GET /api/logs/:conversionId`

Obtenir le journal d'une conversion spécifique.

**Réponse :**
```json
{
  "conversionId": "uuid",
  "timestamp": "ISO-8601",
  "status": "SUCCESS",
  "modules": [...],
  "duration": 1.23
}
```

**Statut :** ✅ Actif

#### `GET /api/logs`

Lister tous les journaux de conversion.

**Réponse :**
```json
[
  {
    "conversionId": "uuid",
    "timestamp": "ISO-8601",
    "status": "SUCCESS"
  }
]
```

**Statut :** ✅ Actif

### Réponses d'erreur

#### Format d'erreur standard
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

#### Codes de statut HTTP
- `200 OK` : Succès
- `400 Bad Request` : Erreur de validation
- `401 Unauthorized` : Authentification requise (si implémentée)
- `403 Forbidden` : Violation de sécurité
- `429 Too Many Requests` : Limite de débit dépassée
- `500 Internal Server Error` : Erreur serveur
- `503 Service Unavailable` : Système surchargé

---

## Contrats de requête

### Objectif

Cette section définit les contrats de requête canoniques pour les points de terminaison API Ascend. Elle spécifie les champs requis, les champs optionnels, les types et les règles de validation.

### Champs de requête communs

#### Champs de contenu

**Champ :** `content` | `text`  
**Type :** `string`  
**Requis :** Oui (pour les points de terminaison de conversion)  
**Contraintes :**
- Chaîne non vide
- Encodage UTF-8
- Longueur maximale : 10 Mo (par défaut)

#### Champs de format

**Champ :** `fromFormat` | `from`  
**Type :** `string`  
**Requis :** Oui  
**Contraintes :**
- Doit figurer dans la liste blanche des formats pris en charge
- Minuscules
- Identifiant de format valide

**Champ :** `toFormat` | `to`  
**Type :** `string`  
**Requis :** Oui  
**Contraintes :**
- Doit figurer dans la liste blanche des formats pris en charge
- Minuscules
- Identifiant de format valide

#### Champ options

**Champ :** `options`  
**Type :** `object`  
**Requis :** Non  
**Contraintes :**
- Structure d'options de conversion valide
- Les objets imbriqués doivent correspondre au schéma des options

#### Champ jeton

**Champ :** `token`  
**Type :** `string`  
**Requis :** Oui (pour `/api/convert`)  
**Contraintes :**
- Chaîne encodée en hexadécimal (64 caractères)
- Jeton valide et non expiré
- Non consommé précédemment

### Contrats spécifiques aux points de terminaison

#### `/to-markdown`

**Champs requis :**
- `text` : string

**Champs optionnels :**
- `options` : object

**Validation :**
- `text` doit être non vide
- `options` doit être valide (si fourni)

#### `/to-asciidoc`

**Champs requis :**
- `text` : string

**Champs optionnels :**
- Aucun

**Validation :**
- `text` doit être non vide

#### `/convert`

**Champs requis :**
- `content` : string
- `fromFormat` : string
- `toFormat` : string
- `token` : string

**Champs optionnels :**
- `options` : object

**Validation :**
- Tous les champs requis présents
- Formats dans la liste blanche
- Jeton valide et non expiré
- Options valides (si fournies)

#### `/api/proxy/convert`

**Champs requis :**
- `content` : string
- `fromFormat` : string
- `toFormat` : string

**Champs optionnels :**
- `options` : object
- `token` : string

**Validation :**
- Tous les champs requis présents
- Formats dans la liste blanche
- Jeton valide (si fourni)

#### `/api/confirmation/request`

**Champs requis :**
- `fromFormat` : string
- `toFormat` : string

**Champs optionnels :**
- `metadata` : object

**Validation :**
- Formats dans la liste blanche
- Structure des métadonnées valide (si fournie)

### Règles de validation des requêtes

#### Règle 1 : Validation des types

**Règle :** Tous les champs doivent correspondre aux types attendus.

**Application :**
- Vérification des types avant le traitement
- Rejet avec 400 en cas de non-concordance de type

#### Règle 2 : Champs requis

**Règle :** Tous les champs requis doivent être présents.

**Application :**
- Vérification de la présence des champs requis
- Rejet avec 400 si manquants

#### Règle 3 : Liste blanche de formats

**Règle :** Les champs de format doivent figurer dans la liste blanche.

**Application :**
- Validation par rapport aux formats pris en charge
- Rejet avec 400 si non autorisé

#### Règle 4 : Taille du contenu

**Règle :** Le contenu ne doit pas dépasser la limite de taille.

**Application :**
- Vérification de la longueur du contenu
- Rejet avec 400 si la limite est dépassée

#### Règle 5 : Validation du jeton

**Règle :** Les jetons doivent être valides et non expirés.

**Application :**
- Valider l'existence du jeton
- Vérifier l'expiration
- Rejet avec 403 si invalide

---

## Contrats de réponse

### Objectif

Cette section définit les contrats de réponse canoniques pour les points de terminaison API Ascend. Elle spécifie les formats de réponse, les codes de statut et les structures d'erreur.

### Format de réponse de succès

#### Réponse de succès standard

```json
{
  "result": "Converted content",
  "format": "markdown"
}
```

#### Spécifications des champs

**Champ :** `result` | `markdown` | `asciidoc`  
**Type :** `string`  
**Description :** Contenu converti  
**Encodage :** UTF-8

**Champ :** `format`  
**Type :** `string`  
**Description :** Identifiant du format de sortie  
**Contraintes :** Minuscules, identifiant de format valide

### Format de réponse d'erreur

#### Réponse d'erreur standard

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

#### Spécifications des champs

**Champ :** `success`  
**Type :** `boolean`  
**Description :** Statut de succès de l'opération  
**Valeur :** Toujours `false` pour les erreurs

**Champ :** `error`  
**Type :** `string`  
**Description :** Code d'erreur  
**Contraintes :** Codes d'erreur standardisés

**Champ :** `message`  
**Type :** `string`  
**Description :** Message d'erreur convivial pour l'utilisateur  
**Contraintes :** Générique, sans détails système

### Format de réponse proxy

#### Réponse de succès

```json
{
  "success": true,
  "result": "Converted content"
}
```

#### Réponse d'erreur

```json
{
  "success": false,
  "error": "Error message"
}
```

### Codes de statut HTTP

#### Codes de succès

- **200 OK :** Requête réussie
- **201 Created :** Ressource créée (le cas échéant)

#### Codes d'erreur client

- **400 Bad Request :** Erreur de validation, requête mal formée
- **401 Unauthorized :** Authentification requise (si implémentée)
- **403 Forbidden :** Violation de sécurité, jeton invalide
- **404 Not Found :** Ressource introuvable
- **429 Too Many Requests :** Limite de débit dépassée

#### Codes d'erreur serveur

- **500 Internal Server Error :** Erreur serveur inattendue
- **503 Service Unavailable :** Système surchargé, temporairement indisponible

### En-têtes de réponse

#### En-têtes standard

- `Content-Type: application/json`
- `X-Conversion-Id: <uuid>` (le cas échéant)
- `X-Request-Id: <uuid>` (le cas échéant)

### Référence des codes d'erreur

#### Erreurs de validation

- `VALIDATION_ERROR` : Échec général de validation
- `FILE_VALIDATION_ERROR` : Échec de validation de fichier
- `FORMAT_VALIDATION_ERROR` : Échec de validation de format
- `SIZE_LIMIT_EXCEEDED` : La taille du fichier dépasse la limite

#### Erreurs d'exécution

- `CONVERSION_FAILED` : Échec du module de conversion
- `EXECUTION_ERROR` : Erreur d'exécution du processus
- `OUTPUT_MISSING` : Fichier de sortie non créé
- `BINARY_NOT_FOUND` : Binaire requis introuvable

#### Erreurs de délai d'expiration

- `TIMEOUT` : La conversion a dépassé la limite de temps

#### Erreurs de ressources

- `RESOURCE_LIMIT_EXCEEDED` : Limite de ressources dépassée
- `MEMORY_LIMIT_EXCEEDED` : Limite mémoire dépassée
- `CPU_LIMIT_EXCEEDED` : Limite CPU dépassée

#### Erreurs de sécurité

- `SECURITY_VIOLATION` : Violation de sécurité générale
- `UNAUTHORIZED_ACCESS` : Accès non autorisé à un fichier
- `PATH_TRAVERSAL` : Tentative de traversée de répertoire
- `NETWORK_ACCESS_DENIED` : Tentative d'accès réseau

#### Erreurs de confirmation

- `CONFIRMATION_REQUIRED` : Jeton de confirmation requis
- `CONFIRMATION_TOKEN_INVALID` : Jeton de confirmation invalide
- `CONFIRMATION_TOKEN_EXPIRED` : Jeton de confirmation expiré
- `CONFIRMATION_TOKEN_CONSUMED` : Jeton déjà utilisé

### Règles de validation des réponses

#### Règle 1 : Format cohérent

**Règle :** Toutes les réponses suivent le format standard.

**Application :**
- Les réponses de succès incluent le résultat
- Les réponses d'erreur incluent le code et le message d'erreur
- Aucun format mixte

#### Règle 2 : Messages d'erreur génériques

**Règle :** Les messages d'erreur ne doivent pas exposer les détails système.

**Application :**
- Aucun chemin de fichier
- Aucune trace de pile
- Aucun détail d'erreur interne
- Langage convivial pour l'utilisateur

#### Règle 3 : Codes de statut appropriés

**Règle :** Les codes de statut HTTP doivent correspondre au type d'erreur.

**Application :**
- 400 pour les erreurs de validation
- 403 pour les violations de sécurité
- 500 pour les erreurs serveur
- 503 pour les conditions de surcharge

---

## Statut canonique

Ce document est **canonique** et constitue la source de vérité pour :
- Les points de terminaison disponibles
- Les formats de requête/réponse
- Le statut des points de terminaison
- La gestion des erreurs
- Les exigences des champs de requête
- Les spécifications de types
- Les règles de validation
- Les contrats spécifiques aux points de terminaison
- Les formats de réponse
- Les structures d'erreur
- Les codes de statut
- Les définitions des codes d'erreur

Toute modification des contrats API doit d'abord être reflétée ici, puis propagée vers le code d'implémentation.
