import { notFound } from "next/navigation";
import { listCategories } from "@/core/categories/service";
import { linkedIds } from "@/core/content/links";
import { tagsOf } from "@/core/content/tags";
import { getT } from "@/core/request/context";
import { ButtonLink, Card, categoryOptions, Field, PageContainer, PageHeader, SelectField, TextAreaField } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";
import { deleteArticleAction, saveArticleAction } from "../actions";
import { ARTICLE_STATUSES, ARTICLE_TYPE, RELATED } from "../model";
import { getArticleById, listArticlesForAdmin } from "../service";

/** Création ou modification d'un article (sans identifiant dans l'adresse : création). */
export async function KnowledgeEditPage({ params }: { params: Promise<{ id?: string }> }) {
  const [{ id }, t, categories, all] = await Promise.all([params, getT(), listCategories(), listArticlesForAdmin()]);
  const article = id ? await getArticleById(id) : null;
  if (id && !article) notFound();
  const [tags, related] = article
    ? await Promise.all([tagsOf({ type: ARTICLE_TYPE, id: article.id }), linkedIds({ type: ARTICLE_TYPE, id: article.id }, RELATED)])
    : [[], []];
  const others = all.filter((other) => other.id !== article?.id);

  return (
    <PageContainer narrow>
      <PageHeader title={t(article ? "knowledge.form.edit" : "knowledge.form.new")} back={{ href: "/admin/articles", label: t("knowledge.admin.title") }} />
      <Card>
        <ActionForm action={saveArticleAction} className="space-y-5">
          {article && <input type="hidden" name="id" value={article.id} />}
          <Field label={t("knowledge.form.title")} name="title" required maxLength={150} defaultValue={article?.title ?? ""} />
          <TextAreaField label={t("knowledge.form.summary")} name="summary" maxLength={500} rows={2} defaultValue={article?.summary ?? ""} hint={t("knowledge.form.summaryHint")} />
          <TextAreaField label={t("knowledge.form.content")} name="content" rows={14} defaultValue={article?.content ?? ""} hint={t("knowledge.form.contentHint")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label={t("core.category.label")} name="categoryId" defaultValue={article?.categoryId ?? ""} options={categoryOptions(categories, t("core.category.none"))} />
            <SelectField
              label={t("knowledge.form.status")}
              name="status"
              defaultValue={article?.status ?? "draft"}
              options={ARTICLE_STATUSES.map((status) => ({ value: status, label: t(`knowledge.status.${status}`) }))}
            />
          </div>
          <Field label={t("knowledge.form.tags")} name="tags" defaultValue={tags.map((tag) => tag.name).join(", ")} hint={t("knowledge.form.tagsHint")} />
          <fieldset>
            <legend className="text-sm font-medium">{t("knowledge.form.related")}</legend>
            <p className="mb-2 mt-1 text-sm text-muted">{others.length === 0 ? t("knowledge.form.relatedEmpty") : t("knowledge.form.relatedHint")}</p>
            {others.length > 0 && (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-line p-3">
                {others.map((other) => (
                  <label key={other.id} className="flex min-h-9 cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" name="related" value={other.id} defaultChecked={related.includes(other.id)} className="size-4 accent-(--c-primary)" />
                    {other.title}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <div className="flex flex-wrap gap-3">
            <SubmitButton>{t("core.form.save")}</SubmitButton>
            <ButtonLink href="/admin/articles" variant="secondary">
              {t("core.form.cancel")}
            </ButtonLink>
          </div>
        </ActionForm>
      </Card>

      {article && (
        <ActionForm
          action={deleteArticleAction}
          className="mt-6"
          confirmation={{ title: t("knowledge.form.delete.title"), text: t("knowledge.form.delete.text"), confirm: t("core.form.delete"), cancel: t("core.confirm.cancel"), danger: true }}
        >
          <input type="hidden" name="id" value={article.id} />
          <SubmitButton variant="danger">{t("core.form.delete")}</SubmitButton>
        </ActionForm>
      )}
    </PageContainer>
  );
}
