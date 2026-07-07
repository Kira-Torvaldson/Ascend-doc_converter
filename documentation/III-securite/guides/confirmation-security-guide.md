# Guide de sécurité — Système de confirmation par jeton

## Vue d'ensemble

Ce système implémente une confirmation utilisateur **sécurisée et vérifiable côté serveur** pour toutes les conversions de fichiers. Le backend **NE FAIT PAS CONFIANCE** à l'interface frontend et exige une preuve explicite de confirmation.

## Architecture de sécurité

### Principe fondamental

```
Frontend (UI)          Backend (Autorité)
    │                        │
    │─── 1. Demande jeton ───>│
    │<── 2. Jeton généré ─────│
    │                        │
    │─── 3. Affiche modale ──│
    │    (utilisateur)       │
    │                        │
    │─── 4. Jeton + requête ─>│
    │    (si « Oui » cliqué) │
    │                        │
    │<── 5. Validation ─────│
    │    + Conversion        │
```

**Point critique** : Le backend valide le jeton **indépendamment** de l'interface. Même si l'API est appelée manuellement ou si le frontend est contourné, aucune conversion ne peut être exécutée sans un jeton valide.

## Composants

### 1. `confirmation-token-manager.js`

Gestionnaire de jetons de confirmation :
- Génère des jetons cryptographiquement sécurisés (32 octets, hex)
- Stockage en mémoire avec expiration (60 secondes par défaut)
- Validation et consommation (usage unique)
- Nettoyage automatique des jetons expirés

**Fonctions principales** :
- `generateConfirmationToken(metadata)` : Génère un jeton unique
- `validateAndConsumeToken(token, expectedMetadata)` : Valide et consomme un jeton

### 2. `secure-converter-with-tokens.js`

Enveloppe autour de `secure-converter.js` qui ajoute la validation par jeton :
- Exige un jeton de confirmation valide
- Valide le jeton avant d'exécuter la conversion
- Consomme le jeton (usage unique)

### 3. Endpoints backend

#### `POST /api/confirmation/request`

Génère un jeton de confirmation.

**Requête** :
```json
{
  "fromFormat": "markdown",
  "toFormat": "asciidoc",
  "contentSize": 1024
}
```

**Réponse** :
```json
{
  "success": true,
  "token": "abc123...",
  "expiresAt": "2024-01-15T10:30:00.000Z",
  "ttl": 60000
}
```

#### `POST /convert` (modifié)

Exécute la conversion avec validation du jeton.

**Requête** :
```json
{
  "text": "...",
  "from": "markdown",
  "to": "asciidoc",
  "options": {...},
  "confirmationToken": "abc123..." // OBLIGATOIRE
}
```

**Sécurité** :
- Si `confirmationToken` est absent → 403 Forbidden
- Si jeton invalide → 403 Forbidden
- Si jeton expiré → 410 Gone
- Si jeton déjà utilisé → 403 Forbidden

### 4. Intégration frontend React

#### Flux complet

1. **L'utilisateur clique sur « Convertir »**
   ```typescript
   handleConvert() → requestConversionConfirmation()
   ```

2. **Le frontend demande un jeton**
   ```typescript
   const token = await requestConfirmationToken(fromFormat, toFormat, contentSize)
   ```

3. **Le frontend affiche la modale**
   ```typescript
   setShowConversionModal(true)
   setConfirmationToken(token)
   ```

4. **L'utilisateur clique sur « Oui »**
   ```typescript
   confirmAndConvert() → convertText(..., confirmationToken)
   ```

5. **Le frontend envoie la requête avec le jeton**
   ```typescript
   body: { text, from, to, options, confirmationToken }
   ```

6. **Le backend valide le jeton**
   ```javascript
   validateAndConsumeToken(confirmationToken) // Usage unique
   ```

7. **Le backend exécute la conversion**
   ```javascript
   secureConvertWithToken(...) // Jeton déjà validé
   ```

## Garanties de sécurité

### ✅ Le backend ne fait pas confiance à l'interface

- Aucune conversion ne peut être exécutée sans jeton valide
- Le jeton est généré par le serveur, pas par le client
- Le jeton est validé indépendamment de l'interface

### ✅ Protection contre les attaques

- **Injection de commande** : Impossible (liste blanche stricte)
- **Attaques par rejeu** : Jetons à usage unique
- **Falsification de jeton** : Jetons cryptographiquement sécurisés (32 octets)
- **Expiration** : Les jetons expirent après 60 secondes
- **Contournement de l'interface** : Impossible sans jeton valide

### ✅ Validation multi-niveaux

1. **Frontend** : Empêche l'envoi sans confirmation
2. **Backend** : Valide le jeton avant la conversion
3. **Secure-converter** : Valide la confirmation

## Utilisation

### Backend

```javascript
// Générer un jeton
const tokenData = generateConfirmationToken({
  fromFormat: 'markdown',
  toFormat: 'asciidoc'
});

// Valider et consommer le jeton
const validation = validateAndConsumeToken(token, {
  fromFormat: 'markdown',
  toFormat: 'asciidoc'
});

if (!validation.valid) {
  throw new Error(validation.message);
}
```

### Frontend

```typescript
// 1. Demander un jeton
const token = await requestConfirmationToken('markdown', 'asciidoc', contentSize);

// 2. Afficher la modale avec le jeton
setConfirmationToken(token);
setShowConversionModal(true);

// 3. Si l'utilisateur confirme, envoyer avec le jeton
await convertText(text, 'markdown', 'asciidoc', ..., token);
```

## Configuration

### Durée de vie du jeton

Modifier `TOKEN_CONFIG.TOKEN_TTL` dans `confirmation-token-manager.js` :

```javascript
const TOKEN_CONFIG = {
  TOKEN_TTL: 60000, // 60 secondes (modifiable)
  TOKEN_LENGTH: 32,
  TOKEN_ENCODING: 'hex'
}
```

### Nettoyage automatique

Les jetons expirés sont automatiquement nettoyés toutes les 30 secondes. Aucune action requise.

## Surveillance

### Statistiques des jetons

```javascript
GET /api/confirmation/stats

Réponse :
{
  "success": true,
  "stats": {
    "active": 5,
    "expired": 2,
    "consumed": 10,
    "total": 17
  }
}
```

## Erreurs possibles

| Code | Description | Statut HTTP |
|------|-------------|-------------|
| `CONFIRMATION_TOKEN_MISSING` | Jeton absent de la requête | 403 |
| `CONFIRMATION_TOKEN_INVALID` | Jeton invalide ou inconnu | 403 |
| `CONFIRMATION_TOKEN_EXPIRED` | Jeton expiré | 410 |
| `CONFIRMATION_TOKEN_ALREADY_USED` | Jeton déjà consommé | 403 |
| `CONFIRMATION_TOKEN_METADATA_MISMATCH` | Métadonnées non concordantes | 403 |

## Tests de sécurité

### Test 1 : Requête sans jeton
```bash
curl -X POST http://localhost:3003/convert \
  -H "Content-Type: application/json" \
  -d '{"text":"test","from":"markdown","to":"asciidoc"}'
# Résultat attendu : 403 Forbidden
```

### Test 2 : Jeton invalide
```bash
curl -X POST http://localhost:3003/convert \
  -H "Content-Type: application/json" \
  -d '{"text":"test","from":"markdown","to":"asciidoc","confirmationToken":"invalid"}'
# Résultat attendu : 403 Forbidden
```

### Test 3 : Jeton expiré
```bash
# Attendre 60+ secondes après la génération du jeton
# Résultat attendu : 410 Gone
```

### Test 4 : Réutilisation du jeton
```bash
# Utiliser le même jeton deux fois
# Résultat attendu : 403 Forbidden (déjà utilisé)
```

## Migration depuis l'ancien système

1. **Backend** : Les endpoints existants continuent de fonctionner, mais `/convert` exige désormais un jeton
2. **Frontend** : Modifier `handleConvert()` pour utiliser `requestConversionConfirmation()`
3. **Tests** : Vérifier que toutes les conversions passent par le flux de confirmation

## Bonnes pratiques

1. **Toujours demander un jeton avant d'afficher la modale**
2. **Ne jamais stocker les jetons dans localStorage** (sécurité)
3. **Invalider le jeton si l'utilisateur annule**
4. **Gérer les erreurs de jeton expiré** (demander un nouveau jeton)
5. **Journaliser les tentatives de conversion sans jeton** (surveillance)

## Conclusion

Ce système garantit qu'**aucune conversion ne peut être exécutée sans confirmation explicite et vérifiable côté serveur**. Le backend est l'autorité absolue et ne fait pas confiance à l'interface frontend.
