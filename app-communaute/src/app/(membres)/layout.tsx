/**
 * GABARIT DES PAGES RÉSERVÉES AUX MEMBRES : en-tête, puis contenu de la page.
 */
import { Suspense, type ReactNode } from "react";
import { coreLabels } from "@/core/i18n/labels.fr";
import { AppHeader, AppHeaderFallback } from "@/core/ui/AppHeader";

export default function MembersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenu" className="skip-link">
        {coreLabels["core.skipToContent"]}
      </a>
      <Suspense fallback={<AppHeaderFallback />}>
        <AppHeader />
      </Suspense>
      <main id="contenu" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
    </div>
  );
}
