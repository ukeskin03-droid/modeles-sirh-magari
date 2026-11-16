/**
 * QUIZ — calcul du score, tirage, déroulement d'un passage, contrôles de saisie.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/core/db/client";
import { buildDraw, drawByRules, shuffle, type Candidate } from "@/modules/quiz/draw";
import { checkQuestion, checkQuiz, trueFalseOptions, type QuestionInput } from "@/modules/quiz/model";
import { isAnswerCorrect, percentage, scoreOf } from "@/modules/quiz/scoring";
import { advanceAttempt, answerCurrentQuestion, deleteQuestion, getAttemptView, listUserAttempts, saveQuestion, saveQuiz, startAttempt } from "@/modules/quiz/service";
import { resetDatabase } from "./support/database";

/** Un « hasard » prévisible, pour des tests reproductibles. */
function seededRandom(seed = 1) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("calcul du score", () => {
  it("choix unique : la bonne réponse, et elle seule", () => {
    expect(isAnswerCorrect(["a"], ["a"])).toBe(true);
    expect(isAnswerCorrect(["a"], ["b"])).toBe(false);
    expect(isAnswerCorrect(["a"], [])).toBe(false);
  });

  it("choix multiple : toutes les bonnes réponses, et elles seules", () => {
    expect(isAnswerCorrect(["a", "b"], ["b", "a"])).toBe(true);
    expect(isAnswerCorrect(["a", "b"], ["a"])).toBe(false); // il en manque une
    expect(isAnswerCorrect(["a", "b"], ["a", "b", "c"])).toBe(false); // une de trop
    expect(isAnswerCorrect(["a", "b"], ["a", "c"])).toBe(false);
  });

  it("une réponse cochée deux fois ne compte qu'une fois", () => {
    expect(isAnswerCorrect(["a", "b"], ["a", "a", "b"])).toBe(true);
  });

  it("un point par question réussie", () => {
    expect(scoreOf([{ isCorrect: true }, { isCorrect: false }, { isCorrect: true }])).toBe(2);
    expect(percentage(2, 3)).toBe(67);
    expect(percentage(0, 0)).toBe(0);
  });
});

describe("tirage", () => {
  const candidate = (id: string, categoryId: string | null, difficulty: number): Candidate => ({ id, categoryId, difficulty, optionIds: [`${id}-1`, `${id}-2`, `${id}-3`], shuffleOptions: true });
  const bank = [candidate("q1", "A", 1), candidate("q2", "A", 2), candidate("q3", "B", 1), candidate("q4", "B", 3), candidate("q5", null, 2), candidate("q6", "A1", 1)];

  it("respecte la catégorie, la difficulté et le nombre", () => {
    const drawn = drawByRules(bank, [{ categoryIds: ["A", "A1"], difficulty: 1, count: 5 }], seededRandom());
    expect(drawn.map((question) => question.id).sort()).toEqual(["q1", "q6"]);
    expect(drawByRules(bank, [{ categoryIds: null, difficulty: null, count: 3 }], seededRandom())).toHaveLength(3);
  });

  it("ne tire jamais deux fois la même question", () => {
    const drawn = drawByRules(bank, [{ categoryIds: ["A"], difficulty: null, count: 2 }, { categoryIds: null, difficulty: null, count: 10 }], seededRandom(7));
    const ids = drawn.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(bank.length);
  });

  it("mélange les questions et les réponses, sans en perdre", () => {
    const draw = buildDraw(bank, seededRandom(3));
    expect(draw.map((entry) => entry.q).sort()).toEqual(bank.map((question) => question.id).sort());
    expect(draw.map((entry) => entry.q)).not.toEqual(bank.map((question) => question.id));
    for (const entry of draw) expect([...entry.o].sort()).toEqual([`${entry.q}-1`, `${entry.q}-2`, `${entry.q}-3`]);
  });

  it("ne mélange pas les réponses d'un vrai/faux", () => {
    const trueFalse = { ...candidate("vf", null, 1), optionIds: ["vrai", "faux"], shuffleOptions: false };
    for (let seed = 1; seed < 20; seed++) expect(buildDraw([trueFalse], seededRandom(seed))[0].o).toEqual(["vrai", "faux"]);
  });

  it("le mélange ne modifie pas la liste d'origine", () => {
    const original = [1, 2, 3, 4, 5];
    shuffle(original, seededRandom());
    expect(original).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("contrôles de saisie", () => {
  const base: QuestionInput = { type: "single", statement: "Énoncé", explanation: "", difficulty: 1, categoryId: null, options: [{ label: "A", isCorrect: true }, { label: "B", isCorrect: false }] };
  const keys = (input: QuestionInput) => checkQuestion(input).map((issue) => issue.key);

  it("accepte une question correcte de chaque type", () => {
    expect(keys(base)).toEqual([]);
    expect(keys({ ...base, type: "multiple", options: [{ label: "A", isCorrect: true }, { label: "B", isCorrect: true }] })).toEqual([]);
    expect(keys({ ...base, type: "truefalse", options: trueFalseOptions(false) })).toEqual([]);
  });

  it("refuse les questions mal formées, avec un message précis", () => {
    expect(keys({ ...base, statement: "  " })).toContain("quiz.error.statement");
    expect(keys({ ...base, difficulty: 4 })).toContain("quiz.error.difficulty");
    expect(keys({ ...base, options: [{ label: "A", isCorrect: true }] })).toContain("quiz.error.optionCount");
    expect(keys({ ...base, options: [{ label: "A", isCorrect: true }, { label: "B", isCorrect: true }] })).toContain("quiz.error.singleCorrect");
    expect(keys({ ...base, options: [{ label: "A", isCorrect: false }, { label: "B", isCorrect: false }] })).toContain("quiz.error.singleCorrect");
    expect(keys({ ...base, type: "multiple", options: [{ label: "A", isCorrect: false }, { label: "B", isCorrect: false }] })).toContain("quiz.error.multipleCorrect");
    expect(keys({ ...base, options: [{ label: "A", isCorrect: true }, { label: " ", isCorrect: false }] })).toContain("quiz.error.optionEmpty");
    expect(keys({ ...base, type: "truefalse" })).toContain("quiz.error.trueFalse");
  });

  it("un quiz publié doit avoir des questions ; un tirage doit avoir des règles valides", () => {
    const quiz = { title: "T", description: "", status: "published" as const, modes: "both" as const, selection: "manual" as const, questionIds: [], rules: [] };
    expect(checkQuiz(quiz).map((issue) => issue.key)).toEqual(["quiz.error.noQuestions"]);
    expect(checkQuiz({ ...quiz, status: "draft" })).toEqual([]);
    expect(checkQuiz({ ...quiz, selection: "rules" }).map((issue) => issue.key)).toEqual(["quiz.error.noRules"]);
    expect(checkQuiz({ ...quiz, selection: "rules", rules: [{ categoryId: null, difficulty: null, count: 0 }] }).map((issue) => issue.key)).toEqual(["quiz.error.ruleCount"]);
    expect(checkQuiz({ ...quiz, title: "" }).map((issue) => issue.key)).toContain("quiz.error.title");
  });
});

describe("déroulement d'un passage", () => {
  const USER = "utilisateur-1";
  let quizId: string;
  let questionIds: string[];

  /** Les identifiants des bonnes réponses d'une question. */
  const rightAnswers = async (questionId: string) => (await db().questionOption.findMany({ where: { questionId, isCorrect: true } })).map((option) => option.id);
  const wrongAnswers = async (questionId: string) => (await db().questionOption.findMany({ where: { questionId, isCorrect: false } })).map((option) => option.id);

  beforeEach(async () => {
    await resetDatabase();
    await db().quiz.deleteMany();
    await db().question.deleteMany();
    questionIds = [];
    questionIds.push(await saveQuestion(null, { type: "single", statement: "Q1", explanation: "E1", difficulty: 1, categoryId: null, options: [{ label: "A", isCorrect: true }, { label: "B", isCorrect: false }, { label: "C", isCorrect: false }] }));
    questionIds.push(await saveQuestion(null, { type: "multiple", statement: "Q2", explanation: "E2", difficulty: 2, categoryId: null, options: [{ label: "A", isCorrect: true }, { label: "B", isCorrect: true }, { label: "C", isCorrect: false }] }));
    questionIds.push(await saveQuestion(null, { type: "truefalse", statement: "Q3", explanation: "E3", difficulty: 3, categoryId: null, options: trueFalseOptions(true) }));
    quizId = await saveQuiz(null, { title: "Quiz d'essai", description: "", status: "published", modes: "both", selection: "manual", questionIds, rules: [] });
  });

  it("évaluation : pas de correction en cours de route, score et correction à la fin", async () => {
    const attemptId = await startAttempt(quizId, USER, "evaluation", seededRandom());
    for (let position = 1; position <= 3; position++) {
      const view = await getAttemptView(attemptId, USER);
      expect(view.phase).toBe("question");
      if (view.phase !== "question") return;
      expect(view.position).toBe(position);
      // Les bonnes réponses ne sont pas transmises avec la question.
      expect(JSON.stringify(view)).not.toContain("isCorrect");
      // On répond juste aux deux premières, faux à la dernière.
      const answer = position < 3 ? await rightAnswers(view.question.id) : (await wrongAnswers(view.question.id)).slice(0, 1);
      const outcome = await answerCurrentQuestion(attemptId, USER, answer);
      expect(outcome.finished).toBe(position === 3);
    }
    const final = await getAttemptView(attemptId, USER);
    expect(final.phase).toBe("finished");
    if (final.phase !== "finished") return;
    expect(final.score).toBe(2);
    expect(final.total).toBe(3);
    expect(final.reviews.map((review) => review.isCorrect)).toEqual([true, true, false]);
    expect(final.reviews.every((review) => review.explanation.startsWith("E"))).toBe(true);
  });

  it("entraînement : correction après chaque réponse, puis question suivante", async () => {
    const attemptId = await startAttempt(quizId, USER, "training", seededRandom());
    const first = await getAttemptView(attemptId, USER);
    if (first.phase !== "question") throw new Error("phase inattendue");
    // Impossible d'avancer sans avoir répondu.
    await expect(advanceAttempt(attemptId, USER)).rejects.toMatchObject({ reason: "notAnswered" });

    await answerCurrentQuestion(attemptId, USER, await rightAnswers(first.question.id));
    const feedback = await getAttemptView(attemptId, USER);
    expect(feedback.phase).toBe("feedback");
    if (feedback.phase !== "feedback") return;
    expect(feedback.review.isCorrect).toBe(true);
    expect(feedback.review.explanation).not.toBe("");
    expect(feedback.position).toBe(1);
    // Impossible de répondre deux fois à la même question.
    await expect(answerCurrentQuestion(attemptId, USER, await wrongAnswers(first.question.id))).rejects.toMatchObject({ reason: "alreadyAnswered" });

    await advanceAttempt(attemptId, USER);
    const second = await getAttemptView(attemptId, USER);
    expect(second.phase).toBe("question");
    expect(second.position).toBe(2);
  });

  it("le tirage est mémorisé : recharger la page ne redistribue rien", async () => {
    const attemptId = await startAttempt(quizId, USER, "evaluation");
    const first = await getAttemptView(attemptId, USER);
    const again = await getAttemptView(attemptId, USER);
    expect(again).toEqual(first);
  });

  it("refuse une réponse qui ne fait pas partie des propositions, ou plusieurs réponses à un choix unique", async () => {
    const attemptId = await startAttempt(quizId, USER, "evaluation", seededRandom());
    const view = await getAttemptView(attemptId, USER);
    if (view.phase !== "question") throw new Error("phase inattendue");
    await expect(answerCurrentQuestion(attemptId, USER, ["identifiant-invente"])).rejects.toMatchObject({ reason: "invalidAnswer" });
    await expect(answerCurrentQuestion(attemptId, USER, [])).rejects.toMatchObject({ reason: "invalidAnswer" });
    if (view.question.type !== "multiple") {
      await expect(answerCurrentQuestion(attemptId, USER, view.question.options.map((option) => option.id))).rejects.toMatchObject({ reason: "invalidAnswer" });
    }
  });

  it("un passage n'est visible que de la personne qui l'a fait", async () => {
    const attemptId = await startAttempt(quizId, USER, "training");
    await expect(getAttemptView(attemptId, "quelqu-un-d-autre")).rejects.toMatchObject({ reason: "notFound" });
    await expect(answerCurrentQuestion(attemptId, "quelqu-un-d-autre", ["x"])).rejects.toMatchObject({ reason: "notFound" });
    expect(await listUserAttempts("quelqu-un-d-autre")).toEqual([]);
    expect(await listUserAttempts(USER)).toHaveLength(1);
  });

  it("refuse un quiz non publié, un mode non proposé, un quiz sans question", async () => {
    const draft = await saveQuiz(null, { title: "Brouillon", description: "", status: "draft", modes: "both", selection: "manual", questionIds, rules: [] });
    await expect(startAttempt(draft, USER, "training")).rejects.toMatchObject({ reason: "notAvailable" });
    const trainingOnly = await saveQuiz(null, { title: "Entraînement", description: "", status: "published", modes: "training", selection: "manual", questionIds, rules: [] });
    await expect(startAttempt(trainingOnly, USER, "evaluation")).rejects.toMatchObject({ reason: "modeNotAllowed" });
    const impossible = await saveQuiz(null, { title: "Tirage vide", description: "", status: "published", modes: "both", selection: "rules", questionIds: [], rules: [{ categoryId: "inexistante", difficulty: null, count: 3 }] });
    await expect(startAttempt(impossible, USER, "training")).rejects.toMatchObject({ reason: "empty" });
  });

  it("un tirage par règles donne le bon nombre de questions", async () => {
    const byRules = await saveQuiz(null, { title: "Tirage", description: "", status: "published", modes: "both", selection: "rules", questionIds: [], rules: [{ categoryId: null, difficulty: null, count: 2 }] });
    const attemptId = await startAttempt(byRules, USER, "evaluation");
    expect((await getAttemptView(attemptId, USER)).total).toBe(2);
  });

  it("corriger l'énoncé d'une question ne perd pas le détail des passages ; la supprimer garde le score", async () => {
    const attemptId = await startAttempt(quizId, USER, "evaluation", seededRandom());
    for (let position = 0; position < 3; position++) {
      const view = await getAttemptView(attemptId, USER);
      if (view.phase !== "question") throw new Error("phase inattendue");
      await answerCurrentQuestion(attemptId, USER, await rightAnswers(view.question.id));
    }
    const question = await db().question.findUniqueOrThrow({ where: { id: questionIds[0] }, include: { options: { orderBy: { position: "asc" } } } });
    await saveQuestion(question.id, { type: "single", statement: "Q1 corrigée", explanation: "E1", difficulty: 1, categoryId: null, options: question.options.map(({ label, isCorrect }) => ({ label, isCorrect })) });
    let view = await getAttemptView(attemptId, USER);
    if (view.phase !== "finished") throw new Error("phase inattendue");
    expect(view.reviews.find((review) => review.id === question.id)?.options.some((option) => option.selected)).toBe(true);

    await deleteQuestion(question.id);
    view = await getAttemptView(attemptId, USER);
    if (view.phase !== "finished") throw new Error("phase inattendue");
    expect(view.score).toBe(3);
    expect(view.reviews).toHaveLength(2);
  });
});
