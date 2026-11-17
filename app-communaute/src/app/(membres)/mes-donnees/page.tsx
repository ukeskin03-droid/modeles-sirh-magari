/**
 * MES DONNÉES (RGPD) — chaque membre peut consulter ce que la communauté sait de lui,
 * télécharger ses données, changer son mot de passe et supprimer son compte.
 */
import { changePasswordAction, deleteAccountAction } from "@/core/actions/privacy";
import { PASSWORD_MIN_LENGTH } from "@/core/auth/password";
import { db } from "@/core/db/client";
import { formatDate } from "@/core/i18n/format";
import { getT, requireViewer } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { memberPage } from "@/core/request/pages";
import { buttonClass, Card, Field, PageContainer, PageHeader, SectionTitle } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";
import { Icon } from "@/core/ui/icons";

export const generateMetadata = titleFrom("core.privacy.title");

async function MyDataPage() {
  const [viewer, t] = await Promise.all([requireViewer(), getT()]);
  const user = await db().user.findUniqueOrThrow({ where: { id: viewer.id } });
  const rows = [
    [t("core.privacy.account.name"), user.name],
    [t("core.privacy.account.email"), user.email],
    [t("core.privacy.account.role"), t(`core.role.${viewer.role}`)],
    [t("core.privacy.account.created"), formatDate(user.createdAt)],
  ];

  return (
    <PageContainer narrow>
      <PageHeader title={t("core.privacy.title")} description={t("core.privacy.intro")} />
      <div className="space-y-6">
        <Card>
          <SectionTitle>{t("core.privacy.account.title")}</SectionTitle>
          <dl className="mt-3 divide-y divide-line text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-2.5 sm:grid-cols-3 sm:gap-4">
                <dt className="font-medium text-muted">{label}</dt>
                <dd className="sm:col-span-2">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <SectionTitle>{t("core.privacy.data.title")}</SectionTitle>
          <p className="mb-4 mt-2 text-sm text-muted">{t("core.privacy.data.text")}</p>
          <a href="/mes-donnees/export" download className={buttonClass("secondary")}>
            <Icon name="download" className="size-4" />
            {t("core.privacy.data.export")}
          </a>
          <p className="mt-2 text-sm text-muted">{t("core.privacy.data.exportHint")}</p>
        </Card>

        <Card>
          <SectionTitle>{t("core.privacy.password.title")}</SectionTitle>
          <ActionForm action={changePasswordAction} className="mt-4 space-y-4">
            <input type="hidden" name="username" value={user.email} autoComplete="username" />
            <Field label={t("core.privacy.password.current")} name="current" type="password" required autoComplete="current-password" />
            <Field label={t("core.privacy.password.new")} name="password" type="password" required minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" hint={t("core.setup.passwordHint", { min: PASSWORD_MIN_LENGTH })} />
            <Field label={t("core.privacy.password.confirm")} name="confirmation" type="password" required minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" />
            <SubmitButton variant="secondary">{t("core.privacy.password.submit")}</SubmitButton>
          </ActionForm>
        </Card>

        <Card>
          <SectionTitle>{t("core.privacy.delete.title")}</SectionTitle>
          <p className="mt-2 text-sm text-muted">{t("core.privacy.delete.text")}</p>
          <ActionForm
            action={deleteAccountAction}
            className="mt-4 space-y-4"
            confirmation={{ title: t("core.privacy.delete.confirm.title"), text: t("core.privacy.delete.confirm.text"), confirm: t("core.privacy.delete.submit"), cancel: t("core.confirm.cancel"), danger: true }}
          >
            <Field label={t("core.privacy.delete.password")} name="password" id="champ-suppression" type="password" required autoComplete="current-password" />
            <SubmitButton variant="danger">{t("core.privacy.delete.submit")}</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </PageContainer>
  );
}

export default memberPage(MyDataPage);
