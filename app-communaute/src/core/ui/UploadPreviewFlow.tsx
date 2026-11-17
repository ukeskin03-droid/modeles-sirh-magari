"use client";

/**
 * IMPORT EN DEUX TEMPS — envoyer un fichier, voir ce qui sera fait, puis confirmer.
 *
 * Ce composant sert à l'import d'un pack et aux imports en masse. Il s'exécute dans le
 * navigateur ; tout le travail (lecture du fichier, contrôles, enregistrement) est fait
 * par une action du serveur, qui lui renvoie quoi afficher.
 */
import { useActionState, useRef, useState, useTransition } from "react";
import { Alert, buttonClass } from "./elements";
import { Icon } from "./icons";

export type PreviewRow = {
  id: string;
  cells: string[];
  status: "ok" | "warning" | "error";
  messages: string[];
};

export type PreviewTable = {
  title: string;
  headers: string[];
  rows: PreviewRow[];
  /** Vrai si l'utilisateur peut exclure des lignes */
  selectable: boolean;
};

export type FlowState =
  | null
  | { phase: "error"; message: string }
  | { phase: "preview"; token: string; summary: string[]; tables: PreviewTable[]; warnings: string[]; canConfirm: boolean }
  | { phase: "done"; message: string; details: string[] };

export type FlowAction = (state: FlowState, data: FormData) => Promise<FlowState>;

export type FlowLabels = {
  drop: string;
  browse: string;
  analyze: string;
  confirm: string;
  cancel: string;
  restart: string;
  include: string;
  statusOk: string;
  statusWarning: string;
  statusError: string;
  warnings: string;
  /** Contient « {count} » */
  selected: string;
};

export function UploadPreviewFlow({
  action,
  accept,
  multiple = false,
  labels,
  children,
}: {
  action: FlowAction;
  accept: string;
  multiple?: boolean;
  labels: FlowLabels;
  /** Champs supplémentaires envoyés avec le fichier */
  children?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, null);
  const [pending, startTransition] = useTransition();
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const send = (data: FormData) => startTransition(() => formAction(data));
  const sendIntent = (intent: "confirm" | "cancel", token: string) => {
    const data = new FormData();
    data.set("intent", intent);
    data.set("token", token);
    for (const id of excluded) data.append("excluded", id);
    send(data);
    if (intent === "cancel") {
      setFileNames([]);
      setExcluded(new Set());
    }
  };

  const statusLabel = { ok: labels.statusOk, warning: labels.statusWarning, error: labels.statusError };
  const statusClass = { ok: "bg-success-soft text-success-text", warning: "bg-warning-soft text-warning-text", error: "bg-danger-soft text-danger-text" };

  if (state?.phase === "done") {
    return (
      <div className="space-y-4">
        <Alert tone="success" role="status">
          <p className="font-semibold">{state.message}</p>
          {state.details.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {state.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
        </Alert>
        <button type="button" className={buttonClass("secondary")} onClick={() => window.location.reload()}>
          {labels.restart}
        </button>
      </div>
    );
  }

  if (state?.phase === "preview") {
    const selectableRows = state.tables.filter((table) => table.selectable).flatMap((table) => table.rows.filter((row) => row.status !== "error"));
    const kept = selectableRows.filter((row) => !excluded.has(row.id)).length;
    return (
      <div className="space-y-5" aria-busy={pending}>
        {state.summary.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-surface-2 px-4 py-3 text-sm">
            {state.summary.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        )}
        {state.tables.map((table) => (
          <section key={table.title}>
            <h3 className="mb-2 font-semibold">{table.title}</h3>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-xl text-left text-sm">
                <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    {table.selectable && <th scope="col" className="px-3 py-2 font-semibold">{labels.include}</th>}
                    {table.headers.map((header) => (
                      <th key={header} scope="col" className="px-3 py-2 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {table.rows.map((row) => (
                    <tr key={row.id} className="align-top">
                      {table.selectable && (
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            aria-label={`${labels.include} : ${row.cells[0]}`}
                            disabled={row.status === "error"}
                            checked={row.status !== "error" && !excluded.has(row.id)}
                            onChange={(event) =>
                              setExcluded((current) => {
                                const next = new Set(current);
                                if (event.target.checked) next.delete(row.id);
                                else next.add(row.id);
                                return next;
                              })
                            }
                            className="size-4 accent-(--c-primary)"
                          />
                        </td>
                      )}
                      {row.cells.map((cell, index) => (
                        <td key={index} className="px-3 py-2">
                          {index === row.cells.length - 1 ? (
                            <>
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass[row.status]}`}>{cell || statusLabel[row.status]}</span>
                              {row.messages.length > 0 && (
                                <ul className="mt-1 space-y-0.5 text-xs">
                                  {row.messages.map((message, position) => (
                                    <li key={position}>{message}</li>
                                  ))}
                                </ul>
                              )}
                            </>
                          ) : (
                            <span className="line-clamp-3">{cell}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {state.warnings.length > 0 && (
          <Alert tone="warning">
            <p className="font-semibold">{labels.warnings}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {state.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </Alert>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending || !state.canConfirm || (selectableRows.length > 0 && kept === 0)} className={buttonClass("primary")} onClick={() => sendIntent("confirm", state.token)}>
            {labels.confirm}
          </button>
          <button type="button" disabled={pending} className={buttonClass("secondary")} onClick={() => sendIntent("cancel", state.token)}>
            {labels.cancel}
          </button>
          {selectableRows.length > 0 && <span className="text-sm text-muted">{labels.selected.replace("{count}", String(kept))}</span>}
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        setExcluded(new Set());
        send(new FormData(event.currentTarget));
      }}
      className="space-y-4"
    >
      <input type="hidden" name="intent" value="preview" />
      {children}
      {/* Zone de dépôt : on peut y glisser un fichier, ou cliquer pour le choisir. */}
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (inputRef.current && event.dataTransfer.files.length > 0) {
            inputRef.current.files = event.dataTransfer.files;
            setFileNames([...event.dataTransfer.files].map((file) => file.name));
          }
        }}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-text ${
          dragging ? "border-primary-text bg-primary-soft" : "border-line bg-surface hover:bg-surface-2"
        }`}
      >
        <Icon name="arrow" className="size-6 -rotate-90 text-muted" />
        <span className="font-medium">{fileNames.length > 0 ? fileNames.join(", ") : labels.drop}</span>
        <span className="text-primary-text underline">{labels.browse}</span>
        <input
          ref={inputRef}
          type="file"
          name="files"
          accept={accept}
          multiple={multiple}
          required
          onChange={(event) => setFileNames([...(event.target.files ?? [])].map((file) => file.name))}
          className="sr-only"
        />
      </label>
      {state?.phase === "error" && (
        <Alert tone="danger" role="alert">
          {state.message}
        </Alert>
      )}
      <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass("primary")}>
        {labels.analyze}
      </button>
    </form>
  );
}
