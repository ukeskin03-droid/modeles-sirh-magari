import Link from "next/link";
import { categoriesById, listCategories } from "@/core/categories/service";
import { formatDate } from "@/core/i18n/format";
import { getT } from "@/core/request/context";
import { Badge, ButtonLink, DataTable, EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";
import { listArticlesForAdmin } from "../service";

/** Administration du module : tous les articles. */
export async function KnowledgeAdminPage() {
  const [t, articles, categories] = await Promise.all([getT(), listArticlesForAdmin(), listCategories()]);
  const categoryOf = categoriesById(categories);

  return (
    <PageContainer>
      <PageHeader title={t("knowledge.admin.title")} description={t("knowledge.admin.description")} back={{ href: "/admin", label: t("core.admin.back") }}>
        <ButtonLink href="/admin/articles/nouveau">{t("knowledge.admin.new")}</ButtonLink>
      </PageHeader>
      {articles.length === 0 ? (
        <EmptyState icon="book" title={t("knowledge.admin.empty")} />
      ) : (
        <DataTable caption={t("knowledge.admin.title")} headers={[t("knowledge.admin.col.title"), t("knowledge.admin.col.category"), t("knowledge.admin.col.status"), t("knowledge.admin.col.revised"), ""]}>
          {articles.map((article) => (
            <tr key={article.id}>
              <th scope="row" className="max-w-md px-4 py-3 text-left">
                <Link href={`/admin/articles/${article.id}`} className="font-semibold hover:text-primary-text hover:underline">
                  {article.title}
                </Link>
              </th>
              <td className="px-4 py-3">{(article.categoryId && categoryOf.get(article.categoryId)?.label) || "—"}</td>
              <td className="px-4 py-3">
                <Badge tone={article.status === "published" ? "success" : "neutral"}>{t(`knowledge.status.${article.status}`)}</Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-3">{formatDate(article.revisedAt)}</td>
              <td className="px-4 py-3 text-right">
                <ButtonLink href={`/articles/${article.slug}`} variant="ghost" size="sm">
                  {t("knowledge.admin.view")}
                </ButtonLink>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </PageContainer>
  );
}
