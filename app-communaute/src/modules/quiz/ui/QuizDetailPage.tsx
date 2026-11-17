import { notFound } from "next/navigation";
import { after } from "next/server";
import { recordActivity } from "@/core/activity/log";
import { formatDateTime } from "@/core/i18n/format";
import { ShareBox } from "@/core/share/ShareBox";
import { getT, requireViewer } from "@/core/request/context";
import { Alert, Badge, ButtonLink, Card, PageContainer, PageHeader } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";
import { startAttemptAction } from "../actions";
import { allowedModes } from "../model";
import { getPublishedQuiz, listUserAttempts } from "../service";

/** Présentation d'un quiz : choix du mode et démarrage. */
export async function QuizDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, t, viewer] = await Promise.all([params, getT(), requireViewer()]);
  const quiz = await getPublishedQuiz(slug);
  if (!quiz) notFound();

  after(() => recordActivity({ type: "content.view", userId: viewer.id, contentType: "quiz.quiz", contentId: quiz.id }));

  const attempts = await listUserAttempts(viewer.id, quiz.id);
  const inProgress = attempts.find((attempt) => !attempt.finishedAt);
  const finished = attempts.filter((attempt) => attempt.finishedAt).slice(0, 5);
  const modes = allowedModes(quiz.modes);

  return (
    <PageContainer narrow>
      <PageHeader title={quiz.title} description={quiz.description || undefined} back={{ href: "/quiz", label: t("quiz.detail.back") }} />
      <div className="mb-6 flex justify-end">
        <ShareBox contentType={"quiz.quiz"} contentId={quiz.id} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{t("quiz.list.questions", { count: quiz.questionCount })}</Badge>
          {modes.map((mode) => (
            <Badge key={mode} tone="info">
              {t(`quiz.mode.${mode}`)}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">{t("quiz.detail.shuffle")}</p>

        {inProgress && (
          <div className="mt-5">
            <Alert>
              <p>{t("quiz.detail.resumeText", { position: inProgress.currentIndex + 1, total: inProgress.total })}</p>
              <ButtonLink href={`/quiz/passage/${inProgress.id}`} className="mt-3">
                {t("quiz.detail.resume")}
              </ButtonLink>
            </Alert>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {modes.map((mode) => (
            <ActionForm key={mode} action={startAttemptAction} className="flex h-full flex-col rounded-lg border border-line p-4">
              <input type="hidden" name="quizId" value={quiz.id} />
              <input type="hidden" name="mode" value={mode} />
              <p className="font-semibold">{t(`quiz.mode.${mode}`)}</p>
              <p className="mb-4 mt-1 text-sm text-muted">{t(`quiz.mode.${mode}.help`)}</p>
              <SubmitButton variant={inProgress ? "secondary" : "primary"} className="mt-auto w-full">
                {t(mode === "training" ? "quiz.detail.startTraining" : "quiz.detail.startEvaluation")}
              </SubmitButton>
            </ActionForm>
          ))}
        </div>
      </Card>

      {finished.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">{t("quiz.detail.previous")}</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface text-sm">
            {finished.map((attempt) => (
              <li key={attempt.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">{formatDateTime(attempt.finishedAt!)}</span>
                <Badge>{t(`quiz.mode.${attempt.mode}`)}</Badge>
                <span className="font-semibold tabular-nums">{t("quiz.result.score", { score: attempt.score ?? 0, total: attempt.total })}</span>
                <ButtonLink href={`/quiz/passage/${attempt.id}`} variant="ghost" size="sm">
                  {t("quiz.history.review")}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageContainer>
  );
}
