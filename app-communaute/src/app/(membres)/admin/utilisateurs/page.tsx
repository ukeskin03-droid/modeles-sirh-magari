/**
 * ADMINISTRATION › UTILISATEURS — créer les comptes, inviter, attribuer les rôles.
 */
import { changeRoleAction, createUserAction, renewInvitationAction, setActiveAction, setExpertAction } from "@/core/actions/admin";
import { ROLES } from "@/core/auth/roles";
import { db } from "@/core/db/client";
import { formatDateTime } from "@/core/i18n/format";
import { getT, requireViewer } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { Badge, Card, DataTable, Field, PageContainer, PageHeader, SectionTitle, SelectField } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";

export const generateMetadata = titleFrom("core.admin.users.title");

async function UsersPage() {
  const [viewer, t] = await Promise.all([requireViewer(), getT()]);
  const users = await db().user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  const roleOptions = ROLES.map((role) => ({ value: role, label: t(`core.role.${role}`) }));

  return (
    <PageContainer>
      <PageHeader
        title={t("core.admin.users.title")}
        description={t("core.admin.users.description")}
        back={{ href: "/admin", label: t("core.admin.back") }}
      />

      <Card className="mb-8">
        <SectionTitle>{t("core.admin.users.create.title")}</SectionTitle>
        <ActionForm action={createUserAction} className="mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("core.admin.users.create.name")} name="name" required maxLength={100} autoComplete="off" />
            <Field label={t("core.admin.users.create.email")} name="email" type="email" required maxLength={200} autoComplete="off" />
            <SelectField label={t("core.admin.users.create.role")} name="role" options={roleOptions} defaultValue="reader" />
          </div>
          <div className="mt-4">
            <SubmitButton>{t("core.admin.users.create.submit")}</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">{t("core.admin.users.list.title")}</h2>
      <DataTable
        caption={t("core.admin.users.list.title")}
        headers={[t("core.admin.users.col.name"), t("core.admin.users.col.role"), t("core.admin.users.col.status"), t("core.admin.users.col.actions")]}
      >
        {users.map((user) => {
          const isSelf = user.id === viewer.id;
          const status = !user.active ? "disabled" : user.passwordHash ? "active" : "pending";
          return (
            <tr key={user.id} className="align-top">
              <th scope="row" className="px-4 py-3 text-left font-normal">
                <span className="font-semibold">{user.name}</span>
                {isSelf && <span className="text-muted"> ({t("core.admin.users.you")})</span>}
                <span className="block text-muted">{user.email}</span>
                <span className="block text-xs text-muted">
                  {user.lastLoginAt ? t("core.admin.users.lastLogin", { date: formatDateTime(user.lastLoginAt) }) : t("core.admin.users.neverLoggedIn")}
                </span>
              </th>
              <td className="px-4 py-3">
                {isSelf ? (
                  t(`core.role.${user.role}`)
                ) : (
                  <ActionForm action={changeRoleAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <SelectField
                      label={t("core.admin.users.action.roleLabel", { name: user.name })}
                      hideLabel
                      id={`role-${user.id}`}
                      name="role"
                      options={roleOptions}
                      defaultValue={user.role}
                    />
                    <SubmitButton variant="secondary">{t("core.admin.users.action.saveRole")}</SubmitButton>
                  </ActionForm>
                )}
                {user.isExpert && (
                  <div className="mt-2">
                    <Badge tone="info">{t("core.admin.users.expert")}</Badge>
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge tone={status === "active" ? "success" : status === "pending" ? "warning" : "neutral"}>
                  {t(`core.admin.users.status.${status}`)}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-start">
                  <ActionForm action={setExpertAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="expert" value={String(!user.isExpert)} />
                    <SubmitButton variant="ghost" size="sm">
                      {user.isExpert ? t("core.admin.users.action.removeExpert") : t("core.admin.users.action.makeExpert")}
                      <span className="sr-only"> : {user.name}</span>
                    </SubmitButton>
                  </ActionForm>
                  {user.active && (
                    <ActionForm action={renewInvitationAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <SubmitButton variant="ghost" size="sm">
                        {t("core.admin.users.action.newLink")}
                        <span className="sr-only"> : {user.name}</span>
                      </SubmitButton>
                    </ActionForm>
                  )}
                  {!isSelf && (
                    <ActionForm
                      action={setActiveAction}
                      confirmation={
                        user.active
                          ? {
                              title: t("core.admin.users.confirmDeactivate.title"),
                              text: t("core.admin.users.confirmDeactivate.text", { name: user.name }),
                              confirm: t("core.admin.users.action.deactivate"),
                              cancel: t("core.confirm.cancel"),
                              danger: true,
                            }
                          : undefined
                      }
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="active" value={String(!user.active)} />
                      <SubmitButton variant="ghost" size="sm">
                        {user.active ? t("core.admin.users.action.deactivate") : t("core.admin.users.action.activate")}
                        <span className="sr-only"> : {user.name}</span>
                      </SubmitButton>
                    </ActionForm>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </PageContainer>
  );
}

export default adminPage("core.users.manage", UsersPage);
