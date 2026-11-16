/**
 * Exécuté une fois, au démarrage du serveur : lance la minuterie des tâches planifiées.
 * (Pas pendant la construction de l'application, qui ne doit toucher à aucune base.)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { startInternalScheduler } = await import("@/core/jobs/scheduler");
  startInternalScheduler();
}
