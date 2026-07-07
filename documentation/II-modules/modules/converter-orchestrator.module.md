# Module Orchestrateur de conversion

## Description

Le module `converter-orchestrator` est un orchestrateur central qui gère l'exécution de tous les convertisseurs du pipeline selon leurs capacités et les formats pris en charge. Ce module identifie automatiquement le convertisseur approprié pour chaque conversion, utilise le chargement différé pour optimiser la consommation mémoire, et standardise les retours pour tous les convertisseurs.

## Nom du module

**Identifiant :** `converter-orchestrator`  
**Type :** Module orchestrateur central  
**Rôle :** Gestion et coordination de tous les convertisseurs du pipeline

## Objectif

Permettre l'exécution de tous les convertisseurs (downdoc, pandoc, text2markdown, panwriter, docverter, etc.) en respectant uniquement les formats/langages fournis dans les options de conversion, tout en maintenant la sécurité, l'isolation et la structure existantes.

## Formats pris en charge

Le module orchestrateur ne prend pas directement en charge les formats, mais coordonne les conversions selon les formats pris en charge par chaque convertisseur enregistré :

- **downdoc :** `asciidoc` → `markdown`
- **pandoc :** `markdown`, `asciidoc`, `html`, `txt`, `yaml`, `json` → `markdown`, `asciidoc`, `html`, `pdf`, `txt`, `yaml`, `json`
- **text2markdown :** `txt` → `markdown`
- **panwriter :** `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex` → `markdown`, `asciidoc`, `html`, `docx`, `odt`, `rtf`, `latex`, `tex`
- **docverter :** `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif` → `rtf`, `pdf`, `html`, `txt`, `markdown`, `docx`, `xlsx`, `pptx`, `odt`, `ods`, `odp`, `png`, `jpg`, `jpeg`, `gif`

**Note :** Seules les conversions vers les formats/langages définis dans les options de conversion sont disponibles pour cette version. D'autres formats/langages pourront être ajoutés dans les versions futures.

## Méthode principale : `executeConversion`

### Signature

```typescript
executeConversion(inputPath: string, outputPath: string, fromFormat: string, toFormat: string, options?: Object): Promise<ModuleResult>
```

### Description du fonctionnement

La méthode `executeConversion` orchestre l'exécution d'une conversion selon le processus suivant :

#### 1. Identification du convertisseur approprié

- Le module parcourt tous les convertisseurs enregistrés dans le registre
- Pour chaque convertisseur, il vérifie si `fromFormat` et `toFormat` sont pris en charge
- Le premier convertisseur qui prend en charge la conversion demandée est sélectionné
- Si aucun convertisseur ne prend en charge la conversion, le module retourne un `ModuleResult` avec `success: false`

#### 2. Exécution selon le type de convertisseur

Le module exécute la conversion selon le type d'exécution du convertisseur :

- **Chargement différé :** Pour les modules conformes à l'interface `modules.interface.md`
  - Utilise le module de chargement différé pour charger et exécuter le convertisseur
  - Les modules sont chargés uniquement lorsqu'ils sont utilisés
  - Réduction de la consommation mémoire

- **Commande :** Pour les outils externes (ex. Pandoc)
  - Utilise l'exécution sécurisée de commandes via `child_process.spawn`
  - Gestion des délais d'expiration et capture des erreurs
  - Validation des chemins et des arguments

#### 3. Standardisation du résultat

- Le module fusionne les journaux de l'orchestrateur avec les journaux du convertisseur
- Le résultat est standardisé pour respecter l'interface `ModuleResult` :
  - `success` : Booléen indiquant le succès ou l'échec
  - `logs` : Tableau ou chaîne contenant tous les journaux
  - `error` : Message d'erreur ou `null` en cas de succès
  - `duration` : Durée totale en secondes

#### 4. Gestion des erreurs

- Toutes les erreurs sont capturées et transformées en `ModuleResult` avec `success: false`
- Les messages d'erreur sont sécurisés (aucun détail système sensible)
- Aucune exception non gérée ne se propage au pipeline principal

### Paramètres

- **`inputPath`** (obligatoire) : Chemin absolu vers le fichier d'entrée à convertir
- **`outputPath`** (obligatoire) : Chemin absolu vers le fichier de sortie à créer
- **`fromFormat`** (obligatoire) : Format source (markdown, asciidoc, html, txt, etc.)
- **`toFormat`** (obligatoire) : Format de destination (markdown, asciidoc, html, pdf, etc.)
- **`options`** (optionnel) : Objet contenant les options de conversion
  - `conversionId` : ID de conversion pour les journaux (optionnel)
  - `timeout` : Délai d'expiration en millisecondes (optionnel, valeur par défaut selon le convertisseur)
  - Autres options spécifiques au convertisseur sélectionné

### Valeur de retour

La méthode retourne une `Promise` qui se résout avec un objet `ModuleResult` :

```typescript
{
  success: boolean,        // true si la conversion a réussi, false sinon
  logs: string | string[], // Journaux d'exécution (orchestrateur + convertisseur)
  error: string | null,   // Message d'erreur ou null
  duration: number        // Durée en secondes
}
```

## Registre des convertisseurs

Le module maintient un registre de tous les convertisseurs disponibles avec leurs configurations :

- **Nom du convertisseur :** Identifiant unique
- **Formats pris en charge :** Formats d'entrée (`from`) et de sortie (`to`)
- **Type d'exécution :** `lazy-load` ou `command`
- **Configuration :** Chemin du module (pour lazy-load) ou chemin du binaire (pour command)

### Ajout d'un nouveau convertisseur

Pour ajouter un nouveau convertisseur au registre :

1. Créer le module convertisseur conforme à l'interface `modules.interface.md`
2. Ajouter une entrée dans `CONVERTER_REGISTRY` avec :
   - `name` : Nom du convertisseur
   - `supportedFormats` : Formats pris en charge (from/to)
   - `executionType` : `lazy-load` ou `command`
   - `modulePath` ou `binaryPath` selon le type

Aucune modification du code existant n'est nécessaire, seul l'ajout d'une entrée au registre suffit.

## Communication avec l'orchestrateur linéaire

Le module `converter-orchestrator` communique avec l'`orchestrateur linéaire` pour éviter la surcharge du système :

### Gestion du contrôle de charge

- **Appels externes :** Pour les appels directs (non issus de l'orchestrateur linéaire), le converter-orchestrator gère le contrôle de charge
- **Appels internes :** Pour les appels depuis l'orchestrateur linéaire (marqués avec `_internal: true`), le contrôle de charge est géré par l'orchestrateur linéaire
- **Pas de double comptage :** Les appels internes n'acquièrent pas de slot de concurrence séparé
- **Suivi unifié :** Les succès et échecs sont enregistrés uniquement pour les appels externes

### Mécanismes de protection

1. **Détection du type d'appel :** Le module détecte si l'appel est interne ou externe via l'option `_internal`
2. **Contrôle de charge conditionnel :** Le contrôle de charge est appliqué uniquement pour les appels externes
3. **Libération garantie :** Les slots de concurrence sont toujours libérés dans un bloc `finally`

## Sécurité et isolation

### Obligations minimales de sécurité (V1)

Le module respecte les obligations minimales de sécurité définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Validation des formats

- **Vérification des formats :** Le module valide que les formats demandés sont pris en charge par au moins un convertisseur
- **Rejet immédiat :** Si aucun convertisseur ne prend en charge la conversion, le module retourne immédiatement un `ModuleResult` avec `success: false`

**Références normatives :** ISO 27001 (A.9.4.2), ISO 27002 (A.9.4.2), NIST SP 800-53 (SI-7), OWASP Top 10 (A03:2021)

#### 2. Isolation légère

- **Aucune interaction directe :** Le module n'interagit pas directement avec le reste du système en dehors des chemins fournis
- **Délégation aux convertisseurs :** L'isolation est assurée par chaque convertisseur individuel selon ses obligations de sécurité
- **Aucun accès réseau :** Le module ne doit pas accéder au réseau pendant l'exécution (sauf si un convertisseur l'exige, auquel cas c'est documenté)

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 3. Gestion sécurisée des erreurs

- **Capture exhaustive :** Toutes les exceptions et erreurs sont capturées et transformées en `ModuleResult` avec `success: false`
- **Aucun crash global :** Aucune exception non gérée ne se propage au pipeline principal
- **Messages d'erreur sécurisés :** Les messages d'erreur ne contiennent pas de détails système sensibles

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 4. Journalisation minimale

- **ID de conversion :** Le module inclut l'identifiant unique de conversion dans ses journaux
- **Horodatage :** Le module enregistre l'horodatage de début et de fin d'exécution
- **Journaux d'exécution :** Le module produit des journaux décrivant les étapes principales (identification, exécution, résultat)
- **Statut final :** Le module inclut le statut final (succès/échec) dans les journaux retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Vérification légère de l'intégrité

- **Documentation des convertisseurs :** Le module documente tous les convertisseurs enregistrés et leurs formats pris en charge
- **Signalement des modifications :** Le module peut signaler toute modification détectée de l'intégrité des convertisseurs (optionnel en V1)

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Contraintes d'exécution

- **Isolation :** Le module ne modifie pas les wrappers existants, il les orchestre uniquement
- **Performance :** Le module utilise le chargement différé pour optimiser la consommation mémoire
- **Sécurité :** Le module délègue la sécurité aux convertisseurs individuels selon leurs obligations

## Comportement attendu

### En cas de succès

1. Le convertisseur approprié est identifié et exécuté
2. Le fichier de sortie est créé à `outputPath` avec le contenu converti
3. Le module retourne un `ModuleResult` avec `success: true`, `error: null`, des journaux détaillés et la durée d'exécution

### En cas d'échec

1. Si aucun convertisseur ne prend en charge la conversion, le module retourne immédiatement un `ModuleResult` avec `success: false`
2. Si le convertisseur échoue, l'erreur est capturée et transformée en `ModuleResult` avec `success: false`
3. Le module retourne un `ModuleResult` avec `success: false`, un message d'erreur descriptif dans `error`, des journaux jusqu'au point d'échec, et la durée jusqu'à l'échec

### Types d'erreurs possibles

- **Erreur de format non pris en charge :** Aucun convertisseur ne prend en charge la conversion demandée
- **Erreur de convertisseur :** Le convertisseur sélectionné a échoué (erreur capturée et standardisée)
- **Erreur d'orchestration :** Erreur lors de l'identification ou de l'exécution du convertisseur

## Notes

### Préservation de l'existant

Le module orchestrateur ne modifie aucun wrapper existant :

- **Aucune modification des wrappers :** Les wrappers existants (downdoc, pandoc, etc.) restent inchangés
- **Interface standardisée :** Le module standardise uniquement les retours, sans modifier la logique interne des convertisseurs
- **Chemins inchangés :** Les chemins et interfaces des convertisseurs existants restent inchangés

### Chargement différé

Le module utilise le chargement différé pour optimiser la consommation mémoire :

- **Chargement différé :** Les modules sont chargés uniquement lorsqu'ils sont utilisés
- **Cache :** Les modules chargés sont mis en cache pour éviter les rechargements
- **Réduction mémoire :** Seuls les convertisseurs réellement utilisés sont chargés en mémoire

### Extensibilité

Le module est conçu pour être facilement extensible :

- **Ajout simple :** L'ajout d'un nouveau convertisseur ne nécessite que l'ajout d'une entrée au registre
- **Aucune modification de code :** Aucune modification du code existant n'est nécessaire pour ajouter un nouveau convertisseur
- **Documentation :** Chaque convertisseur doit avoir sa documentation dans un fichier `.module.md` associé

### Limitations de formats

**Important :** Seules les conversions vers les formats/langages définis dans les options de conversion sont disponibles pour cette version. D'autres formats/langages pourront être ajoutés dans les versions futures.

## Conformité

Ce module respecte strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations minimales de sécurité de la version 1. Toute modification du module doit maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [lazyload.module.md](./lazyload.module.md) - Module de chargement différé
- [PIPELINE.md](../PIPELINE.md) - Spécification du pipeline de conversion
- [downdoc.module.md](./downdoc.module.md) - Module Downdoc
- [pandoc.module.md](./pandoc.module.md) - Module Pandoc
- [text2markdown.module.md](./text2markdown.module.md) - Module Text2Markdown
- [panwriter.module.md](./panwriter.module.md) - Module PanWriter
- [docverter.module.md](./docverter.module.md) - Module Docverter
