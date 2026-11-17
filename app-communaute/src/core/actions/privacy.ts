"use server";

/**
 * ACTIONS DE LA PAGE « MES DONNÉES » — changer son mot de passe, supprimer son compte.
 * Chacun n'agit que sur son propre compte : l'identifiant vient toujours de la session.
 */
import { redirect } from "next/navigation";
import { hashPassword, isPasswordAcceptable, PASSWORD_MIN_LENGTH, verifyPassword } from "@/core/auth/password";
import { deleteUserSessions } from "@/core/auth/sessions";
import { db } from "@/core/db/client";
import { deleteOwnAccount, PrivacyError } from "@/core/privacy/service";
import { getT, requireViewer } from "@/core/request/context";
import { closeSession, openSession } from "@/core/request/session-cookie";
import type { FormState } from "@/core/ui/forms";

const text = (data: FormData, name: string) => String(data.get(name) ?? "");

export async function changePasswordAction(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const t = await getT();
  const user = await db().user.findUniqueOrThrow({ where: { id: viewer.id } });
  if (!(await verifyPassword(text(data, "current"), user.passwordHash))) return { error: t("core.privacy.error.wrong-password") };
  const password = text(data, "password");
  if (password !== text(data, "confirmation")) return { error: t("core.invitation.error.mismatch") };
  if (!isPasswordAcceptable(password)) return { error: t("core.setup.error.password", { min: PASSWORD_MIN_LENGTH }) };

  await db().user.update({ where: { id: viewer.id }, data: { passwordHash: await hashPassword(password) } });
  // Par sécurité, toutes les sessions sont fermées, puis on en rouvre une pour cet appareil.
  await deleteUserSessions(viewer.id);
  await openSession(viewer.id);
  return { notice: t("core.privacy.password.done") };
}

export async function deleteAccountAction(_state: FormState, data: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  try {
    await deleteOwnAccount(viewer.id, text(data, "password"));
  } catch (error) {
    if (error instanceof PrivacyError) return { error: (await getT())(`core.privacy.error.${error.reason}`) };
    throw error;
  }
  await closeSession();
  redirect("/connexion");
}
