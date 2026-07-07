> ⚠️ **Déprécié :** Contenu migré vers les fichiers de référence canoniques.

# Contrats de requête

## Objectif

Ce document définit les contrats de requête canoniques pour les points de terminaison API d'Ascend. Il spécifie les champs requis, les champs optionnels, les types et les règles de validation.

## Champs de requête communs

### Champs de contenu

**Champ :** `content` | `text`  
**Type :** `string`  
**Requis :** Oui (pour les points de terminaison de conversion)  
**Contraintes :**
- Chaîne non vide
- Encodage UTF-8
- Longueur maximale : 10 Mo (par défaut)

### Champs de format

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

### Champ d'options

**Champ :** `options`  
**Type :** `object`  
**Requis :** Non  
**Contraintes :**
- Structure d'options de conversion valide
- Les objets imbriqués doivent correspondre au schéma d'options

### Champ de jeton

**Champ :** `token`  
**Type :** `string`  
**Requis :** Oui (pour `/api/convert`)  
**Contraintes :**
- Chaîne encodée en hexadécimal (64 caractères)
- Jeton valide et non expiré
- Non consommé précédemment

## Contrats spécifiques par point de terminaison

### `/to-markdown`

**Champs requis :**
- `text` : string

**Champs optionnels :**
- `options` : object

**Validation :**
- `text` doit être non vide
- `options` doit être valide (si fourni)

### `/to-asciidoc`

**Champs requis :**
- `text` : string

**Champs optionnels :**
- Aucun

**Validation :**
- `text` doit être non vide

### `/convert`

**Champs requis :**
- `content` : string
- `fromFormat` : string
- `toFormat` : string
- `token` : string

**Champs optionnels :**
- `options` : object

**Validation :**
- Tous les champs requis sont présents
- Les formats figurent dans la liste blanche
- Le jeton est valide et non expiré
- Les options sont valides (si fournies)

### `/api/proxy/convert`

**Champs requis :**
- `content` : string
- `fromFormat` : string
- `toFormat` : string

**Champs optionnels :**
- `options` : object
- `token` : string

**Validation :**
- Tous les champs requis sont présents
- Les formats figurent dans la liste blanche
- Le jeton est valide (si fourni)

### `/api/confirmation/request`

**Champs requis :**
- `fromFormat` : string
- `toFormat` : string

**Champs optionnels :**
- `metadata` : object

**Validation :**
- Les formats figurent dans la liste blanche
- La structure des métadonnées est valide (si fournie)

## Règles de validation des requêtes

### Règle 1 : Validation des types

**Règle :** Tous les champs doivent correspondre aux types attendus.

**Application :**
- Vérification des types avant le traitement
- Rejet avec 400 en cas d'incompatibilité de type

### Règle 2 : Champs requis

**Règle :** Tous les champs requis doivent être présents.

**Application :**
- Vérification de la présence des champs requis
- Rejet avec 400 si manquants

### Règle 3 : Liste blanche des formats

**Règle :** Les champs de format doivent figurer dans la liste blanche.

**Application :**
- Validation par rapport aux formats pris en charge
- Rejet avec 400 si non listé

### Règle 4 : Taille du contenu

**Règle :** Le contenu ne doit pas dépasser la limite de taille.

**Application :**
- Vérification de la longueur du contenu
- Rejet avec 400 si la limite est dépassée

### Règle 5 : Validation du jeton

**Règle :** Les jetons doivent être valides et non expirés.

**Application :**
- Validation de l'existence du jeton
- Vérification de l'expiration
- Rejet avec 403 si invalide

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les exigences des champs de requête
- Les spécifications de types
- Les règles de validation
- Les contrats spécifiques par point de terminaison
