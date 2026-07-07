# Spécification de l'interface des modules

## Objectif

Ce document définit le contrat canonique de l'interface des modules pour Ascend. Tous les modules de conversion doivent se conformer à cette interface.

## Contrat d'interface

### Propriétés requises

#### `name`

**Type :** `string`  
**Description :** Identifiant unique du module  
**Contraintes :**
- Minuscules avec tirets comme séparateurs
- Pas d'espaces ni de caractères spéciaux
- Unique parmi tous les modules

**Exemples :** `"downdoc"`, `"pandoc"`, `"text2markdown"`

#### `supportedFormats`

**Type :** `object`  
**Structure :**
```typescript
{
  from: string[],  // Formats d'entrée acceptés
  to: string[]      // Formats de sortie produits
}
```

**Contraintes :**
- `from` et `to` doivent être des tableaux non vides
- Les identifiants de format doivent être en minuscules
- Les formats doivent figurer dans la liste blanche des formats supportés

### Méthode requise : `run`

**Signature :**
```typescript
run(inputPath: string, outputPath: string, options?: object): Promise<ModuleResult>
```

**Paramètres :**
- `inputPath` : Chemin absolu vers le fichier d'entrée (requis)
- `outputPath` : Chemin absolu vers le fichier de sortie (requis)
- `options` : Options de conversion (optionnel)

**Type de retour :**
```typescript
interface ModuleResult {
  success: boolean;        // Statut de la conversion
  logs: string | string[]; // Journaux d'exécution
  error: string | null;    // Message d'erreur (null en cas de succès)
  duration: number;        // Durée en secondes
}
```

## Obligations de sécurité (V1)

### 1. Validation basique des entrées

- Valider la taille du fichier (dans les limites)
- Valider le type de fichier (extension ou signature basique)
- Rejeter immédiatement si la validation échoue

### 2. Isolation légère

- Utiliser uniquement le répertoire temporaire fourni
- Accéder uniquement à `inputPath` et `outputPath`
- Aucune création de fichier en dehors du répertoire autorisé

### 3. Gestion sécurisée des erreurs

- Intercepter toutes les exceptions
- Retourner un `ModuleResult` avec `success: false`
- Aucune exception non gérée
- Messages d'erreur génériques (pas de détails système)

### 4. Journalisation minimale

- Journaliser l'ID de conversion (si fourni)
- Journaliser les horodatages de début/fin
- Journaliser le statut final
- Journaliser la durée

### 5. Vérification d'intégrité légère

- Hash/somme de contrôle du module (optionnel en V1)
- Documentation des dépendances
- Détection de modification (optionnel en V1)

## Exigences comportementales

### En cas de succès

1. Créer le fichier de sortie à `outputPath`
2. Le fichier de sortie doit être valide et conforme au format cible
3. Retourner un `ModuleResult` avec `success: true`, `error: null`

### En cas d'échec

1. Ne pas créer de fichier de sortie (ou supprimer s'il est partiellement créé)
2. Retourner un `ModuleResult` avec `success: false`, `error: <message>`

## Contraintes d'exécution

### Isolation

- Ne doit pas modifier le fichier d'entrée
- Ne doit accéder qu'à `inputPath` et `outputPath`
- Ne doit pas créer de fichiers en dehors du répertoire autorisé
- Ne doit pas accéder au réseau (minimum V1)

### Performances

- Doit respecter le délai d'expiration (si fourni)
- Doit libérer les ressources après l'exécution
- Ne doit pas bloquer le processus principal

### Sécurité

- Ne doit pas exécuter de commandes système non validées
- Ne doit pas utiliser les données utilisateur dans des commandes système
- Doit valider les chemins de fichiers avant utilisation

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Le contrat d'interface des modules
- Les propriétés et méthodes requises
- Les obligations de sécurité
- Les exigences comportementales

**Référence :** Cette spécification est basée sur `doc/specifications/modules.interface.md` (legacy) et sert de version canonique.
