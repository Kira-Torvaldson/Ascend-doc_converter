# Référence principale (Core)

## Objectif

Ce document définit les références principales canoniques pour Ascend, incluant l'identité du projet, les formats pris en charge et les moteurs de conversion. Il constitue la référence fondamentale pour toutes les autres décisions de documentation et d'implémentation.

---

## Identité du projet

### Objectif

Cette section définit l'identité, l'objectif et les principes fondamentaux du projet Ascend.

### Identité du projet

**Nom :** Ascend  
**Type :** Pipeline de conversion de documents local-first  
**Fonction principale :** Convertir des documents entre formats (actuellement AsciiDoc ↔ Markdown)  
**Architecture :** Pipeline de conversion modulaire, isolé et sécurisé  
**Philosophie :** Local-First, sécurité dès la conception, empreinte ressources minimale

### Principes fondamentaux

#### 1. Local-First

- Toutes les conversions s'exécutent entièrement sur la machine locale
- Aucun accès réseau requis ou autorisé pendant la conversion
- Aucune dépendance à un service externe pour les fonctionnalités principales
- Les données restent sur le système de l'utilisateur tout au long du processus de conversion

#### 2. Isolation

- Chaque conversion s'exécute dans un environnement complètement isolé
- Aucun état partagé entre les conversions
- Répertoire temporaire unique par conversion
- Aucune interférence entre les conversions concurrentes

#### 3. Sécurité dès la conception

- Validation stricte des entrées avant tout traitement
- Environnement d'exécution en sandbox
- Limites de ressources appliquées par conversion
- Aucune confiance accordée aux entrées externes

#### 4. Modularité

- Les modules de conversion sont des unités indépendantes
- Contrat d'interface standard pour tous les modules
- Chargement différé pour minimiser l'empreinte mémoire
- Architecture extensible pour les formats futurs

#### 5. Fiabilité

- Gestion robuste des erreurs sans plantage du système
- Nettoyage garanti des ressources
- Dégradation contrôlée sous charge
- Journalisation complète pour l'auditabilité

### État actuel

**Version :** 0.0.1.3 Rise  
**Conversions prises en charge :** AsciiDoc ↔ Markdown  
**Formats futurs :** HTML, PDF, YAML, JSON, TXT (prévus)

### Public cible

- **Principal :** Développeurs intégrant la conversion de documents dans des applications
- **Secondaire :** Administrateurs système déployant Ascend
- **Tertiaire :** Auditeurs de sécurité examinant le système

### Relation avec les autres documentations

Ce document est la référence racine. Toute autre documentation doit s'aligner sur ces principes fondamentaux :

- Les **références de configuration** doivent respecter les principes de sécurité et d'isolation
- La **documentation de sécurité** doit implémenter le principe de sécurité dès la conception
- La **documentation du pipeline de conversion** doit suivre les principes d'isolation et de modularité
- La **documentation API** doit refléter la philosophie local-first

---

## Formats pris en charge

### Objectif

Cette section définit la liste canonique des formats d'entrée et de sortie pris en charge par Ascend. Elle constitue la référence faisant autorité pour la validation des formats, le routage des conversions et les contrats API.

### Convention de nommage des formats

Tous les identifiants de format doivent :
- Être en minuscules
- Utiliser des noms de format standard (par ex. `markdown`, `asciidoc`, `html`)
- Correspondre exactement dans tous les composants du système
- Être normalisés avant toute utilisation dans la logique de validation ou de routage

### Formats actuellement pris en charge

#### Formats d'entrée

| Format | Identifiant | Statut | Moteur |
|--------|-------------|--------|--------|
| AsciiDoc | `asciidoc` | ✅ Actif | downdoc |
| Markdown | `markdown` | ✅ Actif | Pandoc |
| Texte brut | `txt` | ✅ Actif | text2markdown |
| HTML | `html` | ⏳ Prévu | Pandoc |

#### Formats de sortie

| Format | Identifiant | Statut | Moteur |
|--------|-------------|--------|--------|
| Markdown | `markdown` | ✅ Actif | downdoc |
| AsciiDoc | `asciidoc` | ✅ Actif | Pandoc |
| Texte brut | `txt` | ⏳ Prévu | Native |
| HTML | `html` | ⏳ Prévu | Pandoc |

### Règles de validation des formats

#### 1. Application de la liste blanche

Seuls les formats explicitement listés dans ce document sont acceptés. Tout format absent de la liste blanche doit être rejeté avant le début de tout traitement.

#### 2. Validation des paires de formats

Le système valide que :
- Le format source figure dans la liste blanche des formats d'entrée
- Le format cible figure dans la liste blanche des formats de sortie
- Un chemin de conversion existe entre les formats

#### 3. Détection de format

Lorsque le format n'est pas explicitement fourni :
- L'extension de fichier est utilisée comme indice
- Une analyse de contenu peut être effectuée (type MIME, octets magiques)
- La déclaration de l'utilisateur prime sur la détection

### Formats prévus

Les formats suivants sont prévus pour les versions futures :

- **PDF** (`pdf`) - Entrée et sortie
- **YAML** (`yaml`) - Entrée et sortie
- **JSON** (`json`) - Entrée et sortie
- **DOCX** (`docx`) - Entrée et sortie (via docverter)
- **RTF** (`rtf`) - Entrée et sortie (via docverter)
- **ODT** (`odt`) - Entrée et sortie (via panwriter)

### Notes spécifiques aux formats

#### AsciiDoc

- **Extension :** `.adoc`, `.asciidoc`
- **Type MIME :** `text/x-asciidoc`
- **Encodage :** UTF-8 requis
- **Fonctionnalités spéciales :** Prise en charge du mode de compatibilité BookStack/Parsedown

#### Markdown

- **Extension :** `.md`, `.markdown`
- **Type MIME :** `text/markdown`
- **Encodage :** UTF-8 requis
- **Variantes :** Markdown standard, compatible BookStack

#### Texte brut

- **Extension :** `.txt`
- **Type MIME :** `text/plain`
- **Encodage :** UTF-8 préféré, détection automatique prise en charge
- **Fonctionnalités spéciales :** Détection automatique de structure (titres, listes)

### Matrice de conversion

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

---

## Moteurs de conversion

### Objectif

Cette section définit la liste canonique des moteurs de conversion (modules) disponibles dans Ascend, leurs capacités et leur statut. Elle constitue la référence faisant autorité pour la sélection et le routage des moteurs.

### Convention de nommage des moteurs

Les identifiants de moteur doivent :
- Correspondre exactement au nom du module
- Être en minuscules avec des tirets comme séparateurs
- Être uniques parmi tous les moteurs
- Correspondre à l'identifiant dans la propriété `name` du module

### Moteurs disponibles

#### downdoc

**Identifiant :** `downdoc`  
**Statut :** ✅ Actif  
**Type :** Bibliothèque JavaScript (native)  
**Conversions prises en charge :**
- De : `asciidoc`
- Vers : `markdown`

**Caractéristiques :**
- Implémentation JavaScript pure
- Aucune dépendance binaire externe
- Conversion rapide en mémoire
- Prise en charge du mode de compatibilité BookStack/Parsedown

**Référence du module :** `api/backend/services/modules/adoc-to-md.converter.js`

#### pandoc

**Identifiant :** `pandoc`  
**Statut :** ✅ Actif  
**Type :** Binaire externe (outil en ligne de commande)  
**Conversions prises en charge :**
- De : `markdown`, `html`
- Vers : `asciidoc`, `html`, `pdf`, `docx`, `epub`, `rst`, `tex`, `latex`

**Caractéristiques :**
- Nécessite l'installation du binaire Pandoc
- Exécuté via `child_process.spawn`
- Prise en charge d'une large gamme de formats
- Délai d'expiration et limites de ressources appliqués

**Référence du module :** Géré par converter-orchestrator (pas d'enveloppe de module directe)

#### text2markdown

**Identifiant :** `text2markdown`  
**Statut :** ✅ Actif  
**Type :** Bibliothèque JavaScript (native)  
**Conversions prises en charge :**
- De : `txt`
- Vers : `markdown`

**Caractéristiques :**
- Implémentation JavaScript pure
- Détection automatique de structure
- Détecte les titres, listes et blocs de code
- Aucune dépendance externe

**Référence du module :** `api/backend/services/modules/text2markdown.module.js`

#### panwriter

**Identifiant :** `panwriter`  
**Statut :** ⏳ Placeholder  
**Type :** Prévu (service/bibliothèque externe)  
**Conversions prises en charge :**
- De : `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`
- Vers : `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`

**Caractéristiques :**
- Pas encore implémenté
- Prévu pour une future version
- Prendra en charge les formats de documents Office

**Référence du module :** `api/backend/services/modules/panwriter.module.js` (placeholder)

#### docverter

**Identifiant :** `docverter`  
**Statut :** ⏳ Placeholder  
**Type :** Prévu (service/bibliothèque externe)  
**Conversions prises en charge :**
- De : `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`
- Vers : `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`

**Caractéristiques :**
- Pas encore implémenté
- Prévu pour une future version
- Prendra en charge une large gamme de formats incluant les images

**Référence du module :** `api/backend/services/modules/docverter.module.js` (placeholder)

### Règles de sélection des moteurs

#### 1. Routage basé sur le format

L'orchestrateur de conversion sélectionne les moteurs en fonction de :
- Correspondance avec la liste blanche du format source
- Correspondance avec la liste blanche du format cible
- Disponibilité et statut du moteur

#### 2. Ordre de priorité

Lorsque plusieurs moteurs prennent en charge la même conversion :
1. Les moteurs JavaScript natifs (downdoc, text2markdown) sont préférés
2. Les binaires externes (pandoc) sont utilisés lorsque les moteurs natifs ne prennent pas en charge la conversion
3. Les moteurs placeholder ne sont jamais sélectionnés (retournent une erreur)

#### 3. Chargement différé

Tous les moteurs sont chargés à la demande via le module de chargement différé :
- Réduit l'empreinte mémoire initiale
- Permet la découverte dynamique des moteurs
- Permet une gestion gracieuse des moteurs manquants

### Contrat d'interface des moteurs

Tous les moteurs doivent se conformer à l'interface de module définie dans `doc/specs/modules-interface.md` :

- **Propriétés requises :** `name`, `supportedFormats`
- **Méthode requise :** `run(inputPath, outputPath, options)`
- **Format de retour :** `ModuleResult` avec `{ success, logs, error, duration }`

### Définitions des statuts des moteurs

- **✅ Actif :** Entièrement implémenté, testé et disponible à l'utilisation
- **⏳ Placeholder :** Défini mais pas encore implémenté, retourne une erreur s'il est appelé
- **🔧 Développement :** En cours de développement actif, peut être instable
- **❌ Déprécié :** Plus maintenu, sera supprimé dans une version future

---

## Statut canonique

Ce document est **canonique** et constitue la source de vérité pour :
- L'identité et l'objectif du projet
- Les principes architecturaux fondamentaux
- Les décisions de philosophie de conception
- L'état du projet et l'orientation de la feuille de route
- La validation de la liste blanche de formats
- Les décisions de routage des conversions
- La validation des paramètres de format API
- Les options du sélecteur de format de l'interface
- La disponibilité et les capacités des moteurs
- L'enregistrement des modules dans l'orchestrateur
- Le suivi du statut des fonctionnalités prévues

Toute modification de ce document représente un changement fondamental dans l'orientation du projet et nécessite une réflexion approfondie.
