> ⚠️ **Déprécié :** Contenu migré vers les fichiers de référence canoniques.

# Contrats de réponse

## Objectif

Ce document définit les contrats de réponse canoniques pour les points de terminaison API d'Ascend. Il spécifie les formats de réponse, les codes de statut et les structures d'erreur.

## Format de réponse de succès

### Réponse de succès standard

```json
{
  "result": "Converted content",
  "format": "markdown"
}
```

### Spécifications des champs

**Champ :** `result` | `markdown` | `asciidoc`  
**Type :** `string`  
**Description :** Contenu converti  
**Encodage :** UTF-8

**Champ :** `format`  
**Type :** `string`  
**Description :** Identifiant du format de sortie  
**Contraintes :** Minuscules, identifiant de format valide

## Format de réponse d'erreur

### Réponse d'erreur standard

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

### Spécifications des champs

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
**Description :** Message d'erreur convivial  
**Contraintes :** Générique, sans détails système

## Format de réponse proxy

### Réponse de succès

```json
{
  "success": true,
  "result": "Converted content"
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "error": "Error message"
}
```

## Codes de statut HTTP

### Codes de succès

- **200 OK :** Requête réussie
- **201 Created :** Ressource créée (le cas échéant)

### Codes d'erreur client

- **400 Bad Request :** Erreur de validation, requête mal formée
- **401 Unauthorized :** Authentification requise (si implémentée)
- **403 Forbidden :** Violation de sécurité, jeton invalide
- **404 Not Found :** Ressource introuvable
- **429 Too Many Requests :** Limite de débit dépassée

### Codes d'erreur serveur

- **500 Internal Server Error :** Erreur serveur inattendue
- **503 Service Unavailable :** Système surchargé, temporairement indisponible

## En-têtes de réponse

### En-têtes standard

- `Content-Type: application/json`
- `X-Conversion-Id: <uuid>` (le cas échéant)
- `X-Request-Id: <uuid>` (le cas échéant)

## Référence des codes d'erreur

### Erreurs de validation

- `VALIDATION_ERROR` : Échec général de validation
- `FILE_VALIDATION_ERROR` : Échec de validation de fichier
- `FORMAT_VALIDATION_ERROR` : Échec de validation de format
- `SIZE_LIMIT_EXCEEDED` : La taille du fichier dépasse la limite

### Erreurs d'exécution

- `CONVERSION_FAILED` : Échec du module de conversion
- `EXECUTION_ERROR` : Erreur d'exécution du processus
- `OUTPUT_MISSING` : Fichier de sortie non créé
- `BINARY_NOT_FOUND` : Binaire requis introuvable

### Erreurs de timeout

- `TIMEOUT` : La conversion a dépassé la limite de temps

### Erreurs de ressources

- `RESOURCE_LIMIT_EXCEEDED` : Limite de ressources dépassée
- `MEMORY_LIMIT_EXCEEDED` : Limite mémoire dépassée
- `CPU_LIMIT_EXCEEDED` : Limite CPU dépassée

### Erreurs de sécurité

- `SECURITY_VIOLATION` : Violation de sécurité générale
- `UNAUTHORIZED_ACCESS` : Accès non autorisé à un fichier
- `PATH_TRAVERSAL` : Tentative de traversée de chemin
- `NETWORK_ACCESS_DENIED` : Tentative d'accès réseau

### Erreurs de confirmation

- `CONFIRMATION_REQUIRED` : Jeton de confirmation requis
- `CONFIRMATION_TOKEN_INVALID` : Jeton de confirmation invalide
- `CONFIRMATION_TOKEN_EXPIRED` : Jeton de confirmation expiré
- `CONFIRMATION_TOKEN_CONSUMED` : Jeton déjà utilisé

## Règles de validation des réponses

### Règle 1 : Format cohérent

**Règle :** Toutes les réponses suivent le format standard.

**Application :**
- Les réponses de succès incluent le résultat
- Les réponses d'erreur incluent le code d'erreur et le message
- Aucun format mixte

### Règle 2 : Messages d'erreur génériques

**Règle :** Les messages d'erreur ne doivent pas exposer les détails système.

**Application :**
- Pas de chemins de fichiers
- Pas de traces de pile
- Pas de détails d'erreur internes
- Langage convivial pour l'utilisateur

### Règle 3 : Codes de statut appropriés

**Règle :** Les codes de statut HTTP doivent correspondre au type d'erreur.

**Application :**
- 400 pour les erreurs de validation
- 403 pour les violations de sécurité
- 500 pour les erreurs serveur
- 503 pour les conditions de surcharge

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les formats de réponse
- Les structures d'erreur
- Les codes de statut
- Les définitions des codes d'erreur
