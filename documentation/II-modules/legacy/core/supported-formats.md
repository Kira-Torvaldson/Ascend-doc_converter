> ⚠️ **Déprécié :** Contenu migré vers les fichiers de référence canoniques.

# Formats pris en charge

## Objectif

Ce document définit la liste canonique des formats d'entrée et de sortie pris en charge par Ascend. Il sert de référence faisant autorité pour la validation des formats, le routage des conversions et les contrats API.

## Convention de nommage des formats

Tous les identifiants de format doivent :
- Être en minuscules
- Utiliser des noms de format standard (par ex. `markdown`, `asciidoc`, `html`)
- Correspondre exactement dans tous les composants du système
- Être normalisés avant toute utilisation dans la logique de validation ou de routage

## Formats actuellement pris en charge

### Formats d'entrée

| Format | Identifiant | Statut | Moteur |
|--------|-----------|--------|--------|
| AsciiDoc | `asciidoc` | ✅ Actif | downdoc |
| Markdown | `markdown` | ✅ Actif | Pandoc |
| Texte brut | `txt` | ✅ Actif | text2markdown |
| HTML | `html` | ⏳ Prévu | Pandoc |

### Formats de sortie

| Format | Identifiant | Statut | Moteur |
|--------|-----------|--------|--------|
| Markdown | `markdown` | ✅ Actif | downdoc |
| AsciiDoc | `asciidoc` | ✅ Actif | Pandoc |
| Texte brut | `txt` | ⏳ Prévu | Native |
| HTML | `html` | ⏳ Prévu | Pandoc |

## Règles de validation des formats

### 1. Application de la liste blanche

Seuls les formats explicitement listés dans ce document sont acceptés. Tout format absent de la liste blanche doit être rejeté avant le début de tout traitement.

### 2. Validation des paires de formats

Le système valide que :
- Le format source figure dans la liste blanche des formats d'entrée
- Le format cible figure dans la liste blanche des formats de sortie
- Un chemin de conversion existe entre les formats

### 3. Détection du format

Lorsque le format n'est pas fourni explicitement :
- L'extension de fichier est utilisée comme indice
- Une analyse du contenu peut être effectuée (type MIME, octets magiques)
- La déclaration de l'utilisateur prime sur la détection

## Formats prévus

Les formats suivants sont prévus pour les versions futures :

- **PDF** (`pdf`) - Entrée et sortie
- **YAML** (`yaml`) - Entrée et sortie
- **JSON** (`json`) - Entrée et sortie
- **DOCX** (`docx`) - Entrée et sortie (via docverter)
- **RTF** (`rtf`) - Entrée et sortie (via docverter)
- **ODT** (`odt`) - Entrée et sortie (via panwriter)

## Notes spécifiques aux formats

### AsciiDoc

- **Extension :** `.adoc`, `.asciidoc`
- **Type MIME :** `text/x-asciidoc`
- **Encodage :** UTF-8 requis
- **Fonctionnalités spéciales :** Prend en charge le mode de compatibilité BookStack/Parsedown

### Markdown

- **Extension :** `.md`, `.markdown`
- **Type MIME :** `text/markdown`
- **Encodage :** UTF-8 requis
- **Variantes :** Markdown standard, compatible BookStack

### Texte brut

- **Extension :** `.txt`
- **Type MIME :** `text/plain`
- **Encodage :** UTF-8 préféré, détection automatique prise en charge
- **Fonctionnalités spéciales :** Détection automatique de la structure (titres, listes)

## Matrice de conversion

| De \ Vers | Markdown | AsciiDoc | HTML | TXT |
|-----------|----------|----------|------|-----|
| AsciiDoc  | ✅       | -        | ⏳    | ⏳   |
| Markdown  | -        | ✅       | ⏳    | ⏳   |
| HTML      | ⏳       | ⏳       | -    | ⏳   |
| TXT       | ✅       | ⏳       | ⏳    | -   |

**Légende :**
- ✅ = Actuellement pris en charge
- ⏳ = Prévu
- - = Non applicable

## Statut canonique

Ce document est **canonique** et sert de source de vérité pour :
- La validation de la liste blanche des formats
- Les décisions de routage des conversions
- La validation des paramètres de format de l'API
- Les options du sélecteur de format de l'interface utilisateur

Tout changement des formats pris en charge doit d'abord être reflété ici, puis propagé vers :
- Le code de validation des formats
- L'orchestrateur de conversion
- La documentation API
- Les composants de l'interface utilisateur
