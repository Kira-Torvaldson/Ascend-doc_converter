> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Règles de sandboxing

## Objectif

Ce document définit les règles canoniques de sandboxing pour Ascend. Le sandboxing garantit que les modules de conversion s'exécutent dans des environnements isolés et sécurisés avec un accès restreint aux ressources système.

## Principes d'isolation

### Principe 1 : Répertoire temporaire unique

**Règle :** Chaque conversion s'exécute dans un répertoire temporaire unique et isolé.

**Exigences :**
- Répertoire créé avec un nom basé sur UUID
- Permissions : 0o700 (accès propriétaire uniquement)
- Situé dans le répertoire temporaire système
- Supprimé après l'achèvement de la conversion (succès ou échec)

### Principe 2 : Aucun accès réseau

**Règle :** Les modules de conversion ne doivent pas avoir d'accès réseau pendant l'exécution.

**Application :**
- Les tentatives d'accès réseau sont détectées et bloquées
- Les violations entraînent l'arrêt immédiat de la conversion
- Événement de sécurité journalisé

**Justification :** Prévient l'exfiltration de données et les dépendances externes.

### Principe 3 : Accès restreint au système de fichiers

**Règle :** Les modules ne peuvent accéder qu'aux fichiers de leur répertoire temporaire assigné.

**Autorisé :**
- Lire le fichier d'entrée (fourni par le pipeline)
- Écrire le fichier de sortie (vers le chemin spécifié)
- Créer des fichiers temporaires (dans le répertoire temporaire)

**Interdit :**
- Accéder aux fichiers en dehors du répertoire temporaire
- Modifier les fichiers en dehors du répertoire temporaire
- Suivre les liens symboliques en dehors du répertoire temporaire
- Accéder aux répertoires système

### Principe 4 : Limites de ressources

**Règle :** Chaque conversion dispose de limites de ressources strictes appliquées par le pipeline.

**Limites :**
- CPU : 100 % d'un cœur unique (par défaut)
- Mémoire : 512 MB (par défaut, configurable)
- Temps : 30 secondes (par défaut, configurable)
- Taille de fichier : 10 MB en entrée (par défaut, configurable)

## Implémentation du sandbox

### Implémentation actuelle (V1)

**Niveau :** Isolation légère

**Mécanismes :**
- Répertoire temporaire unique par conversion
- Validation des chemins (prévient la traversée)
- Surveillance des ressources
- Application du délai d'expiration du processus

**Pas encore implémenté :**
- Isolation utilisateur (s'exécute sous le même utilisateur)
- Isolation par espace de noms réseau
- Sandboxing basé sur conteneurs
- Filtrage des appels système

### Implémentation future (V2+)

**Améliorations prévues :**
- Exécution sous un utilisateur dédié non privilégié
- Isolation par espace de noms réseau
- Sandboxing basé sur conteneurs (Docker, etc.)
- Filtrage des appels système (seccomp, etc.)
- Abandon des capacités

## Détection des violations

### Tentatives de traversée de chemin

**Détection :** Validation des chemins avant les opérations sur les fichiers

**Réponse :**
- Conversion immédiatement arrêtée
- Événement de sécurité journalisé
- Erreur renvoyée à l'utilisateur (message générique)

### Tentatives d'accès réseau

**Détection :** Surveillance réseau ou mécanismes de sandbox

**Réponse :**
- Conversion immédiatement arrêtée
- Événement de sécurité journalisé
- Erreur renvoyée à l'utilisateur (message générique)

### Violations des limites de ressources

**Détection :** Surveillance continue des ressources

**Réponse :**
- Processus arrêté (SIGTERM → SIGKILL)
- Conversion marquée comme échouée
- Événement journalisé avec les détails de la violation

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les principes de sandboxing
- Les exigences d'isolation
- Les limites de ressources
- Le traitement des violations
