/** PAGE DE CONNEXION */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "@/core/actions/auth";
import { safeInternalPath } from "@/core/auth/constants";
import { countUsers } from "@/core/auth/users";
import { getBaseUrl, getT, getViewer } from "@/core/request/context";
import { publicPage } from "@/core/request/pages";
import { sharePreviewFor } from "@/core/share/service";
import { Alert, Card, Field } from "@/core/ui/elements";
import { ActionForm, SubmitButton } from "@/core/ui/forms";

/**
 * Quand un lien vers un contenu est collé dans une messagerie (WhatsApp, Teams, e-mail),
 * celle-ci vient lire cette page sans être connectée. On lui fournit ici l'aperçu du
 * contenu visé : titre, résumé et image (métadonnées « Open Graph »). Le contenu
 * lui-même reste réservé aux membres.
 */
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ suite?: string }> }): Promise<Metadata> {
  const [t, params] = await Promise.all([getT(), searchParams]);
  const next = safeInternalPath(params.suite);
  if (next === "/") return { title: t("core.login.title") };

  const [preview, baseUrl] = await Promise.all([sharePreviewFor(next.split("?")[0]), getBaseUrl()]);
  const image = `${baseUrl}/apercu-image?chemin=${encodeURIComponent(next.split("?")[0])}`;
  return {
    title: preview.detailed ? preview.title : t("core.login.title"),
    description: preview.description || undefined,
    openGraph: {
      type: "article",
      siteName: preview.communityName,
      title: preview.title,
      description: preview.description || undefined,
      url: `${baseUrl}${next}`,
      images: [{ url: image, width: 1200, height: 630, alt: preview.title }],
    },
    twitter: { card: "summary_large_image", title: preview.title, description: preview.description || undefined, images: [image] },
  };
}

async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const [viewer, t, params] = await Promise.all([getViewer(), getT(), searchParams]);
  const next = safeInternalPath(params.suite);
  if (viewer) redirect(next);
  // Installation toute neuve : il faut d'abord créer le premier compte.
  if ((await countUsers()) === 0) redirect("/installation");

  const preview = next === "/" ? null : await sharePreviewFor(next.split("?")[0]);

  return (
    <Card>
      <h1 className="text-xl font-bold">{t("core.login.title")}</h1>
      {preview?.detailed && (
        <div className="mt-4">
          <Alert>
            <p className="text-xs">{t("core.share.loginTeaser")}</p>
            <p className="font-semibold">{preview.title}</p>
          </Alert>
        </div>
      )}
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
