"use client";

/**
 * Page affichée quand une erreur inattendue empêche l'affichage. Elle s'exécute dans
 * le navigateur et ne peut pas lire la configuration : elle utilise les libellés par défaut.
 */
import { coreLabels } from "@/core/i18n/labels.fr";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">{coreLabels["core.error.title"]}</h1>
      <p className="mt-2 max-w-md text-muted">{coreLabels["core.error.text"]}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
      >
        {coreLabels["core.error.retry"]}
      </button>
    </main>
  );
}
