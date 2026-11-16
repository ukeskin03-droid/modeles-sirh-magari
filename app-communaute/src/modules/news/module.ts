/**
 * FICHE DU MODULE « Actualités »
 *
 * C'est ici, et seulement ici, que le module déclare ce qu'il apporte à l'application.
 * La signification de chaque rubrique est expliquée dans src/core/modules/types.ts.
 *
 * Phase 2 : le module est une « coquille » — il s'active, se désactive et apparaît
 * partout où il le doit, mais ses écrans sont encore vides. Ils arrivent en phase 4,
 * avec le type de contenu « actualité ».
 */
import type { ModuleDefinition } from "@/core/modules/types";
import { newsLabels } from "./labels.fr";
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

  contentTypes: [],
  packSections: [],
  linkedFields: [],

  activityEvents: [],
  notificationEvents: [],
  scheduledTasks: [],
};
