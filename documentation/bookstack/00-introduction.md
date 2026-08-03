# Introduction — Documentation Ascend

Bienvenue dans la documentation **Ascend**, le système de conversion de documents en phase alpha.

Cette documentation est organisée en **cinq parties** pour vous orienter rapidement selon votre besoin : installer, comprendre les modules, sécuriser, intégrer l'API ou consulter les spécifications.

---

## À propos d'Ascend

Ascend convertit des documents entre **formats explicitement déclarés** (par exemple Markdown et AsciiDoc). Chaque conversion s'exécute dans un environnement isolé, avec validation stricte des entrées, journaux structurés et échec explicite en cas de problème.

| | |
|---|---|
| **Version** | 0.0.1.7 |
| **Statut** | Alpha |
| **Stack** | Node.js (Express) + React/Vite |
| **Licence** | MIT |

---

## Comment lire cette documentation

| Vous êtes… | Commencez par… |
|------------|----------------|
| **Développeur** découvrant le projet | I — Installation → Démarrage rapide |
| **Opérateur** / DevOps | I — Installation → Docker et dépannage |
| **Intégrateur API** | IV — API → Endpoints essentiels |
| **Référent sécurité** | III — Sécurité |
| **Architecte** / lead technique | V — Spécifications → Architecture |

---

## Les cinq parties

### I — Installation
Mise en place, Docker, configuration, dépannage et notes de version.  
*Objectif : faire tourner Ascend en local ou en conteneur.*

### II — Modules
Wrappers de conversion, contrat d'interface et catalogue des moteurs.  
*Objectif : comprendre comment les conversions sont exécutées.*

### III — Sécurité
Sandbox, validation, convertisseur sécurisé et confirmation.  
*Objectif : connaître la posture de sécurité et les règles applicables.*

### IV — API
Points de terminaison, codes d'erreur et contrat `ConversionResult`.  
*Objectif : consommer ou tester l'API.*

### V — Spécifications
Architecture, principes, roadmap et évolution du produit.  
*Objectif : situer Ascend dans le temps et dans l'architecture globale.*

---

## Démarrage en 3 étapes

```bash
git clone <url-du-repo> Ascend && cd Ascend
npm ci && npm --prefix api/backend ci && npm --prefix api/frontend ci
npm run dev
```

| Service | URL |
|---------|-----|
| Interface | http://localhost:5173 |
| API | http://localhost:3003 |

Vérification : `npm run check:version`

---

## Philosophie en une phrase

> **Formats déclarés, chemin déterministe, échec explicite, traçabilité complète.**

Ascend ne devine pas le format d'un fichier, ne tolère pas les entrées ambiguës et ne masque pas les erreurs : chaque conversion produit un statut clair, des logs et un `requestId` pour le diagnostic.

---

## Documentation complète (dépôt Git)

Cette version BookStack est une **synthèse** (~15 pages). La référence technique exhaustive (78 fichiers) se trouve dans le dépôt :

```
documentation/
├── I-installation/
├── II-modules/
├── III-securite/
├── IV-api/
└── V-specifications/
```

---

## Besoin d'aide ?

| Problème | Page |
|----------|------|
| L'app ne démarre pas | I — Dépannage courant |
| Erreur de conversion | IV — Erreurs et ConversionResult |
| Limite de taille / timeout | I — Configuration et limites |
| Docker / WSL | I — Docker et déploiement |

---

*Dernière mise à jour : v0.0.1.7*
