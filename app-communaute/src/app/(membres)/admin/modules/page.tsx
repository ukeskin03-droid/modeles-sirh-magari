/**
 * ADMINISTRATION › MODULES — activer ou désactiver chaque module.
 */
import { getT } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { ModulesList } from "@/core/setup/ModulesList";
import { PageContainer, PageHeader } from "@/core/ui/elements";

export const generateMetadata = titleFrom("core.admin.modules.title");

async function ModulesPage() {
  const t = await getT();
  return (
    <PageContainer narrow>
      <PageHeader title={t("core.admin.modules.title")} description={t("core.admin.modules.intro")} back={{ href: "/admin", label: t("core.admin.back") }} />
      <ModulesList />
    </PageContainer>
  );
}

export default adminPage("core.community.configure", ModulesPage);
