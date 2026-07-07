# Principes Local-First

## Objectif

Ce document définit les principes canoniques Local-First d'Ascend. Ces principes guident toutes les décisions de conception et d'implémentation.

## Principes fondamentaux

### Principe 1 : Aucune dépendance externe

**Règle :** Les fonctionnalités essentielles ne doivent pas dépendre de services externes.

**Exigences :**
- Aucun appel API vers des services externes
- Aucune dépendance cloud
- Aucune connexion Internet requise
- Tous les moteurs s'exécutent localement

**Justification :** Garantit la fiabilité, la confidentialité et le fonctionnement hors ligne.

### Principe 2 : Localité des données

**Règle :** Toutes les données restent sur le système local.

**Exigences :**
- Aucune transmission de données vers des serveurs externes
- Aucun stockage cloud
- Aucun service de journalisation externe
- Tout le traitement est local

**Justification :** Confidentialité, sécurité et performances.

### Principe 3 : Fonctionnement hors ligne

**Règle :** Le système doit fonctionner sans connectivité réseau.

**Exigences :**
- Toutes les fonctionnalités fonctionnent hors ligne
- Aucune vérification réseau requise
- Aucune activation en ligne
- Aucune télémétrie (sauf si explicitement activée)

**Justification :** Fiabilité et contrôle par l'utilisateur.

### Principe 4 : Efficacité des ressources

**Règle :** Le système doit être économe en ressources.

**Exigences :**
- Empreinte mémoire minimale
- Utilisation CPU efficace
- Chargement paresseux des modules
- Limites de ressources appliquées

**Justification :** Adapté au déploiement local et aux systèmes à faibles ressources.

### Principe 5 : Contrôle utilisateur

**Règle :** Les utilisateurs ont un contrôle total sur le système.

**Exigences :**
- Aucune mise à jour forcée
- Comportement configurable
- Données contrôlées par l'utilisateur
- Fonctionnement transparent

**Justification :** Autonomie et confiance de l'utilisateur.

## Lignes directrices d'implémentation

### Accès réseau

**Règle :** L'accès réseau est interdit pendant la conversion.

**Application :**
- Surveillance réseau (V2)
- Le bac à sable empêche l'accès réseau
- Violations de sécurité journalisées

### Services externes

**Règle :** Aucune dépendance à un service externe.

**Exceptions :**
- Télémétrie optionnelle (activée par l'utilisateur)
- Vérifications de mise à jour optionnelles (activées par l'utilisateur)
- Liens de documentation (lecture seule)

### Stockage des données

**Règle :** Toutes les données sont stockées localement.

**Emplacements :**
- Fichiers temporaires : Répertoire temporaire système
- Journaux : Répertoire `api/logs/`
- Configuration : Fichiers locaux
- Données utilisateur : LocalStorage (frontend)

### Gestion des ressources

**Règle :** Utilisation efficace des ressources.

**Stratégies :**
- Chargement paresseux des modules
- Limites de ressources par conversion
- Nettoyage après chaque conversion
- Aucune accumulation de ressources

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les principes Local-First
- Les lignes directrices d'implémentation
- Les politiques réseau et données
- La gestion des ressources
