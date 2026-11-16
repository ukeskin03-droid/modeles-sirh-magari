import Link from "next/link";
import { getT, requireViewer } from "@/core/request/context";
import { HomeBlockCard } from "@/core/ui/blocks";
import { listPublishedQuizzes } from "../service";

/** Bloc du module sur la page d'accueil : les trois quiz les plus récents. */
export async function QuizHomeBlock() {
  const [t, viewer] = await Promise.all([getT(), requireViewer()]);
  const quizzes = await listPublishedQuizzes(viewer.id, 3);
  return (
    <HomeBlockCard icon="quiz" title={t("quiz.block.title")} text={quizzes.length === 0 ? t("quiz.block.text") : undefined} href="/quiz" linkLabel={t("quiz.block.all")}>
      {quizzes.length > 0 && (
        <ul className="space-y-2 text-sm">
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <Link href={`/quiz/${quiz.slug}`} className="font-medium hover:text-primary-text hover:underline">
                {quiz.title}
              </Link>
              <span className="block text-xs text-muted">
                {quiz.lastAttempt ? t("quiz.list.lastScore", { score: quiz.lastAttempt.score ?? 0, total: quiz.lastAttempt.total }) : t("quiz.list.never")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </HomeBlockCard>
  );
}
