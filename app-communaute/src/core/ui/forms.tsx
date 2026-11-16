"use client";

/**
 * FORMULAIRES INTERACTIFS
 *
 * Ce fichier s'exécute dans le navigateur (« use client »). Il contient les quelques
 * comportements qui en ont besoin : afficher le résultat d'un formulaire sans recharger
 * la page, demander une confirmation, copier un lien.
 *
 * Les textes ne sont jamais écrits ici : ils sont fournis par la page, qui les a lus
 * dans les libellés.
 */
import { createContext, useActionState, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import { Alert, buttonClass, type ButtonSize, type ButtonVariant } from "./elements";
import { Icon } from "./icons";

/** Ce qu'une action renvoie au formulaire qui l'a déclenchée. */
export type FormState = {
  error?: string;
  notice?: string;
  /** Lien à afficher avec un bouton « Copier » (ex. lien d'invitation) */
  link?: { label: string; url: string; copy: string; copied: string };
} | null;

export type FormAction = (state: FormState, data: FormData) => Promise<FormState>;

const PendingContext = createContext(false);

type Confirmation = { title: string; text: string; confirm: string; cancel: string; danger?: boolean };

/**
 * Formulaire relié à une action du serveur.
 *  - Il affiche le message d'erreur ou de confirmation renvoyé par l'action.
 *  - En cas d'erreur, les valeurs saisies sont conservées.
 *  - Avec « confirmation », une fenêtre demande de confirmer avant l'envoi.
 */
export function ActionForm({
  action,
  children,
  className,
  confirmation,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  confirmation?: Confirmation;
}) {
  const [state, formAction] = useActionState(action, null);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const waitingData = useRef<FormData | null>(null);

  const send = (data: FormData) => startTransition(() => formAction(data));

  return (
    <PendingContext value={pending}>
      <form
        action={formAction}
        className={className}
        onSubmit={(event) => {
          // On envoie nous-mêmes les données : ainsi, le formulaire n'est pas vidé après l'envoi.
          event.preventDefault();
          const submitter = (event.nativeEvent as SubmitEvent).submitter;
          const data = new FormData(event.currentTarget, submitter);
          if (confirmation) {
            waitingData.current = data;
            dialogRef.current?.showModal();
          } else {
            send(data);
          }
        }}
      >
        {children}
        {state?.error && (
          <div className="mt-3">
            <Alert tone="danger" role="alert">
              {state.error}
            </Alert>
          </div>
        )}
        {state?.notice && (
          <div className="mt-3">
            <Alert tone="success" role="status">
              <p>{state.notice}</p>
              {state.link && <CopyField {...state.link} />}
            </Alert>
          </div>
        )}
      </form>

      {confirmation && (
        <dialog
          ref={dialogRef}
          aria-labelledby="confirmation-titre"
          className="m-auto w-[min(92vw,28rem)] rounded-xl border border-line bg-surface p-6 text-fg shadow-xl backdrop:bg-black/50"
        >
          <h2 id="confirmation-titre" className="text-lg font-semibold">
            {confirmation.title}
          </h2>
          <p className="mt-2 text-sm text-muted">{confirmation.text}</p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" className={buttonClass("secondary")} onClick={() => dialogRef.current?.close()}>
              {confirmation.cancel}
            </button>
            <button
              type="button"
              className={buttonClass(confirmation.danger ? "danger" : "primary")}
              onClick={() => {
                dialogRef.current?.close();
                if (waitingData.current) send(waitingData.current);
              }}
            >
              {confirmation.confirm}
            </button>
          </div>
        </dialog>
      )}
    </PendingContext>
  );
}

/** Bouton d'envoi : il se désactive pendant le traitement, pour éviter les doubles envois. */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  name,
  value,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  name?: string;
  value?: string;
}) {
  const pending = useContext(PendingContext);
  return (
    <button type="submit" name={name} value={value} disabled={pending} aria-busy={pending} className={buttonClass(variant, className, size)}>
      {children}
    </button>
  );
}

/** Champ en lecture seule avec un bouton « Copier ». */
export function CopyField({ label, url, copy, copied }: { label: string; url: string; copy: string; copied: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-3">
      <label htmlFor="lien-a-copier" className="mb-1 block text-xs font-semibold">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="lien-a-copier"
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="min-h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs text-fg"
        />
        <button
          type="button"
          className={buttonClass("secondary")}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setDone(true);
              setTimeout(() => setDone(false), 2500);
            } catch {
              // Presse-papiers indisponible : le champ reste sélectionnable à la main.
            }
          }}
        >
          <Icon name={done ? "check" : "copy"} className="size-4" />
          <span aria-live="polite">{done ? copied : copy}</span>
        </button>
      </div>
    </div>
  );
}
