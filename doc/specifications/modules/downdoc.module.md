# Module Downdoc

## Description

Le module `downdoc` est un wrapper pour la bibliothèque JavaScript downdoc qui convertit des documents AsciiDoc en Markdown. Ce module implémente l'interface définie dans [modules.interface.md](../modules.interface.md) et respecte les obligations de sécurité minimales de la version 1.

## Nom du module

**Identifiant :** `downdoc`  
**Type :** Module de conversion AsciiDoc vers Markdown  
**Bibliothèque sous-jacente :** downdoc (bibliothèque JavaScript native)

## Formats supportés

**Formats d'entrée (`from`) :**
- `asciidoc` : Format AsciiDoc standard

**Formats de sortie (`to`) :**
- `markdown` : Format Markdown standard

**Structure :**
```typescript
supportedFormats: {
  from: ['asciidoc'],
  to: ['markdown']
}
```

## Méthode `run`

### Signature

```typescript
run(inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

### Description du fonctionnement

La méthode `run` effectue la conversion d'un fichier AsciiDoc vers Markdown selon le processus suivant :

#### 1. Lecture sécurisée du fichier d'entrée

- Le module lit le fichier situé à `inputPath` en utilisant l'encodage UTF-8
- La lecture doit être effectuée de manière synchrone ou asynchrone selon l'implémentation
- Toute erreur de lecture (fichier introuvable, permissions insuffisantes, encodage invalide) doit être capturée et transformée en `ModuleResult` avec `success: false`

#### 2. Validation des entrées

- Le module valide que le contenu lu est une chaîne de caractères non vide
- Le module vérifie la taille du fichier (selon les limites configurées)
- Le module vérifie que le type de fichier correspond à AsciiDoc (validation basique par extension ou contenu)

#### 3. Conversion en mémoire via la bibliothèque downdoc

- Le module utilise la bibliothèque downdoc pour convertir le contenu AsciiDoc en Markdown
- La conversion s'effectue entièrement en mémoire, sans création de fichiers temporaires intermédiaires
- Le module peut appliquer des options de conversion si fournies dans le paramètre `options`
- Les options supportées peuvent inclure :
  - Mode de conversion (standard ou BookStack/Parsedown compatible)
  - Extensions spécifiques (parsedown, etc.)

#### 4. Post-traitement du résultat

- Le module applique un nettoyage de base au Markdown généré pour corriger les problèmes courants de la bibliothèque downdoc
- Les corrections incluent notamment :
  - Correction des règles horizontales mal formatées (`- --` → `---`)
  - Suppression des espaces en fin de ligne
  - Normalisation des fins de fichier (un seul saut de ligne final)
- Si le mode BookStack est activé, le module applique un adaptateur supplémentaire pour garantir la compatibilité avec Parsedown

#### 5. Écriture du résultat dans le fichier de sortie

- Le module écrit le contenu Markdown converti dans le fichier situé à `outputPath`
- L'écriture doit être effectuée en UTF-8
- Le répertoire parent du fichier de sortie doit exister (garanti par le pipeline)
- Toute erreur d'écriture doit être capturée et transformée en `ModuleResult` avec `success: false`

#### 6. Retour du résultat

- Le module retourne un objet `ModuleResult` conforme au contrat défini dans [modules.interface.md](../modules.interface.md)
- Le champ `success` doit être `true` si la conversion et l'écriture ont réussi, `false` sinon
- Le champ `logs` doit contenir les logs d'exécution (début, étapes, fin)
- Le champ `error` doit être `null` en cas de succès, ou contenir un message d'erreur descriptif en cas d'échec
- Le champ `duration` doit contenir la durée totale d'exécution en secondes (lecture, conversion, post-traitement, écriture)

### Paramètres

- **`inputPath`** (requis) : Chemin absolu vers le fichier AsciiDoc d'entrée
- **`outputPath`** (requis) : Chemin absolu vers le fichier Markdown de sortie
- **`options`** (optionnel) : Objet contenant les options de conversion
  - `mode` : Mode de conversion (`'default'` ou `'bookstack'`)
  - Autres options spécifiques à la bibliothèque downdoc

### Valeur de retour

La méthode retourne une `Promise` qui se résout avec un objet `ModuleResult` :

```typescript
{
  success: boolean,        // true si conversion réussie, false sinon
  logs: string | string[], // Logs d'exécution
  error: string | null,   // Message d'erreur ou null
  duration: number        // Durée en secondes
}
```

## Sécurité et isolation

### Obligations de sécurité minimales (V1)

Le module respecte les obligations de sécurité minimales définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Validation basique des entrées

- **Vérification de la taille** : Le module valide que le fichier d'entrée ne dépasse pas la limite maximale configurée
- **Vérification du type** : Le module valide que le fichier correspond à un fichier AsciiDoc (par extension `.adoc` ou `.asciidoc`, ou par validation basique du contenu)
- **Rejet immédiat** : Si les validations échouent, le module retourne immédiatement un `ModuleResult` avec `success: false` et un message d'erreur approprié

**Références normatives :** ISO 27001 (A.9.4.2), ISO 27002 (A.9.4.2), NIST SP 800-53 (SI-7), OWASP Top 10 (A03:2021)

#### 2. Isolement léger

- **Aucune interaction directe** : Le module n'interagit pas directement avec le reste du système en dehors des chemins `inputPath` et `outputPath` fournis par le pipeline
- **Exécution dans un contexte isolé** : Le module s'exécute dans un dossier temporaire unique par conversion, fourni par le pipeline
- **Pas de fichiers temporaires** : Le module n'utilise pas de fichiers temporaires supplémentaires, toute la conversion s'effectue en mémoire
- **Pas d'accès réseau** : Le module ne doit pas accéder au réseau pendant l'exécution

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 3. Gestion sécurisée des erreurs

- **Capture exhaustive** : Toutes les exceptions et erreurs doivent être capturées et transformées en `ModuleResult` avec `success: false`
- **Pas de crash global** : Aucune exception non gérée ne doit remonter au pipeline principal
- **Messages d'erreur sécurisés** : Les messages d'erreur ne doivent pas exposer de détails système sensibles (chemins complets, variables d'environnement, stack traces complètes)
- **Cohérence** : En cas d'erreur, le module ne doit pas créer de fichier de sortie, ou doit le supprimer s'il a été créé partiellement

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 4. Journalisation minimale

- **ID de conversion** : Le module doit inclure l'ID de conversion unique dans ses logs (fourni par le pipeline via les options ou le contexte)
- **Horodatage** : Le module doit enregistrer l'horodatage de début et de fin d'exécution
- **Logs d'exécution** : Le module doit produire des logs décrivant les étapes principales (lecture, conversion, écriture)
- **Statut final** : Le module doit inclure le statut final (succès/échec) dans les logs retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Vérification légère de l'intégrité

- **Hash optionnel** : Le module peut exposer un hash ou checksum de son code (optionnel en V1)
- **Documentation des dépendances** : Le module doit documenter ses dépendances (bibliothèque downdoc et sa version)
- **Signalement des modifications** : Le module peut signaler toute modification détectée de son intégrité (optionnel en V1)

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Contraintes d'exécution

- **Isolation** : Le module ne doit pas modifier le fichier d'entrée, ne doit accéder qu'aux fichiers fournis, et ne doit pas créer de fichiers en dehors du répertoire autorisé
- **Performance** : Le module doit respecter les timeouts imposés par le pipeline et libérer les ressources après exécution
- **Sécurité** : Le module ne doit pas exécuter de commandes système non validées et doit valider les chemins de fichiers avant utilisation

## Comportement attendu

### En cas de succès

1. Le fichier de sortie est créé à l'emplacement `outputPath` avec le contenu Markdown converti
2. Le fichier de sortie est valide et conforme au format Markdown
3. Le module retourne un `ModuleResult` avec `success: true`, `error: null`, des logs détaillés et la durée d'exécution

### En cas d'échec

1. Aucun fichier de sortie n'est créé (ou est supprimé s'il a été créé partiellement)
2. Le module retourne un `ModuleResult` avec `success: false`, un message d'erreur descriptif dans `error`, les logs jusqu'au point d'échec, et la durée jusqu'à l'échec

### Types d'erreurs possibles

- **Erreur de lecture** : Fichier d'entrée introuvable, permissions insuffisantes, encodage invalide
- **Erreur de validation** : Fichier trop volumineux, type de fichier invalide, contenu vide
- **Erreur de conversion** : Échec de la bibliothèque downdoc, contenu AsciiDoc invalide
- **Erreur d'écriture** : Permissions insuffisantes, espace disque insuffisant, répertoire parent inexistant

## Notes

### Bibliothèque downdoc

Le module utilise la bibliothèque JavaScript downdoc, qui est une bibliothèque native ne nécessitant pas d'outils externes. Cette caractéristique permet une exécution rapide et légère, sans dépendances système.

### Post-traitement

Le module applique un post-traitement systématique pour corriger les problèmes connus de la bibliothèque downdoc, notamment la conversion incorrecte des règles horizontales. Ce post-traitement garantit une qualité de sortie cohérente.

### Mode BookStack

Le module supporte un mode de conversion spécial pour BookStack, qui applique des adaptations supplémentaires pour garantir la compatibilité avec le parser Parsedown utilisé par BookStack. Ce mode est activé via l'option `mode: 'bookstack'`.

### Performance

La conversion s'effectuant entièrement en mémoire, le module est particulièrement performant pour les fichiers de taille moyenne. Pour les très gros fichiers, la consommation mémoire doit être surveillée.

## Conformité

Ce module respecte strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations de sécurité minimales de la version 1. Toute modification du module doit maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [PIPELINE.md](../PIPELINE.md) - Spécification du pipeline de conversion
