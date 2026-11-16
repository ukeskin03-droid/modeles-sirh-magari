import Link from "next/link";
import { categoriesById, listCategories } from "@/core/categories/service";
import { getT } from "@/core/request/context";
import { Button, ButtonLink, categoryOptions, DataTable, EmptyState, Field, PageContainer, PageHeader, SelectField } from "@/core/ui/elements";
import { QUESTION_TYPES } from "../model";
import { listQuestions } from "../service";
import { DifficultyBadge } from "./shared";

type Filters = { categorie?: string; type?: string; difficulte?: string; texte?: string };

/** Banque de questions, avec des filtres (passés dans l'adresse, donc partageables). */
export async function QuestionsAdminPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const [filters, t, categories] = await Promise.all([searchParams, getT(), listCategories()]);
  const questions = await listQuestions({
    categoryId: filters.categorie || undefined,
    type: filters.type || undefined,
    difficulty: filters.difficulte ? Number(filters.difficulte) : undefined,
    text: filters.texte || undefined,
  });
  const categoryOf = categoriesById(categories);

  return (
    <PageContainer>
      <PageHeader title={t("quiz.questions.title")} description={t("quiz.questions.intro")} back={{ href: "/admin/quiz", label: t("quiz.admin.title") }}>
        <ButtonLink href="/admin/quiz/questions/nouvelle">{t("quiz.questions.new")}</ButtonLink>
      </PageHeader>

      <form method="get" className="mb-6 grid items-end gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr_1fr_auto]">
        <Field label={t("quiz.questions.filter.text")} name="texte" type="search" defaultValue={filters.texte ?? ""} />
        <SelectField label={t("core.category.label")} name="categorie" defaultValue={filters.categorie ?? ""} options={categoryOptions(categories, t("core.category.all"))} />
        <SelectField
          label={t("quiz.questions.filter.type")}
          name="type"
          defaultValue={filters.type ?? ""}
          options={[{ value: "", label: t("quiz.questions.filter.anyType") }, ...QUESTION_TYPES.map((type) => ({ value: type, label: t(`quiz.qtype.${type}`) }))]}
        />
        <SelectField
          label={t("quiz.questions.filter.difficulty")}
          name="difficulte"
          defaultValue={filters.difficulte ?? ""}
          options={[{ value: "", label: t("quiz.questions.filter.anyDifficulty") }, ...[1, 2, 3].map((level) => ({ value: String(level), label: t(`quiz.difficulty.${level}`) }))]}
        />
        <Button type="submit" variant="secondary">
          {t("core.form.filter")}
        </Button>
      </form>

      {questions.length === 0 ? (
        <EmptyState icon="quiz" title={t("quiz.questions.empty")} />
      ) : (
        <DataTable
          caption={t("quiz.questions.title")}
          headers={[t("quiz.questions.col.statement"), t("quiz.questions.col.type"), t("quiz.questions.col.difficulty"), t("quiz.questions.col.category"), t("quiz.questions.col.usage")]}
        >
          {questions.map((question) => (
            <tr key={question.id}>
              <th scope="row" className="max-w-md px-4 py-3 text-left font-normal">
                <Link href={`/admin/quiz/questions/${question.id}`} className="line-clamp-2 font-semibold hover:text-primary-text hover:underline">
                  {question.statement}
                </Link>
                <span className="text-xs text-muted">{question.ref}</span>
              </th>
              <td className="whitespace-nowrap px-4 py-3">{t(`quiz.qtype.${question.type}`)}</td>
              <td className="px-4 py-3">
                <DifficultyBadge difficulty={question.difficulty} t={t} />
              </td>
              <td className="px-4 py-3">{(question.categoryId && categoryOf.get(question.categoryId)?.label) || "—"}</td>
              <td className="px-4 py-3 tabular-nums">{question._count.quizzes}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </PageContainer>
  );
}
