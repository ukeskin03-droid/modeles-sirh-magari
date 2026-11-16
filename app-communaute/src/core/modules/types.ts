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
 * Rubriques qui s'ajouteront à cette fiche quand la fonctionnalité correspondante sera
 * développée : types de contenu et pages partageables, fournisseur de recherche, champs
 * liés, formats d'import, sections de pack, données personnelles (phases 3 à 7),
 * indicateurs de tableau de bord (lot 1), formats de partage (lot 4).
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
  /** Modules dont celui-ci est le prolongement (ex. le quiz en direct nécessite le quiz).
   *  L'interrupteur n'est proposé que si ces modules sont actifs. */
  requires?: string[];
};
