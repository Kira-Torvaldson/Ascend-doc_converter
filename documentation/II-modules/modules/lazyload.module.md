# Module LazyLoader

## Description

Le module LazyLoader est un gestionnaire centralisé de chargement différé (lazy loading) pour tous les convertisseurs du pipeline de conversion de documents. Ce module réduit la consommation mémoire au démarrage en chargeant chaque convertisseur uniquement lors de sa première utilisation, tout en maintenant une interface uniforme et les obligations minimales de sécurité.

### Rôle du module

Le module LazyLoader agit comme intermédiaire entre le pipeline de conversion et les modules de conversion individuels. Il gère le chargement dynamique, la mise en cache, la validation et l'exécution isolée de chaque convertisseur, garantissant une utilisation efficace des ressources système.

### Principe du chargement différé

Le chargement différé consiste à reporter le chargement d'un module jusqu'à ce qu'il soit réellement nécessaire. Au lieu de charger tous les convertisseurs au démarrage du pipeline, le module LazyLoader charge chaque convertisseur uniquement lors de sa première utilisation, puis le met en cache pour les utilisations ultérieures.

### Avantages mémoire et performance

- **Consommation mémoire réduite** : Les modules inutilisés ne consomment pas de mémoire. Seuls les convertisseurs réellement utilisés sont chargés en mémoire.
- **Démarrage plus rapide** : Le pipeline démarre sans attendre le chargement de tous les convertisseurs, réduisant le temps d'initialisation.
- **Optimisation des ressources** : Les ressources système (CPU, mémoire) sont allouées uniquement aux convertisseurs nécessaires pour une conversion donnée.
- **Évolutivité** : L'ajout de nouveaux convertisseurs n'augmente pas la consommation mémoire au démarrage, permettant l'extension du pipeline sans impact sur les performances initiales.

## Interface exposée

### Méthode `run`

**Signature :**
```typescript
run(moduleName: string, inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

**Description :**
Exécute un convertisseur avec chargement différé automatique. Le module est chargé lors de la première utilisation, puis mis en cache pour les utilisations ultérieures.

**Paramètres :**
- **`moduleName`** (obligatoire) : Nom du module convertisseur à utiliser (ex. `'downdoc'`, `'pandoc'`, `'text2markdown'`)
- **`inputPath`** (obligatoire) : Chemin absolu vers le fichier d'entrée à convertir
- **`outputPath`** (obligatoire) : Chemin absolu vers le fichier de sortie à créer
- **`options`** (optionnel) : Options de conversion spécifiques au module
  - `conversionId` : Identifiant unique de conversion pour la journalisation
  - Autres options définies par chaque module individuel

**Valeur de retour :**
Retourne une `Promise` qui se résout avec un objet `ModuleResult` conforme au contrat défini dans [modules.interface.md](../modules.interface.md) :

```typescript
{
  success: boolean,        // Statut de la conversion (true si succès, false si échec)
  logs: string | string[], // Journaux d'exécution (inclut les journaux de chargement du module)
  error: string | null,     // Message d'erreur (null si succès)
  duration: number         // Durée totale en secondes (inclut le temps de chargement si applicable)
}
```

**Comportement :**
1. Vérifie si le module est déjà chargé et mis en cache
2. Charge le module à la demande si nécessaire
3. Valide que le module respecte l'interface définie dans [modules.interface.md](../modules.interface.md)
4. Exécute la méthode `run` du module avec les paramètres fournis
5. Fusionne les journaux de chargement avec les journaux retournés par le module
6. Retourne le résultat uniforme conforme au contrat

### Compatibilité avec les wrappers existants

Le module LazyLoader est entièrement compatible avec tous les wrappers existants qui respectent l'interface définie dans [modules.interface.md](../modules.interface.md). Aucune modification n'est nécessaire aux wrappers existants. Le module LazyLoader agit comme une couche d'abstraction transparente qui :

- Maintient l'interface standard `run(inputPath, outputPath, options)`
- Retourne le format de résultat standard `{ success, logs, error, duration }`
- Préserve toutes les fonctionnalités et options des modules individuels
- Garantit la rétrocompatibilité avec le code existant

## Fonctionnement interne

### Chargement dynamique des convertisseurs

Le module LazyLoader charge chaque convertisseur uniquement lors de sa première utilisation. Le processus de chargement suit ces étapes :

1. **Vérification du cache** : Le module vérifie si le convertisseur demandé est déjà chargé et disponible en cache
2. **Vérification de l'enregistrement** : Le module vérifie que le convertisseur est enregistré dans le registre des modules disponibles
3. **Chargement du module** : Le module utilise le mécanisme de chargement Node.js (`require()`) pour charger le fichier du convertisseur
4. **Validation de l'interface** : Le module valide que le convertisseur chargé respecte l'interface définie dans [modules.interface.md](../modules.interface.md)
5. **Mise en cache** : Le module chargé est mis en cache pour éviter les rechargements lors des utilisations ultérieures

### Cache des instances

Le module LazyLoader maintient un cache des instances de convertisseurs chargés. Ce cache permet :

- **Éviter les rechargements répétés** : Une fois chargé, un convertisseur reste en mémoire pour les conversions ultérieures
- **Optimiser les performances** : Le temps de chargement n'est payé qu'une seule fois par convertisseur
- **Réduire la consommation mémoire** : Les convertisseurs inutilisés ne sont jamais chargés, même s'ils sont enregistrés

Le cache est maintenu en mémoire pour la durée de vie du processus. Les modules chargés restent disponibles jusqu'à la fin de l'exécution du pipeline.

### Exécution isolée dans un répertoire temporaire dédié

Chaque conversion s'exécute dans un contexte isolé. Le module LazyLoader garantit que :

- **Isolation par conversion** : Chaque conversion utilise un répertoire temporaire unique fourni par le pipeline
- **Aucune interférence** : Les conversions simultanées ne peuvent pas interférer entre elles
- **Nettoyage automatique** : Les ressources temporaires sont nettoyées après chaque conversion

L'isolation est assurée par le pipeline principal, qui fournit les chemins `inputPath` et `outputPath` situés dans des répertoires temporaires dédiés.

### Validation minimale des chemins et fichiers

Avant d'exécuter une conversion, le module LazyLoader effectue une validation minimale :

- **Validation des chemins** : Vérification que `inputPath` et `outputPath` sont des chemins absolus valides
- **Validation de l'existence** : Vérification que le fichier d'entrée existe et est accessible
- **Validation de l'enregistrement** : Vérification que le module convertisseur demandé est enregistré et disponible

Ces validations minimales sont complétées par des validations plus strictes effectuées par chaque module convertisseur individuel selon l'interface définie dans [modules.interface.md](../modules.interface.md).

## Sécurité

### Aucun accès système en dehors des chemins fournis

Le module LazyLoader garantit une isolation stricte en s'assurant que :

- **Accès limité aux chemins fournis** : Seuls les fichiers `inputPath` et `outputPath` fournis par le pipeline sont accessibles
- **Aucun accès réseau** : Le module ne tente aucune connexion réseau pendant le chargement ou l'exécution
- **Aucune modification système** : Le module ne modifie aucun fichier en dehors du contexte de conversion
- **Isolation des modules** : Chaque module convertisseur chargé s'exécute dans son propre contexte, sans accès aux autres modules ou au système

### Gestion des exceptions pour éviter un crash global

Le module LazyLoader implémente une gestion exhaustive des exceptions :

- **Capture de toutes les erreurs** : Toutes les exceptions sont capturées et transformées en `ModuleResult` avec `success: false`
- **Aucune propagation d'exception** : Aucune exception non gérée ne se propage au pipeline principal
- **Messages d'erreur sécurisés** : Les messages d'erreur ne contiennent pas de détails système sensibles (chemins complets, variables d'environnement, traces de pile complètes)
- **Mise en cache des erreurs** : Les erreurs de chargement sont mises en cache pour éviter les tentatives répétées sur des modules défaillants

Cette gestion garantit que le pipeline reste stable même en cas d'erreur de chargement ou d'exécution d'un convertisseur.

### Journalisation minimale

Le module LazyLoader produit une journalisation minimale conforme aux obligations minimales de sécurité V1 :

- **Module chargé** : Les journaux indiquent quel module a été chargé et quand
- **Horodatage** : Chaque opération est horodatée pour la traçabilité
- **Succès/échec** : Le statut de chaque opération (chargement, validation, exécution) est enregistré
- **Durée** : La durée de chargement et d'exécution est enregistrée pour l'analyse des performances

Les journaux sont fusionnés avec les journaux retournés par chaque module convertisseur pour fournir une traçabilité complète de la conversion.

### Préparation aux mesures de sécurité plus strictes futures

Le module LazyLoader est conçu pour évoluer vers des mesures de sécurité plus strictes conformes aux normes internationales :

- **Architecture extensible** : La structure du module permet d'ajouter des validations supplémentaires sans modifier l'interface
- **Points d'extension** : Des points d'extension sont prévus pour l'intégration de vérifications d'intégrité, de signatures numériques et de contrôles d'accès renforcés
- **Journalisation structurée** : La journalisation actuelle peut être étendue pour inclure des formats structurés (JSON, formats standardisés) et l'intégrité des journaux

**Références normatives pour l'évolution future :**
- **ISO 27001** (A.12.4.1) : Journalisation des événements
- **ISO 27002** (A.12.4.1) : Journalisation des événements
- **NIST SP 800-53** (AU-2, AU-3) : Événements d'audit et contenu des enregistrements
- **GDPR/RGPD** (Art. 30, 32) : Registre des activités de traitement et sécurité du traitement

## Performance et limites

### Liste des convertisseurs pris en charge

Le module LazyLoader prend en charge tous les convertisseurs qui respectent l'interface définie dans [modules.interface.md](../modules.interface.md). Les convertisseurs actuellement enregistrés incluent :

- **downdoc** : Conversion AsciiDoc vers Markdown
- **pandoc** : Conversion multi-format (à venir)
- **text2markdown** : Conversion texte vers Markdown (à venir)
- **docverter** : Conversion via le service Docverter (à venir)
- **panwriter** : Conversion via Panwriter (à venir)

De nouveaux convertisseurs peuvent être ajoutés dynamiquement via l'enregistrement dans le registre des modules.

### Impact mémoire réduit par rapport au chargement global

Le chargement différé réduit significativement la consommation mémoire :

- **Au démarrage** : Seule la structure du module LazyLoader est chargée en mémoire (quelques kilo-octets)
- **Pendant l'utilisation** : Seuls les convertisseurs réellement utilisés sont chargés (typiquement quelques méga-octets par convertisseur)
- **Comparaison** : Le chargement global de tous les convertisseurs pourrait consommer plusieurs dizaines de méga-octets au démarrage, même si aucun convertisseur n'est utilisé

L'impact mémoire exact dépend des convertisseurs individuels et de leurs dépendances, mais le chargement différé garantit qu'aucune mémoire n'est allouée pour les convertisseurs inutilisés.

### Note sur la latence initiale lors du premier chargement

Le premier chargement d'un convertisseur introduit une latence supplémentaire :

- **Temps de chargement** : Le chargement initial d'un convertisseur peut prendre de quelques millisecondes à quelques centaines de millisecondes, selon la taille du module et ses dépendances
- **Impact sur la première conversion** : La première conversion utilisant un convertisseur donné sera légèrement plus lente que les conversions ultérieures
- **Cache pour les conversions ultérieures** : Une fois chargé, le convertisseur est mis en cache et les conversions ultérieures n'ont pas cette latence initiale

Cette latence est généralement négligeable par rapport au temps de conversion lui-même, et l'avantage mémoire justifie cette légère pénalité lors de la première utilisation.

## Notes pour les développeurs

### Comment ajouter un nouveau convertisseur au Lazy Loader

Pour ajouter un nouveau convertisseur au système de chargement différé :

1. **Créer le module convertisseur** : Créer un nouveau module conforme à l'interface définie dans [modules.interface.md](../modules.interface.md)
2. **Enregistrer le module** : Ajouter une entrée dans le registre `AVAILABLE_MODULES` du fichier `lazyload.module.js` :
   ```javascript
   'new-converter': {
     path: path.join(MODULES_DIR, 'new-converter.module.js'),
     name: 'new-converter'
   }
   ```
3. **Utiliser le convertisseur** : Le convertisseur est automatiquement disponible via la méthode `run()` du module LazyLoader

Le module LazyLoader chargera automatiquement le nouveau convertisseur lors de sa première utilisation, sans modification supplémentaire nécessaire.

### Extension de la journalisation ou de la sécurité future

Le module LazyLoader est conçu pour être extensible :

- **Journalisation structurée** : La journalisation actuelle peut être étendue pour inclure des formats structurés (JSON, formats standardisés) et l'intégrité des journaux
- **Vérification d'intégrité** : Des points d'extension sont prévus pour l'intégration de vérifications d'intégrité (hash, signatures numériques) des modules chargés
- **Contrôles d'accès renforcés** : La structure permet d'ajouter des contrôles d'accès basés sur des politiques de sécurité
- **Audit et conformité** : La journalisation peut être étendue pour inclure des informations d'audit conformes aux normes ISO 27001/27002, NIST SP 800-53 et GDPR/RGPD

Les extensions futures doivent maintenir la compatibilité avec l'interface existante et les obligations minimales de sécurité V1.

### Références aux normes et bonnes pratiques

Le module LazyLoader est conçu en tenant compte des normes et bonnes pratiques suivantes :

- **ISO 27001** : Systèmes de management de la sécurité de l'information
  - A.9.1.2 : Restrictions sur l'accès aux réseaux et services réseau
  - A.9.4.2 : Contrôle d'accès aux systèmes et applications
  - A.12.4.1 : Journalisation des événements
  - A.12.6.1 : Gestion des vulnérabilités techniques

- **ISO 27002** : Contrôles de sécurité - Lignes directrices pour les contrôles
  - A.9.1.2 : Séparation des réseaux
  - A.9.4.2 : Politiques et procédures de contrôle d'accès
  - A.12.4.1 : Journalisation des événements
  - A.12.6.1 : Gestion des vulnérabilités

- **NIST SP 800-53** : Security and Privacy Controls for Information Systems and Organizations
  - SC-7 : Protection des limites du système
  - SC-39 : Isolation des processus
  - SI-7 : Intégrité des logiciels, firmwares et informations
  - SI-11 : Gestion des erreurs
  - AU-2 : Événements d'audit
  - AU-3 : Contenu des enregistrements d'audit

- **OWASP Top 10** : Top 10 des risques de sécurité des applications web
  - A01:2021 - Broken Access Control : Contrôle d'accès approprié
  - A03:2021 - Injection : Validation et assainissement des entrées
  - A04:2021 - Insecure Design : Gestion robuste des erreurs
  - A06:2021 - Vulnerable Components : Gestion des dépendances

- **GDPR/RGPD** : Règlement général sur la protection des données (UE 2016/679)
  - Art. 30 : Registre des activités de traitement
  - Art. 32 : Sécurité du traitement

Ces références servent de guide pour l'évolution future du module vers des mesures de sécurité renforcées, tout en maintenant les obligations minimales V1 compatibles avec le développement en cours.

## Conformité

Le module LazyLoader respecte strictement :

- L'interface définie dans [modules.interface.md](../modules.interface.md)
- Les obligations minimales de sécurité V1
- Le contrat de retour uniforme `{ success, logs, error, duration }`
- La compatibilité avec tous les wrappers existants

Toute modification du module doit maintenir cette conformité et préserver la rétrocompatibilité avec le code existant.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [downdoc.module.md](./downdoc.module.md) - Exemple de module utilisant le chargement différé
- [PIPELINE.md](../PIPELINE.md) - Spécification du pipeline de conversion
