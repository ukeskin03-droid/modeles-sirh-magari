import Link from "next/link";
import { categoriesById, listCategories } from "@/core/categories/service";
import { tagsInUse, tagsOfMany } from "@/core/content/tags";
import { formatDate } from "@/core/i18n/format";
import { getT } from "@/core/request/context";
import { Button, ButtonLink, categoryOptions, EmptyState, PageContainer, PageHeader, SelectField } from "@/core/ui/elements";
import { ARTICLE_TYPE } from "../model";
import { listPublishedArticles } from "../service";

/** Liste des articles publiés, regroupés par catégorie, avec filtres par catégorie et par mot-clé. */
export async function KnowledgeHomePage({ searchParams }: { searchParams: Promise<{ categorie?: string; tag?: string }> }) {
  const [filters, t, categories] = await Promise.all([searchParams, getT(), listCategories()]);
  const [articles, allPublished] = await Promise.all([
    listPublishedArticles({ categoryId: filters.categorie || undefined, tagSlug: filters.tag || undefined }),
    listPublishedArticles(),
  ]);
  const [tagsByArticle, tagCloud] = await Promise.all([tagsOfMany(ARTICLE_TYPE, articles.map((article) => article.id)), tagsInUse(ARTICLE_TYPE, allPublished.map((article) => article.id))]);
  const categoryOf = categoriesById(categories);
  const activeTag = tagCloud.find((tag) => tag.slug === filters.tag);

  // Regroupement par catégorie, dans l'ordre des catégories ; « sans catégorie » à la fin.
  const groups = [...categories.map((category) => ({ id: category.id as string | null, label: category.label })), { id: null, label: t("knowledge.list.uncategorized") }]
    .map((group) => ({ ...group, articles: articles.filter((article) => (article.categoryId && categoryOf.has(article.categoryId) ? article.categoryId : null) === group.id) }))
    .filter((group) => group.articles.length > 0);

  return (
    <PageContainer>
      <PageHeader title={t("knowledge.page.title")} description={t("knowledge.page.intro")} />

      <div className="mb-8 space-y-4 rounded-xl border border-line bg-surface p-4">
        {categories.length > 0 && (
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 basis-56">
              <SelectField label={t("knowledge.list.filter")} name="categorie" defaultValue={filters.categorie ?? ""} options={categoryOptions(categories, t("core.category.all"))} />
            </div>
            <Button type="submit" variant="secondary">
              {t("core.form.filter")}
            </Button>
          </form>
        )}
        {tagCloud.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">{t("knowledge.list.tags")}</p>
            <ul className="flex flex-wrap gap-2">
              {tagCloud.map((tag) => (
                <li key={tag.slug}>
                  <Link
                    href={`/articles?tag=${encodeURIComponent(tag.slug)}`}
                    aria-current={tag.slug === filters.tag ? "true" : undefined}
                    className={`inline-flex min-h-8 items-center rounded-full px-3 text-sm ${
                      tag.slug === filters.tag ? "bg-primary text-on-primary" : "bg-surface-2 text-fg hover:bg-primary-soft"
                    }`}
                  >
                    {tag.name} <span className="ml-1.5 text-xs opacity-80">{tag.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(filters.categorie || filters.tag) && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {activeTag && <span className="text-muted">{t("knowledge.list.tagActive", { tag: activeTag.name })}</span>}
            <ButtonLink href="/articles" variant="ghost" size="sm">
              {t("knowledge.list.clear")}
            </ButtonLink>
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="book" title={t("knowledge.list.empty.title")} text={t("knowledge.list.empty.text")} />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.id ?? "aucune"}>
              <h2 className="mb-3 text-lg font-semibold">{group.label}</h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {group.articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/articles/${article.slug}`}
                      className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-primary-text/50 hover:bg-surface-2"
                    >
                      <span className="font-semibold">{article.title}</span>
                      {article.summary && <span className="mt-1 line-clamp-3 text-sm text-muted">{article.summary}</span>}
                      <span className="mt-auto pt-3 text-xs text-muted">
                        {[t("knowledge.detail.revised", { date: formatDate(article.revisedAt) }), ...(tagsByArticle.get(article.id) ?? []).map((tag) => `#${tag.name}`)].join(" · ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
