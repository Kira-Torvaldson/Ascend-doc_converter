> ⚠️ **Déprécié :** Contenu migré vers les fichiers de référence canoniques.

# Points de terminaison API

## Objectif

Ce document définit les points de terminaison API canoniques d'Ascend. Il sert de référence faisant autorité pour les consommateurs de l'API.

## URL de base

**Développement :** `http://localhost:3003`  
**Production :** Configurable via une variable d'environnement

## Catégories de points de terminaison

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

#### `POST /from-html`

Convertir HTML vers d'autres formats.

**Requête :**
```json
{
  "text": "HTML content",
  "to": "markdown"
}
```

**Réponse :**
```json
{
  "result": "Converted content",
  "format": "markdown"
}
```

**Statut :** ⏳ Disponible mais non activé dans l'interface utilisateur  
**Moteur :** Pandoc  
**Confirmation :** Non requise

#### `POST /text-to-markdown`

Convertir du texte brut en Markdown.

**Requête :**
```json
{
  "text": "Plain text content"
}
```

**Réponse :**
```json
{
  "markdown": "Converted Markdown content"
}
```

**Statut :** ⏳ Disponible mais non activé dans l'interface utilisateur  
**Moteur :** text2markdown  
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

## Réponses d'erreur

### Format d'erreur standard

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

### Codes de statut HTTP

- `200 OK` : Succès
- `400 Bad Request` : Erreur de validation
- `401 Unauthorized` : Authentification requise (si implémentée)
- `403 Forbidden` : Violation de sécurité
- `429 Too Many Requests` : Limite de débit dépassée
- `500 Internal Server Error` : Erreur serveur
- `503 Service Unavailable` : Système surchargé

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les points de terminaison disponibles
- Les formats de requête/réponse
- Le statut des points de terminaison
- La gestion des erreurs
