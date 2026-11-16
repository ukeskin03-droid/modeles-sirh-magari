import { notFound } from "next/navigation";
import { listCategories } from "@/core/categories/service";
import { toDateTimeInput } from "@/core/i18n/format";
import { getT } from "@/core/request/context";
import { ButtonLink, Card, categoryOptions, Field, PageContainer, PageHeader, SelectField, TextAreaField } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";
import { deleteNewsAction, saveNewsAction } from "../actions";
import { NEWS_STATUSES, newsState } from "../model";
import { getNewsById } from "../service";
import { StateBadge } from "./shared";

/** Création ou modification d'une actualité (sans identifiant dans l'adresse : création). */
export async function NewsEditPage({ params }: { params: Promise<{ id?: string }> }) {
  const [{ id }, t, categories] = await Promise.all([params, getT(), listCategories()]);
  const item = id ? await getNewsById(id) : null;
  if (id && !item) notFound();

  return (
    <PageContainer narrow>
      <PageHeader title={t(item ? "news.form.edit" : "news.form.new")} back={{ href: "/admin/actualites", label: t("news.admin.title") }}>
        {item && <StateBadge state={newsState(item)} t={t} />}
      </PageHeader>
      <Card>
        <ActionForm action={saveNewsAction} className="space-y-5">
          {item && <input type="hidden" name="id" value={item.id} />}
          <Field label={t("news.form.title")} name="title" required maxLength={150} defaultValue={item?.title ?? ""} />
          <TextAreaField label={t("news.form.summary")} name="summary" maxLength={500} rows={2} defaultValue={item?.summary ?? ""} hint={t("news.form.summaryHint")} />
          <TextAreaField label={t("news.form.content")} name="content" rows={12} defaultValue={item?.content ?? ""} hint={t("news.form.contentHint")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label={t("core.category.label")} name="categoryId" defaultValue={item?.categoryId ?? ""} options={categoryOptions(categories, t("core.category.none"))} />
            <SelectField
              label={t("news.form.status")}
              name="status"
              defaultValue={item?.status ?? "draft"}
              options={NEWS_STATUSES.map((status) => ({ value: status, label: t(`news.status.${status}`) }))}
            />
            <Field label={t("news.form.publishAt")} name="publishAt" type="datetime-local" defaultValue={toDateTimeInput(item?.publishAt)} hint={t("news.form.publishAtHint")} />
            <Field label={t("news.form.expiresAt")} name="expiresAt" type="datetime-local" defaultValue={toDateTimeInput(item?.expiresAt)} hint={t("news.form.expiresAtHint")} />
          </div>
          <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm font-medium">
            <input type="checkbox" name="pinned" defaultChecked={item?.pinned ?? false} className="size-5 accent-(--c-primary)" />
            {t("news.form.pinned")}
          </label>
          <div className="flex flex-wrap gap-3">
            <SubmitButton>{t("core.form.save")}</SubmitButton>
            <ButtonLink href="/admin/actualites" variant="secondary">
              {t("core.form.cancel")}
            </ButtonLink>
          </div>
        </ActionForm>
      </Card>

      {item && (
        <ActionForm
          action={deleteNewsAction}
          className="mt-6"
          confirmation={{ title: t("news.form.delete.title"), text: t("news.form.delete.text"), confirm: t("core.form.delete"), cancel: t("core.confirm.cancel"), danger: true }}
        >
          <input type="hidden" name="id" value={item.id} />
          <SubmitButton variant="danger">{t("core.form.delete")}</SubmitButton>
        </ActionForm>
      )}
    </PageContainer>
  );
}
