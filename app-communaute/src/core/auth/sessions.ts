/**
 * SESSIONS DE CONNEXION
 *
 * Quand une personne se connecte, on crée une « session » : un jeton aléatoire est
 * déposé dans un cookie de son navigateur, et son empreinte est enregistrée en base.
 * À chaque visite, le jeton du cookie permet de retrouver la session, donc la personne.
 * Supprimer la session en base déconnecte immédiatement la personne.
 */
import { db } from "@/core/db/client";
import { SESSION_IDLE_DAYS } from "./constants";
import { isRole, type Role } from "./roles";
import { createToken, hashToken } from "./tokens";

const DAY = 24 * 60 * 60 * 1000;

export type SessionUser = {
  sessionId: string;
  previewAsReader: boolean;
  user: { id: string; name: string; email: string; role: Role; isExpert: boolean };
};

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_IDLE_DAYS * DAY);
  await db().session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

/** Retrouve la personne connectée à partir du jeton du cookie (null si la session n'est plus valable). */
export async function findSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await db().session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now || !session.user.active) {
    await db().session.deleteMany({ where: { id: session.id } });
    return null;
  }

  // La session se prolonge tant que la personne revient : on repousse l'échéance
  // quand plus d'une journée s'est écoulée depuis la dernière prolongation.
  const fullLifetime = SESSION_IDLE_DAYS * DAY;
  if (session.expiresAt.getTime() - now < fullLifetime - DAY) {
    await db().session.updateMany({ where: { id: session.id }, data: { expiresAt: new Date(now + fullLifetime) } });
  }

  const { user } = session;
  return {
    sessionId: session.id,
    previewAsReader: session.previewAsReader,
    user: { id: user.id, name: user.name, email: user.email, role: isRole(user.role) ? user.role : "reader", isExpert: user.isExpert },
  };
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db().session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await db().session.deleteMany({ where: { userId } });
}

/** Active ou quitte le mode « Prévisualiser comme un lecteur » pour une session. */
export async function setPreviewAsReader(sessionId: string, enabled: boolean): Promise<void> {
  await db().session.updateMany({ where: { id: sessionId }, data: { previewAsReader: enabled } });
}

/** Ménage périodique : sessions expirées, vieilles invitations, anciennes tentatives de connexion. */
export async function cleanupAuthData(now = new Date()): Promise<void> {
  await db().session.deleteMany({ where: { expiresAt: { lte: now } } });
  await db().invitation.deleteMany({ where: { expiresAt: { lte: new Date(now.getTime() - 30 * DAY) } } });
  await db().loginAttempt.deleteMany({ where: { createdAt: { lte: new Date(now.getTime() - DAY) } } });
}
