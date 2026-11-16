/**
 * CE QU'UN MODULE DÉCLARE
 *
 * Chaque module (quiz, actualités, base de connaissance, puis ceux des lots) possède
 * UN fichier « module.ts » qui remplit la fiche ci-dessous. C'est le seul endroit où
 * le module dit ce qu'il apporte à l'application : entrées de menu, blocs d'accueil,
 * écrans d'administration, droits, tâches planifiées…
 *
 * Le moteur ne contient donc aucune condition du type « si le quiz est actif » : il
 * lit les fiches des modules actifs. Désactiver un module revient à ne plus lire sa fiche.
 *
 * Rubriques qui s'ajouteront à cette fiche avec les lots : indicateurs de tableau de
 * bord (lot 1), formats de partage (lot 4).
 */
import type { ReactNode } from "react";
import type { ActionDefinition } from "@/core/auth/permissions";
import type { Labels, Term, Translator } from "@/core/i18n/translate";
import type { IconName } from "@/core/ui/icons";

/** Un terme de vocabulaire que la communauté peut renommer (étape « Vocabulaire »). */
export type TermDefinition = Term & {
  /** Identifiant du terme, préfixé par la clé du module, ex. "news.item" */
  key: string;
};

/** Une entrée du menu des lecteurs. */
export type NavigationEntry = {
  id: string;
  labelKey: string;
  href: string;
  icon: IconName;
};

/** Un bloc que le module propose pour la page d'accueil. */
export type HomeBlockDefinition = {
  /** Identifiant utilisé dans la configuration de la page d'accueil, ex. "news.latest" */
  id: string;
  labelKey: string;
  /** Le composant qui affiche le bloc */
  Component: () => ReactNode | Promise<ReactNode>;
};

/** Un écran que le module ajoute à l'administration. */
export type AdminScreenDefinition = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  href: string;
  icon: IconName;
  /** Action (droit) nécessaire pour voir cet écran */
  action: string;
};

/** Un type d'événement que le module écrit dans le journal d'activité. */
export type ActivityEventDefinition = {
  type: string;
  labelKey: string;
};

/** Un événement qui peut donner lieu à une notification (e-mail). */
export type NotificationEventDefinition = {
  event: string;
  labelKey: string;
  /** Rédige le message à partir des données de l'événement */
  render: (context: {
    payload: Record<string, unknown>;
    t: Translator;
    communityName: string;
    recipientName: string;
  }) => { subject: string; text: string };
};

/** Une tâche planifiée. Si « everyMinutes » est renseigné, elle se répète à cet intervalle. */
export type ScheduledTaskDefinition = {
  type: string;
  labelKey: string;
  everyMinutes?: number;
  handler: (payload: Record<string, unknown>) => Promise<void>;
};

/** Résumé d'un contenu, quel que soit son module : de quoi l'afficher et y renvoyer. */
export type ContentSummary = {
  id: string;
  /** Identifiant stable et lisible (celui des adresses et des packs) */
  key: string;
  title: string;
  description: string;
  /** Adresse de la page du contenu, ou null s'il n'a pas de page propre */
  url: string | null;
  /** Vrai si les lecteurs peuvent le voir en ce moment (publié, non expiré…) */
  visible: boolean;
};

/**
 * Un type de contenu du module (ex. "news.item"). Le moteur s'en sert pour désigner
 * « un contenu, quel que soit son module » : liens entre contenus, journal d'activité,
 * liens de partage, recherche.
 */
export type ContentTypeDefinition = {
  type: string;
  /** Libellé du type (en général un terme du vocabulaire) */
  labelKey: string;
  /** Retrouve l'identifiant interne à partir de l'identifiant stable */
  findByKey: (key: string) => Promise<string | null>;
  summarize: (id: string) => Promise<ContentSummary | null>;
  /** Tous les contenus de ce type, pour les listes de choix de l'administration */
  list: () => Promise<ContentSummary[]>;
};

/** Résultat de l'import d'une section de pack. */
export type PackSectionReport = {
  created: number;
  updated: number;
  unchanged: number;
  /** Messages destinés à l'utilisateur (éléments ignorés, références introuvables…) */
  warnings: string[];
  /** Liens vers d'autres contenus, à créer une fois toutes les sections importées */
  links: { fromType: string; fromKey: string; to: string }[];
};

/** Fichiers produits par l'export d'une section de pack (chemin dans le pack → contenu). */
export type PackSectionFiles = Map<string, string | Buffer>;

/**
 * Une section de pack gérée par le module (ex. le fichier questions.json).
 * Toutes les sections sont facultatives : un pack sans ce fichier est valide.
 */
export type PackSectionDefinition = {
  id: string;
  labelKey: string;
  import: (files: ReadonlyMap<string, Buffer>, context: { t: Translator }) => Promise<PackSectionReport>;
  export: () => Promise<PackSectionFiles>;
};

/**
 * Un champ que le module AJOUTE aux formulaires d'un autre module, sans que celui-ci le
 * connaisse (ex. la base de connaissance ajoute « Article lié » au formulaire de question).
 * Le module hôte affiche simplement « les champs liés que les modules actifs proposent ».
 */
export type LinkedFieldDefinition = {
  id: string;
  /** Type de contenu hôte, ex. "quiz.question" */
  hostType: string;
  /** Type de contenu proposé, ex. "knowledge.article" */
  targetType: string;
  /** Libellé du champ dans le formulaire hôte */
  labelKey: string;
  /** Texte affiché devant le lien, côté lecteur */
  readerLabelKey: string;
  /** Nom de la colonne correspondante dans les modèles d'import (facultative) */
  importColumn: string;
};

/** Ce que le moteur et les modules ont en commun. */
export type Contribution = {
  /** Textes du module (fichier labels.fr.ts) */
  labels: Labels;
  navigation: NavigationEntry[];
  adminScreens: AdminScreenDefinition[];
  actions: ActionDefinition[];
  activityEvents: ActivityEventDefinition[];
  notificationEvents: NotificationEventDefinition[];
  scheduledTasks: ScheduledTaskDefinition[];
};

/** La fiche d'un module. */
export type ModuleDefinition = Contribution & {
  /** Identifiant technique, jamais affiché, ex. "quiz" */
  key: string;
  /** Premier segment de ses adresses, ex. "quiz" pour /quiz. Ne change jamais, même si
   *  la communauté renomme le module : les liens déjà partagés restent valables. */
  routeSegment: string;
  /** Actif par défaut dans une communauté neuve ? */
  defaultEnabled: boolean;
  icon: IconName;
  /** Nom et phrase d'explication, affichés à côté de l'interrupteur du module */
  nameKey: string;
  descriptionKey: string;
  vocabulary: TermDefinition[];
  homeBlocks: HomeBlockDefinition[];
  contentTypes: ContentTypeDefinition[];
  packSections: PackSectionDefinition[];
  linkedFields: LinkedFieldDefinition[];
  /** Modules dont celui-ci est le prolongement (ex. le quiz en direct nécessite le quiz).
   *  L'interrupteur n'est proposé que si ces modules sont actifs. */
  requires?: string[];
};
