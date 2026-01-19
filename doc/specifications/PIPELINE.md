# Spécification du Pipeline de Conversion

## Vue d'ensemble

Ce document définit les règles et principes que le pipeline de conversion doit respecter. Il s'agit d'une spécification interne normative qui décrit le comportement attendu du système sans imposer d'implémentation particulière.

## Principe fondamental : Isolation stricte

### Règle 1 : Une conversion = une exécution totalement isolée

Chaque conversion doit être traitée comme une opération atomique et indépendante. Aucune conversion ne doit pouvoir interférer avec une autre, que ce soit par :
- Partage de fichiers temporaires
- Partage d'état mémoire
- Partage de ressources système
- Modification de variables globales

### Règle 2 : Un dossier temporaire unique par conversion

Le pipeline doit créer un dossier temporaire unique pour chaque conversion. Ce dossier :
- Doit être identifié par un UUID unique généré de manière cryptographiquement sécurisée
- Doit être créé dans un répertoire racine dédié (ex: `/tmp/ascend-conversions/`)
- Doit avoir des permissions restrictives (mode 0o700)
- Ne doit jamais être partagé entre deux conversions simultanées ou successives

### Règle 3 : Aucun état partagé entre deux conversions

Le pipeline ne doit maintenir aucun état persistant entre deux conversions. Chaque conversion doit :
- Créer ses propres ressources temporaires
- Ne pas dépendre de ressources créées par une conversion précédente
- Ne pas modifier des ressources utilisées par d'autres conversions
- Ne pas utiliser de variables globales modifiables

### Règle 4 : Nettoyage systématique des ressources temporaires

Le pipeline doit garantir le nettoyage des ressources temporaires créées pour une conversion, même en cas d'erreur. Le nettoyage doit :
- Être exécuté dans un bloc `finally` pour garantir l'exécution
- Supprimer récursivement le dossier temporaire complet
- Ne pas propager d'erreur si le nettoyage échoue (log uniquement)
- Être effectué immédiatement après la fin de la conversion (succès ou échec)

## Notion de pipeline : Enchaînement de modules

### Règle 5 : Modules indépendants

Le pipeline est composé de modules de conversion indépendants. Chaque module :
- Ne doit pas connaître l'existence des autres modules
- Ne doit pas dépendre de l'ordre d'exécution des autres modules
- Doit pouvoir être exécuté de manière isolée
- Ne doit pas partager d'état avec d'autres modules

### Règle 6 : Communication par fichiers uniquement

Les modules communiquent exclusivement par l'intermédiaire de fichiers :
- Un module prend un fichier d'entrée en paramètre
- Un module produit un fichier de sortie
- Aucune communication directe entre modules (pas de variables partagées, pas de callbacks, pas de streams partagés)
- Les chemins de fichiers doivent être passés explicitement

### Règle 7 : Format de communication standardisé

Les fichiers d'entrée et de sortie doivent :
- Être des fichiers texte encodés en UTF-8
- Avoir des extensions correspondant aux formats (`.md`, `.adoc`, `.html`, etc.)
- Être situés dans le dossier temporaire de la conversion
- Avoir des noms prédéfinis et sécurisés (ex: `input.<ext>`, `output.<ext>`)

## Responsabilités du pipeline

### Responsabilité 1 : Création et destruction du dossier temporaire

Le pipeline est responsable de :
- Créer le dossier temporaire unique avant toute opération de conversion
- Créer le répertoire racine s'il n'existe pas
- Fournir des méthodes sécurisées pour obtenir des chemins de fichiers dans ce dossier
- Détruire le dossier temporaire après la conversion (succès ou échec)

### Responsabilité 2 : Passage explicite des chemins de fichiers

Le pipeline doit :
- Générer les chemins absolus des fichiers d'entrée et de sortie
- Valider que les chemins sont bien dans le dossier temporaire (protection contre path traversal)
- Passer ces chemins explicitement aux modules de conversion
- Ne jamais construire de chemins à partir de données utilisateur non validées

### Responsabilité 3 : Capture des logs et erreurs par module

Le pipeline doit :
- Capturer la sortie standard (stdout) de chaque module
- Capturer la sortie d'erreur (stderr) de chaque module
- Logger les événements de conversion avec un ID unique
- Ne jamais exposer de détails système dans les messages d'erreur utilisateur
- Associer chaque log à l'ID de conversion unique

### Responsabilité 4 : Validation et sécurité

Le pipeline doit :
- Valider le contenu d'entrée avant toute conversion
- Valider que la conversion demandée est autorisée (whitelist)
- Vérifier la taille des fichiers (limite maximale)
- Détecter les fichiers binaires déguisés
- Valider les formats source et destination

### Responsabilité 5 : Gestion du timeout

Le pipeline doit :
- Imposer un timeout configurable pour chaque conversion
- Arrêter proprement les processus en cas de timeout (SIGTERM puis SIGKILL)
- Garantir qu'aucun processus ne reste actif après une conversion
- Nettoyer les ressources même en cas de timeout

## Contrat logique d'un module de conversion

### Définition

Un module de conversion est une unité fonctionnelle qui transforme un fichier d'un format source vers un format de destination.

### Propriétés requises

Chaque module de conversion doit exposer les propriétés suivantes :

#### 1. Nom du module

Un identifiant unique et descriptif (ex: `pandoc-converter`, `downdoc-converter`, `text2markdown-converter`).

#### 2. Formats d'entrée acceptés

Une liste explicite des formats que le module peut traiter en entrée (ex: `['markdown', 'asciidoc', 'html']`).

#### 3. Formats de sortie produits

Une liste explicite des formats que le module peut produire en sortie (ex: `['markdown', 'asciidoc', 'html', 'pdf']`).

#### 4. Fonction d'exécution

Une fonction qui respecte la signature suivante :

```javascript
/**
 * @param {string} inputFile - Chemin absolu vers le fichier d'entrée
 * @param {string} outputFile - Chemin absolu vers le fichier de sortie
 * @param {string} fromFormat - Format source (normalisé en minuscules)
 * @param {string} toFormat - Format destination (normalisé en minuscules)
 * @param {Object} options - Options de conversion (timeout, etc.)
 * @returns {Promise<void>} - Résout si la conversion réussit, rejette en cas d'erreur
 * @throws {ConversionError} - En cas d'erreur de conversion
 */
async function execute(inputFile, outputFile, fromFormat, toFormat, options = {})
```

### Contraintes d'exécution

Un module de conversion doit :
- Ne jamais modifier le fichier d'entrée
- Créer le fichier de sortie uniquement si la conversion réussit
- Ne jamais accéder à des fichiers en dehors du dossier temporaire
- Ne jamais exécuter de commandes système non validées
- Utiliser uniquement `spawn` pour l'exécution de processus (jamais `exec` ou `execSync`)
- Respecter le timeout fourni dans les options
- Ne jamais exposer de détails système dans les messages d'erreur

### Gestion d'erreurs

Un module de conversion doit :
- Lever une `ConversionError` avec un code d'erreur normalisé en cas d'échec
- Ne jamais exposer de chemins de fichiers système dans les messages d'erreur
- Ne jamais exposer de détails d'implémentation dans les messages d'erreur
- Capturer et logger les erreurs de processus (stdout/stderr)

## Exécution sécurisée des commandes

### Règle 8 : Utilisation exclusive de spawn

Le pipeline doit utiliser uniquement `child_process.spawn` pour exécuter des commandes externes. Il ne doit jamais utiliser :
- `child_process.exec`
- `child_process.execSync`
- `child_process.spawnSync` (sauf cas exceptionnels justifiés)

### Règle 9 : Whitelist stricte des conversions

Le pipeline doit maintenir une whitelist stricte des conversions autorisées. Toute conversion non listée dans cette whitelist doit être refusée avant même l'exécution d'un module.

### Règle 10 : Arguments construits depuis la whitelist

Les arguments passés aux commandes externes doivent être construits exclusivement depuis la whitelist. Aucun argument utilisateur ne doit être utilisé directement dans la construction de la commande.

### Règle 11 : Chemins absolus vers les binaires

Le pipeline doit utiliser des chemins absolus vers les binaires externes (ex: `/usr/bin/pandoc`). Ces chemins peuvent être configurés via des variables d'environnement mais doivent toujours être validés avant utilisation.

## Sécurité d'exécution du pipeline

Cette section définit les règles de sécurité défensives que le pipeline doit respecter pour garantir l'isolation et la protection des ressources système lors de l'exécution des conversions.

### Règle 14 : Isolement des conversions

Le pipeline doit garantir l'isolement complet de chaque conversion au niveau système :

#### 14.1 : Exécution sous utilisateur non privilégié

Chaque conversion doit s'exécuter sous un utilisateur système non privilégié dédié. Cet utilisateur :
- Ne doit pas avoir de privilèges d'administration (pas de sudo, pas de droits root)
- Ne doit avoir accès qu'aux ressources strictement nécessaires à la conversion
- Ne doit pas pouvoir modifier des fichiers système ou des configurations critiques
- Doit être distinct de l'utilisateur principal du système

#### 14.2 : Dossier temporaire avec permissions strictes

Le dossier temporaire créé pour chaque conversion doit :
- Avoir des permissions restrictives (mode 0o700) garantissant l'accès exclusif au processus de conversion
- Être propriétaire de l'utilisateur non privilégié dédié
- Ne pas être accessible en lecture ou écriture par d'autres utilisateurs ou processus
- Être créé avec des permissions qui empêchent toute modification externe

#### 14.3 : Restrictions d'écriture

Aucun module de conversion ne doit :
- Écrire en dehors du dossier temporaire alloué à sa conversion
- Modifier des fichiers existants en dehors du dossier temporaire
- Créer des fichiers dans des emplacements non autorisés
- Accéder à des répertoires système, de configuration ou utilisateur

Le pipeline doit valider que tous les chemins d'écriture sont strictement contenus dans le dossier temporaire de la conversion. Toute tentative d'écriture en dehors de ce périmètre doit être détectée et la conversion doit être immédiatement interrompue.

### Règle 15 : Désactivation du réseau pendant l'exécution

Les modules de conversion ne doivent pas avoir accès au réseau pendant leur exécution. Cette restriction s'applique à :
- Les connexions TCP/IP sortantes
- Les connexions UDP sortantes
- Les requêtes HTTP/HTTPS
- Les connexions DNS
- Toute autre forme de communication réseau

#### 15.1 : Détection des tentatives d'accès réseau

Toute tentative d'accès réseau par un module de conversion doit être considérée comme anormale et suspecte. Le pipeline doit :
- Détecter ces tentatives (par monitoring, sandbox, ou autre mécanisme)
- Interrompre immédiatement la conversion en cas de détection
- Logger l'événement avec l'ID de conversion et les détails de la tentative
- Marquer la conversion comme échouée avec un code d'erreur approprié

#### 15.2 : Mécanismes d'isolation réseau

L'implémentation exacte de l'isolation réseau n'est pas imposée par cette spécification. Le pipeline peut utiliser :
- Des règles de firewall applicatives
- Des namespaces réseau (Linux network namespaces)
- Des conteneurs avec réseau désactivé
- Des sandboxes avec restrictions réseau
- Tout autre mécanisme garantissant l'absence d'accès réseau

Le choix du mécanisme est laissé à l'implémentation, mais l'isolation réseau doit être garantie pour toutes les conversions.

### Règle 16 : Limites de ressources

Le pipeline doit imposer des limites strictes sur les ressources système utilisables par chaque conversion.

#### 16.1 : Timeout strict

Chaque module de conversion doit être soumis à un timeout strict et non négociable. Ce timeout :
- Doit être configurable mais avoir une valeur maximale absolue
- Doit être appliqué dès le début de l'exécution du module
- Ne doit pas pouvoir être contourné ou étendu par le module
- Doit entraîner l'interruption immédiate du processus en cas de dépassement

#### 16.2 : Limite mémoire maximale

Chaque module de conversion doit avoir une limite mémoire maximale (RSS, heap, ou équivalent selon le système). Cette limite :
- Doit être définie avant l'exécution du module
- Doit être surveillée pendant toute la durée de l'exécution
- Doit entraîner l'interruption du processus si elle est dépassée
- Ne doit pas pouvoir être modifiée par le module lui-même

En cas de dépassement de la limite mémoire, le module doit être immédiatement interrompu et la conversion doit être marquée comme échouée avec un code d'erreur approprié.

#### 16.3 : Plafonnement de la taille des fichiers d'entrée

La taille des fichiers d'entrée doit être plafonnée à une valeur maximale configurable. Le pipeline doit :
- Valider la taille du fichier d'entrée avant toute opération de conversion
- Refuser immédiatement toute conversion dont le fichier d'entrée dépasse la limite
- Ne pas commencer l'exécution du module si la limite est dépassée
- Retourner une erreur de validation claire

Cette limite doit être appliquée en plus de toute validation de format ou de contenu.

#### 16.4 : Interruption en cas de dépassement

En cas de dépassement de toute limite de ressources (timeout, mémoire, taille de fichier), le pipeline doit :
- Interrompre immédiatement le processus du module
- Utiliser SIGTERM puis SIGKILL si nécessaire pour garantir l'arrêt
- Nettoyer toutes les ressources allouées
- Marquer la conversion comme échouée avec un code d'erreur approprié
- Logger l'événement avec les détails du dépassement (type de limite, valeur atteinte, valeur limite)

### Règle 17 : Politique de formats autorisés

Le pipeline doit maintenir une liste blanche explicite et exhaustive des formats autorisés.

#### 17.1 : Liste blanche des formats source

Le pipeline doit maintenir une liste blanche explicite des formats source acceptés. Cette liste :
- Doit être définie de manière statique et non modifiable à l'exécution
- Doit être consultée avant toute validation de contenu
- Ne doit contenir que des formats explicitement autorisés
- Doit être exhaustive (aucun format non listé ne peut être accepté)

Toute tentative de conversion depuis un format non listé dans la whitelist doit être refusée immédiatement, avant même la création du dossier temporaire.

#### 17.2 : Liste blanche des formats cible

Le pipeline doit maintenir une liste blanche explicite des formats cible autorisés. Cette liste :
- Doit être définie de manière statique et non modifiable à l'exécution
- Doit être consultée avant toute validation de conversion
- Ne doit contenir que des formats explicitement autorisés
- Doit être exhaustive (aucun format non listé ne peut être accepté)

Toute tentative de conversion vers un format non listé dans la whitelist doit être refusée immédiatement, avant même la création du dossier temporaire.

#### 17.3 : Refus immédiat des conversions non autorisées

Toute conversion dont le format source ou le format cible n'est pas dans la liste blanche respective doit être refusée immédiatement. Le pipeline doit :
- Effectuer cette vérification avant toute autre opération (création de dossier, validation de contenu, etc.)
- Ne pas créer de ressources temporaires pour une conversion non autorisée
- Retourner une erreur de validation avec un code d'erreur normalisé
- Logger la tentative avec les formats demandés

### Règle 18 : Journalisation minimale de sécurité

Le pipeline doit produire un log minimal de sécurité pour chaque conversion, indépendamment de son succès ou de son échec.

#### 18.1 : Contenu obligatoire du log de sécurité

Chaque log de sécurité doit contenir de manière obligatoire :
- **ID unique de conversion** : UUID généré de manière cryptographiquement sécurisée
- **Horodatage** : Timestamp ISO 8601 de début et de fin de conversion
- **Format source** : Format d'entrée normalisé (en minuscules)
- **Format cible** : Format de sortie normalisé (en minuscules)
- **Modules exécutés** : Liste des modules de conversion exécutés (nom et version si disponible)
- **Durée** : Durée totale de la conversion en millisecondes
- **Statut final** : Statut de la conversion (SUCCESS, FAILED, TIMEOUT, INTERRUPTED, etc.)

#### 18.2 : Format et stockage

Les logs de sécurité doivent :
- Être structurés dans un format standardisé (JSON, CSV, ou autre format structuré)
- Être stockés de manière persistante (fichier, base de données, système de logging)
- Être accessibles pour audit et analyse postérieure
- Ne pas contenir de données utilisateur (contenu des fichiers, chemins complets, etc.)

#### 18.3 : Intégrité et non-répudiation

Les logs de sécurité doivent :
- Être horodatés de manière fiable (horloge système synchronisée)
- Ne pas pouvoir être modifiés après écriture (append-only ou mécanisme équivalent)
- Permettre la traçabilité complète de chaque conversion
- Être associés de manière indissociable à l'ID de conversion unique

Ces logs constituent un audit trail minimal permettant de tracer toutes les conversions exécutées par le pipeline, leurs paramètres, et leur résultat.

## Stabilité et résilience du backend

Cette section définit les règles que le pipeline doit respecter pour garantir la stabilité, la résilience et la disponibilité du backend face aux attaques par abus de ressources, aux entrées malveillantes et aux comportements anormaux des modules.

### Règle 19 : Validation stricte des entrées

Le pipeline doit valider de manière exhaustive tous les chemins de fichiers et données d'entrée avant toute opération de conversion.

#### 19.1 : Validation des chemins de fichiers

Tous les chemins de fichiers fournis en entrée doivent être validés selon les règles suivantes :

- **Chemins relatifs interdits** : Aucun chemin relatif ne doit être accepté. Tous les chemins doivent être absolus et validés comme tels avant utilisation.

- **Symlinks interdits** : Les liens symboliques (symlinks) ne doivent pas être suivis. Le pipeline doit détecter et refuser tout chemin qui résout vers un symlink, qu'il soit dans le dossier temporaire ou ailleurs.

- **Path traversal interdit** : Tous les chemins doivent être validés pour s'assurer qu'ils ne contiennent pas de séquences de path traversal (`..`, `../`, etc.). Toute tentative de sortir du dossier temporaire autorisé doit être détectée et refusée immédiatement.

- **Validation de résolution** : Le pipeline doit résoudre les chemins absolus et vérifier qu'ils pointent bien vers des emplacements autorisés avant toute opération de lecture ou d'écriture.

#### 19.2 : Validation du type réel de fichier

Le type réel du fichier (déterminé par son contenu, MIME type, ou signature de fichier) doit correspondre au format déclaré par l'utilisateur. Le pipeline doit :

- Détecter le type réel du fichier d'entrée par analyse de son contenu (magic bytes, en-têtes, structure)
- Comparer ce type réel au format déclaré dans la requête de conversion
- Refuser immédiatement toute conversion où le type réel ne correspond pas au format déclaré
- Logger la tentative avec les détails de la non-concordance (type réel détecté, format déclaré)

Cette validation doit être effectuée avant toute opération de conversion et avant même la création du dossier temporaire si possible.

#### 19.3 : Plafonnement strict de la taille des fichiers d'entrée

La taille des fichiers d'entrée doit être strictement plafonnée à une valeur maximale configurable. Le pipeline doit :

- Valider la taille du fichier d'entrée avant toute autre opération
- Refuser immédiatement toute conversion dont le fichier d'entrée dépasse la limite maximale
- Ne pas créer de ressources temporaires pour un fichier dépassant la limite
- Retourner une erreur de validation claire avec le code d'erreur approprié
- Logger la tentative avec la taille du fichier et la limite maximale

Cette limite doit être appliquée de manière absolue et ne doit pas pouvoir être contournée par des techniques de compression ou d'encodage.

### Règle 20 : Robustesse de l'orchestrateur

L'orchestrateur du pipeline (le processus principal qui coordonne les conversions) doit être conçu pour résister à tous les types d'échecs de modules sans jamais crasher.

#### 20.1 : Isolation des échecs de modules

Aucun module de conversion ne doit pouvoir faire tomber le processus principal de l'orchestrateur. Le pipeline doit :

- Exécuter chaque module dans un contexte isolé qui empêche toute propagation d'erreur fatale au processus principal
- Capturer toutes les exceptions, erreurs non gérées, et signaux de terminaison émis par les modules
- Transformer toute erreur non gérée en échec contrôlé avec un code d'erreur normalisé
- Garantir que le processus principal continue de fonctionner même si un module provoque un crash, une exception non capturée, ou un comportement anormal

#### 20.2 : Gestion exhaustive des erreurs

Toute erreur non gérée doit être capturée et transformée en échec contrôlé. Le pipeline doit :

- Utiliser des mécanismes de capture d'erreurs exhaustifs (try-catch, handlers de signaux, handlers de promesses rejetées, etc.)
- Intercepter toutes les formes d'erreurs possibles (exceptions synchrones, promesses rejetées, erreurs asynchrones, signaux système)
- Transformer chaque erreur capturée en `ConversionError` avec un code d'erreur approprié
- Logger l'erreur avec l'ID de conversion et les détails nécessaires pour le diagnostic
- Ne jamais laisser une erreur non gérée remonter jusqu'au processus principal

#### 20.3 : Continuité de service

Le processus principal de l'orchestrateur doit maintenir sa disponibilité même en cas d'échecs multiples ou répétés. Le pipeline doit :

- Continuer à accepter de nouvelles conversions même si des conversions précédentes ont échoué
- Ne pas accumuler d'état corrompu entre les conversions
- Garantir que chaque conversion est traitée de manière indépendante, même si des conversions précédentes ont causé des erreurs
- Maintenir un état de santé global permettant de détecter si le système est dans un état dégradé

### Règle 21 : Contrôle du nombre de conversions simultanées

Le pipeline doit imposer une limite maximale stricte sur le nombre de conversions pouvant s'exécuter simultanément.

#### 21.1 : Limite de concurrence maximale

Le pipeline doit maintenir un compteur du nombre de conversions actuellement en cours d'exécution et imposer une limite maximale configurable. Cette limite :

- Doit être définie de manière statique et non modifiable à l'exécution (ou via configuration sécurisée)
- Doit être vérifiée avant d'accepter toute nouvelle conversion
- Ne doit pas pouvoir être contournée par des techniques de requêtes multiples ou de timing
- Doit être appliquée de manière atomique pour éviter les conditions de course

#### 21.2 : Gestion du dépassement de capacité

Lorsque la limite de conversions simultanées est atteinte, le pipeline doit :

- Refuser immédiatement toute nouvelle conversion avec un code d'erreur approprié (ex: `RATE_LIMIT_EXCEEDED`, `CAPACITY_EXCEEDED`)
- Ne pas créer de ressources temporaires pour une conversion refusée
- Logger la tentative de conversion refusée avec l'ID de conversion et le nombre de conversions en cours
- Retourner une réponse claire indiquant que le système est temporairement surchargé

Le pipeline ne doit pas mettre en file d'attente les conversions refusées, sauf si un mécanisme de file d'attente explicite est implémenté avec ses propres limites et garanties.

#### 21.3 : Décrémentation du compteur

Le compteur de conversions simultanées doit être décrémenté de manière garantie dès qu'une conversion se termine (succès ou échec). Le pipeline doit :

- Décrémenter le compteur dans un bloc `finally` pour garantir l'exécution même en cas d'erreur
- Vérifier que le compteur ne devient jamais négatif (détection d'anomalie)
- Logger toute anomalie détectée dans le compteur (valeur négative, décalage, etc.)

### Règle 22 : Protection contre les abus de ressources

Chaque conversion doit avoir un budget global de ressources (CPU, mémoire, temps) qui ne doit pas pouvoir être dépassé.

#### 22.1 : Budget global de ressources

Chaque conversion doit se voir allouer un budget global de ressources défini avant son exécution. Ce budget doit inclure :

- **Budget CPU** : Limite sur l'utilisation CPU (temps CPU, pourcentage CPU, ou équivalent selon le système)
- **Budget mémoire** : Limite sur l'utilisation mémoire (RSS, heap, ou équivalent selon le système)
- **Budget temps** : Limite sur le temps d'exécution total (timeout global)

Ce budget doit être défini de manière non négociable et ne doit pas pouvoir être modifié par le module de conversion lui-même.

#### 22.2 : Surveillance continue des ressources

Le pipeline doit surveiller en continu l'utilisation des ressources par chaque conversion pendant toute sa durée d'exécution. Cette surveillance doit :

- Être effectuée à intervalles réguliers (polling) ou en temps réel (monitoring)
- Détecter immédiatement tout dépassement de budget (CPU, mémoire, ou temps)
- Être indépendante du module de conversion (le module ne peut pas désactiver ou contourner la surveillance)

#### 22.3 : Interruption en cas de dépassement de budget

En cas de dépassement de tout budget de ressources, le pipeline doit :

- Interrompre immédiatement la conversion sans délai
- Utiliser SIGTERM puis SIGKILL si nécessaire pour garantir l'arrêt du processus
- Nettoyer toutes les ressources allouées à la conversion
- Marquer la conversion comme échouée avec un code d'erreur approprié (ex: `RESOURCE_LIMIT_EXCEEDED`)
- Logger l'événement avec les détails du dépassement (type de ressource, valeur atteinte, valeur limite, durée d'exécution)

Aucun module ne doit pouvoir contourner ces limites, que ce soit par des techniques de fork, de threads, ou d'autres mécanismes de contournement.

### Règle 23 : Politique de comportement anormal

Le pipeline doit détecter et traiter tout comportement anormal des modules de conversion comme une menace potentielle.

#### 23.1 : Accès hors du dossier temporaire

Toute tentative d'accès (lecture ou écriture) à un fichier ou répertoire en dehors du dossier temporaire alloué à la conversion doit être considérée comme un comportement anormal. Le pipeline doit :

- Détecter ces tentatives par monitoring, sandbox, ou autre mécanisme approprié
- Interrompre immédiatement la conversion en cas de détection
- Logger l'événement avec l'ID de conversion, le chemin tenté, et le chemin autorisé
- Marquer la conversion comme échouée avec un code d'erreur approprié (ex: `SECURITY_VIOLATION`, `UNAUTHORIZED_ACCESS`)

#### 23.2 : Tentatives d'accès réseau

Toute tentative d'accès réseau par un module de conversion doit être considérée comme un comportement anormal (voir Règle 15). Le pipeline doit :

- Détecter ces tentatives et les traiter comme des violations de sécurité
- Interrompre immédiatement la conversion
- Logger l'événement avec l'ID de conversion et les détails de la tentative (adresse IP, port, protocole)
- Marquer la conversion comme échouée avec un code d'erreur approprié

#### 23.3 : Profils d'exécution anormaux

Toute exécution dépassant largement les profils normaux doit être signalée et potentiellement interrompue. Le pipeline doit :

- Maintenir des profils de référence pour chaque type de conversion (durée moyenne, utilisation mémoire moyenne, utilisation CPU moyenne)
- Détecter les exécutions qui s'écartent significativement de ces profils (par exemple, durée > 3x la moyenne, mémoire > 2x la moyenne)
- Logger ces anomalies avec l'ID de conversion et les métriques observées
- Considérer l'interruption de la conversion si l'écart est trop important (configurable)

Ces profils doivent être mis à jour dynamiquement pour refléter les comportements réels observés, mais toute conversion dépassant largement les profils doit être traitée avec suspicion.

### Règle 24 : Politique de dégradation contrôlée

En cas de surcharge ou de conditions anormales, le pipeline doit refuser de nouvelles conversions plutôt que de devenir instable ou corrompu.

#### 24.1 : Détection de surcharge

Le pipeline doit surveiller en continu l'état de charge du système et détecter les conditions de surcharge. Les indicateurs de surcharge peuvent inclure :

- Nombre de conversions simultanées proche ou égal à la limite maximale
- Utilisation CPU globale élevée
- Utilisation mémoire globale élevée
- Taux d'échec de conversions anormalement élevé
- Temps de réponse moyen anormalement élevé

#### 24.2 : Refus de nouvelles conversions en cas de surcharge

Lorsque des conditions de surcharge sont détectées, le pipeline doit :

- Refuser immédiatement toute nouvelle conversion avec un code d'erreur approprié (ex: `SYSTEM_OVERLOADED`, `SERVICE_UNAVAILABLE`)
- Ne pas créer de ressources temporaires pour une conversion refusée
- Logger le refus avec les indicateurs de surcharge observés
- Retourner une réponse claire indiquant que le système est temporairement surchargé

Le pipeline ne doit pas accepter de nouvelles conversions tant que les conditions de surcharge persistent. Il doit continuer à traiter les conversions en cours, mais refuser toute nouvelle demande.

#### 24.3 : Prévention de l'état partiellement corrompu

Le backend ne doit jamais entrer dans un état partiellement corrompu. Le pipeline doit :

- Garantir que chaque conversion se termine dans un état propre (succès ou échec clair, ressources nettoyées)
- Ne pas laisser de ressources orphelines ou d'états intermédiaires en cas d'erreur
- Valider l'intégrité de l'état du système après chaque conversion (compteurs, ressources, etc.)
- Détecter et corriger automatiquement tout état incohérent détecté

Si le pipeline détecte qu'il est dans un état partiellement corrompu, il doit :

- Refuser toute nouvelle conversion jusqu'à ce que l'état soit restauré
- Logger l'état corrompu détecté avec tous les détails nécessaires pour le diagnostic
- Tenter de restaurer automatiquement l'état propre si possible
- Signaler l'état corrompu à un système de monitoring ou d'alerte si disponible

## Cycle de vie d'une conversion

### Phase 1 : Initialisation

1. Génération d'un UUID unique pour la conversion
2. Création du dossier temporaire unique
3. Validation de la confirmation utilisateur (si requise)
4. Validation du contenu d'entrée
5. Validation de la conversion demandée (whitelist)

### Phase 2 : Préparation

1. Détermination des extensions de fichiers (entrée et sortie)
2. Génération des chemins absolus sécurisés
3. Écriture du fichier d'entrée dans le dossier temporaire
4. Validation des chemins (protection path traversal)

### Phase 3 : Exécution

1. Sélection du module de conversion approprié
2. Exécution du module avec les paramètres validés
3. Capture de stdout/stderr
4. Surveillance du timeout
5. Arrêt forcé si timeout dépassé

### Phase 4 : Finalisation

1. Vérification de l'existence du fichier de sortie
2. Lecture du contenu converti
3. Journalisation du succès
4. Retour du résultat

### Phase 5 : Nettoyage (toujours exécutée)

1. Suppression récursive du dossier temporaire
2. Journalisation des erreurs de nettoyage (sans propagation)
3. Libération des ressources

## Gestion des erreurs

### Codes d'erreur normalisés

Le pipeline doit utiliser des codes d'erreur normalisés :
- `VALIDATION_ERROR` : Erreur de validation (format, taille, etc.)
- `BINARY_NOT_FOUND` : Binaire externe introuvable
- `TIMEOUT` : Timeout de conversion
- `CONVERSION_FAILED` : Échec de la conversion
- `OUTPUT_MISSING` : Fichier de sortie non créé
- `EXECUTION_ERROR` : Erreur d'exécution du processus
- `FILE_VALIDATION_ERROR` : Erreur de validation du fichier
- `CONFIRMATION_REQUIRED` : Confirmation utilisateur requise
- `CONFIRMATION_TOKEN_*` : Erreurs liées aux tokens de confirmation

### Messages d'erreur utilisateur

Les messages d'erreur exposés à l'utilisateur doivent :
- Être génériques et ne pas exposer de détails système
- Utiliser des messages pré-définis associés aux codes d'erreur
- Ne jamais contenir de chemins de fichiers système
- Ne jamais contenir de détails d'implémentation
- Inclure l'ID de conversion pour le suivi

## Journalisation sécurisée

### Règle 12 : Aucune donnée utilisateur dans les logs

Le pipeline ne doit jamais logger :
- Le contenu des fichiers convertis
- Les chemins complets des fichiers utilisateur
- Les données personnelles
- Les tokens de confirmation

### Règle 13 : Logs structurés

Les logs doivent être structurés et contenir :
- Timestamp ISO 8601
- ID de conversion unique
- Type d'événement (STARTED, SUCCESS, TIMEOUT, etc.)
- Détails limités (200 caractères maximum)

## Exceptions et cas particuliers

### Conversion simple (sans token)

Certaines conversions simples (ex: AsciiDoc → Markdown via downdoc) peuvent être exécutées sans token de confirmation. Le pipeline doit :
- Valider que la conversion est dans la liste des conversions simples
- Appliquer les mêmes règles d'isolation et de nettoyage
- Respecter les mêmes contraintes de sécurité

### Conversions multiples

Si le pipeline doit supporter des conversions multiples (chaînage), chaque étape doit :
- Créer son propre dossier temporaire
- Nettoyer son dossier temporaire après exécution
- Passer le résultat à l'étape suivante via fichier intermédiaire
- Ne jamais partager de dossier temporaire entre étapes

## Conclusion

Cette spécification définit les règles que le pipeline de conversion doit respecter. Toute implémentation ou modification du pipeline doit être conforme à ces règles. Ces règles garantissent :

- **Sécurité** : Isolation stricte, validation, exécution sécurisée
- **Fiabilité** : Nettoyage garanti, gestion d'erreurs normalisée
- **Maintenabilité** : Modules indépendants, contrats clairs
- **Traçabilité** : Journalisation sécurisée, IDs uniques

Toute violation de ces règles doit être considérée comme un bug ou une régression et doit être corrigée.
