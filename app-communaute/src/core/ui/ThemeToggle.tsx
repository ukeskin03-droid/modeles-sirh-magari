"use client";

/**
 * Bouton de thème : automatique (suit l'appareil) → clair → sombre.
 * Le choix est gardé dans le navigateur de la personne (localStorage) ; il est appliqué
 * en posant l'attribut data-theme sur la page, que lit la feuille de style /theme.css.
 */
import { useSyncExternalStore } from "react";
import { Icon } from "./icons";

type Mode = "auto" | "light" | "dark";
const ORDER: Mode[] = ["auto", "light", "dark"];
const STORAGE_KEY = "theme";
const CHANGE_EVENT = "theme-change";

function readMode(): Mode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "auto";
  } catch {
    return "auto";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function applyMode(mode: Mode) {
  try {
    if (mode === "auto") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Stockage indisponible (navigation privée) : le choix vaut pour la page en cours.
  }
  if (mode === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = mode;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function ThemeToggle({ labels }: { labels: { label: string; auto: string; light: string; dark: string } }) {
  const mode = useSyncExternalStore<Mode>(subscribe, readMode, () => "auto");
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
  const icon = mode === "auto" ? "auto" : mode === "light" ? "sun" : "moon";

  return (
    <button
      type="button"
      onClick={() => applyMode(next)}
      title={`${labels.label} : ${labels[mode]}`}
      className="inline-flex size-10 items-center justify-center rounded-lg text-fg hover:bg-surface-2"
    >
      <Icon name={icon} />
      <span className="sr-only">
        {labels.label} : {labels[mode]}
      </span>
    </button>
  );
}

/**
 * Petit script exécuté avant l'affichage de la page : il applique tout de suite le thème
 * choisi, pour éviter un bref affichage dans le mauvais thème.
 */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
