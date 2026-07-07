> ⚠️ **Deprecated:** Contenu migré vers les fichiers de référence canoniques.

# Comportement du frontend

## Objectif

Ce document définit le comportement canonique du frontend Ascend. Il précise les interactions de l'interface, les parcours utilisateur et les règles spécifiques au frontend.

## Composants de l'interface

### Sélecteurs de format

**Composant :** Listes déroulantes de format source et destination

**Comportement :**
- Affiche tous les formats disponibles
- Désactive les formats marqués comme « coming soon »
- Affiche le libellé « (coming soon) » pour les formats désactivés
- Ajuste automatiquement pour maintenir des paires de conversion valides

**Conversions valides :**
- AsciiDoc ↔ Markdown (activé)
- Autres paires de formats (désactivées, « coming soon »)

### Bouton de conversion

**Composant :** Bouton « Convertir »

**Comportement :**
- Activé uniquement pour les conversions valides (AsciiDoc ↔ Markdown)
- Désactivé pendant la conversion
- Affiche un état de chargement pendant la conversion

### Indicateur de progression

**Composant :** Retour visuel de progression

**Éléments :**
- Animation de spinner
- Message de progression
- Barre de progression animée
- Effet shimmer

**Durées :**
- Spinner : rotation de 1,2 s
- Barre de progression : animation de 2,5 s
- Shimmer : animation de 3 s

### Compteur de caractères

**Composant :** Affichage des statistiques de texte

**Métriques :**
- Nombre de caractères
- Nombre de mots
- Nombre de lignes

**Emplacement :** Barre d'outils des panneaux source et résultat

### Notifications toast

**Composant :** Messages de notification temporaires

**Types :**
- Succès (icône ✓)
- Erreur (icône ✕)

**Comportement :**
- Fermeture automatique après 5 secondes
- Bouton de fermeture manuelle
- Animation de sortie à la fermeture

## Parcours utilisateur

### Parcours 1 : Conversion simple

1. L'utilisateur saisit du texte dans le panneau source
2. L'utilisateur sélectionne le format source (AsciiDoc ou Markdown)
3. L'utilisateur sélectionne le format destination (opposé de la source)
4. L'utilisateur clique sur « Convertir »
5. L'indicateur de progression s'affiche
6. Le résultat apparaît dans le panneau destination
7. Une notification de succès s'affiche

### Parcours 2 : Inversion des formats

1. L'utilisateur clique sur le bouton d'inversion (⇄)
2. Les formats source et destination sont inversés
3. Le contenu source et destination est inversé (le cas échéant)
4. L'interface se met à jour pour refléter l'inversion

### Parcours 3 : Export de fichier

1. L'utilisateur clique sur le bouton de téléchargement (⬇️)
2. Le système demande un nom de fichier
3. L'utilisateur saisit le nom de fichier
4. Le système ajoute la bonne extension
5. Le fichier est téléchargé sur le système de l'utilisateur

### Parcours 4 : Accès à l'historique

1. L'utilisateur clique sur le bouton historique
2. La modale d'historique s'ouvre
3. L'utilisateur voit la liste des conversions passées
4. L'utilisateur peut restaurer ou effacer l'historique

## Raccourcis clavier

### Raccourcis disponibles

- `Ctrl+S` : Télécharger/Enregistrer le résultat
- `Ctrl+Enter` : Lancer la conversion
- `Ctrl+K` : Effacer le contenu source
- `Ctrl+/` : Afficher l'aide des raccourcis

### Comportement des raccourcis

- Les raccourcis fonctionnent globalement (lorsque le focus n'est pas dans un champ de saisie)
- Les modales peuvent remplacer les raccourcis
- Les raccourcis sont documentés dans la modale d'aide

## Gestion d'état

### État du contenu

- Contenu source : `adocInput` ou `mdOutput` (selon le format)
- Contenu destination : Résultat de la conversion
- État d'édition : Suit si l'utilisateur modifie le résultat

### État de conversion

- Chargement : Indicateur booléen
- Statut : Message textuel
- Conversion récente : Indicateur booléen (empêche une reconversion immédiate)

### État de l'interface

- Notifications : Tableau d'objets de notification
- Modales : Indicateurs booléens pour chaque modale
- Fenêtre de navigation : Position, taille, état minimisé

## Règles de validation

### Règle 1 : Validation des paires de formats

**Règle :** Seules les conversions AsciiDoc ↔ Markdown sont autorisées.

**Application :**
- Bouton désactivé pour les paires invalides
- Message d'avertissement affiché
- Ajustement automatique vers une paire valide

### Règle 2 : Validation du contenu

**Règle :** Un contenu vide ne peut pas être converti.

**Application :**
- Bouton désactivé si la source est vide
- Message d'erreur explicite en cas de tentative

### Règle 3 : État de conversion

**Règle :** Une seule conversion à la fois.

**Application :**
- Bouton désactivé pendant la conversion
- Nouvelles demandes de conversion mises en file d'attente ou rejetées

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Le comportement des composants de l'interface
- Les parcours d'interaction utilisateur
- Les raccourcis clavier
- Les règles de gestion d'état
