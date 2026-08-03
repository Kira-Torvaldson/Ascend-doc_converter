# Posture et sandbox

Ascend applique une **sécurité passive** : validation aux frontières, isolation par conversion, échec explicite.

## Principes

| Principe | Application |
|----------|-------------|
| **Isolation** | Dossier temporaire UUID par conversion (permissions 0700) |
| **Pas de réseau** | Modules sans accès réseau pendant l'exécution |
| **FS restreint** | Lecture/écriture uniquement dans le sandbox |
| **Limites ressources** | CPU, mémoire, timeout, taille fichier |
| **Validation entrée** | Avant tout traitement (type, taille, chemin) |

## Limites par défaut (sandbox)

| Ressource | Valeur |
|-----------|--------|
| Mémoire | 512 Mo |
| CPU | 100 % d'un cœur |
| Timeout | 30 s |
| Fichier entrée | 5 Mo (EnvMap) |

## Implémentation actuelle (V1)

**En place :**
- Répertoire temporaire unique
- Validation des chemins (anti-traversée)
- Surveillance timeout / taille
- Journalisation des violations

**Pas encore :**
- Isolation utilisateur dédiée
- Namespace réseau
- Sandboxing conteneur par conversion
- Filtrage syscall

## Modèle de menaces (résumé)

| Menace | Mitigation |
|--------|------------|
| Fichier malveillant / oversize | Validation + limites |
| Traversée de chemin | Normalisation chemins |
| Exfiltration données | Pas de réseau modules |
| Déni de service | Rate limit + timeout |
| Altération API navigateur | `API_KEY` côté serveur (prod) |

## Validation des fichiers

- Taille max avant traitement
- Types MIME / extension selon format déclaré
- Rejet immédiat si non conforme (`error.code` structuré)

Doc détaillée : `documentation/III-securite/`
