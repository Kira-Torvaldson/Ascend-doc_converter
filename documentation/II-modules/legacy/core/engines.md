> ⚠️ **Déprécié :** Contenu migré vers les fichiers de référence canoniques.

# Moteurs de conversion

## Objectif

Ce document définit la liste canonique des moteurs de conversion (modules) disponibles dans Ascend, leurs capacités et leur statut. Il sert de référence faisant autorité pour la sélection et le routage des moteurs.

## Convention de nommage des moteurs

Les identifiants de moteur doivent :
- Correspondre exactement au nom du module
- Être en minuscules avec des tirets comme séparateurs
- Être uniques parmi tous les moteurs
- Correspondre à l'identifiant dans la propriété `name` du module

## Moteurs disponibles

### downdoc

**Identifiant :** `downdoc`  
**Statut :** ✅ Actif  
**Type :** Bibliothèque JavaScript (native)  
**Conversions prises en charge :**
- Depuis : `asciidoc`
- Vers : `markdown`

**Caractéristiques :**
- Implémentation JavaScript pure
- Aucune dépendance binaire externe
- Conversion rapide en mémoire
- Prend en charge le mode de compatibilité BookStack/Parsedown

**Référence du module :** `api/backend/services/modules/adoc-to-md.converter.js`

### pandoc

**Identifiant :** `pandoc`  
**Statut :** ✅ Actif  
**Type :** Binaire externe (outil en ligne de commande)  
**Conversions prises en charge :**
- Depuis : `markdown`, `html`
- Vers : `asciidoc`, `html`, `pdf`, `docx`, `epub`, `rst`, `tex`, `latex`

**Caractéristiques :**
- Nécessite l'installation du binaire Pandoc
- Exécuté via `child_process.spawn`
- Prend en charge une large gamme de formats
- Timeout et limites de ressources appliqués

**Référence du module :** Géré par converter-orchestrator (pas de wrapper de module direct)

### text2markdown

**Identifiant :** `text2markdown`  
**Statut :** ✅ Actif  
**Type :** Bibliothèque JavaScript (native)  
**Conversions prises en charge :**
- Depuis : `txt`
- Vers : `markdown`

**Caractéristiques :**
- Implémentation JavaScript pure
- Détection automatique de la structure
- Détecte les titres, listes et blocs de code
- Aucune dépendance externe

**Référence du module :** `api/backend/services/modules/text2markdown.module.js`

### panwriter

**Identifiant :** `panwriter`  
**Statut :** ⏳ Placeholder  
**Type :** Prévu (service/bibliothèque externe)  
**Conversions prises en charge :**
- Depuis : `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`
- Vers : `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`

**Caractéristiques :**
- Pas encore implémenté
- Prévu pour une version future
- Prendra en charge les formats de documents Office

**Référence du module :** `api/backend/services/modules/panwriter.module.js` (placeholder)

### docverter

**Identifiant :** `docverter`  
**Statut :** ⏳ Placeholder  
**Type :** Prévu (service/bibliothèque externe)  
**Conversions prises en charge :**
- Depuis : `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`
- Vers : `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`

**Caractéristiques :**
- Pas encore implémenté
- Prévu pour une version future
- Prendra en charge une large gamme de formats, y compris les images

**Référence du module :** `api/backend/services/modules/docverter.module.js` (placeholder)

## Règles de sélection des moteurs

### 1. Routage basé sur le format

L'orchestrateur de conversion sélectionne les moteurs en fonction de :
- La correspondance avec la liste blanche du format source
- La correspondance avec la liste blanche du format cible
- La disponibilité et le statut du moteur

### 2. Ordre de priorité

Lorsque plusieurs moteurs prennent en charge la même conversion :
1. Les moteurs JavaScript natifs (downdoc, text2markdown) sont préférés
2. Les binaires externes (pandoc) sont utilisés lorsque les moteurs natifs ne prennent pas en charge la conversion
3. Les moteurs placeholder ne sont jamais sélectionnés (retournent une erreur)

### 3. Chargement paresseux

Tous les moteurs sont chargés à la demande via le module de chargement paresseux :
- Réduit l'empreinte mémoire initiale
- Permet la découverte dynamique des moteurs
- Permet une gestion gracieuse des moteurs manquants

## Contrat d'interface des moteurs

Tous les moteurs doivent se conformer à l'interface de module définie dans `doc/specs/modules.interface.md` :

- **Propriétés requises :** `name`, `supportedFormats`
- **Méthode requise :** `run(inputPath, outputPath, options)`
- **Format de retour :** `ModuleResult` avec `{ success, logs, error, duration }`

## Définitions des statuts des moteurs

- **✅ Actif :** Entièrement implémenté, testé et disponible à l'utilisation
- **⏳ Placeholder :** Défini mais pas encore implémenté, retourne une erreur si appelé
- **🔧 Développement :** En cours de développement actif, peut être instable
- **❌ Déprécié :** Plus maintenu, sera supprimé dans une version future

## Statut canonique

Ce document est **canonique** et sert de source de vérité pour :
- La disponibilité et les capacités des moteurs
- Les décisions de routage des conversions
- L'enregistrement des modules dans l'orchestrateur
- Le suivi du statut des fonctionnalités prévues

Les changements de statut ou de capacités des moteurs doivent d'abord être reflétés ici.
