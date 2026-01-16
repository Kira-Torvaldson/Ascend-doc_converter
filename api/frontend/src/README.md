# Structure du Frontend Ascend

Cette documentation décrit l'organisation du code frontend de l'application Ascend.

## 📁 Structure des dossiers

```
src/
├── components/          # Composants React réutilisables
│   ├── Panel.tsx       # Panneau générique pour afficher du contenu
│   ├── FormatSelector.tsx  # Sélecteur de format
│   ├── Modal.tsx       # Modal générique
│   ├── NavigationWindow.tsx # Fenêtre de navigation flottante
│   └── index.ts        # Exports centralisés
│
├── converters/          # Modules de conversion
│   ├── api.ts          # Configuration API
│   ├── asciidoc-to-markdown.ts
│   ├── markdown-to-asciidoc.ts
│   ├── generic-converter.ts
│   ├── bookstack-adapter.js
│   └── index.ts        # Exports centralisés
│
├── hooks/              # Hooks React personnalisés
│   ├── useHeadings.ts  # Extraction des headings
│   ├── useFileHandling.ts  # Gestion des fichiers
│   ├── useNavigationWindow.ts  # Gestion de la fenêtre de navigation
│   └── index.ts        # Exports centralisés
│
├── types/              # Définitions TypeScript
│   └── index.ts        # Types et interfaces
│
├── utils/              # Utilitaires
│   └── formatHelpers.ts  # Helpers pour les formats
│
├── constants/          # Constantes de l'application
│   └── index.ts        # Constantes centralisées
│
├── App.tsx             # Composant principal
├── main.tsx            # Point d'entrée
└── styles.css          # Styles globaux
```

## 🎯 Principes d'organisation

### 1. Séparation des responsabilités
- **Components** : Composants UI réutilisables et isolés
- **Hooks** : Logique métier réutilisable
- **Converters** : Logique de conversion de documents
- **Types** : Définitions TypeScript centralisées
- **Utils** : Fonctions utilitaires pures
- **Constants** : Valeurs constantes

### 2. Exports centralisés
Chaque dossier contient un fichier `index.ts` qui exporte tous les éléments du dossier pour faciliter les imports :

```typescript
// Au lieu de :
import { Panel } from './components/Panel';
import { Modal } from './components/Modal';

// On peut faire :
import { Panel, Modal } from './components';
```

### 3. Types TypeScript
Tous les types sont centralisés dans `types/index.ts` pour éviter la duplication et faciliter la maintenance.

### 4. Hooks personnalisés
Les hooks encapsulent la logique réutilisable :
- `useHeadings` : Extraction automatique des headings
- `useFileHandling` : Gestion complète des fichiers
- `useNavigationWindow` : Gestion de la fenêtre de navigation

## 📦 Utilisation

### Imports recommandés

```typescript
// Types
import { FormatType, Notification, Heading } from './types';

// Hooks
import { useHeadings, useFileHandling, useNavigationWindow } from './hooks';

// Composants
import { Panel, FormatSelector, Modal, NavigationWindow } from './components';

// Utilitaires
import { getFormatTitle, getFormatPlaceholder, extractHeadings } from './utils/formatHelpers';

// Constantes
import { FORMAT_TITLES, FORMAT_PLACEHOLDERS } from './constants';

// Converters
import { convertText, requestConfirmationToken } from './converters';
```

## 🔧 Ajout de nouvelles fonctionnalités

### Ajouter un nouveau composant
1. Créer le fichier dans `components/`
2. Exporter depuis `components/index.ts`
3. Utiliser dans `App.tsx` ou autres composants

### Ajouter un nouveau hook
1. Créer le fichier dans `hooks/`
2. Exporter depuis `hooks/index.ts`
3. Utiliser dans les composants

### Ajouter un nouveau type
1. Ajouter dans `types/index.ts`
2. Utiliser dans les composants/hooks

## 📝 Notes importantes

- **Toujours utiliser les types** : Éviter les `any` et utiliser les types définis
- **Composants réutilisables** : Extraire la logique répétitive dans des composants
- **Hooks pour la logique** : Utiliser les hooks pour encapsuler la logique métier
- **Exports centralisés** : Toujours exporter depuis les fichiers `index.ts`
