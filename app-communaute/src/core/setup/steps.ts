/**
 * ÉTAPES DE L'ASSISTANT DE CONFIGURATION
 *
 * Les mêmes écrans servent deux fois :
 *  - pendant la première configuration, enchaînés dans l'ordre (« assistant ») ;
 *  - ensuite, un par un, pour modifier le paramétrage à tout moment.
 *
 * Un module peut ajouter ses propres étapes (rubrique « wizardSteps » de sa fiche) :
 * elles s'insèrent avant le récapitulatif, seulement si le module est actif.
 */
import type { ModuleDefinition } from "@/core/modules/types";
import type { IconName } from "@/core/ui/icons";

export type SetupStep = { slug: string; href: string; labelKey: string; descriptionKey: string; icon: IconName };

const step = (slug: string, icon: IconName): SetupStep => ({
  slug,
  href: `/admin/configuration/${slug}`,
  labelKey: `core.config.step.${slug}`,
  descriptionKey: `core.config.intro.${slug}`,
  icon,
});

const FIRST_STEPS = [step("depart", "box"), step("modules", "modules"), step("identite", "user"), step("apparence", "palette"), step("vocabulaire", "edit"), step("categories", "list"), step("accueil", "home")];
const LAST_STEP = step("recapitulatif", "check");

/**
 * Les étapes à afficher. Une fois la configuration terminée, le « point de départ » n'a
 * plus de sens (l'import d'un pack se fait depuis l'écran « Export et import »).
 */
export function setupSteps(active: readonly ModuleDefinition[], inProgress: boolean): SetupStep[] {
  const moduleSteps = active.flatMap((module) => (module.wizardSteps ?? []).map((extra) => ({ slug: extra.id, href: extra.href, labelKey: extra.labelKey, descriptionKey: extra.descriptionKey, icon: module.icon })));
  return [...(inProgress ? FIRST_STEPS : FIRST_STEPS.slice(1)), ...moduleSteps, LAST_STEP];
}
