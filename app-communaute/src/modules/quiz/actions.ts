"use server";

/**
 * QUIZ — actions déclenchées par les formulaires.
 * Chaque action revérifie que le module est actif et que la personne a le droit d'agir.
 */
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivity } from "@/core/activity/log";
import { saveLinkedFields } from "@/core/content/linked-fields";
import type { Translator } from "@/core/i18n/translate";
import { getT, requireModule, requireModuleCan } from "@/core/request/context";
import type { FormState } from "@/core/ui/forms";
import { checkQuestion, checkQuiz, isQuestionType, type InputIssue, type QuestionInput, type QuizInput } from "./model";
import { advanceAttempt, answerCurrentQuestion, deleteQuestion, deleteQuiz, QuizError, saveQuestion, saveQuiz, startAttempt } from "./service";

const text = (data: FormData, name: string) => String(data.get(name) ?? "");

function issuesToError(issues: InputIssue[], t: Translator): FormState {
  return { error: issues.map((issue) => t(issue.key, issue.params)).join(" ") };
}

async function quizError(error: unknown): Promise<FormState> {
  if (error instanceof QuizError) return { error: (await getT())(`quiz.error.${error.reason}`) };
  throw error;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ── Lecteur ──────────────────────────────────────────────────────────────────

export async function startAttemptAction(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireModule("quiz");
  let attemptId: string;
  try {
    attemptId = await startAttempt(text(data, "quizId"), viewer.id, text(data, "mode") === "evaluation" ? "evaluation" : "training");
  } catch (error) {
    return quizError(error);
  }
  redirect(`/quiz/passage/${attemptId}`);
}

async function recordCompletion(userId: string, outcome: { quizId: string; score?: number; total: number; mode: string }) {
  await recordActivity({
    type: "quiz.complete",
    userId,
    contentType: "quiz.quiz",
    contentId: outcome.quizId,
    meta: { score: outcome.score ?? 0, total: outcome.total, mode: outcome.mode },
  });
}

export async function answerAction(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireModule("quiz");
  try {
    const outcome = await answerCurrentQuestion(text(data, "attemptId"), viewer.id, data.getAll("option").map(String));
    // Journal d'activité : la réponse (pour repérer plus tard les questions les plus ratées).
    await recordActivity({
      type: "quiz.answer",
      userId: viewer.id,
      contentType: "quiz.question",
      contentId: outcome.questionId,
      meta: { correct: outcome.isCorrect, quiz: outcome.quizId, mode: outcome.mode },
    });
    if (outcome.finished) await recordCompletion(viewer.id, outcome);
  } catch (error) {
    return quizError(error);
  }
  refresh();
  return null;
}

export async function nextQuestionAction(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireModule("quiz");
  try {
    const outcome = await advanceAttempt(text(data, "attemptId"), viewer.id);
    if (outcome.finished) await recordCompletion(viewer.id, outcome);
  } catch (error) {
    return quizError(error);
  }
  refresh();
  return null;
}

// ── Administration : questions ───────────────────────────────────────────────

export async function saveQuestionAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireModuleCan("quiz", "quiz.manage");
  const t = await getT();
  const type = text(data, "type");
  const input: QuestionInput = {
    type: isQuestionType(type) ? type : "single",
    statement: text(data, "statement"),
    explanation: text(data, "explanation"),
    difficulty: Number(text(data, "difficulty")),
    categoryId: text(data, "categoryId") || null,
    options: parseJson<QuestionInput["options"]>(text(data, "options"), []).map((option) => ({
      label: String(option?.label ?? ""),
      isCorrect: Boolean(option?.isCorrect),
    })),
  };
  const issues = isQuestionType(type) ? checkQuestion(input) : [{ key: "quiz.error.type" }];
  if (issues.length > 0) return issuesToError(issues, t);

  const id = await saveQuestion(text(data, "id") || null, input);
  // Champs ajoutés au formulaire par d'autres modules actifs (voir core/content/linked-fields).
  await saveLinkedFields("quiz.question", id, data);
  redirect("/admin/quiz/questions");
}

export async function deleteQuestionAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireModuleCan("quiz", "quiz.manage");
  await deleteQuestion(text(data, "id"));
  redirect("/admin/quiz/questions");
}

// ── Administration : quiz ────────────────────────────────────────────────────

export async function saveQuizAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireModuleCan("quiz", "quiz.manage");
  const t = await getT();
  const rules = parseJson<{ categoryId?: string | null; difficulty?: number | null; count?: number }[]>(text(data, "rules"), []);
  const input: QuizInput = {
    title: text(data, "title"),
    description: text(data, "description"),
    status: text(data, "status") === "published" ? "published" : "draft",
    modes: (["both", "training", "evaluation"] as const).find((mode) => mode === text(data, "modes")) ?? "both",
    selection: text(data, "selection") === "rules" ? "rules" : "manual",
    questionIds: parseJson<string[]>(text(data, "questionIds"), []).map(String),
    rules: rules.map((rule) => ({
      categoryId: rule?.categoryId ? String(rule.categoryId) : null,
      difficulty: rule?.difficulty ? Number(rule.difficulty) : null,
      count: Number(rule?.count ?? 0),
    })),
  };
  const issues = checkQuiz(input);
  if (issues.length > 0) return issuesToError(issues, t);

  await saveQuiz(text(data, "id") || null, input);
  redirect("/admin/quiz");
}

export async function deleteQuizAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireModuleCan("quiz", "quiz.manage");
  await deleteQuiz(text(data, "id"));
  redirect("/admin/quiz");
}
