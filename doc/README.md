# 📚 Documentation Ascend

Bienvenue dans la documentation d'Ascend. Cette documentation est organisée par type pour faciliter la navigation.

## 📁 Structure de la documentation

```
doc/
├── README.md                    # Index de la documentation
├── specifications/              # Spécifications et architecture
│   ├── PIPELINE.md            # Spécification complète du pipeline
│   ├── modules.interface.md   # Contrat d'interface des modules
│   ├── secure-converter.md    # Moteur de conversion sécurisé
│   └── modules/               # Spécifications des modules
│       ├── lazyload.module.md # Module de lazy loading
│       ├── converter-orchestrator.module.md # Module orchestrateur
│       ├── orchestrator-comm.module.md # Communication entre orchestrateurs
│       ├── logs.module.md              # Module de logs structurés
│       ├── downdoc.module.md  # Module Downdoc
│       ├── pandoc.module.md   # Module Pandoc
│       ├── text2markdown.module.md # Module Text2Markdown
│       ├── panwriter.module.md # Module PanWriter
│       └── docverter.module.md # Module Docverter
│
├── guides/                     # Guides pratiques
│   ├── security/              # Guides de sécurité
│   │   └── confirmation-security-guide.md
│   └── integration/           # Guides d'intégration
│       └── secure-converter-frontend-integration.md
│
└── references/                 # Références techniques
    └── configuration/         # Références de configuration
        ├── conversion-options.md
        ├── encoding-options.md
        └── normalization-advanced-options.md
```

## 📖 Index par type

### 📋 Spécifications et architecture

Documents de référence décrivant l'architecture et les spécifications du système.

- **[PIPELINE.md](specifications/PIPELINE.md)** - Spécification complète du pipeline de conversion
  - Philosophie et principes fondamentaux
  - Règles d'isolation stricte
  - Validation et sécurité
  - Cycle de vie d'une conversion
  - **Document de référence principal**

- **[modules.interface.md](specifications/modules.interface.md)** - Contrat d'interface des modules
  - Spécification technique du contrat des modules
  - Propriétés obligatoires (nom, formats supportés)
  - Méthode standard `run()` avec structure de retour uniforme
  - Contraintes d'exécution et comportement attendu
  - **Document de référence pour créer ou intégrer un module**

- **[lazyload.module.md](specifications/modules/lazyload.module.md)** - Module de lazy loading
  - Gestionnaire centralisé de chargement différé pour tous les converters
  - Interface uniforme compatible avec tous les wrappers
  - Réduction de la consommation mémoire
  - Journalisation et gestion sécurisée des erreurs

- **[downdoc.module.md](specifications/modules/downdoc.module.md)** - Module Downdoc
  - Spécification du wrapper downdoc
  - Exemple de module conforme à l'interface

- **[pandoc.module.md](specifications/modules/pandoc.module.md)** - Module Pandoc
  - Spécification du wrapper Pandoc
  - Exécution sécurisée via child_process.spawn
  - Support multi-formats avec whitelist stricte

- **[text2markdown.module.md](specifications/modules/text2markdown.module.md)** - Module Text2Markdown
  - Spécification du wrapper text2markdown
  - Conversion texte brut → Markdown avec détection automatique
  - Bibliothèque JavaScript native

- **[panwriter.module.md](specifications/modules/panwriter.module.md)** - Module PanWriter
  - Spécification du wrapper PanWriter (en préparation)
  - Éditeur et convertisseur de documents
  - Formats Office et documents

- **[docverter.module.md](specifications/modules/docverter.module.md)** - Module Docverter
  - Spécification du wrapper Docverter (en préparation)
  - Service de conversion de documents
  - Support multi-formats (Office, images, PDF)

- **[converter-orchestrator.module.md](specifications/modules/converter-orchestrator.module.md)** - Module Orchestrateur de Converters
  - Orchestrateur central pour tous les converters
  - Identification automatique du converter approprié
  - Standardisation des retours et intégration du lazy loading

- **[orchestrator.module.md](specifications/modules/orchestrator.module.md)** - Module Orchestrateur Linéaire (legacy)
  - Mini-orchestrateur pour flux linéaire de conversion multi-étapes
  - Chaînage séquentiel de modules de conversion
  - Gestion automatique des dossiers temporaires et nettoyage

- **[orchestrator-comm.module.md](specifications/modules/orchestrator-comm.module.md)** - Communication entre Orchestrateurs
  - Architecture de communication entre orchestrateur principal et orchestrateur d'exécution
  - Flux de communication et gestion des dossiers temporaires
  - Format de retour standardisé et sécurité

- **[secure-converter.md](specifications/secure-converter.md)** - Moteur de conversion sécurisé
  - Vue d'ensemble du moteur
  - Caractéristiques de sécurité
  - Utilisation et exemples

### 🔐 Guides de sécurité

Guides pratiques pour comprendre et implémenter les fonctionnalités de sécurité.

- **[confirmation-security-guide.md](guides/security/confirmation-security-guide.md)** - Guide des tokens de confirmation
  - Système de tokens sécurisés
  - Principe de non-confiance backend/frontend
  - Génération et validation des tokens

### 🔌 Guides d'intégration

Guides pour intégrer Ascend dans vos applications.

- **[secure-converter-frontend-integration.md](guides/integration/secure-converter-frontend-integration.md)** - Intégration frontend
  - Intégration du système de tokens
  - Exemples React/TypeScript
  - Gestion des modales et erreurs

### ⚙️ Références de configuration

Documentation de référence pour toutes les options de configuration disponibles.

- **[conversion-options.md](references/configuration/conversion-options.md)** - Options de conversion complètes
  - Structure complète des options
  - Options par catégorie
  - Exemples de configuration

- **[encoding-options.md](references/configuration/encoding-options.md)** - Options d'encodage
  - Gestion des encodages
  - Normalisation Unicode
  - Détection et conversion

- **[normalization-advanced-options.md](references/configuration/normalization-advanced-options.md)** - Options de normalisation avancée
  - Normalisation avancée
  - Caractères confusables
  - Nettoyage et sanitisation

## 🎯 Parcours recommandés

### Pour comprendre l'architecture

1. Commencez par [PIPELINE.md](specifications/PIPELINE.md) pour les principes fondamentaux
2. Lisez [secure-converter.md](specifications/secure-converter.md) pour l'implémentation
3. Consultez [confirmation-security-guide.md](guides/security/confirmation-security-guide.md) pour les tokens

### Pour configurer les conversions

1. [conversion-options.md](references/configuration/conversion-options.md) - Vue d'ensemble
2. [encoding-options.md](references/configuration/encoding-options.md) - Encodage
3. [normalization-advanced-options.md](references/configuration/normalization-advanced-options.md) - Normalisation

### Pour intégrer le système

1. [secure-converter-frontend-integration.md](guides/integration/secure-converter-frontend-integration.md) - Frontend
2. [secure-converter.md](specifications/secure-converter.md) - Backend

## 🔗 Liens rapides

- [Retour au README principal](../README.md)
- [Spécifications](specifications/)
- [Guides](guides/)
- [Références](references/)
