# Contexte

Je suis consultant SIRH chez Magari Conseil. Je débute en développement mais je suis à l'aise avec la formulation de besoins. Explique tes choix techniques simplement et commente le code pour qu'un non-développeur puisse le maintenir.

Je veux une application web d'animation de communauté et de partage de connaissances, réutilisable sur n'importe quel domaine métier. Première thématique : **PeopleDoc (UKG HRSD)**. Thématique suivante prévue : **les syndicats de copropriété**. Passer d'une thématique à l'autre, ou en créer une nouvelle, ne doit demander AUCUNE modification de code ni AUCUNE édition manuelle de fichier : tout se fait depuis l'interface de l'application.

# Périmètre et découpage

Le projet est livré en deux temps :
- **V1 — Socle** : base de connaissance (optionnelle), quiz, actualités, recherche globale, administration et atelier d'espaces.
- **Lots fonctionnels 1 à 6**, développés après la V1, un par un : pilotage, fidélisation, participation, animation WhatsApp, progression, assistance IA.

Ne développe aucun lot avant que la V1 soit validée. Mais conçois la V1 pour que les lots puissent s'y brancher sans refonte (voir « Fondations à prévoir dès la V1 »).

# Principes d'architecture

## Moteur générique + espaces thématiques
- Le **moteur** contient toute la logique.
- Un **espace** correspond à une thématique : identité visuelle, vocabulaire, catégories, modules activés, contenus, paramètres de chaque module.
- Les espaces et leurs contenus sont stockés **en base de données** : c'est la source de vérité. Un « pack » n'est qu'un format d'échange (export, import, sauvegarde).
- La V1 peut fonctionner avec un seul espace publié, mais rien dans le code ne doit supposer qu'il n'y en a qu'un.
- Aucun terme métier (« PeopleDoc », « copropriété », « salarié », « syndic »…) ne doit apparaître en dur dans le code.

## Modularité
C'est une exigence structurante, valable pour la V1 comme pour tous les lots.

- **Chaque module est activable ou désactivable par espace**, avec au moins un module actif. Par défaut à la création d'un espace : quiz et actualités actifs, tous les autres désactivés.
- **La base de connaissance est optionnelle** : de nombreux espaces n'en auront pas besoin. Un espace sans base de connaissance doit être aussi complet et soigné qu'un espace qui en a une, et pas une version dégradée.
- Aucun module ne dépend d'un autre pour fonctionner. Les liens entre modules (une question de quiz qui renvoie vers un article, une réponse de questions-réponses transformée en article…) sont des **compléments optionnels**, proposés seulement si le module cible est actif.
- Quand un module est désactivé, il disparaît **partout** :
  - côté lecteur : menu, page d'accueil, recherche, liens croisés, notifications ; ses routes redirigent vers l'accueil ;
  - côté administration : menus, éditeurs, champs de formulaires qui s'y rapportent, étapes de l'assistant, colonnes d'import, indicateurs du tableau de bord.
- Désactiver un module **conserve** ses contenus et données. Le réactiver les restaure à l'identique.
- Les **catégories** sont propres à l'espace et partagées par tous les modules.
- **Registre de modules** : chaque module déclare lui-même, à un seul endroit, ses entrées de menu, ses blocs d'accueil, ses écrans d'administration, ses étapes d'assistant, ses champs liés dans les autres modules, ses fournisseurs de recherche, ses événements de notification, ses indicateurs de tableau de bord et ses formats de partage. L'activation ou la désactivation d'un module ne doit exiger aucune condition dispersée dans le reste du code.

## Fondations à prévoir dès la V1
Ces éléments sont posés dès la V1, même si leur exploitation complète arrive avec les lots :
- **Journal d'activité** : consultations de contenus, réponses aux quiz, recherches (y compris celles sans résultat), clics sur les liens partagés. Les données doivent s'accumuler dès la mise en service pour que le tableau de bord du lot 1 ait un historique.
- **Groupes d'utilisateurs** dans le modèle de données (ex. un client, un bâtiment de copropriété), sans interface de ciblage en V1.
- **Service de notifications** abstrait (e-mail en premier, autres canaux possibles plus tard) et **tâches planifiées** (publications programmées, rappels, récapitulatifs).
- **Pages partageables** : chaque contenu possède une URL stable et des métadonnées Open Graph (titre, description, image) pour afficher un bel aperçu quand le lien est collé dans WhatsApp, Teams ou un e-mail.

# Rôles

- **Administrateur** : tout, y compris créer, configurer, dupliquer, exporter et supprimer des espaces, et gérer les utilisateurs et groupes.
- **Éditeur** : contenus et animation de l'espace, uniquement pour les modules actifs.
- **Lecteur** : consultation, quiz, participation.
- Un utilisateur peut avoir des rôles différents selon les espaces.
- Un attribut **« Expert »** attribuable par espace (utilisé par le lot 3).

---

# V1 — SOCLE

## 1. Base de connaissance (optionnelle)
- Articles avec titre, résumé, contenu riche, catégorie, tags, date de mise à jour, auteur.
- Catégories sur deux niveaux maximum.
- Articles liés affichés en bas de chaque article.

## 2. Quiz
- Types de questions : choix unique, choix multiple, vrai/faux.
- Chaque question porte : énoncé, réponses, bonne(s) réponse(s), explication, difficulté (1 à 3), catégorie. L'explication se suffit à elle-même. Un lien vers un article est possible en option, uniquement si la base de connaissance est active.
- Un quiz est un ensemble de questions : sélection manuelle, ou règles de tirage aléatoire (catégorie, difficulté, nombre).
- Deux modes : **entraînement** (correction et explication après chaque question) et **évaluation** (score et correction détaillée à la fin).
- Ordre des questions et des réponses mélangé.
- Historique des résultats par utilisateur.

## 3. Actualités
- Titre, contenu riche, catégorie, date de publication, date d'expiration optionnelle.
- Statuts : brouillon, programmé, publié, archivé.
- Épinglage en haut de liste.
- Badge « Nouveau » sur les actualités non lues par l'utilisateur.

## 4. Recherche globale
- Une seule barre de recherche, qui couvre uniquement les modules actifs de l'espace.

## 5. Administration et atelier d'espaces

### Création d'un espace (assistant pas à pas)
Assistant en étapes, avec retour arrière et sauvegarde automatique. Le choix des modules intervient tôt pour que les étapes suivantes s'adaptent :
1. **Point de départ** : espace vierge, duplication d'un espace existant (configuration seule, ou configuration + contenus), ou import d'un pack (.zip).
2. **Modules** : interrupteurs pour chaque module disponible, avec une phrase expliquant à quoi il sert.
3. **Identité** : nom, sous-titre, logo, favicon.
4. **Apparence** : sélecteurs de couleurs, choix de police dans une liste, **aperçu en direct** (thèmes clair et sombre), alerte si un contraste est insuffisant.
5. **Vocabulaire** : termes de l'interface au singulier et au pluriel, limités aux modules actifs (ex. « Actualité » → « Info syndic », « Article » → « Fiche »).
6. **Catégories** : éditeur d'arborescence sur 2 niveaux, avec glisser-déposer.
7. **Page d'accueil** : texte d'accueil et blocs réorganisables, limités aux modules actifs.
8. **Récapitulatif** puis enregistrement.

Les modules et leurs paramètres restent modifiables à tout moment depuis les paramètres de l'espace. Avant une désactivation, un message rappelle que les contenus sont conservés.

### Cycle de vie d'un espace
- Statuts : **brouillon** (visible des administrateurs et éditeurs) et **publié**.
- Bouton « Prévisualiser comme un lecteur ».
- Sélecteur d'espace dans l'en-tête pour les administrateurs ; choix de l'espace par défaut.
- Suppression protégée par la saisie du nom de l'espace.

### Éditeurs de contenus
- **Articles** (si base de connaissance active) : éditeur visuel (gras, titres, listes, liens, tableaux, images) avec bascule Markdown, aperçu, catégorie, tags, articles liés.
- **Questions** : formulaire adapté au type, explication, difficulté, catégorie ; champ « article lié » seulement si la base de connaissance est active.
- **Quiz** : composition manuelle ou par règles de tirage.
- **Actualités** : éditeur visuel, programmation, épinglage.
- **Médiathèque** : téléversement et réutilisation des images de l'espace.

### Import en masse depuis l'interface
- Glisser-déposer d'un fichier CSV/JSON de questions, ou d'un lot de fichiers Markdown d'articles si la base de connaissance est active. La colonne « article lié » du modèle de questions est facultative.
- **Prévisualisation avant import** : ce qui sera créé, erreurs ligne par ligne, exclusion possible de lignes, puis confirmation.
- Modèles de fichiers téléchargeables depuis l'écran d'import.

### Export / import de pack
- Export d'un espace complet en un fichier .zip (configuration, contenus, médias) depuis l'interface.
- Import d'un .zip pour créer un espace ou mettre à jour un espace existant, avec résumé des changements avant validation.
- Toutes les sections de contenu du pack sont facultatives (un pack sans articles est valide). Si un pack contient des contenus d'un module désactivé dans l'espace cible, ils sont importés mais restent masqués, et un message l'indique.
- Format lisible et versionné (champ `formatVersion`), documenté dans `CREER_UN_ESPACE.md`. Les lots ajouteront leurs propres sections au format.

---

# LOTS FONCTIONNELS (après validation de la V1)

Chaque fonctionnalité ci-dessous est un **module activable par espace**, soumis aux mêmes règles de modularité que la V1.

## Lot 1 — Pilotage de l'animation

### Tableau de bord de l'animateur
- Taux de lecture des actualités, contenus les plus et les moins consultés.
- Questions de quiz les plus ratées (signalent un besoin de formation ou une question mal rédigée), avec accès direct à la question.
- **Recherches sans résultat**, regroupées et classées par fréquence, pour révéler les contenus manquants.
- Évolution de l'activité dans le temps, participation par groupe.
- Les indicateurs affichés dépendent des modules actifs.

### Retour sur les contenus
- « Ce contenu vous a-t-il aidé ? » (oui/non + commentaire facultatif) sur les articles et les actualités.
- Signalement automatique, dans le tableau de bord, des contenus mal notés et de ceux non mis à jour depuis une durée paramétrable.

## Lot 2 — Faire revenir les membres

### Notifications et récapitulatif e-mail
- Récapitulatif périodique (hebdomadaire ou mensuel, paramétrable par espace) des nouveaux contenus des modules actifs, aux couleurs de l'espace.
- Chaque utilisateur choisit sa fréquence ou se désabonne.

### Accusé de lecture
- Option « lecture à confirmer » sur une actualité : bouton « J'ai lu » pour le lecteur, suivi des confirmations et relance des retardataires pour l'éditeur.

### Agenda d'événements
- Événements (webinaire, atelier, assemblée générale…) avec date, lieu ou lien de visio, description, nombre de places.
- Inscription, liste d'attente, rappel automatique la veille, ajout au calendrier (fichier .ics compatible Outlook et Google).

### Groupes et ciblage
- Interface de gestion des groupes d'utilisateurs.
- Ciblage d'une actualité, d'un quiz, d'un événement ou d'un récapitulatif sur un ou plusieurs groupes.

## Lot 3 — Faire participer

### Questions-réponses communautaires
- Un membre pose une question (catégorie, tags) ; les membres et les experts répondent ; vote « utile » sur les réponses ; l'auteur ou un expert marque la meilleure réponse.
- Avant publication d'une question, suggestion des questions et articles similaires existants.
- Si la base de connaissance est active : bouton « Transformer en article » qui pré-remplit un brouillon à partir de la question et de la meilleure réponse.
- Modération : signalement, masquage, verrouillage d'un fil.

### Sondages
- Choix unique ou multiple, date de clôture, résultats visibles avant ou après le vote (paramétrable), vote anonyme ou nominatif.
- **Avertissement paramétrable par espace** affiché sur chaque sondage. Pour l'espace copropriété, texte par défaut : un sondage n'a qu'une valeur consultative et ne remplace pas un vote en assemblée générale.

### Réactions et commentaires
- Réactions (quelques emojis) et commentaires sur les actualités, activables séparément par espace, avec modération.

### Quiz en direct
- L'animateur lance une session à partir d'un quiz existant ; les participants rejoignent depuis leur téléphone avec un code ou un QR code, sans forcément avoir de compte.
- Écran projeté : question, minuteur, répartition des réponses, classement entre les questions.
- Choisis une solution temps réel compatible avec l'hébergement cible et explique-la avant de coder.

## Lot 4 — Animation du groupe WhatsApp

**Contrainte impérative** : aucun envoi automatique dans WhatsApp. L'API officielle de Meta ne permet pas de piloter un groupe communautaire existant, et les bibliothèques ou services non officiels qui automatisent un compte personnel exposent le numéro à un blocage. L'application **prépare** les messages ; l'animateur les **envoie lui-même** en un geste.

- **Bouton « Partager sur WhatsApp »** sur chaque actualité, quiz, article, événement et question de la communauté : génère un message mis en forme pour WhatsApp (*gras*, _italique_, emojis, lien) et ouvre WhatsApp avec le texte pré-rempli (lien `https://wa.me/?text=…`), sur mobile comme sur ordinateur. Bouton « Copier le message » en alternative.
- **Modèles de messages** par type de contenu, éditables dans l'administration de l'espace, avec aperçu du rendu WhatsApp.
- **Calendrier d'animation** : l'animateur définit un rythme (ex. question de la semaine le lundi, quiz le vendredi, rappel d'événement la veille). À chaque échéance, l'application lui envoie un rappel avec le message prêt à partager, et indique ce qui a été partagé ou non.
- **Question du jour** : tirée de la banque de quiz selon des règles (catégorie, difficulté, questions non encore utilisées). Le message WhatsApp contient la question, et la réponse avec son explication se découvre dans l'application. Pour les sondages natifs de WhatsApp, qui ne peuvent pas être pré-remplis, l'application affiche la question et les options prêtes à copier.
- **Suivi des clics** : chaque lien partagé est un lien court traçable ; le tableau de bord montre les publications WhatsApp qui ont amené le plus de visites.
- **Invitation au groupe** : lien d'invitation du groupe WhatsApp paramétrable par espace, affiché dans l'application avec un QR code.
- **Récupération du savoir du groupe** :
  - import du fichier texte produit par la fonction « Exporter la discussion » de WhatsApp (formats Android et iOS, français et anglais) ;
  - repérage des questions posées et des réponses apportées, regroupées par fil ;
  - propositions à valider une à une : entrée de questions-réponses (lot 3), article (si base de connaissance active), question de quiz ;
  - **RGPD** : noms et numéros anonymisés à l'affichage, fichier brut jamais conservé (supprimé après traitement), seuls les contenus validés sont enregistrés, rappel à l'écran d'informer les membres du groupe de cet usage.

## Lot 5 — Faire progresser

### Parcours d'apprentissage
- Suite ordonnée d'étapes (articles si la base de connaissance est active, quiz, actualités, événements), avec barre de progression et étapes éventuellement conditionnées à la réussite de la précédente.
- **Attestation de réussite** en PDF aux couleurs de l'espace, avec score et date.
- Suivi de la progression par l'animateur.

### Badges, points et classement
- Points et badges définis par espace (ex. premier quiz réussi, 5 réponses jugées utiles, parcours terminé).
- Classement **facultatif**, désactivable par espace, auquel chaque utilisateur choisit de participer ou non, avec possibilité d'apparaître sous pseudonyme.

## Lot 6 — Assistance IA (optionnelle, désactivée par défaut)

- Configuration par espace : activation et clé d'API Claude ; aucune fonctionnalité de l'application n'en dépend.
- **Génération de questions** à partir d'un article ou d'un texte collé : propositions de questions avec réponses et explications, toutes à valider avant enregistrement.
- **Analyse enrichie de l'export WhatsApp** (lot 4) : meilleure détection des questions/réponses et reformulation propre des propositions.
- Tout contenu généré est marqué « Généré par IA — à valider » jusqu'à sa validation par un éditeur.

---

# Format d'export d'un pack

Propose une structure lisible (par exemple `pack.json` + dossiers `articles/`, `news/`, `media/` + `questions.json`, le tout zippé) dans laquelle chaque section est facultative. Les données personnelles (résultats, votes, commentaires, inscriptions, historique d'activité) ne sont **jamais** exportées dans un pack : seuls la configuration et les contenus éditoriaux le sont.

# Contenu d'exemple

Crée un script d'amorçage qui alimente la base avec deux espaces aux configurations volontairement différentes :
- `peopledoc` : base de connaissance, quiz et actualités actifs ; 3 articles, 10 questions dont certaines liées à des articles, 2 quiz, 2 actualités ;
- `copropriete` : **base de connaissance désactivée et aucun article** ; 10 questions, 2 quiz, 2 actualités.

À chaque lot, complète ces deux espaces avec quelques données d'exemple du nouveau module.

**N'invente pas de faits métier présentés comme exacts.** Tout contenu d'exemple commence par la mention « [CONTENU D'EXEMPLE — À VALIDER] ». Je fournirai le vrai contenu.

# Données personnelles (RGPD)

- Page « Mes données » : consultation, export et suppression de son compte et de ses données.
- Statistiques du tableau de bord agrégées ; aucun suivi nominatif de la lecture, sauf pour les actualités à accusé de lecture.
- Durée de conservation du journal d'activité paramétrable.
- Hébergement des données dans l'Union européenne de préférence.

# Stack technique (proposition, ajustable)

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma avec SQLite en développement, migrable vers PostgreSQL en production
- Stockage des médias abstrait (disque local en développement, stockage objet possible en production)
- Authentification simple (par exemple Auth.js avec identifiant/mot de passe) ; prévoir que la connexion puisse passer plus tard par Microsoft 365
- Envoi d'e-mails via un fournisseur configurable
- Hébergement cible : [À COMPLÉTER — ex. Vercel, serveur interne, Docker]

Les tâches planifiées (lots 2 et 4) et le temps réel (quiz en direct, lot 3) dépendent de l'hébergement : dès la phase de cadrage, signale-moi les contraintes et propose des solutions adaptées. Si une alternative de stack te semble plus simple à maintenir pour un non-développeur, propose-la AVANT de coder et explique pourquoi.

# Contraintes générales

- Interface en français ; tous les libellés externalisés, sans texte en dur dans les composants, et surchargeables par le vocabulaire de l'espace.
- Responsive (ordinateur et mobile, le mobile étant prioritaire pour le quiz en direct et le partage WhatsApp), accessible (contrastes, navigation clavier, libellés ARIA).
- Thèmes clair et sombre construits à partir des couleurs de l'espace.
- Code organisé par module (`/modules/knowledge`, `/modules/quiz`, `/modules/news`, `/modules/dashboard`, `/modules/whatsapp`…), conformément au registre de modules.
- Pas de dépendance superflue.

# Méthode de travail

Travaille par phases et **attends ma validation à la fin de chaque phase**.

## V1
1. **Cadrage** : reformule le besoin, pose-moi tes questions (5 maximum, les plus structurantes), propose l'architecture, le modèle de données (y compris les fondations des lots), le registre de modules et le format de pack. Ne code rien à cette étape.
2. **Socle** : projet, base de données, authentification et rôles, espaces, registre et activation des modules, journal d'activité, page d'accueil personnalisée.
3. **Quiz**.
4. **Actualités**.
5. **Base de connaissance** (module optionnel), avec les liens optionnels depuis les questions. Elle est développée après les quiz et les actualités, pour garantir que l'application est complète sans elle.
6. **Atelier d'espaces** : assistant de création, éditeurs, médiathèque, imports avec prévisualisation, export/import .zip.
7. **Finitions V1** : recherche globale, pages partageables avec métadonnées Open Graph, tests, README, `CREER_UN_ESPACE.md`.

## Lots
Puis les lots 1 à 6, dans l'ordre, sauf si je te demande de le modifier. Pour chaque lot : un court cadrage (ce que tu vas faire, impacts sur l'existant, questions éventuelles), validation, développement, tests, mise à jour de la documentation.

À la fin de chaque phase ou lot, donne-moi : ce qui a été fait, comment le tester moi-même pas à pas, et ce qui reste à faire.

# Critères d'acceptation

## V1
- L'espace `copropriete`, sans base de connaissance, est entièrement fonctionnel : aucune mention, aucun menu, aucun champ, aucune étape d'assistant, aucun lien ni aucune erreur liés aux articles, côté lecteur comme côté administration.
- Activer la base de connaissance sur `copropriete` la fait apparaître partout ; la désactiver la fait disparaître sans perte de contenu.
- Basculer de `peopledoc` à `copropriete` change le nom, le logo, les couleurs, le vocabulaire, les catégories, les modules et les contenus, sans aucune modification de code.
- Un administrateur crée un espace complet uniquement depuis l'interface, le prévisualise puis le publie.
- Un espace exporté puis réimporté sous un autre nom est identique à l'original, avec ou sans articles, et le pack ne contient aucune donnée personnelle.
- Un éditeur ne peut pas modifier la configuration de l'espace.
- Un CSV de questions conforme, avec ou sans colonne « article lié », s'importe sans erreur ; un fichier non conforme renvoie un message clair indiquant la ligne fautive.
- Le journal d'activité enregistre consultations, réponses aux quiz et recherches sans résultat.

## Lots
- Chaque module des lots s'active et se désactive par espace sans erreur ni lien mort, et fonctionne sur `copropriete` sans base de connaissance.
- Lot 1 : une recherche sans résultat apparaît dans le tableau de bord ; une question ratée par la majorité des participants y est signalée.
- Lot 2 : un utilisateur désabonné ne reçoit plus le récapitulatif ; une actualité ciblée n'est visible que du groupe concerné.
- Lot 3 : l'avertissement de sondage paramétré s'affiche sur l'espace copropriété ; une session de quiz en direct fonctionne avec au moins 30 participants simultanés sur téléphone.
- Lot 4 : aucun message n'est envoyé dans WhatsApp sans action manuelle de l'animateur ; un export de discussion WhatsApp réel s'importe, les propositions sont anonymisées et le fichier brut n'est pas conservé.
- Lot 5 : une attestation PDF est générée à la fin d'un parcours ; un utilisateur qui refuse le classement n'y apparaît pas.
- Lot 6 : l'application fonctionne intégralement sans clé d'API ; aucun contenu généré n'est publié sans validation.

## Tests automatisés
Au minimum : activation et désactivation de chaque module, fonctionnement d'un espace sans base de connaissance, calcul du score d'un quiz, droits par rôle, export/import d'un espace, ciblage par groupe, analyse d'un export WhatsApp d'exemple.

# Livrables

- Le code source complet.
- `README.md` : installation, lancement, déploiement, configuration (e-mail, tâches planifiées, clé d'API facultative).
- `CREER_UN_ESPACE.md` : guide pour un non-développeur, enrichi à chaque lot.
- `ANIMER_LA_COMMUNAUTE.md` : guide pratique de l'animateur (tableau de bord, calendrier d'animation, partage WhatsApp, quiz en direct).
- Modèles d'import (`modele_questions.csv`, `modele_questions.json`).
