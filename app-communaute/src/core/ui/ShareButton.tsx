"use client";

/**
 * Bouton « Partager » : affiche un lien court vers le contenu, prêt à copier. Le clic sur
 * ce lien sera noté dans le journal d'activité.
 */
import { useState, useTransition } from "react";
import { buttonClass } from "./elements";
import { Icon } from "./icons";

export type ShareLabels = { button: string; label: string; copy: string; copied: string; help: string };

export function ShareButton({ createLink, labels }: { createLink: () => Promise<{ url: string } | null>; labels: ShareLabels }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!url) {
    return (
      <button type="button" disabled={pending} aria-busy={pending} className={buttonClass("secondary", "", "sm")} onClick={() => startTransition(async () => setUrl((await createLink())?.url ?? null))}>
        <Icon name="share" className="size-4" />
        {labels.button}
      </button>
    );
  }
  return (
    <div className="w-full rounded-lg border border-line bg-surface p-3 sm:max-w-md">
      <label htmlFor="lien-de-partage" className="mb-1 block text-xs font-semibold">
        {labels.label}
      </label>
      <div className="flex gap-2">
        <input id="lien-de-partage" readOnly value={url} onFocus={(event) => event.currentTarget.select()} className="min-h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface-2 px-2 font-mono text-xs" />
        <button
          type="button"
          className={buttonClass("primary", "", "sm")}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              // Presse-papiers indisponible : le champ reste sélectionnable à la main.
            }
          }}
        >
          <Icon name={copied ? "check" : "copy"} className="size-4" />
          <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">{labels.help}</p>
    </div>
  );
}
