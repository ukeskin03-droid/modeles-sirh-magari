/**
 * QUIZ — éléments d'affichage partagés par plusieurs écrans.
 */
import { LinkedContent } from "@/core/content/linked-fields";
import type { Translator } from "@/core/i18n/translate";
import { Badge } from "@/core/ui/elements";
import { Icon } from "@/core/ui/icons";
import { Markdown } from "@/core/ui/Markdown";
import { FALSE_CODE, TRUE_CODE } from "../model";
import type { ReviewedQuestion } from "../service";

/** Texte d'une réponse proposée : « Vrai » / « Faux » pour un vrai/faux, sinon son libellé. */
export function optionText(type: string, label: string, t: Translator): string {
  if (type !== "truefalse") return label;
  return label === TRUE_CODE ? t("quiz.option.true") : label === FALSE_CODE ? t("quiz.option.false") : label;
}

export function DifficultyBadge({ difficulty, t }: { difficulty: number; t: Translator }) {
  return <Badge tone={difficulty >= 3 ? "danger" : difficulty === 2 ? "warning" : "success"}>{t(`quiz.difficulty.${difficulty}`)}</Badge>;
}

/**
 * Correction d'une question : la réponse donnée, la bonne réponse, l'explication, et les
 * éventuels contenus liés proposés par d'autres modules actifs.
 */
export function ReviewCard({ review, number, t }: { review: ReviewedQuestion; number?: number; t: Translator }) {
  const tone = !review.answered ? "neutral" : review.isCorrect ? "success" : "danger";
  const verdict = !review.answered ? t("quiz.play.notAnswered") : review.isCorrect ? t("quiz.play.correct") : t("quiz.play.incorrect");
  return (
    <article className="rounded-xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex flex-wrap items-start gap-3">
        <h3 className="min-w-0 flex-1 basis-64 whitespace-pre-line font-semibold">
          {number !== undefined && <span className="text-muted">{number}. </span>}
          {review.statement}
        </h3>
        <Badge tone={tone}>{verdict}</Badge>
      </div>
      <ul className="mt-4 space-y-2">
        {review.options.map((option) => (
          <li
            key={option.id}
            className={`flex flex-wrap items-start gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
              option.isCorrect ? "border-success-text/40 bg-success-soft" : option.selected ? "border-danger-text/40 bg-danger-soft" : "border-line"
            }`}
          >
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center">
              {option.isCorrect ? <Icon name="check" className="size-5 text-success-text" /> : option.selected ? <Icon name="alert" className="size-5 text-danger-text" /> : null}
            </span>
            <span className="min-w-0 flex-1">{optionText(review.type, option.label, t)}</span>
            {/* L'information ne repose pas sur la seule couleur : elle est aussi écrite. */}
            <span className="w-full pl-8 text-xs font-semibold text-muted sm:w-auto sm:shrink-0 sm:pl-0">
              {[option.selected ? t("quiz.play.yourAnswer") : null, option.isCorrect ? t("quiz.play.rightAnswer") : null].filter(Boolean).join(" · ")}
            </span>
          </li>
        ))}
      </ul>
      {review.explanation && (
        <div className="mt-4 rounded-lg bg-surface-2 px-4 py-3 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("quiz.play.explanation")}</p>
          <Markdown compact>{review.explanation}</Markdown>
        </div>
      )}
      <LinkedContent hostType="quiz.question" hostId={review.id} />
    </article>
  );
}
