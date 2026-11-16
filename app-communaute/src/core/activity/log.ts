/**
 * JOURNAL D'ACTIVITÉ
 *
 * Le journal enregistre ce qui se passe dans la communauté (connexions, consultations,
 * réponses aux quiz, recherches…) pour alimenter plus tard le tableau de bord de
 * l'animateur. Il s'accumule dès la mise en service.
 *
 * RGPD — le journal ne contient jamais l'identité d'une personne. À la place, il
 * contient un PSEUDONYME : un code calculé à partir de l'identifiant du compte et du
 * secret de l'application. Deux événements de la même personne portent le même code,
 * ce qui permet de compter des personnes distinctes, mais aucun écran ne peut afficher
 * « qui a fait quoi ». Quand un compte est supprimé, ses événements ne peuvent plus
 * être rattachés à personne.
 */
import crypto from "node:crypto";
import { appSecret } from "@/core/config/installation";
import { loadCommunity } from "@/core/community/service";
import { db, type JsonValue } from "@/core/db/client";

/** Calcule le pseudonyme d'un compte. */
export function pseudonym(userId: string): string {
  return crypto.createHmac("sha256", appSecret()).update(`activite:${userId}`).digest("hex").slice(0, 24);
}

export type ActivityInput = {
  /** Type d'événement, déclaré dans le registre (ex. "module.view") */
  type: string;
  /** Compte à l'origine de l'événement (transformé en pseudonyme avant enregistrement) */
  userId?: string | null;
  /** Contenu concerné, désigné par un couple (type, identifiant) */
  contentType?: string;
  contentId?: string;
  /** Détails propres à l'événement. Ne jamais y mettre de nom ni d'adresse e-mail. */
  meta?: Record<string, string | number | boolean | null>;
};

export async function recordActivity(input: ActivityInput): Promise<void> {
  await db().activityEvent.create({
    data: {
      type: input.type,
      contentType: input.contentType ?? null,
      contentId: input.contentId ?? null,
      actor: input.userId ? pseudonym(input.userId) : null,
      meta: (input.meta ?? undefined) as JsonValue | undefined,
    },
  });
}

/** Supprime les événements plus anciens que la durée de conservation. Renvoie le nombre supprimé. */
export async function purgeActivity(retentionMonths: number, now = new Date()): Promise<number> {
  const limit = new Date(now);
  limit.setMonth(limit.getMonth() - retentionMonths);
  const result = await db().activityEvent.deleteMany({ where: { createdAt: { lt: limit } } });
  return result.count;
}

/** Purge selon la durée réglée dans les paramètres de la communauté (tâche planifiée quotidienne). */
export async function purgeActivityFromSettings(): Promise<number> {
  const community = await loadCommunity();
  return purgeActivity(community.settings.activityRetentionMonths);
}
