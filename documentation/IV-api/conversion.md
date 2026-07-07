# Référence de conversion

## Objectif

Ce document définit les références canoniques de conversion pour Ascend, incluant le comportement du pipeline, la gestion des erreurs et les stratégies de repli. Il constitue la référence faisant autorité pour toutes les opérations de conversion.

---

## Pipeline de conversion

### Objectif

Cette section définit le comportement canonique du pipeline de conversion pour Ascend. Elle décrit le cycle de vie d'une conversion, les étapes impliquées et les règles qui régissent l'exécution.

### Principes du pipeline

#### Principe 1 : Isolation stricte

**Règle :** Chaque conversion s'exécute en isolation complète de toutes les autres conversions.

**Exigences :**
- Répertoire temporaire unique par conversion
- Aucun état partagé entre les conversions
- Aucune interférence entre les conversions concurrentes
- Nettoyage garanti après achèvement

#### Principe 2 : Communication par fichiers

**Règle :** Les modules communiquent exclusivement par l'intermédiaire de fichiers.

**Exigences :**
- Fichier d'entrée fourni au module
- Fichier de sortie créé par le module
- Aucune communication directe inter-modules
- Aucune mémoire ou variable partagée

#### Principe 3 : Exécution linéaire

**Règle :** Les étapes de conversion s'exécutent séquentiellement dans un flux linéaire.

**Exigences :**
- Étapes exécutées les unes après les autres
- La sortie de l'étape N devient l'entrée de l'étape N+1
- Aucune exécution parallèle des étapes
- Ordre d'exécution clair

### Cycle de vie de la conversion

#### Phase 1 : Initialisation

**Durée :** < 1 seconde

**Étapes :**
1. Générer un ID de conversion unique (UUID)
2. Créer un répertoire temporaire unique
3. Valider la confirmation utilisateur (si requise)
4. Valider le contenu d'entrée
5. Valider la paire de formats de conversion (liste blanche)

**Échecs de validation :** Conversion rejetée immédiatement, aucune ressource allouée.

#### Phase 2 : Préparation

**Durée :** < 1 seconde

**Étapes :**
1. Déterminer les extensions de fichiers (source et cible)
2. Générer les chemins de fichiers absolus (dans le répertoire temporaire)
3. Écrire le fichier d'entrée dans le répertoire temporaire
4. Valider les chemins (prévenir la traversée de répertoire)

**Validation des chemins :** Tous les chemins doivent être dans le répertoire temporaire.

#### Phase 3 : Exécution

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
- Le module retourne un objet résultat
- Le pipeline valide que le fichier de sortie existe

#### Phase 4 : Finalisation

**Durée :** < 1 seconde

**Étapes :**
1. Vérifier que le fichier de sortie existe
2. Lire le contenu converti
3. Journaliser le succès de la conversion
4. Retourner le résultat à l'appelant

**Validation de la sortie :**
- Le fichier doit exister
- Le fichier doit être lisible
- Le fichier doit contenir un contenu valide

#### Phase 5 : Nettoyage

**Durée :** < 1 seconde

**Étapes :**
1. Supprimer récursivement le répertoire temporaire
2. Journaliser les erreurs de nettoyage (non fatales)
3. Libérer les ressources
4. Décrémenter le compteur de concurrence

**Garantie de nettoyage :** Le nettoyage s'exécute toujours, même en cas d'erreur.

### Sélection des modules

#### Règles de sélection

1. Vérifier que `supportedFormats.from` du module inclut le format source
2. Vérifier que `supportedFormats.to` du module inclut le format cible
3. Vérifier que le module est disponible (pas un placeholder)
4. Sélectionner le premier module correspondant

#### Stratégie de repli

Si aucun module ne correspond :
- Conversion rejetée avec une erreur claire
- Aucun repli vers des modules alternatifs
- Erreur journalisée

---

## Gestion des erreurs

### Objectif

Cette section définit les règles canoniques de gestion des erreurs pour Ascend. Elle spécifie les codes d'erreur, les messages d'erreur et les stratégies de traitement.

### Catégories d'erreurs

#### Erreurs de validation

**Catégorie :** Échecs de validation d'entrée

**Codes d'erreur :**
- `VALIDATION_ERROR` : Échec général de validation
- `FILE_VALIDATION_ERROR` : Échec de validation de fichier
- `FORMAT_VALIDATION_ERROR` : Échec de validation de format
- `SIZE_LIMIT_EXCEEDED` : La taille du fichier dépasse la limite

**Comportement :**
- Rejet immédiat
- Aucune ressource allouée
- Message d'erreur clair retourné

#### Erreurs d'exécution

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
- Retour d'une erreur générique à l'utilisateur

#### Erreurs de délai d'expiration

**Catégorie :** Conversion ayant dépassé la limite de temps

**Code d'erreur :** `TIMEOUT`

**Comportement :**
- Arrêt forcé du processus (SIGTERM → SIGKILL)
- Nettoyage des ressources
- Journalisation de l'événement de timeout
- Retour d'une erreur de timeout

#### Erreurs de ressources

**Catégorie :** Violations des limites de ressources

**Codes d'erreur :**
- `RESOURCE_LIMIT_EXCEEDED` : Limite de ressources dépassée
- `MEMORY_LIMIT_EXCEEDED` : Limite mémoire dépassée
- `CPU_LIMIT_EXCEEDED` : Limite CPU dépassée

**Comportement :**
- Arrêt immédiat du processus
- Nettoyage des ressources
- Journalisation des détails de la violation
- Retour d'une erreur de ressources

#### Erreurs de sécurité

**Catégorie :** Violations de sécurité

**Codes d'erreur :**
- `SECURITY_VIOLATION` : Violation de sécurité générale
- `UNAUTHORIZED_ACCESS` : Accès non autorisé à un fichier
- `PATH_TRAVERSAL` : Tentative de traversée de répertoire
- `NETWORK_ACCESS_DENIED` : Tentative d'accès réseau

**Comportement :**
- Arrêt immédiat
- Journalisation de l'événement de sécurité
- Retour d'une erreur générique (sans détails)
- Alerte de surveillance de sécurité (si configurée)

### Format de réponse d'erreur

#### Réponse d'erreur standard

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "User-friendly error message"
}
```

### Règles des messages d'erreur

#### Règle 1 : Messages génériques
- Aucun détail système
- Aucun chemin de fichier
- Aucune information d'erreur interne

#### Règle 2 : Conviviaux pour l'utilisateur
- Clairs et exploitables
- Expliquent ce qui s'est mal passé
- Suggèrent une résolution lorsque possible

#### Règle 3 : Cohérence
- Même code d'erreur = même message
- Réponses d'erreur prévisibles
- Codes d'erreur documentés

### Journalisation des erreurs

#### Contenu des journaux

**Inclus :**
- Code d'erreur
- ID de conversion
- Horodatage
- Nom du module (le cas échéant)
- Détails d'erreur assainis

**Exclus :**
- Contenu utilisateur
- Chemins de fichiers système
- Traces de pile (dans les erreurs destinées à l'utilisateur)
- Données sensibles

#### Niveaux de journalisation

- **ERROR :** Échecs de conversion, violations de sécurité
- **WARN :** Avertissements de ressources, problèmes de validation
- **INFO :** Événements de fonctionnement normal

### Récupération après erreur

#### Récupération automatique

**Règle :** Aucune nouvelle tentative automatique des conversions échouées.

**Justification :**
- Évite les boucles infinies
- L'utilisateur contrôle les nouvelles tentatives
- État d'échec clair

#### Récupération manuelle

**Règle :** Les utilisateurs peuvent relancer les conversions échouées.

**Processus :**
1. L'utilisateur reçoit l'erreur
2. L'utilisateur corrige le problème (le cas échéant)
3. L'utilisateur relance la conversion
4. Un nouvel ID de conversion est généré

---

## Stratégies de repli

### Objectif

Cette section définit les stratégies canoniques de repli utilisées par Ascend lorsque les méthodes de conversion principales échouent ou sont indisponibles.

### Principes de repli

#### Principe 1 : Pas de replis silencieux

**Règle :** Les replis doivent être explicites et journalisés.

**Justification :**
- Sensibilisation de l'utilisateur à l'utilisation du repli
- Piste d'audit des décisions de repli
- Débogage et dépannage

#### Principe 2 : Dégradation gracieuse

**Règle :** Le système se dégrade gracieusement lorsque les méthodes principales sont indisponibles.

**Comportement :**
- Messages d'erreur clairs
- Aucune conversion partielle
- État d'échec propre

#### Principe 3 : Repli spécifique au format

**Règle :** Les replis sont spécifiques au format, pas génériques.

**Justification :**
- Maintient la qualité de conversion
- Évite la corruption de format
- Erreur claire lorsqu'aucun repli n'est disponible

### Scénarios de repli

#### Scénario 1 : Module indisponible

**Situation :** Le module de conversion requis n'est pas disponible.

**Repli :** Aucun

**Comportement :**
- Conversion rejetée immédiatement
- Erreur claire : « Conversion module not available »
- Aucune tentative de conversion alternative

**Justification :** Évite la corruption de format par des modules incompatibles.

#### Scénario 2 : Échec d'exécution du module

**Situation :** L'exécution du module échoue (plantage, erreur).

**Repli :** Aucun

**Comportement :**
- Conversion marquée comme échouée
- Erreur journalisée avec détails
- Aucune nouvelle tentative avec un module alternatif

**Justification :** L'échec indique un problème fondamental, pas un problème temporaire.

#### Scénario 3 : Délai d'expiration

**Situation :** La conversion dépasse la limite de temps.

**Repli :** Aucun

**Comportement :**
- Processus arrêté
- Conversion marquée comme échouée
- Erreur : « Conversion timeout »

**Justification :** Le timeout indique un problème, pas une condition récupérable.

#### Scénario 4 : Limite de ressources dépassée

**Situation :** Limite de ressources (mémoire, CPU) dépassée.

**Repli :** Aucun

**Comportement :**
- Processus arrêté
- Conversion marquée comme échouée
- Erreur : « Resource limit exceeded »

**Justification :** Les limites de ressources sont des contraintes strictes.

### Politique sans repli

#### Justification

**Règle :** Ascend n'implémente pas de replis automatiques.

**Raisons :**
1. **Intégrité du format :** Les replis peuvent corrompre le format
2. **Prévisibilité :** Les utilisateurs attendent un comportement cohérent
3. **Clarté des erreurs :** Des erreurs claires valent mieux que des replis silencieux
4. **Sécurité :** Les replis peuvent introduire des vulnérabilités

#### Alternatives contrôlées par l'utilisateur

**Règle :** Les utilisateurs peuvent sélectionner manuellement des chemins de conversion alternatifs.

**Processus :**
1. L'utilisateur reçoit l'erreur
2. L'utilisateur sélectionne un format/module alternatif
3. L'utilisateur lance une nouvelle conversion
4. Nouvelle conversion avec des paramètres différents

### Considérations futures

#### Repli potentiels (non implémentés)

**Note :** Il s'agit d'améliorations futures potentielles, pas du comportement actuel.

- **Approximation de format :** Convertir vers un format similaire lorsque le format exact est indisponible
- **Conversion simplifiée :** Supprimer des fonctionnalités lorsque la conversion complète échoue
- **Repli multi-étapes :** Essayer automatiquement des chemins de conversion alternatifs

**Statut :** Il s'agit de considérations de conception pour les versions futures, pas de la politique actuelle.

---

## Statut canonique

Ce document est **canonique** et constitue la source de vérité pour :
- Le cycle de vie du pipeline
- Les étapes d'exécution
- La sélection des modules
- La gestion des erreurs
- Les codes et catégories d'erreur
- Le format de réponse d'erreur
- Les règles des messages d'erreur
- Les exigences de journalisation
- Les politiques de repli
- La justification de l'absence de repli
- La gestion des erreurs en l'absence de repli
- Les considérations futures

Toute modification du comportement de conversion doit d'abord être reflétée ici, puis propagée vers le code d'implémentation.
