# Module Orchestrateur

## Description

Le module `orchestrator` est un mini-orchestrateur qui gère un flux de conversion linéaire en enchaînant plusieurs modules de conversion en séquence. Ce module crée un répertoire temporaire unique pour chaque conversion, exécute les modules nécessaires les uns après les autres, et garantit le nettoyage des ressources même en cas d'erreur.

## Nom du module

**Identifiant :** `orchestrator`  
**Type :** Module orchestrateur linéaire  
**Rôle :** Gestion du flux de conversion linéaire multi-étapes

## Objectif

Permettre la conversion d'un fichier source vers un format cible en passant par plusieurs modules de conversion en séquence, lorsqu'une conversion directe n'est pas disponible. Le module gère automatiquement la création et le nettoyage des fichiers temporaires intermédiaires.

## Fonctionnement

### Flux d'exécution linéaire

Le module orchestre un flux simple et prévisible :

1. **Réception des paramètres :** Fichier source, format source, format cible
2. **Détermination du chemin de conversion :** Identification des modules nécessaires
3. **Création du répertoire temporaire :** Répertoire unique et isolé pour la conversion
4. **Exécution séquentielle :** Chaque module est exécuté les uns après les autres
5. **Nettoyage :** Suppression du répertoire temporaire (même en cas d'erreur)

### Exemple de flux

Pour une conversion `AsciiDoc → Markdown → AsciiDoc` :

```
Entrée : document.adoc (AsciiDoc)
  ↓
Étape 1 : module downdoc
  ↓
Intermédiaire : step1_output.md (Markdown)
  ↓
Étape 2 : module pandoc
  ↓
Sortie : final_output.adoc (AsciiDoc)
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

Le module détermine automatiquement la séquence des modules nécessaires :

- **Conversion directe :** Si un convertisseur prend en charge directement la conversion, un seul module est utilisé
- **Conversion via format intermédiaire :** Si la conversion directe n'est pas disponible, le module tente de passer par un format intermédiaire (ex. Markdown)
- **Limite de sécurité :** Maximum 10 étapes pour éviter les boucles infinies

#### 3. Création du répertoire temporaire

- Crée un répertoire temporaire unique dans `{tmpdir}/ascend-orchestrator/{conversionId}`
- Le répertoire est isolé et sécurisé (permissions 0o700)
- Chaque conversion possède son propre répertoire, aucun état partagé

#### 4. Exécution séquentielle des modules

Pour chaque étape de conversion :

- Copie le fichier d'entrée dans le répertoire temporaire (pour la première étape)
- Détermine les chemins d'entrée et de sortie
- Exécute le module via `converter-orchestrator.executeConversion()`
- Vérifie le succès de l'étape
- Utilise la sortie comme entrée pour l'étape suivante

#### 5. Lecture du résultat final

- Lit le fichier de sortie final depuis le répertoire temporaire
- Retourne le contenu dans le résultat

#### 6. Nettoyage systématique

- Le répertoire temporaire est **toujours** nettoyé, même en cas d'erreur
- Utilise un bloc `finally` pour garantir le nettoyage
- Les erreurs de nettoyage sont journalisées mais n'interrompent pas le flux

### Paramètres

- **`inputFilePath`** (obligatoire) : `string`
  - Chemin absolu vers le fichier source à convertir
  - Le fichier doit exister et être lisible

- **`sourceFormat`** (obligatoire) : `string`
  - Format source (markdown, asciidoc, html, txt, etc.)
  - Doit correspondre au format réel du fichier

- **`targetFormat`** (obligatoire) : `string`
  - Format de destination souhaité (markdown, asciidoc, html, pdf, etc.)

- **`options`** (optionnel) : `Object`
  - Options de conversion spécifiques
  - `conversionId` : ID de conversion pour les journaux (optionnel, généré automatiquement si absent)
  - Autres options transmises aux modules individuels

### Valeur de retour

La méthode retourne une `Promise` qui se résout avec un objet `ModuleResult` :

```typescript
{
  success: boolean,        // true si la conversion a réussi, false sinon
  logs: string | string[], // Journaux d'exécution (orchestrateur + modules)
  error: string | null,   // Message d'erreur ou null
  duration: number,       // Durée totale en secondes
  outputFile?: string,    // Chemin du fichier de sortie (si succès)
  outputContent?: string, // Contenu du fichier de sortie (si succès)
  stepsExecuted?: number  // Nombre d'étapes exécutées (si succès)
}
```

## Gestion des répertoires temporaires

### Création

- **Emplacement :** `{tmpdir}/ascend-orchestrator/{conversionId}`
- **Permissions :** 0o700 (lecture/écriture/exécution pour le propriétaire uniquement)
- **Isolation :** Chaque conversion possède son propre répertoire unique
- **Sécurité :** Aucun accès depuis l'extérieur du pipeline

### Structure interne

```
{workDir}/
  ├── step0_input.{ext}      # Copie du fichier source
  ├── step1_output.{ext}     # Sortie de l'étape 1 (si multi-étapes)
  ├── step2_output.{ext}     # Sortie de l'étape 2 (si multi-étapes)
  └── final_output.{ext}     # Fichier final
```

### Nettoyage

- **Garantie :** Le nettoyage est **toujours** effectué, même en cas d'erreur
- **Méthode :** Utilise `rmSync` avec `recursive: true` et `force: true`
- **Robustesse :** Les erreurs de nettoyage sont journalisées mais n'interrompent pas le flux
- **Moment :** Nettoyage effectué dans le bloc `finally` de la méthode

## Communication avec converter-orchestrator

Le module `orchestrator` communique avec le `converter-orchestrator` pour éviter la surcharge du système :

### Partage du contrôle de charge

- **Gestion centralisée :** L'orchestrateur linéaire gère le contrôle de charge pour l'ensemble de la conversion multi-étapes
- **Appels internes :** Les appels au converter-orchestrator depuis l'orchestrateur linéaire sont marqués avec `_internal: true`
- **Pas de double comptage :** Les étapes individuelles n'acquièrent pas de slot de concurrence séparé
- **Suivi unifié :** Tous les succès et échecs sont enregistrés dans le gestionnaire de dégradation contrôlée

### Mécanismes de protection

1. **Vérification de surcharge :** Avant de démarrer, l'orchestrateur linéaire vérifie si le système peut accepter une nouvelle conversion
2. **Acquisition de slot :** Un seul slot de concurrence est acquis pour l'ensemble de la conversion multi-étapes
3. **Budget de ressources :** Un budget de ressources est initialisé pour l'ensemble de la conversion
4. **Enregistrement des résultats :** Les succès et échecs sont enregistrés pour le suivi de charge du système

## Sécurité et isolation

### Obligations minimales de sécurité (V1)

Le module respecte les obligations minimales de sécurité définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Isolation stricte

- **Répertoire temporaire unique :** Chaque conversion possède son propre répertoire isolé
- **Aucun état partagé :** Aucune donnée n'est partagée entre deux conversions
- **Permissions restrictives :** Répertoire créé avec les permissions 0o700

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 2. Gestion sécurisée des erreurs

- **Capture exhaustive :** Toutes les exceptions sont capturées et transformées en `ModuleResult` avec `success: false`
- **Aucun crash global :** Aucune exception non gérée ne se propage au pipeline principal
- **Nettoyage garanti :** Le nettoyage est effectué même en cas d'erreur

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 3. Journalisation minimale

- **ID de conversion :** Le module inclut l'identifiant unique de conversion dans ses journaux
- **Horodatage :** Le module enregistre l'horodatage de début et de fin d'exécution
- **Journaux d'exécution :** Le module produit des journaux décrivant chaque étape
- **Statut final :** Le module inclut le statut final (succès/échec) dans les journaux retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 4. Limites de sécurité

- **Étapes maximales :** Limite de 10 étapes pour éviter les boucles infinies
- **Validation des chemins :** Les chemins de fichiers sont validés avant utilisation
- **Aucun accès réseau :** Le module ne doit pas accéder au réseau pendant l'exécution

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Contraintes d'exécution

- **Isolation :** Le module ne modifie pas les wrappers existants, il les orchestre uniquement
- **Linéarité :** Le flux reste simple et linéaire, sans logique complexe
- **Sécurité :** Le module délègue la sécurité aux modules individuels selon leurs obligations

## Comportement attendu

### En cas de succès

1. Le chemin de conversion est déterminé et validé
2. Le répertoire temporaire est créé
3. Toutes les étapes sont exécutées avec succès
4. Le fichier de sortie final est créé et lu
5. Le répertoire temporaire est nettoyé
6. Le module retourne un `ModuleResult` avec `success: true`, `error: null`, des journaux détaillés, la durée d'exécution, et des informations supplémentaires (`outputFile`, `outputContent`, `stepsExecuted`)

### En cas d'échec

1. Si le fichier source n'existe pas, le module retourne immédiatement un `ModuleResult` avec `success: false`
2. Si aucun chemin de conversion n'est trouvé, le module retourne un `ModuleResult` avec `success: false`
3. Si une étape échoue, l'erreur est capturée et transformée en `ModuleResult` avec `success: false`
4. Le répertoire temporaire est **toujours** nettoyé, même en cas d'erreur
5. Le module retourne un `ModuleResult` avec `success: false`, un message d'erreur descriptif dans `error`, des journaux jusqu'au point d'échec, et la durée jusqu'à l'échec

### Types d'erreurs possibles

- **Erreur de fichier source :** Le fichier source n'existe pas ou n'est pas lisible
- **Erreur de chemin de conversion :** Aucun chemin de conversion n'a été trouvé
- **Erreur d'étape :** Une étape de conversion a échoué (erreur capturée et standardisée)
- **Erreur d'orchestration :** Erreur lors de l'exécution du flux (erreur capturée et standardisée)
- **Erreur de nettoyage :** Le nettoyage du répertoire temporaire a échoué (journalisé mais n'interrompt pas le flux)

## Notes

### Simplicité du flux

Le module est conçu pour être simple et linéaire :

- **Pas de logique complexe :** Le flux reste prévisible et facile à déboguer
- **Exécution séquentielle :** Les modules sont exécutés les uns après les autres, pas en parallèle
- **Pas de nouvelle tentative automatique :** Si une étape échoue, la conversion échoue immédiatement

### Dépendances

Le module dépend de :

- **lazyload.module.js :** Pour le chargement des modules
- **converter-orchestrator.module.js :** Pour l'exécution des conversions individuelles
- **Modules de conversion :** Modules individuels (downdoc, pandoc, etc.)

### Extensibilité

Le module peut être étendu pour :

- **Stratégies de chemin :** Ajouter d'autres stratégies pour déterminer le chemin de conversion (ex. via plusieurs formats intermédiaires)
- **Optimisations :** Parallélisation de certaines étapes si nécessaire
- **Cache :** Mise en cache des résultats intermédiaires pour optimiser les performances

### Limitations

- **Flux linéaire uniquement :** Le module ne prend pas en charge les flux complexes avec branches ou conditions
- **Format intermédiaire simple :** La stratégie actuelle utilise uniquement Markdown comme format intermédiaire
- **Pas de validation du contenu :** Le module ne valide pas le contenu des fichiers intermédiaires

## Conformité

Ce module respecte strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations minimales de sécurité de la version 1. Toute modification du module doit maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [lazyload.module.md](./lazyload.module.md) - Module de chargement différé
- [converter-orchestrator.module.md](./converter-orchestrator.module.md) - Module orchestrateur de conversion
- [PIPELINE.md](../../PIPELINE.md) - Spécification du pipeline de conversion
- [downdoc.module.md](./downdoc.module.md) - Module Downdoc
- [pandoc.module.md](./pandoc.module.md) - Module Pandoc
