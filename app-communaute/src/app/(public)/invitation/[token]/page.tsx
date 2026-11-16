/**
 * PAGE D'INVITATION — la personne invitée choisit son mot de passe.
 * Le lien n'est valable qu'une fois, et pendant une durée limitée.
 */
import Link from "next/link";
import { acceptInvitationAction } from "@/core/actions/auth";
import { PASSWORD_MIN_LENGTH } from "@/core/auth/password";
import { findInvitation } from "@/core/auth/users";
import { displayName } from "@/core/community/translator";
import { getCommunity, getT } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { publicPage } from "@/core/request/pages";
import { buttonClass, Card, Field } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";

export const generateMetadata = titleFrom("core.invitation.title");

async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, community, t] = await Promise.all([params, getCommunity(), getT()]);
  const invitation = await findInvitation(token);

  if (!invitation) {
    return (
      <Card>
        <h1 className="text-xl font-bold">{t("core.invitation.invalid.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("core.invitation.invalid.text")}</p>
        <Link href="/connexion" className={buttonClass("secondary", "mt-5")}>
          {t("core.invitation.toLogin")}
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-xl font-bold">{t("core.invitation.title")}</h1>
      <p className="mt-2 text-sm text-muted">
        {t("core.invitation.intro", { name: invitation.name, community: displayName(community, t) })}
      </p>
      <ActionForm action={acceptInvitationAction} className="mt-5 space-y-4">
        <input type="hidden" name="token" value={token} />
        {/* Champ caché : aide le gestionnaire de mots de passe à associer le bon identifiant. */}
        <input type="hidden" name="username" value={invitation.email} autoComplete="username" />
        <Field
          label={t("core.invitation.password")}
          name="password"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          hint={t("core.setup.passwordHint", { min: PASSWORD_MIN_LENGTH })}
        />
        <Field
          label={t("core.invitation.confirm")}
          name="confirmation"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
        />
        <SubmitButton className="w-full">{t("core.invitation.submit")}</SubmitButton>
      </ActionForm>
    </Card>
  );
}

export default publicPage(InvitationPage);
