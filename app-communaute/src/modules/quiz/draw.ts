/**
 * QUIZ — tirage et mélange des questions.
 *
 * Fonctions « pures » : on leur donne les questions disponibles et une source de hasard,
 * elles renvoient le tirage. Les tests peuvent ainsi fournir un hasard prévisible.
 */

export type Random = () => number;

export type Candidate = {
  id: string;
  categoryId: string | null;
  difficulty: number;
  optionIds: string[];
  /** Faux pour un vrai/faux : « Vrai » reste toujours avant « Faux » */
  shuffleOptions: boolean;
};

export type DrawRule = {
  /** Catégories acceptées (la catégorie choisie et ses sous-catégories) ; null = toutes */
  categoryIds: string[] | null;
  /** null = toutes les difficultés */
  difficulty: number | null;
  count: number;
};

/** Une question tirée : son identifiant et l'ordre dans lequel afficher ses réponses. */
export type DrawEntry = { q: string; o: string[] };

/** Mélange une liste (algorithme de Fisher-Yates), sans modifier la liste d'origine. */
export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/**
 * Applique les règles de tirage, l'une après l'autre. Une même question n'est jamais
 * tirée deux fois. Si une règle demande plus de questions qu'il n'en existe, on prend
 * toutes celles qui existent.
 */
export function drawByRules(candidates: readonly Candidate[], rules: readonly DrawRule[], random: Random = Math.random): Candidate[] {
  const drawn: Candidate[] = [];
  const taken = new Set<string>();
  for (const rule of rules) {
    const matching = candidates.filter(
      (candidate) =>
        !taken.has(candidate.id) &&
        (rule.difficulty === null || candidate.difficulty === rule.difficulty) &&
        (rule.categoryIds === null || (candidate.categoryId !== null && rule.categoryIds.includes(candidate.categoryId))),
    );
    for (const candidate of shuffle(matching, random).slice(0, rule.count)) {
      taken.add(candidate.id);
      drawn.push(candidate);
    }
  }
  return drawn;
}

/** Mélange l'ordre des questions et, pour chacune, l'ordre de ses réponses. */
export function buildDraw(questions: readonly Candidate[], random: Random = Math.random): DrawEntry[] {
  return shuffle(questions, random).map((question) => ({
    q: question.id,
    o: question.shuffleOptions ? shuffle(question.optionIds, random) : [...question.optionIds],
  }));
}
