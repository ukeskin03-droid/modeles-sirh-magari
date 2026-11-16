import { getT } from "@/core/request/context";
import { EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";

/** Page principale du module, côté lecteur. */
export async function QuizHomePage() {
  const t = await getT();
  return (
    <PageContainer>
      <PageHeader title={t("quiz.page.title")} description={t("quiz.page.intro")} />
      <EmptyState icon="quiz" title={t("quiz.pending.title")} text={t("quiz.pending.text")} />
    </PageContainer>
  );
}
