/**
 * ACCUEIL DE L'ADMINISTRATION
 *
 * La liste des écrans vient du registre : ceux des modules actifs, puis ceux du
 * moteur, filtrés selon les droits de la personne. Un éditeur ne voit donc pas les
 * écrans de configuration, et les écrans d'un module désactivé n'apparaissent pas.
 */
import Link from "next/link";
import { adminScreensFor } from "@/core/modules/registry";
import { getActiveModules, getT, requireViewer } from "@/core/request/context";
import { titleFrom } from "@/core/request/metadata";
import { adminPage } from "@/core/request/pages";
import { EmptyState, PageContainer, PageHeader } from "@/core/ui/elements";
import { Icon } from "@/core/ui/icons";

export const generateMetadata = titleFrom("core.admin.title");

async function AdminHomePage() {
  const [viewer, t, active] = await Promise.all([requireViewer(), getT(), getActiveModules()]);
  const screens = adminScreensFor(active, viewer.effectiveRole);

  return (
    <PageContainer>
      <PageHeader title={t("core.admin.title")} description={t("core.admin.intro")} />
      {screens.length === 0 ? (
        <EmptyState title={t("core.admin.empty")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {screens.map((screen) => (
            <li key={screen.id}>
              <Link
                href={screen.href}
                className="flex h-full items-start gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs transition-colors hover:border-primary-text/50 hover:bg-surface-2"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
                  <Icon name={screen.icon} />
                </span>
                <span>
                  <span className="block font-semibold">{t(screen.labelKey)}</span>
                  <span className="mt-1 block text-sm text-muted">{t(screen.descriptionKey)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}

export default adminPage("core.admin.access", AdminHomePage);
