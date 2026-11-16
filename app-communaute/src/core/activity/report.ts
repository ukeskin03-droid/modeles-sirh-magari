/**
 * Lectures simples du journal d'activité, pour l'écran « État technique ».
 * Le vrai tableau de bord de l'animateur arrivera avec le lot 1.
 */
import { db } from "@/core/db/client";

export async function activityOverview(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [byType, actors, latest] = await Promise.all([
    db().activityEvent.groupBy({ by: ["type"], where: { createdAt: { gte: since } }, _count: { _all: true }, orderBy: { type: "asc" } }),
    db().activityEvent.findMany({ where: { createdAt: { gte: since }, actor: { not: null } }, distinct: ["actor"], select: { actor: true } }),
    db().activityEvent.findMany({ orderBy: { id: "desc" }, take: 15 }),
  ]);
  return {
    byType: byType.map((row) => ({ type: row.type, count: row._count._all })),
    distinctActors: actors.length,
    latest,
  };
}
