/**
 * MINUTERIE INTERNE
 *
 * Quand l'application tourne en continu (sur votre poste, sur un serveur, dans Docker),
 * elle déclenche elle-même les tâches planifiées, une fois par minute.
 * Pour confier ce déclenchement à un outil externe : INTERNAL_SCHEDULER=off (voir .env.example).
 */
import { ensureRecurringJobs, runDueJobs } from "./runner";

const globalStore = globalThis as { __communityScheduler?: NodeJS.Timeout };

export function startInternalScheduler(): void {
  if (process.env.INTERNAL_SCHEDULER === "off") return;
  if (globalStore.__communityScheduler) return; // déjà démarrée (rechargement à chaud)

  let prepared = false;
  let lastErrorMessage = "";

  const tick = async () => {
    try {
      if (!prepared) {
        await ensureRecurringJobs();
        prepared = true;
      }
      await runDueJobs();
      lastErrorMessage = "";
    } catch (error) {
      // Ex. base pas encore créée. On signale l'erreur une seule fois, sans arrêter la minuterie.
      const message = error instanceof Error ? error.message : String(error);
      if (message !== lastErrorMessage) console.error("[tâches planifiées]", message);
      lastErrorMessage = message;
    }
  };

  globalStore.__communityScheduler = setInterval(tick, 60 * 1000);
  // unref : la minuterie n'empêche pas le serveur de s'arrêter.
  globalStore.__communityScheduler.unref();
  setTimeout(tick, 5000).unref();
}
