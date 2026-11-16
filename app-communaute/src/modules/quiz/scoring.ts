/**
 * QUIZ — calcul du score.
 *
 * Règle : 1 point par question. Une question est réussie si les réponses cochées sont
 * EXACTEMENT les bonnes réponses : toutes, et elles seules. Pour un choix multiple, une
 * réponse partiellement juste ne rapporte donc pas de point.
 */

export function isAnswerCorrect(correctOptionIds: readonly string[], selectedOptionIds: readonly string[]): boolean {
  const correct = new Set(correctOptionIds);
  const selected = new Set(selectedOptionIds);
  if (correct.size === 0 || correct.size !== selected.size) return false;
  for (const id of selected) if (!correct.has(id)) return false;
  return true;
}

export function scoreOf(answers: readonly { isCorrect: boolean }[]): number {
  return answers.filter((answer) => answer.isCorrect).length;
}

/** Pourcentage de réussite, arrondi à l'entier. */
export function percentage(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}
