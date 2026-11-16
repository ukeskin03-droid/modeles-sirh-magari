/**
 * FABRIQUES DE PAGES
 *
 * Chaque page de l'application est créée avec l'une des fonctions ci-dessous. Elles
 * font deux choses à la place de la page, pour qu'aucune ne puisse l'oublier :
 *
 *  1. le CONTRÔLE D'ACCÈS : personne connectée, droit suffisant, module actif.
 *     C'est ici que « les adresses d'un module désactivé redirigent vers l'accueil ».
 *
 *  2. l'AFFICHAGE PROGRESSIF : la page est entourée d'une zone d'attente (<Suspense>).
 *     Next.js envoie d'abord le squelette de la page, puis son contenu dès que la base
 *     a répondu. C'est l'organisation attendue par Next.js 16 pour les pages qui
 *     dépendent de la personne connectée.
 *
 * Exemple, pour une page du module quiz :
 *     export default modulePage("quiz", QuizHomePage);
 */
import { Suspense, type ReactNode } from "react";
import { after } from "next/server";
import { recordActivity } from "@/core/activity/log";
import { PageLoading } from "@/core/ui/PageLoading";
import { requireCan, requireModule, requireViewer, viewerCan } from "./context";
import { redirect } from "next/navigation";

type PageComponent<Props> = (props: Props) => ReactNode | Promise<ReactNode>;

function withBoundary<Props extends object>(Guarded: PageComponent<Props>) {
  return function Page(props: Props) {
    return (
      <Suspense fallback={<PageLoading />}>
        <Guarded {...props} />
      </Suspense>
    );
  };
}

/** Page accessible sans connexion (connexion, installation, invitation). */
export function publicPage<Props extends object>(Component: PageComponent<Props>) {
  return withBoundary<Props>(Component);
}

/** Page réservée aux personnes connectées. */
export function memberPage<Props extends object>(Component: PageComponent<Props>) {
  return withBoundary<Props>(async (props) => {
    await requireViewer();
    return <Component {...props} />;
  });
}

/** Page d'administration du moteur, soumise à un droit (ex. "core.users.manage"). */
export function adminPage<Props extends object>(action: string, Component: PageComponent<Props>) {
  return withBoundary<Props>(async (props) => {
    await requireCan(action);
    return <Component {...props} />;
  });
}

/**
 * Page d'un module, côté lecteur. Si le module est désactivé : retour à l'accueil.
 * Avec « trackView », l'ouverture de la page est notée dans le journal d'activité.
 */
export function modulePage<Props extends object>(
  moduleKey: string,
  Component: PageComponent<Props>,
  options: { trackView?: boolean } = {},
) {
  return withBoundary<Props>(async (props) => {
    const viewer = await requireModule(moduleKey);
    if (options.trackView) {
      // « after » : l'écriture dans le journal se fait une fois la page envoyée, sans la ralentir.
      after(() => recordActivity({ type: "module.view", userId: viewer.id, meta: { module: moduleKey } }));
    }
    return <Component {...props} />;
  });
}

/** Page d'administration d'un module : module actif ET droit suffisant. */
export function moduleAdminPage<Props extends object>(moduleKey: string, action: string, Component: PageComponent<Props>) {
  return withBoundary<Props>(async (props) => {
    await requireModule(moduleKey);
    if (!(await viewerCan(action))) redirect("/");
    return <Component {...props} />;
  });
}
