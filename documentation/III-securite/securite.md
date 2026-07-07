# Référence de sécurité

## Objectif

Ce document définit les références canoniques de sécurité pour Ascend, incluant les règles de sandboxing, la validation des fichiers, les règles de confirmation et le modèle de menaces. Il constitue la référence faisant autorité pour toutes les décisions de sécurité.

---

## Règles de sandboxing

### Objectif

Le sandboxing garantit que les modules de conversion s'exécutent dans des environnements isolés et sécurisés avec un accès restreint aux ressources système.

### Principes d'isolation

#### Principe 1 : Répertoire temporaire unique

**Règle :** Chaque conversion s'exécute dans un répertoire temporaire unique et isolé.

**Exigences :**
- Répertoire créé avec un nom basé sur un UUID
- Permissions : 0o700 (accès propriétaire uniquement)
- Situé dans le répertoire temporaire système
- Supprimé après achèvement de la conversion (succès ou échec)

#### Principe 2 : Aucun accès réseau

**Règle :** Les modules de conversion ne doivent pas avoir d'accès réseau pendant l'exécution.

**Application :**
- Les tentatives d'accès réseau sont détectées et bloquées
- Les violations entraînent l'arrêt immédiat de la conversion
- Événement de sécurité journalisé

**Justification :** Empêche l'exfiltration de données et les dépendances externes.

#### Principe 3 : Accès au système de fichiers restreint

**Règle :** Les modules ne peuvent accéder qu'aux fichiers de leur répertoire temporaire assigné.

**Autorisé :**
- Lire le fichier d'entrée (fourni par le pipeline)
- Écrire le fichier de sortie (vers le chemin spécifié)
- Créer des fichiers temporaires (dans le répertoire temporaire)

**Interdit :**
- Accéder aux fichiers en dehors du répertoire temporaire
- Modifier les fichiers en dehors du répertoire temporaire
- Suivre les liens symboliques en dehors du répertoire temporaire
- Accéder aux répertoires système

#### Principe 4 : Limites de ressources

**Règle :** Chaque conversion a des limites de ressources strictes appliquées par le pipeline.

**Limites :**
- CPU : 100 % d'un cœur (par défaut)
- Mémoire : 512 Mo (par défaut, configurable)
- Temps : 30 secondes (par défaut, configurable)
- Taille de fichier : 10 Mo en entrée (par défaut, configurable)

### Implémentation du sandbox

#### Implémentation actuelle (V1)

**Niveau :** Isolation légère

**Mécanismes :**
- Répertoire temporaire unique par conversion
- Validation des chemins (prévient la traversée)
- Surveillance des ressources
- Application du délai d'expiration du processus

**Pas encore implémenté :**
- Isolation utilisateur (s'exécute sous le même utilisateur)
- Isolation par espace de noms réseau
- Sandboxing basé sur conteneur
- Filtrage des appels système

#### Implémentation future (V2+)

**Améliorations prévues :**
- Exécution sous un utilisateur dédié non privilégié
- Isolation par espace de noms réseau
- Sandboxing basé sur conteneur (Docker, etc.)
- Filtrage des appels système (seccomp, etc.)
- Abandon des capacités (capability dropping)

### Détection des violations

#### Tentatives de traversée de répertoire

**Détection :** Validation des chemins avant les opérations sur les fichiers

**Réponse :**
- Conversion immédiatement arrêtée
- Événement de sécurité journalisé
- Erreur retournée à l'utilisateur (message générique)

#### Tentatives d'accès réseau

**Détection :** Surveillance réseau ou mécanismes de sandbox

**Réponse :**
- Conversion immédiatement arrêtée
- Événement de sécurité journalisé
- Erreur retournée à l'utilisateur (message générique)

#### Violations des limites de ressources

**Détection :** Surveillance continue des ressources

**Réponse :**
- Processus arrêté (SIGTERM → SIGKILL)
- Conversion marquée comme échouée
- Événement journalisé avec détails de la violation

---

## Validation des fichiers

### Objectif

Cette section définit les règles canoniques de validation des fichiers appliquées par Ascend. Ces règles garantissent que seuls des fichiers valides et sûrs sont traités.

### Étapes de validation

#### Étape 1 : Validation de la liste blanche de formats

**Règle :** Seuls les formats figurant dans la liste blanche des formats pris en charge sont acceptés.

**Processus :**
1. Valider que le format source figure dans la liste blanche des formats d'entrée
2. Valider que le format cible figure dans la liste blanche des formats de sortie
3. Rejeter immédiatement si le format n'est pas autorisé

#### Étape 2 : Validation des chemins

**Règle :** Tous les chemins de fichiers doivent être validés pour la sécurité.

**Vérifications :**
- Le chemin doit être absolu (pas de chemins relatifs)
- Aucune séquence de traversée de répertoire (`../`, `..\\`)
- Aucun lien symbolique (en mode sécurisé)
- Le chemin doit se résoudre vers un répertoire autorisé

**Rejet :** Tout échec de validation de chemin entraîne un rejet immédiat.

#### Étape 3 : Validation de la taille du fichier

**Règle :** La taille du fichier doit être dans les limites configurées.

**Limites par défaut :**
- Taille maximale du fichier d'entrée : 10 Mo
- Configurable par profil d'exécution

**Processus :**
1. Vérifier la taille du fichier avant la lecture
2. Rejeter si la limite est dépassée
3. Aucune ressource allouée pour les fichiers surdimensionnés

#### Étape 4 : Validation du type MIME

**Règle :** Le type réel du fichier doit correspondre au format déclaré.

**Processus :**
1. Détecter le type réel du fichier (type MIME, octets magiques)
2. Comparer avec le format déclaré
3. Rejeter en cas de non-concordance

**Justification :** Empêche les fichiers binaires déguisés en fichiers texte.

#### Étape 5 : Validation du contenu

**Règle :** Le contenu du fichier doit être valide pour le format déclaré.

**Vérifications :**
- Encodage valide (UTF-8 préféré)
- Validation de structure spécifique au format
- Aucun contenu binaire intégré (pour les formats texte)

### Ordre de validation

La validation doit s'effectuer dans cet ordre :
1. Liste blanche de formats (avant toute opération sur les fichiers)
2. Validation des chemins (avant l'accès aux fichiers)
3. Taille du fichier (avant la lecture)
4. Type MIME (après lecture de l'en-tête)
5. Validation du contenu (pendant/après la lecture)

### Comportement de rejet

#### Rejet immédiat

**Règle :** Les fichiers invalides sont rejetés avant le début de tout traitement.

**Exigences :**
- Aucun fichier temporaire créé
- Aucune ressource allouée
- Message d'erreur clair retourné
- Événement de sécurité journalisé (le cas échéant)

#### Messages d'erreur

**Règle :** Les messages d'erreur doivent être génériques et ne pas exposer les détails système.

**Autorisé :**
- « Invalid file format »
- « File size exceeds limit »
- « File validation failed »

**Interdit :**
- Chemins de fichiers système
- Détails d'erreur internes
- Traces de pile
- Valeurs de configuration

---

## Règles de confirmation

### Objectif

Cette section définit les règles canoniques de confirmation utilisateur pour les conversions. Le système de confirmation garantit que les opérations sensibles ou potentiellement destructrices nécessitent une approbation explicite de l'utilisateur.

### Exigences de confirmation

#### Conversions simples

**Règle :** Les conversions simples ne nécessitent pas de jetons de confirmation.

**Conversions simples :**
- AsciiDoc → Markdown (via downdoc)
- Markdown → AsciiDoc (via Pandoc)

**Justification :** Ces conversions sont à faible risque et couramment utilisées.

#### Conversions complexes

**Règle :** Les conversions complexes nécessitent des jetons de confirmation.

**Conversions complexes :**
- Toutes les conversions via le point de terminaison `/api/convert`
- Conversions avec options personnalisées
- Conversions multi-étapes

**Justification :** Ces conversions peuvent avoir des effets de bord ou nécessiter une validation.

### Système de jetons

#### Génération de jetons

**Règle :** Les jetons sont générés côté serveur à l'aide d'une génération aléatoire cryptographiquement sécurisée.

**Exigences :**
- 32 octets de données aléatoires
- Encodage hexadécimal (64 caractères)
- Unique par requête
- Expiration : 60 secondes (par défaut)

#### Validation des jetons

**Règle :** Les jetons doivent être validés avant l'exécution de la conversion.

**Vérifications de validation :**
1. Le jeton existe dans le stockage de jetons
2. Le jeton n'a pas expiré
3. Le jeton n'a pas été consommé
4. Le jeton correspond aux métadonnées attendues (si fournies)

#### Consommation des jetons

**Règle :** Les jetons sont à usage unique et consommés lors de la validation.

**Processus :**
1. Jeton validé
2. Jeton immédiatement retiré du stockage
3. Conversion poursuivie
4. Le jeton ne peut pas être réutilisé

### Flux de confirmation

#### Étape 1 : Demande de jeton

**Point de terminaison :** `POST /api/confirmation/request`

**Requête :**
```json
{
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "metadata": {}
}
```

**Réponse :**
```json
{
  "token": "hex-encoded-token",
  "expiresIn": 60
}
```

#### Étape 2 : Confirmation utilisateur

**Action interface :** L'utilisateur confirme la conversion dans une boîte de dialogue modale.

**Validation backend :** Aucune. La confirmation de l'interface n'est pas fiable.

#### Étape 3 : Conversion avec jeton

**Point de terminaison :** `POST /api/convert`

**Requête :**
```json
{
  "content": "...",
  "fromFormat": "asciidoc",
  "toFormat": "markdown",
  "token": "hex-encoded-token"
}
```

**Validation backend :**
- Le jeton doit être valide
- Le jeton ne doit pas être expiré
- Le jeton ne doit pas être consommé

### Principes de sécurité

#### Principe 1 : Aucune confiance accordée au frontend

**Règle :** Le backend ne fait pas confiance à la confirmation de l'interface utilisateur.

**Application :**
- La validation du jeton est obligatoire
- La confirmation de l'interface seule est insuffisante
- Le jeton doit être présent dans la requête de conversion

#### Principe 2 : Expiration des jetons

**Règle :** Les jetons expirent après une courte fenêtre de temps.

**Par défaut :** 60 secondes

**Justification :** Empêche la réutilisation des jetons et limite la fenêtre d'attaque.

#### Principe 3 : Usage unique

**Règle :** Les jetons ne peuvent être utilisés qu'une seule fois.

**Application :**
- Jeton retiré du stockage lors de la validation
- Les utilisations ultérieures du même jeton sont rejetées

---

## Modèle de menaces

### Objectif

Cette section définit le modèle de menaces canonique pour Ascend. Il identifie les menaces de sécurité potentielles et les mesures d'atténuation mises en œuvre pour les traiter.

### Catégories de menaces

#### 1. Attaques par validation d'entrée

**Menace :** Entrée malveillante ou mal formée provoquant une compromission du système.

**Vecteurs d'attaque :**
- Traversée de répertoire (séquences `../`)
- Fichiers surdimensionnés (épuisement des ressources)
- Fichiers binaires déguisés en texte
- Encodage invalide provoquant des plantages d'analyseur

**Mesures d'atténuation :**
- Validation stricte des chemins
- Limites de taille de fichier
- Validation du type MIME
- Normalisation de l'encodage
- Application de la liste blanche de formats

#### 2. Attaques par épuisement des ressources

**Menace :** Consommation excessive de ressources provoquant un déni de service.

**Vecteurs d'attaque :**
- Téléversements de fichiers volumineux
- Nombreuses conversions concurrentes
- Épuisement de la mémoire
- Épuisement du CPU

**Mesures d'atténuation :**
- Limites de taille de fichier (10 Mo par défaut)
- Limites de conversions concurrentes (5 par défaut)
- Limites mémoire par conversion (512 Mo par défaut)
- Limites CPU par conversion
- Application du délai d'expiration (30 secondes par défaut)
- Dégradation gracieuse sous charge

#### 3. Attaques par injection de code

**Menace :** Exécution de code arbitraire via une entrée malveillante.

**Vecteurs d'attaque :**
- Injection de commande dans les chemins de fichiers
- Injection de code dans le contenu
- Manipulation de processus

**Mesures d'atténuation :**
- Validation des chemins (pas d'entrée utilisateur dans les chemins)
- Construction de commandes basée sur une liste blanche
- Isolation des processus (sandboxing)
- Aucun `eval()` ni exécution de code dynamique

#### 4. Exfiltration de données

**Menace :** Transmission non autorisée de données en dehors du système.

**Vecteurs d'attaque :**
- Accès réseau depuis les modules de conversion
- Accès au système de fichiers en dehors du répertoire temporaire
- Journalisation de données sensibles

**Mesures d'atténuation :**
- Accès réseau bloqué pendant la conversion
- Accès au système de fichiers restreint au répertoire temporaire
- Aucune donnée sensible dans les journaux
- La validation des chemins empêche l'accès externe

#### 5. Élévation de privilèges

**Menace :** Obtention de privilèges système élevés.

**Vecteurs d'attaque :**
- Exploitation des privilèges du processus
- Accès aux fichiers système
- Modification de la configuration système

**Mesures d'atténuation :**
- Exécution non privilégiée (prévu V2)
- Restrictions du système de fichiers
- Aucun accès aux fichiers système
- Les limites de ressources empêchent l'impact sur le système

#### 6. Divulgation d'informations

**Menace :** Fuite d'informations sensibles du système ou de l'utilisateur.

**Vecteurs d'attaque :**
- Messages d'erreur exposant les détails système
- Journaux contenant des données sensibles
- Chemins de fichiers dans les messages d'erreur

**Mesures d'atténuation :**
- Messages d'erreur génériques
- Aucun chemin système dans les erreurs
- Assainissement des journaux
- Aucun contenu utilisateur dans les journaux

### Contrôles de sécurité

#### Défense en profondeur

**Principe :** Plusieurs couches de contrôles de sécurité.

**Couches :**
1. Validation des entrées
2. Sandboxing/isolation
3. Limites de ressources
4. Gestion des erreurs
5. Journalisation et surveillance

#### Échec sécurisé

**Principe :** Le système échoue dans un état sécurisé.

**Implémentation :**
- Rejet immédiat des entrées invalides
- Aucun traitement de données non validées
- Nettoyage en cas d'échec
- Aucune exposition d'état partiel

#### Moindre privilège

**Principe :** Privilèges et accès minimum nécessaires.

**Implémentation :**
- Accès au système de fichiers restreint
- Aucun accès réseau
- Limites de ressources
- Environnement d'exécution isolé

### Évaluation des risques

#### Risque élevé

- Attaques par traversée de répertoire → **Atténué :** Validation stricte des chemins
- Épuisement des ressources → **Atténué :** Limites et surveillance
- Injection de code → **Atténué :** Sandboxing et validation

#### Risque moyen

- Exfiltration de données → **Atténué :** Blocage réseau (V2)
- Élévation de privilèges → **Atténué :** Isolation (V2)
- Divulgation d'informations → **Atténué :** Assainissement des erreurs

#### Risque faible

- Déni de service (utilisateur unique) → **Atténué :** Limites de ressources
- Injection dans les journaux → **Atténué :** Assainissement des journaux

---

## Statut canonique

Ce document est **canonique** et constitue la source de vérité pour :
- Les principes de sandboxing
- Les exigences d'isolation
- Les limites de ressources
- La gestion des violations
- Les règles et l'ordre de validation
- Les limites de taille de fichier
- La vérification du type MIME
- Le comportement de rejet
- Les exigences de confirmation
- Les règles du système de jetons
- Les principes de sécurité
- Le flux de validation
- Les menaces identifiées
- Les vecteurs d'attaque
- Les stratégies d'atténuation
- L'évaluation des risques

Toute modification des règles de sécurité doit d'abord être reflétée ici, puis propagée vers le code d'implémentation.
