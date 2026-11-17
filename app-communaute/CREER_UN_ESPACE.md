# Créer et paramétrer une communauté

Guide pour un non-développeur. Tout ce qui suit se fait **dans l'interface**, sans toucher
au code ni à un fichier.

> **Vocabulaire.** Une *installation* de l'application porte **une** communauté. Pour une
> nouvelle communauté, on lance une nouvelle installation du même code (voir le
> [README](README.md), « Ajouter une communauté »), puis on la paramètre comme ci-dessous.

## Sommaire

1. [Première ouverture](#1-première-ouverture)
2. [L'assistant de configuration](#2-lassistant-de-configuration)
3. [Les modules](#3-les-modules)
4. [Inviter les membres](#4-inviter-les-membres)
5. [Prévisualiser, puis ouvrir](#5-prévisualiser-puis-ouvrir)
6. [Dupliquer une communauté](#6-dupliquer-une-communauté)
7. [Importer des contenus en masse](#7-importer-des-contenus-en-masse)
8. [Le format de pack](#8-le-format-de-pack)
9. [Questions fréquentes](#9-questions-fréquentes)

---

## 1. Première ouverture

Ouvrez l'adresse de la nouvelle installation. L'écran **Installation** vous demande :

- le nom de la communauté ;
- votre nom, votre adresse e-mail et un mot de passe (10 caractères au minimum) ;
- le **code d'installation**, fixé au déploiement (il empêche un inconnu de s'approprier
  une installation neuve).

Vous devenez le premier **administrateur**, et l'assistant de configuration s'ouvre.

## 2. L'assistant de configuration

Huit étapes. **Chaque étape est enregistrée quand vous la quittez** : vous pouvez fermer
la page et reprendre plus tard (un bandeau « Reprendre l'assistant » vous y ramène).
Vous pouvez revenir en arrière à tout moment.

| Étape | Ce que vous y faites |
|---|---|
| **1. Point de départ** | Partir d'une communauté vierge, ou importer le pack `.zip` d'une autre communauté (voir § 6). |
| **2. Modules** | Activer les fonctionnalités voulues. Ce choix vient tôt, car il adapte les étapes suivantes. |
| **3. Identité** | Nom, sous-titre, logo, favicon (l'icône de l'onglet du navigateur). |
| **4. Apparence** | Deux couleurs et une police. L'aperçu en direct montre les thèmes clair et sombre ; une alerte s'affiche si une couleur est trop claire pour rester lisible. |
| **5. Vocabulaire** | Renommer les termes de l'interface, au singulier et au pluriel (ex. « Actualité » → « Info syndic »). Seuls les termes des modules actifs sont proposés. Un champ vide garde le terme par défaut. |
| **6. Catégories** | L'arborescence de classement, sur deux niveaux. On réordonne en glissant les lignes ou avec les flèches. |
| **7. Page d'accueil** | Le titre et le texte d'accueil, puis les blocs à afficher et leur ordre. Seuls les blocs des modules actifs sont proposés. |
| **8. Récapitulatif** | Vérifier, prévisualiser, terminer. |

Après l'assistant, **tout reste modifiable** : Administration › Paramètres donne accès aux
mêmes écrans, un par un.

## 3. Les modules

Un module est une fonctionnalité que l'on active ou non.

| Module | À quoi il sert | Par défaut |
|---|---|---|
| **Actualités** | Publier des informations datées : programmation, expiration, épinglage, badge « Nouveau ». | Activé |
| **Quiz** | Banque de questions et questionnaires, en entraînement ou en évaluation. | Activé |
| **Base de connaissance** | Contenus de référence classés par catégorie, avec mots-clés. | Désactivé |

Règles à connaître :

- Il faut **au moins un module actif**.
- **Désactiver un module ne supprime rien.** Ses contenus et ses réglages sont conservés ;
  ils réapparaissent à l'identique à la réactivation.
- Un module désactivé **disparaît partout** : menu, page d'accueil, recherche,
  administration, formulaires, modèles d'import. Ses adresses renvoient à l'accueil.
- La base de connaissance est **facultative**. Quand elle est active, elle ajoute un champ
  « Pour aller plus loin » aux questions de quiz et aux actualités, pour pointer vers un
  de ses contenus. Sans elle, ce champ n'existe pas.

## 4. Inviter les membres

Il n'y a pas d'inscription libre : c'est un administrateur qui crée chaque compte.

1. Administration › **Utilisateurs** › « Créer un compte » : nom, adresse e-mail, rôle.
2. Un **lien d'invitation** s'affiche (valable 7 jours). Il est envoyé par e-mail si
   l'envoi est configuré ; sinon, copiez-le et transmettez-le vous-même.
3. La personne ouvre le lien et choisit son mot de passe.

| Rôle | Ce qu'il peut faire |
|---|---|
| **Lecteur** | Consulter, passer les quiz. |
| **Éditeur** | En plus : créer et modifier les contenus des modules actifs, gérer la médiathèque, importer en masse. Il ne peut **pas** modifier la configuration. |
| **Administrateur** | En plus : configuration, modules, utilisateurs, export et import de packs. |

« Nouveau lien d'invitation » sert aussi quand quelqu'un a oublié son mot de passe.
« Désactiver » un compte déconnecte immédiatement la personne.
L'attribut **Expert** est déjà attribuable ; il servira aux questions-réponses (lot 3).

## 5. Prévisualiser, puis ouvrir

Une communauté neuve est **en préparation** : seuls les administrateurs et les éditeurs y
entrent ; un lecteur voit un message d'attente.

- **Prévisualiser comme un lecteur** (Paramètres, ou récapitulatif de l'assistant) :
  vous parcourez la communauté exactement comme un lecteur, sans l'administration.
  « Quitter l'aperçu » vous rend vos droits.
- **Ouvrir la communauté** (Paramètres › Statut) : tous les membres invités peuvent entrer.
  Vous pouvez la repasser en préparation à tout moment.

## 6. Dupliquer une communauté

Pour démarrer une communauté à partir d'une autre :

1. Dans la communauté d'origine : Administration › **Export et import** › Exporter.
   - *Configuration seule* : identité, apparence, vocabulaire, modules, catégories, page
     d'accueil.
   - *Configuration et contenus* : la même chose, plus les actualités, les questions, les
     quiz, les articles et les images.
2. Dans la nouvelle installation : étape 1 de l'assistant, **Importer un pack**.
3. L'application affiche un **résumé** de ce qui sera créé. Rien n'est modifié avant votre
   confirmation.
4. Ajustez ensuite le nom, les couleurs, le vocabulaire… dans les étapes suivantes.

Un pack ne contient **jamais** de données personnelles : ni comptes, ni résultats de quiz,
ni marques de lecture, ni journal d'activité, ni nom d'auteur.

Le même écran sert à **mettre à jour** une communauté existante à partir d'un pack :
les éléments connus sont mis à jour, les nouveaux créés, et **rien n'est jamais supprimé**.
Si le pack contient des contenus d'un module désactivé, ils sont importés mais restent
masqués, et un message le signale.

## 7. Importer des contenus en masse

Administration › **Import en masse**. L'écran ne propose que les imports des modules actifs.

1. Téléchargez le **modèle** proposé sur l'écran et remplissez-le.
2. Glissez votre fichier dans la zone prévue, puis « Analyser ».
3. La **prévisualisation** montre chaque ligne : ce qui sera créé ou mis à jour, et les
   erreurs avec leur numéro de ligne. Une ligne en erreur est refusée ; vous pouvez
   décocher celles que vous ne voulez pas importer.
4. « Confirmer l'import ».

### Questions (CSV ou JSON)

Modèles : [`modeles/modele_questions.csv`](modeles/modele_questions.csv) et
[`modeles/modele_questions.json`](modeles/modele_questions.json).

| Colonne | Contenu |
|---|---|
| `ref` | Référence de la question. Facultative. Si elle existe déjà, la question est **mise à jour** au lieu d'être créée. |
| `type` | `unique`, `multiple` ou `vrai_faux`. **Obligatoire.** |
| `enonce` | Le texte de la question. **Obligatoire.** |
| `reponse_1` … `reponse_8` | Les réponses proposées (2 au minimum), sauf pour un vrai/faux. |
| `bonnes_reponses` | Les numéros des bonnes réponses : `1`, ou `1,3` pour un choix multiple. Pour un vrai/faux : `vrai` ou `faux`. |
| `explication` | Affichée avec la correction. Elle doit se suffire à elle-même. |
| `difficulte` | `1` (facile), `2` (moyen) ou `3` (difficile). |
| `categorie` | L'identifiant de la catégorie, ex. `travaux` ou `vie-de-l-immeuble/voisinage`. |
| `article_lie` | **Facultative**, et seulement si la base de connaissance est active : l'identifiant de l'article lié. |

Le fichier peut venir d'un tableur : le séparateur (virgule ou point-virgule) et le codage
des accents sont reconnus automatiquement.

### Articles (fichiers Markdown)

Si la base de connaissance est active. Un fichier `.md` par article ; le nom du fichier
sert d'identifiant. Modèle : [`modeles/modele_article.md`](modeles/modele_article.md).

## 8. Le format de pack

Un pack est un fichier `.zip` lisible, version `formatVersion: 1`.

```
ma-communaute.zip
├── pack.json           configuration de la communauté
├── questions.json      banque de questions            (facultatif)
├── quizzes.json        quiz                           (facultatif)
├── news/               une actualité par fichier .md  (facultatif)
├── articles/           un article par fichier .md     (facultatif)
└── media/              images + index.json            (facultatif)
```

**Toutes les sections de contenu sont facultatives** : un pack sans dossier `articles/`
est valide. Les deux exemples fournis sont dans `seed/packs/`.

### `pack.json`

```json
{
  "formatVersion": 1,
  "identity": { "name": "Nom", "subtitle": "Sous-titre", "logo": "media/logo.svg", "favicon": "media/logo.svg" },
  "theme": { "colors": { "primary": "#0f6e73", "accent": "#c2571a" }, "font": "humaniste" },
  "vocabulary": { "news.item": { "singular": "Brève", "plural": "Brèves" } },
  "modules": { "news": { "enabled": true }, "quiz": { "enabled": true }, "knowledge": { "enabled": false } },
  "categories": [{ "slug": "travaux", "name": "Travaux", "children": [{ "slug": "toiture", "name": "Toiture" }] }],
  "home": { "welcomeTitle": "Bienvenue", "welcomeText": "…", "blocks": ["news.latest", "quiz.featured"] },
  "settings": { "activityRetentionMonths": 12, "sharePreview": "full" }
}
```

- Polices : `systeme`, `humaniste`, `geometrique`, `arrondie`, `serif`, `classique`.
- Termes renommables : `news.item`, `quiz.quiz`, `quiz.question`, `knowledge.article`.
- Blocs d'accueil : `news.latest`, `quiz.featured`, `knowledge.latest`.
- `sharePreview` : `full` (titre, résumé et image du contenu) ou `neutral` (nom de la
  communauté seulement).

### `questions.json`

```json
[
  { "ref": "q-001", "type": "single", "statement": "Énoncé",
    "options": [{ "label": "Réponse A", "correct": true }, { "label": "Réponse B", "correct": false }],
    "explanation": "Explication", "difficulty": 2, "category": "travaux/toiture",
    "links": ["knowledge.article:identifiant-de-l-article"] },
  { "ref": "q-002", "type": "truefalse", "statement": "Affirmation", "answer": true }
]
```

`type` : `single`, `multiple` ou `truefalse`. `links` est facultatif.

### `quizzes.json`

```json
[
  { "slug": "decouverte", "title": "Titre", "description": "…", "status": "published",
    "modes": "both", "selection": "manual", "questions": ["q-001", "q-002"] },
  { "slug": "tirage", "title": "Titre", "status": "draft", "modes": "evaluation", "selection": "rules",
    "rules": [{ "category": "travaux", "difficulty": 1, "count": 3 }, { "count": 2 }] }
]
```

`modes` : `both`, `training` ou `evaluation`. `status` : `draft` ou `published`.

### `news/<identifiant>.md` et `articles/<identifiant>.md`

Un fichier Markdown précédé d'un en-tête. Le nom du fichier est l'identifiant du contenu
(celui de son adresse).

```markdown
---
title: Titre
summary: Résumé en une phrase
category: travaux/toiture
status: published
publishAt: 2026-09-01T08:00:00.000Z
expiresAt: 2026-10-01T08:00:00.000Z
pinned: true
---

Le contenu, en Markdown.
```

Pour un article : `status` vaut `draft` ou `published`, et l'en-tête accepte en plus
`tags: [mot, autre-mot]`, `related: [autre-article]` et `revisedAt`.
Pour une actualité : `status` vaut `draft`, `published` ou `archived`.

### `media/`

Les images, et `media/index.json` qui donne pour chacune son nom d'origine et son texte
alternatif. Le nom d'un fichier dans `media/` est conservé à l'import : une image insérée
dans un contenu (`/media/<nom>`) reste donc valable d'une installation à l'autre.

### Évolution du format

Chaque lot ajoutera ses propres sections. Un pack plus récent que l'application est
refusé avec un message clair ; une section inconnue est ignorée et signalée.

## 9. Questions fréquentes

**Puis-je changer d'avis sur un module ?** Oui, à tout moment : Administration › Modules.
Rien n'est perdu à la désactivation.

**Je renomme une catégorie : ses contenus sont-ils perdus ?** Non. Seul le nom change.
Si vous *supprimez* une catégorie, ses contenus deviennent « sans catégorie ».

**Je change le titre d'un contenu : son adresse change-t-elle ?** Non. L'adresse est
fixée à la création, pour que les liens déjà partagés restent valables.

**Le thème sombre a des couleurs un peu différentes des miennes.** C'est voulu : en thème
sombre, l'application éclaircit les couleurs pour qu'elles restent lisibles.

**Comment sauvegarder ?** Le dossier de données de l'installation contient tout
(voir le README). Le pack `.zip`, lui, sauvegarde le paramétrage et les contenus, sans les
comptes ni les résultats.
