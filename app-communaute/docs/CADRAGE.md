# Cadrage — Phase 1 de la V1

> Document de cadrage rédigé à partir de `SPEC.md`. **Aucun code n'a été écrit à cette étape.**
> Version 3 : intègre ta précision « une application = une communauté, que je duplique pour la suivante » et tes réponses aux questions (§ 3).
> Là où ce document s'écarte de `SPEC.md` (§ 2), c'est lui qui fait foi.
> Statut : en attente de ton feu vert pour démarrer la phase 2.

## Sommaire

1. [Ce que j'ai compris](#1-ce-que-jai-compris)
2. [Ce que ta précision change par rapport à la spec](#2-ce-que-ta-précision-change-par-rapport-à-la-spec)
3. [Décisions prises](#3-décisions-prises)
4. [Hypothèses que je retiens sauf avis contraire](#4-hypothèses-que-je-retiens-sauf-avis-contraire)
5. [Stack technique et hébergement](#5-stack-technique-et-hébergement)
6. [Architecture](#6-architecture)
7. [Registre de modules](#7-registre-de-modules)
8. [Modèle de données](#8-modèle-de-données)
9. [Format de pack](#9-format-de-pack)
10. [Comment les lots se brancheront](#10-comment-les-lots-se-brancheront)
11. [Points d'attention](#11-points-dattention)
12. [Suite : contenu de la phase 2](#12-suite--contenu-de-la-phase-2)

---

## 1. Ce que j'ai compris

Tu veux **un modèle d'application** que tu installes une fois par communauté.

- **Une installation = une communauté.** Elle a sa propre adresse, ses propres membres, ses propres données. Elle ne contient qu'une seule thématique.
- **Tu la paramètres entièrement depuis l'interface** : identité, couleurs, vocabulaire, catégories, modules actifs, contenus. Aucun code, aucun fichier à éditer.
- **Pour une nouvelle communauté, tu dupliques** : une nouvelle installation du même modèle, paramétrée autrement. Tu peux partir de zéro, ou reprendre le paramétrage (et éventuellement les contenus) d'une installation existante.

Première installation : PeopleDoc (UKG HRSD). Deuxième : les syndicats de copropriété.

### Un point à confirmer : « dupliquer » ne veut pas dire « copier le code »

Je comprends « dupliquer le modèle » ainsi : **le code est le même partout, seules les données changent.** Chaque installation, c'est :

```
   le code (identique pour toutes)   +   son dossier de données   +   quelques réglages
                                         (base + images)              (adresse, e-mail)
```

C'est important pour la suite : si chaque communauté avait sa propre copie du code, une correction ou un nouveau lot devrait être reporté à la main dans chaque copie, et elles finiraient par diverger. Avec un code unique, mettre à jour une communauté revient à redémarrer son installation sur la nouvelle version.

### Les trois exigences qui structurent le reste

| Exigence | Ce que cela implique concrètement |
|---|---|
| **Zéro code pour paramétrer une communauté** | Tout ce qui distingue une communauté d'une autre est une **donnée en base**, modifiable depuis l'interface. Aucun terme métier dans le code, y compris dans le script d'amorçage (§ 9). |
| **Modules indépendants et activables** | Chaque module se **déclare lui-même** dans un registre. Le reste du code ne contient aucune condition du type « si la base de connaissance est active » : il demande au registre la liste des modules actifs et construit menus, accueil, recherche, formulaires et imports à partir de cette liste. |
| **Une communauté sans base de connaissance est complète** | La base de connaissance est développée **après** quiz et actualités, et les liens vers les articles sont des compléments apportés par le module « base de connaissance », pas des champs prévus dans le quiz. |

### Ce que ce choix te fait gagner, et ce qu'il coûte

- **Gains** : cloisonnement total entre communautés (aucun risque qu'un copropriétaire aperçoive un contenu client), une adresse et une identité par communauté, un code nettement plus simple à lire et à maintenir.
- **Coût** : créer une communauté n'est plus « deux minutes dans l'interface » mais **une nouvelle installation chez l'hébergeur**, puis le paramétrage dans l'interface. Et une mise à jour s'applique à chaque installation. D'où l'importance du choix d'hébergement (§ 3).

---

## 2. Ce que ta précision change par rapport à la spec

La spec décrivait plusieurs « espaces » dans une même application. Voici la traduction, point par point.

| Dans la spec | Devient |
|---|---|
| Un « espace » par thématique, stocké en base | **La configuration de la communauté** de l'installation (toujours en base, toujours modifiable dans l'interface) |
| « Rien ne doit supposer qu'il n'y a qu'un espace » | **Abandonné** : une installation porte une seule communauté. Le code en est simplifié |
| Sélecteur d'espace dans l'en-tête, espace par défaut | **Supprimés** |
| Rôles différents selon les espaces | **Un rôle par utilisateur** dans l'installation (administrateur, éditeur, lecteur) ; l'attribut « Expert » est sur l'utilisateur |
| Assistant « création d'un espace » | **Assistant de première configuration**, lancé à la première ouverture d'une installation neuve ; mêmes 8 étapes |
| Point de départ « dupliquer un espace existant (configuration seule, ou configuration + contenus) » | **Import d'un pack** exporté depuis une autre installation ; l'export propose « configuration seule » ou « configuration + contenus » |
| Statuts d'espace brouillon / publié | **Communauté « en préparation »** (visible des administrateurs et éditeurs) puis **« ouverte »** |
| Suppression d'un espace protégée par la saisie de son nom | **Sans objet** : supprimer une communauté, c'est supprimer son installation chez l'hébergeur. Je peux prévoir à la place un bouton « Réinitialiser » protégé de la même façon, si tu en vois l'utilité |
| « Basculer de `peopledoc` à `copropriete` change tout, sans modifier le code » | **Deux installations du même code**, l'une chargée avec le pack `peopledoc`, l'autre avec `copropriete`. En développement, les deux tournent côte à côte sur ton poste pour comparer |
| Script d'amorçage qui crée deux espaces | Script qui charge **un pack d'exemple au choix** dans l'installation |

Tout le reste de la spec est inchangé : modularité, registre, fondations des lots, pack, imports, RGPD, lots 1 à 6.

---

## 3. Décisions prises

Tes réponses, et ce que j'en fais.

| Sujet | Ta réponse | Ce que je retiens |
|---|---|---|
| **Nombre de communautés** | 2 pour le moment | Je conçois pour 2 installations, sans rien qui empêche d'en ajouter. |
| **Hébergement** | Pas encore décidé | Je construis une application qui tourne en continu, livrée en image Docker, avec une base **SQLite** et les images dans le dossier de données. Cela fonctionne tel quel sur ton poste, sur un serveur Docker et sur un serveur interne. La décision peut attendre, **mais doit être prise avant la première mise en production** (voir ci-dessous). |
| **Accès** | Donné par l'administrateur | Communauté **privée** : il faut un compte pour lire. Pas d'inscription libre. L'administrateur crée le compte ; le membre reçoit un lien d'invitation pour choisir son mot de passe. Tant que l'e-mail n'est pas configuré, l'administrateur copie ce lien et le transmet lui-même. |
| **Résultats de quiz nominatifs** | À voir plus tard | En V1 : chaque membre voit son propre historique, les éditeurs voient des chiffres agrégés. Les données nécessaires sont enregistrées de toute façon ; ouvrir une vue nominative plus tard sera un ajout d'écran, pas une refonte. |
| **Dépôt** | Séparer dans le dépôt actuel | L'application vit dans le dossier **`app-communaute/`**, autonome : rien n'y dépend de `livrables/` et inversement. Le jour où tu voudras un dépôt dédié, ce dossier se déplace tel quel. |

### Ce qui reste ouvert

- **L'hébergement.** Le seul cas qui demandera un travail d'adaptation est un hébergeur « plateforme » sans disque persistant : il faudra alors passer la base sur PostgreSQL et les images sur un stockage objet. C'est prévu par l'architecture (les deux sont derrière une interface), et simple tant qu'il n'y a pas de données réelles à migrer. D'où l'intérêt de décider avant la mise en production.
- **L'aperçu des liens partagés.** Tu n'as pas tranché ce point. Je suis la spec : par défaut, un lien collé dans WhatsApp ou Teams affiche le titre, le résumé et l'image du contenu, donc ces trois éléments sont lisibles par quiconque possède le lien, même sans compte. Le contenu lui-même reste réservé aux membres. Un réglage dans les paramètres permet de passer à un aperçu neutre (nom de la communauté seulement).

---

## 4. Hypothèses que je retiens sauf avis contraire

| # | Sujet | Hypothèse |
|---|---|---|
| H1 | **Premier compte** | À la première ouverture d'une installation neuve, un écran crée le compte administrateur. Il est protégé par un code d'installation défini au déploiement, pour qu'un inconnu ne puisse pas s'approprier une installation fraîche. |
| H2 | **Modes de quiz** | Chaque quiz indique les modes autorisés (entraînement, évaluation, ou les deux). Si les deux sont autorisés, le lecteur choisit. |
| H3 | **Score** | 1 point par question. Pour un choix multiple : le point est acquis seulement si toutes les bonnes réponses, et elles seules, sont cochées. |
| H4 | **Correction côté serveur** | Les bonnes réponses ne sont jamais envoyées au navigateur avant que le lecteur ait répondu. |
| H5 | **Actualité « programmée »** | Ce n'est pas un état à faire basculer par une tâche planifiée : une actualité publiée dont la date de publication est dans le futur est simplement invisible des lecteurs jusqu'à cette date. Même logique pour l'expiration. Plus fiable, et indépendant de l'hébergement. |
| H6 | **Badge « Nouveau »** | Il impose de mémoriser, par membre, les actualités ouvertes. Cette information reste strictement privée (jamais visible d'un éditeur) et disparaît avec le compte. |
| H7 | **Contenu riche** | Stocké en **Markdown**. C'est lisible dans un pack, compatible avec l'import de fichiers Markdown, et l'éditeur visuel le produit sans que l'éditeur ait à le voir. |
| H8 | **Adresses stables** | L'identifiant d'un contenu dans l'adresse (ex. `/actualites/reunion-du-12`) est figé à la création ; modifier le titre ne casse pas les liens déjà partagés. |
| H9 | **Page « Mes données »** | Livrée dès la V1 (phase 7) : la V1 stocke déjà des données personnelles (compte, résultats de quiz). |
| H10 | **Éditeurs par étapes** | Les phases 3 à 5 livrent le côté lecteur avec des formulaires d'administration simples ; l'éditeur visuel, la médiathèque et les imports arrivent en phase 6, comme prévu par la spec. |

---

## 5. Stack technique et hébergement

### Mon avis sur la stack proposée
**Je la conserve.** Next.js + TypeScript + Tailwind + Prisma est l'une des combinaisons les mieux documentées : pour un non-développeur qui maintient avec de l'aide, la quantité d'exemples disponibles compte plus que l'élégance d'une alternative. Je n'ai pas d'alternative plus simple à proposer pour ce périmètre.

Trois ajustements, à valider :

1. **Base de données : SQLite.** Avec une installation par communauté, la base est un simple fichier dans le dossier de données. Sauvegarder une communauté, c'est copier son dossier ; il n'y a pas de serveur de base de données à administrer. À savoir : avec Prisma, le fichier de schéma désigne **un seul** type de base, et en changer demande de régénérer les fichiers de migration. Je n'utiliserai donc que des fonctions communes à SQLite et PostgreSQL, pour que ce passage reste possible si l'hébergement retenu l'impose (§ 3).
2. **Authentification.** Identifiant + mot de passe en V1, avec une table de comptes prête à accueillir Microsoft 365 (Entra ID) plus tard, sans migration des utilisateurs. **Décision prise en phase 2** : vérification faite, la bibliothèque Auth.js citée en exemple dans la spec est toujours en version « bêta » pour sa génération actuelle et n'évolue plus. La connexion est donc écrite directement dans l'application (`src/core/auth/`, environ 300 lignes commentées, sans bibliothèque externe) : mots de passe chiffrés par un algorithme fourni par Node.js, sessions enregistrées en base. C'est plus stable dans le temps qu'une dépendance, et un compte désactivé est déconnecté immédiatement. Le jour où Microsoft 365 sera branché, une bibliothèque dédiée à ce protocole sera ajoutée pour cette seule étape.
3. **E-mail.** Envoi par le protocole standard SMTP, accepté par tous les fournisseurs (y compris Microsoft 365 et les fournisseurs français). En développement, les e-mails sont écrits dans un dossier local au lieu d'être envoyés.

### Dépendances prévues (liste courte, chacune justifiée)

| Besoin | Outil envisagé | Pourquoi ne pas l'écrire à la main |
|---|---|---|
| Éditeur visuel avec bascule Markdown | Tiptap | Un éditeur de texte riche est un projet en soi |
| Affichage du Markdown | react-markdown | Rendu sûr (pas de HTML injecté) |
| Validation des données (formulaires, imports, packs) | Zod | Messages d'erreur précis « ligne 12, colonne difficulté » |
| Glisser-déposer (catégories, blocs d'accueil) | dnd-kit | Accessibilité clavier incluse |
| Lecture/écriture de .zip | fflate | Format binaire |
| Lecture de CSV | Papa Parse | Guillemets, séparateurs, encodages |
| Envoi d'e-mails | Nodemailer | Protocole SMTP |
| Tests | Vitest + Playwright | Standards de l'écosystème |

Les versions exactes seront vérifiées en phase 2. Tout ajout ultérieur sera justifié de la même façon.

### Contraintes liées à l'hébergement

L'hébergement reste à choisir (§ 3). Pour mémoire, les trois familles possibles :

| Option | Ajouter une communauté | Tâches planifiées et quiz en direct | Effort d'exploitation |
|---|---|---|---|
| **Serveur Docker** (serveur virtuel en Europe ou serveur interne) qui héberge toutes les communautés, chacune avec son dossier de données et son adresse | Une commande ; coût supplémentaire quasi nul | Simples | Moyen : mises à jour et sauvegardes du serveur à ta charge |
| **Hébergeur « plateforme » français** (type Clever Cloud ou Scalingo) | Une nouvelle application chez l'hébergeur, facturée | Simples | Faible : pas de serveur à administrer. Peut imposer PostgreSQL et un stockage objet |
| **Vercel** | Nouveau projet + base + stockage | Demandent des contournements | Faible, mais 3 services externes par communauté. **Déconseillé pour ce projet** |

**Tâches planifiées (lots 2 et 4).** Les tâches à exécuter sont enregistrées en base (« envoyer le récapitulatif lundi à 8 h »). Un point d'entrée unique, protégé par un secret, exécute celles qui sont arrivées à échéance. Il suffit que « quelque chose » l'appelle toutes les minutes : une minuterie interne si l'application tourne en continu, ou le planificateur de l'hébergeur sinon. Le reste du code ignore qui déclenche. En V1, aucune fonctionnalité visible n'en dépend (voir H5) : le mécanisme est posé et testé, et sert à purger le journal d'activité.

**Temps réel (quiz en direct, lot 3).** Sur une application qui tourne en continu, le serveur garde une connexion ouverte avec chaque téléphone et y pousse les événements (technique standard des navigateurs, sans service supplémentaire) ; 30 participants ne posent aucune difficulté. Sur Vercel, cette connexion ne peut pas rester ouverte : il faut un service tiers ou des téléphones qui redemandent l'état toutes les 1–2 secondes. Je détaillerai et ferai valider la solution au cadrage du lot 3, comme demandé.

**Médias.** Une seule interface (« enregistrer / lire / supprimer un fichier ») avec deux implémentations : dossier de données local, ou stockage objet compatible S3. Les images sont servies par l'application elle-même (`/media/…`), ce qui donne des adresses stables et respecte les droits d'accès.

**Mises à jour.** Les évolutions de structure de la base s'appliquent automatiquement au démarrage d'une installation. Mettre à jour une communauté = la redémarrer sur la nouvelle version du modèle ; ses données et son paramétrage sont conservés.

---

## 6. Architecture

### Trois couches

```
┌──────────────────────────────────────────────────────────────┐
│  CONFIGURATION DE LA COMMUNAUTÉ (données, réglées dans       │
│  l'interface)  identité · couleurs · vocabulaire ·           │
│  catégories · modules actifs et leurs réglages · contenus    │
└──────────────────────────────────────────────────────────────┘
                              ▲ lit la configuration
┌──────────────────────────────────────────────────────────────┐
│  MODULES (un dossier chacun, se déclarent dans le registre)  │
│  V1 : quiz · actualités · base de connaissance               │
│  Lots : tableau de bord, agenda, questions-réponses, …       │
└──────────────────────────────────────────────────────────────┘
                              ▲ s'enregistrent auprès du
┌──────────────────────────────────────────────────────────────┐
│  MOTEUR (ne connaît aucun module en particulier)             │
│  configuration · registre · droits · libellés et             │
│  vocabulaire · thème · recherche · journal d'activité ·      │
│  notifications · tâches planifiées · médias · liens de       │
│  partage · packs                                             │
└──────────────────────────────────────────────────────────────┘
```

Règle de dépendance : **un module peut utiliser le moteur ; le moteur n'importe jamais un module ; un module n'importe jamais un autre module.** Un test automatisé vérifiera cette règle en analysant les imports du code, pour qu'elle ne s'érode pas au fil des lots.

### Organisation des dossiers

```
app-communaute/            (le modèle)
├── prisma/schema/          un fichier de schéma par module + un pour le moteur
├── seed/packs/             les deux packs d'exemple (§ 9)
├── src/
│   ├── app/                les pages (fines : elles délèguent aux modules)
│   ├── core/               le moteur
│   └── modules/
│       ├── quiz/           déclaration · logique · écrans · libellés · pack · tests
│       ├── news/
│       └── knowledge/
├── modeles/                modele_questions.csv, modele_questions.json
├── README.md · CREER_UN_ESPACE.md · ANIMER_LA_COMMUNAUTE.md

(une installation)
└── donnees/                la base + les images de CETTE communauté
```

`CREER_UN_ESPACE.md` garde le nom demandé dans la spec ; il décrira « créer et paramétrer une nouvelle communauté ». Dis-moi si tu préfères le renommer.

### Adresses de l'application

| Adresse | Rôle |
|---|---|
| `/` | Accueil de la communauté |
| `/quiz/…`, `/actualites/…`, `/articles/…` | Pages des modules (redirigées vers l'accueil si le module est désactivé) |
| `/recherche` | Recherche globale |
| `/admin/…` | Administration : contenus, imports, médiathèque (éditeurs) ; paramètres, modules, utilisateurs, pack (administrateurs) |
| `/installation` | Assistant de première configuration |
| `/l/{code}` | Lien court traçable, qui redirige vers le contenu |
| `/mes-donnees` | Consultation, export et suppression de ses données |

Le segment d'adresse d'un module (`actualites`) reste fixe même si le vocabulaire le renomme « Infos syndic » : les liens déjà partagés ne cassent jamais.

### Mécanismes transverses

- **Droits.** Une fonction centrale répond à « cet utilisateur peut-il faire cette action ? ». Chaque module déclare ses actions ; elles n'existent que si le module est actif. « Prévisualiser comme un lecteur » fait répondre cette fonction comme si l'administrateur était lecteur, le temps de la prévisualisation.
- **Libellés et vocabulaire.** Tous les textes sont dans des fichiers de libellés, un par module. Un libellé peut contenir un terme variable (« Aucun {article.singulier} trouvé ») remplacé par le vocabulaire de la communauté, avec le terme par défaut en repli.
- **Thème.** Les couleurs choisies deviennent des variables de style ; les thèmes clair et sombre en sont dérivés automatiquement. L'assistant calcule le contraste (norme WCAG) et alerte si un texte devient peu lisible.
- **Recherche.** Chaque module fournit sa propre fonction de recherche ; le moteur interroge celles des modules actifs et fusionne les résultats. La comparaison ignore majuscules et accents. Chaque recherche est journalisée avec son nombre de résultats.
- **Référence de contenu.** Le journal d'activité, les liens de partage et, plus tard, les avis, réactions, ciblages et étapes de parcours doivent tous désigner « un contenu, quel que soit son module ». Ils le font par un couple *(type, identifiant)*, par exemple `news.item` + n° 42. Le registre sait transformer ce couple en titre, adresse et aperçu de partage. C'est ce qui permet à un lot d'ajouter un type de contenu sans toucher aux tables existantes.

### Créer une nouvelle communauté, pas à pas

1. **Créer une installation** du modèle chez l'hébergeur. C'est la seule étape hors interface ; elle sera décrite dans le README et réduite au minimum (une commande sur un serveur Docker, quelques clics chez un hébergeur « plateforme »).
2. **Ouvrir l'adresse** de la nouvelle installation et créer le compte administrateur (H1).
3. **Suivre l'assistant** : partir de zéro, ou importer un pack exporté depuis une autre communauté.
4. **Prévisualiser comme un lecteur**, puis **ouvrir** la communauté.

---

## 7. Registre de modules

Chaque module possède **un fichier de déclaration unique**. Voici ce qu'il y déclare, avec l'exemple de la base de connaissance, le cas le plus parlant :

| Rubrique | Sert à | Exemple : base de connaissance |
|---|---|---|
| Identité | Interrupteur dans l'assistant et les paramètres | clé `knowledge`, phrase d'explication, **désactivé par défaut** |
| Vocabulaire | Étape « Vocabulaire » de l'assistant | « Article / Articles » |
| Types de contenu | Références de contenu, adresses stables, aperçus de partage | `knowledge.article` |
| Entrées de menu | Menu lecteur | « Articles » |
| Blocs d'accueil | Étape « Page d'accueil » | « Derniers articles », « Catégories » |
| Écrans d'administration | Menu d'administration | liste et éditeur d'articles |
| Étapes d'assistant | Étapes supplémentaires de l'assistant | aucune en V1 |
| **Champs liés** | Champs que le module **ajoute** aux formulaires des autres | « Article lié » sur la question de quiz |
| Fournisseur de recherche | Recherche globale | titre, résumé, contenu, tags |
| Événements de notification | Service de notifications | « article publié » |
| Indicateurs | Tableau de bord (lot 1) | articles les plus et les moins consultés |
| Formats de partage | Modèles de messages (lot 4) | message « article » |
| Formats d'import | Écran d'import en masse | lot de fichiers Markdown ; colonne « article lié » ajoutée au modèle de questions |
| Sections de pack | Export / import .zip | dossier `articles/` |
| Tâches planifiées | Tâches du module | aucune en V1 |
| Données personnelles | Page « Mes données » | aucune (les articles ne sont pas des données personnelles) |
| Actions soumises aux droits | Contrôle par rôle | « rédiger un article » (éditeur) |
| Nécessite | Modules-extensions des lots | aucun |

Les six dernières rubriques ne figurent pas dans la spec : je les ajoute parce que sans elles, l'import, le pack, la page RGPD et les droits contiendraient des conditions par module, ce que la spec interdit.

### Ce qui se passe quand on désactive la base de connaissance

1. L'administrateur bascule l'interrupteur ; un message rappelle que les contenus sont conservés.
2. Une seule ligne change en base : « module `knowledge` : désactivé ». Aucun article n'est touché.
3. À la page suivante, le moteur demande au registre les modules actifs. La base de connaissance n'y étant plus, **ses déclarations ne sont plus lues** : plus d'entrée de menu, de bloc d'accueil, de résultats de recherche, de champ « article lié » dans le formulaire de question, de colonne dans le modèle d'import, d'écran d'administration.
4. Ses adresses redirigent vers l'accueil.
5. Réactivation : la ligne repasse à « activé », tout réapparaît, liens question → article compris.

Le formulaire de question, lui, ne sait rien des articles. Il affiche « les champs liés que les modules actifs me proposent » : zéro sur la communauté copropriété, un sur la communauté PeopleDoc, et d'autres demain sans modifier le quiz.

### Point à noter pour les lots : les modules-extensions
La spec dit qu'aucun module ne dépend d'un autre. Certaines fonctionnalités des lots sont pourtant, par nature, des prolongements : le quiz en direct n'a pas de sens sans quiz, les réactions sans actualités. La rubrique « Nécessite » couvre ce cas : l'interrupteur d'une extension n'est proposé que si son module hôte est actif. Les modules de la V1 n'en ont pas.

---

## 8. Modèle de données

Présentation par familles. Les noms techniques sont en anglais (convention du code) ; je donne la traduction. Une installation ne portant qu'une communauté, aucune table n'a besoin d'indiquer « à quel espace j'appartiens ».

### Configuration et utilisateurs

| Table | Contenu | Remarques |
|---|---|---|
| **Community** (configuration de la communauté) | nom, sous-titre, statut en préparation/ouverte, logo, favicon, thème, vocabulaire, page d'accueil, réglages (aperçu de partage, durée de conservation du journal…), étape en cours de l'assistant | **Une seule ligne.** Thème, vocabulaire et page d'accueil sont des blocs de configuration structurés |
| **ModuleState** (état d'un module) | clé du module, activé oui/non, réglages du module | **Le cœur de la modularité** : une ligne par module |
| **User** (utilisateur) | e-mail, nom, mot de passe chiffré (facultatif), rôle (administrateur / éditeur / lecteur), indicateur « Expert », invitation en cours | Créé par un administrateur. Mot de passe facultatif pour accueillir plus tard les comptes Microsoft 365 |
| **Account** (compte externe) | fournisseur de connexion, identifiant chez ce fournisseur | Vide en V1 ; prêt pour Microsoft 365 |
| **Group** / **GroupMember** (groupe / membre) | groupe d'utilisateurs ; ses membres | Fondation du lot 2, sans interface en V1 |
| **Category** (catégorie) | nom, catégorie parente, position | 2 niveaux maximum ; partagée par tous les modules |
| **Tag** / **ContentTag** | mot-clé ; rattachement à un contenu | Rattachement par référence de contenu |
| **Media** (média) | nom de fichier, type, taille, texte alternatif, emplacement | Médiathèque |
| **ContentLink** (lien entre contenus) | contenu source, contenu cible, nature du lien | Porte « question → article lié » et « article → articles liés », sans que la table des questions connaisse les articles |

L'assistant enregistre chaque étape directement dans la configuration de la communauté (au statut « en préparation ») : la sauvegarde automatique et la reprise en découlent naturellement.

### Module Quiz

| Table | Contenu |
|---|---|
| **Question** | référence stable, type (choix unique / multiple / vrai-faux), énoncé, explication, difficulté 1 à 3, catégorie |
| **QuestionOption** (réponse proposée) | question, libellé, correcte oui/non, position |
| **Quiz** | identifiant d'adresse, titre, description, modes autorisés, composition manuelle ou par règles, statut |
| **QuizQuestion** | questions choisies à la main, dans l'ordre |
| **QuizRule** (règle de tirage) | catégorie, difficulté, nombre de questions |
| **QuizAttempt** (tentative) | quiz, utilisateur, mode, questions tirées et ordre de présentation, début, fin, score |
| **QuizAttemptAnswer** | tentative, question, réponses cochées, correcte oui/non |

La tentative mémorise le tirage et le mélange : recharger la page ne redistribue pas les questions.

### Module Actualités

| Table | Contenu |
|---|---|
| **NewsItem** (actualité) | identifiant d'adresse, titre, résumé, contenu, catégorie, statut (brouillon / publié / archivé), date de publication, date d'expiration, épinglée, image, auteur |
| **NewsRead** (lecture) | actualité, utilisateur, date — pour le badge « Nouveau » (voir H6) |

### Module Base de connaissance

| Table | Contenu |
|---|---|
| **Article** | identifiant d'adresse, titre, résumé, contenu, catégorie, statut, auteur, date de mise à jour |

Tags et articles liés passent par `ContentTag` et `ContentLink`.

### Fondations des lots

| Table | Contenu | Remarques |
|---|---|---|
| **ActivityEvent** (événement d'activité) | date, type (consultation, réponse de quiz, quiz terminé, recherche, clic sur lien partagé), contenu concerné, acteur **pseudonymisé**, détails (texte recherché, nombre de résultats…) | Voir encadré ci-dessous |
| **ShareLink** (lien de partage) | code court, contenu visé, canal, date | Les clics sont des événements d'activité |
| **Notification** | destinataire, canal, événement, contenu, statut (à envoyer / envoyée / en échec), date prévue | File d'attente du service de notifications |
| **Job** (tâche planifiée) | type, paramètres, échéance, récurrence, statut, dernière erreur | Voir § 5 |

> **Journal d'activité et RGPD.** Le journal n'enregistre pas « Marie Dupont a consulté telle actualité » mais « le membre `a3f9…` a consulté telle actualité » : un code technique calculé à partir du compte et d'un secret du serveur. Cela suffit pour compter des lecteurs uniques et mesurer la participation par groupe, sans qu'aucun écran ne puisse afficher qui a lu quoi. Par transparence : c'est de la **pseudonymisation**, pas de l'anonymisation au sens strict, tant que le compte existe. À la suppression du compte, ses événements deviennent définitivement non rattachables. Une tâche planifiée purge les événements plus anciens que la durée réglée dans les paramètres (12 mois par défaut, modifiable).

---

## 9. Format de pack

Le pack est ce qui te permet de **transporter un paramétrage d'une installation à une autre** : c'est l'outil de la duplication. C'est aussi une sauvegarde lisible de la configuration et des contenus.

```
ma-communaute.zip
├── pack.json           configuration de la communauté
├── questions.json      banque de questions            (facultatif)
├── quizzes.json        quiz                           (facultatif)
├── news/               une actualité par fichier .md  (facultatif)
├── articles/           un article par fichier .md     (facultatif)
└── media/              images + index.json            (facultatif)
```

À l'export, tu choisis **« configuration seule »** (pour démarrer une communauté voisine avec la même mise en forme) ou **« configuration + contenus »**.

**`pack.json`** contient : `formatVersion` (1 pour la V1), la date d'export, l'identité (nom, sous-titre, logo, favicon), le thème, le vocabulaire, la liste des modules avec leur état et leurs réglages, l'arborescence des catégories et la page d'accueil.

**Un article ou une actualité** est un fichier Markdown précédé d'un en-tête :

```markdown
---
title: Titre de l'article
summary: Résumé en une phrase
category: categorie-parente/sous-categorie
tags: [premier-tag, second-tag]
status: published
related: [autre-article]
---
[CONTENU D'EXEMPLE — À VALIDER] Texte de l'article…
```

**Une question** dans `questions.json` :

```json
{
  "ref": "q-001",
  "type": "single",
  "statement": "[CONTENU D'EXEMPLE — À VALIDER] Énoncé de la question",
  "options": [
    { "label": "Première réponse", "correct": true },
    { "label": "Seconde réponse", "correct": false }
  ],
  "explanation": "Explication qui se suffit à elle-même",
  "difficulty": 2,
  "category": "categorie-parente",
  "links": ["article:titre-de-l-article"]
}
```

### Règles du format

- **Références lisibles, jamais de numéros internes.** Une catégorie, un article, une question, une image sont désignés par leur identifiant stable. C'est ce qui rend possible l'export depuis une installation puis l'import à l'identique dans une autre, et la mise à jour d'une communauté existante.
- **Toutes les sections de contenu sont facultatives.** Le pack de la communauté copropriété n'a pas de dossier `articles/` et reste valide.
- **Chaque section appartient à un module**, qui déclare dans le registre comment l'exporter et l'importer. Les lots ajouteront les leurs (`events.json`, `polls.json`…).
- **Import en deux temps.** D'abord l'analyse et le résumé (créés, modifiés, inchangés, erreurs), puis la validation. Une mise à jour **ne supprime jamais** de contenu : ce qui existe dans la communauté mais pas dans le pack est conservé et signalé.
- **Module désactivé dans la communauté cible.** Ses contenus sont importés et restent masqués, avec un message explicite.
- **Section inconnue ou version plus récente.** Signalée et ignorée, sans bloquer le reste.
- **Aucune donnée personnelle.** Ni comptes, ni groupes, ni résultats, ni lectures, ni journal d'activité. Le **nom de l'auteur** d'un article est lui aussi exclu ; à l'import, l'auteur devient l'administrateur qui importe. Un test automatisé vérifiera l'absence de toute donnée personnelle dans un pack exporté.

### Les deux exemples sont deux packs
`peopledoc` et `copropriete` seront deux **dossiers de pack** rangés dans `seed/packs/`. Le script d'amorçage charge celui que tu désignes, par le même mécanisme que l'import depuis l'interface. Les termes métier ne figurent ainsi que dans des fichiers de données, jamais dans le code, et le format de pack est éprouvé dès la phase 2. En développement, une commande lance les deux communautés côte à côte (même code, deux dossiers de données) pour les comparer. Tous les contenus porteront la mention « [CONTENU D'EXEMPLE — À VALIDER] ».

---

## 10. Comment les lots se brancheront

| Lot | S'appuie sur les fondations V1 | Ajoute |
|---|---|---|
| 1 — Pilotage | Journal d'activité, indicateurs déclarés par chaque module | Module tableau de bord, module avis sur les contenus |
| 2 — Fidélisation | Notifications, tâches planifiées, groupes | Récapitulatif, accusé de lecture (extension des actualités), agenda, ciblage |
| 3 — Participation | Références de contenu, attribut Expert, catégories et tags | Questions-réponses, sondages, réactions et commentaires, quiz en direct (extension du quiz) |
| 4 — WhatsApp | Liens de partage, formats de partage, tâches planifiées | Modèles de messages, calendrier d'animation, question du jour, import de discussion |
| 5 — Progression | Références de contenu, tentatives de quiz | Parcours, attestations PDF, points et badges, classement |
| 6 — IA | Réglages par module (clé d'API propre à la communauté) | Génération de questions, analyse enrichie, marquage « à valider » |

Chaque lot = de nouveaux dossiers dans `modules/`, de nouvelles tables, de nouvelles sections de pack. Aucune modification de structure n'est attendue sur les tables de la V1. Quand un lot est livré, chaque installation en bénéficie à sa prochaine mise à jour, avec les nouveaux modules **désactivés par défaut**.

---

## 11. Points d'attention

1. **Créer une installation doit rester simple.** C'est la seule étape hors interface de ton parcours de duplication. Sa facilité dépend directement de l'hébergement, encore à choisir (§ 3) ; je la traiterai comme une fonctionnalité à part entière, documentée et testée.
2. **Ne pas laisser les installations diverger.** Un seul code, des données distinctes (§ 1). Si un jour une communauté a besoin d'un comportement spécifique, il devient un réglage ou un module, pas une copie modifiée du code.
3. **L'assistant, les éditeurs et les imports (phase 6) sont le plus gros morceau de la V1.** Je proposerai de les valider en deux ou trois démonstrations intermédiaires.
4. **Éditeur visuel et Markdown.** Le passage visuel ↔ Markdown doit conserver tableaux et images sans perte. Je le vérifierai sur un prototype au tout début de la phase 6.
5. **Aperçus de partage et communauté privée.** Titre, résumé et image visibles sans compte par défaut, réglable (§ 3).
6. **Discipline du registre.** La tentation d'écrire « si tel module est actif » dans le moteur reviendra à chaque lot. Deux garde-fous automatiques : le test des imports (§ 6) et un test qui, pour chaque module, l'active puis le désactive et vérifie menus, accueil, recherche, formulaires et adresses.

---

## 12. Suite : contenu de la phase 2

Après ta validation, la phase 2 (« Socle ») livrera :

- le projet installable en une commande, avec la base de données ;
- la création du compte administrateur à la première ouverture, la connexion par identifiant et mot de passe, les trois rôles ;
- la gestion des utilisateurs par l'administrateur : création d'un compte, lien d'invitation, changement de rôle, désactivation ;
- la configuration de la communauté (lecture, thème, vocabulaire, statuts en préparation/ouverte) ;
- le registre de modules et leur activation, avec trois modules « coquilles » (quiz, actualités, base de connaissance) qui n'affichent encore qu'une page vide, pour démontrer que menus, accueil et redirections suivent l'activation ;
- le journal d'activité, le service de notifications et les tâches planifiées (mécanismes posés et testés) ;
- la page d'accueil personnalisée ;
- le script d'amorçage avec les deux packs d'exemple (configuration seule à ce stade ; les contenus arrivent avec chaque module) et la commande qui lance les deux communautés côte à côte ;
- les premiers tests automatisés : droits par rôle, activation et désactivation de chaque module.

**Pour démarrer la phase 2**, il me faut seulement ton feu vert. Si un écart avec la spec (§ 2), une décision (§ 3) ou une hypothèse (§ 4) ne te convient pas, dis-le avant : c'est le moment où le corriger ne coûte rien.
