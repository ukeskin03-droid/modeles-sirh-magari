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
