/**
 * RÔLES
 *
 * Trois rôles, du moins au plus habilité. Chaque rôle inclut les droits des précédents :
 *   lecteur  → consultation, quiz, participation
 *   éditeur  → + contenus et animation, pour les modules actifs
 *   admin    → + configuration de la communauté, modules, utilisateurs
 */
export const ROLES = ["reader", "editor", "admin"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Vrai si « role » est au moins aussi habilité que « minimum ». */
export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLES.indexOf(role) >= ROLES.indexOf(minimum);
}
