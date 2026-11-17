# Animer la communauté

Guide pratique de l'animateur (rôle **éditeur** ou **administrateur**).
Il décrit ce que permet la V1 ; la dernière partie annonce ce que les lots ajouteront.

## Sommaire

1. [Publier une actualité](#1-publier-une-actualité)
2. [Préparer un quiz](#2-préparer-un-quiz)
3. [Alimenter la base de connaissance](#3-alimenter-la-base-de-connaissance)
4. [Rédiger : l'éditeur et les images](#4-rédiger--léditeur-et-les-images)
5. [Partager un contenu](#5-partager-un-contenu)
6. [Savoir ce qui se passe](#6-savoir-ce-qui-se-passe)
7. [Bonnes pratiques](#7-bonnes-pratiques)
8. [Ce que les lots ajouteront](#8-ce-que-les-lots-ajouteront)

---

## 1. Publier une actualité

Administration › **Actualités** › « Nouveau ».

| Champ | Conseil |
|---|---|
| Titre | Court et précis. Il sert aussi d'aperçu quand le lien est partagé. |
| Résumé | Une ou deux phrases : c'est ce que l'on lit dans la liste et dans l'aperçu d'un lien. |
| Contenu | Voir § 4. |
| Statut | *Brouillon* (invisible des lecteurs), *Publié*, *Archivé* (retiré sans être supprimé). |
| Date de publication | Vide : publication immédiate. Une date future **programme** la publication : elle se fera toute seule, à l'heure dite. |
| Date d'expiration | Facultative. Passé cette date, les lecteurs ne voient plus l'actualité. |
| Épingler | Maintient l'actualité en haut de la liste. |

Les lecteurs voient un badge **Nouveau** tant qu'ils n'ont pas ouvert l'actualité.
Dans la liste d'administration, la colonne « Lectures » donne un **nombre** de lecteurs ;
l'application ne montre jamais *qui* a lu.

« Voir la page » sur une actualité non publiée vous montre un **aperçu**, que les lecteurs
ne voient pas.

## 2. Préparer un quiz

Deux temps : alimenter la **banque de questions**, puis composer des **quiz**.

### La banque de questions

Administration › **Quiz** › « Banque ». Trois types de questions : choix unique, choix
multiple, vrai/faux. Pour chacune : l'énoncé, les réponses, la ou les bonnes réponses,
une **explication**, une difficulté (facile, moyen, difficile) et une catégorie.

- L'explication s'affiche avec la correction : rédigez-la pour qu'elle **se suffise à
  elle-même**.
- Choix multiple : le point n'est acquis que si le membre coche **toutes** les bonnes
  réponses, et elles seules.
- Pour créer beaucoup de questions d'un coup : Administration › Import en masse
  (voir [`CREER_UN_ESPACE.md`](CREER_UN_ESPACE.md), § 7).

### Les quiz

Administration › **Quiz** › « Nouveau ». Deux façons de composer :

- **À la main** : vous choisissez les questions et leur ordre de référence.
- **Par tirage** : vous posez des règles (« 3 questions faciles de telle catégorie »),
  et chaque passage tire des questions différentes. L'écran indique combien de questions
  correspondent à chaque règle.

Vous choisissez aussi les **modes** proposés aux membres :

- **Entraînement** : correction et explication après chaque question.
- **Évaluation** : score et correction détaillée à la fin seulement.

À chaque passage, l'ordre des questions et des réponses est **mélangé**. Chaque membre
retrouve ses résultats dans « Mes résultats » ; il est le seul à les voir.

## 3. Alimenter la base de connaissance

*Si le module est actif.* Administration › **Articles** › « Nouveau ».

- **Catégorie** et **mots-clés** aident les lecteurs à trouver l'article.
- **À lire aussi** : cochez les articles à proposer en bas de page.
- Un *brouillon* n'est visible que des éditeurs.
- La **date de mise à jour** affichée aux lecteurs ne change que si le texte change.

Depuis une question de quiz ou une actualité, le champ **Pour aller plus loin** permet de
pointer vers un article : le lien s'affiche avec la correction de la question, ou en bas
de l'actualité.

## 4. Rédiger : l'éditeur et les images

L'éditeur des actualités et des articles a trois onglets :

- **Visuel** : gras, italique, titres, listes, citation, lien, tableau, image.
- **Markdown** : le texte tel qu'il est enregistré. Utile pour coller un texte déjà mis
  en forme.
- **Aperçu** : le rendu exact que verront les lecteurs.

Pour insérer une image, ajoutez-la d'abord à la **médiathèque** (Administration ›
Médiathèque), en renseignant son **texte alternatif** (la description lue aux personnes
qui ne voient pas l'image). Le bouton « Image » de l'éditeur propose ensuite les images
de la médiathèque.

## 5. Partager un contenu

Sur la page d'une actualité, d'un quiz ou d'un article : **Partager** affiche un lien
court à copier, que vous collez où vous voulez (messagerie, e-mail, groupe WhatsApp).

- Collé dans une messagerie, le lien affiche un **aperçu** : titre, résumé et une image
  aux couleurs de la communauté.
- Le contenu reste **réservé aux membres** : la personne qui clique se connecte, puis
  arrive sur la page.
- Chaque clic est compté dans le journal d'activité.

Si les titres ne doivent pas être visibles hors de la communauté, un administrateur peut
choisir un **aperçu neutre** (Paramètres › Autres réglages) : seul le nom de la communauté
apparaît alors.

## 6. Savoir ce qui se passe

La V1 enregistre déjà, sous pseudonyme, tout ce dont le tableau de bord aura besoin :
connexions, consultations, réponses aux quiz, recherches (y compris **celles qui ne
donnent aucun résultat**), clics sur les liens partagés.

En attendant le tableau de bord du lot 1, un administrateur peut consulter Administration ›
**État technique** : nombre d'événements par type sur 30 jours, derniers événements, état
des tâches planifiées et des e-mails.

## 7. Bonnes pratiques

- **Un rythme régulier** vaut mieux qu'une salve : une actualité par semaine, un quiz
  par mois, par exemple.
- **Programmez** vos publications à l'avance plutôt que de publier à la dernière minute.
- **Épinglez peu** : une ou deux actualités, sinon plus rien ne ressort.
- **Archivez** ce qui est périmé, ou donnez une date d'expiration dès la rédaction.
- **Soignez les résumés** : ils font l'aperçu des liens partagés et les résultats de recherche.
- **Relisez en aperçu lecteur** avant d'annoncer un nouveau contenu.

## 8. Ce que les lots ajouteront

Ce guide sera complété à chaque lot.

| Lot | Pour l'animateur |
|---|---|
| 1 — Pilotage | Tableau de bord : taux de lecture, contenus les plus et les moins consultés, questions les plus ratées, recherches sans résultat, avis des lecteurs. |
| 2 — Fidélisation | Récapitulatif par e-mail, accusé de lecture, agenda d'événements, groupes et ciblage. |
| 3 — Participation | Questions-réponses, sondages, réactions et commentaires, quiz en direct. |
| 4 — WhatsApp | Messages prêts à partager, calendrier d'animation, question du jour, récupération du savoir du groupe. |
| 5 — Progression | Parcours d'apprentissage, attestations, badges et classement. |
| 6 — Assistance IA | Génération de questions à valider (facultative). |
