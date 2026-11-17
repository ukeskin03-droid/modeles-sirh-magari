/**
 * ADMINISTRATION › PARAMÈTRES — statut de la communauté, aperçu lecteur, accès aux écrans
 * de paramétrage (les mêmes que ceux de l'assistant) et autres réglages.
 */
import Link from "next/link";
import { setStatusAction } from "@/core/actions/admin";
import { saveSettingsAction } from "@/core/actions/setup";
import { startPreviewAction } from "@/core/actions/session";
import { getActiveModules, getCommunity, getT } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { setupSteps } from "@/core/setup/steps";
import { Badge, buttonClass, Card, Field, PageContainer, PageHeader, SectionTitle, SelectField } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";
import { Icon } from "@/core/ui/icons";

export const generateMetadata = titleFrom("core.admin.settings.title");

async function SettingsPage() {
  const [community, t, active] = await Promise.all([getCommunity(), getT(), getActiveModules()]);
  const isOpen = community.status === "open";
  const screens = setupSteps(active, false).filter((step) => step.slug !== "recapitulatif");

  return (
    <PageContainer narrow>
      <PageHeader
        title={t("core.admin.settings.title")}
        description={t("core.admin.settings.description")}
        back={{ href: "/admin", label: t("core.admin.back") }}
      />

      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <SectionTitle>{t("core.admin.settings.status.title")}</SectionTitle>
            <Badge tone={isOpen ? "success" : "warning"}>
              {isOpen ? t("core.admin.settings.status.open") : t("core.admin.settings.status.preparation")}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            {isOpen ? t("core.admin.settings.status.openHelp") : t("core.admin.settings.status.preparationHelp")}
          </p>
          <ActionForm
            action={setStatusAction}
            className="mt-4"
            confirmation={{
              title: t(isOpen ? "core.admin.settings.status.confirmClose.title" : "core.admin.settings.status.confirmOpen.title"),
              text: t(isOpen ? "core.admin.settings.status.confirmClose.text" : "core.admin.settings.status.confirmOpen.text"),
              confirm: t(isOpen ? "core.admin.settings.status.closeAction" : "core.admin.settings.status.openAction"),
              cancel: t("core.confirm.cancel"),
            }}
          >
            <input type="hidden" name="status" value={isOpen ? "preparation" : "open"} />
            <SubmitButton variant={isOpen ? "secondary" : "primary"}>
              {isOpen ? t("core.admin.settings.status.closeAction") : t("core.admin.settings.status.openAction")}
            </SubmitButton>
          </ActionForm>
        </Card>

        <Card>
          <SectionTitle>{t("core.admin.settings.preview.title")}</SectionTitle>
          <p className="mt-2 text-sm text-muted">{t("core.admin.settings.preview.text")}</p>
          <form action={startPreviewAction} className="mt-4">
            <button type="submit" className={buttonClass("secondary")}>
              <Icon name="eye" className="size-4" />
              {t("core.admin.settings.preview.action")}
            </button>
          </form>
        </Card>

        <Card>
          <SectionTitle>{t("core.admin.settings.screens.title")}</SectionTitle>
          <p className="mt-2 text-sm text-muted">{t("core.admin.settings.screens.text")}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {screens.map((step) => (
              <li key={step.slug}>
                <Link href={step.href} className="flex min-h-12 items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-surface-2">
                  <Icon name={step.icon} className="size-5 text-primary-text" />
                  {t(step.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>{t("core.admin.settings.other.title")}</SectionTitle>
          <ActionForm action={saveSettingsAction} className="mt-4 space-y-4">
            <Field
              label={t("core.admin.settings.other.retention")}
              name="activityRetentionMonths"
              type="number"
              min={1}
              max={60}
              required
              defaultValue={community.settings.activityRetentionMonths}
              hint={t("core.admin.settings.other.retentionHint")}
            />
            <SelectField
              label={t("core.admin.settings.other.share")}
              name="sharePreview"
              defaultValue={community.settings.sharePreview}
              options={[
                { value: "full", label: t("core.admin.settings.other.share.full") },
                { value: "neutral", label: t("core.admin.settings.other.share.neutral") },
              ]}
            />
            <p className="text-sm text-muted">{t("core.admin.settings.other.shareHint")}</p>
            <SubmitButton>{t("core.form.save")}</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </PageContainer>
  );
}

export default adminPage("core.community.configure", SettingsPage);
