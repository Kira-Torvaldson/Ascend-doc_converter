> ⚠️ **Deprecated:** Content migrated into canonical reference files.

# Règles de validation des fichiers

## Objectif

Ce document définit les règles canoniques de validation des fichiers appliquées par Ascend. Ces règles garantissent que seuls des fichiers valides et sûrs sont traités.

## Étapes de validation

### Étape 1 : Validation de la liste blanche des formats

**Règle :** Seuls les formats figurant dans la liste blanche des formats pris en charge sont acceptés.

**Processus :**
1. Valider que le format source figure dans la liste blanche des formats d'entrée
2. Valider que le format cible figure dans la liste blanche des formats de sortie
3. Rejet immédiat si le format n'est pas dans la liste blanche

**Référence :** `doc/references/core/supported-formats.md`

### Étape 2 : Validation des chemins

**Règle :** Tous les chemins de fichiers doivent être validés pour la sécurité.

**Vérifications :**
- Le chemin doit être absolu (pas de chemins relatifs)
- Aucune séquence de traversée de chemin (`../`, `..\\`)
- Aucun lien symbolique (en mode sécurisé)
- Le chemin doit se résoudre vers un répertoire autorisé

**Rejet :** Tout échec de validation de chemin entraîne un rejet immédiat.

### Étape 3 : Validation de la taille du fichier

**Règle :** La taille du fichier doit respecter les limites configurées.

**Limites par défaut :**
- Taille maximale du fichier d'entrée : 10 MB
- Configurable par profil d'exécution

**Processus :**
1. Vérifier la taille du fichier avant la lecture
2. Rejeter si la limite est dépassée
3. Aucune ressource allouée pour les fichiers surdimensionnés

### Étape 4 : Validation du type MIME

**Règle :** Le type réel du fichier doit correspondre au format déclaré.

**Processus :**
1. Détecter le type réel du fichier (type MIME, octets magiques)
2. Comparer avec le format déclaré
3. Rejeter en cas de divergence détectée

**Justification :** Prévient les fichiers binaires déguisés en fichiers texte.

### Étape 5 : Validation du contenu

**Règle :** Le contenu du fichier doit être valide pour le format déclaré.

**Vérifications :**
- Encodage valide (UTF-8 préféré)
- Validation de structure spécifique au format
- Aucun contenu binaire intégré (pour les formats texte)

## Ordre de validation

La validation doit s'effectuer dans cet ordre :
1. Liste blanche des formats (avant toute opération sur les fichiers)
2. Validation des chemins (avant l'accès aux fichiers)
3. Taille du fichier (avant la lecture)
4. Type MIME (après la lecture de l'en-tête)
5. Validation du contenu (pendant/après la lecture)

## Comportement en cas de rejet

### Rejet immédiat

**Règle :** Les fichiers invalides sont rejetés avant le début de tout traitement.

**Exigences :**
- Aucun fichier temporaire créé
- Aucune ressource allouée
- Message d'erreur clair renvoyé
- Événement de sécurité journalisé (le cas échéant)

### Messages d'erreur

**Règle :** Les messages d'erreur doivent être génériques et ne pas exposer de détails système.

**Autorisé :**
- « Invalid file format »
- « File size exceeds limit »
- « File validation failed »

**Interdit :**
- Chemins de fichiers système
- Détails d'erreur internes
- Traces de pile
- Valeurs de configuration

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les règles et l'ordre de validation
- Les limites de taille de fichier
- La vérification du type MIME
- Le comportement en cas de rejet
