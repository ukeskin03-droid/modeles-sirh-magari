import { getT } from "@/core/request/context";
import { EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";

/** Page principale du module, côté lecteur. */
export async function NewsHomePage() {
  const t = await getT();
  return (
    <PageContainer>
      <PageHeader title={t("news.page.title")} description={t("news.page.intro")} />
      <EmptyState icon="news" title={t("news.pending.title")} text={t("news.pending.text")} />
    </PageContainer>
  );
}
