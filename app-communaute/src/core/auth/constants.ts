/**
 * Constantes de connexion partagées, sans aucune dépendance : ce fichier est aussi
 * lu par src/proxy.ts, qui s'exécute avant le reste de l'application.
 */

/** Nom du cookie qui porte le jeton de session. */
export const SESSION_COOKIE = "session";

/** Une session expire après 30 jours sans visite. */
export const SESSION_IDLE_DAYS = 30;

/** Un lien d'invitation est valable 7 jours. */
export const INVITATION_DAYS = 7;

/** Pages accessibles sans être connecté. */
export const PUBLIC_PATHS = ["/connexion", "/installation", "/invitation", "/bientot", "/apercu-image"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * N'accepte qu'une adresse interne à l'application (« /quiz »), jamais une adresse
 * externe : cela empêche d'utiliser la page de connexion pour rediriger vers un site piégé.
 */
export function safeInternalPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
