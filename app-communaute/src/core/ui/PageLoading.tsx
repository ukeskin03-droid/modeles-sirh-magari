import { coreLabels } from "@/core/i18n/labels.fr";

/**
 * Squelette affiché pendant le chargement d'une page. Il fait partie de la partie
 * « fixe » de l'application : il ne peut donc pas lire la configuration de la communauté.
 */
export function PageLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-5xl px-4 py-10">
      <span className="sr-only">{coreLabels["core.loading"]}</span>
      <div aria-hidden="true" className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded-lg bg-surface-2" />
        <div className="h-4 w-2/3 rounded bg-surface-2" />
        <div className="grid gap-4 pt-4 sm:grid-cols-2">
          <div className="h-32 rounded-xl bg-surface-2" />
          <div className="h-32 rounded-xl bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
