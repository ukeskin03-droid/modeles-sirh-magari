"use client";

/** Bouton qui copie un texte dans le presse-papiers. */
import { useState } from "react";
import { buttonClass } from "./elements";
import { Icon } from "./icons";

export function CopyButton({ value, label, copiedLabel }: { value: string; label: string; copiedLabel: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={buttonClass("secondary", "", "sm")}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 2500);
        } catch {
          // Presse-papiers indisponible : rien à faire.
        }
      }}
    >
      <Icon name={done ? "check" : "copy"} className="size-4" />
      <span aria-live="polite">{done ? copiedLabel : label}</span>
    </button>
  );
}
