/**
 * QUIZ — formes des données et contrôles de saisie.
 *
 * Les mêmes contrôles servent au formulaire d'administration, à l'import de fichiers et
 * à l'import de packs : une question refusée ici l'est partout, avec le même message.
 */

export const QUESTION_TYPES = ["single", "multiple", "truefalse"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUIZ_MODES = ["both", "training", "evaluation"] as const;
export type QuizModes = (typeof QUIZ_MODES)[number];
export type AttemptMode = "training" | "evaluation";

export const QUIZ_STATUSES = ["draft", "published"] as const;
export type QuizStatus = (typeof QUIZ_STATUSES)[number];

/** Pour un vrai/faux, les deux réponses sont enregistrées sous ces codes (affichés « Vrai » / « Faux »). */
export const TRUE_CODE = "true";
export const FALSE_CODE = "false";

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 8;

export type QuestionInput = {
  type: QuestionType;
  statement: string;
  explanation: string;
  difficulty: number;
  categoryId: string | null;
  options: { label: string; isCorrect: boolean }[];
};

/** Une anomalie de saisie : la clé d'un libellé, et les valeurs à y insérer. */
export type InputIssue = { key: string; params?: Record<string, string | number> };

export function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === "string" && (QUESTION_TYPES as readonly string[]).includes(value);
}

/** Les deux réponses d'un vrai/faux, selon la bonne réponse. */
export function trueFalseOptions(answerIsTrue: boolean): QuestionInput["options"] {
  return [
    { label: TRUE_CODE, isCorrect: answerIsTrue },
    { label: FALSE_CODE, isCorrect: !answerIsTrue },
  ];
}

/** Contrôle une question. Renvoie la liste des anomalies (vide si tout est correct). */
export function checkQuestion(input: QuestionInput): InputIssue[] {
  const issues: InputIssue[] = [];
  if (!isQuestionType(input.type)) return [{ key: "quiz.error.type" }];
  if (!input.statement.trim()) issues.push({ key: "quiz.error.statement" });
  if (input.statement.length > 2000) issues.push({ key: "quiz.error.statementLength" });
  if (input.explanation.length > 5000) issues.push({ key: "quiz.error.explanationLength" });
  if (!Number.isInteger(input.difficulty) || input.difficulty < 1 || input.difficulty > 3) issues.push({ key: "quiz.error.difficulty" });

  const correct = input.options.filter((option) => option.isCorrect).length;
  if (input.type === "truefalse") {
    const labels = input.options.map((option) => option.label);
    if (labels.length !== 2 || labels[0] !== TRUE_CODE || labels[1] !== FALSE_CODE || correct !== 1) issues.push({ key: "quiz.error.trueFalse" });
    return issues;
  }

  if (input.options.length < MIN_OPTIONS || input.options.length > MAX_OPTIONS) {
    issues.push({ key: "quiz.error.optionCount", params: { min: MIN_OPTIONS, max: MAX_OPTIONS } });
  }
  if (input.options.some((option) => !option.label.trim())) issues.push({ key: "quiz.error.optionEmpty" });
  if (input.options.some((option) => option.label.length > 500)) issues.push({ key: "quiz.error.optionLength" });
  if (input.type === "single" && correct !== 1) issues.push({ key: "quiz.error.singleCorrect" });
  if (input.type === "multiple" && correct < 1) issues.push({ key: "quiz.error.multipleCorrect" });
  return issues;
}

export type QuizInput = {
  title: string;
  description: string;
  status: QuizStatus;
  modes: QuizModes;
  selection: "manual" | "rules";
  /** Composition manuelle : identifiants des questions, dans l'ordre */
  questionIds: string[];
  /** Composition par tirage */
  rules: { categoryId: string | null; difficulty: number | null; count: number }[];
};

export function checkQuiz(input: QuizInput): InputIssue[] {
  const issues: InputIssue[] = [];
  if (!input.title.trim()) issues.push({ key: "quiz.error.title" });
  if (input.title.length > 150) issues.push({ key: "quiz.error.titleLength" });
  if (input.description.length > 1000) issues.push({ key: "quiz.error.descriptionLength" });
  if (!(QUIZ_STATUSES as readonly string[]).includes(input.status) || !(QUIZ_MODES as readonly string[]).includes(input.modes)) {
    issues.push({ key: "quiz.error.invalid" });
  }
  if (input.selection === "manual") {
    if (input.status === "published" && input.questionIds.length === 0) issues.push({ key: "quiz.error.noQuestions" });
  } else if (input.selection === "rules") {
    if (input.rules.length === 0) issues.push({ key: "quiz.error.noRules" });
    for (const rule of input.rules) {
      if (!Number.isInteger(rule.count) || rule.count < 1 || rule.count > 100) issues.push({ key: "quiz.error.ruleCount" });
      if (rule.difficulty !== null && (!Number.isInteger(rule.difficulty) || rule.difficulty < 1 || rule.difficulty > 3)) {
        issues.push({ key: "quiz.error.difficulty" });
      }
    }
  } else {
    issues.push({ key: "quiz.error.invalid" });
  }
  return issues;
}

/** Les modes qu'un lecteur peut choisir pour un quiz. */
export function allowedModes(modes: string): AttemptMode[] {
  if (modes === "training") return ["training"];
  if (modes === "evaluation") return ["evaluation"];
  return ["training", "evaluation"];
}
