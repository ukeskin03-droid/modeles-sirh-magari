import { notFound } from "next/navigation";
import { listCategories } from "@/core/categories/service";
import { LinkedFieldsEditor } from "@/core/content/linked-fields";
import { getT } from "@/core/request/context";
import { ButtonLink, Card, categoryOptions, PageContainer, PageHeader, SelectField, TextAreaField } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";
import { deleteQuestionAction, saveQuestionAction } from "../actions";
import { isQuestionType } from "../model";
import { getQuestion } from "../service";
import { QuestionAnswersEditor } from "./QuestionAnswersEditor";

/** Création ou modification d'une question (sans identifiant dans l'adresse : création). */
export async function QuestionEditPage({ params }: { params: Promise<{ id?: string }> }) {
  const [{ id }, t, categories] = await Promise.all([params, getT(), listCategories()]);
  const question = id ? await getQuestion(id) : null;
  if (id && !question) notFound();
  const type = question && isQuestionType(question.type) ? question.type : "single";

  return (
    <PageContainer narrow>
      <PageHeader
        title={t(question ? "quiz.qform.edit" : "quiz.qform.new")}
        description={question ? t("quiz.qform.ref", { ref: question.ref }) : undefined}
        back={{ href: "/admin/quiz/questions", label: t("quiz.questions.title") }}
      />
      <Card>
        <ActionForm action={saveQuestionAction} className="space-y-5">
          {question && <input type="hidden" name="id" value={question.id} />}
          <TextAreaField label={t("quiz.qform.statement")} name="statement" required maxLength={2000} rows={3} defaultValue={question?.statement ?? ""} />
          <QuestionAnswersEditor
            initialType={type}
            initialOptions={question?.options.map((option) => ({ label: option.label, isCorrect: option.isCorrect })) ?? []}
            labels={{
              type: t("quiz.qform.type"),
              types: { single: t("quiz.qtype.single"), multiple: t("quiz.qtype.multiple"), truefalse: t("quiz.qtype.truefalse") },
              options: t("quiz.qform.options"),
              hintSingle: t("quiz.qform.optionsHint.single"),
              hintMultiple: t("quiz.qform.optionsHint.multiple"),
              optionLabel: t("quiz.qform.optionLabel"),
              removeOption: t("quiz.qform.removeOption"),
              optionCorrect: t("quiz.qform.optionCorrect"),
              addOption: t("quiz.qform.addOption"),
              trueFalse: t("quiz.qform.trueFalse"),
              optionTrue: t("quiz.option.true"),
              optionFalse: t("quiz.option.false"),
            }}
          />
          <TextAreaField
            label={t("quiz.qform.explanation")}
            name="explanation"
            maxLength={5000}
            rows={4}
            defaultValue={question?.explanation ?? ""}
            hint={t("quiz.qform.explanationHint")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={t("quiz.qform.difficulty")}
              name="difficulty"
              defaultValue={String(question?.difficulty ?? 1)}
              options={[1, 2, 3].map((level) => ({ value: String(level), label: t(`quiz.difficulty.${level}`) }))}
            />
            <SelectField label={t("core.category.label")} name="categoryId" defaultValue={question?.categoryId ?? ""} options={categoryOptions(categories, t("core.category.none"))} />
          </div>
          {/* Champs ajoutés par d'autres modules actifs. Sans module concerné : rien ne s'affiche. */}
          <LinkedFieldsEditor hostType="quiz.question" hostId={question?.id ?? null} />
          <div className="flex flex-wrap gap-3">
            <SubmitButton>{t("core.form.save")}</SubmitButton>
            <ButtonLink href="/admin/quiz/questions" variant="secondary">
              {t("core.form.cancel")}
            </ButtonLink>
          </div>
        </ActionForm>
      </Card>

      {question && (
        <ActionForm
          action={deleteQuestionAction}
          className="mt-6"
          confirmation={{ title: t("quiz.form.delete.title"), text: t("quiz.form.delete.text"), confirm: t("core.form.delete"), cancel: t("core.confirm.cancel"), danger: true }}
        >
          <input type="hidden" name="id" value={question.id} />
          <SubmitButton variant="danger">{t("core.form.delete")}</SubmitButton>
        </ActionForm>
      )}
    </PageContainer>
  );
}
