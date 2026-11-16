# Cadrage — Phase 1 de la V1

> Document de cadrage rédigé à partir de `SPEC.md`. **Aucun code n'a été écrit à cette étape.**
> Statut : en attente de ta validation et de tes réponses aux 5 questions (§ 2).

## Sommaire

1. [Ce que j'ai compris](#1-ce-que-jai-compris)
2. [Mes 5 questions](#2-mes-5-questions)
3. [Hypothèses que je retiens sauf avis contraire](#3-hypothèses-que-je-retiens-sauf-avis-contraire)
4. [Stack technique et hébergement](#4-stack-technique-et-hébergement)
5. [Architecture](#5-architecture)
6. [Registre de modules](#6-registre-de-modules)
7. [Modèle de données](#7-modèle-de-données)
8. [Format de pack](#8-format-de-pack)
9. [Comment les lots se brancheront](#9-comment-les-lots-se-brancheront)
10. [Points d'attention](#10-points-dattention)
11. [Suite : contenu de la phase 2](#11-suite--contenu-de-la-phase-2)

---

## 1. Ce que j'ai compris

Tu veux **une seule application** capable d'animer plusieurs communautés, chacune sur son propre sujet. L'application ne « connaît » aucun métier : elle fournit des briques (quiz, actualités, base de connaissance, puis les modules des lots), et chaque **espace** choisit ses briques, ses couleurs, ses mots et ses contenus.

Les trois exigences qui structurent tout le reste :

| Exigence | Ce que cela implique concrètement |
|---|---|
| **Zéro code pour créer ou changer de thématique** | Tout ce qui distingue un espace d'un autre est une **donnée en base**, modifiable depuis l'interface. Aucun terme métier dans le code, y compris dans le script d'amorçage (voir § 8). |
| **Modules indépendants, activables par espace** | Chaque module se **déclare lui-même** dans un registre. Le moteur ne contient aucune condition du type « si la base de connaissance est active » : il demande au registre la liste des modules actifs et construit menus, accueil, recherche, formulaires et imports à partir de cette liste. |
| **Un espace sans base de connaissance est un espace complet** | La base de connaissance est développée **après** quiz et actualités, et les liens vers les articles sont des compléments apportés par le module « base de connaissance », pas des champs prévus dans le quiz. |

Le projet avance en deux temps : la **V1** (socle, 7 phases validées une à une), puis **6 lots** qui s'ajoutent sans refonte grâce à des fondations posées dès la V1 (journal d'activité, groupes, notifications, tâches planifiées, pages partageables).

---

## 2. Mes 5 questions

Pour chaque question je donne ma recommandation : tu peux répondre simplement « OK pour ta recommandation ».

### Q1 — Hébergement cible
C'est la question la plus structurante, car trois besoins en dépendent : les tâches planifiées, le quiz en direct et le stockage des images.

| Option | Tâches planifiées | Quiz en direct (lot 3) | Images | Effort d'exploitation |
|---|---|---|---|---|
| **A. Hébergeur « plateforme » français** (type Clever Cloud ou Scalingo) : l'application tourne en continu, la base PostgreSQL est gérée par l'hébergeur | Simples | Simple (connexion maintenue ouverte) | Stockage objet à brancher | Faible : pas de serveur à administrer |
| **B. Serveur Docker** (serveur virtuel en Europe ou serveur interne Magari) | Simples | Simple | Disque du serveur | Moyen : mises à jour et sauvegardes à ta charge |
| **C. Vercel** | Possibles mais limitées (service de planification de Vercel) | Nécessite un service tiers, ou un rafraîchissement toutes les 1–2 secondes | Stockage objet obligatoire | Faible, mais 3 services externes à gérer |

**Ma recommandation : A ou B**, c'est-à-dire une application qui tourne en continu. Je livrerai dans tous les cas une image Docker, qui fonctionne sur A, sur B et sur un serveur interne. Je déconseille C pour ce projet : chaque besoin « temps réel » ou « planifié » y demande un contournement.
**Question : quelle option, et Magari dispose-t-il de quelqu'un pour administrer un serveur (ce qui départage A et B) ?**

### Q2 — Qui peut entrer, et comment obtient-on un compte ?
- Les espaces sont-ils **privés** (compte obligatoire pour lire) ou certains peuvent-ils être **publics** ?
- Comment un membre obtient-il son compte : **invitation** par un administrateur, **lien d'inscription** propre à l'espace, ou les deux ?

Point lié, à trancher maintenant : pour qu'un lien collé dans WhatsApp affiche un bel aperçu, WhatsApp doit pouvoir lire le titre, le résumé et l'image **sans être connecté**. Sur un espace privé, cela veut dire que le titre et le résumé d'un contenu sont visibles par quiconque possède le lien (le contenu lui-même reste protégé).

**Ma recommandation** : espaces privés par défaut ; compte créé par invitation e-mail **ou** par lien d'inscription d'espace (pratique pour le diffuser dans le groupe WhatsApp) ; réglage par espace « aperçu de partage : titre + résumé / aperçu neutre (nom de l'espace seulement) ».

### Q3 — Une seule installation pour tout le monde ?
Les clients PeopleDoc et les copropriétaires seront-ils sur **la même installation** (une adresse, plusieurs espaces), ou prévois-tu **une installation par client ou par thématique** ? Et quel ordre de grandeur de membres par espace (dizaines, centaines, milliers) ?

**Ma recommandation** : une seule installation ; un membre ne voit que les espaces auxquels il appartient et ignore l'existence des autres. Les « clients » d'une même thématique sont des **groupes** dans l'espace (prévus dans le modèle dès la V1).

### Q4 — Les animateurs voient-ils les résultats de quiz nominatifs ?
La spec demande un historique des résultats **par utilisateur** et, en même temps, des statistiques **agrégées**. En V1, un éditeur doit-il pouvoir consulter « Untel a obtenu 6/10 » ?

**Ma recommandation** : non en V1. Chaque membre voit son propre historique ; les éditeurs voient des chiffres agrégés. Le suivi nominatif n'apparaît que là où la spec le prévoit explicitement (accusés de lecture du lot 2, parcours d'apprentissage du lot 5), avec information claire du membre.

### Q5 — Où ranger le code ?
Le dépôt actuel (`modeles-sirh-magari`) contient tes livrables DocGen (modèles Word et registres de tokens), sans rapport avec cette application.

**Ma recommandation** : un **dépôt dédié** à l'application (historique propre, déploiement plus simple). Si tu préfères rester ici, tout ira dans le dossier `app-communaute/`, où j'ai déjà rangé la spec et ce cadrage.

---

## 3. Hypothèses que je retiens sauf avis contraire

| # | Sujet | Hypothèse |
|---|---|---|
| H1 | **Rôles** | Le rôle (administrateur, éditeur, lecteur) est attribué **par espace**. S'y ajoute un indicateur « administrateur de la plateforme » sur le compte, seul habilité à créer ou supprimer des espaces et à gérer tous les utilisateurs. L'attribut « Expert » est une case à cocher par espace. |
| H2 | **Modes de quiz** | Chaque quiz indique les modes autorisés (entraînement, évaluation, ou les deux). Si les deux sont autorisés, le lecteur choisit. |
| H3 | **Score** | 1 point par question. Pour un choix multiple : le point est acquis seulement si toutes les bonnes réponses, et elles seules, sont cochées. |
| H4 | **Correction côté serveur** | Les bonnes réponses ne sont jamais envoyées au navigateur avant que le lecteur ait répondu. |
| H5 | **Actualité « programmée »** | Ce n'est pas un état à faire basculer par une tâche planifiée : une actualité publiée dont la date de publication est dans le futur est simplement invisible des lecteurs jusqu'à cette date. Même logique pour l'expiration. Plus fiable, et indépendant de l'hébergement. |
| H6 | **Badge « Nouveau »** | Il impose de mémoriser, par membre, les actualités ouvertes. Cette information reste strictement privée (jamais visible d'un éditeur) et disparaît avec le compte. |
| H7 | **Contenu riche** | Stocké en **Markdown**. C'est lisible dans un pack, compatible avec l'import de fichiers Markdown, et l'éditeur visuel le produit sans que l'éditeur ait à le voir. |
| H8 | **Adresses stables** | L'identifiant d'un contenu dans l'adresse (ex. `/e/copropriete/actualites/reunion-du-12`) est figé à la création ; modifier le titre ne casse pas les liens déjà partagés. |
| H9 | **Page « Mes données »** | Livrée dès la V1 (phase 7) : la V1 stocke déjà des données personnelles (compte, résultats de quiz). |
| H10 | **Éditeurs par étapes** | Les phases 3 à 5 livrent le côté lecteur avec des formulaires d'administration simples ; l'éditeur visuel, la médiathèque et les imports arrivent en phase 6, comme prévu par la spec. |

---

## 4. Stack technique et hébergement

### Mon avis sur la stack proposée
**Je la conserve.** Next.js + TypeScript + Tailwind + Prisma est aujourd'hui l'une des combinaisons les mieux documentées : pour un non-développeur qui maintient avec de l'aide, la quantité d'exemples et de réponses disponibles compte plus que l'élégance d'une alternative. Je n'ai pas d'alternative plus simple à proposer pour ce périmètre.

Trois ajustements, à valider :

1. **Base de données.** Avec Prisma, le fichier de schéma désigne **un seul** type de base. Passer de SQLite à PostgreSQL revient à changer une ligne et à régénérer les fichiers de migration : faisable, mais ce n'est pas transparent. Je m'engage donc à n'utiliser que des fonctions communes aux deux, et je propose de passer le développement sur PostgreSQL dès que l'hébergement est choisi (réponse Q1), pour ne pas découvrir d'écart le jour de la mise en production.
2. **Authentification.** Identifiant + mot de passe en V1, avec une table de comptes prête à accueillir Microsoft 365 (Entra ID) plus tard, sans migration des utilisateurs. La bibliothèque Auth.js convient sur le papier ; je vérifierai son état de maintenance au démarrage de la phase 2 et te signalerai tout écart **avant** d'installer quoi que ce soit.
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

**Tâches planifiées (lots 2 et 4).** Les tâches à exécuter sont enregistrées en base (« envoyer le récapitulatif de tel espace lundi à 8 h »). Un point d'entrée unique, protégé par un secret, exécute celles qui sont arrivées à échéance. Il suffit que « quelque chose » l'appelle toutes les minutes : une minuterie interne si l'application tourne en continu (options A et B), ou le planificateur de l'hébergeur (option C). Le reste du code ignore qui déclenche. En V1, aucune fonctionnalité visible n'en dépend (voir H5) : le mécanisme est posé et testé, et sert à purger le journal d'activité.

**Temps réel (quiz en direct, lot 3).** Sur une application qui tourne en continu, le serveur garde une connexion ouverte avec chaque téléphone et y pousse les événements (technique standard des navigateurs, sans service supplémentaire) ; 30 participants ne posent aucune difficulté. Sur Vercel, cette connexion ne peut pas rester ouverte : il faut un service tiers ou des téléphones qui redemandent l'état toutes les 1–2 secondes. Je détaillerai et ferai valider la solution au cadrage du lot 3, comme demandé.

**Médias.** Une seule interface (« enregistrer / lire / supprimer un fichier ») avec deux implémentations : disque local, ou stockage objet compatible S3. Les images sont servies par l'application elle-même (`/media/…`), ce qui donne des adresses stables et respecte les droits d'accès.

---

## 5. Architecture

### Trois couches

```
┌──────────────────────────────────────────────────────────────┐
│  ESPACES (données en base, tout se règle dans l'interface)   │
│  identité · couleurs · vocabulaire · catégories · modules    │
│  actifs et leurs réglages · contenus · membres · groupes     │
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
│  espaces · registre · droits · libellés et vocabulaire ·     │
│  thème · recherche · journal d'activité · notifications ·    │
│  tâches planifiées · médias · liens de partage · packs       │
└──────────────────────────────────────────────────────────────┘
```

Règle de dépendance : **un module peut utiliser le moteur ; le moteur n'importe jamais un module ; un module n'importe jamais un autre module.** Un test automatisé vérifiera cette règle en analysant les imports du code, pour qu'elle ne s'érode pas au fil des lots.

### Organisation des dossiers

```
app-communaute/
├── prisma/schema/          un fichier de schéma par module + un pour le moteur
├── seed/packs/             les deux packs d'exemple (voir § 8)
├── src/
│   ├── app/                les pages (fines : elles délèguent aux modules)
│   ├── core/               le moteur
│   └── modules/
│       ├── quiz/           déclaration · logique · écrans · libellés · pack · tests
│       ├── news/
│       └── knowledge/
├── modeles/                modele_questions.csv, modele_questions.json
├── README.md · CREER_UN_ESPACE.md · ANIMER_LA_COMMUNAUTE.md
```

### Adresses de l'application

| Adresse | Rôle |
|---|---|
| `/` | Redirige vers l'espace par défaut de l'utilisateur |
| `/e/{espace}` | Accueil de l'espace |
| `/e/{espace}/quiz/…`, `/actualites/…`, `/articles/…` | Pages des modules (redirigées vers l'accueil si le module est désactivé) |
| `/e/{espace}/recherche` | Recherche globale |
| `/e/{espace}/admin/…` | Administration de l'espace (contenus, paramètres, imports, pack) |
| `/atelier` | Plateforme : liste des espaces, assistant de création, utilisateurs |
| `/l/{code}` | Lien court traçable, qui redirige vers le contenu |
| `/mes-donnees` | Consultation, export et suppression de ses données |

L'espace figure dans l'adresse : c'est ce qui rend chaque lien partageable et ce qui garantit que rien ne suppose un espace unique. Le segment d'adresse d'un module (`actualites`) reste fixe même si le vocabulaire de l'espace le renomme « Infos syndic » : les liens déjà partagés ne cassent jamais.

### Mécanismes transverses

- **Droits.** Une fonction centrale répond à « cet utilisateur peut-il faire cette action dans cet espace ? ». Chaque module déclare ses actions ; elles n'existent que si le module est actif. « Prévisualiser comme un lecteur » fait répondre cette fonction comme si l'administrateur était lecteur, le temps de la prévisualisation.
- **Libellés et vocabulaire.** Tous les textes sont dans des fichiers de libellés, un par module. Un libellé peut contenir un terme variable (« Aucun {article.singulier} trouvé ») remplacé par le vocabulaire de l'espace, avec le terme par défaut en repli.
- **Thème.** Les couleurs de l'espace deviennent des variables de style ; les thèmes clair et sombre en sont dérivés automatiquement. L'assistant calcule le contraste (norme WCAG) et alerte si un texte devient peu lisible.
- **Recherche.** Chaque module fournit sa propre fonction de recherche ; le moteur interroge celles des modules actifs et fusionne les résultats. La comparaison ignore majuscules et accents. Chaque recherche est journalisée avec son nombre de résultats.
- **Référence de contenu.** Le journal d'activité, les liens de partage et, plus tard, les avis, réactions, ciblages et étapes de parcours doivent tous désigner « un contenu, quel que soit son module ». Ils le font par un couple *(type, identifiant)*, par exemple `news.item` + n° 42. Le registre sait transformer ce couple en titre, adresse et aperçu de partage. C'est ce qui permet à un lot d'ajouter un type de contenu sans toucher aux tables existantes.

---

## 6. Registre de modules

Chaque module possède **un fichier de déclaration unique**. Voici ce qu'il y déclare, avec l'exemple de la base de connaissance, le cas le plus parlant :

| Rubrique | Sert à | Exemple : base de connaissance |
|---|---|---|
| Identité | Interrupteur dans l'assistant et les paramètres | clé `knowledge`, phrase d'explication, **désactivé par défaut** |
| Vocabulaire | Étape « Vocabulaire » de l'assistant | « Article / Articles » |
| Types de contenu | Références de contenu, adresses stables, aperçus de partage | `knowledge.article` |
| Entrées de menu | Menu lecteur | « Articles » |
| Blocs d'accueil | Étape « Page d'accueil » | « Derniers articles », « Catégories » |
| Écrans d'administration | Menu d'administration de l'espace | liste et éditeur d'articles |
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
2. Une seule ligne change en base : « module `knowledge` de cet espace : désactivé ». Aucun article n'est touché.
3. À la page suivante, le moteur demande au registre les modules actifs. La base de connaissance n'y étant plus, **ses déclarations ne sont plus lues** : plus d'entrée de menu, de bloc d'accueil, de résultats de recherche, de champ « article lié » dans le formulaire de question, de colonne dans le modèle d'import, d'écran d'administration.
4. Ses adresses redirigent vers l'accueil.
5. Réactivation : la ligne repasse à « activé », tout réapparaît, liens question → article compris.

Le formulaire de question, lui, ne sait rien des articles. Il affiche « les champs liés que les modules actifs me proposent » : zéro aujourd'hui sur `copropriete`, un sur `peopledoc`, et d'autres demain sans modifier le quiz.

### Point à noter pour les lots : les modules-extensions
La spec dit qu'aucun module ne dépend d'un autre. Certaines fonctionnalités des lots sont pourtant, par nature, des prolongements : le quiz en direct n'a pas de sens sans quiz, les réactions sans actualités. La rubrique « Nécessite » couvre ce cas : l'interrupteur d'une extension n'est proposé que si son module hôte est actif. Les modules de la V1 n'en ont pas.

---

## 7. Modèle de données

Présentation par familles. Les noms techniques sont en anglais (convention du code) ; je donne la traduction.

### Plateforme et espaces

| Table | Contenu | Remarques |
|---|---|---|
| **User** (utilisateur) | e-mail, nom, mot de passe chiffré (facultatif), indicateur « administrateur de la plateforme », espace par défaut | Mot de passe facultatif pour accueillir plus tard les comptes Microsoft 365 |
| **Account** (compte externe) | fournisseur de connexion, identifiant chez ce fournisseur | Vide en V1 ; prêt pour Microsoft 365 |
| **Space** (espace) | identifiant d'adresse, nom, sous-titre, statut brouillon/publié, logo, favicon, thème, vocabulaire, page d'accueil, réglages (durée de conservation du journal, mode d'accès…), étape en cours de l'assistant | Thème, vocabulaire et page d'accueil sont des blocs de configuration structurés |
| **SpaceModule** (module d'un espace) | espace, clé du module, activé oui/non, réglages du module | **Le cœur de la modularité** : une ligne par module et par espace |
| **Membership** (appartenance) | utilisateur, espace, rôle, indicateur « Expert » | Permet des rôles différents selon les espaces |
| **Group** / **GroupMember** (groupe / membre) | groupe d'un espace ; ses membres | Fondation du lot 2, sans interface en V1 |
| **Category** (catégorie) | espace, nom, catégorie parente, position | 2 niveaux maximum ; partagée par tous les modules |
| **Tag** / **ContentTag** | mot-clé d'un espace ; rattachement à un contenu | Rattachement par référence de contenu |
| **Media** (média) | espace, nom de fichier, type, taille, texte alternatif, emplacement | Médiathèque |
| **ContentLink** (lien entre contenus) | contenu source, contenu cible, nature du lien | Porte « question → article lié » et « article → articles liés », sans que la table des questions connaisse les articles |

L'assistant de création n'a pas de table de brouillons séparée : dès l'étape 1, il crée un **véritable espace au statut brouillon** et y enregistre chaque étape. La sauvegarde automatique et la reprise en découlent naturellement.

### Module Quiz

| Table | Contenu |
|---|---|
| **Question** | espace, référence stable, type (choix unique / multiple / vrai-faux), énoncé, explication, difficulté 1 à 3, catégorie |
| **QuestionOption** (réponse proposée) | question, libellé, correcte oui/non, position |
| **Quiz** | espace, identifiant d'adresse, titre, description, modes autorisés, composition manuelle ou par règles, statut |
| **QuizQuestion** | questions choisies à la main, dans l'ordre |
| **QuizRule** (règle de tirage) | catégorie, difficulté, nombre de questions |
| **QuizAttempt** (tentative) | quiz, utilisateur, mode, questions tirées et ordre de présentation, début, fin, score |
| **QuizAttemptAnswer** | tentative, question, réponses cochées, correcte oui/non |

La tentative mémorise le tirage et le mélange : recharger la page ne redistribue pas les questions.

### Module Actualités

| Table | Contenu |
|---|---|
| **NewsItem** (actualité) | espace, identifiant d'adresse, titre, résumé, contenu, catégorie, statut (brouillon / publié / archivé), date de publication, date d'expiration, épinglée, image, auteur |
| **NewsRead** (lecture) | actualité, utilisateur, date — pour le badge « Nouveau » (voir H6) |

### Module Base de connaissance

| Table | Contenu |
|---|---|
| **Article** | espace, identifiant d'adresse, titre, résumé, contenu, catégorie, statut, auteur, date de mise à jour |

Tags et articles liés passent par `ContentTag` et `ContentLink`.

### Fondations des lots

| Table | Contenu | Remarques |
|---|---|---|
| **ActivityEvent** (événement d'activité) | espace, date, type (consultation, réponse de quiz, quiz terminé, recherche, clic sur lien partagé), contenu concerné, acteur **pseudonymisé**, détails (texte recherché, nombre de résultats…) | Voir encadré ci-dessous |
| **ShareLink** (lien de partage) | code court, contenu visé, canal, date | Les clics sont des événements d'activité |
| **Notification** | destinataire, canal, événement, contenu, statut (à envoyer / envoyée / en échec), date prévue | File d'attente du service de notifications |
| **Job** (tâche planifiée) | type, espace, paramètres, échéance, récurrence, statut, dernière erreur | Voir § 4 |

> **Journal d'activité et RGPD.** Le journal n'enregistre pas « Marie Dupont a consulté telle actualité » mais « le membre `a3f9…` a consulté telle actualité » : un code technique calculé à partir du compte et d'un secret du serveur. Cela suffit pour compter des lecteurs uniques et mesurer la participation par groupe, sans qu'aucun écran ne puisse afficher qui a lu quoi. Par transparence : c'est de la **pseudonymisation**, pas de l'anonymisation au sens strict, tant que le compte existe. À la suppression du compte, ses événements deviennent définitivement non rattachables. Une tâche planifiée purge les événements plus anciens que la durée réglée par espace (12 mois par défaut, modifiable).

---

## 8. Format de pack

Un pack est un fichier .zip lisible par un humain :

```
mon-espace.zip
├── pack.json           configuration de l'espace
├── questions.json      banque de questions            (facultatif)
├── quizzes.json        quiz                           (facultatif)
├── news/               une actualité par fichier .md  (facultatif)
├── articles/           un article par fichier .md     (facultatif)
└── media/              images + index.json            (facultatif)
```

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

- **Références lisibles, jamais de numéros internes.** Une catégorie, un article, une question, une image sont désignés par leur identifiant stable. C'est ce qui rend possible l'export puis réimport à l'identique sous un autre nom, et la mise à jour d'un espace existant.
- **Toutes les sections de contenu sont facultatives.** Le pack de `copropriete` n'a pas de dossier `articles/` et reste valide.
- **Chaque section appartient à un module**, qui déclare dans le registre comment l'exporter et l'importer. Les lots ajouteront les leurs (`events.json`, `polls.json`…).
- **Import en deux temps.** D'abord l'analyse et le résumé (créés, modifiés, inchangés, erreurs), puis la validation. Une mise à jour **ne supprime jamais** de contenu : ce qui existe dans l'espace mais pas dans le pack est conservé et signalé.
- **Module désactivé dans l'espace cible.** Ses contenus sont importés et restent masqués, avec un message explicite.
- **Section inconnue ou version plus récente.** Signalée et ignorée, sans bloquer le reste.
- **Aucune donnée personnelle.** Ni comptes, ni appartenances, ni groupes, ni résultats, ni lectures, ni journal d'activité. Le **nom de l'auteur** d'un article est lui aussi exclu ; à l'import, l'auteur devient l'administrateur qui importe. Un test automatisé vérifiera l'absence de toute donnée personnelle dans un pack exporté.

### Le script d'amorçage importe deux packs
Les espaces `peopledoc` et `copropriete` seront deux **dossiers de pack** rangés dans `seed/packs/`, chargés par le même mécanisme que l'import depuis l'interface. Double bénéfice : les termes métier ne figurent que dans des fichiers de données, jamais dans le code, et le format de pack est éprouvé dès la phase 2. Tous les contenus porteront la mention « [CONTENU D'EXEMPLE — À VALIDER] ».

---

## 9. Comment les lots se brancheront

| Lot | S'appuie sur les fondations V1 | Ajoute |
|---|---|---|
| 1 — Pilotage | Journal d'activité, indicateurs déclarés par chaque module | Module tableau de bord, module avis sur les contenus |
| 2 — Fidélisation | Notifications, tâches planifiées, groupes | Récapitulatif, accusé de lecture (extension des actualités), agenda, ciblage |
| 3 — Participation | Références de contenu, attribut Expert, catégories et tags | Questions-réponses, sondages, réactions et commentaires, quiz en direct (extension du quiz) |
| 4 — WhatsApp | Liens de partage, formats de partage, tâches planifiées | Modèles de messages, calendrier d'animation, question du jour, import de discussion |
| 5 — Progression | Références de contenu, tentatives de quiz | Parcours, attestations PDF, points et badges, classement |
| 6 — IA | Réglages par module (clé d'API par espace) | Génération de questions, analyse enrichie, marquage « à valider » |

Chaque lot = de nouveaux dossiers dans `modules/`, de nouvelles tables, de nouvelles sections de pack. Aucune modification de structure n'est attendue sur les tables de la V1.

---

## 10. Points d'attention

1. **L'atelier d'espaces (phase 6) est le plus gros morceau de la V1** : assistant en 8 étapes, éditeur visuel, médiathèque, imports avec prévisualisation, packs. Je proposerai de le valider en deux ou trois démonstrations intermédiaires plutôt qu'en une seule fois.
2. **Éditeur visuel et Markdown.** Le passage visuel ↔ Markdown doit conserver tableaux et images sans perte. Je le vérifierai sur un prototype au tout début de la phase 6, avant de construire les éditeurs dessus.
3. **Aperçus de partage et espaces privés.** Dépend de ta réponse à Q2.
4. **SQLite puis PostgreSQL.** Voir § 4 : le passage est prévu, mais il vaut mieux le faire tôt.
5. **Discipline du registre.** La tentation d'écrire « si tel module est actif » dans le moteur reviendra à chaque lot. Deux garde-fous automatiques : le test des imports (§ 5) et un test qui, pour chaque module, l'active puis le désactive et vérifie menus, accueil, recherche, formulaires et adresses.

---

## 11. Suite : contenu de la phase 2

Après ta validation, la phase 2 (« Socle ») livrera :

- le projet installable en une commande, avec la base de données ;
- la connexion par identifiant et mot de passe, les rôles par espace, l'administrateur de plateforme ;
- les espaces (lecture de la configuration, thème, vocabulaire, sélecteur d'espace, espace par défaut, statuts brouillon/publié) ;
- le registre de modules et l'activation par espace, avec trois modules « coquilles » (quiz, actualités, base de connaissance) qui n'affichent encore qu'une page vide, pour démontrer que menus, accueil et redirections suivent l'activation ;
- le journal d'activité, le service de notifications et les tâches planifiées (mécanismes posés et testés) ;
- la page d'accueil personnalisée par espace ;
- le script d'amorçage avec les deux espaces (configuration seule à ce stade ; les contenus arrivent avec chaque module) ;
- les premiers tests automatisés : droits par rôle, activation et désactivation de chaque module.

**Pour valider ce cadrage**, il me faut : tes réponses aux 5 questions (§ 2), ton accord ou tes corrections sur les hypothèses (§ 3), et tes remarques éventuelles sur le reste.
