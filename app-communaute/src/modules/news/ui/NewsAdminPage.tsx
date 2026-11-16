import { getT } from "@/core/request/context";
import { EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";

/** Écran d'administration du module. */
export async function NewsAdminPage() {
  const t = await getT();
  return (
    <PageContainer>
      <PageHeader
        title={t("news.admin.title")}
        description={t("news.admin.description")}
        back={{ href: "/admin", label: t("core.admin.back") }}
      />
      <EmptyState icon="news" title={t("news.pending.title")} text={t("news.pending.text")} />
    </PageContainer>
  );
}
