/**
 * FONDATIONS DES LOTS — journal d'activité, notifications, tâches planifiées.
 */
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { pseudonym, purgeActivity, purgeActivityFromSettings, recordActivity } from "@/core/activity/log";
import { activityOverview } from "@/core/activity/report";
import { createInvitedUser, setUserActive } from "@/core/auth/users";
import { saveCommunity } from "@/core/community/service";
import { dataDir } from "@/core/config/installation";
import { db } from "@/core/db/client";
import { ensureRecurringJobs, runDueJobs, scheduleJob } from "@/core/jobs/runner";
import { scheduledTasksCatalog } from "@/core/modules/registry";
import { dispatchPendingNotifications, notify } from "@/core/notifications/service";
import { resetDatabase } from "./support/database";

const newUser = async (email = "membre@exemple.test", name = "Membre Exemple") =>
  (await createInvitedUser({ name, email, role: "reader" })).userId;

beforeEach(async () => {
  await resetDatabase();
  fs.rmSync(path.join(dataDir(), "emails"), { recursive: true, force: true });
});

describe("journal d'activité", () => {
  it("enregistre les événements sous pseudonyme, jamais avec l'identité", async () => {
    const userId = await newUser();
    await recordActivity({ type: "module.view", userId, meta: { module: "quiz" } });
    await recordActivity({ type: "search.query", userId, meta: { query: "mot cherché", results: 0 } });
    await recordActivity({ type: "content.view", contentType: "news.item", contentId: "42" });

    const events = await db().activityEvent.findMany({ orderBy: { id: "asc" } });
    expect(events).toHaveLength(3);
    const stored = JSON.stringify(events);
    expect(stored).not.toContain(userId);
    expect(stored).not.toContain("membre@exemple.test");
    expect(stored).not.toContain("Membre Exemple");

    expect(events[0].actor).toBe(pseudonym(userId));
    expect(events[1].meta).toEqual({ query: "mot cherché", results: 0 });
    expect(events[2].actor).toBeNull();
    expect(events[2]).toMatchObject({ contentType: "news.item", contentId: "42" });
  });

  it("donne le même pseudonyme à une personne, et des pseudonymes différents à deux personnes", async () => {
    const first = await newUser("a@exemple.test");
    const second = await newUser("b@exemple.test");
    expect(pseudonym(first)).toBe(pseudonym(first));
    expect(pseudonym(first)).not.toBe(pseudonym(second));

    await recordActivity({ type: "module.view", userId: first });
    await recordActivity({ type: "module.view", userId: first });
    await recordActivity({ type: "module.view", userId: second });
    const overview = await activityOverview(30);
    expect(overview.distinctActors).toBe(2);
    expect(overview.byType).toEqual([{ type: "module.view", count: 3 }]);
  });

  it("purge les événements plus anciens que la durée de conservation", async () => {
    const now = new Date("2026-06-15T12:00:00Z");
    const monthsAgo = (months: number) => new Date(Date.UTC(2026, 5 - months, 15, 12));
    for (const months of [1, 5, 7, 13]) {
      await db().activityEvent.create({ data: { type: "module.view", createdAt: monthsAgo(months) } });
    }
    expect(await purgeActivity(12, now)).toBe(1);
    expect(await purgeActivity(6, now)).toBe(1);
    expect(await db().activityEvent.count()).toBe(2);
  });

  it("applique la durée réglée dans les paramètres de la communauté", async () => {
    await saveCommunity({ name: "Essai", settings: { activityRetentionMonths: 1, sharePreview: "full" } });
    const old = new Date();
    old.setMonth(old.getMonth() - 2);
    await db().activityEvent.create({ data: { type: "module.view", createdAt: old } });
    await db().activityEvent.create({ data: { type: "module.view" } });
    expect(await purgeActivityFromSettings()).toBe(1);
  });
});

describe("notifications", () => {
  const sentMails = () => {
    const folder = path.join(dataDir(), "emails");
    return fs.existsSync(folder) ? fs.readdirSync(folder).map((file) => fs.readFileSync(path.join(folder, file), "utf8")) : [];
  };

  it("mettent le message en file d'attente, l'envoient, puis effacent ses données", async () => {
    await saveCommunity({ name: "Communauté d'essai" });
    const userId = await newUser();
    await notify({ userId, event: "user.invited", payload: { link: "https://exemple.test/invitation/jeton-secret", days: 7 } });
    expect(await db().notification.count({ where: { status: "pending" } })).toBe(1);

    expect(await dispatchPendingNotifications()).toBe(1);
    const mails = sentMails();
    expect(mails).toHaveLength(1);
    expect(mails[0]).toContain("À : membre@exemple.test");
    expect(mails[0]).toContain("Objet : Votre accès à Communauté d'essai");
    expect(mails[0]).toContain("https://exemple.test/invitation/jeton-secret");

    const stored = await db().notification.findFirstOrThrow();
    expect(stored.status).toBe("sent");
    expect(stored.payload).toEqual({}); // le lien personnel ne reste pas en base
    expect(await dispatchPendingNotifications()).toBe(0); // pas de second envoi
  });

  it("ignorent un événement inconnu", async () => {
    const userId = await newUser();
    await notify({ userId, event: "evenement.inconnu" });
    expect(await db().notification.count()).toBe(0);
  });

  it("n'envoient rien à un compte désactivé", async () => {
    const adminId = await newUser("admin@exemple.test");
    const userId = await newUser();
    await notify({ userId, event: "user.invited", payload: { link: "x", days: 7 } });
    await setUserActive(userId, false, adminId);
    expect(await dispatchPendingNotifications()).toBe(0);
    expect((await db().notification.findFirstOrThrow()).status).toBe("failed");
    expect(sentMails()).toHaveLength(0);
  });

  it("respectent une date d'envoi programmée", async () => {
    const userId = await newUser();
    await notify({ userId, event: "user.invited", payload: { link: "x", days: 7 }, scheduledFor: new Date(Date.now() + 60 * 60 * 1000) });
    expect(await dispatchPendingNotifications()).toBe(0);
    expect(await dispatchPendingNotifications(new Date(Date.now() + 2 * 60 * 60 * 1000))).toBe(1);
  });
});

describe("tâches planifiées", () => {
  it("les tâches récurrentes du registre sont créées une seule fois", async () => {
    await ensureRecurringJobs();
    await ensureRecurringJobs();
    const expected = scheduledTasksCatalog().filter((task) => task.everyMinutes).map((task) => task.type).sort();
    expect((await db().job.findMany()).map((job) => job.type).sort()).toEqual(expected);
    expect(expected).toContain("activity.purge");
  });

  it("une tâche arrivée à échéance s'exécute puis est reprogrammée", async () => {
    const now = new Date("2026-06-15T12:00:00Z");
    await ensureRecurringJobs(now);
    const summary = await runDueJobs(now);
    expect(summary.failed).toBe(0);
    expect(summary.succeeded).toBe(await db().job.count());

    const purge = await db().job.findFirstOrThrow({ where: { type: "activity.purge" } });
    expect(purge.status).toBe("pending");
    expect(purge.runAt.getTime()).toBe(now.getTime() + 24 * 60 * 60 * 1000);

    // Rien n'est dû juste après : rien ne s'exécute.
    expect((await runDueJobs(new Date(now.getTime() + 60 * 1000))).succeeded).toBe(0);
  });

  it("la tâche d'envoi fait partir les notifications en attente", async () => {
    const userId = await newUser();
    await notify({ userId, event: "user.invited", payload: { link: "x", days: 7 } });
    await ensureRecurringJobs();
    await runDueJobs();
    expect((await db().notification.findFirstOrThrow()).status).toBe("sent");
  });

  it("une tâche ponctuelle en échec est retentée, puis abandonnée", async () => {
    let now = new Date("2026-06-15T12:00:00Z");
    await scheduleJob({ type: "type.inconnu", runAt: now });
    for (let attempt = 1; attempt <= 5; attempt++) {
      const summary = await runDueJobs(now);
      expect(summary.failed).toBe(1);
      now = new Date(now.getTime() + 60 * 60 * 1000);
    }
    const job = await db().job.findFirstOrThrow();
    expect(job.status).toBe("failed");
    expect(job.attempts).toBe(5);
    expect(job.lastError).toContain("type.inconnu");
    expect((await runDueJobs(now)).failed).toBe(0); // on ne s'acharne pas
  });
});
