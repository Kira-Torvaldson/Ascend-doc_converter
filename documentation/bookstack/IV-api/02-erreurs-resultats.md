# Erreurs et ConversionResult

## Erreurs structurées (UI)

Depuis v0.0.1.7, les erreurs de conversion exposent :

| Champ | Usage |
|-------|-------|
| `error.code` | Code machine stable (ex. `PAYLOAD_TOO_LARGE`) |
| `hint` | Message actionnable pour l'utilisateur |
| `requestId` | Corrélation avec les logs backend |

L'interface affiche une **modale** avec ces trois éléments.

## Codes d'erreur fréquents

| Code | Cause typique |
|------|---------------|
| `PAYLOAD_TOO_LARGE` | Fichier > limite EnvMap |
| `FORMAT_NOT_SUPPORTED` | Format non déclaré |
| `VALIDATION_FAILED` | Entrée invalide |
| `CONVERSION_TIMEOUT` | Dépassement `CONVERSION_TIMEOUT_MS` |
| `MODULE_ERROR` | Échec du wrapper |
| `CONFIRMATION_REQUIRED` | Confirmation manquante |

## ConversionResult (aperçu)

Contrat standardisé pour chaque conversion. Six blocs conceptuels :

```
ConversionResult
├── Informations générales   (id, statut, durée)
├── Fichier d'entrée         (format, taille, chemin)
├── Fichier de sortie        (format, chemin)
├── Observabilité            (warnings, logs)
├── Erreur                   (code, message, hint)
└── Métadonnées techniques   (extensible)
```

## Statuts finaux

| Statut | Signification |
|--------|---------------|
| `success` | Conversion terminée, sortie valide |
| `failure` | Échec explicite (voir bloc Erreur) |

## Traçabilité

Chaque conversion produit :
- Un **identifiant unique**
- Un **dossier temporaire** dédié
- Des **logs JSON** horodatés
- Une **durée** mesurée

## Où trouver le détail complet

Le contrat `ConversionResult` complet (~7 800 lignes) est dans :

`documentation/IV-api/conversion-result-contract.md`

**Pour BookStack :** garder cette page comme synthèse ; lier vers le dépôt Git pour le référentiel exhaustif des codes d'erreur.
