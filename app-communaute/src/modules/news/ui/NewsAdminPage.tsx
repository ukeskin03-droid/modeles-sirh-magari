import Link from "next/link";
import { formatDateTime } from "@/core/i18n/format";
import { getT } from "@/core/request/context";
import { Badge, ButtonLink, DataTable, EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";
import { newsState } from "../model";
import { listNewsForAdmin } from "../service";
import { StateBadge } from "./shared";

/** Administration du module : toutes les actualités, avec leur état. */
export async function NewsAdminPage() {
  const t = await getT();
  const items = await listNewsForAdmin();

  return (
    <PageContainer>
      <PageHeader title={t("news.admin.title")} description={t("news.admin.description")} back={{ href: "/admin", label: t("core.admin.back") }}>
        <ButtonLink href="/admin/actualites/nouvelle">{t("news.admin.new")}</ButtonLink>
      </PageHeader>
      {items.length === 0 ? (
        <EmptyState icon="news" title={t("news.admin.empty")} />
      ) : (
        <DataTable
          caption={t("news.admin.title")}
          headers={[t("news.admin.col.title"), t("news.admin.col.state"), t("news.admin.col.publishAt"), t("news.admin.col.expiresAt"), t("news.admin.col.reads"), ""]}
        >
          {items.map((item) => (
            <tr key={item.id}>
              <th scope="row" className="max-w-md px-4 py-3 text-left">
                <Link href={`/admin/actualites/${item.id}`} className="font-semibold hover:text-primary-text hover:underline">
                  {item.title}
                </Link>
                {item.pinned && (
                  <span className="ml-2">
                    <Badge tone="warning">{t("news.badge.pinned")}</Badge>
                  </span>
                )}
              </th>
              <td className="px-4 py-3">
                <StateBadge state={newsState(item)} t={t} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">{item.publishAt ? formatDateTime(item.publishAt) : "—"}</td>
              <td className="whitespace-nowrap px-4 py-3">{item.expiresAt ? formatDateTime(item.expiresAt) : "—"}</td>
              {/* Un simple compteur : on ne montre jamais QUI a lu. */}
              <td className="px-4 py-3 tabular-nums">{item._count.reads}</td>
              <td className="px-4 py-3 text-right">
                <ButtonLink href={`/actualites/${item.slug}`} variant="ghost" size="sm">
                  {t("news.admin.view")}
                </ButtonLink>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </PageContainer>
  );
}
