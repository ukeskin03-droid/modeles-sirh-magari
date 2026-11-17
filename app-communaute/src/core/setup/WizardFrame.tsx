/**
 * CADRE D'UN ÉCRAN DE CONFIGURATION : le fil des étapes, le titre et l'explication.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { getActiveModules, getCommunity, getT } from "@/core/request/context";
import { ButtonLink, PageContainer, PageHeader } from "@/core/ui/elements";
import { SubmitButton } from "@/core/ui/forms";
import { Icon } from "@/core/ui/icons";
import { setupSteps } from "./steps";

export async function WizardFrame({ current, wide = false, children }: { current: string; wide?: boolean; children: ReactNode }) {
  const [community, t, active] = await Promise.all([getCommunity(), getT(), getActiveModules()]);
  const inProgress = community.setupStep !== null;
  const steps = setupSteps(active, inProgress);
  const index = steps.findIndex((step) => step.slug === current);
  const step = steps[index] ?? steps[0];

  return (
    <PageContainer narrow={!wide}>
      <PageHeader title={t(step.labelKey)} description={t(step.descriptionKey)} back={inProgress ? undefined : { href: "/admin/parametres", label: t("core.admin.settings.title") }} />
      <nav aria-label={t("core.config.steps")} className="mb-8 overflow-x-auto">
        <ol className="flex gap-1 text-sm">
          {steps.map((item, position) => {
            const isCurrent = item.slug === step.slug;
            // Pendant l'assistant, on ne saute pas au-delà de l'étape déjà atteinte.
            const reachable = !inProgress || position <= Math.max(index, community.setupStep ?? 0);
            const content = (
              <>
                <span className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isCurrent ? "bg-primary text-on-primary" : "bg-surface-2 text-muted"}`}>
                  {inProgress ? position + 1 : <Icon name={item.icon} className="size-3.5" />}
                </span>
                {t(item.labelKey)}
              </>
            );
            const className = `inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3 font-medium ${isCurrent ? "bg-primary-soft text-primary-text" : "text-muted"}`;
            return (
              <li key={item.slug}>
                {reachable ? (
                  <Link href={item.href} aria-current={isCurrent ? "step" : undefined} className={`${className} hover:bg-surface-2`}>
                    {content}
                  </Link>
                ) : (
                  <span className={`${className} opacity-60`}>{content}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {children}
      {inProgress && <p className="mt-6 text-sm text-muted">{t("core.config.autosave")}</p>}
    </PageContainer>
  );
}

/**
 * Boutons du bas d'un formulaire de configuration.
 *  - Pendant l'assistant : « Précédent » et « Enregistrer et continuer » (les deux enregistrent).
 *  - Ensuite : un simple « Enregistrer ».
 */
export async function WizardButtons({ current }: { current: string }) {
  const [community, t, active] = await Promise.all([getCommunity(), getT(), getActiveModules()]);
  if (community.setupStep === null) return <SubmitButton name="direction" value="stay">{t("core.form.save")}</SubmitButton>;
  const steps = setupSteps(active, true);
  const index = steps.findIndex((step) => step.slug === current);
  return (
    <div className="flex flex-wrap justify-between gap-3">
      {index > 0 ? (
        <SubmitButton variant="secondary" name="direction" value="previous">
          {t("core.config.previous")}
        </SubmitButton>
      ) : (
        <span />
      )}
      <SubmitButton name="direction" value="next">
        {t("core.config.next")}
      </SubmitButton>
    </div>
  );
}

/** Pour les étapes sans formulaire (modules) : de simples liens « Précédent / Continuer ». */
export async function WizardLinks({ current }: { current: string }) {
  const [community, t, active] = await Promise.all([getCommunity(), getT(), getActiveModules()]);
  if (community.setupStep === null) return null;
  const steps = setupSteps(active, true);
  const index = steps.findIndex((step) => step.slug === current);
  return (
    <div className="mt-6 flex flex-wrap justify-between gap-3">
      {index > 0 ? (
        <ButtonLink href={steps[index - 1].href} variant="secondary">
          {t("core.config.previous")}
        </ButtonLink>
      ) : (
        <span />
      )}
      {index < steps.length - 1 && <ButtonLink href={steps[index + 1].href}>{t("core.config.continue")}</ButtonLink>}
    </div>
  );
}
