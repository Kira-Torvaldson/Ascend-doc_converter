# Référence des profils

## Objectif

Ce document définit les références canoniques des profils pour Ascend, incluant les profils Community, Pro et Enterprise. Il constitue la référence faisant autorité pour toutes les configurations de profils.

---

## Profil Community

### Objectif

Cette section définit la configuration canonique du profil Community pour Ascend. Ce profil représente l'édition communautaire open source par défaut.

### Caractéristiques du profil

#### Public cible

- Développeurs individuels
- Petites équipes
- Projets open source
- Cas d'usage personnels

#### Ensemble de fonctionnalités

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
- Limitation de débit API (au-delà du niveau de base)
- Support prioritaire

#### Limites de ressources

- **Conversions simultanées :** 5
- **Limite de taille de fichier :** 10 Mo
- **Délai d'expiration (timeout) :** 30 secondes
- **Mémoire par conversion :** 512 Mo

#### Formats pris en charge

- **Entrée :** AsciiDoc, Markdown, texte brut
- **Sortie :** Markdown, AsciiDoc

#### Niveau de sécurité

- **Sandboxing :** Léger (V1)
- **Isolation réseau :** Prévu (V2)
- **Isolation utilisateur :** Prévu (V2)
- **Journalisation d'audit :** Basique

### Configuration

#### Paramètres par défaut

- Profil d'exécution : `default`
- Normalisation : Standard
- Journalisation : Basique (rétention 30 jours)
- Rapports d'erreur : Messages génériques

#### Personnalisation

**Autorisé :**
- Ajustements des limites de ressources (dans les bornes)
- Options de conversion
- Préférences de l'interface utilisateur

**Restreint :**
- Modifications des fonctionnalités de sécurité
- Modifications de la liste blanche de formats
- Modifications du pipeline principal

---

## Profil Pro

### Objectif

Cette section définit la configuration canonique du profil Pro pour Ascend. Ce profil représente une future édition commerciale avec des fonctionnalités avancées.

### Caractéristiques du profil

#### Public cible

- Développeurs professionnels
- Petites et moyennes entreprises
- Projets commerciaux
- Équipes nécessitant des fonctionnalités avancées

#### Ensemble de fonctionnalités

**Inclus :**
- Toutes les fonctionnalités Community
- Prise en charge étendue des formats (HTML, PDF, YAML, JSON)
- Options de normalisation avancées
- Fonctionnalités de sécurité renforcées
- Journalisation étendue (rétention 90 jours)
- Support prioritaire

**Exclus :**
- Fonctionnalités de sécurité entreprise
- Tableaux de bord de surveillance avancés
- Intégrations personnalisées
- Garanties SLA

#### Limites de ressources

- **Conversions simultanées :** 10
- **Limite de taille de fichier :** 50 Mo
- **Délai d'expiration (timeout) :** 120 secondes
- **Mémoire par conversion :** 2 Go

#### Formats pris en charge

- **Entrée :** AsciiDoc, Markdown, HTML, texte brut, PDF, YAML, JSON
- **Sortie :** Markdown, AsciiDoc, HTML, PDF, YAML, JSON

#### Niveau de sécurité

- **Sandboxing :** Renforcé (V2)
- **Isolation réseau :** Active
- **Isolation utilisateur :** Active
- **Journalisation d'audit :** Étendue

### Configuration

#### Paramètres par défaut

- Profil d'exécution : `performance`
- Normalisation : Avancée
- Journalisation : Étendue (rétention 90 jours)
- Rapports d'erreur : Détaillés (avec diagnostics)

#### Personnalisation

**Autorisé :**
- Toutes les personnalisations Community
- Limites de ressources étendues
- Options de conversion avancées
- Profils d'exécution personnalisés

**Restreint :**
- Fonctionnalités de sécurité entreprise
- Prise en charge de formats personnalisés
- Modifications du pipeline principal

**Note :** Ce profil est prévu pour une future version et n'est pas actuellement implémenté.

---

## Profil Enterprise

### Objectif

Cette section définit la configuration canonique du profil Enterprise pour Ascend. Ce profil représente une future édition entreprise avec un maximum de fonctionnalités et de sécurité.

### Caractéristiques du profil

#### Public cible

- Grandes entreprises
- Secteurs réglementés
- Environnements à haute sécurité
- Organisations nécessitant la conformité

#### Ensemble de fonctionnalités

**Inclus :**
- Toutes les fonctionnalités Pro
- Prise en charge complète des formats (tous les formats prévus)
- Fonctionnalités de sécurité entreprise
- Surveillance avancée et tableaux de bord
- Intégrations personnalisées
- Garanties SLA
- Support dédié

**Exclus :**
- Aucun (ensemble complet de fonctionnalités)

#### Limites de ressources

- **Conversions simultanées :** 20
- **Limite de taille de fichier :** 100 Mo
- **Délai d'expiration (timeout) :** 300 secondes
- **Mémoire par conversion :** 4 Go

#### Formats pris en charge

- **Entrée :** Tous les formats (AsciiDoc, Markdown, HTML, PDF, DOCX, RTF, YAML, JSON, TXT, etc.)
- **Sortie :** Tous les formats

#### Niveau de sécurité

- **Sandboxing :** Maximum (V2+)
- **Isolation réseau :** Stricte
- **Isolation utilisateur :** Stricte
- **Journalisation d'audit :** Complète
- **Conformité :** ISO 27001, NIST SP 800-53, GDPR/RGPD

### Configuration

#### Paramètres par défaut

- Profil d'exécution : `strict` (orienté sécurité)
- Normalisation : Maximum
- Journalisation : Complète (rétention 1 an)
- Rapports d'erreur : Détaillés avec suivi de conformité

#### Personnalisation

**Autorisé :**
- Toutes les personnalisations Pro
- Limites de ressources entreprise
- Politiques de sécurité personnalisées
- Prise en charge de formats personnalisés
- Intégrations personnalisées

**Restreint :**
- Fonctionnalités de sécurité principales (ne peuvent pas être désactivées)
- Exigences de conformité (ne peuvent pas être contournées)

### Fonctionnalités de conformité

#### Prise en charge des normes

- **ISO 27001 :** Gestion de la sécurité de l'information
- **ISO 27002 :** Contrôles de sécurité
- **NIST SP 800-53 :** Contrôles de sécurité et de confidentialité
- **GDPR/RGPD :** Conformité à la protection des données

#### Fonctionnalités d'audit

- Journalisation d'audit complète
- Stockage de journaux immuable
- Rapports de conformité
- Suivi des événements de sécurité

**Note :** Ce profil est prévu pour une future version et n'est pas actuellement implémenté.

---

## Statut canonique

Ce document est **canonique** et constitue la source de vérité pour :
- Les fonctionnalités du profil Community
- Les limites de ressources
- Les formats pris en charge
- Les options de configuration
- Les fonctionnalités du profil Pro
- Les fonctionnalités du profil Enterprise
- Les fonctionnalités de conformité

Toute modification des configurations de profils doit d'abord être reflétée ici, puis propagée vers le code d'implémentation.
