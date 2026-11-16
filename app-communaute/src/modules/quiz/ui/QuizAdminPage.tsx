import Link from "next/link";
import { db } from "@/core/db/client";
import { getT } from "@/core/request/context";
import { Badge, ButtonLink, DataTable, EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";
import { listQuizzesForAdmin, plannedQuestionCount } from "../service";

/** Administration du module : la liste des quiz, et l'accès à la banque de questions. */
export async function QuizAdminPage() {
  const t = await getT();
  const [quizzes, bankCount] = await Promise.all([listQuizzesForAdmin(), db().question.count()]);

  return (
    <PageContainer>
      <PageHeader title={t("quiz.admin.title")} description={t("quiz.admin.description")} back={{ href: "/admin", label: t("core.admin.back") }}>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/admin/quiz/questions" variant="secondary">
            {t("quiz.admin.bank")}
          </ButtonLink>
          <ButtonLink href="/admin/quiz/nouveau">{t("quiz.admin.new")}</ButtonLink>
        </div>
      </PageHeader>
      <p className="mb-4 text-sm text-muted">{t("quiz.admin.bankCount", { count: bankCount })}</p>

      {quizzes.length === 0 ? (
        <EmptyState icon="quiz" title={t("quiz.admin.empty")} />
      ) : (
        <DataTable caption={t("quiz.admin.quizzes")} headers={[t("quiz.admin.col.title"), t("quiz.admin.col.composition"), t("quiz.admin.col.status"), t("quiz.admin.col.attempts"), ""]}>
          {quizzes.map((quiz) => (
            <tr key={quiz.id}>
              <th scope="row" className="px-4 py-3 text-left">
                <Link href={`/admin/quiz/${quiz.id}`} className="font-semibold hover:text-primary-text hover:underline">
                  {quiz.title}
                </Link>
              </th>
              <td className="px-4 py-3">{t(quiz.selection === "rules" ? "quiz.admin.rules" : "quiz.admin.manual", { count: plannedQuestionCount(quiz) })}</td>
              <td className="px-4 py-3">
                <Badge tone={quiz.status === "published" ? "success" : "neutral"}>{t(`quiz.status.${quiz.status}`)}</Badge>
              </td>
              <td className="px-4 py-3 tabular-nums">{quiz._count.attempts}</td>
              <td className="px-4 py-3 text-right">
                {quiz.status === "published" && (
                  <ButtonLink href={`/quiz/${quiz.slug}`} variant="ghost" size="sm">
                    {t("quiz.admin.view")}
                  </ButtonLink>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </PageContainer>
  );
}
