/**
 * PAGE D'INSTALLATION — création du premier compte administrateur.
 * Elle n'est accessible que tant qu'aucun compte n'existe.
 */
import { redirect } from "next/navigation";
import { setupAction } from "@/core/actions/auth";
import { PASSWORD_MIN_LENGTH } from "@/core/auth/password";
import { countUsers } from "@/core/auth/users";
import { isProduction, setupCode } from "@/core/config/installation";
import { getCommunity, getT } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { publicPage } from "@/core/request/pages";
import { Alert, Card, Field } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";

export const generateMetadata = titleFrom("core.setup.title");

async function SetupPage() {
  const [community, t] = await Promise.all([getCommunity(), getT()]);
  if ((await countUsers()) > 0) redirect("/connexion");

  const codeRequired = Boolean(setupCode());
  // En production, sans code d'installation défini, on bloque : voir .env.example.
  const blocked = !codeRequired && isProduction();

  return (
    <Card>
      <h1 className="text-xl font-bold">{t("core.setup.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("core.setup.intro")}</p>
      {blocked ? (
        <div className="mt-5">
          <Alert tone="warning" role="alert">
            {t("core.setup.error.codeMissing")}
          </Alert>
        </div>
      ) : (
        <ActionForm action={setupAction} className="mt-5 space-y-4">
          {!community.name && <Field label={t("core.setup.communityName")} name="communityName" required maxLength={80} />}
          <Field label={t("core.setup.name")} name="name" required maxLength={100} autoComplete="name" />
          <Field label={t("core.setup.email")} name="email" type="email" required autoComplete="username" />
          <Field
            label={t("core.setup.password")}
            name="password"
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            hint={t("core.setup.passwordHint", { min: PASSWORD_MIN_LENGTH })}
          />
          {codeRequired && (
            <Field label={t("core.setup.code")} name="code" type="password" required autoComplete="off" hint={t("core.setup.codeHint")} />
          )}
          <SubmitButton className="w-full">{t("core.setup.submit")}</SubmitButton>
        </ActionForm>
      )}
    </Card>
  );
}

export default publicPage(SetupPage);
