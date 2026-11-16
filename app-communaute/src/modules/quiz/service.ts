/**
 * QUIZ — lecture et écriture en base : banque de questions, quiz, tentatives.
 */
import crypto from "node:crypto";
import { listCategories, withDescendants } from "@/core/categories/service";
import { removeLinksOf } from "@/core/content/links";
import { normalizeText, uniqueSlug } from "@/core/content/text";
import { db, inTransaction } from "@/core/db/client";
import { buildDraw, drawByRules, type Candidate, type DrawEntry } from "./draw";
import { allowedModes, type AttemptMode, type QuestionInput, type QuizInput } from "./model";
import { isAnswerCorrect, scoreOf } from "./scoring";

/** Erreur « métier » : la raison correspond au libellé quiz.error.<raison>. */
export class QuizError extends Error {
  constructor(public readonly reason: "notFound" | "notAvailable" | "modeNotAllowed" | "empty" | "alreadyAnswered" | "invalidAnswer" | "notAnswered") {
    super(reason);
  }
}

/** Adresses réservées sous /quiz : aucun quiz ne peut prendre ces identifiants. */
const RESERVED_SLUGS = new Set(["resultats", "passage"]);

// ── Banque de questions ──────────────────────────────────────────────────────

export type QuestionFilters = { categoryId?: string; difficulty?: number; type?: string; text?: string };

export async function listQuestions(filters: QuestionFilters = {}) {
  const categories = await listCategories();
  const questions = await db().question.findMany({
    where: {
      categoryId: filters.categoryId ? { in: withDescendants(filters.categoryId, categories) } : undefined,
      difficulty: filters.difficulty,
      type: filters.type,
    },
    include: { options: { orderBy: { position: "asc" } }, _count: { select: { quizzes: true } } },
    orderBy: { createdAt: "asc" },
  });
  const needle = filters.text ? normalizeText(filters.text) : "";
  return needle ? questions.filter((question) => normalizeText(`${question.statement} ${question.ref}`).includes(needle)) : questions;
}

export async function getQuestion(id: string) {
  return db().question.findUnique({ where: { id }, include: { options: { orderBy: { position: "asc" } } } });
}

async function newQuestionRef(): Promise<string> {
  for (;;) {
    const ref = `q-${crypto.randomBytes(4).toString("hex")}`;
    if (!(await db().question.findUnique({ where: { ref } }))) return ref;
  }
}

/** Crée ou modifie une question (déjà contrôlée par checkQuestion). Renvoie son identifiant. */
export async function saveQuestion(id: string | null, input: QuestionInput, ref?: string): Promise<string> {
  return inTransaction(async () => {
    const data = {
      type: input.type,
      statement: input.statement.trim(),
      explanation: input.explanation.trim(),
      difficulty: input.difficulty,
      categoryId: input.categoryId,
    };
    const question = id
      ? await db().question.update({ where: { id }, data })
      : await db().question.create({ data: { ...data, ref: ref ?? (await newQuestionRef()) } });

    // Les réponses sont réécrites seulement si elles ont changé : cela préserve le
    // détail des tentatives déjà enregistrées quand on ne corrige que l'énoncé.
    const existing = await db().questionOption.findMany({ where: { questionId: question.id }, orderBy: { position: "asc" } });
    const wanted = input.options.map((option) => ({ label: option.label.trim(), isCorrect: option.isCorrect }));
    const same = existing.length === wanted.length && existing.every((option, index) => option.label === wanted[index].label && option.isCorrect === wanted[index].isCorrect);
    if (!same) {
      await db().questionOption.deleteMany({ where: { questionId: question.id } });
      for (const [position, option] of wanted.entries()) {
        await db().questionOption.create({ data: { questionId: question.id, ...option, position } });
      }
    }
    return question.id;
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  await inTransaction(async () => {
    await removeLinksOf({ type: "quiz.question", id });
    await db().question.deleteMany({ where: { id } });
  });
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

export async function listQuizzesForAdmin() {
  return db().quiz.findMany({ include: { rules: true, _count: { select: { questions: true, attempts: true } } }, orderBy: { createdAt: "asc" } });
}

export async function getQuizForEdit(id: string) {
  return db().quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { position: "asc" } }, rules: { orderBy: { position: "asc" } } },
  });
}

/** Nombre de questions qu'un quiz propose (pour un tirage : le total demandé par ses règles). */
export function plannedQuestionCount(quiz: { selection: string; rules: { count: number }[]; _count: { questions: number } }): number {
  return quiz.selection === "rules" ? quiz.rules.reduce((sum, rule) => sum + rule.count, 0) : quiz._count.questions;
}

/** Crée ou modifie un quiz (déjà contrôlé par checkQuiz). Renvoie son identifiant. */
export async function saveQuiz(id: string | null, input: QuizInput, slug?: string): Promise<string> {
  return inTransaction(async () => {
    const data = {
      title: input.title.trim(),
      description: input.description.trim(),
      status: input.status,
      modes: input.modes,
      selection: input.selection,
      searchText: normalizeText(`${input.title} ${input.description}`),
    };
    const isTaken = async (candidate: string) => RESERVED_SLUGS.has(candidate) || (await db().quiz.findUnique({ where: { slug: candidate } })) !== null;
    const quiz = id
      ? await db().quiz.update({ where: { id }, data })
      : await db().quiz.create({ data: { ...data, slug: slug ?? (await uniqueSlug(input.title, isTaken, "quiz")) } });

    await db().quizQuestion.deleteMany({ where: { quizId: quiz.id } });
    await db().quizRule.deleteMany({ where: { quizId: quiz.id } });
    if (input.selection === "manual") {
      const known = new Set((await db().question.findMany({ where: { id: { in: input.questionIds } }, select: { id: true } })).map((question) => question.id));
      const ids = [...new Set(input.questionIds)].filter((questionId) => known.has(questionId));
      for (const [position, questionId] of ids.entries()) await db().quizQuestion.create({ data: { quizId: quiz.id, questionId, position } });
    } else {
      for (const [position, rule] of input.rules.entries()) await db().quizRule.create({ data: { quizId: quiz.id, ...rule, position } });
    }
    return quiz.id;
  });
}

export async function deleteQuiz(id: string): Promise<void> {
  await inTransaction(async () => {
    await removeLinksOf({ type: "quiz.quiz", id });
    await db().quiz.deleteMany({ where: { id } });
  });
}

/** Les quiz publiés, tels que les lecteurs les voient, avec le dernier résultat de la personne. */
export async function listPublishedQuizzes(userId: string, limit?: number) {
  const quizzes = await db().quiz.findMany({
    where: { status: "published" },
    include: { rules: true, _count: { select: { questions: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const attempts = await db().quizAttempt.findMany({
    where: { userId, quizId: { in: quizzes.map((quiz) => quiz.id) }, finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
  });
  return quizzes.map((quiz) => ({
    ...quiz,
    questionCount: plannedQuestionCount(quiz),
    lastAttempt: attempts.find((attempt) => attempt.quizId === quiz.id) ?? null,
  }));
}

export async function getPublishedQuiz(slug: string) {
  const quiz = await db().quiz.findUnique({ where: { slug }, include: { rules: true, _count: { select: { questions: true } } } });
  if (!quiz || quiz.status !== "published") return null;
  return { ...quiz, questionCount: plannedQuestionCount(quiz) };
}

// ── Tentatives ───────────────────────────────────────────────────────────────

/** Démarre une tentative : tire les questions, les mélange, et mémorise le tirage. */
export async function startAttempt(quizId: string, userId: string, mode: AttemptMode, random: () => number = Math.random): Promise<string> {
  const quiz = await db().quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { position: "asc" } }, rules: { orderBy: { position: "asc" } } },
  });
  if (!quiz || quiz.status !== "published") throw new QuizError("notAvailable");
  if (!allowedModes(quiz.modes).includes(mode)) throw new QuizError("modeNotAllowed");

  const toCandidate = (question: { id: string; type: string; categoryId: string | null; difficulty: number; options: { id: string }[] }): Candidate => ({
    id: question.id,
    categoryId: question.categoryId,
    difficulty: question.difficulty,
    optionIds: question.options.map((option) => option.id),
    shuffleOptions: question.type !== "truefalse",
  });
  const withOptions = { options: { orderBy: { position: "asc" as const }, select: { id: true } } };

  let selected: Candidate[];
  if (quiz.selection === "rules") {
    const categories = await listCategories();
    const all = (await db().question.findMany({ include: withOptions })).map(toCandidate);
    selected = drawByRules(
      all,
      quiz.rules.map((rule) => ({
        categoryIds: rule.categoryId ? withDescendants(rule.categoryId, categories) : null,
        difficulty: rule.difficulty,
        count: rule.count,
      })),
      random,
    );
  } else {
    const questions = await db().question.findMany({ where: { id: { in: quiz.questions.map((link) => link.questionId) } }, include: withOptions });
    selected = questions.map(toCandidate);
  }
  if (selected.length === 0) throw new QuizError("empty");

  const draw = buildDraw(selected, random);
  const attempt = await db().quizAttempt.create({ data: { quizId, userId, mode, draw, total: draw.length } });
  return attempt.id;
}

async function loadAttempt(attemptId: string, userId: string) {
  const attempt = await db().quizAttempt.findUnique({ where: { id: attemptId }, include: { quiz: true, answers: true } });
  // Une tentative n'est visible que de la personne qui l'a passée.
  if (!attempt || attempt.userId !== userId) throw new QuizError("notFound");
  return { ...attempt, entries: attempt.draw as unknown as DrawEntry[] };
}

type ShownOption = { id: string; label: string };
export type ShownQuestion = { id: string; type: string; statement: string; options: ShownOption[] };
export type ReviewedQuestion = {
  id: string;
  type: string;
  statement: string;
  explanation: string;
  answered: boolean;
  isCorrect: boolean;
  options: (ShownOption & { isCorrect: boolean; selected: boolean })[];
};

export type AttemptView = {
  id: string;
  mode: AttemptMode;
  quiz: { id: string; slug: string; title: string };
  total: number;
  /** Numéro de la question en cours, à partir de 1 */
  position: number;
} & (
  | { phase: "question"; question: ShownQuestion }
  | { phase: "feedback"; review: ReviewedQuestion; isLast: boolean }
  | { phase: "finished"; score: number; finishedAt: Date; reviews: ReviewedQuestion[] }
);

/** Charge les questions d'un tirage, avec leurs réponses dans l'ordre mélangé de la tentative. */
async function questionsOfDraw(entries: DrawEntry[]) {
  const questions = await db().question.findMany({ where: { id: { in: entries.map((entry) => entry.q) } }, include: { options: true } });
  const byId = new Map(questions.map((question) => [question.id, question]));
  return entries.flatMap((entry) => {
    const question = byId.get(entry.q);
    if (!question) return []; // question supprimée depuis : elle n'apparaît plus dans le détail
    const options = entry.o.flatMap((optionId) => question.options.find((option) => option.id === optionId) ?? []);
    return [{ ...question, options }];
  });
}

function review(question: Awaited<ReturnType<typeof questionsOfDraw>>[number], answer: { selected: unknown; isCorrect: boolean } | undefined): ReviewedQuestion {
  const selected = new Set(Array.isArray(answer?.selected) ? (answer.selected as string[]) : []);
  return {
    id: question.id,
    type: question.type,
    statement: question.statement,
    explanation: question.explanation,
    answered: answer !== undefined,
    isCorrect: answer?.isCorrect ?? false,
    options: question.options.map((option) => ({ id: option.id, label: option.label, isCorrect: option.isCorrect, selected: selected.has(option.id) })),
  };
}

/**
 * Ce que la page de passage doit afficher. Tant que la question n'a pas reçu de réponse,
 * les bonnes réponses ne quittent jamais le serveur.
 */
export async function getAttemptView(attemptId: string, userId: string): Promise<AttemptView> {
  const attempt = await loadAttempt(attemptId, userId);
  const questions = await questionsOfDraw(attempt.entries);
  const answers = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
  const base = {
    id: attempt.id,
    mode: attempt.mode as AttemptMode,
    quiz: { id: attempt.quiz.id, slug: attempt.quiz.slug, title: attempt.quiz.title },
    total: attempt.total,
  };

  if (attempt.finishedAt) {
    return {
      ...base,
      position: attempt.total,
      phase: "finished",
      score: attempt.score ?? 0,
      finishedAt: attempt.finishedAt,
      reviews: questions.map((question) => review(question, answers.get(question.id))),
    };
  }

  const entry = attempt.entries[attempt.currentIndex];
  const question = questions.find((candidate) => candidate.id === entry?.q);
  if (!question) throw new QuizError("notFound");
  const position = attempt.currentIndex + 1;
  const answer = answers.get(question.id);
  if (answer) {
    // Entraînement : la réponse est donnée, on montre la correction avant de continuer.
    return { ...base, position, phase: "feedback", review: review(question, answer), isLast: position >= attempt.total };
  }
  return {
    ...base,
    position,
    phase: "question",
    question: { id: question.id, type: question.type, statement: question.statement, options: question.options.map(({ id, label }) => ({ id, label })) },
  };
}

async function finishOrAdvance(attemptId: string, currentIndex: number, total: number): Promise<{ finished: boolean; score?: number }> {
  if (currentIndex + 1 < total) {
    await db().quizAttempt.update({ where: { id: attemptId }, data: { currentIndex: currentIndex + 1 } });
    return { finished: false };
  }
  const score = scoreOf(await db().quizAttemptAnswer.findMany({ where: { attemptId } }));
  await db().quizAttempt.update({ where: { id: attemptId }, data: { score, finishedAt: new Date() } });
  return { finished: true, score };
}

export type AnswerOutcome = { questionId: string; isCorrect: boolean; quizId: string; mode: AttemptMode; finished: boolean; score?: number; total: number };

/**
 * Enregistre la réponse à la question en cours.
 * En évaluation, on passe aussitôt à la question suivante (ou on termine).
 * En entraînement, on reste sur la question pour afficher sa correction.
 */
export async function answerCurrentQuestion(attemptId: string, userId: string, selectedOptionIds: string[]): Promise<AnswerOutcome> {
  return inTransaction(async () => {
    const attempt = await loadAttempt(attemptId, userId);
    if (attempt.finishedAt) throw new QuizError("alreadyAnswered");
    const entry = attempt.entries[attempt.currentIndex];
    if (!entry || attempt.answers.some((answer) => answer.questionId === entry.q)) throw new QuizError("alreadyAnswered");

    const question = await db().question.findUnique({ where: { id: entry.q }, include: { options: true } });
    if (!question) throw new QuizError("notFound");
    const selected = [...new Set(selectedOptionIds)];
    // On n'accepte que des réponses proposées pour cette question, et une seule hors choix multiple.
    if (selected.length === 0 || selected.some((id) => !entry.o.includes(id)) || (question.type !== "multiple" && selected.length !== 1)) {
      throw new QuizError("invalidAnswer");
    }

    const isCorrect = isAnswerCorrect(question.options.filter((option) => option.isCorrect).map((option) => option.id), selected);
    await db().quizAttemptAnswer.create({ data: { attemptId, questionId: question.id, selected, isCorrect } });

    const mode = attempt.mode as AttemptMode;
    const progress = mode === "evaluation" ? await finishOrAdvance(attemptId, attempt.currentIndex, attempt.total) : { finished: false };
    return { questionId: question.id, isCorrect, quizId: attempt.quizId, mode, total: attempt.total, ...progress };
  });
}

/** Entraînement : après la correction, passe à la question suivante (ou termine). */
export async function advanceAttempt(attemptId: string, userId: string): Promise<{ finished: boolean; score?: number; quizId: string; total: number; mode: AttemptMode }> {
  return inTransaction(async () => {
    const attempt = await loadAttempt(attemptId, userId);
    if (attempt.finishedAt) return { finished: true, score: attempt.score ?? 0, quizId: attempt.quizId, total: attempt.total, mode: attempt.mode as AttemptMode };
    const entry = attempt.entries[attempt.currentIndex];
    if (!entry || !attempt.answers.some((answer) => answer.questionId === entry.q)) throw new QuizError("notAnswered");
    const progress = await finishOrAdvance(attemptId, attempt.currentIndex, attempt.total);
    return { ...progress, quizId: attempt.quizId, total: attempt.total, mode: attempt.mode as AttemptMode };
  });
}

/** L'historique des résultats d'une personne (éventuellement pour un seul quiz). */
export async function listUserAttempts(userId: string, quizId?: string) {
  return db().quizAttempt.findMany({
    where: { userId, quizId },
    include: { quiz: { select: { title: true, slug: true, status: true } } },
    orderBy: { startedAt: "desc" },
    take: 100,
  });
}
