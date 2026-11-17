/** CONFIGURATION › étape « modules » */
import { getT } from "@/core/request/context";
import { ModulesList } from "@/core/setup/ModulesList";
import { Alert } from "@/core/ui/elements";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { WizardFrame, WizardLinks } from "@/core/setup/WizardFrame";

export const generateMetadata = titleFrom("core.config.step.modules");

async function ModulesStep() {
  const t = await getT();
  return (
    <WizardFrame current="modules">
      <div className="mb-4">
        <Alert>{t("core.config.modules.keep")}</Alert>
      </div>
      <ModulesList />
      <WizardLinks current="modules" />
    </WizardFrame>
  );
}

export default adminPage("core.community.configure", ModulesStep);
