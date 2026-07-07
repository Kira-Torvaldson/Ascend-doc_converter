> ⚠️ **Deprecated:** Contenu migré vers les fichiers de référence canoniques.

# Limites de ressources

## Objectif

Ce document définit les limites de ressources canoniques appliquées par le pipeline Ascend. Ces limites protègent le système contre l'épuisement des ressources et assurent une allocation équitable.

## Catégories de limites

### Limites de temps

| Type de limite | Valeur par défaut | Valeur maximale | Application |
|------------|---------------|---------------|-------------|
| Délai d'expiration de conversion | 30 secondes | 300 secondes | Arrêt du processus (SIGTERM → SIGKILL) |
| Expiration du jeton | 60 secondes | 300 secondes | Validation du jeton |
| Délai d'expiration de requête | 30 secondes | 60 secondes | Délai d'expiration HTTP |

### Limites de mémoire

| Type de limite | Valeur par défaut | Valeur maximale | Application |
|------------|---------------|---------------|-------------|
| Mémoire par conversion | 512 Mo | 2 Go | Surveillance du processus + arrêt |
| Mémoire système totale | 2 Go | 4 Go | Dégradation gracieuse |
| Taille du fichier d'entrée | 10 Mo | 50 Mo | Pré-validation |

### Limites CPU

| Type de limite | Valeur par défaut | Valeur maximale | Application |
|------------|---------------|---------------|-------------|
| CPU par processus | 100 % (1 cœur) | 100 % (1 cœur) | Priorité du processus |
| CPU système total | 80 % | 95 % | Dégradation gracieuse |

### Limites de concurrence

| Type de limite | Valeur par défaut | Valeur maximale | Application |
|------------|---------------|---------------|-------------|
| Conversions concurrentes | 5 | 10 | Sémaphore/file d'attente |
| Requêtes en attente | 20 | 50 | File d'attente des requêtes |

## Règles d'application des limites

### 1. Limites strictes

Les limites strictes ne peuvent être dépassées en aucune circonstance :
- Limites de taille de fichier (validées avant le traitement)
- Valeurs maximales de délai d'expiration
- Nombre maximal de conversions concurrentes

### 2. Limites souples

Les limites souples déclenchent des avertissements ou une dégradation :
- Utilisation mémoire proche de la limite → avertissement dans les journaux
- Utilisation CPU élevée → réduction de la priorité des nouvelles conversions
- Charge système élevée → refus des nouvelles conversions

### 3. Dégradation gracieuse

Lorsque les limites sont approchées :
- Les nouvelles conversions sont refusées avec des messages d'erreur explicites
- Les conversions en cours se poursuivent jusqu'à achèvement
- L'état du système est surveillé et journalisé
- La reprise est automatique lorsque la charge diminue

## Configuration des limites

Les limites peuvent être configurées via :
- Variables d'environnement (pour le déploiement)
- Fichiers de configuration (pour l'ajustement par instance)
- Paramètres API (pour les surcharges par requête, dans les bornes)

Toute configuration doit respecter les valeurs maximales définies dans ce document.

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les limites de ressources par défaut
- Les valeurs maximales autorisées
- Les mécanismes d'application
- Les politiques de dégradation
