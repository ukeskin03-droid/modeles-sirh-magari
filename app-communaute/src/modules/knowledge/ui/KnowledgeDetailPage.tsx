import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { recordActivity } from "@/core/activity/log";
import { displayNames } from "@/core/auth/users";
import { categoriesById, listCategories } from "@/core/categories/service";
import { tagsOf } from "@/core/content/tags";
import { formatDate } from "@/core/i18n/format";
import { ShareBox } from "@/core/share/ShareBox";
import { getT, requireViewer, viewerCan } from "@/core/request/context";
import { Alert, ButtonLink, PageContainer, PageHeader } from "@/core/ui/elements";
import { Icon } from "@/core/ui/icons";
import { Markdown } from "@/core/ui/Markdown";
import { ARTICLE_TYPE } from "../model";
import { getArticleBySlug, relatedArticles } from "../service";

/** Page d'un article, avec ses mots-clés et, en bas, les articles liés. */
export async function KnowledgeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, t, viewer, canManage] = await Promise.all([params, getT(), requireViewer(), viewerCan("knowledge.manage")]);
  const article = await getArticleBySlug(slug);
  // Un brouillon n'existe pas pour les lecteurs ; les éditeurs en voient un aperçu.
  if (!article || (article.status !== "published" && !canManage)) notFound();

  if (article.status === "published") {
    after(() => recordActivity({ type: "content.view", userId: viewer.id, contentType: ARTICLE_TYPE, contentId: article.id }));
  }
  const [tags, related, authors, categories] = await Promise.all([
    tagsOf({ type: ARTICLE_TYPE, id: article.id }),
    relatedArticles(article.id),
    displayNames([article.authorId]),
    listCategories(),
  ]);
  const category = article.categoryId ? categoriesById(categories).get(article.categoryId) : undefined;
  const author = article.authorId ? authors.get(article.authorId) : undefined;
  const meta = [t("knowledge.detail.revised", { date: formatDate(article.revisedAt) }), author ? t("knowledge.detail.author", { name: author }) : null, category?.label]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageContainer narrow>
      <PageHeader title={article.title} description={meta} back={{ href: "/articles", label: t("knowledge.detail.back") }}>
        {canManage && (
          <ButtonLink href={`/admin/articles/${article.id}`} variant="secondary" size="sm">
            {t("knowledge.detail.edit")}
          </ButtonLink>
        )}
      </PageHeader>
      {article.status === "published" && (
        <div className="mb-6 flex justify-end">
          <ShareBox contentType={ARTICLE_TYPE} contentId={article.id} />
        </div>
      )}
      {article.status !== "published" && (
        <div className="mb-6">
          <Alert tone="warning">{t("knowledge.detail.hidden")}</Alert>
        </div>
      )}
      <article className="rounded-xl border border-line bg-surface p-5 shadow-xs sm:p-8">
        {article.summary && <p className="mb-6 text-lg text-muted">{article.summary}</p>}
        <Markdown>{article.content}</Markdown>
        {tags.length > 0 && (
          <ul aria-label={t("knowledge.list.tags")} className="mt-8 flex flex-wrap gap-2 border-t border-line pt-5">
            {tags.map((tag) => (
              <li key={tag.slug}>
                <Link href={`/articles?tag=${encodeURIComponent(tag.slug)}`} className="inline-flex min-h-8 items-center rounded-full bg-surface-2 px-3 text-sm hover:bg-primary-soft">
                  #{tag.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">{t("knowledge.detail.related")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {related.map((other) => (
              <li key={other.id}>
                <Link href={`/articles/${other.slug}`} className="flex h-full items-start gap-3 rounded-xl border border-line bg-surface p-4 hover:border-primary-text/50 hover:bg-surface-2">
                  <Icon name="book" className="mt-0.5 size-5 text-primary-text" />
                  <span>
                    <span className="block font-semibold">{other.title}</span>
                    {other.summary && <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{other.summary}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageContainer>
  );
}
