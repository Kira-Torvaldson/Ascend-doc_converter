# Spécification d'architecture

## Objectif

Ce document définit l'architecture canonique d'Ascend. Il décrit les composants du système, leurs relations et les principes architecturaux.

## Principes architecturaux

### Principe 1 : Local-First

**Définition :** Tout le traitement s'effectue localement, sans dépendances externes.

**Implémentation :**
- Aucun accès réseau pendant la conversion
- Aucun appel à une API externe
- Tous les moteurs s'exécutent localement
- Les données ne quittent jamais le système

### Principe 2 : Modularité

**Définition :** Système composé de modules indépendants et interchangeables.

**Implémentation :**
- Interface de module standard
- Chargement paresseux des modules
- Isolation des modules
- Architecture extensible

### Principe 3 : Isolation

**Définition :** Chaque conversion s'exécute en isolation complète.

**Implémentation :**
- Répertoire temporaire unique par conversion
- Aucun état partagé
- Limites de ressources par conversion
- Séparation claire des responsabilités

### Principe 4 : Sécurité dès la conception

**Définition :** La sécurité est intégrée à l'architecture, pas ajoutée après coup.

**Implémentation :**
- Validation des entrées aux frontières
- Exécution en bac à sable
- Limites de ressources
- Journalisation complète

## Composants du système

### Couche frontend

**Technologie :** React 18 + TypeScript + Vite

**Composants :**
- Composants UI (Panel, FormatSelector, Modal, etc.)
- Services de conversion (clients API)
- Service de traitement par lots
- Gestion d'état (hooks React)

**Responsabilités :**
- Interface utilisateur
- Interaction utilisateur
- Communication API
- Validation côté client

### Couche backend

**Technologie :** Node.js + Express

**Composants :**
- Routes API (conversion, sécurité, journaux)
- Services de conversion
- Modules de sécurité
- Système de journalisation
- Orchestrateurs

**Responsabilités :**
- Traitement des requêtes
- Orchestration de la conversion
- Application de la sécurité
- Gestion des ressources

### Couche de conversion

**Technologie :** Architecture modulaire

**Composants :**
- Modules de conversion (downdoc, pandoc, text2markdown, etc.)
- Système de chargement paresseux
- Orchestrateur de conversion
- Orchestrateur d'exécution

**Responsabilités :**
- Conversion de format
- Sélection du module
- Coordination de l'exécution
- Validation du résultat

### Couche sécurité

**Technologie :** Modules de sécurité intégrés

**Composants :**
- Sécurité du pipeline (concurrence, ressources, anomalies)
- Validation des entrées
- Bac à sable (V1 : léger, V2 : renforcé)
- Gestion des jetons

**Responsabilités :**
- Application de la sécurité
- Détection des menaces
- Protection des ressources
- Journalisation d'audit

## Flux de données

### Flux de requête de conversion

1. **Frontend :** L'utilisateur initie la conversion
2. **API :** Requête reçue et validée
3. **Sécurité :** Contrôles de sécurité (concurrence, ressources, validation)
4. **Orchestrateur :** Chemin de conversion déterminé
5. **Module :** Conversion exécutée
6. **Résultat :** Sortie validée et renvoyée
7. **Nettoyage :** Ressources libérées

### Flux des fichiers

1. **Entrée :** Contenu utilisateur → Fichier temporaire
2. **Traitement :** Fichier temporaire → Module → Fichier de sortie temporaire
3. **Sortie :** Fichier de sortie temporaire → Contenu du résultat
4. **Nettoyage :** Tous les fichiers temporaires supprimés

## Relations entre composants

### Frontend ↔ Backend

**Communication :** API REST HTTP  
**Protocole :** JSON  
**Authentification :** Aucune (local-first)  
**Sécurité :** CORS, validation des entrées

### Backend ↔ Modules

**Communication :** Basée sur les fichiers  
**Protocole :** Chemins de fichiers, interface standard  
**Isolation :** Répertoires temporaires  
**Sécurité :** Bac à sable, limites de ressources

### Orchestrateur ↔ Modules

**Communication :** Interface standard  
**Protocole :** `run(inputPath, outputPath, options)`  
**Coordination :** Exécution séquentielle  
**Sécurité :** Validation, surveillance

## Modèles architecturaux

### Modèle 1 : Architecture en pipeline

**Description :** Pipeline de traitement linéaire avec étapes.

**Étapes :**
1. Validation des entrées
2. Préparation
3. Exécution
4. Finalisation
5. Nettoyage

### Modèle 2 : Registre de modules

**Description :** Registre central des modules disponibles.

**Implémentation :**
- L'orchestrateur de conversion maintient le registre
- Découverte dynamique des modules
- Chargement paresseux à la demande

### Modèle 3 : Modèle orchestrateur

**Description :** L'orchestrateur principal délègue à l'orchestrateur d'exécution.

**Séparation :**
- Principal : Traitement des requêtes, contrôle de charge
- Exécution : Exécution étape par étape

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les principes architecturaux
- Les composants du système
- Le flux de données
- Les relations entre composants
