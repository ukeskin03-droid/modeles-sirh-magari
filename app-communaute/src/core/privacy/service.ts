/**
 * DONNÉES PERSONNELLES (RGPD) — ce que la page « Mes données » permet à chaque membre :
 * consulter ses données, les exporter, supprimer son compte.
 *
 * Chaque module déclare dans le registre (rubrique « personalData ») ce qu'il détient
 * sur une personne et comment l'effacer. Ainsi, chaque nouveau module complète
 * automatiquement cette page.
 */
import { verifyPassword } from "@/core/auth/password";
import { db, inTransaction } from "@/core/db/client";
import { allModules } from "@/core/modules/registry";

export class PrivacyError extends Error {
  constructor(public readonly reason: "wrong-password" | "last-admin") {
    super(reason);
  }
}

/** Toutes les données qui concernent la personne, sous une forme lisible. */
export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const user = await db().user.findUniqueOrThrow({ where: { id: userId }, include: { groups: { include: { group: true } }, notifications: true, accounts: true } });
  const modules: Record<string, unknown> = {};
  // Tous les modules installés, actifs ou non : un module désactivé conserve ses données.
  for (const mod of allModules()) {
    if (mod.personalData) modules[mod.key] = await mod.personalData.export(userId);
  }
  return {
    exportedAt: new Date().toISOString(),
    account: { name: user.name, email: user.email, role: user.role, expert: user.isExpert, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt },
    groups: user.groups.map((membership) => membership.group.name),
    externalAccounts: user.accounts.map((account) => account.provider),
    notifications: user.notifications.map((notification) => ({ event: notification.event, status: notification.status, createdAt: notification.createdAt })),
    modules,
    activityLog:
      "Le journal d'activité ne contient ni votre nom ni votre adresse : vos actions y figurent sous un pseudonyme technique, pour établir des statistiques. Après la suppression de votre compte, elles ne peuvent plus être rattachées à vous.",
  };
}

/**
 * Supprime le compte et tout ce qui s'y rattache. Le mot de passe est redemandé, et le
 * dernier administrateur ne peut pas se supprimer (la communauté n'aurait plus de gestionnaire).
 */
export async function deleteOwnAccount(userId: string, password: string): Promise<void> {
  const user = await db().user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(password, user.passwordHash))) throw new PrivacyError("wrong-password");
  if (user.role === "admin" && (await db().user.count({ where: { role: "admin", active: true, id: { not: userId } } })) === 0) throw new PrivacyError("last-admin");

  await inTransaction(async () => {
    for (const mod of allModules()) await mod.personalData?.erase(userId);
    // Sessions, invitations, comptes externes, appartenances aux groupes et notifications
    // sont supprimés avec le compte (suppression « en cascade » définie dans le schéma).
    await db().loginAttempt.deleteMany({ where: { email: user.email } });
    await db().user.delete({ where: { id: userId } });
  });
}
