import Link from "next/link";
import { categoriesById, listCategories } from "@/core/categories/service";
import { formatDate } from "@/core/i18n/format";
import { getT, requireViewer } from "@/core/request/context";
import { Badge, Button, categoryOptions, EmptyState, PageContainer, PageHeader, SelectField } from "@/core/ui/elements";
import { Icon } from "@/core/ui/icons";
import { listVisibleNews } from "../service";

/** Liste des actualités visibles : épinglées d'abord, badge « Nouveau » sur les non lues. */
export async function NewsHomePage({ searchParams }: { searchParams: Promise<{ categorie?: string }> }) {
  const [filters, t, viewer, categories] = await Promise.all([searchParams, getT(), requireViewer(), listCategories()]);
  const items = await listVisibleNews(viewer.id, { categoryId: filters.categorie || undefined });
  const categoryOf = categoriesById(categories);

  return (
    <PageContainer narrow>
      <PageHeader title={t("news.page.title")} description={t("news.page.intro")} />

      {categories.length > 0 && (
        <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-56">
            <SelectField label={t("news.list.filter")} name="categorie" defaultValue={filters.categorie ?? ""} options={categoryOptions(categories, t("core.category.all"))} />
          </div>
          <Button type="submit" variant="secondary">
            {t("core.form.filter")}
          </Button>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState icon="news" title={t("news.list.empty.title")} text={t("news.list.empty.text")} />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/actualites/${item.slug}`}
                className="block rounded-xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-primary-text/50 hover:bg-surface-2"
              >
                <span className="flex flex-wrap items-center gap-2 text-xs">
                  {item.pinned && (
                    <Badge tone="warning">
                      <Icon name="arrow" className="mr-1 size-3 -rotate-90" />
                      {t("news.badge.pinned")}
                    </Badge>
                  )}
                  {item.isNew && <Badge tone="info">{t("news.badge.new")}</Badge>}
                  {item.publishAt && <span className="text-muted">{formatDate(item.publishAt)}</span>}
                  {item.categoryId && categoryOf.has(item.categoryId) && <span className="text-muted">· {categoryOf.get(item.categoryId)!.label}</span>}
                </span>
                <span className="mt-2 block text-lg font-semibold">{item.title}</span>
                {item.summary && <span className="mt-1 block text-sm text-muted">{item.summary}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
