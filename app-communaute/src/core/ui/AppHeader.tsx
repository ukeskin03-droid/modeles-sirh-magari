/**
 * EN-TÊTE DE L'APPLICATION
 *
 * Logo et nom de la communauté, menu, accès à l'administration, thème, déconnexion,
 * puis les bandeaux d'état (communauté en préparation, aperçu lecteur).
 *
 * Le menu est construit à partir du registre : il contient l'accueil et les entrées
 * déclarées par les modules ACTIFS. Rien ici ne mentionne un module en particulier.
 */
import Link from "next/link";
import { logoutAction, stopPreviewAction } from "@/core/actions/session";
import { displayName } from "@/core/community/translator";
import { navigationFor } from "@/core/modules/registry";
import { getActiveModules, getCommunity, getT, getViewer, viewerCan } from "@/core/request/context";
import { buttonClass } from "./elements";
import { Icon } from "./icons";
import { NavLink } from "./NavLink";
import { ThemeToggle } from "./ThemeToggle";

export async function AppHeader() {
  const viewer = await getViewer();
  if (!viewer) return null; // la page elle-même redirige vers la connexion

  const [community, t, active] = await Promise.all([getCommunity(), getT(), getActiveModules()]);
  const name = displayName(community, t);
  const canAdmin = await viewerCan("core.admin.access");
  const canConfigure = await viewerCan("core.community.configure");
  const entries = navigationFor(active);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg py-1 pr-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- image servie par l'application, de taille libre */}
            <img src="/logo" alt="" width={36} height={36} className="size-9 shrink-0 rounded-lg object-contain" />
            <span className="min-w-0">
              <span className="block truncate font-bold leading-tight">{name}</span>
              {community.subtitle && <span className="hidden truncate text-xs text-muted sm:block">{community.subtitle}</span>}
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            {canAdmin && (
              <NavLink href="/admin">
                <Icon name="admin" />
                <span className="hidden sm:inline">{t("core.nav.admin")}</span>
                <span className="sr-only sm:hidden">{t("core.nav.admin")}</span>
              </NavLink>
            )}
            <ThemeToggle
              labels={{
                label: t("core.theme.label"),
                auto: t("core.theme.auto"),
                light: t("core.theme.light"),
                dark: t("core.theme.dark"),
              }}
            />
            <form action={logoutAction}>
              <button
                type="submit"
                title={t("core.header.account", { name: viewer.name })}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-fg hover:bg-surface-2"
              >
                <span className="hidden max-w-32 truncate md:inline">{viewer.name}</span>
                <Icon name="logout" />
                <span className="sr-only">{t("core.header.logout")}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Menu : sur petit écran, il défile horizontalement au lieu de passer à la ligne. */}
        <nav aria-label={t("core.nav.main")} className="mx-auto max-w-5xl overflow-x-auto px-4 pb-2">
          <ul className="flex gap-1">
            {entries.map((entry) => (
              <li key={entry.id}>
                <NavLink href={entry.href}>
                  <Icon name={entry.icon} />
                  {t(entry.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {viewer.previewAsReader && (
        <div className="border-b border-warning-text/30 bg-warning-soft">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2 text-sm">
            <Icon name="eye" className="size-4" />
            <p className="min-w-0 flex-1 font-medium">{t("core.banner.preview")}</p>
            <form action={stopPreviewAction}>
              <button type="submit" className={buttonClass("secondary", "", "sm")}>
                {t("core.banner.preview.exit")}
              </button>
            </form>
          </div>
        </div>
      )}

      {community.status !== "open" && (
        <div className="border-b border-primary-text/20 bg-primary-soft">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2 text-sm">
            <Icon name="info" className="size-4" />
            <p className="min-w-0 flex-1">{t("core.banner.preparation")}</p>
            {canConfigure && (
              <Link href="/admin/parametres" className="font-semibold text-primary-text hover:underline">
                {t("core.banner.preparation.link")}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Version « vide » de l'en-tête, affichée le temps du chargement pour éviter un saut de mise en page. */
export function AppHeaderFallback() {
  return <div aria-hidden="true" className="h-[6.25rem] border-b border-line bg-surface" />;
}
