# Référence de normalisation

## Objectif

Ce document définit les références canoniques de normalisation pour Ascend, incluant la normalisation du texte, les règles d'encodage et la canonisation typographique. Il constitue la référence faisant autorité pour toutes les opérations de normalisation.

---

## Normalisation du texte

### Objectif

Cette section définit les règles canoniques de normalisation du texte appliquées par Ascend. La normalisation garantit une représentation cohérente du texte et améliore la fiabilité des conversions.

### Étapes de normalisation

#### Étape 1 : Suppression du BOM

**Règle :** Supprimer tous les caractères BOM (Byte Order Mark) du texte d'entrée.

**Variantes de BOM :**
- BOM UTF-8 : `\uFEFF` (0xEF 0xBB 0xBF)
- BOM UTF-16 LE : 0xFF 0xFE
- BOM UTF-16 BE : 0xFE 0xFF

**Implémentation :** Supprimer le BOM au début du texte avant tout autre traitement.

#### Étape 2 : Normalisation de l'encodage

**Règle :** Normaliser l'encodage du texte en UTF-8.

**Processus :**
1. Détecter l'encodage actuel (s'il n'est pas spécifié)
2. Convertir en UTF-8
3. Gérer les séquences invalides selon la stratégie (remplacer, supprimer, échouer)

**Stratégie par défaut :** Remplacer les caractères invalides par le caractère de remplacement Unicode (U+FFFD).

#### Étape 3 : Remplacement des guillemets typographiques

**Règle :** Remplacer les guillemets typographiques par des guillemets ASCII standard.

**Remplacements :**
- Guillemet double ouvrant (`"`) → `"`
- Guillemet double fermant (`"`) → `"`
- Guillemet simple ouvrant (`'`) → `'`
- Guillemet simple fermant (`'`) → `'`

**Justification :** Les guillemets typographiques peuvent casser les analyseurs et convertisseurs. Les guillemets standard garantissent la compatibilité.

#### Étape 4 : Normalisation des caractères typographiques

**Règle :** Normaliser les caractères typographiques vers leurs équivalents ASCII.

**Remplacements :**
- Tiret cadratin (`—`) → `--`
- Tiret demi-cadratin (`–`) → `-`
- Espace insécable (` `) → ` ` (espace normale)
- Points de suspension (`…`) → `...`
- Espace de largeur nulle (`​`) → supprimé
- Espace insécable de largeur nulle (`\uFEFF`) → supprimé

**Justification :** Les caractères typographiques peuvent causer des problèmes d'analyse. Les équivalents ASCII garantissent la compatibilité.

#### Étape 5 : Suppression des caractères de contrôle

**Règle :** Supprimer les caractères de contrôle problématiques tout en préservant la mise en forme.

**Caractères préservés :**
- `\n` (0x0A) - Saut de ligne
- `\r` (0x0D) - Retour chariot
- `\t` (0x09) - Tabulation

**Caractères supprimés :**
- Tous les autres caractères de contrôle (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)

**Justification :** Les caractères de contrôle peuvent casser les analyseurs ou causer des problèmes de sécurité. Les caractères de mise en forme sont préservés.

### Ordre de normalisation

La normalisation doit être appliquée dans cet ordre exact :
1. Suppression du BOM (en premier)
2. Normalisation de l'encodage
3. Remplacement des guillemets typographiques
4. Normalisation des caractères typographiques
5. Suppression des caractères de contrôle (en dernier, pour préserver la mise en forme)

### Configuration

La normalisation peut être configurée via les options de conversion :
- `normalization.encoding` - Stratégie d'encodage
- `normalization.advanced.unicode.normalization` - Forme de normalisation Unicode (NFC, NFKC, none)
- `normalization.advanced.characterCleaning.*` - Options de nettoyage des caractères

---

## Règles d'encodage

### Objectif

Cette section définit les règles canoniques d'encodage pour Ascend. Elle spécifie comment l'encodage du texte est détecté, normalisé et géré tout au long du pipeline de conversion.

### Standards d'encodage

#### Encodage principal : UTF-8

**Règle :** UTF-8 est l'encodage principal et préféré pour tout traitement de texte.

**Justification :**
- Compatibilité universelle
- Prise en charge de tous les caractères Unicode
- Standard pour les applications modernes
- Aucun BOM requis (bien que le BOM soit supprimé s'il est présent)

### Encodages pris en charge

| Encodage | Identifiant | Statut | Cas d'usage |
|----------|-------------|--------|-------------|
| UTF-8 | `utf-8` | ✅ Principal | Tout texte moderne |
| ASCII | `ascii` | ✅ Pris en charge | Texte ASCII simple |
| Latin-1 | `latin1`, `iso-8859-1` | ✅ Pris en charge | Documents hérités |
| Windows-1252 | `windows-1252`, `cp1252` | ⚠️ Auto-détecté | Fichiers hérités Windows |

### Détection d'encodage

#### Détection automatique

**Règle :** Lorsque l'encodage n'est pas spécifié, tenter une détection automatique.

**Ordre de détection :**
1. Vérifier la présence d'un BOM UTF-8
2. Valider les séquences d'octets UTF-8
3. Tenter un décodage Windows-1252
4. Repli vers Latin-1 (si activé)

#### Stratégie de détection

**Par défaut :** `auto` avec priorité UTF-8

**Processus :**
1. Si un BOM est présent, utiliser l'encodage du BOM
2. Valider les séquences d'octets UTF-8
3. Si UTF-8 invalide, tenter Windows-1252
4. Si toujours invalide, utiliser Latin-1 (si le repli est activé)

### Normalisation de l'encodage

#### Encodage d'entrée

**Règle :** Tout texte d'entrée est normalisé en UTF-8 avant le traitement.

**Processus :**
1. Détecter ou utiliser l'encodage spécifié
2. Décoder en UTF-8
3. Gérer les séquences invalides selon la stratégie
4. Continuer avec le texte UTF-8

#### Encodage de sortie

**Règle :** Tout texte de sortie est écrit en UTF-8.

**Exception :** Aucune. UTF-8 est toujours utilisé pour la sortie.

### Gestion des caractères invalides

#### Stratégies

| Stratégie | Comportement | Cas d'usage |
|-----------|--------------|-------------|
| `replace` | Remplacer par U+FFFD () | Par défaut, sûr |
| `remove` | Supprimer les caractères invalides | Lorsque la structure doit être préservée |
| `fail` | Lever une erreur immédiatement | Validation stricte |
| `transliterate` | Convertir en équivalent ASCII | Compatibilité héritée |

**Par défaut :** `replace`

### Normalisation Unicode

#### Formes de normalisation

| Forme | Description | Cas d'usage |
|-------|-------------|-------------|
| `NFC` | Composition canonique | Par défaut, recommandé |
| `NFKC` | Composition de compatibilité | Normalisation agressive |
| `none` | Aucune normalisation | Préserver la représentation exacte |

**Par défaut :** `NFC`

**Règle :** La normalisation NFC est appliquée par défaut pour garantir une représentation cohérente des caractères sans altérer le sens.

### Gestion du BOM

#### Suppression du BOM

**Règle :** Les caractères BOM sont toujours supprimés du texte d'entrée.

**Justification :**
- Le BOM peut casser les analyseurs
- UTF-8 ne nécessite pas de BOM
- Représentation cohérente du texte

#### BOM en sortie

**Règle :** Le BOM n'est jamais ajouté aux fichiers de sortie.

**Justification :**
- UTF-8 ne nécessite pas de BOM
- Le BOM peut causer des problèmes dans certains outils
- Format de sortie cohérent

---

## Canonisation typographique

### Objectif

Cette section définit les correspondances canoniques des caractères typographiques vers leurs équivalents ASCII. Cela garantit la compatibilité avec les analyseurs et convertisseurs qui peuvent ne pas gérer correctement les caractères typographiques.

### Correspondances de caractères

#### Guillemets

| Typographique | ASCII | Unicode | Remplacement |
|---------------|-------|---------|--------------|
| Guillemet double ouvrant | `"` | U+201C | `"` (U+0022) |
| Guillemet double fermant | `"` | U+201D | `"` (U+0022) |
| Guillemet simple ouvrant | `'` | U+2018 | `'` (U+0027) |
| Guillemet simple fermant | `'` | U+2019 | `'` (U+0027) |

#### Tirets

| Typographique | ASCII | Unicode | Remplacement |
|---------------|-------|---------|--------------|
| Tiret cadratin | `—` | U+2014 | `--` (deux tirets) |
| Tiret demi-cadratin | `–` | U+2013 | `-` (tiret simple) |

#### Espaces

| Typographique | ASCII | Unicode | Remplacement |
|---------------|-------|---------|--------------|
| Espace insécable | ` ` | U+00A0 | ` ` (espace normale, U+0020) |
| Espace de largeur nulle | `​` | U+200B | (supprimé) |
| Espace insécable de largeur nulle | `\uFEFF` | U+FEFF | (supprimé) |

#### Autres caractères

| Typographique | ASCII | Unicode | Remplacement |
|---------------|-------|---------|--------------|
| Points de suspension | `…` | U+2026 | `...` (trois points) |
| Prime | `′` | U+2032 | `'` (guillemet simple) |
| Double prime | `″` | U+2033 | `"` (guillemet double) |

### Règles de remplacement

#### Règle 1 : Préserver le sens

**Règle :** Les remplacements doivent préserver le sens sémantique du texte.

**Exemples :**
- `"quoted text"` → `"quoted text"` (guillemets préservés)
- `—em dash—` → `--em dash--` (tiret préservé)
- `'single quote'` → `'single quote'` (guillemet préservé)

#### Règle 2 : Équivalents ASCII

**Règle :** Tous les remplacements utilisent des caractères ASCII standard.

**Justification :**
- Compatibilité maximale
- Convivial pour les analyseurs
- Aucun problème d'encodage

#### Règle 3 : Préservation du contexte

**Règle :** Les remplacements préservent la structure et la mise en forme du document.

**Exemples :**
- Les espaces insécables dans le texte structuré peuvent être préservés dans certains contextes
- Les caractères de largeur nulle sont toujours supprimés (aucune valeur sémantique)

### Ordre d'application

La canonisation typographique est appliquée :
1. Après la normalisation de l'encodage
2. Avant la suppression des caractères de contrôle
3. Dans le cadre du pipeline de normalisation du texte

### Configuration

La canonisation typographique peut être :
- **Activée :** Toutes les correspondances appliquées (par défaut)
- **Désactivée :** Caractères originaux préservés
- **Sélective :** Des types de caractères spécifiques peuvent être exclus

---

## Statut canonique

Ce document est **canonique** et constitue la source de vérité pour :
- Les règles et l'ordre de normalisation
- Les correspondances de remplacement de caractères
- La gestion des caractères de contrôle
- La stratégie de normalisation de l'encodage
- Les standards et priorités d'encodage
- Les stratégies de détection
- La gestion des caractères invalides
- Les correspondances de caractères typographiques
- Les règles de remplacement
- Les équivalents ASCII
- L'ordre d'application

Toute modification des règles de normalisation doit d'abord être reflétée ici, puis propagée vers le code d'implémentation.
