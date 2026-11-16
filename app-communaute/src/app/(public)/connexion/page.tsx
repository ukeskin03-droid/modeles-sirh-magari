/** PAGE DE CONNEXION */
import { redirect } from "next/navigation";
import { loginAction } from "@/core/actions/auth";
import { safeInternalPath } from "@/core/auth/constants";
import { countUsers } from "@/core/auth/users";
import { getT, getViewer } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { publicPage } from "@/core/request/pages";
import { Card, Field } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";

export const generateMetadata = titleFrom("core.login.title");

async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const [viewer, t, params] = await Promise.all([getViewer(), getT(), searchParams]);
  const next = safeInternalPath(params.suite);
  if (viewer) redirect(next);
  // Installation toute neuve : il faut d'abord créer le premier compte.
  if ((await countUsers()) === 0) redirect("/installation");

  return (
    <Card>
      <h1 className="text-xl font-bold">{t("core.login.title")}</h1>
      <ActionForm action={loginAction} className="mt-5 space-y-4">
        <input type="hidden" name="suite" value={next} />
        <Field label={t("core.login.email")} name="email" type="email" required autoComplete="username" autoFocus />
        <Field label={t("core.login.password")} name="password" type="password" required autoComplete="current-password" />
        <SubmitButton className="w-full">{t("core.login.submit")}</SubmitButton>
      </ActionForm>
      <p className="mt-5 text-sm text-muted">{t("core.login.help")}</p>
    </Card>
  );
}

export default publicPage(LoginPage);
