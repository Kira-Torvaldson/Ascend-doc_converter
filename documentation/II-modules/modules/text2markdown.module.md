# Module Text2Markdown

## Description

Le module `text2markdown` est un wrapper pour la conversion de texte brut en Markdown avec détection automatique de structure. Ce module implémente l'interface définie dans [modules.interface.md](../modules.interface.md) et respecte les obligations minimales de sécurité de la version 1.

## Nom du module

**Identifiant :** `text2markdown`  
**Type :** Module de conversion texte brut vers Markdown  
**Bibliothèque sous-jacente :** Conversion JavaScript native (détection automatique)

## Formats pris en charge

**Formats d'entrée (`from`) :**
- `txt` : Texte brut

**Formats de sortie (`to`) :**
- `markdown` : Format Markdown standard

**Structure :**
```typescript
supportedFormats: {
  from: ['txt'],
  to: ['markdown']
}
```

## Méthode `run`

### Signature

```typescript
run(inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

### Description du fonctionnement

La méthode `run` effectue la conversion d'un fichier texte brut en Markdown selon le processus suivant :

#### 1. Lecture sécurisée du fichier d'entrée

- Le module lit le fichier situé à `inputPath` en encodage UTF-8
- La lecture doit être effectuée de manière synchrone ou asynchrone selon l'implémentation
- Toute erreur de lecture (fichier introuvable, permissions insuffisantes, encodage invalide) doit être capturée et transformée en `ModuleResult` avec `success: false`

#### 2. Validation de l'entrée

- Le module valide que le contenu lu est une chaîne non vide
- Le module vérifie la taille du fichier (selon les limites configurées)
- Le module vérifie que le type de fichier correspond au texte brut (validation basique par extension ou contenu)

#### 3. Conversion en mémoire avec détection automatique

- Le module analyse le contenu texte ligne par ligne pour détecter automatiquement les structures
- Les structures détectées incluent :
  - **Titres** : Lignes en majuscules, lignes suivies de séparateurs (`===` ou `---`)
  - **Listes** : Lignes commençant par des marqueurs (`-`, `*`, `+`, `1.`, `2.`, etc.)
  - **Blocs de code** : Lignes indentées avec 4 espaces ou une tabulation
  - **Séparateurs horizontaux** : Lignes contenant uniquement `---`, `***` ou `___`
  - **Liens** : URLs (http://, https://, www.)
  - **Emails** : Adresses email détectées automatiquement
- La conversion s'effectue entièrement en mémoire, sans créer de fichiers temporaires intermédiaires
- Le module applique des règles de formatage pour garantir un Markdown valide

#### 4. Post-traitement du résultat

- Le module applique un nettoyage basique au Markdown généré :
  - Normalisation des lignes vides multiples (maximum 2 lignes vides consécutives)
  - Normalisation des fins de fichier (une seule nouvelle ligne finale)
  - Fermeture des listes et blocs de code ouverts
- Le module garantit que le résultat est un Markdown valide et bien formaté

#### 5. Écriture du résultat dans le fichier de sortie

- Le module écrit le contenu Markdown converti dans le fichier situé à `outputPath`
- L'écriture doit être effectuée en UTF-8
- Le répertoire parent du fichier de sortie doit exister (garanti par le pipeline)
- Toute erreur d'écriture doit être capturée et transformée en `ModuleResult` avec `success: false`

#### 6. Retour du résultat

- Le module retourne un objet `ModuleResult` conforme au contrat défini dans [modules.interface.md](../modules.interface.md)
- Le champ `success` doit être `true` si la conversion et l'écriture ont réussi, `false` sinon
- Le champ `logs` doit contenir les journaux d'exécution (début, étapes, structures détectées, fin)
- Le champ `error` doit être `null` en cas de succès, ou contenir un message d'erreur descriptif en cas d'échec
- Le champ `duration` doit contenir la durée totale d'exécution en secondes (lecture, conversion, post-traitement, écriture)

### Paramètres

- **`inputPath`** (obligatoire) : Chemin absolu vers le fichier texte brut d'entrée
- **`outputPath`** (obligatoire) : Chemin absolu vers le fichier Markdown de sortie
- **`options`** (optionnel) : Objet contenant les options de conversion
  - `conversionId` : ID de conversion pour les journaux (optionnel)
  - Autres options spécifiques au module (à définir selon les besoins futurs)

### Valeur de retour

La méthode retourne une `Promise` qui se résout avec un objet `ModuleResult` :

```typescript
{
  success: boolean,        // true si la conversion a réussi, false sinon
  logs: string | string[], // Journaux d'exécution
  error: string | null,   // Message d'erreur ou null
  duration: number        // Durée en secondes
}
```

## Sécurité et isolation

### Obligations minimales de sécurité (V1)

Le module respecte les obligations minimales de sécurité définies dans [modules.interface.md](../modules.interface.md) :

#### 1. Validation basique de l'entrée

- **Vérification de la taille** : Le module valide que le fichier d'entrée ne dépasse pas la limite maximale configurée
- **Vérification du type** : Le module valide que le fichier correspond à un fichier texte brut (par extension `.txt` ou validation basique du contenu)
- **Rejet immédiat** : Si les validations échouent, le module retourne immédiatement un `ModuleResult` avec `success: false` et un message d'erreur approprié

**Références normatives :** ISO 27001 (A.9.4.2), ISO 27002 (A.9.4.2), NIST SP 800-53 (SI-7), OWASP Top 10 (A03:2021)

#### 2. Isolation légère

- **Aucune interaction directe** : Le module n'interagit pas directement avec le reste du système en dehors des chemins `inputPath` et `outputPath` fournis par le pipeline
- **Exécution dans un contexte isolé** : Le module s'exécute dans un répertoire temporaire unique par conversion, fourni par le pipeline
- **Aucun fichier temporaire** : Le module n'utilise pas de fichiers temporaires supplémentaires, toute la conversion s'effectue en mémoire
- **Aucun accès réseau** : Le module ne doit pas accéder au réseau pendant l'exécution

**Références normatives :** ISO 27001 (A.9.1.2), ISO 27002 (A.9.1.2), NIST SP 800-53 (SC-7, SC-39), OWASP Top 10 (A01:2021)

#### 3. Gestion sécurisée des erreurs

- **Capture exhaustive** : Toutes les exceptions et erreurs doivent être capturées et transformées en `ModuleResult` avec `success: false`
- **Aucun crash global** : Aucune exception non gérée ne doit se propager au pipeline principal
- **Messages d'erreur sécurisés** : Les messages d'erreur ne doivent pas exposer de détails système sensibles (chemins complets, variables d'environnement, traces de pile complètes)
- **Cohérence** : En cas d'erreur, le module ne doit pas créer de fichier de sortie, ou doit le supprimer s'il a été partiellement créé

**Références normatives :** ISO 27001 (A.12.6.1), ISO 27002 (A.12.6.1), NIST SP 800-53 (SI-11), OWASP Top 10 (A04:2021)

#### 4. Journalisation minimale

- **ID de conversion** : Le module doit inclure l'identifiant unique de conversion dans ses journaux (fourni par le pipeline via options ou contexte)
- **Horodatage** : Le module doit enregistrer l'horodatage du début et de la fin d'exécution
- **Journaux d'exécution** : Le module doit produire des journaux décrivant les étapes principales (lecture, conversion, structures détectées, écriture)
- **Statut final** : Le module doit inclure le statut final (succès/échec) dans les journaux retournés

**Références normatives :** ISO 27001 (A.12.4.1), ISO 27002 (A.12.4.1), NIST SP 800-53 (AU-2, AU-3), GDPR/RGPD (Art. 30, 32)

#### 5. Vérification légère de l'intégrité

- **Hash optionnel** : Le module peut exposer un hash ou une somme de contrôle de son code (optionnel en V1)
- **Documentation des dépendances** : Le module doit documenter ses dépendances (aucune dépendance externe, conversion JavaScript native)
- **Signalement des modifications** : Le module peut signaler toute modification détectée de son intégrité (optionnel en V1)

**Références normatives :** ISO 27001 (A.12.2.1), ISO 27002 (A.12.2.1), NIST SP 800-53 (SI-7, SA-12), OWASP Top 10 (A06:2021)

### Contraintes d'exécution

- **Isolation** : Le module ne doit pas modifier le fichier d'entrée, doit uniquement accéder aux fichiers fournis, et ne doit pas créer de fichiers en dehors du répertoire autorisé
- **Performance** : Le module doit respecter les délais d'expiration imposés par le pipeline et libérer les ressources après l'exécution
- **Sécurité** : Le module ne doit pas exécuter de commandes système et doit valider les chemins de fichiers avant utilisation

## Comportement attendu

### En cas de succès

1. Le fichier de sortie est créé à l'emplacement `outputPath` avec le contenu Markdown converti
2. Le fichier de sortie est valide et conforme au format Markdown
3. Le module retourne un `ModuleResult` avec `success: true`, `error: null`, des journaux détaillés et la durée d'exécution

### En cas d'échec

1. Aucun fichier de sortie n'est créé (ou est supprimé s'il a été partiellement créé)
2. Le module retourne un `ModuleResult` avec `success: false`, un message d'erreur descriptif dans `error`, des journaux jusqu'au point d'échec, et la durée jusqu'à l'échec

### Types d'erreurs possibles

- **Erreur de lecture** : Fichier d'entrée introuvable, permissions insuffisantes, encodage invalide
- **Erreur de validation** : Fichier trop volumineux, type de fichier invalide, contenu vide
- **Erreur de conversion** : Échec lors de la détection de structure ou de la conversion
- **Erreur d'écriture** : Permissions insuffisantes, espace disque insuffisant, répertoire parent inexistant

## Notes

### Détection automatique

Le module utilise une détection automatique intelligente pour identifier les structures dans le texte brut :

- **Titres** : Détection basée sur les majuscules, les séparateurs et les motifs courants
- **Listes** : Détection des marqueurs de liste (ordonnées et non ordonnées)
- **Blocs de code** : Détection basée sur l'indentation (4 espaces ou tabulation)
- **Liens et emails** : Détection par expressions régulières

Cette approche permet de convertir du texte brut non structuré en Markdown valide sans intervention manuelle.

### Performance

Étant donné que la conversion s'effectue entièrement en mémoire, le module est particulièrement performant pour les fichiers de taille moyenne. Pour les très gros fichiers, la consommation mémoire doit être surveillée.

### Limitations

- La détection automatique peut ne pas être parfaite pour tous les formats de texte brut
- Les structures complexes peuvent nécessiter une post-édition manuelle
- Le module ne prend en charge que la conversion unidirectionnelle (txt → markdown)

## Conformité

Ce module respecte strictement l'interface définie dans [modules.interface.md](../modules.interface.md) et les obligations minimales de sécurité de la version 1. Toute modification du module doit maintenir cette conformité.

## Références

- [modules.interface.md](../modules.interface.md) - Contrat d'interface des modules
- [PIPELINE.md](../PIPELINE.md) - Spécification du pipeline de conversion
