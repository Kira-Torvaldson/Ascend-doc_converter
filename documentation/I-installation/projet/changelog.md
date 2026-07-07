# Journal des modifications

## Objectif

Ce document constitue un enregistrement canonique des changements apportés à Ascend. Il suit le versionnement sémantique et documente toutes les modifications notables.

## Format

Chaque entrée comprend :
- Le numéro de version
- La date de publication
- Les changements (Ajouté, Modifié, Corrigé, Supprimé, Sécurité)

## Historique des versions

### 0.0.1.7 (2026-06-17)

#### Ajouté
- `npm run check:docker:frontend` et `check:docker` — build de `container/frontend/Dockerfile` + vérification SPA nginx.
- Job CI `docker` — étape de build de l'image frontend.
- Pied de page : limite de taille de la source et indice vers le runbook.
- Modale d'erreur de conversion : `error.code`, indice et `requestId`.

#### Modifié
- Visibilité de l'arrière-plan Rafale (superpositions plus légères lorsque la photo personnalisée est chargée).
- Le panneau `HistoryModalV2` utilise les variables CSS de thème des modales.
- Les échecs de conversion structurés ouvrent la modale d'erreur pour toutes les valeurs `error.code` du backend.

### 0.0.1.6 (2026-06-15)

#### Ajouté
- SVG d'arrière-plan par défaut intégré au frontend ; `rafale.jpg` optionnel depuis `api/backend/public/`.
- Composants UI `ConversionLoadingBanner` et `HeaderStatusPill` (statut de conversion dans l'en-tête).
- `api/backend/public/README.md` — guide de configuration des ressources statiques.

#### Modifié
- Mise en page de l'en-tête (logo, titre, pastille de statut de conversion) ; harmonisation des boutons de panneau et des bannières de chargement.
- Textes du panneau des paramètres utilisant des classes CSS adaptées au thème ; notes de version mises à jour dans l'interface.
- Runbook et `container/README.md` — version client Docker, dépannage WSL, note CORS en développement.
- Middleware CORS : autorisation de toute origine `http://localhost` / `127.0.0.1` en développement (repli de port Vite).

#### Corrigé
- Arrière-plan de page non rendu lorsque `rafale.jpg` était absent (résolution `url()` de la variable CSS).
- Règle CSS `.settings-field-error` cassée (erreur d'analyse PostCSS).

### 0.0.1.5 (2026-06-05)

#### Ajouté
- `npm run check:docker:backend` — build de `container/backend/Dockerfile` et vérification de Pandoc dans l'image.
- Job CI `docker` — porte de build de l'image backend à chaque push/PR.

#### Modifié
- Alignement des versions entre les paquets frontend/backend, lockfiles, badge README et métadonnées de l'application.
- Runbook et feuille de route mis à jour pour la validation des builds Docker avant la bêta `0.0.2.0`.

### 0.0.1.4.9 (2026-06-05)

#### Ajouté
- `npm run check:ascend:ci` — chaîne de validation unique pour la CI (synchronisation des versions, e2e, golden, roundtrip, abuse).

#### Modifié
- Job CI `ascend` simplifié en `check:ascend:ci` avec `npm ci` à la racine pour les tests Mocha abuse.
- Alignement des versions entre les paquets frontend/backend, lockfiles, badge README et métadonnées de l'application.

### 0.0.1.4.8 (2026-06-03)

#### Ajouté
- Fixture golden `adoc/complex/05-xref.adoc` et `adoc/simple/06-utf8.adoc` ; fixture Markdown `markdown/complex/01-table.md`.
- E2e CI pour `/api/text-to-markdown` et `/api/from-html` (contrats représentatifs + échec).
- Messages et indices UI en français pour tous les `SECURITY_ERROR_CODES`.

#### Modifié
- Les vérifications sémantiques roundtrip ciblent les références croisées (`05-xref`) au lieu de l'UTF-8 dans l'ensemble complexe.
- Alignement des versions entre les paquets frontend/backend, lockfiles, badge README et métadonnées de l'application.

### 0.0.1.4.7 (2026-05-28)

#### Ajouté
- Scripts `release:bump` et `check:version` (7 zones de version).
- Job CI **ascend** (corpus golden, roundtrip, e2e, tests d'abus API).
- Corpus golden et tests roundtrip sémantiques adoc ↔ md.
- Enveloppe d'erreur structurée (`error.code`, `category`, `hint`) et messages UI.
- Corrélation `X-Request-Id` / `meta.requestId`.
- `GET /api/metrics` et `GET /api/config/limits`.
- Pandoc dans l'image Docker `container/backend`.
- Runbook opérationnel (`doc/guides/operations/runbook.md`).

#### Modifié
- Limite d'entrée unifiée **5 Mo** (EnvMap, Express, modules, UI, Nginx 6m).
- Alignement de publication pour les versions des paquets frontend/backend, lockfiles, badge README et métadonnées de l'application.

### 0.0.1.4.6 (2026-04-02)

#### Modifié
- Documentation étendue du contrat `ConversionResult` (étapes 10–11, clôture étape 11, baseline de passation).
- Alignement du wrapper AsciiDoc → Markdown et scripts e2e associés pour `/api/to-markdown`.
- Alignement du badge README, des versions des paquets et des métadonnées affichées de l'application sur `0.0.1.4.6` (frontend/backend).

### 0.0.1.4.4 (2026-03-24)

#### Modifié
- Stabilisation des états de conversion frontend : réinitialisation des marqueurs modifié/édition après restauration et actions d'effacement.
- Blocage du lancement de conversion tant que le panneau de résultat est en mode édition pour éviter des états mixtes invalides.
- Unification des messages de validation frontend pré-conversion pour source vide et source surdimensionnée (2 Mo).
- Affinage des libellés des modales et cohérence des boutons pour un comportement plus clair côté utilisateur.
- Alignement des métadonnées affichées de l'application et des versions des paquets sur `0.0.1.4.4` (frontend/backend).

#### Corrigé
- État d'édition de résultat obsolète après les flux d'effacement source/résultat.
- Libellé de version incohérent dans la section « Nouveautés » des paramètres.
- Faute de frappe dans le libellé d'auteur du pied de page (`Made by TBE`).

### 0.0.1.4.3.1 (2026-03-23)

#### Modifié
- Publication corrective d'hygiène du dépôt après `0.0.1.4.3`
- Retrait de l'index Git des dépendances générées et des artefacts de build frontend non suivis
- Conservation des fichiers de développement locaux tout en supprimant le bruit des fichiers générés du contrôle de version

#### Impact
- Aucun changement fonctionnel à l'exécution
- Diffs plus propres et workflow de maintenance plus sûr

### 0.0.1.4.3 (2026-03-23)

#### Ajouté
- Documentation Docker HTTPS-first par IP avec guide de mappage de repli (`8080:80`, `8443:443`)
- Guide pour la ressource statique optionnelle d'arrière-plan (`/public/rafale.jpg`)
- Synchronisation de publication entre la racine et la documentation canonique

#### Modifié
- Fichiers README racine alignés sur le comportement d'exécution Docker actuel
- Références de version de la documentation canonique alignées sur `0.0.1.4.3`

### 0.0.1.4.2 (2026-03-23)

#### Ajouté
- Mises à jour de validation et des notes de version pour le flux de documentation générale

#### Modifié
- Badges de version modifiés et entrées du changelog synchronisées dans la documentation

### 0.0.1.4.1 (2026-03-23)

#### Modifié
- Incrément de version vers `0.0.1.4.1`

### 0.0.1.4 (2026-03-23)

#### Ajouté
- Améliorations du panneau des paramètres (déplaçable/redimensionnable)
- Intégration du workflow Docker et états par défaut des sections

### 0.0.1.3 Rise (2026-01-27)

#### Ajouté
- Réorganisation complète de la documentation
- Structure de référence canonique (`doc/references/`)
- Nouvelles catégories de documentation (core, configuration, security, conversion, API, UI, profiles)
- Répertoire des spécifications (`doc/specs/`)
- Glossaire et journal des modifications
- Spécification de l'interface des modules

#### Modifié
- Structure de la documentation réorganisée pour une configuration machine-readable pérenne
- Toute la documentation désormais en anglais (précision technique)
- Séparation claire entre références canoniques et spécifications
- Documentation prête pour un mappage 1:1 vers `ascend.reference.json`

### 0.0.1.2.1 alpha (2026-01-19)

#### Ajouté
- Script de diagnostic d'environnement (`api/backend/bin/check-env.js`)
- Proxy de normalisation des données (`api/backend/services/proxy/secure-proxy.js`)
- Service de traitement par lots (`api/frontend/services/bulk-processor.ts`)
- Réorganisation complète de la documentation

#### Modifié
- Structure de la documentation réorganisée en références canoniques
- Synchronisation des versions sur tous les composants
- README mis à jour pour refléter les limitations actuelles

#### Corrigé
- Corrections des chemins d'import dans les modules orchestrateur
- Problèmes de démarrage du backend résolus

### 0.0.1.2.1 alpha (2026-01-19)

#### Ajouté
- Système de journalisation structurée
- Points d'accès API des journaux (`/api/logs`, `/api/logs/:id`)
- Script de consultation des journaux (`api/logs/list-logs.js`)

#### Modifié
- Réorganisation du backend (routes, middleware, services)
- Exports des modules clarifiés
- Consolidation du README

### 0.0.1.2.1 alpha (2026-01-19)

#### Ajouté
- Module Text2Markdown (placeholder → fonctionnel)
- Module PanWriter (placeholder)
- Module Docverter (placeholder)
- Module orchestrateur de convertisseurs
- Orchestrateurs principal et d'exécution
- Module de chargement différé (lazy loading)

#### Modifié
- Standardisation de l'interface des modules
- Routage des conversions via l'orchestrateur

### 0.0.1.1 alpha (2026-01-19)

#### Ajouté
- Version initiale
- Conversion AsciiDoc ↔ Markdown
- Interface de base
- Cadre de sécurité (V1)
- Système d'options de conversion

## Statut canonique

Ce document est **canonique** et définit la source de vérité pour :
- L'historique des versions
- Le suivi des changements
- Les dates de publication
- Les ajouts et suppressions de fonctionnalités
