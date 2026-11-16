import { getT } from "@/core/request/context";
import { EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";

/** Page principale du module, côté lecteur. */
export async function KnowledgeHomePage() {
  const t = await getT();
  return (
    <PageContainer>
      <PageHeader title={t("knowledge.page.title")} description={t("knowledge.page.intro")} />
      <EmptyState icon="book" title={t("knowledge.pending.title")} text={t("knowledge.pending.text")} />
    </PageContainer>
  );
}
