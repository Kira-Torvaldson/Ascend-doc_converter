> ⚠️ **Deprecated:** Contenu migré vers les fichiers de référence canoniques.

# Politique de journalisation

## Objectif

Ce document définit la politique canonique de journalisation pour Ascend. Il précise ce qui est journalisé, la structure des journaux, les politiques de rétention et les exigences de sécurité.

## Catégories de journaux

### 1. Journaux de conversion

**Objectif :** Suivre les opérations de conversion individuelles  
**Format :** JSON  
**Emplacement :** `api/logs/<conversion-id>.log`  
**Rétention :** 30 jours (configurable)

**Contenu :**
- ID de conversion (UUID)
- Horodatage (ISO 8601)
- Formats source et cible
- Modules exécutés
- Durée
- Statut final (SUCCESS, FAILED, TIMEOUT, etc.)
- Messages d'erreur (sanitisés)

**Sécurité :**
- Aucun contenu utilisateur
- Aucun chemin de fichier (uniquement des chemins relatifs dans le répertoire temporaire)
- Aucune donnée sensible

### 2. Journaux de sécurité

**Objectif :** Suivre les événements et violations de sécurité  
**Format :** JSON  
**Emplacement :** Journal des événements de sécurité (séparé des journaux de conversion)  
**Rétention :** 90 jours (configurable)

**Contenu :**
- Type d'événement de sécurité
- Horodatage
- ID de conversion (le cas échéant)
- Détails de la violation (sanitisés)
- Action entreprise

**Événements journalisés :**
- Tentatives de traversée de chemin
- Tentatives d'accès réseau
- Violations des limites de ressources
- Tentatives de format non autorisé
- Échecs de validation de jeton

### 3. Journaux système

**Objectif :** Suivre la santé et les erreurs du système  
**Format :** Texte structuré ou JSON  
**Emplacement :** Journal système (stdout/stderr ou fichier)  
**Rétention :** 7 jours (configurable)

**Contenu :**
- Événements système (démarrage, arrêt)
- Conditions d'erreur
- Avertissements d'utilisation des ressources
- Événements de dégradation

## Structure des journaux

### Format du journal de conversion

```json
{
  "conversionId": "uuid",
  "timestamp": "ISO-8601",
  "sourceFormat": "asciidoc",
  "targetFormat": "markdown",
  "modules": [
    {
      "name": "downdoc",
      "duration": 1.23,
      "status": "SUCCESS"
    }
  ],
  "totalDuration": 1.23,
  "status": "SUCCESS",
  "error": null
}
```

## Règles de journalisation

### 1. Aucun contenu utilisateur

Les journaux ne doivent jamais contenir :
- Le contenu des fichiers
- Le texte fourni par l'utilisateur
- Les informations personnelles
- Les données sensibles

### 2. Sanitisation

Toutes les données journalisées doivent être sanitisées :
- Chemins de fichiers → chemins relatifs uniquement
- Messages d'erreur → messages génériques (sans détails système)
- Entrée utilisateur → supprimée ou hachée

### 3. Format structuré

Tous les journaux doivent être structurés (JSON de préférence) pour :
- L'analyse par machine
- L'analyse automatisée
- L'intégration avec les systèmes d'agrégation de journaux

### 4. Journalisation minimale

Seules les informations essentielles sont journalisées :
- Métadonnées de conversion
- Événements de sécurité
- Erreurs système
- Métriques de performance

## Accès aux journaux

### Accès API

Les journaux sont accessibles via :
- `GET /api/logs/<conversion-id>` — Journal d'une conversion unique
- `GET /api/logs` — Liste de tous les journaux de conversion

### Accès au système de fichiers

Les journaux sont stockés dans :
- Le répertoire `api/logs/`
- Un fichier par conversion
- Format JSON pour l'analyse

## Politique de rétention

- **Journaux de conversion :** 30 jours (par défaut, configurable)
- **Journaux de sécurité :** 90 jours (par défaut, configurable)
- **Journaux système :** 7 jours (par défaut, configurable)

Le nettoyage automatique supprime les journaux plus anciens que la période de rétention.

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- Les exigences de contenu des journaux
- Les spécifications de format des journaux
- Les politiques de rétention
- Les exigences de sécurité
