/** CONFIGURATION › étape « identite » */
import { saveIdentityAction } from "@/core/actions/setup";
import { getCommunity, getT } from "@/core/request/context";
import { Card, Field, INPUT_CLASS } from "@/core/ui/elements";
import { ActionForm } from "@/core/ui/forms";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { WizardButtons, WizardFrame } from "@/core/setup/WizardFrame";

export const generateMetadata = titleFrom("core.config.step.identite");

async function IdentiteStep() {
  const [community, t] = await Promise.all([getCommunity(), getT()]);
  const images = [
    { field: "logo", label: t("core.config.identity.logo"), hint: t("core.config.identity.logoHint"), current: community.logoMediaId ? "/logo" : null },
    { field: "favicon", label: t("core.config.identity.favicon"), hint: t("core.config.identity.faviconHint"), current: community.faviconMediaId ? "/icone" : null },
  ];

  return (
    <WizardFrame current="identite">
      <Card>
        <ActionForm action={saveIdentityAction} className="space-y-5">
          <Field label={t("core.config.identity.name")} name="name" required maxLength={80} defaultValue={community.name} />
          <Field label={t("core.config.identity.subtitle")} name="subtitle" maxLength={160} defaultValue={community.subtitle} hint={t("core.config.identity.subtitleHint")} />
          {images.map((image) => (
            <div key={image.field}>
              <label htmlFor={`champ-${image.field}`} className="mb-1.5 block text-sm font-medium">
                {image.label}
              </label>
              <div className="flex flex-wrap items-center gap-4">
                {image.current && (
                  // eslint-disable-next-line @next/next/no-img-element -- image servie par l'application
                  <img src={`${image.current}?v=${community.updatedAt?.getTime() ?? 0}`} alt={t("core.config.identity.current")} className="size-14 rounded-lg border border-line object-contain" />
                )}
                <input
                  id={`champ-${image.field}`}
                  type="file"
                  name={image.field}
                  accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.ico"
                  aria-describedby={`aide-${image.field}`}
                  className={`${INPUT_CLASS} min-w-0 flex-1 basis-56 file:mr-3 file:rounded file:border-0 file:bg-surface-2 file:px-3 file:py-1`}
                />
              </div>
              <p id={`aide-${image.field}`} className="mt-1.5 text-sm text-muted">
                {image.hint}
              </p>
              {image.current && (
                <label className="mt-2 flex min-h-9 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" name={`${image.field}-remove`} className="size-4 accent-(--c-primary)" />
                  {t("core.config.identity.remove")}
                </label>
              )}
            </div>
          ))}
          <WizardButtons current="identite" />
        </ActionForm>
      </Card>
    </WizardFrame>
  );
}

export default adminPage("core.community.configure", IdentiteStep);
