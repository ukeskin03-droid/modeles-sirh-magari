# Brief — contrôler l'application DocGen et modifier SKILL.md

Ce message vient d'une autre conversation, où la skill `docgen-variabilisation` (v1.1.3) a
été auditée. Tu as écrit le code de l'application web (`web/page.html`,
`web/docgen-core.js`, `web/construire_page.py`). Deux choses te sont demandées :

1. **Contrôler** dans le code les dix constats ci-dessous et dire, pour chacun, s'il est
   confirmé ou infirmé, avec la preuve.
2. **Modifier `SKILL.md`** selon la partie 2, puis dire ce que ces modifications changent
   pour la page.

Ne republie pas la page et ne modifie pas le code de l'application avant d'avoir rendu le
résultat des contrôles : la décision de corriger revient à l'utilisateur.

## Contexte

La skill a été appliquée en conversation à 5 specs de test, puis notée contre un corrigé :
40/60. Les faiblesses confirmées dans les livrables :

- des choix d'interprétation faits sans question au client (critère le plus faible : 3/10) ;
- des pièges non annotés manqués (texte en dur propre à un salarié, phrase qui casse à
  certaines valeurs, donnée sensible) ;
- un code couleur en couleur de police que l'extracteur n'a pas vu ;
- des champs de fusion Word dont le code est resté autour des tokens, et dont le format
  de date a été perdu ;
- un calcul métier écrit dans le template avant validation ;
- des mots du client modifiés sans que ce soit consigné.

**Ce qui a été vérifié et ce qui ne l'a pas été.** L'audit a fait tourner les scripts
Python de la skill. Côté application, le code a seulement été lu : la page n'a pas été
exécutée. Les constats C1 à C4 et C10 sont donc des lectures de code à confirmer. Les
constats C5 à C9 ont été observés sur les scripts Python ; il reste à vérifier que le
portage JavaScript se comporte de la même façon.

## Partie 1 — Contrôles à faire dans le code

Pour chaque constat : où regarder, comment vérifier, et ce qui est attendu en retour
(« confirmé » ou « infirmé », avec l'extrait de code ou le résultat du test).

### C1. Claude ne lit jamais le document entier

- **Constat supposé** : la page n'envoie à Claude que les zones extraites, par lots,
  chacune avec le texte de son paragraphe (1 500 caractères au plus). Aucune demande ne
  porte sur le document complet.
- **Où regarder** : `page.html`, fonctions `zonePourClaude`, `consigne(lot)` et
  `proposer` ; `docgen-core.js`, champ `contexte` de l'extraction ;
  `construire_page.py`, liste `SECTIONS_EXCLUES_SKILL`, qui retire
  « ## Étape 1 — Inventorier » des règles transmises.
- **Test** : déposer un .docx qui contient, sans annotation, un accord de genre
  (« est engagé »), un nom de personne en dur et une date absente (« Fait à Lyon, le »).
  Vérifier qu'aucune de ces zones n'apparaît dans l'inventaire sans ajout manuel.
- **Conséquence si confirmé** : toute règle de relecture placée dans l'étape 1 de
  `SKILL.md` n'atteint pas la page (voir C10).

### C2. Aucune place pour une question qui ne porte pas sur une zone

- **Constat supposé** : le modèle n'a qu'un champ `question` par zone. Une question
  générale (code couleur, nombre d'entités, mode de signature, export des champs) n'a
  nulle part où s'écrire, ni dans la page ni dans le registre.
- **Où regarder** : `page.html`, `normaliserZone`, `zonesRegistre`,
  `construireSynthese` ; `docgen-core.js`, construction de l'onglet « Questions client ».

### C3. Ni ligne dédiée, ni déclaration en tête, ni suppression

- **Constat supposé** : l'injection ne sait que remplacer du texte dans le paragraphe de
  la zone. La page ne peut donc pas poser `<<cs_…>>`, `<<else>>`, `<<es_>>` sur leur
  propre paragraphe, ni déclarer les variables de genre une fois en tête du document, ni
  supprimer une légende, une consigne ou une annexe. Ce sont pourtant des règles de la
  skill (étape 4 et `grammaire-specs.md` § 6).
- **Où regarder** : `page.html`, `reglesInjection` (forme d'une règle : `id`,
  `chercher`, `remplacer`, `mot_entier`, `partie`, `paragraphe`) et la phrase de
  `consigne(lot)` « Une section conditionnelle décrite dans une seule consigne se
  remplace en ligne » ; `docgen-core.js`, fonction d'injection.
- **Test** : une spec avec un paragraphe entièrement conditionnel. Générer, puis
  vérifier dans le XML si les balises sont dans le paragraphe ou sur des paragraphes à
  part.

### C4. Les lots ne se connaissent pas

- **Constat supposé** : chaque lot de 8 à 20 zones est proposé sans savoir ce que les
  lots précédents ont retenu. Un même champ peut recevoir deux noms, ou être comparé à
  deux orthographes d'une même valeur.
- **Où regarder** : `page.html`, `proposer` (boucle sur les lots) et `zonePourClaude`
  (rien n'est transmis des autres zones).
- **Test** : une spec de plus de 20 zones où le même champ discriminant (statut, type de
  contrat) pilote des conditions dans deux lots différents. Comparer les noms et les
  valeurs proposés.

### C5. L'extraction ne lit que le surlignage

- **Observé en Python** : `extraire_specs.py` ne lit que `w:highlight`. Un code couleur
  porté par la couleur de police (`w:color`) ou la trame de fond (`w:shd`) est invisible.
  Sur un vrai modèle client, 35 passages en police rouge (clauses facultatives,
  consignes) n'ont produit aucune zone.
- **Où regarder** : `docgen-core.js`, fonction `surlignagesParagraphe`.
- **Test** : un .docx avec une phrase en police rouge non surlignée.

### C6. Les champs de fusion Word gardent leur code

- **Observé en Python** : l'extraction repère le texte affiché `«CHAMP»`, mais
  l'injection ne remplace que ce texte. Les éléments `w:fldChar` et `w:instrText`
  (`MERGEFIELD …`) restent autour du token : sur un vrai modèle, une quarantaine après
  génération. Le format d'affichage du champ (`\@ "d MMMM yyyy"`) n'est pas lu, donc pas
  repris dans `dateFormat()`.
- **Où regarder** : `docgen-core.js`, extraction (aucune lecture de `instrText`),
  `aplatirRuns` et l'injection.
- **Test** : un .docx issu d'un publipostage, avec un champ date formaté. Après
  génération, dézipper et compter les `w:instrText` qui contiennent `MERGEFIELD`.

### C7. Les marques d'annotation restent dans le template

- **Observé en Python** : aucun script ne retire le surlignage ni la couleur
  d'annotation. Le document généré sort surligné.
- **Test** : compter les `w:highlight` dans le template généré par la page.

### C8. Le nettoyage automatique abîme les chaînes, et le validateur a deux faux positifs

- **Observé en Python** :
  - `nettoyer_remplacement("<<{map(code,'A','Paris Saint-Lazare','')}>>")` renvoie
    `<<{map(code,'A','Paris [Saint-Lazare]','')}>>` : un mot à trait d'union dans une
    chaîne entre apostrophes est pris pour un nom de champ et mis entre crochets.
  - `valider_template.py` signale ce même mot comme « nom hyphene non crochete ».
  - `valider_template.py` signale `<<else_{floor(x/7) >= 30}>>` comme « balisage
    invalide (chevron manquant) » à cause du `>` de `>=`.
- **Pourquoi c'est plus grave dans la page** : `reglesInjection` appelle
  `core.nettoyerRemplacement` sur chaque zone. La correction fautive s'applique donc
  d'office, sous l'intitulé « Corrigé automatiquement (syntaxe) ».
- **Test** : passer ces deux expressions dans `core.nettoyerRemplacement` et dans
  `core.valider`.

### C9. Le registre laisse quatre colonnes vides

- **Observé en Python et lu en JS** : « Champ discriminant », « Valeurs attendues »,
  « Origine de la donnee » et « Format / fonction » sont écrites vides. Le registre ne
  crée de question que pour un code de champ non confirmé.
- **Où regarder** : `docgen-core.js`, construction des trois onglets.

### C10. Ce que la page transmet à Claude après modification de SKILL.md

- **À faire après la partie 2** : relancer `texte_skill()` de `construire_page.py` et
  vérifier, règle par règle, lesquelles des modifications ci-dessous figurent dans le
  texte transmis.
- **Attendu** : les corrections 2 et 3 sont dans l'étape 1, qui est exclue. Elles ne
  seront donc pas transmises. Ne déplace pas ces règles hors de l'étape 1 pour
  contourner l'exclusion : en conversation, c'est là qu'elles servent. Propose plutôt
  comment la page peut les appliquer, par exemple une première demande à Claude sur le
  texte complet du document, qui renverrait les zones manquantes, l'hypothèse de code
  couleur et les questions générales.

## Partie 2 — Modifications de SKILL.md

Six remplacements. Chaque « texte actuel » est recopié de la v1.1.3 : s'il ne correspond
pas mot pour mot à ton fichier, ne force pas le remplacement et signale l'écart.

Trois contraintes :

- ne renomme aucun titre de section `## …` : `construire_page.py` reconnaît les sections
  à exclure par leur titre ;
- ne touche à rien d'autre dans le fichier ;
- incrémente `VERSION` (1.1.3 → 1.2.0) et reconstruis la page avec
  `python web/construire_page.py`, sans la republier.

### Correction 1 — Tout choix que la spec ne fixe pas devient une question

Étape 2. Texte actuel :

```
Une zone qui ne rentre dans aucune catégorie est une **question client**, pas une
hypothèse à trancher seul.
```

Nouveau texte :

```
Une zone qui ne rentre dans aucune catégorie est une **question client**, pas une
hypothèse à trancher seul. Il en va de même de **tout choix que la spec ne fixe pas** :
le champ qui déclenche une condition, la date visée (génération ou signature), un
format, un ordre, texte libre ou donnée structurée, un texte en dur qui dépend
visiblement du salarié ou du site. Tu peux retenir une option pour que le template soit
générable, mais chaque option retenue donne une ligne dans « Questions client » : ce que
la spec laisse ouvert, l'option retenue, l'autre option. Les statuts « catalogue » et
« validé » sont réservés à ce que la spec dit sans ambiguïté.
```

### Correction 2 — Relecture en trois questions

Étape 1. Texte actuel (la phrase commence au milieu d'une ligne) :

```
Croise
systématiquement les deux, puis **relis le document en entier** : les zones variables les
plus souvent manquées sont les accords de genre au fil du texte, les dates dans les
formules de politesse et les mentions d'entité en en-tête et pied de page.
```

Nouveau texte :

```
Croise
systématiquement les deux, puis **relis le document en entier**, avec trois questions :

- *Qu'est-ce qui varie sans être annoté ?* Accords de genre au fil du texte, dates des
  formules de politesse, mentions d'entité en en-tête et pied de page, nom ou valeur en
  dur propre à un salarié, valeur manquante (`XX`, date absente).
- *Que donne chaque phrase aux valeurs limites ?* 1, 0, vide, pluriel, décimales,
  premier du mois : « en 1 fois », « 1 jours », « 1 janvier », un montant à centimes
  suivi de « euros ». Une phrase qui casse est traitée ou signalée.
- *Qu'est-ce qui engage le client ?* Donnée sensible (santé, motif d'absence,
  nationalité ou titre de séjour, numéro de sécurité sociale), consigne qui en contredit
  une autre, consigne qui retire une mention que le droit du travail impose. Ces points
  ne se tranchent jamais seul : question au client, marquée bloquante quand le template
  ne peut pas partir sans la réponse.
```

### Correction 3 — Le code couleur est une hypothèse

Étape 1. Texte actuel :

```
- les **runs surlignés** (jaune = variable simple, bleu = section conditionnelle, autre
  couleur = imbrication — c'est la convention transmise aux clients dans le guide de
  préparation UKG) ;
```

Nouveau texte :

```
- les **passages marqués par une couleur** : surlignage, trame de fond ou couleur de
  police. La convention du guide de préparation UKG (jaune = variable simple, bleu =
  section conditionnelle, autre couleur = imbrication) n'est qu'un point de départ : une
  légende écrite dans le document prime sur elle, et sans légende le sens de chaque
  couleur est une hypothèse tirée du contexte. Dans tous les cas, lister les couleurs
  rencontrées avec le sens retenu et le faire confirmer par une question client, y
  compris quand une zone contredit la légende ;
```

Cette règle demande à l'extracteur de lire la couleur de police et la trame : tant que
C5 n'est pas corrigé, la page ne peut pas l'appliquer.

### Correction 5 — Pas de règle de calcul dans le template sans validation

Étape 4. Texte actuel :

```
Deux réflexes qui évitent l'essentiel des retours de recette :
```

Nouveau texte (les deux puces existantes restent en place, celle-ci s'ajoute après) :

```
Trois réflexes qui évitent l'essentiel des retours de recette :
```

```
- **Une règle de calcul ne s'écrit pas dans le template sans validation.** Une formule
  que la spec donne entièrement (une date + N mois, une valeur par statut) se traduit
  telle quelle. Une règle qui demande d'interpréter (arrondi, plafond, seuil, cas sans
  donnée, règle légale ou conventionnelle) reste une question : le template reçoit une
  valeur fournie en amont (custom field ou saisie), et le registre propose la formule,
  à activer une fois validée et testée.
```

### Correction 6 — Le texte du client ne change pas en dehors des zones

Étape 4. Texte actuel :

```
**Un remplacement ne vaut que pour sa zone.** Le texte à remplacer est cherché dans le
paragraphe où la zone a été repérée, jamais dans tout le document : un mot court comme
« in » ou « Nom » se retrouve partout, y compris à l'intérieur d'autres mots et des tokens
déjà posés.
```

Nouveau texte :

```
**Un remplacement ne vaut que pour sa zone, et le texte du client ne change pas en
dehors d'elle.** Le texte à remplacer est cherché dans le paragraphe où la zone a été
repérée, jamais dans tout le document : un mot court comme « in » ou « Nom » se retrouve
partout, y compris à l'intérieur d'autres mots et des tokens déjà posés. Tout mot, signe
de ponctuation ou format ajouté, retiré ou changé pour que la phrase tienne se consigne
dans le registre (statut « texte modifié », avant → après). Si la phrase ne tient pas
sans retouche, c'est une question.
```

### Correction 8 — Listes : pas de nombre fixe de lignes de sa propre initiative

Section « Limites connues ». Texte actuel :

```
- Les **sections répétitives** (`<<rs_>>`/`<<rr_>>`) sont documentées par Docmosis Tornado
  mais absentes de la documentation UKG Smart Document Generation. Leur disponibilité en
  DocGen standalone est à valider avec le support UKG avant de s'appuyer dessus.
```

Nouveau texte :

```
- Les **sections répétitives** (`<<rs_>>`/`<<rr_>>`) sont documentées par Docmosis Tornado
  mais absentes de la documentation UKG Smart Document Generation. Quand une spec
  demande une liste (« une ligne par… », puces en nombre variable), poser la question
  bloquante : d'où vient la liste, dans quel ordre, combien d'éléments au plus, la
  répétition est-elle disponible. En attendant, le template contient la répétition
  Tornado, marquée « à valider support UKG ». Ne jamais la remplacer de ta propre
  initiative par un nombre fixe de lignes : dire dans la synthèse ce que la variante
  retenue rend mal.
```

**Point en attente de décision.** La variante provisoire par défaut (répétition Tornado)
n'a pas encore été validée par l'utilisateur : demande-lui confirmation avant d'appliquer
cette correction. Les cinq autres peuvent être appliquées sans attendre.

### Deux ajouts à ne pas faire maintenant

Deux autres corrections touchent `SKILL.md`, mais décrivent des fonctions que les
scripts n'ont pas encore. Ne les écris pas avant que le script correspondant existe,
sinon la skill annoncerait un outil absent :

- **Correction 7** (étape 5) : retrait des surlignages et des couleurs d'annotation par
  `injecter_tokens.py`.
- **Correction 10** (étape 5) : clés `avant`, `apres` et `supprimer` dans
  `mapping.json`, pour poser une balise sur sa propre ligne et supprimer un paragraphe.

## Partie 3 — Ce qui est attendu en retour

1. Un tableau des dix contrôles : confirmé ou infirmé, avec la preuve (extrait de code,
   résultat du test).
2. Le `SKILL.md` modifié en entier, et la liste des « textes actuels » qui ne
   correspondaient pas.
3. Le résultat de C10 : quelles corrections atteignent la page, lesquelles non.
4. Pour chaque constat confirmé, la modification de l'application que tu proposes et
   son ampleur (quelques lignes, une fonction, une refonte). Chaque modification d'un
   script Python doit être reportée dans `docgen-core.js` et couverte par un cas dans
   `web/tests/creer_fixtures.py`, comme le prévoit `web/MAINTENANCE.md`.
5. Rien de publié.

## Pour mémoire — corrections hors SKILL.md

Elles ne font pas partie de ce brief, mais elles existent et recoupent les contrôles :

| N° | Correction | Fichiers | Contrôle lié |
|---|---|---|---|
| 3 (script) | Lire la couleur de police et la trame de fond | `extraire_specs.py` | C5 |
| 4 | Champs de fusion : code retiré, format repris, erreur s'il en reste | `correspondances-usuelles.md`, `extraire_specs.py`, `merge_runs.py`, `valider_template.py` | C6 |
| 7 | Retirer les marques d'annotation | `injecter_tokens.py`, `valider_template.py` | C7 |
| 9 | Ignorer le texte entre apostrophes dans le nettoyage et le validateur | `injecter_tokens.py`, `valider_template.py` | C8 |
| 10 | Balise sur sa propre ligne, suppression de paragraphe | `injecter_tokens.py` | C3 |
| 11 | Le défaut d'un accord de genre est une décision du client | `grammaire-specs.md` | — |
| 12 | Questions libres et colonnes du registre remplies | `generer_registre.py` | C2, C9 |
