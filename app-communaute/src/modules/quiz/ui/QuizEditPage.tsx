import { notFound } from "next/navigation";
import { categoriesById, listCategories, withDescendants } from "@/core/categories/service";
import { getT } from "@/core/request/context";
import { ButtonLink, Card, Field, PageContainer, PageHeader, SelectField, TextAreaField } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";
import { deleteQuizAction, saveQuizAction } from "../actions";
import { getQuizForEdit, listQuestions } from "../service";
import { QuizCompositionEditor } from "./QuizCompositionEditor";

/** Création ou modification d'un quiz (sans identifiant dans l'adresse : création). */
export async function QuizEditPage({ params }: { params: Promise<{ id?: string }> }) {
  const [{ id }, t, categories, questions] = await Promise.all([params, getT(), listCategories(), listQuestions()]);
  const quiz = id ? await getQuizForEdit(id) : null;
  if (id && !quiz) notFound();
  const categoryOf = categoriesById(categories);

  return (
    <PageContainer>
      <PageHeader title={t(quiz ? "quiz.form.edit" : "quiz.form.new")} back={{ href: "/admin/quiz", label: t("quiz.admin.title") }} />
      <Card>
        <ActionForm action={saveQuizAction} className="space-y-5">
          {quiz && <input type="hidden" name="id" value={quiz.id} />}
          <Field label={t("quiz.form.title")} name="title" required maxLength={150} defaultValue={quiz?.title ?? ""} />
          <TextAreaField label={t("quiz.form.description")} name="description" maxLength={1000} rows={2} defaultValue={quiz?.description ?? ""} hint={t("quiz.form.descriptionHint")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={t("quiz.form.modes")}
              name="modes"
              defaultValue={quiz?.modes ?? "both"}
              options={(["both", "training", "evaluation"] as const).map((mode) => ({ value: mode, label: t(`quiz.form.modes.${mode}`) }))}
            />
            <SelectField
              label={t("quiz.form.status")}
              name="status"
              defaultValue={quiz?.status ?? "draft"}
              options={(["draft", "published"] as const).map((status) => ({ value: status, label: t(`quiz.status.${status}`) }))}
            />
          </div>
          <QuizCompositionEditor
            bank={questions.map((question) => ({
              id: question.id,
              statement: question.statement,
              categoryId: question.categoryId,
              categoryLabel: (question.categoryId && categoryOf.get(question.categoryId)?.label) || "",
              difficulty: question.difficulty,
              typeLabel: t(`quiz.qtype.${question.type}`),
            }))}
            categories={categories.map(({ id: categoryId, label }) => ({ id: categoryId, label }))}
            categoryScopes={Object.fromEntries(categories.map((category) => [category.id, withDescendants(category.id, categories)]))}
            initialSelection={quiz?.selection === "rules" ? "rules" : "manual"}
            initialQuestionIds={quiz?.questions.map((link) => link.questionId) ?? []}
            initialRules={quiz?.rules.map((rule) => ({ categoryId: rule.categoryId ?? "", difficulty: rule.difficulty ? String(rule.difficulty) : "", count: rule.count })) ?? []}
            labels={{
              selection: t("quiz.form.selection"),
              manual: t("quiz.form.selection.manual"),
              rules: t("quiz.form.selection.rules"),
              selected: t("quiz.form.selected"),
              selectedEmpty: t("quiz.form.selectedEmpty"),
              available: t("quiz.form.available"),
              availableEmpty: t("quiz.form.availableEmpty"),
              filter: t("quiz.form.filter"),
              add: t("core.form.add"),
              remove: t("core.form.remove"),
              moveUp: t("core.form.moveUp"),
              moveDown: t("core.form.moveDown"),
              rule: t("quiz.form.rule"),
              ruleCategory: t("quiz.form.rule.category"),
              ruleDifficulty: t("quiz.form.rule.difficulty"),
              anyDifficulty: t("quiz.form.rule.anyDifficulty"),
              ruleCount: t("quiz.form.rule.count"),
              addRule: t("quiz.form.rule.add"),
              ruleAvailable: t("quiz.form.rule.available"),
              allCategories: t("core.category.all"),
              difficulties: { "1": t("quiz.difficulty.1"), "2": t("quiz.difficulty.2"), "3": t("quiz.difficulty.3") },
            }}
          />
          <div className="flex flex-wrap gap-3">
            <SubmitButton>{t("core.form.save")}</SubmitButton>
            <ButtonLink href="/admin/quiz" variant="secondary">
              {t("core.form.cancel")}
            </ButtonLink>
          </div>
        </ActionForm>
      </Card>

      {quiz && (
        <ActionForm
          action={deleteQuizAction}
          className="mt-6"
          confirmation={{ title: t("quiz.form.delete.title"), text: t("quiz.form.delete.text"), confirm: t("core.form.delete"), cancel: t("core.confirm.cancel"), danger: true }}
        >
          <input type="hidden" name="id" value={quiz.id} />
          <SubmitButton variant="danger">{t("core.form.delete")}</SubmitButton>
        </ActionForm>
      )}
    </PageContainer>
  );
}
