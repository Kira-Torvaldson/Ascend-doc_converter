# Module Orchestrator

## Description

Le module `orchestrator` est un mini-orchestrateur qui gère un flux linéaire de conversion en chaînant plusieurs modules de conversion en séquence. Ce module crée un dossier temporaire unique pour chaque conversion, exécute les modules nécessaires l'un après l'autre, et garantit le nettoyage des ressources même en cas d'erreur.

## Nom du module

**Identifiant :** `orchestrator`  
**Type :** Module orchestrateur linéaire  
**Rôle :** Gestion du flux linéaire de conversion multi-étapes

## Objectif

Permettre la conversion d'un fichier source vers un format cible en passant par plusieurs modules de conversion en séquence, lorsque la conversion directe n'est pas disponible. Le module gère automatiquement la création et le nettoyage des fichiers temporaires intermédiaires.

## Fonctionnement

### Flux linéaire d'exécution

Le module orchestre un flux linéaire simple et prévisible :

1. **Réception des paramètres** : Fichier source, format source, format cible
2. **Détermination du chemin de conversion** : Identification des modules nécessaires
3. **Création du dossier temporaire** : Dossier unique et isolé pour la conversion
4. **Exécution séquentielle** : Chaque module est exécuté l'un après l'autre
5. **Nettoyage** : Suppression du dossier temporaire (même en cas d'erreur)

### Exemple de flux

Pour une conversion `AsciiDoc → Markdown → AsciiDoc` :

```
Input: document.adoc (AsciiDoc)
  ↓
Step 1: downdoc module
  ↓
Intermediate: step1_output.md (Markdown)
  ↓
Step 2: pandoc module
  ↓
Output: final_output.adoc (AsciiDoc)
```

## Interface principale : `executeLinearConversion`

### Signature

```typescript
executeLinearConversion(inputFilePath: string, sourceFormat: string, targetFormat: string, options?: Object): Promise<ModuleResult>
```

### Description du fonctionnement

La méthode `executeLinearConversion` orchestre l'exécution d'une conversion linéaire selon le processus suivant :

#### 1. Validation de l'entrée

- Vérifie que le fichier source existe
- Valide les formats source et cible

#### 2. Détermination du chemin de conversion

Le module détermine automatiquement la séquence de modules nécessaires :

- **Conversion directe** : Si un converter supporte directement la conversion, un seul module est utilisé
- **Conversion via format intermédiaire** : Si la conversion directe n'est pas disponible, le module tente de passer par un format intermédiaire (ex: Markdown)
- **Limite de sécurité** : Maximum 10 étapes pour éviter les boucles infinies

#### 3. Création du dossier temporaire

- Crée un dossier temporaire unique dans `{tmpdir}/ascend-orchestrator/{conversionId}`
- Le dossier est isolé et sécurisé (permissions 0o700)
- Chaque conversion a son propre dossier, aucun partage d'état

#### 4. Exécution séquentielle des modules

Pour chaque étape de conversion :

- Copie le fichier d'entrée dans le dossier temporaire (pour la première étape)
- Détermine les chemins d'entrée et de sortie
- Exécute le module via `converter-orchestrator.executeConversion()`
- Vérifie le succès de l'étape
- Utilise la sortie comme entrée pour l'étape suivante

#### 5. Lecture du résultat final

- Lit le fichier de sortie final depuis le dossier temporaire
- Retourne le contenu dans le résultat

#### 6. Nettoyage systématique

- Le dossier temporaire est **toujours** nettoyé, même en cas d'erreur
- Utilise un bloc `finally` pour garantir le nettoyage
- Les erreurs de nettoyage sont loggées mais n'interrompent pas le flux

### Paramètres

- **`inputFilePath`** (requis) : `string`
  - Chemin absolu vers le fichier source à convertir
  - Le fichier doit exister et être lisible

- **`sourceFormat`** (requis) : `string`
  - Format source (markdown, asciidoc, html, txt, etc.)
  - Doit correspondre au format réel du fichier

- **`targetFormat`** (requis) : `string`
  - Format de destination souhaité (markdown, asciidoc, html, pdf, etc.)

- **`options`** (optionnel) : `Object`
  - Options de conversion spécifiques
  - `conversionId` : ID de conversion pour les logs (optionnel, généré automatiquement si absent)
  - Autres options passées aux modules individuels

### Valeur de retour

La méthode retourne une `Promise` qui se résout avec un objet `ModuleResult` :

```typescript
{
  success: boolean,        // true si conversion réussie, false sinon
  logs: string | string[], // Logs d'exécution (orchestrateur + modules)
  error: string | null,   // Message d'erreur ou null
  duration: number,       // Durée totale en secondes
  outputFile?: string,    // Chemin du fichier de sortie (si success)
  outputContent?: string, // Contenu du fichier de sortie (si success)
  stepsExecuted?: number  // Nombre d'étapes exécutées (si success)
}
```

## Gestion du dossier temporaire

### Création

- **Emplacement** : `{tmpdir}/ascend-orchestrator/{conversionId}`
- **Permissions** : 0o700 (lecture/écriture/exécution pour le propriétaire uniquement)
- **Isolation** : Chaque conversion a son propre dossier unique
- **Sécurité** : Aucun accès depuis l'extérieur du pipeline

### Structure interne

```
{workDir}/
  ├── step0_input.{ext}      # Copie du fichier source
  ├── step1_output.{ext}     # Sortie de l'étape 1 (si multi-étapes)
  ├── step2_output.{ext}     # Sortie de l'étape 2 (si multi-étapes)
  └── final_output.{ext}     # Fichier final
```

### Nettoyage

- **Garantie** : Le nettoyage est **toujours** effectué, même en cas d'erreur
- **Méthode** : Utilise `rmSync` avec `recursive: true` et `force: true`
- **Robustesse** : Les erreurs de nettoyage sont loggées mais n'interrompent pas le flux
- **Timing** : Nettoyage effectué dans le bloc `finally` de la méthode

## Communication avec le converter-orchestrator

Le module `orchestrator` communique avec le `converter-orchestrator` pour éviter la surcharge du système :

### Partage du contrôle de charge

- **Gestion centralisée** : Le linear orchestrator gère le contrôle de charge pour toute la conversion multi-étapes
- **Appels internes** : Les appels au converter-orchestrator depuis le linear orchestrator sont marqués avec `_internal: true`
- **Pas de double comptage** : Les étapes individuelles n'acquièrent pas de slot de concurrence séparé
- **Suivi unifié** : Tous les succès et échecs sont enregistrés dans le gestionnaire de dégradation contrôlée

### Mécanismes de protection

1. **Vérification de surcharge** : Avant de commencer, le linear orchestrator vérifie si le système peut accepter une nouvelle conversion
2. **Acquisition de slot** : Un seul slot de concurrence est acquis pour toute la conversion multi-étapes
3. **Budget de ressources** : Un budget de ressources est initialisé pour toute la conversion
4. **Enregistrement des résultats** : Les succès et échecs sont enregistrés pour le suivi de la charge système

## Sécurité et isolation

### Obligations de sécurité minimales (V1)

Le module respecte les obligations de sécurité minimales définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Isolation stricte

- **Dossier temporaire unique** : Chaque conversion a son propre dossier isolé
- **Aucun état partagé** : Aucune donnée n'est partagée entre deux conversions
- **Permissions restrictives** : Dossier créé avec permissions 0o700

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 2. Gestion sécurisée des erreurs

- **Capture exhaustive** : Toutes les exceptions sont capturées et transformées en `ModuleResult` avec `success: false`
- **Pas de crash global** : Aucune exception non gérée ne remonte au pipeline principal
- **Nettoyage garanti** : Le nettoyage est effectué même en cas d'erreur

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 3. Journalisation minimale

- **ID de conversion** : Le module inclut l'ID de conversion unique dans ses logs
- **Horodatage** : Le module enregistre l'horodatage de début et de fin d'exécution
- **Logs d'exécution** : Le module produit des logs décrivant chaque étape
- **Statut final** : Le module inclut le statut final (succès/échec) dans les logs retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 4. Limites de sécurité

- **Maximum d'étapes** : Limite de 10 étapes pour éviter les boucles infinies
- **Validation des chemins** : Les chemins de fichiers sont validés avant utilisation
- **Pas d'accès réseau** : Le module ne doit pas accéder au réseau pendant l'exécution

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Contraintes d'exécution

- **Isolation** : Le module ne modifie pas les wrappers existants, il les orchestre uniquement
- **Linéarité** : Le flux reste simple et linéaire, pas de logique complexe
- **Sécurité** : Le module délègue la sécurité aux modules individuels selon leurs obligations

## Comportement attendu

### En cas de succès

1. Le chemin de conversion est déterminé et validé
2. Le dossier temporaire est créé
3. Toutes les étapes sont exécutées avec succès
4. Le fichier de sortie final est créé et lu
5. Le dossier temporaire est nettoyé
6. Le module retourne un `ModuleResult` avec `success: true`, `error: null`, des logs détaillés, la durée d'exécution, et les informations supplémentaires (`outputFile`, `outputContent`, `stepsExecuted`)

### En cas d'échec

1. Si le fichier source n'existe pas, le module retourne immédiatement un `ModuleResult` avec `success: false`
2. Si aucun chemin de conversion n'est trouvé, le module retourne un `ModuleResult` avec `success: false`
3. Si une étape échoue, l'erreur est capturée et transformée en `ModuleResult` avec `success: false`
4. Le dossier temporaire est **toujours** nettoyé, même en cas d'erreur
5. Le module retourne un `ModuleResult` avec `success: false`, un message d'erreur descriptif dans `error`, les logs jusqu'au point d'échec, et la durée jusqu'à l'échec

### Types d'erreurs possibles

- **Erreur de fichier source** : Le fichier source n'existe pas ou n'est pas lisible
- **Erreur de chemin de conversion** : Aucun chemin de conversion n'a été trouvé
- **Erreur d'étape** : Une étape de conversion a échoué (erreur capturée et standardisée)
- **Erreur d'orchestration** : Erreur lors de l'exécution du flux (erreur capturée et standardisée)
- **Erreur de nettoyage** : Le nettoyage du dossier temporaire a échoué (loggée mais n'interrompt pas le flux)

## Notes

### Simplicité du flux

Le module est conçu pour être simple et linéaire :

- **Pas de logique complexe** : Le flux reste prévisible et facile à déboguer
- **Exécution séquentielle** : Les modules sont exécutés l'un après l'autre, pas en parallèle
- **Pas de retry automatique** : Si une étape échoue, la conversion échoue immédiatement

### Dépendances

Le module dépend de :

- **lazyload.module.js** : Pour le chargement des modules
- **converter-orchestrator.module.js** : Pour l'exécution des conversions individuelles
- **Modules de conversion** : Les modules individuels (downdoc, pandoc, etc.)

### Extensibilité

Le module peut être étendu pour :

- **Stratégies de chemin** : Ajouter d'autres stratégies pour déterminer le chemin de conversion (ex: via plusieurs formats intermédiaires)
- **Optimisations** : Parallélisation de certaines étapes si nécessaire
- **Cache** : Mise en cache des résultats intermédiaires pour optimiser les performances

### Limitations

- **Flux linéaire uniquement** : Le module ne supporte pas les flux complexes avec branches ou conditions
- **Format intermédiaire simple** : La stratégie actuelle utilise uniquement Markdown comme format intermédiaire
- **Pas de validation de contenu** : Le module ne valide pas le contenu des fichiers intermédiaires

## Conformité

Ce module respecte strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations de sécurité minimales de la version 1. Toute modification du module doit maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [lazyload.module.md](./lazyload.module.md) - Module de lazy loading
- [converter-orchestrator.module.md](./converter-orchestrator.module.md) - Module orchestrateur de converters
- [PIPELINE.md](../../PIPELINE.md) - Spécification du pipeline de conversion
- [downdoc.module.md](./downdoc.module.md) - Module Downdoc
- [pandoc.module.md](./pandoc.module.md) - Module Pandoc
