# Communication entre orchestrateurs

## Description

Ce document décrit l'architecture de communication entre deux orchestrateurs distincts qui collaborent pour exécuter les conversions de documents, en évitant la surcharge et en répartissant efficacement la charge.

## Architecture des orchestrateurs

### Orchestrateur principal (`main-orchestrator.js`)

**Rôle :** Orchestrateur principal qui reçoit les requêtes utilisateur, choisit le chemin de conversion et délègue les tâches au second orchestrateur.

**Responsabilités :**
- Réception des requêtes utilisateur (contenu, formats source et cible)
- Validation du contenu et des formats
- Détermination du chemin de conversion (direct ou via un format intermédiaire)
- Gestion du contrôle de charge (vérification de surcharge, acquisition de slot de concurrence)
- Initialisation du budget de ressources
- Création du fichier d'entrée temporaire
- Délégation à l'orchestrateur d'exécution
- Enregistrement du succès/échec pour le suivi de charge
- Nettoyage du fichier d'entrée temporaire
- Libération du slot de concurrence

**Interface principale :**
```typescript
executeConversionRequest(content: string, sourceFormat: string, targetFormat: string, options?: Object): Promise<ModuleResult>
```

### Orchestrateur d'exécution (`execution-orchestrator.js`)

**Rôle :** Orchestrateur secondaire qui exécute les conversions étape par étape, utilise les modules nécessaires et retourne les résultats.

**Responsabilités :**
- Réception du chemin de conversion et du fichier d'entrée depuis l'orchestrateur principal
- Création du répertoire temporaire d'exécution
- Exécution séquentielle des étapes de conversion
- Utilisation du converter-orchestrator pour chaque étape (avec le flag `_internal: true`)
- Gestion des fichiers intermédiaires
- Lecture du résultat final
- Nettoyage du répertoire temporaire
- Retour du résultat à l'orchestrateur principal

**Interface principale :**
```typescript
executeConversionSteps(inputFilePath: string, conversionPath: Array, options?: Object): Promise<ModuleResult>
```

## Flux de communication

### 1. Réception de la requête

```
Utilisateur → Orchestrateur principal
  - Contenu source
  - Format source
  - Format cible
  - Options de conversion
```

### 2. Vérification de la charge

```
Orchestrateur principal
  ↓
Vérifie la surcharge du système (gracefulDegradationManager)
  ↓
Acquiert un slot de concurrence (concurrencyController)
  ↓
Initialise le budget de ressources (resourceBudgetManager)
```

### 3. Détermination du chemin

```
Orchestrateur principal
  ↓
Détermine le chemin de conversion (findConversionPath)
  ↓
Exemple : AsciiDoc → Markdown → AsciiDoc
  [
    { from: 'asciidoc', to: 'markdown', converter: 'auto' },
    { from: 'markdown', to: 'asciidoc', converter: 'auto' }
  ]
```

### 4. Création du fichier temporaire

```
Orchestrateur principal
  ↓
Crée le fichier d'entrée temporaire
  - Emplacement : {tmpdir}/ascend-main/{conversionId}_input.{ext}
  - Contenu : Contenu source fourni par l'utilisateur
```

### 5. Délégation à l'orchestrateur d'exécution

```
Orchestrateur principal → Orchestrateur d'exécution
  - inputFilePath : Chemin du fichier d'entrée temporaire
  - conversionPath : Chemin de conversion déterminé
  - options : Options de conversion (avec conversionId)
```

### 6. Exécution des étapes

```
Orchestrateur d'exécution
  ↓
Crée le répertoire temporaire d'exécution
  - Emplacement : {tmpdir}/ascend-execution/{conversionId}
  ↓
Copie le fichier d'entrée dans le répertoire temporaire
  ↓
Pour chaque étape :
  - Exécute via converter-orchestrator (avec _internal: true)
  - Utilise la sortie comme entrée pour l'étape suivante
  ↓
Lit le résultat final
```

### 7. Retour du résultat

```
Orchestrateur d'exécution → Orchestrateur principal
  {
    success: boolean,
    logs: string[],
    error: string | null,
    duration: number,
    outputContent: string,
    stepsExecuted: number
  }
```

### 8. Nettoyage et libération

```
Orchestrateur principal
  ↓
Enregistre le succès/échec (gracefulDegradationManager)
  ↓
Libère le slot de concurrence (concurrencyController)
  ↓
Nettoie le fichier d'entrée temporaire
  ↓
Retourne le résultat à l'utilisateur
```

## Format de communication

### Requête de l'orchestrateur principal vers l'orchestrateur d'exécution

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

### Réponse de l'orchestrateur d'exécution vers l'orchestrateur principal

```typescript
{
  success: boolean,               // Statut d'exécution
  logs: string | string[],       // Journaux d'exécution
  error: string | null,         // Message d'erreur ou null
  duration: number,              // Durée en secondes
  outputContent: string,         // Contenu du fichier final (si succès)
  stepsExecuted: number,         // Nombre d'étapes exécutées
  outputFile?: string,           // Chemin du fichier final (optionnel)
  workDirectory?: string         // Répertoire temporaire utilisé (optionnel)
}
```

## Gestion des répertoires temporaires

### Répertoire temporaire principal

**Emplacement :** `{tmpdir}/ascend-main/{conversionId}_input.{ext}`

**Gestion :**
- Créé par l'orchestrateur principal
- Contient uniquement le fichier d'entrée initial
- Nettoyé par l'orchestrateur principal dans un bloc `finally`

**Permissions :** 0o700 (lecture/écriture/exécution pour le propriétaire uniquement)

### Répertoire temporaire d'exécution

**Emplacement :** `{tmpdir}/ascend-execution/{conversionId}/`

**Gestion :**
- Créé par l'orchestrateur d'exécution
- Contient tous les fichiers intermédiaires et le fichier final
- Structure :
  ```
  {workDir}/
    ├── step0_input.{ext}      # Copie du fichier source
    ├── step1_output.{ext}      # Sortie de l'étape 1 (si multi-étapes)
    ├── step2_output.{ext}      # Sortie de l'étape 2 (si multi-étapes)
    └── final_output.{ext}     # Fichier final
  ```
- Nettoyé par l'orchestrateur d'exécution dans un bloc `finally`

**Permissions :** 0o700 (lecture/écriture/exécution pour le propriétaire uniquement)

### Isolation et sécurité

- **Aucun état partagé :** Chaque conversion possède ses propres répertoires temporaires uniques
- **Nettoyage garanti :** Les répertoires sont toujours nettoyés, même en cas d'erreur
- **Aucun accès externe :** Les modules n'ont accès qu'aux chemins fournis par les orchestrateurs

## Format de retour standardisé

Les deux orchestrateurs retournent un format standardisé conforme à `modules.interface.md` :

```typescript
interface ModuleResult {
  success: boolean;           // Statut de la conversion
  logs: string | string[];    // Journaux d'exécution
  error: string | null;       // Message d'erreur (null si succès)
  duration: number;           // Durée en secondes
}
```

### Informations supplémentaires

L'orchestrateur d'exécution peut inclure des informations supplémentaires dans le résultat :

```typescript
{
  ...ModuleResult,
  outputContent?: string,     // Contenu du fichier final
  stepsExecuted?: number,      // Nombre d'étapes exécutées
  outputFile?: string,         // Chemin du fichier final
  workDirectory?: string      // Répertoire temporaire utilisé
}
```

## Sécurité et isolation

### Obligations minimales de sécurité (V1)

Les deux orchestrateurs respectent les obligations minimales de sécurité définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Isolation stricte

- **Répertoires temporaires uniques :** Chaque conversion possède ses propres répertoires isolés
- **Aucun état partagé :** Aucune donnée n'est partagée entre deux conversions
- **Permissions restrictives :** Répertoires créés avec les permissions 0o700

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 2. Gestion sécurisée des erreurs

- **Capture exhaustive :** Toutes les exceptions sont capturées et transformées en `ModuleResult` avec `success: false`
- **Aucun crash global :** Aucune exception non gérée ne se propage au pipeline principal
- **Nettoyage garanti :** Le nettoyage est effectué même en cas d'erreur

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 3. Journalisation minimale

- **ID de conversion :** Les orchestrateurs incluent l'identifiant unique de conversion dans leurs journaux
- **Horodatage :** Les orchestrateurs enregistrent l'horodatage de début et de fin d'exécution
- **Journaux d'exécution :** Les orchestrateurs produisent des journaux décrivant chaque étape
- **Statut final :** Les orchestrateurs incluent le statut final (succès/échec) dans les journaux retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 4. Contrôle de charge

- **Vérification de surcharge :** L'orchestrateur principal vérifie la surcharge avant d'accepter une conversion
- **Limite de concurrence :** Un seul slot de concurrence est acquis par conversion (géré par l'orchestrateur principal)
- **Budget de ressources :** Un budget de ressources est initialisé pour chaque conversion
- **Dégradation contrôlée :** Les succès et échecs sont enregistrés pour détecter la surcharge

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Communication sécurisée

- **Flag `_internal` :** Les appels de l'orchestrateur principal vers l'orchestrateur d'exécution sont marqués avec `_internal: true`
- **Pas de double comptage :** Les étapes individuelles n'acquièrent pas de slot de concurrence séparé
- **Suivi unifié :** Tous les succès et échecs sont enregistrés dans le gestionnaire de dégradation contrôlée

## Extensibilité future

### Ajout de nouveaux orchestrateurs

L'architecture permet l'ajout facile de nouveaux orchestrateurs :

1. **Créer le nouveau module orchestrateur :** Conforme à l'interface standard
2. **Définir le rôle :** Spécialisé dans un type de conversion ou une stratégie particulière
3. **Intégrer la communication :** Utiliser les mêmes mécanismes de communication que les orchestrateurs existants
4. **Gérer le contrôle de charge :** Utiliser les mêmes mécanismes de contrôle de charge

### Stratégies de conversion avancées

Le système peut être étendu pour prendre en charge :

- **Formats intermédiaires multiples :** Au lieu du seul Markdown, utiliser plusieurs formats intermédiaires
- **Optimisation du chemin :** Choisir le chemin le plus court ou le plus rapide
- **Parallélisation :** Exécuter certaines étapes en parallèle si possible
- **Cache :** Mettre en cache les résultats intermédiaires pour optimiser les performances

### Communication asynchrone

Pour l'instant, la communication est synchrone. L'architecture peut être étendue pour prendre en charge :

- **File d'attente :** Utiliser une file d'attente pour les conversions
- **Notifications :** Notifier l'utilisateur lorsque la conversion est terminée
- **Statut en temps réel :** Fournir le statut en temps réel de la progression

## Comportement attendu

### En cas de succès

1. L'orchestrateur principal reçoit la requête et vérifie la charge
2. Le chemin de conversion est déterminé
3. Le fichier d'entrée temporaire est créé
4. L'orchestrateur d'exécution exécute toutes les étapes avec succès
5. Le résultat final est retourné à l'orchestrateur principal
6. Les ressources sont nettoyées (fichier d'entrée, répertoire d'exécution)
7. Le slot de concurrence est libéré
8. Le résultat est retourné à l'utilisateur

### En cas d'échec

1. Si la vérification de charge échoue, l'orchestrateur principal retourne immédiatement une erreur
2. Si le chemin de conversion ne peut pas être trouvé, l'orchestrateur principal retourne une erreur
3. Si une étape échoue, l'orchestrateur d'exécution retourne une erreur à l'orchestrateur principal
4. Les ressources sont **toujours** nettoyées, même en cas d'erreur
5. Le slot de concurrence est **toujours** libéré
6. L'échec est enregistré pour le suivi de charge

## Notes techniques

### Simplicité du flux

Le flux de communication est simple et linéaire :

- **Pas de logique complexe :** Le flux reste prévisible et facile à déboguer
- **Exécution séquentielle :** Les étapes sont exécutées les unes après les autres
- **Pas de nouvelle tentative automatique :** Si une étape échoue, la conversion échoue immédiatement

### Dépendances

Les orchestrateurs dépendent de :

- **converter-orchestrator.module.js :** Pour l'exécution des conversions individuelles
- **lazyload.module.js :** Pour le chargement des modules
- **pipeline-security.js :** Pour le contrôle de charge et la sécurité
- **Modules de conversion :** Modules individuels (downdoc, pandoc, etc.)

### Limitations

- **Flux linéaire uniquement :** Le système ne prend pas en charge les flux complexes avec branches ou conditions
- **Format intermédiaire simple :** La stratégie actuelle utilise uniquement Markdown comme format intermédiaire
- **Communication synchrone :** La communication est synchrone (pas de file d'attente)

## Conformité

Les deux orchestrateurs respectent strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations minimales de sécurité de la version 1. Toute modification des orchestrateurs doit maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [converter-orchestrator.module.md](./converter-orchestrator.module.md) - Module orchestrateur de conversion
- [orchestrator.module.md](./orchestrator.module.md) - Module orchestrateur linéaire (legacy)
- [PIPELINE.md](../../PIPELINE.md) - Spécification du pipeline de conversion
- [lazyload.module.md](./lazyload.module.md) - Module de chargement différé
