import { notFound } from "next/navigation";
import { getT, requireViewer } from "@/core/request/context";
import { ButtonLink, PageContainer, PageHeader } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";
import { answerAction, nextQuestionAction } from "../actions";
import { percentage } from "../scoring";
import { getAttemptView, QuizError, type AttemptView } from "../service";
import { optionText, ReviewCard } from "./shared";

/**
 * Passage d'un quiz. Selon l'avancement, la page affiche :
 *  - la question en cours ;
 *  - en entraînement, la correction de la question qui vient de recevoir une réponse ;
 *  - à la fin, le score et la correction détaillée.
 */
export async function QuizAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, viewer] = await Promise.all([params, getT(), requireViewer()]);
  let view: AttemptView;
  try {
    view = await getAttemptView(id, viewer.id);
  } catch (error) {
    if (error instanceof QuizError) notFound();
    throw error;
  }

  const back = { href: `/quiz/${view.quiz.slug}`, label: view.quiz.title };

  if (view.phase === "finished") {
    return (
      <PageContainer narrow>
        <PageHeader title={view.quiz.title} back={{ href: "/quiz", label: t("quiz.detail.back") }} />
        <section className="rounded-2xl bg-primary px-6 py-8 text-center text-on-primary">
          <h2 className="text-sm font-semibold uppercase tracking-wide">{t("quiz.result.title")}</h2>
          <p className="mt-2 text-4xl font-bold tabular-nums">{t("quiz.result.score", { score: view.score, total: view.total })}</p>
          <p className="mt-1">{t("quiz.result.percent", { percent: percentage(view.score, view.total) })}</p>
        </section>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href={back.href}>{t("quiz.result.again")}</ButtonLink>
          <ButtonLink href="/quiz" variant="secondary">
            {t("quiz.result.backToList")}
          </ButtonLink>
        </div>
        <h2 className="mb-4 mt-10 text-lg font-semibold">{t("quiz.result.details")}</h2>
        <div className="space-y-4">
          {view.reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} number={index + 1} t={t} />
          ))}
        </div>
      </PageContainer>
    );
  }

  const progress = (
    <div className="mb-6">
      <p className="mb-2 text-sm font-medium text-muted">
        {t(`quiz.mode.${view.mode}`)} · {t("quiz.play.progress", { position: view.position, total: view.total })}
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={view.total}
        aria-valuenow={view.position}
        aria-label={t("quiz.play.progress", { position: view.position, total: view.total })}
        className="h-2 overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${(view.position / view.total) * 100}%` }} />
      </div>
    </div>
  );

  if (view.phase === "feedback") {
    return (
      <PageContainer narrow>
        <PageHeader title={view.quiz.title} back={back} />
        {progress}
        <ReviewCard review={view.review} t={t} />
        <ActionForm action={nextQuestionAction} className="mt-5">
          <input type="hidden" name="attemptId" value={view.id} />
          <SubmitButton className="w-full sm:w-auto">{view.isLast ? t("quiz.play.finish") : t("quiz.play.next")}</SubmitButton>
        </ActionForm>
      </PageContainer>
    );
  }

  const { question } = view;
  const multiple = question.type === "multiple";
  return (
    <PageContainer narrow>
      <PageHeader title={view.quiz.title} back={back} />
      {progress}
      {/* key : un nouveau formulaire (vierge) à chaque question */}
      <ActionForm key={question.id} action={answerAction}>
        <input type="hidden" name="attemptId" value={view.id} />
        <fieldset className="rounded-xl border border-line bg-surface p-5 shadow-xs">
          <legend className="float-left mb-1 w-full whitespace-pre-line text-lg font-semibold">{question.statement}</legend>
          <p className="clear-both mb-4 text-sm text-muted">{t(`quiz.play.${question.type}`)}</p>
          <div className="space-y-2">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line px-4 py-3 has-checked:border-primary-text has-checked:bg-primary-soft"
              >
                <input type={multiple ? "checkbox" : "radio"} name="option" value={option.id} required={!multiple} className="size-5 shrink-0 accent-(--c-primary)" />
                <span>{optionText(question.type, option.label, t)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-5">
          <SubmitButton className="w-full sm:w-auto">{t("quiz.play.validate")}</SubmitButton>
        </div>
      </ActionForm>
    </PageContainer>
  );
}
