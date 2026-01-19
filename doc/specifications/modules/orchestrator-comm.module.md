# Communication entre Orchestrateurs

## Description

Ce document décrit l'architecture de communication entre deux orchestrateurs distincts qui travaillent ensemble pour exécuter les conversions de documents, en évitant la surcharge et en répartissant la charge de manière efficace.

## Architecture des Orchestrateurs

### Orchestrateur Principal (`main-orchestrator.js`)

**Rôle :** Orchestrateur principal qui reçoit les requêtes utilisateur, choisit le chemin de conversion et délègue les tâches au second orchestrateur.

**Responsabilités :**
- Réception des requêtes utilisateur (contenu, formats source et cible)
- Validation du contenu et des formats
- Détermination du chemin de conversion (direct ou via format intermédiaire)
- Gestion du contrôle de charge (vérification de surcharge, acquisition de slot de concurrence)
- Initialisation du budget de ressources
- Création du fichier temporaire d'entrée
- Délégation à l'orchestrateur d'exécution
- Enregistrement des succès/échecs pour le suivi de charge
- Nettoyage du fichier temporaire d'entrée
- Libération du slot de concurrence

**Interface principale :**
```typescript
executeConversionRequest(content: string, sourceFormat: string, targetFormat: string, options?: Object): Promise<ModuleResult>
```

### Orchestrateur d'Exécution (`execution-orchestrator.js`)

**Rôle :** Orchestrateur secondaire qui exécute les conversions étape par étape, utilise les modules nécessaires et retourne les résultats.

**Responsabilités :**
- Réception du chemin de conversion et du fichier d'entrée depuis l'orchestrateur principal
- Création du dossier temporaire pour l'exécution
- Exécution séquentielle des étapes de conversion
- Utilisation du converter-orchestrator pour chaque étape (avec flag `_internal: true`)
- Gestion des fichiers intermédiaires
- Lecture du résultat final
- Nettoyage du dossier temporaire
- Retour des résultats à l'orchestrateur principal

**Interface principale :**
```typescript
executeConversionSteps(inputFilePath: string, conversionPath: Array, options?: Object): Promise<ModuleResult>
```

## Flux de Communication

### 1. Réception de la Requête

```
Utilisateur → Main Orchestrator
  - Contenu source
  - Format source
  - Format cible
  - Options de conversion
```

### 2. Vérification de Charge

```
Main Orchestrator
  ↓
Vérifie la surcharge système (gracefulDegradationManager)
  ↓
Acquiert un slot de concurrence (concurrencyController)
  ↓
Initialise le budget de ressources (resourceBudgetManager)
```

### 3. Détermination du Chemin

```
Main Orchestrator
  ↓
Détermine le chemin de conversion (findConversionPath)
  ↓
Exemple: AsciiDoc → Markdown → AsciiDoc
  [
    { from: 'asciidoc', to: 'markdown', converter: 'auto' },
    { from: 'markdown', to: 'asciidoc', converter: 'auto' }
  ]
```

### 4. Création du Fichier Temporaire

```
Main Orchestrator
  ↓
Crée un fichier temporaire d'entrée
  - Emplacement: {tmpdir}/ascend-main/{conversionId}_input.{ext}
  - Contenu: Contenu source fourni par l'utilisateur
```

### 5. Délégation à l'Orchestrateur d'Exécution

```
Main Orchestrator → Execution Orchestrator
  - inputFilePath: Chemin du fichier temporaire d'entrée
  - conversionPath: Chemin de conversion déterminé
  - options: Options de conversion (avec conversionId)
```

### 6. Exécution des Étapes

```
Execution Orchestrator
  ↓
Crée un dossier temporaire d'exécution
  - Emplacement: {tmpdir}/ascend-execution/{conversionId}
  ↓
Copie le fichier d'entrée dans le dossier temporaire
  ↓
Pour chaque étape:
  - Exécute via converter-orchestrator (avec _internal: true)
  - Utilise la sortie comme entrée pour l'étape suivante
  ↓
Lit le résultat final
```

### 7. Retour des Résultats

```
Execution Orchestrator → Main Orchestrator
  {
    success: boolean,
    logs: string[],
    error: string | null,
    duration: number,
    outputContent: string,
    stepsExecuted: number
  }
```

### 8. Nettoyage et Libération

```
Main Orchestrator
  ↓
Enregistre le succès/échec (gracefulDegradationManager)
  ↓
Libère le slot de concurrence (concurrencyController)
  ↓
Nettoie le fichier temporaire d'entrée
  ↓
Retourne le résultat à l'utilisateur
```

## Format de Communication

### Requête de l'Orchestrateur Principal vers l'Orchestrateur d'Exécution

```typescript
{
  inputFilePath: string,        // Chemin absolu vers le fichier d'entrée
  conversionPath: Array<{        // Chemin de conversion
    from: string,                // Format source de l'étape
    to: string,                  // Format cible de l'étape
    converter: string            // 'auto' (déterminé par converter-orchestrator)
  }>,
  options: {
    conversionId: string,        // ID unique de conversion
    _internal: true,             // Flag indiquant un appel interne
    // ... autres options
  }
}
```

### Réponse de l'Orchestrateur d'Exécution vers l'Orchestrateur Principal

```typescript
{
  success: boolean,               // Statut de l'exécution
  logs: string | string[],       // Logs d'exécution
  error: string | null,         // Message d'erreur ou null
  duration: number,              // Durée en secondes
  outputContent: string,         // Contenu du fichier final (si succès)
  stepsExecuted: number,         // Nombre d'étapes exécutées
  outputFile?: string,           // Chemin du fichier final (optionnel)
  workDirectory?: string         // Dossier temporaire utilisé (optionnel)
}
```

## Gestion des Dossiers Temporaires

### Dossier Temporaire Principal

**Emplacement :** `{tmpdir}/ascend-main/{conversionId}_input.{ext}`

**Gestion :**
- Créé par le main orchestrator
- Contient uniquement le fichier d'entrée initial
- Nettoyé par le main orchestrator dans le bloc `finally`

**Permissions :** 0o700 (lecture/écriture/exécution pour le propriétaire uniquement)

### Dossier Temporaire d'Exécution

**Emplacement :** `{tmpdir}/ascend-execution/{conversionId}/`

**Gestion :**
- Créé par l'execution orchestrator
- Contient tous les fichiers intermédiaires et le fichier final
- Structure :
  ```
  {workDir}/
    ├── step0_input.{ext}      # Copie du fichier source
    ├── step1_output.{ext}      # Sortie de l'étape 1 (si multi-étapes)
    ├── step2_output.{ext}      # Sortie de l'étape 2 (si multi-étapes)
    └── final_output.{ext}     # Fichier final
  ```
- Nettoyé par l'execution orchestrator dans le bloc `finally`

**Permissions :** 0o700 (lecture/écriture/exécution pour le propriétaire uniquement)

### Isolation et Sécurité

- **Aucun partage d'état** : Chaque conversion a ses propres dossiers temporaires uniques
- **Nettoyage garanti** : Les dossiers sont toujours nettoyés, même en cas d'erreur
- **Pas d'accès externe** : Les modules n'ont accès qu'aux chemins fournis par les orchestrateurs

## Format de Retour Standardisé

Les deux orchestrateurs retournent un format standardisé conforme à `modules.interface.md` :

```typescript
interface ModuleResult {
  success: boolean;           // Statut de la conversion
  logs: string | string[];    // Logs de l'exécution
  error: string | null;       // Message d'erreur (null si succès)
  duration: number;           // Durée en secondes
}
```

### Informations Supplémentaires

L'orchestrateur d'exécution peut inclure des informations supplémentaires dans le résultat :

```typescript
{
  ...ModuleResult,
  outputContent?: string,     // Contenu du fichier final
  stepsExecuted?: number,      // Nombre d'étapes exécutées
  outputFile?: string,         // Chemin du fichier final
  workDirectory?: string      // Dossier temporaire utilisé
}
```

## Sécurité et Isolation

### Obligations de Sécurité Minimales (V1)

Les deux orchestrateurs respectent les obligations de sécurité minimales définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Isolation Stricte

- **Dossiers temporaires uniques** : Chaque conversion a ses propres dossiers isolés
- **Aucun état partagé** : Aucune donnée n'est partagée entre deux conversions
- **Permissions restrictives** : Dossiers créés avec permissions 0o700

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 2. Gestion Sécurisée des Erreurs

- **Capture exhaustive** : Toutes les exceptions sont capturées et transformées en `ModuleResult` avec `success: false`
- **Pas de crash global** : Aucune exception non gérée ne remonte au pipeline principal
- **Nettoyage garanti** : Le nettoyage est effectué même en cas d'erreur

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 3. Journalisation Minimale

- **ID de conversion** : Les orchestrateurs incluent l'ID de conversion unique dans leurs logs
- **Horodatage** : Les orchestrateurs enregistrent l'horodatage de début et de fin d'exécution
- **Logs d'exécution** : Les orchestrateurs produisent des logs décrivant chaque étape
- **Statut final** : Les orchestrateurs incluent le statut final (succès/échec) dans les logs retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 4. Contrôle de Charge

- **Vérification de surcharge** : Le main orchestrator vérifie la surcharge avant d'accepter une conversion
- **Limite de concurrence** : Un seul slot de concurrence est acquis par conversion (géré par le main orchestrator)
- **Budget de ressources** : Un budget de ressources est initialisé pour chaque conversion
- **Dégradation contrôlée** : Les succès et échecs sont enregistrés pour détecter la surcharge

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Communication Sécurisée

- **Flag `_internal`** : Les appels depuis le main orchestrator vers l'execution orchestrator sont marqués avec `_internal: true`
- **Pas de double comptage** : Les étapes individuelles n'acquièrent pas de slot de concurrence séparé
- **Suivi unifié** : Tous les succès et échecs sont enregistrés dans le gestionnaire de dégradation contrôlée

## Extensibilité Future

### Ajout de Nouveaux Orchestrateurs

L'architecture permet d'ajouter facilement de nouveaux orchestrateurs :

1. **Créer le nouveau module orchestrateur** : Conforme à l'interface standard
2. **Définir le rôle** : Spécialisé dans un type de conversion ou une stratégie particulière
3. **Intégrer la communication** : Utiliser les mêmes mécanismes de communication que les orchestrateurs existants
4. **Gérer le contrôle de charge** : Utiliser les mêmes mécanismes de contrôle de charge

### Stratégies de Conversion Avancées

Le système peut être étendu pour supporter :

- **Plusieurs formats intermédiaires** : Au lieu de seulement Markdown, utiliser plusieurs formats intermédiaires
- **Optimisation de chemin** : Choisir le chemin le plus court ou le plus rapide
- **Parallélisation** : Exécuter certaines étapes en parallèle si possible
- **Cache** : Mettre en cache les résultats intermédiaires pour optimiser les performances

### Communication Asynchrone

Pour l'instant, la communication est synchrone. L'architecture peut être étendue pour supporter :

- **File d'attente** : Utiliser une file d'attente pour les conversions
- **Notifications** : Notifier l'utilisateur lorsque la conversion est terminée
- **Statut en temps réel** : Fournir un statut en temps réel de la progression

## Comportement Attendu

### En Cas de Succès

1. Le main orchestrator reçoit la requête et vérifie la charge
2. Le chemin de conversion est déterminé
3. Le fichier temporaire d'entrée est créé
4. L'execution orchestrator exécute toutes les étapes avec succès
5. Le résultat final est retourné au main orchestrator
6. Les ressources sont nettoyées (fichier d'entrée, dossier d'exécution)
7. Le slot de concurrence est libéré
8. Le résultat est retourné à l'utilisateur

### En Cas d'Échec

1. Si la vérification de charge échoue, le main orchestrator retourne immédiatement une erreur
2. Si le chemin de conversion ne peut pas être trouvé, le main orchestrator retourne une erreur
3. Si une étape échoue, l'execution orchestrator retourne une erreur au main orchestrator
4. Les ressources sont **toujours** nettoyées, même en cas d'erreur
5. Le slot de concurrence est **toujours** libéré
6. L'échec est enregistré pour le suivi de charge

## Notes Techniques

### Simplicité du Flux

Le flux de communication est simple et linéaire :

- **Pas de logique complexe** : Le flux reste prévisible et facile à déboguer
- **Exécution séquentielle** : Les étapes sont exécutées l'une après l'autre
- **Pas de retry automatique** : Si une étape échoue, la conversion échoue immédiatement

### Dépendances

Les orchestrateurs dépendent de :

- **converter-orchestrator.module.js** : Pour l'exécution des conversions individuelles
- **lazyload.module.js** : Pour le chargement des modules
- **pipeline-security.js** : Pour le contrôle de charge et la sécurité
- **Modules de conversion** : Les modules individuels (downdoc, pandoc, etc.)

### Limitations

- **Flux linéaire uniquement** : Le système ne supporte pas les flux complexes avec branches ou conditions
- **Format intermédiaire simple** : La stratégie actuelle utilise uniquement Markdown comme format intermédiaire
- **Communication synchrone** : La communication est synchrone (pas de file d'attente)

## Conformité

Les deux orchestrateurs respectent strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations de sécurité minimales de la version 1. Toute modification des orchestrateurs doit maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [converter-orchestrator.module.md](./converter-orchestrator.module.md) - Module orchestrateur de converters
- [orchestrator.module.md](./orchestrator.module.md) - Module orchestrateur linéaire (ancien)
- [PIPELINE.md](../../PIPELINE.md) - Spécification du pipeline de conversion
- [lazyload.module.md](./lazyload.module.md) - Module de lazy loading
