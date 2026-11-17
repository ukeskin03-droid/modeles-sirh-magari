/** CONFIGURATION › étape « accueil » */
import { saveHomeAction } from "@/core/actions/setup";
import { homeBlocksFor } from "@/core/modules/registry";
import { getActiveModules, getCommunity, getT } from "@/core/request/context";
import { BlockOrderEditor } from "@/core/setup/BlockOrderEditor";
import { Card, Field, TextAreaField } from "@/core/ui/elements";
import { ActionForm } from "@/core/ui/forms";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { WizardButtons, WizardFrame } from "@/core/setup/WizardFrame";

export const generateMetadata = titleFrom("core.config.step.accueil");

async function AccueilStep() {
  const [community, t, active] = await Promise.all([getCommunity(), getT(), getActiveModules()]);
  // Les blocs proposés sont ceux des modules ACTIFS : d'abord ceux déjà choisis, dans leur ordre.
  const available = homeBlocksFor(active, null);
  const chosen = homeBlocksFor(active, community.home.blocks);
  const chosenIds = new Set(chosen.map((block) => block.id));
  const blocks = [...chosen, ...available.filter((block) => !chosenIds.has(block.id))].map((block) => ({ id: block.id, label: t(block.labelKey), enabled: chosenIds.has(block.id) }));

  return (
    <WizardFrame current="accueil">
      <Card>
        <ActionForm action={saveHomeAction} className="space-y-5">
          <Field label={t("core.config.home.title")} name="welcomeTitle" maxLength={120} defaultValue={community.home.welcomeTitle} hint={t("core.config.home.titleHint")} />
          <TextAreaField label={t("core.config.home.text")} name="welcomeText" rows={4} maxLength={5000} defaultValue={community.home.welcomeText} />
          <fieldset>
            <legend className="text-sm font-medium">{t("core.config.home.blocks")}</legend>
            <p className="mb-3 mt-1 text-sm text-muted">{blocks.length === 0 ? t("core.config.home.noBlocks") : t("core.config.home.blocksHint")}</p>
            <BlockOrderEditor initial={blocks} labels={{ show: t("core.config.home.show"), moveUp: t("core.form.moveUp"), moveDown: t("core.form.moveDown") }} />
          </fieldset>
          <WizardButtons current="accueil" />
        </ActionForm>
      </Card>
    </WizardFrame>
  );
}

export default adminPage("core.community.configure", AccueilStep);
