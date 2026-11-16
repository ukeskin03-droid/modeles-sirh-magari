/**
 * POST /api/cron/tick — déclenchement EXTERNE des tâches planifiées.
 *
 * À utiliser seulement si la minuterie interne est coupée (INTERNAL_SCHEDULER=off).
 * L'appel doit porter l'en-tête « Authorization: Bearer <CRON_SECRET> ».
 */
import { safeEqual } from "@/core/auth/tokens";
import { ensureRecurringJobs, runDueJobs } from "@/core/jobs/runner";

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET?.trim();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  // Sans secret configuré, cette adresse est fermée.
  if (!secret || !safeEqual(provided, secret)) return new Response(null, { status: 404 });

  await ensureRecurringJobs();
  return Response.json(await runDueJobs());
}
