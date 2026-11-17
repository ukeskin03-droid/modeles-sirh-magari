/**
 * QUIZ — ses types de contenu, tels que le reste de l'application peut les désigner.
 */
import { db } from "@/core/db/client";
import type { ContentSummary, ContentTypeDefinition, PersonalDataDefinition, SearchProviderDefinition } from "@/core/modules/types";
import { containsAllWords, excerptAround } from "@/core/search/service";

const shorten = (text: string, max = 90) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

const quizSummary = (quiz: { id: string; slug: string; title: string; description: string; status: string }): ContentSummary => ({
  id: quiz.id,
  key: quiz.slug,
  title: quiz.title,
  description: quiz.description,
  url: `/quiz/${quiz.slug}`,
  visible: quiz.status === "published",
});

const questionSummary = (question: { id: string; ref: string; statement: string }): ContentSummary => ({
  id: question.id,
  key: question.ref,
  title: shorten(question.statement),
  description: "",
  url: null, // une question n'a pas de page propre
  visible: true,
});

export const quizContentTypes: ContentTypeDefinition[] = [
  {
    type: "quiz.quiz",
    urlPrefix: "/quiz/",
    labelKey: "quiz.type.quiz",
    findByKey: async (key) => (await db().quiz.findUnique({ where: { slug: key }, select: { id: true } }))?.id ?? null,
    summarize: async (id) => {
      const quiz = await db().quiz.findUnique({ where: { id } });
      return quiz ? quizSummary(quiz) : null;
    },
    list: async () => (await db().quiz.findMany({ orderBy: { title: "asc" } })).map(quizSummary),
  },
  {
    type: "quiz.question",
    labelKey: "quiz.type.question",
    findByKey: async (key) => (await db().question.findUnique({ where: { ref: key }, select: { id: true } }))?.id ?? null,
    summarize: async (id) => {
      const question = await db().question.findUnique({ where: { id } });
      return question ? questionSummary(question) : null;
    },
    list: async () => (await db().question.findMany({ orderBy: { createdAt: "asc" } })).map(questionSummary),
  },
];

/** Recherche : les quiz publiés dont le titre ou la description contient les mots cherchés. */
export const quizSearchProviders: SearchProviderDefinition[] = [
  {
    id: "quiz.quizzes",
    labelKey: "quiz.page.title",
    search: async (words) => {
      const quizzes = await db().quiz.findMany({ where: { status: "published", AND: containsAllWords(words) }, orderBy: { title: "asc" }, take: 20 });
      return quizzes.map((quiz) => ({ id: quiz.id, title: quiz.title, excerpt: excerptAround(quiz.description, words), url: `/quiz/${quiz.slug}` }));
    },
  },
];

/** Données personnelles : les passages de quiz de la personne. */
export const quizPersonalData: PersonalDataDefinition = {
  export: async (userId) => {
    const attempts = await db().quizAttempt.findMany({ where: { userId }, include: { quiz: { select: { title: true } } }, orderBy: { startedAt: "asc" } });
    return {
      attempts: attempts.map((attempt) => ({ quiz: attempt.quiz.title, mode: attempt.mode, startedAt: attempt.startedAt, finishedAt: attempt.finishedAt, score: attempt.score, total: attempt.total })),
    };
  },
  erase: async (userId) => {
    await db().quizAttempt.deleteMany({ where: { userId } });
  },
};
