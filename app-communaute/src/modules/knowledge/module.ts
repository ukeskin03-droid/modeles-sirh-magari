/**
 * FICHE DU MODULE « Base de connaissance »
 *
 * C'est ici, et seulement ici, que le module déclare ce qu'il apporte à l'application.
 * La signification de chaque rubrique est expliquée dans src/core/modules/types.ts.
 *
 *
 * Ce module est OPTIONNEL : une communauté fonctionne entièrement sans lui. Quand il est
 * actif, il se branche sur d'autres modules par la rubrique « linkedFields ».
 */
import type { ModuleDefinition } from "@/core/modules/types";
import { knowledgeContentTypes, knowledgeLinkedFields, knowledgePersonalData, knowledgeSearchProviders } from "./content";
import { articlesImportFormat } from "./import";
import { knowledgeLabels } from "./labels.fr";
import { knowledgePackSections } from "./pack";
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

  contentTypes: knowledgeContentTypes,
  packSections: knowledgePackSections,
  linkedFields: knowledgeLinkedFields,

  importFormats: [articlesImportFormat],

  searchProviders: knowledgeSearchProviders,
  personalData: knowledgePersonalData,

  activityEvents: [],
  notificationEvents: [],
  scheduledTasks: [],
};
