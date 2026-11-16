# Application de communauté

Un **modèle d'application** d'animation de communauté et de partage de connaissances.
On l'installe une fois par communauté, puis on la paramètre entièrement depuis l'interface.

> **Une installation = le code (identique partout) + un dossier de données + quelques réglages.**
> Le code ne contient aucun terme métier : tout ce qui distingue une communauté d'une autre
> (nom, couleurs, vocabulaire, catégories, modules actifs, contenus) est une donnée.

- Le besoin complet : [`SPEC.md`](SPEC.md)
- Les choix d'architecture : [`docs/CADRAGE.md`](docs/CADRAGE.md)

## Où en est le projet

| Phase | Contenu | État |
|---|---|---|
| 1. Cadrage | Architecture, modèle de données, registre, format de pack | ✅ |
| 2. Socle | Projet, base, connexion et rôles, configuration, registre et activation des modules, journal d'activité, notifications, tâches planifiées, page d'accueil | ✅ |
| 3. Quiz | Banque de questions, quiz manuels ou par tirage, entraînement et évaluation, historique | ✅ |
| 4. Actualités | Statuts, programmation, expiration, épinglage, badge « Nouveau », contenu Markdown | ✅ |
| 5. Base de connaissance | Articles, catégories, mots-clés, articles liés, lien optionnel depuis les questions et les actualités | ✅ |
| 6. Atelier | Assistant de configuration, éditeurs, médiathèque, imports, export/import .zip | à venir |
| 7. Finitions | Recherche, pages partageables, « Mes données », documentation complète, image Docker | à venir |


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

Ouvrez http://localhost:3000 : l'écran d'installation crée le compte administrateur.
Les données vont dans `donnees/defaut`. En phase 2, l'identité et l'apparence viennent d'un
pack ; l'assistant de configuration à l'écran arrive en phase 6.

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

**Sauvegarder une communauté** = copier son dossier de données.

## Vérifier que tout fonctionne

```bash
npm test          # tests automatisés
npm run lint      # contrôle de la qualité du code
npm run typecheck # contrôle de la cohérence des types
```

Les tests couvrent notamment : l'activation et la désactivation de chaque module, le
fonctionnement d'une communauté sans base de connaissance, les droits par rôle, les comptes
et invitations, le chargement des packs, le journal d'activité, les contrastes du thème, et
les règles d'architecture (aucun terme métier dans le code, modules indépendants).

## Organisation du code

```
prisma/schema/      description des tables (un fichier pour le moteur, puis un par module)
prisma/migrations/  évolutions de la base, appliquées automatiquement au démarrage
seed/packs/         les deux packs d'exemple
scripts/            lancement, démonstration, chargement des exemples
src/
  registry.ts       LA LISTE DES MODULES INSTALLÉS
  app/              les pages (fichiers courts : contrôle d'accès + délégation)
  core/             le moteur, qui ne connaît aucun module en particulier
    modules/          le registre : ce qu'un module déclare, et ce qui en découle
    auth/             comptes, mots de passe, sessions, rôles, droits
    community/        configuration de la communauté
    theme/            couleurs, contrastes, thèmes clair et sombre
    i18n/             libellés et vocabulaire
    activity/         journal d'activité (pseudonymisé)
    notifications/    file d'attente et envoi des e-mails
    jobs/             tâches planifiées
    media/            fichiers (logo, images)
    pack/             lecture et application d'un pack
    request/          contexte d'une visite, fabriques de pages
    ui/               composants d'interface partagés
  modules/
    quiz/ news/ knowledge/   un dossier par module : fiche (module.ts), libellés, écrans
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

Dépendances d'exécution : `next`, `react`, `@prisma/client` et son adaptateur SQLite, `zod`
(contrôle des données), `nodemailer` (e-mails).

**À savoir sur Next.js 16.** Les pages qui dépendent de la personne connectée doivent être
entourées d'une « zone d'attente ». Ici, c'est fait une fois pour toutes par les fabriques
de pages (`src/core/request/pages.tsx`). Et comme le même code sert plusieurs communautés,
rien ne doit être lu en base au moment de la construction : c'est le rôle de
`await connection()` dans `src/core/request/context.ts`. La documentation de cette version
de Next.js est fournie dans `node_modules/next/dist/docs/`.
