# Application de communauté

Un **modèle d'application** d'animation de communauté et de partage de connaissances.
On l'installe une fois par communauté, puis on la paramètre entièrement depuis l'interface.

> **Une installation = le code (identique partout) + un dossier de données + quelques réglages.**
> Le code ne contient aucun terme métier : tout ce qui distingue une communauté d'une autre
> (nom, couleurs, vocabulaire, catégories, modules actifs, contenus) est une donnée.

- Créer et paramétrer une communauté, sans coder : [`CREER_UN_ESPACE.md`](CREER_UN_ESPACE.md)
- Animer la communauté au quotidien : [`ANIMER_LA_COMMUNAUTE.md`](ANIMER_LA_COMMUNAUTE.md)
- Le besoin complet : [`SPEC.md`](SPEC.md)
- Les choix d'architecture : [`docs/CADRAGE.md`](docs/CADRAGE.md)

## Où en est le projet

**La V1 (socle) est terminée**, phases 1 à 7 : base de connaissance optionnelle, quiz,
actualités, recherche globale, administration, assistant de configuration, imports, packs.
Les lots fonctionnels 1 à 6 (pilotage, fidélisation, participation, WhatsApp, progression,
assistance IA) viendront ensuite, un par un.

## Prérequis

- [Node.js](https://nodejs.org) version 22.18 ou plus récente (`node -v` pour vérifier).

## Installer

```bash
npm install
```

## Essayer les deux communautés d'exemple

```bash
npm run demo
```

Cette commande charge les deux exemples, construit l'application **une seule fois**, puis la
lance deux fois avec deux dossiers de données différents :

| Communauté | Adresse | Dossier de données | Particularité |
|---|---|---|---|
| PeopleDoc | http://localhost:3001 | `donnees/peopledoc` | Base de connaissance active, « Article » renommé « Fiche » |
| Copropriété | http://localhost:3002 | `donnees/copropriete` | **Sans** base de connaissance, « Actualité » renommé « Info syndic » |

Comptes de démonstration (les mêmes dans les deux), mot de passe `communaute-demo` :

| Rôle | Adresse e-mail |
|---|---|
| Administrateur | `admin@exemple.test` |
| Éditeur | `editeur@exemple.test` |
| Lecteur | `lecteur@exemple.test` |

`Ctrl+C` arrête les deux.

## Travailler sur le code

```bash
npm run seed -- peopledoc      # charge un exemple (une seule fois)
npm run dev:peopledoc          # http://localhost:3001, se recharge à chaque modification
```

Même chose avec `copropriete` (port 3002). Une seule communauté à la fois dans ce mode.
Pour repartir de zéro : `npm run seed -- peopledoc --reinitialiser`.

## Démarrer une communauté vierge

```bash
npm run dev
```

Ouvrez http://localhost:3000 : l'écran d'installation crée le compte administrateur, puis
l'assistant de configuration vous guide en 8 étapes. Les données vont dans `donnees/defaut`.
Le déroulé complet est dans [`CREER_UN_ESPACE.md`](CREER_UN_ESPACE.md).

## Réglages d'une installation

Tous les réglages sont facultatifs en développement. Ils sont décrits dans
[`.env.example`](.env.example) ; copiez ce fichier en `.env` pour les modifier.

| Réglage | Rôle |
|---|---|
| `DATA_DIR` | Dossier de données de la communauté (base, images) |
| `SETUP_CODE` | Code demandé pour créer le premier compte. **Obligatoire en production** |
| `APP_URL` | Adresse publique, utilisée dans les liens des e-mails |
| `SMTP_URL`, `MAIL_FROM` | Envoi des e-mails. Sans `SMTP_URL`, ils sont écrits dans `<DATA_DIR>/emails` |
| `INTERNAL_SCHEDULER`, `CRON_SECRET` | Déclenchement des tâches planifiées (interne par défaut) |

Aucune clé d'API n'est nécessaire : l'assistance IA (lot 6) sera facultative et se réglera
dans l'interface, par communauté.

### E-mails

Sans réglage, les e-mails (invitations) sont écrits dans `<DATA_DIR>/emails`, et le lien
d'invitation s'affiche à l'écran pour être transmis à la main. Pour un envoi réel,
renseignez `SMTP_URL` avec les paramètres donnés par votre fournisseur d'e-mails, par
exemple `smtps://identifiant:motdepasse@smtp.exemple.fr:465`, et `MAIL_FROM` avec
l'adresse d'expéditeur. Les envois en échec sont retentés automatiquement ; leur état se
lit dans Administration › État technique.

### Tâches planifiées

L'application déclenche elle-même ses tâches de fond, une fois par minute : purge du
journal d'activité, envoi des notifications en attente, nettoyage des sessions et des
fichiers temporaires. Il n'y a rien à configurer tant qu'elle tourne en continu.
Si l'hébergement endort l'application entre deux visites, coupez la minuterie
(`INTERNAL_SCHEDULER=off`) et faites appeler chaque minute, par un planificateur externe :

```bash
curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://votre-adresse/api/cron/tick
```

## Déployer

L'hébergement cible n'est pas encore choisi. Ce qui suit vaut pour tout serveur capable
de faire tourner Node.js ou Docker en continu.

### Avec Docker

`Dockerfile` construit l'image ; `docker-compose.yml` montre deux communautés sur un même
serveur, chacune avec son port et son dossier de données.

```bash
docker compose up -d --build
```

Placez devant un serveur frontal (Caddy, Nginx, Traefik…) qui fournit le https et associe
une adresse à chaque communauté.

> Le `Dockerfile` et le `docker-compose.yml` ont été écrits et relus, et la syntaxe du
> second est validée, mais **l'image n'a pas pu être construite dans l'environnement de
> développement** (pas de moteur Docker disponible). À vérifier lors du premier déploiement.

### Sans Docker

```bash
npm ci
npm run build
SETUP_CODE=un-code-long DATA_DIR=/chemin/vers/les/donnees npm start
```

`npm start` met la base à niveau, puis lance le serveur sur le port 3000 (réglable par `PORT`).

### Ajouter une communauté

1. Lancer une nouvelle installation : un nouveau bloc dans `docker-compose.yml`, ou un
   nouveau `npm start` avec un autre `DATA_DIR` et un autre `PORT`. **Le code est le même.**
2. Ouvrir son adresse, créer le compte administrateur (avec le `SETUP_CODE`).
3. Suivre l'assistant : partir de zéro, ou importer le pack d'une autre communauté.

### Mettre à jour

Récupérer la nouvelle version du code, reconstruire (`npm run build` ou
`docker compose up -d --build`), redémarrer chaque installation. Les évolutions de la base
s'appliquent toutes seules au démarrage ; le paramétrage et les contenus sont conservés.
Un nouveau module arrive désactivé : chaque communauté décide de l'activer.

### Sauvegarder

**Sauvegarder une communauté = copier son dossier de données** (base, images, secret),
de préférence application arrêtée. En complément, Administration › Export et import
produit un pack .zip du paramétrage et des contenus, sans aucune donnée personnelle.

### Sécurité et données personnelles

- Le `SETUP_CODE` est obligatoire en production pour créer le premier compte.
- Servez toujours l'application en https : le cookie de session est alors réservé aux
  connexions chiffrées.
- Les mots de passe ne sont jamais enregistrés en clair, ni les jetons de session et
  d'invitation.
- Le journal d'activité est pseudonymisé et purgé après la durée réglée dans les
  paramètres (12 mois par défaut).
- Chaque membre dispose de la page « Mes données » : consultation, export, suppression.
- Hébergez les données dans l'Union européenne.

## Vérifier que tout fonctionne

```bash
npm test          # tests automatisés
npm run lint      # contrôle de la qualité du code
npm run typecheck # contrôle de la cohérence des types
```

Les tests (182) couvrent notamment : l'activation et la désactivation de chaque module, le
fonctionnement d'une communauté sans base de connaissance, le calcul du score d'un quiz,
les droits par rôle, l'export puis l'import d'une communauté (à l'identique, sans donnée
personnelle), les imports en masse (dont les messages d'erreur par ligne), la recherche,
les aperçus de partage, la suppression d'un compte, les contrastes du thème, et les règles
d'architecture (aucun terme métier dans le code, modules indépendants).

## Organisation du code

```
prisma/schema/      description des tables : moteur, quiz, actualités, base de connaissance
prisma/migrations/  évolutions de la base, appliquées automatiquement au démarrage
seed/packs/         les deux packs d'exemple
modeles/            modèles de fichiers d'import (questions, articles)
scripts/            lancement, démonstration, chargement des exemples
src/
  registry.ts       LA LISTE DES MODULES INSTALLÉS
  app/              les pages (fichiers courts : contrôle d'accès + délégation)
  core/             le moteur, qui ne connaît aucun module en particulier
    modules/          le registre : ce qu'un module déclare, et ce qui en découle
    auth/             comptes, mots de passe, sessions, rôles, droits
    community/        configuration de la communauté
    setup/            assistant de configuration
    theme/            couleurs, contrastes, thèmes clair et sombre
    i18n/             libellés et vocabulaire
    categories/       catégories, communes à tous les modules
    content/          liens entre contenus, mots-clés, champs liés entre modules
    search/           recherche globale
    share/            liens courts et aperçus de partage
    privacy/          « Mes données » : export et suppression
    activity/         journal d'activité (pseudonymisé)
    notifications/    file d'attente et envoi des e-mails
    jobs/             tâches planifiées
    media/            médiathèque
    pack/             export et import de packs
    import/           lecture des fichiers d'import en masse
    request/          contexte d'une visite, fabriques de pages
    actions/          actions des formulaires du moteur
    ui/               composants d'interface partagés
  modules/
    quiz/ news/ knowledge/   un dossier par module : fiche (module.ts), libellés, règles,
                             accès à la base, écrans, pack, import
tests/              tests automatisés
```

Trois règles, vérifiées par les tests :

1. Un module peut utiliser le moteur ; **le moteur n'importe jamais un module**.
2. **Un module n'importe jamais un autre module.**
3. **Aucun texte en dur** dans les écrans : tout passe par les fichiers `labels.fr.ts`.

### Ajouter un module

1. Créer `src/modules/<cle>/` avec sa fiche `module.ts` (voir `src/core/modules/types.ts`)
   et ses libellés `labels.fr.ts`.
2. L'ajouter à la liste de `src/registry.ts`.
3. Créer ses pages dans `src/app/(membres)/<segment>/` avec `modulePage("<cle>", …)`.

Il apparaît alors dans l'écran « Modules », et son activation fait apparaître ses entrées de
menu, ses blocs d'accueil et ses écrans d'administration, sans autre modification.

## Choix techniques

| Sujet | Choix | Pourquoi |
|---|---|---|
| Socle | Next.js 16, TypeScript, Tailwind CSS 4 | Stack de la spec |
| Base | Prisma 7 + SQLite | Un fichier par communauté, rien à administrer |
| Connexion | Écrite dans l'application (`src/core/auth/`) | Auth.js n'évolue plus ; voir `docs/CADRAGE.md` § 5 |
| Polices | Polices système | Rien n'est téléchargé depuis un site tiers |
| Icônes | Dessinées dans `src/core/ui/icons.tsx` | Pas de dépendance |

Dépendances d'exécution, chacune pour un besoin précis : `next` et `react` (socle),
`prisma` et son adaptateur SQLite (base), `zod` (contrôle des données), `nodemailer`
(e-mails), `react-markdown` et `remark-gfm` (affichage des contenus), `@tiptap/*` (éditeur
visuel), `yaml` (en-têtes des fichiers Markdown), `fflate` (fichiers .zip), `papaparse`
(fichiers CSV).

**À savoir sur Next.js 16.** Les pages qui dépendent de la personne connectée doivent être
entourées d'une « zone d'attente ». Ici, c'est fait une fois pour toutes par les fabriques
de pages (`src/core/request/pages.tsx`). Et comme le même code sert plusieurs communautés,
rien ne doit être lu en base au moment de la construction : c'est le rôle de
`await connection()` dans `src/core/request/context.ts`. La documentation de cette version
de Next.js est fournie dans `node_modules/next/dist/docs/`.
