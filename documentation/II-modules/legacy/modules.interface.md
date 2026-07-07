> ⚠️ **Déprécié :** Contenu migré vers les fichiers de référence canoniques (`specs/modules-interface.md`).

# Interface des modules de conversion - Version 1

## Vue d'ensemble

Ce document définit le contrat strict et normatif que chaque module de conversion (wrapper) doit respecter pour être intégré au pipeline Ascend. Cette spécification V1 établit des obligations minimales compatibles avec le développement en cours, tout en préparant l'évolution vers des mesures de sécurité renforcées conformes aux normes internationales.

## Principe fondamental

Chaque module de conversion est une unité fonctionnelle indépendante qui transforme un fichier d'un format source vers un format de destination. Le module ne doit pas connaître l'existence des autres modules et doit respecter strictement cette interface.

## Contrat d'interface

### Propriétés requises

Chaque module doit exposer les propriétés suivantes :

#### 1. Nom du module

**Propriété :** `name`  
**Type :** `string`  
**Description :** Identifiant unique du module  
**Contraintes :**
- Minuscules avec des tirets comme séparateurs
- Pas d'espaces ni de caractères spéciaux
- Unique parmi tous les modules

**Exemples :** `"downdoc"`, `"pandoc"`, `"text2markdown"`

#### 2. Formats pris en charge

**Propriété :** `supportedFormats`  
**Type :** `object`  
**Description :** Formats pris en charge par le module  
**Structure :**
```javascript
{
  from: ["asciidoc", "markdown"],
  to: ["markdown", "html"]
}
```

**Contraintes :**
- `from` et `to` doivent être des tableaux de chaînes
- Les identifiants de format doivent être en minuscules
- Les formats doivent correspondre à la liste canonique des formats

### Méthode requise

#### `run(inputPath, outputPath, options)`

**Paramètres :**
- `inputPath` (string) : Chemin absolu vers le fichier d'entrée
- `outputPath` (string) : Chemin absolu vers le fichier de sortie
- `options` (object, optionnel) : Options de conversion

**Retourne :** Promise ou objet avec la structure suivante :
```javascript
{
  success: boolean,    // true si la conversion a réussi
  logs: string|array, // journaux d'exécution
  error: string|null, // message d'erreur en cas d'échec
  duration: number    // durée d'exécution en secondes
}
```

**Comportement :**
- Lit le fichier d'entrée depuis `inputPath`
- Effectue la conversion
- Écrit le fichier de sortie vers `outputPath`
- Retourne un objet de résultat standardisé

## Obligations de sécurité (V1 - Minimales)

### 1. Validation de base des entrées

Les modules doivent :
- Valider que le fichier d'entrée existe et est lisible
- Valider que la taille du fichier est dans des limites raisonnables
- Rejeter les formats non pris en charge

**Normes de référence (futures) :** ISO 27001, NIST SP 800-53

### 2. Isolation légère

Les modules doivent :
- S'exécuter dans le répertoire temporaire fourni
- Ne pas accéder aux fichiers en dehors du répertoire temporaire
- Ne pas effectuer de requêtes réseau

**Normes de référence (futures) :** ISO 27002, OWASP Top 10

### 3. Gestion sécurisée des erreurs

Les modules doivent :
- Ne jamais lever d'exceptions non gérées
- Retourner les informations d'erreur dans l'objet de résultat
- Ne pas exposer les détails système dans les messages d'erreur

**Normes de référence (futures) :** ISO 27001, GDPR/RGPD

### 4. Journalisation minimale

Les modules doivent :
- Journaliser uniquement les informations essentielles (nom du module, durée, statut)
- Ne pas journaliser le contenu des fichiers ni les données sensibles
- Utiliser un format de journalisation structuré

**Normes de référence (futures) :** ISO 27001, GDPR/RGPD

### 5. Vérification légère de l'intégrité

Les modules doivent :
- Vérifier que le fichier de sortie a été créé
- Vérifier que le fichier de sortie est lisible
- Retourner une erreur si la sortie est invalide

**Normes de référence (futures) :** ISO 27001, NIST SP 800-53

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
