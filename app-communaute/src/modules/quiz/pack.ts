/**
 * QUIZ — ses sections de pack : questions.json et quizzes.json.
 *
 * Le format d'une question est aussi celui du modèle d'import « modele_questions.json » :
 *   { "ref": "q-001", "type": "single", "statement": "…",
 *     "options": [{ "label": "…", "correct": true }, …],      (choix unique ou multiple)
 *     "answer": true,                                           (vrai/faux)
 *     "explanation": "…", "difficulty": 2, "category": "parent/enfant",
 *     "links": ["knowledge.article:identifiant"] }
 */
import { categoriesById, categoryIdsByPath, listCategories } from "@/core/categories/service";
import { db } from "@/core/db/client";
import type { Translator } from "@/core/i18n/translate";
import type { PackSectionDefinition, PackSectionReport } from "@/core/modules/types";
import { linkStringsFrom, readJsonList } from "@/core/pack/links";
import { checkQuestion, checkQuiz, isQuestionType, trueFalseOptions, type InputIssue, type QuestionInput, type QuizInput } from "./model";
import { saveQuestion, saveQuiz } from "./service";

export const QUESTIONS_FILE = "questions.json";
export const QUIZZES_FILE = "quizzes.json";

const emptyReport = (): PackSectionReport => ({ created: 0, updated: 0, unchanged: 0, warnings: [], links: [] });
const asText = (value: unknown) => (typeof value === "string" ? value : value === undefined || value === null ? "" : String(value));

export type ParsedQuestion = { ref: string | null; input: QuestionInput; links: string[]; issues: InputIssue[] };

/**
 * Transforme un élément « brut » (venu d'un pack, d'un fichier JSON ou d'une ligne de
 * tableur) en question contrôlée. « categoryIds » fait correspondre un chemin de catégorie
 * à son identifiant.
 */
export function parseQuestionRecord(raw: unknown, categoryIds: ReadonlyMap<string, string>): ParsedQuestion {
  const record = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const type = asText(record.type).trim().toLowerCase();
  const issues: InputIssue[] = [];

  let options: QuestionInput["options"] = [];
  if (type === "truefalse") {
    if (typeof record.answer === "boolean") options = trueFalseOptions(record.answer);
  } else if (Array.isArray(record.options)) {
    options = record.options.map((option) => {
      const item = (option && typeof option === "object" ? option : {}) as Record<string, unknown>;
      return { label: asText(item.label), isCorrect: item.correct === true };
    });
  }

  const categoryPath = asText(record.category).trim();
  const categoryId = categoryPath ? (categoryIds.get(categoryPath) ?? null) : null;
  if (categoryPath && !categoryId) issues.push({ key: "core.pack.unknownCategory", params: { path: categoryPath } });

  const input: QuestionInput = {
    type: isQuestionType(type) ? type : "single",
    statement: asText(record.statement),
    explanation: asText(record.explanation),
    difficulty: record.difficulty === undefined || record.difficulty === "" ? 1 : Number(record.difficulty),
    categoryId,
    options,
  };
  const blocking = isQuestionType(type) ? checkQuestion(input) : [{ key: "quiz.error.type" }];
  return {
    ref: asText(record.ref).trim() || null,
    input,
    links: Array.isArray(record.links) ? record.links.map(asText).filter(Boolean) : [],
    // Une catégorie inconnue n'empêche pas l'import ; les autres anomalies, si.
    issues: [...blocking, ...issues],
  };
}

/** Vrai si une anomalie empêche d'enregistrer l'élément (une catégorie inconnue ne l'empêche pas). */
export const isBlocking = (issue: InputIssue) => issue.key !== "core.pack.unknownCategory";

function sameQuestion(existing: { type: string; statement: string; explanation: string; difficulty: number; categoryId: string | null; options: { label: string; isCorrect: boolean }[] }, input: QuestionInput): boolean {
  return (
    existing.type === input.type &&
    existing.statement === input.statement.trim() &&
    existing.explanation === input.explanation.trim() &&
    existing.difficulty === input.difficulty &&
    existing.categoryId === input.categoryId &&
    existing.options.length === input.options.length &&
    existing.options.every((option, index) => option.label === input.options[index].label.trim() && option.isCorrect === input.options[index].isCorrect)
  );
}

/** Enregistre une liste de questions déjà analysées (pack ou import de fichier). */
export async function importQuestions(parsed: readonly ParsedQuestion[], t: Translator, source: string): Promise<PackSectionReport> {
  const report = emptyReport();
  for (const [index, item] of parsed.entries()) {
    const where = t("core.pack.file", { file: source, index: index + 1 });
    for (const issue of item.issues) report.warnings.push(`${where} : ${t(issue.key, issue.params)}`);
    if (item.issues.some(isBlocking)) continue;

    const existing = item.ref ? await db().question.findUnique({ where: { ref: item.ref }, include: { options: { orderBy: { position: "asc" } } } }) : null;
    let ref = item.ref;
    if (!existing) {
      const id = await saveQuestion(null, item.input, item.ref ?? undefined);
      ref ??= (await db().question.findUniqueOrThrow({ where: { id } })).ref;
      report.created++;
    } else if (sameQuestion(existing, item.input)) {
      report.unchanged++;
    } else {
      await saveQuestion(existing.id, item.input);
      report.updated++;
    }
    for (const to of item.links) report.links.push({ fromType: "quiz.question", fromKey: ref!, to });
  }
  return report;
}

const questionsSection: PackSectionDefinition = {
  id: "quiz.questions",
  labelKey: "quiz.pack.questions",

  async import(files, { t }) {
    const warnings: string[] = [];
    const list = readJsonList(files, QUESTIONS_FILE, t, warnings);
    if (!list) return emptyReport();
    const categoryIds = categoryIdsByPath(await listCategories());
    const report = await importQuestions(list.map((raw) => parseQuestionRecord(raw, categoryIds)), t, QUESTIONS_FILE);
    return { ...report, warnings: [...warnings, ...report.warnings] };
  },

  async export() {
    const categories = categoriesById(await listCategories());
    const questions = await db().question.findMany({ include: { options: { orderBy: { position: "asc" } } }, orderBy: { ref: "asc" } });
    if (questions.length === 0) return new Map();
    const list = [];
    for (const question of questions) {
      const links = await linkStringsFrom("quiz.question", question.id);
      list.push({
        ref: question.ref,
        type: question.type,
        statement: question.statement,
        ...(question.type === "truefalse"
          ? { answer: question.options[0]?.isCorrect ?? false }
          : { options: question.options.map((option) => ({ label: option.label, correct: option.isCorrect })) }),
        explanation: question.explanation,
        difficulty: question.difficulty,
        ...(question.categoryId && categories.has(question.categoryId) ? { category: categories.get(question.categoryId)!.path } : {}),
        ...(links.length > 0 ? { links } : {}),
      });
    }
    return new Map([[QUESTIONS_FILE, `${JSON.stringify(list, null, 2)}\n`]]);
  },
};

const quizzesSection: PackSectionDefinition = {
  id: "quiz.quizzes",
  labelKey: "quiz.pack.quizzes",

  async import(files, { t }) {
    const report = emptyReport();
    const list = readJsonList(files, QUIZZES_FILE, t, report.warnings);
    if (!list) return report;
    const categoryIds = categoryIdsByPath(await listCategories());

    for (const [index, raw] of list.entries()) {
      const where = t("core.pack.file", { file: QUIZZES_FILE, index: index + 1 });
      const record = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const slug = asText(record.slug).trim();

      // Questions désignées par leur référence
      const questionIds: string[] = [];
      for (const ref of Array.isArray(record.questions) ? record.questions.map(asText) : []) {
        const question = await db().question.findUnique({ where: { ref }, select: { id: true } });
        if (question) questionIds.push(question.id);
        else report.warnings.push(`${where} : ${t("core.pack.unknownLinkTarget", { target: ref })}`);
      }
      const rules = (Array.isArray(record.rules) ? record.rules : []).map((rule) => {
        const item = (rule && typeof rule === "object" ? rule : {}) as Record<string, unknown>;
        const path = asText(item.category).trim();
        if (path && !categoryIds.has(path)) report.warnings.push(`${where} : ${t("core.pack.unknownCategory", { path })}`);
        return { categoryId: path ? (categoryIds.get(path) ?? null) : null, difficulty: item.difficulty ? Number(item.difficulty) : null, count: Number(item.count ?? 0) };
      });

      const input: QuizInput = {
        title: asText(record.title),
        description: asText(record.description),
        status: record.status === "published" ? "published" : "draft",
        modes: (["both", "training", "evaluation"] as const).find((mode) => mode === record.modes) ?? "both",
        selection: record.selection === "rules" ? "rules" : "manual",
        questionIds,
        rules,
      };
      const issues = checkQuiz(input);
      if (issues.length > 0) {
        for (const issue of issues) report.warnings.push(`${where} : ${t(issue.key, issue.params)}`);
        continue;
      }

      const existing = slug ? await db().quiz.findUnique({ where: { slug }, include: { questions: { orderBy: { position: "asc" } }, rules: { orderBy: { position: "asc" } } } }) : null;
      if (!existing) {
        await saveQuiz(null, input, slug || undefined);
        report.created++;
        continue;
      }
      const same =
        existing.title === input.title.trim() &&
        existing.description === input.description.trim() &&
        existing.status === input.status &&
        existing.modes === input.modes &&
        existing.selection === input.selection &&
        JSON.stringify(existing.questions.map((link) => link.questionId)) === JSON.stringify(input.selection === "manual" ? questionIds : []) &&
        JSON.stringify(existing.rules.map(({ categoryId, difficulty, count }) => ({ categoryId, difficulty, count }))) === JSON.stringify(input.selection === "rules" ? rules : []);
      if (same) report.unchanged++;
      else {
        await saveQuiz(existing.id, input);
        report.updated++;
      }
    }
    return report;
  },

  async export() {
    const categories = categoriesById(await listCategories());
    const quizzes = await db().quiz.findMany({
      include: { questions: { orderBy: { position: "asc" }, include: { question: { select: { ref: true } } } }, rules: { orderBy: { position: "asc" } } },
      orderBy: { slug: "asc" },
    });
    if (quizzes.length === 0) return new Map();
    const list = quizzes.map((quiz) => ({
      slug: quiz.slug,
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      modes: quiz.modes,
      selection: quiz.selection,
      ...(quiz.selection === "rules"
        ? {
            rules: quiz.rules.map((rule) => ({
              ...(rule.categoryId && categories.has(rule.categoryId) ? { category: categories.get(rule.categoryId)!.path } : {}),
              ...(rule.difficulty ? { difficulty: rule.difficulty } : {}),
              count: rule.count,
            })),
          }
        : { questions: quiz.questions.map((link) => link.question.ref) }),
    }));
    return new Map([[QUIZZES_FILE, `${JSON.stringify(list, null, 2)}\n`]]);
  },
};

export const quizPackSections = [questionsSection, quizzesSection];
