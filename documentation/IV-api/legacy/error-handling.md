> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Gestion des erreurs

## Objectif

Ce document définit les règles canoniques de gestion des erreurs pour Ascend. Il spécifie les codes d'erreur, les messages d'erreur et les stratégies de traitement.

## Catégories d'erreurs

### Erreurs de validation

**Catégorie :** Échecs de validation des entrées

**Codes d'erreur :**
- `VALIDATION_ERROR` : Échec général de validation
- `FILE_VALIDATION_ERROR` : Échec de validation de fichier
- `FORMAT_VALIDATION_ERROR` : Échec de validation de format
- `SIZE_LIMIT_EXCEEDED` : La taille du fichier dépasse la limite

**Comportement :**
- Rejet immédiat
- Aucune ressource allouée
- Message d'erreur clair renvoyé

### Erreurs d'exécution

**Catégorie :** Erreurs pendant l'exécution de la conversion

**Codes d'erreur :**
- `CONVERSION_FAILED` : Échec du module de conversion
- `EXECUTION_ERROR` : Erreur d'exécution du processus
- `OUTPUT_MISSING` : Fichier de sortie non créé
- `BINARY_NOT_FOUND` : Binaire requis introuvable

**Comportement :**
- Arrêt de la conversion
- Nettoyage des ressources
- Journalisation des détails de l'erreur
- Renvoi d'une erreur générique à l'utilisateur

### Erreurs de délai d'expiration

**Catégorie :** La conversion a dépassé la limite de temps

**Code d'erreur :** `TIMEOUT`

**Comportement :**
- Arrêt forcé du processus (SIGTERM → SIGKILL)
- Nettoyage des ressources
- Journalisation de l'événement de délai d'expiration
- Renvoi de l'erreur de délai d'expiration

### Erreurs de ressources

**Catégorie :** Violations des limites de ressources

**Codes d'erreur :**
- `RESOURCE_LIMIT_EXCEEDED` : Limite de ressources dépassée
- `MEMORY_LIMIT_EXCEEDED` : Limite de mémoire dépassée
- `CPU_LIMIT_EXCEEDED` : Limite CPU dépassée

**Comportement :**
- Arrêt immédiat du processus
- Nettoyage des ressources
- Journalisation des détails de la violation
- Renvoi de l'erreur de ressources

### Erreurs de sécurité

**Catégorie :** Violations de sécurité

**Codes d'erreur :**
- `SECURITY_VIOLATION` : Violation de sécurité générale
- `UNAUTHORIZED_ACCESS` : Accès non autorisé à un fichier
- `PATH_TRAVERSAL` : Tentative de traversée de chemin
- `NETWORK_ACCESS_DENIED` : Tentative d'accès réseau

**Comportement :**
- Arrêt immédiat
- Journalisation de l'événement de sécurité
- Renvoi d'une erreur générique (sans détails)
- Alerte de la surveillance de sécurité (si configurée)

## Format de réponse d'erreur

### Réponse d'erreur standard

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

### Règles des messages d'erreur

**Règle 1 : Messages génériques**
- Aucun détail système
- Aucun chemin de fichier
- Aucune information d'erreur interne

**Règle 2 : Compréhensibles pour l'utilisateur**
- Clairs et actionnables
- Expliquent ce qui s'est mal passé
- Suggèrent une résolution lorsque possible

**Règle 3 : Cohérents**
- Même code d'erreur = même message
- Réponses d'erreur prévisibles
- Codes d'erreur documentés

## Journalisation des erreurs

### Contenu des journaux

**Inclus :**
- Code d'erreur
- Identifiant de conversion
- Horodatage
- Nom du module (le cas échéant)
- Détails d'erreur assainis

**Exclus :**
- Contenu utilisateur
- Chemins de fichiers système
- Traces de pile (dans les erreurs destinées à l'utilisateur)
- Données sensibles

### Niveaux de journalisation

- **ERROR :** Échecs de conversion, violations de sécurité
- **WARN :** Avertissements de ressources, problèmes de validation
- **INFO :** Événements de fonctionnement normal

## Récupération après erreur

### Récupération automatique

**Règle :** Aucune nouvelle tentative automatique des conversions échouées.

**Justification :**
- Prévient les boucles infinies
- L'utilisateur contrôle les nouvelles tentatives
- État d'échec clair

### Récupération manuelle

**Règle :** Les utilisateurs peuvent réessayer les conversions échouées.

**Processus :**
1. L'utilisateur reçoit l'erreur
2. L'utilisateur corrige le problème (le cas échéant)
3. L'utilisateur relance la conversion
4. Nouvel identifiant de conversion généré

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les codes et catégories d'erreur
- Le format de réponse d'erreur
- Les règles des messages d'erreur
- Les exigences de journalisation
