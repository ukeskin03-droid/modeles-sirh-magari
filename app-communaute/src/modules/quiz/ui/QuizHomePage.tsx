import Link from "next/link";
import { getT, requireViewer } from "@/core/request/context";
import { Badge, ButtonLink, EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";
import { Icon } from "@/core/ui/icons";
import { listPublishedQuizzes } from "../service";

/** Liste des quiz publiés. */
export async function QuizHomePage() {
  const [t, viewer] = await Promise.all([getT(), requireViewer()]);
  const quizzes = await listPublishedQuizzes(viewer.id);

  return (
    <PageContainer>
      <PageHeader title={t("quiz.page.title")} description={t("quiz.page.intro")}>
        <ButtonLink href="/quiz/resultats" variant="secondary">
          <Icon name="clock" className="size-4" />
          {t("quiz.history.link")}
        </ButtonLink>
      </PageHeader>

      {quizzes.length === 0 ? (
        <EmptyState icon="quiz" title={t("quiz.list.empty.title")} text={t("quiz.list.empty.text")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <Link
                href={`/quiz/${quiz.slug}`}
                className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-primary-text/50 hover:bg-surface-2"
              >
                <span className="text-lg font-semibold">{quiz.title}</span>
                {quiz.description && <span className="mt-1 line-clamp-3 text-sm text-muted">{quiz.description}</span>}
                <span className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-sm">
                  <Badge>{t("quiz.list.questions", { count: quiz.questionCount })}</Badge>
                  {quiz.lastAttempt ? (
                    <Badge tone="info">{t("quiz.list.lastScore", { score: quiz.lastAttempt.score ?? 0, total: quiz.lastAttempt.total })}</Badge>
                  ) : (
                    <span className="text-muted">{t("quiz.list.never")}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
