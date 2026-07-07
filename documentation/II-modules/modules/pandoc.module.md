# Module Pandoc

## Description

Le module `pandoc` est un wrapper pour l'outil de conversion universel Pandoc qui convertit des documents entre de nombreux formats. Ce module implémente l'interface définie dans [modules.interface.md](../modules.interface.md) et respecte les obligations minimales de sécurité de la version 1.

## Nom du module

**Identifiant :** `pandoc`  
**Type :** Module de conversion multi-format  
**Outil sous-jacent :** Pandoc (binaire système externe)

## Formats pris en charge

**Formats d'entrée (`from`) :**
- `markdown` : Format Markdown standard
- `asciidoc` : Format AsciiDoc standard
- `html` : Format HTML
- `txt` : Texte brut (interprété comme Markdown par Pandoc)
- `yaml` : Format YAML
- `json` : Format JSON

**Formats de sortie (`to`) :**
- `markdown` : Format Markdown standard
- `asciidoc` : Format AsciiDoc standard
- `html` : Format HTML
- `pdf` : Format PDF
- `txt` : Texte brut
- `yaml` : Format YAML
- `json` : Format JSON

**Structure :**
```typescript
supportedFormats: {
  from: ['markdown', 'asciidoc', 'html', 'txt', 'yaml', 'json'],
  to: ['markdown', 'asciidoc', 'html', 'pdf', 'txt', 'yaml', 'json']
}
```

**Note :** Les conversions autorisées sont définies par une liste blanche stricte. Seules les combinaisons de formats listées dans la liste blanche peuvent être exécutées.

## Méthode `run`

### Signature

```typescript
run(inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

### Description du fonctionnement

La méthode `run` effectue la conversion d'un fichier d'un format vers un autre selon le processus suivant :

#### 1. Validation de l'entrée

- Le module valide que le fichier d'entrée existe et est accessible
- Le module vérifie la taille du fichier (selon les limites configurées)
- Le module vérifie que le type de fichier correspond au format déclaré (validation basique par extension)
- Le module valide que la combinaison de formats (from/to) est autorisée par la liste blanche
- Si les validations échouent, le module retourne immédiatement un `ModuleResult` avec `success: false`

#### 2. Vérification de l'existence du binaire Pandoc

- Le module vérifie que le binaire Pandoc est disponible au chemin configuré
- Le chemin par défaut est `/usr/bin/pandoc` mais peut être remplacé via la variable d'environnement `PANDOC_PATH`
- Si le binaire n'est pas trouvé, le module retourne un `ModuleResult` avec `success: false` et un message d'erreur approprié

#### 3. Construction sécurisée de la commande Pandoc

- Le module construit les arguments Pandoc à partir de la liste blanche des conversions autorisées
- Les arguments sont construits de manière sécurisée :
  - Format source (`-f`) et format de destination (`-t`) proviennent de la liste blanche
  - Chemin de sortie (`-o`) : chemin absolu sécurisé fourni par le pipeline
  - Chemin d'entrée : chemin absolu sécurisé fourni par le pipeline
- Aucun argument utilisateur n'est utilisé directement dans la commande

#### 4. Exécution sécurisée via child_process.spawn

- Le module exécute Pandoc en utilisant `child_process.spawn` (jamais `exec` ou `execSync`)
- Le processus est lancé avec :
  - Répertoire de travail (`cwd`) : répertoire parent du fichier d'entrée (répertoire temporaire isolé)
  - `stdio` : `['ignore', 'pipe', 'pipe']` pour ignorer stdin et capturer stdout/stderr
- Le module capture la sortie standard (stdout) et la sortie d'erreur (stderr) séparément

#### 5. Gestion du délai d'expiration

- Le module applique un délai d'expiration configurable (par défaut : 30 secondes)
- Si le délai est dépassé :
  - Le processus est interrompu avec `SIGTERM`
  - Si le processus ne se termine pas dans les 5 secondes, il est tué avec `SIGKILL`
  - Le module retourne un `ModuleResult` avec `success: false` et un message d'erreur de délai d'expiration

#### 6. Gestion de la sortie

- Pandoc écrit directement dans le fichier de sortie (`outputPath`) via l'argument `-o`
- Le module vérifie que le fichier de sortie a été créé et est valide
- La sortie standard (stdout) est capturée pour les journaux mais n'est généralement pas utilisée pour le contenu (Pandoc écrit dans le fichier)
- La sortie d'erreur (stderr) est capturée pour les journaux et le diagnostic

#### 7. Validation du résultat

- Le module vérifie que le fichier de sortie existe et n'est pas vide
- Le module vérifie le code de sortie du processus Pandoc (0 = succès, autre = échec)
- Si le code de sortie indique un échec, le module retourne un `ModuleResult` avec `success: false` et les messages d'erreur stderr

#### 8. Retour du résultat

- Le module retourne un objet `ModuleResult` conforme au contrat défini dans [modules.interface.md](../modules.interface.md)
- Le champ `success` doit être `true` si la conversion a réussi (code de sortie 0 et fichier de sortie valide), `false` sinon
- Le champ `logs` doit contenir les journaux d'exécution (début, arguments utilisés, sortie stderr de Pandoc, fin)
- Le champ `error` doit être `null` en cas de succès, ou contenir un message d'erreur descriptif en cas d'échec
- Le champ `duration` doit contenir la durée totale d'exécution en secondes (validation, exécution, vérification)

### Paramètres

- **`inputPath`** (obligatoire) : Chemin absolu vers le fichier d'entrée à convertir
- **`outputPath`** (obligatoire) : Chemin absolu vers le fichier de sortie à créer
- **`options`** (optionnel) : Objet contenant les options de conversion
  - `fromFormat` : Format source (obligatoire pour déterminer la conversion)
  - `toFormat` : Format de destination (obligatoire pour déterminer la conversion)
  - `conversionId` : ID de conversion pour les journaux (optionnel)
  - `timeout` : Délai d'expiration en millisecondes (optionnel, par défaut : 30000)

### Valeur de retour

La méthode retourne une `Promise` qui se résout avec un objet `ModuleResult` :

```typescript
{
  success: boolean,        // true si la conversion a réussi, false sinon
  logs: string | string[], // Journaux d'exécution (inclut stderr de Pandoc)
  error: string | null,   // Message d'erreur ou null
  duration: number        // Durée en secondes
}
```

## Sécurité et isolation

### Obligations minimales de sécurité (V1)

Le module respecte les obligations minimales de sécurité définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Validation basique de l'entrée

- **Vérification de la taille** : Le module valide que le fichier d'entrée ne dépasse pas la limite maximale configurée
- **Vérification du type** : Le module valide que le fichier correspond au format déclaré (par extension ou validation basique du contenu)
- **Validation de la liste blanche** : Le module valide que la combinaison de formats (from/to) est autorisée par la liste blanche stricte
- **Rejet immédiat** : Si les validations échouent, le module retourne immédiatement un `ModuleResult` avec `success: false` et un message d'erreur approprié

**Références normatives :** ISO 27001 (A.9.4.2), ISO 27002 (A.9.4.2), NIST SP 800-53 (SI-7), OWASP Top 10 (A03:2021)

#### 2. Isolation légère

- **Aucune interaction directe** : Le module n'interagit pas directement avec le reste du système en dehors des chemins `inputPath` et `outputPath` fournis par le pipeline
- **Exécution dans un contexte isolé** : Le module s'exécute dans un répertoire temporaire unique par conversion, fourni par le pipeline
- **Répertoire de travail isolé** : Le processus Pandoc est lancé avec `cwd` pointant vers le répertoire parent du fichier d'entrée (répertoire temporaire isolé)
- **Aucun accès réseau** : Le module ne doit pas accéder au réseau pendant l'exécution (garanti par l'environnement d'exécution)

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 3. Gestion sécurisée des erreurs

- **Capture exhaustive** : Toutes les exceptions et erreurs doivent être capturées et transformées en `ModuleResult` avec `success: false`
- **Aucun crash global** : Aucune exception non gérée ne doit se propager au pipeline principal
- **Messages d'erreur sécurisés** : Les messages d'erreur ne doivent pas exposer de détails système sensibles (chemins complets, variables d'environnement, traces de pile complètes)
- **Cohérence** : En cas d'erreur, le module ne doit pas créer de fichier de sortie, ou doit le supprimer s'il a été partiellement créé
- **Gestion du délai d'expiration** : Les processus qui dépassent le délai d'expiration sont correctement interrompus (SIGTERM puis SIGKILL si nécessaire)

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 4. Journalisation minimale

- **ID de conversion** : Le module doit inclure l'identifiant unique de conversion dans ses journaux (fourni par le pipeline via options)
- **Horodatage** : Le module doit enregistrer l'horodatage du début et de la fin d'exécution
- **Journaux d'exécution** : Le module doit produire des journaux décrivant les étapes principales (validation, exécution, vérification)
- **Capture stderr** : Les messages d'erreur Pandoc (stderr) sont capturés et inclus dans les journaux
- **Statut final** : Le module doit inclure le statut final (succès/échec) et le code de sortie dans les journaux retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Vérification légère de l'intégrité

- **Vérification du binaire** : Le module vérifie que le binaire Pandoc existe au chemin configuré avant l'exécution
- **Documentation des dépendances** : Le module doit documenter ses dépendances (Pandoc et sa version requise)
- **Signalement des modifications** : Le module peut signaler toute modification détectée de l'intégrité du binaire (optionnel en V1)

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Contraintes d'exécution

- **Isolation** : Le module ne doit pas modifier le fichier d'entrée, doit uniquement accéder aux fichiers fournis, et ne doit pas créer de fichiers en dehors du répertoire autorisé
- **Performance** : Le module doit respecter les délais d'expiration imposés par le pipeline et libérer les ressources après l'exécution
- **Sécurité** : 
  - Le module doit utiliser uniquement `spawn` (jamais `exec` ou `execSync`)
  - Les arguments de commande doivent provenir de la liste blanche stricte
  - Aucun argument utilisateur ne doit être utilisé directement dans la commande
  - Les chemins de fichiers doivent être validés avant utilisation

## Comportement attendu

### En cas de succès

1. Le fichier de sortie est créé à l'emplacement `outputPath` avec le contenu converti
2. Le fichier de sortie est valide et conforme au format de destination
3. Le code de sortie du processus Pandoc est 0
4. Le module retourne un `ModuleResult` avec `success: true`, `error: null`, des journaux détaillés et la durée d'exécution

### En cas d'échec

1. Aucun fichier de sortie n'est créé (ou est supprimé s'il a été partiellement créé)
2. Le module retourne un `ModuleResult` avec `success: false`, un message d'erreur descriptif dans `error`, des journaux jusqu'au point d'échec (incluant stderr de Pandoc), et la durée jusqu'à l'échec

### Types d'erreurs possibles

- **Erreur de validation** : Fichier trop volumineux, type de fichier invalide, combinaison de formats non autorisée
- **Erreur de binaire** : Binaire Pandoc introuvable au chemin configuré
- **Erreur d'exécution** : Échec lors du lancement du processus Pandoc
- **Erreur de délai d'expiration** : Le processus Pandoc dépasse le délai d'expiration configuré
- **Erreur de conversion** : Pandoc retourne un code de sortie non nul (contenu invalide, format non pris en charge, etc.)
- **Erreur de fichier de sortie** : Le fichier de sortie n'est pas créé ou est invalide après l'exécution

## Notes

### Outil Pandoc

Le module utilise l'outil de conversion universel Pandoc, qui est un binaire système externe. Cette caractéristique nécessite :

- **Installation système** : Pandoc doit être installé sur le système et accessible via le chemin configuré
- **Dépendance externe** : Le module dépend de la disponibilité et de la version de Pandoc installé
- **Performance** : Pandoc est particulièrement performant pour les conversions complexes et les documents volumineux
- **Support multi-format** : Pandoc prend en charge une large gamme de formats de documents

### Liste blanche des conversions

Le module utilise une liste blanche stricte pour définir les conversions autorisées. Cette approche garantit :

- **Sécurité** : Seules les combinaisons de formats validées peuvent être exécutées
- **Contrôle** : Le pipeline contrôle précisément quelles conversions sont autorisées
- **Maintenabilité** : L'ajout de nouvelles conversions nécessite une modification explicite de la liste blanche

### Exécution sécurisée

Le module utilise `child_process.spawn` pour exécuter Pandoc de manière sécurisée :

- **Isolation** : Le processus est lancé dans un répertoire de travail isolé
- **Capture de sortie** : stdout et stderr sont capturés séparément pour les journaux
- **Délai d'expiration** : Un délai d'expiration est appliqué pour éviter les conversions bloquantes
- **Interruption correcte** : Les processus qui dépassent le délai d'expiration sont correctement interrompus

### Performance

Étant donné que Pandoc est un outil externe, la conversion implique :

- **Latence de démarrage** : Le lancement du processus Pandoc introduit une latence initiale
- **Performance** : Pandoc est optimisé pour les conversions complexes et volumineuses
- **Ressources système** : Pandoc utilise les ressources système (CPU, mémoire) pendant l'exécution

## Conformité

Ce module respecte strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations minimales de sécurité de la version 1. Toute modification du module doit maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [PIPELINE.md](../PIPELINE.md) - Spécification du pipeline de conversion
- [Pandoc Documentation](https://pandoc.org/) - Documentation officielle de Pandoc
