> ⚠️ **Déprécié :** Le contenu a été migré vers les fichiers de référence canoniques.

# Normalisation du texte

## Objectif

Ce document définit les règles canoniques de normalisation du texte appliquées par Ascend. La normalisation garantit une représentation cohérente du texte et améliore la fiabilité de la conversion.

## Étapes de normalisation

### Étape 1 : Suppression du BOM

**Règle :** Supprimer tous les caractères Byte Order Mark (BOM) du texte d'entrée.

**Variantes de BOM :**
- BOM UTF-8 : `\uFEFF` (0xEF 0xBB 0xBF)
- BOM UTF-16 LE : 0xFF 0xFE
- BOM UTF-16 BE : 0xFE 0xFF

**Implémentation :** Supprimer le BOM au début du texte avant tout autre traitement.

### Étape 2 : Normalisation de l'encodage

**Règle :** Normaliser l'encodage du texte en UTF-8.

**Processus :**
1. Détecter l'encodage actuel (s'il n'est pas spécifié)
2. Convertir en UTF-8
3. Traiter les séquences invalides selon la stratégie (replace, remove, fail)

**Stratégie par défaut :** Remplacer les caractères invalides par le caractère de remplacement Unicode (U+FFFD).

### Étape 3 : Remplacement des guillemets typographiques

**Règle :** Remplacer les guillemets typographiques par des guillemets ASCII standard.

**Remplacements :**
- Guillemet double ouvrant (`"`) → `"`
- Guillemet double fermant (`"`) → `"`
- Guillemet simple ouvrant (`'`) → `'`
- Guillemet simple fermant (`'`) → `'`

**Justification :** Les guillemets typographiques peuvent casser les analyseurs et convertisseurs. Les guillemets standard garantissent la compatibilité.

### Étape 4 : Normalisation des caractères typographiques

**Règle :** Normaliser les caractères typographiques en équivalents ASCII.

**Remplacements :**
- Tiret cadratin (`—`) → `--`
- Tiret demi-cadratin (`–`) → `-`
- Espace insécable (` `) → ` ` (espace régulier)
- Points de suspension (`…`) → `...`
- Espace de largeur nulle (`​`) → supprimé
- Espace insécable de largeur nulle (`\uFEFF`) → supprimé

**Justification :** Les caractères typographiques peuvent causer des problèmes d'analyse. Les équivalents ASCII garantissent la compatibilité.

### Étape 5 : Suppression des caractères de contrôle

**Règle :** Supprimer les caractères de contrôle problématiques tout en préservant la mise en forme.

**Caractères préservés :**
- `\n` (0x0A) - Saut de ligne
- `\r` (0x0D) - Retour chariot
- `\t` (0x09) - Tabulation

**Caractères supprimés :**
- Tous les autres caractères de contrôle (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F)

**Justification :** Les caractères de contrôle peuvent casser les analyseurs ou causer des problèmes de sécurité. Les caractères de mise en forme sont préservés.

## Ordre de normalisation

La normalisation doit être appliquée dans cet ordre exact :
1. Suppression du BOM (en premier)
2. Normalisation de l'encodage
3. Remplacement des guillemets typographiques
4. Normalisation des caractères typographiques
5. Suppression des caractères de contrôle (en dernier, pour préserver la mise en forme)

## Configuration

La normalisation peut être configurée via les options de conversion :
- `normalization.encoding` - Stratégie d'encodage
- `normalization.advanced.unicode.normalization` - Forme de normalisation Unicode (NFC, NFKC, none)
- `normalization.advanced.characterCleaning.*` - Options de nettoyage des caractères

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les règles et l'ordre de normalisation
- Les correspondances de remplacement des caractères
- La gestion des caractères de contrôle
- La stratégie de normalisation de l'encodage
