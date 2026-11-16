/**
 * COMPTES UTILISATEURS
 *
 * Dans cette application, il n'y a pas d'inscription libre :
 *  - le tout premier compte (administrateur) est créé à l'installation ;
 *  - ensuite, c'est un administrateur qui crée chaque compte. La personne reçoit un
 *    lien d'invitation qui lui permet de choisir elle-même son mot de passe.
 */
import { db } from "@/core/db/client";
import { INVITATION_DAYS } from "./constants";
import { hashPassword, verifyPassword } from "./password";
import { isRole, type Role } from "./roles";
import { deleteUserSessions } from "./sessions";
import { createToken, hashToken } from "./tokens";

const DAY = 24 * 60 * 60 * 1000;
const LOCK_WINDOW_MINUTES = 15;
const LOCK_AFTER_FAILURES = 8;

/** Erreur « métier » : la clé indique la règle enfreinte, l'écran affiche le libellé correspondant. */
export class UserRuleError extends Error {
  constructor(
    public readonly reason:
      | "email-taken"
      | "invalid-email"
      | "invalid-name"
      | "invalid-role"
      | "last-admin"
      | "self-change"
      | "unknown-user"
      | "already-installed",
  ) {
    super(reason);
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function checkIdentity(name: string, email: string): { name: string; email: string } {
  const cleanName = name.trim();
  const cleanEmail = normalizeEmail(email);
  if (cleanName.length < 1 || cleanName.length > 100) throw new UserRuleError("invalid-name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 200) throw new UserRuleError("invalid-email");
  return { name: cleanName, email: cleanEmail };
}

export async function countUsers(): Promise<number> {
  return db().user.count();
}

/** Crée le premier compte. Refusé dès qu'un compte existe déjà. */
export async function createFirstAdmin(input: { name: string; email: string; password: string }): Promise<string> {
  const identity = checkIdentity(input.name, input.email);
  if ((await countUsers()) > 0) throw new UserRuleError("already-installed");
  const user = await db().user.create({
    data: { ...identity, role: "admin", passwordHash: await hashPassword(input.password) },
  });
  return user.id;
}

/** Crée un compte sans mot de passe et le lien d'invitation qui permettra de le choisir. */
export async function createInvitedUser(input: { name: string; email: string; role: string }): Promise<{ userId: string; token: string }> {
  const identity = checkIdentity(input.name, input.email);
  if (!isRole(input.role)) throw new UserRuleError("invalid-role");
  if (await db().user.findUnique({ where: { email: identity.email } })) throw new UserRuleError("email-taken");
  const user = await db().user.create({ data: { ...identity, role: input.role } });
  return { userId: user.id, token: await createInvitation(user.id) };
}

/**
 * Crée un nouveau lien d'invitation (les précédents deviennent inutilisables).
 * Sert aussi quand une personne a oublié son mot de passe.
 */
export async function createInvitation(userId: string): Promise<string> {
  const user = await db().user.findUnique({ where: { id: userId } });
  if (!user) throw new UserRuleError("unknown-user");
  const token = createToken();
  await db().invitation.deleteMany({ where: { userId, usedAt: null } });
  await db().invitation.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITATION_DAYS * DAY) },
  });
  return token;
}

/** Retrouve la personne invitée à partir du jeton du lien (null si le lien n'est plus valable). */
export async function findInvitation(token: string): Promise<{ invitationId: string; userId: string; name: string; email: string } | null> {
  const invitation = await db().invitation.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!invitation || invitation.usedAt || invitation.expiresAt.getTime() <= Date.now() || !invitation.user.active) return null;
  return { invitationId: invitation.id, userId: invitation.userId, name: invitation.user.name, email: invitation.user.email };
}

/** Enregistre le mot de passe choisi et rend le lien inutilisable. Renvoie l'identifiant du compte. */
export async function acceptInvitation(token: string, password: string): Promise<string | null> {
  const invitation = await findInvitation(token);
  if (!invitation) return null;
  await db().user.update({ where: { id: invitation.userId }, data: { passwordHash: await hashPassword(password) } });
  await db().invitation.update({ where: { id: invitation.invitationId }, data: { usedAt: new Date() } });
  // Par prudence, on ferme les sessions qui existaient avec l'ancien mot de passe.
  await deleteUserSessions(invitation.userId);
  return invitation.userId;
}

// Empreinte factice : permet de faire le même calcul quand le compte n'existe pas, pour
// que le temps de réponse ne révèle pas si une adresse e-mail est connue.
let dummyHash: Promise<string> | null = null;

export type AuthenticationResult = { status: "ok"; userId: string } | { status: "invalid" } | { status: "locked" };

/** Vérifie un identifiant et un mot de passe, en bloquant les essais répétés. */
export async function authenticate(emailInput: string, password: string): Promise<AuthenticationResult> {
  const email = normalizeEmail(emailInput);
  const since = new Date(Date.now() - LOCK_WINDOW_MINUTES * 60 * 1000);
  const failures = await db().loginAttempt.count({ where: { email, createdAt: { gte: since } } });
  if (failures >= LOCK_AFTER_FAILURES) return { status: "locked" };

  const user = await db().user.findUnique({ where: { email } });
  dummyHash ??= hashPassword("mot-de-passe-factice");
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));

  if (!user || !user.active || !user.passwordHash || !valid) {
    await db().loginAttempt.create({ data: { email } });
    return { status: "invalid" };
  }
  await db().loginAttempt.deleteMany({ where: { email } });
  await db().user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { status: "ok", userId: user.id };
}

async function activeAdminCount(excludingUserId?: string): Promise<number> {
  return db().user.count({ where: { role: "admin", active: true, id: excludingUserId ? { not: excludingUserId } : undefined } });
}

/** Change le rôle d'un compte. Il doit toujours rester au moins un administrateur actif. */
export async function changeUserRole(userId: string, role: string, actingUserId: string): Promise<void> {
  if (!isRole(role)) throw new UserRuleError("invalid-role");
  if (userId === actingUserId) throw new UserRuleError("self-change");
  const user = await db().user.findUnique({ where: { id: userId } });
  if (!user) throw new UserRuleError("unknown-user");
  if (user.role === "admin" && role !== "admin" && (await activeAdminCount(userId)) === 0) throw new UserRuleError("last-admin");
  await db().user.update({ where: { id: userId }, data: { role: role satisfies Role } });
}

/** Désactive ou réactive un compte. Une désactivation déconnecte immédiatement la personne. */
export async function setUserActive(userId: string, active: boolean, actingUserId: string): Promise<void> {
  if (userId === actingUserId) throw new UserRuleError("self-change");
  const user = await db().user.findUnique({ where: { id: userId } });
  if (!user) throw new UserRuleError("unknown-user");
  if (!active && user.role === "admin" && (await activeAdminCount(userId)) === 0) throw new UserRuleError("last-admin");
  await db().user.update({ where: { id: userId }, data: { active } });
  if (!active) await deleteUserSessions(userId);
}

export async function setUserExpert(userId: string, isExpert: boolean): Promise<void> {
  const result = await db().user.updateMany({ where: { id: userId }, data: { isExpert } });
  if (result.count === 0) throw new UserRuleError("unknown-user");
}
