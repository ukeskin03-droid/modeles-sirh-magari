/**
 * FICHE DU MODULE « Quiz »
 *
 * C'est ici, et seulement ici, que le module déclare ce qu'il apporte à l'application.
 * La signification de chaque rubrique est expliquée dans src/core/modules/types.ts.
 *
 */
import type { ModuleDefinition } from "@/core/modules/types";
import { quizContentTypes, quizPersonalData, quizSearchProviders } from "./content";
import { questionsImportFormat } from "./import";
import { quizLabels } from "./labels.fr";
import { quizPackSections } from "./pack";
import { QuizHomeBlock } from "./ui/QuizHomeBlock";

export const quizModule: ModuleDefinition = {
  key: "quiz",
  routeSegment: "quiz",
  defaultEnabled: true,
  icon: "quiz",
  nameKey: "quiz.name",
  descriptionKey: "quiz.description",
  labels: quizLabels,

  // Termes que la communauté peut renommer (étape « Vocabulaire » de l'assistant)
  vocabulary: [
    { key: "quiz.quiz", singular: "Quiz", plural: "Quiz" },
    { key: "quiz.question", singular: "Question", plural: "Questions" },
  ],

  navigation: [{ id: "quiz.home", labelKey: "quiz.nav", href: "/quiz", icon: "quiz" }],

  homeBlocks: [{ id: "quiz.featured", labelKey: "quiz.block.name", Component: QuizHomeBlock }],

  adminScreens: [
    {
      id: "quiz.manage",
      labelKey: "quiz.admin.title",
      descriptionKey: "quiz.admin.description",
      href: "/admin/quiz",
      icon: "quiz",
      action: "quiz.manage",
    },
  ],

  // Gérer les contenus du module : éditeurs et administrateurs
  actions: [{ key: "quiz.manage", minRole: "editor" }],

  contentTypes: quizContentTypes,
  packSections: quizPackSections,
  linkedFields: [],

  importFormats: [questionsImportFormat],

  searchProviders: quizSearchProviders,
  personalData: quizPersonalData,

  activityEvents: [
    { type: "quiz.answer", labelKey: "quiz.activity.answer" },
    { type: "quiz.complete", labelKey: "quiz.activity.complete" },
  ],
  notificationEvents: [],
  scheduledTasks: [],
};
