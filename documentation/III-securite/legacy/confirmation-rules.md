> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Règles de confirmation

## Objectif

Ce document définit les règles canoniques de confirmation utilisateur pour les conversions. Le système de confirmation garantit que les opérations sensibles ou potentiellement destructrices requièrent une approbation explicite de l'utilisateur.

## Exigences de confirmation

### Conversions simples

**Règle :** Les conversions simples ne nécessitent pas de jetons de confirmation.

**Conversions simples :**
- AsciiDoc → Markdown (via downdoc)
- Markdown → AsciiDoc (via Pandoc)

**Justification :** Ces conversions sont à faible risque et couramment utilisées.

### Conversions complexes

**Règle :** Les conversions complexes nécessitent des jetons de confirmation.

**Conversions complexes :**
- Toutes les conversions via l'endpoint `/api/convert`
- Conversions avec options personnalisées
- Conversions multi-étapes

**Justification :** Ces conversions peuvent avoir des effets de bord ou nécessiter une validation.

## Système de jetons

### Génération des jetons

**Règle :** Les jetons sont générés côté serveur à l'aide d'une génération aléatoire cryptographiquement sécurisée.

**Exigences :**
- 32 octets de données aléatoires
- Encodage hexadécimal (64 caractères)
- Unique par requête
- Expiration : 60 secondes (par défaut)

### Validation des jetons

**Règle :** Les jetons doivent être validés avant l'exécution de la conversion.

**Vérifications de validation :**
1. Le jeton existe dans le magasin de jetons
2. Le jeton n'a pas expiré
3. Le jeton n'a pas été consommé
4. Le jeton correspond aux métadonnées attendues (si fournies)

### Consommation des jetons

**Règle :** Les jetons sont à usage unique et consommés lors de la validation.

**Processus :**
1. Jeton validé
2. Jeton immédiatement retiré du magasin
3. La conversion se poursuit
4. Le jeton ne peut pas être réutilisé

## Flux de confirmation

### Étape 1 : Demande de jeton

**Endpoint :** `POST /api/confirmation/request`

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

### Étape 2 : Confirmation utilisateur

**Action UI :** L'utilisateur confirme la conversion dans une boîte de dialogue modale.

**Validation backend :** Aucune. La confirmation UI n'est pas considérée comme fiable.

### Étape 3 : Conversion avec jeton

**Endpoint :** `POST /api/convert`

**Requête :**
```json
{
  "content": "...",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "token": "hex-encoded-token"
}
```

**Validation backend :**
- Le jeton doit être valide
- Le jeton ne doit pas être expiré
- Le jeton ne doit pas être consommé

## Principes de sécurité

### Principe 1 : Aucune confiance envers le frontend

**Règle :** Le backend ne fait pas confiance à la confirmation UI du frontend.

**Application :**
- La validation du jeton est obligatoire
- La confirmation UI seule est insuffisante
- Le jeton doit être présent dans la requête de conversion

### Principe 2 : Expiration des jetons

**Règle :** Les jetons expirent après une courte fenêtre de temps.

**Par défaut :** 60 secondes

**Justification :** Prévient la réutilisation des jetons et limite la fenêtre d'attaque.

### Principe 3 : Usage unique

**Règle :** Les jetons ne peuvent être utilisés qu'une seule fois.

**Application :**
- Jeton retiré du magasin lors de la validation
- Les utilisations ultérieures du même jeton sont rejetées

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les exigences de confirmation
- Les règles du système de jetons
- Les principes de sécurité
- Le flux de validation
