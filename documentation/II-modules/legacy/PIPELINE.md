> ⚠️ **Déprécié :** Contenu migré vers les fichiers de référence canoniques (`references/conversion.md`).

# Spécification du pipeline de conversion

## Vue d'ensemble

Ce document définit les règles et principes que le pipeline de conversion doit respecter. Il s'agit d'une spécification normative interne qui décrit le comportement attendu du système sans imposer une implémentation particulière.

## Principe fondamental : isolation stricte

### Règle 1 : Une conversion = une exécution totalement isolée

Chaque conversion doit être traitée comme une opération atomique et indépendante. Aucune conversion ne doit pouvoir interférer avec une autre, que ce soit par :
- Le partage de fichiers temporaires
- Le partage d'état en mémoire
- Le partage de ressources système
- La modification de variables globales

### Règle 2 : Répertoire temporaire unique par conversion

Le pipeline doit créer un répertoire temporaire unique pour chaque conversion. Ce répertoire :
- Doit être identifié par un UUID unique généré de manière cryptographiquement sécurisée
- Doit être créé dans un répertoire racine dédié (par ex. `/tmp/ascend-conversions/`)
- Doit avoir des permissions restrictives (mode 0o700)
- Ne doit jamais être partagé entre deux conversions simultanées ou successives

### Règle 3 : Aucun état partagé entre deux conversions

Le pipeline ne doit maintenir aucun état persistant entre deux conversions. Chaque conversion doit :
- Créer ses propres ressources temporaires
- Ne pas dépendre des ressources créées par une conversion précédente
- Ne pas modifier les ressources utilisées par d'autres conversions

## Chaînage des modules

### Règle 4 : Les modules communiquent uniquement via des fichiers

Les modules ne doivent pas communiquer directement entre eux. La communication doit être :
- Basée sur les fichiers : le fichier de sortie du module N devient le fichier d'entrée du module N+1
- Explicite : les chemins de fichiers sont transmis explicitement entre les modules
- Sans mémoire partagée ni variables

### Règle 5 : Les modules sont indépendants

Chaque module doit :
- Ne pas connaître l'existence des autres modules
- Ne pas dépendre de l'ordre d'exécution des autres modules
- Être exécutable de manière isolée (pour les tests)

## Responsabilités du pipeline

### Règle 6 : Gestion du répertoire temporaire

Le pipeline est responsable de :
- Créer le répertoire temporaire avant le début de la conversion
- Fournir des chemins absolus aux modules
- Nettoyer le répertoire temporaire après la conversion (succès ou échec)

### Règle 7 : Capture des journaux et des erreurs

Le pipeline doit :
- Capturer stdout/stderr de chaque module
- Agréger les journaux de tous les modules
- Retourner un objet de résultat standardisé

## Contrat des modules

### Interface requise

Chaque module doit exposer :

#### `name` (string)
Identifiant unique du module (par ex. `"downdoc"`, `"pandoc"`).

#### `supportedFormats` (object)
```javascript
{
  from: ["asciidoc"],
  to: ["markdown"]
}
```

#### `run(inputPath, outputPath, options)` (function)
- **inputPath** : Chemin absolu vers le fichier d'entrée
- **outputPath** : Chemin absolu vers le fichier de sortie
- **options** : Objet d'options de conversion optionnel
- **Retourne** : Promise ou objet avec `{ success, logs, error, duration }`

### Format de retour

```javascript
{
  success: true|false,
  logs: string|array,
  error: string|null,
  duration: number  // en secondes
}
```

## Règles de sécurité (V1 - Minimales)

### Règle 8 : Validation de base des entrées

Les modules doivent :
- Valider que le fichier d'entrée existe et est lisible
- Valider que la taille du fichier est dans les limites
- Rejeter les formats invalides

### Règle 9 : Isolation légère

Les modules doivent :
- S'exécuter dans le répertoire temporaire fourni
- Ne pas accéder aux fichiers en dehors du répertoire temporaire
- Ne pas effectuer de requêtes réseau

### Règle 10 : Gestion sécurisée des erreurs

Les modules doivent :
- Ne jamais lever d'exceptions non gérées
- Retourner les informations d'erreur dans l'objet de résultat
- Ne pas exposer les détails système dans les messages d'erreur

### Règle 11 : Journalisation minimale

Les modules doivent :
- Journaliser uniquement les informations essentielles (nom du module, durée, statut)
- Ne pas journaliser le contenu des fichiers ni les données sensibles
- Utiliser un format de journalisation structuré

### Règle 12 : Vérification légère de l'intégrité

Les modules doivent :
- Vérifier que le fichier de sortie a été créé
- Vérifier que le fichier de sortie est lisible
- Retourner une erreur si la sortie est invalide

## Améliorations de sécurité futures (V2+)

Ces mesures sont mentionnées pour une implémentation future, elles ne sont pas actuellement appliquées :

- **ISO 27001** : Système de management de la sécurité de l'information
- **ISO 27002** : Contrôles de sécurité
- **NIST SP 800-53** : Contrôles de sécurité et de confidentialité
- **OWASP Top 10** : Risques de sécurité des applications web
- **GDPR/RGPD** : Conformité à la protection des données

## Notes

- Cette spécification est V1 et établit des obligations de sécurité minimales compatibles avec le développement en cours.
- Les versions futures renforceront les mesures de sécurité pour s'aligner sur les normes internationales.
- Tous les modules doivent respecter ce contrat pour être intégrés au pipeline.
