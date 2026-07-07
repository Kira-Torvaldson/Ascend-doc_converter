> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Pipeline de conversion

## Objectif

Ce document définit le comportement canonique du pipeline de conversion pour Ascend. Il décrit le cycle de vie d'une conversion, les étapes impliquées et les règles qui régissent l'exécution.

## Principes du pipeline

### Principe 1 : Isolation stricte

**Règle :** Chaque conversion s'exécute en isolation complète de toutes les autres conversions.

**Exigences :**
- Répertoire temporaire unique par conversion
- Aucun état partagé entre les conversions
- Aucune interférence entre les conversions concurrentes
- Nettoyage garanti après achèvement

### Principe 2 : Communication par fichiers

**Règle :** Les modules communiquent exclusivement par l'intermédiaire de fichiers.

**Exigences :**
- Fichier d'entrée fourni au module
- Fichier de sortie créé par le module
- Aucune communication directe inter-modules
- Aucune mémoire partagée ni variables partagées

### Principe 3 : Exécution linéaire

**Règle :** Les étapes de conversion s'exécutent séquentiellement dans un flux linéaire.

**Exigences :**
- Étapes exécutées les unes après les autres
- La sortie de l'étape N devient l'entrée de l'étape N+1
- Aucune exécution parallèle des étapes
- Ordre d'exécution clair

## Cycle de vie de la conversion

### Phase 1 : Initialisation

**Durée :** < 1 seconde

**Étapes :**
1. Générer un identifiant de conversion unique (UUID)
2. Créer un répertoire temporaire unique
3. Valider la confirmation utilisateur (si requise)
4. Valider le contenu d'entrée
5. Valider la paire de formats de conversion (liste blanche)

**Échecs de validation :** Conversion rejetée immédiatement, aucune ressource allouée.

### Phase 2 : Préparation

**Durée :** < 1 seconde

**Étapes :**
1. Déterminer les extensions de fichiers (source et cible)
2. Générer les chemins de fichiers absolus (dans le répertoire temporaire)
3. Écrire le fichier d'entrée dans le répertoire temporaire
4. Valider les chemins (prévenir la traversée)

**Validation des chemins :** Tous les chemins doivent se trouver dans le répertoire temporaire.

### Phase 3 : Exécution

**Durée :** Variable (généralement 1 à 30 secondes)

**Étapes :**
1. Sélectionner le module de conversion approprié
2. Exécuter le module avec les paramètres validés
3. Capturer stdout/stderr
4. Surveiller le délai d'expiration
5. Forcer l'arrêt si le délai est dépassé

**Exécution du module :**
- Le module reçoit le chemin du fichier d'entrée
- Le module crée le fichier de sortie
- Le module renvoie un objet résultat
- Le pipeline valide que le fichier de sortie existe

### Phase 4 : Finalisation

**Durée :** < 1 seconde

**Étapes :**
1. Vérifier que le fichier de sortie existe
2. Lire le contenu converti
3. Journaliser le succès de la conversion
4. Renvoyer le résultat à l'appelant

**Validation de la sortie :**
- Le fichier doit exister
- Le fichier doit être lisible
- Le fichier doit contenir un contenu valide

### Phase 5 : Nettoyage

**Durée :** < 1 seconde

**Étapes :**
1. Supprimer récursivement le répertoire temporaire
2. Journaliser les erreurs de nettoyage (non fatales)
3. Libérer les ressources
4. Décrémenter le compteur de concurrence

**Garantie de nettoyage :** Le nettoyage s'exécute toujours, même en cas d'erreur.

## Sélection du module

### Règles de sélection

1. Vérifier que `supportedFormats.from` du module inclut le format source
2. Vérifier que `supportedFormats.to` du module inclut le format cible
3. Vérifier que le module est disponible (pas un placeholder)
4. Sélectionner le premier module correspondant

### Stratégie de repli

Si aucun module ne correspond :
- Conversion rejetée avec une erreur claire
- Aucun repli vers des modules alternatifs
- Erreur journalisée

## Gestion des erreurs

### Catégories d'erreurs

| Catégorie | Comportement | Exemple |
|----------|----------|---------|
| Erreur de validation | Rejet immédiat | Format invalide |
| Erreur d'exécution | Arrêt, nettoyage | Crash du module |
| Délai d'expiration | Arrêt forcé, nettoyage | Processus bloqué |
| Limite de ressources | Arrêt, nettoyage | Mémoire dépassée |

### Réponse d'erreur

**Règle :** Les erreurs renvoient des objets d'erreur standardisés.

**Structure :**
```json
{
  "success": false,
  "error": "Error code",
  "message": "User-friendly message"
}
```

**Messages d'erreur :**
- Génériques (sans détails système)
- Compréhensibles pour l'utilisateur
- Actionnables lorsque possible

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Le cycle de vie du pipeline
- Les étapes d'exécution
- La sélection des modules
- La gestion des erreurs
