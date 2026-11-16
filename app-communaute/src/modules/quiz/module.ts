/**
 * FICHE DU MODULE « Quiz »
 *
 * C'est ici, et seulement ici, que le module déclare ce qu'il apporte à l'application.
 * La signification de chaque rubrique est expliquée dans src/core/modules/types.ts.
 *
 * Phase 2 : le module est une « coquille » — il s'active, se désactive et apparaît
 * partout où il le doit, mais ses écrans sont encore vides. Ils arrivent en phase 3,
 * avec les types de contenu « quiz » et « question ».
 */
import type { ModuleDefinition } from "@/core/modules/types";
import { quizLabels } from "./labels.fr";
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

  activityEvents: [],
  notificationEvents: [],
  scheduledTasks: [],
};
