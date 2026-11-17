/** CONFIGURATION › étape « depart » */
import { redirect } from "next/navigation";
import { packImportAction } from "@/core/actions/library";
import { startBlankAction } from "@/core/actions/setup";
import { getCommunity, getT } from "@/core/request/context";
import { ButtonLink, buttonClass, Card, SectionTitle } from "@/core/ui/elements";
import { flowLabels } from "@/core/ui/flow-labels";
import { UploadPreviewFlow } from "@/core/ui/UploadPreviewFlow";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { WizardFrame } from "@/core/setup/WizardFrame";

export const generateMetadata = titleFrom("core.config.step.depart");

async function DepartStep() {
  const [community, t] = await Promise.all([getCommunity(), getT()]);
  // Une fois la configuration terminée, l'import d'un pack se fait depuis « Export et import ».
  if (community.setupStep === null) redirect("/admin/pack");

  return (
    <WizardFrame current="depart">
      <div className="space-y-6">
        <Card>
          <SectionTitle>{t("core.config.start.blank.title")}</SectionTitle>
          <p className="mb-4 mt-2 text-sm text-muted">{t("core.config.start.blank.text")}</p>
          <form action={startBlankAction}>
            <button type="submit" className={buttonClass("primary")}>
              {t("core.config.start.blank.action")}
            </button>
          </form>
        </Card>
        <Card>
          <SectionTitle>{t("core.config.start.pack.title")}</SectionTitle>
          <p className="mb-4 mt-2 text-sm text-muted">{t("core.config.start.pack.text")}</p>
          <UploadPreviewFlow action={packImportAction} accept=".zip,application/zip" labels={flowLabels(t)} />
          <div className="mt-4">
            <ButtonLink href="/admin/configuration/modules" variant="secondary">
              {t("core.config.continue")}
            </ButtonLink>
          </div>
        </Card>
      </div>
    </WizardFrame>
  );
}

export default adminPage("core.community.configure", DepartStep);
