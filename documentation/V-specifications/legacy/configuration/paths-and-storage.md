> ⚠️ **Deprecated:** Contenu migré vers les fichiers de référence canoniques.

# Configuration des chemins et du stockage

## Objectif

Ce document définit les chemins canoniques et les emplacements de stockage utilisés par Ascend. Il sert de référence pour l'organisation du système de fichiers et la validation des chemins.

## Structure des répertoires

### Répertoires racine

```
Ascend/
├── api/
│   ├── backend/          # Backend application
│   ├── frontend/         # Frontend application
│   └── logs/            # Conversion logs (writable)
├── doc/                  # Documentation
├── lib/                  # Core libraries
└── test/                 # Tests
```

### Répertoires temporaires

**Chemin de base :** Répertoire temporaire système (spécifique à l'OS)  
**Modèle :** `<temp-dir>/ascend-<conversion-id>/`  
**Permissions :** 0o700 (lecture/écriture/exécution propriétaire uniquement)  
**Durée de vie :** Créé par conversion, supprimé après achèvement

**Exemple :**
- Linux/macOS : `/tmp/ascend-<uuid>/`
- Windows : `C:\Users\<user>\AppData\Local\Temp\ascend-<uuid>\`

### Répertoire des journaux

**Chemin :** `api/logs/`  
**Permissions :** Accessible en écriture par l'application  
**Contenu :** Fichiers de journal JSON, un par conversion  
**Nommage :** `<conversion-id>.log`

### Ressources statiques

**Public backend :** `api/backend/public/`  
**Statique backend :** `api/backend/static/`  
**Dist frontend :** `api/frontend/dist/` (build de production)

## Règles de validation des chemins

### 1. Chemins absolus requis

Toutes les opérations sur les fichiers doivent utiliser des chemins absolus :
- Fichiers d'entrée : Résolus en chemin absolu avant utilisation
- Fichiers de sortie : Générés comme chemins absolus
- Fichiers temporaires : Créés avec des chemins absolus

### 2. Protection contre la traversée de chemins

Tous les chemins doivent être validés pour empêcher :
- Les séquences `../`
- Le suivi des liens symboliques (en mode sécurisé)
- L'accès en dehors des répertoires autorisés

### 3. Isolation des répertoires temporaires

Tous les fichiers de conversion doivent se trouver dans :
- Le répertoire temporaire unique de la conversion
- Aucun accès aux fichiers en dehors de ce répertoire
- Aucune création de fichiers dans les répertoires système

### 4. Validation par liste blanche

Seuls les chemins correspondant aux modèles autorisés sont permis :
- Modèle de répertoire temporaire
- Modèle de répertoire de journaux
- Répertoires de ressources statiques (lecture seule)

## Exigences de stockage

### Répertoires accessibles en écriture

Les répertoires suivants doivent être accessibles en écriture :
- `api/logs/` — Pour les journaux de conversion
- Répertoire temporaire système — Pour les fichiers de conversion temporaires
- `api/backend/public/` — Pour les ressources téléversées par l'utilisateur (si activé)

### Répertoires en lecture seule

Les répertoires suivants sont en lecture seule :
- `doc/` — Documentation
- `lib/` — Bibliothèques principales
- `api/backend/static/` — Fichiers HTML statiques

## Résolution des chemins

### Résolution des fichiers d'entrée

1. L'utilisateur fournit un chemin relatif ou absolu
2. Le système résout en chemin absolu
3. Valide que le chemin est dans le périmètre autorisé
4. Vérifie que le fichier existe et est lisible
5. Valide que la taille du fichier est dans les limites

### Résolution des fichiers de sortie

1. Le système génère un chemin absolu dans le répertoire temporaire
2. Valide que le chemin est dans le répertoire temporaire
3. Crée les répertoires parents si nécessaire
4. Écrit le fichier de sortie
5. Retourne un chemin relatif ou le contenu à l'utilisateur

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- La structure des répertoires
- Les règles de validation des chemins
- Les exigences de stockage
- La gestion des fichiers temporaires
