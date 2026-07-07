> ⚠️ **Déprécié :** Le contenu a été migré vers les fichiers de référence canoniques.

# Règles d'encodage

## Objectif

Ce document définit les règles canoniques d'encodage pour Ascend. Il spécifie comment l'encodage du texte est détecté, normalisé et géré tout au long du pipeline de conversion.

## Normes d'encodage

### Encodage principal : UTF-8

**Règle :** UTF-8 est l'encodage principal et préféré pour tout traitement de texte.

**Justification :**
- Compatibilité universelle
- Prend en charge tous les caractères Unicode
- Norme pour les applications modernes
- Aucun BOM requis (bien que le BOM soit supprimé s'il est présent)

### Encodages pris en charge

| Encodage | Identifiant | Statut | Cas d'usage |
|----------|-----------|--------|----------|
| UTF-8 | `utf-8` | ✅ Principal | Tout texte moderne |
| ASCII | `ascii` | ✅ Pris en charge | Texte ASCII brut |
| Latin-1 | `latin1`, `iso-8859-1` | ✅ Pris en charge | Documents hérités |
| Windows-1252 | `windows-1252`, `cp1252` | ⚠️ Auto-détecté | Fichiers hérités Windows |

## Détection de l'encodage

### Détection automatique

**Règle :** Lorsque l'encodage n'est pas spécifié, tenter une détection automatique.

**Ordre de détection :**
1. Vérifier la présence d'un BOM UTF-8
2. Valider les séquences d'octets UTF-8
3. Tenter le décodage Windows-1252
4. Repli vers Latin-1 (si activé)

### Stratégie de détection

**Par défaut :** `auto` avec priorité UTF-8

**Processus :**
1. Si un BOM est présent, utiliser l'encodage du BOM
2. Valider les séquences d'octets UTF-8
3. Si UTF-8 invalide, tenter Windows-1252
4. Si toujours invalide, utiliser Latin-1 (si le repli est activé)

## Normalisation de l'encodage

### Encodage d'entrée

**Règle :** Tout le texte d'entrée est normalisé en UTF-8 avant le traitement.

**Processus :**
1. Détecter ou utiliser l'encodage spécifié
2. Décoder en UTF-8
3. Traiter les séquences invalides selon la stratégie
4. Continuer avec le texte UTF-8

### Encodage de sortie

**Règle :** Tout le texte de sortie est écrit en UTF-8.

**Exception :** Aucune. UTF-8 est toujours utilisé pour la sortie.

## Gestion des caractères invalides

### Stratégies

| Stratégie | Comportement | Cas d'usage |
|----------|----------|----------|
| `replace` | Remplacement par U+FFFD () | Par défaut, sûr |
| `remove` | Suppression des caractères invalides | Lorsque la structure doit être préservée |
| `fail` | Lancer une erreur immédiatement | Validation stricte |
| `transliterate` | Conversion en équivalent ASCII | Compatibilité héritée |

**Par défaut :** `replace`

## Normalisation Unicode

### Formes de normalisation

| Forme | Description | Cas d'usage |
|------|-------------|----------|
| `NFC` | Composition canonique | Par défaut, recommandé |
| `NFKC` | Composition de compatibilité | Normalisation agressive |
| `none` | Aucune normalisation | Préserver la représentation exacte |

**Par défaut :** `NFC`

**Règle :** La normalisation NFC est appliquée par défaut pour garantir une représentation cohérente des caractères sans altérer le sens.

## Gestion du BOM

### Suppression du BOM

**Règle :** Les caractères BOM sont toujours supprimés du texte d'entrée.

**Justification :**
- Le BOM peut casser les analyseurs
- UTF-8 ne nécessite pas de BOM
- Représentation cohérente du texte

### BOM en sortie

**Règle :** Le BOM n'est jamais ajouté aux fichiers de sortie.

**Justification :**
- UTF-8 ne nécessite pas de BOM
- Le BOM peut causer des problèmes dans certains outils
- Format de sortie cohérent

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les normes et priorités d'encodage
- Les stratégies de détection
- Les règles de normalisation
- La gestion des caractères invalides
