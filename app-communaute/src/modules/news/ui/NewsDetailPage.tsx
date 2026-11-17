import { notFound } from "next/navigation";
import { after } from "next/server";
import { recordActivity } from "@/core/activity/log";
import { categoriesById, listCategories } from "@/core/categories/service";
import { LinkedContent } from "@/core/content/linked-fields";
import { formatDate } from "@/core/i18n/format";
import { ShareBox } from "@/core/share/ShareBox";
import { getT, requireViewer, viewerCan } from "@/core/request/context";
import { Alert, ButtonLink, PageContainer, PageHeader } from "@/core/ui/elements";
import { Markdown } from "@/core/ui/Markdown";
import { newsState } from "../model";
import { getNewsBySlug, markNewsRead } from "../service";

/** Page d'une actualité. L'ouvrir la marque comme lue pour la personne connectée. */
export async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, t, viewer, canManage] = await Promise.all([params, getT(), requireViewer(), viewerCan("news.manage")]);
  const item = await getNewsBySlug(slug);
  const state = item ? newsState(item) : null;
  // Un contenu non publié n'existe pas pour les lecteurs ; les éditeurs en voient un aperçu.
  if (!item || !state || (state !== "published" && !canManage)) notFound();

  if (state === "published") {
    after(async () => {
      await markNewsRead(item.id, viewer.id);
      await recordActivity({ type: "content.view", userId: viewer.id, contentType: "news.item", contentId: item.id });
    });
  }
  const category = item.categoryId ? categoriesById(await listCategories()).get(item.categoryId) : undefined;
  const meta = [item.publishAt ? t("news.detail.published", { date: formatDate(item.publishAt) }) : null, category?.label].filter(Boolean).join(" · ");

  return (
    <PageContainer narrow>
      <PageHeader title={item.title} description={meta || undefined} back={{ href: "/actualites", label: t("news.detail.back") }}>
        {canManage && (
          <ButtonLink href={`/admin/actualites/${item.id}`} variant="secondary" size="sm">
            {t("news.detail.edit")}
          </ButtonLink>
        )}
      </PageHeader>
      {state === "published" && (
        <div className="mb-6 flex justify-end">
          <ShareBox contentType={"news.item"} contentId={item.id} />
        </div>
      )}
      {state !== "published" && (
        <div className="mb-6">
          <Alert tone="warning">{t("news.detail.hidden", { state: t(`news.state.${state}`) })}</Alert>
        </div>
      )}
      <article className="rounded-xl border border-line bg-surface p-5 shadow-xs sm:p-8">
        {item.summary && <p className="mb-6 text-lg text-muted">{item.summary}</p>}
        <Markdown>{item.content}</Markdown>
        <LinkedContent hostType="news.item" hostId={item.id} />
      </article>
    </PageContainer>
  );
}
