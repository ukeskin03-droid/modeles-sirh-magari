import { getT } from "@/core/request/context";
import { EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";

/** Écran d'administration du module. */
export async function QuizAdminPage() {
  const t = await getT();
  return (
    <PageContainer>
      <PageHeader
        title={t("quiz.admin.title")}
        description={t("quiz.admin.description")}
        back={{ href: "/admin", label: t("core.admin.back") }}
      />
      <EmptyState icon="quiz" title={t("quiz.pending.title")} text={t("quiz.pending.text")} />
    </PageContainer>
  );
}
