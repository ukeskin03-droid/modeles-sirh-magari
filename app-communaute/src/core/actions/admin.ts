"use server";

/**
 * ACTIONS D'ADMINISTRATION — modules, statut de la communauté, utilisateurs, tâches.
 *
 * Chaque action commence par requireCan(...) : elle vérifie que la personne connectée
 * a le droit de faire ce qu'elle demande. C'est ce contrôle, côté serveur, qui garantit
 * par exemple qu'un éditeur ne peut pas modifier la configuration.
 */
import { refresh } from "next/cache";
import { after } from "next/server";
import { INVITATION_DAYS } from "@/core/auth/constants";
import { changeUserRole, createInvitation, createInvitedUser, setUserActive, setUserExpert, UserRuleError } from "@/core/auth/users";
import { saveCommunity } from "@/core/community/service";
import { db } from "@/core/db/client";
import { ensureRecurringJobs, runDueJobs } from "@/core/jobs/runner";
import { ModuleToggleError, setModuleEnabled } from "@/core/modules/state";
import { emailIsConfigured } from "@/core/notifications/email";
import { dispatchPendingNotifications, notify } from "@/core/notifications/service";
import { getBaseUrl, getT, requireCan } from "@/core/request/context";
import type { FormState } from "@/core/ui/forms";

const text = (data: FormData, name: string) => String(data.get(name) ?? "");

// ── Modules ──────────────────────────────────────────────────────────────────
export async function toggleModuleAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.community.configure");
  const t = await getT();
  try {
    await setModuleEnabled(text(data, "key"), text(data, "enabled") === "true");
  } catch (error) {
    if (error instanceof ModuleToggleError) return { error: t(`core.admin.modules.error.${error.reason}`) };
    throw error;
  }
  refresh(); // la page (menu compris) est réaffichée avec le nouvel état
  return null;
}

// ── Statut de la communauté ──────────────────────────────────────────────────
export async function setStatusAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.community.configure");
  await saveCommunity({ status: text(data, "status") === "open" ? "open" : "preparation" });
  refresh();
  return null;
}

// ── Utilisateurs ─────────────────────────────────────────────────────────────
async function userError(error: unknown): Promise<FormState> {
  if (error instanceof UserRuleError) {
    const t = await getT();
    return { error: t(`core.admin.users.error.${error.reason}`) };
  }
  throw error;
}

/** Prépare le lien d'invitation, l'envoie par e-mail et le renvoie à l'écran pour copie. */
async function invitationResult(userId: string, name: string, token: string, noticeKey: string): Promise<FormState> {
  const t = await getT();
  const url = `${await getBaseUrl()}/invitation/${token}`;
  await notify({ userId, event: "user.invited", payload: { link: url, days: INVITATION_DAYS } });
  after(() => dispatchPendingNotifications()); // l'envoi part juste après la réponse
  const mailNote = emailIsConfigured() ? t("core.admin.users.mail.sent") : t("core.admin.users.mail.file");
  return {
    notice: `${t(noticeKey, { name, days: INVITATION_DAYS })} ${mailNote}`,
    link: { label: t("core.admin.users.link.label"), url, copy: t("core.admin.users.link.copy"), copied: t("core.admin.users.link.copied") },
  };
}

export async function createUserAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.users.manage");
  try {
    const name = text(data, "name").trim();
    const { userId, token } = await createInvitedUser({ name, email: text(data, "email"), role: text(data, "role") });
    refresh();
    return invitationResult(userId, name, token, "core.admin.users.create.done");
  } catch (error) {
    return userError(error);
  }
}

export async function renewInvitationAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.users.manage");
  try {
    const userId = text(data, "userId");
    const token = await createInvitation(userId);
    const user = await db().user.findUniqueOrThrow({ where: { id: userId } });
    return invitationResult(userId, user.name, token, "core.admin.users.newLink.done");
  } catch (error) {
    return userError(error);
  }
}

export async function changeRoleAction(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireCan("core.users.manage");
  try {
    await changeUserRole(text(data, "userId"), text(data, "role"), viewer.id);
  } catch (error) {
    return userError(error);
  }
  refresh();
  return null;
}

export async function setActiveAction(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireCan("core.users.manage");
  try {
    await setUserActive(text(data, "userId"), text(data, "active") === "true", viewer.id);
  } catch (error) {
    return userError(error);
  }
  refresh();
  return null;
}

export async function setExpertAction(_state: FormState, data: FormData): Promise<FormState> {
  await requireCan("core.users.manage");
  try {
    await setUserExpert(text(data, "userId"), text(data, "expert") === "true");
  } catch (error) {
    return userError(error);
  }
  refresh();
  return null;
}

// ── Tâches planifiées ────────────────────────────────────────────────────────
export async function runJobsAction(): Promise<FormState> {
  await requireCan("core.technical.view");
  const t = await getT();
  await ensureRecurringJobs();
  // On exécute même les tâches dont l'échéance n'est pas arrivée, pour pouvoir tester.
  await db().job.updateMany({ where: { status: "pending" }, data: { runAt: new Date() } });
  const summary = await runDueJobs();
  refresh();
  return { notice: t("core.admin.technical.jobs.ran", summary) };
}
