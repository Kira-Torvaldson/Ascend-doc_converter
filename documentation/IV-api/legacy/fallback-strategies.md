> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Stratégies de repli

## Objectif

Ce document définit les stratégies de repli canoniques utilisées par Ascend lorsque les méthodes de conversion principales échouent ou sont indisponibles.

## Principes de repli

### Principe 1 : Pas de replis silencieux

**Règle :** Les replis doivent être explicites et journalisés.

**Justification :**
- Sensibilisation de l'utilisateur à l'utilisation du repli
- Piste d'audit des décisions de repli
- Débogage et dépannage

### Principe 2 : Dégradation gracieuse

**Règle :** Le système se dégrade gracieusement lorsque les méthodes principales sont indisponibles.

**Comportement :**
- Messages d'erreur clairs
- Aucune conversion partielle
- État d'échec propre

### Principe 3 : Repli spécifique au format

**Règle :** Les replis sont spécifiques au format, pas génériques.

**Justification :**
- Maintient la qualité de conversion
- Prévient la corruption du format
- Erreur claire lorsqu'aucun repli n'est disponible

## Scénarios de repli

### Scénario 1 : Module indisponible

**Situation :** Le module de conversion requis n'est pas disponible.

**Repli :** Aucun

**Comportement :**
- Conversion rejetée immédiatement
- Erreur claire : « Conversion module not available »
- Aucune tentative de conversion alternative

**Justification :** Prévient la corruption du format par des modules incompatibles.

### Scénario 2 : Échec d'exécution du module

**Situation :** L'exécution du module échoue (crash, erreur).

**Repli :** Aucun

**Comportement :**
- Conversion marquée comme échouée
- Erreur journalisée avec les détails
- Aucune nouvelle tentative avec un module alternatif

**Justification :** L'échec indique un problème fondamental, pas un problème temporaire.

### Scénario 3 : Délai d'expiration

**Situation :** La conversion dépasse la limite de temps.

**Repli :** Aucun

**Comportement :**
- Processus arrêté
- Conversion marquée comme échouée
- Erreur : « Conversion timeout »

**Justification :** Le délai d'expiration indique un problème, pas une condition récupérable.

### Scénario 4 : Limite de ressources dépassée

**Situation :** La limite de ressources (mémoire, CPU) est dépassée.

**Repli :** Aucun

**Comportement :**
- Processus arrêté
- Conversion marquée comme échouée
- Erreur : « Resource limit exceeded »

**Justification :** Les limites de ressources sont des contraintes strictes.

## Politique sans repli

### Justification

**Règle :** Ascend n'implémente pas de replis automatiques.

**Raisons :**
1. **Intégrité du format :** Les replis peuvent corrompre le format
2. **Prévisibilité :** Les utilisateurs attendent un comportement cohérent
3. **Clarté des erreurs :** Des erreurs claires valent mieux que des replis silencieux
4. **Sécurité :** Les replis peuvent introduire des vulnérabilités

### Alternatives contrôlées par l'utilisateur

**Règle :** Les utilisateurs peuvent sélectionner manuellement des chemins de conversion alternatifs.

**Processus :**
1. L'utilisateur reçoit l'erreur
2. L'utilisateur sélectionne un format/module alternatif
3. L'utilisateur lance une nouvelle conversion
4. Nouvelle conversion avec des paramètres différents

## Considérations futures

### Repli potentiels (non implémentés)

**Note :** Il s'agit d'améliorations futures potentielles, pas du comportement actuel.

- **Approximation de format :** Convertir vers un format similaire lorsque le format exact est indisponible
- **Conversion simplifiée :** Supprimer des fonctionnalités lorsque la conversion complète échoue
- **Repli multi-étapes :** Essayer automatiquement des chemins de conversion alternatifs

**Statut :** Il s'agit de considérations de conception pour les versions futures, pas de la politique actuelle.

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les politiques de repli
- La justification de l'absence de repli
- La gestion des erreurs en l'absence de repli
- Les considérations futures
