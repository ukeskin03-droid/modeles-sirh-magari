/**
 * TÂCHES PLANIFIÉES
 *
 * Les tâches à exécuter sont des lignes de la table « Job » : un type, une échéance,
 * éventuellement un intervalle de répétition. Le code à exécuter pour chaque type est
 * déclaré dans le registre (rubrique « scheduledTasks ») par le moteur ou par un module.
 *
 * runDueJobs() exécute les tâches arrivées à échéance. Elle est appelée chaque minute,
 * soit par la minuterie interne (src/core/jobs/scheduler.ts), soit de l'extérieur par
 * l'adresse /api/cron/tick. Le reste du code n'a pas à savoir qui la déclenche.
 */
import { db, type JsonValue } from "@/core/db/client";
import { activeModules, scheduledTasksCatalog } from "@/core/modules/registry";
import { readModuleStates } from "@/core/modules/state";

const MINUTE = 60 * 1000;
const MAX_ATTEMPTS = 5;
/** Une tâche « en cours » depuis plus longtemps que cela est considérée comme interrompue. */
const STUCK_AFTER_MINUTES = 15;

/** Crée, s'ils manquent, les exemplaires des tâches récurrentes déclarées dans le registre. */
export async function ensureRecurringJobs(now = new Date()): Promise<void> {
  for (const task of scheduledTasksCatalog()) {
    if (!task.everyMinutes) continue;
    await db().job.upsert({
      where: { uniqueKey: task.type },
      create: { type: task.type, uniqueKey: task.type, payload: {}, runAt: now, everyMinutes: task.everyMinutes },
      update: { everyMinutes: task.everyMinutes },
    });
  }
}

/** Programme une tâche ponctuelle. */
export async function scheduleJob(input: { type: string; runAt: Date; payload?: Record<string, unknown> }): Promise<void> {
  await db().job.create({ data: { type: input.type, runAt: input.runAt, payload: (input.payload ?? {}) as JsonValue } });
}

export type JobRunSummary = { succeeded: number; failed: number; skipped: number };

export async function runDueJobs(now = new Date()): Promise<JobRunSummary> {
  const summary: JobRunSummary = { succeeded: 0, failed: 0, skipped: 0 };

  // Une tâche restée « en cours » (arrêt brutal du serveur) est remise en attente.
  await db().job.updateMany({
    where: { status: "running", lastRunAt: { lt: new Date(now.getTime() - STUCK_AFTER_MINUTES * MINUTE) } },
    data: { status: "pending" },
  });

  const tasks = new Map(scheduledTasksCatalog().map((task) => [task.type, task]));
  const activeKeys = new Set(activeModules(await readModuleStates()).map((module) => module.key));
  const due = await db().job.findMany({ where: { status: "pending", runAt: { lte: now } }, orderBy: { runAt: "asc" }, take: 25 });

  for (const job of due) {
    // On « réserve » la tâche : si deux déclencheurs passent en même temps, un seul l'obtient.
    const claimed = await db().job.updateMany({ where: { id: job.id, status: "pending" }, data: { status: "running", lastRunAt: now } });
    if (claimed.count === 0) continue;

    const task = tasks.get(job.type);
    const nextRun = job.everyMinutes ? new Date(now.getTime() + job.everyMinutes * MINUTE) : null;

    // Tâche d'un module désactivé : on ne l'exécute pas, mais on la conserve pour le
    // jour où le module sera réactivé.
    if (task?.moduleKey && !activeKeys.has(task.moduleKey)) {
      await db().job.update({ where: { id: job.id }, data: { status: "pending", runAt: nextRun ?? new Date(now.getTime() + 60 * MINUTE) } });
      summary.skipped++;
      continue;
    }

    try {
      if (!task) throw new Error(`Type de tâche inconnu : ${job.type}`);
      await task.handler((job.payload ?? {}) as Record<string, unknown>);
      await db().job.update({
        where: { id: job.id },
        data: nextRun ? { status: "pending", runAt: nextRun, attempts: 0, lastError: null } : { status: "done", lastError: null },
      });
      summary.succeeded++;
    } catch (error) {
      const attempts = job.attempts + 1;
      const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);
      // Une tâche récurrente retente à la prochaine échéance ; une tâche ponctuelle
      // retente de plus en plus tard, puis est abandonnée.
      const data = nextRun
        ? { status: "pending", runAt: nextRun, attempts, lastError: message }
        : attempts >= MAX_ATTEMPTS
          ? { status: "failed", attempts, lastError: message }
          : { status: "pending", runAt: new Date(now.getTime() + attempts * 5 * MINUTE), attempts, lastError: message };
      await db().job.update({ where: { id: job.id }, data });
      summary.failed++;
    }
  }
  return summary;
}
