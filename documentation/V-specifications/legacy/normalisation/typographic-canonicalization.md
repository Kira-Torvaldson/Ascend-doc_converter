> ⚠️ **Déprécié :** Le contenu a été migré vers les fichiers de référence canoniques.

# Canonisation typographique

## Objectif

Ce document définit les correspondances canoniques des caractères typographiques vers leurs équivalents ASCII. Cela garantit la compatibilité avec les analyseurs et convertisseurs qui peuvent ne pas gérer correctement les caractères typographiques.

## Correspondances de caractères

### Guillemets

| Typographique | ASCII | Unicode | Remplacement |
|-------------|-------|---------|-------------|
| Guillemet double ouvrant | `"` | U+201C | `"` (U+0022) |
| Guillemet double fermant | `"` | U+201D | `"` (U+0022) |
| Guillemet simple ouvrant | `'` | U+2018 | `'` (U+0027) |
| Guillemet simple fermant | `'` | U+2019 | `'` (U+0027) |

### Tirets

| Typographique | ASCII | Unicode | Remplacement |
|-------------|-------|---------|-------------|
| Tiret cadratin | `—` | U+2014 | `--` (deux traits d'union) |
| Tiret demi-cadratin | `–` | U+2013 | `-` (trait d'union simple) |

### Espaces

| Typographique | ASCII | Unicode | Remplacement |
|-------------|-------|---------|-------------|
| Espace insécable | ` ` | U+00A0 | ` ` (espace régulier, U+0020) |
| Espace de largeur nulle | `​` | U+200B | (supprimé) |
| Espace insécable de largeur nulle | `\uFEFF` | U+FEFF | (supprimé) |

### Autres caractères

| Typographique | ASCII | Unicode | Remplacement |
|-------------|-------|---------|-------------|
| Points de suspension | `…` | U+2026 | `...` (trois points) |
| Prime | `′` | U+2032 | `'` (guillemet simple) |
| Double prime | `″` | U+2033 | `"` (guillemet double) |

## Règles de remplacement

### Règle 1 : Préserver le sens

**Règle :** Les remplacements doivent préserver le sens sémantique du texte.

**Exemples :**
- `"quoted text"` → `"quoted text"` (guillemets préservés)
- `—em dash—` → `--em dash--` (tiret préservé)
- `'single quote'` → `'single quote'` (guillemet préservé)

### Règle 2 : Équivalents ASCII

**Règle :** Tous les remplacements utilisent des caractères ASCII standard.

**Justification :**
- Compatibilité maximale
- Compatible avec les analyseurs
- Aucun problème d'encodage

### Règle 3 : Préservation du contexte

**Règle :** Les remplacements préservent la structure et la mise en forme du document.

**Exemples :**
- Les espaces insécables dans le texte structuré peuvent être préservés dans certains contextes
- Les caractères de largeur nulle sont toujours supprimés (aucune valeur sémantique)

## Ordre d'application

La canonisation typographique est appliquée :
1. Après la normalisation de l'encodage
2. Avant la suppression des caractères de contrôle
3. Dans le cadre du pipeline de normalisation du texte

## Configuration

La canonisation typographique peut être :
- **Activée :** Toutes les correspondances appliquées (par défaut)
- **Désactivée :** Caractères originaux préservés
- **Sélective :** Des types de caractères spécifiques peuvent être exclus

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les correspondances de caractères typographiques
- Les règles de remplacement
- Les équivalents ASCII
- L'ordre d'application
