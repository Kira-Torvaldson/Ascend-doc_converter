> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Modèle de menaces

## Objectif

Ce document définit le modèle de menaces canonique pour Ascend. Il identifie les menaces de sécurité potentielles et les mesures d'atténuation mises en œuvre pour les traiter.

## Catégories de menaces

### 1. Attaques par validation des entrées

**Menace :** Entrée malveillante ou malformée provoquant une compromission du système.

**Vecteurs d'attaque :**
- Traversée de chemin (séquences `../`)
- Fichiers surdimensionnés (épuisement des ressources)
- Fichiers binaires déguisés en texte
- Encodage invalide provoquant des crashs du parseur

**Mesures d'atténuation :**
- Validation stricte des chemins
- Limites de taille de fichier
- Validation du type MIME
- Normalisation de l'encodage
- Application de la liste blanche des formats

### 2. Attaques par épuisement des ressources

**Menace :** Consommation excessive de ressources provoquant un déni de service.

**Vecteurs d'attaque :**
- Téléversements de gros fichiers
- Nombreuses conversions concurrentes
- Épuisement de la mémoire
- Épuisement du CPU

**Mesures d'atténuation :**
- Limites de taille de fichier (10 MB par défaut)
- Limites de conversions concurrentes (5 par défaut)
- Limites de mémoire par conversion (512 MB par défaut)
- Limites CPU par conversion
- Application du délai d'expiration (30 secondes par défaut)
- Dégradation gracieuse sous charge

### 3. Attaques par injection de code

**Menace :** Exécution de code arbitraire via une entrée malveillante.

**Vecteurs d'attaque :**
- Injection de commandes dans les chemins de fichiers
- Injection de code dans le contenu
- Manipulation de processus

**Mesures d'atténuation :**
- Validation des chemins (aucune entrée utilisateur dans les chemins)
- Construction de commandes basée sur une liste blanche
- Isolation des processus (sandboxing)
- Pas de `eval()` ni d'exécution dynamique de code

### 4. Exfiltration de données

**Menace :** Transmission non autorisée de données en dehors du système.

**Vecteurs d'attaque :**
- Accès réseau depuis les modules de conversion
- Accès au système de fichiers en dehors du répertoire temporaire
- Journalisation de données sensibles

**Mesures d'atténuation :**
- Accès réseau bloqué pendant la conversion
- Accès au système de fichiers restreint au répertoire temporaire
- Aucune donnée sensible dans les journaux
- La validation des chemins empêche l'accès externe

### 5. Élévation de privilèges

**Menace :** Obtention de privilèges système élevés.

**Vecteurs d'attaque :**
- Exploitation des privilèges de processus
- Accès aux fichiers système
- Modification de la configuration système

**Mesures d'atténuation :**
- Exécution non privilégiée (prévu V2)
- Restrictions du système de fichiers
- Aucun accès aux fichiers système
- Les limites de ressources limitent l'impact sur le système

### 6. Divulgation d'informations

**Menace :** Fuite d'informations sensibles du système ou de l'utilisateur.

**Vecteurs d'attaque :**
- Messages d'erreur exposant des détails système
- Journaux contenant des données sensibles
- Chemins de fichiers dans les messages d'erreur

**Mesures d'atténuation :**
- Messages d'erreur génériques
- Aucun chemin système dans les erreurs
- Assainissement des journaux
- Aucun contenu utilisateur dans les journaux

## Contrôles de sécurité

### Défense en profondeur

**Principe :** Plusieurs couches de contrôles de sécurité.

**Couches :**
1. Validation des entrées
2. Sandboxing/isolation
3. Limites de ressources
4. Gestion des erreurs
5. Journalisation et surveillance

### Échec sécurisé

**Principe :** Le système échoue dans un état sécurisé.

**Implémentation :**
- Rejet immédiat des entrées invalides
- Aucun traitement de données non validées
- Nettoyage en cas d'échec
- Aucune exposition d'état partiel

### Moindre privilège

**Principe :** Privilèges et accès minimaux nécessaires.

**Implémentation :**
- Accès restreint au système de fichiers
- Aucun accès réseau
- Limites de ressources
- Environnement d'exécution isolé

## Évaluation des risques

### Risque élevé

- Attaques par traversée de chemin → **Atténué :** Validation stricte des chemins
- Épuisement des ressources → **Atténué :** Limites et surveillance
- Injection de code → **Atténué :** Sandboxing et validation

### Risque moyen

- Exfiltration de données → **Atténué :** Blocage réseau (V2)
- Élévation de privilèges → **Atténué :** Isolation (V2)
- Divulgation d'informations → **Atténué :** Assainissement des erreurs

### Risque faible

- Déni de service (utilisateur unique) → **Atténué :** Limites de ressources
- Injection dans les journaux → **Atténué :** Assainissement des journaux

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les menaces identifiées
- Les vecteurs d'attaque
- Les stratégies d'atténuation
- L'évaluation des risques
