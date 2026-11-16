/**
 * ADMINISTRATION › PARAMÈTRES — statut de la communauté, aperçu lecteur, et rappel
 * de l'identité et de l'apparence en vigueur.
 */
import { setStatusAction } from "@/core/actions/admin";
import { startPreviewAction } from "@/core/actions/session";
import { displayName } from "@/core/community/translator";
import { db } from "@/core/db/client";
import { defaultVocabulary } from "@/core/modules/registry";
import { getActiveModules, getCommunity, getT } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { Alert, Badge, buttonClass, Card, PageContainer, PageHeader, SectionTitle } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";
import { Icon } from "@/core/ui/icons";

export const generateMetadata = titleFrom("core.admin.settings.title");

async function SettingsPage() {
  const [community, t, active] = await Promise.all([getCommunity(), getT(), getActiveModules()]);
  const isOpen = community.status === "open";
  const categories = await db().category.findMany({ where: { parentId: null }, orderBy: { position: "asc" }, include: { children: { orderBy: { position: "asc" } } } });
  // Vocabulaire : uniquement les termes des modules actifs.
  const terms = Object.entries(defaultVocabulary(active));

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: t("core.admin.settings.identity.name"), value: displayName(community, t) },
    { label: t("core.admin.settings.identity.subtitle"), value: community.subtitle || "—" },
    { label: t("core.admin.settings.identity.font"), value: t(`core.font.${community.theme.font}`) },
    { label: t("core.admin.settings.identity.primary"), value: <Swatch color={community.theme.colors.primary} /> },
    { label: t("core.admin.settings.identity.accent"), value: <Swatch color={community.theme.colors.accent} /> },
    {
      label: t("core.admin.settings.identity.vocabulary"),
      value: (
        <ul className="space-y-0.5">
          {terms.map(([key, fallback]) => {
            const term = community.vocabulary[key] ?? fallback;
            return (
              <li key={key}>
                {term.singular} / {term.plural}
              </li>
            );
          })}
        </ul>
      ),
    },
    {
      label: t("core.admin.settings.identity.categories"),
      value:
        categories.length === 0 ? (
          t("core.admin.settings.identity.none")
        ) : (
          <ul className="space-y-0.5">
            {categories.map((category) => (
              <li key={category.id}>
                {category.name}
                {category.children.length > 0 && <span className="text-muted"> › {category.children.map((child) => child.name).join(", ")}</span>}
              </li>
            ))}
          </ul>
        ),
    },
    {
      label: t("core.admin.settings.identity.retention"),
      value: t("core.admin.settings.identity.retentionValue", { months: community.settings.activityRetentionMonths }),
    },
  ];

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
          <SectionTitle>{t("core.admin.settings.identity.title")}</SectionTitle>
          <div className="mt-3">
            <Alert>{t("core.admin.settings.identity.note")}</Alert>
          </div>
          <dl className="mt-4 divide-y divide-line text-sm">
            {rows.map((row) => (
              <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-muted">{row.label}</dt>
                <dd className="sm:col-span-2">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </PageContainer>
  );
}

/** Pastille de couleur accompagnée de son code. */
function Swatch({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="inline-block size-5 rounded border border-line" style={{ backgroundColor: color }} />
      <code className="text-xs">{color}</code>
    </span>
  );
}

export default adminPage("core.community.configure", SettingsPage);
