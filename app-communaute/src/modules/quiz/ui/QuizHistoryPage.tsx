import { formatDateTime } from "@/core/i18n/format";
import { getT, requireViewer } from "@/core/request/context";
import { Badge, ButtonLink, DataTable, EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";
import { listUserAttempts } from "../service";

/** Historique des résultats de la personne connectée (elle seule le voit). */
export async function QuizHistoryPage() {
  const [t, viewer] = await Promise.all([getT(), requireViewer()]);
  const attempts = await listUserAttempts(viewer.id);

  return (
    <PageContainer>
      <PageHeader title={t("quiz.history.title")} description={t("quiz.history.intro")} back={{ href: "/quiz", label: t("quiz.detail.back") }} />
      {attempts.length === 0 ? (
        <EmptyState icon="clock" title={t("quiz.history.empty")} />
      ) : (
        <DataTable
          caption={t("quiz.history.title")}
          headers={[t("quiz.history.col.quiz"), t("quiz.history.col.date"), t("quiz.history.col.mode"), t("quiz.history.col.score"), ""]}
        >
          {attempts.map((attempt) => (
            <tr key={attempt.id}>
              <th scope="row" className="px-4 py-3 text-left font-semibold">
                {attempt.quiz.title}
              </th>
              <td className="whitespace-nowrap px-4 py-3">{formatDateTime(attempt.finishedAt ?? attempt.startedAt)}</td>
              <td className="px-4 py-3">{t(`quiz.mode.${attempt.mode}`)}</td>
              <td className="px-4 py-3 tabular-nums">
                {attempt.finishedAt ? t("quiz.result.score", { score: attempt.score ?? 0, total: attempt.total }) : <Badge tone="warning">{t("quiz.history.inProgress")}</Badge>}
              </td>
              <td className="px-4 py-3 text-right">
                <ButtonLink href={`/quiz/passage/${attempt.id}`} variant="ghost" size="sm">
                  {attempt.finishedAt ? t("quiz.history.review") : t("quiz.history.resume")}
                </ButtonLink>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </PageContainer>
  );
}
