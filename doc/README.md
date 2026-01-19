# 📚 Documentation Ascend

Bienvenue dans la documentation d'Ascend. Cette documentation est organisée par type pour faciliter la navigation.

## 📁 Structure de la documentation

```
doc/
├── specifications/              # Spécifications et architecture
│   ├── PIPELINE.md            # Spécification complète du pipeline
│   └── secure-converter.md    # Moteur de conversion sécurisé
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
