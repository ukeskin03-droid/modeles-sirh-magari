"use server";

/**
 * ACTIONS DE CONNEXION — connexion, installation (premier compte), invitation.
 */
import { redirect } from "next/navigation";
import { recordActivity } from "@/core/activity/log";
import { safeInternalPath } from "@/core/auth/constants";
import { isPasswordAcceptable, PASSWORD_MIN_LENGTH } from "@/core/auth/password";
import { safeEqual } from "@/core/auth/tokens";
import { acceptInvitation, authenticate, countUsers, createFirstAdmin, UserRuleError } from "@/core/auth/users";
import { loadCommunity, saveCommunity } from "@/core/community/service";
import { isProduction, setupCode } from "@/core/config/installation";
import { ensureRecurringJobs } from "@/core/jobs/runner";
import { getT } from "@/core/request/context";
import { openSession } from "@/core/request/session-cookie";
import type { FormState } from "@/core/ui/forms";

const text = (data: FormData, name: string) => String(data.get(name) ?? "");

export async function loginAction(_state: FormState, data: FormData): Promise<FormState> {
  const t = await getT();
  const result = await authenticate(text(data, "email"), text(data, "password"));
  if (result.status === "locked") return { error: t("core.login.error.locked") };
  if (result.status === "invalid") return { error: t("core.login.error.invalid") };

  await openSession(result.userId);
  await recordActivity({ type: "auth.login", userId: result.userId });
  redirect(safeInternalPath(data.get("suite")));
}

export async function setupAction(_state: FormState, data: FormData): Promise<FormState> {
  const t = await getT();
  if ((await countUsers()) > 0) return { error: t("core.admin.users.error.already-installed") };

  // Le code d'installation empêche un inconnu de s'approprier une installation neuve.
  const expectedCode = setupCode();
  if (expectedCode) {
    if (!safeEqual(text(data, "code").trim(), expectedCode)) return { error: t("core.setup.error.code") };
  } else if (isProduction()) {
    return { error: t("core.setup.error.codeMissing") };
  }

  const password = text(data, "password");
  if (!isPasswordAcceptable(password)) return { error: t("core.setup.error.password", { min: PASSWORD_MIN_LENGTH }) };

  const community = await loadCommunity();
  const communityName = text(data, "communityName").trim();
  if (!community.name && !communityName) return { error: t("core.setup.error.communityName") };

  let userId: string;
  try {
    userId = await createFirstAdmin({ name: text(data, "name"), email: text(data, "email"), password });
  } catch (error) {
    if (error instanceof UserRuleError) return { error: t(`core.admin.users.error.${error.reason}`) };
    throw error;
  }

  // Communauté toute neuve : on ouvre l'assistant de configuration (étape 1).
  const fresh = !community.exists;
  if (communityName || fresh) await saveCommunity({ ...(communityName ? { name: communityName.slice(0, 80) } : {}), ...(fresh ? { setupStep: 0 } : {}) });
  await ensureRecurringJobs();
  await openSession(userId);
  await recordActivity({ type: "auth.login", userId });
  redirect(fresh ? "/admin/configuration" : "/");
}

export async function acceptInvitationAction(_state: FormState, data: FormData): Promise<FormState> {
  const t = await getT();
  const password = text(data, "password");
  if (password !== text(data, "confirmation")) return { error: t("core.invitation.error.mismatch") };
  if (!isPasswordAcceptable(password)) return { error: t("core.setup.error.password", { min: PASSWORD_MIN_LENGTH }) };

  const userId = await acceptInvitation(text(data, "token"), password);
  if (!userId) return { error: t("core.invitation.invalid.text") };

  await openSession(userId);
  await recordActivity({ type: "auth.login", userId });
  redirect("/");
}
