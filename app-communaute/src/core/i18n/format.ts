/**
 * Mise en forme des dates, en français. Le fuseau horaire est fixé (Europe/Paris par
 * défaut, réglable par DISPLAY_TIME_ZONE) pour que l'affichage ne dépende pas du
 * réglage du serveur.
 */
const timeZone = process.env.DISPLAY_TIME_ZONE?.trim() || "Europe/Paris";

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone });

export function formatDateTime(date: Date): string {
  return dateTime.format(date);
}

const dateOnly = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone });

export function formatDate(date: Date): string {
  return dateOnly.format(date);
}

// ── Champs « date et heure » des formulaires ────────────────────────────────
// Un champ de formulaire donne une date « locale », sans fuseau (« 2026-11-17T09:30 »).
// On l'interprète dans le fuseau d'affichage de l'application.

const inputParts = new Intl.DateTimeFormat("sv-SE", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Date → valeur d'un champ <input type="datetime-local">. */
export function toDateTimeInput(date: Date | null | undefined): string {
  return date ? inputParts.format(date).replace(" ", "T") : "";
}

/** Valeur d'un champ <input type="datetime-local"> → date (null si le champ est vide ou invalide). */
export function fromDateTimeInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const wanted = Date.UTC(year, month - 1, day, hour, minute);
  // On cherche l'instant qui, affiché dans le fuseau de l'application, donne l'heure saisie.
  let instant = wanted;
  for (let pass = 0; pass < 2; pass++) {
    const shown = fromDateTimeInputAsUtc(inputParts.format(new Date(instant)));
    instant += wanted - shown;
  }
  return new Date(instant);
}

function fromDateTimeInputAsUtc(formatted: string): number {
  const [year, month, day, hour, minute] = formatted.split(/[- :T]/).map(Number);
  return Date.UTC(year, month - 1, day, hour, minute);
}
