/** CONFIGURATION › étape « vocabulaire » */
import { saveVocabularyAction } from "@/core/actions/setup";
import { defaultVocabulary } from "@/core/modules/registry";
import { getActiveModules, getCommunity, getT } from "@/core/request/context";
import { Card, EmptyState, INPUT_CLASS } from "@/core/ui/elements";
import { ActionForm } from "@/core/ui/forms";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { WizardButtons, WizardFrame } from "@/core/setup/WizardFrame";

export const generateMetadata = titleFrom("core.config.step.vocabulaire");

async function VocabulaireStep() {
  const [community, t, active] = await Promise.all([getCommunity(), getT(), getActiveModules()]);
  // Seuls les termes des modules ACTIFS sont proposés.
  const groups = active.map((module) => ({ module, terms: Object.entries(defaultVocabulary([module])) })).filter((group) => group.terms.length > 0);

  return (
    <WizardFrame current="vocabulaire">
      <Card>
        <ActionForm action={saveVocabularyAction} className="space-y-6">
          {groups.length === 0 && <EmptyState title={t("core.config.vocabulary.empty")} />}
          {groups.map(({ module, terms }) => (
            <fieldset key={module.key}>
              <legend className="mb-3 font-semibold">{t(module.nameKey)}</legend>
              <div className="space-y-4">
                {terms.map(([key, fallback]) => {
                  const custom = community.vocabulary[key];
                  return (
                    <div key={key} className="grid gap-3 sm:grid-cols-2">
                      {(["singular", "plural"] as const).map((form) => (
                        <div key={form}>
                          <label htmlFor={`${form}-${key}`} className="mb-1.5 block text-sm font-medium">
                            {fallback[form]} — {t(`core.config.vocabulary.${form}`)}
                          </label>
                          <input id={`${form}-${key}`} name={`${form}:${key}`} defaultValue={custom?.[form] ?? ""} placeholder={fallback[form]} maxLength={60} className={INPUT_CLASS} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <WizardButtons current="vocabulaire" />
        </ActionForm>
      </Card>
    </WizardFrame>
  );
}

export default adminPage("core.community.configure", VocabulaireStep);
