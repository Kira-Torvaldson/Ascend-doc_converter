> ⚠️ **Déprécié :** Le contenu a été migré vers les fichiers de référence canoniques.

# Profil Community

## Objectif

Ce document définit la configuration canonique du profil Community pour Ascend. Ce profil représente l'édition communautaire open source par défaut.

## Caractéristiques du profil

### Public cible

- Développeurs individuels
- Petites équipes
- Projets open source
- Cas d'usage personnels

### Ensemble de fonctionnalités

**Inclus :**
- Conversion AsciiDoc ↔ Markdown
- Normalisation de base
- Fonctionnalités de sécurité standard
- Exécution locale uniquement
- Journalisation de base

**Exclus :**
- Prise en charge avancée des formats (PDF, DOCX, etc.)
- Fonctionnalités de sécurité entreprise
- Surveillance avancée
- Limitation du débit API (au-delà du basique)
- Support prioritaire

### Limites de ressources

- **Conversions simultanées :** 5
- **Limite de taille de fichier :** 10 MB
- **Délai d'expiration :** 30 secondes
- **Mémoire par conversion :** 512 MB

### Formats pris en charge

- **Entrée :** AsciiDoc, Markdown, Plain Text
- **Sortie :** Markdown, AsciiDoc

### Niveau de sécurité

- **Sandboxing :** Léger (V1)
- **Isolation réseau :** Prévu (V2)
- **Isolation utilisateur :** Prévu (V2)
- **Journalisation d'audit :** Basique

## Configuration

### Paramètres par défaut

- Profil d'exécution : `default`
- Normalisation : Standard
- Journalisation : Basique (rétention 30 jours)
- Rapport d'erreurs : Messages génériques

### Personnalisation

**Autorisé :**
- Ajustements des limites de ressources (dans les bornes)
- Options de conversion
- Préférences de l'interface utilisateur

**Restreint :**
- Modifications des fonctionnalités de sécurité
- Changements de la liste blanche des formats
- Modifications du pipeline principal

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les fonctionnalités du profil Community
- Les limites de ressources
- Les formats pris en charge
- Les options de configuration
