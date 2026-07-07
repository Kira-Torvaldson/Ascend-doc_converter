> ⚠️ **Déprécié :** Le contenu a été migré vers les fichiers de référence canoniques.

# Profil Pro

## Objectif

Ce document définit la configuration canonique du profil Pro pour Ascend. Ce profil représente une future édition commerciale avec des fonctionnalités améliorées.

## Caractéristiques du profil

### Public cible

- Développeurs professionnels
- Petites et moyennes entreprises
- Projets commerciaux
- Équipes nécessitant des fonctionnalités avancées

### Ensemble de fonctionnalités

**Inclus :**
- Toutes les fonctionnalités Community
- Prise en charge étendue des formats (HTML, PDF, YAML, JSON)
- Options avancées de normalisation
- Fonctionnalités de sécurité améliorées
- Journalisation étendue (rétention 90 jours)
- Support prioritaire

**Exclus :**
- Fonctionnalités de sécurité entreprise
- Tableaux de bord de surveillance avancés
- Intégrations personnalisées
- Garanties SLA

### Limites de ressources

- **Conversions simultanées :** 10
- **Limite de taille de fichier :** 50 MB
- **Délai d'expiration :** 120 secondes
- **Mémoire par conversion :** 2 GB

### Formats pris en charge

- **Entrée :** AsciiDoc, Markdown, HTML, Plain Text, PDF, YAML, JSON
- **Sortie :** Markdown, AsciiDoc, HTML, PDF, YAML, JSON

### Niveau de sécurité

- **Sandboxing :** Amélioré (V2)
- **Isolation réseau :** Active
- **Isolation utilisateur :** Active
- **Journalisation d'audit :** Étendue

## Configuration

### Paramètres par défaut

- Profil d'exécution : `performance`
- Normalisation : Avancée
- Journalisation : Étendue (rétention 90 jours)
- Rapport d'erreurs : Détaillé (avec diagnostics)

### Personnalisation

**Autorisé :**
- Toutes les personnalisations Community
- Limites de ressources étendues
- Options de conversion avancées
- Profils d'exécution personnalisés

**Restreint :**
- Fonctionnalités de sécurité entreprise
- Prise en charge de formats personnalisés
- Modifications du pipeline principal

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les fonctionnalités du profil Pro
- Les limites de ressources
- Les formats pris en charge
- Les options de configuration

**Note :** Ce profil est prévu pour une future version, il n'est pas actuellement implémenté.
