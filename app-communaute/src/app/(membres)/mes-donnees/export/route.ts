/** /mes-donnees/export — télécharge toutes les données de la personne connectée (JSON). */
import { exportUserData } from "@/core/privacy/service";
import { requireViewer } from "@/core/request/context";

export async function GET(): Promise<Response> {
  const viewer = await requireViewer();
  return new Response(`${JSON.stringify(await exportUserData(viewer.id), null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="mes-donnees.json"', "Cache-Control": "no-store" },
  });
}
