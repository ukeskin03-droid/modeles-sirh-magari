/**
 * FICHE DU MODULE « Base de connaissance »
 *
 * C'est ici, et seulement ici, que le module déclare ce qu'il apporte à l'application.
 * La signification de chaque rubrique est expliquée dans src/core/modules/types.ts.
 *
 * Phase 2 : le module est une « coquille » — il s'active, se désactive et apparaît
 * partout où il le doit, mais ses écrans sont encore vides. Ils arrivent en phase 5,
 * avec le type de contenu « article ».
 */
import type { ModuleDefinition } from "@/core/modules/types";
import { knowledgeLabels } from "./labels.fr";
import { KnowledgeHomeBlock } from "./ui/KnowledgeHomeBlock";

export const knowledgeModule: ModuleDefinition = {
  key: "knowledge",
  routeSegment: "articles",
  defaultEnabled: false,
  icon: "book",
  nameKey: "knowledge.name",
  descriptionKey: "knowledge.description",
  labels: knowledgeLabels,

  // Termes que la communauté peut renommer (étape « Vocabulaire » de l'assistant)
  vocabulary: [
    { key: "knowledge.article", singular: "Article", plural: "Articles" },
  ],

  navigation: [{ id: "knowledge.home", labelKey: "knowledge.nav", href: "/articles", icon: "book" }],

  homeBlocks: [{ id: "knowledge.latest", labelKey: "knowledge.block.name", Component: KnowledgeHomeBlock }],

  adminScreens: [
    {
      id: "knowledge.manage",
      labelKey: "knowledge.admin.title",
      descriptionKey: "knowledge.admin.description",
      href: "/admin/articles",
      icon: "book",
      action: "knowledge.manage",
    },
  ],

  // Gérer les contenus du module : éditeurs et administrateurs
  actions: [{ key: "knowledge.manage", minRole: "editor" }],

  contentTypes: [],
  packSections: [],
  linkedFields: [],

  activityEvents: [],
  notificationEvents: [],
  scheduledTasks: [],
};
