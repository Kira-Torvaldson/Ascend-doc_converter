# Interface des Modules de Conversion - Version 1

## Vue d'ensemble

Ce document définit le contrat strict et normatif que chaque module de conversion (wrapper) doit respecter pour être intégré dans le pipeline Ascend. Cette spécification V1 établit les obligations minimales compatibles avec le développement en cours, tout en préparant l'évolution vers des mesures de sécurité renforcées conformes aux standards internationaux.

## Principe fondamental

Chaque module de conversion est une unité fonctionnelle indépendante qui transforme un fichier d'un format source vers un format de destination. Le module ne doit pas connaître l'existence des autres modules et doit respecter strictement cette interface.

## Contrat d'interface

### Propriétés obligatoires

Chaque module doit exposer les propriétés suivantes :

#### 1. Nom du module

**Propriété :** `name`  
**Type :** `string`  
**Description :** Identifiant unique et descriptif du module  
**Exemples :** `"downdoc-converter"`, `"pandoc-converter"`, `"text2markdown-converter"`  
**Contraintes :**
- Doit être unique parmi tous les modules
- Doit être en minuscules avec des tirets comme séparateurs
- Ne doit pas contenir d'espaces ni de caractères spéciaux

#### 2. Formats supportés

**Propriété :** `supportedFormats`  
**Type :** `Object`  
**Description :** Définition des formats d'entrée et de sortie supportés par le module  
**Structure :**
```typescript
{
  from: string[],  // Formats d'entrée acceptés
  to: string[]     // Formats de sortie produits
}
```

**Contraintes :**
- `from` et `to` doivent être des tableaux non vides
- Chaque format doit être une chaîne de caractères en minuscules
- Les formats doivent correspondre aux formats standardisés du pipeline (markdown, asciidoc, html, txt, yaml, json, pdf, etc.)

### Méthode standard : `run`

**Signature :**
```typescript
run(inputPath: string, outputPath: string, options?: Object): Promise<ModuleResult>
```

**Paramètres :**

- **`inputPath`** (requis) : `string`
  - Chemin absolu vers le fichier d'entrée
  - Le fichier doit exister et être lisible
  - Le chemin doit être validé par le pipeline avant l'appel

- **`outputPath`** (requis) : `string`
  - Chemin absolu vers le fichier de sortie
  - Le module doit créer ce fichier en cas de succès
  - Le répertoire parent doit exister

- **`options`** (optionnel) : `Object`
  - Options de conversion spécifiques au module
  - Structure libre définie par chaque module
  - Peut être `undefined` ou un objet vide

**Valeur de retour :**

La méthode doit retourner une `Promise` qui se résout avec un objet `ModuleResult` conforme à la structure suivante :

```typescript
interface ModuleResult {
  success: boolean;           // Statut de la conversion
  logs: string | string[];    // Logs de l'exécution
  error: string | null;       // Message d'erreur (null si succès)
  duration: number;           // Durée en secondes
}
```

#### Propriétés de `ModuleResult`

##### `success` (obligatoire)

**Type :** `boolean`  
**Description :** Indique si la conversion a réussi ou échoué  
**Valeurs :**
- `true` : La conversion a réussi, le fichier de sortie a été créé et est valide
- `false` : La conversion a échoué, le fichier de sortie ne doit pas être créé ou est invalide

**Contraintes :**
- Doit être cohérent avec la présence/absence du fichier de sortie
- Si `success === true`, le fichier `outputPath` doit exister et être lisible
- Si `success === false`, le champ `error` doit contenir un message d'erreur

##### `logs` (obligatoire)

**Type :** `string | string[]`  
**Description :** Logs générés pendant l'exécution du module  
**Contraintes :**
- Peut être une chaîne de caractères unique ou un tableau de chaînes
- Chaque ligne de log doit représenter un événement ou une information pertinente
- Les logs ne doivent pas contenir de données utilisateur sensibles
- Les logs doivent être utiles pour le diagnostic en cas d'erreur

##### `error` (obligatoire)

**Type :** `string | null`  
**Description :** Message d'erreur en cas d'échec, `null` en cas de succès  
**Contraintes :**
- Doit être `null` si `success === true`
- Doit être une chaîne non vide si `success === false`
- Le message doit être descriptif et utile pour le diagnostic
- Ne doit pas exposer de détails système sensibles (chemins complets, variables d'environnement, etc.)

##### `duration` (obligatoire)

**Type :** `number`  
**Description :** Durée d'exécution de la conversion en secondes  
**Contraintes :**
- Doit être un nombre positif ou zéro
- Doit représenter la durée réelle d'exécution (en secondes, avec précision décimale possible)
- Doit inclure le temps total de traitement (lecture, conversion, écriture)

## Obligations de sécurité minimales (V1)

Cette section définit les obligations de sécurité minimales que chaque module doit respecter dans la version 1. Ces obligations sont conçues pour être compatibles avec le développement en cours tout en préparant l'évolution vers des mesures de sécurité renforcées.

### 1. Validation basique des entrées

**Obligation :** Le module doit valider les fichiers d'entrée avant traitement.

**Exigences minimales :**
- Vérification de la taille du fichier (limite maximale configurable)
- Vérification du type de fichier (extension ou signature de base)
- Rejet immédiat si les validations échouent

**Références normatives (pour évolution future) :**
- **ISO 27001** (A.9.4.2) : Contrôle d'accès aux systèmes et applications
- **ISO 27002** (A.9.4.2) : Politiques et procédures de contrôle d'accès
- **NIST SP 800-53** (SI-7) : Intégrité des logiciels, des microprogrammes et des informations
- **OWASP Top 10** (A03:2021 - Injection) : Validation et assainissement des entrées

**Évolution prévue :**
- Validation approfondie du type MIME réel
- Détection de fichiers binaires déguisés
- Analyse de contenu pour détecter les malwares potentiels

### 2. Isolement léger

**Obligation :** Le module doit s'exécuter dans un contexte isolé.

**Exigences minimales :**
- Utilisation d'un dossier temporaire unique fourni par le pipeline
- Accès uniquement aux fichiers `inputPath` et `outputPath`
- Pas de création de fichiers en dehors du répertoire autorisé

**Références normatives (pour évolution future) :**
- **ISO 27001** (A.9.1.2) : Restrictions d'accès aux réseaux et services réseau
- **ISO 27002** (A.9.1.2) : Séparation des réseaux
- **NIST SP 800-53** (SC-7) : Protection des limites du système
- **NIST SP 800-53** (SC-39) : Isolation des processus
- **OWASP Top 10** (A01:2021 - Broken Access Control) : Contrôle d'accès approprié

**Évolution prévue :**
- Exécution sous utilisateur non privilégié dédié
- Sandboxing complet avec restrictions système
- Isolation réseau stricte (pas d'accès réseau)

### 3. Gestion sécurisée des erreurs

**Obligation :** Le module doit gérer toutes les erreurs sans provoquer de crash global.

**Exigences minimales :**
- Capture de toutes les exceptions et erreurs
- Transformation des erreurs en `ModuleResult` avec `success: false`
- Aucune exception non gérée ne doit remonter au pipeline
- Messages d'erreur ne doivent pas exposer de détails système sensibles

**Références normatives (pour évolution future) :**
- **ISO 27001** (A.12.6.1) : Gestion des vulnérabilités techniques
- **ISO 27002** (A.12.6.1) : Gestion des vulnérabilités
- **NIST SP 800-53** (SI-11) : Gestion des erreurs
- **OWASP Top 10** (A04:2021 - Insecure Design) : Gestion robuste des erreurs

**Évolution prévue :**
- Classification des erreurs par niveau de criticité
- Journalisation structurée des erreurs pour analyse
- Mécanismes de récupération automatique

### 4. Journalisation minimale

**Obligation :** Le module doit produire des logs minimaux pour traçabilité.

**Exigences minimales :**
- ID unique de conversion (fourni par le pipeline)
- Horodatage de début et fin d'exécution
- Statut final (succès/échec)
- Durée d'exécution

**Références normatives (pour évolution future) :**
- **ISO 27001** (A.12.4.1) : Enregistrement des événements
- **ISO 27002** (A.12.4.1) : Journalisation des événements
- **NIST SP 800-53** (AU-2) : Audit des événements
- **NIST SP 800-53** (AU-3) : Contenu des enregistrements d'audit
- **GDPR/RGPD** (Art. 30) : Registre des activités de traitement
- **GDPR/RGPD** (Art. 32) : Sécurité du traitement

**Évolution prévue :**
- Journalisation structurée complète (JSON, formats standardisés)
- Intégrité des logs (signature, horodatage fiable)
- Rétention et archivage sécurisé des logs
- Conformité GDPR/RGPD pour données personnelles

### 5. Vérification légère de l'intégrité

**Obligation :** Le module doit permettre la vérification de son intégrité et de ses dépendances.

**Exigences minimales :**
- Calcul et exposition d'un hash ou checksum du module (optionnel en V1)
- Documentation des dépendances et de leurs versions
- Signalement en cas de modification détectée (optionnel en V1)

**Références normatives (pour évolution future) :**
- **ISO 27001** (A.12.2.1) : Contrôles contre les codes malveillants
- **ISO 27002** (A.12.2.1) : Contrôles contre les codes malveillants
- **NIST SP 800-53** (SI-7) : Intégrité des logiciels, des microprogrammes et des informations
- **NIST SP 800-53** (SA-12) : Gestion de la chaîne d'approvisionnement
- **OWASP Top 10** (A06:2021 - Vulnerable Components) : Gestion des dépendances

**Évolution prévue :**
- Vérification systématique des hashs au chargement
- Signature numérique des modules
- Vérification de l'intégrité des dépendances
- Détection automatique des vulnérabilités connues

## Comportement attendu

### En cas de succès

1. Le module doit créer le fichier de sortie à l'emplacement `outputPath`
2. Le fichier de sortie doit être valide et conforme au format de destination
3. La méthode doit retourner un `ModuleResult` avec :
   - `success: true`
   - `error: null`
   - `logs` contenant les logs d'exécution
   - `duration` représentant la durée réelle

### En cas d'échec

1. Le module ne doit pas créer de fichier de sortie (ou le supprimer s'il a été créé partiellement)
2. La méthode doit retourner un `ModuleResult` avec :
   - `success: false`
   - `error` contenant un message d'erreur descriptif
   - `logs` contenant les logs jusqu'au point d'échec
   - `duration` représentant la durée jusqu'à l'échec

## Contraintes d'exécution

### Isolation

- Le module ne doit pas modifier le fichier d'entrée
- Le module ne doit accéder qu'aux fichiers `inputPath` et `outputPath`
- Le module ne doit pas créer de fichiers temporaires en dehors du répertoire autorisé
- Le module ne doit pas accéder au réseau (obligation minimale V1)

### Performance

- Le module doit respecter les timeouts imposés par le pipeline
- Le module doit libérer les ressources après exécution
- Le module ne doit pas bloquer le processus principal

### Sécurité

- Le module ne doit pas exécuter de commandes système non validées
- Le module ne doit pas utiliser de données utilisateur dans des commandes système
- Le module doit valider les chemins de fichiers avant utilisation

## Validation du contrat

Le pipeline valide que chaque module respecte ce contrat avant de l'utiliser :

1. Vérification de la présence des propriétés obligatoires (`name`, `supportedFormats`, `run`)
2. Vérification du type et de la structure de `supportedFormats`
3. Vérification que `run` est une fonction asynchrone
4. Vérification que `run` retourne une Promise résolvant avec un `ModuleResult` valide
5. Vérification des obligations de sécurité minimales (V1)

## Conformité

Tout module qui ne respecte pas strictement ce contrat sera rejeté par le pipeline. Aucune exception n'est autorisée. Cette spécification garantit :

- **Uniformité** : Tous les modules suivent la même interface
- **Compatibilité** : Les modules peuvent être interchangés sans modification du pipeline
- **Maintenabilité** : L'interface claire facilite la maintenance et l'évolution
- **Fiabilité** : Le comportement uniforme réduit les erreurs et facilite le débogage
- **Évolutivité** : Les références aux normes préparent l'évolution vers des mesures de sécurité renforcées

## Évolution vers V2

Cette spécification V1 établit les bases minimales. Les versions futures (V2, V3) intégreront progressivement :

- Mesures de sécurité renforcées conformes aux normes ISO 27001/27002
- Contrôles NIST SP 800-53 complets
- Protection contre les vulnérabilités OWASP Top 10
- Conformité GDPR/RGPD complète pour la protection des données
- Sandboxing avancé et isolation réseau stricte
- Vérification d'intégrité systématique et signatures numériques
- Journalisation complète et audit trail

## Références

Cette spécification complète et détaille le "Contrat logique d'un module de conversion" défini dans [PIPELINE.md](./PIPELINE.md).

**Normes et standards référencés :**
- **ISO/IEC 27001:2022** : Systèmes de management de la sécurité de l'information
- **ISO/IEC 27002:2022** : Mesures de sécurité - Lignes directrices pour les contrôles
- **NIST SP 800-53** : Security and Privacy Controls for Information Systems and Organizations
- **OWASP Top 10** : Top 10 des risques de sécurité des applications web
- **GDPR/RGPD** : Règlement général sur la protection des données (UE 2016/679)
