> ⚠️ **Deprecated:** Contenu migré vers les fichiers de référence canoniques.

# Configuration des profils d'exécution

## Objectif

Ce document définit les profils d'exécution canoniques qui contrôlent la manière dont les conversions sont exécutées. Les profils d'exécution déterminent les limites de ressources, les valeurs de délai d'expiration et les contrôles de concurrence.

## Types de profils

### Profil par défaut

**Identifiant :** `default`  
**Cas d'usage :** Conversions de documents standard  
**Limites de ressources :**
- **Délai d'expiration :** 30 secondes
- **Mémoire max :** 512 Mo
- **CPU max :** 100 % (cœur unique)
- **Taille de fichier max :** 10 Mo
- **Conversions concurrentes :** 5

### Profil strict

**Identifiant :** `strict`  
**Cas d'usage :** Environnements à haute sécurité, entrées non fiables  
**Limites de ressources :**
- **Délai d'expiration :** 15 secondes
- **Mémoire max :** 256 Mo
- **CPU max :** 50 % (cœur unique)
- **Taille de fichier max :** 5 Mo
- **Conversions concurrentes :** 2

### Profil performance

**Identifiant :** `performance`  
**Cas d'usage :** Fichiers volumineux, traitement par lots  
**Limites de ressources :**
- **Délai d'expiration :** 120 secondes
- **Mémoire max :** 2 Go
- **CPU max :** 100 % (cœur unique)
- **Taille de fichier max :** 50 Mo
- **Conversions concurrentes :** 3

## Sélection du profil

Les profils sont sélectionnés en fonction de :
1. Configuration explicite de l'utilisateur (si fournie)
2. Type de conversion (simple vs. complexe)
3. Conditions de charge du système
4. Exigences de sécurité

## Application des limites de ressources

Toutes les limites de ressources sont appliquées au niveau du pipeline :
- **Délai d'expiration :** Appliqué via la surveillance du processus et SIGTERM/SIGKILL
- **Mémoire :** Surveillée via le suivi RSS du processus
- **CPU :** Limité via la priorité et l'ordonnancement du processus
- **Taille de fichier :** Validée avant le début de la conversion
- **Concurrence :** Appliquée via un mécanisme de sémaphore/file d'attente

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les limites de ressources par défaut
- Les configurations de profils
- Les valeurs de délai d'expiration
- Les contrôles de concurrence
