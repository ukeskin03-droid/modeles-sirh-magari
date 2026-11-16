import { getT } from "@/core/request/context";
import { EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";

/** Écran d'administration du module. */
export async function KnowledgeAdminPage() {
  const t = await getT();
  return (
    <PageContainer>
      <PageHeader
        title={t("knowledge.admin.title")}
        description={t("knowledge.admin.description")}
        back={{ href: "/admin", label: t("core.admin.back") }}
      />
      <EmptyState icon="book" title={t("knowledge.pending.title")} text={t("knowledge.pending.text")} />
    </PageContainer>
  );
}
