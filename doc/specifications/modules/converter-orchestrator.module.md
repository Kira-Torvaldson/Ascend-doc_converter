# Module Converter Orchestrator

## Description

Le module `converter-orchestrator` est un orchestrateur central qui gère l'exécution de tous les converters du pipeline selon leurs capacités et les formats supportés. Ce module identifie automatiquement le converter approprié pour chaque conversion, utilise le lazy loading pour optimiser la consommation mémoire, et standardise les retours pour tous les converters.

## Nom du module

**Identifiant :** `converter-orchestrator`  
**Type :** Module orchestrateur central  
**Rôle :** Gestion et coordination de tous les converters du pipeline

## Objectif

Permettre l'exécution de tous les converters (downdoc, pandoc, text2markdown, panwriter, docverter, etc.) en respectant uniquement les formats/langages prévus dans les options de conversion, tout en maintenant la sécurité, l'isolation et la structure existantes.

## Formats supportés

Le module orchestrateur ne supporte pas directement de formats, mais coordonne les conversions selon les formats supportés par chaque converter enregistré :

- **downdoc** : `asciidoc` → `markdown`
- **pandoc** : `markdown`, `asciidoc`, `html`, `txt`, `yaml`, `json` → `markdown`, `asciidoc`, `html`, `pdf`, `txt`, `yaml`, `json`
- **text2markdown** : `txt` → `markdown`
- **panwriter** : `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex` → `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`
- **docverter** : `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif` → `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`

**Note :** Seules les conversions vers les formats/langages définis dans les options de conversion sont disponibles pour cette version. D'autres formats/langages pourront être ajoutés dans les versions futures.

## Méthode principale : `executeConversion`

### Signature

```typescript
executeConversion(inputPath: string, outputPath: string, fromFormat: string, toFormat: string, options?: Object): Promise<ModuleResult>
```

### Description du fonctionnement

La méthode `executeConversion` orchestre l'exécution d'une conversion selon le processus suivant :

#### 1. Identification du converter approprié

- Le module parcourt tous les converters enregistrés dans le registre
- Pour chaque converter, il vérifie si les formats `fromFormat` et `toFormat` sont supportés
- Le premier converter qui supporte la conversion demandée est sélectionné
- Si aucun converter ne supporte la conversion, le module retourne un `ModuleResult` avec `success: false`

#### 2. Exécution selon le type de converter

Le module exécute la conversion selon le type d'exécution du converter :

- **Lazy loading** : Pour les modules conformes à l'interface `modules.interface.md`
  - Utilise le module de lazy loading pour charger et exécuter le converter
  - Les modules sont chargés uniquement lorsqu'ils sont utilisés
  - Réduction de la consommation mémoire

- **Commande** : Pour les outils externes (ex: Pandoc)
  - Utilise l'exécution de commande sécurisée via `child_process.spawn`
  - Gestion des timeouts et capture des erreurs
  - Validation des chemins et des arguments

#### 3. Standardisation du résultat

- Le module fusionne les logs de l'orchestrateur avec les logs du converter
- Le résultat est standardisé pour respecter l'interface `ModuleResult` :
  - `success` : Booléen indiquant le succès ou l'échec
  - `logs` : Tableau ou chaîne de caractères contenant tous les logs
  - `error` : Message d'erreur ou `null` en cas de succès
  - `duration` : Durée totale en secondes

#### 4. Gestion des erreurs

- Toutes les erreurs sont capturées et transformées en `ModuleResult` avec `success: false`
- Les messages d'erreur sont sécurisés (pas de détails système sensibles)
- Aucune exception non gérée ne remonte au pipeline principal

### Paramètres

- **`inputPath`** (requis) : Chemin absolu vers le fichier d'entrée à convertir
- **`outputPath`** (requis) : Chemin absolu vers le fichier de sortie à créer
- **`fromFormat`** (requis) : Format source (markdown, asciidoc, html, txt, etc.)
- **`toFormat`** (requis) : Format de destination (markdown, asciidoc, html, pdf, etc.)
- **`options`** (optionnel) : Objet contenant les options de conversion
  - `conversionId` : ID de conversion pour les logs (optionnel)
  - `timeout` : Timeout en millisecondes (optionnel, défaut selon le converter)
  - Autres options spécifiques au converter sélectionné

### Valeur de retour

La méthode retourne une `Promise` qui se résout avec un objet `ModuleResult` :

```typescript
{
  success: boolean,        // true si conversion réussie, false sinon
  logs: string | string[], // Logs d'exécution (orchestrateur + converter)
  error: string | null,   // Message d'erreur ou null
  duration: number        // Durée en secondes
}
```

## Registre des converters

Le module maintient un registre de tous les converters disponibles avec leurs configurations :

- **Nom du converter** : Identifiant unique
- **Formats supportés** : Formats d'entrée (`from`) et de sortie (`to`)
- **Type d'exécution** : `lazy-load` ou `command`
- **Configuration** : Chemin du module (pour lazy-load) ou chemin du binaire (pour command)

### Ajout d'un nouveau converter

Pour ajouter un nouveau converter au registre :

1. Créer le module du converter conforme à l'interface `modules.interface.md`
2. Ajouter une entrée dans `CONVERTER_REGISTRY` avec :
   - `name` : Nom du converter
   - `supportedFormats` : Formats supportés (from/to)
   - `executionType` : `lazy-load` ou `command`
   - `modulePath` ou `binaryPath` selon le type

Aucune modification du code existant n'est nécessaire, seule l'ajout d'une entrée dans le registre suffit.

## Sécurité et isolation

### Obligations de sécurité minimales (V1)

Le module respecte les obligations de sécurité minimales définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Validation des formats

- **Vérification des formats** : Le module valide que les formats demandés sont supportés par au moins un converter
- **Rejet immédiat** : Si aucun converter ne supporte la conversion, le module retourne immédiatement un `ModuleResult` avec `success: false`

**Références normatives :** ISO 27001 (A.9.4.2), ISO 27002 (A.9.4.2), NIST SP 800-53 (SI-7), OWASP Top 10 (A03:2021)

#### 2. Isolement léger

- **Aucune interaction directe** : Le module n'interagit pas directement avec le reste du système en dehors des chemins fournis
- **Délégation aux converters** : L'isolation est assurée par chaque converter individuel selon ses obligations de sécurité
- **Pas d'accès réseau** : Le module ne doit pas accéder au réseau pendant l'exécution (sauf si un converter le nécessite, auquel cas cela est documenté)

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 3. Gestion sécurisée des erreurs

- **Capture exhaustive** : Toutes les exceptions et erreurs sont capturées et transformées en `ModuleResult` avec `success: false`
- **Pas de crash global** : Aucune exception non gérée ne remonte au pipeline principal
- **Messages d'erreur sécurisés** : Les messages d'erreur ne contiennent pas de détails système sensibles

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 4. Journalisation minimale

- **ID de conversion** : Le module inclut l'ID de conversion unique dans ses logs
- **Horodatage** : Le module enregistre l'horodatage de début et de fin d'exécution
- **Logs d'exécution** : Le module produit des logs décrivant les étapes principales (identification, exécution, résultat)
- **Statut final** : Le module inclut le statut final (succès/échec) dans les logs retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Vérification légère de l'intégrité

- **Documentation des converters** : Le module documente tous les converters enregistrés et leurs formats supportés
- **Signalement des modifications** : Le module peut signaler toute modification détectée de l'intégrité des converters (optionnel en V1)

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Contraintes d'exécution

- **Isolation** : Le module ne modifie pas les wrappers existants, il les orchestre uniquement
- **Performance** : Le module utilise le lazy loading pour optimiser la consommation mémoire
- **Sécurité** : Le module délègue la sécurité aux converters individuels selon leurs obligations

## Comportement attendu

### En cas de succès

1. Le converter approprié est identifié et exécuté
2. Le fichier de sortie est créé à l'emplacement `outputPath` avec le contenu converti
3. Le module retourne un `ModuleResult` avec `success: true`, `error: null`, des logs détaillés et la durée d'exécution

### En cas d'échec

1. Si aucun converter ne supporte la conversion, le module retourne immédiatement un `ModuleResult` avec `success: false`
2. Si le converter échoue, l'erreur est capturée et transformée en `ModuleResult` avec `success: false`
3. Le module retourne un `ModuleResult` avec `success: false`, un message d'erreur descriptif dans `error`, les logs jusqu'au point d'échec, et la durée jusqu'à l'échec

### Types d'erreurs possibles

- **Erreur de format non supporté** : Aucun converter ne supporte la conversion demandée
- **Erreur de converter** : Le converter sélectionné a échoué (erreur capturée et standardisée)
- **Erreur d'orchestration** : Erreur lors de l'identification ou de l'exécution du converter

## Notes

### Préservation de l'existant

Le module orchestrateur ne modifie aucun wrapper existant :

- **Aucune modification des wrappers** : Les wrappers existants (downdoc, pandoc, etc.) restent inchangés
- **Interface standardisée** : Le module standardise uniquement les retours, sans modifier la logique interne des converters
- **Chemins inchangés** : Les chemins et interfaces des converters existants restent inchangés

### Lazy loading

Le module utilise le lazy loading pour optimiser la consommation mémoire :

- **Chargement différé** : Les modules sont chargés uniquement lorsqu'ils sont utilisés
- **Cache** : Les modules chargés sont mis en cache pour éviter les rechargements
- **Réduction mémoire** : Seuls les converters effectivement utilisés sont chargés en mémoire

### Extensibilité

Le module est conçu pour être facilement extensible :

- **Ajout simple** : L'ajout d'un nouveau converter nécessite uniquement l'ajout d'une entrée dans le registre
- **Pas de modification du code** : Aucune modification du code existant n'est nécessaire pour ajouter un nouveau converter
- **Documentation** : Chaque converter doit avoir sa documentation dans un fichier `.module.md` associé

### Limitations de formats

**Important :** Seules les conversions vers les formats/langages définis dans les options de conversion sont disponibles pour cette version. D'autres formats/langages pourront être ajoutés dans les versions futures.

## Conformité

Ce module respecte strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations de sécurité minimales de la version 1. Toute modification du module doit maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [lazyload.module.md](./lazyload.module.md) - Module de lazy loading
- [PIPELINE.md](../PIPELINE.md) - Spécification du pipeline de conversion
- [downdoc.module.md](./downdoc.module.md) - Module Downdoc
- [pandoc.module.md](./pandoc.module.md) - Module Pandoc
- [text2markdown.module.md](./text2markdown.module.md) - Module Text2Markdown
- [panwriter.module.md](./panwriter.module.md) - Module PanWriter
- [docverter.module.md](./docverter.module.md) - Module Docverter
