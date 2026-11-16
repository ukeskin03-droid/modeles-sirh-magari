/**
 * FICHE DU MODULE « Actualités »
 *
 * C'est ici, et seulement ici, que le module déclare ce qu'il apporte à l'application.
 * La signification de chaque rubrique est expliquée dans src/core/modules/types.ts.
 *
 */
import type { ModuleDefinition } from "@/core/modules/types";
import { newsContentTypes } from "./content";
import { newsLabels } from "./labels.fr";
import { newsPackSections } from "./pack";
import { NewsHomeBlock } from "./ui/NewsHomeBlock";

export const newsModule: ModuleDefinition = {
  key: "news",
  routeSegment: "actualites",
  defaultEnabled: true,
  icon: "news",
  nameKey: "news.name",
  descriptionKey: "news.description",
  labels: newsLabels,

  // Termes que la communauté peut renommer (étape « Vocabulaire » de l'assistant)
  vocabulary: [
    { key: "news.item", singular: "Actualité", plural: "Actualités" },
  ],

  navigation: [{ id: "news.home", labelKey: "news.nav", href: "/actualites", icon: "news" }],

  homeBlocks: [{ id: "news.latest", labelKey: "news.block.name", Component: NewsHomeBlock }],

  adminScreens: [
    {
      id: "news.manage",
      labelKey: "news.admin.title",
      descriptionKey: "news.admin.description",
      href: "/admin/actualites",
      icon: "news",
      action: "news.manage",
    },
  ],

  // Gérer les contenus du module : éditeurs et administrateurs
  actions: [{ key: "news.manage", minRole: "editor" }],

  contentTypes: newsContentTypes,
  packSections: newsPackSections,
  linkedFields: [],

  activityEvents: [],
  notificationEvents: [],
  scheduledTasks: [],
};
