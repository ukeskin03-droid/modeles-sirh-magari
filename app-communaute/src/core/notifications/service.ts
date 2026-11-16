/**
 * SERVICE DE NOTIFICATIONS
 *
 * Pour prévenir quelqu'un, le code n'envoie jamais un e-mail directement : il appelle
 * notify() en indiquant l'événement (« user.invited ») et ses données. La notification
 * est mise en file d'attente en base, puis envoyée par dispatchPendingNotifications().
 *
 * Avantages : un envoi qui échoue est retenté plus tard, on garde une trace de ce qui
 * est parti, et d'autres canaux que l'e-mail pourront être ajoutés sans toucher au
 * code qui appelle notify().
 *
 * La rédaction de chaque message est déclarée dans le registre (rubrique
 * « notificationEvents ») par le moteur ou par le module concerné.
 */
import { loadCommunity } from "@/core/community/service";
import { displayName, translatorFor } from "@/core/community/translator";
import { db, type JsonValue } from "@/core/db/client";
import { activeModules, notificationEventsCatalog } from "@/core/modules/registry";
import { readModuleStates } from "@/core/modules/state";
import { sendEmail } from "./email";

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MINUTES = [5, 15, 60, 240];

/** Les événements du moteur et des modules ACTIFS (un module désactivé ne notifie plus). */
async function availableEvents() {
  const activeKeys = new Set(activeModules(await readModuleStates()).map((module) => module.key));
  return notificationEventsCatalog().filter((event) => event.moduleKey === null || activeKeys.has(event.moduleKey));
}

export async function notify(input: { userId: string; event: string; payload?: Record<string, unknown>; scheduledFor?: Date }): Promise<void> {
  const events = await availableEvents();
  if (!events.some((event) => event.event === input.event)) return; // événement inconnu ou module désactivé
  await db().notification.create({
    data: {
      userId: input.userId,
      event: input.event,
      payload: (input.payload ?? {}) as JsonValue,
      scheduledFor: input.scheduledFor ?? new Date(),
    },
  });
}

/** Envoie les notifications arrivées à échéance. Renvoie le nombre de messages envoyés. */
export async function dispatchPendingNotifications(now = new Date()): Promise<number> {
  const pending = await db().notification.findMany({
    where: { status: "pending", scheduledFor: { lte: now } },
    include: { user: true },
    orderBy: { scheduledFor: "asc" },
    take: 50,
  });
  if (pending.length === 0) return 0;

  const community = await loadCommunity();
  const t = translatorFor(community);
  const events = await availableEvents();
  let sent = 0;

  for (const notification of pending) {
    const definition = events.find((event) => event.event === notification.event);
    try {
      if (!definition) throw new Error("module-disabled");
      if (!notification.user.active) throw new Error("user-inactive");
      const message = definition.render({
        payload: (notification.payload ?? {}) as Record<string, unknown>,
        t,
        communityName: displayName(community, t),
        recipientName: notification.user.name,
      });
      await sendEmail({ to: notification.user.email, ...message });
      // Une fois le message parti, on vide ses données : elles peuvent contenir un lien personnel.
      await db().notification.update({
        where: { id: notification.id },
        data: { status: "sent", sentAt: new Date(), payload: {}, lastError: null, attempts: notification.attempts + 1 },
      });
      sent++;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const attempts = notification.attempts + 1;
      const definitive = reason === "module-disabled" || reason === "user-inactive" || attempts >= MAX_ATTEMPTS;
      const delay = RETRY_DELAYS_MINUTES[Math.min(attempts - 1, RETRY_DELAYS_MINUTES.length - 1)];
      await db().notification.update({
        where: { id: notification.id },
        data: {
          attempts,
          lastError: reason.slice(0, 500),
          status: definitive ? "failed" : "pending",
          payload: definitive ? {} : undefined,
          scheduledFor: definitive ? undefined : new Date(now.getTime() + delay * 60 * 1000),
        },
      });
    }
  }
  return sent;
}
