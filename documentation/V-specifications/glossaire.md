# Glossaire

## Objectif

Ce document définit la terminologie canonique utilisée dans l'ensemble de la documentation et du code source d'Ascend.

## Termes

### A

**AsciiDoc**  
Langage de balisage léger pour la rédaction de documents. Format d'entrée et de sortie pris en charge par Ascend.

### B

**BOM (Byte Order Mark)**  
Caractère Unicode utilisé pour indiquer l'encodage du texte. Supprimé par le processus de normalisation d'Ascend.

**Traitement par lots (Batch Processing)**  
Traitement de plusieurs fichiers en une seule opération avec suivi de progression.

### C

**Canonique (Canonical)**  
Référence faisant autorité et définitive. Les documents marqués comme canoniques constituent la source de vérité.

**Conversion**  
Processus de transformation d'un document d'un format à un autre.

**ID de conversion (Conversion ID)**  
Identifiant unique (UUID) attribué à chaque opération de conversion.

**Convertisseur (Converter)**  
Module qui effectue la conversion de format (par ex. downdoc, pandoc).

### D

**Downdoc**  
Bibliothèque JavaScript pour convertir AsciiDoc en Markdown. Utilisée par le module downdoc d'Ascend.

### E

**Moteur (Engine)**  
Moteur ou module de conversion qui effectue la transformation de format.

**Profil d'exécution (Execution Profile)**  
Profil de configuration définissant les limites de ressources et les paramètres d'exécution.

### F

**Format**  
Identifiant de format de document (par ex. `markdown`, `asciidoc`, `html`).

**Liste blanche de formats (Format Whitelist)**  
Liste des formats explicitement autorisés pour la conversion. Les formats absents de la liste blanche sont rejetés.

### I

**Isolation**  
Principe selon lequel chaque conversion s'exécute en isolation complète des autres.

### L

**Chargement différé (Lazy Loading)**  
Technique consistant à charger les modules uniquement lorsqu'ils sont nécessaires, réduisant ainsi l'empreinte mémoire initiale.

**Local-First**  
Principe d'architecture selon lequel tout le traitement s'effectue localement, sans dépendances externes.

### M

**Markdown**  
Langage de balisage léger. Format d'entrée et de sortie pris en charge par Ascend.

**Module**  
Unité de conversion indépendante conforme à l'interface standard des modules.

**Interface de module (Module Interface)**  
Contrat standard que tous les modules de conversion doivent implémenter.

### N

**Normalisation**  
Processus de standardisation de la représentation du texte (encodage, caractères, mise en forme).

### O

**Orchestrateur (Orchestrator)**  
Composant qui coordonne l'exécution des conversions et la sélection des modules.

### P

**Pandoc**  
Convertisseur de documents universel. Utilisé par Ascend pour Markdown → AsciiDoc et d'autres conversions.

**Pipeline**  
Séquence d'étapes qui traite une conversion de l'entrée à la sortie.

**Placeholder**  
Module défini mais pas encore implémenté. Retourne une erreur s'il est appelé.

### S

**Sandboxing**  
Technique d'isolation qui restreint l'accès des modules aux ressources système.

**Guillemets typographiques (Smart Quotes)**  
Guillemets typographiques (guillemets courbes) normalisés en guillemets ASCII standard.

### T

**Répertoire temporaire (Temporary Directory)**  
Répertoire unique et isolé créé pour chaque conversion. Supprimé après achèvement.

**Jeton (Token)**  
Jeton cryptographiquement sécurisé utilisé pour la confirmation de conversion.

### U

**UUID**  
Identifiant unique universel. Utilisé pour les ID de conversion et les noms de répertoires temporaires.

### W

**Liste blanche (Whitelist)**  
Liste de valeurs explicitement autorisées. Tout ce qui n'est pas dans la liste blanche est rejeté.

## Statut canonique

Ce document est **canonique** et constitue la source de vérité pour :
- Les définitions terminologiques
- Les explications des acronymes
- Les clarifications conceptuelles
